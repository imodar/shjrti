import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { MemberCard } from "./MemberCard";
import { MemberFilters } from "./MemberFilters";
import { Member } from "../../types/family.types";

interface MemberListContainerProps {
  members: Member[];
  marriages: any[];
  generationsCount: number;
  onMemberClick: (member: Member) => void;
  onMemberEdit: (member: Member) => void;
  onMemberDelete: (memberId: string) => void;
  onAddMember: () => void;
  packageData: any;
  checkIfMemberIsSpouse: (member: Member) => boolean;
  getGenderColor: (gender: string) => string;
}

export const MemberListContainer = React.memo(({
  members,
  marriages,
  generationsCount,
  onMemberClick,
  onMemberEdit,
  onMemberDelete,
  onAddMember,
  packageData,
  checkIfMemberIsSpouse,
  getGenderColor
}: MemberListContainerProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [generationFilter, setGenerationFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchesSearch = 
        member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.last_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesGender = genderFilter === "all" || member.gender === genderFilter;
      
      // Generation filtering logic would go here
      const matchesGeneration = generationFilter === "all";
      
      return matchesSearch && matchesGender && matchesGeneration;
    });
  }, [members, searchQuery, genderFilter, generationFilter]);

  return (
    <div className="flex flex-col max-h-[calc(100vh-400px)] overflow-hidden gap-4">
      <MemberFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        generationFilter={generationFilter}
        onGenerationFilterChange={setGenerationFilter}
        genderFilter={genderFilter}
        onGenderFilterChange={setGenderFilter}
        generationsCount={generationsCount}
      />

      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {filteredMembers.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            familyMembers={members}
            marriages={marriages}
            onViewMember={onMemberClick}
            onEditMember={onMemberEdit}
            onDeleteMember={(m) => onMemberDelete(m.id)}
            onSpouseEditAttempt={onMemberEdit}
            checkIfMemberIsSpouse={checkIfMemberIsSpouse}
            getGenderColor={getGenderColor}
          />
        ))}
        
        {filteredMembers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>لا توجد نتائج</p>
          </div>
        )}
      </div>

      <Button onClick={onAddMember} className="w-full" size="lg">
        <Plus className="ml-2 h-5 w-5" />
        إضافة عضو جديد
      </Button>
    </div>
  );
});

MemberListContainer.displayName = "MemberListContainer";