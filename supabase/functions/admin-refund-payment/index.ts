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
    // Initialize Supabase client with user token
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

    // Verify user is admin using service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: isAdmin, error: adminError } = await supabaseAdmin
      .rpc('is_admin', { user_uuid: user.id });

    if (adminError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { invoiceId, reason, amount } = await req.json();

    if (!invoiceId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: invoiceId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return new Response(
        JSON.stringify({ error: 'Invoice not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if invoice has a capture ID (required for refund)
    if (!invoice.paypal_capture_id) {
      return new Response(
        JSON.stringify({ error: 'No PayPal capture ID found. Cannot refund unpaid or non-PayPal invoices.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already refunded
    if (invoice.payment_status === 'refunded') {
      return new Response(
        JSON.stringify({ error: 'Invoice has already been refunded' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get payment gateway settings
    const { data: gatewaySettings, error: settingsError } = await supabaseAdmin
      .from('payment_gateway_settings')
      .select('*')
      .eq('gateway_name', 'paypal')
      .eq('is_active', true)
      .single();

    if (settingsError || !gatewaySettings) {
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
      return new Response(
        JSON.stringify({ error: 'Payment gateway credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paypalBaseUrl = getPayPalBaseUrl(environment);
    const accessToken = await getPayPalAccessToken(clientId, clientSecret, paypalBaseUrl);

    // Prepare refund request body
    const refundBody: Record<string, unknown> = {};
    
    // If partial refund amount specified
    if (amount && amount < invoice.amount) {
      refundBody.amount = {
        value: amount.toFixed(2),
        currency_code: invoice.currency || 'USD'
      };
    }

    // Add note if reason provided
    if (reason) {
      refundBody.note_to_payer = reason.substring(0, 255); // PayPal limit
    }

    // Call PayPal Refund API
    const refundResponse = await fetch(
      `${paypalBaseUrl}/v2/payments/captures/${invoice.paypal_capture_id}/refund`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: Object.keys(refundBody).length > 0 ? JSON.stringify(refundBody) : undefined,
      }
    );

    if (!refundResponse.ok) {
      const errorData = await refundResponse.json();
      console.error('PayPal refund failed:', errorData);
      return new Response(
        JSON.stringify({ 
          error: 'Refund failed', 
          details: errorData 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const refundData = await refundResponse.json();
    console.log('PayPal refund successful:', refundData);

    // Update invoice status
    const refundAmount = amount || invoice.amount;
    const newStatus = refundAmount >= invoice.amount ? 'refunded' : 'partially_refunded';

    const { error: updateError } = await supabaseAdmin
      .from('invoices')
      .update({ 
        payment_status: newStatus,
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId);

    if (updateError) {
      console.error('Failed to update invoice status:', updateError);
    }

    // Log the refund action in admin audit
    await supabaseAdmin
      .from('admin_audit_log')
      .insert({
        admin_user_id: user.id,
        action_type: 'refund',
        table_name: 'invoices',
        record_id: invoiceId,
        old_value: { payment_status: invoice.payment_status, amount: invoice.amount },
        new_value: { 
          payment_status: newStatus, 
          refund_amount: refundAmount,
          refund_id: refundData.id,
          reason: reason || null
        }
      });

    // Optionally downgrade subscription if full refund
    if (newStatus === 'refunded') {
      // Get free package
      const { data: freePackage } = await supabaseAdmin
        .from('packages')
        .select('id')
        .eq('price_usd', 0)
        .eq('is_active', true)
        .single();

      if (freePackage) {
        // Update subscription to free package
        const { error: subError } = await supabaseAdmin
          .from('user_subscriptions')
          .update({ 
            package_id: freePackage.id,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', invoice.user_id)
          .eq('status', 'active');

        if (subError) {
          console.error('Failed to downgrade subscription:', subError);
        } else {
          console.log('User subscription downgraded to free package');
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        refundId: refundData.id,
        status: refundData.status,
        amount: refundAmount,
        invoiceId: invoiceId,
        newPaymentStatus: newStatus
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-refund-payment:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
