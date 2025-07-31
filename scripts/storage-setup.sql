-- Configuración de Storage para Supabase
-- Ejecutar en el SQL Editor de Supabase

-- 1. Crear bucket si no existe (esto también se puede hacer desde la UI)
INSERT INTO storage.buckets (id, name, public)
VALUES ('productos', 'productos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Política para lectura pública
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'productos');

-- 3. Política para subida (usuarios autenticados)
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'productos' 
  AND auth.role() = 'authenticated'
);

-- 4. Política para actualización (usuarios autenticados)
CREATE POLICY "Authenticated users can update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'productos' 
  AND auth.role() = 'authenticated'
);

-- 5. Política para eliminación (usuarios autenticados)
CREATE POLICY "Authenticated users can delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'productos' 
  AND auth.role() = 'authenticated'
);

-- 6. Actualizar tabla medios_producto para incluir path
ALTER TABLE medios_producto ADD COLUMN IF NOT EXISTS path text;

-- 7. Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_medios_producto_path ON medios_producto(path);
