import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';
import { checkRateLimit, getClientIP } from '../_shared/rateLimiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Deno serve handler
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientIP = getClientIP(req);
    const rateLimitResult = checkRateLimit(clientIP, {
      maxAttempts: 30,
      windowMs: 60 * 60 * 1000, // 30 requests per hour
      backoffMultiplier: 2,
    });

    if (!rateLimitResult.allowed) {
      console.log(`[get-shared-family] Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'TOO_MANY_REQUESTS',
          retryAfter: rateLimitResult.retryAfter,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const { share_token, password } = await req.json();

    if (!share_token) {
      console.error('[get-shared-family] Missing share_token in request');
      return new Response(
        JSON.stringify({ success: false, error: 'TOKEN_REQUIRED' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[get-shared-family] Received request for token: ${share_token}`);

    // Create Supabase Admin client using Service Role Key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Step 1: Validate token and check expiration
    const { data: family, error: familyError } = await supabaseAdmin
      .from('families')
      .select('*')
      .eq('share_token', share_token)
      .single();

    if (familyError || !family) {
      console.error('[get-shared-family] Token not found:', familyError);
      return new Response(
        JSON.stringify({ success: false, error: 'TOKEN_INVALID' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(family.share_token_expires_at);
    if (expiresAt < now) {
      console.log('[get-shared-family] Token expired for family:', family.id);
      return new Response(
        JSON.stringify({ success: false, error: 'TOKEN_EXPIRED' }),
        {
          status: 410,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 2: Check password if required
    if (family.share_password) {
      if (!password) {
        console.log('[get-shared-family] Password required but not provided');
        return new Response(
          JSON.stringify({ success: false, error: 'PASSWORD_REQUIRED' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (password !== family.share_password) {
        console.log('[get-shared-family] Invalid password provided');
        return new Response(
          JSON.stringify({ success: false, error: 'PASSWORD_INCORRECT' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    console.log('[get-shared-family] Token and password validated successfully');

    // Step 3: Fetch all family data using Service Role
    const [membersResult, marriagesResult] = await Promise.all([
      supabaseAdmin
        .from('family_tree_members')
        .select('*')
        .eq('family_id', family.id)
        .order('created_at', { ascending: true }),
      supabaseAdmin
        .from('marriages')
        .select('*')
        .eq('family_id', family.id),
    ]);

    if (membersResult.error) {
      console.error('[get-shared-family] Error fetching members:', membersResult.error);
      return new Response(
        JSON.stringify({ success: false, error: 'FETCH_ERROR' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (marriagesResult.error) {
      console.error('[get-shared-family] Error fetching marriages:', marriagesResult.error);
      return new Response(
        JSON.stringify({ success: false, error: 'FETCH_ERROR' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[get-shared-family] Successfully fetched data for family: ${family.id}`);
    console.log(`[get-shared-family] Members: ${membersResult.data?.length || 0}, Marriages: ${marriagesResult.data?.length || 0}`);

    // Step 4: Return data to frontend
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          family,
          members: membersResult.data || [],
          marriages: marriagesResult.data || [],
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[get-shared-family] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
