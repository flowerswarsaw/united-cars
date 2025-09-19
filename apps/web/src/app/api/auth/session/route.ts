import { NextRequest, NextResponse } from 'next/server'
import { getServerSessionFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSessionFromRequest(request)
    
    if (!session?.user) {
      // In development mode, return a mock admin user if no session exists
      if (process.env.NODE_ENV === 'development') {
        const mockAdminUser = {
          id: 'admin-dev-user',
          email: 'admin@unitedcars.com',
          name: 'Development Admin',
          orgId: 'org-admin',
          orgName: 'United Cars Admin',
          orgType: 'ADMIN',
          roles: ['ADMIN', 'SUPER_ADMIN', 'USER']
        }
        
        return NextResponse.json({
          success: true,
          user: mockAdminUser,
          isDevelopmentMode: true
        })
      }
      
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user: session.user
    })
  } catch (error) {
    console.error('Session fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    )
  }
}