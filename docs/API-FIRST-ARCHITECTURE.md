# API-First Architecture Documentation

## Overview

This project implements an **API-First Architecture** using Supabase Edge Functions as a unified backend layer. This approach centralizes all business logic, authentication, and data access in secure Edge Functions, providing a consistent API for web and future mobile applications.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
├─────────────────────────────────────────────────────────────────┤
│  src/lib/api/                                                    │
│  ├── client.ts          → API Client (request handling)         │
│  ├── types.ts           → TypeScript type definitions            │
│  ├── index.ts           → Unified exports                        │
│  └── endpoints/                                                  │
│      ├── families.ts    → familiesApi                           │
│      ├── members.ts     → membersApi                            │
│      ├── marriages.ts   → marriagesApi                          │
│      └── memories.ts    → memoriesApi                           │
├─────────────────────────────────────────────────────────────────┤
│                    Supabase Edge Functions                       │
├─────────────────────────────────────────────────────────────────┤
│  supabase/functions/                                             │
│  ├── _shared/                                                    │
│  │   ├── apiHelpers.ts      → CORS, responses, routing          │
│  │   └── authHelpers.ts     → JWT validation, ownership checks  │
│  ├── api-families/index.ts  → Family CRUD operations            │
│  ├── api-members/index.ts   → Member CRUD + batch operations    │
│  ├── api-marriages/index.ts → Marriage CRUD operations          │
│  └── api-memories/index.ts  → Member & Family memories CRUD     │
├─────────────────────────────────────────────────────────────────┤
│                      Supabase Database                           │
│  (Service Role access - bypasses RLS for controlled operations)  │
└─────────────────────────────────────────────────────────────────┘
```

## Core Principles

### 1. Centralized Business Logic
All data validation, transformation, and business rules are enforced in Edge Functions, not scattered across frontend components.

### 2. Service Role Access
Edge Functions use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS, with ownership/permission checks implemented in code for fine-grained control.

### 3. Type Safety
Full TypeScript coverage from API types to frontend consumption, with shared type definitions.

### 4. Consistent Error Handling
Standardized error responses using `ApiError` class and `errorResponse()` helper.

---

## Shared Utilities

### `supabase/functions/_shared/apiHelpers.ts`

Provides common API utilities:

```typescript
// CORS Headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

// Response Helpers
successResponse<T>(data: T, status?: number, meta?: object): Response
errorResponse(code: string, message: string, status?: number, details?: unknown): Response

// Request Parsing
parseBody<T>(req: Request): Promise<T>
parseParams(url: URL): Record<string, string>

// Validation
validateRequired(body: object, requiredFields: string[]): { valid: boolean; missing: string[] }

// Pagination
getPaginationParams(url: URL): { page: number; limit: number; offset: number }
createPaginationMeta(page: number, limit: number, total: number): object

// Error Codes
ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
}
```

### `supabase/functions/_shared/authHelpers.ts`

Provides authentication and authorization:

```typescript
// Client Creation
createServiceClient(): SupabaseClient  // Service role access
createUserClient(authHeader: string): SupabaseClient  // User-scoped access

// Authentication
authenticateRequest(req: Request): Promise<AuthResult>
// Returns: { user, supabaseClient, error }

// Authorization
isAdmin(userId: string): Promise<boolean>
requireAdmin(userId: string): Promise<Response | null>
isOwner(userId: string, familyId: string): Promise<boolean>
requireOwnership(userId: string, familyId: string): Promise<Response | null>

