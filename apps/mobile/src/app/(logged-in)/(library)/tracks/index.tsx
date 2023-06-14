import { decode } from 'bool-lang'
import { Tabs, useLocalSearchParams } from 'expo-router'
import { makeImageUrl } from 'mutils'
import type { FC } from 'react'
import { useMemo } from 'react'
import { FlatList, SafeAreaView, Text, View } from 'react-native'
import { first, ifDefined } from 'utils'

import Button from '../../../../lib/atoms/Button'
import CoverArt from '../../../../lib/components/CoverArt'
import type { RouterInput } from '../../../../lib/trpc'
import { trpc } from '../../../../lib/trpc'

type TracksSort = NonNullable<RouterInput['tracks']['getAllWithArtistsAndRelease']['sort']>

const TracksPage: FC = () => {
  const {
    favoritesOnly,
    tags: rawTags,
    sort: rawColumn,
    dir: rawDirection,
  } = useLocalSearchParams()

  const tags = useMemo(() => {
    const rawTag = first(rawTags)
    if (!rawTag) return
    return {
      text: rawTag,
      parsed: decode(rawTag),
    }
  }, [rawTags])

  const sort = useMemo(() => {
    const sortColumn = first(rawColumn)
    const sortDirection = first(rawDirection)
    const sort = ifDefined(sortColumn, (column) =>
      ifDefined(sortDirection, (direction) => ({ column, direction } as TracksSort))
    )
    return sort
  }, [rawColumn, rawDirection])

  const query = useMemo(
    () => ({
      limit: 100,
      ...(favoritesOnly ? { favorite: true } : {}),
      ...(tags !== undefined ? { tags: tags.text } : {}),
      ...(sort !== undefined ? { sort } : {}),
    }),
    [favoritesOnly, sort, tags]
  )

  const tracksQuery = trpc.tracks.getAllWithArtistsAndRelease.useInfiniteQuery(query)

  const render = () => {
    if (tracksQuery.data) {
      return (
        <FlatList
          data={tracksQuery.data.pages.flatMap((page) => page.items)}
          renderItem={({ item: track }) => (
            <View className="flex-row items-center gap-x-2 p-1.5">
              <View className="h-11 w-11">
                <CoverArt
                  src={
                    track.imageId !== null ? makeImageUrl(track.imageId, { size: 80 }) : undefined
                  }
                  rounding="rounded-sm"
                />
              </View>
              <View className="flex-col">
                <Text className="text-base text-white">{track.title}</Text>
                <View>
                  {track.artists.map((artist) => (
                    <Text className="text-sm text-gray-400" key={artist.id}>
                      {artist.name}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          )}
          keyExtractor={(track) => track.id.toString()}
        />
      )
    }

    return null
  }

  return (
    <View className="flex flex-1">
      <View className="flex-1">{render()}</View>
      <Button onPress={() => void tracksQuery.refetch()} title="Refetch" />
    </View>
  )
}

const Wrapper = () => (
  <SafeAreaView>
    <Tabs.Screen options={{ title: 'Tracks', headerShown: false }} />

    <View className="flex h-full w-full bg-gray-800 p-4">
      <TracksPage />
    </View>
  </SafeAreaView>
)

export default Wrapper
