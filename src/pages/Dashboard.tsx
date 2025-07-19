import { useState, useEffect, useCallback } from "react";
import { 
  Sparkles, 
  Heart, 
  Users, 
  Star, 
  TreePine,
  Crown,
  Plus,
  ArrowRight,
  Quote,
  UserPlus,
  Wand2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";
import { supabase } from "@/integrations/supabase/client";
import { 
  ReactFlow, 
  Node, 
  Edge, 
  addEdge, 
  Connection, 
  useNodesState, 
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  Position,
  Handle
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Custom Family Member Node Component
const FamilyMemberNode = ({ data, id }: { data: any; id: string }) => {
  return (
    <div className="family-node">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div className="relative group">
        {/* Luxury Card Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-emerald-50 dark:from-gray-800 dark:via-gray-900 dark:to-emerald-950 opacity-90 rounded-2xl"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition-all duration-700"></div>
        <div className="absolute inset-[1px] bg-white dark:bg-gray-800 rounded-2xl"></div>
        
        <div className="relative p-6 text-center min-w-[180px]">
          {/* Avatar */}
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-all duration-500 scale-110"></div>
            <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-500 mx-auto">
              {data.image_url ? (
                <img src={data.image_url} alt={data.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                data.name?.charAt(0)?.toUpperCase() || '?'
              )}
            </div>
          </div>
          
          {/* Name and Details */}
          <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">
            {data.name || 'Unknown'}
          </h3>
          
          {data.birth_date && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {new Date(data.birth_date).getFullYear()}
            </p>
          )}
          
          {data.is_founder && (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs mt-2">
              <Crown className="h-3 w-3 mr-1" />
              المؤسس
            </Badge>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

// Add Member Node Component  
const AddMemberNode = ({ data }: { data: any }) => {
  return (
    <div className="add-member-node">
      <Link to="/family-builder?new=true">
        <div className="group cursor-pointer">
          <div className="relative p-8 min-w-[180px] text-center">
            {/* Dashed Border */}
            <div className="absolute inset-0 border-2 border-dashed border-emerald-300 dark:border-emerald-700 rounded-2xl group-hover:border-emerald-500 transition-colors duration-300"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 group-hover:from-emerald-100 dark:group-hover:from-emerald-900/50 group-hover:to-teal-100 dark:group-hover:to-teal-900/50 rounded-2xl transition-colors duration-300"></div>
            
            <div className="relative">
              {/* Plus Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white mb-4 mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Plus className="h-8 w-8" />
              </div>
              
              <h3 className="font-bold text-gray-600 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">
                {data.label}
              </h3>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

const nodeTypes: NodeTypes = {
  familyMember: FamilyMemberNode,
  addMember: AddMemberNode,
};

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [currentQuote, setCurrentQuote] = useState(0);

  const quotes = [
    {
      text: t('quote_1', "العائلة هي الجذور التي تحميك من عواصف الحياة"),
      author: t('quote_1_author', "المثل العربي")
    },
    {
      text: t('quote_2', "من عرف نفسه عرف ربه، ومن عرف عائلته عرف تاريخه"),
      author: t('quote_2_author', "الحكمة الشعبية")
    },
    {
      text: t('quote_3', "الإرث الحقيقي ليس ما نتركه من مال، بل ما نتركه من ذكريات"),
      author: t('quote_3_author', "قول مأثور")
    }
  ];

  // Fetch family members
  useEffect(() => {
    const fetchFamilyMembers = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        const { data: families } = await supabase
          .from('families')
          .select('id')
          .eq('creator_id', user.id)
          .limit(1);

        if (families && families.length > 0) {
          const { data: members } = await supabase
            .from('family_tree_members')
            .select('*')
            .eq('family_id', families[0].id);

          setFamilyMembers(members || []);
        }
      } catch (error) {
        console.error('Error fetching family members:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFamilyMembers();
  }, [user?.id]);

  // Create tree nodes and edges
  useEffect(() => {
    if (familyMembers.length === 0) {
      // Show empty state with add member option
      const emptyNodes: Node[] = [
        {
          id: 'add-first',
          type: 'addMember',
          position: { x: 400, y: 300 },
          data: { 
            label: t('add_first_member', 'أضف أول فرد في العائلة'),
          },
          draggable: false,
        },
      ];
      setNodes(emptyNodes);
      setEdges([]);
      return;
    }

    // Create nodes for existing family members
    const treeNodes: Node[] = [];
    const treeEdges: Edge[] = [];

    // Find founder or first member
    const founder = familyMembers.find(member => member.is_founder) || familyMembers[0];
    
    if (founder) {
      treeNodes.push({
        id: founder.id,
        type: 'familyMember',
        position: { x: 400, y: 50 },
        data: founder,
        draggable: false,
      });

      // Add children
      const children = familyMembers.filter(member => 
        member.father_id === founder.id || member.mother_id === founder.id
      );

      children.forEach((child, index) => {
        const xOffset = (index - (children.length - 1) / 2) * 220;
        treeNodes.push({
          id: child.id,
          type: 'familyMember',
          position: { x: 400 + xOffset, y: 250 },
          data: child,
          draggable: false,
        });

        // Add edge from parent to child
        treeEdges.push({
          id: `edge-${founder.id}-${child.id}`,
          source: founder.id,
          target: child.id,
          type: 'smoothstep',
          style: { stroke: '#10b981', strokeWidth: 2 },
          animated: true,
        });
      });

      // Add "Add Member" node
      treeNodes.push({
        id: 'add-member',
        type: 'addMember',
        position: { x: 400 + (children.length * 110), y: 250 },
        data: { 
          label: t('add_member', 'إضافة فرد جديد'),
        },
        draggable: false,
      });
    }

    setNodes(treeNodes);
    setEdges(treeEdges);
  }, [familyMembers, t]);

  // Quote rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [quotes.length]);

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges]);

  return (
    <div className="min-h-screen">
      <Header />
      <SubscriptionGuard>
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 relative overflow-hidden">
          {/* Floating Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute bottom-32 left-16 w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-20 animate-bounce"></div>
            <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full opacity-20 animate-pulse"></div>
          </div>

          {/* Floating Animated Icons */}
          <div className="absolute top-32 right-20 animate-float">
            <Heart className="h-10 w-10 text-pink-400 opacity-60" />
          </div>
          <div className="absolute bottom-40 left-20 animate-float-delayed">
            <Users className="h-12 w-12 text-emerald-400 opacity-40" />
          </div>
          <div className="absolute top-1/2 left-10 animate-float-slow">
            <Star className="h-8 w-8 text-yellow-400 opacity-60" />
          </div>

          <main className="relative z-10 pt-20">
            {/* Hero Section */}
            <section className="py-12 relative">
              <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-8">
                  <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 text-sm mb-6 shadow-lg">
                    <Sparkles className="h-4 w-4 ml-2" />
                    {t('dashboard_welcome_badge', 'شجرتك العائلية')}
                  </Badge>
                  
                  <h1 className="text-4xl md:text-6xl font-bold mb-6">
                    <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                      {familyMembers.length === 0 
                        ? t('welcome_build_tree', 'ابني شجرة عائلتك')
                        : t('your_family_tree', 'شجرة عائلتك')
                      }
                    </span>
                  </h1>
                  
                  <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                    {familyMembers.length === 0 
                      ? t('start_journey_desc', 'ابدأ رحلتك في توثيق تاريخ عائلتك')
                      : t('manage_tree_desc', `${familyMembers.length} فرد في شجرتك العائلية`)
                    }
                  </p>
                </div>
              </div>
            </section>

            {/* Interactive Family Tree */}
            <section className="relative py-8">
              <div className="container mx-auto px-4 relative z-10">
                {loading ? (
                  <div className="h-96 flex items-center justify-center">
                    <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-0 shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 opacity-10 rounded-2xl"></div>
                    <div className="absolute inset-[1px] bg-white dark:bg-gray-800 rounded-2xl"></div>
                    
                    <CardContent className="relative p-0">
                      <div className="h-96 md:h-[500px]">
                        <ReactFlow
                          nodes={nodes}
                          edges={edges}
                          onNodesChange={onNodesChange}
                          onEdgesChange={onEdgesChange}
                          onConnect={onConnect}
                          nodeTypes={nodeTypes}
                          fitView
                          fitViewOptions={{ padding: 0.2 }}
                          attributionPosition="bottom-left"
                          style={{ backgroundColor: 'transparent' }}
                          proOptions={{ hideAttribution: true }}
                        >
                          <Background color="#10b981" gap={16} size={1} />
                          <Controls className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-emerald-200 dark:border-emerald-700" />
                          <MiniMap 
                            nodeColor="#10b981"
                            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-emerald-200 dark:border-emerald-700"
                          />
                        </ReactFlow>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </section>

            {/* Quick Actions */}
            {familyMembers.length === 0 ? (
              <section className="py-12 relative">
                <div className="container mx-auto px-4 relative z-10">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">
                      <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                        {t('how_to_start', 'كيف تبدأ؟')}
                      </span>
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                    {[
                      {
                        step: "01",
                        icon: <UserPlus className="h-8 w-8" />,
                        title: t('step_1_title', 'أضف نفسك أو أحد الوالدين'),
                        description: t('step_1_desc', 'ابدأ بإضافة أول فرد في العائلة'),
                        color: "from-emerald-500 to-teal-500"
                      },
                      {
                        step: "02",
                        icon: <Users className="h-8 w-8" />,
                        title: t('step_2_title', 'أضف أفراد العائلة'),
                        description: t('step_2_desc', 'أضف الأطفال والأقارب وحدد العلاقات'),
                        color: "from-amber-500 to-orange-500"
                      },
                      {
                        step: "03",
                        icon: <TreePine className="h-8 w-8" />,
                        title: t('step_3_title', 'شاهد شجرتك تنمو'),
                        description: t('step_3_desc', 'استمتع بمشاهدة شجرة عائلتك التفاعلية'),
                        color: "from-pink-500 to-rose-500"
                      }
                    ].map((step, index) => (
                      <Card key={index} className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-700 hover:-translate-y-4">
                        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-emerald-50 dark:from-gray-800 dark:via-gray-900 dark:to-emerald-950 opacity-90"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition-all duration-700"></div>
                        <div className="absolute inset-[1px] bg-white dark:bg-gray-800 rounded-2xl"></div>
                        
                        <CardContent className="relative p-8 text-center">
                          <div className="text-6xl font-bold text-emerald-100 dark:text-emerald-900/20 mb-4">
                            {step.step}
                          </div>
                          
                          <div className="relative mb-6 -mt-12">
                            <div className={`absolute inset-0 bg-gradient-to-r ${step.color} rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-all duration-500 scale-110`}></div>
                            <div className={`relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${step.color} rounded-full shadow-xl group-hover:shadow-2xl group-hover:scale-125 transition-all duration-500`}>
                              <div className="text-white">
                                {step.icon}
                              </div>
                            </div>
                          </div>
                          
                          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">
                            {step.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 leading-relaxed group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300">
                            {step.description}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="text-center mt-12">
                    <Link to="/family-builder?new=true">
                      <Button size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg px-8 py-4 rounded-full shadow-xl hover-scale">
                        <Wand2 className="h-5 w-5 ml-2" />
                        {t('start_building', 'ابدأ بناء شجرتك الآن')}
                      </Button>
                    </Link>
                  </div>
                </div>
              </section>
            ) : (
              <section className="py-12 relative">
                <div className="container mx-auto px-4 relative z-10">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Quick Actions */}
                    <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-0 shadow-2xl">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 opacity-20 rounded-2xl blur-xl"></div>
                      <div className="absolute inset-[1px] bg-white dark:bg-gray-800 rounded-2xl"></div>
                      
                      <CardContent className="relative p-8">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-6 flex items-center gap-3">
                          <Crown className="h-6 w-6 text-emerald-600" />
                          {t('quick_actions', 'إجراءات سريعة')}
                        </h3>
                        
                        <div className="space-y-4">
                          <Link to="/family-builder?new=true">
                            <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl justify-start text-lg p-6">
                              <Plus className="h-5 w-5 ml-3" />
                              {t('add_family_member', 'إضافة فرد جديد')}
                            </Button>
                          </Link>
                          
                          <Link to="/family-overview">
                            <Button variant="outline" className="w-full border-emerald-200 dark:border-emerald-700 rounded-xl justify-start text-lg p-6">
                              <Users className="h-5 w-5 ml-3" />
                              {t('view_all_members', 'عرض جميع الأفراد')}
                            </Button>
                          </Link>
                          
                          <Link to="/family-tree-view">
                            <Button variant="outline" className="w-full border-emerald-200 dark:border-emerald-700 rounded-xl justify-start text-lg p-6">
                              <TreePine className="h-5 w-5 ml-3" />
                              {t('detailed_tree_view', 'عرض الشجرة التفصيلي')}
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Motivational Quote */}
                    <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-0 shadow-2xl">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 opacity-20 rounded-2xl blur-xl"></div>
                      <div className="absolute inset-[1px] bg-white dark:bg-gray-800 rounded-2xl"></div>
                      
                      <CardContent className="relative p-12 text-center">
                        <div className="mb-8">
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full shadow-xl mb-6">
                            <Quote className="h-8 w-8 text-white" />
                          </div>
                        </div>
                        
                        <blockquote className="text-xl md:text-2xl font-medium text-gray-800 dark:text-gray-200 mb-6 leading-relaxed">
                          "{quotes[currentQuote].text}"
                        </blockquote>
                        
                        <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                          — {quotes[currentQuote].author}
                        </div>
                        
                        <div className="flex justify-center mt-6 space-x-2">
                          {quotes.map((_, index) => (
                            <div 
                              key={index}
                              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                index === currentQuote 
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 scale-125' 
                                  : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>
      </SubscriptionGuard>
    </div>
  );
};

export default Dashboard;