export interface User {
  id: number
  nombre: string
  email: string
  rol: "admin" | "cliente" | "trabajador"
  sucursal_id?: number
  created_at: string
  updated_at?: string
}

export interface Producto {
  id: number
  nombre: string
  descripcion?: string
  precio: number
  categoria_id: number
  destacado: boolean
  created_at: string
  updated_at?: string
  categoria?: Categoria
  medios?: MedioProducto[]
  stock?: StockSucursal[]
}

export interface Categoria {
  id: number
  nombre: string
}

export interface Sucursal {
  id: number
  nombre: string
  direccion: string
}

export interface MedioProducto {
  id: number
  producto_id: number
  tipo: "foto" | "video"
  url: string
}

export interface StockSucursal {
  id: number
  producto_id: number
  sucursal_id: number
  stock: number
}

export interface Venta {
  id: number
  trabajador_id?: number
  sucursal_id: number
  monto_total: number
  metodo_pago: "efectivo" | "tarjeta" | "transferencia" | "webpay" | "otro"
  tipo_venta: "fisica" | "online"
  anulada: boolean
  motivo_anulacion?: string
  fecha: string
}

export interface Pedido {
  id: number
  usuario_id: number
  sucursal_id: number
  estado: "preparación" | "en camino" | "entregado"
  fecha_creacion: string
  fecha_entrega?: string
  venta_id?: number
}

export interface DetalleVentaPedido {
  id: number
  producto_id: number
  venta_id?: number
  pedido_id?: number
  cantidad: number
  producto?: Producto
}

export interface Turno {
  id: number
  trabajador_id: number
  sucursal_id: number
  efectivo_inicial: number
  efectivo_final?: number
  fecha_inicio: string
  fecha_fin?: string
}

export interface CartItem {
  producto: Producto
  cantidad: number
}
