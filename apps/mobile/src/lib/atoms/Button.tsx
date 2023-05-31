import type { FC } from 'react'
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'

import { cn } from '../classes'

const Button: FC<{
  kind?: 'solid' | 'outline' | 'text'
  onPress?: () => void
  loading?: boolean
  title?: string
  disabled?: boolean
}> = ({ kind = 'solid', onPress, loading, title, disabled }) => (
  <TouchableOpacity onPress={onPress} disabled={disabled}>
    <View
      className={cn(
        'flex flex-row items-center justify-center rounded border px-2 py-1',

        kind === 'solid' &&
          cn(
            'hover:bg-primary-600 border-transparent',
            disabled ? 'bg-gray-500' : 'bg-primary-500'
          ),
        kind === 'outline' &&
          cn('bg-transparent', disabled ? 'border-gray-500' : 'border-primary-500'),
        kind === 'text' && cn('border-transparent bg-transparent')
      )}
    >
      {loading && <ActivityIndicator size="small" color="black" className="mr-2" />}
      <Text
        className={cn(
          'text-sm font-medium',
          kind === 'solid' && cn(disabled ? 'text-gray-700' : 'text-black'),
          kind === 'outline' && cn(disabled ? 'text-gray-500' : 'text-primary-500'),
          kind === 'text' && cn(disabled ? 'text-gray-500' : 'text-primary-500')
        )}
      >
        {title}
      </Text>
    </View>
  </TouchableOpacity>
)

export default Button
