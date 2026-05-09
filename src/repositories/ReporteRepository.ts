import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Reporte, EstadoReporte, TipoReporte } from '../entities/Reporte';
import { FiltrosReporte, IReporteRepository } from './IReporteRepository';

/**
 * Implementación concreta de IReporteRepository usando TypeORM.
 * Es la única clase del microservicio que conoce la base de datos directamente.
 */
export class ReporteRepository implements IReporteRepository {
  private readonly repo: Repository<Reporte>;

  constructor() {
    this.repo = AppDataSource.getRepository(Reporte);
  }

  async crear(datos: Partial<Reporte>): Promise<Reporte> {
    const reporte = this.repo.create(datos);
    return this.repo.save(reporte);
  }

  async buscarPorId(id: string): Promise<Reporte | null> {
    return this.repo.findOne({ where: { id }, relations: ['fotos'] });
  }

  async listar(filtros: FiltrosReporte = {}): Promise<Reporte[]> {
    const query = this.repo.createQueryBuilder('r').leftJoinAndSelect('r.fotos', 'fotos');

    if (filtros.tipo) {
      query.andWhere('r.tipo = :tipo', { tipo: filtros.tipo });
    }
    if (filtros.estado) {
      query.andWhere('r.estado = :estado', { estado: filtros.estado });
    }
    if (filtros.raza) {
      query.andWhere('LOWER(r.raza) LIKE LOWER(:raza)', { raza: `%${filtros.raza}%` });
    }
    if (filtros.color) {
      query.andWhere('LOWER(r.color) LIKE LOWER(:color)', { color: `%${filtros.color}%` });
    }
    if (filtros.usuarioId) {
      query.andWhere('r.usuarioId = :usuarioId', { usuarioId: filtros.usuarioId });
    }

    return query.orderBy('r.fechaPublicacion', 'DESC').getMany();
  }

  async actualizar(id: string, datos: Partial<Reporte>): Promise<Reporte | null> {
    await this.repo.update(id, datos);
    return this.buscarPorId(id);
  }

  async cambiarEstado(id: string, estado: EstadoReporte): Promise<Reporte | null> {
    await this.repo.update(id, { estado });
    return this.buscarPorId(id);
  }

  async eliminar(id: string): Promise<boolean> {
    const resultado = await this.repo.delete(id);
    return (resultado.affected ?? 0) > 0;
  }
}
