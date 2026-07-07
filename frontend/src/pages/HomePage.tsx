import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStorefrontData } from '../hooks/useStorefrontData';
import { formatPrice } from '../lib/price';
import { normalizeCategoryValue } from '../lib/strings';
import { filterStoreProducts, getCategoryDisplayName } from '../lib/categories';
import { STORE_CATEGORY_PRESETS } from '../config/categories.config';
import { ProductCatalogSection } from '../components/product/ProductCatalogSection';
import { StorefrontSidebar } from '../components/layout/StorefrontSidebar';
import { SiteHeader } from '../components/layout/SiteHeader';
import { GlobalCategoryNav } from '../components/layout/CategoryMenu';
import { SiteFooter } from '../components/layout/SiteFooter';

export function HomePage() {
  const [searchParams] = useSearchParams();
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const { products, loading, error, orderedCategories, menuCategories } =
    useStorefrontData();

  const activeCategorySlug = searchParams.get('category');
  const activeSearch = searchParams.get('q')?.trim().toLowerCase() ?? '';
  const activeCategory = orderedCategories.find((category) => category.slug === activeCategorySlug);
  const filteredProducts = filterStoreProducts(products, activeCategorySlug, activeSearch);
  const heroProducts = filteredProducts.slice(0, 3);
  const heroSlides = STORE_CATEGORY_PRESETS.slice(0, 6).map((preset) => {
    const matchedProduct = [...products]
      .sort((left, right) => Number(right.featured === true) - Number(left.featured === true))
      .find((product) => {
        const category = product.category;
        return (
          normalizeCategoryValue(category?.slug) === normalizeCategoryValue(preset.slug) ||
          normalizeCategoryValue(category?.name) === normalizeCategoryValue(preset.name)
        );
      });

    return {
      ...preset,
      product: matchedProduct ?? null,
    };
  });
  const currentHeroSlide = heroSlides[activeHeroSlide % Math.max(heroSlides.length, 1)];

  useEffect(() => {
    setActiveHeroSlide(0);
  }, [activeCategorySlug, activeSearch]);

  useEffect(() => {
    if (heroSlides.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveHeroSlide((current) => (current + 1) % heroSlides.length);
    }, 4000);

    return () => {
      window.clearInterval(timer);
    };
  }, [heroSlides.length]);

  return (
    <div className="store-shell">
      <div className="top-strip" />
      <SiteHeader />
      <GlobalCategoryNav activeCategorySlug={activeCategorySlug} />

      <main className="page-main">
        <section className="hero-layout">
          <div className="hero-column">
            <article className="hero-card">
              {currentHeroSlide && (
                <div className="hero-copy">
                  <div className="hero-copy-top">
                    <span className="hero-tag">Ultimas novedades</span>
                    <span className="hero-copy-counter">
                      {String((activeHeroSlide % heroSlides.length) + 1).padStart(2, '0')} / {String(heroSlides.length).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="hero-copy-body">
                    <div className="hero-copy-text">
                      <span className="hero-copy-kicker">{currentHeroSlide.name}</span>
                      <h1>Novedades y destacados para fans de {currentHeroSlide.name}</h1>
                      <p>{currentHeroSlide.description}</p>
                      <div className="hero-actions">
                        <Link
                          to={`/category/${currentHeroSlide.slug}#catalogo`}
                          className="hero-primary-link"
                        >
                          Ver novedades
                        </Link>
                        <span className="hero-secondary-note">
                          {currentHeroSlide.product
                            ? currentHeroSlide.product.title
                            : `Proximamente nuevos ingresos de ${currentHeroSlide.name}`}
                        </span>
                      </div>
                    </div>

                    <div className="hero-carousel-card">
                      <div className="hero-carousel-media">
                        {currentHeroSlide.product?.imageUrl ? (
                          <img
                            src={currentHeroSlide.product.imageUrl}
                            alt={currentHeroSlide.product.title}
                          />
                        ) : (
                          <div className="hero-carousel-placeholder">
                            <span>{currentHeroSlide.name}</span>
                          </div>
                        )}
                      </div>
                      <div className="hero-carousel-info">
                        <strong>
                          {currentHeroSlide.product?.title ?? `${currentHeroSlide.name} en destaque`}
                        </strong>
                        <p>
                          {currentHeroSlide.product?.description ??
                            `Espacio listo para mostrar tus ultimos ingresos y productos mas llamativos de ${currentHeroSlide.name}.`}
                        </p>
                        <div className="hero-carousel-meta">
                          <span>{currentHeroSlide.name}</span>
                          <strong>
                            {currentHeroSlide.product
                              ? formatPrice(currentHeroSlide.product.price)
                              : 'Nuevos ingresos'}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="hero-carousel-dots" aria-label="Navegacion del carrusel">
                    {heroSlides.map((slide, index) => (
                      <button
                        key={slide.slug}
                        type="button"
                        className={
                          index === activeHeroSlide
                            ? 'hero-carousel-dot hero-carousel-dot-active'
                            : 'hero-carousel-dot'
                        }
                        onClick={() => setActiveHeroSlide(index)}
                        aria-label={`Ver novedades de ${slide.name}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="hero-showcase">
                <div className="hero-showcase-header">
                  <strong>Novedades de la semana</strong>
                  <span>Seleccion rapida</span>
                </div>
                {heroProducts.length > 0 ? (
                  heroProducts.map((product, index) => (
                    <Link
                      key={product.id}
                      to={`/products/${product.id}`}
                      className={`hero-product hero-product-${index + 1}`}
                    >
                      <span className="hero-product-category">
                        {getCategoryDisplayName(product.category) ?? 'Seleccion destacada'}
                      </span>
                      <h2>{product.title}</h2>
                      <p>{product.description}</p>
                      <strong>{formatPrice(product.price)}</strong>
                    </Link>
                  ))
                ) : (
                  <div className="hero-empty">
                    <strong>Vitrina en actualizacion</strong>
                    <p>Cuando agregues tus primeros productos e imagenes, esta vitrina se llenara automaticamente.</p>
                  </div>
                )}
              </div>
            </article>

            <ProductCatalogSection
              title={
                activeCategory
                  ? `Productos en ${getCategoryDisplayName(activeCategory)}`
                  : 'Productos disponibles'
              }
              subtitle={
                activeSearch
                  ? `${filteredProducts.length} resultado(s) para "${searchParams.get('q')}"`
                  : activeCategory
                    ? `${filteredProducts.length} producto(s) en esta categoria`
                    : 'Explora los productos visibles de la tienda'
              }
              products={filteredProducts}
              loading={loading}
              error={error}
              emptyTitle={
                activeSearch
                  ? 'No encontramos productos para tu busqueda'
                  : activeCategory
                    ? `Aun no hay productos en ${getCategoryDisplayName(activeCategory)}`
                    : 'Aun no hay productos publicados'
              }
              emptyDescription={
                activeSearch
                  ? 'Prueba con otro nombre, cambia la categoria o vuelve a revisar mas tarde.'
                  : 'Cuando cargues tus productos reales, este espacio mostrara automaticamente el catalogo de tu tienda.'
              }
              emptyAction={
                <Link to="/#catalogo" className="product-detail-secondary-link">
                  Ver todo el catalogo
                </Link>
              }
            />
          </div>

          <StorefrontSidebar menuCategories={menuCategories} activeCategory={activeCategory} />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
