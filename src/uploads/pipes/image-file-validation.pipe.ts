import {
  FileTypeValidator,
  Injectable,
  MaxFileSizeValidator,
  ParseFilePipe,
  type PipeTransform,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ImageFileValidationPipe implements PipeTransform<
  Express.Multer.File | undefined,
  Promise<Express.Multer.File>
> {
  private readonly parseFilePipe: ParseFilePipe;

  constructor(configService: ConfigService) {
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
    file: Express.Multer.File | undefined,
  ): Promise<Express.Multer.File> {
    return (await this.parseFilePipe.transform(file)) as Express.Multer.File;
  }
}
