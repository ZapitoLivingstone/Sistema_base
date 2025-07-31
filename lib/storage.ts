import { supabase } from "./supabase"

export interface UploadResult {
  url: string
  path: string
}

export async function uploadFile(file: File, folder = "productos"): Promise<UploadResult> {
  try {
    // Generar nombre único para el archivo
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    // Subir archivo
    const { data, error } = await supabase.storage.from("productos").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      throw error
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage.from("productos").getPublicUrl(filePath)

    return {
      url: urlData.publicUrl,
      path: filePath,
    }
  } catch (error) {
    console.error("Error uploading file:", error)
    throw error
  }
}

export async function deleteFile(path: string): Promise<void> {
  try {
    const { error } = await supabase.storage.from("productos").remove([path])

    if (error) {
      throw error
    }
  } catch (error) {
    console.error("Error deleting file:", error)
    throw error
  }
}

export function getFilePathFromUrl(url: string): string {
  // Extraer el path del archivo desde la URL pública
  const urlParts = url.split("/storage/v1/object/public/productos/")
  return urlParts[1] || ""
}

// Validar tipos de archivo permitidos
export function validateFileType(file: File): boolean {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/ogg",
  ]

  return allowedTypes.includes(file.type)
}

// Validar tamaño de archivo (50MB por defecto)
export function validateFileSize(file: File, maxSizeMB = 50): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}
