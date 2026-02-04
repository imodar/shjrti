import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StitchHeader } from '@/components/stitch';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';

interface FamilyWithCount {
  id: string;
  name: string;
  updated_at: string;
  memberCount: number;
}

interface PackageData {
  max_family_trees: number | null;
  max_family_members: number | null;
  name: Record<string, string> | string;
}

const StitchDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { direction } = useLanguage();
  const { subscription } = useSubscription();
  
  const [families, setFamilies] = useState<FamilyWithCount[]>([]);
  const [packageData, setPackageData] = useState<PackageData | null>(null);
  const [loading, setLoading] = useState(true);

  const displayName = user?.email?.split('@')[0] || 'User';
  const totalMembers = families.reduce((acc, f) => acc + (f.memberCount || 0), 0);
  const maxTrees = packageData?.max_family_trees || 3;
  const maxMembers = packageData?.max_family_members || 500;
  const treesUsed = families.length;
  const packageName = typeof packageData?.name === 'object' 
    ? (packageData.name as Record<string, string>)?.en || 'Free Plan'
    : packageData?.name || subscription?.package_name?.en || 'Free Plan';

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      
      try {
        // Fetch families
        const { data: familiesData, error: familiesError } = await supabase
          .from('families')
          .select('id, name, updated_at')
          .eq('creator_id', user.id)
          .order('updated_at', { ascending: false });

        if (familiesError) {
          console.error('Error fetching families:', familiesError);
        } else {
          // Get member counts for each family
          const familiesWithCounts = await Promise.all(
            (familiesData || []).map(async (family) => {
              const { count } = await supabase
                .from('family_tree_members')
                .select('id', { count: 'exact', head: true })
                .eq('family_id', family.id);

              return {
                ...family,
                memberCount: count || 0
              };
            })
          );
          setFamilies(familiesWithCounts);
        }

        // Fetch package data from user subscription
        const { data: subData, error: subError } = await supabase
          .from('user_subscriptions')
          .select('package_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (!subError && subData?.package_id) {
          const { data: pkgData } = await supabase
            .from('packages')
            .select('name, max_family_trees, max_family_members')
            .eq('id', subData.package_id)
            .single();

          if (pkgData) {
            setPackageData(pkgData as PackageData);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const handleCreateTree = () => {
    navigate('/family-creator');
  };

  const handleManageTree = (familyId: string) => {
    navigate(`/family-builder-new?familyId=${familyId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      <StitchHeader activeTab="dashboard" />
      
      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Hero Section */}
        <section className="hero-glass rounded-[2.5rem] p-12 mb-12 shadow-xl shadow-slate-200/50 relative overflow-hidden border border-white dark:border-border">
          <div className="absolute inset-0 flex items-center justify-center tree-silhouette">
            <span className="material-symbols-outlined text-[40rem] text-primary">park</span>
          </div>
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold mb-6">
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                Personal Workspace
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 tracking-tight">
                Welcome back, <span className="text-primary">{displayName}</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-10 max-w-lg">
                Your family legacy continues to grow. You have documented <span className="text-foreground font-bold">{totalMembers} relatives</span> across your family trees.
              </p>
              
              <div className="space-y-6 max-w-md">
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    <span>Tree Slots</span>
                    <span className="text-foreground">{treesUsed} / {maxTrees} Trees ({Math.round((treesUsed / maxTrees) * 100)}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full shadow-[0_0_10px_hsl(var(--primary)/0.3)]" 
                      style={{ width: `${Math.min((treesUsed / maxTrees) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    <span>Member Limit</span>
                    <span className="text-foreground">{totalMembers} / {maxMembers} Members</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent-gold rounded-full shadow-[0_0_10px_rgba(217,161,92,0.3)]" 
                      style={{ width: `${Math.min((totalMembers / maxMembers) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full lg:w-80">
              <div className="bg-card rounded-3xl p-8 shadow-2xl shadow-slate-200/60 dark:shadow-none border border-border relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                <div className="relative z-10 text-center">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-3xl">verified</span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">{packageName}</h3>
                  <p className="text-sm text-muted-foreground mb-6">{treesUsed} of {maxTrees} Trees Used</p>
                  <button 
                    onClick={() => navigate('/plan-selection')}
                    className="w-full gold-gradient-btn text-white font-bold py-4 rounded-xl text-sm shadow-lg shadow-accent-gold/30 mb-4"
                  >
                    Upgrade Plan
                  </button>
                  {subscription?.expires_at && (
                    <p className="text-[10px] text-muted-foreground font-medium italic">
                      Renews on {new Date(subscription.expires_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Family Trees Section */}
        <div className="mb-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-foreground">My Family Trees</h3>
              <p className="text-muted-foreground mt-1">Curate and maintain your family lineages</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-card border border-border rounded-lg p-1">
                <button className="p-1.5 bg-muted rounded text-foreground">
                  <span className="material-symbols-outlined text-xl">grid_view</span>
                </button>
                <button className="p-1.5 text-muted-foreground hover:text-foreground">
                  <span className="material-symbols-outlined text-xl">view_list</span>
                </button>
              </div>
              <button className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground bg-card px-4 py-2 border border-border rounded-lg transition-colors">
                <span className="material-symbols-outlined text-lg">filter_list</span>
                Filter
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Family Trees first */}
            {families.map((family) => (
              <div 
                key={family.id}
                className="bg-card border border-border rounded-3xl p-8 shadow-sm hover:shadow-md transition-all flex flex-col"
              >
                <div className="flex justify-between items-start mb-8">
                  <div className="w-14 h-14 bg-primary/5 text-primary rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl">park</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-muted border border-border rounded-full">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Active Tree</span>
                  </div>
                </div>
                <h4 className="text-2xl font-bold text-foreground mb-1">{family.name}</h4>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-6">
                  ID: {family.id.substring(0, 8).toUpperCase()}
                </p>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-muted rounded-xl p-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Members</p>
                    <p className="text-lg font-bold text-foreground">{family.memberCount || 0}</p>
                  </div>
                  <div className="bg-muted rounded-xl p-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Updated</p>
                    <p className="text-lg font-bold text-primary">
                      {family.updated_at ? new Date(family.updated_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="mt-auto flex gap-3">
                  <button 
                    onClick={() => handleManageTree(family.id)}
                    className="flex-1 bg-primary text-primary-foreground font-bold py-3 rounded-xl text-sm hover:bg-primary/90 transition-all"
                  >
                    Manage
                  </button>
                  <button className="px-3 border border-border text-muted-foreground rounded-xl hover:bg-muted">
                    <span className="material-symbols-outlined">share</span>
                  </button>
                </div>
              </div>
            ))}

            {/* Create New Tree Card - always last (leftmost in RTL, rightmost in LTR) */}
            <button 
              onClick={handleCreateTree}
              className="dashed-card bg-card rounded-3xl p-10 flex flex-col items-center justify-center text-center gap-6 min-h-[340px] group"
            >
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/5 transition-all duration-300">
                <span className="material-symbols-outlined text-5xl">add</span>
              </div>
              <div>
                <h4 className="text-xl font-bold text-foreground mb-2">Create New Tree</h4>
                <p className="text-muted-foreground text-sm max-w-[200px] leading-relaxed">Start a new lineage and begin documenting your heritage.</p>
              </div>
            </button>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20 pt-12 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="flex gap-5">
            <div className="w-12 h-12 bg-card rounded-xl shadow-sm border border-border flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-blue-500">verified_user</span>
            </div>
            <div>
              <h5 className="font-bold text-foreground mb-2">Secure & Private</h5>
              <p className="text-muted-foreground text-sm leading-relaxed">Your family data is encrypted and only visible to you and your invited members.</p>
            </div>
          </div>
          <div className="flex gap-5">
            <div className="w-12 h-12 bg-card rounded-xl shadow-sm border border-border flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-accent-gold">lightbulb</span>
            </div>
            <div>
              <h5 className="font-bold text-foreground mb-2">Build Together</h5>
              <p className="text-muted-foreground text-sm leading-relaxed">Invite siblings and cousins to contribute photos and stories to your shared tree.</p>
            </div>
          </div>
          <div className="flex gap-5">
            <div className="w-12 h-12 bg-card rounded-xl shadow-sm border border-border flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary">support_agent</span>
            </div>
            <div>
              <h5 className="font-bold text-foreground mb-2">Expert Support</h5>
              <p className="text-muted-foreground text-sm leading-relaxed">Need help tracing your roots? Our genealogy experts are here to assist you.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-border mt-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
              <span className="material-symbols-outlined text-muted-foreground text-lg">park</span>
            </div>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[2px]">© 2024 Shjrti Platform</p>
          </div>
          <nav className="flex gap-8">
            <a className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors" href="/privacy-policy">Privacy</a>
            <a className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors" href="/terms-conditions">Terms</a>
            <a className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors" href="/api-docs">API docs</a>
            <a className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors" href="/contact">Support</a>
          </nav>
        </div>
      </footer>

      {/* Mobile FAB */}
      <button 
        onClick={handleCreateTree}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-2xl flex items-center justify-center z-50"
      >
        <span className="material-symbols-outlined">add</span>
      </button>
    </div>
  );
};

export default StitchDashboard;
