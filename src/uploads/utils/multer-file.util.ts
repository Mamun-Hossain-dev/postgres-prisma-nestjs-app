import type { FileToStore } from '../interfaces/file-storage.interface';

export function toFileToStore(file: Express.Multer.File): FileToStore {
  return {
    buffer: file.buffer,
    mimetype: file.mimetype,
    originalname: file.originalname,
    size: file.size,
  };
}
