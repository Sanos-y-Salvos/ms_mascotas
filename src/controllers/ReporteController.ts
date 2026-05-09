import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import createError from 'http-errors';
import { ReporteService } from '../services/ReporteService';
import { TipoReporte, EstadoReporte, TamanioMascota } from '../entities/Reporte';

export class ReporteController {
  constructor(private readonly service: ReporteService) {}

  /** POST /reportes */
  crear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      this.validarRequest(req);
      const archivos = (req.files as Express.Multer.File[]) ?? [];

      const reporte = await this.service.crearReporte(
        {
          nombreMascota: req.body.nombreMascota,
          raza: req.body.raza,
          color: req.body.color,
          tamanio: req.body.tamanio as TamanioMascota,
          tipo: req.body.tipo as TipoReporte,
          ubicacionLatitud: parseFloat(req.body.ubicacionLatitud),
          ubicacionLongitud: parseFloat(req.body.ubicacionLongitud),
          direccionReferencia: req.body.direccionReferencia,
          descripcion: req.body.descripcion,
          usuarioId: req.usuario!.sub,
        },
        archivos
      );

      res.status(201).json({ data: reporte });
    } catch (err) {
      next(err);
    }
  };

  /** GET /reportes */
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

  /** GET /reportes/:id */
  obtener = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reporte = await this.service.obtenerReporte(req.params.id);
      res.json({ data: reporte });
    } catch (err) {
      next(err);
    }
  };

  /** PUT /reportes/:id */
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

  /** PATCH /reportes/:id/estado */
  cambiarEstado = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      this.validarRequest(req);
      const esModerador = ['MODERADOR', 'ADMIN'].includes(req.usuario!.rol);
      const reporte = await this.service.cambiarEstado(
        req.params.id,
        req.body.estado as EstadoReporte,
        req.usuario!.sub,
        esModerador
      );
      res.json({ data: reporte });
    } catch (err) {
      next(err);
    }
  };

  /** DELETE /reportes/:id */
  eliminar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const esModerador = ['MODERADOR', 'ADMIN'].includes(req.usuario!.rol);
      await this.service.eliminarReporte(req.params.id, req.usuario!.sub, esModerador);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  private validarRequest(req: Request): void {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      throw createError(400, 'Datos inválidos', { errors: errores.array() });
    }
  }
}
