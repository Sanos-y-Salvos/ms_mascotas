import createError from 'http-errors';
import { IReporteRepository } from '../repositories/IReporteRepository';
import { ReporteFactory, DatosReporteBase } from '../factories/ReporteFactory';
import { Reporte, EstadoReporte, TipoReporte } from '../entities/Reporte';
import { ReporteFoto } from '../entities/ReporteFoto';
import { AppDataSource } from '../config/database';

export class ReporteService {
  constructor(private readonly repo: IReporteRepository) {}

  async crearReporte(datos: CrearReporteDTO, archivos: Express.Multer.File[]): Promise<Reporte> {
    const datosReporte = ReporteFactory.crear(datos.tipo, datos);
    if (archivos.length > 0) {
      datosReporte.fotos = archivos.map((archivo) => {
        const foto = new ReporteFoto();
        foto.nombreArchivo = archivo.filename;
        foto.urlRelativa = `/uploads/${archivo.filename}`;
        return foto;
      });
    }
    const reporte = await this.repo.crear(datosReporte);
    await mensajeriaService.publicar(EVENTOS.REPORTE_CREADO, { ...reporte });
    return reporte;
  }

  async editarReporte(
  id: string,
  datos: Partial<CrearReporteDTO>,
  usuarioId: string,
  archivos: Express.Multer.File[]
): Promise<Reporte> {
  const existente = await this.obtenerReporte(id);
  this.verificarPropietario(existente, usuarioId);

  const actualizado = await this.repo.actualizar(id, datos);
  if (!actualizado) throw createError(500, 'Error al actualizar el reporte');

  const cambioUbicacion =
    datos.ubicacionLatitud !== undefined || datos.ubicacionLongitud !== undefined;

  if (cambioUbicacion) {
    await mensajeriaService.publicar(EVENTOS.REPORTE_ACTUALIZADO, {
      reporteId: id,
      ubicacionLatitud: actualizado.ubicacionLatitud,
      ubicacionLongitud: actualizado.ubicacionLongitud,
      direccionReferencia: actualizado.direccionReferencia,
    });
  }

  if (archivos.length > 0) {
    const fotoRepo = AppDataSource.getRepository(ReporteFoto);
    const nuevasFotos = archivos.map((archivo) => {
      const foto = fotoRepo.create({
        nombreArchivo: archivo.filename,
        urlRelativa: `/uploads/${archivo.filename}`,
        reporte: actualizado,
      });
      return foto;
    });
    await fotoRepo.save(nuevasFotos);
  }

  return this.obtenerReporte(id);
}
}