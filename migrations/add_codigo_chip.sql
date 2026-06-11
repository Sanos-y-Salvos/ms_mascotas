-- ms-mascotas: add_codigo_chip.sql
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS codigo_chip VARCHAR(100);
