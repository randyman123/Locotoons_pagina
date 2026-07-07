import { useEffect, useState } from 'react';
import type { Category, Product } from '../types';
import { BUSINESS } from '../config/business.config';
import { STORE_CATEGORY_PRESETS } from '../config/categories.config';
import { api } from '../lib/api';
import { normalizeProduct } from '../lib/normalize';
import { sortStoreCategories } from '../lib/categories';

const STOREFRONT_REFRESH_EVENT = BUSINESS.events.storefrontRefresh;

export function useStorefrontData() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStorefront() {
      try {
        setLoading(true);
        setError(null);

        const [categoriesResponse, productsResponse] = await Promise.all([
          api.get<Category[]>('/categories'),
          api.get<Product[]>('/products'),
        ]);

        if (cancelled) {
          return;
        }

        setCategories(categoriesResponse.data);
        setProducts(productsResponse.data.map(normalizeProduct));
      } catch {
        if (!cancelled) {
          setError('No pudimos cargar el catalogo en este momento. Intenta nuevamente en unos segundos.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadStorefront();

    function handleStorefrontRefresh() {
      void loadStorefront();
    }

    window.addEventListener(STOREFRONT_REFRESH_EVENT, handleStorefrontRefresh);

    return () => {
      cancelled = true;
      window.removeEventListener(STOREFRONT_REFRESH_EVENT, handleStorefrontRefresh);
    };
  }, []);

  const orderedCategories = sortStoreCategories(categories);
  const menuCategories = orderedCategories.length > 0 ? orderedCategories : STORE_CATEGORY_PRESETS;

  return {
    categories,
    products,
    loading,
    error,
    orderedCategories,
    menuCategories,
  };
}
