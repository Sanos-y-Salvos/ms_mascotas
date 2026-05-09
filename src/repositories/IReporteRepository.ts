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
  actualizar(id: string, datos: Partial<Reporte>): Promise<Reporte | null>;
}