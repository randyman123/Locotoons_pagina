import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import type { Product, CartProduct } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { formatPrice } from '../lib/price';
import { getCategoryDisplayName } from '../lib/categories';
import { buildWhatsAppUrl } from '../lib/whatsapp';
import { normalizeProduct } from '../lib/normalize';
import { readGuestCart, writeGuestCart } from '../lib/storage';
import { BUSINESS } from '../config/business.config';
import { LoadingState } from '../components/ui/LoadingState';
import { SiteHeader } from '../components/layout/SiteHeader';
import { GlobalCategoryNav } from '../components/layout/CategoryMenu';
import { SiteFooter } from '../components/layout/SiteFooter';

export function ProductDetailPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { productId } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showCartPrompt, setShowCartPrompt] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get<Product>(`/products/${productId}`);
        if (!cancelled) {
          setProduct(normalizeProduct(response.data));
        }
      } catch {
        if (!cancelled) {
          setError('No pudimos cargar el detalle del producto.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (productId) {
      loadProduct();
    }

    return () => {
      cancelled = true;
    };
  }, [productId]);

  async function handleAddToCart() {
    if (!product) {
      return;
    }

    if (product.stock <= 0) {
      setCartMessage('Este producto no tiene stock disponible en este momento.');
      return;
    }

    try {
      setAddingToCart(true);
      setCartMessage(null);

      if (auth.user) {
        await api.post(`/carts/${auth.user.userId}/items`, {
          productId: product.id,
          quantity: 1,
        });
      } else {
        const guestCart = readGuestCart();
        const existingItem = guestCart.find((item) => item.product.id === product.id);
        const nextQuantity = (existingItem?.quantity ?? 0) + 1;

        if (nextQuantity > product.stock) {
          setCartMessage(`Solo quedan ${product.stock} unidad(es) disponibles para este producto.`);
          setShowCartPrompt(false);
          return;
        }

        const guestProduct: CartProduct = {
          id: product.id,
          title: product.title,
          slug: product.slug,
          price: product.price,
          stock: product.stock,
          imageUrl: product.imageUrl,
          category: product.category,
        };

        const nextItems = existingItem
          ? guestCart.map((item) =>
              item.product.id === product.id
                ? {
                    ...item,
                    quantity: nextQuantity,
                    product: guestProduct,
                  }
                : item,
            )
          : [
              ...guestCart,
              {
                id: `guest-${product.id}`,
                quantity: 1,
                product: guestProduct,
              },
            ];

        writeGuestCart(nextItems);
      }

      setCartMessage('Producto agregado correctamente a tu carrito.');
      setShowCartPrompt(true);
      await auth.refreshCartCount();
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        setCartMessage(
          (requestError.response?.data as { message?: string } | undefined)?.message ??
            'No pudimos agregar este producto al carrito.',
        );
      } else {
        setCartMessage('No pudimos agregar este producto al carrito.');
      }
      setShowCartPrompt(false);
    } finally {
      setAddingToCart(false);
    }
  }

  const whatsappMessage = product
    ? `Hola, quiero comprar este producto: ${product.title} (x1) Total: ${formatPrice(product.price)}`
    : BUSINESS.whatsapp.productInquiryFallback;

  return (
    <div className="store-shell">
      <div className="top-strip" />
      <SiteHeader />
      <GlobalCategoryNav />

      <main className="page-main">
        <section className="product-detail-shell">
          <div className="product-detail-toolbar">
            <Link to="/#catalogo" className="login-back-link">
              Volver al catalogo
            </Link>
          </div>

          {loading && <LoadingState message="Cargando el detalle del producto..." />}
          {!loading && error && <div className="message-box message-box-error">{error}</div>}

          {!loading && product && (
            <article className="product-detail-card">
              <div className="product-detail-media">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.title} />
                ) : (
                  <div className="product-detail-placeholder">
                    <span>{getCategoryDisplayName(product.category)}</span>
                  </div>
                )}
              </div>

              <div className="product-detail-info">
                <span className="product-detail-category">
                  {getCategoryDisplayName(product.category)}
                </span>
                <h1>{product.title}</h1>
                <strong className="product-detail-price">{formatPrice(product.price)}</strong>
                <p className="product-detail-stock">Stock disponible: {product.stock}</p>

                <section className="product-detail-description">
                  <h2>Descripcion</h2>
                  <p>{product.description}</p>
                </section>

                {product.specifications && product.specifications.length > 0 && (
                  <section className="product-detail-description">
                    <h2>Especificaciones</h2>
                    <div className="product-detail-specifications">
                      {product.specifications.map((specification) => (
                        <p key={`${specification.label}-${specification.value}`}>
                          <strong>{specification.label}:</strong> {specification.value}
                        </p>
                      ))}
                    </div>
                  </section>
                )}

                {cartMessage && (
                  <div
                    className={`message-box ${
                      cartMessage.toLowerCase().includes('no se pudo') ||
                      cartMessage.toLowerCase().includes('stock') ||
                      cartMessage.toLowerCase().includes('no existe')
                        ? 'message-box-error'
                        : 'auth-success-box'
                    }`}
                  >
                    {cartMessage}
                  </div>
                )}

                {showCartPrompt && (
                  <div className="product-cart-prompt">
                    <strong>Producto listo en tu carrito</strong>
                    <div className="product-cart-prompt-actions">
                      <button
                        type="button"
                        className="product-detail-button"
                        onClick={() => navigate('/cart')}
                      >
                        Comprar ahora
                      </button>
                      <button
                        type="button"
                        className="product-detail-secondary-button"
                        onClick={() => {
                          setShowCartPrompt(false);
                          setCartMessage(null);
                        }}
                      >
                        Seguir comprando
                      </button>
                    </div>
                  </div>
                )}

                {!showCartPrompt && (
                  <div className="product-detail-actions">
                    <button
                      type="button"
                      className="product-detail-button"
                      onClick={() => void handleAddToCart()}
                      disabled={addingToCart || product.stock <= 0}
                    >
                      {product.stock <= 0
                        ? 'Sin stock disponible'
                        : addingToCart
                          ? 'Agregando a tu carrito...'
                          : 'Agregar al carrito'}
                    </button>
                  </div>
                )}
                <div className="product-detail-support-actions">
                  <a
                    href={buildWhatsAppUrl(whatsappMessage)}
                    target="_blank"
                    rel="noreferrer"
                    className="whatsapp-icon-link"
                    aria-label="Comprar por WhatsApp"
                    title="Comprar por WhatsApp"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.5 0 .18 5.3.18 11.84c0 2.08.54 4.1 1.57 5.88L0 24l6.49-1.7a11.93 11.93 0 0 0 5.57 1.42h.01c6.56 0 11.88-5.3 11.88-11.84 0-3.16-1.23-6.13-3.43-8.4Zm-8.46 18.2h-.01a9.96 9.96 0 0 1-5.08-1.39l-.36-.21-3.85 1 1.03-3.74-.24-.38a9.8 9.8 0 0 1-1.51-5.11c0-5.43 4.45-9.85 9.92-9.85 2.65 0 5.14 1.02 7.01 2.88a9.77 9.77 0 0 1 2.9 6.97c0 5.43-4.46 9.85-9.81 9.85Zm5.4-7.38c-.3-.15-1.79-.88-2.06-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.96 1.18-.18.2-.35.23-.65.08-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.79-1.68-2.09-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.63-.93-2.23-.25-.6-.5-.52-.68-.53h-.58c-.2 0-.53.08-.8.38-.28.3-1.05 1.03-1.05 2.5 0 1.48 1.08 2.91 1.23 3.11.15.2 2.11 3.21 5.11 4.5.71.31 1.27.49 1.7.63.71.22 1.36.19 1.88.11.57-.09 1.79-.73 2.04-1.44.25-.7.25-1.31.18-1.44-.07-.13-.27-.2-.57-.35Z" />
                    </svg>
                  </a>
                </div>
              </div>
            </article>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
