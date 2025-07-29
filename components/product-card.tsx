"use client"

import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import type { Producto } from "@/lib/types"
import { ShoppingCart, Star } from "lucide-react"

interface ProductCardProps {
  producto: Producto
  onAddToCart?: (producto: Producto) => void
  showAddToCart?: boolean
}

export default function ProductCard({ producto, onAddToCart, showAddToCart = true }: ProductCardProps) {
  const imageUrl = producto.medios?.[0]?.url || "/placeholder.svg?height=300&width=300"

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="p-0">
        <div className="relative aspect-square overflow-hidden rounded-t-lg">
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt={producto.nombre}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {producto.destacado && (
            <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
              <Star className="h-3 w-3 mr-1" />
              Destacado
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <Link href={`/productos/${producto.id}`}>
          <h3 className="font-semibold text-lg mb-2 hover:text-blue-600 transition-colors">{producto.nombre}</h3>
        </Link>

        {producto.descripcion && <p className="text-gray-600 text-sm mb-3 line-clamp-2">{producto.descripcion}</p>}

        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-blue-600">${producto.precio.toFixed(2)}</span>

          {producto.categoria && <Badge variant="secondary">{producto.categoria.nombre}</Badge>}
        </div>
      </CardContent>

      {showAddToCart && onAddToCart && (
        <CardFooter className="p-4 pt-0">
          <Button onClick={() => onAddToCart(producto)} className="w-full" size="sm">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Agregar al Carrito
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
