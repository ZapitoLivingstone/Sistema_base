"use client"

import { useState, useEffect } from "react"
import { getCurrentUser } from "@/lib/auth"
import type { Producto, User } from "@/lib/types"
import AuthGuard from "@/components/auth-guard"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, ShoppingCart, ArrowLeft, Trash2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function WishlistPage() {
  const [user, setUser] = useState<User | null>(null)
  const [wishlist, setWishlist] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const userData = await getCurrentUser()
      if (!userData) return

      setUser(userData)

      const savedWishlist = localStorage.getItem(`wishlist_${userData.id}`)
      if (savedWishlist) {
        setWishlist(JSON.parse(savedWishlist))
      }
    } catch (error) {
      console.error("Error loading wishlist:", error)
    } finally {
      setLoading(false)
    }
  }

  const removeFromWishlist = (productId: number) => {
    const newWishlist = wishlist.filter((item) => item.id !== productId)
    setWishlist(newWishlist)
    localStorage.setItem(`wishlist_${user!.id}`, JSON.stringify(newWishlist))
  }

  const addToCart = (producto: Producto) => {
    if (!user) return

    const cart = JSON.parse(localStorage.getItem(`cart_${user.id}`) || "[]")
    const existingItem = cart.find((item: any) => item.producto.id === producto.id)

    let newCart
    if (existingItem) {
      newCart = cart.map((item: any) =>
        item.producto.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item,
      )
    } else {
      newCart = [...cart, { producto, cantidad: 1 }]
    }

    localStorage.setItem(`cart_${user.id}`, JSON.stringify(newCart))
    alert("Producto agregado al carrito")
  }

  const clearWishlist = () => {
    setWishlist([])
    localStorage.removeItem(`wishlist_${user!.id}`)
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Link href="/cliente/dashboard">
                  <Button variant="outline" size="sm" className="mr-4 bg-transparent">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Lista de Deseos</h1>
                  <p className="text-gray-600">{wishlist.length} productos guardados</p>
                </div>
              </div>
              {wishlist.length > 0 && (
                <Button variant="outline" onClick={clearWishlist}>
                  Limpiar lista
                </Button>
              )}
            </div>
          </div>

          {wishlist.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Tu lista de deseos está vacía</h2>
                <p className="text-gray-600 mb-6">Guarda productos que te gusten para encontrarlos fácilmente</p>
                <Link href="/productos">
                  <Button>Explorar Productos</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlist.map((producto) => (
                <Card key={producto.id} className="group hover:shadow-lg transition-shadow">
                  <div className="relative aspect-square overflow-hidden rounded-t-lg">
                    {producto.medios && producto.medios.length > 0 ? (
                      <Image
                        src={producto.medios[0].url || "/placeholder.svg"}
                        alt={producto.nombre}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <ShoppingCart className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2 h-8 w-8 p-0"
                      onClick={() => removeFromWishlist(producto.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <CardContent className="p-4">
                    <Link href={`/productos/${producto.id}`}>
                      <h3 className="font-semibold text-lg mb-2 hover:text-blue-600 transition-colors line-clamp-2">
                        {producto.nombre}
                      </h3>
                    </Link>

                    {producto.descripcion && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{producto.descripcion}</p>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-blue-600">${producto.precio.toFixed(2)}</span>
                    </div>

                    <div className="space-y-2">
                      <Button onClick={() => addToCart(producto)} className="w-full" size="sm">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Agregar al Carrito
                      </Button>
                      <Link href={`/productos/${producto.id}`}>
                        <Button variant="outline" className="w-full bg-transparent" size="sm">
                          Ver Detalles
                        </Button>
                      </Link>
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
