import { Redirect, Slot, usePathname } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { getToken } from '../lib/storage'
import { TRPCProvider } from '../lib/trpc'

const AuthRedirect: FC<{ token?: string | null }> = ({ token }) => {
  const pathname = usePathname()
  console.log({ pathname, token })

  if (token === null) {
    return <Redirect href="/login" />
  }

  if (token && (pathname === '/' || pathname === '/--')) {
    return <Redirect href="/tracks" />
  }

  return null
}

const Wrapper = () => {
  const [token, setToken] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    void getToken().then((token) => setToken(token))
  }, [])

  return (
    <TRPCProvider token={token ?? undefined}>
      <SafeAreaProvider>
        <StatusBar />
        <Slot />
        <AuthRedirect token={token} />
      </SafeAreaProvider>
    </TRPCProvider>
  )
}

export default Wrapper
