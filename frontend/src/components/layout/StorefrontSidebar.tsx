import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { Category } from '../../types';
import { STORE_CATEGORY_PRESETS } from '../../config/categories.config';
import { getCategoryDisplayName, getCategoryDescription } from '../../lib/categories';
import { SITE } from '../../config/site.config';

export function StorefrontSidebar({
  menuCategories,
  activeCategory,
}: {
  menuCategories: ReadonlyArray<
    Pick<Category, 'name' | 'slug' | 'description'> | (typeof STORE_CATEGORY_PRESETS)[number]
  >;
  activeCategory?: Pick<Category, 'name' | 'slug' | 'description'> | null;
}) {
  const auth = useAuth();
  const featuredLabel = activeCategory ? getCategoryDisplayName(activeCategory) : SITE.name;
  const featuredDescription =
    ('id' in (activeCategory ?? {}) && activeCategory
      ? getCategoryDescription(activeCategory as Category)
      : activeCategory?.description) ??
    'Explora productos seleccionados y novedades del catalogo.';

  return (
    <aside className="sidebar-column">
      {!auth.user && (
        <section className="sidebar-box login-box">
          <header className="sidebar-heading">Acceso clientes</header>
          <label className="sidebar-label" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            className="sidebar-input"
            type="email"
            placeholder="usuario@correo.com"
          />
          <label className="sidebar-label" htmlFor="login-password">
            Clave
          </label>
          <input
            id="login-password"
            className="sidebar-input"
            type="password"
            placeholder="********"
          />
          <Link to="/login" className="sidebar-button sidebar-button-link">
            Entrar a mi cuenta
          </Link>
          <p className="sidebar-help">Ingresa para revisar carrito, compras y pedidos.</p>
        </section>
      )}

      <section className="sidebar-box promo-box">
        <header className="sidebar-heading">Categorias visibles</header>
        <ul className="promo-list">
          {menuCategories.slice(0, 7).map((category) => (
            <li key={category.slug} id={`category-${category.slug}`}>
              <Link to={`/category/${category.slug}`}>
                <strong>{getCategoryDisplayName(category)}</strong>
                <span>{'id' in category ? getCategoryDescription(category as Category) : category.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="sidebar-box banner-box">
        <span className="promo-ribbon">Categoria destacada</span>
        <strong>{featuredLabel}</strong>
        <p>{featuredDescription}</p>
      </section>

      <section className="sidebar-box banner-box banner-box-secondary">
        <span className="promo-ribbon">Compra segura</span>
        <strong>Catalogo siempre actualizado</strong>
        <p>
          Tu menu, productos, carrito y ordenes quedan listos para trabajar con contenido real.
        </p>
      </section>
    </aside>
  );
}
