import { Reporte, EstadoReporte, TipoReporte } from '../entities/Reporte';

export interface FiltrosReporte {
  tipo?: TipoReporte;
  estado?: EstadoReporte;
  raza?: string;
  color?: string;
  usuarioId?: string;
}

/**
 * Contrato del Repository Pattern para el acceso a datos de Reporte.
 * La lógica de negocio depende de esta interfaz, no de la implementación concreta.
 */
export interface IReporteRepository {
  crear(reporte: Partial<Reporte>): Promise<Reporte>;
  buscarPorId(id: string): Promise<Reporte | null>;
  listar(filtros?: FiltrosReporte): Promise<Reporte[]>;
  actualizar(id: string, datos: Partial<Reporte>): Promise<Reporte | null>;
  cambiarEstado(id: string, estado: EstadoReporte): Promise<Reporte | null>;
  eliminar(id: string): Promise<boolean>;
}
