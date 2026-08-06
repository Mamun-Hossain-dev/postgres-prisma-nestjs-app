# DeviceDock

DeviceDock is a full-stack gadget store built with NestJS and Next.js. It
includes authentication, catalog and cart management, Stripe checkout,
webhook-confirmed payments, order history, admin order management, and PDF
invoices.

Customers can explore a curated collection of phones, laptops, tablets, audio
devices, watches, and accessories through a responsive storefront. Product
pages provide detailed descriptions, specifications, pricing, availability,
and multi-image galleries to support confident purchase decisions.

The shopping journey covers account access, a device-persisted cart, selective
checkout, secure payment, dedicated payment results, order history, and
downloadable invoices. A dedicated administration area brings products,
inventory, customers, and orders together so daily store operations remain
clear and manageable.

## Stack

- **Backend:** NestJS 11, TypeScript, Prisma, PostgreSQL, Redis, RabbitMQ
- **Payments:** Stripe Payment Intents and verified Stripe webhooks
- **Storage and email:** Cloudinary, Multer, Nodemailer, PDFKit
- **Frontend:** Next.js 14, React, Tailwind CSS, TanStack Query, Stripe.js
- **Quality:** Zod environment validation, class-validator, Jest, ESLint,
  Prettier

The repository contains independent `backend` and `frontend` pnpm projects.
Install dependencies inside each directory so their lockfiles remain separate.

## Production features

- JWT authentication with rotating Redis-backed refresh sessions
- Role-based access for users, sellers, and admins
- Local cart persistence, live navbar count, and selective checkout
- Persistent addresses, wishlist, notification preferences, and account inbox
- Saved-address checkout with immutable phone and delivery-address snapshots
- Password changes and per-device Redis session revocation
- Feature-first modular architecture and dependency injection
- Repository pattern for persistence boundaries
- Redis detail, collection, and short-lived catalog-list caches with write
  invalidation, plus throttling and distributed checkout locks
- Stripe Payment Intent, webhook verification, and idempotent payment handling
- Webhook-confirmed refunds with partial-refund support and `refund.completed`
  events for email, notification, and analytics consumers
- Customer refund requests on paid orders with admin approve/deny workflow
- Card checkout and delivery-fee-prepaid cash on delivery
- Audited inventory adjustments with full per-product movement history and
  stock-health filters
- Admin analytics overview with revenue, sales trends, order pipeline, payment
  mix, and best sellers
- Verified-order review submission with admin moderation
- Usage-limited coupons with checkout reservation and release handling
- Atomic payment and order status updates with Prisma transactions
- RabbitMQ RPC for immediate Payment Intent creation responses
- RabbitMQ event processing with manual acknowledgements, retries, and DLQs
- Idempotent email, notification, and analytics consumers
- Payment confirmation email with an attached PDF invoice
- Admin new-order email with customer, delivery, product, and payment details
- Admin fulfilment workflow with one-click fulfillment (direct to delivered),
  shipping, cancellation, confirmation-email resend, and automatic Stripe
  refunds
- Cloudinary uploads behind the `FileStorage` abstraction
- Global validation, response envelopes, logging, and exception handling

## Architecture

Controllers only handle HTTP concerns. Feature services own use cases,
repositories own persistence, and infrastructure is accessed through injected
contracts.

```text
Controller -> Service -> Repository interface -> Prisma repository -> PostgreSQL
                         PaymentGateway       -> StripeService
                         FileStorage          -> Cloudinary storage
```

`PaymentService` depends on `PaymentGateway`, not the Stripe SDK. Nest creates
one `StripeService` provider and initializes its SDK client once. A different
gateway such as bKash, SSLCommerz, PayPal, or Google Pay can replace it without
changing checkout business logic.

User and product persistence uses the `Logging -> Cached -> Prisma` decorator
chain. PostgreSQL remains the source of truth; Redis is limited to caching,
sessions, throttling, and short-lived coordination locks. Public catalog lists
use deterministic one-minute cache keys and concurrent cache misses share one
database load; every product write invalidates affected list and collection
caches.

