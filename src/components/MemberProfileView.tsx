import React, { useState, useEffect } from 'react';
import { DateDisplay, LifespanDisplay } from '@/components/DateDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MemberMemories } from '@/components/MemberMemories';
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
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
  familyMembers: any[];
  marriages?: any[];
  isSpouse?: boolean;
  onSpouseEditWarning?: () => void;
  onSpouseDeleteWarning?: () => void;
  onMemberClick?: (member: any) => void;
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
  onMemberClick
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAllInfo, setShowAllInfo] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  if (!member) return null;

  const getGenderColor = (gender: string) => {
    return gender === 'male' ? 'bg-blue-500' : 'bg-pink-500';
  };

  // Generate timeline events
  const generateTimelineEvents = () => {
    const events = [];
    const genderText = member.gender === 'male' ? { birth: 'ولد', marry: 'تزوج', death: 'توفي', divorce: 'انفصل' } : { birth: 'ولدت', marry: 'تزوجت', death: 'توفيت', divorce: 'انفصلت' };

    // Birth event
    if (member.birthDate || member.birth_date) {
      const birthDate = member.birthDate || member.birth_date;
      events.push({
        type: 'birth',
        date: birthDate,
        title: `${genderText.birth} ${member.first_name || member.name}`,
        description: birthDate ? null : 'في تاريخ غير محدد',
        icon: 'Gift',
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      });
    } else {
      events.push({
        type: 'birth',
        date: null,
        title: `${genderText.birth} ${member.first_name || member.name}`,
        description: 'في تاريخ غير محدد',
        icon: 'Gift',
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      });
    }

    // Marriage events
    const spouses = getSpouses();
    spouses.forEach((spouse, index) => {
      const marriageDate = spouse.marriage_date || spouse.created_at;
      events.push({
        type: 'marriage',
        date: marriageDate,
        title: `${genderText.marry} من ${spouse.first_name || spouse.name} ${spouse.last_name || ''}`.trim(),
        description: marriageDate ? null : 'في تاريخ غير محدد',
        icon: 'Heart',
        color: 'text-pink-600',
        bgColor: 'bg-pink-50'
      });

      // Divorce event if divorced
      if (spouse.marital_status === 'divorced') {
        events.push({
          type: 'divorce',
          date: null, // We don't have divorce date
          title: `${genderText.divorce} عن ${spouse.first_name || spouse.name}`,
          description: 'في تاريخ غير محدد',
          icon: 'X',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50'
        });
      }

      // Children with this spouse
      const childrenWithSpouse = getChildrenBySpouse(spouse.id);
      childrenWithSpouse.forEach(child => {
        const childBirthDate = child.birthDate || child.birth_date;
        events.push({
          type: 'child',
          date: childBirthDate,
          title: `ولد لهم ${child.first_name || child.name}`,
          description: childBirthDate ? null : 'في تاريخ غير محدد',
          icon: 'Users',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50'
        });
      });
    });

    // Children without specific spouse
    const childrenWithoutSpouse = getChildrenBySpouse();
    childrenWithoutSpouse.forEach(child => {
      const childBirthDate = child.birthDate || child.birth_date;
      events.push({
        type: 'child',
        date: childBirthDate,
        title: `ولد له ${child.first_name || child.name}`,
        description: childBirthDate ? null : 'في تاريخ غير محدد',
        icon: 'Users',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      });
    });

    // Death event
    if (member.deathDate || member.death_date) {
      const deathDate = member.deathDate || member.death_date;
      events.push({
        type: 'death',
        date: deathDate,
        title: `${genderText.death}`,
        description: deathDate ? null : 'في تاريخ غير محدد',
        icon: 'Clock',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50'
      });
    }

    // Sort events by date (nulls last)
    return events.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
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
      return 'مطلق';
    }
    const spouses = getSpouses();
    const children = getChildren();
    
    if (children.length > 0) {
      return 'متزوج';
    }
    
    if (member.relatedPersonId && spouses.length === 0) {
      const relatedPerson = familyMembers.find(m => m.id === member.relatedPersonId);
      if (relatedPerson) {
        return 'متزوج';
      }
    }
    
    return spouses.length > 0 ? 'متزوج' : 'أعزب';
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

    if (member.relatedPersonId) {
      const relatedPerson = familyMembers.find(m => m.id === member.relatedPersonId);
      if (relatedPerson) {
        return [relatedPerson];
      }
    }

    return familyMembers.filter(m => member.spouseId === m.id || m.spouseId === member.id);
  };

  const getChildren = () => {
    return familyMembers.filter(m => m.fatherId === member.id || m.motherId === member.id);
  };

  const getGrandchildren = () => {
    const children = getChildren();
    let grandchildren = [];
    
    children.forEach(child => {
      const childGrandchildren = familyMembers.filter(m => m.fatherId === child.id || m.motherId === child.id);
      grandchildren.push(...childGrandchildren);
    });
    
    return grandchildren;
  };
  
  const getChildrenBySpouse = (spouseId?: string) => {
    const children = getChildren();
    if (!spouseId) return children.filter(child => (!child.motherId && !child.fatherId) || (child.fatherId === member.id && !child.motherId) || (child.motherId === member.id && !child.fatherId));
    
    if (member.gender === 'male') {
      return children.filter(child => child.motherId === spouseId && child.fatherId === member.id);
    } else {
      return children.filter(child => child.fatherId === spouseId && child.motherId === member.id);
    }
  };
  
  const getFather = () => {
    return familyMembers.find(m => m.id === member.father_id);
  };
  
  const getMother = () => {
    return familyMembers.find(m => m.id === member.mother_id);
  };

  // Get lineage display according to the updated rules
  const getLineageDisplay = () => {
    // 1. Founder: No lineage
    if (member.is_founder) return [];
    
    const lineages = [];
    const genderTerm = member.gender === 'female' ? 'ابنة' : 'ابن';
    
    // 2. Members with father_id (original family members) - HIGHEST PRIORITY
    if (member.father_id) {
      const father = familyMembers?.find(f => f.id === member.father_id);
      if (father) {
        const fatherFirstName = father.first_name || father.name.split(' ')[0];
        
        // Check if father is founder (children of founder)
        if (father.is_founder) {
          lineages.push(`${genderTerm} ${fatherFirstName}`);
        } else {
          // Later generations: include grandfather
          const grandfather = familyMembers?.find(f => f.id === father.father_id);
          if (grandfather) {
            const grandfatherFirstName = grandfather.first_name || grandfather.name.split(' ')[0];
            lineages.push(`${genderTerm} ${fatherFirstName} ابن ${grandfatherFirstName}`);
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
        return children?.some(child => child.id === member.id);
      });
      
      if (parentRelation) {
        const parentFirstName = parentRelation.first_name || parentRelation.name.split(' ')[0];
        
        // If this parent is founder
        if (parentRelation.is_founder) {
          lineages.push(`${genderTerm} ${parentFirstName}`);
        } else {
          // Get grandparent
          const grandParent = familyMembers?.find(f => f.id === parentRelation.father_id);
          if (grandParent) {
            const grandParentFirstName = grandParent.first_name || grandParent.name.split(' ')[0];
            lineages.push(`${genderTerm} ${parentFirstName} ابن ${grandParentFirstName}`);
          } else {
            lineages.push(`${genderTerm} ${parentFirstName}`);
          }
        }
      }
      
      // 4. Maternal grandchildren (members with mother_id but no father_id)
      else if (member.mother_id) {
        const mother = familyMembers?.find(m => m.id === member.mother_id);
        if (mother && mother.father_id) {
          const motherFirstName = mother.first_name || mother.name.split(' ')[0];
          const maternalGrandfather = familyMembers?.find(f => f.id === mother.father_id);
          if (maternalGrandfather) {
            const maternalGrandfatherFirstName = maternalGrandfather.first_name || maternalGrandfather.name.split(' ')[0];
            lineages.push(`${genderTerm} ${motherFirstName} بنت ${maternalGrandfatherFirstName}`);
          }
        }
      }
      
      // 5. Spouses from outside family (LOWEST PRIORITY - only if not a child)
      else {
        const marriage = marriages?.find(m => 
          m.husband_id === member.id || m.wife_id === member.id
        );
        
        if (marriage) {
          const spouseId = member.id === marriage.husband_id ? marriage.wife_id : marriage.husband_id;
          const spouse = familyMembers?.find(s => s.id === spouseId);
          
          if (spouse) {
            const spouseFirstName = spouse.first_name || spouse.name.split(' ')[0];
            
            // Get spouse's lineage - simplified to show only direct father
            let spouseLineage = '';
            const spouseFatherId = spouse.father_id || spouse.fatherId;
            if (spouseFatherId) {
              const spouseFather = familyMembers?.find(f => f.id === spouseFatherId);
              if (spouseFather) {
                const spouseFatherFirstName = spouseFather.first_name || spouseFather.name.split(' ')[0];
                spouseLineage = ` ابن ${spouseFatherFirstName}`;
              }
            }
            
            // Build the marriage lineage
            if (member.gender === 'male') {
              lineages.push(`زوج ${spouseFirstName}${spouseLineage}`);
            } else {
              lineages.push(`زوجة ${spouseFirstName}${spouseLineage}`);
            }
          }
        }
      }
    }
    
    return lineages;
  };

  const getGenerationName = (generationNumber: number): string => {
    const generationNames = {
      1: 'الأول',
      2: 'الثاني', 
      3: 'الثالث',
      4: 'الرابع',
      5: 'الخامس',
      6: 'السادس',
      7: 'السابع',
      8: 'الثامن',
      9: 'التاسع',
      10: 'العاشر'
    };
    
    return generationNames[generationNumber] || `الجيل ${generationNumber}`;
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
    { id: 'overview', label: 'نظرة عامة', icon: User },
    { id: 'family', label: 'العائلة', icon: Users },
    { id: 'timeline', label: 'الأحداث', icon: Clock },
    { id: 'media', label: 'الصور', icon: Camera }
  ];

  const getAge = () => {
    if (!member.birthDate) return null;
    const birth = new Date(member.birthDate);
    const death = member.deathDate ? new Date(member.deathDate) : new Date();
    const age = death.getFullYear() - birth.getFullYear();
    return age;
  };

  return (
    <div className={`min-h-[50vh] sm:min-h-screen transition-all duration-700 overflow-x-hidden ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      {/* Header */}
      {/* Header removed */}

      {/* Main Content */}
      <div className="container mx-auto px-2 sm:px-4 pb-3 sm:pb-6 max-w-6xl">
        {/* Hero Section */}
        <div className="relative mb-4 sm:mb-8">
          {/* Close Button */}
          <button
            onClick={onBack}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
          
          
          {/* Profile Info Card */}
          <div className="relative">
            <div className="relative bg-card/95 backdrop-blur-xl rounded-xl sm:rounded-2xl overflow-hidden p-4 sm:p-6 md:p-8 border border-border shadow-xl">
              {/* Black ribbon for deceased members */}
              {(member.deathDate || member.death_date || !member.isAlive) && (
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
                        <p>متوفى</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 sm:gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 lg:gap-6 flex-1 min-w-0">
                  {/* Profile Avatar - Now first in DOM */}
                  <div className="relative mx-auto sm:mx-0 flex-shrink-0">
                    {/* Show gradient background only when there's no profile picture */}
                    {!member.image_url && !member.image && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur-lg opacity-30 scale-110"></div>
                    )}
                    <Avatar className="relative h-32 w-32 sm:h-36 sm:w-36 lg:h-40 lg:w-40 border-4 border-white shadow-2xl flex-shrink-0">
                      {(member.image_url || member.image) ? (
                        <AvatarImage 
                          src={member.image_url || member.image} 
                          alt={member.name} 
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <AvatarFallback className={`text-5xl font-bold text-white ${getGenderColor(member.gender)}`}>
                          {member.name.charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </div>

                  {/* Basic Info - Name and Stats after picture */}
                  <div className="space-y-3 text-center sm:text-right flex-[2]">
                    <div>
                      {/* Member Name */}
                      <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2 w-full max-w-none">
                        {member.name}
                      </h1>
                      
                      {/* Lineage Display */}
                      {(() => {
                        const lineages = getLineageDisplay();
                        return lineages.length > 0 ? lineages.map((lineage, index) => (
                          <p key={index} className="text-lg text-muted-foreground mb-1">
                            {lineage}
                          </p>
                        )) : null;
                      })()}
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
                          <div className="text-sm text-muted-foreground">سنة</div>
                        </div>
                      )}
                      {spouses && spouses.length > 0 && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{spouses.length}</div>
                          <div className="text-sm text-muted-foreground">الأزواج</div>
                        </div>
                      )}
                      {children && children.length > 0 && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{children.length}</div>
                          <div className="text-sm text-muted-foreground">الأطفال</div>
                        </div>
                      )}
                      {grandchildren && grandchildren.length > 0 && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{grandchildren.length}</div>
                          <div className="text-sm text-muted-foreground">الأحفاد</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6 lg:mt-0">
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
                    تعديل المعلومات
                  </Button>
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
                        <h3 className="font-bold text-lg">المعلومات الشخصية</h3>
                        <p className="text-sm text-muted-foreground">البيانات الأساسية</p>
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
                          <div className="text-sm text-blue-700">تاريخ الميلاد</div>
                          <div className="font-semibold">
                            {member.birthDate ? <DateDisplay date={member.birthDate} className="inline" /> : 'غير محدد'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                        <MapPin className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="text-sm text-green-700">مكان الميلاد</div>
                          <div className="font-semibold">{member.birthPlace || 'غير محدد'}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
                        <Heart className="h-5 w-5 text-purple-600" />
                        <div>
                          <div className="text-sm text-purple-700">الحالة الاجتماعية</div>
                          <div className="font-semibold">{getMaritalStatus()}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl">
                        <Award className="h-5 w-5 text-orange-600" />
                        <div>
                          <div className="text-sm text-orange-700">النوع</div>
                          <div className="font-semibold">{member.gender === 'male' ? 'ذكر' : 'أنثى'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Death Date - if applicable */}
                    {member.deathDate && (
                      <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
                        <Calendar className="h-5 w-5 text-red-600" />
                        <div>
                          <div className="text-sm text-red-700">تاريخ الوفاة</div>
                          <div className="font-semibold">
                            <DateDisplay date={member.deathDate} className="inline" />
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
                              <div className="text-sm text-gray-700">رقم الهاتف</div>
                              <div className="font-semibold">{member.phone || 'غير محدد'}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                            <Mail className="h-5 w-5 text-gray-600" />
                            <div>
                              <div className="text-sm text-gray-700">البريد الإلكتروني</div>
                              <div className="font-semibold">{member.email || 'غير محدد'}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                            <Briefcase className="h-5 w-5 text-gray-600" />
                            <div>
                              <div className="text-sm text-gray-700">المهنة</div>
                              <div className="font-semibold">{member.occupation || 'غير محدد'}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                            <GraduationCap className="h-5 w-5 text-gray-600" />
                            <div>
                              <div className="text-sm text-gray-700">التعليم</div>
                              <div className="font-semibold">{member.education || 'غير محدد'}</div>
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
                    <h3 className="font-bold text-lg mb-4 text-primary">الوالدان</h3>
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
                           <p className="text-sm text-muted-foreground">الأب</p>
                           <p className="font-semibold text-foreground">
                             {getFather()?.first_name || 'غير محدد'}
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
                           <p className="text-sm text-muted-foreground">الأم</p>
                           <p className="font-semibold text-foreground">
                             {getMother() ? `${getMother()?.first_name} ${getMother()?.last_name || ''}`.trim() : 'غير محدد'}
                           </p>
                         </div>
                       </div>
                    </div>
                  </div>
                )}

                {/* Spouses and Children Section - Only show if there are spouses */}
                {(() => {
                  const spouses = getSpouses();
                  if (spouses.length === 0) {
                    return null;
                  }
                  
                  return (
                    <div className="bg-card rounded-xl border border-border p-6">
                      <h3 className="font-bold text-lg mb-4 text-primary">الزوجات والأبناء</h3>
                      <div className="space-y-6">
                        {spouses.map((spouse, index) => {
                          const childrenWithSpouse = getChildrenBySpouse(spouse.id);
                           const maritalStatusText = spouse.marital_status === 'divorced' 
                             ? (spouse.gender === 'male' ? 'مطلق' : 'مطلقة') 
                             : (spouse.gender === 'male' ? 'متزوج' : 'متزوجة');
                          
                          return (
                            <div key={spouse.id || index} className="bg-muted/50 border border-border/30 shadow-sm rounded-lg p-4">
                              {/* Spouse Info */}
                              <div className="flex items-center space-x-3 space-x-reverse mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                  {spouse.gender === 'female' ? '♀' : '♂'}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-foreground text-lg">
                                    {spouse.first_name} {spouse.last_name}
                                  </h4>
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
                                  <h5 className="font-medium text-foreground mb-3 flex items-center">
                                    <span className="mr-2">👶</span>
                                    الأبناء ({childrenWithSpouse.length})
                                  </h5>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                     {childrenWithSpouse.map((child) => (
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
                                         <div className="flex-1 min-w-0">
                                           <p className="font-medium text-sm text-foreground truncate">
                                             {child.first_name}
                                           </p>
                                           {child.birth_date && (
                                             <p className="text-xs text-muted-foreground">
                                               {new Date().getFullYear() - new Date(child.birth_date).getFullYear()} سنة
                                             </p>
                                           )}
                                         </div>
                                       </div>
                                     ))}
                                  </div>
                                </div>
                              )}
                              
                              {childrenWithSpouse.length === 0 && (
                                <div className="mt-4 pt-4 border-t border-border/50 text-center">
                                  <p className="text-sm text-muted-foreground">لا يوجد أطفال مسجلون</p>
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
                        <h3 className="font-bold text-lg mb-4 text-primary">أبناء آخرون</h3>
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
                                    {new Date().getFullYear() - new Date(child.birth_date).getFullYear()} سنة
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
                        <h3 className="font-bold text-lg mb-4 text-primary">الأحفاد</h3>
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
                               <div className="flex-1">
                                 <p className="font-semibold text-foreground">{grandchild.first_name}</p>
                                 {grandchild.birth_date && (
                                   <p className="text-sm text-muted-foreground">
                                     {new Date().getFullYear() - new Date(grandchild.birth_date).getFullYear()} سنة
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
                      <h3 className="font-bold text-lg">الأحداث المهمة</h3>
                      <p className="text-sm text-muted-foreground">تسلسل زمني لأهم أحداث الحياة</p>
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
                                     {event.type !== 'marriage' && (
                                       <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                         <Calendar className="w-4 h-4" />
                                         {event.date ? (
                                           <DateDisplay date={event.date} className="inline" />
                                         ) : (
                                           <span>تاريخ غير محدد</span>
                                         )}
                                       </div>
                                     )}
                                     {event.description && event.type !== 'marriage' && (
                                       <p className="text-sm text-muted-foreground mt-2">
                                         {event.description}
                                       </p>
                                     )}
                                  </div>
                                  
                                  {/* Event Type Badge */}
                                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${event.bgColor} ${event.color}`}>
                                    {event.type === 'birth' && 'ميلاد'}
                                    {event.type === 'marriage' && 'زواج'}
                                    {event.type === 'divorce' && 'انفصال'}
                                    {event.type === 'child' && 'إنجاب'}
                                    {event.type === 'death' && 'وفاة'}
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
                          <p className="text-muted-foreground">لا توجد أحداث مسجلة</p>
                          <p className="text-sm text-muted-foreground/70 mt-1">
                            سيتم عرض الأحداث المهمة عند توفر البيانات
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
                />
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">

            {/* Family Stats */}
            <div className="bg-card rounded-xl border border-border p-4">
              <h4 className="font-bold text-sm mb-4">إحصائيات العائلة</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">الأطفال</span>
                  <span className="font-semibold">{children.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">الأزواج</span>
                  <span className="font-semibold">{spouses.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">الأحفاد</span>
                  <span className="font-semibold">{grandchildren.length}</span>
                </div>
                 <div className="flex justify-between">
                   <span className="text-sm text-muted-foreground">الجيل</span>
                   <span className="font-semibold">
                     {getGenerationName(memberGeneration)}
                   </span>
                 </div>
              </div>
            </div>

            {/* Delete Action */}
            <div className="bg-card rounded-xl border border-destructive/20 p-4">
              <h4 className="font-bold text-sm mb-4 text-destructive">منطقة الخطر</h4>
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
                حذف العضو
              </Button>
              <p className="text-xs text-destructive/70 mt-2 text-center">
                هذا الإجراء لا يمكن التراجع عنه
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};