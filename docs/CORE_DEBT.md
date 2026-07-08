# CORE_DEBT — Registro oficial de deuda técnica y arquitectónica del Core

Este documento no es un backlog de tareas. Es el registro de decisiones pendientes y defectos estructurales del **Business Core**, descubiertos durante el proceso de derivar negocios reales a partir del template. Su función es servir de insumo para decidir cómo evoluciona el Core en futuras versiones — no para resolver urgencias.

---

## 1. Propósito del documento

Cada vez que se deriva un negocio nuevo (`01_restaurante`, `02_turismo`, `03_ecommerce`, ...), el proceso expone huecos que no eran visibles con una sola instancia (`00_core` / Locotoons). Sin un registro formal, estos huecos se resuelven de dos maneras malas:

1. **Se parchan solo en el fork** — el mismo problema reaparece en la siguiente derivación, multiplicando trabajo y divergencia entre negocios que deberían compartir el mismo motor.
2. **Se olvidan** — quedan como conocimiento tácito de quien hizo la derivación, hasta que alguien los vuelve a descubrir por las malas.

`CORE_DEBT.md` existe para romper ese ciclo. Es la fuente de verdad de:

- Qué se sabe que está mal o incompleto en el Core.
- Por qué es deuda de Core y no una tarea normal de Config/Cliente.
- Qué tan urgente es resolverlo y en qué versión del Core debería resolverse.

**Regla institucional (ver `docs/PRODUCT_PHILOSOPHY.md` y las reglas del proyecto):** toda deuda registrada aquí se resuelve en `00_core`, nunca solo en un fork derivado. Un fork puede *descubrir* deuda; no la *resuelve* por su cuenta.

---

## 2. Cómo registrar una nueva deuda

1. **Cuándo registrar:** en el momento en que, durante una derivación (o durante desarrollo normal del Core), se descubre que:
   - Un archivo de Zona Core tiene un valor, string o decisión que debería vivir en Config y no lo hace.
   - La documentación del Core omite un paso, archivo o regla necesaria para derivar correctamente.
   - El tooling compartido (skills, scripts, checklists) no es consistente entre instancias.
   - Existe una decisión de arquitectura sin resolver (p. ej. el alcance de una zona).
2. **Dónde registrar:** una nueva entrada en la sección 7 (Registro de deudas) de este archivo, en `00_core`. No se registra deuda de Core en el `docs/` de un fork.
3. **Cómo registrar:** asignar el siguiente ID disponible en secuencia (`CORE-DEBT-0XX`), sin reutilizar IDs de entradas cerradas o descartadas. Completar los 11 campos mínimos (sección 7, plantilla). No dejar campos en blanco — si algo no aplica, escribir `N/A` con una razón breve.
4. **Quién puede registrar:** cualquier persona o agente (incluido Claude Code) que esté trabajando en una derivación o en el Core mismo. No requiere aprobación previa registrar — sí requiere aprobación decidir resolverla.
5. **Qué NO es una deuda de Core:** cambiar el nombre del negocio, sus colores, su catálogo, sus textos de marketing. Eso es Zona Config o Zona Cliente funcionando como se espera — no se registra aquí.

---

## 3. Criterios para clasificar

### Para asignar Categoría

Preguntar, en este orden:

1. ¿El problema es que código dentro de la Zona Core viola sus propias reglas (p. ej. tiene un string de negocio hardcodeado)? → **Core Code**.
2. ¿El problema es que un límite de zona (Core/Config/Cliente) o una decisión de diseño está indefinido o es ambiguo? → **Architecture**.
3. ¿El problema es que la documentación oficial (`CORE.md`, `ARCHITECTURE.md`, `PRODUCT_PHILOSOPHY.md`) es incompleta, inconsistente o engañosa? → **Documentation**.
4. ¿El problema afecta el flujo de trabajo de quien deriva o desarrolla (skills, comandos, checklists, fricción operativa)? → **Developer Experience (DX)**.
5. ¿El problema está en el mecanismo mismo de derivación (cómo se activa una demo, cómo se propaga un cambio, ausencia de automatización)? → **Template System**.
6. ¿El problema es de infraestructura, build o despliegue (Railway, Docker, nixpacks)? → **Deployment**.
7. ¿El problema expone datos, credenciales o superficie de ataque? → **Security**.
8. ¿El problema afecta tiempos de respuesta, uso de recursos o escalabilidad? → **Performance**.

