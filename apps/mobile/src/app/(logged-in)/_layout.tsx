import { Tabs } from 'expo-router'
import { View } from 'react-native'

import Player from '../../lib/components/Player'
import { twConfig } from '../../lib/theme'

const LoggedInLayout = () => (
  <View className="relative flex-1">
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
    <View className="absolute inset-x-1 bottom-[53px] h-fit">
      <Player />
    </View>
  </View>
)

export default LoggedInLayout
