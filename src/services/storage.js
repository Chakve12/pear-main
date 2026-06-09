import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
} from 'firebase/storage'
import { storage, isConfigured } from './firebaseConfig'

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

export async function uploadImage(file, modelId, type = 'uploaded', onProgress) {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  const path = `models/${modelId}/${type}/${id}_${file.name}`

  if (!isConfigured) {
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

  const storageRef = ref(storage, path)
  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
    customMetadata: { modelId, type },
  })

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        onProgress?.(progress)
      },
      reject,
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref)
        resolve({
          id,
          path,
          url,
          name: file.name,
          modelId,
          type,
          size: file.size,
          createdAt: new Date().toISOString(),
        })
      }
    )
  })
}

export async function getModelImages(modelId, type) {
  if (!isConfigured) {
    let images = getLocalImages().filter((img) => img.modelId === modelId)
    if (type) images = images.filter((img) => img.type === type)
    return images.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  const prefix = type
    ? `models/${modelId}/${type}`
    : `models/${modelId}`
  const folderRef = ref(storage, prefix)

  try {
    const result = await listAll(folderRef)
    const urls = await Promise.all(
      result.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef)
        return {
          id: itemRef.name,
          path: itemRef.fullPath,
          url,
          name: itemRef.name,
          modelId,
          type: type || 'uploaded',
          createdAt: new Date().toISOString(),
        }
      })
    )
    return urls
  } catch {
    return []
  }
}

export async function deleteImage(imagePath) {
  if (!isConfigured) {
    const images = getLocalImages().filter((img) => img.path !== imagePath)
    saveLocalImages(images)
    return
  }

  const imageRef = ref(storage, imagePath)
  await deleteObject(imageRef)
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
