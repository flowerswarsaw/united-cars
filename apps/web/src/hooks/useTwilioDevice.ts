import { useState, useEffect, useRef, useCallback } from 'react';
import { Device, Call as TwilioCall } from '@twilio/voice-sdk';
import toast from 'react-hot-toast';

export interface CallInfo {
  callId?: string;
  phoneNumber?: string;
  status: 'idle' | 'connecting' | 'ringing' | 'in-progress' | 'completed' | 'failed';
  duration: number;
  startTime?: Date;
}

export interface UseTwilioDeviceOptions {
  onCallStarted?: (callId: string) => void;
  onCallEnded?: (callId: string, duration: number) => void;
  onCallFailed?: (error: string) => void;
  autoRefreshToken?: boolean;
}

/**
 * React hook for managing Twilio Device lifecycle and call state
 *
 * Features:
 * - Automatic device registration with token
 * - Call state management (connecting, ringing, in-progress, completed)
 * - Duration tracking during active calls
 * - Event callbacks for call lifecycle
 * - Automatic cleanup on unmount
 */
export function useTwilioDevice(options: UseTwilioDeviceOptions = {}) {
  const [device, setDevice] = useState<Device | null>(null);
  const [isDeviceReady, setIsDeviceReady] = useState(false);
  const [callInfo, setCallInfo] = useState<CallInfo>({
    status: 'idle',
    duration: 0,
  });
  const [currentCall, setCurrentCall] = useState<TwilioCall | null>(null);
  const [error, setError] = useState<string | null>(null);

  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const tokenRefreshTimer = useRef<NodeJS.Timeout | null>(null);

  /**
   * Initialize Twilio Device with access token from server
   */
  const initializeDevice = useCallback(async () => {
    try {
      console.log('Requesting Twilio access token...');

      const response = await fetch('/api/crm/calls/token', { method: 'POST' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get access token');
      }

      const { token } = await response.json();
      console.log('Twilio access token received');

      // Create new device instance
      const newDevice = new Device(token, {
        enableRingingState: true,
        logLevel: 'error', // 'debug' | 'info' | 'warn' | 'error' | 'off'
      });

      // Device ready event
      newDevice.on('registered', () => {
        setIsDeviceReady(true);
        console.log('Twilio Device registered and ready');
        toast.success('Phone system ready');
      });

      // Device error event
      newDevice.on('error', (error) => {
        console.error('Twilio Device error:', error);
        setError(error.message);
        setIsDeviceReady(false);
        toast.error(`Phone system error: ${error.message}`);
      });

      // Token about to expire event
      newDevice.on('tokenWillExpire', async () => {
        console.log('Token expiring soon, refreshing...');
        if (options.autoRefreshToken !== false) {
          try {
            const refreshResponse = await fetch('/api/crm/calls/token', { method: 'POST' });
            if (refreshResponse.ok) {
              const { token: newToken } = await refreshResponse.json();
              newDevice.updateToken(newToken);
              console.log('Token refreshed successfully');
            }
          } catch (err) {
            console.error('Token refresh failed:', err);
          }
        }
      });

      // Register device
      await newDevice.register();
      setDevice(newDevice);

      // Set up token refresh (refresh every 50 minutes if token is 1 hour)
      if (options.autoRefreshToken !== false) {
        tokenRefreshTimer.current = setInterval(async () => {
          try {
            const refreshResponse = await fetch('/api/crm/calls/token', { method: 'POST' });
            if (refreshResponse.ok) {
              const { token: newToken } = await refreshResponse.json();
              newDevice.updateToken(newToken);
              console.log('Token auto-refreshed');
            }
          } catch (err) {
            console.error('Token auto-refresh failed:', err);
          }
        }, 50 * 60 * 1000); // 50 minutes
      }

    } catch (err: any) {
      console.error('Device initialization failed:', err);
      setError(err.message);
      setIsDeviceReady(false);
      toast.error('Failed to initialize phone system');
    }
  }, [options.autoRefreshToken]);

  /**
   * Make an outbound call
   */
  const makeCall = useCallback(async (phoneNumber: string, callId: string) => {
    if (!device || !isDeviceReady) {
      toast.error('Phone system not ready');
      console.error('Device not ready for calls');
      return;
    }

    try {
      console.log(`Placing call to ${phoneNumber}, callId: ${callId}`);

      const call = await device.connect({
        params: {
          To: phoneNumber,
          CallId: callId,
        }
      });

      setCurrentCall(call);
      setCallInfo({
        callId,
        phoneNumber,
        status: 'connecting',
        duration: 0,
      });

      // Call ringing event
      call.on('ringing', () => {
        console.log('Call ringing...');
        setCallInfo(prev => ({
          ...prev,
          status: 'ringing',
        }));
      });

      // Call accepted event
      call.on('accept', () => {
        console.log('Call accepted');
        setCallInfo(prev => ({
          ...prev,
          status: 'in-progress',
          startTime: new Date(),
        }));

        // Start duration counter
        durationInterval.current = setInterval(() => {
          setCallInfo(prev => ({
            ...prev,
            duration: prev.duration + 1,
          }));
        }, 1000);

        options.onCallStarted?.(callId);
        toast.success('Call connected');
      });

      // Call disconnect event
      call.on('disconnect', () => {
        console.log('Call disconnected');
        const finalDuration = callInfo.duration;

        setCallInfo(prev => ({ ...prev, status: 'completed' }));

        if (durationInterval.current) {
          clearInterval(durationInterval.current);
          durationInterval.current = null;
        }

        options.onCallEnded?.(callId, finalDuration);
        setCurrentCall(null);
      });

      // Call cancel event
      call.on('cancel', () => {
        console.log('Call cancelled');
        setCallInfo(prev => ({ ...prev, status: 'failed' }));

        if (durationInterval.current) {
          clearInterval(durationInterval.current);
          durationInterval.current = null;
        }

        options.onCallFailed?.('Call cancelled');
        setCurrentCall(null);
        toast.error('Call cancelled');
      });

      // Call reject event
      call.on('reject', () => {
        console.log('Call rejected');
        setCallInfo(prev => ({ ...prev, status: 'failed' }));

        if (durationInterval.current) {
          clearInterval(durationInterval.current);
          durationInterval.current = null;
        }

        options.onCallFailed?.('Call rejected');
        setCurrentCall(null);
        toast.error('Call rejected');
      });

    } catch (err: any) {
      console.error('Call failed:', err);
      setError(err.message);
      setCallInfo(prev => ({ ...prev, status: 'failed' }));
      options.onCallFailed?.(err.message);
      toast.error(`Call failed: ${err.message}`);
    }
  }, [device, isDeviceReady, options, callInfo.duration]);

  /**
   * Hang up active call
   */
  const hangUp = useCallback(() => {
    if (currentCall) {
      console.log('Hanging up call');
      currentCall.disconnect();
    }
  }, [currentCall]);

  /**
   * Reset call state to idle
   */
  const resetCallState = useCallback(() => {
    setCallInfo({
      status: 'idle',
      duration: 0,
    });
    setCurrentCall(null);
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Clear duration interval
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }

      // Clear token refresh timer
      if (tokenRefreshTimer.current) {
        clearInterval(tokenRefreshTimer.current);
      }

      // Destroy device
      if (device) {
        device.destroy();
      }
    };
  }, [device]);

  return {
    device,
    isDeviceReady,
    callInfo,
    currentCall,
    error,
    initializeDevice,
    makeCall,
    hangUp,
    resetCallState,
  };
}
