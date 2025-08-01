"use client"

import { useState, useEffect } from "react"
import { getCurrentUser, signOut as authSignOut } from "@/lib/auth"
import type { User } from "@/lib/types"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

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

  const signOut = async () => {
    await authSignOut()
    setUser(null)
  }

  const refreshUser = () => {
    setLoading(true)
    loadUser()
  }

  return {
    user,
    loading,
    signOut,
    refreshUser,
    isAuthenticated: !!user,
  }
}
