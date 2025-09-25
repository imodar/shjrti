import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Secure CORS configuration - restrict origins in production
const getAllowedOrigins = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const projectRef = supabaseUrl.split("//")[1]?.split(".")[0];
  
  return [
    "http://localhost:3000",
    "http://localhost:5173", 
    "https://localhost:3000",
    "https://localhost:5173",
    `https://${projectRef}.lovableproject.com`,
    // Add your production domain here
  ];
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Will be replaced with specific origin
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
  // Secure CORS handling with origin validation
  const origin = req.headers.get("origin");
  const allowedOrigins = getAllowedOrigins();
  const isAllowedOrigin = !origin || allowedOrigins.includes(origin);
  
  const secureHeaders = {
    ...corsHeaders,
    "Access-Control-Allow-Origin": isAllowedOrigin ? (origin || "*") : "null",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: secureHeaders });
  }

  try {
    console.log('🚀 Create payment function started');
    
    // Create Supabase client using the anon key for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Retrieve authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header missing");
    }
    
    console.log('🔐 Authentication header found');
    
    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      throw new Error("Authentication failed: " + authError.message);
    }
    
    const user = data.user;
    if (!user?.email) {
      console.error('❌ No user or email found');
      throw new Error("User not authenticated or email not available");
    }
    
    console.log('✅ User authenticated:', user.id);

    // Get request body
    const requestBody = await req.json();
    console.log('📋 Request body:', requestBody);
    
    const { packageId, amount, currency = "SAR", invoiceId } = requestBody;
    if (!packageId || amount === undefined || amount === null) {
      throw new Error("Package ID and amount are required");
    }

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error('❌ STRIPE_SECRET_KEY not found in environment variables');
      throw new Error("Stripe configuration missing");
    }
    
    console.log('🔑 Stripe key found, initializing Stripe...');
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Check if a Stripe customer record exists for this user
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    let finalInvoiceId;

    // If invoiceId is provided, use existing invoice, otherwise create new one
    if (invoiceId) {
      // Verify the invoice belongs to the user
      const { data: existingInvoice, error: fetchError } = await supabaseClient
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('user_id', user.id)
        .eq('payment_status', 'pending')
        .single();

      if (fetchError || !existingInvoice) {
        throw new Error("Invoice not found or not accessible");
      }
      
      finalInvoiceId = invoiceId;
    } else {
      // Create new invoice in Supabase
      const { data: invoiceData, error: invoiceError } = await supabaseClient.rpc('create_invoice', {
        p_user_id: user.id,
        p_package_id: packageId,
        p_amount: amount,
        p_currency: currency
      });

      if (invoiceError) throw new Error(`Failed to create invoice: ${invoiceError.message}`);
      finalInvoiceId = invoiceData;
    }

    // Create a one-time payment session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: { 
              name: `Family Tree Subscription - Package Payment`,
              description: `Payment for family tree package subscription`
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?invoice_id=${finalInvoiceId}`,
      cancel_url: `${req.headers.get("origin")}/payments`,
      metadata: {
        invoice_id: finalInvoiceId,
        user_id: user.id,
        package_id: packageId
      }
    });

    return new Response(JSON.stringify({ 
      url: session.url,
      invoice_id: finalInvoiceId,
      session_id: session.id
    }), {
      headers: { ...secureHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    // Log full error details for debugging without exposing to client
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    
    console.error('Payment creation error:', {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString()
    });
    
    // Return sanitized error message to client
    const userMessage = errorMessage?.includes('Stripe') ? 
      'Payment processing error. Please try again.' : 
      'An error occurred while processing your request.';
      
    return new Response(JSON.stringify({ error: userMessage }), {
      headers: { ...secureHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});