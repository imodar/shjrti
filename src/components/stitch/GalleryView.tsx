import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { memoriesApi } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import { toast as sonnerToast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Member } from '@/types/family.types';
import type { FamilyMemory } from '@/lib/api/types';
import { useDropzone } from 'react-dropzone';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

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
  // When few items, use simple square layout
  if (totalItems <= 4) {
    return { className: '', style: { gridColumn: 'span 1', gridRow: 'span 1' } };
  }
  const patterns: Array<{ className: string; style: React.CSSProperties }> = [
    { className: 'shadow-lg', style: { gridColumn: 'span 2', gridRow: 'span 2' } }, // large
    { className: '', style: { gridColumn: 'span 1', gridRow: 'span 1' } }, // square
    { className: '', style: { gridColumn: 'span 1', gridRow: 'span 2' } }, // tall
    { className: '', style: { gridColumn: 'span 2', gridRow: 'span 1' } }, // wide
    { className: '', style: { gridColumn: 'span 1', gridRow: 'span 1' } }, // square
    { className: '', style: { gridColumn: 'span 1', gridRow: 'span 1' } }, // square
  ];
  return patterns[index % patterns.length];
};

export const StitchGalleryView: React.FC<StitchGalleryViewProps> = ({
  familyId,
  familyMembers,
}) => {
  const { t, currentLanguage } = useLanguage();
  const [memories, setMemories] = useState<MemoryWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<MemoryWithUrl | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMemberId, setFilterMemberId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  });
  const [reviewSaving, setReviewSaving] = useState(false);
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

  // Members with memory count for sidebar
  const membersWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    memories.forEach(m => {
      if (m.linked_member_id) {
        counts[m.linked_member_id] = (counts[m.linked_member_id] || 0) + 1;
      }
    });
    return familyMembers
      .filter(m => counts[m.id])
      .map(m => ({ ...m, memoryCount: counts[m.id] || 0 }))
      .sort((a, b) => b.memoryCount - a.memoryCount);
  }, [familyMembers, memories]);

  // Filter memories
  const filteredMemories = useMemo(() => {
    let result = memories;
    if (filterMemberId) {
      result = result.filter(m => m.linked_member_id === filterMemberId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m =>
        (m.caption || '').toLowerCase().includes(q) ||
        (m.original_filename || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [memories, filterMemberId, searchQuery]);

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
      if (reviewPopup.mode === 'create') {
        await memoriesApi.createFamilyMemory({
          family_id: familyId,
          file_path: reviewPopup.filePath,
          original_filename: reviewPopup.originalFilename,
          content_type: reviewPopup.contentType,
          file_size: reviewPopup.fileSize,
          caption: reviewPopup.caption || undefined,
          photo_date: reviewPopup.photoDate || undefined,
        });
        sonnerToast.success(t('gallery.upload_success', 'Photo uploaded successfully'));
      } else if (reviewPopup.mode === 'edit' && reviewPopup.memoryId) {
        await memoriesApi.updateFamilyMemory(reviewPopup.memoryId, {
          caption: reviewPopup.caption || undefined,
          photo_date: reviewPopup.photoDate || undefined,
        });
        sonnerToast.success(t('gallery.update_success', 'Memory updated successfully'));
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
  const openEditPopup = (memory: MemoryWithUrl) => {
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
    });
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
  };

  const openMemory = (memory: MemoryWithUrl, index: number) => {
    setSelectedMemory(memory);
    setSelectedIndex(index);
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
      <section className="flex-1 overflow-hidden flex">
        {/* Sidebar - Upload & Members */}
        <aside className="w-80 bg-white dark:bg-slate-900 border-e border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
          {/* Upload Zone */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">cloud_upload</span>
              {t('gallery.quick_upload', 'Quick Upload')}
            </h2>
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
              <p className="text-[10px] text-slate-400 mt-1">PNG, JPG up to 10MB</p>
            </div>
            {/* Storage Capacity */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('gallery.storage_capacity', 'Storage Capacity')}</span>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  {(memories.reduce((acc, m) => acc + (m.file_size || 0), 0) / (1024 * 1024 * 1024)).toFixed(1)} GB
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full shadow-[0_0_8px_rgba(69,179,143,0.4)]" style={{ width: `${Math.min(memories.reduce((acc, m) => acc + (m.file_size || 0), 0) / (10 * 1024 * 1024 * 1024) * 100, 100)}%` }} />
              </div>
            </div>
          </div>

          {/* Members Filter */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-6 pb-2">
              <div className="relative">
                <span className="material-symbols-outlined absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                <input
                  className="w-full ps-10 pe-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder={t('gallery.filter_member', 'Filter by family member...')}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
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
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0F171A] custom-scrollbar">
          <div className="p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-0.5 bg-secondary/10 text-secondary text-[10px] font-bold rounded uppercase tracking-widest border border-secondary/20">
                    {t('gallery.archive_badge', 'Archive')}
                  </span>
                  <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {t('gallery.title', 'Metro Grid Family Gallery')}
                  </h2>
                </div>
                <p className="text-slate-500 dark:text-slate-400 max-w-lg">
                  {t('gallery.description', "A dynamic mosaic of our family's most precious memories, curated across generations.")}
                </p>
              </div>
              <div className="flex gap-2">
                <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">photo_library</span>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold leading-none">{t('gallery.total_items', 'Total Items')}</p>
                    <p className="text-lg font-bold leading-tight">{filteredMemories.length.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Metro Grid */}
            {filteredMemories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-4">photo_library</span>
                <p className="text-slate-500 mb-4">{t('gallery.no_photos', 'No photos yet')}</p>
                <button
                  onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                  className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20"
                >
                  {t('gallery.upload_first', 'Upload Your First Memory')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4" style={{ gridAutoRows: '220px', gridAutoFlow: 'dense' }}>
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

                {/* Add New Memory Card */}
                <div
                  className="metro-item-square group relative overflow-hidden rounded-3xl cursor-pointer gallery-card"
                  onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                >
                  <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700">
                    <span className="material-symbols-outlined text-4xl text-slate-400 group-hover:text-primary transition-colors">add_circle</span>
                  </div>
                  <div className="card-overlay absolute inset-0 bg-primary/20 opacity-0 transition-opacity duration-300 flex items-center justify-center z-30">
                    <span className="text-white font-bold text-xs">{t('gallery.add_new', 'Add New Memory')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Image Detail Popup */}
      {selectedMemory && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-slate-900/40 backdrop-blur-xl">
          {/* Close button */}
          <button
            className="absolute top-6 end-6 w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md transition-all flex items-center justify-center z-[210]"
            onClick={() => setSelectedMemory(null)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          <div className="relative w-full max-w-7xl h-[85vh] bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden flex flex-row">
            {/* Image Area */}
            <div className="relative w-[68%] bg-slate-100 dark:bg-black/20 flex items-center justify-center group overflow-hidden">
              <img
                alt={selectedMemory.caption || selectedMemory.original_filename}
                className="w-full h-full object-contain"
                src={selectedMemory.imageUrl}
              />
              {/* Prev / Next Arrows */}
              {selectedIndex > 0 && (
                <button
                  className="absolute start-6 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                  onClick={() => navigateMemory('prev')}
                >
                  <span className="material-symbols-outlined text-3xl">chevron_left</span>
                </button>
              )}
              {selectedIndex < filteredMemories.length - 1 && (
                <button
                  className="absolute end-6 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                  onClick={() => navigateMemory('next')}
                >
                  <span className="material-symbols-outlined text-3xl">chevron_right</span>
                </button>
              )}
            </div>

            {/* Details Panel */}
            <div className="w-[32%] border-s border-slate-100 dark:border-slate-800 flex flex-col h-full">
              <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
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

                {/* Linked Member */}
                {selectedMemory.linked_member_id && (
                  <div>
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                      {t('gallery.associated_member', 'Associated Member')}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
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
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">image_search</span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  {reviewPopup.mode === 'create'
                    ? t('gallery.review_details', 'Review Memory Details')
                    : t('gallery.edit_memory', 'Edit Memory Details')}
                </h3>
              </div>
              <button
                onClick={handleReviewDiscard}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
              {/* Image Preview */}
              <div className="relative group rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-inner border border-slate-200 dark:border-slate-700">
                <img
                  alt="Memory Preview"
                  className="w-full aspect-[4/3] object-cover"
                  src={reviewPopup.imageUrl}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
                  {t('gallery.description', 'Description')}
                </label>
                <textarea
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 resize-none outline-none"
                  placeholder={t('gallery.description_placeholder', 'Tell the story behind this photo... Who is in it? What happened that day?')}
                  rows={5}
                  value={reviewPopup.caption}
                  onChange={e => setReviewPopup(prev => ({ ...prev, caption: e.target.value }))}
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
                  {t('gallery.date_of_event', 'Date of Event')}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">calendar_today</span>
                  <input
                    className="w-full ps-10 pe-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    type="date"
                    value={reviewPopup.photoDate}
                    onChange={e => setReviewPopup(prev => ({ ...prev, photoDate: e.target.value }))}
                  />
                </div>
                <p className="text-[10px] text-slate-400 px-1 mt-1">
                  {t('gallery.date_hint', 'Leave blank if the exact date is unknown.')}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-3">
              <button
                onClick={handleReviewDiscard}
                className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {t('gallery.discard', 'Discard')}
              </button>
              <button
                onClick={handleReviewSave}
                disabled={reviewSaving}
                className="px-8 py-2.5 bg-primary text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
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
