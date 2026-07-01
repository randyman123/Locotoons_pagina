# Revisión de seguridad rápida — Locotoons Template

Revisa los cambios actuales (`git diff`) buscando problemas de seguridad específicos para este stack.

---

## Qué revisar

### Backend (NestJS)

- [ ] **Autenticación**: ¿Los endpoints nuevos tienen `@UseGuards(JwtAuthGuard)`? Si son públicos, ¿está justificado?
- [ ] **Validación de entrada**: ¿Los DTOs usan `class-validator`? ¿Falta `ValidationPipe`?
- [ ] **SQL injection**: ¿Se usa TypeORM query builder con parámetros, no interpolación de strings?
- [ ] **Exposición de datos**: ¿Las entidades devuelven campos sensibles (password, tokens)? Usar `@Exclude()` o DTOs de respuesta
- [ ] **CORS**: ¿Se modificó la configuración de CORS en `main.ts`?
- [ ] **Secrets**: ¿Hay credenciales, API keys o tokens hardcodeados en el diff?
- [ ] **Variables de entorno**: ¿Se accede a `process.env` directo en lugar de `ConfigService`?

### Frontend (React)

- [ ] **XSS**: ¿Se usa `dangerouslySetInnerHTML`? Si sí, ¿el contenido es de una fuente confiable?
- [ ] **Tokens en localStorage**: ¿Se almacenan tokens JWT en localStorage? (Riesgo XSS — preferir httpOnly cookies)
- [ ] **URLs de API**: ¿Las URLs base están en variables de entorno, no hardcodeadas?
- [ ] **Datos del usuario en la URL**: ¿Se pasan datos sensibles por query params?

### General

- [ ] **Dependencias nuevas**: ¿Se agregó algún paquete npm no auditado?
- [ ] **Archivos de entorno**: ¿Hay `.env` o archivos con secretos en el diff?

---

## Ejecuta esta revisión

1. Corre `git diff HEAD` para ver los cambios actuales
2. Revisa cada punto de la lista anterior
3. Reporta: qué pasó ✅, qué falló ❌, qué necesita revisión manual ⚠️
