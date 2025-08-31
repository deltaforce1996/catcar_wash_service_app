export interface SuccessResponse<T> {
  success: true;
  data?: T;
  message: string;
  statusCode?: number;
  timestamp?: string;
  path?: string;
}
