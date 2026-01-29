import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { authApi, type User } from '../services/api'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  register: (data: {
    username?: string
    email: string
    password: string
    password_confirm?: string
    first_name?: string
    last_name?: string
  }) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const queryClient = useQueryClient()

  // Initialize CSRF token on app load
  useEffect(() => {
    // Fetch CSRF token to ensure it's set in cookies
    axios.get('/api/auth/csrf-token/', { withCredentials: true }).catch(() => {
      // Ignore errors, token might already be set
    })
  }, [])

  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  useEffect(() => {
    if (currentUser !== undefined) {
      setUser(currentUser)
    }
  }, [currentUser])

  const loginMutation = useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      authApi.login(username, password),
    onSuccess: (data) => {
      setUser(data.user)
      queryClient.setQueryData(['currentUser'], data.user)
    },
  })

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: async (data) => {
      // Set user from response immediately
      setUser(data.user)
      queryClient.setQueryData(['currentUser'], data.user)
      // Refetch current user to ensure session is properly established
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] })
    },
    onError: (error: any) => {
      console.error('Registration mutation error:', error)
      // Error is handled in the RegisterPage component
    },
  })

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      setUser(null)
      queryClient.setQueryData(['currentUser'], null)
      queryClient.clear()
    },
  })

  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ username, password })
  }

  const register = async (data: {
    username?: string
    email: string
    password: string
    password_confirm?: string
    first_name?: string
    last_name?: string
  }) => {
    await registerMutation.mutateAsync(data as any)
  }

  const logout = async () => {
    await logoutMutation.mutateAsync()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isLoading || loginMutation.isPending || registerMutation.isPending || logoutMutation.isPending,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

