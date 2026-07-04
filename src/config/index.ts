import authConfig from './auth.config';
import appConfig from './app.config';
import databaseConfig from './database.config';
import jwtConfig from './jwt.config';
import redisConfig from './redis.config';

export const configFactories = [
  appConfig,
  databaseConfig,
  jwtConfig,
  authConfig,
  redisConfig,
];

export { appConfig, authConfig, databaseConfig, jwtConfig, redisConfig };
