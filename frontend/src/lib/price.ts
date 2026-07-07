import { BUSINESS } from '../config/business.config';

export function formatPrice(value: number | string) {
  const amount = typeof value === 'string' ? Number(value) : value;
  return new Intl.NumberFormat(BUSINESS.locale, {
    style: 'currency',
    currency: BUSINESS.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
