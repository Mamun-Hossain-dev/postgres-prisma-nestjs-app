# Agent context

NestJS 11 learning API. TypeScript, PostgreSQL/Prisma, Redis, JWT, Multer, Cloudinary. Feature-first source under `src/`; split Prisma schema under `prisma/schema/`.

## Working style

- Keep output and changes minimal. No filler or speculative abstractions.
- Check existing patterns and dependencies first. Prefer deletion/simplification.
- Preserve user changes. Do not edit `.env` values unless explicitly asked.
- Use pnpm and keep `pnpm-lock.yaml` synchronized.

## Architecture

- Features: `auth`, `users`, `products`, `uploads`.
- Controllers handle HTTP/decorators only. Services own use cases. Repositories own persistence.
- User/product repository chain: `Logging -> Cached -> Prisma`, assembled in the feature module. Add every new repository method through the full chain and invalidate Redis after writes.
- `UploadsModule` is infrastructure only; no generic upload controller. Users own profile-image routes. Products own product-image routes.
- Custom implementations/instances use `Symbol` tokens. Current tokens: `USER_REPOSITORY`, `PRODUCT_REPOSITORY`, `CLOUDINARY_CLIENT`, `FILE_STORAGE`.
- HTTP DTOs and Express/Multer types stay at controller boundaries. Services and repository ports use feature input interfaces and `FileToStore`.
- Depend on `FileStorage`, not Cloudinary directly. Keep provider initialization in factory providers.
- Global JWT guard protects routes. Use `@Public()` deliberately. Role-restricted routes use `RolesGuard` and `@Roles()`.
- Success responses use `@ResponseMessage()` and the global response interceptor. Expected failures use `AppException` with stable code/status.
- Config uses `registerAs`; validate environment additions in `src/config/env.validation.ts` and document them in README.
- Prisma models stay in feature schema files. Every schema change needs a migration and regenerated client.

## Upload rules

- User has one profile image. Replace/delete must clean up the old Cloudinary asset.
- Product has many `ProductImage` records. Multiple-upload failure must clean up partial uploads.
- Persist both secure URL and Cloudinary public ID. Never expose a user's profile-image public ID.
- Multer uses memory storage for bounded images only. Current formats: JPEG, PNG, WebP, GIF.

## Commands

```bash
pnpm install
pnpm run build
pnpm run lint
pnpm test -- --runInBand
pnpm run test:e2e -- --runInBand
pnpm exec prisma validate
pnpm exec prisma generate
pnpm exec prisma migrate deploy
```

Before handoff: format touched files, build, lint, run relevant tests, then `git diff --check`. Do not apply a database migration unless requested or clearly in scope.

## README Maintenance

Whenever implementing a new feature, infrastructure component, or architectural change, keep the README synchronized.

The README should remain concise (medium length), production-oriented, and easy to scan. Do not generate long documentation.

Update the relevant sections whenever applicable.

### Architecture

Briefly document important architectural decisions such as:

- Repository pattern
- Dependency Injection
- Feature-first architecture
- Clean Architecture
- Interface-based design
- Infrastructure abstraction (FileStorage, PaymentGateway, etc.)

### Infrastructure

Document when the project introduces infrastructure such as:

- Redis
- RabbitMQ
- Stripe
- Cloudinary
- PostgreSQL
- Prisma

Briefly explain:

- Why it is used
- Which problem it solves
- How it fits into the application

### Production Patterns

When implemented, document production practices such as:

- Redis caching
- Redis distributed locking (SET NX EX)
- RabbitMQ RPC vs Event Pattern
- Idempotency
- Webhook verification
- Database transactions
- Retry strategy
- Dead Letter Queue (if implemented)
- Manual RabbitMQ acknowledgements
- Singleton infrastructure services
- Configuration validation
- Dependency inversion

Keep each explanation short (2–4 lines).

### Event Flow

If event-driven features are added, include a short architecture flow.

Example:

User Checkout
→ Create Payment Intent
→ Stripe Webhook
→ Update Database
→ Emit payment.succeeded
→ Email Consumer
→ Analytics Consumer

Avoid large diagrams.

### Feature Highlights

Maintain a small "Production Features" section describing only implemented capabilities.

Example:

- JWT Authentication
- Repository Pattern
- Redis Cache
- Redis Distributed Lock
- RabbitMQ RPC
- RabbitMQ Event Pattern
- Stripe Payment Intent
- Stripe Webhook
- PDF Invoice
- Cloudinary Uploads

Only include completed features.

### Keep README Practical

The README should answer these questions quickly:

- What technologies are used?
- Why are they used?
- Which production practices are implemented?
- How is the application architected?
- How can another developer run the project?

Avoid tutorials, implementation details, or internal code explanations.
