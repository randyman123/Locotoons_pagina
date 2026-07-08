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
