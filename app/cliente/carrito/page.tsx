"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getCurrentUser } from "@/lib/auth"
import { formatPrice } from "@/lib/utils"
import type { CartItem, User } from "@/lib/types"
import AuthGuard from "@/components/auth-guard"
import { PageHeader } from "@/components/common/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { useCart } from "@/hooks/use-cart"
import { ShoppingCart, Plus, Minus, Trash2 } from "lucide-react"
import Image from "next/image"

export default function CarritoPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const { cart, updateQuantity, removeFromCart, clearCart, getTotalItems, getTotalPrice } = useCart(user?.id)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const userData = await getCurrentUser()
      setUser(userData)
    } catch (error) {
      console.error("Error loading user:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <AuthGuard allowedRoles={["cliente", "trabajador", "admin"]}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <PageHeader title="Mi Carrito" description={`${getTotalItems()} productos`} backUrl="/cliente/dashboard" />

          {cart.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="Tu carrito está vacío"
              description="Agrega algunos productos para comenzar"
              action={{
                label: "Ver Productos",
                onClick: () => (window.location.href = "/productos"),
              }}
            />
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
                  <CartItemCard
                    key={item.producto.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeFromCart}
                  />
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
                      <span>{formatPrice(getTotalPrice())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Envío</span>
                      <span>Gratis</span>
                    </div>
                    <hr />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>{formatPrice(getTotalPrice())}</span>
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

// ==================== COMPONENTE ITEM DEL CARRITO ====================
interface CartItemCardProps {
  item: CartItem
  onUpdateQuantity: (productId: number, quantity: number) => void
  onRemove: (productId: number) => void
}

function CartItemCard({ item, onUpdateQuantity, onRemove }: CartItemCardProps) {
  return (
    <Card>
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
              <h3 className="font-semibold hover:text-blue-600 transition-colors">{item.producto.nombre}</h3>
            </Link>
            <p className="text-gray-600 text-sm">{item.producto.categoria?.nombre}</p>
            <p className="text-lg font-bold text-blue-600">{formatPrice(item.producto.precio)}</p>
          </div>

          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" onClick={() => onUpdateQuantity(item.producto.id, item.cantidad - 1)}>
              <Minus className="h-3 w-3" />
            </Button>
            <Input
              type="number"
              min="1"
              value={item.cantidad}
              onChange={(e) => onUpdateQuantity(item.producto.id, Number.parseInt(e.target.value) || 1)}
              className="w-16 text-center"
            />
            <Button size="sm" variant="outline" onClick={() => onUpdateQuantity(item.producto.id, item.cantidad + 1)}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <div className="text-right">
            <p className="font-bold">{formatPrice(item.producto.precio * item.cantidad)}</p>
            <Button size="sm" variant="destructive" onClick={() => onRemove(item.producto.id)} className="mt-2">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
