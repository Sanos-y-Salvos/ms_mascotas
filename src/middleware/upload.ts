import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? 'uploads';
const MAX_MB = parseInt(process.env.MAX_FILE_SIZE_MB ?? '5', 10);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    // UUID como nombre de archivo para evitar colisiones y ocultar rutas originales
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const permitidos = ['image/jpeg', 'image/png', 'image/webp'];
  if (permitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes JPEG, PNG o WebP'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_MB * 1024 * 1024 },
});
