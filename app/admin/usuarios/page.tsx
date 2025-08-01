"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { User, Sucursal } from "@/lib/types"
import AuthGuard from "@/components/auth-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Edit, Trash2, Search, ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    rol: "cliente" as "admin" | "cliente" | "trabajador",
    sucursal_id: "",
  })
  const [error, setError] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Cargar usuarios
      const { data: usuariosData, error: usuariosError } = await supabase
        .from("users")
        .select(`
          *,
          sucursal:sucursales(nombre)
        `)
        .order("created_at", { ascending: false })

      if (usuariosError) throw usuariosError

      // Cargar sucursales
      const { data: sucursalesData, error: sucursalesError } = await supabase
        .from("sucursales")
        .select("*")
        .order("nombre")

      if (sucursalesError) throw sucursalesError

      setUsuarios(usuariosData || [])
      setSucursales(sucursalesData || [])
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsuarios = usuarios.filter((usuario) => {
    const matchesSearch =
      usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = selectedRole === "all" || usuario.rol === selectedRole

    return matchesSearch && matchesRole
  })

  const handleEdit = (usuario: User) => {
    setEditingUser(usuario)
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      sucursal_id: usuario.sucursal_id?.toString() || "",
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      setError("")

      const updateData = {
        nombre: formData.nombre,
        rol: formData.rol,
        sucursal_id: formData.sucursal_id ? Number.parseInt(formData.sucursal_id) : null,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("users").update(updateData).eq("id", editingUser!.id)

      if (error) throw error

      await loadData()
      setIsDialogOpen(false)
      setEditingUser(null)
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleDelete = async (userId: number) => {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return

    try {
      const { error } = await supabase.from("users").delete().eq("id", userId)

      if (error) throw error

      await loadData()
    } catch (error) {
      console.error("Error deleting user:", error)
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
                  <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
                  <p className="text-gray-600">Administra todos los usuarios del sistema</p>
                </div>
              </div>
              <Link href="/admin/crear-usuario">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Usuario
                </Button>
              </Link>
            </div>

            {/* Filtros */}
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar usuarios..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filtrar por rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los roles</SelectItem>
                    <SelectItem value="admin">Administradores</SelectItem>
                    <SelectItem value="trabajador">Trabajadores</SelectItem>
                    <SelectItem value="cliente">Clientes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-gray-600">
                Mostrando {filteredUsuarios.length} de {usuarios.length} usuarios
              </p>
            </div>
          </div>

          {/* Lista de usuarios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Usuarios ({filteredUsuarios.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUsuarios.map((usuario) => (
                  <div key={usuario.id} className="flex items-center justify-between border-b pb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-medium">{usuario.nombre}</h3>
                          <p className="text-sm text-gray-600">{usuario.email}</p>
                          {usuario.sucursal && (
                            <p className="text-xs text-gray-500">Sucursal: {usuario.sucursal.nombre}</p>
                          )}
                        </div>
                        <Badge
                          variant={
                            usuario.rol === "admin" ? "default" : usuario.rol === "trabajador" ? "secondary" : "outline"
                          }
                        >
                          {usuario.rol}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(usuario)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(usuario.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {filteredUsuarios.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No se encontraron usuarios</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dialog para editar usuario */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Usuario</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div>
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email (no editable)</Label>
                  <Input id="email" value={formData.email} disabled className="bg-gray-100" />
                </div>

                <div>
                  <Label htmlFor="rol">Rol</Label>
                  <Select value={formData.rol} onValueChange={(value: any) => setFormData({ ...formData, rol: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cliente">Cliente</SelectItem>
                      <SelectItem value="trabajador">Trabajador</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.rol === "trabajador" && (
                  <div>
                    <Label htmlFor="sucursal">Sucursal</Label>
                    <Select
                      value={formData.sucursal_id}
                      onValueChange={(value) => setFormData({ ...formData, sucursal_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una sucursal" />
                      </SelectTrigger>
                      <SelectContent>
                        {sucursales.map((sucursal) => (
                          <SelectItem key={sucursal.id} value={sucursal.id.toString()}>
                            {sucursal.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave}>Guardar Cambios</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AuthGuard>
  )
}
