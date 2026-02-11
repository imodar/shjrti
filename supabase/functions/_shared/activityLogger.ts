/**
 * Shared Activity Logger
 * Logs user actions to the activity_log table using service role
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export type ActivityActionType =
  | 'member_added'
  | 'member_updated'
  | 'member_deleted'
  | 'photo_uploaded'
  | 'photo_deleted'
  | 'marriage_added'
  | 'marriage_deleted'
  | 'settings_changed'
  | 'family_created'
  | 'collaborator_invited';

interface LogActivityParams {
  familyId: string;
  userId: string;
  actionType: ActivityActionType;
  targetName?: string;
  metadata?: Record<string, unknown>;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    await supabase.from('activity_log').insert({
      family_id: params.familyId,
      user_id: params.userId,
      action_type: params.actionType,
      target_name: params.targetName || null,
      metadata: params.metadata || {},
    });
  } catch (error) {
    // Non-blocking: log error but don't fail the main operation
    console.warn('[ActivityLogger] Failed to log activity:', error);
  }
}
