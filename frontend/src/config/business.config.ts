const whatsappPhone = import.meta.env.VITE_WHATSAPP_PHONE_NUMBER || '56912345678';

export const BUSINESS = {
  locale: 'es-CL',
  currency: 'CLP',
  contact: {
    whatsappPhone,
    whatsappUrl: `https://wa.me/${whatsappPhone}`,
    whatsappDisplay: '+56 9 1234 5678',
    instagram: 'locotoons',
    instagramUrl: 'https://instagram.com/locotoons',
    email: 'hola@locotoons.cl',
  },
  payment: {
    method: 'bank_transfer' as const,
    label: 'Transferencia bancaria',
  },
  whatsapp: {
    emptyCartMessage: 'Hola, quiero comprar en Locotoons.',
    productInquiryFallback: 'Hola, quiero consultar por un producto de Locotoons.',
  },
  storageKeys: {
    authToken: 'locotoons_auth_token',
    guestCart: 'locotoons_guest_cart',
    customerProfile: 'locotoons_customer_profile',
  },
  events: {
    storefrontRefresh: 'locotoons:storefront-refresh',
    cartRefresh: 'locotoons:cart-refresh',
  },
};
