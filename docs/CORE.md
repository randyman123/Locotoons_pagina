# CORE — Qué es inmutable, qué es configurable, qué es reemplazable

Este documento define con precisión las tres zonas del framework y las reglas para trabajar con cada una.

---

## Las tres zonas del framework

```
┌─────────────────────────────────────────────────────┐
│                  ZONA CLIENTE                        │
│  Catálogo, precios, fotos, textos, categorías        │
│  → Cambia por cada negocio derivado                  │
├─────────────────────────────────────────────────────┤
│                  ZONA CONFIG                         │
│  business.config · site.config · theme.config        │
│  categories.config · variables de entorno            │
│  → Cambia una vez al derivar el proyecto             │
├─────────────────────────────────────────────────────┤
│                  ZONA CORE                           │
│  Auth · Users · Cart · Orders · API client           │
│  Types · AuthContext · Guards · Entidades BD         │
│  → No cambia. Es el motor del comercio               │
└─────────────────────────────────────────────────────┘
```

---

## ZONA CORE — No modificar sin diseño previo

El Core es el motor que hace funcionar cualquier tienda derivada del template. Modifícarlo implica romper todas las derivaciones existentes o futuras.

### Backend Core

| Módulo | Archivos | Por qué es Core |
|--------|----------|----------------|
| `auth/` | `auth.module.ts`, `jwt.strategy.ts`, `guards/` | Sistema de autenticación JWT. Todos los módulos dependen de él. |
| `users/` | `user.entity.ts`, `users.service.ts` | Contrato de identidad. Cambiar roles o campos rompe auth y orders. |
| `config/` | `config.module.ts` | Punto único de variables de entorno. Si se rompe, nada inicia. |
| `app.module.ts` | — | Registro de módulos. Cambio incorrecto = aplicación no inicia. |
| `main.ts` | — | Configuración de la app: CORS, ValidationPipe, Swagger, puerto. |

**La entidad `User` es sagrada.** Tiene dos roles: `customer` y `admin`. Agregar roles implica cambiar guards, estrategias JWT y el frontend. No hacer sin diseño completo.

### Frontend Core

| Archivo | Por qué es Core |
|---------|----------------|
| `src/types/index.ts` | Contrato de tipos compartido. Cambiar un tipo rompe múltiples componentes. |
| `src/lib/api.ts` | Cliente HTTP único con interceptor de auth. Todo el frontend depende de él. |
| `src/lib/auth.ts` | Funciones de login/logout/decode. Usadas por AuthContext. |
| `src/context/AuthContext.tsx` | Estado global de autenticación. Envuelve toda la app. |
| `src/components/routes/PrivateRoute.tsx` | Guard de rutas autenticadas. |
| `src/components/routes/AdminRoute.tsx` | Guard de rutas de administración. |
| `src/main.tsx` | Punto de entrada. Monta `AuthContext` sobre el árbol de React. |

---

## ZONA CONFIG — Cambiar una vez al derivar el proyecto

La Zona Config es lo que transforma el template base en un negocio específico. Son archivos TypeScript tipados, no JSON, para que cualquier error de configuración sea detectado en tiempo de compilación.

### `frontend/src/config/business.config.ts`

Define la identidad operativa del negocio:

```typescript
export const BUSINESS = {
  locale: 'es-CL',           // Formato de precios y fechas
  currency: 'CLP',
  contact: {
    whatsappPhone,            // Número de WhatsApp del negocio
    instagram,                // Handle de Instagram
    email,
  },
  payment: {
    method: 'bank_transfer',  // Método de pago activo
    label: 'Transferencia bancaria',
  },
  storageKeys: { ... },       // Claves de localStorage — deben ser únicas por negocio
  events: { ... },            // Nombres de CustomEvents — deben ser únicos por negocio
};
```

**Al derivar:** cambiar `locale`, `currency`, `contact`, `payment.method` y todos los `storageKeys` y `events` para que no colisionen con otras instancias del template si corren en el mismo dominio.

### `frontend/src/config/site.config.ts`

Define la identidad textual y de marca:

