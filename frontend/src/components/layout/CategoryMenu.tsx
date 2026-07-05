import { Link } from 'react-router-dom';
import type { Category } from '../../types';
import { STORE_CATEGORY_PRESETS } from '../../config/categories.config';
import { getCategoryDisplayName } from '../../lib/categories';

export function CategoryMenu({
  menuCategories,
  activeCategorySlug,
}: {
  menuCategories: ReadonlyArray<
    Pick<Category, 'name' | 'slug'> | (typeof STORE_CATEGORY_PRESETS)[number]
  >;
  activeCategorySlug?: string | null;
}) {
  return (
    <nav className="category-nav category-nav-home" aria-label="Categorias principales">
      <Link
        to="/#catalogo"
        className={!activeCategorySlug ? 'category-link category-link-active' : 'category-link'}
      >
        TODAS
      </Link>
      {menuCategories.map((category) => (
        <Link
          key={category.slug}
          to={`/category/${category.slug}#catalogo`}
          className={
            activeCategorySlug === category.slug
              ? 'category-link category-link-active'
              : 'category-link'
          }
        >
          {getCategoryDisplayName(category).toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}

export function GlobalCategoryNav({ activeCategorySlug }: { activeCategorySlug?: string | null }) {
  return (
    <CategoryMenu
      menuCategories={STORE_CATEGORY_PRESETS}
      activeCategorySlug={activeCategorySlug}
    />
  );
}
