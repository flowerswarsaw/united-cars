import { NextRequest, NextResponse } from 'next/server';
import { getCRMUser } from '@/lib/crm-auth';
import {
  isTwilioConfigured,
  generateTwilioAccessToken,
  getTwilioCallerId
} from '@/lib/services/twilio-service';

/**
 * POST /api/crm/calls/token
 * Generate Twilio access token for browser-based calling
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Extract user session
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    // 2. Check if Twilio is configured
    if (!isTwilioConfigured()) {
      return NextResponse.json(
        {
          error: 'Twilio not configured',
          details: 'Please configure Twilio environment variables to enable calling'
        },
        { status: 503 }
      );
    }

    // 3. Generate access token with user ID as identity
    const token = generateTwilioAccessToken({
      identity: user.id,
      ttlSeconds: 3600, // 1 hour
    });

    // 4. Return token and configuration
    return NextResponse.json({
      token,
      identity: user.id,
      callerId: getTwilioCallerId(),
      expiresIn: 3600,
    });
  } catch (error: any) {
    console.error('Failed to generate Twilio token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token', details: error.message },
      { status: 500 }
    );
  }
}
