import { supabase } from './supabaseClient'
import { isConfigured } from './supabaseConfig'

const BUCKET = 'pear-images'
const LOCAL_STORAGE_KEY = 'pear_images'

function getLocalImages() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalImages(images) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(images))
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function publicUrl(path) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function uploadImage(file, modelId, type = 'uploaded', onProgress) {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  const path = `models/${modelId}/${type}/${id}_${file.name}`

  if (!isConfigured || !supabase) {
    const url = await fileToDataUrl(file)
    const image = {
      id,
      path,
      url,
      name: file.name,
      modelId,
      type,
      size: file.size,
      createdAt: new Date().toISOString(),
    }
    const images = getLocalImages()
    images.push(image)
    saveLocalImages(images)

    if (onProgress) {
      for (let p = 0; p <= 100; p += 20) {
        onProgress(p)
        await new Promise((r) => setTimeout(r, 50))
      }
    }
    return image
  }

  onProgress?.(10)

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  })

  if (error) throw error

  onProgress?.(100)

  return {
    id,
    path,
    url: publicUrl(path),
    name: file.name,
    modelId,
    type,
    size: file.size,
    createdAt: new Date().toISOString(),
  }
}

async function listFolder(prefix) {
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
    limit: 200,
    sortBy: { column: 'created_at', order: 'desc' },
  })
  if (error || !data) return []

  return data
    .filter((item) => item.id)
    .map((item) => {
      const fullPath = `${prefix}/${item.name}`
      return {
        id: item.name,
        path: fullPath,
        url: publicUrl(fullPath),
        name: item.name,
        createdAt: item.created_at || new Date().toISOString(),
      }
    })
}

export async function getModelImages(modelId, type) {
  if (!isConfigured || !supabase) {
    let images = getLocalImages().filter((img) => img.modelId === modelId)
    if (type) images = images.filter((img) => img.type === type)
    return images.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  const types = type ? [type] : ['uploaded', 'edited', 'avatar']
  const results = await Promise.all(
    types.map(async (t) => {
      const items = await listFolder(`models/${modelId}/${t}`)
      return items.map((item) => ({ ...item, modelId, type: t }))
    })
  )

  return results.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function deleteImage(imagePath) {
  if (!isConfigured || !supabase) {
    const images = getLocalImages().filter((img) => img.path !== imagePath)
    saveLocalImages(images)
    return
  }

  const { error } = await supabase.storage.from(BUCKET).remove([imagePath])
  if (error) throw error
}

export async function downloadImage(url, filename) {
  const response = await fetch(url)
  const blob = await response.blob()
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename || 'pear-image.jpg'
  link.click()
  URL.revokeObjectURL(link.href)
}

export async function downloadBulk(images) {
  for (const img of images) {
    await downloadImage(img.url, img.name)
    await new Promise((r) => setTimeout(r, 300))
  }
}
