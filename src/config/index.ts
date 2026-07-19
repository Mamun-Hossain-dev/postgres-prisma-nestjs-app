import authConfig from './auth.config';
import appConfig from './app.config';
import databaseConfig from './database.config';
import jwtConfig from './jwt.config';
import redisConfig from './redis.config';
import cloudinaryConfig from './cloudinary.config';

export const configFactories = [
  appConfig,
  databaseConfig,
  jwtConfig,
  authConfig,
  redisConfig,
  cloudinaryConfig,
];

export {
  appConfig,
  authConfig,
  cloudinaryConfig,
  databaseConfig,
  jwtConfig,
  redisConfig,
};
