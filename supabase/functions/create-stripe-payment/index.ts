import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const validateStripeSecretKey = (key: string | undefined, environment?: string) => {
  const trimmed = key?.trim() || '';

  if (!trimmed) return 'Stripe secret key is not configured';
  if (trimmed.startsWith('pk_')) return 'Stripe secret key is incorrect: you entered a publishable key (pk_). Use the secret key that starts with sk_.';
  if (trimmed.startsWith('rk_')) return 'Stripe secret key is restricted (rk_). Use the full secret key that starts with sk_.';
  if (!trimmed.startsWith('sk_test_') && !trimmed.startsWith('sk_live_')) return 'Stripe secret key format is invalid. It must start with sk_test_ or sk_live_.';
  if (environment === 'live' && !trimmed.startsWith('sk_live_')) return 'Stripe is set to live, but STRIPE_SECRET_KEY is not a live key. Use a key that starts with sk_live_ or switch Stripe to sandbox.';
  if (environment === 'sandbox' && !trimmed.startsWith('sk_test_')) return 'Stripe is set to sandbox, but STRIPE_SECRET_KEY is not a test key. Use a key that starts with sk_test_ or switch Stripe to live.';

  return null;
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

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { invoiceId, packageId, amount, currency = 'USD' } = await req.json();
    if (!invoiceId || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing invoiceId or amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify invoice belongs to user
    const { data: invoice, error: invErr } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (invErr || !invoice) {
      return new Response(
        JSON.stringify({ error: 'Invoice not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get package name for line item description
    let pkgName = 'Subscription';
    if (packageId) {
      const { data: pkg } = await supabaseAdmin
        .from('packages')
        .select('name')
        .eq('id', packageId)
        .maybeSingle();
      if (pkg?.name) {
        const n: any = pkg.name;
        pkgName = typeof n === 'string' ? n : (n.ar || n.en || 'Subscription');
      }
    }

    const { data: stripeSettings } = await supabaseAdmin
      .from('payment_gateway_settings')
      .select('environment, is_active')
      .eq('gateway_name', 'stripe')
      .maybeSingle();

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const stripeKeyError = validateStripeSecretKey(stripeKey, stripeSettings?.environment);
    if (stripeKeyError || stripeSettings?.is_active === false) {
      return new Response(
        JSON.stringify({ error: stripeSettings?.is_active === false ? 'Stripe payment gateway is disabled' : stripeKeyError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(stripeKey!, { apiVersion: '2024-06-20' });
    const origin = req.headers.get('origin') || 'https://shjrti.com';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [{
        price_data: {
          currency: (currency || 'USD').toLowerCase(),
          product_data: { name: pkgName, description: `Invoice ${invoice.invoice_number || invoiceId}` },
          unit_amount: Math.round(Number(amount) * 100),
        },
        quantity: 1,
      }],
      metadata: { invoice_id: invoiceId, user_id: user.id, package_id: packageId || '' },
      success_url: `${origin}/payment-success?invoice_id=${invoiceId}&session_id={CHECKOUT_SESSION_ID}&gateway=stripe`,
      cancel_url: `${origin}/payment?status=cancelled`,
    });

    // Store session id on invoice for later verification
    await supabaseAdmin
      .from('invoices')
      .update({
        stripe_payment_intent_id: session.id,
        payment_gateway: 'stripe',
      })
      .eq('id', invoiceId);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('create-stripe-payment error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});