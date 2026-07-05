import type { ProductFormState, ProductSpecificationFormState } from '../types';

export function createEmptyProductForm(): ProductFormState {
  return {
    title: '',
    slug: '',
    description: '',
    price: '',
    stock: '',
    imageUrl: '',
    categoryId: '',
    isVisible: true,
    featured: false,
    specifications: [{ label: '', value: '' }],
  };
}

export function createSpecificationRows(specifications?: Array<{ label: string; value: string }>) {
  const rows = (specifications ?? [])
    .map((specification) => ({
      label: specification.label ?? '',
      value: specification.value ?? '',
    }))
    .filter((specification) => specification.label || specification.value);

  return rows.length > 0 ? rows : [{ label: '', value: '' }];
}

export function normalizeSpecificationsInput(specifications: ProductSpecificationFormState[]) {
  return specifications
    .map((specification) => ({
      label: specification.label.trim(),
      value: specification.value.trim(),
    }))
    .filter((specification) => specification.label || specification.value);
}

export function getStockBadge(stock: number) {
  if (stock <= 0) {
    return {
      className: 'admin-stock-badge admin-stock-badge-empty',
      label: 'Sin stock',
    };
  }

  if (stock <= 5) {
    return {
      className: 'admin-stock-badge admin-stock-badge-low',
      label: 'Stock bajo',
    };
  }

  return {
    className: 'admin-stock-badge',
    label: 'Stock OK',
  };
}
