import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useFamilyData } from '@/contexts/FamilyDataContext';
import { StitchHeader, StitchSidebar, StitchRightPanel, StitchMainContent } from '@/components/stitch';
import { cn } from '@/lib/utils';

/**
 * FamilyBuilderStitch - Stitch theme variant of FamilyBuilderNew
 * This component wraps the Stitch UI layout around the same family data
 */
const FamilyBuilderStitch: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { user } = useAuth();
  const { t, direction } = useLanguage();
  const { subscription } = useSubscription();
  
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
    // TODO: Open member profile or edit mode
  };

  const handleAddMember = () => {
    // TODO: Open add member form
    navigate('/family-builder-new?mode=add');
  };

  const handleTabChange = (tab: string) => {
    // Navigation is handled in StitchHeader
  };

  // Get user display name
  const userName = user?.user_metadata?.first_name || 
                   user?.email?.split('@')[0] || 
                   'User';

  // Get package name
  const packageName = subscription?.package_name?.en || 
                      subscription?.status || 
                      'Free Plan';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className={cn(
      'min-h-screen overflow-hidden',
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

      {/* Main Layout */}
      <main className="stitch-layout">
        {/* Left Sidebar - Members List */}
        <StitchSidebar
          members={filteredMembers.map(m => ({
            id: m.id,
            name: m.name || `${m.first_name} ${m.last_name}`,
            first_name: m.first_name,
            last_name: m.last_name,
            image_url: m.image_url,
            gender: m.gender,
            is_founder: m.is_founder,
            role: m.is_founder ? 'Founder' : undefined
          }))}
          totalCount={stats.totalMembers}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onMemberClick={handleMemberClick}
          onAddMember={handleAddMember}
          selectedMemberId={selectedMemberId}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
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
        />

        {/* Right Panel - Stats */}
        <StitchRightPanel
          completenessPercentage={stats.completeness}
          generationsCount={stats.generations}
          documentsCount={stats.documents}
          pendingSuggestions={0}
        />
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
