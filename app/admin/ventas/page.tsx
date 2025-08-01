"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { formatPrice } from "@/lib/utils"
import type { Venta, DetalleVentaPedido, User, Sucursal } from "@/lib/types"
import AuthGuard from "@/components/auth-guard"
import { PageHeader } from "@/components/common/page-header"
import { SearchFilterBar } from "@/components/common/search-filter-bar"
import { StatsCard } from "@/components/common/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { BarChart3, Eye, DollarSign, ShoppingCart, TrendingUp, Calendar } from "lucide-react"

interface VentaExtendida extends Venta {
  trabajador?: User
  sucursal?: Sucursal
  detalles?: (DetalleVentaPedido & { producto?: any })[]
}

export default function VentasPage() {
  const [ventas, setVentas] = useState<VentaExtendida[]>([])
  const [filteredVentas, setFilteredVentas] = useState<VentaExtendida[]>([])
  const [selectedVenta, setSelectedVenta] = useState<VentaExtendida | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [metodoPagoFilter, setMetodoPagoFilter] = useState("all")
  const [tipoVentaFilter, setTipoVentaFilter] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Stats
  const [stats, setStats] = useState({
    totalVentas: 0,
    montoTotal: 0,
    promedioVenta: 0,
    ventasHoy: 0,
  })

  useEffect(() => {
    loadVentas()
  }, [])

  useEffect(() => {
    filterVentas()
    calculateStats()
  }, [ventas, searchTerm, metodoPagoFilter, tipoVentaFilter])

  const loadVentas = async () => {
    try {
      const { data, error } = await supabase
        .from("ventas")
        .select(`
          *,
          trabajador:users!ventas_trabajador_id_fkey(nombre, email),
          sucursal:sucursales(nombre, direccion)
        `)
        .eq("anulada", false)
        .order("fecha", { ascending: false })

      if (error) throw error

      setVentas(data || [])
    } catch (error) {
      console.error("Error loading ventas:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterVentas = () => {
    let filtered = ventas

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (venta) =>
          venta.id.toString().includes(searchTerm) ||
          venta.trabajador?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          venta.sucursal?.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filtro por método de pago
    if (metodoPagoFilter !== "all") {
      filtered = filtered.filter((venta) => venta.metodo_pago === metodoPagoFilter)
    }

    // Filtro por tipo de venta
    if (tipoVentaFilter !== "all") {
      filtered = filtered.filter((venta) => venta.tipo_venta === tipoVentaFilter)
    }

    setFilteredVentas(filtered)
  }

  const calculateStats = () => {
    const totalVentas = filteredVentas.length
    const montoTotal = filteredVentas.reduce((sum, venta) => sum + venta.monto_total, 0)
    const promedioVenta = totalVentas > 0 ? montoTotal / totalVentas : 0

    // Ventas de hoy
    const hoy = new Date().toISOString().split("T")[0]
    const ventasHoy = filteredVentas.filter((venta) => venta.fecha.startsWith(hoy)).length

    setStats({
      totalVentas,
      montoTotal,
      promedioVenta,
      ventasHoy,
    })
  }

  const loadVentaDetalles = async (venta: VentaExtendida) => {
    try {
      const { data, error } = await supabase
        .from("detalles_venta_pedido")
        .select(`
          *,
          producto:productos(nombre, precio)
        `)
        .eq("venta_id", venta.id)

      if (error) throw error

      setSelectedVenta({ ...venta, detalles: data || [] })
      setIsDialogOpen(true)
    } catch (error) {
      console.error("Error loading venta details:", error)
    }
  }

  const getMetodoPagoBadgeVariant = (metodo: string) => {
    switch (metodo) {
      case "efectivo":
        return "default"
      case "tarjeta":
        return "secondary"
      case "webpay":
        return "outline"
      default:
        return "outline"
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
            title="Gestión de Ventas"
            description="Historial completo de todas las ventas"
            backUrl="/admin/dashboard"
          />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Ventas"
              value={stats.totalVentas.toString()}
              description="Ventas filtradas"
              icon={ShoppingCart}
            />
            <StatsCard
              title="Monto Total"
              value={formatPrice(stats.montoTotal)}
              description="Ingresos totales"
              icon={DollarSign}
            />
            <StatsCard
              title="Promedio por Venta"
              value={formatPrice(stats.promedioVenta)}
              description="Ticket promedio"
              icon={TrendingUp}
            />
            <StatsCard
              title="Ventas Hoy"
              value={stats.ventasHoy.toString()}
              description="Ventas del día"
              icon={Calendar}
            />
          </div>

          {/* Filtros */}
          <SearchFilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Buscar por ID, trabajador o sucursal..."
            filters={[
              {
                label: "Método de Pago",
                value: metodoPagoFilter,
                onChange: setMetodoPagoFilter,
                options: [
                  { value: "all", label: "Todos los métodos" },
                  { value: "efectivo", label: "Efectivo" },
                  { value: "tarjeta", label: "Tarjeta" },
                  { value: "transferencia", label: "Transferencia" },
                  { value: "webpay", label: "WebPay" },
                  { value: "otro", label: "Otro" },
                ],
              },
              {
                label: "Tipo de Venta",
                value: tipoVentaFilter,
                onChange: setTipoVentaFilter,
                options: [
                  { value: "all", label: "Todos los tipos" },
                  { value: "fisica", label: "Venta Física" },
                  { value: "online", label: "Venta Online" },
                ],
              },
            ]}
          />

          {/* Lista de Ventas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Historial de Ventas ({filteredVentas.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredVentas.length === 0 ? (
                <EmptyState
                  icon={BarChart3}
                  title="No se encontraron ventas"
                  description="No hay ventas que coincidan con los filtros aplicados"
                />
              ) : (
                <div className="space-y-4">
                  {filteredVentas.map((venta) => (
                    <div key={venta.id} className="flex items-center justify-between border-b pb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="font-medium">Venta #{venta.id}</h3>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>Trabajador: {venta.trabajador?.nombre || "N/A"}</p>
                              <p>Sucursal: {venta.sucursal?.nombre || "N/A"}</p>
                              <p>Fecha: {new Date(venta.fecha).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2">
                            <Badge variant={getMetodoPagoBadgeVariant(venta.metodo_pago)}>{venta.metodo_pago}</Badge>
                            <Badge variant={venta.tipo_venta === "fisica" ? "default" : "secondary"}>
                              {venta.tipo_venta}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">{formatPrice(venta.monto_total)}</p>
                        <Button size="sm" variant="outline" onClick={() => loadVentaDetalles(venta)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dialog de Detalles de Venta */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Detalles de Venta #{selectedVenta?.id}</DialogTitle>
              </DialogHeader>
              {selectedVenta && (
                <div className="space-y-6">
                  {/* Información General */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Información General</h4>
                      <div className="mt-2 text-sm text-gray-600 space-y-1">
                        <p>ID: #{selectedVenta.id}</p>
                        <p>Fecha: {new Date(selectedVenta.fecha).toLocaleString()}</p>
                        <p>Trabajador: {selectedVenta.trabajador?.nombre || "N/A"}</p>
                        <p>Sucursal: {selectedVenta.sucursal?.nombre || "N/A"}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Detalles de Pago</h4>
                      <div className="mt-2 text-sm text-gray-600 space-y-1">
                        <p>Método: {selectedVenta.metodo_pago}</p>
                        <p>Tipo: {selectedVenta.tipo_venta}</p>
                        <p className="text-lg font-bold text-green-600">
                          Total: {formatPrice(selectedVenta.monto_total)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Productos Vendidos */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Productos Vendidos</h4>
                    <div className="space-y-2">
                      {selectedVenta.detalles?.map((detalle, index) => (
                        <div key={index} className="flex justify-between items-center border-b pb-2">
                          <div>
                            <p className="font-medium">{detalle.producto?.nombre || "Producto eliminado"}</p>
                            <p className="text-sm text-gray-600">
                              {formatPrice(detalle.producto?.precio || 0)} x {detalle.cantidad}
                            </p>
                          </div>
                          <p className="font-bold">{formatPrice((detalle.producto?.precio || 0) * detalle.cantidad)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AuthGuard>
  )
}
