import {
  Logger,
  ValidationPipe,
  type ValidationPipeOptions,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import compression from 'compression';
import { createRabbitMqConsumerOptions } from './infrastructure/rabbitmq/rabbitmq.options';
import { RabbitMqQueues } from './infrastructure/rabbitmq/constants/rabbitmq.constants';
import { UserEvents } from './modules/users/events/user.events';
import { EmailWorkerModule } from './workers/email-worker.module';
import { NotificationWorkerModule } from './workers/notification-worker.module';
import { AnalyticsWorkerModule } from './workers/analytics-worker.module';

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

  const [emailWorker, notificationWorker, analyticsWorker] = await Promise.all([
    NestFactory.createMicroservice(
      EmailWorkerModule,
      createRabbitMqConsumerOptions(
        configService,
        RabbitMqQueues.EMAILS,
        UserEvents.CREATED,
      ),
    ),
    NestFactory.createMicroservice(
      NotificationWorkerModule,
      createRabbitMqConsumerOptions(
        configService,
        RabbitMqQueues.NOTIFICATIONS,
        UserEvents.CREATED,
      ),
    ),
    NestFactory.createMicroservice(
      AnalyticsWorkerModule,
      createRabbitMqConsumerOptions(
        configService,
        RabbitMqQueues.ANALYTICS,
        UserEvents.CREATED,
      ),
    ),
  ]);

  await Promise.all([
    emailWorker.listen(),
    notificationWorker.listen(),
    analyticsWorker.listen(),
  ]);
  logger.log('RabbitMQ workers started');

  app.use(helmet());

  app.enableCors(
    configService.get('app.cors', {
      origin: true,
      credentials: true,
    }),
  );

  app.setGlobalPrefix(configService.getOrThrow<string>('app.globalPrefix'));

  app.use(
    compression({
      threshold: 10240, // Compress responses only if they are larger than 10KB
    }),
  );

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
