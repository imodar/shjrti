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
    // Create Supabase client using the anon key for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Retrieve authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    // Get request body
    const { packageId, amount, currency = "SAR" } = await req.json();
    if (!packageId || !amount) throw new Error("Package ID and amount are required");

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if a Stripe customer record exists for this user
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create invoice in Supabase first
    const { data: invoiceData, error: invoiceError } = await supabaseClient.rpc('create_invoice', {
      p_user_id: user.id,
      p_package_id: packageId,
      p_amount: amount,
      p_currency: currency
    });

    if (invoiceError) throw new Error(`Failed to create invoice: ${invoiceError.message}`);

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
      success_url: `${req.headers.get("origin")}/payment-success?invoice_id=${invoiceData}`,
      cancel_url: `${req.headers.get("origin")}/payments`,
      metadata: {
        invoice_id: invoiceData,
        user_id: user.id,
        package_id: packageId
      }
    });

    return new Response(JSON.stringify({ 
      url: session.url,
      invoice_id: invoiceData,
      session_id: session.id
    }), {
      headers: { ...secureHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    // Log full error details for debugging without exposing to client
    console.error('Payment creation error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Return sanitized error message to client
    const userMessage = error.message?.includes('Stripe') ? 
      'Payment processing error. Please try again.' : 
      'An error occurred while processing your request.';
      
    return new Response(JSON.stringify({ error: userMessage }), {
      headers: { ...secureHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});