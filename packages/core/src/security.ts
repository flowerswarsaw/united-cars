import { fileTypeFromBuffer } from 'file-type'
import { randomUUID } from 'crypto'
import { join } from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { RateLimiterMemory } from 'rate-limiter-flexible'

// Allowed MIME types for different file categories
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp'
] as const

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf'
] as const

export const ALL_ALLOWED_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_DOCUMENT_TYPES
] as const

export type AllowedMimeType = typeof ALL_ALLOWED_TYPES[number]

// File size limits (in bytes)
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const MAX_FILES_PER_REQUEST = 10

// Rate limiting for file uploads
const uploadRateLimiter = new RateLimiterMemory({
  points: 50, // Number of uploads
  duration: 3600, // Per hour
  blockDuration: 3600, // Block for 1 hour if exceeded
})

export interface FileValidationResult {
  isValid: boolean
  error?: string
  mimeType?: AllowedMimeType
  extension?: string
}

export interface SecureUploadResult {
  filename: string
  originalName: string
  size: number
  mimeType: string
  url: string
  uploadedAt: string
}

/**
 * Validates file content using magic bytes, not file extension or Content-Type header
 */
export async function validateFileContent(
  buffer: Buffer, 
  originalName: string,
  allowedTypes: readonly string[] = ALL_ALLOWED_TYPES
): Promise<FileValidationResult> {
  try {
    // Detect actual MIME type from file content
    const detectedType = await fileTypeFromBuffer(buffer)
    
    if (!detectedType) {
      return {
        isValid: false,
        error: `Unable to determine file type for "${originalName}". Only images and PDFs are allowed.`
      }
    }

    // Check if the detected MIME type is allowed
    if (!allowedTypes.includes(detectedType.mime)) {
      return {
        isValid: false,
        error: `File type "${detectedType.mime}" is not allowed. Only ${allowedTypes.join(', ')} are permitted.`
      }
    }

    return {
      isValid: true,
      mimeType: detectedType.mime as AllowedMimeType,
      extension: detectedType.ext
    }
  } catch (error) {
    return {
      isValid: false,
      error: `File validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Sanitizes filename to prevent path traversal and other attacks
 */
export function sanitizeFilename(originalName: string, extension?: string): string {
  // Generate UUID filename to prevent collisions and path traversal
  const uuid = randomUUID()
  
  // Use detected extension if available, otherwise try to extract from original name
  const ext = extension || originalName.split('.').pop()?.toLowerCase() || 'bin'
  
  return `${uuid}.${ext}`
}

/**
 * Rate limit check for file uploads
 */
export async function checkUploadRateLimit(identifier: string): Promise<{ allowed: boolean; error?: string }> {
  try {
    await uploadRateLimiter.consume(identifier)
    return { allowed: true }
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1
    return { 
      allowed: false, 
      error: `Too many upload attempts. Try again in ${secs} seconds.` 
    }
  }
}

/**
 * Securely process and save uploaded files
 */
export async function processSecureUpload(
  file: File,
  uploadPath: string,
  allowedTypes: readonly string[] = ALL_ALLOWED_TYPES,
  rateLimitId?: string
): Promise<SecureUploadResult> {
  // Rate limiting check
  if (rateLimitId) {
    const rateCheck = await checkUploadRateLimit(rateLimitId)
    if (!rateCheck.allowed) {
      throw new Error(rateCheck.error!)
    }
  }

  // File size validation
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File "${file.name}" is too large. Maximum size is ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB.`)
  }

  if (file.size === 0) {
    throw new Error(`File "${file.name}" is empty.`)
  }

  // Get file buffer for content validation
  const buffer = Buffer.from(await file.arrayBuffer())
  
  // Validate file content using magic bytes
  const validation = await validateFileContent(buffer, file.name, allowedTypes)
  if (!validation.isValid) {
    throw new Error(validation.error!)
  }

  // Generate secure filename
  const secureFilename = sanitizeFilename(file.name, validation.extension)
  const fullPath = join(uploadPath, secureFilename)

  // Ensure upload directory exists
  await mkdir(uploadPath, { recursive: true })

  // Save file
  await writeFile(fullPath, buffer)

  // Return upload result
  return {
    filename: secureFilename,
    originalName: file.name,
    size: file.size,
    mimeType: validation.mimeType!,
    url: `/uploads/${uploadPath.split('/uploads/')[1]}/${secureFilename}`,
    uploadedAt: new Date().toISOString()
  }
}

/**
 * Anti-virus scan stub (always returns clean in development)
 */
export async function scanFileForViruses(filePath: string): Promise<{ clean: boolean; threat?: string }> {
  // In development, always return clean
  // In production, this would integrate with ClamAV, VirusTotal, etc.
  return { clean: true }
}

/**
 * Generate safe Content-Disposition header for file downloads
 */
export function createSafeDownloadHeaders(filename: string, mimeType: string) {
  // Sanitize filename for download header
  const safeFilename = filename.replace(/[^\w.-]/g, '_')
  
  return {
    'Content-Type': mimeType,
    'Content-Disposition': `inline; filename="${safeFilename}"`,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'private, max-age=31536000'
  }
}