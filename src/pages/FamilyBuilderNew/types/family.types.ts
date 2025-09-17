export interface Family {
  id: string;
  name: string;
  description?: string;
  custom_domain?: string;
  share_password?: string;
  creator_id: string;
  is_archived?: boolean;
  archived_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name?: string;
  nickname?: string;
  gender: 'male' | 'female';
  birth_date?: string;
  death_date?: string;
  birth_place?: string;
  death_place?: string;
  current_residence?: string;
  occupation?: string;
  education?: string;
  biography?: string;
  photo_url?: string;
  father_id?: string;
  mother_id?: string;
  family_id: string;
  generation?: number;
  is_founder?: boolean;
  created_at: string;
  updated_at: string;
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