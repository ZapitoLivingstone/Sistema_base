"use client"

import type React from "react"

import Link from "next/link"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import AuthGuard from "@/components/auth-guard"
import ProductCard from "@/components/product-card"
import { PageHeader } from "@/components/common/page-header"
import { StatsCard } from "@/components/common/stats-card"
import { QuickActionCard } from "@/components/common/quick-action-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/hooks/use-cart"
import { useWishlist } from "@/hooks/use-wishlist"
import type { Producto } from "@/lib/types"
import { ShoppingCart, Heart, Package, TrendingUp, Star, ArrowRight } from "lucide-react"

export default function ClienteDashboard() {
  const { user } = useAuth()
  const { cart, addToCart, getTotalItems, getTotalPrice } = useCart(user?.id)
  const { toggleWishlist, isInWishlist, count: wishlistCount } = useWishlist(user?.id)

  const [productosDestacados, setProductosDestacados] = useState<Producto[]>([])
  const [productosRecientes, setProductosRecientes] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProductos()
  }, [])

  const loadProductos = async () => {
    try {
      const [{ data: destacados }, { data: recientes }] = await Promise.all([
        supabase
          .from("productos")
          .select("*, categoria:categorias(nombre), medios:medios_producto(*)")
          .eq("destacado", true)
          .limit(4),
        supabase
          .from("productos")
          .select("*, categoria:categorias(nombre), medios:medios_producto(*)")
          .order("created_at", { ascending: false })
          .limit(4),
      ])

      setProductosDestacados(destacados || [])
      setProductosRecientes(recientes || [])
    } catch (error) {
      console.error("Error loading products:", error)
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Header */}
          <PageHeader
            title={`¡Hola, ${user?.nombre}! 👋`}
            description="Descubre nuestros productos y gestiona tus compras"
          />

          {/* User Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatsCard
              title="Mi Carrito"
              value={getTotalItems()}
              description={`$${getTotalPrice().toFixed(2)} total`}
              icon={ShoppingCart}
            />
            <StatsCard title="Lista de Deseos" value={wishlistCount} description="Productos guardados" icon={Heart} />
            <StatsCard title="Mis Pedidos" value={0} description="Pedidos activos" icon={Package} />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <QuickActionCard
              href="/productos"
              icon={Package}
              title="Explorar Productos"
              description="Ver catálogo completo"
              color="blue"
            />
            <QuickActionCard
              href="/cliente/carrito"
              icon={ShoppingCart}
              title="Mi Carrito"
              description="Revisar compras"
              badge={getTotalItems() > 0 ? { text: getTotalItems().toString() } : undefined}
              color="green"
            />
            <QuickActionCard
              href="/cliente/wishlist"
              icon={Heart}
              title="Favoritos"
              description="Productos guardados"
              badge={wishlistCount > 0 ? { text: wishlistCount.toString() } : undefined}
              color="red"
            />
            <QuickActionCard
              href="/cliente/pedidos"
              icon={TrendingUp}
              title="Mis Pedidos"
              description="Historial de compras"
              color="purple"
            />
          </div>

          {/* Featured Products */}
          {productosDestacados.length > 0 && (
            <ProductSection
              title="Productos Destacados"
              icon={Star}
              productos={productosDestacados}
              viewAllUrl="/productos?destacados=true"
              onAddToCart={addToCart}
              onToggleWishlist={toggleWishlist}
              isInWishlist={isInWishlist}
            />
          )}

          {/* Recent Products */}
          {productosRecientes.length > 0 && (
            <ProductSection
              title="Productos Recientes"
              productos={productosRecientes}
              viewAllUrl="/productos"
              onAddToCart={addToCart}
              onToggleWishlist={toggleWishlist}
              isInWishlist={isInWishlist}
            />
          )}

          {/* Cart Summary */}
          {cart.length > 0 && <CartSummary cart={cart} totalPrice={getTotalPrice()} />}
        </div>
      </div>
    </AuthGuard>
  )
}

// Componente para secciones de productos
interface ProductSectionProps {
  title: string
  icon?: React.ComponentType<{ className?: string }>
  productos: Producto[]
  viewAllUrl: string
  onAddToCart: (producto: Producto) => void
  onToggleWishlist: (producto: Producto) => void
  isInWishlist: (productId: number) => boolean
}

function ProductSection({
  title,
  icon: Icon,
  productos,
  viewAllUrl,
  onAddToCart,
  onToggleWishlist,
  isInWishlist,
}: ProductSectionProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          {Icon && <Icon className="h-6 w-6 text-yellow-500" />}
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>
        <Link href={viewAllUrl}>
          <Button variant="outline" className="flex items-center space-x-2 bg-transparent">
            <span>Ver Todos</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {productos.map((producto) => (
          <div key={producto.id} className="relative">
            <ProductCard producto={producto} onAddToCart={onAddToCart} showAddToCart={true} />
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm hover:bg-white"
              onClick={() => onToggleWishlist(producto)}
            >
              <Heart className={`h-4 w-4 ${isInWishlist(producto.id) ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

// Componente para resumen del carrito
interface CartSummaryProps {
  cart: any[]
  totalPrice: number
}

function CartSummary({ cart, totalPrice }: CartSummaryProps) {
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center text-blue-800">
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
              <span className="font-medium">${(item.producto.precio * item.cantidad).toFixed(2)}</span>
            </div>
          ))}
          {cart.length > 3 && <p className="text-sm text-gray-500">Y {cart.length - 3} productos más...</p>}
        </div>
        <div className="flex justify-between items-center pt-4 border-t border-blue-200">
          <span className="font-bold text-lg text-blue-800">Total: ${totalPrice.toFixed(2)}</span>
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
  )
}
