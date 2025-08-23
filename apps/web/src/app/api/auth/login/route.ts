import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user with org and roles
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        org: true,
        roles: {
          include: {
            role: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create session data (in real app, use proper session management)
    const sessionData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        orgId: user.orgId,
        orgName: user.org.name,
        orgType: user.org.type,
        roles: user.roles.map(ur => ur.role.key)
      }
    }

    // Set session cookie (simplified - use proper session management in production)
    const response = NextResponse.json({ 
      success: true, 
      message: 'Login successful',
      user: sessionData.user
    })
    
    response.cookies.set('session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}