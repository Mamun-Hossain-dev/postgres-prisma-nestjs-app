import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configFactories } from '../config';
import { validateEnv } from '../config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: configFactories,
      validate: validateEnv,
    }),
  ],
  exports: [ConfigModule],
})
export class WorkerConfigModule {}
