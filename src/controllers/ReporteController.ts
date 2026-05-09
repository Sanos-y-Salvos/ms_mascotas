import { ReporteService } from "../services/ReporteService";
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import createError from 'http-errors';
import { EstadoReporte, TipoReporte } from "../entities/Reporte";


export class ReporteController {
  constructor(private readonly service: ReporteService) { }

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

  listar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      this.validarRequest(req);
      const reportes = await this.service.listarReportes({
        tipo: req.query.tipo as TipoReporte | undefined,
        estado: req.query.estado as EstadoReporte | undefined,
        raza: req.query.raza as string | undefined,
        color: req.query.color as string | undefined,
        usuarioId: req.query.usuarioId as string | undefined,
      });
      res.json({ data: reportes });
    } catch (err) {
      next(err);
    }
  };

  obtener = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reporte = await this.service.obtenerReporte(req.params.id);
      res.json({ data: reporte });
    } catch (err) {
      next(err);
    }
  };

  editar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const archivos = (req.files as Express.Multer.File[]) ?? [];
      const reporte = await this.service.editarReporte(
        req.params.id,
        req.body,
        req.usuario!.sub,
        archivos
      );
      res.json({ data: reporte });
    } catch (err) {
      next(err);
    }
  };
}