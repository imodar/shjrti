/**
 * Shared utility functions for member display across all themes
 * Extracted from MemberCard.tsx for reusability
 */

import { Member, Marriage } from '@/types/family.types';
import { differenceInYears, parseISO } from 'date-fns';

// ==================== Helper Types ====================

export interface ParentageInfo {
  genderTerm: string;
  lineage: string;
}

export interface SpouseDisplayInfo {
  label: string;
  info: string;
}

export interface BirthDeathDisplayInfo {
  type: 'alive' | 'deceased' | 'birth_only' | 'death_only' | 'both';
  birthText?: string;
  deathText?: string;
  age?: number;
  birthYear?: number;
  deathYear?: number;
  birthDate?: string;
  deathDate?: string;
}

// ==================== Core Functions ====================

/**
 * Get founder's last_name for ending lineage chains
 */
export const getFounderLastName = (familyMembers: Member[]): string => {
  const founder = familyMembers?.find(m => m?.is_founder || (m as any)?.isFounder);
  if (founder?.last_name) return founder.last_name;
  // Fallback: try to get last_name from any member
  const memberWithLastName = familyMembers?.find(m => m?.last_name);
  return memberWithLastName?.last_name || '';
};

/**
 * Check if a member is from the family (has parent in tree or is founder)
 */
export const isMemberFromFamily = (member: Member | undefined, familyMembers: Member[]): boolean => {
  if (!member) return false;
  if (member.is_founder || (member as any).isFounder) return true;
  const fatherId = member.father_id || (member as any).fatherId;
  const motherId = member.mother_id || (member as any).motherId;
  return !!(
    (fatherId && familyMembers?.find(fm => fm?.id === fatherId)) ||
    (motherId && familyMembers?.find(fm => fm?.id === motherId))
  );
};

/**
 * Build lineage chain - max 3 generations, follows family line (father or mother)
 * @param startMember The member to start building lineage from
 * @param familyMembers All family members for lookups
 * @param useBintForFemaleChild If true, use "بنت" instead of "ابنة" (needed for spouse lineage display)
 */
export const buildLineageChain = (
  startMember: Member,
  familyMembers: Member[],
  useBintForFemaleChild: boolean = false
): string => {
  const MAX_GENERATIONS = 3; // عدد الأسماء الأقصى (الشخص + أبوه/أمه + جده/جدته)
  const parts: string[] = [];
  let current: Member | undefined = startMember;
  let previousMember: Member | undefined = undefined;
  
  while (current && parts.length < MAX_GENERATIONS) {
    const name = current.first_name || (current as any).name?.split(' ')[0] || (current as any).name;
    if (name) {
      if (parts.length === 0) {
        parts.push(name);
      } else {
        const femaleTerm = useBintForFemaleChild ? 'بنت' : 'ابنة';
        const childGenderTerm = previousMember?.gender === 'female' ? femaleTerm : 'ابن';
        parts.push(`${childGenderTerm} ${name}`);
      }
    }
    
    // توقف عند المؤسس
    if (current.is_founder || (current as any).isFounder) {
      break;
    }
    
    previousMember = current;
    
    // ابحث عن الوالد الموجود في العائلة (الأب أولاً، ثم الأم)
    const fatherId = current.father_id || (current as any).fatherId;
    const motherId = current.mother_id || (current as any).motherId;
    const father = fatherId ? familyMembers?.find(m => m?.id === fatherId) : undefined;
    const mother = motherId ? familyMembers?.find(m => m?.id === motherId) : undefined;
    
    // إذا الأب من العائلة، اتبعه
    if (father && isMemberFromFamily(father, familyMembers)) {
      current = father;
    } 
    // إذا الأم من العائلة والأب ليس كذلك، اتبع الأم
    else if (mother && isMemberFromFamily(mother, familyMembers)) {
      current = mother;
    }
    // إذا الأب موجود (حتى لو من خارج العائلة)، اتبعه
    else if (father) {
      current = father;
    }
    else {
      break;
    }
  }
  
  return parts.join(' ');
};

/**
 * Get parentage info (son/daughter of + lineage chain)
 * Returns null if member is founder or has no family parent
 */
