"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { User, Venta } from "@/lib/types"
import AuthGuard from "@/components/auth-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Package, ShoppingCart, DollarSign, TrendingUp } from "lucide-react"

export default function AdminPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    recentUsers: [] as User[],
    recentSales: [] as Venta[],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // Total usuarios
      const { count: usersCount } = await supabase.from("users").select("*", { count: "exact", head: true })

      // Total productos
      const { count: productsCount } = await supabase.from("productos").select("*", { count: "exact", head: true })

      // Total ventas
      const { count: salesCount } = await supabase
        .from("ventas")
        .select("*", { count: "exact", head: true })
        .eq("anulada", false)

      // Revenue total
      const { data: revenueData } = await supabase.from("ventas").select("monto_total").eq("anulada", false)

      const totalRevenue = revenueData?.reduce((sum, venta) => sum + venta.monto_total, 0) || 0

      // Usuarios recientes
      const { data: recentUsers } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5)

      // Ventas recientes
      const { data: recentSales } = await supabase
        .from("ventas")
        .select("*")
        .eq("anulada", false)
        .order("fecha", { ascending: false })
        .limit(5)

      setStats({
        totalUsers: usersCount || 0,
        totalProducts: productsCount || 0,
        totalSales: salesCount || 0,
        totalRevenue,
        recentUsers: recentUsers || [],
        recentSales: recentSales || [],
      })
    } catch (error) {
      console.error("Error loading stats:", error)
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
    <AuthGuard allowedRoles={["admin"]}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
            <p className="text-gray-600">Resumen general del sistema</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">Usuarios registrados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
                <p className="text-xs text-muted-foreground">Productos en catálogo</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSales}</div>
                <p className="text-xs text-muted-foreground">Ventas realizadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Revenue total</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Usuarios Recientes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Usuarios Recientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{user.nombre}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            user.rol === "admin" ? "default" : user.rol === "trabajador" ? "secondary" : "outline"
                          }
                        >
                          {user.rol}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">{new Date(user.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Ventas Recientes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Ventas Recientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentSales.map((venta) => (
                    <div key={venta.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">Venta #{venta.id}</p>
                        <p className="text-sm text-gray-600 capitalize">{venta.metodo_pago}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">${venta.monto_total.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{new Date(venta.fecha).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
