import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import type { Cart, CartItem, PaymentMethod, Order } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { formatPrice } from '../lib/price';
import { getCategoryDisplayName } from '../lib/categories';
import { buildWhatsAppUrl } from '../lib/whatsapp';
import { normalizeCart } from '../lib/normalize';
import { notifyStorefrontRefresh, readGuestCart, writeGuestCart, readCustomerProfile, saveCustomerProfile } from '../lib/storage';
import { getPaymentMethodLabel, buildOrderWhatsAppMessage } from '../lib/orders';
import { BUSINESS } from '../config/business.config';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';
import { SiteHeader } from '../components/layout/SiteHeader';
import { SiteFooter } from '../components/layout/SiteFooter';

type OrderConfirmation = {
  order: Order;
  items: CartItem[];
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
};

const CART_REFRESH_EVENT = BUSINESS.events.cartRefresh;

export function CartPage() {
  const auth = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busyItemId, setBusyItemId] = useState<number | string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const paymentMethod: PaymentMethod = BUSINESS.payment.method;
  const [orderConfirmation, setOrderConfirmation] = useState<OrderConfirmation | null>(null);
  const isGuestMode = !auth.user;

  async function loadCart() {
    if (!auth.user) {
      setCart({
        id: 0,
        userId: 0,
        items: readGuestCart(),
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.get<Cart | null>(`/carts/${auth.user.userId}`);
      setCart(normalizeCart(response.data));
      await auth.refreshCartCount();
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        setError(
          (requestError.response?.data as { message?: string } | undefined)?.message ??
            'No pudimos cargar tu carrito. Intenta nuevamente en unos segundos.',
        );
      } else {
        setError('No pudimos cargar tu carrito. Intenta nuevamente en unos segundos.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const storedProfile = readCustomerProfile();
    setShippingAddress(storedProfile.shippingAddress || 'Av. Siempre Viva 123, Santiago');
    setGuestName(storedProfile.name);
    setGuestEmail(storedProfile.email);
    setGuestPhone(storedProfile.phone);
  }, []);

  useEffect(() => {
    void loadCart();
  }, [auth.user?.userId]);

  useEffect(() => {
    function handleCartRefresh() {
      void loadCart();
    }

    if (!auth.user) {
      window.addEventListener(CART_REFRESH_EVENT, handleCartRefresh);
    }

    return () => {
      window.removeEventListener(CART_REFRESH_EVENT, handleCartRefresh);
    };
  }, [auth.user?.userId]);

  async function updateItemQuantity(item: CartItem, nextQuantity: number) {
    if (nextQuantity < 1) {
      await removeItem(item.id);
      return;
    }

    if (nextQuantity > item.product.stock) {
      setError(`Solo hay ${item.product.stock} unidad(es) disponible(s) de "${item.product.title}".`);
      setSuccess(null);
      return;
    }

    try {
      setBusyItemId(item.id);
      setError(null);
      setSuccess(null);
      setOrderConfirmation(null);

      if (auth.user) {
        await api.patch(`/carts/${auth.user.userId}/items/${item.id}`, {
          quantity: nextQuantity,
        });
        await loadCart();
      } else {
        const nextItems = readGuestCart().map((guestItem) =>
          guestItem.id === item.id
            ? {
                ...guestItem,
                quantity: nextQuantity,
              }
            : guestItem,
        );
        writeGuestCart(nextItems);
        setCart({
          id: 0,
          userId: 0,
          items: nextItems,
        });
      }
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        setError(
          (requestError.response?.data as { message?: string } | undefined)?.message ??
            'No pudimos actualizar la cantidad del producto.',
        );
      } else {
        setError('No pudimos actualizar la cantidad del producto.');
      }
    } finally {
      setBusyItemId(null);
    }
  }

  async function removeItem(itemId: number | string) {
    try {
      setBusyItemId(itemId);
      setError(null);
      setSuccess(null);

      if (auth.user) {
        await api.delete(`/carts/${auth.user.userId}/items/${itemId}`);
        await loadCart();
      } else {
        const nextItems = readGuestCart().filter((item) => item.id !== itemId);
        writeGuestCart(nextItems);
        setCart({
          id: 0,
          userId: 0,
          items: nextItems,
        });
      }
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        setError(
          (requestError.response?.data as { message?: string } | undefined)?.message ??
            'No pudimos quitar ese producto del carrito.',
        );
      } else {
        setError('No pudimos quitar ese producto del carrito.');
      }
    } finally {
      setBusyItemId(null);
    }
  }

  function persistProfileIfNeeded() {
    saveCustomerProfile({
      name: auth.user?.email?.split('@')[0] ?? guestName.trim(),
      email: auth.user?.email ?? guestEmail.trim(),
      phone: guestPhone.trim(),
      shippingAddress: shippingAddress.trim(),
    });
  }

  const cartItems = cart?.items ?? [];
  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );
  const hasStockIssues = cartItems.some(
    (item) => item.product.stock <= 0 || item.quantity > item.product.stock,
  );
  const whatsappMessage =
    cartItems.length > 0
      ? `Hola, quiero comprar estos productos: ${cartItems
          .map(
            (item) =>
              `${item.product.title} (x${item.quantity}) ${formatPrice(
                Number(item.product.price) * item.quantity,
              )}`,
          )
          .join(', ')}. Total: ${formatPrice(subtotal)}`
      : BUSINESS.whatsapp.emptyCartMessage;

  async function handleCheckout() {
    if (cartItems.length === 0) {
      return;
    }

    if (!shippingAddress.trim()) {
      setError('Debes indicar una direccion de envio antes de finalizar la compra.');
      return;
    }

    if (isGuestMode && (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim())) {
      setError('Para comprar como invitado debes completar nombre, email y telefono.');
      return;
    }

    try {
      setCheckoutLoading(true);
      setError(null);
      setSuccess(null);
      setOrderConfirmation(null);

      const checkoutItems = cartItems.map((item) => ({
        ...item,
        product: { ...item.product },
      }));

      const orderResponse = await api.post<Order>('/orders', {
        customerName: isGuestMode ? guestName.trim() : undefined,
        customerEmail: isGuestMode ? guestEmail.trim() : undefined,
        customerPhone: guestPhone.trim() || undefined,
        shippingAddress,
        paymentMethod,
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: Number(item.product.price),
        })),
      });

      if (auth.user) {
        const userId = auth.user.userId;
        await Promise.all(
          cartItems.map((item) => api.delete(`/carts/${userId}/items/${item.id}`)),
        );
        await loadCart();
      } else {
        writeGuestCart([]);
        setCart({
          id: 0,
          userId: 0,
          items: [],
        });
      }

      persistProfileIfNeeded();
      await auth.refreshCartCount();
      notifyStorefrontRefresh();
      setOrderConfirmation({
        order: orderResponse.data,
        items: checkoutItems,
        customerName: isGuestMode ? guestName.trim() : auth.user?.email?.split('@')[0],
        customerEmail: isGuestMode ? guestEmail.trim() : auth.user?.email,
        customerPhone: guestPhone.trim() || undefined,
      });
      setSuccess(
        auth.user
          ? 'Tu compra fue registrada correctamente. Ya puedes revisarla en Mis ordenes.'
          : 'Tu compra invitada fue registrada correctamente. Te contactaremos con los datos que indicaste.',
      );
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        const backendMessage =
          (requestError.response?.data as { message?: string } | undefined)?.message ??
          'No pudimos finalizar tu compra. Revisa tus datos e intenta nuevamente.';
        const stockError =
          backendMessage.toLowerCase().includes('stock') ||
          backendMessage.toLowerCase().includes('disponible');

        setError(
          stockError
            ? `${backendMessage} Actualizamos tu carrito para que revises las cantidades disponibles.`
            : backendMessage,
        );
      } else {
        setError('No pudimos finalizar tu compra. Revisa tus datos e intenta nuevamente.');
      }

      await loadCart();
      notifyStorefrontRefresh();
    } finally {
      setCheckoutLoading(false);
    }
  }

  const orderConfirmationWhatsAppMessage = orderConfirmation
    ? buildOrderWhatsAppMessage(orderConfirmation.order, orderConfirmation.items, {
        name: orderConfirmation.customerName,
        email: orderConfirmation.customerEmail,
        phone: orderConfirmation.customerPhone,
      })
    : null;

  return (
    <div className="store-shell">
      <div className="top-strip" />
      <SiteHeader />

      <main className="page-main">
        <section className={isGuestMode ? 'cart-layout cart-layout-guest' : 'cart-layout'}>
          <div className="cart-main">
            <header className="section-heading">
              <h2>{isGuestMode ? 'Compra como invitado' : 'Carro de compra'}</h2>
              <span>
                {isGuestMode
                  ? 'Completa tus datos y finaliza sin crear cuenta'
                  : 'Tu seleccion actual lista para finalizar la compra'}
              </span>
            </header>

            {isGuestMode && (
              <div className="cart-guest-banner">
                <div>
                  <strong>Checkout rapido</strong>
                  <p>Compra como invitado o inicia sesion para guardar tu historial.</p>
                </div>
                <div className="checkout-account-actions">
                  <Link to="/login" className="checkout-account-card">
                    <strong>Iniciar sesion</strong>
                    <span>Guarda historial y datos de envio.</span>
                  </Link>
                  <Link to="/register" className="checkout-account-card">
                    <strong>Crear cuenta</strong>
                    <span>Registra tus datos para futuras compras.</span>
                  </Link>
                </div>
              </div>
            )}

            {error && <div className="message-box message-box-error">{error}</div>}
            {success && <div className="message-box auth-success-box">{success}</div>}
            {orderConfirmation && orderConfirmationWhatsAppMessage && (
              <section className="order-confirmation-card">
                <span className="promo-ribbon">Pendiente de confirmacion de pago</span>
                <h3>Orden #{orderConfirmation.order.id}</h3>
                <div className="order-confirmation-grid">
                  <div>
                    <span className="order-label">Estado</span>
                    <p>Pendiente de confirmacion de pago</p>
                  </div>
                  <div>
                    <span className="order-label">Metodo</span>
                    <p>{getPaymentMethodLabel(orderConfirmation.order.paymentMethod)}</p>
                  </div>
                </div>
                <div className="summary-line summary-line-total">
                  <span>Total</span>
                  <strong>{formatPrice(orderConfirmation.order.total)}</strong>
                </div>
                <div className="transfer-instructions">
                  <strong>Instrucciones para transferencia</strong>
                  <span>Transfiere el total exacto de la orden.</span>
                  <span>En el comentario o asunto escribe: Orden #{orderConfirmation.order.id}.</span>
                  <span>Luego envia el comprobante por WhatsApp para confirmar la preparacion del pedido.</span>
                </div>
                <a
                  href={buildWhatsAppUrl(orderConfirmationWhatsAppMessage)}
                  target="_blank"
                  rel="noreferrer"
                  className="whatsapp-button"
                >
                  Enviar comprobante por WhatsApp
                </a>
              </section>
            )}
            {loading && <LoadingState message="Cargando tu carrito..." />}

            {!loading && cartItems.length === 0 && !orderConfirmation && (
              <EmptyState
                compact
                tag="Sin productos"
                title="Tu carrito esta vacio"
                description={
                  isGuestMode
                    ? 'Agrega productos desde el catalogo y podras comprar como invitado.'
                    : 'Agrega productos desde el catalogo y arma tu compra en pocos pasos.'
                }
                action={
                  <Link to="/" className="product-detail-secondary-link">
                    Volver al catalogo
                  </Link>
                }
              />
            )}

            {!loading && cartItems.length > 0 && (
              <div className="cart-table-shell">
                <div className="cart-table-head">
                  <span>Producto</span>
                  <span>Cantidad</span>
                  <span>Precio</span>
                  <span>Subtotal</span>
                </div>

                <div className="cart-table-body">
                  {cartItems.map((item) => (
                    <article key={item.id} className="cart-row">
                      <div className="cart-product-cell">
                        <div className="cart-product-thumb">
                          {item.product.imageUrl ? (
                            <img src={item.product.imageUrl} alt={item.product.title} />
                          ) : (
                            <span>{getCategoryDisplayName(item.product.category)}</span>
                          )}
                        </div>
                        <div className="cart-product-copy">
                          <strong>{item.product.title}</strong>
                          <span>{getCategoryDisplayName(item.product.category)}</span>
                          <span>Stock disponible: {item.product.stock}</span>
                          <button
                            type="button"
                            className="cart-remove-button"
                            onClick={() => void removeItem(item.id)}
                            disabled={busyItemId === item.id}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                      <div className="cart-qty-cell">
                        <button
                          type="button"
                          onClick={() => void updateItemQuantity(item, item.quantity - 1)}
                          disabled={busyItemId === item.id}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => void updateItemQuantity(item, item.quantity + 1)}
                          disabled={busyItemId === item.id || item.quantity >= item.product.stock}
                        >
                          +
                        </button>
                      </div>
                      <div className="cart-price-cell">{formatPrice(item.product.price)}</div>
                      <div className="cart-total-cell">
                        {formatPrice(Number(item.product.price) * item.quantity)}
                      </div>
                    </article>
                  ))}
                </div>

                <div className="cart-table-total">
                  <span>Total del pedido</span>
                  <strong>{formatPrice(subtotal)}</strong>
                </div>
              </div>
            )}
          </div>

          <aside className="cart-summary">
            <section className="cart-summary-card">
              <span className="promo-ribbon">{isGuestMode ? 'Checkout invitado' : 'Resumen'}</span>
              <h2>{isGuestMode ? 'Datos para tu compra' : 'Detalle del pedido'}</h2>

              {isGuestMode && (
                <>
                  <label className="cart-summary-label" htmlFor="guest-name">
                    Nombre
                  </label>
                  <input
                    id="guest-name"
                    className="cart-summary-input"
                    type="text"
                    value={guestName}
                    onChange={(event) => setGuestName(event.target.value)}
                    placeholder="Nombre y apellido"
                  />
                  <label className="cart-summary-label" htmlFor="guest-email">
                    Email
                  </label>
                  <input
                    id="guest-email"
                    className="cart-summary-input"
                    type="email"
                    value={guestEmail}
                    onChange={(event) => setGuestEmail(event.target.value)}
                    placeholder="cliente@correo.com"
                  />
                  <label className="cart-summary-label" htmlFor="guest-phone">
                    Telefono
                  </label>
                  <input
                    id="guest-phone"
                    className="cart-summary-input"
                    type="tel"
                    value={guestPhone}
                    onChange={(event) => setGuestPhone(event.target.value)}
                    placeholder="+56 9 1234 5678"
                  />
                </>
              )}

              <label className="cart-summary-label" htmlFor="shipping-address">
                Direccion de envio
              </label>
              <textarea
                id="shipping-address"
                className="cart-summary-textarea"
                value={shippingAddress}
                onChange={(event) => setShippingAddress(event.target.value)}
                aria-describedby="shipping-address-help"
              />
              <p className="cart-summary-help" id="shipping-address-help">
                Ingresa calle, numero, comuna y region.
              </p>

              <div className="payment-method-panel">
                <span className="cart-summary-label">Metodo de pago</span>
                <div className="payment-method-option payment-method-option-static">
                  <span className="payment-method-dot" aria-hidden="true" />
                  <span>
                    <strong>Transferencia bancaria</strong>
                    <small>La orden queda pendiente hasta confirmar el comprobante por WhatsApp.</small>
                  </span>
                </div>
              </div>

              {!isGuestMode && (
                <div className="cart-inline-actions">
                  <button
                    type="button"
                    className="product-detail-secondary-button"
                    onClick={() => {
                      persistProfileIfNeeded();
                      setSuccess('Tu direccion quedo guardada para futuras compras.');
                    }}
                  >
                    Guardar direccion
                  </button>
                </div>
              )}

              <div className="summary-line">
                <span>Subtotal</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <div className="summary-line">
                <span>Envio</span>
                <strong>Por calcular</strong>
              </div>
              <div className="summary-line summary-line-total">
                <span>Total</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>

              <button
                type="button"
                className="product-detail-button cart-checkout-button"
                onClick={() => void handleCheckout()}
                disabled={checkoutLoading || cartItems.length === 0 || hasStockIssues}
              >
                {checkoutLoading ? 'Procesando tu compra...' : 'Finalizar compra'}
              </button>
              <a
                href={buildWhatsAppUrl(whatsappMessage)}
                target="_blank"
                rel="noreferrer"
                className="whatsapp-button whatsapp-button-secondary"
              >
                Consultar por WhatsApp
              </a>
              <Link to="/" className="product-detail-secondary-link">
                Seguir comprando
              </Link>
            </section>
          </aside>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
