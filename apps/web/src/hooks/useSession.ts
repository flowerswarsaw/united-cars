'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  name: string
  email: string
  roles: string[]
  orgId: string
  orgName: string
  orgType: string
}

interface UseSessionReturn {
  user: User | null
  loading: boolean
  error: string | null
}

export function useSession(): UseSessionReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSession()
  }, [])

  const fetchSession = async () => {
    try {
      const response = await fetch('/api/auth/session')

      if (!response.ok) {
        if (response.status === 401) {
          // Redirect to login if not authenticated
          window.location.href = '/login'
          return
        }
        throw new Error('Failed to fetch session')
      }

      const data = await response.json()
      setUser(data.user)
    } catch (err) {
      console.error('Session fetch error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      // For auth errors, redirect to login
      window.location.href = '/login'
    } finally {
      setLoading(false)
    }
  }

  return { user, loading, error }
}