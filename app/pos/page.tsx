"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import { formatPrice } from "@/lib/utils"
import type { CartItem, User, Turno } from "@/lib/types"
import { usePOSProducts } from "@/hooks/use-pos-products"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import ProductCard from "@/components/product-card"
import { ShoppingCart, Plus, Minus, Trash2, Clock, CreditCard, Search, Package, Store, Calculator } from "lucide-react"

export default function POSPage() {
  // Estados principales
  const [user, setUser] = useState<User | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [turnoActivo, setTurnoActivo] = useState<Turno | null>(null)
  const [efectivoInicial, setEfectivoInicial] = useState("")
  const [metodoPago, setMetodoPago] = useState<"efectivo" | "tarjeta" | "transferencia" | "webpay" | "otro">("efectivo")
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)

  // Hook personalizado para productos
  const {
    productos,
    searchTerm,
    setSearchTerm,
    loading: loadingProducts,
    refreshProducts,
    totalProducts,
  } = usePOSProducts(user?.sucursal_id)

  useEffect(() => {
    loadData()
  }, [])

  // ==================== FUNCIONES DE CARGA ====================
  const loadData = async () => {
    try {
      const userData = await getCurrentUser()
      if (!userData || userData.rol !== "trabajador") {
        window.location.href = "/auth/login"
        return
      }

      setUser(userData)

      // Verificar turno activo - CORREGIR LA CONSULTA
      const { data: turnoData, error } = await supabase
        .from("turnos")
        .select("*")
        .eq("trabajador_id", userData.id)
        .is("fecha_fin", null)
        .maybeSingle() // Usar maybeSingle en lugar de single para evitar error 406

      if (error && error.code !== "PGRST116") {
        console.error("Error loading turno:", error)
      }

      if (turnoData) {
        setTurnoActivo(turnoData)
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  // ==================== GESTIÓN DE TURNOS ====================
  const iniciarTurno = async () => {
    if (!user || !efectivoInicial) return

    try {
      const { data, error } = await supabase
        .from("turnos")
        .insert([
          {
            trabajador_id: user.id,
            sucursal_id: user.sucursal_id!,
            efectivo_inicial: Number.parseFloat(efectivoInicial),
          },
        ])
        .select()
        .single()

      if (error) throw error

      setTurnoActivo(data)
      setEfectivoInicial("")
    } catch (error) {
      console.error("Error starting shift:", error)
      alert("Error al iniciar turno")
    }
  }

  const finalizarTurno = async () => {
    if (!turnoActivo) return

    try {
      // Calcular efectivo final
      const { data: ventasEfectivo } = await supabase
        .from("ventas")
        .select("monto_total")
        .eq("trabajador_id", user!.id)
        .eq("metodo_pago", "efectivo")
        .gte("fecha", turnoActivo.fecha_inicio)

      const totalEfectivo = ventasEfectivo?.reduce((sum, venta) => sum + venta.monto_total, 0) || 0
      const efectivoFinal = turnoActivo.efectivo_inicial + totalEfectivo

      const { error } = await supabase
        .from("turnos")
        .update({
          efectivo_final: efectivoFinal,
          fecha_fin: new Date().toISOString(),
        })
        .eq("id", turnoActivo.id)

      if (error) throw error

      setTurnoActivo(null)
      setCart([])
    } catch (error) {
      console.error("Error ending shift:", error)
      alert("Error al finalizar turno")
    }
  }

  // ==================== GESTIÓN DEL CARRITO ====================
  const addToCart = (producto: any) => {
    const existingItem = cart.find((item) => item.producto.id === producto.id)
    const cantidadEnCarrito = existingItem ? existingItem.cantidad : 0

    if (cantidadEnCarrito >= producto.stock_disponible) {
      alert(`Stock insuficiente. Solo hay ${producto.stock_disponible} unidades disponibles.`)
      return
    }

    if (existingItem) {
      setCart(cart.map((item) => (item.producto.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item)))
    } else {
      setCart([...cart, { producto, cantidad: 1 }])
    }
  }

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter((item) => item.producto.id !== productId))
      return
    }

    const producto = productos.find((p) => p.id === productId)
    if (producto && newQuantity > producto.stock_disponible) {
      alert(`Stock insuficiente. Solo hay ${producto.stock_disponible} unidades disponibles.`)
      return
    }

    setCart(cart.map((item) => (item.producto.id === productId ? { ...item, cantidad: newQuantity } : item)))
  }

  const getTotal = () => {
    return cart.reduce((total, item) => total + item.producto.precio * item.cantidad, 0)
  }

  // ==================== PROCESAMIENTO DE VENTAS ====================
  const procesarVenta = async () => {
    if (cart.length === 0 || !user || !turnoActivo) return

    setProcessingPayment(true)

    try {
      // Verificar stock antes de procesar
      for (const item of cart) {
        const { data: stockData } = await supabase
          .from("stock_sucursal")
          .select("stock")
          .eq("producto_id", item.producto.id)
          .eq("sucursal_id", user.sucursal_id!)
          .single()

        if (!stockData || stockData.stock < item.cantidad) {
          throw new Error(`Stock insuficiente para ${item.producto.nombre}`)
        }
      }

      // Crear venta
      const { data: venta, error: ventaError } = await supabase
        .from("ventas")
        .insert([
          {
            trabajador_id: user.id,
            sucursal_id: user.sucursal_id!,
            monto_total: getTotal(),
            metodo_pago: metodoPago,
            tipo_venta: "fisica",
          },
        ])
        .select()
        .single()

      if (ventaError) throw ventaError

      // Crear detalles de venta
      const detalles = cart.map((item) => ({
        producto_id: item.producto.id,
        venta_id: venta.id,
        cantidad: item.cantidad,
      }))

      const { error: detallesError } = await supabase.from("detalles_venta_pedido").insert(detalles)

      if (detallesError) throw detallesError

      // Actualizar stock
      for (const item of cart) {
        const { error: stockError } = await supabase.rpc("actualizar_stock", {
          p_producto_id: item.producto.id,
          p_sucursal_id: user.sucursal_id!,
          p_cantidad: -item.cantidad,
        })

        if (stockError) throw stockError
      }

      // Limpiar carrito y recargar productos
      setCart([])
      refreshProducts()

      alert(`Venta procesada exitosamente. Total: ${formatPrice(getTotal())}`)
    } catch (error: any) {
      console.error("Error processing sale:", error)
      alert(`Error al procesar la venta: ${error.message}`)
    } finally {
      setProcessingPayment(false)
    }
  }

  // ==================== RENDERIZADO CONDICIONAL ====================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user || user.rol !== "trabajador") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert>
          <AlertDescription>Solo los trabajadores tienen acceso al POS</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Pantalla de inicio de turno
  if (!turnoActivo) {
    return (
      <TurnoInicioScreen
        user={user}
        efectivoInicial={efectivoInicial}
        setEfectivoInicial={setEfectivoInicial}
        onIniciarTurno={iniciarTurno}
      />
    )
  }

  // ==================== PANTALLA PRINCIPAL POS ====================
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header del POS */}
        <POSHeader user={user} turnoActivo={turnoActivo} onFinalizarTurno={finalizarTurno} />

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Panel de Productos */}
          <div className="lg:col-span-2">
            <ProductosPanel
              productos={productos}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              loading={loadingProducts}
              totalProducts={totalProducts}
              onAddToCart={addToCart}
            />
          </div>

          {/* Panel del Carrito */}
          <div>
            <CarritoPanel
              cart={cart}
              metodoPago={metodoPago}
              setMetodoPago={setMetodoPago}
              onUpdateQuantity={updateQuantity}
              onProcesarVenta={procesarVenta}
              processingPayment={processingPayment}
              total={getTotal()}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== COMPONENTES AUXILIARES ====================

