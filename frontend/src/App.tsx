import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import axios from 'axios';
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import './App.css';

type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string;
};

type ProductCategory = {
  id: number;
  name: string;
  slug: string;
};

type Product = {
  id: number;
  title: string;
  slug: string;
  description: string;
  price: number | string;
  stock: number;
  imageUrl?: string;
  specifications?: Array<{ label: string; value: string }>;
  isVisible?: boolean;
  category?: ProductCategory | null;
};

type AdminProduct = Product & {
  isVisible: boolean;
};

type LoginResponse = {
  accessToken: string;
};

type RegisterResponse = {
  id: number;
  email: string;
  name: string;
  role?: string;
};

type AuthUser = {
  userId: number;
  email: string;
  role?: string;
};

type CartProduct = {
  id: number;
  title: string;
  slug: string;
  price: number | string;
  stock: number;
  imageUrl?: string;
  category?: ProductCategory | null;
};

type CartItem = {
  id: number | string;
  quantity: number;
  product: CartProduct;
};

type Cart = {
  id: number;
  userId: number;
  items: CartItem[];
};

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  authReady: boolean;
  cartCount: number;
  login: (nextToken: string) => void;
  logout: () => void;
  refreshCartCount: () => Promise<void>;
};

type CustomerProfile = {
  name: string;
  email: string;
  phone: string;
  shippingAddress: string;
};

type OrderItem = {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number | string;
};

type Order = {
  id: number;
  userId?: number | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  status: string;
  total: number | string;
  shippingAddress: string;
  createdAt: string;
  items: OrderItem[];
};

type ProductFormState = {
  id?: number;
  title: string;
  slug: string;
  description: string;
  price: string;
  stock: string;
  imageUrl: string;
  categoryId: string;
  isVisible: boolean;
  specificationsText: string;
};

const ADMIN_ORDER_STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'] as const;

const AUTH_TOKEN_KEY = 'locotoons_auth_token';
const STOREFRONT_REFRESH_EVENT = 'locotoons:storefront-refresh';
const CART_REFRESH_EVENT = 'locotoons:cart-refresh';
const GUEST_CART_KEY = 'locotoons_guest_cart';
const CUSTOMER_PROFILE_KEY = 'locotoons_customer_profile';
const WHATSAPP_PHONE_NUMBER = '56912345678';
const STORE_CATEGORY_PRESETS = [
  {
    name: 'Pokémon',
    slug: 'pokemon',
    description: 'Figuras, cartas, peluches y coleccionables del universo Pokemon.',
  },
  {
    name: 'Digimon',
    slug: 'digimon',
    description: 'Productos, figuras y articulos para fans de Digimon.',
  },
  {
    name: 'Maquetas',
    slug: 'maquetas',
    description: 'Kits, modelos armables y piezas para coleccionistas y hobbistas.',
  },
  {
    name: 'Dragon Ball',
    slug: 'dragon-ball',
    description: 'Figuras, accesorios y coleccionables inspirados en Dragon Ball.',
  },
  {
    name: 'Star Wars',
    slug: 'star-wars',
    description: 'Coleccionables, figuras y articulos clasicos de Star Wars.',
  },
  {
    name: 'Anime',
    slug: 'anime',
    description: 'Merchandising, figuras y accesorios de tus series favoritas.',
  },
  {
    name: 'Ropa',
    slug: 'ropa',
    description: 'Poleras, chaquetas y prendas con estilo geek y otaku.',
  },
] as const;

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function decodeJwtPayload(token: string): AuthUser | null {
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

function formatPrice(value: number | string) {
  const amount = typeof value === 'string' ? Number(value) : value;
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function normalizeCategoryValue(value: string | undefined | null) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function normalizeProduct(product: Product): Product {
  return {
    ...product,
    description: product.description ?? '',
    imageUrl: product.imageUrl ?? undefined,
    specifications: Array.isArray(product.specifications) ? product.specifications : [],
    isVisible: product.isVisible ?? true,
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
        }
      : null,
  };
}

function normalizeCartProduct(product: CartProduct): CartProduct {
  return {
    ...product,
    imageUrl: product.imageUrl ?? undefined,
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
        }
      : null,
  };
}

function normalizeCart(cart: Cart | null): Cart | null {
  if (!cart) {
    return null;
  }

  return {
    ...cart,
    items: (cart.items ?? []).map((item) => ({
      ...item,
      product: normalizeCartProduct(item.product),
    })),
  };
}

function notifyStorefrontRefresh() {
  window.dispatchEvent(new CustomEvent(STOREFRONT_REFRESH_EVENT));
}

function notifyCartRefresh() {
  window.dispatchEvent(new CustomEvent(CART_REFRESH_EVENT));
}

function readGuestCart(): CartItem[] {
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

function writeGuestCart(items: CartItem[]) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  notifyCartRefresh();
}

function readCustomerProfile(): CustomerProfile {
  try {
    const storedValue = localStorage.getItem(CUSTOMER_PROFILE_KEY);
    if (!storedValue) {
      return {
        name: '',
        email: '',
        phone: '',
        shippingAddress: '',
      };
    }

    const parsedValue = JSON.parse(storedValue) as Partial<CustomerProfile>;
    return {
      name: parsedValue.name ?? '',
      email: parsedValue.email ?? '',
      phone: parsedValue.phone ?? '',
      shippingAddress: parsedValue.shippingAddress ?? '',
    };
  } catch {
    return {
      name: '',
      email: '',
      phone: '',
      shippingAddress: '',
    };
  }
}

function saveCustomerProfile(profile: CustomerProfile) {
  localStorage.setItem(CUSTOMER_PROFILE_KEY, JSON.stringify(profile));
}

