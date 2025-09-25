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
    // Use service role to update payment status
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { session_id, invoice_id } = await req.json();
    if (!session_id) throw new Error("Session ID is required");

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
      // Complete payment and upgrade subscription
      const { data, error } = await supabaseClient.rpc('complete_payment_and_upgrade', {
        p_invoice_id: invoice_id,
        p_stripe_payment_intent_id: session.payment_intent as string
      });

      if (error) throw new Error(`Failed to complete payment: ${error.message}`);

      return new Response(JSON.stringify({ 
        success: true, 
        payment_status: 'paid',
        message: 'Payment completed successfully and subscription upgraded'
      }), {
        headers: { ...secureHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      return new Response(JSON.stringify({ 
        success: false, 
        payment_status: session.payment_status,
        message: 'Payment not completed yet'
      }), {
        headers: { ...secureHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error) {
    // Log full error details for debugging without exposing to client
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    
    console.error('Payment verification error:', {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString()
    });
    
    // Return sanitized error message to client
    const userMessage = 'An error occurred while verifying payment. Please contact support if payment was deducted.';
      
    return new Response(JSON.stringify({ error: userMessage }), {
      headers: { ...secureHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});