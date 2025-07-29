"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Producto, Categoria } from "@/lib/types"
import ProductCard from "@/components/product-card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Filter } from "lucide-react"

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showOnlyFeatured, setShowOnlyFeatured] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Cargar productos
      const { data: productosData, error: productosError } = await supabase
        .from("productos")
        .select(`
          *,
          categoria:categorias(nombre),
          medios:medios_producto(*)
        `)
        .order("created_at", { ascending: false })

      if (productosError) throw productosError

      // Cargar categorías
      const { data: categoriasData, error: categoriasError } = await supabase
        .from("categorias")
        .select("*")
        .order("nombre")

      if (categoriasError) throw categoriasError

      setProductos(productosData || [])
      setCategorias(categoriasData || [])
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProductos = productos.filter((producto) => {
    const matchesSearch =
      producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === "all" || producto.categoria_id.toString() === selectedCategory

    const matchesFeatured = !showOnlyFeatured || producto.destacado

    return matchesSearch && matchesCategory && matchesFeatured
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Nuestros Productos</h1>

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

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id.toString()}>
                      {categoria.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Badge
                variant={showOnlyFeatured ? "default" : "secondary"}
                className="cursor-pointer px-4 py-2"
                onClick={() => setShowOnlyFeatured(!showOnlyFeatured)}
              >
                Solo Destacados
              </Badge>
            </div>
          </div>

          {/* Resultados */}
          <div className="mb-4">
            <p className="text-gray-600">
              Mostrando {filteredProductos.length} de {productos.length} productos
            </p>
          </div>
        </div>

        {/* Grid de productos */}
        {filteredProductos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProductos.map((producto) => (
              <ProductCard key={producto.id} producto={producto} showAddToCart={false} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No se encontraron productos</p>
            <p className="text-gray-400">Intenta cambiar los filtros de búsqueda</p>
          </div>
        )}
      </div>
    </div>
  )
}
