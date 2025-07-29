"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Producto, CartItem, User, Turno } from "@/lib/types"
import { getCurrentUser } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShoppingCart, Plus, Minus, Trash2, Clock, CreditCard } from "lucide-react"

export default function POSPage() {
  const [user, setUser] = useState<User | null>(null)
  const [productos, setProductos] = useState<Producto[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [turnoActivo, setTurnoActivo] = useState<Turno | null>(null)
  const [efectivoInicial, setEfectivoInicial] = useState("")
  const [metodoPago, setMetodoPago] = useState<"efectivo" | "tarjeta" | "transferencia" | "webpay" | "otro">("efectivo")
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const userData = await getCurrentUser()
      if (!userData || (userData.rol !== "trabajador" && userData.rol !== "admin")) {
        window.location.href = "/auth/login"
        return
      }

      setUser(userData)

      // Verificar si hay un turno activo
      const { data: turnoData } = await supabase
        .from("turnos")
        .select("*")
        .eq("trabajador_id", userData.id)
        .is("fecha_fin", null)
        .single()

      if (turnoData) {
        setTurnoActivo(turnoData)
        await loadProductos(userData.sucursal_id!)
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadProductos = async (sucursalId: number) => {
    const { data, error } = await supabase
      .from("productos")
      .select(`
        *,
        categoria:categorias(nombre),
        medios:medios_producto(*),
        stock:stock_sucursal!inner(stock)
      `)
      .eq("stock.sucursal_id", sucursalId)
      .gt("stock.stock", 0)

    if (error) {
      console.error("Error loading products:", error)
      return
    }

    setProductos(data || [])
  }

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
      await loadProductos(user.sucursal_id!)
      setEfectivoInicial("")
    } catch (error) {
      console.error("Error starting shift:", error)
    }
  }

  const finalizarTurno = async () => {
    if (!turnoActivo) return

    try {
      // Calcular efectivo final basado en ventas
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
      setProductos([])
      setCart([])
    } catch (error) {
      console.error("Error ending shift:", error)
    }
  }

  const addToCart = (producto: Producto) => {
    const existingItem = cart.find((item) => item.producto.id === producto.id)

    if (existingItem) {
      setCart(cart.map((item) => (item.producto.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item)))
    } else {
      setCart([...cart, { producto, cantidad: 1 }])
    }
  }

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter((item) => item.producto.id !== productId))
    } else {
      setCart(cart.map((item) => (item.producto.id === productId ? { ...item, cantidad: newQuantity } : item)))
    }
  }

  const getTotal = () => {
    return cart.reduce((total, item) => total + item.producto.precio * item.cantidad, 0)
  }

  const procesarVenta = async () => {
    if (cart.length === 0 || !user || !turnoActivo) return

    setProcessingPayment(true)

    try {
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
        const { error: stockError } = await supabase
          .from("stock_sucursal")
          .update({
            stock: item.producto.stock![0].stock - item.cantidad,
          })
          .eq("producto_id", item.producto.id)
          .eq("sucursal_id", user.sucursal_id!)

        if (stockError) throw stockError
      }

      // Limpiar carrito y recargar productos
      setCart([])
      await loadProductos(user.sucursal_id!)

      alert("Venta procesada exitosamente")
    } catch (error) {
      console.error("Error processing sale:", error)
      alert("Error al procesar la venta")
    } finally {
      setProcessingPayment(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || (user.rol !== "trabajador" && user.rol !== "admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert>
          <AlertDescription>No tienes permisos para acceder al POS</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!turnoActivo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Iniciar Turno</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="efectivo">Efectivo inicial en caja</Label>
              <Input
                id="efectivo"
                type="number"
                step="0.01"
                value={efectivoInicial}
                onChange={(e) => setEfectivoInicial(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <Button onClick={iniciarTurno} className="w-full" disabled={!efectivoInicial}>
              <Clock className="h-4 w-4 mr-2" />
              Iniciar Turno
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Punto de Venta</h1>
            <p className="text-gray-600">Turno iniciado: {new Date(turnoActivo.fecha_inicio).toLocaleString()}</p>
          </div>
          <Button onClick={finalizarTurno} variant="outline">
            Finalizar Turno
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Productos */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Productos Disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {productos.map((producto) => (
                    <div
                      key={producto.id}
                      className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => addToCart(producto)}
                    >
                      <h3 className="font-medium mb-2">{producto.nombre}</h3>
                      <p className="text-lg font-bold text-blue-600 mb-2">${producto.precio.toFixed(2)}</p>
                      <Badge variant="secondary">Stock: {producto.stock?.[0]?.stock || 0}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Carrito */}
          <div>
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
                        <h4 className="font-medium">{item.producto.nombre}</h4>
                        <p className="text-sm text-gray-600">${item.producto.precio.toFixed(2)} c/u</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.producto.id, item.cantidad - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.cantidad}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.producto.id, item.cantidad + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => updateQuantity(item.producto.id, 0)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {cart.length === 0 && <p className="text-gray-500 text-center py-4">Carrito vacío</p>}

                  {cart.length > 0 && (
                    <div className="space-y-4 pt-4">
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total:</span>
                        <span>${getTotal().toFixed(2)}</span>
                      </div>

                      <div>
                        <Label>Método de Pago</Label>
                        <Select value={metodoPago} onValueChange={(value: any) => setMetodoPago(value)}>
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

                      <Button onClick={procesarVenta} className="w-full" disabled={processingPayment}>
                        {processingPayment ? (
                          "Procesando..."
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
          </div>
        </div>
      </div>
    </div>
  )
}
