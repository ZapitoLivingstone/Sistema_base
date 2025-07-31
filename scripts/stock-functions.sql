-- Función para actualizar stock de manera segura
CREATE OR REPLACE FUNCTION actualizar_stock(
  p_producto_id bigint,
  p_sucursal_id bigint,
  p_cantidad integer
)
RETURNS void AS $$
BEGIN
  -- Actualizar stock
  UPDATE stock_sucursal 
  SET stock = stock + p_cantidad
  WHERE producto_id = p_producto_id 
    AND sucursal_id = p_sucursal_id;
  
  -- Si no existe el registro, crearlo
  IF NOT FOUND THEN
    INSERT INTO stock_sucursal (producto_id, sucursal_id, stock)
    VALUES (p_producto_id, p_sucursal_id, GREATEST(0, p_cantidad));
  END IF;
  
  -- Verificar que el stock no sea negativo
  UPDATE stock_sucursal 
  SET stock = 0 
  WHERE producto_id = p_producto_id 
    AND sucursal_id = p_sucursal_id 
    AND stock < 0;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener stock por sucursal
CREATE OR REPLACE FUNCTION obtener_stock_sucursal(
  p_producto_id bigint,
  p_sucursal_id bigint
)
RETURNS integer AS $$
DECLARE
  stock_actual integer;
BEGIN
  SELECT stock INTO stock_actual
  FROM stock_sucursal
  WHERE producto_id = p_producto_id 
    AND sucursal_id = p_sucursal_id;
  
  RETURN COALESCE(stock_actual, 0);
END;
$$ LANGUAGE plpgsql;

-- Vista para productos con stock por sucursal
CREATE OR REPLACE VIEW productos_con_stock AS
SELECT 
  p.*,
  s.stock,
  s.sucursal_id,
  suc.nombre as sucursal_nombre,
  c.nombre as categoria_nombre
FROM productos p
LEFT JOIN stock_sucursal s ON p.id = s.producto_id
LEFT JOIN sucursales suc ON s.sucursal_id = suc.id
LEFT JOIN categorias c ON p.categoria_id = c.id;
