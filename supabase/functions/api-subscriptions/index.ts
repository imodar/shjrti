/**
 * API: Subscriptions (REST)
 * RESTful API for user subscription operations
 * 
 * Endpoints:
 * GET    /api-subscriptions              → Get current user's subscription with package details
 * GET    /api-subscriptions?details=true → Get detailed subscription info via RPC
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

// GET handler - Get current user's subscription
async function handleGet(userId: string, getDetails: boolean) {
  console.log(`[API] GET - Getting subscription for user: ${userId}, details: ${getDetails}`);
  const supabase = createServiceClient();
  
  if (getDetails) {
    // Use RPC for detailed info
    const { data, error } = await supabase.rpc('get_user_subscription_details', {
      user_uuid: userId,
    });
    
    if (error) {
      console.error('[API] Get subscription details error:', error);
      return errorResponse('DATABASE_ERROR', error.message, 500);
    }
    
    return successResponse(data?.[0] || null);
  }
  
  // Standard query with package join
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select(`
      *,
      packages (
        id,
        name,
        description,
        max_family_trees,
        max_family_members,
        price_sar,
        price_usd,
        features,
        ai_features_enabled,
        custom_domains_enabled,
        image_upload_enabled
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  
  if (error) {
    console.error('[API] Get subscription error:', error);
    return errorResponse('DATABASE_ERROR', error.message, 500);
  }
  
  // Return default free subscription if none exists
  if (!data) {
    return successResponse({
      user_id: userId,
      status: 'free',
      package: {
        name: { ar: 'الباقة المجانية', en: 'Free Package' },
        max_family_trees: 1,
        max_family_members: 50,
        price_sar: 0,
        price_usd: 0,
      },
    });
  }
  
  return successResponse(data);
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
    const getDetails = url.searchParams.get('details') === 'true';
    
    console.log(`[API] ${req.method} /api-subscriptions`);
    
    // Route based on HTTP method
    switch (req.method) {
      case 'GET':
        return await handleGet(user!.id, getDetails);
        
      default:
        return errorResponse('METHOD_NOT_ALLOWED', `Method ${req.method} not allowed`, 405);
    }
  } catch (error) {
    console.error('[API] Unhandled error:', error);
    return errorResponse('INTERNAL_ERROR', error.message || 'An unexpected error occurred', 500);
  }
});
