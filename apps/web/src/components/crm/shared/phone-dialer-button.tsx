'use client';

import { useState } from 'react';
import { Phone, PhoneOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTwilioDevice } from '@/hooks/useTwilioDevice';
import { formatPhoneForStorage } from '@/lib/phone-formatter';
import toast from 'react-hot-toast';

export interface PhoneDialerButtonProps {
  phoneNumber: string;
  contactId?: string;
  organisationId?: string;
  dealId?: string;
  variant?: 'default' | 'ghost' | 'outline' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  showLabel?: boolean;
}

/**
 * PhoneDialerButton - Click-to-call button component
 *
 * Features:
 * - Automatic call log creation before dialing
 * - Real-time call status updates
 * - Duration display during active call
 * - Hang up functionality
 * - Loading states and error handling
 *
 * Usage:
 * <PhoneDialerButton
 *   phoneNumber="+14155551234"
 *   contactId="contact-123"
 *   variant="ghost"
 *   size="sm"
 * />
 */
export function PhoneDialerButton({
  phoneNumber,
  contactId,
  organisationId,
  dealId,
  variant = 'ghost',
  size = 'sm',
  className = '',
  showLabel = false,
}: PhoneDialerButtonProps) {
  const [callLogId, setCallLogId] = useState<string | null>(null);
  const [isCreatingCall, setIsCreatingCall] = useState(false);

  const {
    isDeviceReady,
    callInfo,
    initializeDevice,
    makeCall,
    hangUp
  } = useTwilioDevice({
    onCallStarted: async (callId) => {
      console.log('Call started:', callId);
      // Update call log to IN_PROGRESS
      await updateCallLog(callId, {
        status: 'IN_PROGRESS',
        startedAt: new Date().toISOString()
      });
    },
    onCallEnded: async (callId, duration) => {
      console.log('Call ended:', callId, 'Duration:', duration);
      // Update call log with completion status and duration
      await updateCallLog(callId, {
        status: 'COMPLETED',
        endedAt: new Date().toISOString(),
        durationSec: duration
      });
      toast.success(`Call ended (${formatDuration(duration)})`);
      setCallLogId(null);
    },
    onCallFailed: async (error) => {
      console.error('Call failed:', error);
      if (callLogId) {
        await updateCallLog(callLogId, { status: 'FAILED' });
      }
      setCallLogId(null);
    },
  });

  /**
   * Handle button click - either start call or hang up
   */
  const handleClick = async () => {
    // If call is in progress, hang up
    if (callInfo.status === 'in-progress') {
      hangUp();
      return;
    }

    // Prevent multiple clicks
    if (isCreatingCall) return;

    try {
      setIsCreatingCall(true);

      // Initialize device if needed
      if (!isDeviceReady) {
        toast.loading('Initializing phone system...');
        await initializeDevice();
      }

      // Format phone to E.164
      let formattedPhone: string;
      try {
        formattedPhone = formatPhoneForStorage(phoneNumber);
      } catch (error: any) {
        toast.error(`Invalid phone number: ${error.message}`);
        return;
      }

      // Create call log
      const response = await fetch('/api/crm/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          contactId,
          organisationId,
          dealId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create call log');
      }

      const callLog = await response.json();
      setCallLogId(callLog.id);

      // Place call
      await makeCall(formattedPhone, callLog.id);
      toast.success('Calling...');

    } catch (error: any) {
      console.error('Failed to place call:', error);
      toast.error(`Failed to place call: ${error.message}`);
      setCallLogId(null);
    } finally {
      setIsCreatingCall(false);
    }
  };

  /**
   * Update call log via API
   */
  const updateCallLog = async (callId: string, updates: any) => {
    try {
      await fetch(`/api/crm/calls/${callId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error('Failed to update call log:', error);
    }
  };

  /**
   * Format duration as MM:SS
   */
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Get button content based on call state
   */
  const getButtonContent = () => {
    const isActive = callInfo.status === 'in-progress';
    const isConnecting = ['connecting', 'ringing'].includes(callInfo.status);

    if (isCreatingCall || isConnecting) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {showLabel && (
            <span className="ml-2">
              {isCreatingCall ? 'Starting...' : isConnecting === 'ringing' ? 'Ringing...' : 'Connecting...'}
            </span>
          )}
        </>
      );
    }

    if (isActive) {
      return (
        <>
          <PhoneOff className="h-4 w-4" />
          {showLabel && (
            <span className="ml-2">
              {formatDuration(callInfo.duration)}
            </span>
          )}
        </>
      );
    }

    return (
      <>
        <Phone className="h-4 w-4" />
        {showLabel && <span className="ml-2">Call</span>}
      </>
    );
  };

  const isActive = callInfo.status === 'in-progress';
  const isDisabled = isCreatingCall || ['connecting', 'ringing'].includes(callInfo.status);

  return (
    <Button
      variant={isActive ? 'destructive' : variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={isDisabled}
      title={isActive ? `Hang up (${formatDuration(callInfo.duration)})` : `Call ${phoneNumber}`}
    >
      {getButtonContent()}
    </Button>
  );
}