Si una deuda calza en más de una categoría, se elige la que representa la **causa raíz**, no el síntoma más visible.

### Para asignar Prioridad

| Prioridad | Criterio |
|---|---|
| **Critical** | Bloquea una derivación, compromete seguridad/datos, o rompe una instancia ya desplegada. |
| **High** | Viola la garantía central del framework ("derivar toca solo Config y Cliente") o genera deuda que se repite en **cada** derivación futura si no se corrige. |
| **Medium** | Fricción real y medible, pero no bloqueante; o una ambigüedad de diseño sin impacto inmediato en producción. |
| **Low** | Cosmético. Cero impacto funcional. Molesta pero no engaña ni bloquea a nadie. |

---

## 4. Estados

| Estado | Significado |
|---|---|
| **Open** | Registrada. Sin dueño, sin plan, sin fecha. |
| **Planned** | Se decidió resolverla y existe un enfoque acordado, pero el trabajo no ha comenzado. |
| **In Progress** | Se está trabajando activamente en la solución, en `00_core`. |
| **Resolved** | Corregida en `00_core`, verificada (build limpio / `tsc --noEmit` según corresponda), y — si existen forks activos afectados — portada a esos forks. |
| **Won't Fix** | Se decidió conscientemente no resolverla. La razón queda registrada en el campo **Observaciones**, nunca se cierra sin justificación escrita. |

---

## 5. Prioridades

Ver tabla en la sección 3 ("Para asignar Prioridad"). Se usan exactamente estos cuatro niveles: **Critical, High, Medium, Low**. No se crean niveles intermedios.

---

## 6. Categorías

| Categoría | Qué cubre |
|---|---|
| **Core Code** | Código en `backend/src/{auth,users,config}/`, `app.module.ts`, `main.ts`, o el frontend Core (`lib/api.ts`, `AuthContext`, guards, `types/index.ts`) que viola sus propias reglas de diseño. |
| **Architecture** | Decisiones de separación de zonas (Core/Config/Cliente/Demo) que están indefinidas, o identidad estructural del framework sin resolver. |
| **Documentation** | Gaps, inconsistencias o ejemplos engañosos en `CORE.md`, `ARCHITECTURE.md`, `PRODUCT_PHILOSOPHY.md` u otra doc oficial. |
| **Developer Experience (DX)** | Fricción en el tooling que usan desarrolladores humanos o agentes: skills de `.claude/commands/`, checklists operativos, procesos de trabajo. |
| **Template System** | El mecanismo de derivación en sí: activación de `template.config.ts`, Zona Demo, scripts de seed/sync, ausencia de automatización. |
| **Deployment** | Configuración de infraestructura, build y despliegue: Railway, Docker, nixpacks. |
| **Security** | Exposición de credenciales, datos o superficie de ataque. |
| **Performance** | Tiempos de respuesta, uso de recursos, escalabilidad. |

---

## 7. Registro de deudas

### Resumen

