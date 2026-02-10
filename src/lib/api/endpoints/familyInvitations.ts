/**
 * Family Invitations & Collaborators API Endpoints
 */

import apiClient from '../client';

const FUNCTION_NAME = 'api-family-invitations';

export interface Collaborator {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface Invitation {
  id: string;
  invited_email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
}

export interface CollaboratorsListResponse {
  collaborators: Collaborator[];
  invitations: Invitation[];
}

export interface TokenValidationResponse {
  email: string;
  family_name: string;
  family_id: string;
  user_exists: boolean;
}

export interface AcceptResponse {
  family_id: string;
  already_member?: boolean;
}

export interface MyRoleResponse {
  role: 'owner' | 'editor' | 'none';
}

export const familyInvitationsApi = {
  /** Get current user's role for a family */
  getMyRole: async (familyId: string): Promise<MyRoleResponse> => {
    return apiClient.get<MyRoleResponse>(FUNCTION_NAME, { family_id: familyId, action: 'my-role' });
  },

  /** List collaborators and pending invitations for a family (owner only) */
  list: async (familyId: string): Promise<CollaboratorsListResponse> => {
    return apiClient.get<CollaboratorsListResponse>(FUNCTION_NAME, { family_id: familyId });
  },

  /** Send an invitation to collaborate on a family (owner only, Plus plan) */
  invite: async (familyId: string, email: string): Promise<unknown> => {
    return apiClient.post(FUNCTION_NAME, { family_id: familyId, email }, { action: 'invite' });
  },

  /** Accept an invitation using a token */
  accept: async (token: string): Promise<AcceptResponse> => {
    return apiClient.post<AcceptResponse>(FUNCTION_NAME, { token }, { action: 'accept' });
  },

  /** Validate an invitation token (no auth required) */
  validateToken: async (token: string): Promise<TokenValidationResponse> => {
    return apiClient.post<TokenValidationResponse>(FUNCTION_NAME, { token }, { action: 'validate-token' });
  },

  /** Remove a collaborator or revoke an invitation (owner only) */
  remove: async (id: string): Promise<{ deleted: boolean }> => {
    return apiClient.delete<{ deleted: boolean }>(FUNCTION_NAME, undefined, { id });
  },

  /** Leave a family as a collaborator */
  leave: async (familyId: string): Promise<{ left: boolean }> => {
    return apiClient.delete<{ left: boolean }>(FUNCTION_NAME, undefined, { action: 'leave', family_id: familyId });
  },
};

export default familyInvitationsApi;
