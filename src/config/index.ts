import authConfig from './auth.config';
import appConfig from './app.config';
import databaseConfig from './database.config';
import jwtConfig from './jwt.config';

export const configFactories = [appConfig, databaseConfig, jwtConfig, authConfig];

export { appConfig, authConfig, databaseConfig, jwtConfig };
