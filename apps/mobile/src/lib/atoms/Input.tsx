import type { ComponentProps, FC } from 'react'
import { TextInput } from 'react-native'

const Input: FC<ComponentProps<typeof TextInput>> = (props) => (
  <TextInput className="rounded bg-gray-700 px-2 py-1 text-white" {...props} />
)

export default Input
