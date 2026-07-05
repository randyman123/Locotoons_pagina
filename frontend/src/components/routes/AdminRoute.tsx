import { type ReactNode } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SiteHeader } from '../layout/SiteHeader';
import { SiteFooter } from '../layout/SiteFooter';
import { LoadingState } from '../ui/LoadingState';
import { EmptyState } from '../ui/EmptyState';

export function AdminRoute({ children }: { children: ReactNode }) {
  const auth = useAuth();

  if (!auth.authReady) {
    return (
      <div className="store-shell">
        <div className="top-strip" />
        <SiteHeader />
        <main className="page-main">
          <LoadingState message="Validando permisos de administrador..." />
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: '/admin' }} />;
  }

  if (auth.user?.role !== 'admin') {
    return (
      <div className="store-shell">
        <div className="top-strip" />
        <SiteHeader />
        <main className="page-main">
          <EmptyState
            tag="Admin"
            title="No tienes permisos para entrar al panel"
            description="Esta seccion solo esta disponible para usuarios administradores."
            action={
              <Link to="/" className="product-detail-secondary-link">
                Volver a la tienda
              </Link>
            }
          />
        </main>
        <SiteFooter />
      </div>
    );
  }

  return <>{children}</>;
}
