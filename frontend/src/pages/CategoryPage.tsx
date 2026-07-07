import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useStorefrontData } from '../hooks/useStorefrontData';
import { formatPrice } from '../lib/price';
import { filterStoreProducts, getCategoryDisplayName } from '../lib/categories';
import { STORE_CATEGORY_PRESETS } from '../config/categories.config';
import { SITE } from '../config/site.config';
import { EmptyState } from '../components/ui/EmptyState';
import { ProductCatalogSection } from '../components/product/ProductCatalogSection';
import { StorefrontSidebar } from '../components/layout/StorefrontSidebar';
import { SiteHeader } from '../components/layout/SiteHeader';
import { GlobalCategoryNav } from '../components/layout/CategoryMenu';
import { SiteFooter } from '../components/layout/SiteFooter';

export function CategoryPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { products, loading, error, orderedCategories, menuCategories } = useStorefrontData();
  const activeSearch = searchParams.get('q')?.trim().toLowerCase() ?? '';
  const activeCategory =
    orderedCategories.find((category) => category.slug === slug) ??
    STORE_CATEGORY_PRESETS.find((category) => category.slug === slug) ??
    null;
  const categoryProducts = filterStoreProducts(products, slug ?? null, activeSearch);
  const featuredProducts = categoryProducts.slice(0, 3);
  const leadProduct = featuredProducts[0] ?? null;

  return (
    <div className="store-shell">
      <div className="top-strip" />
      <SiteHeader />
      <GlobalCategoryNav activeCategorySlug={slug} />

      <main className="page-main">
        {!loading && !activeCategory ? (
          <EmptyState
            tag="Categoria"
            title="No encontramos esta categoria"
            description="Vuelve al catalogo principal o elige otra categoria del menu."
            action={
              <Link to="/" className="product-detail-secondary-link">
                Volver a la tienda
              </Link>
            }
          />
        ) : (
          <>
            <>
              <nav className="category-breadcrumb" aria-label="Breadcrumb">
                <Link to="/">Inicio</Link>
                <span>/</span>
                <span>
                  {activeCategory ? getCategoryDisplayName(activeCategory) : 'Categoria'}
                </span>
              </nav>

              <header className="category-page-header">
                <div className="category-page-copy">
                  <span className="hero-tag">Coleccion</span>
                  <h1>
                    {activeCategory
                      ? getCategoryDisplayName(activeCategory)
                      : 'Categoria de productos'}
                  </h1>
                  <p>
                    {activeCategory?.description ??
                      'Explora productos destacados, novedades y articulos recomendados de esta categoria.'}
                  </p>
                </div>
                <div className="category-page-meta">
                  <div>
                    <strong>{categoryProducts.length}</strong>
                    <span>Producto(s)</span>
                  </div>
                  <div>
                    <strong>{featuredProducts.length}</strong>
                    <span>Destacados</span>
                  </div>
                  <div>
                    <strong>{leadProduct ? formatPrice(leadProduct.price) : 'Demo'}</strong>
                    <span>{leadProduct ? 'Precio referencial' : 'Catalogo activo'}</span>
                  </div>
                </div>
              </header>
            </>

            <section className="hero-layout">
              <div className="hero-column">
              <article className="hero-card">
                <div className="hero-copy">
                  <div className="hero-copy-top">
                    <span className="hero-tag">Categoria</span>
                    <span className="hero-copy-counter">
                      {categoryProducts.length} producto(s)
                    </span>
                  </div>
                  <div className="hero-copy-body">
                    <div className="hero-copy-text">
                      <span className="hero-copy-kicker">
                        {activeCategory ? getCategoryDisplayName(activeCategory) : 'Categoria'}
                      </span>
                      <h1>
                        {activeCategory
                          ? `${getCategoryDisplayName(activeCategory)} en ${SITE.name}`
                          : `Categoria en ${SITE.name}`}
                      </h1>
                      <p>
                        {activeCategory?.description ??
                          'Explora productos seleccionados de esta categoria dentro del catalogo.'}
                      </p>
                      <div className="hero-actions">
                        <a href="#catalogo" className="hero-primary-link">
                          Ver productos
                        </a>
                        <span className="hero-secondary-note">
                          {leadProduct
                            ? `Destacado: ${leadProduct.title}`
                            : 'Pronto habra mas novedades en esta categoria'}
                        </span>
                      </div>
                    </div>

                    <div className="hero-carousel-card">
                      <div className="hero-carousel-media">
                        {leadProduct?.imageUrl ? (
                          <img src={leadProduct.imageUrl} alt={leadProduct.title} />
                        ) : (
                          <div className="hero-carousel-placeholder">
                            <span>
                              {activeCategory ? getCategoryDisplayName(activeCategory) : SITE.name}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="hero-carousel-info">
                        <strong>
                          {leadProduct?.title ??
                            `Coleccion de ${activeCategory ? getCategoryDisplayName(activeCategory) : SITE.name}`}
                        </strong>
                        <p>
                          {leadProduct?.description ??
                            'Aqui veras destacados, novedades y productos recomendados de esta categoria.'}
                        </p>
                        <div className="hero-carousel-meta">
                          <span>
                            {activeCategory ? getCategoryDisplayName(activeCategory) : 'Categoria'}
                          </span>
                          <strong>
                            {leadProduct ? formatPrice(leadProduct.price) : 'Disponibles'}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hero-showcase">
                  <div className="hero-showcase-header">
                    <strong>Lo mas visto en esta categoria</strong>
                    <span>Seleccion rapida</span>
                  </div>
                  {featuredProducts.length > 0 ? (
                    featuredProducts.map((product, index) => (
                      <Link
                        key={product.id}
                        to={`/products/${product.id}`}
                        className={`hero-product hero-product-${index + 1}`}
                      >
                        <span className="hero-product-category">
                          {getCategoryDisplayName(product.category)}
                        </span>
                        <h2>{product.title}</h2>
                        <p>{product.description}</p>
                        <strong>{formatPrice(product.price)}</strong>
                      </Link>
                    ))
                  ) : (
                    <div className="hero-empty">
                      <strong>Categoria en actualizacion</strong>
                      <p>Cuando haya mas productos cargados, apareceran aqui automaticamente.</p>
                    </div>
                  )}
                </div>
              </article>

              <ProductCatalogSection
                title={
                  activeCategory
                    ? `Catalogo de ${getCategoryDisplayName(activeCategory)}`
                    : 'Catalogo de categoria'
                }
                subtitle={
                  activeSearch
                    ? `${categoryProducts.length} resultado(s) para "${searchParams.get('q')}"`
                    : `${categoryProducts.length} producto(s) disponibles`
                }
                products={categoryProducts}
                loading={loading}
                error={error}
                emptyTitle={
                  activeSearch
                    ? 'No encontramos productos para tu busqueda en esta categoria'
                    : `Aun no hay productos en ${activeCategory ? getCategoryDisplayName(activeCategory) : 'esta categoria'}`
                }
                emptyDescription={
                  activeSearch
                    ? 'Prueba con otro termino o vuelve al catalogo principal para seguir explorando.'
                    : 'Cuando cargues mas productos para esta categoria, apareceran aqui automaticamente.'
                }
                emptyAction={
                  <Link to="/" className="product-detail-secondary-link">
                    Volver a la tienda
                  </Link>
                }
              />
              </div>

              <StorefrontSidebar menuCategories={menuCategories} activeCategory={activeCategory} />
            </section>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
