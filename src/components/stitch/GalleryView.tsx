import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { memoriesApi } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import { toast as sonnerToast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Member } from '@/types/family.types';
import type { FamilyMemory } from '@/lib/api/types';
import type { PhotoMemberTag } from '@/lib/api/endpoints/memories';
import { useDropzone } from 'react-dropzone';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useImageUploadPermission } from '@/hooks/useImageUploadPermission';
import { PhotoTagger } from './PhotoTagger';

// Types for the review/edit popup
interface ReviewPopupState {
  open: boolean;
  mode: 'create' | 'edit';
  imageUrl: string;
  filePath: string;
  originalFilename: string;
  contentType: string;
  fileSize: number;
  memoryId?: string; // only for edit mode
  caption: string;
  photoDate: string;
  file?: File; // only for create mode, to allow "Change Photo"
  linkedMemberIds: string[]; // tagged member IDs
}

interface StitchGalleryViewProps {
  familyId: string;
  familyMembers: Member[];
}

interface MemoryWithUrl extends FamilyMemory {
  imageUrl: string;
}

const getImageUrl = (filePath: string): string => {
  const { data } = supabase.storage.from('family-memories').getPublicUrl(filePath);
  return data.publicUrl;
};

// Assign metro grid styles based on index for visual variety
const getMetroStyle = (index: number, totalItems: number): { className: string; style: React.CSSProperties } => {
  if (totalItems <= 2) {
    const small = [
      { className: 'shadow-lg', style: { gridColumn: 'span 2', gridRow: 'span 2' } },
      { className: '', style: { gridColumn: 'span 1', gridRow: 'span 2' } },
    ];
    return small[index] || { className: '', style: { gridColumn: 'span 1', gridRow: 'span 1' } };
  }
  if (totalItems === 3) {
    const p = [
      { className: 'shadow-lg', style: { gridColumn: 'span 2', gridRow: 'span 2' } },
      { className: '', style: { gridColumn: 'span 1', gridRow: 'span 1' } },
      { className: '', style: { gridColumn: 'span 1', gridRow: 'span 1' } },
    ];
    return p[index];
  }
  if (totalItems === 4) {
    const p = [
      { className: 'shadow-lg', style: { gridColumn: 'span 2', gridRow: 'span 2' } },
      { className: '', style: { gridColumn: 'span 1', gridRow: 'span 1' } },
      { className: '', style: { gridColumn: 'span 1', gridRow: 'span 1' } },
      { className: '', style: { gridColumn: 'span 3', gridRow: 'span 1' } },
    ];
    return p[index];
  }
  const patterns: Array<{ className: string; style: React.CSSProperties }> = [
    { className: 'shadow-lg', style: { gridColumn: 'span 2', gridRow: 'span 2' } },
    { className: '', style: { gridColumn: 'span 1', gridRow: 'span 1' } },
    { className: '', style: { gridColumn: 'span 1', gridRow: 'span 2' } },
    { className: '', style: { gridColumn: 'span 2', gridRow: 'span 1' } },
    { className: '', style: { gridColumn: 'span 1', gridRow: 'span 1' } },
    { className: '', style: { gridColumn: 'span 1', gridRow: 'span 1' } },
  ];
  return patterns[index % patterns.length];
};

