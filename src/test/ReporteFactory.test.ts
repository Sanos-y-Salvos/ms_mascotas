import 'reflect-metadata';
import { ReporteFactory, DatosReporteBase } from '../factories/ReporteFactory';
import { TipoReporte, EstadoReporte, EspecieMascota, TamanioMascota } from '../entities/Reporte';

const datosBase: DatosReporteBase = {
  nombreMascota: 'Test',
  especie: EspecieMascota.GATO,
  color: 'Blanco',
  tamanio: TamanioMascota.PEQUEÑO,
  ubicacionLatitud: 1,
  ubicacionLongitud: 1,
  usuarioId: 'user-123',
};

describe('ReporteFactory', () => {
  describe('crearPerdida', () => {
    it('debe crear un reporte de tipo PERDIDA y estado EN_BUSQUEDA', () => {
      const reporte = ReporteFactory.crearPerdida(datosBase);
      expect(reporte.tipo).toBe(TipoReporte.PERDIDA);
      expect(reporte.estado).toBe(EstadoReporte.EN_BUSQUEDA);
      expect(reporte.nombreMascota).toBe('Test');
    });
  });

  describe('crearEncontrada', () => {
    it('debe crear un reporte de tipo ENCONTRADA y estado EN_BUSQUEDA', () => {
      const reporte = ReporteFactory.crearEncontrada(datosBase);
      expect(reporte.tipo).toBe(TipoReporte.ENCONTRADA);
      expect(reporte.estado).toBe(EstadoReporte.EN_BUSQUEDA);
      expect(reporte.nombreMascota).toBe('Test');
    });
  });

  describe('crear (método genérico)', () => {
    it('debe delegar a crearPerdida para el tipo PERDIDA', () => {
      const reporte = ReporteFactory.crear(TipoReporte.PERDIDA, datosBase);
      expect(reporte.tipo).toBe(TipoReporte.PERDIDA);
      expect(reporte.estado).toBe(EstadoReporte.EN_BUSQUEDA);
    });

    it('debe delegar a crearEncontrada para el tipo ENCONTRADA', () => {
      const reporte = ReporteFactory.crear(TipoReporte.ENCONTRADA, datosBase);
      expect(reporte.tipo).toBe(TipoReporte.ENCONTRADA);
      expect(reporte.estado).toBe(EstadoReporte.EN_BUSQUEDA);
    });

    it('debe lanzar un error para un tipo de reporte desconocido', () => {
      const tipoInvalido = 'TIPO_INVALIDO' as TipoReporte;
      expect(() => {
        ReporteFactory.crear(tipoInvalido, datosBase);
      }).toThrow(`Tipo de reporte desconocido: ${tipoInvalido}`);
    });
  });
});