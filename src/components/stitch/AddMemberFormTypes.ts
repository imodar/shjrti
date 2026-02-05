/**
 * AddMemberForm Types for Stitch Theme
 */

import { Member, Marriage } from '@/types/family.types';
import { SpouseData } from '@/components/SpouseForm';

export type FormMode = 'add' | 'edit' | 'view';

export interface MemberFormData {
  name: string;
  first_name: string;
  relation: string;
  relatedPersonId: string | null;
  selectedParent: string | null;
  gender: 'male' | 'female';
  birthDate: Date | null;
  isAlive: boolean;
  deathDate: Date | null;
  bio: string;
  imageUrl: string;
  croppedImage: string | null;
  isFounder: boolean;
  is_twin: boolean;
  twin_group_id: string | null;
  selected_twins: string[];
}

export interface AddMemberFormProps {
  familyId: string;
  familyMembers: Member[];
  marriages: Marriage[];
  familyData: any;
  editingMember?: any;
  formMode: FormMode;
  onClose: () => void;
  onMemberSaved: () => void;
  onMemberDeleted?: () => void;
}

export interface SpouseFormState {
  currentSpouse: SpouseData | null;
  activeSpouseType: 'wife' | 'husband' | null;
  showSpouseForm: boolean;
  spouseCommandOpen: boolean;
  spouseFamilyStatus: 'yes' | 'no' | null;
}

export interface ImageCropState {
  selectedImage: string | null;
  croppedImage: string | null;
  showCropDialog: boolean;
  imageChanged: boolean;
  editingMemberImageUrl: string | null;
  crop: { x: number; y: number };
  zoom: number;
  croppedAreaPixels: any;
}

export const defaultFormData: MemberFormData = {
  name: '',
  first_name: '',
  relation: '',
  relatedPersonId: null,
  selectedParent: null,
  gender: 'male',
  birthDate: null,
  isAlive: true,
  deathDate: null,
  bio: '',
  imageUrl: '',
  croppedImage: null,
  isFounder: false,
  is_twin: false,
  twin_group_id: null,
  selected_twins: []
};

export const defaultSpouseData: SpouseData = {
  id: '',
  firstName: '',
  lastName: '',
  name: '',
  isAlive: true,
  birthDate: null,
  deathDate: null,
  maritalStatus: 'married',
  isFamilyMember: false,
  existingFamilyMemberId: '',
  croppedImage: null,
  isSaved: false
};
