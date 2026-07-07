import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isForeignKeyConstraintError } from '../common/database-error.helpers';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { UpdateProductDto } from './dto/update-product.dto';
import { INITIAL_SEED_PRODUCTS } from './seed-products';
import { TEMPLATE_TEST_PRODUCT_PATTERNS } from '../template/template.config';
import { ProductReview } from './entities/product-review.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly productRepository: Repository<Product>,
    @InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
    @InjectRepository(ProductReview) private readonly productReviewRepository: Repository<ProductReview>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const existingProduct = await this.productRepository.findOne({
      where: { slug: createProductDto.slug },
    });
    if (existingProduct) {
      throw new ConflictException('El slug del producto ya existe');
    }

    let category: Category | null = null;
    if (createProductDto.categoryId) {
      category = await this.categoryRepository.findOne({
        where: { id: createProductDto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('La categoria indicada no existe');
      }
    }

    const product = this.productRepository.create({
      ...createProductDto,
      specifications: createProductDto.specifications ?? [],
      isVisible: createProductDto.isVisible ?? true,
      featured: createProductDto.featured ?? false,
      category: category ?? undefined,
    });
    return this.productRepository.save(product);
  }

  findAll() {
    return this.productRepository.find({
      where: { isVisible: true },
      relations: ['category'],
      order: { featured: 'DESC', createdAt: 'DESC' },
    });
  }

  findAllForAdmin() {
    return this.productRepository.find({
      relations: ['category'],
      order: { id: 'DESC' },
    });
  }

  findOne(id: number) {
    return this.productRepository.findOne({
      where: { id, isVisible: true },
      relations: ['category', 'reviews'],
    });
  }

  findReviews(productId: number) {
    return this.productReviewRepository.find({
      where: { product: { id: productId } },
      order: { createdAt: 'DESC' },
    });
  }

  getSeedProducts() {
    return INITIAL_SEED_PRODUCTS;
  }

  async cleanTestProducts() {
    const allProducts = await this.productRepository.find({
      relations: ['category'],
      order: { id: 'ASC' },
    });

    const summary = {
      hidden: [] as Array<{ id: number; title: string; slug: string; cartRefs: number; orderRefs: number }>,
      deleted: [] as Array<{ id: number; title: string; slug: string; cartRefs: number; orderRefs: number }>,
      kept: [] as Array<{ id: number; title: string; slug: string; reason: string }>,
    };

    for (const product of allProducts) {
      if (!this.isLikelyTestProduct(product)) {
        summary.kept.push({
          id: product.id,
          title: product.title,
          slug: product.slug,
          reason: 'No coincide con criterios conservadores de producto de prueba',
        });
        continue;
      }

      const cartRefs = await this.countCartReferences(product.id);
      const orderRefs = await this.countOrderReferences(product.id);

      if (product.isVisible === false) {
        summary.kept.push({
          id: product.id,
          title: product.title,
          slug: product.slug,
          reason: 'Producto demo ya estaba oculto',
        });
        continue;
      }

      if (cartRefs > 0 || orderRefs > 0) {
        product.isVisible = false;
        await this.productRepository.save(product);
        summary.hidden.push({
          id: product.id,
          title: product.title,
          slug: product.slug,
          cartRefs,
          orderRefs,
        });
        continue;
      }

      product.isVisible = false;
      await this.productRepository.save(product);
      summary.hidden.push({
        id: product.id,
        title: product.title,
        slug: product.slug,
        cartRefs,
        orderRefs,
      });
    }

    return {
      summary,
      visibleProducts: await this.findAll(),
    };
  }

  async syncSeedProducts() {
    const summary = {
      created: [] as Array<{ id: number; title: string; slug: string }>,
      updated: [] as Array<{ id: number; title: string; slug: string }>,
      skipped: [] as Array<{ slug: string; reason: string }>,
    };

    for (const seedProduct of INITIAL_SEED_PRODUCTS) {
      const category = await this.categoryRepository.findOne({
        where: { slug: seedProduct.categorySlug },
      });

      if (!category) {
        summary.skipped.push({
          slug: seedProduct.slug,
          reason: `No existe la categoria ${seedProduct.categorySlug}`,
        });
        continue;
      }

      const existingProduct = await this.productRepository.findOne({
        where: { slug: seedProduct.slug },
        relations: ['category'],
      });

      if (!existingProduct) {
        const createdProduct = await this.productRepository.save(
          this.productRepository.create({
            title: seedProduct.title,
            slug: seedProduct.slug,
            description: seedProduct.description,
            price: seedProduct.price,
            stock: seedProduct.stock,
            imageUrl: seedProduct.imageUrl || undefined,
            specifications: seedProduct.specifications,
            isVisible: true,
            featured: false,
            category,
          }),
        );

        await this.replaceSeedReviews(createdProduct, seedProduct.reviews);

        summary.created.push({
          id: createdProduct.id,
          title: createdProduct.title,
          slug: createdProduct.slug,
        });
        continue;
      }

      existingProduct.title = seedProduct.title;
      existingProduct.description = seedProduct.description;
      existingProduct.price = seedProduct.price;
      existingProduct.stock = seedProduct.stock;
      existingProduct.imageUrl = seedProduct.imageUrl || undefined;
      existingProduct.specifications = seedProduct.specifications;
      existingProduct.isVisible = true;
      existingProduct.featured = existingProduct.featured ?? false;
      existingProduct.category = category;

      const updatedProduct = await this.productRepository.save(existingProduct);
      await this.replaceSeedReviews(updatedProduct, seedProduct.reviews);
      summary.updated.push({
        id: updatedProduct.id,
        title: updatedProduct.title,
        slug: updatedProduct.slug,
      });
    }

    return {
      seedProducts: INITIAL_SEED_PRODUCTS,
      summary,
      products: await this.findAll(),
    };
  }

  async prepareInitialCatalog() {
    const cleanup = await this.cleanTestProducts();
    const seed = await this.syncSeedProducts();

    return {
      cleanup,
      seed,
      products: await this.findAll(),
    };
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!product) {
      throw new NotFoundException('El producto no existe');
    }

    if (updateProductDto.slug) {
      const existingProduct = await this.productRepository.findOne({
        where: { slug: updateProductDto.slug },
      });
      if (existingProduct && existingProduct.id !== id) {
        throw new ConflictException('El slug del producto ya existe');
      }
    }

    let category: Category | undefined = product.category;
    if (updateProductDto.categoryId) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { id: updateProductDto.categoryId },
      });
      if (!existingCategory) {
        throw new NotFoundException('La categoria indicada no existe');
      }
      category = existingCategory;
    }

    Object.assign(product, updateProductDto);
    product.category = category;

    return this.productRepository.save(product);
  }

  async remove(id: number) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('El producto no existe');
    }

    const cartRefs = await this.countCartReferences(product.id);
    const orderRefs = await this.countOrderReferences(product.id);

    if (cartRefs > 0 || orderRefs > 0) {
      product.isVisible = false;
      await this.productRepository.save(product);

      return {
        deleted: false,
        hidden: true,
        id,
        cartRefs,
        orderRefs,
        message: 'El producto tiene relaciones y fue ocultado del catalogo publico.',
      };
    }

    try {
      await this.productRepository.remove(product);
    } catch (error) {
      if (isForeignKeyConstraintError(error)) {
        product.isVisible = false;
        await this.productRepository.save(product);

        return {
          deleted: false,
          hidden: true,
          id,
          cartRefs,
          orderRefs,
          message: 'El producto tiene relaciones y fue ocultado del catalogo publico.',
        };
      }

      throw error;
    }

    return { deleted: true, hidden: false, id, cartRefs, orderRefs };
  }

  private async countCartReferences(productId: number): Promise<number> {
    const result = await this.productRepository.query(
      'SELECT COUNT(*) AS total FROM cart_items WHERE productId = ?',
      [productId],
    );
    return Number(result[0]?.total ?? 0);
  }

  private async countOrderReferences(productId: number): Promise<number> {
    const result = await this.productRepository.query(
      'SELECT COUNT(*) AS total FROM order_items WHERE productId = ?',
      [productId],
    );
    return Number(result[0]?.total ?? 0);
  }

  private isLikelyTestProduct(product: Product): boolean {
    const normalizedTitle = product.title.trim().toLowerCase();
    const normalizedSlug = product.slug.trim().toLowerCase();
    const normalizedDescription = product.description.trim().toLowerCase();
    const normalizedImageUrl = (product.imageUrl ?? '').trim().toLowerCase();

    return (
      TEMPLATE_TEST_PRODUCT_PATTERNS.imageUrlIncludes.some((p) => normalizedImageUrl.includes(p)) ||
      TEMPLATE_TEST_PRODUCT_PATTERNS.exactDescriptions.some((d) => normalizedDescription === d) ||
      TEMPLATE_TEST_PRODUCT_PATTERNS.exactSlugs.some((s) => normalizedSlug === s) ||
      TEMPLATE_TEST_PRODUCT_PATTERNS.slugContains.some((p) => normalizedSlug.includes(p)) ||
      TEMPLATE_TEST_PRODUCT_PATTERNS.exactTitles.some((t) => normalizedTitle === t)
    );
  }

  private async replaceSeedReviews(product: Product, reviews: ProductReviewSeedInput[]) {
    await this.productReviewRepository
      .createQueryBuilder()
      .delete()
      .from(ProductReview)
      .where('productId = :productId', { productId: product.id })
      .execute();

    if (reviews.length === 0) {
      return;
    }

    const nextReviews = reviews.map((review) =>
      this.productReviewRepository.create({
        authorName: review.authorName,
        rating: review.rating,
        comment: review.comment,
        product,
      }),
    );

    await this.productReviewRepository.save(nextReviews);
  }
}

type ProductReviewSeedInput = {
  authorName: string;
  rating: number;
  comment: string;
};
