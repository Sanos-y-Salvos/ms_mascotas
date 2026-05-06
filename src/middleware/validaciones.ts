import { body, query, param } from 'express-validator';
import { TipoReporte, TamanioMascota, EstadoReporte } from '../entities/Reporte';


export const validarCrearReporte = [
  body('nombreMascota').trim().notEmpty(),
  body('raza').trim().notEmpty(),
  body('color').trim().notEmpty(),
  body('tamanio').isIn(Object.values(TamanioMascota)),
  body('tipo').isIn(Object.values(TipoReporte)),
  body('ubicacionLatitud').isFloat({ min: -90, max: 90 }),
  body('ubicacionLongitud').isFloat({ min: -180, max: 180 }),
  body('direccionReferencia').optional().trim().isLength({ max: 255 }),
  body('descripcion').optional().trim().isLength({ max: 1000 }),
  body('codigoChip').optional().trim().isLength({ max: 50 }),
];