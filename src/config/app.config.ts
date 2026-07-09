import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const port = Number(process.env.PORT ?? 8080);
  const host = process.env.HOST ?? '127.0.0.1';

  return {
    nodeEnv,
    port,
    host,
    isProduction: nodeEnv === 'production',
  };
});
