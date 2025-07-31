"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { Producto, CartItem } from "@/lib/types"
import { getCurrentUser } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ShoppingCart, Heart, Star, Package } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function ProductoDetalle() {
  const params = useParams()
  const [producto, setProducto] = useState<Producto | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMedia, setSelectedMedia] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [isInWishlist, setIsInWishlist] = useState(false)

  useEffect(() => {
    loadProducto()
    loadUser()
  }, [params.id])

  const loadUser = async () => {
    const userData = await getCurrentUser()
    setUser(userData)

    if (userData) {
      const wishlist = JSON.parse(localStorage.getItem(`wishlist_${userData.id}`) || "[]")
      setIsInWishlist(wishlist.some((item: any) => item.id === Number(params.id)))
    }
  }

  const loadProducto = async () => {
    try {
      const { data, error } = await supabase
        .from("productos")
        .select(`
          *,
          categoria:categorias(nombre),
          medios:medios_producto(*)
        `)
        .eq("id", params.id)
        .single()

      if (error) throw error

      setProducto(data)
    } catch (error) {
      console.error("Error loading product:", error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = () => {
    if (!user || !producto) return

    const cart = JSON.parse(localStorage.getItem(`cart_${user.id}`) || "[]")
    const existingItem = cart.find((item: CartItem) => item.producto.id === producto.id)

    let newCart
    if (existingItem) {
      newCart = cart.map((item: CartItem) =>
        item.producto.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item,
      )
    } else {
      newCart = [...cart, { producto, cantidad: 1 }]
    }

    localStorage.setItem(`cart_${user.id}`, JSON.stringify(newCart))
    alert("Producto agregado al carrito")
  }

  const toggleWishlist = () => {
    if (!user || !producto) return

    const wishlist = JSON.parse(localStorage.getItem(`wishlist_${user.id}`) || "[]")
    let newWishlist

    if (isInWishlist) {
      newWishlist = wishlist.filter((item: any) => item.id !== producto.id)
    } else {
      newWishlist = [...wishlist, producto]
    }

    localStorage.setItem(`wishlist_${user.id}`, JSON.stringify(newWishlist))
    setIsInWishlist(!isInWishlist)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!producto) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Producto no encontrado</h2>
          <Link href="/productos">
            <Button>Volver a productos</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/productos">
            <Button variant="outline" size="sm" className="bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a productos
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Galería de medios */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <div className="relative h-96">
                {producto.medios && producto.medios.length > 0 ? (
                  producto.medios[selectedMedia].tipo === "foto" ? (
                    <Image
                      src={producto.medios[selectedMedia].url || "/placeholder.svg"}
                      alt={producto.nombre}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <video src={producto.medios[selectedMedia].url} controls className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <Package className="h-24 w-24 text-gray-400" />
                  </div>
                )}
                {producto.destacado && (
                  <Badge className="absolute top-4 left-4 bg-yellow-500">
                    <Star className="h-3 w-3 mr-1" />
                    Destacado
                  </Badge>
                )}
              </div>
            </Card>

            {/* Thumbnails */}
            {producto.medios && producto.medios.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {producto.medios.map((medio, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedMedia(index)}
                    className={`relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden border-2 ${
                      selectedMedia === index ? "border-blue-500" : "border-gray-200"
                    }`}
                  >
                    {medio.tipo === "foto" ? (
                      <Image
                        src={medio.url || "/placeholder.svg"}
                        alt={`Vista ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Información del producto */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary">{producto.categoria?.nombre}</Badge>
                {user && (
                  <Button size="sm" variant="outline" onClick={toggleWishlist} className="bg-transparent">
                    <Heart className={`h-4 w-4 ${isInWishlist ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{producto.nombre}</h1>
              <div className="text-4xl font-bold text-blue-600 mb-6">${producto.precio.toFixed(2)}</div>
            </div>

            {producto.descripcion && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Descripción</h3>
                <p className="text-gray-600 leading-relaxed">{producto.descripcion}</p>
              </div>
            )}

            {user && (
              <div className="space-y-4">
                <Button onClick={addToCart} size="lg" className="w-full">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Agregar al Carrito
                </Button>

                <div className="flex space-x-4">
                  <Link href="/cliente/carrito" className="flex-1">
                    <Button variant="outline" size="lg" className="w-full bg-transparent">
                      Ver Carrito
                    </Button>
                  </Link>
                  <Link href="/cliente/checkout" className="flex-1">
                    <Button variant="secondary" size="lg" className="w-full">
                      Comprar Ahora
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {!user && (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-600 mb-4">Inicia sesión para comprar este producto</p>
                  <div className="space-x-4">
                    <Link href="/auth/login">
                      <Button>Iniciar Sesión</Button>
                    </Link>
                    <Link href="/auth/register">
                      <Button variant="outline">Registrarse</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Información adicional */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Información del producto</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Categoría:</span>
                    <span>{producto.categoria?.nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Precio:</span>
                    <span className="font-semibold">${producto.precio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado:</span>
                    <Badge variant="outline">Disponible</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
