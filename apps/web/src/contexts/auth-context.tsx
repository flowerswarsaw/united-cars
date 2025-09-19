'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (user: User) => void
  signOut: () => void
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
  isOrganizationMember: (orgId: string) => boolean
  canAccessAdmin: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  signIn: () => {},
  signOut: () => {},
  hasRole: () => false,
  hasAnyRole: () => false,
  isOrganizationMember: () => false,
  canAccessAdmin: false
})

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Mock user for development - in production this would come from server
  const mockUser: User = {
    id: 'user-1',
    email: 'admin@unitedcars.com',
    name: 'System Administrator',
    orgId: 'org-admin',
    orgName: 'United Cars Admin',
    orgType: 'ADMIN',
    roles: ['ADMIN', 'SUPER_ADMIN', 'USER']
  }

  useEffect(() => {
    // Simulate authentication check
    const checkAuth = async () => {
      try {
        // In a real app, this would fetch from /api/auth/session
        const response = await fetch('/api/auth/session')
        if (response.ok) {
          const session = await response.json()
          if (session.user) {
            setUser(session.user)
          } else {
            // For development, set mock user
            setUser(mockUser)
          }
        } else {
          // For development, set mock user
          setUser(mockUser)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        // For development, set mock user
        setUser(mockUser)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const signIn = (userData: User) => {
    setUser(userData)
  }

  const signOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
    } catch (error) {
      console.error('Sign out failed:', error)
    } finally {
      setUser(null)
    }
  }

  const hasRole = (role: string): boolean => {
    return user?.roles.includes(role) ?? false
  }

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => hasRole(role))
  }

  const isOrganizationMember = (orgId: string): boolean => {
    return user?.orgId === orgId
  }

  const canAccessAdmin = hasAnyRole(['ADMIN', 'SUPER_ADMIN'])

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signOut,
    hasRole,
    hasAnyRole,
    isOrganizationMember,
    canAccessAdmin
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}