// Subscription
getUserSubscription(userId: string): Promise<SubscriptionResult>
```

---

## Edge Functions

### 1. api-families

**Endpoint:** `supabase/functions/api-families/index.ts`

| Action | Description | Auth Required |
|--------|-------------|---------------|
| `list` | Get all families for current user | ✅ |
| `get` | Get single family by ID | ✅ (owner/admin) |
| `create` | Create new family | ✅ |
| `update` | Update family details | ✅ (owner/admin) |
| `delete` | Delete family and all related data | ✅ (owner/admin) |
| `getMembers` | Get all members of a family | ✅ (owner/admin) |
| `getMarriages` | Get all marriages of a family | ✅ (owner/admin) |
| `regenerateShareToken` | Generate new share token | ✅ (owner/admin) |

**Request Format:**
```typescript
// POST body
{
  action: 'list' | 'get' | 'create' | 'update' | 'delete' | 'getMembers' | 'getMarriages' | 'regenerateShareToken',
  id?: string,           // for get, update, delete
  familyId?: string,     // for getMembers, getMarriages
  expiresInHours?: number, // for regenerateShareToken (default: 2)
  // ... other fields for create/update
}
```

### 2. api-members

**Endpoint:** `supabase/functions/api-members/index.ts`

| Action | Description | Auth Required |
|--------|-------------|---------------|
| `get` | Get single member by ID | ✅ (family owner) |
| `create` | Create new member | ✅ (family owner) |
| `update` | Update member details | ✅ (family owner) |
| `delete` | Delete member | ✅ (family owner) |
| `getMemories` | Get member's memories | ✅ (family owner) |
| `batchCreate` | Create multiple members at once | ✅ (family owner) |

**Request Format:**
```typescript
// POST body
{
  action: 'get' | 'create' | 'update' | 'delete' | 'getMemories' | 'batchCreate',
  id?: string,
  memberId?: string,
  family_id: string,     // required for create
  name: string,          // required for create
  members?: MemberCreateInput[], // for batchCreate
  // ... other member fields
}
```

### 3. api-marriages

**Endpoint:** `supabase/functions/api-marriages/index.ts`

| Action | Description | Auth Required |
|--------|-------------|---------------|
| `get` | Get single marriage by ID | ✅ (family owner) |
| `create` | Create new marriage | ✅ (family owner) |
| `update` | Update marriage details | ✅ (family owner) |
| `delete` | Delete marriage | ✅ (family owner) |

**Request Format:**
```typescript
// POST body
{
  action: 'get' | 'create' | 'update' | 'delete',
  id?: string,
  family_id: string,     // required for create
  husband_id: string,    // required for create
  wife_id: string,       // required for create
  // ... other marriage fields
}
```

### 4. api-memories

**Endpoint:** `supabase/functions/api-memories/index.ts`

| Action | Description | Auth Required |
|--------|-------------|---------------|
| `getMemberMemories` | Get all memories for a member | ✅ (family owner) |
| `createMemberMemory` | Create member memory | ✅ (family owner) |
| `updateMemberMemory` | Update member memory | ✅ (family owner) |
| `deleteMemberMemory` | Delete member memory (+ storage) | ✅ (family owner) |
| `getFamilyMemories` | Get all memories for a family | ✅ (family owner) |
| `createFamilyMemory` | Create family memory | ✅ (family owner) |
| `updateFamilyMemory` | Update family memory | ✅ (family owner) |
| `deleteFamilyMemory` | Delete family memory (+ storage) | ✅ (family owner) |

**Request Format:**
```typescript
// POST body
{
  action: 'getMemberMemories' | 'createMemberMemory' | 'updateMemberMemory' | 'deleteMemberMemory' |
          'getFamilyMemories' | 'createFamilyMemory' | 'updateFamilyMemory' | 'deleteFamilyMemory',
  id?: string,
  memberId?: string,
  familyId?: string,
  // ... memory fields for create/update
}
```

---

## Frontend API Client

### API Client (`src/lib/api/client.ts`)

The central client for all API calls:

```typescript
import apiClient from '@/lib/api/client';

// GET request
const family = await apiClient.get<Family>('api-families', { action: 'get', id: familyId });

// POST request
const newMember = await apiClient.post<Member>('api-members', { 
  action: 'create',
  family_id: familyId,
  name: 'John Doe'
});

// PUT request
const updated = await apiClient.put<Member>('api-members', {
  action: 'update',
  id: memberId,
  name: 'Jane Doe'
});

