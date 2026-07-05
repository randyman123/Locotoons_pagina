import { useState, useEffect, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SITE } from '../../config/site.config';
import { UserIcon, CartIcon } from '../ui/icons';

export function SiteHeader() {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const userLabel = auth.user?.email?.split('@')[0] ?? 'cliente';
  const [searchValue, setSearchValue] = useState('');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchValue(params.get('q') ?? '');
  }, [location.search]);

  useEffect(() => {
    setAccountMenuOpen(false);
  }, [location.pathname, location.search]);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams(location.search);
    const trimmedSearch = searchValue.trim();

    if (trimmedSearch) {
      params.set('q', trimmedSearch);
    } else {
      params.delete('q');
    }

    const nextQuery = params.toString();
    const basePath = location.pathname.startsWith('/category/') ? location.pathname : '/';
    navigate(`${basePath}${nextQuery ? `?${nextQuery}` : ''}#catalogo`);
  }

  return (
    <header className="site-header">
      <div className="brand-block">
        <p className="brand-kicker">{SITE.brandKicker}</p>
        <Link to="/" className="brand-mark">
          {SITE.name}
        </Link>
        <p className="brand-subtitle">{SITE.brandSubtitle}</p>
      </div>

      <form className="search-panel" onSubmit={handleSearchSubmit}>
        <label className="search-label" htmlFor="site-search">
          Buscar productos
        </label>
        <div className="search-row">
          <input
            id="site-search"
            className="search-input"
            type="search"
            placeholder={SITE.searchPlaceholder}
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
          />
          <button className="search-button" type="submit">
            Buscar
          </button>
        </div>
      </form>

      <div className="header-tools" aria-label="Accesos de usuario y carrito">
        {auth.user ? (
          <div className="header-account-shell">
            <button
              type="button"
              className="header-account-button"
              aria-haspopup="menu"
              aria-expanded={accountMenuOpen}
              onClick={() => setAccountMenuOpen((current) => !current)}
              title={`Sesion iniciada como ${auth.user.email}`}
            >
              <span className="header-account-icon">
                <UserIcon />
              </span>
              <span className="header-account-copy">
                <span className="header-session-label">Sesion activa</span>
                <strong>{userLabel}</strong>
              </span>
            </button>

            {accountMenuOpen && (
              <div className="header-account-menu" role="menu" aria-label="Menu de cuenta">
                <Link to="/account" className="header-account-link" role="menuitem">
                  Mi cuenta
                </Link>
                <Link to="/orders" className="header-account-link" role="menuitem">
                  Mis ordenes
                </Link>
                {auth.user.role === 'admin' && (
                  <Link to="/admin" className="header-account-link" role="menuitem">
                    Panel admin
                  </Link>
                )}
                <button
                  type="button"
                  className="header-account-action"
                  role="menuitem"
                  onClick={() => {
                    auth.logout();
                    setAccountMenuOpen(false);
                  }}
                >
                  Cerrar sesion
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="header-guest-chip" aria-label="Compra como invitado">
              <span className="header-account-icon">
                <UserIcon />
              </span>
              <span className="header-account-copy">
                <span className="header-session-label">Invitado</span>
                <strong>Explora la tienda</strong>
              </span>
            </div>
            <Link to="/login" className="header-login-link" aria-label="Ir a iniciar sesion">
              Iniciar sesion
            </Link>
          </>
        )}
        <Link to="/cart" className="header-icon-link" aria-label="Ir al carrito">
          <CartIcon />
          {auth.cartCount > 0 && <span className="header-cart-count">{auth.cartCount}</span>}
        </Link>
      </div>
    </header>
  );
}
