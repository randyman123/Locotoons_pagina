import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class CartsService {
  constructor(
    @InjectRepository(Cart) private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem) private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product) private readonly productRepository: Repository<Product>,
  ) {}

  async findCart(userId: number) {
    return this.cartRepository.findOne({ where: { userId }, relations: ['items', 'items.product'] });
  }

  async addItem(userId: number, addCartItemDto: AddCartItemDto) {
    let cart = await this.findCart(userId);
    if (!cart) {
      cart = this.cartRepository.create({ userId });
      cart = await this.cartRepository.save(cart);
    }

    const existingItem = cart.items?.find((item) => item.product.id === addCartItemDto.productId);
    if (existingItem) {
      existingItem.quantity += addCartItemDto.quantity;
      return this.cartItemRepository.save(existingItem);
    }

    const product = await this.productRepository.findOne({
      where: { id: addCartItemDto.productId, isVisible: true },
    });
    if (!product) {
      throw new NotFoundException('El producto indicado no existe');
    }

    const item = this.cartItemRepository.create({
      cart,
      product,
      quantity: addCartItemDto.quantity,
    });
    return this.cartItemRepository.save(item);
  }

  async updateItemQuantity(userId: number, itemId: number, quantity: number) {
    const cart = await this.findCart(userId);
    if (!cart) {
      throw new NotFoundException('El carrito no existe');
    }

    const item = cart.items?.find((cartItem) => cartItem.id === itemId);
    if (!item) {
      throw new NotFoundException('El item del carrito no existe');
    }

    item.quantity = quantity;
    return this.cartItemRepository.save(item);
  }

  async removeItem(userId: number, itemId: number) {
    const cart = await this.findCart(userId);
    if (!cart) {
      throw new NotFoundException('El carrito no existe');
    }

    const item = cart.items?.find((cartItem) => cartItem.id === itemId);
    if (!item) {
      throw new NotFoundException('El item del carrito no existe');
    }

    await this.cartItemRepository.remove(item);
    return { deleted: true, id: itemId };
  }

  assertUserAccess(userId: number, currentUser: { userId: number; role?: string }) {
    const canAccess = currentUser.role === 'admin' || currentUser.userId === userId;
    if (!canAccess) {
      throw new ForbiddenException('No puedes acceder al carrito de otro usuario');
    }
  }
}
