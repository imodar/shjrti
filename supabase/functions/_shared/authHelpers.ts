/**
 * Authentication Helpers for Edge Functions
 * Handles JWT validation and user authentication
 */

import { createClient, SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  errorResponse, 
  ErrorCodes, 
  HttpStatus 
} from './apiHelpers.ts';

// Supabase configuration
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

/**
 * Create a Supabase client with service role (admin) access
 */
export function createServiceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Create a Supabase client with user's JWT token
 */
export function createUserClient(authHeader: string): SupabaseClient {
  const token = authHeader.replace('Bearer ', '');
  
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

/**
 * Authentication result interface
 */
export interface AuthResult {
  authenticated: boolean;
  user?: User;
  error?: Response;
  supabase?: SupabaseClient;
}

/**
 * Authenticate request and get user
 * Returns user and authenticated supabase client, or error response
 */
export async function authenticateRequest(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authenticated: false,
      error: errorResponse(
        ErrorCodes.UNAUTHORIZED,
        'Missing or invalid authorization header',
        HttpStatus.UNAUTHORIZED
      ),
    };
  }
  
  try {
    const supabase = createUserClient(authHeader);
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.error('[Auth] Failed to get user:', error);
      return {
        authenticated: false,
        error: errorResponse(
          ErrorCodes.UNAUTHORIZED,
          'Invalid or expired token',
          HttpStatus.UNAUTHORIZED
        ),
      };
    }
    
    console.log(`[Auth] Authenticated user: ${user.id}`);
    
    return {
      authenticated: true,
      user,
      supabase,
    };
  } catch (error) {
    console.error('[Auth] Authentication error:', error);
    return {
      authenticated: false,
      error: errorResponse(
        ErrorCodes.UNAUTHORIZED,
        'Authentication failed',
        HttpStatus.UNAUTHORIZED
      ),
    };
  }
}

/**
 * Check if user is an admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('[Auth] Admin check error:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('[Auth] Admin check failed:', error);
    return false;
  }
}

/**
 * Require admin access - returns error response if not admin
 */
export async function requireAdmin(userId: string): Promise<Response | null> {
  const admin = await isAdmin(userId);
  
  if (!admin) {
    return errorResponse(
      ErrorCodes.FORBIDDEN,
      'Admin access required',
      HttpStatus.FORBIDDEN
    );
  }
  
  return null;
}

/**
 * Check if user owns a family
 */
export async function isOwner(
  userId: string,
  familyId: string
): Promise<boolean> {
  try {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('families')
      .select('id')
      .eq('id', familyId)
      .eq('creator_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('[Auth] Ownership check error:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('[Auth] Ownership check failed:', error);
    return false;
  }
}

/**
 * Require ownership of a family - returns error response if not owner
 */
export async function requireOwnership(
  userId: string,
  familyId: string
): Promise<Response | null> {
  const owner = await isOwner(userId, familyId);
  
  if (!owner) {
    // Check if admin (admins can access any family)
    const admin = await isAdmin(userId);
    
    if (!admin) {
      return errorResponse(
        ErrorCodes.FORBIDDEN,
        'You do not have access to this family',
        HttpStatus.FORBIDDEN
      );
    }
  }
  
  return null;
}

/**
 * Get user's subscription status
 */
export async function getUserSubscription(userId: string): Promise<{
  hasActiveSubscription: boolean;
  packageId?: string;
  expiresAt?: string;
}> {
  try {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('package_id, expires_at, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    
    if (error || !data) {
      return { hasActiveSubscription: false };
    }
    
    // Check if expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { hasActiveSubscription: false };
    }
    
    return {
      hasActiveSubscription: true,
      packageId: data.package_id,
      expiresAt: data.expires_at,
    };
  } catch (error) {
    console.error('[Auth] Subscription check failed:', error);
    return { hasActiveSubscription: false };
  }
}
