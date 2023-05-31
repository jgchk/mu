import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { TRPCProvider } from '../lib/trpc'

// This is the main layout of the app
// It wraps your pages with the providers they need
const RootLayout = () => {
  return (
    <TRPCProvider>
      <SafeAreaProvider>
        <View className="flex-1">
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: '#f472b6',
              },
            }}
          />
          <StatusBar />
        </View>
      </SafeAreaProvider>
    </TRPCProvider>
  )
}

export default RootLayout