// DELETE request
await apiClient.delete<DeleteResponse>('api-members', { action: 'delete', id: memberId });
```

### Typed Endpoints

Each entity has its own typed endpoint module:

#### Families API (`src/lib/api/endpoints/families.ts`)
```typescript
import { familiesApi } from '@/lib/api';

// List all families
const families = await familiesApi.list();

// Get single family
const family = await familiesApi.get(familyId);

// Create family
const newFamily = await familiesApi.create({ name: 'Smith Family' });

// Update family
const updated = await familiesApi.update(familyId, { description: 'Updated' });

// Delete family
await familiesApi.delete(familyId);

// Get members
const members = await familiesApi.getMembers(familyId);

// Get marriages
const marriages = await familiesApi.getMarriages(familyId);

// Archive/Unarchive
await familiesApi.archive(familyId);
await familiesApi.unarchive(familyId);

// Regenerate share token
const { share_token, expires_at } = await familiesApi.regenerateShareToken(familyId, 24);
```

#### Members API (`src/lib/api/endpoints/members.ts`)
```typescript
import { membersApi } from '@/lib/api';

// Get member
const member = await membersApi.get(memberId);

// Create member
const newMember = await membersApi.create({
  family_id: familyId,
  name: 'John Doe',
  gender: 'male',
  birth_date: '1990-01-15'
});

// Update member
const updated = await membersApi.update(memberId, { name: 'John Smith' });

// Delete member
await membersApi.delete(memberId);

// Get memories
const memories = await membersApi.getMemories(memberId);

// Batch create
const newMembers = await membersApi.batchCreate([
  { family_id: familyId, name: 'Member 1', gender: 'male' },
  { family_id: familyId, name: 'Member 2', gender: 'female' }
]);

// Update image
await membersApi.updateImage(memberId, imageUrl);

// Update parents
await membersApi.updateParents(memberId, fatherId, motherId);
```

#### Marriages API (`src/lib/api/endpoints/marriages.ts`)
```typescript
import { marriagesApi } from '@/lib/api';

// Get marriage
const marriage = await marriagesApi.get(marriageId);

// Create marriage
const newMarriage = await marriagesApi.create({
  family_id: familyId,
  husband_id: husbandId,
  wife_id: wifeId,
  marital_status: 'married'
});

// Update marriage
const updated = await marriagesApi.update(marriageId, { marital_status: 'divorced' });

// Delete marriage
await marriagesApi.delete(marriageId);

// Soft delete (deactivate)
await marriagesApi.deactivate(marriageId);

// Reactivate
await marriagesApi.reactivate(marriageId);
```

#### Memories API (`src/lib/api/endpoints/memories.ts`)
```typescript
import { memoriesApi } from '@/lib/api';

// Member Memories
const memberMemories = await memoriesApi.getMemberMemories(memberId);
const newMemory = await memoriesApi.createMemberMemory({
  member_id: memberId,
  file_path: 'path/to/file.jpg',
  original_filename: 'photo.jpg',
  content_type: 'image/jpeg',
  file_size: 1024000,
  caption: 'Birthday party'
});
await memoriesApi.updateMemberMemory(memoryId, { caption: 'Updated caption' });
await memoriesApi.deleteMemberMemory(memoryId);

// Family Memories
const familyMemories = await memoriesApi.getFamilyMemories(familyId);
const newFamilyMemory = await memoriesApi.createFamilyMemory({
  family_id: familyId,
  file_path: 'path/to/file.jpg',
  original_filename: 'reunion.jpg',
  content_type: 'image/jpeg',
  file_size: 2048000,
  caption: 'Family reunion 2024'
});
await memoriesApi.updateFamilyMemory(memoryId, { caption: 'Updated' });
await memoriesApi.deleteFamilyMemory(memoryId);
```

---

## Type Definitions

### Core Types (`src/lib/api/types.ts`)

```typescript
// Family
interface Family {
  id: string;
  name: string;
  description?: string;
  creator_id: string;
  share_token?: string;
  share_token_expires_at?: string;
  share_password?: string;
  custom_domain?: string;
  female_name_privacy?: string;
  female_photo_hidden?: boolean;
  share_gallery?: boolean;
  is_archived?: boolean;
  archived_at?: string;
  created_at: string;
  updated_at: string;
}

