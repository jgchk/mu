import { Tabs } from 'expo-router'
import { makeImageUrl } from 'mutils'
import type { FC } from 'react'
import { SafeAreaView, View } from 'react-native'
import { FlatGrid } from 'react-native-super-grid'

import Button from '../../../../lib/atoms/Button'
import CoverArt from '../../../../lib/components/CoverArt'
import { trpc } from '../../../../lib/trpc'

const ReleasesPage: FC = () => {
  const releasesQuery = trpc.releases.getAllWithArtists.useQuery()

  const render = () => {
    if (releasesQuery.data) {
      return (
        <FlatGrid
          itemDimension={128}
          data={releasesQuery.data}
          renderItem={({ item: release }) => (
            <CoverArt
              src={
                release.imageId !== null ? makeImageUrl(release.imageId, { size: 512 }) : undefined
              }
            />
          )}
          keyExtractor={(release) => release.id.toString()}
        />
      )
    }

    return null
  }

  return (
    <View className="flex flex-1">
      <View className="flex-1">{render()}</View>
      <Button onPress={() => void releasesQuery.refetch()} title="Refetch" />
    </View>
  )
}

const Wrapper = () => (
  <SafeAreaView>
    <Tabs.Screen options={{ title: 'Releases', headerShown: false }} />

    <View className="flex h-full w-full bg-gray-800 p-4">
      <ReleasesPage />
    </View>
  </SafeAreaView>
)

export default Wrapper
