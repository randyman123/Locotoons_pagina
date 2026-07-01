# Checklist de cambio seguro — Locotoons Template

Muestra el checklist ANTES y DESPUÉS de cualquier cambio en el proyecto.
No ejecutes código. Solo muestra el checklist formateado.

---

## PRE-CAMBIO — Antes de tocar cualquier archivo

- [ ] Leí el archivo completo que voy a modificar
- [ ] Identifiqué qué otros módulos importan este archivo (`grep -r "nombre" backend/src/`)
- [ ] El cambio es mínimo y específico (no refactorizo de paso)
- [ ] No estoy modificando `app.module.ts` ni `config.module.ts` sin necesidad real
- [ ] No estoy cambiando entidades existentes sin verificar el impacto en BD
- [ ] No agrego dependencias npm sin revisar versiones compatibles

## CAMBIO

- [ ] Solo modifico lo que el task pide
- [ ] Uso TypeScript estricto (sin `any`, sin `as unknown`)
- [ ] Si es endpoint nuevo: tiene decoradores Swagger
- [ ] Si es DTO nuevo: tiene decoradores `class-validator`
- [ ] No hay secrets hardcodeados en el código

## POST-CAMBIO — Verificación obligatoria

- [ ] `cd backend && npx tsc --noEmit` — pasa sin errores
- [ ] Si cambié una entidad: el `synchronize` puede aplicarlo sin perder datos
- [ ] Si cambié un módulo: sigue registrado en `app.module.ts`
- [ ] Si cambié el frontend: `npm run build` en `/frontend` pasa sin errores
- [ ] No eliminé ninguna exportación que otro módulo use
- [ ] El comportamiento existente no cambió (no hay regresión visible)

## ANTES DE HACER COMMIT

- [ ] `git diff` revisado línea por línea
- [ ] No hay archivos `.env` ni secretos en el staging
- [ ] El mensaje del commit describe el WHY, no el WHAT
