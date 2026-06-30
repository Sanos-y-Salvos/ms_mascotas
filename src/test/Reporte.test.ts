import 'reflect-metadata';
import { Reporte, TipoReporte, EstadoReporte } from '../entities/Reporte';
import { ReporteFoto } from '../entities/ReporteFoto';

describe('Entidad: Reporte', () => {
  it('debe crear una instancia de Reporte', () => {
    const reporte = new Reporte();
    reporte.id = 'reporte-uuid';
    reporte.tipo = TipoReporte.PERDIDA;
    reporte.estado = EstadoReporte.EN_BUSQUEDA;
    reporte.fotos = [];

    expect(reporte).toBeInstanceOf(Reporte);
    expect(reporte.id).toBe('reporte-uuid');
    expect(reporte.fotos).toEqual([]);
  });
});