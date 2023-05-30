import type { FC, PropsWithChildren } from 'react'
import React, { useCallback, useEffect } from 'react'
import { Button, SafeAreaView, Text, TextInput } from 'react-native'

import { trpc } from '../../lib/trpc'

const Login = () => {
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')

  useEffect(() => console.log({ username, password }), [username, password])

  const { mutate } = trpc.accounts.login.useMutation()
  const handleLogin = useCallback(() => {
    mutate({ username, password }, { onSuccess: (data) => console.log(data) })
  }, [username, password])

  return (
    <SafeAreaView>
      <Label>Username</Label>
      <TextInput className="bg-gray-800 text-white" value={username} onChangeText={setUsername} />

      <Label>Password</Label>
      <TextInput
        className="bg-gray-800 text-white"
        value={password}
        onChangeText={setPassword}
        autoComplete="password"
        secureTextEntry
      />

      <Button title="Login" onPress={handleLogin} />
    </SafeAreaView>
  )
}

const Label: FC<PropsWithChildren> = ({ children }) => {
  return <Text className="font-semibold italic text-gray-700">{children}</Text>
}

export default Login
