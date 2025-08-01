"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import type { User, Venta } from "@/lib/types"
import AuthGuard from "@/components/auth-guard"
import { PageHeader } from "@/components/common/page-header"
import { StatsCard } from "@/components/common/stats-card"
import { QuickActionCard } from "@/components/common/quick-action-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Users, Package, ShoppingCart, DollarSign, TrendingUp, Store, BarChart3, Heart } from "lucide-react"

export default function AdminDashboard() {
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
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <PageHeader
            title="Panel de Administración"
            description="Gestiona todo el sistema desde aquí"
            showBackButton={false}
          />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Usuarios"
              value={stats.totalUsers.toString()}
              description="Usuarios registrados"
              icon={Users}
              trend={{ value: 12, isPositive: true }}
            />
            <StatsCard
              title="Total Productos"
              value={stats.totalProducts.toString()}
              description="Productos en catálogo"
              icon={Package}
              trend={{ value: 8, isPositive: true }}
            />
            <StatsCard
              title="Total Ventas"
              value={stats.totalSales.toString()}
              description="Ventas realizadas"
              icon={ShoppingCart}
              trend={{ value: 15, isPositive: true }}
            />
            <StatsCard
              title="Ingresos Totales"
              value={`$${stats.totalRevenue.toLocaleString()}`}
              description="Revenue total"
              icon={DollarSign}
              trend={{ value: 23, isPositive: true }}
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <QuickActionCard
              title="Gestionar Usuarios"
              description="Ver, crear y editar usuarios"
              icon={Users}
              href="/admin/usuarios"
              color="blue"
            />
            <QuickActionCard
              title="Gestionar Productos"
              description="Administrar catálogo de productos"
              icon={Package}
              href="/admin/productos"
              color="green"
            />
            <QuickActionCard
              title="Ver Ventas"
              description="Historial y reportes de ventas"
              icon={BarChart3}
              href="/admin/ventas"
              color="purple"
            />
            <QuickActionCard
              title="Gestionar Sucursales"
              description="Administrar sucursales y stock"
              icon={Store}
              href="/admin/sucursales"
              color="orange"
            />
          </div>

          {/* Acciones Adicionales para Admin */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <QuickActionCard
              title="Mi Lista de Deseos"
              description="Ver productos guardados"
              icon={Heart}
              href="/cliente/wishlist"
              color="pink"
            />
            <QuickActionCard
              title="Mi Carrito"
              description="Ver productos en carrito"
              icon={ShoppingCart}
              href="/cliente/carrito"
              color="indigo"
            />
            <QuickActionCard
              title="Gestionar Stock"
              description="Control de inventario"
              icon={Package}
              href="/admin/stock"
              color="teal"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Usuarios Recientes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Usuarios Recientes
                  </span>
                  <Link href="/admin/usuarios" className="text-sm text-blue-600 hover:underline">
                    Ver todos
                  </Link>
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
                  {stats.recentUsers.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No hay usuarios recientes</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Ventas Recientes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Ventas Recientes
                  </span>
                  <Link href="/admin/ventas" className="text-sm text-blue-600 hover:underline">
                    Ver todas
                  </Link>
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
                  {stats.recentSales.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No hay ventas recientes</p>
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
