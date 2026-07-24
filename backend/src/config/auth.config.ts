import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS ?? 10),
  refreshTokenTtlSeconds: Number(
    process.env.REFRESH_TOKEN_TTL_SECONDS ?? 60 * 60 * 24 * 30,
  ),
  refreshCookieName: process.env.REFRESH_COOKIE_NAME ?? 'refresh_token',
}));
