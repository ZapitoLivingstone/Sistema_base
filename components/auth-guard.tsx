"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import type { User } from "@/lib/types"

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: ("admin" | "cliente" | "trabajador")[]
  redirectTo?: string
}

export default function AuthGuard({ children, allowedRoles, redirectTo = "/auth/login" }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const userData = await getCurrentUser()

      if (!userData) {
        router.push(redirectTo)
        return
      }

      if (allowedRoles && !allowedRoles.includes(userData.rol)) {
        router.push("/") // Redirigir a home si no tiene permisos
        return
      }

      setUser(userData)
    } catch (error) {
      console.error("Error checking auth:", error)
      router.push(redirectTo)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
