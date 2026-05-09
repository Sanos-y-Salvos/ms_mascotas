import { Reporte, EstadoReporte, TipoReporte } from '../entities/Reporte';

export interface FiltrosReporte {
  tipo?: TipoReporte;
  estado?: EstadoReporte;
  raza?: string;
  color?: string;
  usuarioId?: string;
}

export interface IReporteRepository {
  crear(reporte: Partial<Reporte>): Promise<Reporte>;
  buscarPorId(id: string): Promise<Reporte | null>;
  listar(filtros?: FiltrosReporte): Promise<Reporte[]>;
  actualizar(id: string, datos: Partial<Reporte>): Promise<Reporte | null>;
  cambiarEstado(id: string, estado: EstadoReporte): Promise<Reporte | null>;
}