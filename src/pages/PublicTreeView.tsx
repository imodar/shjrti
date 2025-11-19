import React, { useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooterSimplified } from "@/components/GlobalFooterSimplified";
import { SuggestEditDialog } from "@/components/SuggestEditDialog";
import { FamilyMembersList } from "@/components/FamilyMembersList";
import { FamilyStatisticsView } from "@/components/FamilyStatisticsView";
import { FamilyGalleryView } from "@/components/FamilyGalleryView";
import { PublicFamilyHeader } from "@/components/PublicFamilyHeader";
import { FamilyOverview } from "@/components/FamilyOverview";
import { OrganizationalChart } from "@/components/OrganizationalChart";
import { ZoomIn, ZoomOut, Maximize, Minimize, Check, ChevronsUpDown } from "lucide-react";
import { MemberProfileModal } from "@/components/MemberProfileModal";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFamilyData } from "@/contexts/FamilyDataContext";

interface PublicTreeViewProps {
  shareToken?: string | null;
}

const PublicTreeView = ({ shareToken }: PublicTreeViewProps = {}) => {
  const isMobile = useIsMobile();
  const { direction } = useLanguage();
  const { familyData, familyMembers, marriages: familyMarriages } = useFamilyData();
  
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeSection, setActiveSection] = useState('overview');
  const [selectedRootMarriage, setSelectedRootMarriage] = useState<string>("all");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);
  const traditionalRef = useRef<HTMLDivElement>(null);
  const [suggestEditOpen, setSuggestEditOpen] = useState(false);
  const [suggestEditMemberId, setSuggestEditMemberId] = useState<string>("");
  const [selectedMemberName, setSelectedMemberName] = useState<string>("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.25));
  const handleResetZoom = () => setZoomLevel(1);

  const generationCount = useMemo(() => {
    if (familyMembers.length === 0) return 0;
    const founders = familyMembers.filter((m: any) => !m.father_id && !m.mother_id);
    if (founders.length === 0) return 1;
    let maxGen = 0;
    const getGeneration = (member: any, visited = new Set()): number => {
      if (visited.has(member.id)) return 0;
      visited.add(member.id);
      if (!member.father_id && !member.mother_id) return 0;
      const children = familyMembers.filter((m: any) => m.father_id === member.id || m.mother_id === member.id);
      if (children.length === 0) return 0;
      return 1 + Math.max(...children.map(c => getGeneration(c, visited)));
    };
    founders.forEach(f => { maxGen = Math.max(maxGen, getGeneration(f)); });
    return maxGen + 1;
  }, [familyMembers]);

  const handleMemberClick = (member: any) => setSelectedMemberId(member.id);
  const handleSuggestEdit = (memberId: string, memberName: string) => {
    setSuggestEditMemberId(memberId);
    setSelectedMemberName(memberName);
    setSuggestEditOpen(true);
  };

  const marriageOptions = useMemo(() => {
    const options = [{ value: "all", label: "عرض الشجرة الكاملة" }];
    familyMarriages.filter(m => m.is_active).forEach(marriage => {
      const husband = familyMembers.find(m => m.id === marriage.husband_id);
      const wife = familyMembers.find(m => m.id === marriage.wife_id);
      if (husband && wife) {
        options.push({ value: marriage.id, label: `عائلة ${husband.name} و ${wife.name}` });
      }
    });
    return options;
  }, [familyMarriages, familyMembers]);

  const selectedLabel = marriageOptions.find(opt => opt.value === selectedRootMarriage)?.label || "اختر زواجاً لعرضه";

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      traditionalRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const familyUnits = useMemo(() => {
    const units = new Map();
    let relevantMemberIds = new Set<string>();
    let marriagesToShow: any[] = [];
    
    if (selectedRootMarriage === "all") {
      familyMembers.forEach(m => relevantMemberIds.add(m.id));
      marriagesToShow = familyMarriages;
    } else {
      const rootMarriage = familyMarriages.find(m => m.id === selectedRootMarriage);
      if (rootMarriage) {
        relevantMemberIds.add(rootMarriage.husband_id);
        relevantMemberIds.add(rootMarriage.wife_id);
        const queue = [rootMarriage.husband_id, rootMarriage.wife_id];
        const visited = new Set<string>();
        while (queue.length > 0) {
          const currentId = queue.shift();
          if (!currentId || visited.has(currentId)) continue;
          visited.add(currentId);
          familyMembers.forEach((member: any) => {
            if (member.father_id === currentId || member.mother_id === currentId) {
              relevantMemberIds.add(member.id);
              queue.push(member.id);
            }
          });
        }
        marriagesToShow = familyMarriages.filter(m => relevantMemberIds.has(m.husband_id) && relevantMemberIds.has(m.wife_id));
      }
    }

    const relevantMembers = familyMembers.filter((m: any) => relevantMemberIds.has(m.id));
    marriagesToShow.forEach((marriage: any) => {
      if (!marriage.is_active) return;
      const husband = relevantMembers.find((m: any) => m.id === marriage.husband_id);
      const wife = relevantMembers.find((m: any) => m.id === marriage.wife_id);
      if (husband && wife) {
        units.set(marriage.id, { id: marriage.id, type: 'married', members: [husband, wife], generation: 0, childUnits: [] });
      }
    });

    relevantMembers.forEach((member: any) => {
      const isInMarriage = Array.from(units.values()).some((unit: any) => unit.members.some((m: any) => m.id === member.id));
      if (!isInMarriage) {
        units.set(`single-${member.id}`, { id: `single-${member.id}`, type: 'single', members: [member], generation: 0, childUnits: [] });
      }
    });

    const roots: string[] = [];
    units.forEach((u: any, id) => {
      const hasParent = u.members.some((m: any) => {
        return Array.from(units.values()).some((cand: any) => cand.members.some((x: any) => x.id === m.father_id || x.id === m.mother_id));
      });
      if (!hasParent) roots.push(id);
    });

    const q = roots.map(id => ({ id, gen: 0 }));
    const seen = new Set<string>();
    while (q.length) {
      const { id, gen } = q.shift()!;
      if (seen.has(id)) continue;
      seen.add(id);
      const u = units.get(id);
      if (!u) continue;
      u.generation = gen;
      relevantMembers.forEach((member: any) => {
        const parentIds = u.members.map((mm: any) => mm.id);
        if (parentIds.includes(member.father_id) || parentIds.includes(member.mother_id)) {
          units.forEach((childUnit: any, childId) => {
            if (childUnit.members.some((mm: any) => mm.id === member.id) && childId !== id) {
              childUnit.parentUnitId = id;
              childUnit.generation = gen + 1;
              if (!u.childUnits.includes(childId)) u.childUnits.push(childId);
              q.push({ id: childId, gen: gen + 1 });
            }
          });
        }
      });
    }
    return units;
  }, [familyMembers, familyMarriages, selectedRootMarriage]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" dir={direction}>
      <GlobalHeader />
      <main className="flex-1 flex flex-col py-8">
        <PublicFamilyHeader 
          familyData={familyData} 
          familyMembers={familyMembers} 
          generationCount={generationCount} 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
          showGallery={familyData?.share_gallery || false}
        />
        <div className="flex-1 flex flex-col">
          {activeSection === 'overview' && (
            <div className="container mx-auto px-4 sm:px-6 pb-6">
              <FamilyOverview familyData={familyData} familyMembers={familyMembers} generationCount={generationCount} />
            </div>
          )}
          {activeSection === 'tree' && (
            <div className="container mx-auto px-4 sm:px-6 pb-6">
              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={handleZoomIn}><ZoomIn className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={handleZoomOut}><ZoomOut className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={handleResetZoom}>إعادة ضبط</Button>
                <Button variant="outline" size="sm" onClick={handleToggleFullscreen}>{isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}</Button>
                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                  <PopoverTrigger asChild><Button variant="outline">{selectedLabel}<ChevronsUpDown className="ml-2 h-4 w-4" /></Button></PopoverTrigger>
                  <PopoverContent><Command><CommandInput placeholder="بحث..." /><CommandEmpty>لا نتائج</CommandEmpty><CommandList><CommandGroup>{marriageOptions.map(opt => <CommandItem key={opt.value} onSelect={() => { setSelectedRootMarriage(opt.value); setOpenCombobox(false); }}><Check className={cn("ml-2 h-4 w-4", selectedRootMarriage === opt.value ? "opacity-100" : "opacity-0")} />{opt.label}</CommandItem>)}</CommandGroup></CommandList></Command></PopoverContent>
                </Popover>
              </div>
              <div ref={traditionalRef}><OrganizationalChart familyUnits={familyUnits} zoomLevel={zoomLevel} onSuggestEdit={handleSuggestEdit} isPublicView={true} /></div>
            </div>
          )}
          {activeSection === 'members' && <div className="container mx-auto px-4 sm:px-6 pb-6"><FamilyMembersList familyMembers={familyMembers} familyMarriages={familyMarriages} readOnly={true} onMemberClick={handleMemberClick} /></div>}
          {activeSection === 'statistics' && <div className="container mx-auto px-4 sm:px-6 pb-6"><FamilyStatisticsView familyMembers={familyMembers} familyMarriages={familyMarriages} /></div>}
          {activeSection === 'gallery' && familyData?.share_gallery && <div className="container mx-auto px-4 sm:px-6 pb-6"><FamilyGalleryView familyId={familyData?.id || ''} readOnly={true} /></div>}
        </div>
      </main>
      <GlobalFooterSimplified />
      <MemberProfileModal isOpen={!!selectedMemberId} onClose={() => setSelectedMemberId(null)} memberId={selectedMemberId} familyId={familyData?.id || ''} onEdit={() => {}} onDelete={() => {}} />
      <SuggestEditDialog isOpen={suggestEditOpen} onClose={() => setSuggestEditOpen(false)} memberId={suggestEditMemberId} memberName={selectedMemberName} familyId={familyData?.id || ''} />
    </div>
  );
};

export default PublicTreeView;
