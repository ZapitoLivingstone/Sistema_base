"use client"

import type React from "react"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { ShoppingCart, Package, Heart, Star } from "lucide-react"
import type { Producto } from "@/lib/types"

interface ProductCardProps {
  producto: Producto & { stock_disponible?: number }
  showAddToCart?: boolean
  showStock?: boolean
  stock?: number
  onAddToCart?: (producto: Producto) => void
  onAddToWishlist?: (producto: Producto) => void
  className?: string
  clickable?: boolean
}

export default function ProductCard({
  producto,
  showAddToCart = true,
  showStock = false,
  stock,
  onAddToCart,
  onAddToWishlist,
  className = "",
  clickable = true,
}: ProductCardProps) {
  const stockValue = stock ?? producto.stock_disponible ?? 0
  const hasStock = stockValue > 0

  const getStockBadgeVariant = () => {
    if (stockValue > 10) return "secondary"
    if (stockValue > 0) return "outline"
    return "destructive"
  }

  const getStockColor = () => {
    if (stockValue > 10) return "text-green-600"
    if (stockValue > 0) return "text-orange-600"
    return "text-red-600"
  }

  const CardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (clickable) {
      return (
        <Link href={`/productos/${producto.id}`}>
          <Card className={`group hover:shadow-lg transition-all duration-200 cursor-pointer ${className}`}>
            {children}
          </Card>
        </Link>
      )
    }
    return <Card className={`group hover:shadow-lg transition-all duration-200 ${className}`}>{children}</Card>
  }

  return (
    <CardWrapper>
      <CardContent className="p-4">
        {/* Imagen del producto */}
        <div className="relative h-32 w-full mb-3 overflow-hidden rounded-md bg-gray-100">
          {producto.medios && producto.medios.length > 0 ? (
            <Image
              src={producto.medios[0].url || "/placeholder.svg"}
              alt={producto.nombre}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          )}

          {/* Badge de destacado */}
          {producto.destacado && (
            <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
              <Star className="h-3 w-3 mr-1" />
              Destacado
            </Badge>
          )}

          {/* Badge de stock */}
          {showStock && (
            <Badge variant={getStockBadgeVariant()} className="absolute top-2 right-2">
              Stock: {stockValue}
            </Badge>
          )}
        </div>

        {/* Información del producto */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">{producto.nombre}</h3>

          {producto.descripcion && <p className="text-xs text-gray-600 line-clamp-2">{producto.descripcion}</p>}

          {/* Precio */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-blue-600">{formatPrice(producto.precio)}</span>

            {/* Categoría */}
            {producto.categoria && (
              <Badge variant="outline" className="text-xs">
                {producto.categoria.nombre}
              </Badge>
            )}
          </div>

          {/* Información de stock */}
          {showStock && (
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${getStockColor()}`}>
                {stockValue > 10 ? "Disponible" : stockValue > 0 ? "Pocas unidades" : "Sin stock"}
              </span>
            </div>
          )}

          {/* Botones de acción */}
          {showAddToCart && (
            <div className="flex gap-2 pt-2">
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onAddToCart?.(producto)
                }}
                disabled={showStock && !hasStock}
                className="flex-1"
                size="sm"
              >
                <ShoppingCart className="h-3 w-3 mr-1" />
                {showStock && !hasStock ? "Sin stock" : "Agregar"}
              </Button>

              {onAddToWishlist && (
                <Button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onAddToWishlist(producto)
                  }}
                  variant="outline"
                  size="sm"
                >
                  <Heart className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </CardWrapper>
  )
}
