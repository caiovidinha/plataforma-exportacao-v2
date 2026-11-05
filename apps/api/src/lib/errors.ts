export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message?: string,
    public readonly details?: unknown,
  ) {
    super(message ?? code)
    this.name = 'AppError'
  }
}

export const badRequest = (code = 'bad_request', message?: string, details?: unknown) =>
  new AppError(400, code, message, details)
export const unauthorized = (code = 'unauthorized', message?: string) => new AppError(401, code, message)
export const forbidden = (code = 'forbidden', message?: string) => new AppError(403, code, message)
export const notFound = (code = 'not_found', message?: string) => new AppError(404, code, message)
export const conflict = (code = 'conflict', message?: string, details?: unknown) =>
  new AppError(409, code, message, details)
export const unprocessable = (code = 'unprocessable', message?: string, details?: unknown) =>
  new AppError(422, code, message, details)
export const tooMany = (code = 'too_many_requests', message?: string) => new AppError(429, code, message)
