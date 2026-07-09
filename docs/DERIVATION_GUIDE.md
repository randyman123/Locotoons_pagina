# DERIVATION_GUIDE — Cómo derivar un negocio desde el Business Core

Esta guía documenta el proceso oficial para convertir `00_core` en una instancia de negocio real (`01_restaurante`, `02_turismo`, `03_ecommerce`, ...). Responde al **cómo**. El **qué** de cada zona vive en `docs/CORE.md`; el **por qué** de las decisiones vive en `docs/PRODUCT_PHILOSOPHY.md`; la deuda conocida del proceso vive en `docs/CORE_DEBT.md`.

---

## 1. Qué es una derivación

Una derivación es la creación de una nueva instancia de negocio a partir de `00_core`, cambiando únicamente la **Zona Config** y la **Zona Cliente** (ver `docs/CORE.md`) y dejando intacto el motor (**Zona Core**).

No es un fork en el sentido de "nueva base de código independiente". Es una copia que:

- Comparte el mismo motor de comercio (auth, carrito, órdenes, catálogo).
- Cambia identidad, marca, contacto y catálogo inicial.
- Puede recibir correcciones del Core en el futuro sin reescribirse.

Si una derivación termina modificando servicios, entidades o controladores del Core, no es una derivación limpia — es una divergencia, y cualquier corrección posterior al Core no se propagará sola.

---

## 2. Cuándo crear una nueva carpeta desde 00_core

Crear una carpeta nueva (`0N_nombre_rubro`) cuando:

- Existe un negocio real (o un encargo concreto) que necesita una tienda funcional, no cuando se quiere "probar una idea" — para explorar variantes visuales o de rubro sin comprometer una carpeta nueva, usar la Zona Demo (`backend/src/template/demos/`, ver `docs/CORE.md`).
- `00_core` está en un estado derivable (ver checklist de la sección 4). Derivar desde un `00_core` con trabajo a medio terminar propaga ese estado a la nueva instancia — es exactamente lo que documenta `CORE_DEBT-002` y `CORE_DEBT-009`.

Convención de nombres observada en el repo: prefijo numérico de dos dígitos + rubro en snake_case (`01_restaurante`, `02_turismo`, `03_ecommerce`, `04_servicios`, `05_catalogo`). Mantener el mismo patrón para nuevas instancias.

---

## 3. Comandos para copiar el Core

Desde el directorio que contiene `00_core` (un nivel arriba de este repo):

```bash
cp -R 00_core 01_restaurante
cd 01_restaurante
rm -rf .git
git init
```

Notas:

- `cp -R` copia también archivos no versionados (`node_modules`, `.env`, `dist/`) si existen en `00_core`. Si el Core tiene una carpeta `.gitignore` correcta, es preferible limpiar `node_modules`, `dist` y `.env` antes de copiar, o hacer `npm install` fresco después.
- `rm -rf .git` desvincula la copia del historial de `00_core` — la nueva instancia empieza su propio historial con `git init`. Este es un paso destructivo sobre la **copia**, no sobre `00_core`; no ejecutar `rm -rf .git` dentro de `00_core`.
- Después de `git init`, hacer un primer commit ("Initial commit from Business Core") antes de tocar cualquier archivo de Config, para tener un punto de referencia limpio de lo heredado del Core.

---

## 4. Checklist antes de derivar

No derivar desde `00_core` si falta cualquiera de estos tres puntos:

- [ ] **`git status` limpio** en `00_core` — sin cambios sin commitear. Un fix pendiente sin commitear (como ocurrió con el fallback del JWT secret, `CORE_DEBT-002`) no se hereda y queda perdido para esa derivación.
- [ ] **Builds limpios** — `cd backend && npx tsc --noEmit` sin errores; `cd frontend && npm run build` sin errores.
- [ ] **Documentación actualizada** — `docs/CORE.md`, `docs/ARCHITECTURE.md` y `docs/CORE_DEBT.md` reflejan el estado real del código. Si hay deuda de Core abierta que afecta directamente el flujo de derivación (categoría "Template System" o "Documentation" en `CORE_DEBT.md`), evaluar si conviene resolverla antes de derivar en vez de heredarla.

