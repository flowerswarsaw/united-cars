import twilio from 'twilio';
const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

/**
 * Check if all required Twilio environment variables are configured
 */
export function isTwilioConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_API_KEY_SID &&
    process.env.TWILIO_API_KEY_SECRET &&
    process.env.TWILIO_VOICE_APP_SID &&
    process.env.TWILIO_CALLER_ID
  );
}

// Singleton REST client
let twilioClient: twilio.Twilio | null = null;

/**
 * Get Twilio REST client for server-side operations
 * Throws error if Twilio is not configured
 */
export function getTwilioClient(): twilio.Twilio {
  if (!isTwilioConfigured()) {
    throw new Error('Twilio not configured. Please set required environment variables.');
  }

  if (!twilioClient) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );
  }

  return twilioClient;
}

/**
 * Generate Twilio access token for browser-based calling
 * @param args.identity - Unique identifier for the user (typically CRM user ID)
 * @param args.ttlSeconds - Token time-to-live in seconds (default: 3600 / 1 hour)
 * @returns JWT access token
 */
export function generateTwilioAccessToken(args: {
  identity: string;
  ttlSeconds?: number;
}): string {
  if (!isTwilioConfigured()) {
    throw new Error('Twilio not configured. Please set required environment variables.');
  }

  const { identity, ttlSeconds = 3600 } = args;

  // Create access token with Twilio credentials
  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_API_KEY_SID!,
    process.env.TWILIO_API_KEY_SECRET!,
    {
      ttl: ttlSeconds,
      identity: identity  // Pass identity in constructor options
    }
  );

  // Create voice grant for outbound calling
  const grant = new VoiceGrant({
    outgoingApplicationSid: process.env.TWILIO_VOICE_APP_SID!,
    incomingAllow: false, // Outbound calls only for now
  });

  token.addGrant(grant);

  return token.toJwt();
}

/**
 * Get the configured Twilio caller ID (verified phone number)
 */
export function getTwilioCallerId(): string {
  return process.env.TWILIO_CALLER_ID || '';
}

/**
 * Validate phone number is in E.164 format
 * E.164 format: +[country code][number] (e.g., +14155551234)
 */
export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

/**
 * Get Twilio account SID (for debugging)
 */
export function getTwilioAccountSid(): string | undefined {
  return process.env.TWILIO_ACCOUNT_SID;
}
