import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/lib/api'
import Cookies from 'js-cookie'

interface User {
  id: string | number
  name: string
  email: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  startDemoSession: () => Promise<void>
  initializeSession: () => Promise<void>
  logout: () => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      
      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await api.post('/auth/login', { email, password })
          const { user, token } = response.data
          
          // Store token in cookie
          Cookies.set('token', token, { expires: 7 })
          
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },
      
      register: async (name: string, email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await api.post('/auth/register', { name, email, password })
          const { user, token } = response.data
          
          // Store token in cookie
          Cookies.set('token', token, { expires: 7 })
          
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },
      
      startDemoSession: async () => {
        // Only create new session if no token exists
        const existingToken = Cookies.get('token')
        if (existingToken) {
          // Already have a session, don't create new one
          return
        }
        
        set({ isLoading: true })
        try {
          const response = await api.post('/auth/demo')
          const { user, token } = response.data
          
          // Store token in cookie
          Cookies.set('token', token, { expires: 7 })
          
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },
      
      initializeSession: async () => {
        const token = Cookies.get('token')
        const state = useAuthStore.getState()
        
        if (!token && !state.user) {
          // No token and no user - start fresh demo session
          try {
            await state.startDemoSession()
          } catch (error) {
            console.error('Failed to start demo session:', error)
          }
        }
        // If we have a token, the API will use it automatically
      },
      
      logout: () => {
        Cookies.remove('token')
        set({ 
          user: null, 
          isAuthenticated: false 
        })
      },
      
      setUser: (user: User) => {
        set({ user, isAuthenticated: true })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
)