Este checklist es, hoy, un proceso manual — no existe un gate automático que lo verifique (`CORE_DEBT-009`, `CORE_DEBT-011`). Hasta que exista, es responsabilidad de quien deriva ejecutarlo a mano.

---

## 5. Archivos que normalmente se modifican

Al derivar, estos archivos cambian de valores (nunca de forma/estructura):

| Archivo | Qué se cambia |
|---|---|
| `frontend/src/config/site.config.ts` | Nombre del negocio, textos de marca, footer, placeholder de búsqueda |
| `frontend/src/config/business.config.ts` | Locale, moneda, contacto (WhatsApp, Instagram, email), método de pago, `storageKeys` y `events` (deben ser únicos por instancia) |
| `frontend/src/config/categories.config.ts` | Presets de categorías del rubro |
| `frontend/src/config/theme.config.ts` | Color de marca (`accent.base`) y familia de color derivada |
| `backend/src/template/template.config.ts` | Título/descripción de Swagger, fallback de JWT secret, nombre de BD por defecto, categorías oficiales y productos de seed del rubro |
| `docker-compose.yml` | `container_name`, `MYSQL_DATABASE` y nombre del volumen — deben ser únicos si varias instancias corren en la misma máquina |
| `backend/.env.example` | `JWT_SECRET`, `DB_NAME` y demás valores de ejemplo del rubro |
| `frontend/.env.example` | `VITE_API_URL` u otras variables del frontend, si aplica |
| `README.md` | Descripción del negocio derivado, no la del template genérico |

**Adicional, no cubierto por el checklist original de `CORE.md` (ver `CORE_DEBT-008`):** revisar también `backend/package.json` (campo `"name"`, hoy `locotoons-backend`) y cualquier `README.md` de subcarpeta (`frontend/src/config/README.md`) — son identidad de instancia aunque no sean `.ts` tipados.

---

## 6. Qué NO debe modificarse en una derivación

Estos son Zona Core (`docs/CORE.md`) — cambiarlos rompe la garantía de que una derivación es segura y reversible:

- Servicios (`*.service.ts`)
- Entidades TypeORM (`*.entity.ts`)
- Controladores (`*.controller.ts`)
- Guards y estrategias de auth (`guards/`, `jwt.strategy.ts`)
- Hooks del frontend (`src/hooks/`)
- `lib/` del frontend (`api.ts`, `auth.ts`, `storage.ts`, etc.)
- Lógica compartida en general: `AuthContext`, `PrivateRoute`, `AdminRoute`, `types/index.ts`, `app.module.ts`, `main.ts`, `config/config.module.ts`

Si una derivación necesita tocar alguno de estos archivos para funcionar, no es un ajuste de Config — es una señal de que algo pertenece al Core y falta ahí (ver sección 7).

---

## 7. Qué hacer si aparece una necesidad del Core

No parchar solo en el fork. El proceso oficial (definido en `docs/CORE_DEBT.md`) es:

1. **Registrar la deuda en `00_core`**, en `docs/CORE_DEBT.md`, sección 7, con el siguiente ID disponible (`CORE-DEBT-0XX`). Se registra ahí aunque se haya descubierto en el fork — nunca en el `docs/` del fork.
2. **Completar los campos de la plantilla**: categoría, prioridad, dónde se detectó, dónde se resuelve, descripción, impacto, propuesta de solución.
3. **No resolverla en el fork como solución definitiva.** Un fork puede necesitar un workaround temporal para seguir avanzando, pero la corrección real se implementa en `00_core` y luego se porta a los forks activos afectados.
4. **Actualizar el estado** de la deuda (`Open → Planned → In Progress → Resolved`) a medida que se trabaja, siguiendo las definiciones de estado de `CORE_DEBT.md`.

