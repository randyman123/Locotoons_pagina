import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import type { Order } from '../types';
import { api } from '../lib/api';
import { formatPrice } from '../lib/price';
import { BUSINESS } from '../config/business.config';
import { LoadingState } from '../components/ui/LoadingState';
import { SiteHeader } from '../components/layout/SiteHeader';
import { GlobalCategoryNav } from '../components/layout/CategoryMenu';
import { SiteFooter } from '../components/layout/SiteFooter';

export function OrderDetailPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOrder() {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get<Order>(`/orders/${orderId}`);
        if (!cancelled) {
          setOrder(response.data);
        }
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        if (axios.isAxiosError(requestError)) {
          setError(
            (requestError.response?.data as { message?: string } | undefined)?.message ??
              'No pudimos cargar el detalle de esta orden.',
          );
        } else {
          setError('No pudimos cargar el detalle de esta orden.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (orderId) {
      void loadOrder();
    }

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return (
    <div className="store-shell">
      <div className="top-strip" />
      <SiteHeader />
      <GlobalCategoryNav />

      <main className="page-main">
        <section className="orders-layout">
          <div className="product-detail-toolbar">
            <Link to="/orders" className="login-back-link">
              Volver a mis ordenes
            </Link>
          </div>

          {loading && <LoadingState message="Cargando el detalle de tu orden..." />}
          {error && <div className="message-box message-box-error">{error}</div>}

          {!loading && order && (
            <article className="order-card order-detail-card">
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
                  <span className="order-label">Fecha</span>
                  <p>{new Date(order.createdAt).toLocaleString(BUSINESS.locale)}</p>
                </div>
                <div>
                  <span className="order-label">Estado</span>
                  <p>{order.status}</p>
                </div>
                <div>
                  <span className="order-label">Direccion de envio</span>
                  <p>{order.shippingAddress}</p>
                </div>
                <div>
                  <span className="order-label">Total</span>
                  <p>{formatPrice(order.total)}</p>
                </div>
              </div>

              <div className="order-items-list">
                {order.items.map((item) => (
                  <div key={item.id} className="order-item-row">
                    <span>Producto #{item.productId}</span>
                    <span>Cantidad: {item.quantity}</span>
                    <strong>{formatPrice(Number(item.unitPrice) * item.quantity)}</strong>
                  </div>
                ))}
              </div>
            </article>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
