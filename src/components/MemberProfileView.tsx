import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DateDisplay, LifespanDisplay } from '@/components/DateDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MemberMemories } from '@/components/MemberMemories';
import { useResolvedImageUrl } from '@/utils/useResolvedImageUrl';
import { uploadMemberImage } from '@/utils/imageUpload';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ImageUploadModal } from '@/components/ImageUploadModal';
import { SuggestEditDialog } from '@/components/SuggestEditDialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Edit,
  Trash2, 
  Heart, 
  Users, 
  Calendar, 
  User, 
  MapPin, 
  ArrowRight,
  Star,
  Crown,
  Gift,
  Phone,
  Mail,
  Home,
  Briefcase,
  GraduationCap,
  Camera,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  ChevronDown,
  Award,
  Clock,
  Eye,
  Sparkles,
  X
} from 'lucide-react';

interface MemberProfileViewProps {
  member: any;
  onEdit?: () => void;
  onDelete?: () => void;
  onBack?: () => void;
  familyMembers: any[];
  marriages?: any[];
  isSpouse?: boolean;
  onSpouseEditWarning?: () => void;
  onSpouseDeleteWarning?: () => void;
  onMemberClick?: (member: any) => void;
  onAddChild?: (parentMember: any) => void;
  readOnly?: boolean;
}

