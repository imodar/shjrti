
-- =============================================
-- Family Collaborators System
-- =============================================

-- 1. Create family_invitations table
CREATE TABLE public.family_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  role text NOT NULL DEFAULT 'editor' CHECK (role IN ('editor')),
  token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create family_collaborators table
CREATE TABLE public.family_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'editor' CHECK (role IN ('editor')),
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (family_id, user_id)
);

-- 3. Create indexes
CREATE INDEX idx_family_invitations_family_id ON public.family_invitations(family_id);
CREATE INDEX idx_family_invitations_token ON public.family_invitations(token);
CREATE INDEX idx_family_invitations_invited_email ON public.family_invitations(invited_email);
CREATE INDEX idx_family_invitations_status ON public.family_invitations(status);
CREATE INDEX idx_family_collaborators_family_id ON public.family_collaborators(family_id);
CREATE INDEX idx_family_collaborators_user_id ON public.family_collaborators(user_id);

-- 4. Security definer function to check collaborator status (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_family_collaborator(_user_id uuid, _family_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM family_collaborators
    WHERE user_id = _user_id AND family_id = _family_id
  )
$$;

-- 5. Security definer function to check family ownership
CREATE OR REPLACE FUNCTION public.is_family_owner(_user_id uuid, _family_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM families
    WHERE id = _family_id AND creator_id = _user_id
  )
$$;

-- 6. Function to check if user has access (owner OR collaborator)
CREATE OR REPLACE FUNCTION public.has_family_access(_user_id uuid, _family_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    public.is_family_owner(_user_id, _family_id) 
    OR 
    public.is_family_collaborator(_user_id, _family_id)
  )
$$;

-- 7. Enable RLS on both tables
ALTER TABLE public.family_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_collaborators ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for family_invitations
-- Owner can view all invitations for their families
CREATE POLICY "Owners can view invitations for their families"
ON public.family_invitations
FOR SELECT
TO authenticated
USING (public.is_family_owner(auth.uid(), family_id));

-- Owner can create invitations
CREATE POLICY "Owners can create invitations"
ON public.family_invitations
FOR INSERT
TO authenticated
WITH CHECK (public.is_family_owner(auth.uid(), family_id) AND invited_by = auth.uid());

-- Owner can update invitations (revoke)
CREATE POLICY "Owners can update invitations"
ON public.family_invitations
FOR UPDATE
TO authenticated
USING (public.is_family_owner(auth.uid(), family_id));

-- Owner can delete invitations
CREATE POLICY "Owners can delete invitations"
ON public.family_invitations
FOR DELETE
TO authenticated
USING (public.is_family_owner(auth.uid(), family_id));

-- 9. RLS Policies for family_collaborators
-- Owner and collaborators can view collaborators
CREATE POLICY "Users with access can view collaborators"
ON public.family_collaborators
FOR SELECT
TO authenticated
USING (public.has_family_access(auth.uid(), family_id));

-- Only owner can add collaborators
CREATE POLICY "Owners can add collaborators"
ON public.family_collaborators
FOR INSERT
TO authenticated
WITH CHECK (public.is_family_owner(auth.uid(), family_id));

-- Only owner can remove collaborators
CREATE POLICY "Owners can remove collaborators"
ON public.family_collaborators
FOR DELETE
TO authenticated
USING (public.is_family_owner(auth.uid(), family_id));

-- Collaborator can remove themselves
CREATE POLICY "Collaborators can remove themselves"
ON public.family_collaborators
FOR DELETE
TO authenticated
USING (user_id = auth.uid());
