export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })

export const base64ToBlob = (base64String: string) => {
  const arr = base64String.split(',')
  let mime: string | undefined
  let bstr: string
  if (arr.length === 1) {
    bstr = atob(arr[0])
  } else if (arr.length > 1) {
    mime = arr[0].match(/:(.*?);/)?.[1]
    bstr = atob(arr[1])
  } else {
    throw new Error('Invalid base64 string')
  }
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

export const base64ToFile = (base64String: string, filename: string) => {
  const blob = base64ToBlob(base64String)
  return new File([blob], filename, { type: blob.type })
}

export const isFile = (file: File | unknown): file is File => file instanceof File
