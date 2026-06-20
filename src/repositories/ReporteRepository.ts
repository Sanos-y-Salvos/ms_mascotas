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
    if (filtros.especie) {
      query.andWhere('r.especie = :especie', { especie: filtros.especie });
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

  async getEstadisticas() {
    const db = AppDataSource;
    const tipos    = ['PERDIDA', 'ENCONTRADA'];
    const estados  = ['EN_BUSQUEDA', 'RESUELTO', 'ABANDONADO', 'OCULTO'];
    const especies = ['PERRO', 'GATO', 'AVE', 'CONEJO', 'HAMSTER', 'REPTIL', 'OTRO'];
    const tamanios = ['PEQUEÑO', 'MEDIANO', 'GRANDE'];

    const [total, por_tipo_raw, por_estado_raw, por_especie_raw, por_tamanio_raw, por_mes, por_mes_tipo, por_mes_especie] =
      await Promise.all([
        db.query('SELECT COUNT(*)::int AS count FROM reportes'),
        db.query('SELECT tipo, COUNT(*)::int AS count FROM reportes GROUP BY tipo'),
        db.query('SELECT estado, COUNT(*)::int AS count FROM reportes GROUP BY estado'),
        db.query('SELECT especie, COUNT(*)::int AS count FROM reportes GROUP BY especie ORDER BY count DESC'),
        db.query('SELECT tamanio, COUNT(*)::int AS count FROM reportes GROUP BY tamanio'),
        db.query(`SELECT TO_CHAR(DATE_TRUNC('month', fecha_publicacion), 'YYYY-MM') AS mes, COUNT(*)::int AS count FROM reportes GROUP BY mes ORDER BY mes`),
        db.query(`SELECT TO_CHAR(DATE_TRUNC('month', fecha_publicacion), 'YYYY-MM') AS mes, tipo, COUNT(*)::int AS count FROM reportes GROUP BY mes, tipo ORDER BY mes`),
        db.query(`SELECT TO_CHAR(DATE_TRUNC('month', fecha_publicacion), 'YYYY-MM') AS mes, especie, COUNT(*)::int AS count FROM reportes GROUP BY mes, especie ORDER BY mes`),
      ]);

    const tipoMap    = Object.fromEntries(por_tipo_raw.map((r: any)    => [r.tipo,    r.count]));
    const estadoMap  = Object.fromEntries(por_estado_raw.map((r: any)  => [r.estado,  r.count]));
    const especieMap = Object.fromEntries(por_especie_raw.map((r: any) => [r.especie, r.count]));
    const tamanioMap = Object.fromEntries(por_tamanio_raw.map((r: any) => [r.tamanio, r.count]));

    return {
      total:          total[0].count,
      por_tipo:       tipos.map(t    => ({ tipo:    t, count: tipoMap[t]    ?? 0 })),
      por_estado:     estados.map(e  => ({ estado:  e, count: estadoMap[e]  ?? 0 })),
      por_especie:    especies.map(e => ({ especie: e, count: especieMap[e] ?? 0 })),
      por_tamanio:    tamanios.map(t => ({ tamanio: t, count: tamanioMap[t] ?? 0 })),
      por_mes,
      por_mes_tipo,
      por_mes_especie,
    };
  }
}
