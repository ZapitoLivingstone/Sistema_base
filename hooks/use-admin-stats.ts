"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface AdminStats {
  totalUsers: number
  totalProducts: number
  totalSales: number
  totalRevenue: number
  lowStockProducts: number
  activeTurns: number
  recentUsers: any[]
  recentSales: any[]
  lowStockItems: any[]
}

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    lowStockProducts: 0,
    activeTurns: 0,
    recentUsers: [],
    recentSales: [],
    lowStockItems: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // Ejecutar todas las consultas en paralelo
      const [
        { count: usersCount },
        { count: productsCount },
        { count: salesCount },
        { data: revenueData },
        { data: recentUsers },
        { data: recentSales },
        { data: lowStockData },
        { count: activeTurns },
      ] = await Promise.all([
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase.from("productos").select("*", { count: "exact", head: true }),
        supabase.from("ventas").select("*", { count: "exact", head: true }).eq("anulada", false),
        supabase.from("ventas").select("monto_total").eq("anulada", false),
        supabase.from("users").select("*").order("created_at", { ascending: false }).limit(5),
        supabase
          .from("ventas")
          .select("*, trabajador:users!ventas_trabajador_id_fkey(nombre), sucursal:sucursales(nombre)")
          .eq("anulada", false)
          .order("fecha", { ascending: false })
          .limit(5),
        supabase
          .from("stock_sucursal")
          .select("*, producto:productos(nombre), sucursal:sucursales(nombre)")
          .lte("stock", 5)
          .order("stock"),
        supabase.from("turnos").select("*", { count: "exact", head: true }).is("fecha_fin", null),
      ])

      const totalRevenue = revenueData?.reduce((sum, venta) => sum + venta.monto_total, 0) || 0

      setStats({
        totalUsers: usersCount || 0,
        totalProducts: productsCount || 0,
        totalSales: salesCount || 0,
        totalRevenue,
        lowStockProducts: lowStockData?.length || 0,
        activeTurns: activeTurns || 0,
        recentUsers: recentUsers || [],
        recentSales: recentSales || [],
        lowStockItems: lowStockData || [],
      })
    } catch (error) {
      console.error("Error loading admin stats:", error)
    } finally {
      setLoading(false)
    }
  }

  return { stats, loading, refreshStats: loadStats }
}
