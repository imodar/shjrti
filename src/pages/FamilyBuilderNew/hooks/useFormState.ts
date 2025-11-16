import { useState, useCallback } from "react";
import { Member } from "../types/family.types";

interface FormData {
  firstName: string;
  middleName: string;
  lastName: string;
  nickname: string;
  gender: string;
  birthDate: Date | undefined;
  deathDate: Date | undefined;
  birthPlace: string;
  deathPlace: string;
  currentResidence: string;
  occupation: string;
  education: string;
  biography: string;
  isAlive: boolean;
  isFounder: boolean;
  fatherId: string;
  motherId: string;
  isTwin: boolean;
  selectedTwins: string[];
}

interface UseFormStateResult {
  formMode: 'add' | 'edit' | 'view';
  formData: FormData;
  selectedMemberId: string | null;
  setFormMode: (mode: 'add' | 'edit' | 'view') => void;
  setFormData: (data: Partial<FormData>) => void;
  setSelectedMemberId: (id: string | null) => void;
  resetForm: () => void;
  loadMemberToForm: (member: Member) => void;
}

const initialFormData: FormData = {
  firstName: '',
  middleName: '',
  lastName: '',
  nickname: '',
  gender: '',
  birthDate: undefined,
  deathDate: undefined,
  birthPlace: '',
  deathPlace: '',
  currentResidence: '',
  occupation: '',
  education: '',
  biography: '',
  isAlive: true,
  isFounder: false,
  fatherId: '',
  motherId: '',
  isTwin: false,
  selectedTwins: []
};

export const useFormState = (): UseFormStateResult => {
  const [formMode, setFormMode] = useState<'add' | 'edit' | 'view'>('view');
  const [formData, setFormDataState] = useState<FormData>(initialFormData);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const setFormData = useCallback((data: Partial<FormData>) => {
    setFormDataState(prev => ({ ...prev, ...data }));
  }, []);

  const resetForm = useCallback(() => {
    setFormDataState(initialFormData);
    setSelectedMemberId(null);
    setFormMode('view');
  }, []);

  const loadMemberToForm = useCallback((member: Member, allMembers: Member[] = []) => {
    // Load twins if member is a twin
    const twins = member.is_twin && member.twin_group_id
      ? allMembers
          .filter(m => 
            m.twin_group_id === member.twin_group_id && 
            m.id !== member.id
          )
          .map(m => m.id)
      : [];

    setFormDataState({
      firstName: member.first_name || member.name?.split(' ')[0] || '',
      middleName: '',
      lastName: member.last_name || '',
      nickname: '',
      gender: member.gender,
      birthDate: member.birth_date ? new Date(member.birth_date) : undefined,
      deathDate: member.death_date ? new Date(member.death_date) : undefined,
      birthPlace: member.birth_place || '',
      deathPlace: '',
      currentResidence: '',
      occupation: '',
      education: '',
      biography: member.biography || '',
      isAlive: member.is_alive !== false,
      isFounder: member.is_founder || false,
      fatherId: member.father_id || '',
      motherId: member.mother_id || '',
      isTwin: member.is_twin || false,
      selectedTwins: twins
    });
    setSelectedMemberId(member.id);
    setFormMode('edit');
  }, []);

  return {
    formMode,
    formData,
    selectedMemberId,
    setFormMode,
    setFormData,
    setSelectedMemberId,
    resetForm,
    loadMemberToForm
  };
};