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
  try {
    // 1. Crear usuario en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      return { data: null, error }
    }

    // 2. Si el usuario se creó exitosamente, crear perfil en nuestra tabla
    if (data.user) {
      const { error: userError } = await supabase.from("users").insert([
        {
          nombre: userData.nombre,
          email: email,
          rol: userData.rol || "cliente",
          sucursal_id: userData.sucursal_id || null,
        },
      ])

      if (userError) {
        console.error("Error creating user profile:", userError)
        // Si falla la creación del perfil, intentar eliminar el usuario de auth
        await supabase.auth.admin.deleteUser(data.user.id)
        return { data: null, error: userError }
      }
    }

    return { data, error: null }
  } catch (err) {
    console.error("Unexpected error during signup:", err)
    return { data: null, error: { message: "Error inesperado durante el registro" } }
  }
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

// Agregar función para verificar si el email ya existe
export async function checkEmailExists(email: string) {
  const { data, error } = await supabase.from("users").select("email").eq("email", email).single()

  return { exists: !!data, error }
}

// Agregar función para refrescar el estado del usuario
export async function refreshUserSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}
