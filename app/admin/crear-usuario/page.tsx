"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { signUp, checkEmailExists } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import type { Sucursal } from "@/lib/types"
import AuthGuard from "@/components/auth-guard"
import { Eye, EyeOff, UserPlus, CheckCircle, ArrowLeft } from "lucide-react"

export default function CrearUsuarioPage() {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
    rol: "cliente" as "admin" | "cliente" | "trabajador",
    sucursal_id: "",
  })
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [emailError, setEmailError] = useState("")
  const router = useRouter()

  useEffect(() => {
    loadSucursales()
  }, [])

  const loadSucursales = async () => {
    const { data, error } = await supabase.from("sucursales").select("*").order("nombre")

    if (error) {
      console.error("Error loading sucursales:", error)
      return
    }

    setSucursales(data || [])
  }

  const validateForm = () => {
    if (!formData.nombre.trim()) {
      setError("El nombre es requerido")
      return false
    }

    if (!formData.email.trim()) {
      setError("El email es requerido")
      return false
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("El email no tiene un formato válido")
      return false
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      return false
    }

    if (formData.rol === "trabajador" && !formData.sucursal_id) {
      setError("Los trabajadores deben tener una sucursal asignada")
      return false
    }

    return true
  }

  const checkEmail = async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("")
      return
    }

    const { exists } = await checkEmailExists(email)
    if (exists) {
      setEmailError("Este email ya está registrado")
    } else {
      setEmailError("")
    }
  }

  const handleEmailChange = (email: string) => {
    setFormData({ ...formData, email })
    // Debounce para no hacer muchas consultas
    setTimeout(() => checkEmail(email), 500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || emailError) {
      return
    }

    setLoading(true)
    setError("")

    try {
      const userData = {
        nombre: formData.nombre.trim(),
        rol: formData.rol,
        sucursal_id: formData.sucursal_id ? Number.parseInt(formData.sucursal_id) : null,
      }

      const { error } = await signUp(formData.email, formData.password, userData)

      if (error) {
        setError(error.message || "Error durante la creación del usuario")
      } else {
        setSuccess(true)
        // Redirigir después de 3 segundos
        setTimeout(() => {
          router.push("/admin/usuarios")
        }, 3000)
      }
    } catch (err) {
      setError("Error inesperado. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthGuard allowedRoles={["admin"]}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <Card className="w-full max-w-md">
            <CardContent className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Usuario Creado!</h2>
              <p className="text-gray-600 mb-4">El usuario ha sido creado correctamente con rol de {formData.rol}.</p>
              <p className="text-sm text-gray-500">Serás redirigido a la lista de usuarios...</p>
              <Link href="/admin/usuarios" className="mt-4 inline-block">
                <Button>Ver Usuarios</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Link href="/admin/usuarios">
                <Button variant="outline" size="sm" className="mr-4 bg-transparent">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Crear Usuario</h1>
                <p className="text-gray-600">Crear un nuevo usuario del sistema</p>
              </div>
            </div>
          </div>

          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Nuevo Usuario</CardTitle>
              <CardDescription>Completa los datos para crear el usuario</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre Completo</Label>
                  <Input
                    id="nombre"
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                    placeholder="Nombre completo del usuario"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    required
                    placeholder="usuario@email.com"
                    className={emailError ? "border-red-500" : ""}
                  />
                  {emailError && <p className="text-sm text-red-500">{emailError}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rol">Tipo de Usuario</Label>
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
                  <div className="space-y-2">
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

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      placeholder="••••••••"
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">Mínimo 6 caracteres</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                      placeholder="••••••••"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" className="flex-1" disabled={loading || !!emailError}>
                    {loading ? (
                      "Creando usuario..."
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Crear Usuario
                      </>
                    )}
                  </Button>
                  <Link href="/admin/usuarios">
                    <Button type="button" variant="outline" className="bg-transparent">
                      Cancelar
                    </Button>
                  </Link>
                </div>
              </form>

              {/* Información sobre roles */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Tipos de usuario:</h4>
                <div className="text-xs text-blue-700 space-y-1">
                  <p>
                    <strong>Cliente:</strong> Puede realizar compras online
                  </p>
                  <p>
                    <strong>Trabajador:</strong> Acceso al POS + compras (requiere sucursal)
                  </p>
                  <p>
                    <strong>Admin:</strong> Control total del sistema (excepto POS)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}
