"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShoppingCart, User, LogOut, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCurrentUser, signOut } from "@/lib/auth"
import type { User as UserType } from "@/lib/types"

export default function Navbar() {
  const [user, setUser] = useState<UserType | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    const userData = await getCurrentUser()
    setUser(userData)
  }

  const handleSignOut = async () => {
    await signOut()
    setUser(null)
    router.push("/")
    router.refresh()
  }

  const redirectByRole = (userRole: string) => {
    switch (userRole) {
      case "admin":
        return "/admin/dashboard"
      case "trabajador":
        return "/trabajador/dashboard"
      case "cliente":
        return "/cliente/dashboard"
      default:
        return "/"
    }
  }

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <span className="text-2xl font-bold text-blue-600">EcommercePOS</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/productos" className="text-gray-700 hover:text-blue-600 transition-colors">
              Productos
            </Link>

            {user?.rol === "admin" && (
              <Link href="/admin" className="text-gray-700 hover:text-blue-600 transition-colors">
                Admin
              </Link>
            )}

            {(user?.rol === "trabajador" || user?.rol === "admin") && (
              <Link href="/pos" className="text-gray-700 hover:text-blue-600 transition-colors">
                POS
              </Link>
            )}

            {user ? (
              <div className="flex items-center space-x-4">
                <Link href="/pedidos" className="text-gray-700 hover:text-blue-600 transition-colors">
                  <ShoppingCart className="h-6 w-6" />
                </Link>
                <span className="text-sm text-gray-600">Hola, {user.nombre}</span>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Salir
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/auth/login">
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Registrarse</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              <Link
                href="/productos"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Productos
              </Link>

              {user?.rol === "admin" && (
                <Link
                  href="/admin"
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin
                </Link>
              )}

              {(user?.rol === "trabajador" || user?.rol === "admin") && (
                <Link
                  href="/pos"
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  POS
                </Link>
              )}

              {user ? (
                <div className="px-3 py-2">
                  <p className="text-sm text-gray-600 mb-2">Hola, {user.nombre}</p>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Salir
                  </Button>
                </div>
              ) : (
                <div className="px-3 py-2 space-y-2">
                  <Link href="/auth/login" className="block" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      <User className="h-4 w-4 mr-2" />
                      Iniciar Sesión
                    </Button>
                  </Link>
                  <Link href="/auth/register" className="block" onClick={() => setIsMenuOpen(false)}>
                    <Button size="sm" className="w-full">
                      Registrarse
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
