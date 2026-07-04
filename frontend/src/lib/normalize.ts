import type { Product, CartProduct, Cart } from '../types';

export function normalizeProduct(product: Product): Product {
  return {
    ...product,
    description: product.description ?? '',
    imageUrl: product.imageUrl ?? undefined,
    specifications: Array.isArray(product.specifications) ? product.specifications : [],
    isVisible: product.isVisible ?? true,
    featured: product.featured ?? false,
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
        }
      : null,
  };
}

export function normalizeCartProduct(product: CartProduct): CartProduct {
  return {
    ...product,
    imageUrl: product.imageUrl ?? undefined,
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
        }
      : null,
  };
}

export function normalizeCart(cart: Cart | null): Cart | null {
  if (!cart) {
    return null;
  }

  return {
    ...cart,
    items: (cart.items ?? []).map((item) => ({
      ...item,
      product: normalizeCartProduct(item.product),
    })),
  };
}
