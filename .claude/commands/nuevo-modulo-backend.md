# Crear nuevo módulo NestJS — Locotoons Template

Crea un módulo NestJS completo y seguro siguiendo la estructura del proyecto.

El módulo a crear se llama: $ARGUMENTS

---

## Instrucciones para el agente

1. **Lee primero** `backend/src/products/` como referencia de estructura existente (entity, DTO, service, controller, module).

2. **Crea los archivos en este orden exacto:**

```
backend/src/$ARGUMENTS/
├── dto/
│   ├── create-$ARGUMENTS.dto.ts     # con class-validator
│   └── update-$ARGUMENTS.dto.ts     # extiende PartialType(Create)
├── entities/
│   └── $ARGUMENTS.entity.ts         # TypeORM Entity
├── $ARGUMENTS.controller.ts         # con decoradores Swagger
├── $ARGUMENTS.service.ts            # CRUD básico con TypeORM
└── $ARGUMENTS.module.ts             # registra entity + exports service
```

3. **Reglas obligatorias:**
   - Todos los DTOs tienen `@IsString()`, `@IsNotEmpty()`, `@IsOptional()` según campo
   - El controller tiene `@ApiTags('nombre')` y `@ApiOperation` en cada endpoint
   - El service usa `Repository<Entity>` inyectado vía `@InjectRepository`
   - El module usa `TypeOrmModule.forFeature([Entity])`

4. **Al terminar, muestra** el fragmento exacto que hay que agregar a `app.module.ts`:
```typescript
import { $ArgumentsModule } from './$arguments/$arguments.module';
// agregar en imports: [$ArgumentsModule]
```

5. **Verifica** con `cd backend && npx tsc --noEmit` que compila sin errores.

6. **NO modifiques** `app.module.ts` automáticamente — muéstralo al usuario para que lo apruebe.
