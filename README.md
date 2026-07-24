# DeviceDock

DeviceDock is a full-stack gadget store for mobiles, laptops, tablets, audio
devices, watches, and accessories. The purchase journey currently covers
authentication, product discovery, product details, and a persistent cart.
Order placement and payment are intentionally reserved for the next phase.

The repository contains two independent pnpm projects. Each project owns its
dependencies, lockfile, and pnpm settings.

## Applications

```text
.
├── backend/
│   ├── prisma/                  # Split Prisma schema and migrations
│   ├── src/                     # NestJS application
│   ├── test/                    # End-to-end tests
│   ├── .env                     # Backend environment (ignored by Git)
│   ├── package.json
│   ├── pnpm-lock.yaml
│   └── pnpm-workspace.yaml
├── frontend/
│   ├── app/                     # Next.js App Router pages
│   ├── components/              # Storefront components and providers
│   ├── lib/                     # API client, types, and preview data
│   ├── public/                  # Static storefront assets
│   ├── package.json
│   ├── pnpm-lock.yaml
│   └── pnpm-workspace.yaml
└── README.md
```

There is no shared root `node_modules`, `pnpm-lock.yaml`, or
`pnpm-workspace.yaml`. Run `pnpm install` separately inside each application.

## Current features

### Backend

- JWT access tokens and rotating Redis-backed refresh sessions
- HTTP-only refresh-token cookie
- `USER`, `SELLER`, and `ADMIN` roles
- User management, blocking, and profile images
- Gadget categories, brands, SKUs, slugs, descriptions, prices, stock, and
  specifications
- Product search, filtering, sorting, pagination, and multiple images
- One persistent cart per authenticated user
- Add, update, remove, and clear cart operations
- Cart stock validation, item count, and subtotal
- PostgreSQL persistence through Prisma
- Redis caching, throttling, and session storage
- Cloudinary image storage behind the `FileStorage` abstraction
- Consistent API success/error envelopes
- Optional event-driven welcome emails

### Frontend

- Responsive storefront homepage
- Product catalog with search, categories, and sorting
- Product details and quantity selection
- Login and registration pages
- Refresh-cookie authentication flow
- Persistent server-backed cart
- Loading, empty, and error states
- Local preview products when the public catalog API is unavailable
- Checkout placeholder for the future order/payment phase

## Technology

### Backend

- NestJS 11 and TypeScript
- PostgreSQL and Prisma
- Redis and ioredis
- Passport JWT and bcrypt
- Multer and Cloudinary
- Nodemailer
- Jest, ESLint, and Prettier

### Frontend

- Next.js 14 App Router and React 18
- Tailwind CSS
- TanStack Query
- React Hook Form and Zod
- Radix UI
- Lucide React
- Sonner

## Requirements

- Node.js 20 or later
- pnpm
- PostgreSQL
- Redis
- Cloudinary credentials for image uploads

## Backend setup

### 1. Install dependencies

```bash
cd backend
pnpm install
```

### 2. Configure the environment

The backend reads `backend/.env`. A minimal example is:

```env
NODE_ENV=development
HOST=0.0.0.0
PORT=8080
Global_API_PREFIX=api/v1/
CORS_ORIGIN=http://localhost:3000

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nestjs_app

REDIS_HOST=localhost
REDIS_PORT=6379

BCRYPT_SALT_ROUNDS=10
JWT_SECRET=replace-with-at-least-16-characters
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_TTL_SECONDS=2592000
REFRESH_COOKIE_NAME=refresh_token

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=device-dock
UPLOAD_MAX_FILE_SIZE=5242880
UPLOAD_MAX_PRODUCT_IMAGES=10

MAIL_ENABLED=false
```

Do not commit real secrets. If email is enabled, also configure the SMTP
variables documented in `backend/src/config/env.validation.ts`.

### 3. Prepare Prisma

```bash
pnpm exec prisma validate
pnpm exec prisma generate
pnpm exec prisma migrate deploy
```

`migrate deploy` applies the existing migrations, including the gadget catalog
and cart tables. To create a new development migration:

```bash
pnpm exec prisma migrate dev --name describe_the_change
```

### 4. Start the API

```bash
pnpm run start:dev
```

The default API base URL is:

```text
http://localhost:8080/api/v1
```

## Frontend setup

Open a second terminal:

```bash
cd frontend
pnpm install
cp .env.example .env.local
pnpm run dev
```

`frontend/.env.local` should contain:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

The storefront runs at:

```text
http://localhost:3000
```

For refresh cookies to work consistently, open the frontend with `localhost`
and keep `NEXT_PUBLIC_API_URL` on `localhost` as shown above.

## Quick start

Terminal 1:

