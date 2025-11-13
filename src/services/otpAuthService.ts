import { supabase } from "@/integrations/supabase/client";

export type OTPPurpose = 'signup' | 'login' | 'reset_password';

export interface SendOTPOptions {
  email: string;
  purpose: OTPPurpose;
  userData?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
}

export interface VerifyOTPOptions {
  email: string;
  otpCode: string;
  purpose: OTPPurpose;
  password?: string;
  userData?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
}

export interface OTPServiceResult {
  success: boolean;
  data?: any;
  error?: string;
  expiresAt?: string;
}

/**
 * Send OTP code via email using Resend
 */
export async function sendOTP(options: SendOTPOptions): Promise<OTPServiceResult> {
  try {
    console.log(`[OTP Service] Sending OTP for ${options.email}, purpose: ${options.purpose}`);

    const { data, error } = await supabase.functions.invoke('send-otp', {
      body: {
        email: options.email,
        purpose: options.purpose,
        userData: options.userData
      }
    });

    if (error) {
      console.error('[OTP Service] Error sending OTP:', error);
      return {
        success: false,
        error: error.message || 'Failed to send OTP'
      };
    }

    if (data?.error) {
      console.error('[OTP Service] Error from edge function:', data.error);
      return {
        success: false,
        error: data.error
      };
    }

    console.log(`[OTP Service] OTP sent successfully to ${options.email}`);

    return {
      success: true,
      data: data,
      expiresAt: data?.expiresAt
    };
  } catch (error: any) {
    console.error('[OTP Service] Exception:', error);
    return {
      success: false,
      error: error.message || 'Network error while sending OTP'
    };
  }
}

/**
 * Verify OTP code and complete authentication
 */
export async function verifyOTP(options: VerifyOTPOptions): Promise<OTPServiceResult> {
  try {
    console.log(`[OTP Service] Verifying OTP for ${options.email}, purpose: ${options.purpose}`);

    const { data, error } = await supabase.functions.invoke('verify-otp', {
      body: {
        email: options.email,
        otpCode: options.otpCode,
        purpose: options.purpose,
        password: options.password,
        userData: options.userData
      }
    });

    // Check for network/connection errors first
    if (error) {
      console.error('[OTP Service] Network error verifying OTP:', error);
      return {
        success: false,
        error: 'OTP_NETWORK_ERROR' // Error code instead of message
      };
    }

    // Check for application-level errors from edge function
    if (data?.error) {
      console.error('[OTP Service] Application error from edge function:', data.error);
      // Map edge function errors to error codes
      if (data.error.includes('Invalid or expired')) {
        return {
          success: false,
          error: 'OTP_INVALID_OR_EXPIRED'
        };
      }
      return {
        success: false,
        error: 'OTP_VERIFICATION_FAILED'
      };
    }

    // Check if the response indicates success
    if (!data?.success) {
      console.error('[OTP Service] Invalid response from edge function:', data);
      return {
        success: false,
        error: 'OTP_INVALID_RESPONSE'
      };
    }

    console.log(`[OTP Service] OTP verified successfully for ${options.email}`);

    // For login and signup, sign in the user automatically
    if (options.purpose === 'signup' || options.purpose === 'login') {
      if (options.password) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: options.email,
          password: options.password
        });

        if (signInError) {
          console.error('[OTP Service] Error signing in after verification:', signInError);
          return {
            success: false,
            error: 'OTP verified but failed to sign in. Please try logging in manually.'
          };
        }
      }
    }

    return {
      success: true,
      data: data
    };
  } catch (error: any) {
    console.error('[OTP Service] Exception:', error);
    return {
      success: false,
      error: error.message || 'Network error while verifying OTP'
    };
  }
}

/**
 * Resend OTP code (just calls sendOTP again)
 */
export async function resendOTP(options: SendOTPOptions): Promise<OTPServiceResult> {
  return sendOTP(options);
}
