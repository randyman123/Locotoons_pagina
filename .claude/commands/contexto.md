# Cargar contexto del proyecto — Locotoons Template

Carga los archivos clave para tener contexto completo antes de trabajar.
Área a cargar: $ARGUMENTS  (backend | frontend | payments | orders | todo)

---

## Instrucciones

Lee los archivos correspondientes al área especificada y resume el estado actual en máximo 10 líneas: qué existe, qué está incompleto, qué depende de qué.

### Si $ARGUMENTS es "backend" o "todo":
- `backend/src/app.module.ts`
- `backend/src/config/config.module.ts`
- `backend/src/main.ts`
- `backend/package.json` (solo dependencies)

### Si $ARGUMENTS es "frontend" o "todo":
- `frontend/src/App.tsx`
- `frontend/package.json` (solo dependencies)

### Si $ARGUMENTS es "orders":
- `backend/src/orders/entities/order.entity.ts`
- `backend/src/orders/dto/create-order.dto.ts`
- `backend/src/orders/orders.service.ts`
- `backend/src/orders/orders.controller.ts`

### Si $ARGUMENTS es "payments":
- `backend/src/payments/payments.module.ts`
- `backend/src/payments/payments.service.ts`
- `backend/src/payments/payment-provider.enum.ts`

### Si $ARGUMENTS es "auth":
- `backend/src/auth/` (lista todos los archivos y lee los principales)
- `backend/src/users/entities/user.entity.ts`

---

Después de leer, responde:
1. Estado actual de cada archivo/módulo
2. Dependencias entre módulos relevantes
3. Qué está incompleto o en desarrollo
4. Riesgos a tener en cuenta antes de modificar esta área
