 import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
 import { useSearchParams, useNavigate } from 'react-router-dom';
 import { useTheme } from '@/contexts/ThemeContext';
 import { useAuth } from '@/contexts/AuthContext';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { useSubscription } from '@/contexts/SubscriptionContext';
 import { useFamilyData } from '@/contexts/FamilyDataContext';
 import { StitchHeader, StitchFamilyBar } from '@/components/stitch';
 import { StitchTreeCanvas } from '@/components/stitch/TreeCanvas';
 import { cn } from '@/lib/utils';
 
 /**
  * StitchTreeView - Interactive tree visualization with Stitch theme
  */
 const StitchTreeView: React.FC = () => {
   const [searchParams] = useSearchParams();
   const navigate = useNavigate();
   const { currentTheme, setCurrentTheme } = useTheme();
   const { user } = useAuth();
   const { t, direction } = useLanguage();
   const { subscription } = useSubscription();
 
   // Save the previous theme on mount
   const previousThemeRef = useRef(currentTheme);
 
   // Apply stitch theme when entering this page
   useEffect(() => {
     if (currentTheme !== 'stitch') {
       previousThemeRef.current = currentTheme;
     }
     setCurrentTheme('stitch');
 
     const html = document.documentElement;
     html.classList.remove('theme-modern', 'theme-professional');
     html.classList.add('theme-stitch');
     
     return () => {
       if (previousThemeRef.current !== 'stitch') {
         setCurrentTheme(previousThemeRef.current);
       }
       const html = document.documentElement;
       html.classList.remove('theme-stitch');
       if (previousThemeRef.current === 'professional') html.classList.add('theme-professional');
       else html.classList.add('theme-modern');
     };
   }, [setCurrentTheme]);
   
   // Family data from context
   const { 
     familyData, 
     familyMembers, 
     marriages,
     loading,
   } = useFamilyData();
 
   // Zoom state
   const [zoomLevel, setZoomLevel] = useState(1);
   const [viewMode, setViewMode] = useState<'vertical' | 'horizontal' | 'radial'>('horizontal');
 
   // Zoom handlers
   const handleZoomIn = useCallback(() => {
     setZoomLevel(prev => Math.min(prev + 0.1, 2));
   }, []);
 
   const handleZoomOut = useCallback(() => {
     setZoomLevel(prev => Math.max(prev - 0.1, 0.3));
   }, []);
 
   const handleResetZoom = useCallback(() => {
     setZoomLevel(1);
   }, []);
 
   const handleAddMember = useCallback(() => {
     const familyId = searchParams.get('family');
     if (familyId) {
       navigate(`/family-builder-stitch?family=${familyId}`);
     }
   }, [navigate, searchParams]);
 
   // Get user display name
   const userName = user?.user_metadata?.first_name || 
                    user?.email?.split('@')[0] || 
                    'User';
 
   // Get package name
   const packageName = subscription?.package_name || { en: 'Free Plan', ar: 'باقة مجانية' };
 
   if (loading) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
       </div>
     );
   }
 
   return (
     <div className={cn(
       'theme-stitch min-h-screen overflow-hidden',
       direction === 'rtl' && 'rtl'
     )}>
       {/* Header */}
       <StitchHeader
         familyName={familyData?.name || 'Shjrti'}
         userName={userName}
         packageName={packageName}
         activeTab="tree"
         suggestionsCount={0}
       />
 
       {/* Tree View Bar */}
       <div className="h-14 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between px-8 z-40 relative">
         <div className="flex items-center gap-6">
           <div className="flex items-center gap-2">
             <span className="material-icons-round text-slate-400">family_history</span>
             <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
               {t('tree_view.family_branch', 'Family Branch')}: <span className="text-primary">{familyData?.name || 'Unknown'}</span>
             </span>
           </div>
           <div className="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>
           <div className="flex items-center gap-2">
             <span className="material-icons-round text-slate-400">group</span>
             <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
               {familyMembers.length} {t('tree_view.members', 'Members')}
             </span>
           </div>
         </div>
 
         <div className="flex items-center gap-3">
           {/* View Mode Toggle */}
           <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full flex items-center gap-4">
             <button 
               onClick={() => setViewMode('vertical')}
               className={cn(
                 "text-[11px] font-bold transition-colors",
                 viewMode === 'vertical' ? 'text-primary' : 'text-slate-400 hover:text-primary'
               )}
             >
               {t('tree_view.vertical', 'VERTICAL')}
             </button>
             <button 
               onClick={() => setViewMode('horizontal')}
               className={cn(
                 "text-[11px] font-bold transition-colors",
                 viewMode === 'horizontal' ? 'text-primary' : 'text-slate-400 hover:text-primary'
               )}
             >
               {t('tree_view.horizontal', 'HORIZONTAL')}
             </button>
             <button 
               onClick={() => setViewMode('radial')}
               className={cn(
                 "text-[11px] font-bold transition-colors",
                 viewMode === 'radial' ? 'text-primary' : 'text-slate-400 hover:text-primary'
               )}
             >
               {t('tree_view.radial', 'RADIAL')}
             </button>
           </div>
 
           {/* Add Member Button */}
           <button 
             onClick={handleAddMember}
             className="flex items-center gap-2 bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
           >
             <span className="material-icons-round text-sm">person_add</span>
             {t('tree_view.add_member', 'Add Member')}
           </button>
         </div>
       </div>
 
       {/* Main Tree Canvas */}
       <StitchTreeCanvas
         familyMembers={familyMembers}
         marriages={marriages}
         zoomLevel={zoomLevel}
         viewMode={viewMode}
         onZoomIn={handleZoomIn}
         onZoomOut={handleZoomOut}
         onResetZoom={handleResetZoom}
       />
 
       {/* Mobile Overlay */}
       <div className="fixed inset-0 bg-card z-[100] lg:hidden flex flex-col items-center justify-center p-8 text-center">
         <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
           <span className="material-icons-round text-4xl">desktop_windows</span>
         </div>
         <h2 className="text-2xl font-bold mb-2">{t('stitch.desktop_optimized', 'Desktop Optimized')}</h2>
         <p className="text-muted-foreground mb-8 max-w-xs">
           {t('stitch.tree_desktop_message', 'The interactive family tree view is designed for larger screens. Please switch to a desktop or tablet for the best experience.')}
         </p>
         <button 
           onClick={() => navigate('/stitch-dashboard')}
           className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl"
         >
           {t('stitch.go_to_dashboard', 'Go to Dashboard')}
         </button>
       </div>
     </div>
   );
 };
 
 export default StitchTreeView;