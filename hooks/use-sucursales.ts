"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface Sucursal {
  id: number
  nombre: string
  direccion: string
}

export function useSucursales() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [loading, setLoading] = useState(true)

  const loadSucursales = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("sucursales").select("*").order("nombre")

      if (error) throw error
      setSucursales(data || [])
    } catch (error) {
      console.error("Error loading sucursales:", error)
    } finally {
      setLoading(false)
    }
  }

  const createSucursal = async (sucursal: Omit<Sucursal, "id">) => {
    try {
      const { data, error } = await supabase.from("sucursales").insert([sucursal]).select().single()

      if (error) throw error

      setSucursales((prev) => [...prev, data])
      return { success: true, data }
    } catch (error) {
      console.error("Error creating sucursal:", error)
      return { success: false, error }
    }
  }

  const updateSucursal = async (id: number, sucursal: Partial<Omit<Sucursal, "id">>) => {
    try {
      const { data, error } = await supabase.from("sucursales").update(sucursal).eq("id", id).select().single()

      if (error) throw error

      setSucursales((prev) => prev.map((s) => (s.id === id ? data : s)))
      return { success: true, data }
    } catch (error) {
      console.error("Error updating sucursal:", error)
      return { success: false, error }
    }
  }

  const deleteSucursal = async (id: number) => {
    try {
      const { error } = await supabase.from("sucursales").delete().eq("id", id)

      if (error) throw error

      setSucursales((prev) => prev.filter((s) => s.id !== id))
      return { success: true }
    } catch (error) {
      console.error("Error deleting sucursal:", error)
      return { success: false, error }
    }
  }

  useEffect(() => {
    loadSucursales()
  }, [])

  return {
    sucursales,
    loading,
    createSucursal,
    updateSucursal,
    deleteSucursal,
    refreshSucursales: loadSucursales,
  }
}
