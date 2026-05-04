 import React from 'react';
 import { cn } from '@/lib/utils';
import { Member, Marriage } from '@/types/family.types';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { useResolvedImageUrl } from '@/utils/useResolvedImageUrl';
import { isMemberFromFamily, getFounderLastName, getPaternalLineageLastName } from '@/lib/memberDisplayUtils';
import { MemberHoverCard } from './MemberHoverCard';

// Helper to check if member is a descendant of the founder through paternal line (recursive check)
// In patrilineal systems, descent is traced through the father
const isDescendantOfFounder = (
  member: Member | undefined, 
  familyMembers: Member[], 
  visited: Set<string> = new Set()
): boolean => {
  if (!member) return false;
  if (member.is_founder || (member as any).isFounder) return true;
  if (visited.has(member.id)) return false;
  visited.add(member.id);
  
  const fatherId = member.father_id || (member as any).fatherId;
  
  const father = fatherId ? familyMembers.find(m => m.id === fatherId) : undefined;
  
  // Only check paternal line - if father is a descendant of the founder, then this member is too
  return isDescendantOfFounder(father, familyMembers, visited);
};
 
// Helper to check if parent has multiple spouses (polygamy case)
const hasParentMultipleSpouses = (member: Member, familyMembers: Member[]): boolean => {
  if (!member.father_id) return false;
  
  // Find all siblings with the same father
  const fatherSiblings = familyMembers.filter(m => 
    m.father_id === member.father_id && m.father_id !== null
  );
  
  // Check if there are different mothers among siblings (father has multiple wives)
  const uniqueMotherIds = new Set(fatherSiblings.map(m => m.mother_id).filter(Boolean));
  
  return uniqueMotherIds.size > 1;
};

 interface FamilyUnit {
   id: string;
   type: 'married' | 'single' | 'polygamy';
   husband?: Member;
   wives: Member[];
   children: Member[];
   isFounder: boolean;
   generation: number;
 }
 
 interface StitchFamilyCardProps {
   unit: FamilyUnit;
   familyMembers: Member[];
   marriages?: Marriage[];
   onMemberClick?: (member: Member) => void;
 }
 