```typescript
export const SITE = {
  name: 'Locotoons',
  brandKicker: 'Lo mejor del coleccionismo',
  brandSubtitle: '...',
  searchPlaceholder: '...',
  footer: { ... },
};
```

**Al derivar:** reemplazar todos los valores con los del negocio cliente. `name` aparece en el título del navegador, el footer y los mensajes de WhatsApp.

### `frontend/src/config/theme.config.ts`

Define el sistema de colores completo:

```typescript
export const THEME = {
  cssVars: {
    pageBg, surface, border, text, accent, ...
  },
  accent: {
    base, light, dark, darker, medium, xdark
  },
  gradients: { ... },
  nav: { ... },
  status: { errorBg, successBg, warningBg, ... },
  fonts: { heading, body },
};
```

**Al derivar:** cambiar `accent.base` y derivar el resto de la familia de color siguiendo la misma lógica (`base → light → dark → darker`). Conectar cada valor con la CSS custom property correspondiente en `index.css`.

**Nunca** usar colores de marca hardcodeados en componentes. Siempre referenciar variables CSS o constantes de `THEME`.

### `frontend/src/config/categories.config.ts`

Define los presets de categorías para la tienda:

```typescript
export const STORE_CATEGORY_PRESETS = [
  { name: 'Pokémon', slug: 'pokemon', description: '...' },
  // ...
];
```

Estos presets se usan como fallback visual cuando la BD aún no tiene categorías cargadas, y como referencia para el seed inicial. **Al derivar:** reemplazar con las categorías del negocio cliente.

### `backend/src/template/template.config.ts`

Es el equivalente backend de los archivos de configuración anteriores: la Zona Config del lado servidor. Define la identidad de negocio que consumen `app.module.ts`, `auth.module.ts` y los scripts de seed:

```typescript
export const TEMPLATE_SWAGGER = { title, description, version };
export const TEMPLATE_JWT_SECRET_FALLBACK = '...';
export const TEMPLATE_DB = { defaultName: '...' };
export const TEMPLATE_OFFICIAL_CATEGORIES = [ ... ];
export const TEMPLATE_SEED_PRODUCTS = [ ... ];
export const TEMPLATE_TEST_PRODUCT_PATTERNS = { ... };
```

**Al derivar:** este es el único archivo backend que se modifica para cambiar de rubro. `app.module.ts` y `auth.module.ts` importan sus constantes (`TEMPLATE_DB.defaultName`, `TEMPLATE_JWT_SECRET_FALLBACK`) en lugar de tener valores de negocio hardcodeados directamente.

Ver la sección **ZONA DEMO** más abajo para presets ya escritos que se pueden copiar sobre este archivo.

### Variables de entorno del backend

El backend acepta dos conjuntos de variables (local y Railway):

```
DB_HOST / MYSQLHOST
DB_PORT / MYSQLPORT
DB_USERNAME / MYSQLUSER
DB_PASSWORD / MYSQLPASSWORD
DB_NAME / MYSQLDATABASE
JWT_SECRET
```

**Al derivar:** crear `backend/.env` con las variables del nuevo negocio. Nunca commitear `.env`.

---

## ZONA DEMO — Blueprints (`backend/src/template/demos/`)

La Zona Demo no es una cuarta zona del framework — es un área auxiliar dentro de la Zona Config. Contiene blueprints completos y listos para usar de `template.config.ts` para distintos rubros (restaurante, ecommerce de coleccionables, etc.), pensados para acelerar la derivación del template a un nuevo tipo de negocio.

```
backend/src/template/
├── template.config.ts     ← Config ACTIVA. La única que el código importa.
└── demos/
    ├── restaurante.config.ts
    └── (futuros presets por rubro)
```

### Regla crítica: los archivos en `demos/` NO se importan automáticamente

Ningún módulo del backend importa nada desde `backend/src/template/demos/`. Son archivos de referencia, inertes por diseño — TypeScript los compila porque son sintácticamente válidos, pero nada en `app.module.ts`, `auth.module.ts` ni en los scripts de seed los consume. Si `demos/` se borrara por completo, el template seguiría compilando y desplegando exactamente igual.

### Cómo activar una demo

