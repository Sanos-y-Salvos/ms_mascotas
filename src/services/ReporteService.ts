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
}