import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

interface Package {
  max_family_members: number;
}

interface AddMemberCardProps {
  packageData: Package | null;
  familyMembersCount: number;
  onAddMember: () => void;
}

export const AddMemberCard = ({ packageData, familyMembersCount, onAddMember }: AddMemberCardProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (packageData && familyMembersCount >= packageData.max_family_members) {
    return (
      <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50 border-2 border-red-200 dark:border-red-800 rounded-2xl">
        <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[200px]">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="font-bold text-red-600 dark:text-red-400 text-lg mb-2">
            {t('family_builder.max_limit_reached', 'تم الوصول للحد الأقصى')}
          </h3>
          <p className="text-red-500 dark:text-red-300 text-center text-sm mb-4">
            {t('family_builder.max_limit_desc', 'لقد وصلت إلى الحد الأقصى المسموح')} 
            ({packageData.max_family_members} {t('family_builder.members_count', 'أعضاء')})
          </p>
          <Button 
            onClick={() => navigate('/payments')}
            variant="outline"
            className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            {t('family_builder.upgrade_package', 'ترقية الباقة')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-dashed border-primary/30 rounded-2xl cursor-pointer group hover:from-primary/10 hover:to-accent/10 hover:border-primary/50 transition-all duration-300"
      onClick={onAddMember}
    >
      <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[200px]">
        <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <Plus className="h-8 w-8 text-primary" />
        </div>
        <h3 className="font-bold text-primary text-lg mb-2">
          {t('family_builder.add_new_member', 'إضافة فرد جديد')}
        </h3>
        <p className="text-muted-foreground text-center text-sm">
          {t('family_builder.click_to_add', 'انقر هنا لإضافة عضو جديد إلى شجرة العائلة')}
        </p>
      </CardContent>
    </Card>
  );
};