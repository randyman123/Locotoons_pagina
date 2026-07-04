import type { CartItem, CustomerProfile } from '../types';
import { BUSINESS } from '../config/business.config';
import { normalizeCartProduct } from './normalize';

const GUEST_CART_KEY = BUSINESS.storageKeys.guestCart;
const CUSTOMER_PROFILE_KEY = BUSINESS.storageKeys.customerProfile;
const STOREFRONT_REFRESH_EVENT = BUSINESS.events.storefrontRefresh;
const CART_REFRESH_EVENT = BUSINESS.events.cartRefresh;

export function notifyStorefrontRefresh() {
  window.dispatchEvent(new CustomEvent(STOREFRONT_REFRESH_EVENT));
}

export function notifyCartRefresh() {
  window.dispatchEvent(new CustomEvent(CART_REFRESH_EVENT));
}

export function readGuestCart(): CartItem[] {
  try {
    const storedValue = localStorage.getItem(GUEST_CART_KEY);
    if (!storedValue) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue) as CartItem[];
    return Array.isArray(parsedValue)
      ? parsedValue.map((item) => ({
          ...item,
          product: normalizeCartProduct(item.product),
        }))
      : [];
  } catch {
    return [];
  }
}

export function writeGuestCart(items: CartItem[]) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  notifyCartRefresh();
}

export function readCustomerProfile(): CustomerProfile {
  try {
    const storedValue = localStorage.getItem(CUSTOMER_PROFILE_KEY);
    if (!storedValue) {
      return { name: '', email: '', phone: '', shippingAddress: '' };
    }

    const parsedValue = JSON.parse(storedValue) as Partial<CustomerProfile>;
    return {
      name: parsedValue.name ?? '',
      email: parsedValue.email ?? '',
      phone: parsedValue.phone ?? '',
      shippingAddress: parsedValue.shippingAddress ?? '',
    };
  } catch {
    return { name: '', email: '', phone: '', shippingAddress: '' };
  }
}

export function saveCustomerProfile(profile: CustomerProfile) {
  localStorage.setItem(CUSTOMER_PROFILE_KEY, JSON.stringify(profile));
}
