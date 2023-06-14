import { create } from 'zustand'

export type AuthContext = {
  token: TokenState
  setToken: (token: TokenState) => void
}
export type TokenState =
  | { status: 'loading' }
  | { status: 'none' }
  | { status: 'loaded'; value: string }

export const useAuth = create<AuthContext>((set) => ({
  token: { status: 'loading' },
  setToken: (token) => set({ token }),
}))

export const useAuthToken = () => useAuth((state) => state.token)
