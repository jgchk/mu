import { Redirect, Slot, usePathname } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import type { FC } from 'react'
import { useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { useAuth, useAuthToken } from '../lib/contexts/AuthContext'
import { getToken } from '../lib/storage'
import { TRPCProvider } from '../lib/trpc'

const AuthRedirect: FC = () => {
  const token = useAuthToken()
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
  const setToken = useAuth((state) => state.setToken)

  useEffect(() => {
    void getToken().then((token) => {
      if (token === null) {
        setToken({ status: 'none' })
      } else {
        setToken({ status: 'loaded', value: token })
      }
    })
  }, [setToken])

  return (
    <TRPCProvider>
      <SafeAreaProvider>
        <StatusBar />
        <Slot />
        <AuthRedirect />
      </SafeAreaProvider>
    </TRPCProvider>
  )
}

export default Wrapper
