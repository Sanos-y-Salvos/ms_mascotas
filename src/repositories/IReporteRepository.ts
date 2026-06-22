import { Reporte, EstadoReporte, TipoReporte, EspecieMascota } from '../entities/Reporte';

export interface FiltrosReporte {
  tipo?: TipoReporte;
  estado?: EstadoReporte;
  especie?: EspecieMascota;
  color?: string;
  usuarioId?: string;
  page?: number;
  limit?: number;
}

export interface PaginadoReporte {
  data: Reporte[];
  total: number;
  page: number;
  totalPages: number;
}

export interface IReporteRepository {
  crear(reporte: Partial<Reporte>): Promise<Reporte>;
  buscarPorId(id: string): Promise<Reporte | null>;
  listar(filtros?: FiltrosReporte): Promise<PaginadoReporte>;
  actualizar(id: string, datos: Partial<Reporte>): Promise<Reporte | null>;
  cambiarEstado(id: string, estado: EstadoReporte): Promise<Reporte | null>;
  eliminar(id: string): Promise<boolean>;
  getEstadisticas(): Promise<any>;
}
