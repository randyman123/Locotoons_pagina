# Crear nueva feature en el frontend — Locotoons Template

Crea una feature de React de forma segura, mínima y tipada.

La feature a crear: $ARGUMENTS

---

## Instrucciones para el agente

1. **Lee primero** `frontend/src/App.tsx` para entender el router y estructura actual.

2. **Identifica el tipo de feature:**
   - Página completa → crear `frontend/src/pages/NombrePage.tsx`
   - Componente reutilizable → crear `frontend/src/components/Nombre.tsx`
   - Hook de datos → crear `frontend/src/hooks/useNombre.ts`

3. **Reglas obligatorias:**
   - TypeScript estricto: tipar props con `interface`, tipar respuestas de API
   - Sin `any` ni `as unknown`
   - Si hace fetch a la API: usar la URL base desde una variable, no hardcodeada
   - Si es un formulario: validación básica antes de enviar
   - Estilos: CSS modules o clases existentes en `App.css` — no inline styles masivos

4. **Si es una página nueva, muestra** el fragmento de ruta que hay que agregar a `App.tsx`:
```tsx
<Route path="/ruta" element={<NombrePage />} />
```

5. **NO modifiques** `App.tsx` automáticamente — muéstralo al usuario para que lo apruebe.

6. **Verifica** con `cd frontend && npm run build` que compila sin errores TypeScript.
