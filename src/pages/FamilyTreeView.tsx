import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Users, BarChart3, ZoomIn, ZoomOut, Maximize, TreePine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SharedFooter } from "@/components/SharedFooter";
import { supabase } from "@/integrations/supabase/client";

const FamilyTreeView = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [familyMarriages, setFamilyMarriages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [lines, setLines] = useState<any[]>([]);
  const memberRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // مثال تجريبي لشجرة العائلة
  const familyTree = [
    {
      id: "1",
      name: "أمير",
      gender: "male",
      children: ["2", "3", "4", "5", "6"],
    },
    {
      id: "2",
      name: "مضر",
      gender: "male",
      children: ["7", "8"],
    },
    { id: "3", name: "ربى", gender: "female", children: [] },
    { id: "4", name: "نور", gender: "female", children: [] },
    { id: "5", name: "ليث", gender: "male", children: [] },
    { id: "6", name: "زينة", gender: "female", children: [] },
    { id: "7", name: "أمير الصغير", gender: "male", children: [] },
    { id: "8", name: "ميرا", gender: "female", children: [] },
  ];

  useEffect(() => {
    const newLines: any[] = [];

    familyTree.forEach((member) => {
      const fromEl = memberRefs.current[member.id];
      if (!fromEl) return;

      const fromRect = fromEl.getBoundingClientRect();
      const fromX = fromRect.left + fromRect.width / 2 + window.scrollX;
      const fromY = fromRect.top + fromRect.height + window.scrollY;

      member.children.forEach((childId) => {
        const toEl = memberRefs.current[childId];
        if (!toEl) return;

        const toRect = toEl.getBoundingClientRect();
        const toX = toRect.left + toRect.width / 2 + window.scrollX;
        const toY = toRect.top + window.scrollY;

        newLines.push({ x1: fromX, y1: fromY, x2: toX, y2: toY });
      });
    });

    setLines(newLines);
  }, [zoomLevel]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Diagram View */}
      <Tabs defaultValue="diagram">
        <TabsList className="mb-4">
          <TabsTrigger value="diagram">شجرة العائلة</TabsTrigger>
        </TabsList>

        <TabsContent value="diagram">
          <div className="bg-card/30 backdrop-blur-sm rounded-xl border border-primary/20 p-6 min-h-[800px] relative overflow-auto">
            {/* خطوط SVG */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
              {lines.map((line, idx) => (
                <line
                  key={idx}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  opacity="0.6"
                />
              ))}
            </svg>

            <div
              className="relative z-10"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: "top center",
              }}
            >
              {/* الجيل الأول */}
              <div className="flex justify-center items-center mb-32">
                <div className="flex flex-wrap justify-center gap-12">
                  {["1"].map((id) => {
                    const member = familyTree.find((m) => m.id === id)!;
                    return (
                      <div
                        key={member.id}
                        ref={(el) => (memberRefs.current[member.id] = el)}
                        className="relative"
                      >
                        <Card className="p-4 bg-card/90 backdrop-blur-sm border-primary/30 hover:shadow-xl transition-all duration-300 min-w-[180px] relative z-10">
                          <div className="text-center">
                            <Avatar className="h-16 w-16 mx-auto mb-3">
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20">
                                {member.name.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <h3 className="font-semibold text-lg">{member.name}</h3>
                            <Badge variant="outline" className="text-xs mt-2">
                              {member.gender === "male" ? "ذكر" : "أنثى"}
                            </Badge>
                          </div>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* الجيل الثاني */}
              <div className="flex justify-center items-center mb-32">
                <div className="flex flex-wrap justify-center gap-12">
                  {["2", "3", "4", "5", "6"].map((id) => {
                    const member = familyTree.find((m) => m.id === id)!;
                    return (
                      <div
                        key={member.id}
                        ref={(el) => (memberRefs.current[member.id] = el)}
                        className="relative"
                      >
                        <Card className="p-4 bg-card/90 backdrop-blur-sm border-primary/30 hover:shadow-xl transition-all duration-300 min-w-[180px] relative z-10">
                          <div className="text-center">
                            <Avatar className="h-16 w-16 mx-auto mb-3">
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20">
                                {member.name.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <h3 className="font-semibold text-lg">{member.name}</h3>
                            <Badge variant="outline" className="text-xs mt-2">
                              {member.gender === "male" ? "ذكر" : "أنثى"}
                            </Badge>
                          </div>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* الجيل الثالث */}
              <div className="flex justify-center items-center mb-32">
                <div className="flex flex-wrap justify-center gap-12">
                  {["7", "8"].map((id) => {
                    const member = familyTree.find((m) => m.id === id)!;
                    return (
                      <div
                        key={member.id}
                        ref={(el) => (memberRefs.current[member.id] = el)}
                        className="relative"
                      >
                        <Card className="p-4 bg-card/90 backdrop-blur-sm border-primary/30 hover:shadow-xl transition-all duration-300 min-w-[180px] relative z-10">
                          <div className="text-center">
                            <Avatar className="h-16 w-16 mx-auto mb-3">
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20">
                                {member.name.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <h3 className="font-semibold text-lg">{member.name}</h3>
                            <Badge variant="outline" className="text-xs mt-2">
                              {member.gender === "male" ? "ذكر" : "أنثى"}
                            </Badge>
                          </div>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FamilyTreeView;