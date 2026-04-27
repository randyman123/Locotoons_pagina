# Locotoons Backend

Backend MVP de Locotoons construido con NestJS, TypeORM y MySQL.

## Stack

- NestJS
- TypeScript
- TypeORM
- MySQL 8
- Swagger
- JWT para autenticacion

## Estructura general

- `src/auth`: registro, login y JWT
- `src/categories`: categorias del catalogo
- `src/products`: productos del catalogo
- `src/carts`: carrito por usuario autenticado
- `src/orders`: ordenes del usuario autenticado

La API usa prefijo global `api`, por lo que las rutas quedan bajo `http://localhost:3000/api`.

Swagger queda disponible en:

- `http://localhost:3000/api/docs`

## Requisitos

- Node.js 20+
- npm
- Docker y Docker Compose

## Variables de entorno

Crear `backend/.env` tomando como base `backend/.env.example`.

Variables necesarias:

| Variable | Ejemplo | Descripcion |
| --- | --- | --- |
| `APP_PORT` | `3000` | Puerto donde levanta NestJS |
| `APP_URL` | `http://localhost:3000` | URL base esperada del backend |
| `JWT_SECRET` | `locotoons-secret` | Secreto para firmar tokens |
| `JWT_EXPIRES_IN` | `3600s` | Duracion del token JWT |
| `DB_HOST` | `127.0.0.1` | Host de MySQL |
| `DB_PORT` | `3308` | Puerto expuesto por Docker |
| `DB_USERNAME` | `root` | Usuario de base de datos |
| `DB_PASSWORD` | `password` | Password de base de datos |
| `DB_NAME` | `locotoons_dev` | Nombre de la base de datos |

Valores actuales de referencia en `.env.example`:

```env
APP_PORT=3000
APP_URL=http://localhost:3000
JWT_SECRET=locotoons-secret
JWT_EXPIRES_IN=3600s
DB_HOST=127.0.0.1
DB_PORT=3308
DB_USERNAME=root
DB_PASSWORD=password
DB_NAME=locotoons_dev
```

## Levantar el proyecto con Docker + NestJS

### 1. Levantar MySQL con Docker

Desde la raiz del repo:

```bash
docker compose up -d
```

El `docker-compose.yml` actual levanta:

- servicio `mysql`
- imagen `mysql:8.0`
- contenedor `locotoons-mysql`
- puerto `3308` en host hacia `3306` del contenedor
- base `locotoons_dev`

Para revisar que el contenedor este arriba:

```bash
docker compose ps
```

Para detenerlo:

```bash
docker compose down
```

### 2. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 3. Crear archivo `.env`

```bash
cp .env.example .env
```

### 4. Levantar NestJS en desarrollo

```bash
npm run start:dev
```

La API quedara disponible en:

- `http://localhost:3000/api`
- `http://localhost:3000/api/docs`

## Scripts utiles

```bash
npm run start:dev
npm run build
```

`npm run lint` existe en `package.json`, pero hoy no esta operativo porque aun no hay configuracion de ESLint en este backend.

## Autenticacion

El login devuelve:

```json
{
  "accessToken": "jwt-token"
}
```

Los endpoints protegidos usan header:

```http
Authorization: Bearer <token>
```

Reglas actuales:

- usuario normal: puede operar solo sobre sus propios carritos y ordenes
- admin: puede gestionar categorias y productos, y consultar ordenes/carts de otros usuarios cuando la logica lo permite

## Contratos base para frontend

Puntos importantes para que React consuma la API sin adivinar comportamiento:

- todas las rutas usan prefijo `/api`
- las validaciones se ejecutan en backend con `ValidationPipe`
- `orders` no recibe `userId` en el body: el usuario sale del JWT
- `carts/:userId/...` exige JWT y ese `userId` debe coincidir con el usuario autenticado, salvo admin
- `categories` y `products` permiten lectura publica, pero escrituras requieren JWT con rol `admin`
- cuando hay conflicto o recurso inexistente, el backend responde con errores HTTP claros (`400`, `401`, `403`, `404`, `409`)

## Endpoints principales del MVP

### Auth

| Metodo | Ruta | Auth | Descripcion |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | No | Registra usuario |
| `POST` | `/api/auth/login` | No | Login y entrega JWT |

Ejemplo registro:

```json
{
  "email": "usuario@correo.com",
  "name": "Usuario Demo",
  "password": "SuperSecreto123"
}
```

Ejemplo login:

```json
{
  "email": "usuario@correo.com",
  "password": "SuperSecreto123"
}
```

### Categories

