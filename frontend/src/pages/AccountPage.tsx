import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import type { Order } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { formatPrice } from '../lib/price';
import { readCustomerProfile, saveCustomerProfile } from '../lib/storage';
import { SITE } from '../config/site.config';
import { BUSINESS } from '../config/business.config';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';
import { SiteHeader } from '../components/layout/SiteHeader';
import { GlobalCategoryNav } from '../components/layout/CategoryMenu';
import { SiteFooter } from '../components/layout/SiteFooter';

export function AccountPage({ initialSection = 'profile' }: { initialSection?: 'profile' | 'orders' }) {
  const auth = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'profile' | 'orders'>(initialSection);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState(auth.user?.email ?? '');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileShippingAddress, setProfileShippingAddress] = useState('');

  useEffect(() => {
    const storedProfile = readCustomerProfile();
    setProfileName(storedProfile.name || auth.user?.email?.split('@')[0] || '');
    setProfileEmail(auth.user?.email ?? storedProfile.email);
    setProfilePhone(storedProfile.phone);
    setProfileShippingAddress(storedProfile.shippingAddress);
  }, [auth.user?.email]);

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get<Order[]>('/orders');
        if (!cancelled) {
          setOrders(response.data);
        }
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        if (axios.isAxiosError(requestError)) {
          setError(
            (requestError.response?.data as { message?: string } | undefined)?.message ??
              'No pudimos cargar tus ordenes en este momento.',
          );
        } else {
          setError('No pudimos cargar tus ordenes en este momento.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadOrders();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="store-shell">
      <div className="top-strip" />
      <SiteHeader />
      <GlobalCategoryNav />

      <main className="page-main">
        <section className="account-layout">
          <aside className="account-sidebar">
            <div className="account-sidebar-card">
              <span className="hero-tag">Mi cuenta</span>
              <h2>{auth.user?.email ?? `Cliente ${SITE.name}`}</h2>
              <p>Desde aqui puedes revisar tus datos guardados y el historial de compras.</p>
              <div className="account-sidebar-actions">
                <button
                  type="button"
                  className={activeSection === 'profile' ? 'account-tab account-tab-active' : 'account-tab'}
                  onClick={() => setActiveSection('profile')}
                >
                  Perfil
                </button>
                <button
                  type="button"
                  className={activeSection === 'orders' ? 'account-tab account-tab-active' : 'account-tab'}
                  onClick={() => setActiveSection('orders')}
                >
                  Mis ordenes
                </button>
              </div>
            </div>
          </aside>

          <div className="account-content">
            {activeSection === 'profile' && (
              <section className="orders-layout">
                <header className="section-heading">
                  <h2>Perfil y envio</h2>
                  <span>Datos guardados para acelerar tu proxima compra</span>
                </header>

                {profileMessage && <div className="message-box auth-success-box">{profileMessage}</div>}

                <article className="account-profile-card">
                  <label className="cart-summary-label" htmlFor="profile-name">
                    Nombre
                  </label>
                  <input
                    id="profile-name"
                    className="cart-summary-input"
                    type="text"
                    value={profileName}
                    onChange={(event) => setProfileName(event.target.value)}
                  />
                  <label className="cart-summary-label" htmlFor="profile-email">
                    Email
                  </label>
                  <input
                    id="profile-email"
                    className="cart-summary-input"
                    type="email"
                    value={profileEmail}
                    onChange={(event) => setProfileEmail(event.target.value)}
                  />
                  <label className="cart-summary-label" htmlFor="profile-phone">
                    Telefono
                  </label>
                  <input
                    id="profile-phone"
                    className="cart-summary-input"
                    type="tel"
                    value={profilePhone}
                    onChange={(event) => setProfilePhone(event.target.value)}
                  />
                  <label className="cart-summary-label" htmlFor="profile-address">
                    Direccion de envio
                  </label>
                  <textarea
                    id="profile-address"
                    className="cart-summary-textarea"
                    value={profileShippingAddress}
                    onChange={(event) => setProfileShippingAddress(event.target.value)}
                  />
                  <div className="cart-inline-actions">
                    <button
                      type="button"
                      className="product-detail-button"
                      onClick={() => {
                        saveCustomerProfile({
                          name: profileName.trim(),
                          email: profileEmail.trim(),
                          phone: profilePhone.trim(),
                          shippingAddress: profileShippingAddress.trim(),
                        });
                        setProfileMessage('Tus datos quedaron guardados para futuras compras.');
                      }}
                    >
                      Guardar datos
                    </button>
                  </div>
                </article>
              </section>
            )}

            {activeSection === 'orders' && (
              <section className="orders-layout">
                <header className="section-heading">
                  <h2>Mis ordenes</h2>
                  <span>Historial real de tus compras en {SITE.name}</span>
                </header>

                {loading && <LoadingState message="Cargando tus ordenes..." />}
                {error && <div className="message-box message-box-error">{error}</div>}

                {!loading && !error && orders.length === 0 && (
                  <EmptyState
                    compact
                    tag="Sin ordenes"
                    title="Aun no tienes compras registradas"
                    description="Cuando finalices tu primera compra, aqui veras el historial completo de tus pedidos."
                    action={
                      <Link to="/" className="product-detail-secondary-link">
                        Volver a la tienda
                      </Link>
                    }
                  />
                )}

                {!loading && !error && orders.length > 0 && (
                  <div className="orders-list">
                    {orders.map((order) => (
                      <article key={order.id} className="order-card">
                        <div className="order-card-header">
                          <div>
                            <span className="order-label">Orden #{order.id}</span>
                            <h3>{new Date(order.createdAt).toLocaleDateString(BUSINESS.locale)}</h3>
                          </div>
                          <div className="order-summary-meta">
                            <span className="order-status">{order.status}</span>
                            <strong>{formatPrice(order.total)}</strong>
                          </div>
                        </div>

                        <div className="order-meta-grid">
                          <div>
                            <span className="order-label">Envio</span>
                            <p>{order.shippingAddress}</p>
                          </div>
                          <div>
                            <span className="order-label">Items</span>
                            <p>{order.items.length} producto(s)</p>
                          </div>
                        </div>

                        <div className="order-items-list">
                          {order.items.map((item) => (
                            <div key={item.id} className="order-item-row">
                              <span>Producto #{item.productId}</span>
                              <span>Cant: {item.quantity}</span>
                              <strong>{formatPrice(Number(item.unitPrice) * item.quantity)}</strong>
                            </div>
                          ))}
                        </div>

                        <div className="order-actions">
                          <Link to={`/orders/${order.id}`} className="product-detail-secondary-link">
                            Ver detalle de orden
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
