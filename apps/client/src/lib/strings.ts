export const addedToDownloads = (title: string | undefined) =>
  title ? `Added "${title}" to download queue!` : 'Added to download queue!'