function buildWhatsAppUrl(message: string) {
  return `https://wa.me/${WHATSAPP_PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
}

function buildSlug(value: string) {
  return normalizeCategoryValue(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createEmptyProductForm(): ProductFormState {
  return {
    title: '',
    slug: '',
    description: '',
    price: '',
    stock: '',
    imageUrl: '',
    categoryId: '',
    isVisible: true,
    specificationsText: '',
  };
}

function getOrderStatusLabel(status: string) {
  switch (status) {
    case 'pending':
      return 'Pendiente';
    case 'paid':
      return 'Pagada';
    case 'shipped':
      return 'Enviada';
    case 'delivered':
      return 'Entregada';
    case 'cancelled':
      return 'Cancelada';
    default:
      return status;
  }
}

function formatSpecificationsInput(specifications?: Array<{ label: string; value: string }>) {
  return (specifications ?? [])
    .map((specification) => `${specification.label}: ${specification.value}`)
    .join('\n');
}

function parseSpecificationsInput(value: string) {
  const rows = value
    .split('\n')
    .map((row) => row.trim())
    .filter(Boolean);

  return rows.map((row) => {
    const separatorIndex = row.indexOf(':');

    if (separatorIndex === -1) {
      throw new Error('Cada especificacion debe usar el formato "Etiqueta: Valor".');
    }

    const label = row.slice(0, separatorIndex).trim();
    const specificationValue = row.slice(separatorIndex + 1).trim();

    if (!label || !specificationValue) {
      throw new Error('Cada especificacion debe incluir etiqueta y valor.');
    }

    return {
      label,
      value: specificationValue,
    };
  });
}

function getCategoryPreset(category?: Pick<Category, 'name' | 'slug'> | Pick<ProductCategory, 'name' | 'slug'> | null) {
  if (!category) {
    return null;
  }

  const normalizedName = normalizeCategoryValue(category.name);
  const normalizedSlug = normalizeCategoryValue(category.slug);

  return (
    STORE_CATEGORY_PRESETS.find((preset) => {
      const presetName = normalizeCategoryValue(preset.name);
      const presetSlug = normalizeCategoryValue(preset.slug);

      return normalizedName === presetName || normalizedSlug === presetSlug;
    }) ?? null
  );
}

function getCategoryDisplayName(category?: Pick<Category, 'name' | 'slug'> | Pick<ProductCategory, 'name' | 'slug'> | null) {
  return getCategoryPreset(category)?.name ?? category?.name ?? 'Coleccion destacada';
}

function getCategoryDescription(category: Category) {
  return getCategoryPreset(category)?.description ?? category.description ?? 'Categoria disponible en la tienda.';
}

function sortStoreCategories(categories: Category[]) {
  return [...categories].sort((left, right) => {
    const leftIndex = STORE_CATEGORY_PRESETS.findIndex((preset) => preset.slug === left.slug);
    const rightIndex = STORE_CATEGORY_PRESETS.findIndex((preset) => preset.slug === right.slug);
    const normalizedLeftName = normalizeCategoryValue(left.name);
    const normalizedRightName = normalizeCategoryValue(right.name);
    const presetLeftByName = STORE_CATEGORY_PRESETS.findIndex(
      (preset) => normalizeCategoryValue(preset.name) === normalizedLeftName,
    );
    const presetRightByName = STORE_CATEGORY_PRESETS.findIndex(
      (preset) => normalizeCategoryValue(preset.name) === normalizedRightName,
    );
    const resolvedLeftIndex = leftIndex >= 0 ? leftIndex : presetLeftByName;
    const resolvedRightIndex = rightIndex >= 0 ? rightIndex : presetRightByName;

    if (resolvedLeftIndex === -1 && resolvedRightIndex === -1) {
      return left.name.localeCompare(right.name, 'es');
    }

    if (resolvedLeftIndex === -1) {
      return 1;
    }

    if (resolvedRightIndex === -1) {
      return -1;
    }

    return resolvedLeftIndex - resolvedRightIndex;
  });
}

function filterStoreProducts(products: Product[], categorySlug: string | null, searchValue: string) {
  const normalizedSearch = normalizeCategoryValue(searchValue);
  const normalizedCategorySlug = normalizeCategoryValue(categorySlug);

  return products.filter((product) => {
    if (product.isVisible === false) {
      return false;
    }

    const matchesCategory = normalizedCategorySlug
      ? normalizeCategoryValue(product.category?.slug) === normalizedCategorySlug
      : true;
    const matchesSearch = normalizedSearch
      ? [
          product.title,
          product.description,
          product.category?.name ?? '',
          ...(product.specifications ?? []).flatMap((specification) => [
            specification.label,
            specification.value,
          ]),
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch)
      : true;

    return matchesCategory && matchesSearch;
  });
}

function useStorefrontData() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStorefront() {
      try {
        setLoading(true);
        setError(null);

        const [categoriesResponse, productsResponse] = await Promise.all([
          api.get<Category[]>('/categories'),
          api.get<Product[]>('/products'),
        ]);

        if (cancelled) {
          return;
        }

        setCategories(categoriesResponse.data);
        setProducts(productsResponse.data.map(normalizeProduct));
      } catch {
        if (!cancelled) {
          setError('No pudimos cargar el catalogo en este momento. Intenta nuevamente en unos segundos.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadStorefront();

    function handleStorefrontRefresh() {
      void loadStorefront();
    }

    window.addEventListener(STOREFRONT_REFRESH_EVENT, handleStorefrontRefresh);

    return () => {
      cancelled = true;
      window.removeEventListener(STOREFRONT_REFRESH_EVENT, handleStorefrontRefresh);
    };
  }, []);

  const orderedCategories = sortStoreCategories(categories);
  const menuCategories = orderedCategories.length > 0 ? orderedCategories : STORE_CATEGORY_PRESETS;

  return {
    categories,
    products,
    loading,
    error,
    orderedCategories,
    menuCategories,
  };
}

function AuthProvider({ children }: { children: ReactNode }) {
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

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="message-box loading-box" role="status" aria-live="polite">
      <span className="loading-dot" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

type EmptyStateProps = {
  tag: string;
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
};

function EmptyState({ tag, title, description, action, compact = false }: EmptyStateProps) {
  return (
    <div className={compact ? 'empty-state-card compact-empty-state' : 'empty-state-card'}>
      <span className="hero-tag">{tag}</span>
      <h1>{title}</h1>
      <p>{description}</p>
      {action ? <div className="empty-state-actions">{action}</div> : null}
    </div>
  );
}

function PrivateRoute({ children }: { children: ReactNode }) {
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

function AdminRoute({ children }: { children: ReactNode }) {
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

function AdminProductImage({
  imageUrl,
  title,
  categoryName,
  compact = false,
}: {
  imageUrl?: string;
  title: string;
  categoryName: string;
  compact?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  const wrapperClassName = compact ? 'admin-image-preview compact-admin-image-preview' : 'admin-image-preview';

  return (
    <div className={wrapperClassName}>
      {imageUrl && !imageFailed ? (
        <img src={imageUrl} alt={title} onError={() => setImageFailed(true)} />
      ) : (
        <div className="admin-image-placeholder">
          <strong>{title}</strong>
          <span>{categoryName}</span>
        </div>
      )}
    </div>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12.75a4.88 4.88 0 1 0-4.87-4.88A4.88 4.88 0 0 0 12 12.75Zm0 2.25c-4.38 0-7.94 2.46-7.94 5.5a.75.75 0 0 0 .75.75h14.38a.75.75 0 0 0 .75-.75c0-3.04-3.56-5.5-7.94-5.5Z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8.25 20.25a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm8.25 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm-11-13.5h14.17a.75.75 0 0 1 .73.93l-1.44 6a.75.75 0 0 1-.73.57H8.13a.75.75 0 0 1-.73-.57L5.1 4.5H3.75a.75.75 0 0 1 0-1.5h1.94a.75.75 0 0 1 .73.57l.67 2.68Z" />
    </svg>
  );
}

function SiteHeader() {
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

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
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
        <p className="brand-kicker">Lo mejor del coleccionismo</p>
        <Link to="/" className="brand-mark">
          Locotoons
        </Link>
        <p className="brand-subtitle">Figuras, coleccionables, anime y regalos con estilo geek</p>
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
            placeholder="Busca figuras, mangas, accesorios..."
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

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-block">
        <strong>Locotoons</strong>
        <span>Tienda online de figuras, coleccionables, anime y regalos para fans de la cultura pop.</span>
        <span>Atencion cercana para ayudarte a elegir, reservar y comprar con confianza.</span>
      </div>
      <div className="footer-block">
        <strong>Contacto</strong>
        <a href="https://wa.me/56912345678" target="_blank" rel="noreferrer">
          WhatsApp: +56 9 1234 5678
        </a>
        <a href="https://instagram.com/locotoons" target="_blank" rel="noreferrer">
          Instagram: @locotoons
        </a>
        <a href="mailto:hola@locotoons.cl">Correo: hola@locotoons.cl</a>
      </div>
      <div className="footer-block">
        <strong>Tienda</strong>
        <span>Novedades, reservas y productos destacados cada semana.</span>
        <span>Compra online con carrito, pedidos y seguimiento de ordenes.</span>
      </div>
    </footer>
  );
}

function CategoryMenu({
  menuCategories,
  activeCategorySlug,
}: {
  menuCategories: ReadonlyArray<
    Pick<Category, 'name' | 'slug'> | (typeof STORE_CATEGORY_PRESETS)[number]
  >;
  activeCategorySlug?: string | null;
}) {
  return (
    <nav className="category-nav category-nav-home" aria-label="Categorias principales">
      <Link
        to="/#catalogo"
        className={!activeCategorySlug ? 'category-link category-link-active' : 'category-link'}
      >
        TODAS
      </Link>
      {menuCategories.map((category) => (
        <Link
          key={category.slug}
          to={`/category/${category.slug}#catalogo`}
          className={
            activeCategorySlug === category.slug
              ? 'category-link category-link-active'
              : 'category-link'
          }
        >
          {getCategoryDisplayName(category).toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}

function GlobalCategoryNav({ activeCategorySlug }: { activeCategorySlug?: string | null }) {
  return (
    <CategoryMenu
      menuCategories={STORE_CATEGORY_PRESETS}
      activeCategorySlug={activeCategorySlug}
    />
  );
}

function StorefrontSidebar({
  menuCategories,
  activeCategory,
}: {
  menuCategories: ReadonlyArray<
    Pick<Category, 'name' | 'slug' | 'description'> | (typeof STORE_CATEGORY_PRESETS)[number]
  >;
  activeCategory?: Pick<Category, 'name' | 'slug' | 'description'> | null;
}) {
  const auth = useAuth();
  const featuredLabel = activeCategory ? getCategoryDisplayName(activeCategory) : 'Locotoons';
  const featuredDescription =
    ('id' in (activeCategory ?? {}) && activeCategory
      ? getCategoryDescription(activeCategory as Category)
      : activeCategory?.description) ??
    'Explora productos seleccionados y novedades del catalogo.';

  return (
    <aside className="sidebar-column">
      {!auth.user && (
        <section className="sidebar-box login-box">
          <header className="sidebar-heading">Acceso clientes</header>
          <label className="sidebar-label" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            className="sidebar-input"
            type="email"
            placeholder="usuario@correo.com"
          />
          <label className="sidebar-label" htmlFor="login-password">
            Clave
          </label>
          <input
            id="login-password"
            className="sidebar-input"
            type="password"
            placeholder="********"
          />
          <Link to="/login" className="sidebar-button sidebar-button-link">
            Entrar a mi cuenta
          </Link>
          <p className="sidebar-help">Ingresa para revisar carrito, compras y pedidos.</p>
        </section>
      )}

      <section className="sidebar-box promo-box">
        <header className="sidebar-heading">Categorias visibles</header>
        <ul className="promo-list">
          {menuCategories.slice(0, 7).map((category) => (
            <li key={category.slug} id={`category-${category.slug}`}>
              <strong>{getCategoryDisplayName(category)}</strong>
              <span>{'id' in category ? getCategoryDescription(category as Category) : category.description}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="sidebar-box banner-box">
        <span className="promo-ribbon">Categoria destacada</span>
        <strong>{featuredLabel}</strong>
        <p>{featuredDescription}</p>
      </section>

      <section className="sidebar-box banner-box banner-box-secondary">
        <span className="promo-ribbon">Compra segura</span>
        <strong>Catalogo siempre actualizado</strong>
        <p>
          Tu menu, productos, carrito y ordenes quedan listos para trabajar con contenido real.
        </p>
      </section>
    </aside>
  );
}

function ProductCatalogSection({
  title,
  subtitle,
  products,
  loading,
  error,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: {
  title: string;
  subtitle: string;
  products: Product[];
  loading: boolean;
  error: string | null;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction: ReactNode;
}) {
  const featuredProducts = products.slice(0, 6);

  return (
    <section className="catalog-panel" id="catalogo">
      <header className="section-heading">
        <h2>{title}</h2>
        <span>{subtitle}</span>
      </header>

      {error && <div className="message-box message-box-error">{error}</div>}
      {!error && loading && <LoadingState message="Cargando productos del catalogo..." />}

      {!loading && !error && (
        <div className="product-grid">
          {featuredProducts.length > 0 ? (
            featuredProducts.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="product-card-link"
              >
                <article className="product-card">
                  <div className="product-thumb">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.title} />
                    ) : (
                      <span>{getCategoryDisplayName(product.category)}</span>
                    )}
                  </div>
                  <div className="product-body">
                    <span className="product-category">{getCategoryDisplayName(product.category)}</span>
                    <h3>{product.title}</h3>
                    <p>{product.description}</p>
                    <div className="product-footer">
                      <strong>{formatPrice(product.price)}</strong>
                      <span>Stock: {product.stock}</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))
          ) : (
            <EmptyState
              compact
              tag="Catalogo"
              title={emptyTitle}
              description={emptyDescription}
              action={emptyAction}
            />
          )}
        </div>
      )}
    </section>
  );
}

