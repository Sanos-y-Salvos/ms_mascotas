import { body, query, param, ValidationChain } from 'express-validator';
import { TipoReporte, TamanioMascota, EstadoReporte, EspecieMascota } from '../entities/Reporte';

export const validarCrearReporte = [
  body('nombreMascota').trim().notEmpty().withMessage('El nombre de la mascota es requerido'),
  body('especie')
    .isIn(Object.values(EspecieMascota))
    .withMessage(`Especie debe ser: ${Object.values(EspecieMascota).join(', ')}`), 
  body('color').trim().notEmpty().withMessage('El color es requerido'),
  body('tamanio')
    .isIn(Object.values(TamanioMascota))
    .withMessage(`Tamaño debe ser: ${Object.values(TamanioMascota).join(', ')}`),
  body('tipo')
    .isIn(Object.values(TipoReporte))
    .withMessage(`Tipo debe ser: ${Object.values(TipoReporte).join(', ')}`),

  // Coordenadas — el campo crítico para el mapa
  body('ubicacionLatitud')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitud inválida (debe estar entre -90 y 90)'),
  body('ubicacionLongitud')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitud inválida (debe estar entre -180 y 180)'),

  body('direccionReferencia').optional().trim().isLength({ max: 255 }),
  body('descripcion').optional().trim().isLength({ max: 1000 }),
];

export const validarFiltros = [
  query('tipo').optional().isIn(Object.values(TipoReporte)),
  query('estado').optional().isIn(Object.values(EstadoReporte)),
  query('especie').optional().isIn(Object.values(EspecieMascota)), 
  query('color').optional().trim(),
];

export const validarCambiarEstado = [
  param('id').isUUID().withMessage('ID inválido'),
  body('estado')
    .isIn(Object.values(EstadoReporte))
    .withMessage(`Estado debe ser: ${Object.values(EstadoReporte).join(', ')}`),
];