| ID | Título | Categoría | Prioridad | Estado |
|---|---|---|---|---|
| CORE-DEBT-001 | `app.service.ts` hardcodea el nombre del negocio en el health-check | Core Code | High | Open |
| CORE-DEBT-002 | `auth.module.ts` hardcodea el fallback del JWT secret | Core Code | High | Open |
| CORE-DEBT-003 | `make-admin.ts` hardcodea un email de ejemplo de negocio | Core Code | Low | Open |
| CORE-DEBT-004 | Skills de `.claude/commands/` tienen el nombre de instancia grabado en el título | Developer Experience (DX) | Medium | Open |
| CORE-DEBT-005 | `docs/workflow-claude-code.md` tiene el nombre de instancia en el título | Developer Experience (DX) | Low | Open |
| CORE-DEBT-006 | El framework no tiene identidad propia, distinta de su primer negocio derivado | Architecture | High | Open |
| CORE-DEBT-007 | Ejemplo de código en `CORE.md` usa un nombre de negocio real en vez de un placeholder | Documentation | Low | Open |
| CORE-DEBT-008 | El checklist de Zona Config en `CORE.md` no cubre archivos de identidad no-TS | Documentation | Medium | Open |
| CORE-DEBT-009 | No existe un gate que impida derivar desde `00_core` con cambios sin commitear | Developer Experience (DX) | Medium | Open |
| CORE-DEBT-010 | Sin definición formal de qué pasa con `backend/src/template/demos/` en un fork ya derivado | Architecture | Medium | Open |
| CORE-DEBT-011 | La derivación es 100% manual, sin herramienta que la automatice o valide | Template System | High | Open |

---

### CORE-DEBT-001 — `app.service.ts` hardcodea el nombre del negocio en el health-check

| Campo | Valor |
|---|---|
| **Categoría** | Core Code |
| **Prioridad** | High |
| **Estado** | Open |
| **Detectada en** | `01_restaurante` — `backend/src/app.service.ts` |
| **Resolver en** | `00_core` — `backend/src/app.service.ts` |

**Descripción:** El endpoint raíz devuelve `status: "Locotoons API running"` como string literal, en vez de derivarlo de `TEMPLATE_SWAGGER.title` (definido en `template.config.ts`).

**Impacto:** Rompe la garantía central del framework — "derivar un negocio nuevo solo toca Config y Cliente". Este archivo es Zona Core (no está en la lista de archivos a modificar en `CORE.md`), pero en la práctica cada fork necesita editarlo a mano o queda con el nombre de negocio equivocado en el health-check.

**Propuesta de solución:** Reemplazar el literal por `TEMPLATE_SWAGGER.title` importado de `../template/template.config`.

**Observaciones:** Cambio de una línea, bajo riesgo. Requiere `tsc --noEmit` después del cambio.

---

### CORE-DEBT-002 — `auth.module.ts` hardcodea el fallback del JWT secret

| Campo | Valor |
|---|---|
| **Categoría** | Core Code |
| **Prioridad** | High |
| **Estado** | Open |
| **Detectada en** | `01_restaurante` — `backend/src/auth/auth.module.ts` |
| **Resolver en** | `00_core` — `backend/src/auth/auth.module.ts` |

**Descripción:** `configService.get<string>("JWT_SECRET", "locotoons-secret")` hardcodea el fallback en vez de usar `TEMPLATE_JWT_SECRET_FALLBACK` (ya definido en `template.config.ts`).

**Impacto:** Mismo problema estructural que CORE-DEBT-001: código Core con dato de negocio embebido. Este fix específico **ya se implementó en `00_core` durante una sesión anterior, pero nunca se commiteó** — `01_restaurante` se forkeó antes de que existiera, así que no lo heredó. Ver también CORE-DEBT-009 (falta de gate de derivación), que es la causa de que este fix se haya "perdido" en el camino.

**Propuesta de solución:** Confirmar que el fix ya presente en el working tree de `00_core` (import de `TEMPLATE_JWT_SECRET_FALLBACK`) se commitea, y portarlo a `01_restaurante`.

**Observaciones:** Prioridad alta no por severidad de seguridad (el secreto real sigue viniendo de `.env` / Railway), sino porque expone la falla de proceso descrita en CORE-DEBT-009.

---

### CORE-DEBT-003 — `make-admin.ts` hardcodea un email de ejemplo de negocio

| Campo | Valor |
|---|---|
| **Categoría** | Core Code |
| **Prioridad** | Low |
| **Estado** | Open |
| **Detectada en** | `01_restaurante` — `backend/src/scripts/make-admin.ts` |
| **Resolver en** | `00_core` — `backend/src/scripts/make-admin.ts` |

