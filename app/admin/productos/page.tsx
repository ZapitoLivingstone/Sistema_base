"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Producto, Categoria } from "@/lib/types"
import AuthGuard from "@/components/auth-guard"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Package, Edit, Trash2, Search, ArrowLeft, Plus, Video, X } from "lucide-react"
import Link from "next/link"
import NextImage from "next/image"
import { uploadFile, deleteFile, validateFileType, validateFileSize } from "@/lib/storage"

export default function AdminProductos() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    categoria_id: "",
    destacado: false,
  })
  const [medios, setMedios] = useState<{ tipo: "foto" | "video"; url: string; file?: File; path?: string }[]>([])
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)

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

    return matchesSearch && matchesCategory
  })

  const handleEdit = (producto: Producto) => {
    setEditingProduct(producto)
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion || "",
      precio: producto.precio.toString(),
      categoria_id: producto.categoria_id.toString(),
      destacado: producto.destacado,
    })
    setMedios(
      producto.medios?.map((medio) => ({
        tipo: medio.tipo,
        url: medio.url,
        path: medio.path,
      })) || [],
    )
    setIsDialogOpen(true)
  }

  const handleNew = () => {
    setEditingProduct(null)
    setFormData({
      nombre: "",
      descripcion: "",
      precio: "",
      categoria_id: "",
      destacado: false,
    })
    setMedios([])
    setIsDialogOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    files.forEach((file) => {
      // Validar tipo de archivo
      if (!validateFileType(file)) {
        setError(`Tipo de archivo no permitido: ${file.name}`)
        return
      }

      // Validar tamaño de archivo
      if (!validateFileSize(file)) {
        setError(`Archivo muy grande: ${file.name} (máximo 50MB)`)
        return
      }

      const isVideo = file.type.startsWith("video/")
      const url = URL.createObjectURL(file)

      setMedios((prev) => [
        ...prev,
        {
          tipo: isVideo ? "video" : "foto",
          url,
          file,
        },
      ])
    })
  }

  const removeMedio = (index: number) => {
    setMedios((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    try {
      setError("")
      setUploading(true)

      if (!formData.nombre || !formData.precio || !formData.categoria_id) {
        setError("Nombre, precio y categoría son requeridos")
        return
      }

      // Subir archivos nuevos
      const mediosToSave = await Promise.all(
        medios.map(async (medio) => {
          if (medio.file) {
            const { url, path } = await uploadFile(medio.file)
            return { tipo: medio.tipo, url, path }
          }
          return { tipo: medio.tipo, url: medio.url, path: medio.path }
        }),
      )

      const productData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        precio: Number.parseFloat(formData.precio),
        categoria_id: Number.parseInt(formData.categoria_id),
        destacado: formData.destacado,
        updated_at: new Date().toISOString(),
      }

      let productId: number

      if (editingProduct) {
        // Eliminar archivos antiguos si se están reemplazando
        if (editingProduct.medios) {
          for (const medio of editingProduct.medios) {
            if (medio.path) {
              try {
                await deleteFile(medio.path)
              } catch (error) {
                console.warn("Error deleting old file:", error)
              }
            }
          }
        }

        const { error } = await supabase.from("productos").update(productData).eq("id", editingProduct.id)
        if (error) throw error

        await supabase.from("medios_producto").delete().eq("producto_id", editingProduct.id)
        productId = editingProduct.id
      } else {
        const { data, error } = await supabase.from("productos").insert([productData]).select().single()
        if (error) throw error
        productId = data.id
      }

      // Insertar medios
      if (mediosToSave.length > 0) {
        const mediosData = mediosToSave.map((medio) => ({
          producto_id: productId,
          tipo: medio.tipo,
          url: medio.url,
          path: medio.path,
        }))

        const { error: mediosError } = await supabase.from("medios_producto").insert(mediosData)
        if (mediosError) throw mediosError
      }

      await loadData()
      setIsDialogOpen(false)
      setEditingProduct(null)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (productId: number) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return

    try {
      // Eliminar medios primero
      await supabase.from("medios_producto").delete().eq("producto_id", productId)

      // Eliminar producto
      const { error } = await supabase.from("productos").delete().eq("id", productId)

      if (error) throw error

      await loadData()
    } catch (error) {
      console.error("Error deleting product:", error)
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Link href="/admin/dashboard">
                  <Button variant="outline" size="sm" className="mr-4 bg-transparent">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Gestión de Productos</h1>
                  <p className="text-gray-600">Administra el catálogo de productos</p>
                </div>
              </div>
              <Button onClick={handleNew}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Producto
              </Button>
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

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filtrar por categoría" />
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
              </div>
            </div>

            <div className="mb-4">
              <p className="text-gray-600">
                Mostrando {filteredProductos.length} de {productos.length} productos
              </p>
            </div>
          </div>

          {/* Lista de productos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProductos.map((producto) => (
              <Card key={producto.id} className="overflow-hidden">
                <div className="relative h-48">
                  {producto.medios && producto.medios.length > 0 ? (
                    <NextImage
                      src={producto.medios[0].url || "/placeholder.svg"}
                      alt={producto.nombre}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Package className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  {producto.destacado && <Badge className="absolute top-2 left-2 bg-yellow-500">Destacado</Badge>}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{producto.nombre}</h3>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{producto.descripcion}</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-bold text-blue-600">${producto.precio.toFixed(2)}</span>
                    <Badge variant="secondary">{producto.categoria?.nombre}</Badge>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(producto)} className="flex-1">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(producto.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredProductos.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No se encontraron productos</p>
              </div>
            )}
          </div>

          {/* Dialog para crear/editar producto */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Nombre del producto"
                    />
                  </div>

                  <div>
                    <Label htmlFor="precio">Precio *</Label>
                    <Input
                      id="precio"
                      type="number"
                      step="0.01"
                      value={formData.precio}
                      onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Descripción del producto"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="categoria">Categoría *</Label>
                    <Select
                      value={formData.categoria_id}
                      onValueChange={(value) => setFormData({ ...formData, categoria_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map((categoria) => (
                          <SelectItem key={categoria.id} value={categoria.id.toString()}>
                            {categoria.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="destacado"
                      checked={formData.destacado}
                      onCheckedChange={(checked) => setFormData({ ...formData, destacado: checked })}
                    />
                    <Label htmlFor="destacado">Producto destacado</Label>
                  </div>
                </div>

                {/* Medios */}
                <div>
                  <Label>Fotos y Videos</Label>
                  <div className="mt-2">
                    <Input type="file" multiple accept="image/*,video/*" onChange={handleFileChange} className="mb-4" />

                    {medios.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {medios.map((medio, index) => (
                          <div key={index} className="relative">
                            {medio.tipo === "foto" ? (
                              <div className="relative h-24 w-full">
                                <NextImage
                                  src={medio.url || "/placeholder.svg"}
                                  alt={`Medio ${index + 1}`}
                                  fill
                                  className="object-cover rounded"
                                />
                              </div>
                            ) : (
                              <div className="h-24 w-full bg-gray-200 rounded flex items-center justify-center">
                                <Video className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              className="absolute -top-2 -right-2 h-6 w-6 p-0"
                              onClick={() => removeMedio(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={uploading}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={uploading}>
                    {uploading ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AuthGuard>
  )
}
