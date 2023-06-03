import { Tabs } from 'expo-router'

import { twConfig } from '../../lib/theme'

const LoggedInLayout = () => (
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
)

export default LoggedInLayout
