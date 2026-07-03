import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const port = Number(process.env.PORT ?? 8080);

  return {
    nodeEnv,
    port,
    isProduction: nodeEnv === 'production',
  };
});
