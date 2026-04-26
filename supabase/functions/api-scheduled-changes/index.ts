/**
 * API: Scheduled Package Changes (REST)
 * RESTful API for managing scheduled package changes
 * 
 * Endpoints:
 * GET    /api-scheduled-changes              → Get user's pending scheduled change
 * POST   /api-scheduled-changes              → Create a new scheduled change
 * DELETE /api-scheduled-changes?id=xxx       → Cancel a scheduled change
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
};

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

// GET handler - Get user's pending scheduled change with package details
async function handleGet(userId: string) {
  console.log(`[API] GET - Getting scheduled changes for user: ${userId}`);
  const supabase = createServiceClient();
  
  // Get pending scheduled change
  const { data: change, error } = await supabase
    .from('scheduled_package_changes')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .maybeSingle();
  
  if (error && error.code !== 'PGRST116') {
    console.error('[API] Get scheduled change error:', error);
    return errorResponse('DATABASE_ERROR', (error as Error).message, 500);
  }
  
  if (!change) {
    return successResponse(null);
  }
  
  // Fetch package details for current and target packages
  const [currentPkgResult, targetPkgResult] = await Promise.all([
    supabase
      .from('packages')
      .select('id, name, price_usd, price_sar')
      .eq('id', change.current_package_id)
      .maybeSingle(),
    supabase
      .from('packages')
      .select('id, name, price_usd, price_sar')
      .eq('id', change.target_package_id)
      .maybeSingle()
  ]);
  
  return successResponse({
    ...change,
    current_package: currentPkgResult.data,
    target_package: targetPkgResult.data
  });
}

// POST handler - Create a new scheduled change
async function handlePost(userId: string, body: any) {
  console.log(`[API] POST - Creating scheduled change for user: ${userId}`);
  const supabase = createServiceClient();
  
  const { current_package_id, target_package_id, scheduled_date } = body;
  
  if (!current_package_id || !target_package_id || !scheduled_date) {
    return errorResponse('VALIDATION_ERROR', 'Missing required fields: current_package_id, target_package_id, scheduled_date');
  }
  
  // Cancel any existing pending changes first
  await supabase
    .from('scheduled_package_changes')
    .delete()
    .eq('user_id', userId)
    .eq('status', 'pending');
  
  // Create new scheduled change
  const { data, error } = await supabase
    .from('scheduled_package_changes')
    .insert({
      user_id: userId,
      current_package_id,
      target_package_id,
      scheduled_date,
      status: 'pending'
    })
    .select()
    .single();
  
  if (error) {
    console.error('[API] Create scheduled change error:', error);
    return errorResponse('DATABASE_ERROR', (error as Error).message, 500);
  }
  
  return successResponse(data, 201);
}

// DELETE handler - Cancel a scheduled change
async function handleDelete(userId: string, changeId: string | null) {
  console.log(`[API] DELETE - Cancelling scheduled change for user: ${userId}`);
  const supabase = createServiceClient();
  
  let query = supabase
    .from('scheduled_package_changes')
    .delete()
    .eq('user_id', userId)
    .eq('status', 'pending');
  
  if (changeId) {
    query = query.eq('id', changeId);
  }
  
  const { error } = await query;
  
  if (error) {
    console.error('[API] Delete scheduled change error:', error);
    return errorResponse('DATABASE_ERROR', (error as Error).message, 500);
  }
  
  return successResponse({ deleted: true });
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
    
    // Parse URL and query params
    const url = new URL(req.url);
    const changeId = url.searchParams.get('id');
    
    console.log(`[API] ${req.method} /api-scheduled-changes`);
    
    // Route based on HTTP method
    switch (req.method) {
      case 'GET':
        return await handleGet(user!.id);
        
      case 'POST': {
        const body = await req.json();
        return await handlePost(user!.id, body);
      }
        
      case 'DELETE':
        return await handleDelete(user!.id, changeId);
        
      default:
        return errorResponse('METHOD_NOT_ALLOWED', `Method ${req.method} not allowed`, 405);
    }
  } catch (error) {
    console.error('[API] Unhandled error:', error);
    return errorResponse('INTERNAL_ERROR', (error as Error).message || 'An unexpected error occurred', 500);
  }
});
