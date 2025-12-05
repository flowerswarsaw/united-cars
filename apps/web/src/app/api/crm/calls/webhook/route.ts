import { NextRequest, NextResponse } from 'next/server';
import { callRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { CallStatus } from '@united-cars/crm-core';
import { broadcastCallStatusChanged } from '@/lib/crm-events';

/**
 * Twilio Status Callback Webhook
 *
 * This endpoint receives call status updates from Twilio.
 * Configure this URL as the StatusCallback in your Twilio TwiML App or when making calls.
 *
 * Twilio sends these status events:
 * - queued: Call is queued
 * - ringing: Call is ringing
 * - in-progress: Call was answered and is ongoing
 * - completed: Call ended normally
 * - busy: Called party was busy
 * - no-answer: Called party didn't answer
 * - canceled: Call was cancelled
 * - failed: Call failed to connect
 *
 * @see https://www.twilio.com/docs/voice/api/call-resource#statuscallback
 */

// Map Twilio statuses to our CallStatus enum
function mapTwilioStatus(twilioStatus: string): CallStatus {
  switch (twilioStatus.toLowerCase()) {
    case 'queued':
      return CallStatus.QUEUED;
    case 'ringing':
      return CallStatus.RINGING;
    case 'in-progress':
      return CallStatus.IN_PROGRESS;
    case 'completed':
      return CallStatus.COMPLETED;
    case 'busy':
      return CallStatus.BUSY;
    case 'no-answer':
      return CallStatus.NO_ANSWER;
    case 'canceled':
      return CallStatus.CANCELLED;
    case 'failed':
      return CallStatus.FAILED;
    default:
      return CallStatus.QUEUED;
  }
}

/**
 * POST /api/crm/calls/webhook
 * Receive status updates from Twilio
 */
export async function POST(request: NextRequest) {
  try {
    // Twilio sends data as application/x-www-form-urlencoded
    const formData = await request.formData();

    // Extract Twilio call parameters
    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const direction = formData.get('Direction') as string;
    const duration = formData.get('CallDuration') as string;
    const parentCallSid = formData.get('ParentCallSid') as string;

    // Optional error information
    const errorCode = formData.get('ErrorCode') as string;
    const errorMessage = formData.get('ErrorMessage') as string;

    console.log(`[Twilio Webhook] Status update - CallSid: ${callSid}, Status: ${callStatus}`);

    if (!callSid || !callStatus) {
      return NextResponse.json(
        { error: 'Missing required parameters: CallSid or CallStatus' },
        { status: 400 }
      );
    }

    // Find the call by Twilio's CallSid (stored as providerCallId)
    // We need to search through calls since we don't have a direct lookup
    const allCalls = await callRepository.getAll('united-cars');
    const call = allCalls.find(c => c.providerCallId === callSid || c.providerCallId === parentCallSid);

    if (!call) {
      // Call not found - this could be a new inbound call or a call we didn't track
      console.log(`[Twilio Webhook] Call not found for CallSid: ${callSid}`);

      // For now, just acknowledge the webhook
      // In the future, we could create a new call record for inbound calls
      return NextResponse.json({
        received: true,
        message: 'Call not found in our system',
        callSid
      });
    }

    // Build update data
    const updateData: Record<string, any> = {
      status: mapTwilioStatus(callStatus),
    };

    // Add duration if call completed
    if (duration) {
      updateData.durationSec = parseInt(duration, 10);
    }

    // Handle status-specific updates
    const status = callStatus.toLowerCase();
    if (status === 'in-progress' && !call.startedAt) {
      updateData.startedAt = new Date();
    }

    if (['completed', 'busy', 'no-answer', 'canceled', 'failed'].includes(status) && !call.endedAt) {
      updateData.endedAt = new Date();
    }

    // Log error information if present
    if (errorCode || errorMessage) {
      console.log(`[Twilio Webhook] Call error - Code: ${errorCode}, Message: ${errorMessage}`);
      updateData.notes = call.notes
        ? `${call.notes}\n[Error ${errorCode}]: ${errorMessage}`
        : `[Error ${errorCode}]: ${errorMessage}`;
    }

    // Update the call record
    const updatedCall = await callRepository.update(call.id, updateData);

    if (updatedCall) {
      // Save to persistent storage
      await jsonPersistence.save();

      // Broadcast real-time update to connected clients
      broadcastCallStatusChanged(updatedCall, call.status, mapTwilioStatus(callStatus), call.tenantId);

      console.log(`[Twilio Webhook] Call ${call.id} updated to status: ${callStatus}`);
    }

    // Twilio expects a 200 response
    return NextResponse.json({
      received: true,
      callId: call.id,
      status: mapTwilioStatus(callStatus)
    });
  } catch (error: any) {
    console.error('[Twilio Webhook] Error processing status callback:', error);

    // Still return 200 to acknowledge receipt - Twilio will retry on non-2xx
    return NextResponse.json({
      received: true,
      error: 'Internal error processing webhook',
      details: error.message
    });
  }
}

/**
 * GET /api/crm/calls/webhook
 * Information endpoint for testing
 */
export async function GET() {
  return NextResponse.json({
    message: 'Twilio Status Callback webhook endpoint',
    instructions: 'Configure this URL as the StatusCallback when initiating calls',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/crm/calls/webhook`,
    supportedEvents: [
      'queued',
      'ringing',
      'in-progress',
      'completed',
      'busy',
      'no-answer',
      'canceled',
      'failed'
    ],
    twilioDocumentation: 'https://www.twilio.com/docs/voice/api/call-resource#statuscallback'
  });
}
