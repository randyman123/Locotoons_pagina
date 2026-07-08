# PRODUCT PHILOSOPHY — Principios, visión y decisiones de diseño

Este documento explica el POR QUÉ detrás de las decisiones del framework. No documenta qué hace el código (eso está en ARCHITECTURE.md), sino las razones que guían cómo se debe evolucionar.

---

## Qué es este proyecto

**Locotoons Template** es un Business Web Framework: un sistema de comercio electrónico diseñado para ser derivado hacia negocios específicos sin reescribir el motor.

No es:
- Un CMS de propósito general
- Una plataforma SaaS multi-tenant
- Un proyecto de un solo cliente

Es:
- Un punto de partida profesional y opinionado para tiendas de comercio físico simple
- Un motor de comercio que se configura, no se modifica
- Una base que puede producir múltiples negocios reales con esfuerzo mínimo de adaptación

**Caso de uso central:** Un negocio pequeño o mediano que vende productos físicos, recibe pedidos por la web, coordina pagos por WhatsApp o transferencia bancaria, y necesita un panel de administración para gestionar su catálogo y sus órdenes.

---

## El principio de las tres zonas

La decisión de diseño más importante del framework es la separación estricta en tres zonas (Core, Config, Cliente). Esta separación no es arbitraria — responde a una pregunta concreta:

> **¿Qué cambia cuando cambia el cliente?**

La respuesta es precisa: cambia el nombre, los colores, el catálogo y la forma de contacto. No cambia la mecánica del carrito, la validación del JWT, ni la estructura de una orden. Por eso el motor (Core) y la identidad (Config) viven en lugares distintos y tienen reglas distintas.

Un framework que mezcla identidad con motor no se puede derivar. Cada fork termina siendo una nueva base inmantenible. La separación en zonas hace que derivar un nuevo negocio sea un trabajo de horas, no de semanas.

---

## Por qué estas tecnologías

### NestJS (no Express puro, no Next.js API routes)

NestJS impone estructura modular desde el primer día. Un framework que va a ser la base de múltiples derivaciones no puede depender de la disciplina del desarrollador individual para mantenerse organizado. La modularidad de NestJS es estructural: si no registras el módulo, no funciona; si no inyectas la dependencia, TypeScript lo detecta.

Además, la combinación de decoradores + DTOs + Swagger da documentación de API casi automática, lo que facilita que un nuevo desarrollador entienda el contrato de la API sin leer el código fuente completo.

### TypeORM con `synchronize: true`

Para un framework que se despliega en nuevos entornos frecuentemente, las migraciones manuales son una fricción que supera su beneficio en la etapa actual. `synchronize: true` permite que el schema de la BD evolucione junto con las entidades durante el desarrollo y en deployments del template base.

La contrapartida conocida es que en producción con datos reales, ciertos cambios destructivos (renombrar columnas, cambiar tipos) deben manejarse con cuidado. Esta es una deuda técnica conocida y aceptada, no un error. Cuando un negocio derivado llegue a escala que lo justifique, la migración a `synchronize: false` + migraciones explícitas es el paso natural.

### React + Vite (no Next.js)

El frontend es una SPA estática servida desde CDN o estático de Railway. No necesita SSR para el caso de uso central del framework: tiendas de nicho con audiencias conocidas donde el SEO no es el canal principal de adquisición.

Vite entrega tiempos de desarrollo rápidos y builds limpios. La ausencia de SSR elimina una capa completa de complejidad en la infraestructura de deploy.

Si en el futuro un negocio derivado requiere SEO intensivo, el path correcto es crear un nuevo frontend Next.js que consuma la misma API, no convertir el template completo.

### JWT en localStorage (no httpOnly cookies)

Esta es una decisión pragmática con un tradeoff conocido. JWT en `localStorage` es vulnerable a XSS; `httpOnly` cookies son más seguras pero requieren configuración cuidadosa de CORS y sameSite.

Para el perfil de cliente del framework (tiendas de nicho, sin datos financieros críticos en la sesión), el riesgo de XSS en un frontend sin dependencias de terceros sospechosas es bajo y el costo de implementar cookies correctamente es alto. Si un negocio derivado sube de escala o requiere mayor seguridad, este es el cambio que deben hacer primero.

---

## Principios de diseño del código

### 1. La configuración es código tipado

Las constantes del negocio (colores, textos, URLs, claves de storage) se expresan como objetos TypeScript tipados en `src/config/`, no como JSON ni como variables de entorno del frontend. Esto tiene consecuencias deliberadas:
- Los errores de configuración se detectan en tiempo de compilación
- El autocompletado del IDE funciona en toda la base de código
- La configuración es un contrato documentado, no un conjunto de strings mágicos

### 2. Los módulos son islas

Cada módulo del backend (auth, products, carts, etc.) debe poder explicarse sin conocer los otros. Un módulo que requiere entender tres módulos más para funcionar es un módulo mal diseñado. Las dependencias entre módulos son explícitas, mínimas y siempre van en una dirección (no hay ciclos).

### 3. Los componentes no conocen la API

Los componentes de React no hacen llamadas HTTP directamente. Consumen hooks o funciones de `lib/`. Esta separación tiene un motivo práctico: cuando cambia el contrato de la API (un endpoint nuevo, un campo renombrado), el cambio se hace en un solo lugar (`lib/` o el hook) y no se dispersa por docenas de componentes.

