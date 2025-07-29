-- Insertar datos de prueba
INSERT INTO categorias (nombre) VALUES 
('Electrónicos'),
('Ropa'),
('Hogar'),
('Deportes');

INSERT INTO sucursales (nombre, direccion) VALUES 
('Sucursal Centro', 'Av. Principal 123'),
('Sucursal Norte', 'Calle Norte 456');

INSERT INTO users (nombre, email, rol, sucursal_id) VALUES 
('Admin Principal', 'admin@empresa.com', 'admin', 1),
('Juan Trabajador', 'juan@empresa.com', 'trabajador', 1),
('María Cliente', 'maria@cliente.com', 'cliente', NULL);

INSERT INTO productos (nombre, descripcion, precio, categoria_id, destacado) VALUES 
('iPhone 15', 'Último modelo de iPhone', 999.99, 1, true),
('Camiseta Básica', 'Camiseta de algodón', 19.99, 2, false),
('Lámpara LED', 'Lámpara inteligente', 49.99, 3, true);

INSERT INTO stock_sucursal (producto_id, sucursal_id, stock) VALUES 
(1, 1, 10),
(1, 2, 5),
(2, 1, 50),
(3, 1, 20);
