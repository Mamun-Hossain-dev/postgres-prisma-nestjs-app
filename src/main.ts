import { ValidationPipe, type ValidationPipeOptions } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const isProduction = configService.getOrThrow<boolean>('app.isProduction');
  const port = configService.getOrThrow<number>('app.port');
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

  await app.listen(port);
}
bootstrap();
