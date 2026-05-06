import { ReporteService } from "../services/ReporteService";
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import createError from 'http-errors';


export class ReporteController {
  constructor(private readonly service: ReporteService) {}

  crear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      this.validarRequest(req);
      const archivos = (req.files as Express.Multer.File[]) ?? [];
      const reporte = await this.service.crearReporte({ ...req.body, usuarioId: req.usuario!.sub }, archivos);
      res.status(201).json({ data: reporte });
    } catch (err) {
      next(err);
    }
  };

  private validarRequest(req: Request): void {
    const errores = validationResult(req);
    if (!errores.isEmpty()) throw createError(400, 'Datos inválidos', { errors: errores.array() });
  }
}