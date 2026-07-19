import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { UploadApiResponse } from 'cloudinary';
import { AppException } from '../../common/exceptions/app.exception';
import { CLOUDINARY_CLIENT } from '../constants/upload.tokens';
import type {
  FileStorage,
  FileToStore,
  StoredFile,
} from '../interfaces/file-storage.interface';
import type { CloudinaryClient } from '../types/cloudinary-client.type';

@Injectable()
export class CloudinaryFileStorage implements FileStorage {
  constructor(
    @Inject(CLOUDINARY_CLIENT)
    private readonly cloudinary: CloudinaryClient,
    private readonly configService: ConfigService,
  ) {}

  async upload(file: FileToStore): Promise<StoredFile> {
    try {
      const result = await this.uploadBuffer(file);

      return {
        publicId: result.public_id,
        url: result.secure_url,
        format: result.format,
        resourceType: result.resource_type,
        bytes: result.bytes,
        originalFilename: result.original_filename,
      };
    } catch (error) {
      throw new AppException('Unable to upload file', {
        code: 'FILE_UPLOAD_FAILED',
        status: 502,
        cause: error,
      });
    }
  }

  async delete(publicId: string): Promise<void> {
    try {
      const rawResult: unknown = await this.cloudinary.uploader.destroy(
        publicId,
        {
          resource_type: 'image',
          invalidate: true,
        },
      );
      const result =
        typeof rawResult === 'object' &&
        rawResult !== null &&
        'result' in rawResult
          ? rawResult.result
          : undefined;

      if (result !== 'ok' && result !== 'not found') {
        throw new Error(`Cloudinary delete returned: ${String(result)}`);
      }
    } catch (error) {
      throw new AppException('Unable to delete file', {
        code: 'FILE_DELETE_FAILED',
        status: 502,
        cause: error,
      });
    }
  }

  private uploadBuffer(file: FileToStore): Promise<UploadApiResponse> {
    const folder = this.configService.getOrThrow<string>('cloudinary.folder');

    return new Promise((resolve, reject) => {
      const stream = this.cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          use_filename: true,
          unique_filename: true,
          overwrite: false,
        },
        (error, result) => {
          if (error) {
            return reject(
              new Error('Cloudinary upload failed', { cause: error }),
            );
          }
          if (!result)
            return reject(new Error('Cloudinary returned no result'));

          resolve(result);
        },
      );

      stream.end(file.buffer);
    });
  }
}
