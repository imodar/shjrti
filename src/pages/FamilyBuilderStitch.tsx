import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useFamilyData } from '@/contexts/FamilyDataContext';
import { subscriptionsApi } from '@/lib/api';
import { StitchHeader, StitchFamilyBar, StitchSidebar, StitchRightPanel, StitchMainContent } from '@/components/stitch';
import { cn } from '@/lib/utils';

/**
 * FamilyBuilderStitch - Stitch theme variant of FamilyBuilderNew
 * This component wraps the Stitch UI layout around the same family data
 */
const FamilyBuilderStitch: React.FC = () => {
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
    console.log('[FamilyBuilderStitch] Applying stitch theme, current:', currentTheme);
    // Only save the previous theme on initial mount
    if (currentTheme !== 'stitch') {
      previousThemeRef.current = currentTheme;
    }
    // Set theme in context (used elsewhere in the app)
    setCurrentTheme('stitch');

    // Force DOM theme class immediately to ensure Stitch CSS selectors apply
    // (This page relies heavily on `.theme-stitch .stitch-*` selectors.)
    const html = document.documentElement;
    html.classList.remove('theme-modern', 'theme-professional');
    html.classList.add('theme-stitch');
    
    // Verify theme was applied
    setTimeout(() => {
      console.log('[FamilyBuilderStitch] HTML classes:', document.documentElement.classList.toString());
    }, 100);
    
    return () => {
      // Restore previous theme when leaving
      console.log('[FamilyBuilderStitch] Restoring theme to:', previousThemeRef.current);
      if (previousThemeRef.current !== 'stitch') {
        setCurrentTheme(previousThemeRef.current);
      }

      // Best-effort restore DOM classes to match the previous theme
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
    refetch 
  } = useFamilyData();

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [editingMember, setEditingMember] = useState<any>(null);
  const [maxFamilyMembers, setMaxFamilyMembers] = useState<number | null>(null);

  // Fetch package limits
  useEffect(() => {
    const fetchPackageLimits = async () => {
      try {
        const sub = await subscriptionsApi.get();
        const pkg = sub?.packages;
        if (pkg?.max_family_members) {
          setMaxFamilyMembers(pkg.max_family_members);
        }
      } catch (error) {
        console.error('Error fetching package limits:', error);
      }
    };
    if (user) fetchPackageLimits();
  }, [user]);

  const canAddMember = maxFamilyMembers === null || familyMembers.length < maxFamilyMembers;

  // Filter members based on search
  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return familyMembers;
    
    const term = searchTerm.toLowerCase();
    return familyMembers.filter(member => {
      const fullName = `${member.first_name || ''} ${member.last_name || ''} ${member.name || ''}`.toLowerCase();
      return fullName.includes(term);
    });
  }, [familyMembers, searchTerm]);

  // Calculate stats
  const stats = useMemo(() => {
    const generations = new Set<number>();
    // Simple generation calculation
    let maxGen = 1;
    familyMembers.forEach(m => {
      if (m.is_founder) maxGen = Math.max(maxGen, 1);
      // This is simplified - actual logic would traverse the tree
    });

    return {
      totalMembers: familyMembers.length,
      generations: maxGen,
      completeness: Math.min(100, Math.round((familyMembers.length / 100) * 100)),
      documents: 0 // Placeholder
    };
  }, [familyMembers]);

  // Mock activities (replace with real data)
  const recentActivities = useMemo(() => {
    // TODO: Fetch from activity log
    return [
      {
        id: '1',
        type: 'edit' as const,
        title: 'Modified',
        highlight: `${familyMembers[0]?.name || 'Member'}'s biography`,
        timestamp: '2 hours ago'
      },
      {
        id: '2',
        type: 'add' as const,
        title: 'Added',
        highlight: 'new family member',
        timestamp: 'Yesterday'
      }
    ];
  }, [familyMembers]);

  // Handlers
  const handleMemberClick = (member: any) => {
    setSelectedMemberId(member.id);
    setShowAddMemberForm(false);
  };

  const handleAddMember = () => {
    if (!canAddMember) {
      return;
    }
    setEditingMember(null);
    setFormMode('add');
    setShowAddMemberForm(true);
  };

  const handleCloseForm = () => {
    setShowAddMemberForm(false);
    setEditingMember(null);
  };

  const handleBackFromProfile = () => {
    setSelectedMemberId(undefined);
  };

  const handleMemberSaved = () => {
    refetch();
    setShowAddMemberForm(false);
    setEditingMember(null);
  };

  const handleTabChange = (tab: string) => {
    // Navigation is handled in StitchHeader
  };

  // Get selected member object
  const selectedMember = useMemo(() => {
    if (!selectedMemberId) return undefined;
    return familyMembers.find(m => m.id === selectedMemberId);
  }, [selectedMemberId, familyMembers]);

  // Get user display name
  const userName = user?.user_metadata?.first_name || 
                   user?.email?.split('@')[0] || 
                   'User';

  // Get package name - pass the full object for localization in Header
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
        activeTab="dashboard"
        onTabChange={handleTabChange}
        suggestionsCount={0}
      />

      {/* Family Bar - NEW */}
      <StitchFamilyBar
        familyName={familyData?.name || 'Al-Saeed'}
        onSwitchTree={() => navigate('/dashboard')}
        lastUpdated="2h ago"
      />

      {/* Main Layout */}
      <main className="flex h-[calc(100vh-120px)]">
        {/* Left Sidebar - Members List */}
        <StitchSidebar
          members={filteredMembers}
          totalCount={stats.totalMembers}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onMemberClick={handleMemberClick}
          onAddMember={handleAddMember}
          selectedMemberId={selectedMemberId}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          familyMembers={familyMembers}
          marriages={marriages}
          canAddMember={canAddMember}
          maxFamilyMembers={maxFamilyMembers}
        />

        {/* Main Content */}
        <StitchMainContent
          userName={userName}
          activities={recentActivities}
          milestones={[]}
          onExportTree={() => {/* TODO */}}
          onImportGedcom={() => {/* TODO */}}
          onFamilyStory={() => {/* TODO */}}
          onPrintPoster={() => {/* TODO */}}
          showAddMemberForm={showAddMemberForm}
          onCloseForm={handleCloseForm}
          familyMembers={familyMembers}
          marriages={marriages}
          familyId={searchParams.get('family') || ''}
          familyData={familyData}
          editingMember={editingMember}
          formMode={formMode}
          onMemberSaved={handleMemberSaved}
          selectedMember={selectedMember}
          onEditMember={() => {
            if (selectedMember) {
              setEditingMember(selectedMember);
              setFormMode('edit');
              setShowAddMemberForm(true);
            }
          }}
          onDeleteMember={() => {/* TODO: implement delete */}}
          onBackFromProfile={handleBackFromProfile}
          onMemberClick={handleMemberClick}
        />

        {/* Right Panel - Stats (hidden when adding member or viewing profile) */}
        {!showAddMemberForm && !selectedMember && (
          <StitchRightPanel
            completenessPercentage={stats.completeness}
            generationsCount={stats.generations}
            documentsCount={stats.documents}
            pendingSuggestions={0}
          />
        )}
      </main>

      {/* Mobile Overlay - Desktop Optimized Message */}
      <div className="fixed inset-0 bg-card z-[100] lg:hidden flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
          <span className="material-icons-round text-4xl">desktop_windows</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">Desktop Optimized</h2>
        <p className="text-muted-foreground mb-8 max-w-xs">
          Shjrti Dashboard is best experienced on a desktop or tablet.
        </p>
        <button 
          onClick={() => {
            // Hide overlay and show mobile version
            const overlay = document.querySelector('.lg\\:hidden.fixed.inset-0');
            if (overlay) overlay.classList.add('hidden');
          }}
          className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl"
        >
          Continue Anyway
        </button>
      </div>
    </div>
  );
};

export default FamilyBuilderStitch;
