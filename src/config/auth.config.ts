import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS ?? 10),
}));
