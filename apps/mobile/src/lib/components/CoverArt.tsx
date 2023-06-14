import type { FC } from 'react'
import { useState } from 'react'
import { View } from 'react-native'
import type { StyleProp } from 'react-native'
import type { ImageStyle } from 'react-native-fast-image'
import FastImage from 'react-native-fast-image'

import { cn } from '../classes'
import { useAuthToken } from '../contexts/AuthContext'
import { getBaseUrl } from '../url'

export type CoverArtProps = {
  src?: string
  className?: string
  style?: StyleProp<ImageStyle>
  rounding?: string
}

const CoverArt: FC<CoverArtProps> = ({ src, style, rounding = 'rounded' }) => {
  const [, setLoaded] = useState(false)
  const token = useAuthToken()

  return (
    <View className={cn('relative aspect-square w-full shadow', rounding)} style={style}>
      {src ? (
        <FastImage
          source={{
            uri: `${getBaseUrl()}${src}`,
            headers: token.status === 'loaded' ? { Cookie: `session_token=${token.value}` } : {},
          }}
          onLoad={() => setLoaded(true)}
          onError={() => console.log('error loading')}
          className={cn('h-full w-full', rounding)}
        />
      ) : (
        <View className={cn('h-full w-full bg-gray-800', rounding)} />
      )}
      <View
        className={cn('absolute left-0 top-0 h-full w-full border', rounding)}
        style={{ borderColor: '#FFFFFF33' }}
      />
    </View>
  )
}

export default CoverArt