// Pantalla de inicio de turno
interface TurnoInicioScreenProps {
  user: User
  efectivoInicial: string
  setEfectivoInicial: (value: string) => void
  onIniciarTurno: () => void
}

function TurnoInicioScreen({ user, efectivoInicial, setEfectivoInicial, onIniciarTurno }: TurnoInicioScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Store className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <CardTitle className="text-2xl">Iniciar Turno</CardTitle>
          <p className="text-gray-600">Sucursal: {user.sucursal?.nombre || "No asignada"}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="efectivo">Efectivo inicial en caja</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="efectivo"
                type="number"
                value={efectivoInicial}
                onChange={(e) => setEfectivoInicial(e.target.value)}
                placeholder="0"
                className="pl-8"
              />
            </div>
          </div>
          <Button onClick={onIniciarTurno} className="w-full" disabled={!efectivoInicial}>
            <Clock className="h-4 w-4 mr-2" />
            Iniciar Turno
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Header del POS
interface POSHeaderProps {
  user: User
  turnoActivo: Turno
  onFinalizarTurno: () => void
}

function POSHeader({ user, turnoActivo, onFinalizarTurno }: POSHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm">
      <div>
        <h1 className="text-2xl font-bold flex items-center">
          <Store className="h-6 w-6 mr-2 text-blue-600" />
          Punto de Venta
        </h1>
        <div className="text-sm text-gray-600 space-y-1">
          <p>Sucursal: {user.sucursal?.nombre}</p>
          <p>Turno iniciado: {new Date(turnoActivo.fecha_inicio).toLocaleString()}</p>
          <p>Efectivo inicial: {formatPrice(turnoActivo.efectivo_inicial)}</p>
        </div>
      </div>
      <Button onClick={onFinalizarTurno} variant="outline">
        <Clock className="h-4 w-4 mr-2" />
        Finalizar Turno
      </Button>
    </div>
  )
}

