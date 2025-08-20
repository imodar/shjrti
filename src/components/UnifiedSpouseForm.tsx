import React, { useState } from 'react';
import { SpouseForm, SpouseData } from './SpouseForm';

interface UnifiedSpouseFormProps {
  spouseType: 'wife' | 'husband';
  spouse: SpouseData | null;
  onSpouseChange: (spouse: SpouseData) => void;
  familyMembers: any[];
  selectedMember: any;
  onSave: (spouseData?: SpouseData, saveToDb?: boolean) => void;
  onAdd: () => void;
  onClose?: () => void;
  showForm: boolean;
}

export const UnifiedSpouseForm: React.FC<UnifiedSpouseFormProps> = ({
  spouseType,
  spouse,
  onSpouseChange,
  familyMembers,
  selectedMember,
  onSave,
  onAdd,
  onClose,
  showForm
}) => {
  const [commandOpen, setCommandOpen] = useState(false);
  const [familyStatus, setFamilyStatus] = useState<'yes' | 'no' | null>(null);

  const handleFamilyStatusChange = (status: string) => {
    setFamilyStatus(status as 'yes' | 'no');
  };

  return (
    <SpouseForm
      spouseType={spouseType}
      spouse={spouse || {
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
        biography: '',
        isSaved: false
      }}
      onSpouseChange={onSpouseChange}
      familyMembers={familyMembers}
      selectedMember={selectedMember}
      commandOpen={commandOpen}
      onCommandOpenChange={setCommandOpen}
      familyStatus={familyStatus}
      onFamilyStatusChange={handleFamilyStatusChange}
      onSave={onSave}
      onAdd={onAdd}
      onClose={onClose}
      showForm={showForm}
    />
  );
};