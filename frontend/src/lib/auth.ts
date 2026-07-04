import type { AuthUser } from '../types';

export function decodeJwtPayload(token: string): AuthUser | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(window.atob(normalized));

    return {
      userId: Number(decoded.sub),
      email: String(decoded.email),
      role: decoded.role ? String(decoded.role) : undefined,
    };
  } catch {
    return null;
  }
}
