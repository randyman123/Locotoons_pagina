import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthUser, AuthContextValue, Cart } from '../types';
import { BUSINESS } from '../config/business.config';
import { api } from '../lib/api';
import { decodeJwtPayload } from '../lib/auth';
import { readGuestCart } from '../lib/storage';
import { normalizeCart } from '../lib/normalize';

const AUTH_TOKEN_KEY = BUSINESS.storageKeys.authToken;
const CART_REFRESH_EVENT = BUSINESS.events.cartRefresh;

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(AUTH_TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    return storedToken ? decodeJwtPayload(storedToken) : null;
  });
  const [authReady, setAuthReady] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!storedToken) {
      setAuthReady(true);
      return;
    }

    const decodedUser = decodeJwtPayload(storedToken);
    if (!decodedUser) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setToken(null);
      setUser(null);
      setCartCount(0);
      setAuthReady(true);
      return;
    }

    setToken(storedToken);
    setUser(decodedUser);
    setAuthReady(true);
  }, []);

  async function refreshCartCount() {
    const currentToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const currentUser = currentToken ? decodeJwtPayload(currentToken) : null;

    if (!currentToken || !currentUser) {
      const guestCount = readGuestCart().reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(guestCount);
      return;
    }

    try {
      const response = await api.get<Cart | null>(`/carts/${currentUser.userId}`);
      const nextCount = (normalizeCart(response.data)?.items ?? []).reduce(
        (sum, item) => sum + item.quantity,
        0,
      );
      setCartCount(nextCount);
    } catch {
      setCartCount(0);
    }
  }

  useEffect(() => {
    if (!authReady) {
      return;
    }

    void refreshCartCount();
  }, [token, authReady]);

  useEffect(() => {
    function handleCartRefresh() {
      void refreshCartCount();
    }

    window.addEventListener(CART_REFRESH_EVENT, handleCartRefresh);

    return () => {
      window.removeEventListener(CART_REFRESH_EVENT, handleCartRefresh);
    };
  }, [token, authReady]);

  function login(nextToken: string) {
    localStorage.setItem(AUTH_TOKEN_KEY, nextToken);
    setToken(nextToken);
    setUser(decodeJwtPayload(nextToken));
  }

  function logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setUser(null);
    void refreshCartCount();
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: Boolean(token && user),
        authReady,
        cartCount,
        login,
        logout,
        refreshCartCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
}
