import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  // Auth actions
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  // Internal
  setSession: (session: Session | null) => void
  initializeSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, _get) => ({
  user: null,
  session: null,
  isLoading: true,

  setSession: (session) => {
    set({ session, user: session?.user ?? null, isLoading: false })
  },

  initializeSession: async () => {
    set({ isLoading: true })
    const { data: { session } } = await supabase.auth.getSession()
    set({ session, user: session?.user ?? null, isLoading: false })

    // Listen for auth changes (login, logout, token refresh)
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null })
    })
  },

  signInWithGoogle: async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
  },

  signInWithEmail: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  },

  signUpWithEmail: async (email, password, name) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    })
    if (error) throw error
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },
}))
