import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
  enabled: process.env.MAIL_ENABLED === 'true',
  host: process.env.SMTP_HOST ?? '',
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === 'true',
  user: process.env.SMTP_USER ?? '',
  password: process.env.SMTP_PASSWORD ?? '',
  from: process.env.MAIL_FROM ?? '',
}));
