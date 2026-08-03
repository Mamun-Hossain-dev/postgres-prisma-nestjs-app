import { z } from 'zod';

const booleanString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

const envSchema = z
  .object({
    NODE_ENV: z

      .enum(['development', 'test', 'production'])
      .default('development'),
    HOST: z.string().min(1).default('127.0.0.1'),
    PORT: z.coerce.number().int().min(1).max(65535).default(8080),
    CORS_ORIGIN: z.string().min(1).default('*'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    REDIS_HOST: z.string().min(1).default('localhost'),
    REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
    RABBITMQ_URL: z
      .string()
      .regex(/^amqps?:\/\//, 'RABBITMQ_URL must use amqp:// or amqps://')
      .default('amqp://localhost:5672'),
    RABBITMQ_PREFETCH_COUNT: z.coerce.number().int().positive().default(10),
    RABBITMQ_RPC_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(1000)
      .max(30000)
      .default(10000),
    CLOUDINARY_CLOUD_NAME: z
      .string()
      .min(1, 'CLOUDINARY_CLOUD_NAME is required'),
    CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
    CLOUDINARY_API_SECRET: z
      .string()
      .min(1, 'CLOUDINARY_API_SECRET is required'),
    CLOUDINARY_FOLDER: z.string().min(1).default('nestjs-learning'),
    UPLOAD_MAX_FILE_SIZE: z.coerce
      .number()
      .int()
      .positive()
      .default(5 * 1024 * 1024),
    UPLOAD_MAX_PRODUCT_IMAGES: z.coerce
      .number()
      .int()
      .min(1)
      .max(20)
      .default(10),
    BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),
    JWT_SECRET: z
      .string()
      .min(16, 'JWT_SECRET must be at least 16 characters long'),
    JWT_EXPIRES_IN: z.string().min(1).default('15m'),
    REFRESH_TOKEN_TTL_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(2_592_000),
    REFRESH_COOKIE_NAME: z.string().min(1).default('refresh_token'),
    GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
    Global_API_PREFIX: z.string().min(1).default('api/v1/'),
    MAIL_ENABLED: booleanString,
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
    SMTP_SECURE: booleanString,
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    MAIL_FROM: z.string().optional(),
    MAIL_ADMIN_TO: z.string().email().optional(),
    STRIPE_ENABLED: booleanString,
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    PAYMENT_LOCK_TTL_SECONDS: z.coerce
      .number()
      .int()
      .min(10)
      .max(300)
      .default(30),
  })
  .superRefine((env, context) => {
    if (env.MAIL_ENABLED) {
      if (!env.SMTP_HOST) {
        context.addIssue({
          code: 'custom',
          path: ['SMTP_HOST'],
          message: 'SMTP_HOST is required when MAIL_ENABLED is true',
        });
      }

      if (!env.MAIL_FROM) {
        context.addIssue({
          code: 'custom',
          path: ['MAIL_FROM'],
          message: 'MAIL_FROM is required when MAIL_ENABLED is true',
        });
      }

      if (!env.MAIL_ADMIN_TO) {
        context.addIssue({
          code: 'custom',
          path: ['MAIL_ADMIN_TO'],
          message: 'MAIL_ADMIN_TO is required when MAIL_ENABLED is true',
        });
      }

      if (Boolean(env.SMTP_USER) !== Boolean(env.SMTP_PASSWORD)) {
        context.addIssue({
          code: 'custom',
          path: ['SMTP_USER'],
          message: 'SMTP_USER and SMTP_PASSWORD must be provided together',
        });
      }
    }

    if (env.STRIPE_ENABLED && !env.STRIPE_SECRET_KEY) {
      context.addIssue({
        code: 'custom',
        path: ['STRIPE_SECRET_KEY'],
        message: 'STRIPE_SECRET_KEY is required when STRIPE_ENABLED is true',
      });
    }

    if (env.STRIPE_ENABLED && !env.STRIPE_WEBHOOK_SECRET) {
      context.addIssue({
        code: 'custom',
        path: ['STRIPE_WEBHOOK_SECRET'],
        message:
          'STRIPE_WEBHOOK_SECRET is required when STRIPE_ENABLED is true',
      });
    }
  });

export type EnvironmentVariables = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `- ${issue.path.join('.') || 'root'}: ${issue.message}`)
      .join('\n');

    throw new Error(`Environment validation failed:\n${errors}`);
  }

  return result.data;
}
