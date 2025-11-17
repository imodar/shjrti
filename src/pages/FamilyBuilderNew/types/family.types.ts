export interface Family {
  id: string;
  name: string;
  description?: string;
  custom_domain?: string;
  share_password?: string;
  share_gallery?: boolean;
  creator_id: string;
  is_archived?: boolean;
  archived_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  gender: string;
  birth_date?: string;
  death_date?: string;
  birth_place?: string;
  death_place?: string;
  biography?: string;
  image_url?: string;
  father_id?: string;
  mother_id?: string;
  family_id: string;
  is_founder?: boolean;
  is_alive?: boolean;
  marital_status?: string;
  spouse_id?: string;
  related_person_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  is_twin?: boolean;
  twin_group_id?: string;
}

export interface Marriage {
  id: string;
  husband_id: string;
  wife_id: string;
  marriage_date?: string;
  marriage_place?: string;
  divorce_date?: string;
  family_id: string;
  created_at: string;
  updated_at: string;
}

export interface Package {
  id: string;
  name: string;
  max_family_members: number;
  custom_domains_enabled: boolean;
  price: number;
  features: string[];
}