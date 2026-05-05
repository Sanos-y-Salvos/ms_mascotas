-- Migration: 001_create_reportes
-- MS-03 Gestión de Mascotas — Sanos y Salvos

-- ── Tipos ENUM ─────────────────────────────────────────────────────────────

CREATE TYPE tipo_reporte   AS ENUM ('PERDIDA', 'ENCONTRADA');
CREATE TYPE estado_reporte AS ENUM ('EN_BUSQUEDA', 'RESUELTO', 'ABANDONADO', 'OCULTO');
CREATE TYPE tamanio_mascota AS ENUM ('PEQUEÑO', 'MEDIANO', 'GRANDE');

-- ── Tabla principal ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reportes (
    id                   UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_mascota       VARCHAR(100)    NOT NULL,
    raza                 VARCHAR(100)    NOT NULL,
    color                VARCHAR(100)    NOT NULL,
    tamanio              tamanio_mascota NOT NULL,
    tipo                 tipo_reporte    NOT NULL,
    estado               estado_reporte  NOT NULL DEFAULT 'EN_BUSQUEDA',

    -- Coordenadas del lugar de pérdida o encuentro.
    -- float8 = DOUBLE PRECISION, suficiente para precisión de ~1 mm.
    -- El MS-04 (PostGIS/FastAPI) las consume directamente al recibir
    -- el evento de RabbitMQ para crear POINT(longitud, latitud).
    ubicacion_latitud    FLOAT8          NOT NULL,
    ubicacion_longitud   FLOAT8          NOT NULL,

    -- Dirección legible (opcional): "Av. Los Carrera 1452, Concepción"
    direccion_referencia VARCHAR(255),

    descripcion          TEXT,
    usuario_id           UUID            NOT NULL,

    fecha_publicacion    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    fecha_actualizacion  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ── Tabla de fotos ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reporte_fotos (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    reporte_id      UUID        NOT NULL REFERENCES reportes(id) ON DELETE CASCADE,
    nombre_archivo  VARCHAR(255) NOT NULL,
    url_relativa    VARCHAR(255) NOT NULL,
    fecha_subida    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Índices ────────────────────────────────────────────────────────────────

-- Búsquedas por tipo y estado (filtros más frecuentes en listar)
CREATE INDEX idx_reportes_tipo_estado ON reportes(tipo, estado);

-- Búsquedas por usuario para "mis reportes"
CREATE INDEX idx_reportes_usuario ON reportes(usuario_id);

-- Índice en coordenadas para consultas de proximidad básica desde este MS.
-- El MS-04 usa PostGIS para las consultas espaciales avanzadas,
-- pero este índice acelera ordenamientos simples por lat/lng aquí.
CREATE INDEX idx_reportes_ubicacion ON reportes(ubicacion_latitud, ubicacion_longitud);

-- Búsquedas por fecha de publicación (listado cronológico)
CREATE INDEX idx_reportes_fecha ON reportes(fecha_publicacion DESC);

-- ── Trigger: actualizar fecha_actualizacion automáticamente ───────────────

CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reportes_updated
BEFORE UPDATE ON reportes
FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
