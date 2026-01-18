/**
 * API: Invoices (REST)
 * RESTful API for user invoice operations
 * 
 * Endpoints:
 * GET    /api-invoices                    → List user's invoices
 * GET    /api-invoices?id=xxx             → Get a specific invoice
 * GET    /api-invoices?latest=true        → Get the latest paid invoice
 * GET    /api-invoices?status=paid        → Filter invoices by payment status
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

// GET handler - List or get invoices
async function handleGet(
  userId: string, 
  invoiceId: string | null, 
  status: string | null,
  latest: boolean
) {
  console.log(`[API] GET - Getting invoices for user: ${userId}`);
  const supabase = createServiceClient();
  
  // Get specific invoice
  if (invoiceId) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        packages (
          id,
          name
        )
      `)
      .eq('id', invoiceId)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('[API] Get invoice error:', error);
      return errorResponse('DATABASE_ERROR', error.message, 500);
    }
    
    if (!data) {
      return errorResponse('NOT_FOUND', 'Invoice not found', 404);
    }
    
    return successResponse(data);
  }
  
  // Get latest paid invoice
  if (latest) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        packages (
          id,
          name
        )
      `)
      .eq('user_id', userId)
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error('[API] Get latest invoice error:', error);
      return errorResponse('DATABASE_ERROR', error.message, 500);
    }
    
    return successResponse(data);
  }
  
  // List invoices with optional status filter
  let query = supabase
    .from('invoices')
    .select(`
      *,
      packages (
        id,
        name
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (status) {
    query = query.eq('payment_status', status);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('[API] List invoices error:', error);
    return errorResponse('DATABASE_ERROR', error.message, 500);
  }
  
  return successResponse(data || []);
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
    const invoiceId = url.searchParams.get('id');
    const status = url.searchParams.get('status');
    const latest = url.searchParams.get('latest') === 'true';
    
    console.log(`[API] ${req.method} /api-invoices`);
    
    // Route based on HTTP method
    switch (req.method) {
      case 'GET':
        return await handleGet(user!.id, invoiceId, status, latest);
        
      default:
        return errorResponse('METHOD_NOT_ALLOWED', `Method ${req.method} not allowed`, 405);
    }
  } catch (error) {
    console.error('[API] Unhandled error:', error);
    return errorResponse('INTERNAL_ERROR', error.message || 'An unexpected error occurred', 500);
  }
});
