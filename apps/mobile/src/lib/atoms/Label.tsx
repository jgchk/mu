import type { FC, PropsWithChildren } from 'react'
import { Text } from 'react-native'

const Label: FC<PropsWithChildren> = ({ children }) => {
  return <Text className="text-sm text-gray-400">{children}</Text>
}

export default Label
