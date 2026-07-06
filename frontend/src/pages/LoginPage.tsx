import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { SITE } from '../config/site.config';
import { SiteHeader } from '../components/layout/SiteHeader';
import { GlobalCategoryNav } from '../components/layout/CategoryMenu';
import { SiteFooter } from '../components/layout/SiteFooter';

type LoginResponse = {
  accessToken: string;
};

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError(null);

      const response = await api.post<LoginResponse>('/auth/login', {
        email,
        password,
      });

      auth.login(response.data.accessToken);
      navigate(redirectTo);
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        setError(
          (requestError.response?.data as { message?: string } | undefined)?.message ??
            'No pudimos iniciar sesion. Revisa tus credenciales e intenta otra vez.',
        );
      } else {
        setError('No pudimos iniciar sesion. Revisa tus credenciales e intenta otra vez.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="store-shell">
      <div className="top-strip" />
      <SiteHeader />
      <GlobalCategoryNav />

      <main className="page-main">
        <section className="auth-layout">
          <article className="auth-panel auth-panel-copy">
            <span className="hero-tag">Acceso clientes</span>
            <h1>Ingresa a tu cuenta {SITE.name}</h1>
            <p>
              Accede a tu cuenta para guardar productos, revisar tu carrito y seguir tus
              compras desde un solo lugar.
            </p>
            <ul className="auth-benefits">
              <li>Revisar carrito y pedidos</li>
              <li>Continuar compras pendientes</li>
              <li>Gestionar tu cuenta mas adelante</li>
            </ul>
          </article>

          <section className="auth-panel login-card login-card-extended">
            <div className="login-card-header">
              <p className="brand-kicker">Inicio de sesion</p>
              <h1>Bienvenido</h1>
              <p>
                {auth.user
                  ? `Sesion activa como ${auth.user.email}.`
                  : 'Ingresa con tus credenciales para comprar y revisar tu carrito real.'}
              </p>
            </div>

            {error && <div className="message-box message-box-error">{error}</div>}
            {!error && auth.user && (
              <div className="message-box auth-success-box">
                Sesion iniciada correctamente. Bienvenido de nuevo, {auth.user.email}.
              </div>
            )}

            <form className="login-form" onSubmit={handleSubmit}>
              <label htmlFor="email">Correo electronico</label>
              <input
                id="email"
                type="email"
                placeholder="usuario@correo.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />

              <label htmlFor="password">Contrasena</label>
              <input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />

              <button type="submit" disabled={submitting}>
                {submitting ? 'Iniciando sesion...' : 'Iniciar sesion'}
              </button>
            </form>

            <div className="auth-links-row">
              <Link to="/register" className="muted-inline-link">
                Crear cuenta
              </Link>
              {auth.user ? (
                <button type="button" className="plain-action-button" onClick={auth.logout}>
                  Cerrar sesion
                </button>
              ) : (
                <Link to="/" className="login-back-link">
                  Volver a la tienda
                </Link>
              )}
            </div>
          </section>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
