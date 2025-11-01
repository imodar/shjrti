import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    console.log('Fetching PayPal settings for authenticated user:', user.id);

    // Get PayPal settings
    const { data: settings, error: settingsError } = await supabase
      .from('payment_gateway_settings')
      .select('environment, is_active')
      .eq('gateway_name', 'paypal')
      .single();

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
      throw new Error('Failed to fetch PayPal settings');
    }

    if (!settings.is_active) {
      throw new Error('PayPal is not active');
    }

    const environment = settings.environment || 'sandbox';
    console.log('PayPal environment:', environment);

    // Get the appropriate client ID based on environment
    const clientIdKey = environment === 'live' 
      ? 'PAYPAL_CLIENT_ID_LIVE' 
      : 'PAYPAL_CLIENT_ID_SANDBOX';

    const clientId = Deno.env.get(clientIdKey);

    if (!clientId) {
      console.error(`Missing ${clientIdKey}`);
      throw new Error('PayPal client ID not configured');
    }

    console.log('Successfully retrieved PayPal client ID');

    return new Response(
      JSON.stringify({ 
        clientId,
        environment 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in get-paypal-client-id:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
