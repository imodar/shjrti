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
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: isAdmin } = await supabaseAdmin.rpc('is_admin', { user_uuid: user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { invoiceId, reason, amount } = await req.json();
    if (!invoiceId) {
      return new Response(JSON.stringify({ error: 'Missing invoiceId' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: invoice } = await supabaseAdmin
      .from('invoices').select('*').eq('id', invoiceId).maybeSingle();
    if (!invoice) {
      return new Response(JSON.stringify({ error: 'Invoice not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!invoice.stripe_payment_intent_id) {
      return new Response(JSON.stringify({ error: 'No Stripe payment intent on this invoice' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (invoice.payment_status === 'refunded') {
      return new Response(JSON.stringify({ error: 'Already refunded' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const stripe = new Stripe(stripeKey!, { apiVersion: '2024-06-20' });

    const refundAmount = amount && amount < invoice.amount ? amount : invoice.amount;
    const refund = await stripe.refunds.create({
      payment_intent: invoice.stripe_payment_intent_id,
      amount: Math.round(refundAmount * 100),
      reason: 'requested_by_customer',
      metadata: { invoice_id: invoiceId, reason: reason || '' },
    });

    const newStatus = refundAmount >= Number(invoice.amount) ? 'refunded' : 'partially_refunded';
    await supabaseAdmin
      .from('invoices')
      .update({ payment_status: newStatus, status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', invoiceId);

    await supabaseAdmin.from('admin_audit_log').insert({
      admin_user_id: user.id,
      action_type: 'stripe_refund',
      table_name: 'invoices',
      record_id: invoiceId,
      old_value: { payment_status: invoice.payment_status, amount: invoice.amount },
      new_value: { payment_status: newStatus, refund_amount: refundAmount, refund_id: refund.id, reason: reason || null },
    });

    // Downgrade subscription on full refund
    if (newStatus === 'refunded') {
      const { data: freePackage } = await supabaseAdmin
        .from('packages').select('id').eq('price_usd', 0).eq('is_active', true).maybeSingle();
      if (freePackage) {
        await supabaseAdmin
          .from('user_subscriptions')
          .update({ package_id: freePackage.id, updated_at: new Date().toISOString() })
          .eq('user_id', invoice.user_id)
          .eq('status', 'active');
      }
    }

    return new Response(JSON.stringify({
      success: true, refundId: refund.id, status: refund.status,
      amount: refundAmount, invoiceId, newPaymentStatus: newStatus,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('admin-stripe-refund error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});