### 4. El precio del coleccionismo: especificaciones flexibles

Los productos tienen un campo `specifications: Array<{ label: string; value: string }>` almacenado como JSON. Esta flexibilidad es intencional: los productos de coleccionismo tienen atributos muy variables (escala, material, serie, año, edición limitada, etc.) que no pueden modelarse con columnas fijas sin crear una entidad con decenas de campos opcionales.

La contrapartida es que no se puede filtrar por especificación directamente desde SQL. Si en el futuro se necesita filtrado por especificación, el paso correcto es crear una entidad `ProductAttribute` normalizada, no intentar filtrar el JSON.

### 5. El guest checkout no es un ciudadano de segunda clase

El sistema soporta órdenes de invitados (sin cuenta) como un caso de uso de primer nivel. En negocios de nicho, una fracción significativa de los compradores no quiere crear una cuenta. Obligarlos a registrarse reduce la conversión. Por eso `Order.userId` es nullable y los campos `customerName`, `customerEmail`, `customerPhone` existen directamente en la entidad.

### 6. WhatsApp como canal de confirmación, no de pago

La integración con WhatsApp en este framework es de comunicación, no transaccional. El flujo es: el cliente hace el pedido en la web → el sistema genera un mensaje pre-formateado → el cliente lo envía al WhatsApp del negocio → el negocio confirma y coordina el pago. Esto no reemplaza una pasarela de pago; la complementa en el contexto de negocios donde la confianza personal es parte del proceso de compra.

---

## Módulos en desarrollo y su estado

### PaymentsModule — Preparado, no implementado

`PaymentsModule` existe con su estructura base y el enum `PaymentProvider` (MercadoPago, Webpay, Flow). El módulo intencional está vacío de lógica porque:

1. Cada negocio derivado usará un proveedor diferente según su país
2. La integración con pasarelas de pago requiere credenciales reales de prueba
3. Implementarla en el template base sin un negocio real la convierte en código no probado

**Cuándo implementar:** Cuando un negocio derivado específico decida su proveedor de pago. La implementación debe hacerse en el fork del negocio, no en el template base, a menos que sea una implementación genérica y verificada.

### OrdersModule — Funcional, revisable

`OrdersModule` funciona correctamente para el caso de uso actual. El DTO y la entidad están en revisión para decidir si el `total` debe calcularse en el backend (sumando `orderItems`) en lugar de aceptarse como input del frontend. Esta es una decisión de seguridad pendiente.

---

## Visión a largo plazo

### Lo que este framework debe ser en 12 meses

Un punto de partida desde el cual cualquier desarrollador (o IA) pueda entregar una tienda funcional y desplegable en Railway en menos de una jornada de trabajo, solo configurando la Zona Config y cargando el catálogo inicial.

Para llegar ahí, la documentación (este conjunto de archivos) es tan importante como el código. Una base que no puede explicarse a sí misma no puede ser derivada con confianza.

### Lo que este framework no debe intentar ser

- Un competidor de Shopify o WooCommerce
- Una plataforma multi-tenant con un backend compartido
- Un sistema con alta carga de tráfico como caso de uso principal
- Una plataforma de marketplace (múltiples vendedores)

Estos casos de uso requieren decisiones arquitectónicas que son incompatibles con la simplicidad que hace al framework derivable. Agregar complejidad para casos que no son el caso de uso central es el camino más seguro para convertir una base limpia en un monolito ilegible.

### El criterio para agregar algo al Core

Una funcionalidad pertenece al Core si:
1. Todos los negocios derivados la necesitarán
2. Su ausencia hace que el motor no funcione

Una funcionalidad pertenece a la Config si:
1. Su valor cambia por negocio pero su forma es siempre la misma

Una funcionalidad pertenece a un fork específico si:
1. Solo ese negocio la necesita

Cuando la respuesta no es clara, el criterio de desempate es: **¿El template base compila y despliega sin esto?** Si sí, probablemente es un fork.

---

## Reglas no negociables

Estas reglas existen porque su violación ha causado o puede causar problemas reales. No son preferencias de estilo — son invariantes del sistema.

1. **Los secrets nunca van en el código.** Un secreto commiteado en git está comprometido permanentemente, independientemente de si se elimina después. Railway y Docker Compose existen precisamente para no necesitar commitear credenciales.

2. **Los tipos del contrato compartido nunca usan `any`.** El archivo `frontend/src/types/index.ts` describe el contrato entre backend y frontend. Un `any` ahí propaga la pérdida de tipo a través de toda la base de código.

3. **Cada módulo backend tiene su DTO de entrada validado.** Un endpoint que acepta datos sin validar es una vulnerabilidad. No es aceptable crear endpoints de producción sin DTOs con `class-validator`.

4. **`app.module.ts` solo registra módulos.** No tiene lógica. No tiene condiciones. Si algo necesita ejecutarse al inicio de la aplicación, va en `main.ts` o en el `onModuleInit()` del módulo correspondiente.

5. **El CRUD de productos es solo para admins.** Los endpoints de creación, edición y eliminación de productos tienen `@UseGuards(JwtAuthGuard, RolesGuard)` y `@Roles('admin')`. Quitarlos expone el catálogo a modificaciones anónimas.
