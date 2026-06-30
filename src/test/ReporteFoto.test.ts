import 'reflect-metadata';
import { ReporteFoto } from '../entities/ReporteFoto';
import { Reporte } from '../entities/Reporte';

describe('Entidad: ReporteFoto', () => {
  it('debe crear una instancia de ReporteFoto', () => {
    const foto = new ReporteFoto();
    foto.id = 'foto-uuid';
    foto.nombreArchivo = 'test.jpg';
    foto.urlRelativa = '/uploads/test.jpg';
    foto.reporte = new Reporte();

    expect(foto).toBeInstanceOf(ReporteFoto);
    expect(foto.id).toBe('foto-uuid');
    expect(foto.reporte).toBeInstanceOf(Reporte);
  });
});