import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../types';
import { formatPrice } from '../../lib/price';
import { getCategoryDisplayName } from '../../lib/categories';
import { LoadingState } from '../ui/LoadingState';
import { EmptyState } from '../ui/EmptyState';

export function ProductCatalogSection({
  title,
  subtitle,
  products,
  loading,
  error,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: {
  title: string;
  subtitle: string;
  products: Product[];
  loading: boolean;
  error: string | null;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction: ReactNode;
}) {
  return (
    <section className="catalog-panel" id="catalogo">
      <header className="section-heading">
        <h2>{title}</h2>
        <span>{subtitle}</span>
      </header>

      {error && <div className="message-box message-box-error">{error}</div>}
      {!error && loading && <LoadingState message="Cargando productos del catalogo..." />}

      {!loading && !error && (
        <div className="product-grid">
          {products.length > 0 ? (
            products.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="product-card-link"
              >
                <article className="product-card">
                  <div className="product-thumb">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.title} />
                    ) : (
                      <span>{getCategoryDisplayName(product.category)}</span>
                    )}
                  </div>
                  <div className="product-body">
                    <div className="product-card-kickers">
                      <span className="product-category">{getCategoryDisplayName(product.category)}</span>
                      {product.featured && <span className="product-featured-pill">Destacado</span>}
                    </div>
                    <h3>{product.title}</h3>
                    <p>{product.description}</p>
                    <div className="product-footer">
                      <strong>{formatPrice(product.price)}</strong>
                      <span>Stock: {product.stock}</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))
          ) : (
            <EmptyState
              compact
              tag="Catalogo"
              title={emptyTitle}
              description={emptyDescription}
              action={emptyAction}
            />
          )}
        </div>
      )}
    </section>
  );
}