// Helper to get display name - shows full name for non-descendants (external spouses or their children)
const getMemberDisplayName = (member: Member, familyMembers: Member[]): string => {
  const isFromFamily = isDescendantOfFounder(member, familyMembers);
  const firstName = member.first_name || member.name?.split(' ')[0] || member.name || '';

  // If not a descendant of the founder (external spouse, etc.), show their own last_name
  if (!isFromFamily && member.last_name) {
    return `${firstName} ${member.last_name}`;
  }

  // Descendant: derive surname from direct father's last_name (paternal line)
  const paternalLast = getPaternalLineageLastName(member, familyMembers);
  return paternalLast ? `${firstName} ${paternalLast}` : firstName;
};

 // Member Avatar Component
 const MemberAvatar: React.FC<{
   member: Member;
   size?: 'sm' | 'md' | 'lg';
   className?: string;
 }> = ({ member, size = 'md', className }) => {
   const imageUrl = useResolvedImageUrl(member.image_url);
   const isMale = member.gender === 'male';
   
   const sizeClasses = {
     sm: 'w-10 h-10 text-sm',
     md: 'w-14 h-14 text-lg',
     lg: 'w-16 h-16 text-xl'
   };
 
   const colorClasses = isMale 
     ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-700' 
     : 'bg-pink-50 border-pink-200 text-pink-600 dark:bg-pink-900/30 dark:border-pink-700';
 
   return (
     <div className={cn(
       'rounded-full flex items-center justify-center font-bold border-2 overflow-hidden',
       sizeClasses[size],
       colorClasses,
       className
     )}>
       {imageUrl ? (
         <img 
           src={imageUrl} 
           alt={member.first_name || member.name} 
           className="w-full h-full object-cover"
         />
       ) : (
         <span className="material-icons-round">person</span>
       )}
     </div>
   );
 };
 
 // Role Badge Component
 const RoleBadge: React.FC<{
  role: 'husband' | 'wife' | 'spouse' | 'ex-spouse' | 'ex-wife' | 'single' | 'primary';
   className?: string;
 }> = ({ role, className }) => {
   const { t } = useLanguage();
   
   const styles = {
     husband: 'bg-blue-50 text-blue-500 dark:bg-blue-900/50 dark:text-blue-300',
     wife: 'bg-pink-50 text-pink-500 dark:bg-pink-900/50 dark:text-pink-300',
     spouse: 'text-pink-400 border border-pink-100 dark:border-pink-700',
     'ex-spouse': 'text-slate-400 border border-slate-100 dark:border-slate-600',
    'ex-wife': 'text-slate-400 border border-slate-100 dark:border-slate-600',
     single: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300',
     primary: 'bg-blue-600 text-white'
   };
 
    const labels = {
      husband: t('husband', 'Husband'),
      wife: t('wife', 'Wife'),
      spouse: t('wife', 'Wife'),
      'ex-spouse': t('profile.divorced_female', 'Ex-Spouse'),
      'ex-wife': t('profile.divorced_female', 'Ex-Wife'),
      single: t('tree_view.single', 'Single'),
      primary: t('tree_view.primary_member', 'Primary Member')
    };
 
   return (
     <span className={cn(
       'text-[9px] font-bold px-2 py-0.5 rounded-full uppercase',
       styles[role],
       className
     )}>
       {labels[role]}
     </span>
   );
 };
 
 export const StitchFamilyCard: React.FC<StitchFamilyCardProps> = ({
   unit,
   familyMembers,
   marriages = [],
   onMemberClick
 }) => {
   const { t } = useLanguage();
 
   // Get display name for family card label
   const getUnitLabel = () => {
     if (unit.type === 'single') {
       const member = unit.husband || unit.wives[0];
       return `${member?.first_name || member?.name || t('common.unknown', 'Unknown')}`;
     }
     if (unit.type === 'polygamy') {
       return `${t('tree_view.family_of', 'Family of')} ${unit.husband?.first_name || unit.husband?.name} (${t('tree_view.multiple_spouses', 'Multiple Spouses')})`;
     }
    // If husband is the unknown placeholder, label using the wife's name
    const isUnknownHusbandLabel = unit.husband?.first_name === 'unknown_father';
    const labelMember = isUnknownHusbandLabel ? unit.wives[0] : unit.husband;
    return `${t('tree_view.family_of', 'Family of')} ${labelMember?.first_name || labelMember?.name || ''}`;
   };
 
   // Render Single Member Card
   if (unit.type === 'single') {
     const member = unit.husband || unit.wives[0];
     if (!member) return null;
 
     // Find mother info if available
     const mother = member.mother_id 
       ? familyMembers.find(m => m.id === member.mother_id) 
       : null;
 
      // Only show mother badge if parent has multiple spouses (polygamy)
      const showMotherBadge = mother && hasParentMultipleSpouses(member, familyMembers);

     return (
       <div className="family-card w-[420px] p-5 bg-white dark:bg-slate-800 border border-primary/20 dark:border-primary/30 rounded-[24px] shadow-sm relative">
         <div className="flex flex-col items-center gap-4">
            <MemberHoverCard member={member} familyMembers={familyMembers} marriages={marriages}>
              <div className="cursor-pointer"><MemberAvatar member={member} size="md" /></div>
            </MemberHoverCard>
           <div className="text-center">
              <h4 className="font-bold text-sm">{getMemberDisplayName(member, familyMembers)}</h4>
              {showMotherBadge && (
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                 <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                   <span className="material-icons-round text-[12px]">face_3</span>
                   {t('tree_view.mother', 'Mother')}: {mother.first_name || mother.name}
                 </span>
                </div>
              )}
           </div>
         </div>
       </div>
     );
   }
 
   // Render Married Couple Card
    if (unit.type === 'married') {
      const wife = unit.wives[0];
      const isUnknownWife = wife?.first_name === 'unknown_mother';
      const isUnknownHusband = unit.husband?.first_name === 'unknown_father';

       // Check if husband or wife's parent has multiple spouses
       const husbandMother = unit.husband?.mother_id 
         ? familyMembers.find(m => m.id === unit.husband?.mother_id) 
         : null;
       const wifeMother = wife?.mother_id 
         ? familyMembers.find(m => m.id === wife?.mother_id) 
         : null;
       
       const showHusbandMotherBadge = unit.husband && husbandMother && hasParentMultipleSpouses(unit.husband, familyMembers);
       const showWifeMotherBadge = !isUnknownWife && wife && wifeMother && hasParentMultipleSpouses(wife, familyMembers);

      return (
        <div className="family-card w-[420px] p-6 pt-10 bg-white dark:bg-slate-800 border border-primary/20 dark:border-primary/30 rounded-[24px] shadow-sm relative">
          {/* Label */}
          <div className="family-label absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap z-10">
            <span className="material-icons-round text-sm">groups</span>
            {getUnitLabel()}
          </div>

          {/* Founder Badge */}
          {unit.isFounder && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md">
              <span className="material-icons-round text-sm">workspace_premium</span>
              {t('tree_view.founder', 'Founder')}
            </div>
          )}

          <div className="flex items-center justify-center gap-8">
            {/* Husband */}
            {unit.husband && !isUnknownHusband && (
              <div className="flex flex-col items-center gap-2">
                <MemberHoverCard member={unit.husband} familyMembers={familyMembers} marriages={marriages}>
                  <div className="cursor-pointer"><MemberAvatar member={unit.husband} size="md" /></div>
                </MemberHoverCard>
                <div className="text-center">
                   <p className="font-bold text-sm">{getMemberDisplayName(unit.husband, familyMembers)}</p>
                   {showHusbandMotherBadge && husbandMother && (
                     <span className="mt-1 bg-primary/10 text-primary text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                       <span className="material-icons-round text-[10px]">face_3</span>
                       {t('tree_view.mother', 'Mother')}: {husbandMother.first_name || husbandMother.name}
                     </span>
                   )}
                </div>
              </div>
            )}

            {/* Heart Icon & Wife - hidden when unknown_mother */}
            {!isUnknownWife && !isUnknownHusband && (
              <>
                <div className="flex items-center justify-center">
                  {wife?.marital_status === 'divorced' ? (
                    <span className="material-icons-round text-slate-400">heart_broken</span>
                  ) : (
                    <span className="material-icons-round text-red-400 animate-pulse">favorite</span>
                  )}
                </div>

                {wife && (
                  <div className="flex flex-col items-center gap-2">
                    <MemberHoverCard member={wife} familyMembers={familyMembers} marriages={marriages}>
                      <div className="cursor-pointer"><MemberAvatar member={wife} size="md" /></div>
                    </MemberHoverCard>
                    <div className="text-center">
                       <p className="font-bold text-sm">{getMemberDisplayName(wife, familyMembers) || t('tree_view.unknown_wife', 'Unknown Wife')}</p>
                       {showWifeMotherBadge && wifeMother && (
                         <span className="mt-1 bg-primary/10 text-primary text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                           <span className="material-icons-round text-[10px]">face_3</span>
                           {t('tree_view.mother', 'Mother')}: {wifeMother.first_name || wifeMother.name}
                         </span>
                       )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Husband unknown: show wife alone */}
            {isUnknownHusband && !isUnknownWife && wife && (
              <div className="flex flex-col items-center gap-2">
                <MemberHoverCard member={wife} familyMembers={familyMembers} marriages={marriages}>
                  <div className="cursor-pointer"><MemberAvatar member={wife} size="md" /></div>
                </MemberHoverCard>
                <div className="text-center">
                  <p className="font-bold text-sm">{getMemberDisplayName(wife, familyMembers)}</p>
                  {showWifeMotherBadge && wifeMother && (
                    <span className="mt-1 bg-primary/10 text-primary text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                      <span className="material-icons-round text-[10px]">face_3</span>
                      {t('tree_view.mother', 'Mother')}: {wifeMother.first_name || wifeMother.name}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
 
   // Render Polygamy Card (Multiple Spouses)
   if (unit.type === 'polygamy') {
     return (
       <div className="family-card w-[520px] p-5 pt-10 bg-white dark:bg-slate-800 border border-primary/20 dark:border-primary/30 rounded-[24px] shadow-sm relative">
         {/* Label */}
         <div className="family-label absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap z-10">
           <span className="material-icons-round text-sm">groups</span>
           {getUnitLabel()}
         </div>
 
         <div className="flex flex-col items-center gap-8">
           {/* Primary Member (Husband) */}
           {unit.husband && (
             <div className="flex flex-col items-center gap-2">
               <MemberHoverCard member={unit.husband} familyMembers={familyMembers} marriages={marriages}>
                 <div className="cursor-pointer"><MemberAvatar member={unit.husband} size="md" className="shadow-sm" /></div>
               </MemberHoverCard>
                <p className="font-bold text-sm">{getMemberDisplayName(unit.husband, familyMembers)}</p>
             </div>
           )}
 
           {/* Wives Row */}
           <div className="flex items-start justify-center gap-10 flex-wrap">
             {unit.wives.map((wife, index) => (
               <div key={wife.id} className="flex flex-col items-center gap-2">
                 <MemberHoverCard member={wife} familyMembers={familyMembers} marriages={marriages}>
                   <div className="cursor-pointer"><MemberAvatar member={wife} size="md" /></div>
                 </MemberHoverCard>
                  <p className="font-bold text-[11px]">{getMemberDisplayName(wife, familyMembers)}</p>
                  <RoleBadge role={wife.marital_status === 'divorced' ? 'ex-wife' : 'wife'} />
               </div>
             ))}
           </div>
         </div>
       </div>
     );
   }
 
   return null;
 };