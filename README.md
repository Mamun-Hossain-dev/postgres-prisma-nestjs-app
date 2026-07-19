# NestJS Learning API

A feature-first NestJS 11 REST API demonstrating JWT authentication, role-based access, repository decorators, Redis caching, Prisma/PostgreSQL persistence, and Cloudinary image storage through Multer.

## Features

- JWT access tokens with rotating Redis-backed refresh sessions.
- `USER`, `SELLER`, and `ADMIN` authorization roles.
- User management, blocking, and one profile image per user.
- Product CRUD and multiple images per product.
- Cloudinary storage behind a replaceable `FileStorage` abstraction.
- Redis caching and Redis-backed API throttling.
- Consistent success/error response envelopes.
- Zod environment validation and split Prisma schemas.

## Tech stack

- NestJS 11 and TypeScript
- PostgreSQL, Prisma 7, and the PostgreSQL Prisma adapter
- Redis and ioredis
- Passport JWT, bcrypt, and HTTP-only refresh cookies
- Multer memory storage and Cloudinary
- Jest, Supertest, ESLint, and Prettier

## Project structure

```text
.
├── prisma/
│   ├── migrations/                 # Versioned SQL migrations
│   └── schema/
│       ├── schema.prisma           # Generator and datasource
│       ├── users/user.prisma       # User and Role models
│       └── products/product.prisma # Product and ProductImage models
├── src/
│   ├── auth/                       # Login, registration, JWT, refresh sessions
│   │   ├── decorators/
│   │   ├── dto/
│   │   ├── guards/
│   │   ├── interfaces/
│   │   └── strategies/
│   ├── users/                      # User HTTP/use cases/repositories
│   │   ├── constants/              # User repository symbol token
│   │   ├── dto/
│   │   ├── interfaces/
│   │   ├── repositories/
│   │   └── utils/
│   ├── products/                   # Product HTTP/use cases/repositories
│   │   ├── constants/              # Product repository symbol token
│   │   ├── dto/
│   │   ├── interfaces/
│   │   └── repositories/
│   ├── uploads/                    # Reusable upload infrastructure; no controller
│   │   ├── constants/              # Symbol injection tokens
│   │   ├── interfaces/             # FileStorage contract
│   │   ├── pipes/                  # Single/multiple image validation
│   │   ├── providers/              # Cloudinary, Multer, storage bindings
│   │   ├── storage/                # Cloudinary adapter
│   │   └── types/
│   ├── common/                     # Exceptions, filters, interceptors, response utils
│   ├── config/                     # Namespaced config and environment validation
│   ├── prisma/                     # Global Prisma module/service
│   ├── redis/                      # Redis service and throttler storage
│   ├── app.module.ts
│   └── main.ts
├── test/                           # End-to-end tests
└── AGENTS.md                       # Minimal context for coding agents
```

## Architecture conventions

### Feature ownership

Routes live with the domain that owns the operation. User profile uploads belong to `UserController`; product uploads belong to `ProductsController`. `UploadsModule` exposes infrastructure and services, not a generic `/uploads` endpoint.

### Layering

```text
HTTP request
  -> Controller
  -> Feature service
  -> Repository abstraction / UploadsService
  -> Prisma, Redis, or FileStorage
  -> PostgreSQL or Cloudinary
```

Controllers stay thin. Services coordinate use cases and cleanup. Repository implementations handle persistence.

### Repository decorators

Users and products compose repositories as:

```text
Logging repository -> Cached repository -> Prisma repository
```

New repository methods must be implemented through all three layers. Write operations must update or invalidate relevant Redis keys.

### Dependency injection

External implementations and initialized clients use collision-safe symbol tokens:

```ts
export const CLOUDINARY_CLIENT = Symbol('CLOUDINARY_CLIENT');
export const FILE_STORAGE = Symbol('FILE_STORAGE');
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');
```

Application services depend on the `FileStorage` interface. Replacing Cloudinary with S3 only requires a new adapter and provider binding.

HTTP DTOs and `Express.Multer.File` stay at controller boundaries. Controllers map validated Multer files to `FileToStore`; services and repository contracts remain framework-independent.

### Authentication and responses

The global JWT guard protects endpoints unless they use `@Public()`. Role checks use `RolesGuard` plus `@Roles()`.

Successful responses use this envelope:

```json
{
  "success": true,
  "message": "Request successful",
  "data": {}
}
```

Domain failures use `AppException` and the global exception filter:

```json
{
  "success": false,
  "statusCode": 404,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found"
  },
  "timestamp": "2026-07-19T00:00:00.000Z",
  "path": "/api/v1/products/99",
  "requestId": "request-id"
}
```

## Setup

### Requirements

- Node.js 20+
- pnpm
- PostgreSQL
- Redis
- A Cloudinary account

### Install

```bash
pnpm install
```

### Environment

Create `.env` in the project root. Dummy Cloudinary values are suitable for bootstrapping only; replace them before testing uploads.

