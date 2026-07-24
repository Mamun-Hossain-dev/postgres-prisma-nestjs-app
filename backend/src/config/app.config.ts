import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const port = Number(process.env.PORT ?? 8080);
  const host = process.env.HOST ?? '127.0.0.1';
  const corsOrigin = process.env.CORS_ORIGIN ?? '*';
  const appGlobalPrefix = process.env.Global_API_PREFIX ?? 'api/v1/';

  return {
    nodeEnv,
    port,
    host,
    globalPrefix: appGlobalPrefix,
    isProduction: nodeEnv === 'production',
    cors: {
      origin:
        corsOrigin === '*'
          ? true
          : corsOrigin.split(',').map((value) => value.trim()),
      credentials: true,
    },
  };
});
