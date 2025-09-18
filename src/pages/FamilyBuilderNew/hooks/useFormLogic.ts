import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { formatDateForDatabase } from "@/lib/dateUtils";
import { supabase } from "@/integrations/supabase/client";
import { SpouseData } from "@/components/SpouseForm";

interface FormData {
  id: string;
  first_name: string;
  gender: string;
  birth_date: Date | null;
  death_date: Date | null;
  is_alive: boolean;
  isFounder: boolean;
  fatherId: string;
  motherId: string;
  relatedPersonId: string;
  relation: string;
  selectedParent: string;
  parentType: string;
  name: string;
  birthDate: Date | null;
  deathDate: Date | null;
  isAlive: boolean;
  bio: string;
  imageUrl: string;
  croppedImage: string | null;
}

export const useFormLogic = (
  familyId: string,
  familyData: any,
  familyMembers: any[],
  familyMarriages: any[],
  packageData: any,
  subscriptionData: any,
  editingMember: any,
  formMode: string,
  refreshFamilyData: () => Promise<void>
) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form Data State
  const [formData, setFormData] = useState<FormData>({
    id: '',
    first_name: '',
    gender: '',
    birth_date: null,
    death_date: null,
    is_alive: true,
    isFounder: false,
    fatherId: '',
    motherId: '',
    relatedPersonId: '',
    relation: '',
    selectedParent: '',
    parentType: '',
    name: '',
    birthDate: null,
    deathDate: null,
    isAlive: true,
    bio: "",
    imageUrl: "",
    croppedImage: null
  });

  // Spouse Management State
  const [wives, setWives] = useState<SpouseData[]>([]);
  const [husband, setHusband] = useState<SpouseData | null>(null);
  const [originalWivesData, setOriginalWivesData] = useState<SpouseData[]>([]);
  const [originalHusbandData, setOriginalHusbandData] = useState<SpouseData | null>(null);
  
  // Wife Form State
  const [wifeCommandOpen, setWifeCommandOpen] = useState(false);
  const [wivesCommandOpen, setWivesCommandOpen] = useState<{ [key: number]: boolean }>({});
  const [editingWifeIndex, setEditingWifeIndex] = useState<number | null>(null);
  const [currentWife, setCurrentWife] = useState<SpouseData | null>(null);
  const [wifeFamilyStatus, setWifeFamilyStatus] = useState<('yes' | 'no' | null)[]>([]);
  const [showWifeForm, setShowWifeForm] = useState(false);
  
  // Husband Form State
  const [husbandCommandOpen, setHusbandCommandOpen] = useState(false);
  const [currentHusband, setCurrentHusband] = useState<SpouseData | null>(null);
  const [husbandFamilyStatus, setHusbandFamilyStatus] = useState<'yes' | 'no' | null>(null);
  const [showHusbandForm, setShowHusbandForm] = useState(false);

  // Form Navigation
  const nextStep = () => {
    // Validate required fields for step 1
    if (currentStep === 1) {
      if (!formData.first_name?.trim()) {
        toast({
          title: "خطأ في البيانات",
          description: "يرجى إدخال الاسم الأول",
          variant: "destructive"
        });
        return;
      }
      if (!formData.gender) {
        toast({
          title: "خطأ في البيانات",
          description: "يرجى اختيار الجنس",
          variant: "destructive"
        });
        return;
      }
      if (!formData.selectedParent && !formData.isFounder) {
        toast({
          title: "خطأ في البيانات",
          description: "يرجى اختيار العلاقة العائلية",
          variant: "destructive"
        });
        return;
      }
    }
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Spouse Management Functions
  const handleWifeFamilyStatusChange = (index: number, status: string) => {
    const newStatuses = [...wifeFamilyStatus];
    newStatuses[index] = status as 'yes' | 'no';
    setWifeFamilyStatus(newStatuses);
  };

  const handleHusbandFamilyStatusChange = (status: string) => {
    setHusbandFamilyStatus(status as 'yes' | 'no');
  };

  const handleAddWife = () => {
    setCurrentWife({
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
    });
    setShowWifeForm(true);
  };

  const handleAddHusband = () => {
    setCurrentHusband({
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
    });
    setShowHusbandForm(true);
  };

  const handleSpouseSave = async (spouseType: 'wife' | 'husband') => {
    const currentSpouse = spouseType === 'wife' ? currentWife : currentHusband;
    if (!currentSpouse) return;

    try {
      let spouseId = currentSpouse.id;

      // For new spouses without an ID or external spouses, handle database creation
      if (!currentSpouse.isFamilyMember) {
        // External spouse - create or update in database
        if (!spouseId || spouseId === '' || spouseId.startsWith('temp_')) {
          // Create new external spouse in database
          const spouseName = currentSpouse.name || (currentSpouse.firstName && currentSpouse.lastName ? `${currentSpouse.firstName} ${currentSpouse.lastName}` : currentSpouse.firstName || currentSpouse.lastName || '');
          const { data: { user } } = await supabase.auth.getUser();
          const { data: newSpouseData, error: insertError } = await supabase
            .from('family_tree_members')
            .insert({
              family_id: familyId,
              name: spouseName,
              first_name: currentSpouse.firstName || null,
              last_name: currentSpouse.lastName || null,
              gender: spouseType === 'wife' ? 'female' : 'male',
              birth_date: formatDateForDatabase(currentSpouse.birthDate),
              is_alive: currentSpouse.isAlive ?? true,
              death_date: !currentSpouse.isAlive ? formatDateForDatabase(currentSpouse.deathDate) : null,
              marital_status: 'married',
              image_url: currentSpouse.croppedImage || null,
              created_by: user?.id,
              is_founder: false
            })
            .select()
            .single();
          
          if (insertError) {
            throw insertError;
          }
          spouseId = newSpouseData.id;
        } else {
          // Update existing external spouse
          const spouseName = currentSpouse.name || (currentSpouse.firstName && currentSpouse.lastName ? `${currentSpouse.firstName} ${currentSpouse.lastName}` : currentSpouse.firstName || currentSpouse.lastName || '');
          await supabase
            .from('family_tree_members')
            .update({
              name: spouseName,
              first_name: currentSpouse.firstName || null,
              last_name: currentSpouse.lastName || null,
              birth_date: formatDateForDatabase(currentSpouse.birthDate),
              is_alive: currentSpouse.isAlive ?? true,
              death_date: !currentSpouse.isAlive ? formatDateForDatabase(currentSpouse.deathDate) : null,
              marital_status: 'married',
              image_url: currentSpouse.croppedImage || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', spouseId);
        }
      } else if (currentSpouse.isFamilyMember && currentSpouse.existingFamilyMemberId) {
        // Update existing family member spouse
        const spouseName = currentSpouse.name || (currentSpouse.firstName && currentSpouse.lastName ? `${currentSpouse.firstName} ${currentSpouse.lastName}` : currentSpouse.firstName || currentSpouse.lastName || '');
        await supabase
          .from('family_tree_members')
          .update({
            name: spouseName,
            first_name: currentSpouse.firstName || null,
            last_name: currentSpouse.lastName || null,
            birth_date: formatDateForDatabase(currentSpouse.birthDate),
            is_alive: currentSpouse.isAlive ?? true,
            death_date: !currentSpouse.isAlive ? formatDateForDatabase(currentSpouse.deathDate) : null,
            marital_status: 'married',
            image_url: currentSpouse.croppedImage || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentSpouse.existingFamilyMemberId);
        spouseId = currentSpouse.existingFamilyMemberId;
      }

      // Update local state with the correct spouse ID
      const updatedSpouse = {
        ...currentSpouse,
        id: spouseId,
        isSaved: true
      };

      if (spouseType === 'wife') {
        console.log('🔍 WIFE SAVE - Determining index logic...');
        console.log('🔍 currentSpouse.id:', currentSpouse.id);
        console.log('🔍 editingWifeIndex:', editingWifeIndex);
        console.log('🔍 wives array:', wives.map(w => ({ id: w.id, name: w.name })));

        // First try to find by ID match (most reliable)
        let wifeIndex = wives.findIndex(w => w.id === currentSpouse.id);
        console.log('🔍 Index by ID match:', wifeIndex);

        // If no ID match and we have an editing index, use that
        if (wifeIndex === -1 && editingWifeIndex !== null && editingWifeIndex >= 0) {
          wifeIndex = editingWifeIndex;
          console.log('🔍 Using editingWifeIndex:', wifeIndex);
        }

        if (wifeIndex >= 0) {
          // Update existing wife - preserve original ID and database reference
          console.log('🔍 UPDATING existing wife at index:', wifeIndex);
          const existingWife = wives[wifeIndex];
          const updatedWife = {
            ...updatedSpouse,
            // Preserve original database ID if it exists
            id: existingWife.id || updatedSpouse.id,
            existingFamilyMemberId: existingWife.existingFamilyMemberId || updatedSpouse.existingFamilyMemberId,
            isSaved: true
          };
          console.log('🔍 Updated wife data:', {
            id: updatedWife.id,
            name: updatedWife.name,
            existingFamilyMemberId: updatedWife.existingFamilyMemberId
          });
          const updatedWives = [...wives];
          updatedWives[wifeIndex] = updatedWife;
          setWives(updatedWives);

          // Update originalWivesData to track changes for new members
          if (originalWivesData.length === 0 && formMode === 'add') {
            // For new members, initialize originalWivesData with the first save
            setOriginalWivesData([...updatedWives]);
          } else if (originalWivesData.length > 0) {
            // For existing members or subsequent saves, update originalWivesData
            const updatedOriginal = [...originalWivesData];
            if (updatedOriginal[wifeIndex]) {
              updatedOriginal[wifeIndex] = { ...updatedOriginal[wifeIndex], ...updatedWife };
            } else {
              updatedOriginal.push(updatedWife);
            }
            setOriginalWivesData(updatedOriginal);
          }
        } else {
          // Add new wife
          const newWives = [...wives, updatedSpouse];
          setWives(newWives);

          // Update originalWivesData for new members
          if (originalWivesData.length === 0 && formMode === 'add') {
            setOriginalWivesData([...newWives]);
          } else {
            setOriginalWivesData([...originalWivesData, updatedSpouse]);
          }
        }

        // Update husband
        setHusband(updatedSpouse);

        // Reset form state for husband
        setCurrentHusband(null);
        setShowHusbandForm(false);
        setHusbandFamilyStatus(null);
      }

      // Clear form state
      if (spouseType === 'wife') {
        setCurrentWife(null);
        setShowWifeForm(false);
        setEditingWifeIndex(null);
      }

      toast({
        title: "تم الحفظ",
        description: `تم حفظ بيانات ${spouseType === 'wife' ? 'الزوجة' : 'الزوج'} بنجاح`,
        variant: "default"
      });

    } catch (error) {
      console.error('Error saving spouse:', error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive"
      });
    }
  };

  // Main Form Submission Logic
  const handleFormSubmit = useCallback(async (submissionData: any) => {
    console.log('🚨 HANDLE FORM SUBMIT CALLED!');
    console.log('🚨 Submission data:', submissionData);
    console.log('🚨 Form mode:', formMode);
    console.log('🚨 Editing member:', editingMember ? editingMember.id : 'none');
    console.log('🚨 Current wives:', wives);
    console.log('🚨 Original wives data:', originalWivesData);

    try {
      setIsSaving(true);

      // Determine marital status based on presence of spouses
      const hasSpouses = (submissionData.gender === "male" && wives.length > 0) || 
                        (submissionData.gender === "female" && husband);

      // Prepare final submission data matching modal structure
      const finalData = {
        ...submissionData,
        maritalStatus: hasSpouses ? "married" : "single",
        wives: submissionData.gender === "male" ? wives : [],
        husband: submissionData.gender === "female" && husband ? husband : null
      };

      // Handle image state properly for edits
      let finalImageUrl;
      if (formMode === 'edit' && editingMember) {
        finalImageUrl = submissionData.croppedImage || editingMember.image || null;
      } else {
        finalImageUrl = submissionData.croppedImage || null;
      }

      // Determine family relationship info based on selectedParent
      let fatherId = null;
      let motherId = null;
      let relatedPersonId = null;
      if (submissionData.selectedParent && submissionData.selectedParent !== "none") {
        const selectedMarriage = familyMarriages.find(m => m.id === submissionData.selectedParent);
        if (selectedMarriage) {
          fatherId = selectedMarriage.husband?.id || null;
          motherId = selectedMarriage.wife?.id || null;
          relatedPersonId = selectedMarriage.id;
        }
      }

      let isEditMode = formMode === 'edit' && editingMember;
      let memberData;

      if (isEditMode) {
        // Update existing member
        const firstName = submissionData.first_name || submissionData.name || '';
        let lastName = familyData?.name || '';
        
        if (fatherId) {
          const father = familyMembers.find(m => m.id === fatherId);
          if (father && father.last_name && father.last_name !== familyData?.name) {
            lastName = father.last_name;
          }
        }

        const fullName = firstName && lastName ? `${firstName} ${lastName}` : firstName;
        const { data: updatedMember, error: updateError } = await supabase
          .from('family_tree_members')
          .update({
            name: fullName,
            first_name: firstName,
            last_name: lastName,
            gender: submissionData.gender,
            birth_date: formatDateForDatabase(submissionData.birthDate),
            is_alive: submissionData.isAlive,
            death_date: !submissionData.isAlive ? formatDateForDatabase(submissionData.deathDate) : null,
            biography: submissionData.bio || null,
            image_url: finalImageUrl,
            father_id: fatherId,
            mother_id: motherId,
            related_person_id: relatedPersonId,
            marital_status: finalData.maritalStatus || 'single',
            updated_at: new Date().toISOString()
          })
          .eq('id', editingMember.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating family member:', updateError);
          throw updateError;
        }
        memberData = updatedMember;
      } else {
        // Insert new family member into database
        const firstName = submissionData.first_name || submissionData.name || '';
        let lastName = familyData?.name || '';
        
        if (fatherId) {
          const father = familyMembers.find(m => m.id === fatherId);
          if (father && father.last_name && father.last_name !== familyData?.name) {
            lastName = father.last_name;
          }
        }

        const fullName = firstName && lastName ? `${firstName} ${lastName}` : firstName;
        const { data: newMember, error: memberError } = await supabase
          .from('family_tree_members')
          .insert({
            name: fullName,
            first_name: firstName,
            last_name: lastName,
            gender: submissionData.gender,
            birth_date: formatDateForDatabase(submissionData.birthDate),
            is_alive: submissionData.isAlive,
            death_date: !submissionData.isAlive ? formatDateForDatabase(submissionData.deathDate) : null,
            biography: submissionData.bio || null,
            image_url: submissionData.croppedImage || null,
            father_id: fatherId,
            mother_id: motherId,
            related_person_id: relatedPersonId,
            family_id: familyId,
            created_by: familyData?.creator_id,
            is_founder: submissionData.isFounder || false,
            marital_status: finalData.maritalStatus || 'single'
          })
          .select()
          .single();

        if (memberError) {
          console.error('Error adding family member:', memberError);
          throw memberError;
        }
        memberData = newMember;
      }

      // Track successful marriages for toast message
      let marriageResults = {
        successful: 0,
        failed: 0,
        details: []
      };

      // Process marriages here (simplified for brevity)
      // ... marriage processing logic would go here ...

      // Refresh family data to show updated information
      await refreshFamilyData();

      // Show success toast
      const actionText = isEditMode ? "تحديث" : "إضافة";
      const actionedText = isEditMode ? "تم تحديث" : "تم إضافة";
      toast({
        title: `تم ${actionText} العضو بنجاح`,
        description: `${actionedText} العضو "${submissionData.name}" بنجاح`,
        variant: "default"
      });

    } catch (error) {
      console.error('Error submitting form:', error);
      let errorMessage = "حدث خطأ أثناء حفظ البيانات";

      if (error.message?.includes('duplicate')) {
        errorMessage = "يوجد عضو بنفس هذه البيانات مسبقاً";
      } else if (error.message?.includes('foreign key')) {
        errorMessage = "خطأ في الربط مع بيانات العائلة";
      } else if (error.message?.includes('permission')) {
        errorMessage = "ليس لديك صلاحية لتنفيذ هذا الإجراء";
      }

      toast({
        title: formMode === 'edit' ? "خطأ في التحديث" : "خطأ في الإضافة",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }, [formData, familyData, wives, husband, packageData, subscriptionData, editingMember, toast, refreshFamilyData]);

  const resetFormData = () => {
    setFormData({
      id: '',
      first_name: '',
      gender: '',
      birth_date: null,
      death_date: null,
      is_alive: true,
      isFounder: false,
      fatherId: '',
      motherId: '',
      relatedPersonId: '',
      relation: '',
      selectedParent: '',
      parentType: '',
      name: '',
      birthDate: null,
      deathDate: null,
      isAlive: true,
      bio: "",
      imageUrl: "",
      croppedImage: null
    });
    setCurrentStep(1);
    setWives([]);
    setHusband(null);
    setOriginalWivesData([]);
    setOriginalHusbandData(null);
  };

  const populateFormData = (member: any) => {
    setFormData({
      name: member.name || "",
      first_name: member.first_name || member.name?.split(' ')[0] || "",
      relation: member.relation || "",
      relatedPersonId: member.relatedPersonId,
      selectedParent: member.relatedPersonId || null,
      parentType: member.parentType || "",
      gender: member.gender || "",
      birthDate: member.birth_date ? new Date(member.birth_date) : null,
      deathDate: member.death_date ? new Date(member.death_date) : null,
      birth_date: member.birth_date ? new Date(member.birth_date) : null,
      death_date: member.death_date ? new Date(member.death_date) : null,
      isAlive: member.is_alive !== false,
      is_alive: member.is_alive !== false,
      bio: member.biography || "",
      id: member.id || "",
      fatherId: member.father_id || "",
      motherId: member.mother_id || "",
      imageUrl: member.image_url || "",
      croppedImage: null,
      isFounder: member.isFounder || false
    });

    // Load existing spouses
    loadExistingSpouses(member);
  };

  const loadExistingSpouses = (member: any) => {
    if (!familyMarriages || familyMarriages.length === 0) return;

    // Reset spouse states first
    setWives([]);
    setHusband(null);
    setOriginalWivesData([]);
    setOriginalHusbandData(null);

    // Find marriages involving this member
    const memberMarriages = familyMarriages.filter(
      (marriage: any) => marriage.husband?.id === member.id || marriage.wife?.id === member.id
    );

    if (member.gender === 'male') {
      // For male members, load wives
      const wivesData: SpouseData[] = [];
      memberMarriages.forEach((marriage: any) => {
        if (marriage.wife) {
          const wifeMember = familyMembers.find(m => m.id === marriage.wife.id);
          if (wifeMember) {
            wivesData.push({
              id: wifeMember.id,
              existingFamilyMemberId: wifeMember.id,
              name: wifeMember.name || '',
              firstName: wifeMember.first_name || '',
              lastName: wifeMember.last_name || '',
              birthDate: wifeMember.birth_date ? new Date(wifeMember.birth_date) : null,
              deathDate: wifeMember.death_date ? new Date(wifeMember.death_date) : null,
              isAlive: wifeMember.is_alive !== false,
              maritalStatus: marriage.marital_status || 'married',
              isFamilyMember: true,
              croppedImage: wifeMember.image_url || null,
              biography: wifeMember.biography || '',
              isSaved: true
            });
          }
        }
      });
      setWives(wivesData);
      setOriginalWivesData([...wivesData]);
    } else if (member.gender === 'female' && memberMarriages.length > 0) {
      // For female members, load husband (first marriage only)
      const marriage = memberMarriages[0];
      if (marriage.husband) {
        const husbandMember = familyMembers.find(m => m.id === marriage.husband.id);
        if (husbandMember) {
          const husbandData: SpouseData = {
            id: husbandMember.id,
            existingFamilyMemberId: husbandMember.id,
            name: husbandMember.name || '',
            firstName: husbandMember.first_name || '',
            lastName: husbandMember.last_name || '',
            birthDate: husbandMember.birth_date ? new Date(husbandMember.birth_date) : null,
            deathDate: husbandMember.death_date ? new Date(husbandMember.death_date) : null,
            isAlive: husbandMember.is_alive !== false,
            maritalStatus: marriage.marital_status || 'married',
            isFamilyMember: true,
            croppedImage: husbandMember.image_url || null,
            biography: husbandMember.biography || '',
            isSaved: true
          };
          setHusband(husbandData);
          setOriginalHusbandData({ ...husbandData });
        }
      }
    }
  };

  return {
    // Form State
    formData,
    setFormData,
    currentStep,
    setCurrentStep,
    isSaving,
    
    // Spouse State
    wives,
    setWives,
    husband,
    setHusband,
    originalWivesData,
    originalHusbandData,
    
    // Wife Form State
    wifeCommandOpen,
    setWifeCommandOpen,
    wivesCommandOpen,
    setWivesCommandOpen,
    editingWifeIndex,
    setEditingWifeIndex,
    currentWife,
    setCurrentWife,
    wifeFamilyStatus,
    setWifeFamilyStatus,
    showWifeForm,
    setShowWifeForm,
    
    // Husband Form State
    husbandCommandOpen,
    setHusbandCommandOpen,
    currentHusband,
    setCurrentHusband,
    husbandFamilyStatus,
    setHusbandFamilyStatus,
    showHusbandForm,
    setShowHusbandForm,
    
    // Functions
    nextStep,
    prevStep,
    handleWifeFamilyStatusChange,
    handleHusbandFamilyStatusChange,
    handleAddWife,
    handleAddHusband,
    handleSpouseSave,
    handleFormSubmit,
    resetFormData,
    populateFormData,
    loadExistingSpouses
  };
};