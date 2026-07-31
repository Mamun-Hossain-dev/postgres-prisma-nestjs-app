import { registerAs } from '@nestjs/config';

export default registerAs('stripe', () => ({
  enabled: process.env.STRIPE_ENABLED === 'true',
  secretKey: process.env.STRIPE_SECRET_KEY ?? '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  currency: (process.env.STRIPE_CURRENCY ?? 'bdt').toLowerCase(),
  minorUnit: Number(process.env.STRIPE_MINOR_UNIT ?? 100),
  paymentLockTtlSeconds: Number(process.env.PAYMENT_LOCK_TTL_SECONDS ?? 30),
}));
