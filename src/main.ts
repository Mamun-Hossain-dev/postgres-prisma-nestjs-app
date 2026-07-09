import {
  Logger,
  ValidationPipe,
  type ValidationPipeOptions,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  logger.log('Creating Nest application');
  const app = await NestFactory.create(AppModule);
  logger.log('Nest application created');
  const configService = app.get(ConfigService);
  logger.log('Config service resolved');
  const isProduction = configService.getOrThrow<boolean>('app.isProduction');
  const port = configService.getOrThrow<number>('app.port');
  const host = configService.getOrThrow<string>('app.host');
  const validationPipeOptions: ValidationPipeOptions = {
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    stopAtFirstError: true,
    forbidUnknownValues: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    disableErrorMessages: isProduction,
  };

  app.useGlobalPipes(new ValidationPipe(validationPipeOptions));

  logger.log(`Attempting to listen on ${host}:${port}`);
  await app.listen(port, host);
  logger.log(`Server running on http://${host}:${port}`);
}
bootstrap().catch((error: unknown) => {
  if (error instanceof Error) {
    logger.error(`Application failed to start: ${error.message}`, error.stack);
  } else {
    logger.error('Application failed to start with a non-Error value');
  }

  process.exit(1);
});
