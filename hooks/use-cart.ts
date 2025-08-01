"use client"

import { useState, useEffect } from "react"
import type { CartItem, Producto } from "@/lib/types"

export function useCart(userId?: number) {
  const [cart, setCart] = useState<CartItem[]>([])

  useEffect(() => {
    if (userId) {
      loadCart()
    }
  }, [userId])

  const loadCart = () => {
    if (!userId) return
    const savedCart = localStorage.getItem(`cart_${userId}`)
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
  }

  const saveCart = (newCart: CartItem[]) => {
    if (!userId) return
    setCart(newCart)
    localStorage.setItem(`cart_${userId}`, JSON.stringify(newCart))
  }

  const addToCart = (producto: Producto, cantidad = 1) => {
    const existingItem = cart.find((item) => item.producto.id === producto.id)

    let newCart: CartItem[]
    if (existingItem) {
      newCart = cart.map((item) =>
        item.producto.id === producto.id ? { ...item, cantidad: item.cantidad + cantidad } : item,
      )
    } else {
      newCart = [...cart, { producto, cantidad }]
    }

    saveCart(newCart)
  }

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }

    const newCart = cart.map((item) => (item.producto.id === productId ? { ...item, cantidad: newQuantity } : item))
    saveCart(newCart)
  }

  const removeFromCart = (productId: number) => {
    const newCart = cart.filter((item) => item.producto.id !== productId)
    saveCart(newCart)
  }

  const clearCart = () => {
    saveCart([])
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.cantidad, 0)
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.producto.precio * item.cantidad, 0)
  }

  return {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalItems,
    getTotalPrice,
  }
}
