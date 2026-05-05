import 'reflect-metadata';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ReporteFoto } from './ReporteFoto';

export enum TipoReporte {
  PERDIDA = 'PERDIDA',
  ENCONTRADA = 'ENCONTRADA',
}

export enum EstadoReporte {
  EN_BUSQUEDA = 'EN_BUSQUEDA',
  RESUELTO = 'RESUELTO',
  ABANDONADO = 'ABANDONADO',
  OCULTO = 'OCULTO',
}

export enum TamanioMascota {
  PEQUEÑO = 'PEQUEÑO',
  MEDIANO = 'MEDIANO',
  GRANDE = 'GRANDE',
}

@Entity('reportes')
export class Reporte {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  nombreMascota!: string;

  @Column({ length: 100 })
  raza!: string;

  @Column({ length: 100 })
  color!: string;

  @Column({ type: 'enum', enum: TamanioMascota })
  tamanio!: TamanioMascota;

  @Column({ type: 'enum', enum: TipoReporte })
  tipo!: TipoReporte;

  @Column({
    type: 'enum',
    enum: EstadoReporte,
    default: EstadoReporte.EN_BUSQUEDA,
  })
  estado!: EstadoReporte;

  @CreateDateColumn({ name: 'fecha_publicacion' })
  fechaPublicacion!: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion' })
  fechaActualizacion!: Date;

  @Column({ type: 'float8', name: 'ubicacion_latitud' })
  ubicacionLatitud!: number;

  @Column({ type: 'float8', name: 'ubicacion_longitud' })
  ubicacionLongitud!: number;

  @Column({ length: 255, nullable: true, name: 'direccion_referencia' })
  direccionReferencia?: string;

  @Column({ name: 'usuario_id' })
  usuarioId!: string;

  @OneToMany(() => ReporteFoto, (foto) => foto.reporte, {
    cascade: true,
    eager: true,
  })
  fotos!: ReporteFoto[];

  @Column({ type: 'text', nullable: true })
  descripcion?: string;
}
