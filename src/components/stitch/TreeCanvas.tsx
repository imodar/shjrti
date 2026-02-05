 import React, { useMemo } from 'react';
 import { cn } from '@/lib/utils';
 import { Member, Marriage } from '@/types/family.types';
 import { StitchFamilyCard } from './FamilyCard';
 import { useLanguage } from '@/contexts/LanguageContext';
 
 interface StitchTreeCanvasProps {
   familyMembers: Member[];
   marriages: Marriage[];
   zoomLevel: number;
   viewMode: 'vertical' | 'horizontal' | 'radial';
   onZoomIn: () => void;
   onZoomOut: () => void;
   onResetZoom: () => void;
 }
 
 interface FamilyUnit {
   id: string;
   type: 'married' | 'single' | 'polygamy';
   husband?: Member;
   wives: Member[];
   children: Member[];
   isFounder: boolean;
   generation: number;
 }
 
 export const StitchTreeCanvas: React.FC<StitchTreeCanvasProps> = ({
   familyMembers,
   marriages,
   zoomLevel,
   viewMode,
   onZoomIn,
   onZoomOut,
   onResetZoom
 }) => {
   const { t } = useLanguage();
 
   // Build family units from members and marriages
   const familyUnits = useMemo(() => {
     const units: FamilyUnit[] = [];
     const processedMemberIds = new Set<string>();
 
     // Group marriages by husband to detect polygamy
     const marriagesByHusband = new Map<string, Marriage[]>();
     marriages.forEach(m => {
       const existing = marriagesByHusband.get(m.husband_id) || [];
       existing.push(m);
       marriagesByHusband.set(m.husband_id, existing);
     });
 
     // Process marriages
     marriagesByHusband.forEach((husbandMarriages, husbandId) => {
       const husband = familyMembers.find(m => m.id === husbandId);
       if (!husband) return;
 
       const wives = husbandMarriages
         .map(m => familyMembers.find(mem => mem.id === m.wife_id))
         .filter(Boolean) as Member[];
 
       // Find children of this unit
       const children = familyMembers.filter(m => 
         m.father_id === husbandId || 
         wives.some(w => m.mother_id === w.id)
       );
 
       const isFounder = husband.is_founder;
       const type = wives.length > 1 ? 'polygamy' : 'married';
 
       units.push({
         id: `unit-${husbandId}`,
         type,
         husband,
         wives,
         children,
         isFounder: isFounder || false,
         generation: isFounder ? 1 : 2 // Simplified generation
       });
 
       processedMemberIds.add(husbandId);
       wives.forEach(w => processedMemberIds.add(w.id));
     });
 
     // Add unmarried members as single units
     familyMembers.forEach(member => {
       if (!processedMemberIds.has(member.id)) {
         // Check if this member has parents in the tree
         const hasParents = member.father_id || member.mother_id;
         
         units.push({
           id: `single-${member.id}`,
           type: 'single',
           husband: member.gender === 'male' ? member : undefined,
           wives: member.gender === 'female' ? [member] : [],
           children: [],
           isFounder: member.is_founder || false,
           generation: hasParents ? 3 : 1
         });
       }
     });
 
     return units;
   }, [familyMembers, marriages]);
 
   // Get founder unit
   const founderUnit = familyUnits.find(u => u.isFounder);
 
   // Get children units (second generation)
   const secondGenUnits = familyUnits.filter(u => 
     !u.isFounder && 
     (u.husband?.father_id === founderUnit?.husband?.id || 
      u.wives.some(w => w.father_id === founderUnit?.husband?.id))
   );
 
   return (
     <main className="relative h-[calc(100vh-120px)] overflow-auto tree-canvas-bg">
       {/* Zoom Controls */}
       <div className="absolute bottom-8 right-8 rtl:right-auto rtl:left-8 z-40 flex flex-col gap-3">
         <div className="bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col">
           <button 
             onClick={onZoomIn}
             className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
           >
             <span className="material-icons-round">add</span>
           </button>
           <div className="h-px bg-slate-100 dark:bg-slate-700 my-1 mx-2"></div>
           <button 
             onClick={onZoomOut}
             className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
           >
             <span className="material-icons-round">remove</span>
           </button>
         </div>
         <button 
           onClick={onResetZoom}
           className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300"
         >
           <span className="material-icons-round">filter_center_focus</span>
         </button>
       </div>
 
       {/* Minimap */}
       <div className="absolute bottom-8 left-8 rtl:left-auto rtl:right-8 z-40 w-48 h-32 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden p-2">
         <div className="w-full h-full bg-slate-50 dark:bg-slate-900 rounded-lg relative border border-slate-100 dark:border-slate-700">
           <div className="absolute inset-4 border-2 border-primary/50 bg-primary/5 rounded"></div>
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full"></div>
         </div>
       </div>
 
       {/* Tree Content */}
       <div 
         className="absolute inset-0 flex items-start justify-center pt-20"
         style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
       >
         <div className="relative flex flex-col items-center gap-8">
           {/* Founder Unit */}
           {founderUnit && (
             <div className="relative">
               <StitchFamilyCard
                 unit={founderUnit}
                 familyMembers={familyMembers}
               />
               
               {/* Connector line to children */}
               {secondGenUnits.length > 0 && (
                 <div className="absolute w-px h-16 bg-primary/40 left-1/2 -translate-x-1/2 top-full" />
               )}
             </div>
           )}
 
           {/* Second Generation - Horizontal Line + Units */}
           {secondGenUnits.length > 0 && (
             <>
               {/* Horizontal connector */}
               <div className="relative w-[1000px] h-px bg-primary/40 mt-8">
                 {secondGenUnits.map((_, idx) => {
                   const totalUnits = secondGenUnits.length;
                   const position = totalUnits > 1 
                     ? (idx / (totalUnits - 1)) * 100 
                     : 50;
                   return (
                     <div 
                       key={idx}
                       className="absolute w-px h-8 bg-primary/40 top-0"
                       style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                     />
                   );
                 })}
               </div>
 
               {/* Children Units */}
               <div className="flex gap-8 items-start flex-wrap justify-center mt-4">
                 {secondGenUnits.map(unit => (
                   <StitchFamilyCard
                     key={unit.id}
                     unit={unit}
                     familyMembers={familyMembers}
                   />
                 ))}
               </div>
             </>
           )}
 
           {/* Empty State */}
           {familyMembers.length === 0 && (
             <div className="text-center py-20">
               <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                 <span className="material-icons-round text-5xl text-primary">account_tree</span>
               </div>
               <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">
                 {t('tree_view.no_members', 'No family members yet')}
               </h3>
               <p className="text-slate-500 dark:text-slate-400">
                 {t('tree_view.start_adding', 'Start by adding the founder of your family tree')}
               </p>
             </div>
           )}
         </div>
       </div>
 
       <style>{`
         .tree-canvas-bg {
           background-image: radial-gradient(circle, hsl(var(--primary) / 0.1) 1px, transparent 1px);
           background-size: 40px 40px;
         }
       `}</style>
     </main>
   );
 };