import type { Provider } from '@nestjs/common';
import { FILE_STORAGE } from '../constants/upload.tokens';
import { CloudinaryFileStorage } from '../storage/cloudinary-file.storage';

export const storageProviders: Provider[] = [
  {
    provide: FILE_STORAGE,
    useClass: CloudinaryFileStorage,
  },
];
