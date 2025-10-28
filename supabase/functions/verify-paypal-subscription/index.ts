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

    const { subscriptionId, invoiceId } = await req.json();

    if (!subscriptionId || !invoiceId) {
      return new Response(
        JSON.stringify({ error: 'Missing subscriptionId or invoiceId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get invoice
    const { data: invoice } = await supabaseClient
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (!invoice) {
      return new Response(
        JSON.stringify({ error: 'Invoice not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Get subscription details
    const subscriptionResponse = await fetch(`${paypalBaseUrl}/v1/billing/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!subscriptionResponse.ok) {
      const errorData = await subscriptionResponse.json();
      console.error('Failed to get subscription:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to verify subscription', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const subscriptionData = await subscriptionResponse.json();
    console.log('Subscription status:', subscriptionData.status);

    // Check if subscription is active
    if (subscriptionData.status === 'ACTIVE') {
      // Update invoice
      await supabaseClient
        .from('invoices')
        .update({
          billing_agreement_id: subscriptionId,
          payment_status: 'paid',
          status: 'paid',
          is_recurring: true,
          payment_gateway: 'paypal',
        })
        .eq('id', invoiceId);

      // Upgrade subscription
      const { error: upgradeError } = await supabaseClient
        .rpc('complete_payment_and_upgrade', {
          p_invoice_id: invoiceId,
          p_payment_id: subscriptionId,
          p_payment_gateway: 'paypal',
        });

      if (upgradeError) {
        console.error('Failed to upgrade subscription:', upgradeError);
        return new Response(
          JSON.stringify({ error: 'Subscription created but upgrade failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Store subscription ID in user_subscriptions
      await supabaseClient
        .from('user_subscriptions')
        .update({
          paypal_subscription_id: subscriptionId,
        })
        .eq('user_id', invoice.user_id)
        .eq('status', 'active');

      return new Response(
        JSON.stringify({
          success: true,
          subscriptionId,
          status: subscriptionData.status,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Subscription not active',
          status: subscriptionData.status,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in verify-paypal-subscription:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});