**Descripción:** El mensaje de error `'Debes indicar un email. Ejemplo: npm run users:make-admin -- admin@locotoons.com'` usa un dominio de ejemplo específico de la primera instancia.

**Impacto:** Ninguno funcional. Es un mensaje de ayuda de CLI que ve solo quien ejecuta el script localmente.

**Propuesta de solución:** Cambiar el ejemplo a un dominio genérico (`admin@ejemplo.com` o similar) que no implique ningún negocio real.

**Observaciones:** Se agrupa como deuda solo por consistencia del patrón — no amerita atención urgente por sí sola.

---

### CORE-DEBT-004 — Skills de `.claude/commands/` tienen el nombre de instancia grabado en el título

| Campo | Valor |
|---|---|
| **Categoría** | Developer Experience (DX) |
| **Prioridad** | Medium |
| **Estado** | Open |
| **Detectada en** | `01_restaurante` — `.claude/commands/checklist.md`, `contexto.md`, `nueva-feature-frontend.md`, `nuevo-modulo-backend.md`, `revisar-seguridad.md` |
| **Resolver en** | `00_core` — mismos 5 archivos |

**Descripción:** Los 5 títulos de skills terminan en "— Locotoons Template". Estos archivos son tooling compartido: deberían ser idénticos en cada fork, no algo que cada derivación reescribe con su propio nombre.

**Impacto:** Si cada fork le pone su propio nombre a estos títulos, se pierde la garantía de que los skills son intercambiables entre derivaciones, y diverge tooling que debería mantenerse sincronizado.

**Propuesta de solución:** Genericizar el wording una sola vez en `00_core` (p. ej. "— Business Core Template" o el nombre que se decida en CORE-DEBT-006) y no volver a tocarlo en los forks.

**Observaciones:** Depende de resolver primero CORE-DEBT-006 (nombre propio del framework) para no genericizar dos veces.

---

### CORE-DEBT-005 — `docs/workflow-claude-code.md` tiene el nombre de instancia en el título

| Campo | Valor |
|---|---|
| **Categoría** | Developer Experience (DX) |
| **Prioridad** | Low |
| **Estado** | Open |
| **Detectada en** | `01_restaurante` — `docs/workflow-claude-code.md` |
| **Resolver en** | `00_core` — mismo archivo |

**Descripción:** El título del documento dice "— Locotoons Template", igual que las skills de CORE-DEBT-004.

**Impacto:** Bajo — es un documento de referencia, no algo que se ejecute o que otro archivo importe.

**Propuesta de solución:** Mismo tratamiento que CORE-DEBT-004, idealmente en el mismo cambio.

**Observaciones:** Se registra separado de CORE-DEBT-004 solo porque vive en `docs/` y no en `.claude/commands/`, pero se resuelven juntos en la práctica.

---

### CORE-DEBT-006 — El framework no tiene identidad propia, distinta de su primer negocio derivado

| Campo | Valor |
|---|---|
| **Categoría** | Architecture |
| **Prioridad** | High |
| **Estado** | Open |
| **Detectada en** | `01_restaurante` — `docs/PRODUCT_PHILOSOPHY.md` (heredado tal cual desde `00_core`) |
| **Resolver en** | `00_core` — `docs/PRODUCT_PHILOSOPHY.md` y, por extensión, cualquier doc que repita la frase |

**Descripción:** `PRODUCT_PHILOSOPHY.md` abre con "**Locotoons Template** es un Business Web Framework...". El framework nunca recibió un nombre genérico propio — sigue definiéndose a través del nombre de su primera instancia derivada (una tienda de coleccionables).

**Impacto:** Es la causa raíz de CORE-DEBT-004, CORE-DEBT-005 y CORE-DEBT-007. Mientras el Core no tenga un nombre que no sea "Locotoons", cada limpieza de branding en tooling/docs es parcial o ambigua (¿estamos quitando el nombre de instancia, o el nombre del framework?).

