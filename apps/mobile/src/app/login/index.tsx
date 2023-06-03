import { Tabs } from 'expo-router'
import { useCallback, useState } from 'react'
import { SafeAreaView, View } from 'react-native'

import Button from '../../lib/atoms/Button'
import Input from '../../lib/atoms/Input'
import InputGroup from '../../lib/atoms/InputGroup'
import Label from '../../lib/atoms/Label'
import { setToken } from '../../lib/storage'
import { trpc } from '../../lib/trpc'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const { mutate, isLoading } = trpc.accounts.login.useMutation()
  const handleLogin = useCallback(() => {
    mutate(
      { username, password },
      {
        onSuccess: (data) => {
          void setToken(data.token)
        },
      }
    )
  }, [mutate, username, password])

  return (
    <SafeAreaView>
      <Tabs.Screen options={{ title: 'Login', headerShown: false }} />

      <View className="flex h-full w-full justify-center bg-gray-800 p-4">
        <InputGroup className="mb-2">
          <Label>Username</Label>
          <Input value={username} onChangeText={setUsername} autoComplete="username" autoFocus />
        </InputGroup>

        <InputGroup className="mb-4">
          <Label>Password</Label>
          <Input
            value={password}
            onChangeText={setPassword}
            autoComplete="password"
            secureTextEntry
          />
        </InputGroup>

        <Button
          title="Login"
          onPress={handleLogin}
          disabled={username.length === 0 || password.length === 0}
          loading={isLoading}
        />
      </View>
    </SafeAreaView>
  )
}

export default Login
