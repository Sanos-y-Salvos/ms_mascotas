import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import createError from 'http-errors';

export interface JwtPayload {
  sub: string;      // UUID del usuario
  rol: string;      // 'USUARIO' | 'MODERADOR' | 'ADMIN'
  iat: number;
  exp: number;
}

// Extendemos Request para que los controladores accedan al usuario autenticado
declare global {
  namespace Express {
    interface Request {
      usuario?: JwtPayload;
    }
  }
}

/**
 * Valida el token JWT enviado por el API Gateway en el header Authorization.
 *
 * En entorno development, si no se envía token se inyecta un usuario de prueba
 * automáticamente para facilitar el testeo sin depender del MS-01 (Auth).
 * En producción este bypass no aplica.
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  // Bypass para desarrollo: si no hay token se simula un usuario genérico
  if (process.env.NODE_ENV === 'development' && !req.headers.authorization) {
    req.usuario = {
      sub: '00000000-0000-0000-0000-000000000001',
      rol: 'USUARIO',
      iat: 0,
      exp: 0,
    };
    return next();
  }

  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(createError(401, 'Token no proporcionado'));
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? '') as JwtPayload;
    req.usuario = payload;
    next();
  } catch {
    next(createError(401, 'Token inválido o expirado'));
  }
}

export function soloModerador(req: Request, _res: Response, next: NextFunction): void {
  if (!req.usuario || !['MODERADOR', 'ADMIN'].includes(req.usuario.rol)) {
    return next(createError(403, 'Acceso restringido a moderadores'));
  }
  next();
}
