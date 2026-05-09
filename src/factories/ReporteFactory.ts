import { Reporte, TipoReporte, EstadoReporte, TamanioMascota } from '../entities/Reporte';

/**
 * DTO base con los campos obligatorios para crear cualquier reporte.
 */
export interface DatosReporteBase {
  nombreMascota: string;
  raza: string;
  color: string;
  tamanio: TamanioMascota;
  ubicacionLatitud: number;
  ubicacionLongitud: number;
  direccionReferencia?: string;
  descripcion?: string;
  usuarioId: string;
}

/**
 * Factory Method — Patrón exigido por la arquitectura (sección 4.1 del DAS).
 *
 * Instancia dinámicamente un objeto Reporte con los atributos propios de cada
 * subtipo (PERDIDA / ENCONTRADA), de modo que la creación sea flexible y
 * extensible sin modificar el servicio ni el controlador.
 *
 * Si en el futuro se agrega un tipo "ADOPCION", basta con añadir un nuevo
 * método estático aquí sin tocar el resto del código.
 */
export class ReporteFactory {
  static crearPerdida(datos: DatosReporteBase): Partial<Reporte> {
    return {
      ...datos,
      tipo: TipoReporte.PERDIDA,
      estado: EstadoReporte.EN_BUSQUEDA,
    };
  }

  static crearEncontrada(datos: DatosReporteBase): Partial<Reporte> {
    return {
      ...datos,
      tipo: TipoReporte.ENCONTRADA,
      estado: EstadoReporte.EN_BUSQUEDA,
    };
  }

  /**
   * Método genérico que delega al tipo correcto según el string recibido.
   * Útil cuando el tipo viene desde el body HTTP.
   */
  static crear(tipo: TipoReporte, datos: DatosReporteBase): Partial<Reporte> {
    switch (tipo) {
      case TipoReporte.PERDIDA:
        return ReporteFactory.crearPerdida(datos);
      case TipoReporte.ENCONTRADA:
        return ReporteFactory.crearEncontrada(datos);
      default:
        throw new Error(`Tipo de reporte desconocido: ${tipo}`);
    }
  }
}
