import 'reflect-metadata';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Reporte } from './Reporte';

@Entity('reporte_fotos')
export class ReporteFoto {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'nombre_archivo' })
  nombreArchivo!: string;

  @Column({ name: 'url_relativa' })
  urlRelativa!: string;

  @CreateDateColumn({ name: 'fecha_subida' })
  fechaSubida!: Date;

  @ManyToOne(() => Reporte, (reporte) => reporte.fotos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reporte_id' })
  reporte!: Reporte;
}
