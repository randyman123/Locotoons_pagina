# ARCHITECTURE — Diseño técnico del Business Web Framework

Este documento describe la arquitectura completa del sistema: módulos, capas, flujos de datos y decisiones de diseño técnico.

---

## Visión de alto nivel

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Browser)                        │
│                                                                  │
│   React + Vite + TypeScript                                      │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│   │  Config  │  │   Lib    │  │  Hooks   │  │  Pages /     │   │
│   │  Layer   │→ │  Layer   │→ │  Layer   │→ │  Components  │   │
│   └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
│                       ↕ HTTP (axios + JWT)                       │
├──────────────────────────────────────────────────────────────────┤
│                       BACKEND (Railway)                          │
│                                                                  │
│   NestJS + TypeORM + MySQL                                       │
│   ┌──────────────────────────────────────────────────────────┐   │
│   │  auth │ users │ categories │ products │ carts │ orders  │   │
│   │                         payments                         │   │
│   └──────────────────────────────────────────────────────────┘   │
│                       ↕ TypeORM                                  │
├──────────────────────────────────────────────────────────────────┤
│                         MySQL (BD)                               │
│   users · products · categories · carts · cart_items            │
│   orders · order_items · product_reviews                        │
└──────────────────────────────────────────────────────────────────┘
```

---

## Backend — Mapa de módulos

### Módulos y sus responsabilidades

```
app.module.ts (raíz)
├── AppConfigModule          ← Lee .env y expone ConfigService
├── TypeOrmModule            ← Conexión a MySQL con configuración dinámica
├── AuthModule               ← Login, register, JWT strategy, guards
├── UsersModule              ← CRUD de usuarios, gestión de perfil
├── CategoriesModule         ← CRUD de categorías, sync de categorías oficiales
├── ProductsModule           ← Catálogo completo, visibilidad, featured, reviews
├── CartsModule              ← Carrito por usuario (persistido en BD)
├── OrdersModule             ← Creación y seguimiento de órdenes
└── PaymentsModule           ← Integraciones de pago (en desarrollo)
```

### Dependencias entre módulos

```
AuthModule
  └── depende de → UsersModule (para buscar usuario al validar JWT)

CartsModule
  └── depende de → ProductsModule (para verificar stock al agregar items)

OrdersModule
  └── no depende de otros módulos en tiempo de ejecución
  └── referencia userId directamente (sin FK forzada)

PaymentsModule
  └── independiente (aún no integrado con OrdersModule)
```

**Regla de dependencias:** Los módulos de la capa inferior (Auth, Users, Config) no pueden importar módulos de la capa superior (Orders, Payments). Las dependencias siempre van hacia abajo.

### Entidades y relaciones en BD

```
users
  id, email, name, password, role, createdAt, updatedAt

categories
  id, name, slug, description, createdAt, updatedAt

products
  id, title, slug, description, price, stock, imageUrl
  specifications (JSON), isVisible, featured
  categoryId (FK → categories, nullable)
  createdAt, updatedAt

product_reviews
  id, productId (FK → products, cascade delete)
  rating, comment, createdAt

carts
  id, userId (FK → users)
  createdAt, updatedAt

cart_items
  id, cartId (FK → carts, cascade delete)
  productId (FK → products)
  quantity

orders
  id, userId (nullable — soporta guest checkout)
  customerName, customerEmail, customerPhone
  status (pending|paid|shipped|delivered|cancelled)
  paymentMethod (bank_transfer|whatsapp_coordination)
  total, shippingAddress
  createdAt, updatedAt

order_items
  id, orderId (FK → orders, cascade delete, eager load)
  productId, quantity, unitPrice
```

**Decisión de diseño — Orders sin FK a users:** La orden almacena `userId` como entero nullable pero no como FK forzada. Esto permite:
- Guest checkout (userId = null, customerName/Email/Phone capturados)
- Órdenes históricas si el usuario es eliminado (no hay cascade delete en órdenes)

### Autenticación — Flujo completo

```
1. POST /auth/register
   → RegisterDto (email, password, name)
   → UsersService.create() — hashea password con bcrypt
   → Devuelve { access_token }

2. POST /auth/login
   → LoginDto (email, password)
   → AuthService.validateUser() — compara hash
   → JwtService.sign({ userId, email, role })
   → Devuelve { access_token }

3. Solicitud autenticada
   → Header: Authorization: Bearer <token>
   → JwtAuthGuard → JwtStrategy.validate()
   → Inyecta req.user = { userId, email, role }

4. Rutas de admin
   → @UseGuards(JwtAuthGuard, RolesGuard)
   → @Roles('admin')
   → RolesGuard verifica req.user.role
