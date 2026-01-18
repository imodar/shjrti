/**
 * API: Packages (REST)
 * RESTful API for package operations (public read-only)
 * 
 * Endpoints:
 * GET    /api-packages                    → List all active packages
 * GET    /api-packages?id=xxx             → Get a specific package
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

// Create Supabase client (public access - no auth required for reading packages)
function createServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// GET handler - List or get packages
async function handleGet(packageId: string | null) {
  console.log(`[API] GET - Getting packages`);
  const supabase = createServiceClient();
  
  // Get specific package
  if (packageId) {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .eq('is_active', true)
      .maybeSingle();
    
    if (error) {
      console.error('[API] Get package error:', error);
      return errorResponse('DATABASE_ERROR', error.message, 500);
    }
    
    if (!data) {
      return errorResponse('NOT_FOUND', 'Package not found', 404);
    }
    
    return successResponse(data);
  }
  
  // List all active packages
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  
  if (error) {
    console.error('[API] List packages error:', error);
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
    // Parse URL and query params
    const url = new URL(req.url);
    const packageId = url.searchParams.get('id');
    
    console.log(`[API] ${req.method} /api-packages`);
    
    // Route based on HTTP method
    switch (req.method) {
      case 'GET':
        return await handleGet(packageId);
        
      default:
        return errorResponse('METHOD_NOT_ALLOWED', `Method ${req.method} not allowed`, 405);
    }
  } catch (error) {
    console.error('[API] Unhandled error:', error);
    return errorResponse('INTERNAL_ERROR', error.message || 'An unexpected error occurred', 500);
  }
});
