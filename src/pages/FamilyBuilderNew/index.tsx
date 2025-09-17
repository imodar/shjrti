import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Plus } from "lucide-react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooterSimplified } from "@/components/GlobalFooterSimplified";
import { useToast } from "@/hooks/use-toast";

// New Components and Hooks
import { TreeSettingsButton } from "./components/TreeSettings/TreeSettingsButton";
import { TreeSettingsView } from "./components/TreeSettings/TreeSettingsView";
import { MemberCard } from "./components/MemberList/MemberCard";
import { useFamilyData } from "./hooks/useFamilyData";
import { useFormState } from "./hooks/useFormState";
import FamilyBuilderNewSkeleton from "@/components/skeletons/FamilyBuilderNewSkeleton";

const FamilyBuilderNew = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Get family ID from URL
  const familyId = searchParams.get("family");
  
  // Use new hooks
  const {
    familyData,
    familyMembers,
    marriages,
    loading,
    dataLoaded,
    refreshFamilyData
  } = useFamilyData(familyId);
  
  const {
    formMode,
    resetForm,
    loadMemberToForm
  } = useFormState();

  // UI States
  const [showSettings, setShowSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  // Helper functions
  const checkIfMemberIsSpouse = (member: any) => {
    return !member.father_id && !member.mother_id && !member.is_founder;
  };

  const getGenderColor = (gender: string) => {
    return gender === 'male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700';
  };

  // Event handlers
  const handleAddMember = () => {
    resetForm();
  };

  const handleViewMember = (member: any) => {
    console.log('Viewing member:', member);
  };

  const handleEditMember = (member: any) => {
    loadMemberToForm(member);
  };

  const handleDeleteMember = (member: any) => {
    console.log('Deleting member:', member);
  };

  const handleSpouseEditAttempt = (member: any) => {
    toast({
      title: "تعديل الزوج/الزوجة",
      description: "يجب تعديل بيانات الزوج/الزوجة من خلال نموذج الزواج",
      variant: "default"
    });
  };

  // Filter members based on search and filter criteria
  const filteredMembers = familyMembers.filter(member => {
    const matchesSearch = searchTerm === "" || 
      member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.first_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = selectedFilter === "all" ||
      (selectedFilter === "male" && member.gender === "male") ||
      (selectedFilter === "female" && member.gender === "female") ||
      (selectedFilter === "founders" && member.is_founder) ||
      (selectedFilter === "alive" && member.is_alive !== false) ||
      (selectedFilter === "deceased" && member.is_alive === false);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return <FamilyBuilderNewSkeleton />;
  }

  if (!familyData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <GlobalHeader />
        <div className="flex items-center justify-center py-20">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold mb-2">العائلة غير موجودة</h2>
              <p className="text-muted-foreground mb-4">لم يتم العثور على العائلة المطلوبة</p>
              <Button onClick={() => navigate("/dashboard")}>
                العودة للوحة التحكم
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showSettings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <GlobalHeader />
        <TreeSettingsView 
          familyData={familyData} 
          onBack={() => setShowSettings(false)} 
        />
        <GlobalFooterSimplified />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <GlobalHeader />
      
      <div className="container mx-auto px-4 py-6">
        {/* Family Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 via-teal-500 to-amber-500 rounded-full flex items-center justify-center shadow-md">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  عائلة {familyData.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {familyMembers.length} عضو • {marriages.length} زواج
                </p>
              </div>
              <TreeSettingsButton onShowSettings={() => setShowSettings(true)} />
            </div>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Members List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>أعضاء العائلة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search and Filter */}
                <div className="flex gap-4">
                  <Input
                    placeholder="البحث في الأعضاء..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">جميع الأعضاء</option>
                    <option value="male">الذكور</option>
                    <option value="female">الإناث</option>
                    <option value="founders">المؤسسون</option>
                    <option value="alive">الأحياء</option>
                    <option value="deceased">المتوفين</option>
                  </select>
                </div>

                {/* Add Member Button */}
                <Button onClick={handleAddMember} className="w-full">
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة عضو جديد
                </Button>

                {/* Members List */}
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  {filteredMembers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>لا توجد أعضاء</p>
                    </div>
                  ) : (
                    filteredMembers.map((member) => (
                      <MemberCard
                        key={member.id}
                        member={member}
                        familyMembers={familyMembers}
                        marriages={marriages}
                        onViewMember={handleViewMember}
                        onEditMember={handleEditMember}
                        onDeleteMember={handleDeleteMember}
                        onSpouseEditAttempt={handleSpouseEditAttempt}
                        checkIfMemberIsSpouse={checkIfMemberIsSpouse}
                        getGenderColor={getGenderColor}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Member Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>
                  {formMode === 'add' ? 'إضافة عضو جديد' : 
                   formMode === 'edit' ? 'تعديل العضو' : 
                   'معاينة العضو'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <p>نموذج العضو سيتم تطويره في المرحلة التالية</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <GlobalFooterSimplified />
    </div>
  );
};

export default FamilyBuilderNew;