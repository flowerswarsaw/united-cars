import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const VoiceResponse = twilio.twiml.VoiceResponse;

/**
 * POST /api/crm/calls/voice
 * TwiML webhook for handling outbound calls from Twilio Device
 *
 * This endpoint is called by Twilio when a call is initiated from the browser.
 * It returns TwiML instructions to dial the destination number.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const to = formData.get('To') as string;
    const callId = formData.get('CallId') as string;

    console.log(`[Voice Webhook] Outbound call initiated - To: ${to}, CallId: ${callId}`);

    // Create TwiML response
    const response = new VoiceResponse();

    if (!to) {
      // No destination number provided
      response.say('No destination number provided. Please try again.');
      return new NextResponse(response.toString(), {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // Dial the destination number
    const dial = response.dial({
      callerId: process.env.TWILIO_CALLER_ID,
      timeout: 30,
    });
    dial.number(to);

    console.log(`[Voice Webhook] Dialing ${to} with caller ID ${process.env.TWILIO_CALLER_ID}`);

    return new NextResponse(response.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error: any) {
    console.error('[Voice Webhook] Error:', error);

    // Return error TwiML
    const response = new VoiceResponse();
    response.say('An error occurred. Please try again later.');

    return new NextResponse(response.toString(), {
      headers: { 'Content-Type': 'text/xml' },
      status: 500,
    });
  }
}

/**
 * GET /api/crm/calls/voice
 * Handle GET requests (for testing the endpoint)
 */
export async function GET() {
  return NextResponse.json({
    message: 'TwiML Voice webhook endpoint',
    instructions: 'Configure this URL as the Voice URL in your Twilio TwiML App',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/crm/calls/voice`,
  });
}