**Propuesta de solución:** Decidir un nombre para el framework en sí (distinto de cualquier negocio derivado) y actualizar `PRODUCT_PHILOSOPHY.md` como fuente de verdad. Esta es una decisión de producto, no solo de documentación — por eso la categoría es Architecture y no Documentation.

**Observaciones:** Esta es probablemente la deuda con mayor efecto dominó del registro. Conviene resolverla antes que CORE-DEBT-004/005/007.

---

### CORE-DEBT-007 — Ejemplo de código en `CORE.md` usa un nombre de negocio real en vez de un placeholder

| Campo | Valor |
|---|---|
| **Categoría** | Documentation |
| **Prioridad** | Low |
| **Estado** | Open |
| **Detectada en** | `01_restaurante` — `docs/CORE.md`, ejemplo de `SITE.name` |
| **Resolver en** | `00_core` — `docs/CORE.md` |

**Descripción:** El bloque de ejemplo de `site.config.ts` en `CORE.md` usa `name: 'Locotoons'` como valor ilustrativo, lo que es ambiguo entre "esto es un ejemplo" y "este es el valor real por defecto".

**Impacto:** Bajo, pero genera la misma confusión de raíz que CORE-DEBT-006: mezcla identidad de instancia con documentación genérica del framework.

**Propuesta de solución:** Reemplazar por un placeholder neutro, p. ej. `'MiNegocio'` o `'ACME'`.

**Observaciones:** Trivial de resolver una vez que se aborde CORE-DEBT-006.

---

### CORE-DEBT-008 — El checklist de Zona Config en `CORE.md` no cubre archivos de identidad no-TS

| Campo | Valor |
|---|---|
| **Categoría** | Documentation |
| **Prioridad** | Medium |
| **Estado** | Open |
| **Detectada en** | `01_restaurante` — `backend/package.json`, `docker-compose.yml`, `backend/.env.example`, `backend/README.md`, `frontend/src/config/README.md` |
| **Resolver en** | `00_core` — `docs/CORE.md`, sección ZONA CONFIG |

**Descripción:** `CORE.md` documenta como Zona Config solo los archivos `.ts` tipados (`business.config.ts`, `site.config.ts`, `theme.config.ts`, `categories.config.ts`, `template.config.ts`). No menciona que, al derivar, también hay que actualizar el nombre del paquete backend, los nombres de contenedor/BD/volumen en `docker-compose.yml`, los valores de ejemplo en `.env.example`, ni los README de instancia.

**Impacto:** Estos 5 archivos se descubrieron con "Locotoons" residual en `01_restaurante` precisamente porque ningún checklist los menciona. Se van a repetir en cada derivación futura hasta que se documenten explícitamente.

**Propuesta de solución:** Agregar estos archivos a la sección ZONA CONFIG de `CORE.md`, aclarando que aunque no son `.ts` tipados, forman parte del mismo checklist de derivación.

**Observaciones:** Relacionado con CORE-DEBT-011 — la solución de más largo plazo no es solo documentar el checklist, sino automatizarlo.

---

### CORE-DEBT-009 — No existe un gate que impida derivar desde `00_core` con cambios sin commitear

| Campo | Valor |
|---|---|
| **Categoría** | Developer Experience (DX) |
| **Prioridad** | Medium |
| **Estado** | Open |
| **Detectada en** | Proceso de derivación de `01_restaurante` |
| **Resolver en** | `00_core` — `docs/CORE.md` o `CLAUDE.md`, nueva sección de "readiness antes de derivar" |

**Descripción:** El fix de CORE-DEBT-002 se hizo en `00_core` en una sesión de trabajo, pero quedó sin commitear. `01_restaurante` se forkeó desde ese estado intermedio y no heredó el fix. No hay ninguna regla documentada que diga "no forkear `00_core` con working tree sucio" ni una forma de verificarlo.

