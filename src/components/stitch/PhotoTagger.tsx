/**
 * PhotoTagger - Click on a photo to tag family members at specific positions
 * Shows existing tags as dots/badges and allows adding new ones
 */

import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { memoriesApi } from '@/lib/api';
import type { PhotoMemberTag } from '@/lib/api/endpoints/memories';
import { Member } from '@/types/family.types';
import { toast as sonnerToast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface PhotoTaggerProps {
  memoryId: string;
  imageUrl: string;
  imageAlt: string;
  familyMembers: Member[];
  tags: PhotoMemberTag[];
  onTagsChange: () => void;
  readOnly?: boolean;
}

export const PhotoTagger: React.FC<PhotoTaggerProps> = ({
  memoryId,
  imageUrl,
  imageAlt,
  familyMembers,
  tags,
  onTagsChange,
  readOnly = false,
}) => {
  const { t } = useLanguage();
  const imageRef = useRef<HTMLDivElement>(null);
  const [pendingTag, setPendingTag] = useState<{ x: number; y: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [hoveredTagId, setHoveredTagId] = useState<string | null>(null);

  // Get member info for a tag
  const getMember = useCallback((memberId: string) => {
    return familyMembers.find(m => m.id === memberId);
  }, [familyMembers]);

  // Already tagged member IDs
  const taggedMemberIds = new Set(tags.map(t => t.member_id));

  // Available members (not yet tagged)
  const availableMembers = familyMembers.filter(m => 
    !taggedMemberIds.has(m.id) &&
    (searchQuery.trim() === '' || m.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle click on image to place a tag
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly) return;
    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPendingTag({ x, y });
    setSearchQuery('');
  };

  // Save tag
  const handleSelectMember = async (memberId: string) => {
    if (!pendingTag) return;
    setSaving(true);
    try {
      await memoriesApi.createPhotoTag({
        memory_id: memoryId,
        member_id: memberId,
        x_percent: Math.round(pendingTag.x * 100) / 100,
        y_percent: Math.round(pendingTag.y * 100) / 100,
      });
      setPendingTag(null);
      onTagsChange();
      sonnerToast.success(t('gallery.tag_added', 'تم تحديد العضو بنجاح'));
    } catch (error: any) {
      console.error('Tag error:', error);
      sonnerToast.error(error?.message || t('gallery.tag_error', 'فشل في إضافة التحديد'));
    } finally {
      setSaving(false);
    }
  };

  // Delete tag
  const handleDeleteTag = async (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await memoriesApi.deletePhotoTag(tagId);
      onTagsChange();
      sonnerToast.success(t('gallery.tag_removed', 'تم إزالة التحديد'));
    } catch (error) {
      console.error('Delete tag error:', error);
      sonnerToast.error(t('gallery.tag_delete_error', 'فشل في إزالة التحديد'));
    }
  };

  return (
    <div className="relative w-full h-full" ref={imageRef}>
      {/* Image */}
      <img
        alt={imageAlt}
        className="w-full h-full object-contain"
        src={imageUrl}
      />

      {/* Clickable overlay for tagging */}
      {!readOnly && (
        <div
          className="absolute inset-0 cursor-crosshair"
          onClick={handleImageClick}
        />
      )}

      {/* Existing tags */}
      {tags.map(tag => {
        const member = getMember(tag.member_id);
        if (!member) return null;
        const isHovered = hoveredTagId === tag.id;

        return (
          <div
            key={tag.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 group"
            style={{ left: `${tag.x_percent}%`, top: `${tag.y_percent}%` }}
            onMouseEnter={() => setHoveredTagId(tag.id)}
            onMouseLeave={() => setHoveredTagId(null)}
          >
            {/* Tag dot */}
            <div className={cn(
              "w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-all duration-200",
              isHovered ? "bg-primary scale-125" : "bg-primary/80 scale-100"
            )}>
              <span className="text-white text-[8px] font-bold">
                {(member.name || '?')[0]}
              </span>
            </div>

            {/* Tooltip on hover */}
            <div className={cn(
              "absolute top-full left-1/2 -translate-x-1/2 mt-1 transition-all duration-200 pointer-events-none",
              isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
            )}>
              <div className="bg-slate-900/90 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl flex items-center gap-2">
                {member.image_url && (
                  <img src={member.image_url} alt="" className="w-4 h-4 rounded-full object-cover" />
                )}
                {member.name}
                {!readOnly && (
                  <button
                    onClick={(e) => handleDeleteTag(tag.id, e)}
                    className="pointer-events-auto ml-1 w-4 h-4 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-outlined text-[10px] text-white">close</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Pending tag with member selection dropdown */}
      {pendingTag && (
        <>
          {/* Backdrop to close */}
          <div
            className="absolute inset-0 z-30"
            onClick={(e) => { e.stopPropagation(); setPendingTag(null); }}
          />

          {/* Pending tag marker */}
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-40"
            style={{ left: `${pendingTag.x}%`, top: `${pendingTag.y}%` }}
          >
            <div className="w-8 h-8 rounded-full border-2 border-dashed border-white bg-white/30 backdrop-blur-sm animate-pulse flex items-center justify-center shadow-xl">
              <span className="material-symbols-outlined text-white text-sm">add</span>
            </div>

            {/* Member selection dropdown */}
            <div
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search */}
              <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                <div className="relative">
                  <span className="material-symbols-outlined absolute start-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('gallery.search_member', 'ابحث عن عضو...')}
                    className="w-full ps-7 pe-3 py-1.5 bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-xs focus:ring-1 focus:ring-primary/30 outline-none"
                  />
                </div>
              </div>

              {/* Members list */}
              <div className="max-h-40 overflow-y-auto custom-scrollbar">
                {saving ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                ) : availableMembers.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400">
                    {t('gallery.no_members_available', 'لا يوجد أعضاء متاحين')}
                  </div>
                ) : (
                  availableMembers.map(member => (
                    <button
                      key={member.id}
                      onClick={() => handleSelectMember(member.id)}
                      className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors text-start"
                    >
                      <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                        {member.image_url ? (
                          <img src={member.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-slate-400 font-bold text-[10px]">{(member.name || '?')[0]}</span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                        {member.name}
                      </span>
                    </button>
                  ))
                )}
              </div>

              {/* Cancel */}
              <div className="p-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setPendingTag(null)}
                  className="w-full py-1.5 text-[11px] text-slate-400 hover:text-slate-600 font-medium transition-colors"
                >
                  {t('common.cancel', 'إلغاء')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tag instruction hint */}
      {!readOnly && tags.length === 0 && !pendingTag && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="bg-slate-900/70 backdrop-blur-sm text-white text-[11px] px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
            <span className="material-symbols-outlined text-sm">touch_app</span>
            {t('gallery.click_to_tag', 'اضغط على الصورة لتحديد الأشخاص')}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoTagger;
