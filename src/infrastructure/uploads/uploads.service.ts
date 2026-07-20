import { Inject, Injectable } from '@nestjs/common';
import { FILE_STORAGE } from './constants/upload.tokens';
import type {
  FileStorage,
  FileToStore,
  StoredFile,
} from './interfaces/file-storage.interface';

@Injectable()
export class UploadsService {
  constructor(
    @Inject(FILE_STORAGE) private readonly fileStorage: FileStorage,
  ) {}

  uploadImage(file: FileToStore): Promise<StoredFile> {
    return this.fileStorage.upload(file);
  }

  async uploadImages(files: FileToStore[]): Promise<StoredFile[]> {
    const uploadedFiles: StoredFile[] = [];

    try {
      for (const file of files) {
        uploadedFiles.push(await this.fileStorage.upload(file));
      }

      return uploadedFiles;
    } catch (error) {
      await Promise.allSettled(
        uploadedFiles.map((file) => this.fileStorage.delete(file.publicId)),
      );
      throw error;
    }
  }

  deleteFile(publicId: string): Promise<void> {
    return this.fileStorage.delete(publicId);
  }
}