// Member
interface Member {
  id: string;
  family_id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  gender?: string;
  birth_date?: string;
  death_date?: string;
  is_alive?: boolean;
  biography?: string;
  image_url?: string;
  father_id?: string;
  mother_id?: string;
  spouse_id?: string;
  is_founder?: boolean;
  is_twin?: boolean;
  twin_group_id?: string;
  marital_status?: string;
  created_at: string;
  updated_at: string;
}

// Marriage
interface Marriage {
  id: string;
  family_id: string;
  husband_id: string;
  wife_id: string;
  marital_status?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

// Memories
interface MemberMemory {
  id: string;
  member_id: string;
  file_path: string;
  original_filename: string;
  content_type: string;
  file_size: number;
  caption?: string;
  uploaded_by: string;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

interface FamilyMemory {
  id: string;
  family_id: string;
  file_path: string;
  original_filename: string;
  content_type: string;
  file_size: number;
  caption?: string;
  photo_date?: string;
  tags?: string[];
  linked_member_id?: string;
  uploaded_by: string;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}
```

---

## Error Handling

### ApiError Class

```typescript
import { ApiError } from '@/lib/api/client';

try {
  const member = await membersApi.get(memberId);
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.code, error.message);
    console.error('Status:', error.status);
    console.error('Details:', error.details);
    
    switch (error.code) {
      case 'NOT_FOUND':
        // Handle not found
        break;
      case 'FORBIDDEN':
        // Handle permission denied
        break;
      case 'VALIDATION_ERROR':
        // Handle validation errors
        break;
    }
  }
}
```

### Standard Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Missing or invalid fields |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Permission denied |
| `NOT_FOUND` | 404 | Resource not found |
| `DUPLICATE_ENTRY` | 409 | Resource already exists |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Integration with React Query

### Using with Mutations

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '@/lib/api';
import type { MemberCreateInput } from '@/lib/api/types';

export const useAddMemberMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberData: MemberCreateInput) => {
      return await membersApi.create(memberData);
    },
    onSuccess: (newMember) => {
      // Optimistic update
      queryClient.setQueryData(
        ['familyMembers', newMember.family_id],
        (old: Member[] = []) => [...old, newMember]
      );
    },
  });
};
```

### Using with Queries

```typescript
import { useQuery } from '@tanstack/react-query';
import { familiesApi } from '@/lib/api';

export const useFamilyQuery = (familyId: string) => {
  return useQuery({
    queryKey: ['family', familyId],
    queryFn: () => familiesApi.get(familyId),
    enabled: !!familyId,
  });
};
```

---

## Security Considerations

### 1. Authentication
All API endpoints require valid JWT tokens (except public sharing endpoints).

### 2. Authorization
- **Ownership checks**: Users can only access their own families
- **Admin override**: Admin users can access all resources
- **Service Role**: Edge Functions use service role for database operations

### 3. Input Validation
All inputs are validated before database operations using `validateRequired()`.

### 4. Rate Limiting
Critical endpoints implement rate limiting using shared rate limiter utility.

### 5. Data Masking
Privacy settings (female_name_privacy, female_photo_hidden) are enforced at the API level.

---

## Future Enhancements

1. **Admin APIs** - User management, subscriptions, system settings
2. **Search API** - Unified search across families and members
3. **Analytics API** - Usage statistics and metrics
4. **Webhook API** - External integrations

---

## Quick Reference

```typescript
// Import everything
import { 
  familiesApi, 
  membersApi, 
  marriagesApi, 
  memoriesApi,
  ApiError 
} from '@/lib/api';

import type { 
  Family, 
  Member, 
  Marriage,
  MemberMemory,
  FamilyMemory,
  FamilyCreateInput,
  MemberCreateInput,
  MarriageCreateInput
} from '@/lib/api/types';
```
