import { Module } from '@nestjs/common';
import { ImageFileValidationPipe } from './pipes/image-file-validation.pipe';
import { ImageFilesValidationPipe } from './pipes/image-files-validation.pipe';
import { cloudinaryProviders } from './providers/cloudinary.provider';
import { multerModule } from './providers/multer.provider';
import { storageProviders } from './providers/storage.provider';
import { UploadsService } from './uploads.service';

@Module({
  imports: [multerModule],
  providers: [
    UploadsService,
    ImageFileValidationPipe,
    ImageFilesValidationPipe,
    ...cloudinaryProviders,
    ...storageProviders,
  ],
  exports: [
    multerModule,
    UploadsService,
    ImageFileValidationPipe,
    ImageFilesValidationPipe,
  ],
})
export class UploadsModule {}
