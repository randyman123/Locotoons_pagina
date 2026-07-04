import type { Order, CartItem, PaymentMethod } from '../types';
import { BUSINESS } from '../config/business.config';
import { formatPrice } from './price';

export function getOrderStatusLabel(status: string) {
  switch (status) {
    case 'pending':
      return 'Pendiente';
    case 'paid':
      return 'Pagada';
    case 'shipped':
      return 'Enviada';
    case 'delivered':
      return 'Entregada';
    case 'cancelled':
      return 'Cancelada';
    default:
      return status;
  }
}

export function getOrderCustomerName(order: Order) {
  return order.customerName ?? order.accountName ?? `Usuario #${order.userId ?? 'N/A'}`;
}

export function getOrderCustomerEmail(order: Order) {
  return order.customerEmail ?? order.accountEmail ?? null;
}

export function getOrderCustomerTypeLabel(order: Order) {
  return order.customerType === 'registered' || order.userId ? 'Usuario registrado' : 'Invitado';
}

export function getPaymentMethodLabel(_paymentMethod?: PaymentMethod) {
  return BUSINESS.payment.label;
}

export function buildOrderWhatsAppMessage(
  order: Pick<Order, 'id' | 'total'>,
  items: CartItem[],
  customer?: { name?: string; email?: string; phone?: string },
) {
  const products = items
    .map((item) => `- ${item.product.title} x${item.quantity}`)
    .join('\n');
  const contactLines = [
    customer?.name ? `Nombre: ${customer.name}` : null,
    customer?.email ? `Email: ${customer.email}` : null,
    customer?.phone ? `Telefono: ${customer.phone}` : null,
  ].filter(Boolean);

  return [
    `Hola, adjunto comprobante de transferencia de la orden #${order.id}.`,
    products ? `Productos:\n${products}` : null,
    `Total: ${formatPrice(order.total)}`,
    contactLines.length > 0 ? `Contacto:\n${contactLines.join('\n')}` : null,
  ]
    .filter(Boolean)
    .join('\n\n');
}
