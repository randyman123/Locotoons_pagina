import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Order) private readonly orderRepository: Repository<Order>,
  ) {}

  async create(userId: number | null, createOrderDto: CreateOrderDto) {
    if (createOrderDto.items.length === 0) {
      throw new BadRequestException('La orden debe incluir al menos un item');
    }

    const customerName = createOrderDto.customerName?.trim();
    const customerEmail = createOrderDto.customerEmail?.trim();
    const customerPhone = createOrderDto.customerPhone?.trim();

    if (!userId) {
      if (!customerName || !customerEmail || !customerPhone) {
        throw new BadRequestException(
          'Para comprar como invitado debes indicar nombre, email y telefono',
        );
      }
    }

    const requestedQuantities = createOrderDto.items.reduce((accumulator, item) => {
      accumulator.set(item.productId, (accumulator.get(item.productId) ?? 0) + item.quantity);
      return accumulator;
    }, new Map<number, number>());
    const productIds = [...requestedQuantities.keys()];

    return this.dataSource.transaction(async (manager) => {
      const products = await manager
        .getRepository(Product)
        .createQueryBuilder('product')
        .where('product.id IN (:...productIds)', { productIds })
        .andWhere('product.isVisible = :isVisible', { isVisible: true })
        .setLock('pessimistic_write')
        .getMany();
      const productsById = new Map(products.map((product) => [product.id, product]));

      const missingProductIds = productIds.filter((productId) => !productsById.has(productId));
      if (missingProductIds.length > 0) {
        throw new NotFoundException(
          `No existen productos disponibles con id: ${missingProductIds.join(', ')}`,
        );
      }

      for (const [productId, requestedQuantity] of requestedQuantities.entries()) {
        const product = productsById.get(productId);
        if (!product) {
          throw new NotFoundException(`No existe el producto con id ${productId}`);
        }

        if (product.stock <= 0) {
          throw new BadRequestException(`El producto "${product.title}" no tiene stock disponible`);
        }

        if (requestedQuantity > product.stock) {
          throw new BadRequestException(
            `Stock insuficiente para "${product.title}". Disponible: ${product.stock}, solicitado: ${requestedQuantity}`,
          );
        }
      }

      const validItems = createOrderDto.items.map((item) => {
        const product = productsById.get(item.productId);
        if (!product) {
          throw new NotFoundException(`No existe el producto con id ${item.productId}`);
        }

        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: Number(product.price),
        };
      });

      if (validItems.length === 0) {
        throw new BadRequestException('La orden no contiene items validos');
      }

      const total = validItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

      for (const [productId, requestedQuantity] of requestedQuantities.entries()) {
        const product = productsById.get(productId);
        if (!product) {
          continue;
        }

        product.stock -= requestedQuantity;
        await manager.save(Product, product);
      }

      const order = manager.create(Order, {
        userId: userId ?? null,
        customerName: customerName ?? null,
        customerEmail: customerEmail ?? null,
        customerPhone: customerPhone ?? null,
        status: 'pending',
        shippingAddress: createOrderDto.shippingAddress,
        total,
      });

      const savedOrder = await manager.save(Order, order);
      const orderItems = validItems.map((item) =>
        manager.create(OrderItem, {
          order: savedOrder,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }),
      );

      await manager.save(OrderItem, orderItems);

      const createdOrder = await manager.findOne(Order, {
        where: { id: savedOrder.id },
        relations: ['items'],
      });

      if (!createdOrder) {
        throw new BadRequestException('No se pudo crear la orden');
      }

      return createdOrder;
    });
  }

  findAllForUser(currentUser: { userId: number; role?: string }) {
    if (currentUser.role === 'admin') {
      return this.orderRepository.find({
        relations: ['items'],
        order: { createdAt: 'DESC' },
      });
    }

    return this.orderRepository.find({
      where: { userId: currentUser.userId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOneForUser(id: number, currentUser: { userId: number; role?: string }) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException('La orden no existe');
    }

    const canAccess = currentUser.role === 'admin' || order.userId === currentUser.userId;
    if (!canAccess) {
      throw new ForbiddenException('No puedes consultar ordenes de otro usuario');
    }

    return order;
  }

  async updateStatus(id: number, status: Order['status']) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException('La orden no existe');
    }

    order.status = status;
    return this.orderRepository.save(order);
  }
}
