// Core data types for family builder

export interface Member {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  father_id?: string | null;
  mother_id?: string | null;
  gender: string;
  birth_date?: string | null;
  birth_place?: string | null;
  death_date?: string | null;
  death_place?: string | null;
  is_alive?: boolean;
  is_founder?: boolean;
  marital_status?: string;
  image_url?: string | null;
  biography?: string | null;
  family_id: string;
  spouse_id?: string | null;
  related_person_id?: string | null;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Marriage {
  id: string;
  family_id: string;
  husband_id: string;
  wife_id: string;
  marriage_date?: string | null;
  marriage_place?: string | null;
  divorce_date?: string | null;
  is_active?: boolean;
  marital_status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Family {
  id: string;
  name: string;
  description?: string | null;
  creator_id: string;
  custom_domain?: string | null;
  share_password?: string | null;
  is_archived?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MemberFormData {
  name?: string;
  first_name: string;
  last_name?: string;
  relation?: string;
  relatedPersonId?: string | null;
  selectedParent?: string | null;
  gender: string;
  birthDate?: Date | null;
  isAlive?: boolean;
  deathDate?: Date | null;
  bio?: string;
  imageUrl?: string | null;
  croppedImage?: string | null;
  isFounder?: boolean;
}

export interface SpouseData {
  id?: string;
  firstName: string;
  lastName?: string;
  name: string;
  isAlive: boolean;
  birthDate?: Date | null;
  deathDate?: Date | null;
  maritalStatus: string;
  isFamilyMember: boolean;
  existingFamilyMemberId?: string;
  croppedImage?: string | null;
  biography?: string;
  isSaved?: boolean;
}