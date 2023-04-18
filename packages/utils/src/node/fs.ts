import fs from 'fs/promises'
import path from 'path'

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath, fs.constants.F_OK)
    return true
  } catch (error) {
    return false
  }
}

export async function dirExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dirPath)
    return stats.isDirectory()
  } catch (error) {
    return false
  }
}

export async function getFileSize(filePath: string): Promise<number> {
  const stats = await fs.stat(filePath)
  return stats.size
}

export async function* walkDir(dir: string): AsyncGenerator<string> {
  const files = await fs.readdir(dir)
  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = await fs.stat(filePath)
    if (stat.isDirectory()) {
      yield* walkDir(filePath) // recursively iterate through subdirectory
    } else {
      yield filePath // yield file path
    }
  }
}
