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
    // Initialize Supabase client with service role for database operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const { orderId, invoiceId } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Missing orderId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get invoice to verify it exists
    let invoice;
    if (invoiceId) {
      const { data: invoiceData, error: invoiceError } = await supabaseClient
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (invoiceError) {
        console.error('Invoice not found:', invoiceError);
        return new Response(
          JSON.stringify({ error: 'Invoice not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      invoice = invoiceData;
    } else {
      // Find invoice by PayPal order ID
      const { data: invoiceData, error: invoiceError } = await supabaseClient
        .from('invoices')
        .select('*')
        .eq('paypal_order_id', orderId)
        .single();

      if (invoiceError) {
        console.error('Invoice not found by order ID:', invoiceError);
        return new Response(
          JSON.stringify({ error: 'Invoice not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      invoice = invoiceData;
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
    
    // Get appropriate credentials
    const clientId = environment === 'live'
      ? Deno.env.get('PAYPAL_CLIENT_ID_LIVE')
      : Deno.env.get('PAYPAL_CLIENT_ID_SANDBOX');
    
    const clientSecret = environment === 'live'
      ? Deno.env.get('PAYPAL_CLIENT_SECRET_LIVE')
      : Deno.env.get('PAYPAL_CLIENT_SECRET_SANDBOX');

    if (!clientId || !clientSecret) {
      console.error('PayPal credentials not found');
      return new Response(
        JSON.stringify({ error: 'Payment gateway credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paypalBaseUrl = getPayPalBaseUrl(environment);

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken(clientId, clientSecret, paypalBaseUrl);

    // Capture the PayPal order
    const captureResponse = await fetch(`${paypalBaseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!captureResponse.ok) {
      const errorData = await captureResponse.json();
      console.error('PayPal capture failed:', errorData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Payment capture failed', 
          details: errorData 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const captureData = await captureResponse.json();
    console.log('PayPal payment captured:', captureData);

    // Check if payment was successful
    if (captureData.status === 'COMPLETED') {
      const captureId = captureData.purchase_units[0]?.payments?.captures[0]?.id;
      console.log('Payment completed successfully for invoice:', invoice.id);
      
      // Upgrade subscription using RPC (this now handles invoice update internally)
      console.log('Calling complete_payment_and_upgrade RPC with invoice:', invoice.id);
      const { data: upgradeResult, error: upgradeError } = await supabaseClient
        .rpc('complete_payment_and_upgrade', {
          p_invoice_id: invoice.id,
          p_payment_id: captureId,
          p_payment_gateway: 'paypal',
        });

      if (upgradeError) {
        console.error('Failed to upgrade subscription:', upgradeError);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Payment completed but subscription upgrade failed',
            details: upgradeError,
            orderId: orderId
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Subscription upgraded successfully. Result:', upgradeResult);

      // Verify the upgrade actually happened
      const { data: verifySubscription, error: verifyError } = await supabaseClient
        .from('user_subscriptions')
        .select('package_id, expires_at')
        .eq('user_id', invoice.user_id)
        .eq('status', 'active')
        .single();

      if (verifyError || !verifySubscription) {
        console.error('Failed to verify subscription upgrade:', verifyError);
      } else if (verifySubscription.package_id !== invoice.package_id) {
        console.error('CRITICAL: Package mismatch after upgrade!', {
          expected: invoice.package_id,
          actual: verifySubscription.package_id
        });
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Package upgrade verification failed',
            expected: invoice.package_id,
            actual: verifySubscription.package_id,
            orderId: orderId
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.log('Subscription upgrade verified successfully:', {
          package_id: verifySubscription.package_id,
          expires_at: verifySubscription.expires_at
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          orderId: orderId,
          captureId: captureId,
          status: 'COMPLETED',
          invoiceId: invoice.id,
          packageId: verifySubscription?.package_id,
          expiresAt: verifySubscription?.expires_at,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          status: captureData.status,
          error: 'Payment not completed'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in verify-paypal-payment:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message || 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
