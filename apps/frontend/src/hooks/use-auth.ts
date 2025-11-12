'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

type User = { id: string; email: string; name: string }

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Try to get user from session
    api.calendars.list()
      .then(() => setUser({ id: 'temp', email: 'temp', name: 'temp' })) // If this succeeds, user is logged in
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.auth.login({ email, password })
    setUser(res.user)
    return res
  }

  const signup = async (email: string, password: string, name: string) => {
    const res = await api.auth.signup({ email, password, name })
    setUser(res.user)
    return res
  }

  const logout = async () => {
    await api.auth.logout()
    setUser(null)
  }

  return { user, loading, login, signup, logout }
}