**Impacto:** Cualquier trabajo en progreso en `00_core` que no esté commiteado se pierde silenciosamente en la siguiente derivación — o peor, se hereda de forma inconsistente según el momento exacto del fork.

**Propuesta de solución:** Documentar un checklist mínimo de "readiness" antes de derivar (p. ej. `git status` limpio, `tsc --noEmit` pasa, docs sin cambios pendientes) en `CORE.md` o `CLAUDE.md`.

**Observaciones:** Bajo costo de resolver (es documentación de proceso), impacto potencialmente alto si se repite con cambios más críticos que un fallback de JWT.

---

### CORE-DEBT-010 — Sin definición formal de qué pasa con `backend/src/template/demos/` en un fork ya derivado

| Campo | Valor |
|---|---|
| **Categoría** | Architecture |
| **Prioridad** | Medium |
| **Estado** | Open |
| **Detectada en** | `01_restaurante` — `backend/src/template/demos/restaurante.config.ts` |
| **Resolver en** | `00_core` — `docs/CORE.md`, sección ZONA DEMO |

**Descripción:** La sección "ZONA DEMO" de `CORE.md` explica cómo activar un preset de `demos/` copiándolo sobre `template.config.ts`, pero no especifica qué debería pasar con la carpeta `demos/` **después** de que un fork ya se derivó y activó su preset. Actualmente `01_restaurante` conserva `backend/src/template/demos/restaurante.config.ts` — un archivo inerte que documenta cómo llegar al estado en el que el fork ya está.

**Impacto:** Ambigüedad de diseño, no un bug. Sin definición, cada fork puede terminar con `demos/` en un estado distinto (borrado, conservado, desactualizado), lo cual no rompe nada pero es inconsistente.

**Propuesta de solución (pendiente de decisión, no de implementación):** Evaluar si `demos/` debería:
(a) eliminarse del fork al derivar, quedando solo en `00_core`;
(b) conservarse como referencia histórica de qué preset se usó; o
(c) formalizarse como parte del checklist de derivación con un paso explícito de "decidir y documentar".

**Observaciones:** Explícitamente marcada por decisión del usuario como "no resolver todavía" — requiere análisis antes de definir la propuesta de solución final.

---

### CORE-DEBT-011 — La derivación es 100% manual, sin herramienta que la automatice o valide

| Campo | Valor |
|---|---|
| **Categoría** | Template System |
| **Prioridad** | High |
| **Estado** | Open |
| **Detectada en** | Proceso completo de auditoría de `01_restaurante` (esta ronda de trabajo) |
| **Resolver en** | `00_core` — posible nuevo script en `backend/src/scripts/` o herramienta a nivel de repo |

**Descripción:** Confirmar que una derivación quedó completa hoy requiere una auditoría manual con `grep` sobre ~20 archivos de tipos distintos (TypeScript, JSON, YAML, Markdown). No existe un script que, dado un nombre de negocio, actualice de forma consistente `template.config.ts`, `business.config.ts`, `site.config.ts`, `categories.config.ts`, `package.json`, `docker-compose.yml` y `.env.example`, ni que valide al final que no quedan residuos de la instancia anterior.

**Impacto:** Es la causa raíz que explica por qué existen CORE-DEBT-003, 004, 005, 007 y 008: sin automatización, cada derivación depende de que una persona (o agente) recuerde y ejecute correctamente un checklist manual. A medida que el framework se derive a más rubros (`02_turismo`, `03_ecommerce`, ...), el costo de este proceso manual crece linealmente.

**Propuesta de solución:** Evaluar la construcción de un script de derivación (`npm run derive -- --name="..." --slug="..."`) que centralice los reemplazos y termine con una verificación automática (equivalente al `grep` que se hizo a mano en esta auditoría). Es una decisión de arquitectura, no una tarea trivial — requiere decidir su alcance antes de implementarla.

**Observaciones:** Es la deuda con mayor potencial de prevenir futuras entradas en este mismo registro. Buen candidato a discutir primero al planear la próxima versión del Core.