export const getParentageInfo = (
  member: Member,
  familyMembers: Member[]
): ParentageInfo | null => {
  if (member.is_founder || (member as any).isFounder) return null;
  
  const mother = familyMembers?.find(m => m?.id === (member.mother_id || (member as any).motherId));
  const father = familyMembers?.find(m => m?.id === (member.father_id || (member as any).fatherId));
  
  // Check if father is from the family (has father_id in family tree OR is founder)
  const fatherIsFromFamily = father && (
    (father.is_founder || (father as any).isFounder) ||
    ((father.father_id || (father as any).fatherId) && 
     familyMembers?.find(m => m?.id === (father.father_id || (father as any).fatherId)))
  );
  
  // Check if mother is from the family (has father_id in family tree OR is founder)
  const motherIsFromFamily = mother && (
    (mother.is_founder || (mother as any).isFounder) ||
    ((mother.father_id || (mother as any).fatherId) && 
     familyMembers?.find(m => m?.id === (mother.father_id || (mother as any).fatherId)))
  );
  
  const genderTerm = member.gender === 'female' ? 'ابنة' : 'ابن';
  
  // PRIORITY LOGIC:
  // 1. If father is from family → show father's lineage
  // 2. If mother is from family AND father is NOT from family → show mother's lineage
  // 3. If father exists but not from family, and mother not from family → show father's name only
  
  if (fatherIsFromFamily && father) {
    const lineage = buildLineageChain(father, familyMembers);
    return { genderTerm, lineage };
  }
  
  // Mother is from family AND father is NOT from family - show maternal lineage
  if (motherIsFromFamily && mother) {
    const lineage = buildLineageChain(mother, familyMembers);
    return { genderTerm, lineage };
  }
  
  // Father exists but not from family - just show father's name
  if (father) {
    const fatherName = father.first_name || (father as any).name?.split(' ')[0] || (father as any).name;
    return { genderTerm, lineage: fatherName };
  }
  
  return null;
};

/**
 * Get spouse display info for members who married into the family
 * Returns null for founders or family descendants
 */
export const getSpouseDisplayInfo = (
  member: Member,
  familyMembers: Member[],
  marriages: Marriage[]
): SpouseDisplayInfo | null => {
  // Founders have special handling
  const isFounder = member.is_founder || (member as any).isFounder;
  if (isFounder) {
    return { label: '', info: 'الجد الأكبر' };
  }

  // إذا كان العضو من داخل العائلة (له أب)، لا تعرض معلومات الزوج
  const memberHasFamilyFather = ((member as any).father_id || (member as any).fatherId) &&
    familyMembers?.find(m => m?.id === ((member as any).father_id || (member as any).fatherId));
  
  if (memberHasFamilyFather) {
    return null; // لا تعرض شيء للأعضاء من داخل العائلة
  }

  // فقط للأزواج من خارج العائلة: ابحث عن الزوج واعرض معلوماته
  const marriage = marriages?.find(m => m.husband_id === member.id || m.wife_id === member.id);
  if (!marriage) return null;

  const spouseId = marriage.husband_id === member.id ? marriage.wife_id : marriage.husband_id;
  const spouse = familyMembers?.find(m => m?.id === spouseId);
  if (!spouse) return null;

  // عرض معلومات الزوج بالتفصيل: اسم الزوج + أبوهم + اسم العائلة
  const spouseName = (spouse as any).first_name || (spouse as any).name?.split(' ')[0] || (spouse as any).name || '';
  
  // Get spouse's parent and build short lineage with founder's last_name
  const spouseFatherId = (spouse as any).father_id || (spouse as any).fatherId;
  const spouseFather = spouseFatherId ? familyMembers?.find(m => m?.id === spouseFatherId) : null;
  
  let spouseInfo = spouseName;
  
  if (spouseFather) {
    // استخدام buildLineageChain للحصول على سلسلة النسب كاملة (حتى 3 أجيال)
    // ونستخدم "بنت" بدل "ابنة" حسب المتطلب
    const spouseLineage = buildLineageChain(spouse, familyMembers, true);
    const founderLastName = getFounderLastName(familyMembers);
    spouseInfo = `${spouseLineage} ${founderLastName}`;
  }

  const relationLabel = (member as any).gender === 'male' ? 'زوج' : 'زوجة';
  return { label: relationLabel, info: spouseInfo };
};

/**
 * Get birth/death display info with age calculation
 */
