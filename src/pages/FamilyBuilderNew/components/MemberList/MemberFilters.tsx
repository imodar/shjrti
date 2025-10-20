import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users } from "lucide-react";

interface MemberFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  generationFilter: string;
  onGenerationFilterChange: (value: string) => void;
  genderFilter: string;
  onGenderFilterChange: (value: string) => void;
  generationsCount: number;
}

export const MemberFilters = React.memo(({
  searchQuery,
  onSearchChange,
  generationFilter,
  onGenerationFilterChange,
  genderFilter,
  onGenderFilterChange,
  generationsCount
}: MemberFiltersProps) => {
  return (
    <div className="flex gap-3">
      <div className="relative flex-1">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="ابحث عن عضو..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pr-10"
        />
      </div>
      
      <Select value={generationFilter} onValueChange={onGenerationFilterChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="جميع الأجيال" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">جميع الأجيال</SelectItem>
          {Array.from({ length: generationsCount }, (_, i) => i + 1).map((gen) => (
            <SelectItem key={gen} value={gen.toString()}>
              الجيل {gen}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={genderFilter} onValueChange={onGenderFilterChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="الجنس" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">الكل</SelectItem>
          <SelectItem value="male">ذكور</SelectItem>
          <SelectItem value="female">إناث</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
});

MemberFilters.displayName = "MemberFilters";