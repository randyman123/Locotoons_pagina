# Workflow profesional con Claude Code — Locotoons Template

Guía de referencia para usar Claude Code sin romper el proyecto.

---

## 1. Comandos custom disponibles (slash commands)

Ejecutar desde la raíz del proyecto en Claude Code:

| Comando | Uso | Descripción |
|---------|-----|-------------|
| `/checklist` | Antes y después de cualquier cambio | Muestra la lista de verificación de cambio seguro |
| `/contexto backend` | Al iniciar sesión de trabajo backend | Carga y resume el estado del backend |
| `/contexto frontend` | Al iniciar sesión de trabajo frontend | Carga y resume el estado del frontend |
| `/contexto payments` | Al trabajar en módulo de pagos | Carga el contexto específico de payments |
| `/contexto orders` | Al trabajar en órdenes | Carga el contexto específico de orders |
| `/nuevo-modulo-backend notifications` | Crear módulo NestJS | Crea estructura completa del módulo |
| `/nueva-feature-frontend ProductCard` | Crear feature React | Crea componente/página/hook tipado |
| `/revisar-seguridad` | Antes de hacer commit | Revisa el diff en busca de vulnerabilidades |

---

## 2. Subagentes recomendados

Estos son los tipos de subagentes que Claude Code puede usar en este proyecto:

### `Explore` — Exploración de código
Usar cuando quieres encontrar algo sin modificar nada.
```
Tarea de ejemplo: "¿Dónde se valida el JWT en el backend?"
→ El agente Explore lee archivos y responde sin riesgo de cambiar nada.
```
**Cómo activarlo:** Claude Code lo usa automáticamente cuando el query es de búsqueda.

### `Plan` — Diseño antes de implementar
Usar antes de tareas grandes (nuevo módulo, refactor, nueva integración).
```
Tarea de ejemplo: "Planea cómo integrar Stripe en el módulo payments"
→ El agente Plan analiza el contexto y devuelve un plan paso a paso.
→ Tú apruebas o corriges el plan ANTES de que escriba código.
```
**Cuándo usarlo:** Siempre que la tarea toque más de 3 archivos.

### `claude` (general) — Implementación
El agente por defecto. Úsalo solo después de tener el plan aprobado.

---

## 3. Prompts seguros por área

### Backend — Modificar servicio existente
```
Lee backend/src/orders/orders.service.ts completo.
Luego agrega el método [nombre] que hace [descripción exacta].
No modifiques ningún método existente.
Al terminar, corre: cd backend && npx tsc --noEmit
```

### Backend — Nuevo endpoint
```
Contexto: módulo [nombre] en backend/src/[nombre]/
Agrega el endpoint [GET|POST|PATCH|DELETE] /[ruta] que [descripción].
El endpoint requiere autenticación JWT.
Usa el DTO existente o crea uno nuevo en dto/.
Agrega decoradores Swagger: @ApiOperation y @ApiResponse.
No toques app.module.ts. Muéstrame qué cambió.
```

### Backend — Modificar entidad
```
PRECAUCIÓN: voy a modificar una entidad TypeORM.
Lee backend/src/[nombre]/entities/[nombre].entity.ts
Identifica qué relaciones tiene con otras entidades.
Agrega el campo [nombre]: [tipo] con el decorador @Column apropiado.
Verifica que synchronize: true puede aplicar este cambio sin destruir datos.
```

### Frontend — Nuevo componente
```
Lee frontend/src/App.tsx para entender el contexto.
Crea el componente [Nombre] en frontend/src/components/[Nombre].tsx
Props: [lista de props con sus tipos]
El componente [descripción de comportamiento].
Sin inline styles masivos. Sin any. Con tipos explícitos.
```

### Frontend — Llamada a API
```
Crea el hook useNombre en frontend/src/hooks/useNombre.ts
Hace fetch a [endpoint] con método [GET|POST].
Tipado de respuesta: [interface o descripción].
Maneja loading, error y data.
La URL base viene de import.meta.env.VITE_API_URL.
```

### Revisión de código sin cambios
```
Lee [archivo] completo.
Dime: ¿qué hace, qué dependencias tiene, qué podría fallar?
No modifiques nada. Solo analiza y responde.
```

---

## 4. Principios de manejo de contexto

### Sesión corta (1-2 tareas)
- Empieza con `/contexto [área]`
- Usa un prompt por tarea
- Cierra con `/checklist`

### Sesión larga (múltiples features)
- Usa subagentes para tareas independientes
- Mantén el contexto principal limpio
- Documenta en el commit qué se hizo y por qué

### Cuando el contexto se llena
Claude Code comprime el historial automáticamente. Para no perder contexto:
1. Guarda el estado en un archivo temporal (scratchpad)
2. Usa `/contexto [área]` para recargar lo esencial
3. Divide tareas grandes en sesiones separadas

---

## 5. Regla de oro

**Tarea pequeña → 1 archivo → 1 cambio → verificación → commit**

Nunca:
- "Refactoriza todo el módulo de orders"
- "Agrega pagos, actualiza el frontend y conecta con la BD"
- "Mejora el código donde veas algo raro"

Siempre:
- "Agrega el campo `status` al DTO de create-order"
- "Crea el endpoint GET /products/:id/related"
- "Mueve la lógica de calcular total a un método privado en OrdersService"

---

## 6. Checklist mental antes de cualquier prompt

1. ¿Sé exactamente qué archivo voy a cambiar?
2. ¿El cambio es mínimo y específico?
3. ¿Tengo el contexto necesario cargado?
4. ¿Sé cómo verificar que funcionó?

Si contestas "no" a cualquiera → usa `/contexto [área]` primero.
