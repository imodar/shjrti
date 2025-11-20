import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Read customDomain from request body
    const { customDomain } = await req.json();

    if (!customDomain) {
      console.error('[custom-domain-redirect] Missing customDomain in request');
      return new Response(
        JSON.stringify({ success: false, error: 'DOMAIN_REQUIRED' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[custom-domain-redirect] Received request for domain: ${customDomain}`);

    // Step 1: Look up the family by custom domain
    // Note: Custom domains have permanent access (no expiration check)
    const { data: family, error: familyError } = await supabaseAdmin
      .from('families')
      .select('*')
      .eq('custom_domain', customDomain)
      .single();

    if (familyError || !family) {
      console.error('[custom-domain-redirect] Domain not found:', familyError);
      return new Response(
        JSON.stringify({ success: false, error: 'DOMAIN_NOT_FOUND' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[custom-domain-redirect] Family found: ${family.id}`);

    // Step 2: Fetch all family members using Service Role Key (bypasses RLS)
    const { data: members, error: membersError } = await supabaseAdmin
      .from('family_tree_members')
      .select('*')
      .eq('family_id', family.id);

    if (membersError) {
      console.error('[custom-domain-redirect] Error fetching members:', membersError);
      return new Response(
        JSON.stringify({ success: false, error: 'DATA_FETCH_ERROR' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 3: Fetch all marriages using Service Role Key (bypasses RLS)
    const { data: marriages, error: marriagesError } = await supabaseAdmin
      .from('marriages')
      .select('*')
      .eq('family_id', family.id);

    if (marriagesError) {
      console.error('[custom-domain-redirect] Error fetching marriages:', marriagesError);
      return new Response(
        JSON.stringify({ success: false, error: 'DATA_FETCH_ERROR' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[custom-domain-redirect] Successfully fetched data - Members: ${members?.length || 0}, Marriages: ${marriages?.length || 0}`);

    // Return all family data (same structure as get-shared-family)
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          family,
          members: members || [],
          marriages: marriages || [],
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in custom-domain-redirect:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});