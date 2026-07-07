import type { Category, Product } from '../types';
import { STORE_CATEGORY_PRESETS } from '../config/categories.config';
import { normalizeCategoryValue } from './strings';

export function getCategoryPreset(category?: Pick<Category, 'name' | 'slug'> | null) {
  if (!category) {
    return null;
  }

  const normalizedName = normalizeCategoryValue(category.name);
  const normalizedSlug = normalizeCategoryValue(category.slug);

  return (
    STORE_CATEGORY_PRESETS.find((preset) => {
      const presetName = normalizeCategoryValue(preset.name);
      const presetSlug = normalizeCategoryValue(preset.slug);

      return normalizedName === presetName || normalizedSlug === presetSlug;
    }) ?? null
  );
}

export function getCategoryDisplayName(category?: Pick<Category, 'name' | 'slug'> | null) {
  return getCategoryPreset(category)?.name ?? category?.name ?? 'Coleccion destacada';
}

export function getCategoryDescription(category: Category) {
  return getCategoryPreset(category)?.description ?? category.description ?? 'Categoria disponible en la tienda.';
}

export function sortStoreCategories(categories: Category[]): Category[] {
  return [...categories].sort((left, right) => {
    const leftIndex = STORE_CATEGORY_PRESETS.findIndex((preset) => preset.slug === left.slug);
    const rightIndex = STORE_CATEGORY_PRESETS.findIndex((preset) => preset.slug === right.slug);
    const normalizedLeftName = normalizeCategoryValue(left.name);
    const normalizedRightName = normalizeCategoryValue(right.name);
    const presetLeftByName = STORE_CATEGORY_PRESETS.findIndex(
      (preset) => normalizeCategoryValue(preset.name) === normalizedLeftName,
    );
    const presetRightByName = STORE_CATEGORY_PRESETS.findIndex(
      (preset) => normalizeCategoryValue(preset.name) === normalizedRightName,
    );
    const resolvedLeftIndex = leftIndex >= 0 ? leftIndex : presetLeftByName;
    const resolvedRightIndex = rightIndex >= 0 ? rightIndex : presetRightByName;

    if (resolvedLeftIndex === -1 && resolvedRightIndex === -1) {
      return left.name.localeCompare(right.name, 'es');
    }

    if (resolvedLeftIndex === -1) {
      return 1;
    }

    if (resolvedRightIndex === -1) {
      return -1;
    }

    return resolvedLeftIndex - resolvedRightIndex;
  });
}

export function filterStoreProducts(
  products: Product[],
  categorySlug: string | null,
  searchValue: string,
): Product[] {
  const normalizedSearch = normalizeCategoryValue(searchValue);
  const normalizedCategorySlug = normalizeCategoryValue(categorySlug);

  return products
    .filter((product) => {
      if (product.isVisible === false) {
        return false;
      }

      const matchesCategory = normalizedCategorySlug
        ? normalizeCategoryValue(product.category?.slug) === normalizedCategorySlug
        : true;
      const matchesSearch = normalizedSearch
        ? [
            product.title,
            product.description,
            product.category?.name ?? '',
            ...(product.specifications ?? []).flatMap((specification) => [
              specification.label,
              specification.value,
            ]),
          ]
            .join(' ')
            .toLowerCase()
            .includes(normalizedSearch)
        : true;

      return matchesCategory && matchesSearch;
    })
    .sort((left, right) => Number(right.featured === true) - Number(left.featured === true));
}