## Payment flow

```text
Selected local cart items
-> saved or manually entered recipient, phone, and full delivery address
-> delivery area (Dhaka ৳60 / outside Dhaka ৳120) and payment option
-> optional coupon validation and atomic usage reservation
-> backend price, availability, and stock validation
-> Checkout request
-> RabbitMQ process.payment RPC
-> Redis SET NX EX lock
-> Prisma transaction creates order snapshots and PENDING payment
-> Stripe Payment Intent with an idempotency key
-> RPC returns paymentIntentId + clientSecret
-> Stripe.js confirms payment
-> verified Stripe webhook
-> Prisma transaction updates payment and order
-> payment.succeeded events
-> customer confirmation + PDF invoice / admin order email / notification log / analytics log
```

The Stripe webhook is the payment source of truth. A browser response never
marks an order paid or confirms cash on delivery. Card orders pay the products
and delivery charge online. Cash-on-delivery orders pay a card deposit first:
৳100 inside Dhaka or the ৳120 outside-Dhaka delivery charge. The deposit is
credited to the order total and the balance remains due at delivery. Stripe
Payment Intents accept cards only, and checkout amounts are fixed to BDT.

## Refund flow

```text
Admin request
-> business rule validation (payment succeeded, not fully refunded, sufficient balance)
-> Redis SET NX EX lock on the payment
-> Stripe Refund API with an idempotency key
-> Refund saved as REFUND_PENDING with the Stripe refund id
-> verified Stripe refund webhook
-> Prisma transaction updates refund and, on a full refund, payment and order
-> refund.completed events
-> customer refund email / notification log / analytics log
```

Refunds live in a dedicated `refunds` table keyed by payment. The Stripe webhook
remains the source of truth: an admin request only parks a refund as PENDING and
never marks it completed. Full refunds atomically move the payment to `REFUNDED`,
cancel the order, and release redeemed coupon usage. Partial refunds keep the
payment successful, and the refundable balance is recomputed from non-failed
refunds on every request.

### Customer refund request flow

```text
Customer request from the account orders page
-> ownership + captured-payment validation
-> Redis SET NX EX lock per order
-> RefundRequest saved as PENDING
-> Admin review (dedicated admin page or order details)
-> Approve -> existing Stripe refund flow, RefundRequest links the Refund
-> Deny   -> RefundRequest marked DENIED with an optional note
-> customer sees PENDING / APPROVED / DENIED on the order
```

Refund requests live in a dedicated `refund_requests` table keyed by order. A
customer can request a refund only for an order with a captured card payment,
and only one PENDING/APPROVED request is allowed per order. Approving executes
the same Stripe refund flow as an admin-initiated refund; the admin chooses the
amount to return (defaults to the full order total, supports partial refunds),
the request is then linked to the created refund, and the Stripe webhook remains
the completion source of truth. Denied requests can be resubmitted.

### Reliability decisions

- **Distributed lock:** Checkout uses Redis `SET NX EX` to prevent double-click
  and concurrent retry races. Release uses a token-checking Lua script so one
  request cannot release another request's lock. Refund requests take a
  payment-scoped lock with the same mechanism to stop duplicate refunds.
- **Idempotency:** Checkout UUIDs are stored in PostgreSQL and forwarded as
  Stripe idempotency keys. Stripe event IDs have a unique database constraint,
  and each RabbitMQ consumer claims an event before processing it. Refund
  requests carry their own UUID that is persisted and reused as the Stripe
  idempotency key, and refund webhook events use the same deduplication.
- **Transactions:** Selected product IDs and quantities are converted into
  server-priced order snapshots with a pending payment atomically.
  Webhook-driven payment and order transitions are also committed together.
- **Coupon reservations:** Limited coupons reserve one use during checkout.
  Successful webhooks redeem it; failed or cancelled payments release it.
  Currently available coupons are published on the storefront and can be saved
  for checkout.
