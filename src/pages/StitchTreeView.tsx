import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
 import { useSearchParams, useNavigate } from 'react-router-dom';
 import { useTheme } from '@/contexts/ThemeContext';
 import { useAuth } from '@/contexts/AuthContext';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { useSubscription } from '@/contexts/SubscriptionContext';
 import { useFamilyData } from '@/contexts/FamilyDataContext';
 import { StitchFamilyBar } from '@/components/stitch';
 import { useStitchLayout } from '@/components/stitch/StitchLayout';
 import { StitchTreeCanvas } from '@/components/stitch/TreeCanvas';
  import { cn } from '@/lib/utils';
  import { isMemberFromFamily } from '@/lib/memberDisplayUtils';
  import type { Member } from '@/types/family.types';
 
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
  const [selectedRootMarriage, setSelectedRootMarriage] = useState<string>('all');
 
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
       navigate(`/family-builder?family=${familyId}`);
     }
   }, [navigate, searchParams]);
 
   // Get user display name
   const userName = user?.user_metadata?.first_name || 
                    user?.email?.split('@')[0] || 
                    'User';
 
   // Get package name
   const packageName = subscription?.package_name;
 
  // Generate root options from marriages with lineage display
  const rootOptions = useMemo(() => {
    if (!marriages || marriages.length === 0) return [];
    
    const getLineageLabel = (member: Member | undefined): string => {
      if (!member) return t('tree_view.unknown', 'غير معروف');
      const firstName = member.first_name || member.name?.split(' ')[0] || member.name || '';
      const isFromFamily = isMemberFromFamily(member, familyMembers);
      
      if (isFromFamily) {
        // Family member: show "name ابن/بنت parent_name"
        const fatherId = member.father_id || (member as any).fatherId;
        const father = fatherId ? familyMembers.find(m => m.id === fatherId) : undefined;
        if (father && !member.is_founder) {
          const parentName = father.first_name || father.name?.split(' ')[0] || father.name || '';
          const term = member.gender === 'female' ? 'بنت' : 'ابن';
          return `${firstName} ${term} ${parentName}`;
        }
        return firstName;
      } else {
        // External spouse: show "name + last_name"
        if (member.last_name) {
          return `${firstName} ${member.last_name}`;
        }
        return firstName;
      }
    };

    return marriages.map(marriage => {
      const husband = familyMembers.find(m => m.id === marriage.husband_id);
      const wife = familyMembers.find(m => m.id === marriage.wife_id);
      
      const husbandLabel = getLineageLabel(husband);
      const wifeLabel = getLineageLabel(wife);
      
      // Heart icon: active marriage = ❤️, divorced/inactive = 💔
      const isActive = marriage.is_active !== false && (marriage as any).marital_status !== 'divorced';
      const heartIcon = isActive ? '❤️' : '💔';
      
      return {
        id: marriage.id,
        label: `${husbandLabel} ${heartIcon} ${wifeLabel}`
      };
    });
  }, [marriages, familyMembers, t]);

  // Handle root change
  const handleRootChange = useCallback((rootId: string) => {
    setSelectedRootMarriage(rootId);
    setZoomLevel(1); // Reset zoom when changing root
  }, []);

  // Sync header overrides with layout
  const { setHeaderOverrides } = useStitchLayout();
  useEffect(() => {
    setHeaderOverrides({
      familyName: familyData?.name,
    });
  }, [familyData?.name, setHeaderOverrides]);

   if (loading) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
       </div>
     );
   }
 
   return (
     <div className="min-h-screen overflow-hidden">
 
      {/* Family Bar - Unified with Builder */}
      <StitchFamilyBar
        familyName={familyData?.name || 'Family'}
        onSwitchTree={() => navigate('/dashboard')}
        showRootSelector={true}
        rootOptions={rootOptions}
        selectedRoot={selectedRootMarriage}
        onRootChange={handleRootChange}
      />
 
       {/* Main Tree Canvas */}
       <StitchTreeCanvas
         familyMembers={familyMembers}
         marriages={marriages}
         zoomLevel={zoomLevel}
         viewMode={viewMode}
         onZoomIn={handleZoomIn}
         onZoomOut={handleZoomOut}
         onResetZoom={handleResetZoom}
          selectedRootMarriage={selectedRootMarriage}
       />
 
      </div>
   );
 };
 
 export default StitchTreeView;