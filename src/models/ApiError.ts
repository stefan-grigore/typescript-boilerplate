import { z } from 'zod';

export const ErrorResponseSchema = z.object({
  error: z.string(),
  error_description: z.string().optional(),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export class ApiError implements ErrorResponse {
  error: string;
  error_description?: string;

  constructor(error: ErrorResponse['error'], error_description?: ErrorResponse['error_description']) {
    this.error = error;
    if (error_description !== undefined) this.error_description = error_description;
  }

  static invalidRequest(msg: string)                { return new ApiError('invalid_request', msg); }
  static invalidClient(msg: string)                 { return new ApiError('invalid_client', msg); }
  static invalidToken(msg: string)                  { return new ApiError('invalid_token', msg); }
  static unsupportedGrantType(msg: string)          { return new ApiError('unsupported_grant_type', msg); }
  static notFound(msg: string)                      { return new ApiError('not_found', msg); }
  static serverError(msg = 'Internal server error') { return new ApiError('server_error', msg); }
}
