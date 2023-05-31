import { Tabs } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { twConfig } from '../lib/theme'
import { TRPCProvider } from '../lib/trpc'

// This is the main layout of the app
// It wraps your pages with the providers they need
const RootLayout = () => {
  return (
    <TRPCProvider>
      <SafeAreaProvider>
        <StatusBar />
        <Tabs
          screenOptions={{
            headerStyle: { backgroundColor: '#000', shadowColor: '#000' },
            headerTitleStyle: { color: '#fff' },
            tabBarActiveTintColor: twConfig.theme.colors.primary[500],
            tabBarStyle: {
              backgroundColor: twConfig.theme?.colors.gray[800],
              borderTopColor: twConfig.theme?.colors.gray[800],
            },
            tabBarLabelStyle: {
              fontWeight: '500',
            },
          }}
        />
      </SafeAreaProvider>
    </TRPCProvider>
  )
}

export default RootLayout
