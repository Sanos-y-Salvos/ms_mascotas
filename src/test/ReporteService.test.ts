import 'reflect-metadata';
import { ReporteService } from '../services/ReporteService';
import { IReporteRepository } from '../repositories/IReporteRepository';
import { mensajeriaService } from '../services/MensajeriaService';
import {
  Reporte,
  TipoReporte,
  EstadoReporte,
  EspecieMascota,
  TamanioMascota,
} from '../entities/Reporte';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('../../src/services/MensajeriaService', () => ({
  mensajeriaService: { publicar: jest.fn().mockResolvedValue(undefined) },
  EVENTOS: {
    REPORTE_CREADO:          'mascota.reporte.creado',
    REPORTE_ACTUALIZADO:     'mascota.reporte.actualizado',
    REPORTE_ESTADO_CAMBIADO: 'mascota.reporte.estado_cambiado',
    REPORTE_ELIMINADO:       'mascota.reporte.eliminado',
  },
}));

jest.mock('../../src/config/database', () => ({
  AppDataSource: { getRepository: jest.fn() },
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeReporte = (overrides: Partial<Reporte> = {}): Reporte => ({
  id: 'reporte-uuid-1',
  nombreMascota: 'Firulais',
  especie: EspecieMascota.PERRO,
  color: 'café',
  tamanio: TamanioMascota.MEDIANO,
  tipo: TipoReporte.PERDIDA,
  estado: EstadoReporte.EN_BUSQUEDA,
  fechaPublicacion: new Date('2026-01-01'),
  fechaActualizacion: new Date('2026-01-01'),
  ubicacionLatitud: -36.82,
  ubicacionLongitud: -73.04,
  usuarioId: 'usuario-uuid-1',
  fotos: [],
  ...overrides,
} as Reporte);

const makePaginado = (reportes: Reporte[] = [makeReporte()]) => ({
  data: reportes,
  total: reportes.length,
  page: 1,
  totalPages: 1,
});

const makeRepo = (overrides: Partial<IReporteRepository> = {}): jest.Mocked<IReporteRepository> => ({
  crear: jest.fn().mockResolvedValue(makeReporte()),
  buscarPorId: jest.fn().mockResolvedValue(makeReporte()),
  listar: jest.fn().mockResolvedValue(makePaginado()),
  actualizar: jest.fn().mockResolvedValue(makeReporte()),
  cambiarEstado: jest.fn().mockResolvedValue(makeReporte()),
  eliminar: jest.fn().mockResolvedValue(true),
  ...overrides,
} as jest.Mocked<IReporteRepository>);

const datosPerdida = {
  nombreMascota: 'Firulais',
  especie: EspecieMascota.PERRO,
  color: 'café',
  tamanio: TamanioMascota.MEDIANO,
  tipo: TipoReporte.PERDIDA,
  ubicacionLatitud: -36.82,
  ubicacionLongitud: -73.04,
  usuarioId: 'usuario-uuid-1',
};

// ─── HU-01: Crear reporte ─────────────────────────────────────────────────────

describe('HU-01 — Crear reporte', () => {
  it('crea un reporte con los datos correctos', async () => {
    const repo = makeRepo();
    const service = new ReporteService(repo);

    const resultado = await service.crearReporte(datosPerdida, []);

    expect(repo.crear).toHaveBeenCalledTimes(1);
    expect(resultado.nombreMascota).toBe('Firulais');
  });

  it('publica el evento REPORTE_CREADO al crear', async () => {
    const repo = makeRepo();
    const service = new ReporteService(repo);

    await service.crearReporte(datosPerdida, []);

    expect(mensajeriaService.publicar).toHaveBeenCalledWith(
      'mascota.reporte.creado',
      expect.objectContaining({ reporteId: 'reporte-uuid-1' })
    );
  });

  it('incluye fotoUrl en el evento si se sube una imagen', async () => {
    const repo = makeRepo({
      crear: jest.fn().mockResolvedValue(makeReporte({
        fotos: [{ id: 'f1', nombreArchivo: 'foto.jpg', urlRelativa: '/uploads/foto.jpg' } as any],
      })),
    });
    const service = new ReporteService(repo);
    const archivo = { filename: 'foto.jpg' } as Express.Multer.File;

    await service.crearReporte(datosPerdida, [archivo]);

    expect(mensajeriaService.publicar).toHaveBeenCalledWith(
      'mascota.reporte.creado',
      expect.objectContaining({ fotoUrl: '/uploads/foto.jpg' })
    );
  });

  it('incluye descripcion y codigoChip en el evento si se proporcionan', async () => {
    const repo = makeRepo({
      crear: jest.fn().mockResolvedValue(makeReporte({
        descripcion: 'Perro amigable',
        codigoChip: '123456789',
      })),
    });
    const service = new ReporteService(repo);

    await service.crearReporte(
      { ...datosPerdida, descripcion: 'Perro amigable', codigoChip: '123456789' },
      []
    );

    expect(mensajeriaService.publicar).toHaveBeenCalledWith(
      'mascota.reporte.creado',
      expect.objectContaining({
        descripcion: 'Perro amigable',
        codigoChip: '123456789',
      })
    );
  });
});

// ─── HU-02: Editar reporte ───────────────────────────────────────────────────

describe('HU-02 — Editar reporte', () => {
  it('edita el reporte si el usuario es el propietario', async () => {
    const repo = makeRepo();
    const service = new ReporteService(repo);

    await service.editarReporte('reporte-uuid-1', { color: 'negro' }, 'usuario-uuid-1', []);

    expect(repo.actualizar).toHaveBeenCalledWith('reporte-uuid-1', { color: 'negro' });
  });

  it('lanza 403 si el usuario no es el propietario', async () => {
    const repo = makeRepo();
    const service = new ReporteService(repo);

    await expect(
      service.editarReporte('reporte-uuid-1', { color: 'negro' }, 'otro-usuario', [])
    ).rejects.toMatchObject({ status: 403 });
  });

  it('publica REPORTE_ACTUALIZADO solo si cambia la ubicacion', async () => {
    const repo = makeRepo();
    const service = new ReporteService(repo);

    await service.editarReporte(
      'reporte-uuid-1',
      { ubicacionLatitud: -36.90, ubicacionLongitud: -73.10 },
      'usuario-uuid-1',
      []
    );

    expect(mensajeriaService.publicar).toHaveBeenCalledWith(
      'mascota.reporte.actualizado',
      expect.objectContaining({ reporteId: 'reporte-uuid-1' })
    );
  });

  it('no publica evento si solo cambia el color', async () => {
    const repo = makeRepo();
    const service = new ReporteService(repo);

    await service.editarReporte('reporte-uuid-1', { color: 'negro' }, 'usuario-uuid-1', []);

    expect(mensajeriaService.publicar).not.toHaveBeenCalledWith(
      'mascota.reporte.actualizado',
      expect.anything()
    );
  });
});

// ─── HU-03: Cambiar estado ───────────────────────────────────────────────────

describe('HU-03 — Cambiar estado', () => {
  it('cambia el estado si el usuario es el propietario', async () => {
    const repo = makeRepo();
    const service = new ReporteService(repo);

    await service.cambiarEstado('reporte-uuid-1', EstadoReporte.RESUELTO, 'usuario-uuid-1', false);

    expect(repo.cambiarEstado).toHaveBeenCalledWith('reporte-uuid-1', EstadoReporte.RESUELTO);
  });

  it('publica REPORTE_ESTADO_CAMBIADO al cambiar estado', async () => {
    const repo = makeRepo();
    const service = new ReporteService(repo);

    await service.cambiarEstado('reporte-uuid-1', EstadoReporte.RESUELTO, 'usuario-uuid-1', false);

    expect(mensajeriaService.publicar).toHaveBeenCalledWith(
      'mascota.reporte.estado_cambiado',
      expect.objectContaining({ reporteId: 'reporte-uuid-1', estado: EstadoReporte.RESUELTO })
    );
  });

  it('un moderador puede cambiar estado de cualquier reporte', async () => {
    const repo = makeRepo();
    const service = new ReporteService(repo);

    await expect(
      service.cambiarEstado('reporte-uuid-1', EstadoReporte.OCULTO, 'otro-usuario', true)
    ).resolves.not.toThrow();
  });

  it('lanza 403 si un ciudadano intenta cambiar estado de reporte ajeno', async () => {
    const repo = makeRepo();
    const service = new ReporteService(repo);

    await expect(
      service.cambiarEstado('reporte-uuid-1', EstadoReporte.RESUELTO, 'otro-usuario', false)
    ).rejects.toMatchObject({ status: 403 });
  });
});

// ─── HU-04: Eliminar reporte ─────────────────────────────────────────────────

describe('HU-04 — Eliminar reporte', () => {
  it('un ciudadano puede eliminar su reporte si esta RESUELTO', async () => {
    const repo = makeRepo({
      buscarPorId: jest.fn().mockResolvedValue(
        makeReporte({ estado: EstadoReporte.RESUELTO })
      ),
    });
    const service = new ReporteService(repo);

    await service.eliminarReporte('reporte-uuid-1', 'usuario-uuid-1', false);

    expect(repo.eliminar).toHaveBeenCalledWith('reporte-uuid-1');
  });

  it('un ciudadano puede eliminar su reporte si esta ABANDONADO', async () => {
    const repo = makeRepo({
      buscarPorId: jest.fn().mockResolvedValue(
        makeReporte({ estado: EstadoReporte.ABANDONADO })
      ),
    });
    const service = new ReporteService(repo);

    await service.eliminarReporte('reporte-uuid-1', 'usuario-uuid-1', false);

    expect(repo.eliminar).toHaveBeenCalledWith('reporte-uuid-1');
  });

  it('lanza 403 si un ciudadano intenta eliminar reporte EN_BUSQUEDA', async () => {
    const repo = makeRepo();
    const service = new ReporteService(repo);

    await expect(
      service.eliminarReporte('reporte-uuid-1', 'usuario-uuid-1', false)
    ).rejects.toMatchObject({ status: 403 });
  });

  it('lanza 403 si un ciudadano intenta eliminar reporte ajeno', async () => {
    const repo = makeRepo({
      buscarPorId: jest.fn().mockResolvedValue(
        makeReporte({ estado: EstadoReporte.RESUELTO })
      ),
    });
    const service = new ReporteService(repo);

    await expect(
      service.eliminarReporte('reporte-uuid-1', 'otro-usuario', false)
    ).rejects.toMatchObject({ status: 403 });
  });

  it('un moderador puede eliminar cualquier reporte sin restriccion de estado', async () => {
    const repo = makeRepo();
    const service = new ReporteService(repo);

    await service.eliminarReporte('reporte-uuid-1', 'otro-usuario', true);

    expect(repo.eliminar).toHaveBeenCalledWith('reporte-uuid-1');
  });

  it('publica REPORTE_ELIMINADO al eliminar', async () => {
    const repo = makeRepo({
      buscarPorId: jest.fn().mockResolvedValue(
        makeReporte({ estado: EstadoReporte.RESUELTO })
      ),
    });
    const service = new ReporteService(repo);

    await service.eliminarReporte('reporte-uuid-1', 'usuario-uuid-1', false);

    expect(mensajeriaService.publicar).toHaveBeenCalledWith(
      'mascota.reporte.eliminado',
      expect.objectContaining({ reporteId: 'reporte-uuid-1' })
    );
  });
});

// ─── HU-05: Listar y filtrar reportes ────────────────────────────────────────

describe('HU-05 — Listar y filtrar reportes', () => {
  it('lista todos los reportes sin filtros', async () => {
    const repo = makeRepo();
    const service = new ReporteService(repo);

    const resultado = await service.listarReportes({});

    expect(repo.listar).toHaveBeenCalledWith({});
    expect(resultado.data).toHaveLength(1);
  });

  it('pasa los filtros correctamente al repositorio', async () => {
    const repo = makeRepo();
    const service = new ReporteService(repo);
    const filtros = { tipo: TipoReporte.PERDIDA, especie: EspecieMascota.PERRO };

    await service.listarReportes(filtros);

    expect(repo.listar).toHaveBeenCalledWith(filtros);
  });

  it('lanza 404 si se busca un reporte inexistente', async () => {
    const repo = makeRepo({
      buscarPorId: jest.fn().mockResolvedValue(null),
    });
    const service = new ReporteService(repo);

    await expect(service.obtenerReporte('no-existe')).rejects.toMatchObject({ status: 404 });
  });
});
