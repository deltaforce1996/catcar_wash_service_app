export type ApiSuccessResponse<T> = {
  success: boolean;
  data: T;
  message: string;
};

export type ApiErrorResponse = {
  success: false;
  errorCode: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
};
