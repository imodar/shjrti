import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function for logging
const logStep = (step: string) => {
  console.log(`[DELETE-USER] ${step}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Starting user account deletion process');

    // Initialize Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get the current user from the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized: Could not verify user');
    }

    const userId = user.id;
    logStep(`Deleting account for user: ${userId}`);

    // Step 1: Delete family tree members and related data
    logStep('Step 1: Deleting family tree members');
    const { error: treeMembersError } = await supabaseAdmin
      .from('family_tree_members')
      .delete()
      .in('family_id', 
        supabaseAdmin
          .from('families')
          .select('id')
          .eq('creator_id', userId)
      );

    if (treeMembersError) {
      logStep(`Error deleting family tree members: ${treeMembersError.message}`);
    }

    // Step 2: Delete marriages
    logStep('Step 2: Deleting marriages');
    const { error: marriagesError } = await supabaseAdmin
      .from('marriages')
      .delete()
      .in('family_id',
        supabaseAdmin
          .from('families')
          .select('id')
          .eq('creator_id', userId)
      );

    if (marriagesError) {
      logStep(`Error deleting marriages: ${marriagesError.message}`);
    }

    // Step 3: Delete member memories (from database)
    logStep('Step 3: Deleting member memories records');
    const { error: memberMemoriesError } = await supabaseAdmin
      .from('member_memories')
      .delete()
      .eq('uploaded_by', userId);

    if (memberMemoriesError) {
      logStep(`Error deleting member memories: ${memberMemoriesError.message}`);
    }

    // Step 4: Delete family memories (from database)
    logStep('Step 4: Deleting family memories records');
    const { error: familyMemoriesError } = await supabaseAdmin
      .from('family_memories')
      .delete()
      .eq('uploaded_by', userId);

    if (familyMemoriesError) {
      logStep(`Error deleting family memories: ${familyMemoriesError.message}`);
    }

    // Step 5: Delete files from storage buckets
    logStep('Step 5: Deleting files from storage');
    try {
      // Delete from member-memories bucket
      const { data: memberFiles } = await supabaseAdmin
        .storage
        .from('member-memories')
        .list(userId);

      if (memberFiles && memberFiles.length > 0) {
        const memberFilePaths = memberFiles.map(file => `${userId}/${file.name}`);
        await supabaseAdmin
          .storage
          .from('member-memories')
          .remove(memberFilePaths);
        logStep(`Deleted ${memberFilePaths.length} files from member-memories`);
      }

      // Delete from family-memories bucket
      const { data: familyFiles } = await supabaseAdmin
        .storage
        .from('family-memories')
        .list(userId);

      if (familyFiles && familyFiles.length > 0) {
        const familyFilePaths = familyFiles.map(file => `${userId}/${file.name}`);
        await supabaseAdmin
          .storage
          .from('family-memories')
          .remove(familyFilePaths);
        logStep(`Deleted ${familyFilePaths.length} files from family-memories`);
      }
    } catch (storageError: any) {
      logStep(`Error deleting storage files: ${storageError.message}`);
    }

    // Step 6: Delete family members associations
    logStep('Step 6: Deleting family members associations');
    const { error: familyMembersError } = await supabaseAdmin
      .from('family_members')
      .delete()
      .eq('user_id', userId);

    if (familyMembersError) {
      logStep(`Error deleting family members: ${familyMembersError.message}`);
    }

    // Step 7: Delete families created by user
    logStep('Step 7: Deleting families');
    const { error: familiesError } = await supabaseAdmin
      .from('families')
      .delete()
      .eq('creator_id', userId);

    if (familiesError) {
      logStep(`Error deleting families: ${familiesError.message}`);
    }

    // Step 8: Delete user subscriptions
    logStep('Step 8: Deleting user subscriptions');
    const { error: subscriptionsError } = await supabaseAdmin
      .from('user_subscriptions')
      .delete()
      .eq('user_id', userId);

    if (subscriptionsError) {
      logStep(`Error deleting subscriptions: ${subscriptionsError.message}`);
    }

    // Step 9: Delete notifications
    logStep('Step 9: Deleting notifications');
    const { error: notificationsError } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (notificationsError) {
      logStep(`Error deleting notifications: ${notificationsError.message}`);
    }

    // Step 10: Delete invoices
    logStep('Step 10: Deleting invoices');
    const { error: invoicesError } = await supabaseAdmin
      .from('invoices')
      .delete()
      .eq('user_id', userId);

    if (invoicesError) {
      logStep(`Error deleting invoices: ${invoicesError.message}`);
    }

    // Step 11: Delete store orders
    logStep('Step 11: Deleting store orders');
    const { error: ordersError } = await supabaseAdmin
      .from('store_orders')
      .delete()
      .eq('user_id', userId);

    if (ordersError) {
      logStep(`Error deleting store orders: ${ordersError.message}`);
    }

    // Step 12: Delete smart suggestions
    logStep('Step 12: Deleting smart suggestions');
    const { error: suggestionsError } = await supabaseAdmin
      .from('smart_suggestions')
      .delete()
      .eq('user_id', userId);

    if (suggestionsError) {
      logStep(`Error deleting smart suggestions: ${suggestionsError.message}`);
    }

    // Step 13: Delete tree edit suggestions
    logStep('Step 13: Deleting tree edit suggestions');
    const { error: treeEditSuggestionsError } = await supabaseAdmin
      .from('tree_edit_suggestions')
      .delete()
      .eq('reviewed_by', userId);

    if (treeEditSuggestionsError) {
      logStep(`Error deleting tree edit suggestions: ${treeEditSuggestionsError.message}`);
    }

    // Step 14: Delete user status
    logStep('Step 14: Deleting user status');
    const { error: userStatusError } = await supabaseAdmin
      .from('user_status')
      .delete()
      .eq('user_id', userId);

    if (userStatusError) {
      logStep(`Error deleting user status: ${userStatusError.message}`);
    }

    // Step 15: Delete scheduled package changes
    logStep('Step 15: Deleting scheduled package changes');
    const { error: scheduledChangesError } = await supabaseAdmin
      .from('scheduled_package_changes')
      .delete()
      .eq('user_id', userId);

    if (scheduledChangesError) {
      logStep(`Error deleting scheduled package changes: ${scheduledChangesError.message}`);
    }

    // Step 16: Delete profile
    logStep('Step 16: Deleting profile');
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', userId);

    if (profileError) {
      logStep(`Error deleting profile: ${profileError.message}`);
    }

    // Step 17: Finally, delete the user from Auth
    logStep('Step 17: Deleting user from Auth');
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      logStep(`Error deleting user from Auth: ${deleteUserError.message}`);
      throw new Error(`Failed to delete user from Auth: ${deleteUserError.message}`);
    }

    logStep('✓ User account deletion completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Account deleted successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error in delete-current-user function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: (error as Error).message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