- **Inventory audit:** Admin stock corrections update the product and create a
  movement record with the operator and reason in the same transaction. A
  movement-history endpoint lets admins trace every +/– change per product.
- **RabbitMQ events:** `ClientProxy.emit()` and `@EventPattern()` handle work
  that does not belong in the webhook response. Consumers manually acknowledge
  messages at most once after success and route failures through timed retries
  to a DLQ. A closed channel leaves its delivery for RabbitMQ to requeue.
- **RPC vs events:** Checkout uses `ClientProxy.send()` with
  `@MessagePattern('process.payment')` because it needs the Payment Intent
  immediately. Payment completion side effects use `emit()` events and never
  hold the RPC request open.
- **Event publication failure:** A publish failure returns a retryable webhook
  error. Stripe retries the webhook; completed consumers safely ignore the
  duplicate event.

## Local setup

Requirements: Node.js 22+, pnpm, Docker, a PostgreSQL/Neon database, and
Cloudinary credentials.

For the Docker Hub production deployment, including Docker/Nginx installation,
environment setup, image build commands, and TLS, see
[DEPLOYMENT.md](./DEPLOYMENT.md).

### Backend

```bash
cd backend
pnpm install
cp .env.example .env
pnpm exec prisma generate
pnpm exec prisma migrate deploy
pnpm run start:dev
```

Configure `backend/.env` using its example. Important groups are PostgreSQL,
Redis, RabbitMQ, JWT, Cloudinary, SMTP, and Stripe. When Stripe is enabled,
`STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are required by startup
validation. When email is enabled, `MAIL_ADMIN_TO` receives confirmed-order
notifications.

For local Stripe webhooks:

```bash
stripe listen --forward-to localhost:8080/api/v1/payments/webhooks/stripe
```

Copy the CLI-provided `whsec_...` value into `STRIPE_WEBHOOK_SECRET`.

### Frontend

```bash
cd frontend
pnpm install
cp .env.example .env.local
pnpm run dev
```

Set `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, NextAuth
settings, and Google OAuth credentials in `frontend/.env.local`.

### Complete Docker stack

```bash
cp backend/.env.example backend/.env
cp .env.local.example .env
docker compose up -d --build
```

Compose starts Redis, RabbitMQ, Mailpit, migrations, the API, and the frontend.
PostgreSQL is provided by the configured Neon/database connection. Local tools:

- Frontend: `http://localhost:3000`
- API: `http://localhost:8080/api/v1`
- RabbitMQ management: `http://localhost:15672`
- Mailpit: `http://localhost:8025`

## Main API routes

All routes are relative to `/api/v1`.

