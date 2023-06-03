import AsyncStorage from '@react-native-async-storage/async-storage'

const TOKEN_KEY = 'token'
export const setToken = (token: string) => setStringData(TOKEN_KEY, token)
export const getToken = () => getStringData(TOKEN_KEY)

export const setStringData = (key: string, value: string) => AsyncStorage.setItem(key, value)
export const getStringData = (key: string) => AsyncStorage.getItem(key)