```

**Guards disponibles:**
- `JwtAuthGuard` — requiere token válido
- `OptionalJwtAuthGuard` — acepta requests sin token (para cart de invitados)
- `RolesGuard` + `@Roles('admin')` — restringe a administradores

---

## Frontend — Capas y flujo de datos

### Las cuatro capas del frontend

```
┌─────────────────────────────────────────────────────┐
│  CAPA CONFIG (src/config/)                          │
│  business.config · site.config · theme.config       │
│  categories.config                                   │
│  → Constantes tipadas. No hacen fetch. No tienen    │
│    estado. Son la fuente de verdad de identidad.    │
├─────────────────────────────────────────────────────┤
│  CAPA LIB (src/lib/)                                │
│  api · auth · categories · normalize · orders       │
│  price · product-form · storage · strings · whatsapp│
│  → Funciones puras y cliente HTTP. Sin estado.      │
│    Transforman datos, formatean, calculan.          │
├─────────────────────────────────────────────────────┤
│  CAPA HOOKS (src/hooks/)                            │
│  useStorefrontData                                  │
│  → Estado reactivo de datos del servidor.           │
│    Orquestan llamadas a lib/api.ts                  │
├─────────────────────────────────────────────────────┤
│  CAPA UI (src/components/ + src/pages/)             │
│  Pages: Home · Category · Product · Cart · Account  │
│         Login · Register · Admin · OrderDetail      │
│  Components: layout/ · product/ · admin/ · ui/ · routes/│
│  → Renderizado y eventos. No conocen la API         │
│    directamente. Usan hooks y lib/.                 │
└─────────────────────────────────────────────────────┘
```

### Contexto global: AuthContext

`AuthContext` es el único estado global del frontend. Provee:

```typescript
{
  token: string | null,          // JWT almacenado en localStorage
  user: AuthUser | null,         // { userId, email, role } decodificado del token
  isAuthenticated: boolean,
  authReady: boolean,            // true cuando la hidratación inicial terminó
  cartCount: number,             // cantidad de items en el carrito (para badge del header)
  login(token): void,
  logout(): void,
  refreshCartCount(): Promise<void>,
}
```

**Regla:** Ningún componente accede directamente a `localStorage`. Todo va a través de `AuthContext` o las funciones de `lib/storage.ts` y `lib/auth.ts`.

### Cliente HTTP: `lib/api.ts`

```typescript
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Interceptor: agrega Authorization header automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(BUSINESS.storageKeys.authToken);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

**Regla:** Todos los módulos de `lib/` que hacen HTTP importan `api` de este archivo. Nunca usar `fetch` o `axios` directamente.

### Sistema de eventos para refresco de UI

El frontend usa `CustomEvent` para comunicación entre partes desacopladas:

```typescript
// Disparar desde admin después de modificar un producto:
window.dispatchEvent(new Event(BUSINESS.events.storefrontRefresh));

// useStorefrontData escucha este evento y recarga datos:
window.addEventListener(STOREFRONT_REFRESH_EVENT, handleStorefrontRefresh);
```

Esto evita prop drilling y contextos adicionales para el caso de que el admin actualice el catálogo y la vista del storefront se recargue automáticamente.

### Flujo de compra completo

```
1. CATÁLOGO
   useStorefrontData → GET /categories + GET /products
   → normalizeProduct() normaliza precios (decimal → número)
   → sortStoreCategories() ordena según STORE_CATEGORY_PRESETS

2. CARRITO (usuario autenticado)
   GET /carts/me → cart con items
   POST /carts/me/items → agregar producto
   PATCH /carts/me/items/:id → cambiar cantidad
   DELETE /carts/me/items/:id → eliminar item

3. CARRITO (invitado / guest)
   Los items se almacenan en localStorage (BUSINESS.storageKeys.guestCart)
   Al hacer checkout, se convierten en OrderItems directamente

4. CHECKOUT
   POST /orders
   Body: { items, shippingAddress, paymentMethod, customerName?, customerEmail? }
   → Si autenticado: userId se toma del JWT
   → Si guest: customerName/Email/Phone del formulario

5. POST-COMPRA
   El mensaje de WhatsApp se construye en lib/whatsapp.ts
   Incluye resumen de la orden, total y dirección de envío
   Se abre wa.me/[número] con el mensaje pre-cargado
```

---

## Deploy — Arquitectura de producción

```
GitHub
  └── push a main
        ├── Railway (backend)
        │     nixpacks.toml detecta Node.js
        │     Lee MYSQLHOST, MYSQLPORT, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE
        │     Lee JWT_SECRET
        │     npm run build → node dist/main.js
        │
        └── [Frontend: build estático o CDN separado]
              VITE_API_URL apunta al backend de Railway
              npm run build → dist/ listo para servir
```

### Variables de entorno requeridas en Railway

| Variable | Descripción |
|----------|-------------|
| `MYSQLHOST` | Host del servicio MySQL de Railway |
| `MYSQLPORT` | Puerto MySQL (generalmente 3306) |
| `MYSQLUSER` | Usuario MySQL |
| `MYSQLPASSWORD` | Contraseña MySQL |
| `MYSQLDATABASE` | Nombre de la base de datos |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT |

### Consideración de `synchronize: true`

En producción Railway, `synchronize: true` está activo. Esto significa que cada deploy aplica automáticamente los cambios de schema. **Seguro para agregar columnas nullable o con default. Peligroso para:**
- Renombrar columnas (TypeORM crea una nueva y elimina la vieja)
- Eliminar columnas (se pierde el dato)
- Cambiar tipo de columna con datos existentes

Para cambios de schema destructivos en producción: crear una migración manual y desactivar temporalmente `synchronize`.

---

## Estructura de archivos de configuración del proyecto raíz

```
/
├── CLAUDE.md              ← Instrucciones para Claude Code
├── AGENTS.md              ← Reglas cortas del proyecto (leídas por agentes)
├── docker-compose.yml     ← MySQL local para desarrollo
├── nixpacks.toml          ← Configuración de build para Railway
├── railway.json           ← Configuración de deploy Railway
├── backend/
│   ├── .env               ← Variables locales (no commitear)
│   ├── .env.example       ← Template de variables (sí commitear)
│   └── src/
└── frontend/
    └── src/
        └── config/        ← Zona Config — personalizar aquí al derivar
```
