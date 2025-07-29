"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import type { User, Producto } from "@/lib/types"
import AuthGuard from "@/components/auth-guard"
import ProductCard from "@/components/product-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Heart, Package, TrendingUp } from "lucide-react"

export default function ClienteDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [productosDestacados, setProductosDestacados] = useState<Producto[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [wishlist, setWishlist] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const userData = await getCurrentUser()
      if (!userData) return

      setUser(userData)

      // Cargar productos destacados
      const { data: productosData, error: productosError } = await supabase
        .from("productos")
        .select(`
          *,
          categoria:categorias(nombre),
          medios:medios_producto(*)
        `)
        .eq("destacado", true)
        .limit(6)

      if (productosError) throw productosError

      setProductosDestacados(productosData || [])

      // Aquí podrías cargar el carrito y wishlist del usuario desde localStorage o base de datos
      const savedCart = localStorage.getItem(`cart_${userData.id}`)
      const savedWishlist = localStorage.getItem(`wishlist_${userData.id}`)

      if (savedCart) setCart(JSON.parse(savedCart))
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist))
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (producto: Producto) => {
    const existingItem = cart.find((item) => item.producto.id === producto.id)

    let newCart
    if (existingItem) {
      newCart = cart.map((item) => (item.producto.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item))
    } else {
      newCart = [...cart, { producto, cantidad: 1 }]
    }

    setCart(newCart)
    localStorage.setItem(`cart_${user!.id}`, JSON.stringify(newCart))
  }

  const addToWishlist = (producto: Producto) => {
    const isInWishlist = wishlist.some((item) => item.id === producto.id)

    let newWishlist
    if (isInWishlist) {
      newWishlist = wishlist.filter((item) => item.id !== producto.id)
    } else {
      newWishlist = [...wishlist, producto]
    }

    setWishlist(newWishlist)
    localStorage.setItem(`wishlist_${user!.id}`, JSON.stringify(newWishlist))
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.cantidad, 0)
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.producto.precio * item.cantidad, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <AuthGuard allowedRoles={["cliente", "trabajador", "admin"]}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Mi Dashboard</h1>
            <p className="text-gray-600">Bienvenido, {user?.nombre}</p>
          </div>

          {/* Stats del usuario */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Carrito</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getTotalItems()}</div>
                <p className="text-xs text-muted-foreground">${getTotalPrice().toFixed(2)} total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lista de Deseos</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{wishlist.length}</div>
                <p className="text-xs text-muted-foreground">Productos guardados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Pedidos activos</p>
              </CardContent>
            </Card>
          </div>

          {/* Acciones rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Link href="/productos">
              <Button className="w-full h-20 flex flex-col items-center justify-center">
                <Package className="h-6 w-6 mb-2" />
                Ver Productos
              </Button>
            </Link>
            <Link href="/cliente/carrito">
              <Button
                className="w-full h-20 flex flex-col items-center justify-center bg-transparent"
                variant="outline"
              >
                <ShoppingCart className="h-6 w-6 mb-2" />
                Mi Carrito ({getTotalItems()})
              </Button>
            </Link>
            <Link href="/cliente/wishlist">
              <Button
                className="w-full h-20 flex flex-col items-center justify-center bg-transparent"
                variant="outline"
              >
                <Heart className="h-6 w-6 mb-2" />
                Lista de Deseos ({wishlist.length})
              </Button>
            </Link>
            <Link href="/cliente/pedidos">
              <Button
                className="w-full h-20 flex flex-col items-center justify-center bg-transparent"
                variant="outline"
              >
                <TrendingUp className="h-6 w-6 mb-2" />
                Mis Pedidos
              </Button>
            </Link>
          </div>

          {/* Productos destacados */}
          {productosDestacados.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Productos Destacados</h2>
                <Link href="/productos">
                  <Button variant="outline">Ver Todos</Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {productosDestacados.map((producto) => (
                  <div key={producto.id} className="relative">
                    <ProductCard producto={producto} onAddToCart={addToCart} showAddToCart={true} />
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2 p-2 bg-transparent"
                      onClick={() => addToWishlist(producto)}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          wishlist.some((item) => item.id === producto.id) ? "fill-red-500 text-red-500" : ""
                        }`}
                      />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resumen del carrito */}
          {cart.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Resumen del Carrito
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {cart.slice(0, 3).map((item) => (
                    <div key={item.producto.id} className="flex justify-between text-sm">
                      <span>
                        {item.producto.nombre} x{item.cantidad}
                      </span>
                      <span>${(item.producto.precio * item.cantidad).toFixed(2)}</span>
                    </div>
                  ))}
                  {cart.length > 3 && <p className="text-sm text-gray-500">Y {cart.length - 3} productos más...</p>}
                </div>
                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="font-bold">Total: ${getTotalPrice().toFixed(2)}</span>
                  <div className="space-x-2">
                    <Link href="/cliente/carrito">
                      <Button variant="outline" size="sm">
                        Ver Carrito
                      </Button>
                    </Link>
                    <Link href="/cliente/checkout">
                      <Button size="sm">Comprar Ahora</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
