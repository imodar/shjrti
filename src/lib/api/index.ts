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
export type { 
  MemberMemoryCreateInput, 
  MemberMemoryUpdateInput,
  FamilyMemoryCreateInput,
  FamilyMemoryUpdateInput 
} from './endpoints/memories';

// Convenience re-export as a single API object
import { familiesApi } from './endpoints/families';
import { membersApi } from './endpoints/members';
import { marriagesApi } from './endpoints/marriages';
import { memoriesApi } from './endpoints/memories';

export const api = {
  families: familiesApi,
  members: membersApi,
  marriages: marriagesApi,
  memories: memoriesApi,
};

export default api;
