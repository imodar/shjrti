import React from "react";
import { DateDisplay } from "@/components/DateDisplay";
import { Member } from "../../types/family.types";

interface MemberInfoProps {
  member: Member;
  children?: React.ReactNode;
}

export const MemberInfo: React.FC<MemberInfoProps> = ({ member, children }) => {
  return (
    <div className="space-y-1">
      {/* Member name */}
      <div className="text-center">
        <h3 className="font-bold text-base font-arabic text-foreground group-hover:text-primary transition-colors duration-300 drop-shadow-sm">
          {member.name || member.first_name || "غير معروف"}
        </h3>
      </div>
      
      {/* Additional info (relationships, etc.) */}
      {children}
      
      {/* Birth date */}
      {member.birth_date && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/70 bg-muted/30 rounded-full px-2 py-0.5 backdrop-blur-sm">
          <div className="w-1 h-1 bg-current rounded-full opacity-60" />
          <DateDisplay date={member.birth_date} className="font-arabic font-medium" />
          <div className="w-1 h-1 bg-current rounded-full opacity-60" />
        </div>
      )}
    </div>
  );
};