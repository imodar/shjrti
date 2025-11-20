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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Read customDomain from request body
    const { customDomain } = await req.json();

    if (!customDomain) {
      return new Response(
        JSON.stringify({ error: 'Custom domain not provided' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Look up the family by custom domain
    const { data: family, error } = await supabase
      .from('families')
      .select('id, name, custom_domain')
      .eq('custom_domain', customDomain)
      .single();

    if (error || !family) {
      return new Response(
        JSON.stringify({ 
          error: 'Family not found',
          message: 'No family found with this custom domain'
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Return the family data for redirect
    return new Response(
      JSON.stringify({
        family_id: family.id,
        family_name: family.name,
        custom_domain: family.custom_domain,
        redirect_url: `/family-tree-view?family=${family.id}`
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