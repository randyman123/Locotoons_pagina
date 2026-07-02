# config/ — Contrato del template

Esta carpeta contiene toda la configuración que debe cambiar al crear un nuevo cliente o demo.
**No tocar App.tsx, CSS ni backend para personalizar un negocio.**

---

## Archivos y qué controlan

### `site.config.ts`
Identidad visible del sitio.

| Campo | Ejemplo | Cambia... |
|-------|---------|-----------|
| `name` | `'Locotoons'` | Nombre en header, footer, títulos de página |
| `brandKicker` | `'Lo mejor del coleccionismo'` | Texto pequeño sobre el logo |
| `brandSubtitle` | `'Figuras, coleccionables...'` | Texto bajo el logo |
| `searchPlaceholder` | `'Busca figuras, mangas...'` | Placeholder del buscador |
| `specificationLabelPlaceholders` | `['Material', 'Altura'...]` | Sugerencias en formulario admin |
| `productFallbackTitle` | `'Producto Locotoons'` | Alt text cuando no hay imagen |
| `footer.description` | `'Tienda online de...'` | Descripción en el footer |
| `footer.tagline` | `'Atencion cercana...'` | Segunda línea del footer |
| `footer.storeNote1/2` | `'Novedades...'` | Columna "Tienda" del footer |

---

### `business.config.ts`
Datos de contacto, moneda, pago y almacenamiento.

| Campo | Ejemplo | Cambia... |
|-------|---------|-----------|
| `locale` | `'es-CL'` | Formato de fechas y precios |
| `currency` | `'CLP'` | Moneda en `formatPrice` |
| `contact.whatsappPhone` | `'56912345678'` | Número de WhatsApp (también via `VITE_WHATSAPP_PHONE_NUMBER`) |
| `contact.whatsappDisplay` | `'+56 9 1234 5678'` | Texto visible en footer |
| `contact.instagram` | `'locotoons'` | Handle de Instagram |
| `contact.email` | `'hola@locotoons.cl'` | Email de contacto |
| `payment.label` | `'Transferencia bancaria'` | Label del método de pago |
| `whatsapp.emptyCartMessage` | `'Hola, quiero comprar en...'` | Mensaje cuando el carrito está vacío |
| `whatsapp.productInquiryFallback` | `'Hola, quiero consultar...'` | Mensaje fallback en detalle de producto |
| `storageKeys.*` | `'locotoons_auth_token'` | Claves en localStorage (cambiar si hay dos clientes en mismo dominio) |
| `events.*` | `'locotoons:storefront-refresh'` | Nombres de eventos internos del sitio |

> El número de WhatsApp se puede sobrescribir con la variable de entorno `VITE_WHATSAPP_PHONE_NUMBER` en el `.env` del frontend.

---

### `categories.config.ts`
Categorías de producto que aparecen en el menú, sidebar y hero carousel.

- Define el orden de navegación.
- Se usan como fallback cuando la base de datos no tiene categorías cargadas.
- Cada entrada tiene `name`, `slug` y `description`.
- El `slug` debe coincidir con el slug de la categoría en la BD para que los filtros funcionen.

Cambiar aquí para adaptar el negocio (ropa, gastronomía, tecnología, etc.).

---

### `theme.config.ts`
Documentación del sistema de colores y tipografías actuales.

- **No aplica estilos por sí solo** — es una referencia para la próxima pasada de tema.
- Contiene los valores que hoy están en `index.css` (variables CSS) y `App.css` (colores hardcodeados).
- Cuando se implemente el rethemeo, este archivo será la fuente de verdad para generar el `:root`.

| Grupo | Contenido |
|-------|-----------|
| `cssVars` | Variables de `index.css :root` (pageBg, surface, accent, etc.) |
| `accent` | Familia de rojo de marca (base, light, dark, darker) |
| `gradients` | Gradientes semánticos (topStrip, botones, WhatsApp) |
| `nav` | Paleta de la barra oscura de categorías |
| `status` | Colores de error, éxito y advertencia |
| `fonts` | Fuentes de heading y body |

---

## Qué NO modificar directamente en App.tsx

App.tsx contiene la lógica de la aplicación. Editar sus textos directamente rompe la separación entre config y código, y hace que los cambios de un cliente afecten la base.

No tocar en App.tsx:
- Textos de marca, nombres del negocio o textos del footer
- Número de WhatsApp o datos de contacto
- Categorías del menú
- Claves de localStorage o nombres de eventos
- Locale o moneda

Todo eso vive en los archivos de esta carpeta.

---

## Checklist — Nuevo cliente

```
[ ] 1. Identidad (site.config.ts)
        name, brandKicker, brandSubtitle, searchPlaceholder,
        footer.description, footer.tagline, footer.storeNote1/2

[ ] 2. Contacto y negocio (business.config.ts)
        contact.whatsappPhone, whatsappDisplay, instagram, email
        locale, currency si aplica
        payment.label si el método de pago cambia
        whatsapp.emptyCartMessage, whatsapp.productInquiryFallback
        storageKeys.* si el cliente comparte dominio con otro

[ ] 3. Categorías (categories.config.ts)
        Reemplazar las categorías por las del nuevo negocio
        Verificar que los slugs coincidan con los de la BD

[ ] 4. Colores (theme.config.ts + index.css)
        Actualizar theme.config.ts con los nuevos valores
        Aplicar --accent y demás variables en index.css :root
        Verificar top-strip y botones en App.css

[ ] 5. Productos demo (backend seed)
        Actualizar backend/src/products/seed-products.ts
        Correr el seed o cargar productos desde el panel admin

[ ] 6. Variables de entorno
        frontend/.env → VITE_API_URL, VITE_WHATSAPP_PHONE_NUMBER
        Verificar conexión con la BD del nuevo cliente

[ ] 7. Build y verificación
        cd frontend && npm run build
        Revisar header, footer, categorías y página de producto
        Probar carrito como invitado y como usuario registrado
        Probar panel admin (login con rol admin)
```
