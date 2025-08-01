"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { ShoppingCart, User, LogOut, Menu, X, Package, Store, BarChart3, Settings, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/hooks/use-cart"
import { useWishlist } from "@/hooks/use-wishlist"

// Configuración de navegación por rol
const getNavItems = (userRole?: string) => {
  const baseItems = [{ href: "/productos", label: "Productos", icon: Package }]

  switch (userRole) {
    case "admin":
      return [
        ...baseItems,
        { href: "/admin/dashboard", label: "Admin", icon: Settings },
        { href: "/pos", label: "POS", icon: Store },
      ]
    case "trabajador":
      return [
        ...baseItems,
        { href: "/trabajador/dashboard", label: "Dashboard", icon: BarChart3 },
        { href: "/pos", label: "POS", icon: Store },
      ]
    case "cliente":
      return [...baseItems, { href: "/cliente/dashboard", label: "Mi Cuenta", icon: User }]
    default:
      return baseItems
  }
}

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, signOut } = useAuth()
  const { getTotalItems } = useCart(user?.id)
  const { count: wishlistCount } = useWishlist(user?.id)
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
    router.refresh()
  }

  const isActive = (path: string) => pathname === path
  const navItems = getNavItems(user?.rol)

  return (
    <nav className="bg-white shadow-lg border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <span className="text-2xl font-bold text-blue-600">EcommercePOS</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Navigation Items */}
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}

            {/* User Actions */}
            {user ? (
              <div className="flex items-center space-x-4 border-l pl-4">
                {/* Cart & Wishlist for clients/workers */}
                {(user.rol === "cliente" || user.rol === "trabajador") && (
                  <>
                    <Link href="/cliente/wishlist" className="relative">
                      <Button variant="ghost" size="sm" className="relative">
                        <Heart className="h-5 w-5" />
                        {wishlistCount > 0 && (
                          <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                            {wishlistCount}
                          </Badge>
                        )}
                      </Button>
                    </Link>
                    <Link href="/cliente/carrito" className="relative">
                      <Button variant="ghost" size="sm" className="relative">
                        <ShoppingCart className="h-5 w-5" />
                        {getTotalItems() > 0 && (
                          <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                            {getTotalItems()}
                          </Badge>
                        )}
                      </Button>
                    </Link>
                  </>
                )}

                {/* User Info */}
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user.nombre}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.rol}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
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
          <div className="md:hidden border-t bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Mobile Navigation Items */}
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                      isActive(item.href)
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}

              {/* Mobile User Section */}
              {user ? (
                <div className="border-t pt-4 mt-4">
                  {(user.rol === "cliente" || user.rol === "trabajador") && (
                    <div className="flex space-x-4 px-3 mb-4">
                      <Link href="/cliente/wishlist" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="outline" size="sm" className="flex items-center space-x-2 bg-transparent">
                          <Heart className="h-4 w-4" />
                          <span>Lista ({wishlistCount})</span>
                        </Button>
                      </Link>
                      <Link href="/cliente/carrito" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="outline" size="sm" className="flex items-center space-x-2 bg-transparent">
                          <ShoppingCart className="h-4 w-4" />
                          <span>Carrito ({getTotalItems()})</span>
                        </Button>
                      </Link>
                    </div>
                  )}

                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-gray-900">{user.nombre}</p>
                    <p className="text-xs text-gray-500 capitalize mb-2">{user.rol}</p>
                    <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full bg-transparent">
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar Sesión
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-t pt-4 mt-4 px-3 space-y-2">
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
