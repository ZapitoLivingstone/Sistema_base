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
import { ShoppingCart, Clock, DollarSign, Package, Store } from "lucide-react"

export default function TrabajadorDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [turnoActivo, setTurnoActivo] = useState<Turno | null>(null)
  const [stats, setStats] = useState({
    ventasHoy: 0,
    montoHoy: 0,
    productosStock: 0,
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

      // Stats del día
      const hoy = new Date().toISOString().split("T")[0]

      // Ventas de hoy
      const { data: ventasHoy, count: ventasCount } = await supabase
        .from("ventas")
        .select("monto_total", { count: "exact" })
        .eq("trabajador_id", userData.id)
        .gte("fecha", `${hoy}T00:00:00`)
        .eq("anulada", false)

      const montoHoy = ventasHoy?.reduce((sum, venta) => sum + venta.monto_total, 0) || 0

      // Productos en stock de la sucursal
      const { count: stockCount } = await supabase
        .from("stock_sucursal")
        .select("*", { count: "exact", head: true })
        .eq("sucursal_id", userData.sucursal_id!)
        .gt("stock", 0)

      setStats({
        ventasHoy: ventasCount || 0,
        montoHoy,
        productosStock: stockCount || 0,
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
            {user?.sucursal && <p className="text-sm text-gray-500">Sucursal: {user.sucursal.nombre}</p>}
          </div>

          {/* Estado del turno */}
          <Card className="mb-8">
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
                    <Badge variant="default" className="mb-2">
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
                    <Button>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Ir al POS
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant="secondary" className="mb-2">
                      Sin Turno Activo
                    </Badge>
                    <p className="text-sm text-gray-600">Debes iniciar un turno para usar el POS</p>
                  </div>
                  <Link href="/pos">
                    <Button>
                      <Clock className="h-4 w-4 mr-2" />
                      Iniciar Turno
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats del día */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                <CardTitle className="text-sm font-medium">Productos en Stock</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.productosStock}</div>
                <p className="text-xs text-muted-foreground">En tu sucursal</p>
              </CardContent>
            </Card>
          </div>

          {/* Acciones rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Punto de Venta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">Accede al sistema POS para realizar ventas en la sucursal</p>
                <Link href="/pos">
                  <Button className="w-full">
                    <Store className="h-4 w-4 mr-2" />
                    Abrir POS
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compras Online</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">También puedes navegar y comprar productos como cliente</p>
                <Link href="/productos">
                  <Button variant="outline" className="w-full bg-transparent">
                    <Package className="h-4 w-4 mr-2" />
                    Ver Productos
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
