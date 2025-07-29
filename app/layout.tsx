import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/ui/navbar"
import ClientRedirect from "@/components/client-redirect"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "EcommercePOS - Sistema Completo de Ventas",
  description: "Sistema completo de e-commerce con punto de venta integrado",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Navbar />
        <ClientRedirect />
        <main>{children}</main>
      </body>
    </html>
  )
}
