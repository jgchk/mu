import fs from 'fs/promises'
import path from 'path'

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

export async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path, fs.constants.F_OK)
    return true
  } catch (error) {
    return false
  }
}