| Metodo | Ruta | Auth | Descripcion |
| --- | --- | --- | --- |
| `GET` | `/api/categories` | No | Lista categorias |
| `GET` | `/api/categories/official` | No | Lista categorias oficiales del proyecto |
| `POST` | `/api/categories` | Admin | Crea categoria |
| `POST` | `/api/categories/sync-official` | Admin | Sincroniza categorias oficiales sin romper relaciones existentes |
| `PATCH` | `/api/categories/:id` | Admin | Actualiza categoria |
| `DELETE` | `/api/categories/:id` | Admin | Elimina categoria |

Ejemplo create/update:

```json
{
  "name": "Pokémon",
  "slug": "pokemon",
  "description": "Figuras, cartas, peluches y coleccionables del universo Pokemon."
}
```

Categorias oficiales del proyecto:

- `Pokémon`
- `Digimon`
- `Maquetas`
- `Dragon Ball`
- `Star Wars`
- `Anime`
- `Ropa`

Carga inicial simple:

```bash
npm run categories:sync
```

### Products

| Metodo | Ruta | Auth | Descripcion |
| --- | --- | --- | --- |
| `GET` | `/api/products` | No | Lista productos |
| `GET` | `/api/products/seed` | No | Lista el seed inicial de productos |
| `POST` | `/api/products/clean-test-data` | Admin | Limpia productos de prueba; borra los seguros y oculta los que tengan carritos activos |
| `POST` | `/api/products/sync-seed` | Admin | Sincroniza el seed inicial de productos por `slug` |
| `POST` | `/api/products/prepare-initial-catalog` | Admin | Limpia datos de prueba y siembra el catalogo inicial real |
| `GET` | `/api/products/:id` | No | Detalle de producto |
| `POST` | `/api/products` | Admin | Crea producto |
| `PATCH` | `/api/products/:id` | Admin | Actualiza producto |
| `DELETE` | `/api/products/:id` | Admin | Elimina producto |

Ejemplo create/update:

```json
{
  "title": "Figura Pikachu Classic Pose",
  "slug": "figura-pikachu-classic-pose",
  "description": "Figura coleccionable de Pikachu con acabado brillante, ideal para vitrina y regalo.",
  "price": 24.9,
  "stock": 12,
  "imageUrl": "",
  "categoryId": 1
}
```

Notas:

- `categoryId` es opcional
- `slug` debe ser unico
- si `categoryId` no existe, responde `404`
- existe un seed inicial alineado con las categorias oficiales
- `GET /api/products` solo devuelve productos visibles
- la limpieza de prueba oculta productos asociados a carritos y elimina los que no rompen relaciones

Carga inicial simple de productos:

```bash
npm run products:sync
```

Preparacion completa del catalogo inicial:

```bash
npm run catalog:prepare
```

### Carts

| Metodo | Ruta | Auth | Descripcion |
| --- | --- | --- | --- |
| `GET` | `/api/carts/:userId` | Usuario/Admin | Obtiene carrito |
| `POST` | `/api/carts/:userId/items` | Usuario/Admin | Agrega item |
| `PATCH` | `/api/carts/:userId/items/:itemId` | Usuario/Admin | Actualiza cantidad |
| `DELETE` | `/api/carts/:userId/items/:itemId` | Usuario/Admin | Elimina item |

Ejemplo add item:

```json
{
  "productId": 1,
  "quantity": 2
}
```

Ejemplo update cantidad:

```json
{
  "quantity": 3
}
```

Notas:

- un usuario normal solo puede usar su propio `userId`
- admin puede consultar u operar sobre otros usuarios
- si el producto no existe, responde `404`

### Orders

| Metodo | Ruta | Auth | Descripcion |
| --- | --- | --- | --- |
| `POST` | `/api/orders` | Si | Crea orden para el usuario autenticado |
| `GET` | `/api/orders` | Si | Lista ordenes propias o todas si es admin |
| `GET` | `/api/orders/:id` | Si | Obtiene una orden propia o cualquiera si es admin |

Ejemplo create order:

```json
{
  "shippingAddress": "Av. Siempre Viva 123, Santiago",
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "unitPrice": 49.99
    }
  ]
}
```

Notas importantes:

- el backend ignora cualquier `userId` del cliente; la orden se crea con el usuario del token
- `items` no puede estar vacio
- todos los `productId` deben existir
- el total de la orden se calcula usando el precio real del producto en base de datos
- si falta algun producto, no se crea la orden

## Swagger como fuente de verdad

Para desarrollo del frontend, usar Swagger como referencia viva de contratos:

- `http://localhost:3000/api/docs`

Recomendacion practica:

- revisar en Swagger los DTO exactos antes de consumir cada endpoint
- usar el token JWT desde Swagger o desde el frontend para probar rutas protegidas
- no asumir campos que no esten documentados o no aparezcan en la respuesta real
