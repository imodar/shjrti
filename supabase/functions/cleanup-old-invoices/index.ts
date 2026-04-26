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

    console.log(`Cleaning up old invoices for user: ${user.id}`);

    // Get all invoices for this user
    const { data: allInvoices, error: fetchError } = await supabaseClient
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    if (!allInvoices || allInvoices.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        cancelledCount: 0,
        message: "لا توجد فواتير للمعالجة"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log(`Found ${allInvoices.length} total invoices`);

    // Find the latest paid/completed invoice
    const latestPaidInvoice = allInvoices.find(invoice => 
      invoice.payment_status === 'paid' || invoice.status === 'paid'
    );

    // Get all pending invoices
    const pendingInvoices = allInvoices.filter(invoice => 
      invoice.payment_status === 'pending' && invoice.status === 'pending'
    );

    console.log(`Found ${pendingInvoices.length} pending invoices`);

    let invoicesToCancel = [];

    if (latestPaidInvoice && pendingInvoices.length > 0) {
      // If there's a paid invoice, cancel all pending invoices that are older
      invoicesToCancel = pendingInvoices.filter(pendingInvoice => 
        new Date(pendingInvoice.created_at) < new Date(latestPaidInvoice.created_at)
      );
      
      console.log(`Found ${invoicesToCancel.length} pending invoices older than latest paid invoice`);
    } else if (pendingInvoices.length > 1) {
      // If there are multiple pending invoices but no paid invoice yet, 
      // keep only the most recent pending invoice
      invoicesToCancel = pendingInvoices.slice(1);
      
      console.log(`Keeping most recent pending invoice, cancelling ${invoicesToCancel.length} older pending invoices`);
    }

    if (invoicesToCancel.length > 0) {
      const invoiceIds = invoicesToCancel.map(inv => inv.id);
      console.log(`Cancelling invoices: ${invoiceIds.join(', ')}`);
      
      const { error: updateError } = await supabaseClient
        .from('invoices')
        .update({ 
          payment_status: 'cancelled',
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .in('id', invoiceIds);

      if (updateError) {
        console.error('Error updating invoices:', updateError);
        throw updateError;
      }

      console.log(`Successfully cancelled ${invoicesToCancel.length} invoices`);

      return new Response(JSON.stringify({ 
        success: true, 
        cancelledCount: invoicesToCancel.length,
        message: `تم إلغاء ${invoicesToCancel.length} فاتورة قديمة`,
        cancelledInvoices: invoiceIds
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      cancelledCount: 0,
      message: "لا توجد فواتير قديمة للإلغاء"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error cleaning up old invoices:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? (error as Error).message : 'حدث خطأ غير متوقع'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
