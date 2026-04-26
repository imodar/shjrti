import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Cancel old pending invoices when a new one is created or when a newer invoice is paid
    const { data: pendingInvoices, error: fetchError } = await supabaseClient
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .eq('payment_status', 'pending')
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    // Get the latest invoice (regardless of status) to check if we should cancel old pending ones
    const { data: latestInvoices, error: latestError } = await supabaseClient
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(2);

    if (latestError) {
      throw latestError;
    }

    // If there are pending invoices and there's a newer paid/active invoice, cancel all pending ones
    if (pendingInvoices && pendingInvoices.length > 0 && latestInvoices && latestInvoices.length > 0) {
      const latestInvoice = latestInvoices[0];
      
      // If the latest invoice is paid/completed, cancel all pending invoices
      // OR if there are multiple pending invoices, cancel all except the most recent one
      let invoicesToCancel = [];
      
      if (latestInvoice.payment_status === 'paid') {
        // Cancel all pending invoices if the latest invoice is paid
        invoicesToCancel = pendingInvoices;
      } else if (pendingInvoices.length > 1) {
        // Keep only the most recent pending invoice
        invoicesToCancel = pendingInvoices.slice(1);
      }

      if (invoicesToCancel.length > 0) {
        const { error: updateError } = await supabaseClient
          .from('invoices')
          .update({ 
            payment_status: 'cancelled',
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .in('id', invoicesToCancel.map(inv => inv.id));

        if (updateError) {
          throw updateError;
        }

        return new Response(JSON.stringify({ 
          success: true, 
          cancelledCount: invoicesToCancel.length,
          message: `تم إلغاء ${invoicesToCancel.length} فاتورة معلقة قديمة`
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      cancelledCount: 0,
      message: "لا توجد فواتير معلقة قديمة للإلغاء"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error cancelling pending invoices:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? (error as Error).message : 'حدث خطأ غير متوقع'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});