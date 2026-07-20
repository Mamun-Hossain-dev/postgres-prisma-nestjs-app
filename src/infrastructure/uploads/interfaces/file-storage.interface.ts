export interface FileToStore {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

export interface StoredFile {
  publicId: string;
  url: string;
  format: string;
  resourceType: string;
  bytes: number;
  originalFilename: string;
}

export interface FileStorage {
  upload(file: FileToStore): Promise<StoredFile>;
  delete(publicId: string): Promise<void>;
}
