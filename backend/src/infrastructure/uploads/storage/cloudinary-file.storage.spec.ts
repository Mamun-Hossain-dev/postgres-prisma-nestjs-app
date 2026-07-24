import { ConfigService } from '@nestjs/config';
import type {
  UploadApiOptions,
  UploadApiResponse,
  UploadResponseCallback,
} from 'cloudinary';
import { AppException } from '../../../common/exceptions/app.exception';
import type { CloudinaryClient } from '../types/cloudinary-client.type';
import { CloudinaryFileStorage } from './cloudinary-file.storage';

describe('CloudinaryFileStorage', () => {
  const file = {
    buffer: Buffer.from('image'),
    mimetype: 'image/png',
    originalname: 'avatar.png',
    size: 5,
  };

  it('maps a successful Cloudinary response', async () => {
    const result = {
      public_id: 'test-folder/avatar',
      secure_url: 'https://res.cloudinary.com/demo/avatar.png',
      format: 'png',
      resource_type: 'image',
      bytes: 5,
      original_filename: 'avatar',
    } as UploadApiResponse;
    const end = jest.fn();
    const cloudinary = {
      uploader: {
        upload_stream: jest.fn(
          (_options: UploadApiOptions, callback: UploadResponseCallback) => {
            setImmediate(() => callback?.(undefined, result));
            return { end };
          },
        ),
      },
    } as unknown as CloudinaryClient;
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('test-folder'),
    } as unknown as ConfigService;
    const storage = new CloudinaryFileStorage(cloudinary, configService);

    await expect(storage.upload(file)).resolves.toEqual({
      publicId: result.public_id,
      url: result.secure_url,
      format: result.format,
      resourceType: result.resource_type,
      bytes: result.bytes,
      originalFilename: result.original_filename,
    });
    expect(end).toHaveBeenCalledWith(file.buffer);
  });

  it('converts Cloudinary failures to a safe application exception', async () => {
    const cloudinary = {
      uploader: {
        upload_stream: jest.fn(
          (_options: UploadApiOptions, callback: UploadResponseCallback) => {
            setImmediate(() =>
              callback?.({ message: 'provider failure', name: 'Error' }),
            );
            return { end: jest.fn() };
          },
        ),
      },
    } as unknown as CloudinaryClient;
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('test-folder'),
    } as unknown as ConfigService;
    const storage = new CloudinaryFileStorage(cloudinary, configService);

    await expect(storage.upload(file)).rejects.toMatchObject<AppException>({
      code: 'FILE_UPLOAD_FAILED',
      message: 'Unable to upload file',
    });
  });
});
