import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { invoiceId } = await req.json();

    if (!invoiceId) {
      return new Response(
        JSON.stringify({ error: 'Missing invoiceId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fixing subscription for invoice:', invoiceId);

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error('Invoice not found:', invoiceError);
      return new Response(
        JSON.stringify({ error: 'Invoice not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if invoice is paid
    if (invoice.payment_status !== 'paid') {
      return new Response(
        JSON.stringify({ error: 'Invoice is not paid yet' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Invoice found and paid. Updating subscription...');

    // Use the complete_payment_and_upgrade RPC to ensure proper upgrade
    console.log('Calling complete_payment_and_upgrade RPC...');
    const { data: upgradeResult, error: upgradeError } = await supabaseClient
      .rpc('complete_payment_and_upgrade', {
        p_invoice_id: invoiceId,
        p_payment_id: invoice.paypal_order_id || invoice.paypal_capture_id || invoice.stripe_payment_intent_id,
        p_payment_gateway: invoice.payment_gateway || 'paypal',
      });

    if (upgradeError) {
      console.error('Failed to upgrade subscription via RPC:', upgradeError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to upgrade subscription',
          details: upgradeError 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Subscription upgrade completed. Result:', upgradeResult);

    // Verify the upgrade actually happened
    const { data: verifySubscription, error: verifyError } = await supabaseClient
      .from('user_subscriptions')
      .select('package_id, expires_at, status')
      .eq('user_id', invoice.user_id)
      .eq('status', 'active')
      .single();

    if (verifyError || !verifySubscription) {
      console.error('Failed to verify subscription:', verifyError);
      return new Response(
        JSON.stringify({ 
          error: 'Upgrade completed but verification failed',
          details: verifyError 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (verifySubscription.package_id !== invoice.package_id) {
      console.error('Package mismatch after upgrade:', {
        expected: invoice.package_id,
        actual: verifySubscription.package_id
      });
      return new Response(
        JSON.stringify({ 
          error: 'Package verification failed',
          expected: invoice.package_id,
          actual: verifySubscription.package_id
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Subscription verified successfully:', verifySubscription);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Subscription upgraded and verified successfully',
        subscription: verifySubscription,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fix-paid-subscription:', error);
    return new Response(
      JSON.stringify({ 
        error: (error as Error).message || 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
