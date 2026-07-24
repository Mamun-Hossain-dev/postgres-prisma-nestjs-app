import { registerAs } from '@nestjs/config';

export default registerAs('cloudinary', () => ({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
  apiKey: process.env.CLOUDINARY_API_KEY ?? '',
  apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
  folder: process.env.CLOUDINARY_FOLDER ?? 'nestjs-learning',
  maxFileSize: Number(process.env.UPLOAD_MAX_FILE_SIZE ?? 5 * 1024 * 1024),
  maxProductImages: Number(process.env.UPLOAD_MAX_PRODUCT_IMAGES ?? 10),
}));
