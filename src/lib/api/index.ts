/**
 * API Module - Central export for all API functionality
 */

// Client
export { apiClient, ApiError } from './client';
export type { ApiResponse } from './client';

// Types
export type {
  Family,
  FamilyCreateInput,
  FamilyUpdateInput,
  Member,
  MemberCreateInput,
  MemberUpdateInput,
  Marriage,
  MarriageCreateInput,
  MarriageUpdateInput,
  MemberMemory,
  FamilyMemory,
  PaginationParams,
  PaginatedResponse,
  SuccessResponse,
  DeleteResponse,
} from './types';

// Endpoints
export { familiesApi } from './endpoints/families';
export { membersApi } from './endpoints/members';
export { marriagesApi } from './endpoints/marriages';
export { memoriesApi } from './endpoints/memories';
export { suggestionsApi } from './endpoints/suggestions';
export type { 
  MemberMemoryCreateInput, 
  MemberMemoryUpdateInput,
  FamilyMemoryCreateInput,
  FamilyMemoryUpdateInput 
} from './endpoints/memories';
export type {
  Suggestion,
  SuggestionCreateInput,
  SuggestionUpdateInput,
} from './endpoints/suggestions';

// Convenience re-export as a single API object
import { familiesApi } from './endpoints/families';
import { membersApi } from './endpoints/members';
import { marriagesApi } from './endpoints/marriages';
import { memoriesApi } from './endpoints/memories';
import { suggestionsApi } from './endpoints/suggestions';

export const api = {
  families: familiesApi,
  members: membersApi,
  marriages: marriagesApi,
  memories: memoriesApi,
  suggestions: suggestionsApi,
};

export default api;
