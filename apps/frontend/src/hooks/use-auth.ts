'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

type User = { id: string; email: string; name: string }

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Try to get user from session by fetching profile
    api.user.getProfile()
      .then((data) => {
        if (data.user) {
          setUser({ id: data.user.id, email: data.user.email, name: data.user.name })
        } else {
          setUser(null)
        }
      })
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