```env
NODE_ENV=development
HOST=127.0.0.1
PORT=8080
Global_API_PREFIX=api/v1/
CORS_ORIGIN=*

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nestjs_app

REDIS_HOST=localhost
REDIS_PORT=6379

BCRYPT_SALT_ROUNDS=10
JWT_SECRET=replace-with-at-least-16-characters
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_TTL_SECONDS=2592000
REFRESH_COOKIE_NAME=refresh_token

CLOUDINARY_CLOUD_NAME=dummy_cloud_name
CLOUDINARY_API_KEY=dummy_api_key
CLOUDINARY_API_SECRET=dummy_api_secret
CLOUDINARY_FOLDER=nestjs-learning
UPLOAD_MAX_FILE_SIZE=5242880
UPLOAD_MAX_PRODUCT_IMAGES=10
```

Environment values are validated at startup by `src/config/env.validation.ts`.

### Database

```bash
pnpm exec prisma validate
pnpm exec prisma generate
pnpm exec prisma migrate deploy
```

For a new development migration:

```bash
pnpm exec prisma migrate dev --name describe_the_change
```

### Run

```bash
pnpm run start:dev
```

Default base URL:

```text
http://127.0.0.1:8080/api/v1
```

## API by feature

### Authentication

| Method | Route            | Access                           | Purpose                                    |
| ------ | ---------------- | -------------------------------- | ------------------------------------------ |
| POST   | `/auth/register` | Public                           | Register a `USER` account                  |
| POST   | `/auth/login`    | Public                           | Return access token and set refresh cookie |
| POST   | `/auth/refresh`  | Public + refresh cookie          | Rotate session and access token            |
| POST   | `/auth/logout`   | Public + optional refresh cookie | Revoke session and clear cookie            |
| GET    | `/auth/profile`  | Authenticated                    | Return current user                        |

Send access tokens as:

```http
Authorization: Bearer <access-token>
```

### Users

| Method | Route                     | Access        | Purpose                          |
| ------ | ------------------------- | ------------- | -------------------------------- |
| GET    | `/users`                  | Public        | List users                       |
| GET    | `/users/:id`              | Public        | Get user                         |
| POST   | `/users`                  | Admin         | Create a user                    |
| PATCH  | `/users/:id`              | Admin         | Update a user                    |
| PATCH  | `/users/:id/block`        | Admin         | Block non-admin user             |
| PATCH  | `/users/:id/unblock`      | Admin         | Unblock non-admin user           |
| DELETE | `/users/:id`              | Admin         | Delete user and profile asset    |
| PUT    | `/users/me/profile-image` | Authenticated | Add or replace own profile image |
| DELETE | `/users/me/profile-image` | Authenticated | Remove own profile image         |

Profile-image request:

```bash
curl -X PUT http://127.0.0.1:8080/api/v1/users/me/profile-image \
  -H "Authorization: Bearer <access-token>" \
  -F "file=@./avatar.png"
```

### Products

| Method | Route                           | Access        | Purpose                       |
| ------ | ------------------------------- | ------------- | ----------------------------- |
| GET    | `/products`                     | Public        | List products with images     |
| GET    | `/products/:id`                 | Public        | Get product with images       |
| POST   | `/products`                     | Admin, Seller | Create product                |
| PATCH  | `/products/:id`                 | Admin, Seller | Update product                |
| DELETE | `/products/:id`                 | Admin, Seller | Delete product and its assets |
| POST   | `/products/:id/images`          | Admin, Seller | Add multiple product images   |
| DELETE | `/products/:id/images/:imageId` | Admin, Seller | Remove one product image      |

Multiple-image request; repeat the `files` field:

```bash
curl -X POST http://127.0.0.1:8080/api/v1/products/1/images \
  -H "Authorization: Bearer <access-token>" \
  -F "files=@./front.png" \
  -F "files=@./back.png"
```

## Upload behavior

- Accepted formats: JPEG, PNG, WebP, GIF.
- Default maximum: 5 MB per image.
- Default product batch maximum: 10 images.
- Multer keeps bounded files in memory; Cloudinary stores them permanently.
- User replacement deletes the previous Cloudinary asset after database update.
- Partial product upload failures clean up already uploaded assets.
- Database failures trigger cleanup of newly uploaded assets.
- Database stores secure URLs and Cloudinary public IDs. User public IDs are not returned publicly.

## Scripts

```bash
pnpm run build                  # Compile application
pnpm run format                 # Format source and tests
pnpm run lint                   # Lint and auto-fix
pnpm test -- --runInBand       # Unit tests
pnpm run test:watch             # Watch unit tests
pnpm run test:cov               # Coverage
pnpm run test:e2e -- --runInBand
pnpm run start:dev              # Development watch mode
pnpm run start:prod             # Run compiled output
```

## Adding a feature

Follow the existing feature layout where applicable:

```text
feature/
├── dto/
├── interfaces/
├── repositories/
├── feature.controller.ts
├── feature.service.ts
└── feature.module.ts
```

Keep DTO validation at the HTTP boundary, business rules in the service, persistence behind a repository abstraction, and external implementations behind symbol-token providers.