export const MemberProfileView: React.FC<MemberProfileViewProps> = ({
  member,
  onEdit,
  onDelete,
  onBack,
  familyMembers,
  marriages = [],
  isSpouse = false,
  onSpouseEditWarning,
  onSpouseDeleteWarning,
  onMemberClick,
  onAddChild,
  readOnly = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAllInfo, setShowAllInfo] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [showSuggestDialog, setShowSuggestDialog] = useState(false);
  const { toast } = useToast();
  const location = useLocation();
  const { t, direction } = useLanguage();

  // Resolve member image to signed URL
  const memberImageSrc = useResolvedImageUrl(member?.image_url || (member as any)?.image);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleImageSave = async (croppedImageBlob: Blob) => {
    setIsUploadingImage(true);

    try {
      // Upload image to storage
      const filePath = await uploadMemberImage(croppedImageBlob, member.id);
      
      if (!filePath) {
        throw new Error(t('profile.image_upload_failed'));
      }

      // Update member's image_url in database
      const { error: updateError } = await supabase
        .from('family_tree_members')
        .update({ image_url: filePath })
        .eq('id', member.id);

      if (updateError) {
        throw updateError;
      }

      // Update local member object - this will trigger re-render
      member.image_url = filePath;
      (member as any).image = filePath;

      toast({
        title: t('profile.update_success'),
        description: t('profile.image_update_success'),
      });

      // Force component re-render by toggling visibility
      setIsVisible(false);
      setTimeout(() => {
        setIsVisible(true);
      }, 0);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: t('common.error'),
        description: t('profile.image_update_failed'),
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (!member) return null;

  const getGenderColor = (gender: string) => {
    return gender === 'male' ? 'bg-blue-500' : 'bg-pink-500';
  };

  // Generate timeline events with proper logical ordering
  const generateTimelineEvents = () => {
    const events = [];
    const genderText = member.gender === 'male' ? { 
      birth: t('profile.was_born_male'), 
      marry: t('profile.married_male'), 
      death: t('profile.died_male'), 
      divorce: t('profile.divorced_male') 
    } : { 
      birth: t('profile.was_born_female'), 
      marry: t('profile.married_female'), 
      death: t('profile.died_female'), 
      divorce: t('profile.divorced_female') 
    };

    // Birth date as baseline
    const birthDate = member.birthDate || member.birth_date;
    const birthTimestamp = birthDate ? new Date(birthDate).getTime() : 0;

    // Birth event - always first
    events.push({
      type: 'birth',
      date: birthDate,
      sortOrder: 0, // First event
      sortTimestamp: birthTimestamp,
      title: `${genderText.birth} ${member.first_name || member.name}`,
      description: birthDate ? null : t('profile.date_unknown'),
      icon: 'Gift',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    });

    // Marriage events with children grouped properly
    const spouses = getSpouses();
    spouses.forEach((spouse, marriageIndex) => {
      const marriageDate = spouse.marriage_date || spouse.created_at;
      const marriageTimestamp = marriageDate ? new Date(marriageDate).getTime() : (birthTimestamp + (marriageIndex + 1) * 1000);
      
      // Marriage event
      const marriageEvent = {
        type: 'marriage',
        date: marriageDate,
        sortOrder: (marriageIndex + 1) * 100, // Marriage 1: 100, Marriage 2: 200, etc.
        sortTimestamp: marriageTimestamp,
        spouseId: spouse.id,
        title: `${genderText.marry} ${t('common.from')} ${spouse.first_name || spouse.name} ${spouse.last_name || ''}`.trim(),
        description: marriageDate ? null : t('profile.date_unknown'),
        icon: 'Heart',
        color: 'text-pink-600',
        bgColor: 'bg-pink-50'
      };
      events.push(marriageEvent);

      // Children from this marriage - must be after marriage and before divorce
      const childrenWithSpouse = getChildrenBySpouse(spouse.id);
      childrenWithSpouse.forEach((child, childIndex) => {
        const childBirthDate = child.birthDate || child.birth_date;
        const childBirthTimestamp = childBirthDate ? new Date(childBirthDate).getTime() : (marriageTimestamp + (childIndex + 1) * 100);
        
        events.push({
          type: 'child',
          date: childBirthDate,
          sortOrder: (marriageIndex + 1) * 100 + 10 + childIndex, // After marriage: 110, 111, 112...
          sortTimestamp: childBirthTimestamp,
          spouseId: spouse.id,
          title: `${t('profile.born_to_them')} ${child.first_name || child.name}`,
          description: childBirthDate ? null : t('profile.date_unknown'),
          icon: 'Users',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50'
        });
      });

      // Divorce event if divorced - comes after all children
      if (spouse.marital_status === 'divorced') {
        // Find the last child's date from this marriage or use marriage date
        const lastChildDate = childrenWithSpouse.length > 0
          ? Math.max(...childrenWithSpouse.map(c => {
              const d = c.birthDate || c.birth_date;
              return d ? new Date(d).getTime() : marriageTimestamp;
            }))
          : marriageTimestamp;

        events.push({
          type: 'divorce',
          date: null,
          sortOrder: (marriageIndex + 1) * 100 + 50, // After children: 150, 250, etc.
          sortTimestamp: lastChildDate + 1000,
          spouseId: spouse.id,
          title: `${genderText.divorce} ${t('common.from')} ${spouse.first_name || spouse.name}`,
          description: t('profile.date_unknown'),
          icon: 'X',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50'
        });
      }
    });

    // Children without specific spouse - after all marriages
    const childrenWithoutSpouse = getChildrenBySpouse();
    childrenWithoutSpouse.forEach((child, index) => {
      const childBirthDate = child.birthDate || child.birth_date;
      const childBirthTimestamp = childBirthDate ? new Date(childBirthDate).getTime() : (birthTimestamp + (spouses.length + 1) * 1000 + index * 100);
      
      events.push({
        type: 'child',
        date: childBirthDate,
        sortOrder: 10000 + index, // Very high number to come after all marriages
        sortTimestamp: childBirthTimestamp,
        title: `${t('profile.born_to_him')} ${child.first_name || child.name}`,
        description: childBirthDate ? null : t('profile.date_unknown'),
        icon: 'Users',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      });
    });

    // Death event - always last
    if (member.deathDate || member.death_date) {
      const deathDate = member.deathDate || member.death_date;
      const deathTimestamp = deathDate ? new Date(deathDate).getTime() : (birthTimestamp + 999999999);
      
      events.push({
        type: 'death',
        date: deathDate,
        sortOrder: 999999, // Very high to be last
        sortTimestamp: deathTimestamp,
        title: `${genderText.death}`,
        description: deathDate ? null : t('profile.date_unknown'),
        icon: 'Clock',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50'
      });
    }

    // Sort events: birth always first, death always last, rest in logical order
    return events.sort((a, b) => {
      // Birth always first
      if (a.type === 'birth') return -1;
      if (b.type === 'birth') return 1;
      
      // Death always last
      if (a.type === 'death') return 1;
      if (b.type === 'death') return -1;
      
      // For other events, use sortOrder for logical ordering
      return a.sortOrder - b.sortOrder;
    });
  };

  const getEventIcon = (iconName: string) => {
    const icons = {
      Gift: Gift,
      Heart: Heart,
      Users: Users,
      Clock: Clock,
      X: X
    };
    return icons[iconName] || Clock;
  };

  const getMaritalStatus = (spouse?: any) => {
    if (spouse && spouse.marital_status === 'divorced') {
      return t('profile.divorced');
    }
    const spouses = getSpouses();
    const children = getChildren();
    
    if (children.length > 0) {
      return t('profile.married');
    }
    
    if ((member.related_person_id || member.relatedPersonId) && spouses.length === 0) {
      const relatedPerson = familyMembers.find(m => m.id === (member.related_person_id || member.relatedPersonId));
      if (relatedPerson) {
        return t('profile.married');
      }
    }
    
    return spouses.length > 0 ? t('profile.married') : t('profile.single');
  };

  const getSpouses = () => {
    const memberMarriages = marriages.filter(m => 
      (member.gender === 'male' && m.husband_id === member.id) || 
      (member.gender === 'female' && m.wife_id === member.id)
    );
    
    if (memberMarriages.length > 0) {
      return memberMarriages.map(marriage => {
        const spouseId = member.gender === 'male' ? marriage.wife_id : marriage.husband_id;
        const spouse = familyMembers.find(m => m.id === spouseId);
        return spouse ? {
          ...spouse,
          marital_status: marriage.marital_status || 'married',
          marriage_date: marriage.created_at
        } : null;
      }).filter(Boolean);
    }

    if (member.related_person_id || member.relatedPersonId) {
      const relatedPerson = familyMembers.find(m => m.id === (member.related_person_id || member.relatedPersonId));
      if (relatedPerson) {
        return [relatedPerson];
      }
    }

    return familyMembers.filter(m => 
      (member.spouse_id || member.spouseId) === m.id || 
      (m.spouse_id || m.spouseId) === member.id
    );
  };

  const getChildren = () => {
    return familyMembers.filter(m => 
      (m.fatherId === member.id || m.father_id === member.id) || 
      (m.motherId === member.id || m.mother_id === member.id)
    );
  };

  const getGrandchildren = () => {
    const children = getChildren();
    let grandchildren = [];
    
    children.forEach(child => {
      const childGrandchildren = familyMembers.filter(m => 
        (m.fatherId === child.id || m.father_id === child.id) || 
        (m.motherId === child.id || m.mother_id === child.id)
      );
      grandchildren.push(...childGrandchildren);
    });
    
    return grandchildren;
  };
  
  const getChildrenBySpouse = (spouseId?: string) => {
    const children = getChildren();
    if (!spouseId) {
      return children.filter(child => 
        (!child.motherId && !child.mother_id && !child.fatherId && !child.father_id) || 
        ((child.fatherId === member.id || child.father_id === member.id) && !child.motherId && !child.mother_id) || 
        ((child.motherId === member.id || child.mother_id === member.id) && !child.fatherId && !child.father_id)
      );
    }
    
    if (member.gender === 'male') {
      return children.filter(child => 
        ((child.motherId === spouseId || child.mother_id === spouseId) && 
         (child.fatherId === member.id || child.father_id === member.id))
      );
    } else {
      return children.filter(child => 
        ((child.fatherId === spouseId || child.father_id === spouseId) && 
         (child.motherId === member.id || child.mother_id === member.id))
      );
    }
  };
  
  const getFather = () => {
    return familyMembers.find(m => 
      m.id === member.father_id || m.id === member.fatherId
    );
  };
  
  const getMother = () => {
    return familyMembers.find(m => 
      m.id === member.mother_id || m.id === member.motherId
    );
  };

  // Helper function to get lineage display for any member
  const getLineageDisplayForMember = (targetMember: any) => {
    // 1. Founder: No lineage
    if (targetMember.is_founder) return [];
    
    const lineages = [];
    const genderTerm = targetMember.gender === 'female' ? t('profile.daughter_of') : t('profile.son_of');
    
    // 2. Members with father_id (original family members) - HIGHEST PRIORITY
    if (targetMember.father_id) {
      const father = familyMembers?.find(f => f.id === targetMember.father_id);
      if (father) {
        const fatherFirstName = father.first_name || father.name.split(' ')[0];
        
        // Check if father is founder (children of founder)
        if (father.is_founder) {
          lineages.push(`${genderTerm} ${fatherFirstName}`);
        } else {
          // Later generations: include grandfather
          const grandfatherId = father.father_id || father.fatherId;
          const grandfather = familyMembers?.find(f => f.id === grandfatherId);
          if (grandfather) {
            const grandfatherFirstName = grandfather.first_name || grandfather.name.split(' ')[0];
            // Use gender-aware term for father's relation to grandfather
            const fatherChildTerm = father.gender === 'female' ? t('profile.daughter_of_short') : t('profile.son_of_short');
            lineages.push(`${genderTerm} ${fatherFirstName} ${fatherChildTerm} ${grandfatherFirstName}`);
          } else {
            lineages.push(`${genderTerm} ${fatherFirstName}`);
          }
        }
      }
    }
    
    // 3. Check if member is a child of any family member (fallback for missing father_id)
    else {
      const parentRelation = familyMembers?.find(parent => {
        const children = familyMembers?.filter(child => 
          child.fatherId === parent.id || child.motherId === parent.id
        );
        return children?.some(child => child.id === targetMember.id);
      });
      
      if (parentRelation) {
        const parentFirstName = parentRelation.first_name || parentRelation.name.split(' ')[0];
        
        // If this parent is founder
        if (parentRelation.is_founder) {
          lineages.push(`${genderTerm} ${parentFirstName}`);
        } else {
          // Get grandparent
          const grandParentId = parentRelation.father_id || parentRelation.fatherId;
          const grandParent = familyMembers?.find(f => f.id === grandParentId);
          if (grandParent) {
            const grandParentFirstName = grandParent.first_name || grandParent.name.split(' ')[0];
            // Use gender-aware term for parent's relation to grandparent
            const parentChildTerm = parentRelation.gender === 'female' ? t('profile.daughter_of_short') : t('profile.son_of_short');
            lineages.push(`${genderTerm} ${parentFirstName} ${parentChildTerm} ${grandParentFirstName}`);
          } else {
            lineages.push(`${genderTerm} ${parentFirstName}`);
          }
        }
      }
      
      // 4. Maternal grandchildren (members with mother_id but no father_id)
      else if (targetMember.mother_id) {
        const mother = familyMembers?.find(m => m.id === targetMember.mother_id);
        if (mother && mother.father_id) {
          const motherFirstName = mother.first_name || mother.name.split(' ')[0];
          const maternalGrandfather = familyMembers?.find(f => f.id === mother.father_id);
          if (maternalGrandfather) {
            const maternalGrandfatherFirstName = maternalGrandfather.first_name || maternalGrandfather.name.split(' ')[0];
            lineages.push(`${genderTerm} ${motherFirstName} ${t('profile.daughter_of_short')} ${maternalGrandfatherFirstName}`);
          }
        }
      }
      
    }
    
    // 5. Check for spouses from outside family (regardless of other conditions)
    const marriage = marriages?.find(m => 
      m.husband_id === targetMember.id || m.wife_id === targetMember.id
    );
    
    if (marriage) {
      const spouseId = targetMember.id === marriage.husband_id ? marriage.wife_id : marriage.husband_id;
      const spouse = familyMembers?.find(s => s.id === spouseId);
      
      if (spouse) {
        // Check if this member is from outside the family (no father_id in family)
        const memberHasFamilyFather = (targetMember.father_id || targetMember.fatherId) && 
          familyMembers?.find(m => m.id === (targetMember.father_id || targetMember.fatherId));
        
        if (!memberHasFamilyFather && !targetMember.is_founder) {
          const spouseFirstName = spouse.first_name || spouse.name.split(' ')[0];
          
          // Get spouse's lineage - include grandfather if available
          let spouseLineage = '';
          const spouseFatherId = spouse.father_id || spouse.fatherId;
          if (spouseFatherId) {
            const spouseFather = familyMembers?.find(f => f.id === spouseFatherId);
            if (spouseFather) {
              const spouseFatherFirstName = spouseFather.first_name || spouseFather.name.split(' ')[0];

              // Use gender-aware term for child-of: female => "ابنة", male => "ابن"
              const childOfTerm = spouse.gender === 'female' ? t('profile.daughter_of') : t('profile.son_of');
              
              // Check if grandfather exists for the spouse's father
              const spouseGrandfatherId = spouseFather.father_id || spouseFather.fatherId;
              if (spouseGrandfatherId) {
                const spouseGrandfather = familyMembers?.find(f => f.id === spouseGrandfatherId);
                if (spouseGrandfather) {
                  const spouseGrandfatherFirstName = spouseGrandfather.first_name || spouseGrandfather.name.split(' ')[0];
                  spouseLineage = ` ${childOfTerm} ${spouseFatherFirstName} ${t('profile.son_of_short')} ${spouseGrandfatherFirstName}`;
                } else {
                  spouseLineage = ` ${childOfTerm} ${spouseFatherFirstName}`;
                }
              } else {
                spouseLineage = ` ${childOfTerm} ${spouseFatherFirstName}`;
              }
            }
          }
          
          // Build the marriage lineage
          if (targetMember.gender === 'male') {
            lineages.push(`${t('profile.husband_of')} ${spouseFirstName}${spouseLineage}`);
          } else {
            lineages.push(`${t('profile.wife_of')} ${spouseFirstName}${spouseLineage}`);
          }
        }
      }
    }
    
    return lineages;
  };

  // Get lineage display for the current member
  const getLineageDisplay = () => {
    return getLineageDisplayForMember(member);
  };

  const getGenerationName = (generationNumber: number): string => {
    const generationNames = {
      1: t('profile.generation_1'),
      2: t('profile.generation_2'), 
      3: t('profile.generation_3'),
      4: t('profile.generation_4'),
      5: t('profile.generation_5'),
      6: t('profile.generation_6'),
      7: t('profile.generation_7'),
      8: t('profile.generation_8'),
      9: t('profile.generation_9'),
      10: t('profile.generation_10')
    };
    
    return generationNames[generationNumber] || `${t('profile.generation')} ${generationNumber}`;
  };

  const calculateMemberGeneration = () => {
    if (!familyMembers.length) return 1;
    
    const generationMap = new Map();
    
    // Step 1: Find the founder and assign generation 1
    const founder = familyMembers.find(member => member.isFounder);
    if (founder) {
      generationMap.set(founder.id, 1);
      
      // Step 2: Find founder's spouse(s) from marriages and assign generation 1
      marriages.forEach(marriage => {
        if (marriage.husband_id === founder.id && marriage.wife_id) {
          generationMap.set(marriage.wife_id, 1);
        } else if (marriage.wife_id === founder.id && marriage.husband_id) {
          generationMap.set(marriage.husband_id, 1);
        }
      });
    }

    // Step 3: Iteratively assign generations based on parent-child relationships
    let changed = true;
    let iterations = 0;
    const maxIterations = 10;

    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;

      familyMembers.forEach(fmember => {
        if (generationMap.has(fmember.id)) return;

        const fatherGeneration = fmember.fatherId ? generationMap.get(fmember.fatherId) : null;
        const motherGeneration = fmember.motherId ? generationMap.get(fmember.motherId) : null;
        
        if (fatherGeneration !== undefined && fatherGeneration !== null || motherGeneration !== undefined && motherGeneration !== null) {
          const parentGeneration = Math.max(
            fatherGeneration || 0, 
            motherGeneration || 0
          );
          const childGeneration = parentGeneration + 1;
          generationMap.set(fmember.id, childGeneration);
          changed = true;
          
          // Also assign the same generation to their spouse(s)
          marriages.forEach(marriage => {
            let spouseId = null;
            if (marriage.husband_id === fmember.id && marriage.wife_id) {
              spouseId = marriage.wife_id;
            } else if (marriage.wife_id === fmember.id && marriage.husband_id) {
              spouseId = marriage.husband_id;
            }
            
            if (spouseId && !generationMap.has(spouseId)) {
              generationMap.set(spouseId, childGeneration);
              changed = true;
            }
          });
        }
      });
    }

    // Fallback for members without parents
    familyMembers.forEach(fmember => {
      if (!generationMap.has(fmember.id) && !fmember.fatherId && !fmember.motherId) {
        generationMap.set(fmember.id, 1);
      }
    });

    return generationMap.get(member.id) || 1;
  };

  const father = getFather();
  const mother = getMother();
  const spouses = getSpouses();
  const children = getChildren();
  const grandchildren = getGrandchildren();
  
  // Debugging logs
  console.log('🔍 Debug - spouses:', spouses);
  console.log('🔍 Debug - spouses.length:', spouses?.length);
  console.log('🔍 Debug - children:', children);
  console.log('🔍 Debug - children.length:', children?.length);
  console.log('🔍 Debug - grandchildren:', grandchildren);
  console.log('🔍 Debug - grandchildren.length:', grandchildren?.length);
  const memberGeneration = calculateMemberGeneration();

  const tabItems = [
    { id: 'overview', label: t('profile.tab_overview'), icon: User },
    { id: 'family', label: t('profile.tab_family'), icon: Users },
    { id: 'timeline', label: t('profile.tab_timeline'), icon: Clock },
    { id: 'media', label: t('profile.tab_media'), icon: Camera }
  ];

  const getAge = () => {
    if (!member.birthDate) return null;
    const birth = new Date(member.birthDate);
    const death = member.deathDate ? new Date(member.deathDate) : new Date();
    const age = death.getFullYear() - birth.getFullYear();
    return age;
  };

  return (
    <div className={`transition-all duration-700 overflow-x-hidden ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      {/* Header */}
      {/* Header removed */}

      {/* Main Content */}
      <div className="container mx-auto px-2 sm:px-4 pb-3 sm:pb-6 max-w-6xl">
        {/* Hero Section */}
        <div className="relative mb-4 sm:mb-8">
          
          
          {/* Profile Info Card */}
          <div className="relative">
            
            <div className="relative bg-card/95 backdrop-blur-xl rounded-xl sm:rounded-2xl overflow-hidden p-4 sm:p-6 md:p-8 border border-border shadow-xl">
              {/* Close Button */}
              {onBack && (
                <button
                  onClick={onBack}
                  className="absolute top-4 right-4 rtl:left-4 rtl:right-auto z-20 h-8 w-8 flex items-center justify-center rounded-full bg-background/80 hover:bg-background border border-border shadow-md transition-all duration-200 hover:scale-110"
                  aria-label={t('common.close')}
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
              
              {/* Black ribbon for deceased members */}
              {(member.deathDate || member.death_date || member.is_alive === false) && (
                <div className="absolute top-0 left-0 z-10">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <svg width="40" height="40" viewBox="0 0 40 40" className="overflow-visible cursor-help">
                          <path 
                            d="M0,12 Q0,0 12,0 L40,0 L0,40 Q0,28 0,12 Z" 
                            fill="black"
                            className="sm:hidden"
                          />
                          <path 
                            d="M0,16 Q0,0 16,0 L40,0 L0,40 Q0,24 0,16 Z" 
                            fill="black"
                            className="hidden sm:block"
                          />
                        </svg>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{t('profile.deceased')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 sm:gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 lg:gap-6 flex-1 min-w-0">
                  {/* Profile Avatar - Now first in DOM */}
                  <div className="relative mx-auto sm:mx-0 flex-shrink-0 group">
                    {/* Show gradient background only when there's no profile picture */}
                    {!member.image_url && !member.image && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur-lg opacity-30 scale-110"></div>
                    )}
                    <Avatar className="relative h-32 w-32 sm:h-36 sm:w-36 lg:h-40 lg:w-40 border-4 border-white shadow-2xl flex-shrink-0">
                      {memberImageSrc ? (
                        <AvatarImage 
                          src={memberImageSrc} 
                          alt={member.name} 
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <AvatarFallback className={`text-5xl font-bold text-white ${getGenderColor(member.gender)}`}>
                          {member.name.charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    
                    {/* Camera Icon for Quick Image Upload */}
                    {!readOnly && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowImageUploadModal(true);
                        }}
                        disabled={isUploadingImage}
                        className="absolute bottom-2 right-2 bg-primary hover:bg-primary/90 text-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={t('profile.change_photo')}
                      >
                        {isUploadingImage ? (
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Basic Info - Name and Stats after picture */}
                  <div className={`space-y-1 text-center ${direction === 'rtl' ? 'sm:text-right' : 'sm:text-left'} flex-[3]`}>
                    <div>
                      {/* Member Name */}
                      <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2 w-full max-w-none">
                        {member.name}
                      </h1>
                      
                      {/* Lineage Display or Founder Badge */}
                      {[member.is_founder, (member as any).isFounder, (member as any).family_founder, (member as any).founder].some(v => v === true || v === 1 || v === 'true') ? (
                        <div className="flex items-center justify-center sm:justify-start gap-1 mb-2">
                          <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
                            <Crown className="h-4 w-4 text-yellow-600" />
                            <span className="text-xs text-yellow-700 font-medium font-arabic">{t('profile.founder')}</span>
                          </div>
                        </div>
                      ) : (
                        (() => {
                          const lineages = getLineageDisplay();
                          return lineages.length > 0 ? lineages.map((lineage, index) => (
                            <p key={index} className="text-lg text-muted-foreground mb-1">
                              {lineage}
                            </p>
                          )) : null;
                        })()
                      )}
                      {member.bio && (
                        <p className="text-lg italic text-muted-foreground max-w-md">
                          "{member.bio}"
                        </p>
                      )}
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="flex gap-6 pt-2 justify-center sm:justify-start">
                      {Boolean(getAge()) && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-accent">{getAge()}</div>
                          <div className="text-sm text-muted-foreground">{t('profile.years')}</div>
                        </div>
                      )}
                      {spouses && spouses.length > 0 && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{spouses.length}</div>
                          <div className="text-sm text-muted-foreground">{t('profile.spouses')}</div>
                        </div>
                      )}
                      {children && children.length > 0 && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{children.length}</div>
                          <div className="text-sm text-muted-foreground">{t('profile.children')}</div>
                        </div>
                      )}
                      {grandchildren && grandchildren.length > 0 && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{grandchildren.length}</div>
                          <div className="text-sm text-muted-foreground">{t('profile.grandchildren')}</div>
                        </div>
                      )}
                     </div>
                     
                     {/* Action Buttons */}
                     <div className="flex justify-center sm:justify-start gap-2 mt-4">
                       {!readOnly && onEdit && (
                          <Button 
                            onClick={() => {
                              if (isSpouse && onSpouseEditWarning) {
                                onSpouseEditWarning();
                              } else {
                                onEdit();
                              }
                            }}
                            className="facebook-button-primary px-4 py-2"
                          >
                            <Edit className="h-4 w-4 ml-2" />
                            {t('profile.edit_info')}
                          </Button>
                        )}
                         {!location.pathname.includes('family-builder-new') && (
                           <Button 
                             onClick={() => setShowSuggestDialog(true)}
                             variant="outline"
                             className="px-4 py-2"
                           >
                             <MessageCircle className="h-4 w-4 ml-2" />
                             {t('profile.suggest_edit')}
                           </Button>
                         )}
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>

        {/* Navigation Tabs */}
        <div className="bg-card rounded-lg border border-border mb-6">
          <div className="flex overflow-x-auto scrollbar-hidden snap-x snap-mandatory -webkit-overflow-scrolling-touch" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {tabItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 font-semibold transition-all relative whitespace-nowrap min-w-fit flex-shrink-0 snap-start ${
                  activeTab === tab.id 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                <tab.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="text-sm sm:text-base">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{t('profile.personal_info')}</h3>
                        <p className="text-sm text-muted-foreground">{t('profile.basic_data')}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowAllInfo(!showAllInfo)}
                      className="facebook-button-secondary"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${showAllInfo ? 'rotate-180' : ''}`} />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Essential Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="text-sm text-blue-700">{t('profile.birth_date')}</div>
                          <div className="font-semibold">
                            {member.birth_date ? <DateDisplay date={member.birth_date} className="inline" /> : t('common.not_specified')}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                        <MapPin className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="text-sm text-green-700">{t('profile.birth_place')}</div>
                          <div className="font-semibold">{member.birthPlace || t('common.not_specified')}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
                        <Heart className="h-5 w-5 text-purple-600" />
                        <div>
                          <div className="text-sm text-purple-700">{t('profile.marital_status')}</div>
                          <div className="font-semibold">{getMaritalStatus()}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl">
                        <Award className="h-5 w-5 text-orange-600" />
                        <div>
                          <div className="text-sm text-orange-700">{t('profile.gender')}</div>
                          <div className="font-semibold">{member.gender === 'male' ? t('profile.male') : t('profile.female')}</div>
                        </div>
                      </div>
                    </div>

                    {/* Death Date - if applicable */}
                    {member.death_date && (
                      <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
                        <Calendar className="h-5 w-5 text-red-600" />
                        <div>
                          <div className="text-sm text-red-700">{t('profile.death_date')}</div>
                          <div className="font-semibold">
                            <DateDisplay date={member.death_date} className="inline" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Additional Info - Expandable */}
                    {showAllInfo && (
                      <div className="space-y-4 border-t pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                            <Phone className="h-5 w-5 text-gray-600" />
                            <div>
                              <div className="text-sm text-gray-700">{t('profile.phone')}</div>
                              <div className="font-semibold">{member.phone || t('common.not_specified')}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                            <Mail className="h-5 w-5 text-gray-600" />
                            <div>
                              <div className="text-sm text-gray-700">{t('profile.email')}</div>
                              <div className="font-semibold">{member.email || t('common.not_specified')}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Family Tab */}
            {activeTab === 'family' && (
              <div className="space-y-6">
                {/* Parents Section - Only show if member has parent information */}
                {(getFather() || getMother()) && (
                  <div className="bg-card rounded-xl border border-border p-6">
                    <h3 className="font-bold text-lg mb-4 text-primary">{t('profile.parents')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Father */}
                       <div 
                         className="flex items-center space-x-3 space-x-reverse p-3 rounded-lg bg-muted/50 border border-border/30 shadow-sm cursor-pointer hover:bg-muted/70 transition-colors duration-200 hover:border-border/50"
                         onClick={() => getFather() && onMemberClick?.(getFather())}
                       >
                         <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                           ♂
                         </div>
                         <div>
                           <p className="text-sm text-muted-foreground">{t('profile.father')}</p>
                           <p className="font-semibold text-foreground">
                             {getFather()?.first_name || t('common.not_specified')}
                           </p>
                         </div>
                       </div>
                      
                      {/* Mother */}
                       <div 
                         className="flex items-center space-x-3 space-x-reverse p-3 rounded-lg bg-muted/50 border border-border/30 shadow-sm cursor-pointer hover:bg-muted/70 transition-colors duration-200 hover:border-border/50"
                         onClick={() => getMother() && onMemberClick?.(getMother())}
                       >
                         <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center text-white font-semibold">
                           ♀
                         </div>
                         <div>
                           <p className="text-sm text-muted-foreground">{t('profile.mother')}</p>
                           <p className="font-semibold text-foreground">
                             {getMother() ? `${getMother()?.first_name} ${getMother()?.last_name || ''}`.trim() : t('common.not_specified')}
                           </p>
                         </div>
                       </div>
                    </div>
                  </div>
                )}

                {/* Spouses and Children Section */}
                {(() => {
                  const spouses = getSpouses();
                  
                  if (spouses.length === 0) {
                    return (
                      <div className="bg-card rounded-xl border border-border p-6">
                        <h3 className="font-bold text-lg mb-4 text-primary">{t('profile.marital_status')}</h3>
                        <div className="text-center p-8">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                            <Heart className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <p className="text-muted-foreground text-lg">{t('profile.not_married')}</p>
                          <p className="text-sm text-muted-foreground mt-2">{t('profile.no_marriage_records')}</p>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="bg-card rounded-xl border border-border p-6">
                      <h3 className="font-bold text-lg mb-4 text-primary">{t('profile.spouses_and_children')}</h3>
                      <div className="space-y-6">
                        {spouses.map((spouse, index) => {
                          const childrenWithSpouse = getChildrenBySpouse(spouse.id);
                           const maritalStatusText = spouse.marital_status === 'divorced' 
                             ? (spouse.gender === 'male' ? t('profile.divorced_male') : t('profile.divorced_female')) 
                             : (spouse.gender === 'male' ? t('profile.married_male') : t('profile.married_female'));
                          
                          return (
                            <div key={spouse.id || index} className="bg-muted/50 border border-border/30 shadow-sm rounded-lg p-4">
                              {/* Spouse Info */}
                              <div className="flex items-center space-x-3 space-x-reverse mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                  {spouse.gender === 'female' ? '♀' : '♂'}
                                </div>
                                 <div className="flex-1 ps-3">
                                  <h4 className="font-semibold text-foreground text-lg">
                                    {spouse.first_name} {spouse.last_name}
                                  </h4>
                                  {(() => {
                                    // Only show lineage if spouse is from the same family (has father_id in current family)
                                    const spouseHasFamilyFather = (spouse.father_id || spouse.fatherId) && 
                                      familyMembers?.find(m => m.id === (spouse.father_id || spouse.fatherId));
                                    
                                    if (spouseHasFamilyFather) {
                                      const spouseLineages = getLineageDisplayForMember(spouse);
                                      return spouseLineages.length > 0 ? (
                                        <p className="text-sm text-muted-foreground mt-0.5">
                                          {spouseLineages[0]}
                                        </p>
                                      ) : null;
                                    }
                                    return null;
                                  })()}
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  spouse.marital_status === 'divorced' 
                                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                }`}>
                                  {maritalStatusText}
                                </div>
                              </div>
                              
                              {/* Children */}
                              {childrenWithSpouse.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-border/50">
                                  <h5 className="font-medium text-foreground mb-3 flex items-center gap-4">
                                    <span>
                                      الذكور ({childrenWithSpouse.filter(c => c.gender === 'male').length})
                                    </span>
                                    <span>
                                      الإناث ({childrenWithSpouse.filter(c => c.gender === 'female').length})
                                    </span>
                                  </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                     {(() => {
                                       // Group children by twin_group_id
                                       const twinGroups = new Map<string, typeof childrenWithSpouse>();
                                       const nonTwins: typeof childrenWithSpouse = [];
                                       
                                       childrenWithSpouse.forEach((child) => {
                                         if (child.is_twin && child.twin_group_id) {
                                           if (!twinGroups.has(child.twin_group_id)) {
                                             twinGroups.set(child.twin_group_id, []);
                                           }
                                           twinGroups.get(child.twin_group_id)!.push(child);
                                         } else {
                                           nonTwins.push(child);
                                         }
                                       });

                                       return (
                                         <>
                                            {/* Render twin groups */}
                                            {Array.from(twinGroups.entries()).map(([groupId, twins]) => (
                                              <div key={`twin-group-${groupId}`} className="col-span-full">
                                                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                                                  <div className="flex items-center gap-1 mb-3 text-xs text-muted-foreground">
                                                    <Users className="h-3 w-3" />
                                                    <span>توأم ({twins.length})</span>
                                                  </div>
                                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {twins.map((child) => (
                                                   <div 
                                                     key={child.id} 
                                                     className="flex items-center space-x-2 space-x-reverse p-2 rounded-md bg-background/80 cursor-pointer hover:bg-background transition-colors duration-200 border border-transparent hover:border-border/30"
                                                     onClick={() => onMemberClick?.(child)}
                                                   >
                                                     <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${
                                                       child.gender === 'female' 
                                                         ? 'bg-gradient-to-br from-pink-400 to-pink-500' 
                                                         : 'bg-gradient-to-br from-blue-400 to-blue-500'
                                                     }`}>
                                                       {child.gender === 'female' ? '♀' : '♂'}
                                                     </div>
                                                     <div className="flex-1 min-w-0 ps-3">
                                                       <p className="font-medium text-sm text-foreground truncate">
                                                         {child.first_name}
                                                       </p>
                                                       {child.birth_date && (
                                                         <p className="text-xs text-muted-foreground">
                                                           {new Date().getFullYear() - new Date(child.birth_date).getFullYear()} {t('profile.years')}
                                                         </p>
                                                       )}
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                                </div>
                                              </div>
                                            ))}

                                           {/* Render non-twin children */}
                                           {nonTwins.map((child) => (
                                             <div 
                                               key={child.id} 
                                               className="flex items-center space-x-2 space-x-reverse p-2 rounded-md bg-background/50 cursor-pointer hover:bg-background/80 transition-colors duration-200 border border-transparent hover:border-border/30"
                                               onClick={() => onMemberClick?.(child)}
                                             >
                                               <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${
                                                 child.gender === 'female' 
                                                   ? 'bg-gradient-to-br from-pink-400 to-pink-500' 
                                                   : 'bg-gradient-to-br from-blue-400 to-blue-500'
                                               }`}>
                                                 {child.gender === 'female' ? '♀' : '♂'}
                                               </div>
                                               <div className="flex-1 min-w-0 ps-3">
                                                 <p className="font-medium text-sm text-foreground truncate">
                                                   {child.first_name}
                                                 </p>
                                                 {child.birth_date && (
                                                   <p className="text-xs text-muted-foreground">
                                                     {new Date().getFullYear() - new Date(child.birth_date).getFullYear()} {t('profile.years')}
                                                   </p>
                                                 )}
                                               </div>
                                             </div>
                                           ))}
                                         </>
                                       );
                                     })()}
                                     
                                     {!readOnly && onAddChild && (
                                       <div 
                                         className="flex items-center space-x-2 space-x-reverse p-2 rounded-md bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors duration-200 border border-dashed border-primary/30 hover:border-primary/50"
                                         onClick={() => onAddChild(member)}
                                       >
                                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/30 text-primary">
                                            <Users className="h-4 w-4" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm text-primary">
                                              {t('family_builder.add_child')}
                                            </p>
                                          </div>
                                       </div>
                                     )}
                                  </div>
                                </div>
                              )}
                              
                              {childrenWithSpouse.length === 0 && (
                                <div className="mt-4 pt-4 border-t border-border/50">
                                  <div className="text-center mb-3">
                                    <p className="text-sm text-muted-foreground">{t('profile.no_children_registered')}</p>
                                  </div>
                                  {!readOnly && onAddChild && (
                                    <div 
                                      className="flex items-center space-x-2 space-x-reverse p-2 rounded-md bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors duration-200 border border-dashed border-primary/30 hover:border-primary/50"
                                      onClick={() => onAddChild(member)}
                                    >
                                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/30 text-primary">
                                        <Users className="h-4 w-4" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-primary">
                                          {t('family_builder.add_child')}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Children without specific spouse */}
                {(() => {
                  const childrenWithoutSpouse = getChildrenBySpouse();
                  if (childrenWithoutSpouse.length > 0) {
                    return (
                      <div className="bg-card rounded-xl border border-border p-6">
                        <h3 className="font-bold text-lg mb-4 text-primary">{t('profile.other_children')}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {childrenWithoutSpouse.map((child) => (
                            <div key={child.id} className="flex items-center space-x-3 space-x-reverse p-3 rounded-lg bg-accent/30">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                                child.gender === 'female' 
                                  ? 'bg-gradient-to-br from-pink-500 to-pink-600' 
                                  : 'bg-gradient-to-br from-blue-500 to-blue-600'
                              }`}>
                                {child.gender === 'female' ? '♀' : '♂'}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-foreground">{child.first_name}</p>
                                {child.birth_date && (
                                  <p className="text-sm text-muted-foreground">
                                    {new Date().getFullYear() - new Date(child.birth_date).getFullYear()} {t('profile.years')}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Grandchildren Section */}
                {(() => {
                  const grandchildren = getGrandchildren();
                  if (grandchildren.length > 0) {
                    return (
                      <div className="bg-card rounded-xl border border-border p-6">
                        <h3 className="font-bold text-lg mb-4 text-primary">{t('profile.grandchildren')}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                           {grandchildren.map((grandchild) => (
                             <div 
                               key={grandchild.id} 
                               className="flex items-center space-x-3 space-x-reverse p-3 rounded-lg bg-muted/50 border border-border/30 shadow-sm cursor-pointer hover:bg-muted/70 transition-colors duration-200 hover:border-border/50"
                               onClick={() => onMemberClick?.(grandchild)}
                             >
                               <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                                 grandchild.gender === 'female' 
                                   ? 'bg-gradient-to-br from-pink-500 to-pink-600' 
                                   : 'bg-gradient-to-br from-blue-500 to-blue-600'
                               }`}>
                                 {grandchild.gender === 'female' ? '♀' : '♂'}
                               </div>
                                <div className="flex-1 ps-3">
                                 <p className="font-semibold text-foreground">{grandchild.first_name}</p>
                                  {grandchild.birth_date && (
                                    <p className="text-sm text-muted-foreground">
                                      {new Date().getFullYear() - new Date(grandchild.birth_date).getFullYear()} {t('profile.years')}
                                    </p>
                                  )}
                               </div>
                             </div>
                           ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div className="space-y-6">
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{t('profile.important_events')}</h3>
                      <p className="text-sm text-muted-foreground">{t('profile.timeline_description')}</p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    {/* Timeline Line */}
                    <div className="absolute right-6 top-0 bottom-0 w-0.5 bg-border"></div>
                    
                    <div className="space-y-6">
                      {generateTimelineEvents().map((event, index) => {
                        const IconComponent = getEventIcon(event.icon);
                        return (
                          <div key={index} className="relative flex items-start gap-6">
                            {/* Timeline Dot */}
                            <div className={`relative z-10 w-12 h-12 rounded-full ${event.bgColor} flex items-center justify-center border-4 border-background shadow-sm`}>
                              <IconComponent className={`w-5 h-5 ${event.color}`} />
                            </div>
                            
                            {/* Event Content */}
                            <div className="flex-1 pb-6">
                              <div className={`bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow`}>
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                     <h4 className="font-semibold text-foreground mb-1">
                                      {event.title}
                                    </h4>
                                     {event.date && event.type !== 'marriage' && (event.type !== 'divorce' || event.date) && (
                                       <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                         <Calendar className="w-4 h-4" />
                                         <DateDisplay date={event.date} className="inline" />
                                       </div>
                                     )}
                                     {event.description && event.type !== 'marriage' && event.type !== 'divorce' && (
                                       <p className="text-sm text-muted-foreground mt-2">
                                         {event.description}
                                       </p>
                                     )}
                                  </div>
                                  
                                  {/* Event Type Badge */}
                                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${event.bgColor} ${event.color}`}>
                                    {event.type === 'birth' && t('profile.event_birth')}
                                    {event.type === 'marriage' && t('profile.event_marriage')}
                                    {event.type === 'divorce' && t('profile.event_divorce')}
                                    {event.type === 'child' && t('profile.event_childbirth')}
                                    {event.type === 'death' && t('profile.event_death')}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {generateTimelineEvents().length === 0 && (
                        <div className="text-center py-12">
                          <Clock className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                          <p className="text-muted-foreground">{t('profile.no_events')}</p>
                          <p className="text-sm text-muted-foreground/70 mt-1">
                            {t('profile.events_will_appear')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Media Tab */}
            {activeTab === 'media' && (
              <div className="space-y-6">
                <MemberMemories 
                  memberId={member.id}
                  memberName={member.name}
                  readOnly={readOnly}
                />
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">

            {/* Family Stats */}
            <div className="bg-card rounded-xl border border-border p-4">
              <h4 className="font-bold text-sm mb-4">{t('profile.family_stats')}</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('profile.children')}</span>
                  <span className="font-semibold">{children.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('profile.spouses')}</span>
                  <span className="font-semibold">{spouses.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('profile.grandchildren')}</span>
                  <span className="font-semibold">{grandchildren.length}</span>
                </div>
                 <div className="flex justify-between">
                   <span className="text-sm text-muted-foreground">{t('profile.generation')}</span>
                   <span className="font-semibold">
                     {getGenerationName(memberGeneration)}
                   </span>
                 </div>
              </div>
            </div>

            {/* Delete Action */}
            {!readOnly && onDelete && (
              <div className="bg-card rounded-xl border border-destructive/20 p-4">
                <h4 className="font-bold text-sm mb-4 text-destructive">{t('profile.danger_zone')}</h4>
                <Button 
                  onClick={() => {
                    if (isSpouse && onSpouseDeleteWarning) {
                      onSpouseDeleteWarning();
                    } else {
                      onDelete();
                    }
                  }}
                  variant="destructive" 
                  className="w-full"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  {t('profile.delete_member')}
                </Button>
                <p className="text-xs text-destructive/70 mt-2 text-center">
                  {t('profile.cannot_undo')}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Back Button */}
        {onBack && (
          <div className="flex justify-center mt-8 pt-6 border-t border-border">
            <Button
              onClick={onBack}
              variant="ghost"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl px-6 py-3 transition-all duration-300 group"
            >
              <ArrowRight className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="font-medium">{t('common.back')}</span>
            </Button>
          </div>
        )}
      </div>

      {/* Image Upload Modal */}
      <ImageUploadModal
        isOpen={showImageUploadModal}
        onClose={() => setShowImageUploadModal(false)}
        onSave={handleImageSave}
        title={t('profile.update_profile_picture')}
      />
      
      <SuggestEditDialog
        isOpen={showSuggestDialog}
        onClose={() => setShowSuggestDialog(false)}
        familyId={member.family_id}
        memberId={member.id}
        memberName={member.name}
      />
    </div>
  );
};