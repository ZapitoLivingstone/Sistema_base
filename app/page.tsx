import { supabase } from "@/lib/supabase"
import type { Producto } from "@/lib/types"
import ProductCard from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import {
  ArrowRight,
  ShoppingBag,
  Zap,
  Shield,
  Users,
  Store,
  BarChart3,
  Star,
  CheckCircle,
  TrendingUp,
} from "lucide-react"

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

async function getStats() {
  try {
    const [{ count: totalProducts }, { count: totalUsers }, { count: totalSales }] = await Promise.all([
      supabase.from("productos").select("*", { count: "exact", head: true }),
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase.from("ventas").select("*", { count: "exact", head: true }).eq("anulada", false),
    ])

    return {
      totalProducts: totalProducts || 0,
      totalUsers: totalUsers || 0,
      totalSales: totalSales || 0,
    }
  } catch (error) {
    return { totalProducts: 0, totalUsers: 0, totalSales: 0 }
  }
}

export default async function HomePage() {
  const [productosDestacados, stats] = await Promise.all([getProductosDestacados(), getStats()])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Sistema POS
              <span className="block text-blue-200 text-3xl md:text-5xl mt-2">E-commerce Integrado</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Solución completa para tu negocio: Punto de venta, tienda online, gestión de inventario y reportes. Todo
              en una sola plataforma.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/productos">
                <Button size="lg" variant="secondary" className="text-blue-600 hover:text-blue-700 px-8 py-3">
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Ver Demo
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-white border-white hover:bg-white hover:text-blue-600 bg-transparent px-8 py-3"
                >
                  Solicitar Cotización
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Stats del sistema */}
            <div className="flex justify-center space-x-8 text-blue-100">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.totalProducts}+</div>
                <div className="text-sm">Productos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.totalUsers}+</div>
                <div className="text-sm">Usuarios</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.totalSales}+</div>
                <div className="text-sm">Ventas</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Características principales */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">¿Por qué elegir nuestro sistema POS?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Una solución integral diseñada para hacer crecer tu negocio con tecnología de vanguardia
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="text-center p-8 hover:shadow-lg transition-shadow border-0 bg-white">
              <CardContent className="p-0">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Zap className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Rápido y Eficiente</h3>
                <p className="text-gray-600 leading-relaxed">
                  Procesa ventas en segundos con nuestra interfaz optimizada. Reduce tiempos de espera y mejora la
                  experiencia del cliente.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 hover:shadow-lg transition-shadow border-0 bg-white">
              <CardContent className="p-0">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Seguro y Confiable</h3>
                <p className="text-gray-600 leading-relaxed">
                  Datos protegidos con encriptación de nivel bancario. Respaldos automáticos y control de acceso por
                  roles.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 hover:shadow-lg transition-shadow border-0 bg-white">
              <CardContent className="p-0">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Reportes Inteligentes</h3>
                <p className="text-gray-600 leading-relaxed">
                  Analiza tu negocio con reportes detallados. Toma decisiones basadas en datos reales de ventas e
                  inventario.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Funcionalidades por rol */}
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4 text-blue-800">Para Administradores</h3>
                <ul className="text-sm text-blue-700 space-y-2 text-left">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Control total del sistema
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Gestión de usuarios y roles
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Reportes y estadísticas avanzadas
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Administración multi-sucursal
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-8 text-center">
                <Store className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4 text-green-800">Para Vendedores</h3>
                <ul className="text-sm text-green-700 space-y-2 text-left">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Punto de venta intuitivo
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Gestión de turnos y caja
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Control de stock en tiempo real
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Múltiples métodos de pago
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-8 text-center">
                <BarChart3 className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4 text-purple-800">Para Clientes</h3>
                <ul className="text-sm text-purple-700 space-y-2 text-left">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Catálogo online completo
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Carrito y lista de deseos
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Seguimiento de pedidos
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Experiencia personalizada
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Productos destacados */}
      {productosDestacados.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Star className="h-6 w-6 text-yellow-500" />
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Productos de Demostración</h2>
                <Star className="h-6 w-6 text-yellow-500" />
              </div>
              <p className="text-lg text-gray-600">Explora algunos productos de ejemplo en nuestro sistema</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {productosDestacados.map((producto) => (
                <div key={producto.id} className="transform hover:scale-105 transition-transform duration-300">
                  <ProductCard producto={producto} showAddToCart={false} />
                </div>
              ))}
            </div>

            <div className="text-center">
              <Link href="/productos">
                <Button size="lg" className="px-8 py-3">
                  Ver Catálogo Completo
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Beneficios del sistema */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Beneficios de Implementar Nuestro Sistema
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Optimiza tu negocio con herramientas profesionales diseñadas para el mercado chileno
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Aumenta Ventas</h3>
              <p className="text-gray-600 text-sm">Hasta 30% más ventas con mejor gestión de inventario</p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ahorra Tiempo</h3>
              <p className="text-gray-600 text-sm">Reduce 50% el tiempo en tareas administrativas</p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Control Total</h3>
              <p className="text-gray-600 text-sm">Monitorea tu negocio desde cualquier lugar</p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Decisiones Inteligentes</h3>
              <p className="text-gray-600 text-sm">Reportes detallados para optimizar tu negocio</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">¿Listo para Modernizar tu Negocio?</h2>
          <p className="text-xl mb-8 text-indigo-100">
            Solicita una demostración personalizada y descubre cómo nuestro sistema puede transformar tu empresa
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" variant="secondary" className="px-8 py-3">
                Solicitar Demo
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button
                size="lg"
                variant="outline"
                className="text-white border-white hover:bg-white hover:text-indigo-600 bg-transparent px-8 py-3"
              >
                Ver Sistema
              </Button>
            </Link>
          </div>
          <p className="text-sm text-indigo-200 mt-6">
            * Sistema desarrollado para el mercado chileno con precios en CLP y funcionalidades locales
          </p>
        </div>
      </section>
    </div>
  )
}
