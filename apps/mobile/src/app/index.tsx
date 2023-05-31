import { Link, Tabs } from 'expo-router'
import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const Index = () => {
  return (
    <SafeAreaView>
      <Tabs.Screen options={{ title: 'Home' }} />

      <View className="h-full w-full p-4">
        <Text className="mx-auto pb-2 text-5xl font-bold text-white">
          Create <Text className="text-pink-400">T3</Text> Turbo
        </Text>

        <View className="py-2">
          <Text className="font-semibold italic text-white">Press on a post</Text>
        </View>

        <Link href="/login" className="text-white">
          Login
        </Link>
      </View>
    </SafeAreaView>
  )
}

export default Index
