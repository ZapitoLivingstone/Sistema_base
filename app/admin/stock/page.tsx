"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Producto, Sucursal, StockSucursal } from "@/lib/types"
import AuthGuard from "@/components/auth-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Package, Edit, Search, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface ProductoConStock extends Producto {
  stock_info: (StockSucursal & { sucursal: Sucursal })[]
}

export default function AdminStock() {
  const [productos, setProductos] = useState<ProductoConStock[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSucursal, setSelectedSucursal] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStock, setEditingStock] = useState<{
    producto_id: number
    sucursal_id: number
    stock_actual: number
    producto_nombre: string
    sucursal_nombre: string
  } | null>(null)
  const [nuevoStock, setNuevoStock] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Cargar productos con stock
      const { data: productosData, error: productosError } = await supabase
        .from("productos")
        .select(`
          *,
          categoria:categorias(nombre),
          stock_info:stock_sucursal(
            *,
            sucursal:sucursales(*)
          )
        `)
        .order("nombre")

      if (productosError) throw productosError

      // Cargar sucursales
      const { data: sucursalesData, error: sucursalesError } = await supabase
        .from("sucursales")
        .select("*")
        .order("nombre")

      if (sucursalesError) throw sucursalesError

      setProductos(productosData || [])
      setSucursales(sucursalesData || [])
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProductos = productos.filter((producto) => {
    const matchesSearch = producto.nombre.toLowerCase().includes(searchTerm.toLowerCase())

    if (selectedSucursal === "all") return matchesSearch

    const hasStockInSucursal = producto.stock_info.some((stock) => stock.sucursal_id.toString() === selectedSucursal)

    return matchesSearch && hasStockInSucursal
  })

  const handleEditStock = (
    producto_id: number,
    sucursal_id: number,
    stock_actual: number,
    producto_nombre: string,
    sucursal_nombre: string,
  ) => {
    setEditingStock({
      producto_id,
      sucursal_id,
      stock_actual,
      producto_nombre,
      sucursal_nombre,
    })
    setNuevoStock(stock_actual.toString())
    setIsDialogOpen(true)
  }

  const handleSaveStock = async () => {
    if (!editingStock) return

    try {
      setError("")

      const stockValue = Number.parseInt(nuevoStock)
      if (isNaN(stockValue) || stockValue < 0) {
        setError("El stock debe ser un número mayor o igual a 0")
        return
      }

      // Usar la función RPC para actualizar stock
      const { error } = await supabase.rpc("actualizar_stock", {
        p_producto_id: editingStock.producto_id,
        p_sucursal_id: editingStock.sucursal_id,
        p_cantidad: stockValue - editingStock.stock_actual,
      })

      if (error) throw error

      await loadData()
      setIsDialogOpen(false)
      setEditingStock(null)
    } catch (error: any) {
      setError(error.message)
    }
  }

  const getStockBySucursal = (producto: ProductoConStock, sucursalId: number) => {
    const stock = producto.stock_info.find((s) => s.sucursal_id === sucursalId)
    return stock ? stock.stock : 0
  }

  const getTotalStock = (producto: ProductoConStock) => {
    return producto.stock_info.reduce((total, stock) => total + stock.stock, 0)
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
            <div className="flex items-center mb-4">
              <Link href="/admin/dashboard">
                <Button variant="outline" size="sm" className="mr-4 bg-transparent">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Stock</h1>
                <p className="text-gray-600">Administra el inventario por sucursal</p>
              </div>
            </div>

            {/* Filtros */}
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={selectedSucursal} onValueChange={setSelectedSucursal}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filtrar por sucursal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las sucursales</SelectItem>
                    {sucursales.map((sucursal) => (
                      <SelectItem key={sucursal.id} value={sucursal.id.toString()}>
                        {sucursal.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Tabla de stock */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Stock por Producto ({filteredProductos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Producto</th>
                      <th className="text-left p-2">Categoría</th>
                      <th className="text-left p-2">Precio</th>
                      {sucursales.map((sucursal) => (
                        <th key={sucursal.id} className="text-center p-2">
                          {sucursal.nombre}
                        </th>
                      ))}
                      <th className="text-center p-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProductos.map((producto) => (
                      <tr key={producto.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div>
                            <p className="font-medium">{producto.nombre}</p>
                            {producto.destacado && <Badge className="mt-1 bg-yellow-500">Destacado</Badge>}
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge variant="secondary">{producto.categoria?.nombre}</Badge>
                        </td>
                        <td className="p-2 font-bold text-blue-600">${producto.precio.toFixed(2)}</td>
                        {sucursales.map((sucursal) => {
                          const stock = getStockBySucursal(producto, sucursal.id)
                          return (
                            <td key={sucursal.id} className="p-2 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <Badge
                                  variant={stock > 0 ? "secondary" : "destructive"}
                                  className="cursor-pointer"
                                  onClick={() =>
                                    handleEditStock(producto.id, sucursal.id, stock, producto.nombre, sucursal.nombre)
                                  }
                                >
                                  {stock}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleEditStock(producto.id, sucursal.id, stock, producto.nombre, sucursal.nombre)
                                  }
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          )
                        })}
                        <td className="p-2 text-center">
                          <Badge variant="default">{getTotalStock(producto)}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredProductos.length === 0 && (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No se encontraron productos</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dialog para editar stock */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Stock</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {editingStock && (
                  <div className="space-y-4">
                    <div>
                      <p>
                        <strong>Producto:</strong> {editingStock.producto_nombre}
                      </p>
                      <p>
                        <strong>Sucursal:</strong> {editingStock.sucursal_nombre}
                      </p>
                      <p>
                        <strong>Stock actual:</strong> {editingStock.stock_actual}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="nuevoStock">Nuevo Stock</Label>
                      <Input
                        id="nuevoStock"
                        type="number"
                        min="0"
                        value={nuevoStock}
                        onChange={(e) => setNuevoStock(e.target.value)}
                        placeholder="0"
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveStock}>Guardar</Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AuthGuard>
  )
}
