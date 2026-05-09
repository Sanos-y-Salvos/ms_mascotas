import { Router } from 'express';
import { ReporteController } from '../controllers/ReporteController';
import { ReporteService } from '../services/ReporteService';
import { ReporteRepository } from '../repositories/ReporteRepository';
import { authMiddleware } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import {
  validarCrearReporte,
  validarFiltros,
  validarCambiarEstado,
} from '../middlewares/validaciones';

const router = Router();

// Composición de dependencias (manual DI)
const repo = new ReporteRepository();
const service = new ReporteService(repo);
const ctrl = new ReporteController(service);

/**
 * Todas las rutas requieren autenticación (token del Gateway).
 *
 * POST   /reportes           → Crear reporte (con hasta 5 fotos)
 * GET    /reportes           → Listar con filtros opcionales
 * GET    /reportes/:id       → Obtener uno
 * PUT    /reportes/:id       → Editar (propietario o moderador)
 * PATCH  /reportes/:id/estado → Cambiar estado
 * DELETE /reportes/:id       → Eliminar
 */
router.post(
  '/',
  authMiddleware,
  upload.array('fotos', 5),
  validarCrearReporte,
  ctrl.crear
);

router.get('/', authMiddleware, validarFiltros, ctrl.listar);

router.get('/:id', authMiddleware, ctrl.obtener);

router.put(
  '/:id',
  authMiddleware,
  upload.array('fotos', 5),
  ctrl.editar
);

router.patch('/:id/estado', authMiddleware, validarCambiarEstado, ctrl.cambiarEstado);

router.delete('/:id', authMiddleware, ctrl.eliminar);

export default router;
