# Locotoons Template — Contexto para Claude Code

## Identidad del proyecto
Template de e-commerce base (Locotoons v2) para derivar negocios específicos.
El objetivo es mantener una base limpia, modular y desplegable que sirva de punto de partida.

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Backend | NestJS + TypeORM + MySQL |
| Frontend | React + Vite + TypeScript |
| Auth | JWT (módulo propio en `backend/src/auth/`) |
| Deploy | Railway (nixpacks) |
| Local dev | Docker Compose (MySQL) |

## Estructura de módulos backend

```
backend/src/
├── auth/          # JWT login/register
├── users/         # Gestión de usuarios
├── categories/    # Categorías de productos
├── products/      # Catálogo (con seed)
├── carts/         # Carrito de compras
├── orders/        # Órdenes (entity + DTO en revisión)
├── payments/      # Pagos (en desarrollo, tiene payment-provider.enum.ts)
└── config/        # Variables de entorno centralizadas
```

## Estructura frontend

```
frontend/src/
├── App.tsx        # Router principal
├── App.css        # Estilos globales
└── assets/        # Recursos estáticos
```

---

## Reglas que SIEMPRE debes seguir

1. **TypeScript estricto** — sin `any` implícito, sin `as unknown`.
2. **NestJS modular** — cada feature tiene su propio módulo, servicio, controlador, entidad y DTO.
3. **DTOs con validación** — usar `class-validator` en todos los DTOs de entrada.
4. **No romper módulos existentes** — si tocas un módulo, asegúrate de que el módulo sigue compilando (`tsc --noEmit`).
5. **No modificar `synchronize: true`** sin consultar — en local sincroniza la BD; en producción Railway maneja migraciones.
6. **Swagger obligatorio en endpoints nuevos** — decoradores `@ApiTags`, `@ApiOperation`, `@ApiBearerAuth` según corresponda.
7. **Secrets nunca en código** — `.env` local, Railway variables en producción.
8. **Sin comentarios obvios** — solo cuando el WHY es no obvio.

---

## Lo que NUNCA debes hacer sin pedir confirmación

- Modificar `app.module.ts` (rompe el registro de módulos)
- Modificar `config/config.module.ts` (rompe variables de entorno)
- Eliminar o renombrar entidades existentes (rompe la BD)
- Cambiar las relaciones TypeORM de entidades existentes
- Agregar dependencias npm sin verificar conflictos de versión
- Hacer `git push` o crear PRs automáticamente
- Borrar archivos sin confirmar primero

---

## Variables de entorno locales (`.env`)

El backend lee en este orden de prioridad:
1. `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`
2. `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE` (Railway)

El archivo `.env` real está en `backend/.env`. No lo modifiques sin consultar.

---

## Flujo de trabajo seguro

Antes de cualquier cambio:
1. Leer el archivo objetivo completo
2. Verificar qué otros archivos lo importan
3. Ejecutar `/checklist` para recordar las verificaciones

Después de cada cambio:
1. `cd backend && npx tsc --noEmit` (sin compilar, solo type-check)
2. Confirmar que los módulos afectados siguen registrados en `app.module.ts`
3. Si hay cambio de entidad, verificar que `synchronize` puede aplicarlo sin destruir datos

---

## Contexto de deploy

- **Railway** lee `nixpacks.toml` y `railway.json` en la raíz
- El backend se despliega desde `backend/`
- MySQL en Railway usa variables `MYSQL*` (no `DB_*`)
- El frontend se sirve estático (build de Vite)

---

## Comandos útiles locales

```bash
# Backend (desde /backend)
npm run start:dev          # dev con hot reload
npx tsc --noEmit           # type-check sin compilar

# Frontend (desde /frontend)
npm run dev                # dev server Vite
npm run build              # build producción

# Docker local
docker-compose up -d       # levanta MySQL local
```
