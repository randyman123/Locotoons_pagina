import { BUSINESS } from '../config/business.config';

export function buildWhatsAppUrl(message: string) {
  return `https://wa.me/${BUSINESS.contact.whatsappPhone}?text=${encodeURIComponent(message)}`;
}
