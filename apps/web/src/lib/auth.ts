import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export interface User {
  id: string
  email: string
  name?: string
  orgId: string
  orgName: string
  orgType: string
  roles: string[]
}

export async function getServerSession(): Promise<{ user: User } | null> {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('session')
    
    if (!sessionCookie?.value) {
      return null
    }

    // Decode the session cookie (URL decode)
    const decodedSession = decodeURIComponent(sessionCookie.value)
    const sessionData = JSON.parse(decodedSession)
    
    if (sessionData.user) {
      return { user: sessionData.user }
    }
    
    return null
  } catch (error) {
    console.error('Session parsing error:', error)
    return null
  }
}

// For API routes that need manual request parsing
export async function getServerSessionFromRequest(request: NextRequest): Promise<{ user: User } | null> {
  try {
    const sessionCookie = request.cookies.get('session')
    
    if (!sessionCookie?.value) {
      // In development mode, provide a mock admin user (matches platform DB and CRM seeds)
      if (process.env.NODE_ENV === 'development') {
        const mockAdminUser: User = {
          id: 'admin-user-001',
          email: 'admin@unitedcars.com',
          name: 'System Administrator',
          orgId: 'united-cars',
          orgName: 'United Cars',
          orgType: 'ADMIN',
          roles: ['ADMIN', 'SUPER_ADMIN', 'USER']
        }
        return { user: mockAdminUser }
      }
      return null
    }

    // Decode the session cookie (URL decode)
    const decodedSession = decodeURIComponent(sessionCookie.value)
    const sessionData = JSON.parse(decodedSession)
    
    if (sessionData.user) {
      return { user: sessionData.user }
    }
    
    return null
  } catch (error) {
    console.error('Session parsing error:', error)
    return null
  }
}