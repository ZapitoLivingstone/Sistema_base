import { supabase } from "./supabase"
import type { User } from "./types"

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function signUp(email: string, password: string, userData: Partial<User>) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (data.user && !error) {
    // Crear usuario en nuestra tabla personalizada
    const { error: userError } = await supabase.from("users").insert([
      {
        nombre: userData.nombre,
        email: email,
        rol: userData.rol || "cliente",
        sucursal_id: userData.sucursal_id,
      },
    ])

    if (userError) {
      console.error("Error creating user profile:", userError)
    }
  }

  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: userData } = await supabase.from("users").select("*").eq("email", user.email).single()

    return userData
  }

  return null
}
