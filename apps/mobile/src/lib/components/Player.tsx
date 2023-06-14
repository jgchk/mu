import type { FC } from 'react'
import { View } from 'react-native'

import { usePlayer } from '../contexts/PlayerContext'

const Player: FC = () => {
  const nowPlayingTrack = usePlayer((state) => state.track)

  if (!nowPlayingTrack) return null

  return <View className="h-10 w-full rounded bg-black" />
}

export default Player
