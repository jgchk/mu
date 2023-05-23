export const getHost = () => {
  const serverHost = process.env.SERVER_HOST
  const serverPort = process.env.SERVER_PORT
  if (!serverHost) {
    throw new Error('SERVER_HOST not set')
  }
  if (!serverPort) {
    throw new Error('SERVER_PORT not set')
  }
  return `http://${serverHost}:${serverPort}`
}