// Panel de productos
interface ProductosPanelProps {
  productos: any[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  loading: boolean
  totalProducts: number
  onAddToCart: (producto: any) => void
}

function ProductosPanel({
  productos,
  searchTerm,
  setSearchTerm,
  loading,
  totalProducts,
  onAddToCart,
}: ProductosPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Productos Disponibles ({totalProducts})
          </span>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : productos.length === 0 ? (
          <EmptyState
            icon={Package}
            title={searchTerm ? "No se encontraron productos" : "No hay productos con stock"}
            description={
              searchTerm ? "Intenta con otros términos de búsqueda" : "No hay productos disponibles en esta sucursal"
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {productos.map((producto) => (
              <div key={producto.id} className="cursor-pointer" onClick={() => onAddToCart(producto)}>
                <ProductCard
                  producto={producto}
                  showAddToCart={false}
                  showStock={true}
                  stock={producto.stock_disponible}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Panel del carrito
interface CarritoPanelProps {
  cart: CartItem[]
  metodoPago: string
  setMetodoPago: (metodo: any) => void
  onUpdateQuantity: (id: number, quantity: number) => void
  onProcesarVenta: () => void
  processingPayment: boolean
  total: number
}

function CarritoPanel({
  cart,
  metodoPago,
  setMetodoPago,
  onUpdateQuantity,
  onProcesarVenta,
  processingPayment,
  total,
}: CarritoPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ShoppingCart className="h-5 w-5 mr-2" />
          Carrito ({cart.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {cart.map((item) => (
            <div key={item.producto.id} className="flex items-center justify-between border-b pb-2">
              <div className="flex-1">
                <h4 className="font-medium text-sm">{item.producto.nombre}</h4>
                <p className="text-sm text-gray-600">{formatPrice(item.producto.precio)} c/u</p>
                <p className="text-xs text-gray-500">Stock: {(item.producto as any).stock_disponible}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateQuantity(item.producto.id, item.cantidad - 1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center text-sm">{item.cantidad}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateQuantity(item.producto.id, item.cantidad + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onUpdateQuantity(item.producto.id, 0)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}

          {cart.length === 0 && (
            <EmptyState
              icon={ShoppingCart}
              title="Carrito vacío"
              description="Agrega productos para comenzar una venta"
            />
          )}

          {cart.length > 0 && (
            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-center text-lg font-bold bg-gray-50 p-3 rounded">
                <span className="flex items-center">
                  <Calculator className="h-4 w-4 mr-2" />
                  Total:
                </span>
                <span className="text-blue-600">{formatPrice(total)}</span>
              </div>

              <div>
                <Label>Método de Pago</Label>
                <Select value={metodoPago} onValueChange={setMetodoPago}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="webpay">WebPay</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={onProcesarVenta} className="w-full" size="lg" disabled={processingPayment}>
                {processingPayment ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Procesar Venta
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
