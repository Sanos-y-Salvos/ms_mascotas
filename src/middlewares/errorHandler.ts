import { Request, Response, NextFunction } from 'express';
import { HttpError } from 'http-errors';

export function errorHandler(
  err: Error | HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = 'status' in err ? err.status : 500;
  const mensaje = err.message || 'Error interno del servidor';

  // No exponer stack en producción
  const body: Record<string, unknown> = { error: mensaje };
  if (process.env.NODE_ENV === 'development') {
    body.stack = err.stack;
    if ('errors' in err) body.errors = (err as any).errors;
  }

  res.status(status).json(body);
}
