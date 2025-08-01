"use client"

import type React from "react"

import { useState } from "react"
import AuthGuard from "@/components/auth-guard"
import { PageHeader } from "@/components/common/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { useSucursales } from "@/hooks/use-sucursales"
import { Building2, Plus, Edit, Trash2, MapPin } from "lucide-react"

export default function SucursalesPage() {
  const { sucursales, loading, createSucursal, updateSucursal, deleteSucursal } = useSucursales()
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingSucursal, setEditingSucursal] = useState<any>(null)
  const [formData, setFormData] = useState({ nombre: "", direccion: "" })
  const [submitting, setSubmitting] = useState(false)

  const filteredSucursales = sucursales.filter(
    (sucursal) =>
      sucursal.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sucursal.direccion.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre.trim() || !formData.direccion.trim()) return

    setSubmitting(true)
    try {
      let result
      if (editingSucursal) {
        result = await updateSucursal(editingSucursal.id, formData)
      } else {
        result = await createSucursal(formData)
      }

      if (result.success) {
        setFormData({ nombre: "", direccion: "" })
        setIsCreateModalOpen(false)
        setEditingSucursal(null)
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (sucursal: any) => {
    setEditingSucursal(sucursal)
    setFormData({ nombre: sucursal.nombre, direccion: sucursal.direccion })
    setIsCreateModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    await deleteSucursal(id)
  }

  const resetForm = () => {
    setFormData({ nombre: "", direccion: "" })
    setEditingSucursal(null)
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
          <PageHeader
            title="Gestión de Sucursales"
            description="Administra las sucursales de tu negocio"
            backUrl="/admin/dashboard"
          />

          {/* Barra de búsqueda y botón crear */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Buscar sucursales..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
            <Dialog
              open={isCreateModalOpen}
              onOpenChange={(open) => {
                setIsCreateModalOpen(open)
                if (!open) resetForm()
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Sucursal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingSucursal ? "Editar Sucursal" : "Nueva Sucursal"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Nombre de la sucursal"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="direccion">Dirección</Label>
                    <Input
                      id="direccion"
                      value={formData.direccion}
                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                      placeholder="Dirección completa"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreateModalOpen(false)
                        resetForm()
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Guardando...
                        </>
                      ) : editingSucursal ? (
                        "Actualizar"
                      ) : (
                        "Crear"
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Lista de sucursales */}
          {filteredSucursales.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No hay sucursales"
              description={searchTerm ? "No se encontraron sucursales con ese término" : "Crea tu primera sucursal"}
              action={
                !searchTerm
                  ? {
                      label: "Nueva Sucursal",
                      onClick: () => setIsCreateModalOpen(true),
                    }
                  : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSucursales.map((sucursal) => (
                <Card key={sucursal.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                        {sucursal.nombre}
                      </div>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(sucursal)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar sucursal?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente la sucursal "
                                {sucursal.nombre}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(sucursal.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-600 text-sm">{sucursal.direccion}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