```bash
cd backend
pnpm install
pnpm exec prisma generate
pnpm exec prisma migrate deploy
pnpm run start:dev
```

Terminal 2:

```bash
cd frontend
pnpm install
cp .env.example .env.local
pnpm run dev
```

## Main API routes

All routes are relative to `/api/v1`.

### Authentication

| Method | Route            | Access                  | Purpose                           |
| ------ | ---------------- | ----------------------- | --------------------------------- |
| POST   | `/auth/register` | Public                  | Create a customer account         |
| POST   | `/auth/login`    | Public                  | Sign in and create a session      |
| POST   | `/auth/refresh`  | Refresh cookie          | Rotate the session and JWT        |
| POST   | `/auth/logout`   | Optional refresh cookie | Revoke the session                |
| GET    | `/auth/profile`  | Authenticated           | Get the authenticated user        |

Protected requests use:

```http
Authorization: Bearer <access-token>
```

### Products

| Method | Route                           | Access        | Purpose                       |
| ------ | ------------------------------- | ------------- | ----------------------------- |
| GET    | `/products`                     | Public        | Search and filter products    |
| GET    | `/products/:id`                 | Public        | Get product details           |
| POST   | `/products`                     | Admin, Seller | Create a product              |
| PATCH  | `/products/:id`                 | Admin, Seller | Update a product              |
| DELETE | `/products/:id`                 | Admin, Seller | Delete product and images     |
| DELETE | `/products/:id/images/:imageId` | Admin, Seller | Remove one product image      |

Supported product-list parameters:

```text
search
category=MOBILE|LAPTOP|TABLET|AUDIO|WATCH|ACCESSORY
brand
minPrice
maxPrice
featured=true|false
sort=newest|price-asc|price-desc|name-asc
page
limit
```

Example:

```http
GET /api/v1/products?category=LAPTOP&minPrice=50000&sort=price-asc&page=1&limit=20
```

Product create/update requests use `multipart/form-data`. Repeat the `images`
field to upload multiple files:

```bash
curl -X POST http://localhost:8080/api/v1/products \
  -H "Authorization: Bearer <access-token>" \
  -F "title=Nova X1 Pro" \
  -F "sku=MOB-NX1" \
  -F "description=Flagship smartphone" \
  -F "brand=Nova" \
  -F "category=MOBILE" \
  -F "price=89900" \
  -F "quantity=12" \
  -F 'specifications={"Storage":"256 GB","Display":"6.7-inch OLED"}' \
  -F "images=@./front.png"
```

### Cart

Cart routes require authentication.

| Method | Route                    | Purpose                    |
| ------ | ------------------------ | -------------------------- |
| GET    | `/cart`                  | Get cart, count, and total |
| POST   | `/cart/items`            | Add a product              |
| PATCH  | `/cart/items/:productId` | Set an item quantity       |
| DELETE | `/cart/items/:productId` | Remove an item             |
| DELETE | `/cart`                  | Clear the cart             |

Add a product:

```json
{
  "productId": 1,
  "quantity": 2
}
```

Update a quantity:

```json
{
  "quantity": 3
}
```

## Response format

Successful response:

```json
{
  "success": true,
  "message": "Request successful",
  "data": {}
}
```

Expected domain error:

```json
{
  "success": false,
  "statusCode": 404,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found"
  },
  "timestamp": "2026-07-24T00:00:00.000Z",
  "path": "/api/v1/products/999",
  "requestId": "request-id"
}
```

## Architecture

Controllers handle HTTP concerns, services own use cases, and repositories own
persistence.

```text
HTTP request
  -> Controller
  -> Feature service
  -> Repository port
  -> Logging repository
  -> Cached repository
  -> Prisma repository
  -> PostgreSQL
```

The user, product, and cart repositories use this decorator chain. Writes
invalidate or refresh relevant Redis entries.

Uploads are infrastructure-only. User profile-image routes belong to the user
feature, while product-image routes belong to the product feature.

## Validation and tests

Backend:

```bash
cd backend
pnpm run format
pnpm run build
pnpm run lint
pnpm test --runInBand
pnpm exec prisma validate
```

Frontend:

```bash
cd frontend
pnpm run lint
pnpm exec tsc --noEmit
pnpm run build
```

## Upload rules

- Accepted formats: JPEG, PNG, WebP, and GIF
- Default maximum size: 5 MB per image
- Default product limit: 10 images
- User profile replacement removes the previous Cloudinary asset
- Product upload failures clean up partially uploaded assets
- Secure URLs and Cloudinary public IDs are persisted
- User profile-image public IDs are never exposed

## Not implemented yet

- Order creation
- Shipping address and delivery selection
- Stock reservation during checkout
- Payment gateway integration
- Order history and status tracking
