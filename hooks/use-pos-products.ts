"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"

interface ProductoConStock {
  id: number
  nombre: string
  descripcion?: string
  precio: number
  categoria_id?: number
  destacado: boolean
  created_at: string
  updated_at?: string
  categoria?: {
    nombre: string
  }
  medios?: Array<{
    id: number
    url: string
    tipo: string
  }>
  stock_disponible: number
}

export function usePOSProducts(sucursalId?: number) {
  const [productos, setProductos] = useState<ProductoConStock[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  const loadProductos = async () => {
    if (!sucursalId) {
      setProductos([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)

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

      const productosConStock: ProductoConStock[] = (data || []).map((producto) => ({
        ...producto,
        stock_disponible: producto.stock?.[0]?.stock || 0,
      }))

      setProductos(productosConStock)
    } catch (error) {
      console.error("Error loading products:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProductos()
  }, [sucursalId])

  const productosFiltrados = useMemo(() => {
    if (!searchTerm) return productos

    return productos.filter(
      (producto) =>
        producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        producto.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        producto.categoria?.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [productos, searchTerm])

  return {
    productos: productosFiltrados,
    searchTerm,
    setSearchTerm,
    loading,
    refreshProducts: loadProductos,
    totalProducts: productosFiltrados.length,
  }
}
