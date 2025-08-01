"use client"

import { useState, useEffect } from "react"
import type { Producto } from "@/lib/types"

export function useWishlist(userId?: number) {
  const [wishlist, setWishlist] = useState<Producto[]>([])

  useEffect(() => {
    if (userId) {
      loadWishlist()
    }
  }, [userId])

  const loadWishlist = () => {
    if (!userId) return
    const savedWishlist = localStorage.getItem(`wishlist_${userId}`)
    if (savedWishlist) {
      setWishlist(JSON.parse(savedWishlist))
    }
  }

  const saveWishlist = (newWishlist: Producto[]) => {
    if (!userId) return
    setWishlist(newWishlist)
    localStorage.setItem(`wishlist_${userId}`, JSON.stringify(newWishlist))
  }

  const toggleWishlist = (producto: Producto) => {
    const isInWishlist = wishlist.some((item) => item.id === producto.id)

    let newWishlist: Producto[]
    if (isInWishlist) {
      newWishlist = wishlist.filter((item) => item.id !== producto.id)
    } else {
      newWishlist = [...wishlist, producto]
    }

    saveWishlist(newWishlist)
  }

  const isInWishlist = (productId: number) => {
    return wishlist.some((item) => item.id === productId)
  }

  const clearWishlist = () => {
    saveWishlist([])
  }

  return {
    wishlist,
    toggleWishlist,
    isInWishlist,
    clearWishlist,
    count: wishlist.length,
  }
}
