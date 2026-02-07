import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useResolvedImageUrl } from '@/utils/useResolvedImageUrl';
import { uploadMemberImage } from '@/utils/imageUpload';
import { membersApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ImageUploadModal } from '@/components/ImageUploadModal';
import { DateDisplay, LifespanDisplay } from '@/components/DateDisplay';
import { cn } from '@/lib/utils';
import { getParentageInfo } from '@/lib/memberDisplayUtils';
import { StitchFamilyTab } from './FamilyTab';

interface StitchMemberProfileProps {
  member: any;
  familyMembers: any[];
  marriages: any[];
  onEdit?: () => void;
  onDelete?: () => void;
  onBack?: () => void;
  onMemberClick?: (member: any) => void;
  onAddChild?: (parentMember: any, spouseId?: string) => void;
  readOnly?: boolean;
}

export const StitchMemberProfile: React.FC<StitchMemberProfileProps> = ({
  member,
  familyMembers,
  marriages,
  onEdit,
  onDelete,
  onBack,
  onMemberClick,
  onAddChild,
  readOnly = false,
}) => {
  const { t, direction } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const memberImageSrc = useResolvedImageUrl(member?.image_url || null);

  const isFounder = member?.is_founder || (member as any)?.isFounder;

  // === Data computations (same logic as MemberProfileView) ===
  const spouses = useMemo(() => {
    const memberMarriages = marriages.filter(m =>
      (member?.gender === 'male' && m.husband_id === member?.id) ||
      (member?.gender === 'female' && m.wife_id === member?.id)
    );
    if (memberMarriages.length > 0) {
      return memberMarriages.map(marriage => {
        const spouseId = member?.gender === 'male' ? marriage.wife_id : marriage.husband_id;
        const spouse = familyMembers.find(m => m.id === spouseId);
        return spouse ? { ...spouse, marital_status: marriage.marital_status || 'married' } : null;
      }).filter(Boolean);
    }
    if (member?.related_person_id) {
      const related = familyMembers.find(m => m.id === member.related_person_id);
      if (related) return [related];
    }
    return familyMembers.filter(m =>
      member?.spouse_id === m.id || m.spouse_id === member?.id
    );
  }, [marriages, familyMembers, member?.id, member?.gender, member?.related_person_id, member?.spouse_id]);

  const children = useMemo(() => {
    return familyMembers.filter(m =>
      m.father_id === member?.id || m.mother_id === member?.id
    );
  }, [familyMembers, member?.id]);

  const grandchildren = useMemo(() => {
    const result: any[] = [];
    children.forEach(child => {
      const gc = familyMembers.filter(m =>
        m.father_id === child.id || m.mother_id === child.id
      );
      result.push(...gc);
    });
    return result;
  }, [familyMembers, children]);

  const father = useMemo(() => familyMembers.find(m => m.id === member?.father_id), [familyMembers, member?.father_id]);
  const mother = useMemo(() => familyMembers.find(m => m.id === member?.mother_id), [familyMembers, member?.mother_id]);

  // === Image upload handler ===
  const handleImageSave = async (croppedImageBlob: Blob) => {
    setIsUploadingImage(true);
    try {
      const filePath = await uploadMemberImage(croppedImageBlob, member.id);
      if (!filePath) throw new Error('Upload failed');
      await membersApi.update(member.id, { image_url: filePath });
      member.image_url = filePath;
      toast({ title: t('profile.update_success', 'Success'), description: t('profile.image_update_success', 'Image updated') });
    } catch (error) {
      toast({ title: t('common.error', 'Error'), description: t('profile.image_update_failed', 'Failed to update image'), variant: 'destructive' });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const getDisplayName = () => {
    if (member.first_name && member.last_name) return `${member.first_name} ${member.last_name}`;
    return member.name || 'Unknown';
  };

  const getInitials = () => (member.first_name || member.name || '?').charAt(0).toUpperCase();

  const birthDate = member?.birth_date || member?.birthDate;
  const deathDate = member?.death_date || member?.deathDate;
  const birthYear = birthDate?.split('-')[0];
  const deathYear = deathDate?.split('-')[0];
  const isAlive = member?.is_alive !== false && !deathDate;

  const getMaritalStatusText = () => {
    if (spouses.length > 0) {
      const hasDivorced = spouses.some((s: any) => s.marital_status === 'divorced');
      if (hasDivorced && spouses.length === 1) return t('profile.divorced', 'Divorced');
      return t('profile.married', 'Married');
    }
    return t('profile.single', 'Single');
  };

  if (!member) return null;

  const tabs = [
    { id: 'overview', label: t('profile.tab_overview', 'Overview'), icon: 'account_circle' },
    { id: 'family', label: t('profile.tab_family', 'Family'), icon: 'groups' },
    { id: 'timeline', label: t('profile.tab_timeline', 'Timeline'), icon: 'history' },
    { id: 'media', label: t('profile.tab_media', 'Media'), icon: 'photo_library' },
  ];

  const infoCards = [
    {
      icon: 'calendar_today',
      iconColor: 'text-primary',
      label: t('profile.birth_date', 'Birth Date'),
      value: birthDate ? <DateDisplay date={birthDate} /> : t('profile.not_available', 'N/A'),
    },
    {
      icon: 'favorite',
      iconColor: 'text-[#ec4899]',
      label: t('profile.marital_status', 'Marital Status'),
      value: getMaritalStatusText(),
    },
    {
      icon: member?.gender === 'female' ? 'female' : 'male',
      iconColor: member?.gender === 'female' ? 'text-[#ec4899]' : 'text-[#3b82f6]',
      label: t('profile.gender', 'Gender'),
      value: member?.gender === 'male' ? t('common.male', 'Male') : t('common.female', 'Female'),
    },
    {
      icon: 'event_busy',
      iconColor: 'text-amber-500',
      label: t('profile.status', 'Status'),
      value: isAlive ? t('profile.alive', 'Alive') : `${t('profile.deceased', 'Deceased')}${deathDate ? ` (${deathYear})` : ''}`,
    },
  ];

  return (
    <section className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50 dark:bg-background-dark">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Hero Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-24 -mt-24 pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-center lg:items-end justify-between relative z-10 gap-8">
            {/* Avatar + Name */}
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full border-4 border-primary/10 p-0.5 bg-white shadow-md">
                  <div className="w-full h-full rounded-full bg-slate-100 overflow-hidden flex items-center justify-center">
                    {memberImageSrc ? (
                      <img src={memberImageSrc} alt={getDisplayName()} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-slate-400">{getInitials()}</span>
                    )}
                  </div>
                </div>
                {!readOnly && (
                  <button
                    onClick={() => setShowImageUploadModal(true)}
                    className="absolute bottom-0 right-0 w-7 h-7 bg-primary text-white rounded-full border-2 border-white flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                  >
                    <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                  </button>
                )}
              </div>

              <div className={cn("text-center md:text-start", direction === 'rtl' ? 'md:text-right' : 'md:text-left')}>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white font-serif leading-tight italic">
                  {getDisplayName()}
                </h2>
                {(() => {
                  const parentageInfo = getParentageInfo(member, familyMembers);
                  if (parentageInfo) {
                    return (
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium" dir={direction}>
                        {parentageInfo.genderTerm} {parentageInfo.lineage}
                      </p>
                    );
                  }
                  return null;
                })()}
                <p className="text-slate-400 text-sm font-medium">
                  {birthYear && deathYear ? `${birthYear} — ${deathYear}` :
                   birthYear ? `${birthYear} — ${t('profile.present', 'Present')}` : ''}
                </p>
                {isFounder && (
                  <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold border border-amber-100 uppercase tracking-widest">
                      <span className="material-symbols-outlined text-[12px] mr-1">workspace_premium</span>
                      {t('member.founder', 'Founder')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats + Edit */}
            <div className="flex flex-col md:flex-row items-center gap-8 lg:gap-12">
              <div className="flex items-center gap-8 px-8 py-3 rounded-xl bg-slate-50/50 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
                <StatCounter icon="favorite" label={t('profile.spouses', 'Spouses')} count={spouses.length} />
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                <StatCounter icon="child_care" label={t('profile.children', 'Children')} count={children.length} />
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                <StatCounter icon="groups" label={t('profile.grandchildren', 'Grandkids')} count={grandchildren.length} />
              </div>

              {!readOnly && onEdit && (
                <button
                  onClick={onEdit}
                  className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  {t('profile.edit', 'Edit Profile')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-1.5 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 rounded-xl transition-colors',
                activeTab === tab.id
                  ? 'text-primary bg-primary/5 border-b-2 border-primary'
                  : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 text-primary rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">{t('profile.personal_info', 'Personal Information')}</h3>
                    <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">{t('profile.basic_data', 'Basic Data')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {infoCards.map((card, i) => (
                    <InfoCard key={i} icon={card.icon} iconColor={card.iconColor} label={card.label} value={card.value} />
                  ))}
                </div>
              </div>

              {/* Biography */}
              {member?.biography && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined">school</span>
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-white">{t('profile.biography', 'Biography')}</h3>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                    {member.biography}
                  </p>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Family Statistics */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">analytics</span>
                  {t('profile.family_statistics', 'Family Statistics')}
                </h3>
                <div className="space-y-4">
                  <StatRow label={t('profile.children', 'Children')} value={children.length} />
                  <StatRow label={t('profile.spouses', 'Spouses')} value={spouses.length} />
                  <StatRow label={t('profile.grandchildren', 'Grandchildren')} value={grandchildren.length} />
                  {father && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <StatRow label={t('profile.father', 'Father')} value={father.first_name || father.name} isText />
                    </div>
                  )}
                  {mother && (
                    <div className={cn(!father && 'pt-4 border-t border-slate-100 dark:border-slate-800')}>
                      <StatRow label={t('profile.mother', 'Mother')} value={mother.first_name || mother.name} isText />
                    </div>
                  )}
                </div>
              </div>

              {/* Danger Zone */}
              {!readOnly && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-rose-100 dark:border-rose-900/30 shadow-sm shadow-rose-500/5">
                  <h3 className="text-rose-500 font-bold text-xs uppercase tracking-widest mb-4">
                    {t('profile.danger_zone', 'Danger Zone')}
                  </h3>
                  <div className="space-y-3">
                    {isFounder && (
                      <div className="p-4 border border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-amber-500 text-lg">expand_less</span>
                          <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                            {t('profile.parent_management', 'Parent Management')}
                          </p>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          {t('profile.add_parents_desc', 'Add parents to the founder to extend the tree upwards.')}
                        </p>
                        <button className="w-full py-2.5 bg-amber-500 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-colors">
                          <span className="material-symbols-outlined text-sm">person_add</span>
                          {t('profile.add_parents', 'Add Parents')}
                        </button>
                      </div>
                    )}
                    {onDelete && (
                      <button
                        onClick={onDelete}
                        className="w-full py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl flex items-center justify-center gap-2 border border-rose-100 dark:border-rose-900/30 hover:bg-rose-100 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                        {t('profile.delete_member', 'Delete Member')}
                      </button>
                    )}
                    <p className="text-[10px] text-slate-400 text-center italic">
                      {t('profile.admin_restricted', 'Action restricted to administrators')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'family' && (
          <StitchFamilyTab
            member={member}
            spouses={spouses}
            children={children}
            grandchildren={grandchildren}
            father={father}
            mother={mother}
            familyMembers={familyMembers}
            marriages={marriages}
            onMemberClick={onMemberClick}
            onAddChild={onAddChild}
            readOnly={readOnly}
          />
        )}

        {activeTab === 'timeline' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-white mb-6">{t('profile.timeline', 'Timeline')}</h3>
            <p className="text-sm text-slate-500">{t('profile.coming_soon', 'Coming soon...')}</p>
          </div>
        )}

        {activeTab === 'media' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-white mb-6">{t('profile.media', 'Media')}</h3>
            <p className="text-sm text-slate-500">{t('profile.coming_soon', 'Coming soon...')}</p>
          </div>
        )}

        {/* Back Button */}
        {onBack && (
          <div className="flex justify-center pb-8">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors group"
            >
              <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
              {t('profile.back_to_tree', 'Back to Tree View')}
            </button>
          </div>
        )}
      </div>

      {/* Image Upload Modal */}
      <ImageUploadModal
        isOpen={showImageUploadModal}
        onClose={() => setShowImageUploadModal(false)}
        onSave={handleImageSave}
      />
    </section>
  );
};

// === Sub-components ===

const StatCounter: React.FC<{ icon: string; label: string; count: number }> = ({ icon, label, count }) => (
  <div className="text-center group cursor-help" title={label}>
    <span className="material-symbols-outlined text-slate-400 text-lg mb-0.5">{icon}</span>
    <p className="text-lg font-bold text-primary leading-none">{count}</p>
    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tight">{label}</p>
  </div>
);

const InfoCard: React.FC<{ icon: string; iconColor: string; label: string; value: React.ReactNode }> = ({
  icon, iconColor, label, value,
}) => (
  <div className="p-5 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center gap-4 group hover:border-primary/30 transition-colors">
    <div className={cn('w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm', iconColor)}>
      <span className="material-symbols-outlined">{icon}</span>
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{typeof value === 'string' ? value : value}</p>
    </div>
  </div>
);

const StatRow: React.FC<{ label: string; value: number | string; isText?: boolean }> = ({ label, value, isText }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-slate-500 font-medium">{label}</span>
    <span className={cn('font-bold', isText ? 'text-primary' : '')}>{value}</span>
  </div>
);

export default StitchMemberProfile;
