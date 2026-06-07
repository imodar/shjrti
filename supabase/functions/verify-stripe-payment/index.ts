import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, paymentIntentId: paymentIntentIdInput, invoiceId } = await req.json();
    if (!sessionId && !paymentIntentIdInput) {
      return new Response(
        JSON.stringify({ error: 'Missing sessionId or paymentIntentId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: 'Stripe not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });

    let metadataInvoiceId: string | undefined;
    let paymentIntentId: string | undefined;
    let paid = false;

    if (paymentIntentIdInput) {
      const pi = await stripe.paymentIntents.retrieve(paymentIntentIdInput);
      paid = pi.status === 'succeeded';
      paymentIntentId = pi.id;
      metadataInvoiceId = pi.metadata?.invoice_id;
      if (!paid) {
        return new Response(
          JSON.stringify({ success: false, status: pi.status }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent'] });
      if (session.payment_status !== 'paid') {
        return new Response(
          JSON.stringify({ success: false, status: session.payment_status }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      metadataInvoiceId = session.metadata?.invoice_id;
      paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const targetInvoiceId = invoiceId || metadataInvoiceId;
    if (!targetInvoiceId) {
      return new Response(
        JSON.stringify({ error: 'No invoice associated' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store payment_intent id and upgrade subscription
    await supabaseAdmin
      .from('invoices')
      .update({ stripe_payment_intent_id: paymentIntentId, payment_gateway: 'stripe' })
      .eq('id', targetInvoiceId);

    const { error: rpcErr } = await supabaseAdmin.rpc('complete_payment_and_upgrade', {
      p_invoice_id: targetInvoiceId,
      p_payment_id: paymentIntentId,
      p_payment_gateway: 'stripe',
    });

    if (rpcErr) {
      console.error('complete_payment_and_upgrade error:', rpcErr);
      return new Response(
        JSON.stringify({ success: false, error: rpcErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, invoiceId: targetInvoiceId, paymentIntentId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('verify-stripe-payment error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});