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

    // Update user subscription to the new package
    const { data: updatedSub, error: updateError } = await supabaseClient
      .from('user_subscriptions')
      .update({
        package_id: invoice.package_id,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', invoice.user_id)
      .eq('status', 'active')
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update subscription:', updateError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to update subscription',
          details: updateError 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Subscription updated successfully:', updatedSub);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Subscription updated successfully',
        subscription: updatedSub,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fix-paid-subscription:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
