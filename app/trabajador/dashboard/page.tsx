"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import type { User, Turno } from "@/lib/types"
import AuthGuard from "@/components/auth-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Clock, DollarSign, Package, Store, TrendingUp, AlertCircle } from "lucide-react"

export default function TrabajadorDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [turnoActivo, setTurnoActivo] = useState<Turno | null>(null)
  const [stats, setStats] = useState({
    ventasHoy: 0,
    montoHoy: 0,
    productosStock: 0,
    ventasSemana: 0,
    montoSemana: 0,
    ventasRecientes: [] as any[],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const userData = await getCurrentUser()
      if (!userData) return

      setUser(userData)

      // Verificar turno activo
      const { data: turnoData } = await supabase
        .from("turnos")
        .select("*")
        .eq("trabajador_id", userData.id)
        .is("fecha_fin", null)
        .single()

      if (turnoData) {
        setTurnoActivo(turnoData)
      }

      // Stats del día y semana
      const hoy = new Date().toISOString().split("T")[0]
      const semanaAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

      const [
        { data: ventasHoy, count: ventasHoyCount },
        { data: ventasSemana, count: ventasSemanaCount },
        { count: stockCount },
        { data: ventasRecientes },
      ] = await Promise.all([
        supabase
          .from("ventas")
          .select("monto_total", { count: "exact" })
          .eq("trabajador_id", userData.id)
          .gte("fecha", `${hoy}T00:00:00`)
          .eq("anulada", false),
        supabase
          .from("ventas")
          .select("monto_total", { count: "exact" })
          .eq("trabajador_id", userData.id)
          .gte("fecha", `${semanaAtras}T00:00:00`)
          .eq("anulada", false),
        supabase
          .from("stock_sucursal")
          .select("*", { count: "exact", head: true })
          .eq("sucursal_id", userData.sucursal_id!)
          .gt("stock", 0),
        supabase
          .from("ventas")
          .select(`
          *,
          detalles:detalles_venta_pedido(cantidad, producto:productos(nombre))
        `)
          .eq("trabajador_id", userData.id)
          .eq("anulada", false)
          .order("fecha", { ascending: false })
          .limit(5),
      ])

      const montoHoy = ventasHoy?.reduce((sum, venta) => sum + venta.monto_total, 0) || 0
      const montoSemana = ventasSemana?.reduce((sum, venta) => sum + venta.monto_total, 0) || 0

      setStats({
        ventasHoy: ventasHoyCount || 0,
        montoHoy,
        ventasSemana: ventasSemanaCount || 0,
        montoSemana,
        productosStock: stockCount || 0,
        ventasRecientes: ventasRecientes || [],
      })
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <AuthGuard allowedRoles={["trabajador", "admin"]}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Panel de Trabajador</h1>
            <p className="text-gray-600">Bienvenido, {user?.nombre}</p>
            {user?.sucursal && (
              <Badge variant="outline" className="mt-2">
                <Store className="h-3 w-3 mr-1" />
                {user.sucursal.nombre}
              </Badge>
            )}
          </div>

          {/* Estado del turno */}
          <Card className={`mb-8 ${turnoActivo ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}`}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Estado del Turno
              </CardTitle>
            </CardHeader>
            <CardContent>
              {turnoActivo ? (
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant="default" className="mb-2 bg-green-600">
                      Turno Activo
                    </Badge>
                    <p className="text-sm text-gray-600">
                      Iniciado: {new Date(turnoActivo.fecha_inicio).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Efectivo inicial: ${turnoActivo.efectivo_inicial.toFixed(2)}
                    </p>
                  </div>
                  <Link href="/pos">
                    <Button size="lg">
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Ir al POS
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant="secondary" className="mb-2 bg-orange-600 text-white">
                      Sin Turno Activo
                    </Badge>
                    <p className="text-sm text-gray-600">Debes iniciar un turno para usar el POS</p>
                    <p className="text-xs text-gray-500 mt-1">
                      <AlertCircle className="h-3 w-3 inline mr-1" />
                      Necesario para realizar ventas
                    </p>
                  </div>
                  <Link href="/pos">
                    <Button size="lg" variant="outline">
                      <Clock className="h-5 w-5 mr-2" />
                      Iniciar Turno
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats del trabajador */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ventas Hoy</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.ventasHoy}</div>
                <p className="text-xs text-muted-foreground">Ventas realizadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monto Hoy</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.montoHoy.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Total vendido</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ventas Semana</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.ventasSemana}</div>
                <p className="text-xs text-muted-foreground">${stats.montoSemana.toFixed(2)} total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Productos en Stock</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.productosStock}</div>
                <p className="text-xs text-muted-foreground">En tu sucursal</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Acciones principales */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones Principales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/pos">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Store className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">Punto de Venta</h3>
                          <p className="text-sm text-gray-600">
                            {turnoActivo ? "Continuar con las ventas" : "Iniciar turno y comenzar ventas"}
                          </p>
                        </div>
                        {turnoActivo && <Badge className="bg-green-600">Activo</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/productos">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Package className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">Explorar Productos</h3>
                          <p className="text-sm text-gray-600">Ver catálogo y realizar compras personales</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/cliente/dashboard">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <ShoppingCart className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">Modo Cliente</h3>
                          <p className="text-sm text-gray-600">Acceder a funciones de compra personal</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </CardContent>
            </Card>

            {/* Ventas recientes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Mis Ventas Recientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.ventasRecientes.map((venta) => (
                    <div key={venta.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">Venta #{venta.id}</p>
                        <p className="text-sm text-gray-600 capitalize">
                          {venta.metodo_pago} • {venta.tipo_venta}
                        </p>
                        <p className="text-xs text-gray-500">{venta.detalles?.length || 0} productos</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">${venta.monto_total.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{new Date(venta.fecha).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                  {stats.ventasRecientes.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No hay ventas recientes</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
