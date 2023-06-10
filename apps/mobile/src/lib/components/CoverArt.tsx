import type { FC } from 'react'
import { useState } from 'react'
import FastImage from 'react-native-fast-image'

import { tw } from '../classes'
import { useAuthToken } from '../contexts/AuthContext'
import { getBaseUrl } from '../url'

export type CoverArtProps = {
  src?: string
  className?: string
  size: number
}

const CoverArt: FC<CoverArtProps> = ({ src, className, size }) => {
  const [, setLoaded] = useState(false)
  const token = useAuthToken()

  if (!src) return null

  return (
    <FastImage
      source={{
        uri: `${getBaseUrl()}${src}`,
        headers: token.status === 'loaded' ? { Cookie: `session_token=${token.value}` } : {},
      }}
      onLoad={() => setLoaded(true)}
      onError={() => console.log('error loading')}
      className={tw(className)}
      style={{ width: size, height: size }}
    />
  )
}

export default CoverArt
