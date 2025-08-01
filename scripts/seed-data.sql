-- Insertar categorías
INSERT INTO categorias (nombre) VALUES 
('Electrónicos'),
('Ropa'),
('Hogar'),
('Deportes'),
('Libros'),
('Juguetes');

-- Insertar sucursales
INSERT INTO sucursales (nombre, direccion) VALUES 
('Sucursal Centro', 'Av. Libertador Bernardo O''Higgins 1234, Santiago Centro'),
('Sucursal Las Condes', 'Av. Apoquindo 5678, Las Condes'),
('Sucursal Maipú', 'Av. Pajaritos 9012, Maipú');

-- Insertar usuarios (admin, trabajadores, clientes)
INSERT INTO users (nombre, email, rol, sucursal_id) VALUES 
('Admin Principal', 'admin@empresa.com', 'admin', 1),
('Juan Pérez', 'juan.perez@empresa.com', 'trabajador', 1),
('María González', 'maria.gonzalez@empresa.com', 'trabajador', 2),
('Carlos Rodríguez', 'carlos.rodriguez@empresa.com', 'trabajador', 3),
('Ana López', 'ana.lopez@email.com', 'cliente', NULL),
('Pedro Martínez', 'pedro.martinez@email.com', 'cliente', NULL);

-- Insertar productos con precios en CLP (sin decimales)
INSERT INTO productos (nombre, descripcion, precio, categoria_id, destacado) VALUES 
-- Electrónicos
('iPhone 15', 'Smartphone Apple iPhone 15 128GB', 899990, 1, true),
('Samsung Galaxy S24', 'Smartphone Samsung Galaxy S24 256GB', 749990, 1, true),
('MacBook Air M2', 'Laptop Apple MacBook Air 13" M2 256GB', 1299990, 1, false),
('iPad Air', 'Tablet Apple iPad Air 10.9" 64GB', 649990, 1, true),
('AirPods Pro', 'Audífonos inalámbricos Apple AirPods Pro', 249990, 1, false),

-- Ropa
('Polera Nike', 'Polera deportiva Nike Dri-FIT', 29990, 2, false),
('Jeans Levi''s', 'Jeans Levi''s 501 Original', 59990, 2, false),
('Zapatillas Adidas', 'Zapatillas Adidas Ultraboost 22', 149990, 2, true),
('Chaqueta North Face', 'Chaqueta impermeable The North Face', 199990, 2, false),

-- Hogar
('Cafetera Nespresso', 'Cafetera Nespresso Vertuo Next', 179990, 3, false),
('Aspiradora Dyson', 'Aspiradora Dyson V15 Detect', 599990, 3, true),
('Smart TV Samsung 55"', 'Smart TV Samsung 55" 4K UHD', 499990, 3, true),
('Microondas LG', 'Microondas LG 25L con grill', 129990, 3, false),

-- Deportes
('Bicicleta Trek', 'Bicicleta Trek FX 3 Disc', 899990, 4, false),
('Pelota de Fútbol', 'Pelota de fútbol Nike Premier League', 39990, 4, false),
('Raqueta de Tenis', 'Raqueta Wilson Pro Staff', 199990, 4, false),

-- Libros
('El Principito', 'Libro clásico de Antoine de Saint-Exupéry', 12990, 5, false),
('Cien Años de Soledad', 'Novela de Gabriel García Márquez', 18990, 5, false),
('Harry Potter Colección', 'Colección completa Harry Potter', 89990, 5, true),

-- Juguetes
('LEGO Creator', 'Set LEGO Creator 3 en 1', 79990, 6, false),
('Muñeca Barbie', 'Muñeca Barbie Fashionista', 24990, 6, false),
('PlayStation 5', 'Consola Sony PlayStation 5', 599990, 6, true);

-- Insertar stock para cada sucursal
INSERT INTO stock_sucursal (producto_id, sucursal_id, stock) VALUES 
-- Sucursal Centro (id: 1)
(1, 1, 15), (2, 1, 12), (3, 1, 8), (4, 1, 20), (5, 1, 25),
(6, 1, 50), (7, 1, 30), (8, 1, 18), (9, 1, 12),
(10, 1, 10), (11, 1, 5), (12, 1, 8), (13, 1, 15),
(14, 1, 3), (15, 1, 25), (16, 1, 40), (17, 1, 100),
(18, 1, 75), (19, 1, 45), (20, 1, 35), (21, 1, 60), (22, 1, 4),

-- Sucursal Las Condes (id: 2)
(1, 2, 20), (2, 2, 18), (3, 2, 12), (4, 2, 25), (5, 2, 30),
(6, 2, 40), (7, 2, 35), (8, 2, 22), (9, 2, 15),
(10, 2, 8), (11, 2, 7), (12, 2, 10), (13, 2, 20),
(14, 2, 5), (15, 2, 30), (16, 2, 35), (17, 2, 80),
(18, 2, 60), (19, 2, 50), (20, 2, 40), (21, 2, 55), (22, 2, 6),

-- Sucursal Maipú (id: 3)
(1, 3, 10), (2, 3, 8), (3, 3, 5), (4, 3, 15), (5, 3, 20),
(6, 3, 35), (7, 3, 25), (8, 3, 15), (9, 3, 10),
(10, 3, 6), (11, 3, 4), (12, 3, 6), (13, 3, 12),
(14, 3, 2), (15, 3, 20), (16, 3, 30), (17, 3, 90),
(18, 3, 70), (19, 3, 40), (20, 3, 30), (21, 3, 50), (22, 3, 3);

-- Insertar algunas imágenes de ejemplo para productos
INSERT INTO medios_producto (producto_id, tipo, url) VALUES 
(1, 'foto', '/placeholder.svg?height=300&width=300&text=iPhone+15'),
(2, 'foto', '/placeholder.svg?height=300&width=300&text=Samsung+Galaxy+S24'),
(3, 'foto', '/placeholder.svg?height=300&width=300&text=MacBook+Air+M2'),
(4, 'foto', '/placeholder.svg?height=300&width=300&text=iPad+Air'),
(5, 'foto', '/placeholder.svg?height=300&width=300&text=AirPods+Pro'),
(8, 'foto', '/placeholder.svg?height=300&width=300&text=Zapatillas+Adidas'),
(11, 'foto', '/placeholder.svg?height=300&width=300&text=Aspiradora+Dyson'),
(12, 'foto', '/placeholder.svg?height=300&width=300&text=Smart+TV+Samsung'),
(19, 'foto', '/placeholder.svg?height=300&width=300&text=Harry+Potter'),
(22, 'foto', '/placeholder.svg?height=300&width=300&text=PlayStation+5');
