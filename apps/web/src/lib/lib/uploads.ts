import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

const UPLOAD_BASE_DIR = path.join(process.cwd(), 'uploads')

export async function ensureUploadDir(subDir: string): Promise<string> {
  const uploadDir = path.join(UPLOAD_BASE_DIR, subDir)
  await fs.mkdir(uploadDir, { recursive: true })
  return uploadDir
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 255)
}

export function generateUniqueFilename(originalFilename: string): string {
  const ext = path.extname(originalFilename)
  const base = path.basename(originalFilename, ext)
  const sanitizedBase = sanitizeFilename(base)
  return `${sanitizedBase}_${randomUUID()}${ext}`
}

export async function saveUploadedFile(
  buffer: Buffer,
  originalFilename: string,
  subDir: string
): Promise<{ filepath: string; filename: string }> {
  const uploadDir = await ensureUploadDir(subDir)
  const filename = generateUniqueFilename(originalFilename)
  const filepath = path.join(uploadDir, filename)
  
  await fs.writeFile(filepath, buffer)
  
  return {
    filepath: path.relative(UPLOAD_BASE_DIR, filepath),
    filename
  }
}

export function getUploadPath(relativePath: string): string {
  return path.join(UPLOAD_BASE_DIR, relativePath)
}

export async function fileExists(relativePath: string): Promise<boolean> {
  try {
    const fullPath = getUploadPath(relativePath)
    await fs.access(fullPath)
    return true
  } catch {
    return false
  }
}

export function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.txt': 'text/plain',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
  
  return mimeTypes[ext] || 'application/octet-stream'
}