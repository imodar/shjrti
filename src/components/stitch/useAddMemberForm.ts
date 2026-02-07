/**
 * useAddMemberForm - Custom Hook for Add/Edit Member Form Logic
 * Extracted from FamilyBuilderNew.tsx for Stitch theme
 */

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useImageUploadPermission } from '@/hooks/useImageUploadPermission';
import { membersApi, marriagesApi } from '@/lib/api';
import { uploadMemberImage, getMemberImageUrl, deleteMemberImage } from '@/utils/imageUpload';
import { formatDateForDatabase, parseDateFromDatabase } from '@/lib/dateUtils';
import { SpouseData } from '@/components/SpouseForm';
import { 
  MemberFormData, 
  FormMode, 
  AddMemberFormProps, 
  defaultFormData, 
  defaultSpouseData 
} from './AddMemberFormTypes';

interface UseAddMemberFormProps {
  familyId: string;
  familyMembers: any[];
  marriages: any[];
  familyData: any;
  editingMember?: any;
  formMode: FormMode;
  onClose: () => void;
  onMemberSaved: () => void;
}

export const useAddMemberForm = ({
  familyId,
  familyMembers,
  marriages,
  familyData,
  editingMember,
  formMode,
  onClose,
  onMemberSaved
}: UseAddMemberFormProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { isImageUploadEnabled } = useImageUploadPermission();

  // Form step
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);

  // Form data
  const [formData, setFormData] = useState<MemberFormData>(defaultFormData);

  // Spouse data
  const [wives, setWives] = useState<SpouseData[]>([]);
  const [husbands, setHusbands] = useState<SpouseData[]>([]);
  const [originalWivesData, setOriginalWivesData] = useState<SpouseData[]>([]);
  const [originalHusbandData, setOriginalHusbandData] = useState<SpouseData | null>(null);

  // Spouse form states
  const [currentSpouse, setCurrentSpouse] = useState<SpouseData | null>(null);
  const [activeSpouseType, setActiveSpouseType] = useState<'wife' | 'husband' | null>(null);
  const [showSpouseForm, setShowSpouseForm] = useState(false);
  const [spouseCommandOpen, setSpouseCommandOpen] = useState(false);
  const [spouseFamilyStatus, setSpouseFamilyStatus] = useState<'yes' | 'no' | null>(null);
  const [editingWifeIndex, setEditingWifeIndex] = useState<number | null>(null);
  const [parentsLocked, setParentsLocked] = useState(false);

  // Image states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [imageChanged, setImageChanged] = useState(false);
  const [editingMemberImageUrl, setEditingMemberImageUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load signed URL for editing member's image
  useEffect(() => {
    const loadEditingMemberImage = async () => {
      if (editingMember?.image && !editingMember.image.startsWith('data:image/') && !editingMember.image.startsWith('blob:')) {
        const signedUrl = await getMemberImageUrl(editingMember.image);
        setEditingMemberImageUrl(signedUrl);
      } else {
        setEditingMemberImageUrl(editingMember?.image || null);
      }
    };
    
    if (editingMember) {
      loadEditingMemberImage();
    }
  }, [editingMember?.image]);

  // Sync croppedImage with formData
  useEffect(() => {
    if (croppedImage !== formData.croppedImage) {
      setFormData(prev => ({ ...prev, croppedImage }));
    }
  }, [croppedImage, formData.croppedImage]);

  // Image helpers
  const createImage = (url: string): Promise<HTMLImageElement> => 
    new Promise((resolve, reject) => {
      const image = document.createElement('img');
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', error => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob | null> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const MAX_SIZE = 1200;
    const scale = Math.min(MAX_SIZE / pixelCrop.width, MAX_SIZE / pixelCrop.height, 1);
    
    canvas.width = pixelCrop.width * scale;
    canvas.height = pixelCrop.height * scale;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise<Blob | null>(resolve => {
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.8);
    });
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setSelectedImage(reader.result as string);
        setShowCropDialog(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleCropSave = async () => {
    if (selectedImage && croppedAreaPixels) {
      const croppedBlob = await getCroppedImg(selectedImage, croppedAreaPixels);
      if (croppedBlob) {
        const previewUrl = URL.createObjectURL(croppedBlob);
        setCroppedImage(previewUrl);
        setImageChanged(true);
        setShowCropDialog(false);
        (window as any).__croppedImageBlob = croppedBlob;
      }
    }
  };

  const handleDeleteImage = async () => {
    try {
      let currentPath: string | null = editingMember?.image || null;
      if (!currentPath && editingMember?.id) {
        try {
          const memberData = await membersApi.get(editingMember.id);
          currentPath = memberData?.image_url ?? null;
        } catch (error) {
          console.error('Error fetching member image:', error);
        }
      }

      if (croppedImage && croppedImage.startsWith('blob:')) {
        URL.revokeObjectURL(croppedImage);
      }

      if (currentPath && !currentPath.startsWith('data:image/') && !currentPath.startsWith('blob:')) {
        await deleteMemberImage(currentPath);
      }

      if (editingMember?.id) {
        await membersApi.updateImage(editingMember.id, null);
      }

      setCroppedImage(null);
      setSelectedImage(null);
      setImageChanged(true);
      (window as any).__croppedImageBlob = null;

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast({
        title: t('member.image_deleted', 'تم حذف الصورة'),
        description: t('member.image_deleted_desc', 'تم حذف صورة العضو بنجاح'),
      });
    } catch (err) {
      console.error('Failed to delete image', err);
      toast({
        title: t('member.image_delete_failed', 'فشل حذف الصورة'),
        description: t('member.image_delete_failed_desc', 'حدث خطأ أثناء حذف الصورة'),
        variant: 'destructive',
      });
    }
  };

  // Form reset
  const resetFormData = useCallback(() => {
    setFormData(defaultFormData);
    setParentsLocked(false);
    setWives([]);
    setHusbands([]);
    setOriginalWivesData([]);
    setOriginalHusbandData(null);
    setCurrentSpouse(null);
    setActiveSpouseType(null);
    setShowSpouseForm(false);
    setSpouseFamilyStatus(null);
    setEditingWifeIndex(null);
    setCroppedImage(null);
    setSelectedImage(null);
    setImageChanged(false);
    setEditingMemberImageUrl(null);
    setCurrentStep(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Populate form for editing
  const populateFormData = useCallback((member: any) => {
    setFormData({
      name: member.name || '',
      first_name: member.first_name || member.firstName || '',
      relation: '',
      relatedPersonId: member.relatedPersonId || null,
      selectedParent: null,
      gender: member.gender || 'male',
      birthDate: member.birthDate ? new Date(member.birthDate) : null,
      isAlive: member.isAlive !== false,
      deathDate: member.deathDate ? new Date(member.deathDate) : null,
      bio: member.bio || member.biography || '',
      imageUrl: member.image || '',
      croppedImage: null,
      isFounder: member.isFounder || false,
      is_twin: member.is_twin || false,
      twin_group_id: member.twin_group_id || null,
      selected_twins: []
    });

    // Lock parents if member has children or is married
    const hasChildren = familyMembers.some(m => m.fatherId === member.id || m.motherId === member.id);
    const isMarried = marriages.some(m => m.husband_id === member.id || m.wife_id === member.id);
    setParentsLocked(hasChildren || isMarried);

    // Load existing spouses
    loadExistingSpouses(member);
  }, [familyMembers, marriages]);

  // Load existing spouses for a member
  const loadExistingSpouses = useCallback((member: any) => {
    if (member.gender === 'male') {
      const memberMarriages = marriages.filter(m => m.husband_id === member.id);
      if (memberMarriages.length > 0) {
        const memberWives = memberMarriages.map(marriage => {
          const wifeMember = familyMembers.find(m => m.id === marriage.wife_id);
          const isExternalSpouse = wifeMember ? (!wifeMember.fatherId && !wifeMember.isFounder) : true;
          
          return {
            id: marriage.wife_id || '',
            firstName: wifeMember?.first_name || '',
            lastName: wifeMember?.last_name || '',
            name: wifeMember?.name || '',
            birthDate: wifeMember?.birthDate ? new Date(wifeMember.birthDate) : null,
            maritalStatus: marriage.marital_status || 'married',
            isAlive: wifeMember?.isAlive !== false,
            deathDate: wifeMember?.deathDate ? new Date(wifeMember.deathDate) : null,
            croppedImage: wifeMember?.image || null,
            biography: wifeMember?.bio || '',
            isFamilyMember: !isExternalSpouse,
            existingFamilyMemberId: wifeMember ? wifeMember.id : '',
            isSaved: true
          } as SpouseData;
        }).filter(wife => wife.id);

        setWives(memberWives);
        setOriginalWivesData([...memberWives]);
      } else {
        setWives([]);
        setOriginalWivesData([]);
      }
    } else if (member.gender === 'female') {
      const memberMarriages = marriages.filter(m => m.wife_id === member.id);
      if (memberMarriages.length > 0) {
        const marriage = memberMarriages[0];
        const husbandMember = familyMembers.find(m => m.id === marriage.husband_id);
        const isExternalSpouse = husbandMember ? (!husbandMember.fatherId && !husbandMember.isFounder) : true;
        
        const husbandData: SpouseData = {
          id: marriage.husband_id || '',
          firstName: husbandMember?.first_name || '',
          lastName: husbandMember?.last_name || '',
          name: husbandMember?.name || '',
          birthDate: husbandMember?.birthDate ? new Date(husbandMember.birthDate) : null,
          maritalStatus: 'married',
          isAlive: husbandMember?.isAlive !== false,
          deathDate: husbandMember?.deathDate ? new Date(husbandMember.deathDate) : null,
          croppedImage: husbandMember?.image || null,
          biography: husbandMember?.bio || '',
          isFamilyMember: !isExternalSpouse,
          existingFamilyMemberId: husbandMember ? husbandMember.id : '',
          isSaved: true
        };
        setHusbands([husbandData]);
        setOriginalHusbandData({ ...husbandData });
      } else {
        setHusbands([]);
        setOriginalHusbandData(null);
      }
    }
  }, [familyMembers, marriages]);

  // Spouse handlers
  const handleAddSpouse = (spouseType: 'wife' | 'husband') => {
    setCurrentSpouse({
      ...defaultSpouseData,
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
    setActiveSpouseType(spouseType);
    setShowSpouseForm(true);
    setSpouseFamilyStatus(null);
  };

  const handleSpouseSave = async (spouseType: 'wife' | 'husband') => {
    if (!currentSpouse || activeSpouseType !== spouseType) return;
    
    try {
      let spouseId = currentSpouse.id;
      if (!spouseId || spouseId.startsWith('temp_')) {
        spouseId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      const updatedSpouse: SpouseData = {
        ...currentSpouse,
        id: spouseId,
        isSaved: true
      };
      
      if (spouseType === 'wife') {
        let wifeIndex = wives.findIndex(w => w.id === currentSpouse.id);
        
        if (wifeIndex === -1 && editingWifeIndex !== null && editingWifeIndex >= 0) {
          wifeIndex = editingWifeIndex;
        }
        
        if (wifeIndex >= 0) {
          const existingWife = wives[wifeIndex];
          const updatedWife: SpouseData = {
            ...updatedSpouse,
            id: existingWife.id || updatedSpouse.id,
            existingFamilyMemberId: existingWife.existingFamilyMemberId || updatedSpouse.existingFamilyMemberId,
            isSaved: true
          };
          const updatedWives = [...wives];
          updatedWives[wifeIndex] = updatedWife;
          setWives(updatedWives);
        } else {
          setWives([...wives, updatedSpouse]);
        }
        setEditingWifeIndex(null);
      } else {
        let husbandIndex = husbands.findIndex(h => h.id === currentSpouse.id);
        
        if (husbandIndex >= 0) {
          const existingHusband = husbands[husbandIndex];
          const updatedHusband: SpouseData = {
            ...updatedSpouse,
            id: existingHusband.id || updatedSpouse.id,
            existingFamilyMemberId: existingHusband.existingFamilyMemberId || updatedSpouse.existingFamilyMemberId,
            isSaved: true
          };
          const updatedHusbands = [...husbands];
          updatedHusbands[husbandIndex] = updatedHusband;
          setHusbands(updatedHusbands);
        } else {
          setHusbands([...husbands, updatedSpouse]);
        }
      }

      setCurrentSpouse(null);
      setActiveSpouseType(null);
      setShowSpouseForm(false);
      setSpouseFamilyStatus(null);
      
      toast({
        title: t('spouse.saved_locally', 'تم حفظ البيانات محلياً'),
        description: t('spouse.saved_locally_desc', `تم حفظ بيانات ${spouseType === 'wife' ? 'الزوجة' : 'الزوج'} محلياً`),
      });
    } catch (error) {
      console.error(`Error saving ${spouseType} data locally:`, error);
      toast({
        title: t('spouse.save_error', 'خطأ في الحفظ'),
        description: t('spouse.save_error_desc', 'حدث خطأ أثناء حفظ البيانات'),
        variant: 'destructive'
      });
    }
  };

  const handleSpouseDelete = async (spouse: SpouseData, index: number) => {
    const spouseType = spouse.firstName && husbands.some(h => h.id === spouse.id) ? 'husband' : 'wife';
    
    if (spouseType === 'wife') {
      const newWives = wives.filter((_, i) => i !== index);
      setWives(newWives);
    } else {
      const newHusbands = husbands.filter((_, i) => i !== index);
      setHusbands(newHusbands);
    }
    
    toast({
      title: t('spouse.deleted', 'تم الحذف'),
      description: t('spouse.deleted_desc', 'سيتم تأكيد الحذف عند حفظ العضو'),
    });
  };

  const handleSpouseEdit = (spouseType: 'wife' | 'husband', spouseData: SpouseData, index: number) => {
    const isSpouseFamilyMember = spouseData.isFamilyMember && Boolean(spouseData.existingFamilyMemberId);
    const familyStatus = isSpouseFamilyMember ? 'yes' : 'no';

    const normalizedSpouseData: SpouseData = {
      id: spouseData.id || '',
      firstName: spouseData.firstName || '',
      lastName: spouseData.lastName || '',
      name: spouseData.name || `${spouseData.firstName || ''} ${spouseData.lastName || ''}`.trim(),
      isAlive: spouseData.isAlive !== undefined ? spouseData.isAlive : true,
      birthDate: spouseData.birthDate instanceof Date ? spouseData.birthDate : (spouseData.birthDate ? new Date(spouseData.birthDate) : null),
      deathDate: spouseData.deathDate instanceof Date ? spouseData.deathDate : (spouseData.deathDate ? new Date(spouseData.deathDate) : null),
      maritalStatus: spouseData.maritalStatus || 'married',
      isFamilyMember: isSpouseFamilyMember,
      existingFamilyMemberId: spouseData.existingFamilyMemberId || '',
      croppedImage: spouseData.croppedImage || null,
      biography: spouseData.biography || '',
      isSaved: false
    };

    if (spouseType === 'wife') {
      setEditingWifeIndex(index);
    }
    
    setCurrentSpouse(normalizedSpouseData);
    setActiveSpouseType(spouseType);
    setShowSpouseForm(true);
    setSpouseFamilyStatus(familyStatus);
  };

  const closeSpouseForm = () => {
    setCurrentSpouse(null);
    setActiveSpouseType(null);
    setShowSpouseForm(false);
    setSpouseFamilyStatus(null);
    setEditingWifeIndex(null);
  };

  // Navigation
  const nextStep = () => setCurrentStep(2);
  const prevStep = () => setCurrentStep(1);

  // Main form submit handler
  const handleFormSubmit = useCallback(async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setIsSaving(true);

    try {
      const hasSpouses = (formData.gender === 'male' && wives.length > 0) || 
                         (formData.gender === 'female' && husbands.length > 0);

      const submissionData = {
        ...formData,
        maritalStatus: hasSpouses ? 'married' : 'single',
        wives: formData.gender === 'male' ? wives : [],
        husbands: formData.gender === 'female' ? husbands : []
      };

      // Handle image upload
      let finalImageUrl: string | null = null;
      let oldImagePath: string | null = null;

      if (formMode === 'edit' && editingMember) {
        if (imageChanged) {
          if (editingMember.image && !editingMember.image.startsWith('data:image/') && !editingMember.image.startsWith('blob:')) {
            oldImagePath = editingMember.image;
          }
          
          const croppedBlob = (window as any).__croppedImageBlob;
          if (croppedBlob) {
            finalImageUrl = await uploadMemberImage(croppedBlob, editingMember.id);
            
            if (!finalImageUrl) {
              toast({
                title: t('member.image_upload_warning', 'تحذير'),
                description: t('member.image_upload_failed', 'فشل رفع الصورة'),
                variant: 'destructive'
              });
              finalImageUrl = editingMember.image || null;
              oldImagePath = null;
            }
          } else if (croppedImage === null) {
            finalImageUrl = null;
          } else {
            finalImageUrl = editingMember.image || null;
            oldImagePath = null;
          }
        } else {
          finalImageUrl = editingMember.image || null;
        }
      } else {
        const croppedBlob = (window as any).__croppedImageBlob;
        if (croppedBlob) {
          const tempId = `temp_${Date.now()}`;
          finalImageUrl = await uploadMemberImage(croppedBlob, tempId);
        }
      }

      // Prepare member data
      const firstName = formData.first_name || formData.name.split(' ')[0] || '';
      const lastName = formData.name.split(' ').slice(1).join(' ') || familyData?.name || '';

      const memberPayload = {
        name: formData.name || `${firstName} ${lastName}`.trim(),
        first_name: firstName,
        last_name: lastName,
        gender: formData.gender,
        birth_date: formatDateForDatabase(formData.birthDate),
        is_alive: formData.isAlive,
        death_date: !formData.isAlive ? formatDateForDatabase(formData.deathDate) : null,
        biography: formData.bio || null,
        image_url: finalImageUrl,
        marital_status: submissionData.maritalStatus,
        is_founder: formData.isFounder,
        is_twin: formData.is_twin,
        twin_group_id: formData.twin_group_id
      };

      let memberData;

      if (formMode === 'edit' && editingMember) {
        // Update existing member
        memberData = await membersApi.update(editingMember.id, memberPayload);
        
        // Delete old image after successful update
        if (oldImagePath && finalImageUrl && finalImageUrl !== oldImagePath) {
          await deleteMemberImage(oldImagePath);
        }
      } else {
        // Create new member
        const fatherId = null;
        const motherId = null;
        
        // If a parent marriage is selected, extract father/mother IDs
        if (formData.selectedParent && formData.selectedParent !== 'none') {
          const selectedMarriage = marriages.find(m => m.id === formData.selectedParent);
          if (selectedMarriage) {
            (memberPayload as any).father_id = selectedMarriage.husband_id;
            (memberPayload as any).mother_id = selectedMarriage.wife_id;
          }
        }

        memberData = await membersApi.create({
          ...memberPayload,
          family_id: familyId,
          created_by: familyData?.creator_id
        });
      }

      // Handle spouse marriages
      let marriageResults = { successful: 0, failed: 0, details: [] as string[] };

      const processSpouseMarriage = async (spouseData: SpouseData, spouseType: 'wife' | 'husband') => {
        try {
          const isWife = spouseType === 'wife';
          const isValidUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
          const candidateId = spouseData.existingFamilyMemberId || spouseData.id || null;
          let spouseId = candidateId && typeof candidateId === 'string' && isValidUuid(candidateId) ? candidateId : null;

          const firstName = spouseData.firstName || '';
          const lastName = spouseData.lastName || familyData?.name || '';
          const spouseName = spouseData.name || (firstName && lastName ? `${firstName} ${lastName}` : (firstName || lastName || ''));

          if (spouseId) {
            // Update existing spouse
            let currentImageUrl = null;
            try {
              const currentSpouse = await membersApi.get(spouseId);
              currentImageUrl = currentSpouse?.image_url || null;
            } catch (e) {
              console.log('Could not fetch current spouse image');
            }

            const imageUrl = (spouseData.croppedImage !== undefined)
              ? (spouseData.croppedImage || null)
              : currentImageUrl;

            if (spouseData.isFamilyMember) {
              await membersApi.update(spouseId, {
                marital_status: spouseData.maritalStatus,
                image_url: imageUrl,
                biography: spouseData.biography || null,
              });
            } else {
              await membersApi.update(spouseId, {
                name: spouseName,
                first_name: firstName,
                last_name: lastName,
                birth_date: formatDateForDatabase(spouseData.birthDate),
                is_alive: spouseData.isAlive ?? true,
                death_date: !spouseData.isAlive ? formatDateForDatabase(spouseData.deathDate) : null,
                marital_status: spouseData.maritalStatus || 'married',
                image_url: imageUrl,
                biography: spouseData.biography || null,
              });
            }
          } else {
            // Create new spouse
            const newSpouse = await membersApi.create({
              name: spouseName,
              first_name: firstName,
              last_name: lastName,
              gender: isWife ? 'female' : 'male',
              birth_date: formatDateForDatabase(spouseData.birthDate),
              is_alive: spouseData.isAlive ?? true,
              death_date: !spouseData.isAlive ? formatDateForDatabase(spouseData.deathDate) : null,
              family_id: familyId,
              is_founder: false,
              marital_status: spouseData.maritalStatus || 'married',
              image_url: spouseData.croppedImage || null,
              biography: spouseData.biography || null,
            });
            spouseId = newSpouse.id;
          }

          // Create/update marriage
          if (spouseId) {
            const husbandId = isWife ? memberData.id : spouseId;
            const wifeId = isWife ? spouseId : memberData.id;

            await marriagesApi.upsert({
              family_id: familyId,
              husband_id: husbandId,
              wife_id: wifeId,
              is_active: true,
              marital_status: spouseData.maritalStatus || 'married',
            });

            marriageResults.successful++;
          }
        } catch (error) {
          console.error(`Error processing ${spouseType}:`, error);
          marriageResults.failed++;
        }
      };

      // Process wives for male members
      if (submissionData.gender === 'male' && wives.length > 0) {
        const savedWives = wives.filter(w => w.isSaved === true);
        for (const wife of savedWives) {
          await processSpouseMarriage(wife, 'wife');
        }
      }

      // Process husbands for female members
      if (submissionData.gender === 'female' && husbands.length > 0) {
        const savedHusbands = husbands.filter(h => h.isSaved === true);
        for (const husband of savedHusbands) {
          await processSpouseMarriage(husband, 'husband');
        }
      }

      // Clean up
      (window as any).__croppedImageBlob = null;
      
      toast({
        title: formMode === 'edit' 
          ? t('member.updated', 'تم تحديث العضو') 
          : t('member.created', 'تم إضافة العضو'),
        description: formMode === 'edit'
          ? t('member.updated_desc', 'تم تحديث بيانات العضو بنجاح')
          : t('member.created_desc', 'تم إضافة العضو بنجاح'),
      });

      onMemberSaved();
      resetFormData();
      onClose();
    } catch (error) {
      console.error('Error saving member:', error);
      toast({
        title: t('member.save_error', 'خطأ في الحفظ'),
        description: t('member.save_error_desc', 'حدث خطأ أثناء حفظ بيانات العضو'),
        variant: 'destructive'
      });
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [formData, wives, husbands, formMode, editingMember, imageChanged, croppedImage, familyId, familyData, marriages, onMemberSaved, resetFormData, onClose, toast, t]);

  // Get current siblings for twin selection
  const currentSiblings = useMemo(() => {
    let fatherId = null;
    let motherId = null;
    
    if (formMode === 'edit') {
      fatherId = editingMember?.fatherId;
      motherId = editingMember?.motherId;
    } else if (formData.selectedParent && formData.selectedParent !== 'none') {
      const selectedMarriage = marriages.find(m => m.id === formData.selectedParent);
      if (selectedMarriage) {
        fatherId = selectedMarriage.husband_id;
        motherId = selectedMarriage.wife_id;
      }
    }
    
    if (!fatherId || !motherId) return [];
    
    const currentId = formMode === 'edit' ? editingMember?.id : null;
    return familyMembers.filter(member => 
      member.id !== currentId && 
      (member.father_id || (member as any).fatherId) === fatherId && 
      (member.mother_id || (member as any).motherId) === motherId
    );
  }, [formMode, editingMember, formData.selectedParent, marriages, familyMembers]);

  return {
    // Form state
    currentStep,
    setCurrentStep,
    formData,
    setFormData,
    isSaving,
    parentsLocked,
    
    // Spouses
    wives,
    setWives,
    husbands,
    setHusbands,
    currentSpouse,
    setCurrentSpouse,
    activeSpouseType,
    showSpouseForm,
    spouseCommandOpen,
    setSpouseCommandOpen,
    spouseFamilyStatus,
    setSpouseFamilyStatus,
    editingWifeIndex,
    
    // Image
    selectedImage,
    croppedImage,
    showCropDialog,
    setShowCropDialog,
    imageChanged,
    editingMemberImageUrl,
    crop,
    setCrop,
    zoom,
    setZoom,
    croppedAreaPixels,
    fileInputRef,
    isImageUploadEnabled,
    
    // Handlers
    handleImageSelect,
    handleCropSave,
    handleDeleteImage,
    onCropComplete,
    handleAddSpouse,
    handleSpouseSave,
    handleSpouseDelete,
    handleSpouseEdit,
    closeSpouseForm,
    resetFormData,
    populateFormData,
    handleFormSubmit,
    nextStep,
    prevStep,
    
    // Data
    currentSiblings
  };
};

export default useAddMemberForm;
