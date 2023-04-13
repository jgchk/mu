import fs from 'fs/promises'

export async function getFileSize(filePath: string): Promise<number> {
  const stats = await fs.stat(filePath)
  return stats.size
}
