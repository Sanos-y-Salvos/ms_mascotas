import 'reflect-metadata';
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

import { AppDataSource } from './config/database';
import { mensajeriaService } from './services/MensajeriaService';
import reportesRouter from './routes/reportes.routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();
const PORT = process.env.PORT ?? 3003;

// ── Directorio de uploads ──────────────────────────────────────────────────
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? 'uploads';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ── Middlewares globales ───────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir imágenes estáticamente (en producción usar un CDN/nginx)
app.use('/uploads', express.static(path.resolve(UPLOAD_DIR)));

// ── Rutas ──────────────────────────────────────────────────────────────────
app.use('/reportes', reportesRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', microservicio: 'ms-mascotas', version: '1.0.0' });
});

// ── Manejador de errores ───────────────────────────────────────────────────
app.use(errorHandler);

// ── Bootstrap ─────────────────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  try {
    await AppDataSource.initialize();
    console.log('[DB] Conexión a PostgreSQL establecida');

    await mensajeriaService.conectar();

    app.listen(PORT, () => {
      console.log(`[MS-Mascotas] Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('[Bootstrap] Error crítico al iniciar:', error);
    process.exit(1);
  }
}

bootstrap();
