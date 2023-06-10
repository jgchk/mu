import { Redirect, Slot, usePathname } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import type { AuthContext } from '../lib/contexts/AuthContext'
import { AuthProvider } from '../lib/contexts/AuthContext'
import { getToken } from '../lib/storage'
import { TRPCProvider } from '../lib/trpc'

const AuthRedirect: FC<AuthContext> = ({ token }) => {
  const pathname = usePathname()

  if (token.status === 'none') {
    return <Redirect href="/login" />
  }

  if (token.status === 'loaded' && (pathname === '/' || pathname === '/--')) {
    return <Redirect href="/tracks" />
  }

  return null
}

const Wrapper = () => {
  const [token, setToken] = useState<AuthContext['token']>({ status: 'loading' })

  useEffect(() => {
    void getToken().then((token) => {
      if (token === null) {
        setToken({ status: 'none' })
      } else {
        setToken({ status: 'loaded', value: token })
      }
    })
  }, [])

  return (
    <AuthProvider token={token}>
      <TRPCProvider token={token}>
        <SafeAreaProvider>
          <StatusBar />
          <Slot />
          <AuthRedirect token={token} />
        </SafeAreaProvider>
      </TRPCProvider>
    </AuthProvider>
  )
}

export default Wrapper
