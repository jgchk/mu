import { decode } from 'bool-lang'
import { Tabs, useLocalSearchParams } from 'expo-router'
import { makeImageUrl } from 'mutils'
import type { FC } from 'react'
import { Fragment, useMemo } from 'react'
import { SafeAreaView, View } from 'react-native'
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
        <View>
          {tracksQuery.data.pages.map((page) => (
            <Fragment key={page.nextCursor ?? 'end'}>
              {page.items.map((track) => (
                <CoverArt
                  key={track.id}
                  src={
                    track.imageId !== null ? makeImageUrl(track.imageId, { size: 80 }) : undefined
                  }
                />
              ))}
            </Fragment>
          ))}
        </View>
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
