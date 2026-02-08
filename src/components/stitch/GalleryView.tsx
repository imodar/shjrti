import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

interface StitchGalleryViewProps {
  familyId: string;
  familyMembers: Member[];
}

interface MemoryWithUrl extends FamilyMemory {
  imageUrl: string;
}

const ITEMS_PER_PAGE = 12;

const getImageUrl = (filePath: string): string => {
  const { data } = supabase.storage.from('family-memories').getPublicUrl(filePath);
  return data.publicUrl;
};

const getMetroClass = (index: number): string => {
  const pattern = [
    'metro-item-large',
    'metro-item-square',
    'metro-item-tall',
    'metro-item-wide',
    'metro-item-square',
    'metro-item-square',
  ];
  return pattern[index % pattern.length];
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
  const [currentPage, setCurrentPage] = useState(1);

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

  // Pagination
  const totalPages = Math.max(1, Math.ceil(memories.length / ITEMS_PER_PAGE));
  const paginatedMemories = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return memories.slice(start, start + ITEMS_PER_PAGE);
  }, [memories, currentPage]);

  // Upload handler
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!familyId || acceptedFiles.length === 0) return;
    setUploading(true);
    try {
      for (const file of acceptedFiles) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${familyId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('family-memories').upload(filePath, file);
        if (uploadError) throw uploadError;
        await memoriesApi.createFamilyMemory({
          family_id: familyId,
          file_path: filePath,
          original_filename: file.name,
          content_type: file.type,
          file_size: file.size,
        });
      }
      sonnerToast.success(t('gallery.upload_success', 'Photos uploaded successfully'));
      loadMemories();
    } catch (error) {
      console.error('Upload error:', error);
      sonnerToast.error(t('gallery.upload_error', 'Failed to upload photos'));
    } finally {
      setUploading(false);
    }
  }, [familyId, loadMemories, t]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    maxSize: 10 * 1024 * 1024,
    noClick: true,
    noDrag: false,
  });

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

  const navigateMemory = (direction: 'prev' | 'next') => {
    if (selectedIndex < 0) return;
    const list = paginatedMemories;
    const newIndex = direction === 'next'
      ? Math.min(selectedIndex + 1, list.length - 1)
      : Math.max(selectedIndex - 1, 0);
    setSelectedIndex(newIndex);
    setSelectedMemory(list[newIndex]);
  };

  const openMemory = (memory: MemoryWithUrl, index: number) => {
    setSelectedMemory(memory);
    setSelectedIndex(index);
  };

  // Pagination helpers
  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <>
      <div {...getRootProps()} className="flex-1 overflow-y-auto custom-scrollbar">
        <input {...getInputProps()} />
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
                  <p className="text-lg font-bold leading-tight">{memories.length.toLocaleString()}</p>
                </div>
              </div>
              <button
                onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                className="bg-primary text-white px-6 py-2 rounded-xl shadow-lg shadow-primary/20 font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-all"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-lg">grid_view</span>
                )}
                {t('gallery.layout', 'Layout')}
              </button>
            </div>
          </div>

          {/* Metro Grid */}
          {memories.length === 0 ? (
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
            <>
              <div className="metro-grid">
                {paginatedMemories.map((memory, index) => {
                  const metroClass = getMetroClass(index);
                  const isLarge = metroClass === 'metro-item-large' || metroClass === 'metro-item-wide';

                  return (
                    <div
                      key={memory.id}
                      className={`${metroClass} group relative overflow-hidden rounded-3xl shadow-md cursor-pointer gallery-card`}
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
                          <p className={`${isLarge ? 'text-[11px]' : 'text-[10px]'} font-medium opacity-90 mt-0.5 flex items-center gap-2`}>
                            <span>{new Date(memory.photo_date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
                          </p>
                        )}
                      </div>
                      {/* Hover overlay with actions */}
                      <div className="card-overlay absolute inset-0 bg-black/40 opacity-0 transition-opacity duration-300 flex flex-col justify-start p-3 z-30">
                        <div className="flex justify-end gap-2">
                          <button
                            className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md hover:bg-primary transition-colors flex items-center justify-center text-white"
                            onClick={e => { e.stopPropagation(); /* edit */ }}
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
                  <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl">
                    <span className="material-symbols-outlined text-4xl text-slate-400 group-hover:text-primary transition-colors">add_circle</span>
                  </div>
                  <div className="card-overlay absolute inset-0 bg-primary/20 opacity-0 transition-opacity duration-300 flex items-center justify-center z-30 rounded-3xl">
                    <span className="text-white font-bold text-xs">{t('gallery.add_new', 'Add New Memory')}</span>
                  </div>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center py-12">
                  <nav className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <button
                      className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-30"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    {getPageNumbers().map((page, i) =>
                      page === '...' ? (
                        <span key={`dots-${i}`} className="px-2 text-slate-300">...</span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page as number)}
                          className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-colors ${
                            currentPage === page
                              ? 'bg-primary text-white'
                              : 'text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                    <button
                      className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-30"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Image Detail Popup */}
      {selectedMemory && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-slate-900/40 backdrop-blur-xl">
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
              {selectedIndex > 0 && (
                <button
                  className="absolute start-6 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                  onClick={() => navigateMemory('prev')}
                >
                  <span className="material-symbols-outlined text-3xl">chevron_left</span>
                </button>
              )}
              {selectedIndex < paginatedMemories.length - 1 && (
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
                <div className="mb-8">
                  <span className="inline-block px-2 py-1 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-3">
                    {t('gallery.family_history', 'Family History')}
                  </span>
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight mb-3">
                    {selectedMemory.caption || selectedMemory.original_filename}
                  </h2>
                </div>

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
                  <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
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
    </>
  );
};

export default StitchGalleryView;
