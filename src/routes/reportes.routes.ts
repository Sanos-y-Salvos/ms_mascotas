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

router.post('/', authMiddleware, upload.array('fotos', 5), validarCrearReporte, ctrl.crear);

router.put('/:id', authMiddleware, upload.array('fotos', 5), ctrl.editar);