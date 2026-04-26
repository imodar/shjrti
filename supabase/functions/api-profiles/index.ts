/**
 * API: Profiles (REST)
 * RESTful API for user profile operations
 * 
 * Endpoints:
 * GET    /api-profiles              → Get current user's profile
 * PUT    /api-profiles              → Update current user's profile
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
};

// Check admin status
async function checkAdmin(userId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error) {
    console.error('[API] Admin check error:', error);
    return false;
  }
  return !!data;
}

// Response helpers
function successResponse<T>(data: T, status = 200) {
  return new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(code: string, message: string, status = 400) {
  console.error(`[API Error] ${code}: ${message}`);
  return new Response(JSON.stringify({ success: false, error: { code, message } }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Create Supabase clients
function createUserClient(authHeader: string) {
  const token = authHeader.replace('Bearer ', '');
  return createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_ANON_KEY') || '',
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    }
  );
}

function createServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Auth helper
async function authenticateRequest(req: Request) {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: errorResponse('UNAUTHORIZED', 'Missing authorization header', 401) };
  }
  
  const supabase = createUserClient(authHeader);
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { error: errorResponse('UNAUTHORIZED', 'Invalid or expired token', 401) };
  }
  
  return { user, supabase };
}

// GET handler - Get current user's profile
async function handleGet(userId: string) {
  console.log(`[API] GET - Getting profile for user: ${userId}`);
  const supabase = createServiceClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error) {
    console.error('[API] Get profile error:', error);
    return errorResponse('DATABASE_ERROR', (error as Error).message, 500);
  }
  
  // Return empty object if no profile exists
  return successResponse(data || { user_id: userId });
}

// PUT handler - Update current user's profile
async function handleUpdate(userId: string, payload: Record<string, unknown>) {
  console.log(`[API] PUT - Updating profile for user: ${userId}`);
  
  // Remove non-updatable fields
  const { id, user_id, created_at, ...updateData } = payload;
  
  const supabase = createServiceClient();
  
  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  
  let result;
  
  if (existingProfile) {
    // Update existing profile
    result = await supabase
      .from('profiles')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();
  } else {
    // Create new profile
    result = await supabase
      .from('profiles')
      .insert({ 
        ...updateData, 
        user_id: userId,
        email: payload.email || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString() 
      })
      .select()
      .single();
  }
  
  if (result.error) {
    console.error('[API] Update profile error:', result.error);
    return errorResponse('DATABASE_ERROR', result.(error as Error).message, 500);
  }
  
  return successResponse(result.data);
}

// Main handler
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Authenticate
    const auth = await authenticateRequest(req);
    if (auth.error) return auth.error;
    const { user } = auth;
    
    // Parse body for PUT
    let body: Record<string, unknown> = {};
    if (req.method === 'PUT') {
      body = await req.json().catch(() => ({}));
    }
    
    // Parse URL for action parameter
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    
    console.log(`[API] ${req.method} /api-profiles${action ? `?action=${action}` : ''}`);
    
    // Route based on HTTP method
    switch (req.method) {
      case 'GET':
        if (action === 'check-admin') {
          const isAdmin = await checkAdmin(user!.id);
          return successResponse({ is_admin: isAdmin });
        }
        return await handleGet(user!.id);
        
      case 'PUT':
        return await handleUpdate(user!.id, body);
        
      default:
        return errorResponse('METHOD_NOT_ALLOWED', `Method ${req.method} not allowed`, 405);
    }
  } catch (error) {
    console.error('[API] Unhandled error:', error);
    return errorResponse('INTERNAL_ERROR', (error as Error).message || 'An unexpected error occurred', 500);
  }
});
