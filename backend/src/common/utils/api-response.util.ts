import { SetMetadata } from '@nestjs/common';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const RESPONSE_MESSAGE_KEY = 'responseMessage';

export const ResponseMessage = (message: string) =>
  SetMetadata(RESPONSE_MESSAGE_KEY, message);
