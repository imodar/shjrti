import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getPayPalBaseUrl(environment: string): string {
  return environment === 'live' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';
}

async function getPayPalAccessToken(clientId: string, clientSecret: string, baseUrl: string): Promise<string> {
  const auth = btoa(`${clientId}:${clientSecret}`);
  
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token');
  }

  const data = await response.json();
  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { packageId, amount, currency } = await req.json();

    if (!packageId || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get package details
    const { data: packageData } = await supabaseClient
      .from('packages')
      .select('name')
      .eq('id', packageId)
      .single();

    const packageName = packageData?.name?.en || 'Subscription';

    // Get gateway settings
    const { data: gatewaySettings } = await supabaseClient
      .from('payment_gateway_settings')
      .select('*')
      .eq('gateway_name', 'paypal')
      .eq('is_active', true)
      .single();

    const environment = gatewaySettings?.environment || 'sandbox';
    const clientId = environment === 'live'
      ? Deno.env.get('PAYPAL_CLIENT_ID_LIVE')
      : Deno.env.get('PAYPAL_CLIENT_ID_SANDBOX');
    
    const clientSecret = environment === 'live'
      ? Deno.env.get('PAYPAL_CLIENT_SECRET_LIVE')
      : Deno.env.get('PAYPAL_CLIENT_SECRET_SANDBOX');

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: 'Payment credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paypalBaseUrl = getPayPalBaseUrl(environment);
    const accessToken = await getPayPalAccessToken(clientId, clientSecret, paypalBaseUrl);

    // Create product
    const productResponse = await fetch(`${paypalBaseUrl}/v1/catalogs/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: `${packageName} Subscription`,
        description: `Annual subscription for ${packageName}`,
        type: 'SERVICE',
        category: 'SOFTWARE',
      }),
    });

    if (!productResponse.ok) {
      const errorData = await productResponse.json();
      console.error('Product creation failed:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to create product', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const productData = await productResponse.json();
    console.log('Product created:', productData.id);

    // Create billing plan
    const planResponse = await fetch(`${paypalBaseUrl}/v1/billing/plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        product_id: productData.id,
        name: `${packageName} Annual Plan`,
        description: `Annual subscription - ${currency} ${amount}`,
        status: 'ACTIVE',
        billing_cycles: [
          {
            frequency: {
              interval_unit: 'YEAR',
              interval_count: 1,
            },
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0, // Infinite renewals
            pricing_scheme: {
              fixed_price: {
                value: amount.toFixed(2),
                currency_code: currency,
              },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: 'CONTINUE',
          payment_failure_threshold: 3,
        },
      }),
    });

    if (!planResponse.ok) {
      const errorData = await planResponse.json();
      console.error('Plan creation failed:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to create billing plan', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const planData = await planResponse.json();
    console.log('Billing plan created:', planData.id);

    return new Response(
      JSON.stringify({
        planId: planData.id,
        productId: productData.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-paypal-subscription:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});