Registrar deuda no requiere aprobación previa; decidir resolverla sí.

---

## 8. Smoke test obligatorio

Antes de dar por completa una derivación, verificar en orden:

1. **Docker** — `docker-compose up -d` levanta MySQL sin errores.
2. **Backend** — `cd backend && npm run start:dev` arranca sin excepciones de conexión ni de módulos.
3. **Swagger** — `http://localhost:<APP_PORT>/api` (o la ruta configurada en `main.ts`) carga y muestra el título/descripción del rubro derivado, no "Locotoons API".
4. **Categorías** — `npx ts-node src/scripts/sync-official-categories.ts` crea las categorías del rubro; `GET /categories` las devuelve.
5. **Productos** — `npx ts-node src/scripts/sync-seed-products.ts` carga productos de ejemplo; `GET /products` los devuelve con precios e imágenes correctos.
6. **Frontend** — `cd frontend && npm run dev` levanta sin errores de compilación; la Home muestra el nombre y colores del negocio derivado.
7. **Carrito** — agregar un producto como invitado y como usuario autenticado; verificar persistencia (`localStorage` para invitado, BD para autenticado).
8. **Checkout** — completar una orden de prueba (guest y autenticada) y confirmar que el mensaje de WhatsApp se arma con el número y datos correctos del negocio derivado.
9. **Admin** — `npx ts-node src/scripts/make-admin.ts <email>` eleva un usuario; login como admin y confirmar acceso a rutas de `AdminRoute` (CRUD de productos, gestión de órdenes).

Una derivación no se considera terminada si falla cualquiera de estos nueve puntos.

---

## 9. Lecciones aprendidas desde 01_restaurante

Extraídas de la auditoría registrada en `docs/CORE_DEBT.md`:

- **Un fix sin commitear en `00_core` no se hereda.** El fallback de `JWT_SECRET` se corrigió en una sesión previa pero no se commiteó; `01_restaurante` se derivó antes de ese commit y no lo recibió (`CORE-DEBT-002`). Refuerza la sección 4 de esta guía: `git status` limpio no es opcional.
- **El health-check (`app.service.ts`) hardcodea el nombre del negocio** en vez de leerlo de `template.config.ts` (`CORE-DEBT-001`) — un archivo de Zona Core que en la práctica cada fork termina editando a mano.
- **El checklist de Config original no cubría archivos no-`.ts`.** `backend/package.json`, `docker-compose.yml`, `backend/.env.example` y READMEs de subcarpeta quedaron con "Locotoons" residual porque ningún checklist los mencionaba explícitamente (`CORE-DEBT-008`) — por eso ahora están en la sección 5 de esta guía.
- **La carpeta `backend/src/template/demos/` queda en un estado ambiguo** después de derivar: `01_restaurante` conservó `demos/restaurante.config.ts` como archivo inerte, sin que exista una regla sobre si debe borrarse, conservarse o documentarse (`CORE-DEBT-010`, marcada explícitamente como pendiente de decisión).
- **El proceso completo es manual.** Confirmar que una derivación quedó completa hoy requiere revisar a mano ~20 archivos de tipos distintos. No hay script ni validación automática (`CORE-DEBT-011`) — es la deuda con mayor efecto dominó sobre las anteriores.
- **El framework aún no tiene nombre propio distinto de su primera instancia.** `PRODUCT_PHILOSOPHY.md` se define a través de "Locotoons Template" (`CORE-DEBT-006`), lo que hace ambiguo cualquier esfuerzo de "genericizar" tooling o docs: no está claro si se está quitando el nombre de la instancia o el del framework.

---

## 10. Regla final

**Si una segunda derivación necesita el mismo cambio, probablemente pertenece al Core.**

Un ajuste que aparece una sola vez en un fork es Config o Cliente funcionando como se espera. Un ajuste que se repite idéntico en la siguiente derivación es una señal de que el Core tiene un hueco — regístralo en `docs/CORE_DEBT.md` (sección 7) en vez de volver a parchar el fork.
