import { supabase } from '@/api/supabase'

export type UploadOptions = {
  bucket: string
  folder?: string
  fileName?: string
  allowedTypes?: string[]
  maxSizeInMB?: number
}

export type UploadResult = {
  url: string
  path: string
  fileName: string
}

export class StorageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StorageError'
  }
}

/**
 * Dosya yükleme utility fonksiyonu
 */
export async function uploadFile(file: File, options: UploadOptions): Promise<UploadResult> {
  // Dosya tipi kontrolü
  if (options.allowedTypes && options.allowedTypes.length > 0) {
    const isAllowed = options.allowedTypes.some(type => {
      if (type === '*/*') return true
      if (type.endsWith('/*')) {
        // image/* veya video/* gibi wildcard'lar için
        const baseType = type.replace('/*', '/')
        return file.type.startsWith(baseType)
      }
      // Tam eşleşme veya uzantı kontrolü
      return file.type === type || file.name.toLowerCase().endsWith(type.replace('*', ''))
    })
    if (!isAllowed) {
      throw new StorageError(`Desteklenmeyen dosya tipi. İzin verilen tipler: ${options.allowedTypes.join(', ')}`)
    }
  }

  // Dosya boyutu kontrolü
  if (options.maxSizeInMB) {
    const maxSizeInBytes = options.maxSizeInMB * 1024 * 1024
    if (file.size > maxSizeInBytes) {
      throw new StorageError(`Dosya boyutu ${options.maxSizeInMB}MB'dan büyük olamaz`)
    }
  }

  // Dosya adı oluştur
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const fileExtension = file.name.split('.').pop()
  const fileName = options.fileName || `${timestamp}_${randomString}.${fileExtension}`

  // Dosya yolu oluştur
  const filePath = options.folder ? `${options.folder}/${fileName}` : fileName

  try {
    // Dosyayı Supabase Storage'a yükle
    const { data, error } = await supabase.storage
      .from(options.bucket)
      .upload(filePath, file, {
        upsert: false,
        cacheControl: '3600'
      })

    if (error) {
      throw new StorageError(`Dosya yükleme hatası: ${error.message}`)
    }

    // Public URL al
    const { data: urlData } = supabase.storage
      .from(options.bucket)
      .getPublicUrl(data.path)

    return {
      url: urlData.publicUrl,
      path: data.path,
      fileName: fileName
    }
  } catch (error) {
    if (error instanceof StorageError) {
      throw error
    }
    throw new StorageError(`Beklenmeyen hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`)
  }
}

/**
 * Dosya silme utility fonksiyonu
 */
export async function deleteFile(bucket: string, filePath: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) {
      throw new StorageError(`Dosya silme hatası: ${error.message}`)
    }
  } catch (error) {
    if (error instanceof StorageError) {
      throw error
    }
    throw new StorageError(`Beklenmeyen hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`)
  }
}

/**
 * Dosya URL'ini al utility fonksiyonu
 */
export function getFileUrl(bucket: string, filePath: string): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath)
  
  return data.publicUrl
}

/**
 * Resim yükleme için özel fonksiyon
 */
export async function uploadImage(
  file: File, 
  folder: string = 'images',
  maxSizeInMB: number = 5
): Promise<UploadResult> {
  return uploadFile(file, {
    bucket: 'nappsa-images',
    folder,
    allowedTypes: ['image/*'],
    maxSizeInMB
  })
}

/**
 * Video yükleme için özel fonksiyon
 */
export async function uploadVideo(
  file: File, 
  folder: string = 'videos',
  maxSizeInMB: number = 100
): Promise<UploadResult> {
  return uploadFile(file, {
    bucket: 'nappsa-videos',
    folder,
    allowedTypes: ['video/*'],
    maxSizeInMB
  })
}

/**
 * Doküman yükleme için özel fonksiyon
 */
export async function uploadDocument(
  file: File, 
  folder: string = 'documents',
  maxSizeInMB: number = 10
): Promise<UploadResult> {
  return uploadFile(file, {
    bucket: 'nappsa-documents',
    folder,
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ],
    maxSizeInMB
  })
}

/**
 * Dosya boyutunu formatla
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Dosya uzantısını al
 */
export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

/**
 * Dosya tipini kontrol et
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/')
}

export function isDocumentFile(file: File): boolean {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
  return documentTypes.includes(file.type)
}
