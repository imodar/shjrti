import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get PayPal API base URL based on environment
function getPayPalBaseUrl(environment: string): string {
  return environment === 'live' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';
}

// Get PayPal access token
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { invoiceId, amount, currency = 'USD' } = await req.json();

    if (!invoiceId || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: invoiceId, amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get payment gateway settings
    const { data: gatewaySettings, error: settingsError } = await supabaseClient
      .from('payment_gateway_settings')
      .select('*')
      .eq('gateway_name', 'paypal')
      .eq('is_active', true)
      .single();

    if (settingsError || !gatewaySettings) {
      console.error('Gateway settings error:', settingsError);
      return new Response(
        JSON.stringify({ error: 'Payment gateway not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const environment = gatewaySettings.environment || 'sandbox';
    
    // Get appropriate credentials based on environment
    const clientId = environment === 'live'
      ? Deno.env.get('PAYPAL_CLIENT_ID_LIVE')
      : Deno.env.get('PAYPAL_CLIENT_ID_SANDBOX');
    
    const clientSecret = environment === 'live'
      ? Deno.env.get('PAYPAL_CLIENT_SECRET_LIVE')
      : Deno.env.get('PAYPAL_CLIENT_SECRET_SANDBOX');

    if (!clientId || !clientSecret) {
      console.error('PayPal credentials not found for environment:', environment);
      return new Response(
        JSON.stringify({ error: 'Payment gateway credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paypalBaseUrl = getPayPalBaseUrl(environment);

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken(clientId, clientSecret, paypalBaseUrl);

    // Create PayPal order
    const orderResponse = await fetch(`${paypalBaseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: invoiceId,
            amount: {
              currency_code: currency,
              value: amount.toFixed(2),
            },
            description: `Subscription Payment - Invoice ${invoiceId}`,
          },
        ],
        application_context: {
          brand_name: 'Family Tree Builder',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${req.headers.get('origin')}/payment-success?invoice_id=${invoiceId}`,
          cancel_url: `${req.headers.get('origin')}/payment?invoice_id=${invoiceId}&status=cancelled`,
        },
      }),
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json();
      console.error('PayPal order creation failed:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to create PayPal order', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const orderData = await orderResponse.json();

    // Update invoice with PayPal order ID
    const { error: updateError } = await supabaseClient
      .from('invoices')
      .update({ 
        paypal_order_id: orderData.id,
        payment_gateway: 'paypal'
      })
      .eq('id', invoiceId);

    if (updateError) {
      console.error('Failed to update invoice:', updateError);
    }

    console.log('PayPal order created successfully:', orderData.id);

    return new Response(
      JSON.stringify({
        orderId: orderData.id,
        approvalUrl: orderData.links.find((link: any) => link.rel === 'approve')?.href,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-paypal-payment:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
