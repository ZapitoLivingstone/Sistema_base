-- CATEGORÍAS
create table categorias (
  id bigint primary key generated always as identity,
  nombre text not null
);

-- SUCURSALES
create table sucursales (
  id bigint primary key generated always as identity,
  nombre text not null,
  direccion text not null
);

-- USUARIOS
create table users (
  id bigint primary key generated always as identity,
  nombre text not null,
  email text unique not null,
  rol text check (rol in ('admin', 'cliente', 'trabajador')) not null,
  sucursal_id bigint references sucursales (id),
  created_at timestamptz default now(),
  updated_at timestamptz
);

-- PRODUCTOS (precio en enteros para CLP)
create table productos (
  id bigint primary key generated always as identity,
  nombre text not null,
  descripcion text,
  precio integer not null, -- Cambiado a integer para CLP
  categoria_id bigint references categorias (id),
  destacado boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz
);

-- STOCK POR SUCURSAL
create table stock_sucursal (
  id bigint primary key generated always as identity,
  producto_id bigint references productos(id),
  sucursal_id bigint references sucursales(id),
  stock int not null default 0,
  unique (producto_id, sucursal_id)
);

-- MEDIOS (fotos/videos)
create table medios_producto (
  id bigint primary key generated always as identity,
  producto_id bigint references productos (id),
  tipo text check (tipo in ('foto', 'video')) not null,
  url text not null
);

-- VENTAS (monto en enteros para CLP)
create table ventas (
  id bigint primary key generated always as identity,
  trabajador_id bigint references users (id),
  sucursal_id bigint references sucursales (id),
  monto_total integer not null, -- Cambiado a integer para CLP
  metodo_pago text check (metodo_pago in ('efectivo', 'tarjeta', 'transferencia', 'webpay', 'otro')) not null,
  tipo_venta text check (tipo_venta in ('fisica', 'online')) not null default 'fisica',
  anulada boolean default false,
  motivo_anulacion text,
  fecha timestamptz default now()
);

-- PEDIDOS
create table pedidos (
  id bigint primary key generated always as identity,
  usuario_id bigint references users (id),
  sucursal_id bigint references sucursales(id),
  estado text check (estado in ('preparación', 'en camino', 'entregado')) not null,
  fecha_creacion timestamptz default now(),
  fecha_entrega timestamptz,
  venta_id bigint references ventas(id)
);

-- DETALLES DE VENTA o PEDIDO
create table detalles_venta_pedido (
  id bigint primary key generated always as identity,
  producto_id bigint references productos (id),
  venta_id bigint references ventas (id),
  pedido_id bigint references pedidos (id),
  cantidad int not null,
  constraint check_venta_pedido check (
    (venta_id is not null and pedido_id is null) or 
    (pedido_id is not null and venta_id is null)
  )
);

-- TURNOS DE CAJA (POS) - efectivo en enteros para CLP
create table turnos (
  id bigint primary key generated always as identity,
  trabajador_id bigint references users (id),
  sucursal_id bigint references sucursales (id),
  efectivo_inicial integer not null, -- Cambiado a integer para CLP
  efectivo_final integer, -- Cambiado a integer para CLP
  fecha_inicio timestamptz default now(),
  fecha_fin timestamptz
);

-- ÍNDICES PARA RENDIMIENTO
create index idx_users_sucursal on users (sucursal_id);
create index idx_productos_categoria on productos (categoria_id);
create index idx_stock_sucursal on stock_sucursal (producto_id, sucursal_id);
create index idx_ventas_fecha on ventas (fecha);
create index idx_pedidos_estado_fecha on pedidos (estado, fecha_creacion);
create index idx_turnos_trabajador on turnos (trabajador_id);
create index idx_turnos_activos on turnos (trabajador_id, fecha_fin) where fecha_fin is null;