function HomePage() {
  const [searchParams] = useSearchParams();
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const { products, loading, error, orderedCategories, menuCategories } =
    useStorefrontData();

  const activeCategorySlug = searchParams.get('category');
  const activeSearch = searchParams.get('q')?.trim().toLowerCase() ?? '';
  const activeCategory = orderedCategories.find((category) => category.slug === activeCategorySlug);
  const filteredProducts = filterStoreProducts(products, activeCategorySlug, activeSearch);
  const heroProducts = filteredProducts.slice(0, 3);
  const heroSlides = STORE_CATEGORY_PRESETS.slice(0, 6).map((preset) => {
    const matchedProduct = [...products]
      .reverse()
      .find((product) => {
        const category = product.category;
        return (
          normalizeCategoryValue(category?.slug) === normalizeCategoryValue(preset.slug) ||
          normalizeCategoryValue(category?.name) === normalizeCategoryValue(preset.name)
        );
      });

    return {
      ...preset,
      product: matchedProduct ?? null,
    };
  });
  const currentHeroSlide = heroSlides[activeHeroSlide % Math.max(heroSlides.length, 1)];

  useEffect(() => {
    setActiveHeroSlide(0);
  }, [activeCategorySlug, activeSearch]);

  useEffect(() => {
    if (heroSlides.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveHeroSlide((current) => (current + 1) % heroSlides.length);
    }, 4000);

    return () => {
      window.clearInterval(timer);
    };
  }, [heroSlides.length]);

  return (
    <div className="store-shell">
      <div className="top-strip" />
      <SiteHeader />
      <GlobalCategoryNav activeCategorySlug={activeCategorySlug} />

      <main className="page-main">
        <section className="hero-layout">
          <div className="hero-column">
            <article className="hero-card">
              {currentHeroSlide && (
                <div className="hero-copy">
                  <div className="hero-copy-top">
                    <span className="hero-tag">Ultimas novedades</span>
                    <span className="hero-copy-counter">
                      {String((activeHeroSlide % heroSlides.length) + 1).padStart(2, '0')} / {String(heroSlides.length).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="hero-copy-body">
                    <div className="hero-copy-text">
                      <span className="hero-copy-kicker">{currentHeroSlide.name}</span>
                      <h1>Novedades y destacados para fans de {currentHeroSlide.name}</h1>
                      <p>{currentHeroSlide.description}</p>
                      <div className="hero-actions">
                        <Link
                          to={`/category/${currentHeroSlide.slug}#catalogo`}
                          className="hero-primary-link"
                        >
                          Ver novedades
                        </Link>
                        <span className="hero-secondary-note">
                          {currentHeroSlide.product
                            ? currentHeroSlide.product.title
                            : `Proximamente nuevos ingresos de ${currentHeroSlide.name}`}
                        </span>
                      </div>
                    </div>

                    <div className="hero-carousel-card">
                      <div className="hero-carousel-media">
                        {currentHeroSlide.product?.imageUrl ? (
                          <img
                            src={currentHeroSlide.product.imageUrl}
                            alt={currentHeroSlide.product.title}
                          />
                        ) : (
                          <div className="hero-carousel-placeholder">
                            <span>{currentHeroSlide.name}</span>
                          </div>
                        )}
                      </div>
                      <div className="hero-carousel-info">
                        <strong>
                          {currentHeroSlide.product?.title ?? `${currentHeroSlide.name} en destaque`}
                        </strong>
                        <p>
                          {currentHeroSlide.product?.description ??
                            `Espacio listo para mostrar tus ultimos ingresos y productos mas llamativos de ${currentHeroSlide.name}.`}
                        </p>
                        <div className="hero-carousel-meta">
                          <span>{currentHeroSlide.name}</span>
                          <strong>
                            {currentHeroSlide.product
                              ? formatPrice(currentHeroSlide.product.price)
                              : 'Nuevos ingresos'}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="hero-carousel-dots" aria-label="Navegacion del carrusel">
                    {heroSlides.map((slide, index) => (
                      <button
                        key={slide.slug}
                        type="button"
                        className={
                          index === activeHeroSlide
                            ? 'hero-carousel-dot hero-carousel-dot-active'
                            : 'hero-carousel-dot'
                        }
                        onClick={() => setActiveHeroSlide(index)}
                        aria-label={`Ver novedades de ${slide.name}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="hero-showcase">
                <div className="hero-showcase-header">
                  <strong>Novedades de la semana</strong>
                  <span>Seleccion rapida</span>
                </div>
                {heroProducts.length > 0 ? (
                  heroProducts.map((product, index) => (
                    <article key={product.id} className={`hero-product hero-product-${index + 1}`}>
                      <span className="hero-product-category">
                        {getCategoryDisplayName(product.category) ?? 'Seleccion destacada'}
                      </span>
                      <h2>{product.title}</h2>
                      <p>{product.description}</p>
                      <strong>{formatPrice(product.price)}</strong>
                    </article>
                  ))
                ) : (
                  <div className="hero-empty">
                    <strong>Vitrina en actualizacion</strong>
                    <p>Cuando agregues tus primeros productos e imagenes, esta vitrina se llenara automaticamente.</p>
                  </div>
                )}
              </div>
            </article>

            <ProductCatalogSection
              title={
                activeCategory
                  ? `Productos en ${getCategoryDisplayName(activeCategory)}`
                  : 'Productos destacados'
              }
              subtitle={
                activeSearch
                  ? `${filteredProducts.length} resultado(s) para "${searchParams.get('q')}"`
                  : activeCategory
                    ? `${filteredProducts.length} producto(s) en esta categoria`
                    : 'Explora los productos destacados de la tienda'
              }
              products={filteredProducts}
              loading={loading}
              error={error}
              emptyTitle={
                activeSearch
                  ? 'No encontramos productos para tu busqueda'
                  : activeCategory
                    ? `Aun no hay productos en ${getCategoryDisplayName(activeCategory)}`
                    : 'Aun no hay productos publicados'
              }
              emptyDescription={
                activeSearch
                  ? 'Prueba con otro nombre, cambia la categoria o vuelve a revisar mas tarde.'
                  : 'Cuando cargues tus productos reales, este espacio mostrara automaticamente el catalogo de tu tienda.'
              }
              emptyAction={
                <Link to="/#catalogo" className="product-detail-secondary-link">
                  Ver todo el catalogo
                </Link>
              }
            />
          </div>

          <StorefrontSidebar menuCategories={menuCategories} activeCategory={activeCategory} />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function CategoryPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { products, loading, error, orderedCategories, menuCategories } = useStorefrontData();
  const activeSearch = searchParams.get('q')?.trim().toLowerCase() ?? '';
  const activeCategory =
    orderedCategories.find((category) => category.slug === slug) ??
    STORE_CATEGORY_PRESETS.find((category) => category.slug === slug) ??
    null;
  const categoryProducts = filterStoreProducts(products, slug ?? null, activeSearch);
  const featuredProducts = categoryProducts.slice(0, 3);
  const leadProduct = featuredProducts[0] ?? null;

  return (
    <div className="store-shell">
      <div className="top-strip" />
      <SiteHeader />
      <GlobalCategoryNav activeCategorySlug={slug} />

      <main className="page-main">
        {!loading && !activeCategory ? (
          <EmptyState
            tag="Categoria"
            title="No encontramos esta categoria"
            description="Vuelve al catalogo principal o elige otra categoria del menu."
            action={
              <Link to="/" className="product-detail-secondary-link">
                Volver a la tienda
              </Link>
            }
          />
        ) : (
          <>
            <>
              <nav className="category-breadcrumb" aria-label="Breadcrumb">
                <Link to="/">Inicio</Link>
                <span>/</span>
                <span>
                  {activeCategory ? getCategoryDisplayName(activeCategory) : 'Categoria'}
                </span>
              </nav>

              <header className="category-page-header">
                <div className="category-page-copy">
                  <span className="hero-tag">Coleccion</span>
                  <h1>
                    {activeCategory
                      ? getCategoryDisplayName(activeCategory)
                      : 'Categoria de productos'}
                  </h1>
                  <p>
                    {activeCategory?.description ??
                      'Explora productos destacados, novedades y articulos recomendados de esta categoria.'}
                  </p>
                </div>
                <div className="category-page-meta">
                  <div>
                    <strong>{categoryProducts.length}</strong>
                    <span>Producto(s)</span>
                  </div>
                  <div>
                    <strong>{featuredProducts.length}</strong>
                    <span>Destacados</span>
                  </div>
                  <div>
                    <strong>{leadProduct ? formatPrice(leadProduct.price) : 'Demo'}</strong>
                    <span>{leadProduct ? 'Precio referencial' : 'Catalogo activo'}</span>
                  </div>
                </div>
              </header>
            </>

            <section className="hero-layout">
              <div className="hero-column">
              <article className="hero-card">
                <div className="hero-copy">
                  <div className="hero-copy-top">
                    <span className="hero-tag">Categoria</span>
                    <span className="hero-copy-counter">
                      {categoryProducts.length} producto(s)
                    </span>
                  </div>
                  <div className="hero-copy-body">
                    <div className="hero-copy-text">
                      <span className="hero-copy-kicker">
                        {activeCategory ? getCategoryDisplayName(activeCategory) : 'Categoria'}
                      </span>
                      <h1>
                        {activeCategory
                          ? `${getCategoryDisplayName(activeCategory)} en Locotoons`
                          : 'Categoria en Locotoons'}
                      </h1>
                      <p>
                        {activeCategory?.description ??
                          'Explora productos seleccionados de esta categoria dentro del catalogo.'}
                      </p>
                      <div className="hero-actions">
                        <a href="#catalogo" className="hero-primary-link">
                          Ver productos
                        </a>
                        <span className="hero-secondary-note">
                          {leadProduct
                            ? `Destacado: ${leadProduct.title}`
                            : 'Pronto habra mas novedades en esta categoria'}
                        </span>
                      </div>
                    </div>

                    <div className="hero-carousel-card">
                      <div className="hero-carousel-media">
                        {leadProduct?.imageUrl ? (
                          <img src={leadProduct.imageUrl} alt={leadProduct.title} />
                        ) : (
                          <div className="hero-carousel-placeholder">
                            <span>
                              {activeCategory ? getCategoryDisplayName(activeCategory) : 'Locotoons'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="hero-carousel-info">
                        <strong>
                          {leadProduct?.title ??
                            `Coleccion de ${activeCategory ? getCategoryDisplayName(activeCategory) : 'Locotoons'}`}
                        </strong>
                        <p>
                          {leadProduct?.description ??
                            'Aqui veras destacados, novedades y productos recomendados de esta categoria.'}
                        </p>
                        <div className="hero-carousel-meta">
                          <span>
                            {activeCategory ? getCategoryDisplayName(activeCategory) : 'Categoria'}
                          </span>
                          <strong>
                            {leadProduct ? formatPrice(leadProduct.price) : 'Disponibles'}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hero-showcase">
                  <div className="hero-showcase-header">
                    <strong>Lo mas visto en esta categoria</strong>
                    <span>Seleccion rapida</span>
                  </div>
                  {featuredProducts.length > 0 ? (
                    featuredProducts.map((product, index) => (
                      <article key={product.id} className={`hero-product hero-product-${index + 1}`}>
                        <span className="hero-product-category">
                          {getCategoryDisplayName(product.category)}
                        </span>
                        <h2>{product.title}</h2>
                        <p>{product.description}</p>
                        <strong>{formatPrice(product.price)}</strong>
                      </article>
                    ))
                  ) : (
                    <div className="hero-empty">
                      <strong>Categoria en actualizacion</strong>
                      <p>Cuando haya mas productos cargados, apareceran aqui automaticamente.</p>
                    </div>
                  )}
                </div>
              </article>

              <ProductCatalogSection
                title={
                  activeCategory
                    ? `Catalogo de ${getCategoryDisplayName(activeCategory)}`
                    : 'Catalogo de categoria'
                }
                subtitle={
                  activeSearch
                    ? `${categoryProducts.length} resultado(s) para "${searchParams.get('q')}"`
                    : `${categoryProducts.length} producto(s) disponibles`
                }
                products={categoryProducts}
                loading={loading}
                error={error}
                emptyTitle={
                  activeSearch
                    ? 'No encontramos productos para tu busqueda en esta categoria'
                    : `Aun no hay productos en ${activeCategory ? getCategoryDisplayName(activeCategory) : 'esta categoria'}`
                }
                emptyDescription={
                  activeSearch
                    ? 'Prueba con otro termino o vuelve al catalogo principal para seguir explorando.'
                    : 'Cuando cargues mas productos para esta categoria, apareceran aqui automaticamente.'
                }
                emptyAction={
                  <Link to="/" className="product-detail-secondary-link">
                    Volver a la tienda
                  </Link>
                }
              />
              </div>

              <StorefrontSidebar menuCategories={menuCategories} activeCategory={activeCategory} />
            </section>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/';

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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
            <h1>Ingresa a tu cuenta Locotoons</h1>
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

function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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
              <p>Registrate para guardar tu carrito y comprar de forma mas rapida en Locotoons.</p>
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

function CartPage() {
  const auth = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busyItemId, setBusyItemId] = useState<number | string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const isGuestMode = !auth.user;

  async function loadCart() {
    if (!auth.user) {
      setCart({
        id: 0,
        userId: 0,
        items: readGuestCart(),
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.get<Cart | null>(`/carts/${auth.user.userId}`);
      setCart(normalizeCart(response.data));
      await auth.refreshCartCount();
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        setError(
          (requestError.response?.data as { message?: string } | undefined)?.message ??
            'No pudimos cargar tu carrito. Intenta nuevamente en unos segundos.',
        );
      } else {
        setError('No pudimos cargar tu carrito. Intenta nuevamente en unos segundos.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const storedProfile = readCustomerProfile();
    setShippingAddress(storedProfile.shippingAddress || 'Av. Siempre Viva 123, Santiago');
    setGuestName(storedProfile.name);
    setGuestEmail(storedProfile.email);
    setGuestPhone(storedProfile.phone);
  }, []);

  useEffect(() => {
    void loadCart();
  }, [auth.user?.userId]);

  useEffect(() => {
    function handleCartRefresh() {
      void loadCart();
    }

    if (!auth.user) {
      window.addEventListener(CART_REFRESH_EVENT, handleCartRefresh);
    }

    return () => {
      window.removeEventListener(CART_REFRESH_EVENT, handleCartRefresh);
    };
  }, [auth.user?.userId]);

  async function updateItemQuantity(item: CartItem, nextQuantity: number) {
    if (nextQuantity < 1) {
      await removeItem(item.id);
      return;
    }

    if (nextQuantity > item.product.stock) {
      setError(`Solo hay ${item.product.stock} unidad(es) disponible(s) de "${item.product.title}".`);
      setSuccess(null);
      return;
    }

    try {
      setBusyItemId(item.id);
      setError(null);
      setSuccess(null);

      if (auth.user) {
        await api.patch(`/carts/${auth.user.userId}/items/${item.id}`, {
          quantity: nextQuantity,
        });
        await loadCart();
      } else {
        const nextItems = readGuestCart().map((guestItem) =>
          guestItem.id === item.id
            ? {
                ...guestItem,
                quantity: nextQuantity,
              }
            : guestItem,
        );
        writeGuestCart(nextItems);
        setCart({
          id: 0,
          userId: 0,
          items: nextItems,
        });
      }
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        setError(
          (requestError.response?.data as { message?: string } | undefined)?.message ??
            'No pudimos actualizar la cantidad del producto.',
        );
      } else {
        setError('No pudimos actualizar la cantidad del producto.');
      }
    } finally {
      setBusyItemId(null);
    }
  }

  async function removeItem(itemId: number | string) {
    try {
      setBusyItemId(itemId);
      setError(null);
      setSuccess(null);

      if (auth.user) {
        await api.delete(`/carts/${auth.user.userId}/items/${itemId}`);
        await loadCart();
      } else {
        const nextItems = readGuestCart().filter((item) => item.id !== itemId);
        writeGuestCart(nextItems);
        setCart({
          id: 0,
          userId: 0,
          items: nextItems,
        });
      }
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        setError(
          (requestError.response?.data as { message?: string } | undefined)?.message ??
            'No pudimos quitar ese producto del carrito.',
        );
      } else {
        setError('No pudimos quitar ese producto del carrito.');
      }
    } finally {
      setBusyItemId(null);
    }
  }

  function persistProfileIfNeeded() {
    saveCustomerProfile({
      name: auth.user?.email?.split('@')[0] ?? guestName.trim(),
      email: auth.user?.email ?? guestEmail.trim(),
      phone: guestPhone.trim(),
      shippingAddress: shippingAddress.trim(),
    });
  }

  const cartItems = cart?.items ?? [];
  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );
  const hasStockIssues = cartItems.some(
    (item) => item.product.stock <= 0 || item.quantity > item.product.stock,
  );
  const whatsappMessage =
    cartItems.length > 0
      ? `Hola, quiero comprar estos productos: ${cartItems
          .map(
            (item) =>
              `${item.product.title} (x${item.quantity}) ${formatPrice(
                Number(item.product.price) * item.quantity,
              )}`,
          )
          .join(', ')}. Total: ${formatPrice(subtotal)}`
      : 'Hola, quiero comprar en Locotoons.';

  async function handleCheckout() {
    if (cartItems.length === 0) {
      return;
    }

    if (!shippingAddress.trim()) {
      setError('Debes indicar una direccion de envio antes de finalizar la compra.');
      return;
    }

    if (isGuestMode && (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim())) {
      setError('Para comprar como invitado debes completar nombre, email y telefono.');
      return;
    }

    try {
      setCheckoutLoading(true);
      setError(null);
      setSuccess(null);

      await api.post('/orders', {
        customerName: isGuestMode ? guestName.trim() : undefined,
        customerEmail: isGuestMode ? guestEmail.trim() : undefined,
        customerPhone: guestPhone.trim() || undefined,
        shippingAddress,
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: Number(item.product.price),
        })),
      });

      if (auth.user) {
        const userId = auth.user.userId;
        await Promise.all(
          cartItems.map((item) => api.delete(`/carts/${userId}/items/${item.id}`)),
        );
        await loadCart();
      } else {
        writeGuestCart([]);
        setCart({
          id: 0,
          userId: 0,
          items: [],
        });
      }

      persistProfileIfNeeded();
      await auth.refreshCartCount();
      notifyStorefrontRefresh();
      setSuccess(
        auth.user
          ? 'Tu compra fue registrada correctamente. Ya puedes revisarla en Mis ordenes.'
          : 'Tu compra invitada fue registrada correctamente. Te contactaremos con los datos que indicaste.',
      );
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        const backendMessage =
          (requestError.response?.data as { message?: string } | undefined)?.message ??
          'No pudimos finalizar tu compra. Revisa tus datos e intenta nuevamente.';
        const stockError =
          backendMessage.toLowerCase().includes('stock') ||
          backendMessage.toLowerCase().includes('disponible');

        setError(
          stockError
            ? `${backendMessage} Actualizamos tu carrito para que revises las cantidades disponibles.`
            : backendMessage,
        );
      } else {
        setError('No pudimos finalizar tu compra. Revisa tus datos e intenta nuevamente.');
      }

      await loadCart();
      notifyStorefrontRefresh();
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="store-shell">
      <div className="top-strip" />
      <SiteHeader />

      <main className="page-main">
        <section className={isGuestMode ? 'cart-layout cart-layout-guest' : 'cart-layout'}>
          <div className="cart-main">
            <header className="section-heading">
              <h2>{isGuestMode ? 'Compra como invitado' : 'Carro de compra'}</h2>
              <span>
                {isGuestMode
                  ? 'Completa tus datos y finaliza sin crear cuenta'
                  : 'Tu seleccion actual lista para finalizar la compra'}
              </span>
            </header>

            {isGuestMode && (
              <div className="cart-guest-banner">
                <div>
                  <strong>Checkout rapido</strong>
                  <p>Puedes terminar tu compra ahora mismo o iniciar sesion para guardar tu historial.</p>
                </div>
                <div className="empty-state-actions">
                  <Link to="/login" className="product-detail-secondary-link">
                    Iniciar sesion
                  </Link>
                  <Link to="/register" className="product-detail-secondary-link">
                    Crear cuenta
                  </Link>
                </div>
              </div>
            )}

            {error && <div className="message-box message-box-error">{error}</div>}
            {success && <div className="message-box auth-success-box">{success}</div>}
            {loading && <LoadingState message="Cargando tu carrito..." />}

            {!loading && cartItems.length === 0 && (
              <EmptyState
                compact
                tag="Sin productos"
                title="Tu carrito esta vacio"
                description={
                  isGuestMode
                    ? 'Agrega productos desde el catalogo y podras comprar como invitado.'
                    : 'Agrega productos desde el catalogo y arma tu compra en pocos pasos.'
                }
                action={
                  <Link to="/" className="product-detail-secondary-link">
                    Volver al catalogo
                  </Link>
                }
              />
            )}

            {!loading && cartItems.length > 0 && (
              <div className="cart-table-shell">
                <div className="cart-table-head">
                  <span>Producto</span>
                  <span>Cantidad</span>
                  <span>Precio</span>
                  <span>Total</span>
                </div>

                <div className="cart-table-body">
                  {cartItems.map((item) => (
                    <article key={item.id} className="cart-row">
                      <div className="cart-product-cell">
                        <div className="cart-product-thumb">
                          {item.product.imageUrl ? (
                            <img src={item.product.imageUrl} alt={item.product.title} />
                          ) : (
                            <span>{getCategoryDisplayName(item.product.category)}</span>
                          )}
                        </div>
                        <div className="cart-product-copy">
                          <strong>{item.product.title}</strong>
                          <span>{getCategoryDisplayName(item.product.category)}</span>
                          <span>Stock disponible: {item.product.stock}</span>
                          <button
                            type="button"
                            className="cart-remove-button"
                            onClick={() => void removeItem(item.id)}
                            disabled={busyItemId === item.id}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                      <div className="cart-qty-cell">
                        <button
                          type="button"
                          onClick={() => void updateItemQuantity(item, item.quantity - 1)}
                          disabled={busyItemId === item.id}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => void updateItemQuantity(item, item.quantity + 1)}
                          disabled={busyItemId === item.id || item.quantity >= item.product.stock}
                        >
                          +
                        </button>
                      </div>
                      <div className="cart-price-cell">{formatPrice(item.product.price)}</div>
                      <div className="cart-total-cell">
                        {formatPrice(Number(item.product.price) * item.quantity)}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="cart-summary">
            <section className="cart-summary-card">
              <span className="promo-ribbon">{isGuestMode ? 'Checkout invitado' : 'Resumen'}</span>
              <h2>{isGuestMode ? 'Datos para tu compra' : 'Detalle del pedido'}</h2>

              {isGuestMode && (
                <>
                  <label className="cart-summary-label" htmlFor="guest-name">
                    Nombre
                  </label>
                  <input
                    id="guest-name"
                    className="cart-summary-input"
                    type="text"
                    value={guestName}
                    onChange={(event) => setGuestName(event.target.value)}
                    placeholder="Nombre y apellido"
                  />
                  <label className="cart-summary-label" htmlFor="guest-email">
                    Email
                  </label>
                  <input
                    id="guest-email"
                    className="cart-summary-input"
                    type="email"
                    value={guestEmail}
                    onChange={(event) => setGuestEmail(event.target.value)}
                    placeholder="cliente@correo.com"
                  />
                  <label className="cart-summary-label" htmlFor="guest-phone">
                    Telefono
                  </label>
                  <input
                    id="guest-phone"
                    className="cart-summary-input"
                    type="tel"
                    value={guestPhone}
                    onChange={(event) => setGuestPhone(event.target.value)}
                    placeholder="+56 9 1234 5678"
                  />
                </>
              )}

              <label className="cart-summary-label" htmlFor="shipping-address">
                Direccion de envio
              </label>
              <textarea
                id="shipping-address"
                className="cart-summary-textarea"
                value={shippingAddress}
                onChange={(event) => setShippingAddress(event.target.value)}
              />

              {!isGuestMode && (
                <div className="cart-inline-actions">
                  <button
                    type="button"
                    className="product-detail-secondary-button"
                    onClick={() => {
                      persistProfileIfNeeded();
                      setSuccess('Tu direccion quedo guardada para futuras compras.');
                    }}
                  >
                    Guardar direccion
                  </button>
                </div>
              )}

              <div className="summary-line">
                <span>Subtotal</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <div className="summary-line">
                <span>Envio</span>
                <strong>Por calcular</strong>
              </div>
              <div className="summary-line summary-line-total">
                <span>Total</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>

              <button
                type="button"
                className="product-detail-button cart-checkout-button"
                onClick={() => void handleCheckout()}
                disabled={checkoutLoading || cartItems.length === 0 || hasStockIssues}
              >
                {checkoutLoading ? 'Procesando tu compra...' : 'Finalizar compra'}
              </button>
              <a
                href={buildWhatsAppUrl(whatsappMessage)}
                target="_blank"
                rel="noreferrer"
                className="whatsapp-button"
              >
                Comprar por WhatsApp
              </a>
              <Link to="/" className="product-detail-secondary-link">
                Seguir comprando
              </Link>
            </section>
          </aside>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function AccountPage({ initialSection = 'profile' }: { initialSection?: 'profile' | 'orders' }) {
  const auth = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'profile' | 'orders'>(initialSection);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState(auth.user?.email ?? '');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileShippingAddress, setProfileShippingAddress] = useState('');

  useEffect(() => {
    const storedProfile = readCustomerProfile();
    setProfileName(storedProfile.name || auth.user?.email?.split('@')[0] || '');
    setProfileEmail(auth.user?.email ?? storedProfile.email);
    setProfilePhone(storedProfile.phone);
    setProfileShippingAddress(storedProfile.shippingAddress);
  }, [auth.user?.email]);

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get<Order[]>('/orders');
        if (!cancelled) {
          setOrders(response.data);
        }
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        if (axios.isAxiosError(requestError)) {
          setError(
            (requestError.response?.data as { message?: string } | undefined)?.message ??
              'No pudimos cargar tus ordenes en este momento.',
          );
        } else {
          setError('No pudimos cargar tus ordenes en este momento.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadOrders();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="store-shell">
      <div className="top-strip" />
      <SiteHeader />
      <GlobalCategoryNav />

      <main className="page-main">
        <section className="account-layout">
          <aside className="account-sidebar">
            <div className="account-sidebar-card">
              <span className="hero-tag">Mi cuenta</span>
              <h2>{auth.user?.email ?? 'Cliente Locotoons'}</h2>
              <p>Desde aqui puedes revisar tus datos guardados y el historial de compras.</p>
              <div className="account-sidebar-actions">
                <button
                  type="button"
                  className={activeSection === 'profile' ? 'account-tab account-tab-active' : 'account-tab'}
                  onClick={() => setActiveSection('profile')}
                >
                  Perfil
                </button>
                <button
                  type="button"
                  className={activeSection === 'orders' ? 'account-tab account-tab-active' : 'account-tab'}
                  onClick={() => setActiveSection('orders')}
                >
                  Mis ordenes
                </button>
              </div>
            </div>
          </aside>

          <div className="account-content">
            {activeSection === 'profile' && (
              <section className="orders-layout">
                <header className="section-heading">
                  <h2>Perfil y envio</h2>
                  <span>Datos guardados para acelerar tu proxima compra</span>
                </header>

                {profileMessage && <div className="message-box auth-success-box">{profileMessage}</div>}

                <article className="account-profile-card">
                  <label className="cart-summary-label" htmlFor="profile-name">
                    Nombre
                  </label>
                  <input
                    id="profile-name"
                    className="cart-summary-input"
                    type="text"
                    value={profileName}
                    onChange={(event) => setProfileName(event.target.value)}
                  />
                  <label className="cart-summary-label" htmlFor="profile-email">
                    Email
                  </label>
                  <input
                    id="profile-email"
                    className="cart-summary-input"
                    type="email"
                    value={profileEmail}
                    onChange={(event) => setProfileEmail(event.target.value)}
                  />
                  <label className="cart-summary-label" htmlFor="profile-phone">
                    Telefono
                  </label>
                  <input
                    id="profile-phone"
                    className="cart-summary-input"
                    type="tel"
                    value={profilePhone}
                    onChange={(event) => setProfilePhone(event.target.value)}
                  />
                  <label className="cart-summary-label" htmlFor="profile-address">
                    Direccion de envio
                  </label>
                  <textarea
                    id="profile-address"
                    className="cart-summary-textarea"
                    value={profileShippingAddress}
                    onChange={(event) => setProfileShippingAddress(event.target.value)}
                  />
                  <div className="cart-inline-actions">
                    <button
                      type="button"
                      className="product-detail-button"
                      onClick={() => {
                        saveCustomerProfile({
                          name: profileName.trim(),
                          email: profileEmail.trim(),
                          phone: profilePhone.trim(),
                          shippingAddress: profileShippingAddress.trim(),
                        });
                        setProfileMessage('Tus datos quedaron guardados para futuras compras.');
                      }}
                    >
                      Guardar datos
                    </button>
                  </div>
                </article>
              </section>
            )}

            {activeSection === 'orders' && (
              <section className="orders-layout">
                <header className="section-heading">
                  <h2>Mis ordenes</h2>
                  <span>Historial real de tus compras en Locotoons</span>
                </header>

                {loading && <LoadingState message="Cargando tus ordenes..." />}
                {error && <div className="message-box message-box-error">{error}</div>}

                {!loading && !error && orders.length === 0 && (
                  <EmptyState
                    compact
                    tag="Sin ordenes"
                    title="Aun no tienes compras registradas"
                    description="Cuando finalices tu primera compra, aqui veras el historial completo de tus pedidos."
                    action={
                      <Link to="/" className="product-detail-secondary-link">
                        Volver a la tienda
                      </Link>
                    }
                  />
                )}

                {!loading && !error && orders.length > 0 && (
                  <div className="orders-list">
                    {orders.map((order) => (
                      <article key={order.id} className="order-card">
                        <div className="order-card-header">
                          <div>
                            <span className="order-label">Orden #{order.id}</span>
                            <h3>{new Date(order.createdAt).toLocaleDateString('es-CL')}</h3>
                          </div>
                          <div className="order-summary-meta">
                            <span className="order-status">{order.status}</span>
                            <strong>{formatPrice(order.total)}</strong>
                          </div>
                        </div>

                        <div className="order-meta-grid">
                          <div>
                            <span className="order-label">Envio</span>
                            <p>{order.shippingAddress}</p>
                          </div>
                          <div>
                            <span className="order-label">Items</span>
                            <p>{order.items.length} producto(s)</p>
                          </div>
                        </div>

                        <div className="order-items-list">
                          {order.items.map((item) => (
                            <div key={item.id} className="order-item-row">
                              <span>Producto #{item.productId}</span>
                              <span>Cant: {item.quantity}</span>
                              <strong>{formatPrice(Number(item.unitPrice) * item.quantity)}</strong>
                            </div>
                          ))}
                        </div>

                        <div className="order-actions">
                          <Link to={`/orders/${order.id}`} className="product-detail-secondary-link">
                            Ver detalle de orden
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function OrderDetailPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOrder() {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get<Order>(`/orders/${orderId}`);
        if (!cancelled) {
          setOrder(response.data);
        }
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        if (axios.isAxiosError(requestError)) {
          setError(
            (requestError.response?.data as { message?: string } | undefined)?.message ??
              'No pudimos cargar el detalle de esta orden.',
          );
        } else {
          setError('No pudimos cargar el detalle de esta orden.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (orderId) {
      void loadOrder();
    }

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return (
    <div className="store-shell">
      <div className="top-strip" />
      <SiteHeader />
      <GlobalCategoryNav />

      <main className="page-main">
        <section className="orders-layout">
          <div className="product-detail-toolbar">
            <Link to="/orders" className="login-back-link">
              Volver a mis ordenes
            </Link>
          </div>

          {loading && <LoadingState message="Cargando el detalle de tu orden..." />}
          {error && <div className="message-box message-box-error">{error}</div>}

          {!loading && order && (
            <article className="order-card order-detail-card">
              <div className="order-card-header">
                <div>
                  <span className="order-label">Orden #{order.id}</span>
                  <h3>{new Date(order.createdAt).toLocaleDateString('es-CL')}</h3>
                </div>
                <div className="order-summary-meta">
                  <span className="order-status">{order.status}</span>
                  <strong>{formatPrice(order.total)}</strong>
                </div>
              </div>

              <div className="order-meta-grid">
                <div>
                  <span className="order-label">Fecha</span>
                  <p>{new Date(order.createdAt).toLocaleString('es-CL')}</p>
                </div>
                <div>
                  <span className="order-label">Estado</span>
                  <p>{order.status}</p>
                </div>
                <div>
                  <span className="order-label">Direccion de envio</span>
                  <p>{order.shippingAddress}</p>
                </div>
                <div>
                  <span className="order-label">Total</span>
                  <p>{formatPrice(order.total)}</p>
                </div>
              </div>

              <div className="order-items-list">
                {order.items.map((item) => (
                  <div key={item.id} className="order-item-row">
                    <span>Producto #{item.productId}</span>
                    <span>Cantidad: {item.quantity}</span>
                    <strong>{formatPrice(Number(item.unitPrice) * item.quantity)}</strong>
                  </div>
                ))}
              </div>
            </article>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<'overview' | 'products' | 'orders'>('overview');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [productForm, setProductForm] = useState<ProductFormState>(createEmptyProductForm());
  const [productsLoading, setProductsLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [productBusyId, setProductBusyId] = useState<number | null>(null);
  const [orderBusyId, setOrderBusyId] = useState<number | null>(null);
  const [productMessage, setProductMessage] = useState<string | null>(null);
  const [orderMessage, setOrderMessage] = useState<string | null>(null);
  const [productError, setProductError] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productVisibilityFilter, setProductVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [productStockFilter, setProductStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [groupProductsByCategory, setGroupProductsByCategory] = useState(true);

  async function loadAdminProducts() {
    try {
      setProductsLoading(true);
      setProductError(null);

      const [categoriesResponse, productsResponse] = await Promise.all([
        api.get<Category[]>('/categories'),
        api.get<AdminProduct[]>('/products/admin/all'),
      ]);

      setCategories(sortStoreCategories(categoriesResponse.data));
      setProducts(productsResponse.data.map((product) => normalizeProduct(product) as AdminProduct));
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        setProductError(
          (requestError.response?.data as { message?: string } | undefined)?.message ??
            'No pudimos cargar los productos del panel admin.',
        );
      } else {
        setProductError('No pudimos cargar los productos del panel admin.');
      }
    } finally {
      setProductsLoading(false);
    }
  }

  async function loadAdminOrders(preserveSelected = true) {
    try {
      setOrdersLoading(true);
      setOrderError(null);

      const response = await api.get<Order[]>('/orders');
      setOrders(response.data);

      if (preserveSelected && selectedOrder) {
        const refreshedOrder =
          response.data.find((order) => order.id === selectedOrder.id) ?? null;
        setSelectedOrder(refreshedOrder);
      }
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        setOrderError(
          (requestError.response?.data as { message?: string } | undefined)?.message ??
            'No pudimos cargar las ordenes del panel admin.',
        );
      } else {
        setOrderError('No pudimos cargar las ordenes del panel admin.');
      }
    } finally {
      setOrdersLoading(false);
    }
  }

  useEffect(() => {
    void loadAdminProducts();
    void loadAdminOrders(false);
  }, []);

  const visibleProducts = products.filter((product) => product.isVisible !== false);
  const hiddenProducts = products.filter((product) => product.isVisible === false);
  const lowStockProducts = visibleProducts.filter(
    (product) => product.stock > 0 && product.stock <= 5,
  );
  const pendingOrders = orders.filter((order) => order.status === 'pending');
  const normalizedProductSearch = normalizeCategoryValue(productSearch);
  const filteredProducts = products.filter((product) => {
    const matchesSearch = normalizedProductSearch
      ? [product.title, product.slug, product.description]
          .join(' ')
          .toLowerCase()
          .includes(normalizedProductSearch)
      : true;
    const matchesCategory =
      productCategoryFilter === 'all'
        ? true
        : String(product.category?.id ?? '') === productCategoryFilter;
    const matchesVisibility =
      productVisibilityFilter === 'all'
        ? true
        : productVisibilityFilter === 'visible'
          ? product.isVisible !== false
          : product.isVisible === false;
    const matchesStock =
      productStockFilter === 'all'
        ? true
        : productStockFilter === 'low'
          ? product.stock > 0 && product.stock <= 5
          : product.stock <= 0;

    return matchesSearch && matchesCategory && matchesVisibility && matchesStock;
  });
  const groupedProducts = categories
    .map((category) => ({
      category,
      products: filteredProducts.filter((product) => product.category?.id === category.id),
    }))
    .filter((group) => group.products.length > 0);
  const uncategorizedProducts = filteredProducts.filter((product) => !product.category?.id);

  function resetProductForm() {
    setProductForm(createEmptyProductForm());
  }

  function openCreateProductForm() {
    resetProductForm();
    setProductMessage(null);
    setProductError(null);
    setActiveSection('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleProductFormChange<K extends keyof ProductFormState>(
    key: K,
    value: ProductFormState[K],
  ) {
    setProductForm((current) => {
      if (key === 'title') {
        const nextTitle = String(value);
        const shouldRefreshSlug = !current.slug || current.slug === buildSlug(current.title);

        return {
          ...current,
          title: nextTitle,
          slug: shouldRefreshSlug ? buildSlug(nextTitle) : current.slug,
        };
      }

      return {
        ...current,
        [key]: value,
      };
    });
  }

  function startEditingProduct(product: AdminProduct) {
    setProductMessage(null);
    setProductError(null);
    setProductForm({
      id: product.id,
      title: product.title,
      slug: product.slug,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
      imageUrl: product.imageUrl ?? '',
      categoryId: product.category?.id ? String(product.category.id) : '',
      isVisible: product.isVisible !== false,
      specificationsText: formatSpecificationsInput(product.specifications),
    });
    setActiveSection('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleProductSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    let specifications: Array<{ label: string; value: string }> = [];

    try {
      specifications = parseSpecificationsInput(productForm.specificationsText);
    } catch (parseError) {
      setProductError(
        parseError instanceof Error
          ? parseError.message
          : 'No pudimos interpretar las especificaciones del producto.',
      );
      setProductMessage(null);
      return;
    }

    const payload = {
      title: productForm.title.trim(),
      slug: productForm.slug.trim() || buildSlug(productForm.title),
      description: productForm.description.trim(),
      price: Number(productForm.price),
      stock: Number(productForm.stock),
      imageUrl: productForm.imageUrl.trim() || undefined,
      categoryId: Number(productForm.categoryId),
      isVisible: productForm.isVisible,
      specifications,
    };

    if (
      !payload.title ||
      !payload.slug ||
      !payload.description ||
      !productForm.categoryId ||
      Number.isNaN(payload.price) ||
      Number.isNaN(payload.stock)
    ) {
      setProductError('Completa titulo, slug, descripcion, categoria, precio y stock.');
      setProductMessage(null);
      return;
    }

    try {
      setProductSubmitting(true);
      setProductError(null);
      setProductMessage(null);

      if (productForm.id) {
        await api.patch(`/products/${productForm.id}`, payload);
        setProductMessage('Producto actualizado correctamente.');
      } else {
        await api.post('/products', payload);
        setProductMessage('Producto creado correctamente.');
      }

      resetProductForm();
      await loadAdminProducts();
      notifyStorefrontRefresh();
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        setProductError(
          (requestError.response?.data as { message?: string } | undefined)?.message ??
            'No pudimos guardar el producto.',
        );
      } else {
        setProductError('No pudimos guardar el producto.');
      }
    } finally {
      setProductSubmitting(false);
    }
  }

  async function handleToggleVisibility(product: AdminProduct) {
    const actionLabel = product.isVisible ? 'ocultar' : 'mostrar';
    const confirmed = window.confirm(
      `Vas a ${actionLabel} "${product.title}" en la tienda publica. Deseas continuar?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setProductBusyId(product.id);
      setProductError(null);
      setProductMessage(null);
      await api.patch(`/products/${product.id}`, {
        isVisible: product.isVisible === false,
      });
      setProductMessage(
        product.isVisible === false
          ? 'Producto visible nuevamente en la tienda.'
          : 'Producto ocultado del catalogo publico.',
      );
      await loadAdminProducts();
      notifyStorefrontRefresh();
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        setProductError(
          (requestError.response?.data as { message?: string } | undefined)?.message ??
            'No pudimos actualizar la visibilidad del producto.',
        );
      } else {
        setProductError('No pudimos actualizar la visibilidad del producto.');
      }
    } finally {
      setProductBusyId(null);
    }
  }

  async function handleDeleteProduct(product: AdminProduct) {
    const confirmed = window.confirm(
      `Vas a intentar eliminar "${product.title}". Si tiene carritos u ordenes asociadas, se ocultara en lugar de borrarse. Deseas continuar?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setProductBusyId(product.id);
      setProductError(null);
      setProductMessage(null);
      await api.delete(`/products/${product.id}`);
      setProductMessage('Producto eliminado correctamente del catalogo admin.');
      await loadAdminProducts();
      notifyStorefrontRefresh();
    } catch (requestError) {
      if (axios.isAxiosError(requestError) && requestError.response?.status === 409) {
        try {
          await api.patch(`/products/${product.id}`, {
            isVisible: false,
          });
          setProductMessage(
            'El producto tenia relaciones activas y no se pudo borrar. Lo ocultamos del catalogo publico para proteger las ordenes existentes.',
          );
          await loadAdminProducts();
          notifyStorefrontRefresh();
          return;
        } catch {
          setProductError(
            'No se pudo eliminar el producto y tampoco fue posible ocultarlo automaticamente.',
          );
          return;
        }
      }

      if (axios.isAxiosError(requestError)) {
        setProductError(
          (requestError.response?.data as { message?: string } | undefined)?.message ??
            'No pudimos eliminar el producto.',
        );
      } else {
        setProductError('No pudimos eliminar el producto.');
      }
    } finally {
      setProductBusyId(null);
    }
  }

  async function handleSelectOrder(orderId: number) {
    try {
      setOrderBusyId(orderId);
      setOrderError(null);

      const response = await api.get<Order>(`/orders/${orderId}`);
      setSelectedOrder(response.data);
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        setOrderError(
          (requestError.response?.data as { message?: string } | undefined)?.message ??
            'No pudimos cargar el detalle de la orden.',
        );
      } else {
        setOrderError('No pudimos cargar el detalle de la orden.');
      }
    } finally {
      setOrderBusyId(null);
    }
  }

  async function handleStatusChange(orderId: number, status: string) {
    try {
      setOrderBusyId(orderId);
      setOrderError(null);
      setOrderMessage(null);

      const response = await api.patch<Order>(`/orders/${orderId}/status`, { status });
      const updatedOrder = response.data;

      setOrders((current) =>
        current.map((order) => (order.id === orderId ? updatedOrder : order)),
      );
      setSelectedOrder((current) => (current?.id === orderId ? updatedOrder : current));
      setOrderMessage(`Estado actualizado a ${getOrderStatusLabel(updatedOrder.status)}.`);
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        setOrderError(
          (requestError.response?.data as { message?: string } | undefined)?.message ??
            'No pudimos actualizar el estado de la orden.',
        );
      } else {
        setOrderError('No pudimos actualizar el estado de la orden.');
      }
    } finally {
      setOrderBusyId(null);
    }
  }

  function renderProductRow(product: AdminProduct) {
    const categoryName = getCategoryDisplayName(product.category);

    return (
      <article key={product.id} className="admin-product-row">
        <div className="admin-product-media">
          <AdminProductImage
            compact
            imageUrl={product.imageUrl}
            title={product.title}
            categoryName={categoryName}
          />
        </div>
        <div className="admin-product-copy">
          <div className="admin-product-topline">
            <span className="order-label">#{product.id}</span>
            <span className="admin-product-slug">/{product.slug}</span>
          </div>
          <h3>{product.title}</h3>
          <p>{product.description}</p>
          {product.specifications && product.specifications.length > 0 && (
            <span className="admin-product-specs-preview">
              {product.specifications
                .slice(0, 2)
                .map((specification) => `${specification.label}: ${specification.value}`)
                .join(' | ')}
            </span>
          )}
        </div>
        <div className="admin-product-meta-cell">{categoryName}</div>
        <div className="admin-product-meta-cell admin-product-meta-cell-strong">
          {formatPrice(product.price)}
        </div>
        <div className="admin-product-meta-cell">{product.stock}</div>
        <div className="admin-product-meta-cell">
          <span
            className={
              product.isVisible
                ? 'admin-visibility-badge'
                : 'admin-visibility-badge admin-visibility-badge-hidden'
            }
          >
            {product.isVisible ? 'Visible' : 'Oculto'}
          </span>
        </div>
        <div className="admin-product-actions">
          <button
            type="button"
            className="product-detail-secondary-button"
            onClick={() => startEditingProduct(product)}
            disabled={productBusyId === product.id}
          >
            Editar
          </button>
          <button
            type="button"
            className="product-detail-secondary-button"
            onClick={() => void handleToggleVisibility(product)}
            disabled={productBusyId === product.id}
          >
            {productBusyId === product.id ? 'Guardando...' : product.isVisible ? 'Ocultar' : 'Mostrar'}
          </button>
          <button
            type="button"
            className="product-detail-secondary-button admin-danger-button"
            onClick={() => void handleDeleteProduct(product)}
            disabled={productBusyId === product.id}
          >
            Eliminar
          </button>
        </div>
      </article>
    );
  }

  return (
    <div className="store-shell">
      <div className="top-strip" />
      <SiteHeader />

      <main className="page-main">
        <section className="account-layout admin-layout">
          <aside className="account-sidebar">
            <div className="account-sidebar-card admin-sidebar-card">
              <span className="hero-tag">Admin</span>
              <h2>Panel Locotoons</h2>
              <p>
                Gestiona productos, visibilidad del catalogo y estados de orden sin salir del
                sitio.
              </p>
              <div className="account-sidebar-actions">
                <button
                  type="button"
                  className={
                    activeSection === 'overview' ? 'account-tab account-tab-active' : 'account-tab'
                  }
                  onClick={() => setActiveSection('overview')}
                >
                  Resumen
                </button>
                <button
                  type="button"
                  className={
                    activeSection === 'products' ? 'account-tab account-tab-active' : 'account-tab'
                  }
                  onClick={() => setActiveSection('products')}
                >
                  Productos
                </button>
                <button
                  type="button"
                  className={
                    activeSection === 'orders' ? 'account-tab account-tab-active' : 'account-tab'
                  }
                  onClick={() => setActiveSection('orders')}
                >
                  Ordenes
                </button>
              </div>
            </div>
          </aside>

          <div className="account-content">
            {activeSection === 'overview' && (
              <section className="orders-layout">
                <header className="section-heading">
                  <h2>Resumen de la tienda</h2>
                  <span>Vista general del catalogo y del flujo comercial actual de Locotoons.</span>
                </header>

                <div className="admin-summary-grid">
                  <article className="admin-summary-card">
                    <span className="order-label">Total productos</span>
                    <strong>{products.length}</strong>
                    <p>Productos registrados en el panel.</p>
                  </article>
                  <article className="admin-summary-card">
                    <span className="order-label">Productos visibles</span>
                    <strong>{visibleProducts.length}</strong>
                    <p>Actualmente publicados en la tienda.</p>
                  </article>
                  <article className="admin-summary-card">
                    <span className="order-label">Productos ocultos</span>
                    <strong>{hiddenProducts.length}</strong>
                    <p>Ocultos del catalogo publico.</p>
                  </article>
                  <article className="admin-summary-card">
                    <span className="order-label">Ordenes pendientes</span>
                    <strong>{pendingOrders.length}</strong>
                    <p>Compras que aun necesitan gestion.</p>
                  </article>
                  <article className="admin-summary-card">
                    <span className="order-label">Stock bajo</span>
                    <strong>{lowStockProducts.length}</strong>
                    <p>Productos visibles con stock entre 1 y 5 unidades.</p>
                  </article>
                </div>

                <div className="admin-overview-layout">
                  <section className="admin-panel-card">
                    <div className="admin-panel-card-header">
                      <div>
                        <span className="order-label">Accesos rapidos</span>
                        <h3>Acciones frecuentes</h3>
                      </div>
                    </div>

                    <div className="admin-quick-actions">
                      <button
                        type="button"
                        className="product-detail-button"
                        onClick={openCreateProductForm}
                      >
                        Crear producto
                      </button>
                      <button
                        type="button"
                        className="product-detail-secondary-button"
                        onClick={() => setActiveSection('orders')}
                      >
                        Revisar ordenes pendientes
                      </button>
                      <button
                        type="button"
                        className="product-detail-secondary-button"
                        onClick={() => setActiveSection('products')}
                      >
                        Ver catalogo admin
                      </button>
                    </div>
                  </section>

                  <section className="admin-panel-card">
                    <div className="admin-panel-card-header">
                      <div>
                        <span className="order-label">Alertas</span>
                        <h3>Stock bajo</h3>
                      </div>
                    </div>

                    {productsLoading ? (
                      <LoadingState message="Calculando alertas del inventario..." />
                    ) : lowStockProducts.length > 0 ? (
                      <div className="admin-inline-list">
                        {lowStockProducts.slice(0, 6).map((product) => (
                          <div key={product.id} className="admin-inline-item">
                            <div>
                              <strong>{product.title}</strong>
                              <span>{getCategoryDisplayName(product.category)}</span>
                            </div>
                            <span className="admin-inline-emphasis">{product.stock} un.</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        compact
                        tag="Inventario"
                        title="Sin alertas de stock bajo"
                        description="Tus productos visibles tienen inventario suficiente por ahora."
                      />
                    )}
                  </section>
                </div>
              </section>
            )}

            {activeSection === 'products' && (
              <section className="orders-layout">
                <header className="section-heading">
                  <h2>Gestion de productos</h2>
                  <span>Crea, edita y controla que productos quedan visibles en la tienda.</span>
                </header>

                {productError && <div className="message-box message-box-error">{productError}</div>}
                {productMessage && <div className="message-box auth-success-box">{productMessage}</div>}

                <div className="admin-toolbar">
                  <button
                    type="button"
                    className="product-detail-button"
                    onClick={openCreateProductForm}
                  >
                    Crear producto
                  </button>
                  <span className="admin-toolbar-note">
                    Total: {products.length} | Visibles: {visibleProducts.length} | Ocultos:{' '}
                    {hiddenProducts.length}
                  </span>
                </div>

                <section className="admin-panel-card">
                  <div className="admin-panel-card-header">
                    <div>
                      <span className="order-label">Filtros del catalogo</span>
                      <h3>Encuentra y ordena productos rapidamente</h3>
                    </div>
                  </div>

                  <div className="admin-filters-grid">
                    <div>
                      <label className="cart-summary-label" htmlFor="admin-product-search">
                        Buscar por nombre o slug
                      </label>
                      <input
                        id="admin-product-search"
                        className="cart-summary-input"
                        type="search"
                        value={productSearch}
                        onChange={(event) => setProductSearch(event.target.value)}
                        placeholder="Ej: pikachu o figura-pikachu"
                      />
                    </div>
                    <div>
                      <label
                        className="cart-summary-label"
                        htmlFor="admin-product-filter-category"
                      >
                        Categoria
                      </label>
                      <select
                        id="admin-product-filter-category"
                        className="cart-summary-input"
                        value={productCategoryFilter}
                        onChange={(event) => setProductCategoryFilter(event.target.value)}
                      >
                        <option value="all">Todas</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {getCategoryDisplayName(category)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        className="cart-summary-label"
                        htmlFor="admin-product-filter-visibility"
                      >
                        Visibilidad
                      </label>
                      <select
                        id="admin-product-filter-visibility"
                        className="cart-summary-input"
                        value={productVisibilityFilter}
                        onChange={(event) =>
                          setProductVisibilityFilter(
                            event.target.value as 'all' | 'visible' | 'hidden',
                          )
                        }
                      >
                        <option value="all">Todos</option>
                        <option value="visible">Solo visibles</option>
                        <option value="hidden">Solo ocultos</option>
                      </select>
                    </div>
                    <div>
                      <label className="cart-summary-label" htmlFor="admin-product-filter-stock">
                        Stock
                      </label>
                      <select
                        id="admin-product-filter-stock"
                        className="cart-summary-input"
                        value={productStockFilter}
                        onChange={(event) =>
                          setProductStockFilter(event.target.value as 'all' | 'low' | 'out')
                        }
                      >
                        <option value="all">Todo stock</option>
                        <option value="low">Stock bajo</option>
                        <option value="out">Sin stock</option>
                      </select>
                    </div>
                  </div>

                  <label className="admin-checkbox-field" htmlFor="admin-group-by-category">
                    <input
                      id="admin-group-by-category"
                      type="checkbox"
                      checked={groupProductsByCategory}
                      onChange={(event) => setGroupProductsByCategory(event.target.checked)}
                    />
                    <span>Mostrar catalogo agrupado por categoria</span>
                  </label>

                  <span className="admin-filter-summary">
                    Mostrando {filteredProducts.length} de {products.length} producto(s).
                  </span>
                </section>

                <section className="admin-panel-card">
                  <div className="admin-panel-card-header">
                    <div>
                      <span className="order-label">
                        {productForm.id ? 'Edicion de producto' : 'Nuevo producto'}
                      </span>
                      <h3>{productForm.id ? `Producto #${productForm.id}` : 'Crear producto'}</h3>
                    </div>
                    {productForm.id && (
                      <button
                        type="button"
                        className="product-detail-secondary-button"
                        onClick={resetProductForm}
                      >
                        Cancelar edicion
                      </button>
                    )}
                  </div>

                  <form className="admin-product-form" onSubmit={handleProductSubmit}>
                    <label className="cart-summary-label" htmlFor="admin-product-title">
                      Titulo
                    </label>
                    <input
                      id="admin-product-title"
                      className="cart-summary-input"
                      type="text"
                      value={productForm.title}
                      onChange={(event) => handleProductFormChange('title', event.target.value)}
                    />

                    <label className="cart-summary-label" htmlFor="admin-product-slug">
                      Slug
                    </label>
                    <input
                      id="admin-product-slug"
                      className="cart-summary-input"
                      type="text"
                      value={productForm.slug}
                      onChange={(event) => handleProductFormChange('slug', event.target.value)}
                    />

                    <label className="cart-summary-label" htmlFor="admin-product-category">
                      Categoria
                    </label>
                    <select
                      id="admin-product-category"
                      className="cart-summary-input"
                      value={productForm.categoryId}
                      onChange={(event) =>
                        handleProductFormChange('categoryId', event.target.value)
                      }
                    >
                      <option value="">Selecciona una categoria</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {getCategoryDisplayName(category)}
                        </option>
                      ))}
                    </select>

                    <label className="cart-summary-label" htmlFor="admin-product-price">
                      Precio
                    </label>
                    <input
                      id="admin-product-price"
                      className="cart-summary-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={productForm.price}
                      onChange={(event) => handleProductFormChange('price', event.target.value)}
                    />

                    <label className="cart-summary-label" htmlFor="admin-product-stock">
                      Stock
                    </label>
                    <input
                      id="admin-product-stock"
                      className="cart-summary-input"
                      type="number"
                      min="0"
                      step="1"
                      value={productForm.stock}
                      onChange={(event) => handleProductFormChange('stock', event.target.value)}
                    />

                    <label className="cart-summary-label" htmlFor="admin-product-image">
                      Image URL
                    </label>
                    <input
                      id="admin-product-image"
                      className="cart-summary-input"
                      type="url"
                      value={productForm.imageUrl}
                      onChange={(event) => handleProductFormChange('imageUrl', event.target.value)}
                      placeholder="https://sitio.com/imagen-producto.jpg"
                    />
                    <p className="admin-field-help">
                      Usa por ahora una URL publica de imagen en internet. Mas adelante podremos
                      conectar subida real de archivos desde el panel.
                    </p>

                    <label className="cart-summary-label" htmlFor="admin-product-description">
                      Descripcion
                    </label>
                    <textarea
                      id="admin-product-description"
                      className="cart-summary-textarea"
                      value={productForm.description}
                      onChange={(event) =>
                        handleProductFormChange('description', event.target.value)
                      }
                    />

                    <label
                      className="cart-summary-label"
                      htmlFor="admin-product-specifications"
                    >
                      Specifications
                    </label>
                    <textarea
                      id="admin-product-specifications"
                      className="cart-summary-textarea"
                      value={productForm.specificationsText}
                      onChange={(event) =>
                        handleProductFormChange('specificationsText', event.target.value)
                      }
                      placeholder={`Material: PVC\nAltura: 28 cm\nEdicion: Coleccionista`}
                    />

                    <label className="admin-checkbox-field" htmlFor="admin-product-visible">
                      <input
                        id="admin-product-visible"
                        type="checkbox"
                        checked={productForm.isVisible}
                        onChange={(event) =>
                          handleProductFormChange('isVisible', event.target.checked)
                        }
                      />
                      <span>Producto visible en catalogo</span>
                    </label>

                    <div className="cart-inline-actions">
                      <button
                        type="submit"
                        className="product-detail-button"
                        disabled={productSubmitting}
                      >
                        {productSubmitting
                          ? 'Guardando producto...'
                          : productForm.id
                            ? 'Actualizar producto'
                            : 'Crear producto'}
                      </button>
                    </div>
                  </form>

                  <div className="admin-image-preview-card">
                    <div className="admin-image-preview-copy">
                      <span className="order-label">Preview de imagen</span>
                      <strong>{productForm.title.trim() || 'Producto en preparacion'}</strong>
                      <p>
                        Asi se vera la referencia visual del producto mientras trabajamos solo con
                        `imageUrl`.
                      </p>
                    </div>
                    <AdminProductImage
                      imageUrl={productForm.imageUrl.trim() || undefined}
                      title={productForm.title.trim() || 'Producto Locotoons'}
                      categoryName={
                        categories.find(
                          (category) => String(category.id) === productForm.categoryId,
                        )?.name ?? 'Sin categoria'
                      }
                    />
                  </div>
                </section>

                <section className="admin-panel-card">
                  <div className="admin-panel-card-header">
                    <div>
                      <span className="order-label">Catalogo admin</span>
                      <h3>Productos registrados</h3>
                    </div>
                    <strong>{filteredProducts.length} producto(s)</strong>
                  </div>

                  {productsLoading && <LoadingState message="Cargando productos del panel..." />}
                  {!productsLoading && filteredProducts.length === 0 && (
                    <EmptyState
                      compact
                      tag="Productos"
                      title="No hay productos para los filtros actuales"
                      description="Prueba otro filtro o crea un producto nuevo desde este panel."
                    />
                  )}

                  {!productsLoading && filteredProducts.length > 0 && (
                    <div className="admin-table-shell">
                      {!groupProductsByCategory && (
                        <>
                          <div className="admin-table-head admin-product-table-head">
                            <span>Producto</span>
                            <span>Categoria</span>
                            <span>Precio</span>
                            <span>Stock</span>
                            <span>Estado</span>
                            <span>Acciones</span>
                          </div>
                          <div className="admin-product-list">
                            {filteredProducts.map((product) => renderProductRow(product))}
                          </div>
                        </>
                      )}

                      {groupProductsByCategory && (
                        <div className="admin-grouped-products">
                          {groupedProducts.map((group) => (
                            <details key={group.category.id} className="admin-category-group" open>
                              <summary>
                                <span>{getCategoryDisplayName(group.category)}</span>
                                <strong>{group.products.length} producto(s)</strong>
                              </summary>
                              <div className="admin-table-head admin-product-table-head">
                                <span>Producto</span>
                                <span>Categoria</span>
                                <span>Precio</span>
                                <span>Stock</span>
                                <span>Estado</span>
                                <span>Acciones</span>
                              </div>
                              <div className="admin-product-list">
                                {group.products.map((product) => renderProductRow(product))}
                              </div>
                            </details>
                          ))}

                          {uncategorizedProducts.length > 0 && (
                            <details className="admin-category-group" open>
                              <summary>
                                <span>Sin categoria</span>
                                <strong>{uncategorizedProducts.length} producto(s)</strong>
                              </summary>
                              <div className="admin-table-head admin-product-table-head">
                                <span>Producto</span>
                                <span>Categoria</span>
                                <span>Precio</span>
                                <span>Stock</span>
                                <span>Estado</span>
                                <span>Acciones</span>
                              </div>
                              <div className="admin-product-list">
                                {uncategorizedProducts.map((product) => renderProductRow(product))}
                              </div>
                            </details>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </section>
              </section>
            )}

            {activeSection === 'orders' && (
              <section className="orders-layout">
                <header className="section-heading">
                  <h2>Gestion de ordenes</h2>
                  <span>Revisa compras, detalle de clientes y cambia el estado de despacho.</span>
                </header>

                {orderError && <div className="message-box message-box-error">{orderError}</div>}
                {orderMessage && <div className="message-box auth-success-box">{orderMessage}</div>}

                {ordersLoading && <LoadingState message="Cargando ordenes del panel..." />}

                {!ordersLoading && orders.length === 0 && (
                  <EmptyState
                    compact
                    tag="Ordenes"
                    title="Aun no hay ordenes registradas"
                    description="Cuando entren compras reales o de prueba, apareceran aqui para administrarlas."
                  />
                )}

                {!ordersLoading && orders.length > 0 && (
                  <div className="admin-orders-layout">
                    <div className="admin-table-shell">
                      <div className="admin-table-head admin-orders-table-head">
                        <span>Orden</span>
                        <span>Cliente</span>
                        <span>Total</span>
                        <span>Estado</span>
                        <span>Acciones</span>
                      </div>
                      <div className="orders-list">
                        {orders.map((order) => (
                          <article key={order.id} className="order-card">
                            <div className="order-card-header">
                              <div>
                                <span className="order-label">Orden #{order.id}</span>
                                <h3>{new Date(order.createdAt).toLocaleDateString('es-CL')}</h3>
                              </div>
                              <div className="order-summary-meta">
                                <span className="order-status">
                                  {getOrderStatusLabel(order.status)}
                                </span>
                                <strong>{formatPrice(order.total)}</strong>
                              </div>
                            </div>

                            <div className="admin-order-summary-row">
                              <div>
                                <span className="order-label">Cliente</span>
                                <p>
                                  {order.customerName ??
                                    order.customerEmail ??
                                    `Usuario #${order.userId ?? 'N/A'}`}
                                </p>
                              </div>
                              <div>
                                <span className="order-label">Contacto</span>
                                <p>{order.customerPhone ?? order.customerEmail ?? 'Sin telefono'}</p>
                              </div>
                            </div>

                            <div className="order-actions admin-order-actions">
                              <button
                                type="button"
                                className="product-detail-secondary-button"
                                onClick={() => void handleSelectOrder(order.id)}
                                disabled={orderBusyId === order.id}
                              >
                                {orderBusyId === order.id && selectedOrder?.id !== order.id
                                  ? 'Cargando...'
                                  : 'Ver detalle'}
                              </button>
                              <select
                                className="admin-status-select"
                                value={order.status}
                                onChange={(event) =>
                                  void handleStatusChange(order.id, event.target.value)
                                }
                                disabled={orderBusyId === order.id}
                              >
                                {ADMIN_ORDER_STATUSES.map((status) => (
                                  <option key={status} value={status}>
                                    {getOrderStatusLabel(status)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>

                    <aside className="admin-order-detail">
                      <div className="admin-panel-card">
                        <div className="admin-panel-card-header">
                          <div>
                            <span className="order-label">Detalle de orden</span>
                            <h3>
                              {selectedOrder
                                ? `Orden #${selectedOrder.id}`
                                : 'Selecciona una orden'}
                            </h3>
                          </div>
                        </div>

                        {selectedOrder ? (
                          <div className="admin-order-detail-body">
                            <div className="order-meta-grid">
                              <div>
                                <span className="order-label">Estado</span>
                                <p>{getOrderStatusLabel(selectedOrder.status)}</p>
                              </div>
                              <div>
                                <span className="order-label">Total</span>
                                <p>{formatPrice(selectedOrder.total)}</p>
                              </div>
                              <div>
                                <span className="order-label">Cliente</span>
                                <p>
                                  {selectedOrder.customerName ??
                                    `Usuario #${selectedOrder.userId ?? 'N/A'}`}
                                </p>
                              </div>
                              <div>
                                <span className="order-label">Email</span>
                                <p>
                                  {selectedOrder.customerEmail ??
                                    'Cuenta registrada sin email invitado'}
                                </p>
                              </div>
                              <div>
                                <span className="order-label">Telefono</span>
                                <p>{selectedOrder.customerPhone ?? 'No informado'}</p>
                              </div>
                              <div>
                                <span className="order-label">Creada</span>
                                <p>
                                  {new Date(selectedOrder.createdAt).toLocaleString('es-CL')}
                                </p>
                              </div>
                            </div>

                            <div>
                              <span className="order-label">Direccion de envio</span>
                              <p className="admin-order-address">
                                {selectedOrder.shippingAddress}
                              </p>
                            </div>

                            <div className="order-items-list">
                              {selectedOrder.items.map((item) => (
                                <div key={item.id} className="order-item-row">
                                  <span>Producto #{item.productId}</span>
                                  <span>Cantidad: {item.quantity}</span>
                                  <strong>
                                    {formatPrice(Number(item.unitPrice) * item.quantity)}
                                  </strong>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <EmptyState
                            compact
                            tag="Detalle"
                            title="Selecciona una orden"
                            description="Veras aqui la direccion, cliente y productos incluidos."
                          />
                        )}
                      </div>
                    </aside>
                  </div>
                )}
              </section>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function ProductDetailPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { productId } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showCartPrompt, setShowCartPrompt] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get<Product>(`/products/${productId}`);
        if (!cancelled) {
          setProduct(normalizeProduct(response.data));
        }
      } catch {
        if (!cancelled) {
          setError('No pudimos cargar el detalle del producto.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (productId) {
      loadProduct();
    }

    return () => {
      cancelled = true;
    };
  }, [productId]);

  async function handleAddToCart() {
    if (!product) {
      return;
    }

    if (product.stock <= 0) {
      setCartMessage('Este producto no tiene stock disponible en este momento.');
      return;
    }

    try {
      setAddingToCart(true);
      setCartMessage(null);

      if (auth.user) {
        await api.post(`/carts/${auth.user.userId}/items`, {
          productId: product.id,
          quantity: 1,
        });
      } else {
        const guestCart = readGuestCart();
        const existingItem = guestCart.find((item) => item.product.id === product.id);
        const nextQuantity = (existingItem?.quantity ?? 0) + 1;

        if (nextQuantity > product.stock) {
          setCartMessage(`Solo quedan ${product.stock} unidad(es) disponibles para este producto.`);
          setShowCartPrompt(false);
          return;
        }

        const guestProduct: CartProduct = {
          id: product.id,
          title: product.title,
          slug: product.slug,
          price: product.price,
          stock: product.stock,
          imageUrl: product.imageUrl,
          category: product.category,
        };

        const nextItems = existingItem
          ? guestCart.map((item) =>
              item.product.id === product.id
                ? {
                    ...item,
                    quantity: nextQuantity,
                    product: guestProduct,
                  }
                : item,
            )
          : [
              ...guestCart,
              {
                id: `guest-${product.id}`,
                quantity: 1,
                product: guestProduct,
              },
            ];

        writeGuestCart(nextItems);
      }

      setCartMessage('Producto agregado correctamente a tu carrito.');
      setShowCartPrompt(true);
      await auth.refreshCartCount();
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        setCartMessage(
          (requestError.response?.data as { message?: string } | undefined)?.message ??
            'No pudimos agregar este producto al carrito.',
        );
      } else {
        setCartMessage('No pudimos agregar este producto al carrito.');
      }
      setShowCartPrompt(false);
    } finally {
      setAddingToCart(false);
    }
  }

  const whatsappMessage = product
    ? `Hola, quiero comprar este producto: ${product.title} (x1) Total: ${formatPrice(product.price)}`
    : 'Hola, quiero consultar por un producto de Locotoons.';

  return (
    <div className="store-shell">
      <div className="top-strip" />
      <SiteHeader />
      <GlobalCategoryNav />

      <main className="page-main">
        <section className="product-detail-shell">
          <div className="product-detail-toolbar">
            <Link to="/#catalogo" className="login-back-link">
              Volver al catalogo
            </Link>
          </div>

          {loading && <LoadingState message="Cargando el detalle del producto..." />}
          {!loading && error && <div className="message-box message-box-error">{error}</div>}

          {!loading && product && (
            <article className="product-detail-card">
              <div className="product-detail-media">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.title} />
                ) : (
                  <div className="product-detail-placeholder">
                    <span>{getCategoryDisplayName(product.category)}</span>
                  </div>
                )}
              </div>

              <div className="product-detail-info">
                <span className="product-detail-category">
                  {getCategoryDisplayName(product.category)}
                </span>
                <h1>{product.title}</h1>
                <strong className="product-detail-price">{formatPrice(product.price)}</strong>
                <p className="product-detail-stock">Stock disponible: {product.stock}</p>

                <section className="product-detail-description">
                  <h2>Descripcion</h2>
                  <p>{product.description}</p>
                </section>

                {product.specifications && product.specifications.length > 0 && (
                  <section className="product-detail-description">
                    <h2>Especificaciones</h2>
                    <div className="product-detail-specifications">
                      {product.specifications.map((specification) => (
                        <p key={`${specification.label}-${specification.value}`}>
                          <strong>{specification.label}:</strong> {specification.value}
                        </p>
                      ))}
                    </div>
                  </section>
                )}

                {cartMessage && (
                  <div
                    className={`message-box ${
                      cartMessage.toLowerCase().includes('no se pudo') ||
                      cartMessage.toLowerCase().includes('stock') ||
                      cartMessage.toLowerCase().includes('no existe')
                        ? 'message-box-error'
                        : 'auth-success-box'
                    }`}
                  >
                    {cartMessage}
                  </div>
                )}

                {showCartPrompt && (
                  <div className="product-cart-prompt">
                    <strong>Producto listo en tu carrito</strong>
                    <div className="product-cart-prompt-actions">
                      <button
                        type="button"
                        className="product-detail-button"
                        onClick={() => navigate('/cart')}
                      >
                        Comprar ahora
                      </button>
                      <button
                        type="button"
                        className="product-detail-secondary-button"
                        onClick={() => {
                          setShowCartPrompt(false);
                          setCartMessage(null);
                        }}
                      >
                        Seguir comprando
                      </button>
                    </div>
                  </div>
                )}

                <div className="product-detail-actions">
                  <button
                    type="button"
                    className="product-detail-button"
                    onClick={() => void handleAddToCart()}
                    disabled={addingToCart || product.stock <= 0}
                  >
                    {product.stock <= 0
                      ? 'Sin stock disponible'
                      : addingToCart
                        ? 'Agregando a tu carrito...'
                        : 'Agregar al carrito'}
                  </button>
                </div>
                <div className="product-detail-support-actions">
                  <a
                    href={buildWhatsAppUrl(whatsappMessage)}
                    target="_blank"
                    rel="noreferrer"
                    className="whatsapp-icon-link"
                    aria-label="Comprar por WhatsApp"
                    title="Comprar por WhatsApp"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.5 0 .18 5.3.18 11.84c0 2.08.54 4.1 1.57 5.88L0 24l6.49-1.7a11.93 11.93 0 0 0 5.57 1.42h.01c6.56 0 11.88-5.3 11.88-11.84 0-3.16-1.23-6.13-3.43-8.4Zm-8.46 18.2h-.01a9.96 9.96 0 0 1-5.08-1.39l-.36-.21-3.85 1 1.03-3.74-.24-.38a9.8 9.8 0 0 1-1.51-5.11c0-5.43 4.45-9.85 9.92-9.85 2.65 0 5.14 1.02 7.01 2.88a9.77 9.77 0 0 1 2.9 6.97c0 5.43-4.46 9.85-9.81 9.85Zm5.4-7.38c-.3-.15-1.79-.88-2.06-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.96 1.18-.18.2-.35.23-.65.08-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.79-1.68-2.09-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.63-.93-2.23-.25-.6-.5-.52-.68-.53h-.58c-.2 0-.53.08-.8.38-.28.3-1.05 1.03-1.05 2.5 0 1.48 1.08 2.91 1.23 3.11.15.2 2.11 3.21 5.11 4.5.71.31 1.27.49 1.7.63.71.22 1.36.19 1.88.11.57-.09 1.79-.73 2.04-1.44.25-.7.25-1.31.18-1.44-.07-.13-.27-.2-.57-.35Z" />
                    </svg>
                  </a>
                </div>
              </div>
            </article>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/category/:slug" element={<CategoryPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/account"
        element={
          <PrivateRoute>
            <AccountPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <PrivateRoute>
            <AccountPage initialSection="orders" />
          </PrivateRoute>
        }
      />
      <Route
        path="/orders/:orderId"
        element={
          <PrivateRoute>
            <OrderDetailPage />
          </PrivateRoute>
        }
      />
      <Route path="/products/:productId" element={<ProductDetailPage />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
