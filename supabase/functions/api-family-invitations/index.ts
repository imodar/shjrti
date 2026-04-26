/**
 * API: Family Invitations & Collaborators
 * 
 * Endpoints:
 * GET    ?family_id=xxx                → List collaborators + pending invitations
 * POST   ?action=invite                → Send invitation (owner only, Plus+ plan)
 * POST   ?action=accept                → Accept invitation (by token)
 * POST   ?action=validate-token        → Validate token (public, no auth required)
 * DELETE ?id=xxx                       → Remove collaborator or revoke invitation
 * DELETE ?action=leave&family_id=xxx   → Collaborator leaves family
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
};

function successResponse<T>(data: T, status = 200) {
  return new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(code: string, message: string, status = 400) {
  console.error(`[API Error] ${code}: ${message}`);
  return new Response(JSON.stringify({ success: false, error: { code, message } }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function createServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function createUserClient(authHeader: string) {
  const token = authHeader.replace('Bearer ', '');
  return createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_ANON_KEY') || '',
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    }
  );
}

async function authenticateRequest(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: errorResponse('UNAUTHORIZED', 'Missing authorization header', 401) };
  }
  const supabase = createUserClient(authHeader);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { error: errorResponse('UNAUTHORIZED', 'Invalid or expired token', 401) };
  }
  return { user, supabase };
}

// Generate a secure random token
function generateToken(): string {
  const array = new Uint8Array(48);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(36).padStart(2, '0')).join('').slice(0, 64);
}

// Check if user's subscription supports collaborators
async function checkPlusPlan(userId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('user_subscriptions')
    .select('package_id, packages!inner(name, custom_domains_enabled)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  
  // Plus plans have custom_domains_enabled = true as a proxy
  return !!(data as any)?.packages?.custom_domains_enabled;
}

// GET: List collaborators and invitations for a family
async function handleList(userId: string, familyId: string) {
  const supabase = createServiceClient();
  
  // Verify ownership
  const { data: family } = await supabase
    .from('families')
    .select('id')
    .eq('id', familyId)
    .eq('creator_id', userId)
    .maybeSingle();
  
  if (!family) {
    return errorResponse('FORBIDDEN', 'Only the family owner can view collaborators', 403);
  }

  // Fetch collaborators with profile info
  const { data: collaborators } = await supabase
    .from('family_collaborators')
    .select('id, user_id, role, created_at')
    .eq('family_id', familyId);

  // Fetch profile info for each collaborator
  const enrichedCollaborators = [];
  for (const collab of (collaborators || [])) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('user_id', collab.user_id)
      .maybeSingle();
    
    enrichedCollaborators.push({
      ...collab,
      email: profile?.email || '',
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
    });
  }

  // Fetch pending invitations
  const { data: invitations } = await supabase
    .from('family_invitations')
    .select('id, invited_email, role, status, expires_at, created_at')
    .eq('family_id', familyId)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString());

  return successResponse({
    collaborators: enrichedCollaborators || [],
    invitations: invitations || [],
  });
}

// POST: Send invitation
async function handleInvite(userId: string, body: Record<string, unknown>) {
  const { family_id, email } = body;
  
  if (!family_id || !email) {
    return errorResponse('VALIDATION_ERROR', 'family_id and email are required');
  }

  const supabase = createServiceClient();

  // Verify ownership
  const { data: family } = await supabase
    .from('families')
    .select('id, creator_id')
    .eq('id', family_id)
    .eq('creator_id', userId)
    .maybeSingle();
  
  if (!family) {
    return errorResponse('FORBIDDEN', 'Only the family owner can send invitations', 403);
  }

  // Check Plus plan
  if (!await checkPlusPlan(userId)) {
    return errorResponse('PLAN_REQUIRED', 'Collaborator feature requires Plus plan or above', 403);
  }

  // Check not inviting self
  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('email')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (ownerProfile?.email === email) {
    return errorResponse('VALIDATION_ERROR', 'Cannot invite yourself');
  }

  // Check if already a collaborator
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('email', email as string)
    .maybeSingle();
  
  if (existingUser) {
    const { data: existingCollab } = await supabase
      .from('family_collaborators')
      .select('id')
      .eq('family_id', family_id as string)
      .eq('user_id', existingUser.user_id)
      .maybeSingle();
    
    if (existingCollab) {
      return errorResponse('ALREADY_COLLABORATOR', 'This user is already a collaborator');
    }
  }

  // Check for existing pending invitation
  const { data: existingInvitation } = await supabase
    .from('family_invitations')
    .select('id')
    .eq('family_id', family_id as string)
    .eq('invited_email', email as string)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  
  if (existingInvitation) {
    return errorResponse('ALREADY_INVITED', 'An active invitation already exists for this email');
  }

  // Create invitation
  const token = generateToken();
  const { data: invitation, error } = await supabase
    .from('family_invitations')
    .insert({
      family_id,
      invited_by: userId,
      invited_email: email,
      role: 'editor',
      token,
      status: 'pending',
    })
    .select()
    .single();
  
  if (error) {
    return errorResponse('DATABASE_ERROR', (error as Error).message, 500);
  }

  // Send invitation email via send-templated-email
  try {
    const { data: familyInfo } = await supabase
      .from('families')
      .select('name')
      .eq('id', family_id as string)
      .single();

    const siteUrl = Deno.env.get('SITE_URL') || 'https://shjrti.lovable.app';
    const inviteUrl = `${siteUrl}/accept-invitation?token=${token}`;

    await supabase.functions.invoke('send-templated-email', {
      body: {
        templateKey: 'family_invitation',
        recipientEmail: email,
        recipientName: email,
        variables: {
          family_name: familyInfo?.name || 'شجرة عائلة',
          accept_url: inviteUrl,
          inviter_name: ownerProfile?.email || '',
        },
        language: 'ar',
      },
    });
  } catch (emailError) {
    console.warn('Failed to send invitation email:', emailError);
    // Don't fail the invitation just because email failed
  }

  return successResponse(invitation, 201);
}

// POST: Accept invitation
async function handleAccept(userId: string, body: Record<string, unknown>) {
  const { token } = body;
  
  if (!token) {
    return errorResponse('VALIDATION_ERROR', 'Token is required');
  }

  const supabase = createServiceClient();

  // Find invitation
  const { data: invitation } = await supabase
    .from('family_invitations')
    .select('*')
    .eq('token', token as string)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  
  if (!invitation) {
    return errorResponse('INVALID_TOKEN', 'Invitation not found, expired, or already used', 404);
  }

  // Verify email matches
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('email')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (userProfile?.email !== invitation.invited_email) {
    return errorResponse('EMAIL_MISMATCH', 'This invitation was sent to a different email address', 403);
  }

  // Check not already a collaborator
  const { data: existing } = await supabase
    .from('family_collaborators')
    .select('id')
    .eq('family_id', invitation.family_id)
    .eq('user_id', userId)
    .maybeSingle();
  
  if (existing) {
    // Update invitation status anyway
    await supabase
      .from('family_invitations')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', invitation.id);
    
    return successResponse({ family_id: invitation.family_id, already_member: true });
  }

  // Create collaborator record
  const { error: collabError } = await supabase
    .from('family_collaborators')
    .insert({
      family_id: invitation.family_id,
      user_id: userId,
      role: invitation.role,
      invited_by: invitation.invited_by,
    });
  
  if (collabError) {
    return errorResponse('DATABASE_ERROR', collabError.message, 500);
  }

  // Update invitation status
  await supabase
    .from('family_invitations')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', invitation.id);

  return successResponse({ family_id: invitation.family_id });
}

// POST: Validate token (no auth required)
async function handleValidateToken(token: string) {
  const supabase = createServiceClient();

  const { data: invitation } = await supabase
    .from('family_invitations')
    .select('id, family_id, invited_email, status, expires_at')
    .eq('token', token)
    .maybeSingle();
  
  if (!invitation) {
    return errorResponse('INVALID_TOKEN', 'Invitation not found', 404);
  }

  if (invitation.status !== 'pending') {
    return errorResponse('TOKEN_USED', 'This invitation has already been used', 400);
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return errorResponse('TOKEN_EXPIRED', 'This invitation has expired', 400);
  }

  // Get family name
  const { data: family } = await supabase
    .from('families')
    .select('name')
    .eq('id', invitation.family_id)
    .maybeSingle();

  // Check if user exists
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('email', invitation.invited_email)
    .maybeSingle();

  return successResponse({
    email: invitation.invited_email,
    family_name: family?.name || '',
    family_id: invitation.family_id,
    user_exists: !!existingUser,
  });
}

// DELETE: Remove collaborator or revoke invitation
async function handleRemove(userId: string, id: string) {
  const supabase = createServiceClient();

  // Try as collaborator first
  const { data: collab } = await supabase
    .from('family_collaborators')
    .select('id, family_id')
    .eq('id', id)
    .maybeSingle();
  
  if (collab) {
    // Verify ownership
    const { data: family } = await supabase
      .from('families')
      .select('id')
      .eq('id', collab.family_id)
      .eq('creator_id', userId)
      .maybeSingle();
    
    if (!family) {
      return errorResponse('FORBIDDEN', 'Only the family owner can remove collaborators', 403);
    }

    await supabase.from('family_collaborators').delete().eq('id', id);
    return successResponse({ deleted: true, type: 'collaborator' });
  }

  // Try as invitation
  const { data: invitation } = await supabase
    .from('family_invitations')
    .select('id, family_id')
    .eq('id', id)
    .maybeSingle();
  
  if (invitation) {
    const { data: family } = await supabase
      .from('families')
      .select('id')
      .eq('id', invitation.family_id)
      .eq('creator_id', userId)
      .maybeSingle();
    
    if (!family) {
      return errorResponse('FORBIDDEN', 'Only the family owner can revoke invitations', 403);
    }

    await supabase
      .from('family_invitations')
      .update({ status: 'revoked' })
      .eq('id', id);
    
    return successResponse({ deleted: true, type: 'invitation' });
  }

  return errorResponse('NOT_FOUND', 'Item not found', 404);
}

// DELETE: Collaborator leaves family
async function handleLeave(userId: string, familyId: string) {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('family_collaborators')
    .delete()
    .eq('family_id', familyId)
    .eq('user_id', userId);
  
  if (error) {
    return errorResponse('DATABASE_ERROR', (error as Error).message, 500);
  }

  return successResponse({ left: true });
}

// GET: Get current user's role for a family
async function handleMyRole(userId: string, familyId: string) {
  const supabase = createServiceClient();

  // Check if owner
  const { data: family } = await supabase
    .from('families')
    .select('creator_id')
    .eq('id', familyId)
    .maybeSingle();

  if (family?.creator_id === userId) {
    return successResponse({ role: 'owner' });
  }

  // Check if collaborator
  const { data: collab } = await supabase
    .from('family_collaborators')
    .select('role')
    .eq('family_id', familyId)
    .eq('user_id', userId)
    .maybeSingle();

  if (collab) {
    return successResponse({ role: collab.role || 'editor' });
  }

  return successResponse({ role: 'none' });
}

// Main handler
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const id = url.searchParams.get('id');
    const familyId = url.searchParams.get('family_id');
    const token = url.searchParams.get('token');

    // Handle validate-token without auth
    if (req.method === 'POST' && action === 'validate-token') {
      const body = await req.json().catch(() => ({}));
      return await handleValidateToken(body.token || token || '');
    }

    // All other endpoints require auth
    const auth = await authenticateRequest(req);
    if (auth.error) return auth.error;
    const { user } = auth;

    let body: Record<string, unknown> = {};
    if (req.method === 'POST' || req.method === 'DELETE') {
      body = await req.json().catch(() => ({}));
    }

    switch (req.method) {
      case 'GET':
        if (!familyId) return errorResponse('VALIDATION_ERROR', 'family_id is required');
        if (action === 'my-role') return await handleMyRole(user!.id, familyId);
        return await handleList(user!.id, familyId);

      case 'POST':
        if (action === 'invite') return await handleInvite(user!.id, body);
        if (action === 'accept') return await handleAccept(user!.id, body);
        return errorResponse('VALIDATION_ERROR', 'Invalid action');

      case 'DELETE':
        if (action === 'leave' && familyId) {
          return await handleLeave(user!.id, familyId);
        }
        if (!id) return errorResponse('VALIDATION_ERROR', 'id is required');
        return await handleRemove(user!.id, id);

      default:
        return errorResponse('METHOD_NOT_ALLOWED', `Method ${req.method} not allowed`, 405);
    }
  } catch (error) {
    console.error('[API] Unhandled error:', error);
    return errorResponse('INTERNAL_ERROR', (error as Error).message || 'An unexpected error occurred', 500);
  }
});
