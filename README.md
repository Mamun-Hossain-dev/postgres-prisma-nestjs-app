# DeviceDock

DeviceDock is a full-stack gadget store for mobiles, laptops, tablets, audio
devices, watches, and accessories. The purchase journey currently covers
authentication, product discovery, product details, a persistent cart,
Stripe checkout, webhook-confirmed payments, order history, and PDF invoices.

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
- Order and immutable order-item snapshots
- Stripe Payment Intents behind a gateway abstraction
- Redis checkout locks and Stripe/webhook idempotency
- Webhook-confirmed payment and order status transitions
- Idempotent RabbitMQ payment consumers and PDF invoice emails
- PostgreSQL persistence through Prisma
- Neon serverless PostgreSQL as the database, with Prisma migrations applied at deploy time
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
- Stripe Payment Element checkout
- Webhook-backed payment status screen
- Order history and authenticated PDF invoice downloads
- Loading, empty, and error states
- Local preview products when the public catalog API is unavailable

## Technology

### Backend

- NestJS 11 and TypeScript
- Neon serverless PostgreSQL and Prisma
- Redis and ioredis
- Passport JWT and bcrypt
- Multer and Cloudinary
- Nodemailer
- Stripe SDK and PDFKit
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
- Docker with Docker Compose (recommended for local infrastructure)
- A Neon serverless PostgreSQL project (used for the database instead of a local Postgres)
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

# Neon serverless PostgreSQL. Paste your Neon connection string (Project -> Connect,
# unpooled/direct connection) and append ?sslmode=require. Example:
# DATABASE_URL=postgresql://neondb_owner:password@ep-xxxx-xxxx.region.aws.neon.tech/devicedock?sslmode=require
DATABASE_URL=postgresql://neondb_owner:replace_with_your_neon_password@ep-your-project-xxxx.us-east-2.aws.neon.tech/devicedock?sslmode=require

REDIS_HOST=localhost
REDIS_PORT=6379

RABBITMQ_URL=amqp://devicedock:devicedock_local_password@localhost:5672
RABBITMQ_PREFETCH_COUNT=10

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

MAIL_ENABLED=true
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
MAIL_FROM=DeviceDock <no-reply@devicedock.local>

STRIPE_ENABLED=true
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CURRENCY=bdt
STRIPE_MINOR_UNIT=100
PAYMENT_LOCK_TTL_SECONDS=30
```

The API publishes destination-specific `user.created.*` events to RabbitMQ.
Separate durable queues process welcome emails, notification logs, and
analytics logs.

To build and run the complete application from the repository root:

```bash
docker compose up -d --build
```

For a Docker frontend build, set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in the
root `.env` before building:

```bash
docker compose up -d --build
```

RabbitMQ Management UI is available at `http://localhost:15672`. Sign in with
the `RABBITMQ_USER` / `RABBITMQ_PASSWORD` values from the root `.env`. These
credentials are for local development only. Local backend processes connect to
AMQP on `localhost:5672`; both ports are bound to the loopback interface.

Mailpit captures local emails instead of delivering them. Its inbox is
available at `http://localhost:8025`, and the backend connects to its SMTP
server on `localhost:1025`. Redis is also exposed only on the loopback
interface at port `6379`.

The integration uses NestJS's built-in RMQ transport: `ClientsModule` and
`ClientProxy` publish persistent events. The HTTP application connects three
RMQ listeners as a hybrid Nest application, and feature-owned consumers handle
events through `@EventPattern()` with manual acknowledgements. The application
code does not call `amqplib` or `amqp-connection-manager` directly.
Registration uses best-effort event publication: it does not wait for RabbitMQ,
and individual publish failures are logged without failing the HTTP response.

Consumer failures use destination-specific durable retry queues. A failed
message is retried after 30 seconds, 1 minute, 5 minutes, 15 minutes, and 30
minutes. If the fifth retry also fails, the message is moved to the source
queue's `.dlq` queue. Retry queues use RabbitMQ message TTL and dead-letter
routing to return messages to their source queues; the original delivery is
acknowledged only after the retry or DLQ copy has been published successfully.

Do not commit real secrets. If email is enabled, also configure the SMTP
variables documented in `backend/src/config/env.validation.ts`.

For local Stripe webhooks, use the Stripe CLI and copy the generated `whsec_`
secret into `STRIPE_WEBHOOK_SECRET`:

```bash
stripe listen \
  --forward-to localhost:8080/api/v1/payments/webhooks/stripe
```

Stripe webhook events are the payment source of truth. Browser confirmation
never marks an order paid.

### Full Docker stack

The backend includes a multi-stage `Dockerfile`. Its final image contains only
production dependencies and compiled output, runs as a non-root user, and uses
`dumb-init` for correct signal handling. Database migrations run in a separate
one-shot container before the backend starts.

Create the environment files if they do not exist, then run Compose from the
repository root:

```bash
cp backend/.env.example backend/.env
cp .env.example .env  # compose orchestration values (gitignored)
docker compose up -d --build
```

`compose.yaml` contains no hardcoded values: every service variable is
interpolated from the root `.env` (`RABBITMQ_USER`, `RABBITMQ_PASSWORD`,
`NEXTAUTH_SECRET`, `CORS_ORIGIN`, host ports, in-network hosts). `backend/.env`
still supplies the application-level secrets (`DATABASE_URL`, `JWT_SECRET`,
Cloudinary keys). Run Compose from the repository root so the root `.env` is
loaded automatically.

The Compose stack starts Redis, RabbitMQ, Mailpit, database migrations, the
NestJS backend, and the Next.js storefront. The database itself is a Neon
serverless PostgreSQL project, so no local Postgres container is required. All
published ports are bound to localhost. RabbitMQ Management UI is at
`http://localhost:15672`, Mailpit is at `http://localhost:8025`, and the
storefront runs at `http://localhost:3000`.

Check container state and application logs with:

```bash
docker compose ps
docker compose logs -f backend
```

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
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
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

### Payments and orders

| Method | Route                       | Access        | Purpose                            |
| ------ | --------------------------- | ------------- | ---------------------------------- |
| POST   | `/payments/checkout`        | Authenticated | Create or resume a Payment Intent  |
| GET    | `/payments/:id`             | Owner         | Read webhook-backed payment status |
| GET    | `/payments/:id/session`     | Owner         | Restore a Stripe checkout session  |
| POST   | `/payments/webhooks/stripe` | Stripe        | Verify and process webhook events  |
| GET    | `/orders`                   | Authenticated | List the current user's orders     |
| GET    | `/orders/:id`               | Owner         | Read an order                      |
| GET    | `/orders/:id/invoice`       | Owner         | Download a paid PDF invoice        |

Checkout creation requires a UUID idempotency key:

```json
{
  "idempotencyKey": "9cf8ed35-c195-49af-a2f1-e747d802b023"
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

- Shipping address and delivery selection
- Stock reservation during checkout
- Automated refunds; the gateway refund contract and Stripe implementation are
  ready for a future authorized refund use case
