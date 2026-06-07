import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!stripeKey || !webhookSecret) {
    return new Response('Stripe not configured', { status: 500, headers: corsHeaders });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing signature', { status: 400, headers: corsHeaders });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', (err as Error).message);
    return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const invoiceId = session.metadata?.invoice_id;
        const paymentIntentId = typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id;
        if (invoiceId && session.payment_status === 'paid') {
          await supabase
            .from('invoices')
            .update({ stripe_payment_intent_id: paymentIntentId, payment_gateway: 'stripe' })
            .eq('id', invoiceId);
          await supabase.rpc('complete_payment_and_upgrade', {
            p_invoice_id: invoiceId,
            p_payment_id: paymentIntentId,
            p_payment_gateway: 'stripe',
          });
        }
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const piId = typeof charge.payment_intent === 'string'
          ? charge.payment_intent
          : charge.payment_intent?.id;
        if (piId) {
          const { data: inv } = await supabase
            .from('invoices')
            .select('id, amount')
            .eq('stripe_payment_intent_id', piId)
            .maybeSingle();
          if (inv) {
            const refunded = (charge.amount_refunded || 0) / 100;
            const newStatus = refunded >= Number(inv.amount) ? 'refunded' : 'partially_refunded';
            await supabase
              .from('invoices')
              .update({ payment_status: newStatus, status: newStatus, updated_at: new Date().toISOString() })
              .eq('id', inv.id);
          }
        }
        break;
      }
      default:
        // ignore other events
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('stripe-webhook handler error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});