export const StitchGalleryView: React.FC<StitchGalleryViewProps> = ({
  familyId,
  familyMembers,
}) => {
  const { t, currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const { isImageUploadEnabled, loading: permissionLoading } = useImageUploadPermission();
  const [memories, setMemories] = useState<MemoryWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<MemoryWithUrl | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMemberId, setFilterMemberId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [selectedMemoryTags, setSelectedMemoryTags] = useState<PhotoMemberTag[]>([]);
  const [taggedMemberCounts, setTaggedMemberCounts] = useState<Record<string, number>>({});
  const [filterByTaggedMember, setFilterByTaggedMember] = useState<string | null>(null);
  const [memoryTagsMap, setMemoryTagsMap] = useState<Record<string, string[]>>({}); // memoryId -> member_ids

  // Review popup state
  const [reviewPopup, setReviewPopup] = useState<ReviewPopupState>({
    open: false,
    mode: 'create',
    imageUrl: '',
    filePath: '',
    originalFilename: '',
    contentType: '',
    fileSize: 0,
    caption: '',
    photoDate: '',
    linkedMemberIds: [],
  });
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewTagSearch, setReviewTagSearch] = useState('');
  const reviewImageRef = useRef<HTMLDivElement>(null);
  const [reviewPendingTag, setReviewPendingTag] = useState<{ x: number; y: number } | null>(null);
  const [reviewPendingSearch, setReviewPendingSearch] = useState('');
  const loadMemories = useCallback(async () => {
    if (!familyId) return;
    try {
      const data = await memoriesApi.getFamilyMemories(familyId);
      const withUrls: MemoryWithUrl[] = (data || []).map(m => ({
        ...m,
        imageUrl: getImageUrl(m.file_path),
      }));
      setMemories(withUrls);
    } catch (error) {
      console.error('Error loading gallery:', error);
      sonnerToast.error(t('gallery.load_error', 'Failed to load gallery'));
    } finally {
      setLoading(false);
    }
  }, [familyId, t]);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  // Load all tags for the family (for filtering)
  const loadAllTags = useCallback(async () => {
    if (!familyId) return;
    try {
      const taggedMembers = await memoriesApi.getTaggedMembers(familyId);
      const counts: Record<string, number> = {};
      taggedMembers.forEach(tm => { counts[tm.member_id] = tm.count; });
      setTaggedMemberCounts(counts);
    } catch (error) {
      console.error('Error loading tagged members:', error);
    }
  }, [familyId]);

  useEffect(() => {
    loadAllTags();
  }, [loadAllTags]);

  // Load tags when selecting a memory
  const loadMemoryTags = useCallback(async (memoryId: string) => {
    try {
      const tags = await memoriesApi.getPhotoTags(memoryId);
      setSelectedMemoryTags(tags);
      // Update the map
      setMemoryTagsMap(prev => ({
        ...prev,
        [memoryId]: tags.map(t => t.member_id),
      }));
    } catch (error) {
      console.error('Error loading photo tags:', error);
      setSelectedMemoryTags([]);
    }
  }, []);

  // Members with memory count for sidebar
  // Members with memory count for sidebar (combines linked_member_id + photo tags)
  const membersWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    memories.forEach(m => {
      if (m.linked_member_id) {
        counts[m.linked_member_id] = (counts[m.linked_member_id] || 0) + 1;
      }
    });
    // Merge tagged member counts
    Object.entries(taggedMemberCounts).forEach(([memberId, count]) => {
      counts[memberId] = (counts[memberId] || 0) + count;
    });
    return familyMembers
      .filter(m => counts[m.id])
      .map(m => ({ ...m, memoryCount: counts[m.id] || 0 }))
      .sort((a, b) => b.memoryCount - a.memoryCount);
  }, [familyMembers, memories, taggedMemberCounts]);

  // Filter memories
  const filteredMemories = useMemo(() => {
    let result = memories;
    if (filterMemberId) {
      result = result.filter(m => {
        // Check linked_member_id
        if (m.linked_member_id === filterMemberId) return true;
        // Check photo tags
        const taggedMembers = memoryTagsMap[m.id] || [];
        return taggedMembers.includes(filterMemberId);
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m =>
        (m.caption || '').toLowerCase().includes(q) ||
        (m.original_filename || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [memories, filterMemberId, searchQuery, memoryTagsMap]);

  // Upload handler - uploads file to storage then opens review popup
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!familyId || acceptedFiles.length === 0) return;
    const file = acceptedFiles[0]; // Handle one file at a time for review
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${familyId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('family-memories')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const imageUrl = getImageUrl(filePath);

      // Open review popup instead of creating immediately
      setReviewPopup({
        open: true,
        mode: 'create',
        imageUrl,
        filePath,
        originalFilename: file.name,
        contentType: file.type,
        fileSize: file.size,
        caption: '',
        photoDate: '',
        file,
        linkedMemberIds: [],
      });
    } catch (error) {
      console.error('Upload error:', error);
      sonnerToast.error(t('gallery.upload_error', 'Failed to upload photos'));
    } finally {
      setUploading(false);
    }
  }, [familyId, t]);

  // Save from review popup (create or edit)
  const handleReviewSave = async () => {
    setReviewSaving(true);
    try {
      let memoryId = reviewPopup.memoryId;
      if (reviewPopup.mode === 'create') {
        const created = await memoriesApi.createFamilyMemory({
          family_id: familyId,
          file_path: reviewPopup.filePath,
          original_filename: reviewPopup.originalFilename,
          content_type: reviewPopup.contentType,
          file_size: reviewPopup.fileSize,
          caption: reviewPopup.caption || undefined,
          photo_date: reviewPopup.photoDate || undefined,
        });
        memoryId = created.id;
        sonnerToast.success(t('gallery.upload_success', 'Photo uploaded successfully'));
      } else if (reviewPopup.mode === 'edit' && memoryId) {
        await memoriesApi.updateFamilyMemory(memoryId, {
          caption: reviewPopup.caption || undefined,
          photo_date: reviewPopup.photoDate || undefined,
        });
        sonnerToast.success(t('gallery.update_success', 'Memory updated successfully'));
      }

      // Sync photo tags
      if (memoryId) {
        try {
          const existingTags = await memoriesApi.getPhotoTags(memoryId);
          const existingMemberIds = existingTags.map(t => t.member_id);
          const desiredMemberIds = reviewPopup.linkedMemberIds;

          // Delete removed tags
          for (const tag of existingTags) {
            if (!desiredMemberIds.includes(tag.member_id)) {
              await memoriesApi.deletePhotoTag(tag.id);
            }
          }
          // Create new tags
          for (const memberId of desiredMemberIds) {
            if (!existingMemberIds.includes(memberId)) {
              await memoriesApi.createPhotoTag({
                memory_id: memoryId,
                member_id: memberId,
                x_percent: 50,
                y_percent: 50,
              });
            }
          }
        } catch (tagError) {
          console.error('Error syncing tags:', tagError);
        }
        loadAllTags();
      }

      setReviewPopup(prev => ({ ...prev, open: false }));
      loadMemories();
    } catch (error) {
      console.error('Review save error:', error);
      sonnerToast.error(t('gallery.save_error', 'Failed to save'));
    } finally {
      setReviewSaving(false);
    }
  };

  // Discard from review popup (delete uploaded file if create mode)
  const handleReviewDiscard = async () => {
    if (reviewPopup.mode === 'create' && reviewPopup.filePath) {
      // Clean up the uploaded file from storage
      await supabase.storage.from('family-memories').remove([reviewPopup.filePath]);
    }
    setReviewPopup(prev => ({ ...prev, open: false }));
  };

  // Open edit popup for an existing memory
  const openEditPopup = async (memory: MemoryWithUrl) => {
    // Load existing tags for edit mode
    const existingTagMemberIds: string[] = [];
    if (memory.id) {
      try {
        const tags = await memoriesApi.getPhotoTags(memory.id);
        tags.forEach(t => existingTagMemberIds.push(t.member_id));
      } catch (e) {
        console.error('Error loading tags for edit:', e);
      }
    }
    setReviewPopup({
      open: true,
      mode: 'edit',
      imageUrl: memory.imageUrl,
      filePath: memory.file_path,
      originalFilename: memory.original_filename,
      contentType: memory.content_type,
      fileSize: memory.file_size,
      memoryId: memory.id,
      caption: memory.caption || '',
      photoDate: memory.photo_date ? memory.photo_date.split('T')[0] : '',
      linkedMemberIds: existingTagMemberIds,
    });
    setReviewTagSearch('');
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    maxSize: 10 * 1024 * 1024,
  });

  // Delete handler
  const handleDelete = async (id: string) => {
    if (!confirm(t('gallery.delete_confirm', 'Are you sure you want to delete this photo?'))) return;
    try {
      await memoriesApi.deleteFamilyMemory(id);
      sonnerToast.success(t('gallery.deleted', 'Photo deleted'));
      setSelectedMemory(null);
      loadMemories();
    } catch (error) {
      console.error('Delete error:', error);
      sonnerToast.error(t('gallery.delete_error', 'Failed to delete photo'));
    }
  };

  // Navigation in popup
  const navigateMemory = (direction: 'prev' | 'next') => {
    if (selectedIndex < 0) return;
    const newIndex = direction === 'next'
      ? Math.min(selectedIndex + 1, filteredMemories.length - 1)
      : Math.max(selectedIndex - 1, 0);
    setSelectedIndex(newIndex);
    setSelectedMemory(filteredMemories[newIndex]);
    loadMemoryTags(filteredMemories[newIndex].id);
  };

  const openMemory = (memory: MemoryWithUrl, index: number) => {
    setSelectedMemory(memory);
    setSelectedIndex(index);
    loadMemoryTags(memory.id);
  };

  const getMemberName = (memberId: string | null) => {
    if (!memberId) return null;
    const member = familyMembers.find(m => m.id === memberId);
    return member?.name || null;
  };

  if (loading) {
    return (
      <section className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0F171A] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </section>
    );
  }



  return (
    <>
      <section className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Mobile Upload Bar */}
        <div className="lg:hidden flex items-center gap-2 p-3 bg-card border-b border-border">
          <button
            onClick={() => setShowMobileSidebar(true)}
            className="flex items-center gap-2 px-3 py-2 bg-muted rounded-xl text-sm font-bold flex-1"
          >
            <span className="material-symbols-outlined text-lg">filter_list</span>
            {t('gallery.filter_members', 'Filter & Members')}
            {filterMemberId && <span className="w-2 h-2 rounded-full bg-primary" />}
          </button>
          {isImageUploadEnabled && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold"
            >
              <span className="material-symbols-outlined text-lg">add_a_photo</span>
              {t('gallery.upload', 'Upload')}
            </button>
          )}
        </div>

        {/* Mobile Sidebar Backdrop */}
        {showMobileSidebar && (
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setShowMobileSidebar(false)} />
        )}

        {/* Sidebar - Upload & Members */}
        <aside className={cn(
          'bg-white dark:bg-slate-900 flex flex-col shrink-0',
          // Desktop
          'lg:w-80 lg:border-e lg:border-slate-200 lg:dark:border-slate-800',
          // Mobile: bottom sheet
          'max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:right-0 max-lg:z-50 max-lg:rounded-t-2xl max-lg:max-h-[70vh] max-lg:shadow-xl',
          showMobileSidebar ? 'max-lg:animate-slide-up' : 'max-lg:hidden'
        )}>
          {/* Mobile drag handle */}
          <div className="lg:hidden flex justify-center py-2">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
          {/* Upload Zone - hidden on mobile (use top bar instead) */}
          <div className="hidden lg:block p-6 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">cloud_upload</span>
              {t('gallery.quick_upload', 'Quick Upload')}
            </h2>
            {isImageUploadEnabled ? (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center group cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 dark:border-slate-700 hover:border-primary/50 bg-slate-50/50 dark:bg-slate-800/20'
                }`}
              >
                <input {...getInputProps()} />
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined">add_a_photo</span>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('gallery.drop_here', 'Drop memories here')}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">{t('gallery.file_format_hint', 'PNG, JPG up to 10MB')}</p>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-muted/30">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-muted-foreground">lock</span>
                </div>
                <p className="text-xs font-semibold text-foreground mb-1">
                  {t('gallery.premium_feature', 'Premium Feature')}
                </p>
                <p className="text-[10px] text-muted-foreground mb-3">
                  {t('gallery.upgrade_to_upload', 'Upgrade your plan to upload photos')}
                </p>
                <button
                  onClick={() => navigate('/plan-selection')}
                  className="text-[11px] font-bold text-primary-foreground bg-primary px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                >
                  {t('gallery.upgrade_now', 'Upgrade Now')}
                </button>
              </div>
            )}
            {/* Storage Capacity */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('gallery.storage_capacity', 'Storage Capacity')}</span>
                {isImageUploadEnabled ? (
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                    {(memories.reduce((acc, m) => acc + (m.file_size || 0), 0) / (1024 * 1024 * 1024)).toFixed(1)} GB
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">lock</span>
                    {t('gallery.locked', 'LOCKED')}
                  </span>
                )}
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden relative">
                {isImageUploadEnabled ? (
                  <div className="bg-primary h-full rounded-full shadow-[0_0_8px_rgba(69,179,143,0.4)]" style={{ width: `${Math.min(memories.reduce((acc, m) => acc + (m.file_size || 0), 0) / (10 * 1024 * 1024 * 1024) * 100, 100)}%` }} />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-600 opacity-50" />
                )}
              </div>
              {!isImageUploadEnabled && (
                <p className="text-[9px] text-slate-400 mt-2 font-medium italic">
                  {t('gallery.premium_storage', 'Premium plan required for media storage')}
                </p>
              )}
            </div>
          </div>

          {/* Members Filter */}
          <div className={`flex-1 flex flex-col min-h-0 ${!isImageUploadEnabled ? 'opacity-40 select-none grayscale pointer-events-none' : ''}`}>
            <div className="p-6 pb-2">
              <div className="relative">
                <span className="material-symbols-outlined absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                <input
                  className={`w-full ps-10 pe-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-xs focus:ring-2 focus:ring-primary/20 outline-none ${!isImageUploadEnabled ? 'cursor-not-allowed' : ''}`}
                  placeholder={!isImageUploadEnabled ? t('gallery.filter_disabled', 'Filter disabled...') : t('gallery.filter_member', 'Filter by family member...')}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  disabled={!isImageUploadEnabled}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 pt-2 space-y-2 custom-scrollbar">
              {/* All Photos */}
              <button
                onClick={() => setFilterMemberId(null)}
                className={`w-full p-2 rounded-xl transition-colors text-start flex items-center gap-3 ${
                  !filterMemberId ? 'bg-primary/5 dark:bg-primary/10 border border-primary/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-lg">photo_library</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold truncate">{t('gallery.all_photos', 'All Photos')}</h4>
                  <p className="text-[9px] text-slate-500 uppercase font-bold">{memories.length} {t('gallery.memories', 'Memories')}</p>
                </div>
              </button>

              {membersWithCounts.map(member => (
                <button
                  key={member.id}
                  onClick={() => setFilterMemberId(member.id)}
                  className={`w-full p-2 rounded-xl transition-colors text-start flex items-center gap-3 ${
                    filterMemberId === member.id ? 'bg-primary/5 dark:bg-primary/10 border border-primary/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                    {member.image_url ? (
                      <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-slate-400 font-bold text-xs">{(member.name || '?')[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold truncate">{member.name}</h4>
                    <p className="text-[9px] text-slate-500 uppercase font-bold">{member.memoryCount} {t('gallery.memories', 'Memories')}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Gallery Content */}
        <div className="flex-1 relative overflow-hidden bg-slate-50 dark:bg-[#0F171A]">
          {/* Locked Overlay - when user doesn't have permission */}
          {!isImageUploadEnabled && (
            <>
              <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
               <div className="max-w-sm w-full bg-white dark:bg-slate-900 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-slate-800 overflow-hidden text-center p-6 relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-700 via-amber-500 to-yellow-400" />
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-700 via-amber-500 to-yellow-400 rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-amber-500/20">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>crown</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">
                    {t('gallery.unlock_title', 'Unlock Your Family Gallery')}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-5 text-xs leading-relaxed">
                    {t('gallery.unlock_description', 'The Media Gallery is a premium feature. Upgrade to the Complete Plan to start uploading and preserving your family memories.')}
                  </p>
                  <button
                    onClick={() => navigate('/plan-selection')}
                    className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-amber-700 via-amber-500 to-yellow-400 text-white font-bold text-sm shadow-lg shadow-amber-500/30 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">workspace_premium</span>
                    {t('gallery.upgrade_to_premium', 'Upgrade to Premium')}
                  </button>
                </div>
              </div>
            </>
          )}

          <div className={`p-4 lg:p-8 h-full overflow-y-auto custom-scrollbar ${!isImageUploadEnabled ? 'blur-[12px] pointer-events-none select-none' : ''}`}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined text-white text-lg">photo_library</span>
                  </div>
                  <h2 className="text-xl lg:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {t('gallery.title', 'معرض الصور')}
                  </h2>
                </div>
                <span className="hidden md:inline text-slate-300 dark:text-slate-600">|</span>
                <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                  {t('gallery.description', "لحظات عائلية ثمينة عبر الأجيال")}
                </p>
              </div>
              {isImageUploadEnabled && (
                <div className="flex gap-2">
                  <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">photo_library</span>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold leading-none">{t('gallery.total_items', 'Total Items')}</p>
                      <p className="text-lg font-bold leading-tight">{filteredMemories.length.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Metro Grid or Empty State */}
            {!isImageUploadEnabled ? (
              /* Blurred placeholder grid for locked state */
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4" style={{ gridAutoRows: '180px', gridAutoFlow: 'dense' }}>
                <div className="rounded-3xl bg-slate-200 dark:bg-slate-800" style={{ gridColumn: 'span 2', gridRow: 'span 2' }} />
                <div className="rounded-3xl bg-slate-200 dark:bg-slate-800" />
                <div className="rounded-3xl bg-slate-200 dark:bg-slate-800" style={{ gridRow: 'span 2' }} />
                <div className="rounded-3xl bg-slate-200 dark:bg-slate-800" style={{ gridColumn: 'span 2' }} />
                <div className="rounded-3xl bg-slate-100 dark:bg-slate-800" />
                <div className="rounded-3xl bg-slate-100 dark:bg-slate-800" />
              </div>
            ) : filteredMemories.length === 0 ? (
              /* Beautiful empty state when user HAS permission but no photos */
              <div className="flex-1 flex flex-col items-center justify-center py-20">
                <div className="relative mb-8">
                  <div className="absolute -inset-4 bg-primary/5 rounded-full blur-2xl" />
                  <div className="relative w-64 h-64 flex items-center justify-center">
                    <div className="relative flex flex-col items-center">
                      <div className="w-48 h-48 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700 rotate-3 transition-transform hover:rotate-0">
                        <span className="material-symbols-outlined text-8xl text-slate-200 dark:text-slate-700">photo_library</span>
                      </div>
                      <div className="absolute -top-4 -right-4 w-32 h-32 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700 -rotate-6 transition-transform hover:rotate-0">
                        <span className="material-symbols-outlined text-6xl text-primary/30">family_history</span>
                      </div>
                      <div className="absolute -bottom-2 -left-6 w-24 h-24 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center justify-center border border-slate-100 dark:border-slate-700 rotate-12 transition-transform hover:rotate-0">
                        <span className="material-symbols-outlined text-4xl text-secondary/40">photo_camera</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center max-w-md mx-auto space-y-4">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {t('gallery.empty_title', 'Your Family Gallery is Empty')}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-lg">
                    {t('gallery.empty_description', 'Start preserving your legacy by uploading your first memory.')}
                  </p>
                  <div className="pt-6">
                    <button
                      onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                      className="bg-primary text-white px-10 py-4 rounded-2xl shadow-xl shadow-primary/30 font-bold text-lg flex items-center gap-3 hover:scale-105 transition-all active:scale-95 mx-auto"
                    >
                      <span className="material-symbols-outlined text-2xl">add_a_photo</span>
                      {t('gallery.upload_first', 'Upload First Memory')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4" style={{ gridAutoRows: '160px', gridAutoFlow: 'dense' }}>
                {filteredMemories.map((memory, index) => {
                  const metro = getMetroStyle(index, filteredMemories.length);
                  const isLarge = (metro.style.gridColumn === 'span 2');
                  const memberName = getMemberName(memory.linked_member_id);

                  return (
                      <div
                        key={memory.id}
                        className={`group relative overflow-hidden rounded-3xl ${metro.className || 'shadow-md'} cursor-zoom-in gallery-card`}
                        style={metro.style}
                        onClick={() => openMemory(memory, index)}
                      >
                        <img
                          alt={memory.caption || memory.original_filename}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          src={memory.imageUrl}
                          loading="lazy"
                        />
                      <div className={`absolute bottom-0 inset-x-0 ${isLarge ? 'h-1/2' : 'h-1/2'} bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none z-10`} />
                      <div className={`absolute bottom-0 inset-x-0 ${isLarge ? 'p-6' : 'p-4'} z-20 text-white`}>
                        <h3 className={`font-bold ${isLarge ? 'text-base leading-tight tracking-tight' : 'text-xs'} truncate drop-shadow-md`}>
                          {memory.caption || memory.original_filename}
                        </h3>
                        {memory.photo_date && (
                          <p className={`${isLarge ? 'text-[11px] font-medium mt-1 flex items-center gap-2' : 'text-[10px] mt-0.5'} opacity-90`}>
                            {isLarge && memberName && (
                              <>
                                <span>{memberName}</span>
                                <span className="w-1 h-1 bg-white/50 rounded-full" />
                              </>
                            )}
                            <span>{new Date(memory.photo_date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
                          </p>
                        )}
                      </div>
                      {/* Hover overlay with actions */}
                      <div className={`card-overlay absolute inset-0 bg-black/40 opacity-0 transition-opacity duration-300 flex flex-col justify-start ${isLarge ? 'p-6' : 'p-3'} z-30`}>
                        <div className="flex justify-end gap-2">
                          <button
                            className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md hover:bg-primary transition-colors flex items-center justify-center text-white"
                            onClick={e => { e.stopPropagation(); openEditPopup(memory); }}
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md hover:bg-red-500 transition-colors flex items-center justify-center text-white"
                            onClick={e => { e.stopPropagation(); handleDelete(memory.id); }}
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

              </div>
            )}
          </div>
        </div>
      </section>

      {/* Image Detail Popup */}
      {selectedMemory && (
        <div className="fixed inset-0 z-[200] flex items-end lg:items-center justify-center lg:p-8 bg-slate-900/40 backdrop-blur-xl">
          {/* Close button */}
          <button
            className="absolute top-4 end-4 lg:top-6 lg:end-6 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md transition-all flex items-center justify-center z-[210]"
            onClick={() => setSelectedMemory(null)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          <div className="relative w-full lg:max-w-7xl h-[90vh] lg:h-[85vh] bg-white dark:bg-slate-900 rounded-t-[24px] lg:rounded-[32px] shadow-2xl overflow-hidden flex flex-col lg:flex-row">
            {/* Image Area with PhotoTagger */}
            <div className="relative h-[45vh] lg:h-auto lg:w-[68%] bg-slate-100 dark:bg-black/20 flex items-center justify-center group overflow-hidden shrink-0">
              <PhotoTagger
                memoryId={selectedMemory.id}
                imageUrl={selectedMemory.imageUrl}
                imageAlt={selectedMemory.caption || selectedMemory.original_filename}
                familyMembers={familyMembers}
                tags={selectedMemoryTags}
                onTagsChange={() => {
                  loadMemoryTags(selectedMemory.id);
                  loadAllTags();
                }}
              />
              {/* Prev / Next Arrows */}
              {selectedIndex > 0 && (
                <button
                  className="absolute start-6 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-10"
                  onClick={() => navigateMemory('prev')}
                >
                  <span className="material-symbols-outlined text-3xl">chevron_left</span>
                </button>
              )}
              {selectedIndex < filteredMemories.length - 1 && (
                <button
                  className="absolute end-6 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-10"
                  onClick={() => navigateMemory('next')}
                >
                  <span className="material-symbols-outlined text-3xl">chevron_right</span>
                </button>
              )}
            </div>

            {/* Details Panel */}
            <div className="flex-1 lg:w-[32%] border-t lg:border-t-0 lg:border-s border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8">
                {/* Title & Caption */}
                <div className="mb-8">
                  <span className="inline-block px-2 py-1 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-3">
                    {t('gallery.family_history', 'Family History')}
                  </span>
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight mb-3">
                    {selectedMemory.caption || selectedMemory.original_filename}
                  </h2>
                </div>

                {/* Metadata */}
                <div className="space-y-6 mb-8">
                  {selectedMemory.photo_date && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-slate-400">calendar_today</span>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">{t('gallery.captured_on', 'Captured On')}</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {new Date(selectedMemory.photo_date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-slate-400">person_add</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">{t('gallery.uploaded_at', 'Uploaded')}</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {formatDistanceToNow(new Date(selectedMemory.uploaded_at), {
                          addSuffix: true,
                          locale: currentLanguage === 'ar' ? ar : undefined,
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tagged Members */}
                {(selectedMemoryTags.length > 0 || selectedMemory.linked_member_id) && (
                  <div>
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">person_pin</span>
                      {t('gallery.tagged_members', 'الأشخاص المحددون')}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {/* Show photo tags */}
                      {selectedMemoryTags.map(tag => {
                        const member = familyMembers.find(m => m.id === tag.member_id);
                        if (!member) return null;
                        return (
                          <div key={tag.id} className="flex items-center gap-2 bg-primary/5 dark:bg-primary/10 pe-3 ps-1 py-1 rounded-full border border-primary/20">
                            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center">
                              {member.image_url ? (
                                <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[10px] font-bold text-slate-400">{(member.name || '?')[0]}</span>
                              )}
                            </div>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{member.name}</span>
                          </div>
                        );
                      })}
                      {/* Show linked member if not already in tags */}
                      {selectedMemory.linked_member_id && !selectedMemoryTags.some(t => t.member_id === selectedMemory.linked_member_id) && (() => {
                        const member = familyMembers.find(m => m.id === selectedMemory.linked_member_id);
                        if (!member) return null;
                        return (
                          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 pe-3 ps-1 py-1 rounded-full border border-slate-100 dark:border-slate-800">
                            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center">
                              {member.image_url ? (
                                <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[10px] font-bold text-slate-400">{(member.name || '?')[0]}</span>
                              )}
                            </div>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{member.name}</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {selectedMemory.tags && selectedMemory.tags.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                      {t('gallery.tags', 'Tags')}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedMemory.tags.map((tag, i) => (
                        <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="p-6 pt-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <a
                    href={selectedMemory.imageUrl}
                    download={selectedMemory.original_filename}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">download</span>
                    {t('gallery.download', 'Download')}
                  </a>
                  <button
                    onClick={() => { setSelectedMemory(null); openEditPopup(selectedMemory); }}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">edit_note</span>
                    {t('gallery.edit_details', 'Edit Details')}
                  </button>
                </div>
                <button
                  onClick={() => handleDelete(selectedMemory.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/20 rounded-xl text-sm font-bold transition-all"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                  {t('gallery.delete_permanently', 'Delete Permanently')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Memory Details Popup */}
      {reviewPopup.open && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 lg:p-8 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">image_search</span>
                </div>
                <h3 className="font-bold text-foreground">
                  {reviewPopup.mode === 'create'
                    ? t('gallery.review_details', 'Review Memory Details')
                    : t('gallery.edit_memory', 'Edit Memory Details')}
                </h3>
              </div>
              <button
                onClick={handleReviewDiscard}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-5">
              {/* Image Preview - larger, with click-to-tag */}
              <div
                ref={reviewImageRef}
                className="relative group rounded-2xl overflow-hidden bg-muted shadow-inner border border-border cursor-crosshair"
                onClick={(e) => {
                  const rect = reviewImageRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  setReviewPendingTag({ x, y });
                  setReviewPendingSearch('');
                }}
              >
                <img
                  alt="Memory Preview"
                  className="w-full aspect-[16/10] object-contain bg-black/5 dark:bg-black/20"
                  src={reviewPopup.imageUrl}
                />
                {/* Existing tag dots on image */}
                {reviewPopup.linkedMemberIds.map((memberId, idx) => {
                  const member = familyMembers.find(m => m.id === memberId);
                  if (!member) return null;
                  // For tags without position, don't show dot
                  return null;
                })}

                {/* Pending tag marker + dropdown */}
                {reviewPendingTag && (
                  <>
                    <div
                      className="absolute inset-0 z-30"
                      onClick={(e) => { e.stopPropagation(); setReviewPendingTag(null); }}
                    />
                    <div
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 z-40"
                      style={{ left: `${reviewPendingTag.x}%`, top: `${reviewPendingTag.y}%` }}
                    >
                      <div className="w-8 h-8 rounded-full border-2 border-dashed border-white bg-white/30 backdrop-blur-sm animate-pulse flex items-center justify-center shadow-xl">
                        <span className="material-symbols-outlined text-white text-sm">add</span>
                      </div>
                      {/* Member selection dropdown */}
                      <div
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-card rounded-xl shadow-2xl border border-border overflow-hidden z-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-2 border-b border-border">
                          <div className="relative">
                            <span className="material-symbols-outlined absolute start-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">search</span>
                            <input
                              autoFocus
                              type="text"
                              value={reviewPendingSearch}
                              onChange={(e) => setReviewPendingSearch(e.target.value)}
                              placeholder={t('gallery.search_member', 'ابحث عن عضو...')}
                              className="w-full ps-7 pe-3 py-1.5 bg-muted border-none rounded-lg text-xs focus:ring-1 focus:ring-primary/30 outline-none"
                            />
                          </div>
                        </div>
                        <div className="max-h-40 overflow-y-auto custom-scrollbar">
                          {familyMembers
                            .filter(m => !reviewPopup.linkedMemberIds.includes(m.id) && (reviewPendingSearch.trim() === '' || m.name.toLowerCase().includes(reviewPendingSearch.toLowerCase())))
                            .slice(0, 8)
                            .map(member => (
                              <button
                                key={member.id}
                                type="button"
                                onClick={() => {
                                  setReviewPopup(prev => ({ ...prev, linkedMemberIds: [...prev.linkedMemberIds, member.id] }));
                                  setReviewPendingTag(null);
                                }}
                                className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-accent transition-colors text-start"
                              >
                                <div className="w-7 h-7 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">
                                  {member.image_url ? (
                                    <img src={member.image_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-muted-foreground font-bold text-[10px]">{(member.name || '?')[0]}</span>
                                  )}
                                </div>
                                <span className="text-xs font-semibold text-foreground truncate">{member.name}</span>
                              </button>
                            ))}
                          {familyMembers.filter(m => !reviewPopup.linkedMemberIds.includes(m.id) && (reviewPendingSearch.trim() === '' || m.name.toLowerCase().includes(reviewPendingSearch.toLowerCase()))).length === 0 && (
                            <p className="py-4 text-center text-xs text-muted-foreground">{t('gallery.no_members_available', 'لا يوجد أعضاء متاحين')}</p>
                          )}
                        </div>
                        <div className="p-2 border-t border-border">
                          <button
                            onClick={() => setReviewPendingTag(null)}
                            className="w-full py-1.5 text-[11px] text-muted-foreground hover:text-foreground font-medium transition-colors"
                          >
                            {t('common.cancel', 'إلغاء')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Tag hint */}
                {reviewPopup.linkedMemberIds.length === 0 && !reviewPendingTag && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                    <div className="bg-foreground/60 backdrop-blur-sm text-background text-[11px] px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                      <span className="material-symbols-outlined text-sm">touch_app</span>
                      {t('gallery.click_to_tag', 'اضغط على الصورة لتحديد الأشخاص')}
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
              </div>

              {/* Row: Description (3/4) + Tagged Members (1/4) */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Description - 3/4 */}
                <div className="lg:col-span-3 space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                    {t('gallery.description', 'Description')}
                  </label>
                  <textarea
                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground resize-none outline-none"
                    placeholder={t('gallery.description_placeholder', 'Tell the story behind this photo... Who is in it? What happened that day?')}
                    rows={4}
                    value={reviewPopup.caption}
                    onChange={e => setReviewPopup(prev => ({ ...prev, caption: e.target.value }))}
                  />
                </div>

                {/* Tagged Members - 1/4 */}
                <div className="lg:col-span-1 space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                    {t('gallery.tagged', 'Tagged')}
                  </label>
                  <div className="bg-muted border border-border rounded-xl p-3 min-h-[120px] max-h-[160px] overflow-y-auto custom-scrollbar">
                    {reviewPopup.linkedMemberIds.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        {t('gallery.no_tags_yet', 'Click on the image to tag members')}
                      </p>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {reviewPopup.linkedMemberIds.map(memberId => {
                          const member = familyMembers.find(m => m.id === memberId);
                          if (!member) return null;
                          return (
                            <div key={memberId} className="flex items-center gap-2 bg-card ps-1.5 pe-1 py-1 rounded-lg border border-border group/tag">
                              <div className="w-5 h-5 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">
                                {member.image_url ? (
                                  <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-[9px] font-bold text-muted-foreground">{(member.name || '?')[0]}</span>
                                )}
                              </div>
                              <span className="text-[11px] font-semibold text-foreground truncate flex-1">{member.name}</span>
                              <button
                                type="button"
                                onClick={() => setReviewPopup(prev => ({ ...prev, linkedMemberIds: prev.linkedMemberIds.filter(id => id !== memberId) }))}
                                className="w-5 h-5 rounded-full opacity-0 group-hover/tag:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-all shrink-0"
                              >
                                <span className="material-symbols-outlined text-xs">close</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {/* Quick add search below tagged list */}
                  <div className="relative">
                    <span className="material-symbols-outlined absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-base">person_add</span>
                    <input
                      className="w-full ps-8 pe-3 py-2 bg-muted border border-border rounded-lg text-xs focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      type="text"
                      placeholder={t('gallery.add_member', 'Add member...')}
                      value={reviewTagSearch}
                      onChange={e => setReviewTagSearch(e.target.value)}
                    />
                  </div>
                  {reviewTagSearch.trim() && (
                    <div className="max-h-28 overflow-y-auto bg-popover border border-border rounded-lg shadow-lg">
                      {familyMembers
                        .filter(m => !reviewPopup.linkedMemberIds.includes(m.id) && m.name.toLowerCase().includes(reviewTagSearch.toLowerCase()))
                        .slice(0, 6)
                        .map(member => (
                          <button
                            key={member.id}
                            type="button"
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent text-start transition-colors"
                            onClick={() => {
                              setReviewPopup(prev => ({ ...prev, linkedMemberIds: [...prev.linkedMemberIds, member.id] }));
                              setReviewTagSearch('');
                            }}
                          >
                            <div className="w-5 h-5 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">
                              {member.image_url ? (
                                <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[9px] font-bold text-muted-foreground">{(member.name || '?')[0]}</span>
                              )}
                            </div>
                            <span className="text-xs font-medium text-foreground">{member.name}</span>
                          </button>
                        ))}
                      {familyMembers.filter(m => !reviewPopup.linkedMemberIds.includes(m.id) && m.name.toLowerCase().includes(reviewTagSearch.toLowerCase())).length === 0 && (
                        <p className="px-3 py-2 text-xs text-muted-foreground text-center">{t('gallery.no_members_found', 'No members found')}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Date - last row */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                  {t('gallery.date_of_event', 'Date of Event')}
                </label>
                <div className="relative max-w-xs">
                  <span className="material-symbols-outlined absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">calendar_today</span>
                  <input
                    className="w-full ps-10 pe-4 py-3 bg-muted border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    type="date"
                    value={reviewPopup.photoDate}
                    onChange={e => setReviewPopup(prev => ({ ...prev, photoDate: e.target.value }))}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground px-1 mt-1">
                  {t('gallery.date_hint', 'Leave blank if the exact date is unknown.')}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border bg-muted/50 flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={handleReviewDiscard}
                className="px-6 py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('gallery.discard', 'Discard')}
              </button>
              <button
                onClick={handleReviewSave}
                disabled={reviewSaving}
                className="px-8 py-2.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {reviewSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                )}
                {reviewPopup.mode === 'create'
                  ? t('gallery.upload_to_gallery', 'Upload to Gallery')
                  : t('gallery.save_changes', 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StitchGalleryView;
