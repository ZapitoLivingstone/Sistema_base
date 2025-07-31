"use client"

import { useState, useEffect } from "react"
import { getCurrentUser } from "@/lib/auth"
import type { CartItem, User } from "@/lib/types"
import AuthGuard from "@/components/auth-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function CarritoPage() {
  const [user, setUser] = useState<User | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const userData = await getCurrentUser()
      if (!userData) return

      setUser(userData)

      const savedCart = localStorage.getItem(`cart_${userData.id}`)
      if (savedCart) {
        setCart(JSON.parse(savedCart))
      }
    } catch (error) {
      console.error("Error loading cart:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }

    const newCart = cart.map((item) => (item.producto.id === productId ? { ...item, cantidad: newQuantity } : item))

    setCart(newCart)
    localStorage.setItem(`cart_${user!.id}`, JSON.stringify(newCart))
  }

  const removeFromCart = (productId: number) => {
    const newCart = cart.filter((item) => item.producto.id !== productId)
    setCart(newCart)
    localStorage.setItem(`cart_${user!.id}`, JSON.stringify(newCart))
  }

  const clearCart = () => {
    setCart([])
    localStorage.removeItem(`cart_${user!.id}`)
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Link href="/cliente/dashboard">
                <Button variant="outline" size="sm" className="mr-4 bg-transparent">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Mi Carrito</h1>
                <p className="text-gray-600">{getTotalItems()} productos</p>
              </div>
            </div>
          </div>

          {cart.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Tu carrito está vacío</h2>
                <p className="text-gray-600 mb-6">Agrega algunos productos para comenzar</p>
                <Link href="/productos">
                  <Button>Ver Productos</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Items del carrito */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Productos ({cart.length})</h2>
                  <Button variant="outline" size="sm" onClick={clearCart}>
                    Vaciar carrito
                  </Button>
                </div>

                {cart.map((item) => (
                  <Card key={item.producto.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="relative h-20 w-20 flex-shrink-0">
                          {item.producto.medios && item.producto.medios.length > 0 ? (
                            <Image
                              src={item.producto.medios[0].url || "/placeholder.svg"}
                              alt={item.producto.nombre}
                              fill
                              className="object-cover rounded"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                              <ShoppingCart className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <Link href={`/productos/${item.producto.id}`}>
                            <h3 className="font-semibold hover:text-blue-600 transition-colors">
                              {item.producto.nombre}
                            </h3>
                          </Link>
                          <p className="text-gray-600 text-sm">{item.producto.categoria?.nombre}</p>
                          <p className="text-lg font-bold text-blue-600">${item.producto.precio.toFixed(2)}</p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.producto.id, item.cantidad - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={item.cantidad}
                            onChange={(e) => updateQuantity(item.producto.id, Number.parseInt(e.target.value) || 1)}
                            className="w-16 text-center"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.producto.id, item.cantidad + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="text-right">
                          <p className="font-bold">${(item.producto.precio * item.cantidad).toFixed(2)}</p>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeFromCart(item.producto.id)}
                            className="mt-2"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Resumen del pedido */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Resumen del Pedido</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Subtotal ({getTotalItems()} productos)</span>
                      <span>${getTotalPrice().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Envío</span>
                      <span>Gratis</span>
                    </div>
                    <hr />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>${getTotalPrice().toFixed(2)}</span>
                    </div>

                    <div className="space-y-2">
                      <Link href="/cliente/checkout">
                        <Button className="w-full" size="lg">
                          Proceder al Pago
                        </Button>
                      </Link>
                      <Link href="/productos">
                        <Button variant="outline" className="w-full bg-transparent">
                          Seguir Comprando
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
