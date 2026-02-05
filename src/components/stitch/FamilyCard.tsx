 import React from 'react';
 import { cn } from '@/lib/utils';
import { Member, Marriage } from '@/types/family.types';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { useResolvedImageUrl } from '@/utils/useResolvedImageUrl';
import { isMemberFromFamily } from '@/lib/memberDisplayUtils';
 
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
 
// Helper to get display name - shows full name for external spouses
const getMemberDisplayName = (member: Member, familyMembers: Member[]): string => {
  const isFromFamily = isMemberFromFamily(member, familyMembers);
  const firstName = member.first_name || member.name?.split(' ')[0] || member.name || '';
  
  // If not from the family (external spouse), show full name
  if (!isFromFamily && member.last_name) {
    return `${firstName} ${member.last_name}`;
  }
  
  return firstName;
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
   role: 'husband' | 'wife' | 'spouse' | 'ex-spouse' | 'single' | 'primary';
   className?: string;
 }> = ({ role, className }) => {
   const { t } = useLanguage();
   
   const styles = {
     husband: 'bg-blue-50 text-blue-500 dark:bg-blue-900/50 dark:text-blue-300',
     wife: 'bg-pink-50 text-pink-500 dark:bg-pink-900/50 dark:text-pink-300',
     spouse: 'text-pink-400 border border-pink-100 dark:border-pink-700',
     'ex-spouse': 'text-slate-400 border border-slate-100 dark:border-slate-600',
     single: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300',
     primary: 'bg-blue-600 text-white'
   };
 
   const labels = {
     husband: t('tree_view.husband', 'HUSBAND'),
     wife: t('tree_view.wife', 'WIFE'),
     spouse: t('tree_view.spouse', 'Spouse'),
     'ex-spouse': t('tree_view.ex_spouse', 'Ex-Spouse'),
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

  // Helper to check if a member has multiple spouses
  const hasMultipleSpouses = (memberId: string): boolean => {
    const memberMarriages = marriages.filter(
      m => m.husband_id === memberId || m.wife_id === memberId
    );
    return memberMarriages.length > 1;
  };

  // Helper to check if we need to show parent info for a child
  const shouldShowParentInfo = (member: Member): { show: boolean; parent?: Member } => {
    const fatherId = member.father_id;
    const motherId = member.mother_id;
    
    if (!fatherId && !motherId) return { show: false };
    
    const father = fatherId ? familyMembers.find(m => m.id === fatherId) : undefined;
    const mother = motherId ? familyMembers.find(m => m.id === motherId) : undefined;
    
    // Check if father has multiple wives
    const fatherHasMultipleWives = fatherId ? hasMultipleSpouses(fatherId) : false;
    // Check if mother has multiple husbands
    const motherHasMultipleHusbands = motherId ? hasMultipleSpouses(motherId) : false;
    
    // Only show parent info if there's polygamy
    if (fatherHasMultipleWives && mother) {
      return { show: true, parent: mother };
    }
    if (motherHasMultipleHusbands && father) {
      return { show: true, parent: father };
    }
    
    return { show: false };
  };
 
   // Get display name for family card label
   const getUnitLabel = () => {
    if (unit.type === 'single') return '';
     if (unit.type === 'polygamy') {
       return `${t('tree_view.family_of', 'Family of')} ${unit.husband?.first_name || unit.husband?.name} (${t('tree_view.multiple_spouses', 'Multiple Spouses')})`;
     }
     return `${t('tree_view.family_of', 'Family of')} ${unit.husband?.first_name || unit.husband?.name}`;
   };
 
  // Don't render single member cards - they should be shown as children of their parent unit
   if (unit.type === 'single') {
    return null;
   }
 
   // Render Married Couple Card
   if (unit.type === 'married') {
     const wife = unit.wives[0];
 
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
           {unit.husband && (
             <div className="flex flex-col items-center gap-2">
               <MemberAvatar member={unit.husband} size="md" />
               <div className="text-center">
                  <p className="font-bold text-sm">{getMemberDisplayName(unit.husband, familyMembers)}</p>
                 <RoleBadge role="husband" />
               </div>
             </div>
           )}
 
           {/* Heart Icon */}
           <div className="flex items-center justify-center">
             <span className="material-icons-round text-red-400 animate-pulse">favorite</span>
           </div>
 
           {/* Wife */}
           {wife && (
             <div className="flex flex-col items-center gap-2">
               <MemberAvatar member={wife} size="md" />
               <div className="text-center">
                  <p className="font-bold text-sm">{getMemberDisplayName(wife, familyMembers) || t('tree_view.unknown_wife', 'Unknown Wife')}</p>
                 <RoleBadge role="wife" />
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
       <div className="family-card w-[520px] p-5 pt-10 bg-slate-50/50 dark:bg-slate-800/50 border border-primary/20 dark:border-primary/30 rounded-[24px] shadow-sm relative">
         {/* Label */}
         <div className="family-label absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap z-10">
           <span className="material-icons-round text-sm">groups</span>
           {getUnitLabel()}
         </div>
 
         <div className="flex flex-col items-center gap-8">
           {/* Primary Member (Husband) */}
           {unit.husband && (
             <div className="flex flex-col items-center gap-2">
               <MemberAvatar member={unit.husband} size="md" className="shadow-sm" />
                <p className="font-bold text-sm">{getMemberDisplayName(unit.husband, familyMembers)}</p>
               <RoleBadge role="primary" />
             </div>
           )}
 
           {/* Wives Row */}
           <div className="flex items-start justify-center gap-10 flex-wrap">
             {unit.wives.map((wife, index) => (
               <div key={wife.id} className="flex flex-col items-center gap-2">
                 <MemberAvatar member={wife} size="md" />
                  <p className="font-bold text-[11px]">{getMemberDisplayName(wife, familyMembers)}</p>
                 <RoleBadge role={wife.is_alive !== false ? 'spouse' : 'ex-spouse'} />
               </div>
             ))}
           </div>
         </div>
       </div>
     );
   }
 
   return null;
 };