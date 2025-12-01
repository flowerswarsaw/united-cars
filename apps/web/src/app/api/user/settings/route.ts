import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-service'
import {
  getSession,
  createApiResponse
} from '@/lib/auth-utils'
import {
  withErrorHandler,
  createErrorResponse,
  ErrorCode
} from '@/lib/error-handler'
import { z } from 'zod'
import {
  userProfiles,
  userPreferences,
  companySettings,
  mockDataPersistence
} from '@united-cars/mock-data'

const userSettingsSchema = z.object({
  defaultInsurance: z.string().optional(),
  defaultUsPort: z.string().optional(),
  defaultDestinationPort: z.string().optional(),
})

// GET /api/user/settings - Get user settings
export const GET = withErrorHandler(
  async (request: NextRequest) => {
    const session = await getSession(request)
    if (!session?.user) {
      return createErrorResponse(ErrorCode.UNAUTHORIZED)
    }

    const settings = await db.userSettings.findByUserId(session.user.id)

    return createApiResponse({ 
      settings: settings || {
        defaultInsurance: "1%",
        defaultUsPort: null,
        defaultDestinationPort: null
      }
    })
  },
  { path: '/api/user/settings', method: 'GET' }
)

// PUT /api/user/settings - Update user settings
export const PUT = withErrorHandler(
  async (request: NextRequest) => {
    const session = await getSession(request)
    if (!session?.user) {
      return createErrorResponse(ErrorCode.UNAUTHORIZED)
    }

    const body = await request.json()
    const validatedData = userSettingsSchema.parse(body)

    const settings = await db.userSettings.upsert(session.user.id, validatedData)

    // Persist changes to disk
    await mockDataPersistence.save({
      userProfiles,
      userPreferences,
      companySettings,
      userSettings: db.userSettings.getAll()
    });

    return createApiResponse({ settings })
  },
  { path: '/api/user/settings', method: 'PUT' }
)