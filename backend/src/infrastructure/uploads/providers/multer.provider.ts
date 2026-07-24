import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

export const multerModule = MulterModule.registerAsync({
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    storage: memoryStorage(),
    limits: {
      fileSize: configService.getOrThrow<number>('cloudinary.maxFileSize'),
      files: configService.getOrThrow<number>('cloudinary.maxProductImages'),
    },
  }),
});
