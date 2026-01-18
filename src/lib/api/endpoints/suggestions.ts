/**
 * Suggestions API Endpoints (REST)
 */

import apiClient from '../client';
import type { DeleteResponse } from '../types';
import type { Json } from '@/integrations/supabase/types';

const FUNCTION_NAME = 'api-suggestions';

// Suggestion types
export interface Suggestion {
  id: string;
  family_id: string;
  member_id: string | null;
  submitter_name: string;
  submitter_email: string;
  suggestion_type: string;
  suggestion_text: string;
  suggested_changes: Json | null;
  status: 'pending' | 'under_review' | 'accepted' | 'rejected';
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  is_email_verified: boolean;
  verification_code: string | null;
  verification_code_expires_at: string | null;
  created_at: string;
  updated_at: string | null;
  family_tree_members?: {
    name: string;
  } | null;
}

export interface SuggestionCreateInput {
  family_id: string;
  member_id?: string;
  submitter_name: string;
  submitter_email: string;
  suggestion_type: string;
  suggestion_text: string;
  suggested_changes?: Record<string, unknown>;
}

export interface SuggestionUpdateInput {
  status?: 'pending' | 'under_review' | 'accepted' | 'rejected';
  admin_notes?: string | null;
}

export const suggestionsApi = {
  /**
   * List all suggestions for a family
   */
  listByFamily: async (familyId: string): Promise<Suggestion[]> => {
    return apiClient.get<Suggestion[]>(FUNCTION_NAME, { familyId });
  },

  /**
   * Get a single suggestion by ID
   */
  get: async (id: string): Promise<Suggestion> => {
    return apiClient.get<Suggestion>(FUNCTION_NAME, { id });
  },

  /**
   * Create a new suggestion (public - no auth required)
   */
  create: async (input: SuggestionCreateInput): Promise<Suggestion> => {
    return apiClient.post<Suggestion>(FUNCTION_NAME, input);
  },

  /**
   * Update suggestion status
   */
  update: async (id: string, input: SuggestionUpdateInput): Promise<Suggestion> => {
    return apiClient.patch<Suggestion>(FUNCTION_NAME, input, { id });
  },

  /**
   * Delete a suggestion
   */
  delete: async (id: string): Promise<DeleteResponse> => {
    return apiClient.delete<DeleteResponse>(FUNCTION_NAME, undefined, { id });
  },

  /**
   * Accept a suggestion
   */
  accept: async (id: string, adminNotes?: string): Promise<Suggestion> => {
    return apiClient.patch<Suggestion>(FUNCTION_NAME, { 
      status: 'accepted', 
      admin_notes: adminNotes || null 
    }, { id });
  },

  /**
   * Reject a suggestion
   */
  reject: async (id: string, adminNotes?: string): Promise<Suggestion> => {
    return apiClient.patch<Suggestion>(FUNCTION_NAME, { 
      status: 'rejected', 
      admin_notes: adminNotes || null 
    }, { id });
  },
};

export default suggestionsApi;
