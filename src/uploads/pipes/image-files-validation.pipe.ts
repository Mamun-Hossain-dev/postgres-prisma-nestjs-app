import {
  FileTypeValidator,
  Injectable,
  MaxFileSizeValidator,
  ParseFilePipe,
  type PipeTransform,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../../common/exceptions/app.exception';

@Injectable()
export class ImageFilesValidationPipe implements PipeTransform<
  Express.Multer.File[] | undefined,
  Promise<Express.Multer.File[]>
> {
  private readonly parseFilePipe: ParseFilePipe;
  private readonly maxFiles: number;

  constructor(configService: ConfigService) {
    this.maxFiles = configService.getOrThrow<number>(
      'cloudinary.maxProductImages',
    );
    const maxSize = configService.getOrThrow<number>('cloudinary.maxFileSize');

    this.parseFilePipe = new ParseFilePipe({
      fileIsRequired: true,
      validators: [
        new MaxFileSizeValidator({ maxSize }),
        new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp|gif)$/ }),
      ],
    });
  }

  async transform(
    files: Express.Multer.File[] | undefined,
  ): Promise<Express.Multer.File[]> {
    if (!files?.length) {
      throw new AppException('At least one image is required', {
        code: 'IMAGES_REQUIRED',
        status: 400,
      });
    }

    if (files.length > this.maxFiles) {
      throw new AppException(
        `A maximum of ${this.maxFiles} images is allowed`,
        {
          code: 'TOO_MANY_IMAGES',
          status: 400,
        },
      );
    }

    return Promise.all(
      files.map(
        async (file) =>
          this.parseFilePipe.transform(file) as Promise<Express.Multer.File>,
      ),
    );
  }
}
