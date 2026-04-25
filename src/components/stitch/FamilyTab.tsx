import React, { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useResolvedImageUrl } from '@/utils/useResolvedImageUrl';
import { cn } from '@/lib/utils';
import { getParentageInfo } from '@/lib/memberDisplayUtils';

interface FamilyTabProps {
  member: any;
  spouses: any[];
  children: any[];
  grandchildren: any[];
  father: any;
  mother: any;
  familyMembers: any[];
  marriages: any[];
  onMemberClick?: (member: any) => void;
  onAddChild?: (parentMember: any, spouseId?: string) => void;
  readOnly?: boolean;
}

export const StitchFamilyTab: React.FC<FamilyTabProps> = ({
  member,
  spouses,
  children,
  grandchildren,
  father,
  mother,
  familyMembers,
  marriages,
  onMemberClick,
  onAddChild,
  readOnly = false,
}) => {
  const { t } = useLanguage();

  // Group children by spouse
  const spouseGroups = useMemo(() => {
    return spouses.map((spouse: any) => {
      const spouseChildren = children.filter(child => {
        if (member?.gender === 'male') {
          return child.mother_id === spouse.id;
        } else {
          return child.father_id === spouse.id;
        }
      });
      const sons = spouseChildren.filter(c => c.gender === 'male');
      const daughters = spouseChildren.filter(c => c.gender === 'female');
      return { spouse, children: spouseChildren, sons, daughters };
    });
  }, [spouses, children, member?.gender]);

  // Children without a matched spouse
  const unassignedChildren = useMemo(() => {
    const assignedIds = new Set(spouseGroups.flatMap(g => g.children.map((c: any) => c.id)));
    return children.filter(c => !assignedIds.has(c.id));
  }, [children, spouseGroups]);

  // Group grandchildren by their parent (child of the current member)
  const grandchildGroups = useMemo(() => {
    const groups: { parent: any; spouse: any; grandkids: any[] }[] = [];
    children.forEach(child => {
      const gcs = familyMembers.filter(m =>
        m.father_id === child.id || m.mother_id === child.id
      );
      if (gcs.length > 0) {
        // Find the child's spouse
        const childMarriage = marriages.find(
          m => m.husband_id === child.id || m.wife_id === child.id
        );
        let childSpouse = null;
        if (childMarriage) {
          const spouseId = childMarriage.husband_id === child.id ? childMarriage.wife_id : childMarriage.husband_id;
          childSpouse = familyMembers.find(m => m.id === spouseId);
        }
        groups.push({ parent: child, spouse: childSpouse, grandkids: gcs });
      }
    });
    return groups;
  }, [children, familyMembers, marriages]);

  const totalGrandSons = grandchildren.filter(gc => gc.gender === 'male').length;
  const totalGrandDaughters = grandchildren.filter(gc => gc.gender === 'female').length;

  // Group twins
  const groupChildrenWithTwins = (childList: any[]) => {
    const twinGroups = new Map<string, any[]>();
    const singles: any[] = [];
    childList.forEach(child => {
      if (child.is_twin && child.twin_group_id) {
        const existing = twinGroups.get(child.twin_group_id) || [];
        existing.push(child);
        twinGroups.set(child.twin_group_id, existing);
      } else {
        singles.push(child);
      }
    });
    const result: Array<{ type: 'twin'; children: any[] } | { type: 'single'; child: any }> = [];
    // Interleave twins and singles by order
    const allItems = childList.map(child => {
      if (child.is_twin && child.twin_group_id) {
        const group = twinGroups.get(child.twin_group_id);
        if (group && group[0].id === child.id) {
          return { type: 'twin' as const, children: group };
        }
        return null; // skip subsequent twins in group
      }
      return { type: 'single' as const, child };
    }).filter(Boolean);
    return allItems as Array<{ type: 'twin'; children: any[] } | { type: 'single'; child: any }>;
  };

  const getSpouseLabel = (spouse: any) => {
    if (spouse.marital_status === 'divorced') {
      return member?.gender === 'male'
        ? t('profile.divorced_female', 'زوجة سابقة')
        : t('profile.divorced_male', 'زوج سابق');
    }
    return member?.gender === 'male'
      ? t('profile.wife', 'زوجة')
      : t('profile.husband', 'زوج');
  };

  const getSpouseSubtitle = (spouse: any) => {
    const parentageInfo = getParentageInfo(spouse, familyMembers);
    if (parentageInfo) {
      return `${parentageInfo.genderTerm} ${parentageInfo.lineage}`;
    }
    if (spouse.last_name) return spouse.last_name;
    return null;
  };

  return (
    <div className="space-y-6">
        {/* Parents */}
        {(father || mother) && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white mb-3 sm:mb-4">
              {t('profile.parents', 'Parents')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {father && (
                <button
                  onClick={() => onMemberClick?.(father)}
                  className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 transition-colors group text-start"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 shadow-sm flex-shrink-0">
                    <span className="material-symbols-outlined text-lg sm:text-xl">male</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">{t('profile.father', 'Father')}</p>
                    <p className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-200 truncate">
                      {father.first_name ? `${father.first_name} ${father.last_name || ''}` : father.name}
                    </p>
                  </div>
                </button>
              )}
              {mother && mother.first_name !== 'unknown_mother' && (
                <button
                  onClick={() => onMemberClick?.(mother)}
                  className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-pink-200 transition-colors text-start"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-500 shadow-sm flex-shrink-0">
                    <span className="material-symbols-outlined text-lg sm:text-xl">female</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">{t('profile.mother', 'Mother')}</p>
                    <p className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-200 truncate">
                      {mother.first_name ? `${mother.first_name} ${mother.last_name || ''}` : mother.name}
                    </p>
                  </div>
                </button>
              )}
              {(!mother || mother.first_name === 'unknown_mother') && father && (
                <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-slate-100 dark:bg-slate-700/40 text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-300 dark:border-slate-600">
                    <span className="material-symbols-outlined text-lg sm:text-xl">person_off</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">{t('profile.mother', 'Mother')}</p>
                    <p className="text-sm sm:text-base font-bold text-slate-400 dark:text-slate-500 italic truncate">
                      {t('profile.mother_unknown_title', 'Mother Not Registered')}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                      {t('profile.unknown_wife_hint', 'Information can be added later')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Spouses & Children */}
        {(spouseGroups.length > 0 || unassignedChildren.length > 0) && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white mb-4 sm:mb-6">
              {t('profile.spouses_and_children', 'Spouses & Children')}
            </h3>
            <div className="space-y-4">
              {spouseGroups.map(({ spouse, children: spouseChildren, sons, daughters }) => (
                <div key={spouse.id} className="p-3 sm:p-4 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800">
                  {/* Spouse header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-800">
                    {spouse.first_name === 'unknown_mother' ? (
                      /* Unknown wife — special placeholder design */
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ring-2 sm:ring-4 flex-shrink-0 bg-slate-100 dark:bg-slate-700/40 text-slate-400 dark:text-slate-500 ring-slate-100/50 dark:ring-slate-700/30 border-2 border-dashed border-slate-300 dark:border-slate-600">
                          <span className="material-symbols-outlined text-xl sm:text-2xl">person_off</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <h4 className="font-bold text-sm sm:text-base text-slate-400 dark:text-slate-500 italic">
                              {t('profile.unknown_wife')}
                            </h4>
                          </div>
                          <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            {t('profile.unknown_wife_hint')}
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* Known spouse — normal display */
                      <button
                        onClick={() => onMemberClick?.(spouse)}
                        className="flex items-center gap-3 sm:gap-4 text-start hover:opacity-80 transition-opacity"
                      >
                        <div className={cn(
                          'w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ring-2 sm:ring-4 flex-shrink-0',
                          spouse.gender === 'female'
                            ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-500 ring-pink-50/50'
                            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-500 ring-blue-50/50'
                        )}>
                          <SpouseAvatar spouse={spouse} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <h4 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white truncate">
                              {spouse.first_name ? `${spouse.first_name} ${spouse.last_name || ''}` : spouse.name}
                            </h4>
                            <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-primary/10 text-primary text-[10px] sm:text-xs font-bold rounded-md">
                              {getSpouseLabel(spouse)}
                            </span>
                          </div>
                          {getSpouseSubtitle(spouse) && (
                            <p className="text-xs sm:text-sm text-slate-500 truncate">{getSpouseSubtitle(spouse)}</p>
                          )}
                        </div>
                      </button>
                    )}
                    <div className="flex gap-1.5 sm:gap-2">
                      <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full text-[10px] sm:text-xs font-bold border border-blue-100 dark:border-blue-800 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs sm:text-sm">male</span> {sons.length} {t('son', 'Sons')}
                      </span>
                      <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-pink-50 dark:bg-pink-900/20 text-pink-500 rounded-full text-[10px] sm:text-xs font-bold border border-pink-100 dark:border-pink-800 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs sm:text-sm">female</span> {daughters.length} {t('daughter', 'Daughters')}
                      </span>
                    </div>
                  </div>

                  {/* Children grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {groupChildrenWithTwins(spouseChildren).map((item, idx) => {
                      if (item.type === 'twin') {
                        return (
                          <div key={`twin-${idx}`} className="col-span-2 grid grid-cols-2 gap-3 p-3 bg-amber-50/30 dark:bg-amber-900/10 border-2 border-amber-200/50 dark:border-amber-700/30 rounded-xl relative">
                            <span className="absolute -top-2 left-3 px-2 bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-200 text-[9px] font-black uppercase rounded shadow-sm">
                              {t('profile.twins', 'Twins')}
                            </span>
                            {item.children.map(twin => (
                              <ChildChip key={twin.id} child={twin} onClick={() => onMemberClick?.(twin)} />
                            ))}
                          </div>
                        );
                      }
                      return <ChildChip key={item.child.id} child={item.child} onClick={() => onMemberClick?.(item.child)} />;
                    })}
                    {!readOnly && (
                      <button
                        onClick={() => onAddChild?.(member, spouse.id)}
                        className="flex items-center justify-center gap-2 px-4 py-3.5 bg-violet-50 dark:bg-violet-900/10 border border-dashed border-violet-200 dark:border-violet-700 rounded-xl text-violet-500 hover:text-violet-700 hover:border-violet-400 hover:bg-violet-100/50 transition-colors text-sm font-medium"
                      >
                        <span className="material-symbols-outlined text-lg">person_add</span>
                        {t('profile.add_child', 'إضافة ابن/ابنة')}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Unassigned children (no matching spouse) */}
              {unassignedChildren.length > 0 && (
                <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">
                      {t('profile.other_children', 'Other Children')}
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {unassignedChildren.map(child => (
                      <ChildChip key={child.id} child={child} onClick={() => onMemberClick?.(child)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Grandchildren */}
        {grandchildGroups.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-4 sm:mb-6">
              <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">
                {t('profile.grandchildren', 'Grandchildren')}
              </h3>
              <div className="flex gap-1.5 sm:gap-2">
                <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full text-[10px] sm:text-xs font-bold border border-blue-100 dark:border-blue-800 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs sm:text-sm">male</span> {totalGrandSons} {t('profile.grandson', 'حفيد')}
                </span>
                <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-pink-50 dark:bg-pink-900/20 text-pink-500 rounded-full text-[10px] sm:text-xs font-bold border border-pink-100 dark:border-pink-800 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs sm:text-sm">female</span> {totalGrandDaughters} {t('profile.granddaughter', 'حفيدة')}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              {grandchildGroups.map(({ parent, spouse, grandkids }) => (
                <div key={parent.id} className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 dark:bg-slate-800/50 px-3 sm:px-4 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0 border-b border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => onMemberClick?.(parent)}
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-slate-400 text-base sm:text-lg">person</span>
                      <p className="text-sm sm:text-base font-bold truncate">
                        {t('family_word', 'Family')} {parent.first_name || parent.name} {parent.last_name || ''}
                      </p>
                    </button>
                    {spouse && (
                      <button
                        onClick={() => onMemberClick?.(spouse)}
                        className="text-xs sm:text-sm text-slate-400 font-medium hover:text-primary transition-colors truncate"
                      >
                        {spouse.gender === 'male' ? t('profile.the_husband', 'الزوج') : t('profile.the_wife', 'الزوجة')}: {spouse.first_name || spouse.name} {spouse.last_name || ''}
                      </button>
                    )}
                  </div>
                  <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {grandkids.map(gc => (
                      <ChildChip key={gc.id} child={gc} onClick={() => onMemberClick?.(gc)} compact />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
};

// === Sub-components ===

const SpouseAvatar: React.FC<{ spouse: any }> = ({ spouse }) => {
  const imageUrl = useResolvedImageUrl(spouse?.image_url || null);
  if (imageUrl) {
    return <img src={imageUrl} alt={spouse.first_name || spouse.name} className="w-full h-full object-cover rounded-full" />;
  }
  return (
    <span className="material-symbols-outlined text-2xl">
      {spouse.gender === 'female' ? 'female' : 'male'}
    </span>
  );
};

const ChildChip: React.FC<{ child: any; onClick: () => void; compact?: boolean }> = ({ child, onClick, compact }) => (
  <button
    onClick={onClick}
    className={cn(
      'flex items-center justify-between px-3 sm:px-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm hover:border-primary/30 transition-colors text-start',
      compact ? 'py-2.5 sm:py-3.5' : 'py-3 sm:py-4'
    )}
  >
    <span className={cn('font-bold truncate', compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base')}>
      {child.first_name || child.name}
    </span>
    <span className={cn(
      'material-symbols-outlined text-lg sm:text-xl flex-shrink-0',
      child.gender === 'female' ? 'text-pink-400' : 'text-blue-400'
    )}>
      {child.gender === 'female' ? 'female' : 'male'}
    </span>
  </button>
);

const StatRow: React.FC<{ label: string; value: number | string }> = ({ label, value }) => (
  <div className="flex items-center justify-between text-xs">
    <span className="text-slate-500 font-medium">{label}</span>
    <span className="font-bold">{value}</span>
  </div>
);

export default StitchFamilyTab;
