import { supabase } from "@/lib/supabase"
import type { Producto } from "@/lib/types"
import ProductCard from "@/components/product-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, ShoppingBag, Zap, Shield } from "lucide-react"

async function getProductosDestacados(): Promise<Producto[]> {
  const { data, error } = await supabase
    .from("productos")
    .select(`
      *,
      categoria:categorias(nombre),
      medios:medios_producto(*)
    `)
    .eq("destacado", true)
    .limit(6)

  if (error) {
    console.error("Error fetching featured products:", error)
    return []
  }

  return data || []
}

export default async function HomePage() {
  const productosDestacados = await getProductosDestacados()

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Tu Tienda Online
              <span className="block text-blue-200">y Punto de Venta</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Sistema completo de e-commerce con POS integrado. Gestiona tu negocio desde cualquier lugar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/productos">
                <Button size="lg" variant="secondary" className="text-blue-600">
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Ver Productos
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-white border-white hover:bg-white hover:text-blue-600 bg-transparent"
                >
                  Iniciar Sesión
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">¿Por qué elegir nuestro sistema?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Una solución completa que combina e-commerce y punto de venta
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Rápido y Eficiente</h3>
              <p className="text-gray-600">Sistema optimizado para ventas rápidas tanto online como en tienda física</p>
            </div>

            <div className="text-center p-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Seguro y Confiable</h3>
              <p className="text-gray-600">Datos protegidos con la mejor tecnología de seguridad</p>
            </div>

            <div className="text-center p-6">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Todo en Uno</h3>
              <p className="text-gray-600">E-commerce, POS, inventario y reportes en una sola plataforma</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {productosDestacados.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Productos Destacados</h2>
              <p className="text-lg text-gray-600">Descubre nuestros productos más populares</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {productosDestacados.map((producto) => (
                <ProductCard key={producto.id} producto={producto} showAddToCart={false} />
              ))}
            </div>

            <div className="text-center">
              <Link href="/productos">
                <Button size="lg">
                  Ver Todos los Productos
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
