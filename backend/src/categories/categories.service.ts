import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Product } from '../products/entities/product.entity';
import { OFFICIAL_CATEGORIES, OfficialCategory } from './official-categories';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Product) private readonly productRepository: Repository<Product>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const existingSlug = await this.categoryRepository.exists({
      where: { slug: createCategoryDto.slug },
    });
    if (existingSlug) {
      throw new ConflictException('Ya existe una categoria con ese slug');
    }

    const existingName = await this.categoryRepository.exists({
      where: { name: createCategoryDto.name },
    });
    if (existingName) {
      throw new ConflictException('La categoria ya existe');
    }

    try {
      const insertResult = await this.categoryRepository.insert({
        name: createCategoryDto.name,
        slug: createCategoryDto.slug,
        description: createCategoryDto.description,
      });

      const createdCategoryId = Number(insertResult.identifiers[0]?.id);
      if (!createdCategoryId) {
        throw new InternalServerErrorException('No se pudo crear la categoria');
      }

      const createdCategory = await this.categoryRepository.findOne({
        where: { id: createdCategoryId },
      });
      if (!createdCategory) {
        throw new InternalServerErrorException('No se pudo recuperar la categoria creada');
      }

      return createdCategory;
    } catch (error) {
      if (this.isDuplicateCategoryError(error)) {
        throw new ConflictException('La categoria ya existe');
      }

      throw error;
    }
  }

  findAll() {
    return this.categoryRepository.find();
  }

  getOfficialCategories() {
    return OFFICIAL_CATEGORIES;
  }

  async syncOfficialCategories() {
    const existingCategories = await this.categoryRepository.find({
      relations: ['products'],
      order: { id: 'ASC' },
    });

    const processedIds = new Set<number>();
    const summary = {
      created: [] as Array<{ id: number; name: string; slug: string }>,
      updated: [] as Array<{ id: number; before: { name: string; slug: string; description?: string }; after: { name: string; slug: string; description?: string } }>,
      deleted: [] as Array<{ id: number; name: string; slug: string }>,
      reassignedProducts: [] as Array<{ fromCategoryId: number; toCategoryId: number; count: number }>,
      skipped: [] as Array<{ id: number; name: string; slug: string; reason: string }>,
    };

    for (const officialCategory of OFFICIAL_CATEGORIES) {
      const matchingCategories = existingCategories.filter((category) => {
        if (processedIds.has(category.id)) {
          return false;
        }

        return (
          this.normalizeCategoryValue(category.slug) === this.normalizeCategoryValue(officialCategory.slug) ||
          this.normalizeCategoryValue(category.name) === this.normalizeCategoryValue(officialCategory.name)
        );
      });

      const keeper = this.selectCategoryKeeper(matchingCategories, officialCategory);

      if (!keeper) {
        const createdCategory = await this.categoryRepository.save(
          this.categoryRepository.create(officialCategory),
        );

        summary.created.push({
          id: createdCategory.id,
          name: createdCategory.name,
          slug: createdCategory.slug,
        });
        continue;
      }

      processedIds.add(keeper.id);

      const before = {
        name: keeper.name,
        slug: keeper.slug,
        description: keeper.description,
      };

      const nextValues = {
        name: officialCategory.name,
        slug: officialCategory.slug,
        description: officialCategory.description,
      };

      if (
        before.name !== nextValues.name ||
        before.slug !== nextValues.slug ||
        before.description !== nextValues.description
      ) {
        keeper.name = nextValues.name;
        keeper.slug = nextValues.slug;
        keeper.description = nextValues.description;
        await this.categoryRepository.save(keeper);

        summary.updated.push({
          id: keeper.id,
          before,
          after: nextValues,
        });
      }

      const duplicates = matchingCategories.filter((category) => category.id !== keeper.id);
      for (const duplicate of duplicates) {
        const relatedProductsCount = duplicate.products?.length ?? 0;

        if (relatedProductsCount > 0) {
          await this.productRepository.query(
            'UPDATE products SET categoryId = ? WHERE categoryId = ?',
            [keeper.id, duplicate.id],
          );

          summary.reassignedProducts.push({
            fromCategoryId: duplicate.id,
            toCategoryId: keeper.id,
            count: relatedProductsCount,
          });
        }

        await this.categoryRepository.delete(duplicate.id);
        processedIds.add(duplicate.id);
        summary.deleted.push({
          id: duplicate.id,
          name: duplicate.name,
          slug: duplicate.slug,
        });
      }
    }

    const obsoleteCategories = existingCategories.filter((category) => !processedIds.has(category.id));
    for (const category of obsoleteCategories) {
      const relatedProductsCount = category.products?.length ?? 0;

      if (relatedProductsCount > 0) {
        summary.skipped.push({
          id: category.id,
          name: category.name,
          slug: category.slug,
          reason: `Tiene ${relatedProductsCount} producto(s) asociado(s) y requiere reasignacion manual`,
        });
        continue;
      }

      await this.categoryRepository.delete(category.id);
      summary.deleted.push({
        id: category.id,
        name: category.name,
        slug: category.slug,
      });
    }

    const categories = await this.categoryRepository.find({
      order: { id: 'ASC' },
    });

    return {
      officialCategories: OFFICIAL_CATEGORIES,
      categories,
      summary,
    };
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('La categoria no existe');
    }

    if (updateCategoryDto.slug) {
      const existingSlug = await this.categoryRepository.findOne({
        where: { slug: updateCategoryDto.slug },
      });
      if (existingSlug && existingSlug.id !== id) {
        throw new ConflictException('Ya existe una categoria con ese slug');
      }
    }

    if (updateCategoryDto.name) {
      const existingName = await this.categoryRepository.findOne({
        where: { name: updateCategoryDto.name },
      });
      if (existingName && existingName.id !== id) {
        throw new ConflictException('La categoria ya existe');
      }
    }

    Object.assign(category, updateCategoryDto);

    try {
      await this.categoryRepository.update(id, {
        name: category.name,
        slug: category.slug,
        description: category.description,
      });
    } catch (error) {
      if (this.isDuplicateCategoryError(error)) {
        throw new ConflictException('La categoria ya existe');
      }

      throw error;
    }

    const updatedCategory = await this.categoryRepository.findOne({ where: { id } });
    if (!updatedCategory) {
      throw new InternalServerErrorException('No se pudo recuperar la categoria actualizada');
    }

    return updatedCategory;
  }

  async remove(id: number) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('La categoria no existe');
    }

    try {
      await this.categoryRepository.remove(category);
    } catch (error) {
      if (this.isForeignKeyConstraintError(error)) {
        throw new ConflictException('No se puede eliminar la categoria porque tiene productos asociados');
      }

      throw error;
    }

    return { deleted: true, id };
  }

  private isDuplicateCategoryError(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = error.driverError as { code?: string; errno?: number } | undefined;
    return driverError?.code === 'ER_DUP_ENTRY' || driverError?.errno === 1062;
  }

  private isForeignKeyConstraintError(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = error.driverError as { code?: string; errno?: number } | undefined;
    return driverError?.code === 'ER_ROW_IS_REFERENCED_2' || driverError?.errno === 1451;
  }

  private normalizeCategoryValue(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private selectCategoryKeeper(
    categories: Category[],
    officialCategory: OfficialCategory,
  ): Category | null {
    if (categories.length === 0) {
      return null;
    }

    const sortedCategories = [...categories].sort((left, right) => {
      const leftScore = this.getCategoryMatchScore(left, officialCategory);
      const rightScore = this.getCategoryMatchScore(right, officialCategory);

      if (leftScore !== rightScore) {
        return rightScore - leftScore;
      }

      const leftProducts = left.products?.length ?? 0;
      const rightProducts = right.products?.length ?? 0;
      if (leftProducts !== rightProducts) {
        return rightProducts - leftProducts;
      }

      return left.id - right.id;
    });

    return sortedCategories[0] ?? null;
  }

  private getCategoryMatchScore(category: Category, officialCategory: OfficialCategory): number {
    const normalizedSlug = this.normalizeCategoryValue(category.slug);
    const normalizedName = this.normalizeCategoryValue(category.name);
    const officialSlug = this.normalizeCategoryValue(officialCategory.slug);
    const officialName = this.normalizeCategoryValue(officialCategory.name);

    if (normalizedSlug === officialSlug && normalizedName === officialName) {
      return 4;
    }

    if (normalizedSlug === officialSlug) {
      return 3;
    }

    if (normalizedName === officialName) {
      return 2;
    }

    return 1;
  }
}
