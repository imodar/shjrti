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
export { profilesApi } from './endpoints/profiles';
export { subscriptionsApi } from './endpoints/subscriptions';
export { invoicesApi } from './endpoints/invoices';
export { packagesApi } from './endpoints/packages';
export { scheduledChangesApi } from './endpoints/scheduledChanges';
export { contactApi } from './endpoints/contact';

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
export type {
  Profile,
  ProfileUpdateInput,
} from './endpoints/profiles';
export type {
  Subscription,
  SubscriptionDetails,
  Package as SubscriptionPackage,
} from './endpoints/subscriptions';
export type {
  Invoice,
  InvoicePackage,
} from './endpoints/invoices';
export type {
  Package,
} from './endpoints/packages';
export type {
  ScheduledChange,
  ScheduledChangeCreateInput,
  ScheduledPackage,
} from './endpoints/scheduledChanges';

export type {
  ContactSubmission,
  ContactSubmissionResponse,
} from './endpoints/contact';

// Convenience re-export as a single API object
import { familiesApi } from './endpoints/families';
import { membersApi } from './endpoints/members';
import { marriagesApi } from './endpoints/marriages';
import { memoriesApi } from './endpoints/memories';
import { suggestionsApi } from './endpoints/suggestions';
import { profilesApi } from './endpoints/profiles';
import { subscriptionsApi } from './endpoints/subscriptions';
import { invoicesApi } from './endpoints/invoices';
import { packagesApi } from './endpoints/packages';
import { scheduledChangesApi } from './endpoints/scheduledChanges';
import { contactApi } from './endpoints/contact';

export const api = {
  families: familiesApi,
  members: membersApi,
  marriages: marriagesApi,
  memories: memoriesApi,
  suggestions: suggestionsApi,
  profiles: profilesApi,
  subscriptions: subscriptionsApi,
  invoices: invoicesApi,
  packages: packagesApi,
  scheduledChanges: scheduledChangesApi,
  contact: contactApi,
};

export default api;
