import createError from 'http-errors';
import { IReporteRepository } from '../repositories/IReporteRepository';
import { ReporteFactory, DatosReporteBase } from '../factories/ReporteFactory';
import { Reporte, EstadoReporte, TipoReporte } from '../entities/Reporte';
import { ReporteFoto } from '../entities/ReporteFoto';
import { AppDataSource } from '../config/database';
import {
  mensajeriaService,
  EVENTOS,
  EventoReporteCreado,
} from './MensajeriaService';
import { FiltrosReporte } from '../repositories/IReporteRepository';

export interface CrearReporteDTO extends DatosReporteBase {
  tipo: TipoReporte;
}

export class ReporteService {
  constructor(private readonly repo: IReporteRepository) {}

  /**
   * Crea un nuevo reporte usando el Factory Method según el tipo indicado.
   * Luego publica el evento para que MS-04 y MS-05 reaccionen.
   */
  async crearReporte(
    datos: CrearReporteDTO,
    archivos: Express.Multer.File[]
  ): Promise<Reporte> {
    const datosReporte = ReporteFactory.crear(datos.tipo, datos);

    // Asociar fotos si las hay
    if (archivos.length > 0) {
      datosReporte.fotos = archivos.map((archivo) => {
        const foto = new ReporteFoto();
        foto.nombreArchivo = archivo.filename;
        foto.urlRelativa = `/uploads/${archivo.filename}`;
        return foto;
      });
    }

    const reporte = await this.repo.crear(datosReporte);

    // Publicar evento para MS-04 (Localización) y MS-05 (Matching)
    const evento: EventoReporteCreado = {
      reporteId: reporte.id,
      tipo: reporte.tipo,
      nombreMascota: reporte.nombreMascota,
      raza: reporte.raza,
      color: reporte.color,
      tamanio: reporte.tamanio,
      ubicacionLatitud: reporte.ubicacionLatitud,
      ubicacionLongitud: reporte.ubicacionLongitud,
      direccionReferencia: reporte.direccionReferencia,
      fechaPublicacion: reporte.fechaPublicacion.toISOString(),
      usuarioId: reporte.usuarioId,
    };
    await mensajeriaService.publicar(EVENTOS.REPORTE_CREADO, evento);

    return reporte;
  }

  async obtenerReporte(id: string): Promise<Reporte> {
    const reporte = await this.repo.buscarPorId(id);
    if (!reporte) throw createError(404, `Reporte ${id} no encontrado`);
    return reporte;
  }

  async listarReportes(filtros: FiltrosReporte): Promise<Reporte[]> {
    return this.repo.listar(filtros);
  }

  /**
   * Actualiza datos del reporte.
   * Si cambia la ubicación, publica evento para que MS-04 actualice el pin.
   */
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

    // Si cambiaron las coordenadas, notificar al MS-04
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

    // Agregar nuevas fotos si se subieron
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

  async cambiarEstado(
    id: string,
    estado: EstadoReporte,
    usuarioId: string,
    esModerador: boolean
  ): Promise<Reporte> {
    const existente = await this.obtenerReporte(id);

    if (!esModerador) {
      this.verificarPropietario(existente, usuarioId);
    }

    const actualizado = await this.repo.cambiarEstado(id, estado);
    if (!actualizado) throw createError(500, 'Error al cambiar estado');

    await mensajeriaService.publicar(EVENTOS.REPORTE_ESTADO_CAMBIADO, {
      reporteId: id,
      estado,
    });

    return actualizado;
  }

  async eliminarReporte(id: string, usuarioId: string, esModerador: boolean): Promise<void> {
    const existente = await this.obtenerReporte(id);

    if (!esModerador) {
      this.verificarPropietario(existente, usuarioId);
      // El usuario solo puede eliminar reportes resueltos o abandonados
      const eliminables = [EstadoReporte.RESUELTO, EstadoReporte.ABANDONADO];
      if (!eliminables.includes(existente.estado)) {
        throw createError(403, 'Solo puedes eliminar reportes resueltos o abandonados');
      }
    }

    const ok = await this.repo.eliminar(id);
    if (!ok) throw createError(500, 'Error al eliminar el reporte');

    await mensajeriaService.publicar(EVENTOS.REPORTE_ELIMINADO, { reporteId: id });
  }

  /** Verifica que el usuario sea el dueño del reporte, o lanza 403. */
  private verificarPropietario(reporte: Reporte, usuarioId: string): void {
    if (reporte.usuarioId !== usuarioId) {
      throw createError(403, 'No tienes permiso para modificar este reporte');
    }
  }
}
