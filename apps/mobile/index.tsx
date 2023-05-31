import { registerRootComponent } from 'expo'
import { ExpoRoot } from 'expo-router'

// Must be exported or Fast Refresh won't update the context
export function App() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const ctx = require.context('./src/app')
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  return <ExpoRoot context={ctx} />
}

registerRootComponent(App)