export const getBirthDeathDisplayInfo = (
  member: Member,
  translations: { born_male: string; born_female: string; died_male: string; died_female: string; in_text: string; years: string }
): BirthDeathDisplayInfo | null => {
  const birthDate = member.birth_date || (member as any).birthDate;
  const deathDate = member.death_date || (member as any).deathDate;
  const isAlive = member.is_alive !== false && (member as any).isAlive !== false;
  const gender = member.gender || (member as any).gender;
  
  const birthText = gender === 'female' ? translations.born_female : translations.born_male;
  const deathText = gender === 'female' ? translations.died_female : translations.died_male;
  
  // حالة 1: لا يوجد تاريخ ولادة ولا وفاة
  if (!birthDate && !deathDate) return null;
  
  // حالة 2: يوجد تاريخ وفاة فقط (بدون تاريخ ولادة)
  if (!birthDate && deathDate) {
    return {
      type: 'death_only',
      deathText,
      deathDate
    };
  }
  
  // حالة 3: يوجد تاريخ ولادة + العضو متوفي + لا يوجد تاريخ وفاة
  if (birthDate && !isAlive && !deathDate) {
    return {
      type: 'birth_only',
      birthText,
      birthDate
    };
  }
  
  // حالة 4: يوجد تاريخ ولادة + العضو على قيد الحياة
  if (birthDate && isAlive) {
    const age = differenceInYears(new Date(), parseISO(birthDate));
    return {
      type: 'alive',
      birthText,
      birthDate,
      age
    };
  }
  
  // حالة 5: يوجد تاريخ ولادة + تاريخ وفاة
  if (birthDate && deathDate) {
    const age = differenceInYears(parseISO(deathDate), parseISO(birthDate));
    const birthYear = parseISO(birthDate).getFullYear();
    const deathYear = parseISO(deathDate).getFullYear();
    return {
      type: 'both',
      birthText,
      deathText,
      birthDate,
      deathDate,
      age,
      birthYear,
      deathYear
    };
  }
  
  return null;
};

/**
 * Generate member display name based on family relationship
 */
export const generateMemberDisplayName = (
  member: Member,
  familyMembers: Member[],
  marriages: Marriage[],
  isNameHidden: boolean = false
): string | null => {
  // If name is hidden due to privacy settings
  if (isNameHidden) {
    // For family_only mode: show lineage without first name
    const memberHasFamilyFather = (member.father_id || (member as any).fatherId) && 
      familyMembers?.find(m => m?.id === (member.father_id || (member as any).fatherId));
    if (memberHasFamilyFather) {
      // Return parentage-only display
      return null; // Will be handled by renderParentage with lock icon
    }
    return null; // Fully hidden
  }
  
  // Check if this member is married into the family (actual spouse from outside)
  const marriage = marriages?.find(m => m.husband_id === member.id || m.wife_id === member.id);
  const memberHasFamilyFather = (member.father_id || (member as any).fatherId) && 
    familyMembers?.find(m => m?.id === (member.father_id || (member as any).fatherId));

  // Show full name for spouses who married into the family (not blood family members)
  const isSpouseFromOutside = marriage && !memberHasFamilyFather && !member.is_founder;
  if (isSpouseFromOutside) {
    // For spouses from outside: show full name (first_name + last_name or complete name)
    if (member.first_name && member.last_name) {
      return `${member.first_name} ${member.last_name}`;
    }
    // If full name is available in the name field, use it
    return (member as any).name || member.first_name || "غير معروف";
  } else {
    // For all family members: show first name + family name for descendants
    const firstName = member.first_name || (member as any).name?.split(' ')[0] || (member as any).name || "غير معروف";
    const isDescendant = !member.is_founder && memberHasFamilyFather;
    
    if (isDescendant) {
      // Show first name with family name (if available)
      const familyName = member.last_name || getFounderLastName(familyMembers);
      return familyName ? `${firstName} ${familyName}` : firstName;
    }
    return firstName;
  }
};

/**
 * Check if member is a descendant (not founder, has family parent)
 */
export const isDescendant = (member: Member, familyMembers: Member[]): boolean => {
  if (member.is_founder || (member as any).isFounder) return false;
  
  const memberHasFamilyFather = (member.father_id || (member as any).fatherId) && 
    familyMembers?.find(m => m?.id === (member.father_id || (member as any).fatherId));
  
  return !!memberHasFamilyFather;
};
