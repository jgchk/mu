import { makeWorker } from 'services'
import superjson from 'superjson'
import { parentPort as parentPort_ } from 'worker_threads'

if (parentPort_ === null) {
  throw new Error('parentPort is null')
}
const parentPort = parentPort_

const worker = await makeWorker()

parentPort.on('message', (message) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  worker.handleMessage(message, (response) => parentPort.postMessage(superjson.stringify(response)))
})
