import type { BinaryLike } from 'crypto'
import type { Database } from 'db'
import fs from 'fs/promises'
import path from 'path'
import { ensureDir, md5 } from 'utils/node'

export class ImageManager {
  imagesDir: string
  db: Database

  constructor(opts: { imagesDir: string; db: Database }) {
    this.imagesDir = opts.imagesDir
    this.db = opts.db
  }

  getImagePath(id: number) {
    return path.resolve(path.join(this.imagesDir, id.toString()))
  }

  async getImage(data: BinaryLike) {
    const hash = md5(data)
    const existingImage = this.db.images.findHash(hash)
    if (existingImage) {
      return existingImage
    }

    const newImage = this.db.images.insert({ hash })

    const imagePath = this.getImagePath(newImage.id)
    await ensureDir(path.dirname(imagePath))
    await fs.writeFile(imagePath, data)

    return newImage
  }

  async getImageFromFile(filePath: string) {
    const data = await fs.readFile(filePath)
    return this.getImage(data)
  }

  async cleanupImage(id: number) {
    const numUses = this.db.images.getNumberOfUses(id)
    if (numUses === 0) {
      this.db.images.delete(id)
      await fs.rm(this.getImagePath(id))
    }
  }
}
