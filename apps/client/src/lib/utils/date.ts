export const getTimeSince = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

  let interval = Math.floor(seconds / 31536000)

  if (interval > 1) {
    return `${interval} years`
  }
  interval = Math.floor(seconds / 2592000)
  if (interval > 1) {
    return `${interval} months`
  }
  interval = Math.floor(seconds / 86400)
  if (interval > 1) {
    return `${interval} days`
  }
  interval = Math.floor(seconds / 3600)
  if (interval > 1) {
    return `${interval} hours`
  }
  interval = Math.floor(seconds / 60)
  if (interval > 1) {
    return `${interval} minutes`
  }
  return `${Math.floor(seconds)} seconds`
}

export const getTimeSinceShort = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

  let interval = Math.floor(seconds / 31536000)

  if (interval > 1) {
    return `${interval}y`
  }
  interval = Math.floor(seconds / 2592000)
  if (interval > 1) {
    return `${interval}mo`
  }
  interval = Math.floor(seconds / 86400)
  if (interval > 1) {
    return `${interval}d`
  }
  interval = Math.floor(seconds / 3600)
  if (interval > 1) {
    return `${interval}h`
  }
  interval = Math.floor(seconds / 60)
  if (interval > 1) {
    return `${interval}m`
  }
  return `${Math.floor(seconds)}s`
}

const formatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'medium' })
export const toPrettyDate = (date: Date) => {
  return formatter.format(date)
}
