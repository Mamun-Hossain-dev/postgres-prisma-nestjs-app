import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY_CLIENT } from '../constants/upload.tokens';

export const cloudinaryProviders: Provider[] = [
  {
    provide: CLOUDINARY_CLIENT,
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => {
      cloudinary.config({
        cloud_name: configService.getOrThrow<string>('cloudinary.cloudName'),
        api_key: configService.getOrThrow<string>('cloudinary.apiKey'),
        api_secret: configService.getOrThrow<string>('cloudinary.apiSecret'),
        secure: true,
      });

      return cloudinary;
    },
  },
];
