import type { FactoryProvider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import { EMAIL_TRANSPORTER } from '../constants/email.tokens';

export const emailTransporterProvider: FactoryProvider = {
  provide: EMAIL_TRANSPORTER,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const enabled = configService.get<boolean>('email.enabled', false);

    if (!enabled) {
      return createTransport({ jsonTransport: true });
    }

    const user = configService.get<string>('email.user');
    const password = configService.get<string>('email.password');

    return createTransport({
      host: configService.getOrThrow<string>('email.host'),
      port: configService.getOrThrow<number>('email.port'),
      secure: configService.getOrThrow<boolean>('email.secure'),
      auth: user && password ? { user, pass: password } : undefined,
    });
  },
};