| Method | Route                           | Access           | Purpose                        |
| ------ | ------------------------------- | ---------------- | ------------------------------ |
| POST   | `/auth/register`                | Public           | Register                       |
| POST   | `/auth/login`                   | Public           | Sign in                        |
| POST   | `/auth/refresh`                 | Refresh cookie   | Rotate session                 |
| GET    | `/auth/sessions`                | Authenticated    | List active sessions           |
| DELETE | `/auth/sessions/:id`            | Owner            | Revoke an active session       |
| PATCH  | `/users/me/password`            | Authenticated    | Change account password        |
| GET    | `/account/addresses`            | Authenticated    | List saved addresses           |
| POST   | `/account/addresses`            | Authenticated    | Save a delivery address        |
| GET    | `/account/wishlist`             | Authenticated    | List saved products            |
| POST   | `/account/wishlist`             | Authenticated    | Save a product                 |
| GET    | `/account/notifications`        | Authenticated    | Read account notifications     |
| GET    | `/products`                     | Public           | Search and filter products     |
| POST   | `/products`                     | Admin, Seller    | Create a product               |
| PATCH  | `/products/:id`                 | Admin, Seller    | Update a product               |
| POST   | `/payments/checkout`            | Authenticated    | Create or resume checkout      |
| GET    | `/payments/:id`                 | Owner            | Read webhook-backed status     |
| GET    | `/payments/:id/session`         | Owner            | Restore checkout session       |
| POST   | `/payments/webhooks/stripe`     | Stripe signature | Process webhook                |
| POST   | `/refunds`                      | Admin            | Request a refund               |
| GET    | `/refunds`                      | Admin            | List refunds                   |
| GET    | `/refunds/:id`                  | Admin            | Read a refund                  |
| POST   | `/refund-requests`              | Authenticated    | Request a refund for an order  |
| GET    | `/refund-requests`              | Authenticated    | List owned refund requests     |
| GET    | `/refund-requests/:id`          | Owner            | Read an owned refund request   |
| GET    | `/refund-requests/admin`        | Admin            | List all refund requests       |
| PATCH  | `/refund-requests/admin/:id/approve` | Admin      | Approve and refund (full or chosen amount) |
| PATCH  | `/refund-requests/admin/:id/deny` | Admin          | Deny a refund request          |
| GET    | `/orders`                       | Authenticated    | List owned orders              |
| GET    | `/orders/:id`                   | Owner            | Read owned order               |
| GET    | `/orders/:id/invoice`           | Owner            | Download paid invoice          |
| GET    | `/orders/admin/list`            | Admin            | List all orders                |
| GET    | `/orders/admin/:id`             | Admin            | Read any order                 |
| PATCH  | `/orders/admin/:id/status`      | Admin            | Update fulfilment status       |
| POST   | `/orders/admin/:id/resend-confirmation` | Admin   | Resend confirmation email      |
| GET    | `/orders/admin/:id/invoice`     | Admin            | Download paid invoice          |
| DELETE | `/orders/admin/:id`             | Admin            | Delete pending/cancelled order |
| GET    | `/operations/summary`           | Admin, Seller    | Catalog operation metrics      |
| GET    | `/operations/analytics`         | Admin            | Revenue and sales analytics    |
| GET    | `/operations/inventory`         | Admin, Seller    | Inventory list with stock view |
| PATCH  | `/operations/inventory/:id`     | Admin, Seller    | Record a stock adjustment      |
| GET    | `/operations/inventory/:id/movements` | Admin, Seller | Product stock history     |
| GET    | `/operations/reviews`           | Admin            | Moderate customer reviews      |
| GET    | `/operations/coupons/available` | Public           | List currently usable coupons  |
| POST   | `/operations/coupons`           | Admin            | Create a checkout coupon       |

Checkout requires a client-generated UUID that remains stable across retries
and the selected cart items. Prices and totals are always loaded by the
backend:

```json
{
  "idempotencyKey": "9cf8ed35-c195-49af-a2f1-e747d802b023",
  "paymentMethod": "CASH_ON_DELIVERY",
  "deliveryZone": "DHAKA",
  "customerName": "Mamun Hossain",
  "customerEmail": "mamun@example.com",
  "customerPhone": "01700000000",
  "deliveryAddressLine": "House 12, Road 4",
  "deliveryArea": "Dhanmondi",
  "deliveryCity": "Dhaka",
  "deliveryPostalCode": "1209",
  "couponCode": "SAVE10",
  "items": [
    { "productId": 12, "quantity": 1 },
    { "productId": 28, "quantity": 2 }
  ]
}
```

Protected requests use `Authorization: Bearer <access-token>`. Successful API
responses use `{ success, message, data }`; expected failures include a stable
error code, HTTP status, request ID, timestamp, and path.

## Validation and tests

Run from `backend`:

```bash
pnpm exec prisma validate
pnpm exec prisma generate
pnpm run build
pnpm run lint
pnpm test --runInBand
pnpm run test:e2e --runInBand
```

Run from `frontend`:

```bash
pnpm run build
pnpm run lint
```

Do not apply a new database migration in production until it has been reviewed.
Products support up to four JPEG, PNG, WebP, or GIF images. Request validation
and the product service both enforce the limit, including existing images
during edits. Cloudinary public IDs are retained for cleanup and never exposed
for user profile images.
