import authConfig from './auth.config';
import appConfig from './app.config';
import databaseConfig from './database.config';
import jwtConfig from './jwt.config';
import redisConfig from './redis.config';
import cloudinaryConfig from './cloudinary.config';
import emailConfig from './email.config';
import rabbitmqConfig from './rabbitmq.config';

export const configFactories = [
  appConfig,
  databaseConfig,
  jwtConfig,
  authConfig,
  redisConfig,
  cloudinaryConfig,
  emailConfig,
  rabbitmqConfig,
];

export {
  appConfig,
  authConfig,
  cloudinaryConfig,
  databaseConfig,
  emailConfig,
  jwtConfig,
  rabbitmqConfig,
  redisConfig,
};
