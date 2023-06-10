import type { FC, PropsWithChildren } from 'react'
import { createContext, useContext } from 'react'

export type AuthContext = {
  token: { status: 'loading' } | { status: 'none' } | { status: 'loaded'; value: string }
}

const AuthContext = createContext<AuthContext>({ token: { status: 'loading' } })

export const AuthProvider: FC<PropsWithChildren<AuthContext>> = ({ children, ...value }) => {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuthToken = () => {
  const { token } = useContext(AuthContext)
  return token
}
