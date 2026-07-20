import { Test, type TestingModule } from '@nestjs/testing';
import { FILE_STORAGE } from './constants/upload.tokens';
import type { FileStorage } from './interfaces/file-storage.interface';
import { UploadsService } from './uploads.service';

describe('UploadsService', () => {
  let service: UploadsService;
  let fileStorage: jest.Mocked<FileStorage>;
  let upload: jest.MockedFunction<FileStorage['upload']>;
  let deleteFile: jest.MockedFunction<FileStorage['delete']>;

  beforeEach(async () => {
    upload = jest.fn();
    deleteFile = jest.fn();
    fileStorage = {
      upload,
      delete: deleteFile,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        { provide: FILE_STORAGE, useValue: fileStorage },
      ],
    }).compile();

    service = module.get(UploadsService);
  });

  it('cleans up already uploaded images when a later upload fails', async () => {
    const firstFile = {
      buffer: Buffer.from('first'),
      mimetype: 'image/png',
      originalname: 'first.png',
      size: 5,
    };
    const secondFile = { ...firstFile, originalname: 'second.png' };
    upload
      .mockResolvedValueOnce({
        publicId: 'products/first',
        url: 'https://example.com/first.png',
        format: 'png',
        resourceType: 'image',
        bytes: 5,
        originalFilename: 'first',
      })
      .mockRejectedValueOnce(new Error('second upload failed'));

    await expect(service.uploadImages([firstFile, secondFile])).rejects.toThrow(
      'second upload failed',
    );
    expect(deleteFile).toHaveBeenCalledWith('products/first');
  });

  it('delegates image persistence to the configured storage provider', async () => {
    const file = {
      buffer: Buffer.from('image'),
      mimetype: 'image/png',
      originalname: 'avatar.png',
      size: 5,
    };
    const storedFile = {
      publicId: 'uploads/avatar',
      url: 'https://res.cloudinary.com/demo/image/upload/avatar.png',
      format: 'png',
      resourceType: 'image',
      bytes: 5,
      originalFilename: 'avatar',
    };
    upload.mockResolvedValue(storedFile);

    await expect(service.uploadImage(file)).resolves.toEqual(storedFile);
    expect(upload).toHaveBeenCalledWith(file);
  });
});
