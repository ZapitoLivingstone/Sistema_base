"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

export default function RoleRedirect() {
  const router = useRouter()

  useEffect(() => {
    checkUserAndRedirect()
  }, [])

  const checkUserAndRedirect = async () => {
    const user = await getCurrentUser()

    if (user) {
      switch (user.rol) {
        case "admin":
          router.push("/admin/dashboard")
          break
        case "trabajador":
          router.push("/trabajador/dashboard")
          break
        case "cliente":
          router.push("/cliente/dashboard")
          break
        default:
          router.push("/")
      }
    }
  }

  return null
}
