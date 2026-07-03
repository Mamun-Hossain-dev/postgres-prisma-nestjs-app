export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function createApiResponse<T>(
  message: string,
  data: T | Promise<T>,
): Promise<ApiResponse<T>> {
  return {
    success: true,
    message,
    data: await data,
  };
}
