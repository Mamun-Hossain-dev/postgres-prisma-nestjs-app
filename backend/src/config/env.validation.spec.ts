import { validateEnv } from './env.validation';

const requiredEnv = {
  DATABASE_URL: 'postgresql://user:password@localhost:5432/devicedock',
  JWT_SECRET: 'a-production-length-secret',
  GOOGLE_CLIENT_ID: 'google-client-id',
  CLOUDINARY_CLOUD_NAME: 'cloud',
  CLOUDINARY_API_KEY: 'key',
  CLOUDINARY_API_SECRET: 'secret',
};

describe('validateEnv', () => {
  it('requires Stripe credentials even when email is disabled', () => {
    expect(() =>
      validateEnv({
        ...requiredEnv,
        MAIL_ENABLED: 'false',
        STRIPE_ENABLED: 'true',
      }),
    ).toThrow('STRIPE_SECRET_KEY');
  });

  it('accepts independent valid Stripe configuration', () => {
    expect(
      validateEnv({
        ...requiredEnv,
        MAIL_ENABLED: 'false',
        STRIPE_ENABLED: 'true',
        STRIPE_SECRET_KEY: 'sk_test_example',
        STRIPE_WEBHOOK_SECRET: 'whsec_example',
      }),
    ).toMatchObject({ STRIPE_ENABLED: true, MAIL_ENABLED: false });
  });
});
