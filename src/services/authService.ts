import { supabase } from '@/integrations/supabase/client';
import type { AuthEmailOptions, AuthServiceResult } from '@/types/auth.types';

// Global lock to prevent duplicate requests (synchronous check)
const authOperationLock = {
  inProgress: false,
  type: null as string | null,
  timestamp: 0
};

/**
 * Unified auth email service that handles:
 * - Signup emails
 * - Password reset emails
 * - Magic link (OTP) emails
 * - Resend verification emails
 * 
 * Prevents duplicate requests with global synchronous lock
 */
export async function sendAuthEmail(options: AuthEmailOptions): Promise<AuthServiceResult> {
  const now = Date.now();
  
  // 1. SYNCHRONOUS CHECK - prevent any duplicate requests
  if (authOperationLock.inProgress) {
    const elapsed = now - authOperationLock.timestamp;
    console.warn(
      `Auth operation already in progress (${authOperationLock.type}), ` +
      `elapsed: ${elapsed}ms. Ignoring duplicate request.`
    );
    return { error: new Error('DUPLICATE_REQUEST') };
  }
  
  // 2. SET LOCK IMMEDIATELY (before any async operations)
  authOperationLock.inProgress = true;
  authOperationLock.type = options.type;
  authOperationLock.timestamp = now;
  
  try {
    const redirectTo = `${window.location.origin}/auth`;
    
    // 3. Progress callback
    options.onProgress?.('جارٍ الإرسال...');
    
    // 4. Create timeout promise (15 seconds)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), 15000);
    });
    
    // 5. Execute the appropriate auth operation
    let authPromise;
    
    switch (options.type) {
      case 'signup':
        if (!options.password) {
          throw new Error('Password is required for signup');
        }
        authPromise = supabase.auth.signUp({
          email: options.email,
          password: options.password,
          options: {
            emailRedirectTo: redirectTo,
            data: options.userData || {}
          }
        });
        break;
        
      case 'reset':
        authPromise = supabase.auth.resetPasswordForEmail(options.email, {
          redirectTo
        });
        break;
        
      case 'magiclink':
        authPromise = supabase.auth.signInWithOtp({
          email: options.email,
          options: {
            emailRedirectTo: redirectTo,
            shouldCreateUser: false
          }
        });
        break;
        
      case 'resend':
        authPromise = supabase.auth.resend({
          type: 'signup',
          email: options.email,
          options: { emailRedirectTo: redirectTo }
        });
        break;
        
      default:
        throw new Error(`Unknown auth type: ${options.type}`);
    }
    
    // 6. Race between auth request and timeout
    const result = await Promise.race([authPromise, timeoutPromise]);
    
    return { data: result, error: null };
    
  } catch (error: any) {
    return { error };
  } finally {
    // 7. ALWAYS release lock (even on error)
    authOperationLock.inProgress = false;
    authOperationLock.type = null;
    authOperationLock.timestamp = 0;
  }
}

/**
 * Check if we can send an auth email (respects cooldown)
 */
export function canSendAuthEmail(cooldownRemaining: number): boolean {
  return cooldownRemaining === 0 && !authOperationLock.inProgress;
}

/**
 * Get current lock status (for debugging)
 */
export function getAuthLockStatus() {
  return { ...authOperationLock };
}
