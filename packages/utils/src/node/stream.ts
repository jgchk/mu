import { Readable } from 'stream'

export const bufferToStream = (buffer: Buffer): Readable => {
  return new Readable({
    read() {
      this.push(buffer)
      this.push(null)
    },
  })
}
