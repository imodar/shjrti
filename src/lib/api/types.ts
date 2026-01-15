/**
 * API Types - Shared types for API requests and responses
 */

// ============= Family Types =============

export interface Family {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  custom_domain: string | null;
  share_token: string | null;
  share_token_expires_at: string | null;
  share_password: string | null;
  share_gallery: boolean | null;
  female_name_privacy: string | null;
  female_photo_hidden: boolean | null;
  is_archived: boolean | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FamilyCreateInput {
  name: string;
  description?: string;
}

export interface FamilyUpdateInput {
  name?: string;
  description?: string;
  custom_domain?: string | null;
  share_gallery?: boolean;
  female_name_privacy?: string;
  female_photo_hidden?: boolean;
  is_archived?: boolean;
}

// ============= Member Types =============

export interface Member {
  id: string;
  family_id: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  gender: string | null;
  birth_date: string | null;
  death_date: string | null;
  is_alive: boolean | null;
  biography: string | null;
  image_url: string | null;
  father_id: string | null;
  mother_id: string | null;
  spouse_id: string | null;
  is_founder: boolean | null;
  is_twin: boolean | null;
  twin_group_id: string | null;
  marital_status: string | null;
  related_person_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemberCreateInput {
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
  related_person_id?: string;
  created_by?: string;
}

export interface MemberUpdateInput {
  name?: string;
  first_name?: string;
  last_name?: string;
  gender?: string;
  birth_date?: string | null;
  death_date?: string | null;
  is_alive?: boolean;
  biography?: string | null;
  image_url?: string | null;
  father_id?: string | null;
  mother_id?: string | null;
  spouse_id?: string | null;
  is_founder?: boolean;
  is_twin?: boolean;
  twin_group_id?: string | null;
  marital_status?: string;
  related_person_id?: string | null;
}

// ============= Marriage Types =============

export interface Marriage {
  id: string;
  family_id: string;
  husband_id: string;
  wife_id: string;
  marital_status: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface MarriageCreateInput {
  family_id: string;
  husband_id: string;
  wife_id: string;
  marital_status?: string;
  is_active?: boolean;
}

export interface MarriageUpdateInput {
  marital_status?: string;
  is_active?: boolean;
}

// ============= Memory Types =============

export interface MemberMemory {
  id: string;
  member_id: string;
  file_path: string;
  original_filename: string;
  content_type: string;
  file_size: number;
  caption: string | null;
  uploaded_by: string;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyMemory {
  id: string;
  family_id: string;
  file_path: string;
  original_filename: string;
  content_type: string;
  file_size: number;
  caption: string | null;
  tags: string[] | null;
  photo_date: string | null;
  linked_member_id: string | null;
  uploaded_by: string;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

// ============= Pagination Types =============

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

// ============= Common Response Types =============

export interface SuccessResponse {
  success: boolean;
  message?: string;
}

export interface DeleteResponse {
  deleted: boolean;
  id: string;
}
