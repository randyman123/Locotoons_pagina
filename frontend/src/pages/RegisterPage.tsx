import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { api } from '../lib/api';
import { SITE } from '../config/site.config';
import { SiteHeader } from '../components/layout/SiteHeader';
import { GlobalCategoryNav } from '../components/layout/CategoryMenu';
import { SiteFooter } from '../components/layout/SiteFooter';

type RegisterResponse = {
  id: number;
  email: string;
  name: string;
  role?: string;
};

export function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      await api.post<RegisterResponse>('/auth/register', {
        name,
        email,
        password,
      });

      setSuccess('Tu cuenta fue creada correctamente. Te llevaremos al login en un momento.');
      window.setTimeout(() => {
        navigate('/login', { state: { from: '/' } });
      }, 900);
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        setError(
          (requestError.response?.data as { message?: string } | undefined)?.message ??
            'No pudimos crear tu cuenta. Revisa los datos e intenta nuevamente.',
        );
      } else {
        setError('No pudimos crear tu cuenta. Revisa los datos e intenta nuevamente.');
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
        <section className="auth-layout auth-layout-single">
          <section className="auth-panel login-card login-card-extended">
            <div className="login-card-header">
              <p className="brand-kicker">Registro</p>
              <h1>Crea tu cuenta</h1>
              <p>Registrate para guardar tu carrito y comprar de forma mas rapida en {SITE.name}.</p>
            </div>

            {error && <div className="message-box message-box-error">{error}</div>}
            {success && <div className="message-box auth-success-box">{success}</div>}

            <form className="login-form" onSubmit={handleSubmit}>
              <label htmlFor="register-name">Nombre</label>
              <input
                id="register-name"
                type="text"
                placeholder="Nombre del usuario"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />

              <label htmlFor="register-email">Correo electronico</label>
              <input
                id="register-email"
                type="email"
                placeholder="usuario@correo.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />

              <label htmlFor="register-password">Contrasena</label>
              <input
                id="register-password"
                type="password"
                placeholder="Minimo 6 caracteres"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />

              <button type="submit" disabled={submitting}>
                {submitting ? 'Creando tu cuenta...' : 'Crear cuenta'}
              </button>
            </form>

            <Link to="/login" className="login-back-link">
              Volver a iniciar sesion
            </Link>
          </section>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
