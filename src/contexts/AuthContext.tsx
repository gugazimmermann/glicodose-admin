import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type AuthContextValue = {
  session: Session | null
  user: User | null
  isAdmin: boolean
  loading: boolean
  authError: string | null
  clearAuthError: () => void
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function checkIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return Boolean(data)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  const clearAuthError = useCallback(() => setAuthError(null), [])

  const resolveAdmin = useCallback(async (nextSession: Session | null) => {
    if (!nextSession?.user) {
      setIsAdmin(false)
      return
    }

    try {
      const allowed = await checkIsAdmin(nextSession.user.id)
      if (!allowed) {
        await supabase.auth.signOut()
        setSession(null)
        setIsAdmin(false)
        setAuthError('Esta conta não tem permissão de administrador.')
        return
      }
      setIsAdmin(true)
    } catch {
      await supabase.auth.signOut()
      setSession(null)
      setIsAdmin(false)
      setAuthError('Não foi possível verificar permissões de administrador.')
    }
  }, [])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      setSession(data.session)
      await resolveAdmin(data.session)
      if (mounted) setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        if (!mounted) return
        setSession(nextSession)
        await resolveAdmin(nextSession)
        if (mounted) setLoading(false)
      },
    )

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [resolveAdmin])

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setIsAdmin(false)
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isAdmin,
      loading,
      authError,
      clearAuthError,
      signIn,
      signOut,
    }),
    [
      session,
      isAdmin,
      loading,
      authError,
      clearAuthError,
      signIn,
      signOut,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
