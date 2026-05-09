import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Reporte, EstadoReporte, TipoReporte } from '../entities/Reporte';
import { FiltrosReporte, IReporteRepository } from './IReporteRepository';

export class ReporteRepository implements IReporteRepository {
  private readonly repo: Repository<Reporte>;

  constructor() {
    this.repo = AppDataSource.getRepository(Reporte);
  }

  async crear(datos: Partial<Reporte>): Promise<Reporte> {
    const reporte = this.repo.create(datos);
    return this.repo.save(reporte);
  }

  async actualizar(id: string, datos: Partial<Reporte>): Promise<Reporte | null> {
  await this.repo.update(id, datos);
  return this.buscarPorId(id);
}
}