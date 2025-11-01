import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduledChange {
  id: string;
  user_id: string;
  target_package_id: string;
  scheduled_date: string;
  status: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting scheduled package changes processing...');

    // Get all pending scheduled changes that are due
    const { data: scheduledChanges, error: fetchError } = await supabase
      .from('scheduled_package_changes')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_date', new Date().toISOString())
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching scheduled changes:', fetchError);
      throw fetchError;
    }

    if (!scheduledChanges || scheduledChanges.length === 0) {
      console.log('No scheduled changes to process');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No scheduled changes to process',
          processed: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    console.log(`Found ${scheduledChanges.length} scheduled changes to process`);

    let successCount = 0;
    let errorCount = 0;
    const errors: any[] = [];

    // Process each scheduled change
    for (const change of scheduledChanges as ScheduledChange[]) {
      try {
        console.log(`Processing change ${change.id} for user ${change.user_id}`);

        // Call the database function to process the change
        const { data, error: rpcError } = await supabase.rpc(
          'process_scheduled_package_change',
          {
            p_user_id: change.user_id,
            p_scheduled_change_id: change.id
          }
        );

        if (rpcError) {
          console.error(`Error processing change ${change.id}:`, rpcError);
          errorCount++;
          errors.push({
            change_id: change.id,
            user_id: change.user_id,
            error: rpcError.message
          });
        } else if (data === true) {
          console.log(`Successfully processed change ${change.id}`);
          successCount++;
        } else {
          console.warn(`Failed to process change ${change.id} - returned false`);
          errorCount++;
        }
      } catch (err) {
        console.error(`Exception processing change ${change.id}:`, err);
        errorCount++;
        errors.push({
          change_id: change.id,
          user_id: change.user_id,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    console.log(`Processing complete. Success: ${successCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${scheduledChanges.length} scheduled changes`,
        processed: successCount,
        errors: errorCount,
        errorDetails: errors.length > 0 ? errors : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Error in process-scheduled-package-changes:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