Activar un preset es un reemplazo manual y completo, no una importación condicional ni una variable de entorno:

1. Copiar el contenido completo de `demos/<rubro>.config.ts` sobre `template.config.ts`.
2. Verificar que la BD esté vacía, o ejecutar en orden (ver comentario de cabecera de cada archivo demo):
   - `POST /api/products/clean-test-data` — oculta los productos del rubro anterior
   - `POST /api/categories/sync-official` — reemplaza las categorías
   - `POST /api/products/sync-seed` — carga el catálogo del nuevo rubro

No existe mecanismo de selección en runtime (variable de entorno, feature flag, etc.) que elija entre `template.config.ts` y un archivo de `demos/`. Activar una demo es una edición de código que se commitea, no una configuración de entorno.

### Advertencia: un deploy = un negocio = un `template.config.ts` activo

`template.config.ts` no es multi-tenant y no está diseñado para serlo. En todo momento existe exactamente un preset activo por deploy: el que esté escrito en `template.config.ts`. Cambiar de rubro implica sobreescribir ese archivo y volver a desplegar — no correr dos rubros simultáneamente desde el mismo backend. Si en el futuro se necesita servir múltiples negocios desde un mismo backend, eso es una decisión arquitectónica nueva (multi-tenancy real), no una extensión del patrón de `demos/`.

---

## ZONA CLIENTE — Cambia continuamente

La Zona Cliente es el contenido del negocio: productos, fotos, precios, categorías reales. No hay código en esta zona, solo datos que el administrador gestiona a través del panel de admin.

**Cómo se carga el contenido inicial:**

```bash
# Desde backend/
npx ts-node src/scripts/sync-official-categories.ts   # Crea categorías base
npx ts-node src/scripts/sync-seed-products.ts         # Crea productos de ejemplo
npx ts-node src/scripts/make-admin.ts                 # Eleva un usuario a admin
```

---

## Reglas de la Zona Core

1. **Nunca modificar una entidad TypeORM existente sin verificar el impacto en `synchronize: true`.** Un campo `NOT NULL` sin default en una tabla con datos existentes destruye la BD en el próximo deploy.

2. **Nunca agregar lógica de negocio directamente en `app.module.ts`.** Es un archivo de registro, no de lógica.

3. **Nunca importar directamente desde `process.env` en módulos que no sean `config/`.** Todo acceso a variables de entorno va a través de `ConfigService`.

4. **Nunca usar `any` en el Core.** El contrato de tipos en `frontend/src/types/index.ts` es la fuente de verdad compartida entre frontend y backend.

5. **Los `storageKeys` y `events` en `business.config.ts` deben ser únicos por instancia del template.** Si dos negocios comparten dominio y tienen las mismas claves, su localStorage colisiona.

---

## Guía de decisión rápida

```
¿Quiero cambiar el color de los botones?
  → Zona Config: theme.config.ts

¿Quiero cambiar el número de WhatsApp?
  → Zona Config: business.config.ts

¿Quiero agregar un nuevo producto?
  → Zona Cliente: panel de admin o seed script

¿Quiero agregar un campo nuevo al Product?
  → Zona Core: product.entity.ts + product.dto.ts + types/index.ts
  → Requiere: type-check, verificar synchronize, actualizar frontend

¿Quiero agregar un proveedor de pago?
  → Zona Core: payments/payment-provider.enum.ts + payments.service.ts
  → Requiere: diseño previo completo

¿Quiero cambiar el nombre de la tienda?
  → Zona Config: site.config.ts (SITE.name)

¿Quiero agregar una nueva categoría de productos?
  → Zona Cliente: admin panel O
  → Zona Config: categories.config.ts (para el preset visual)
```

---

## Deuda técnica conocida

Este documento describe cómo **debería** funcionar la separación de zonas. Los defectos y ambigüedades descubiertos durante derivaciones reales — casos donde el Core no cumple sus propias reglas, o donde esta documentación quedó incompleta — se registran en [`docs/CORE_DEBT.md`](./CORE_DEBT.md), no aquí. Antes de asumir que una zona funciona como se describe arriba, revisar ese registro.
