import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SiteHeader } from '../layout/SiteHeader';
import { GlobalCategoryNav } from '../layout/CategoryMenu';
import { SiteFooter } from '../layout/SiteFooter';
import { LoadingState } from '../ui/LoadingState';

export function PrivateRoute({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const location = useLocation();

  if (!auth.authReady) {
    return (
      <div className="store-shell">
        <div className="top-strip" />
        <SiteHeader />
        <GlobalCategoryNav />
        <main className="page-main">
          <LoadingState message="Recuperando tu sesion..." />
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
