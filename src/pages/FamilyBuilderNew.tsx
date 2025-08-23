import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Users, 
  User, 
  Heart, 
  Calendar, 
  Edit2, 
  Trash2, 
  Baby, 
  UserPlus, 
  Save,
  Download,
  Upload,
  Search,
  Filter,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Home,
  Settings,
  Info,
  AlertCircle,
  CheckCircle,
  X,
  UserX,
  Crown,
  Star,
  TreePine,
  Layers,
  Network,
  GitBranch,
  Users2,
  UserCheck,
  CalendarIcon,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  GraduationCap,
  FileText,
  Image as ImageIcon,
  Link,
  Globe,
  MessageSquare,
  Share2,
  Copy,
  ExternalLink,
  RefreshCw,
  Archive,
  Bookmark,
  Tag,
  Clock,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Target,
  Award,
  Medal,
  Trophy,
  Gift,
  Sparkles,
  Flame,
  Sun,
  Moon,
  CloudRain,
  Snowflake,
  Wind,
  Compass,
  Map,
  Navigation,
  Route,
  Flag,
  Anchor,
  Ship,
  Plane,
  Car,
  Train,
  Bike,
  Walk,
  Camera,
  Video,
  Music,
  Headphones,
  Mic,
  Speaker,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Radio,
  Tv,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Desktop,
  Server,
  Database,
  HardDrive,
  Cpu,
  Memory,
  Wifi,
  Bluetooth,
  Usb,
  Battery,
  BatteryLow,
  Power,
  PowerOff,
  Plug,
  Cable,
  Router,
  Printer,
  Scanner,
  Keyboard,
  Mouse,
  Gamepad2,
  Joystick,
  Dice1,
  Dice2,
  Dice3,
  Dice4,
  Dice5,
  Dice6,
  Puzzle,
  Gamepad,
  Controller,
  Swords,
  Shield,
  Sword,
  Axe,
  Bow,
  Target as TargetIcon,
  Crosshair,
  Scope,
  Bomb,
  Zap as ZapIcon,
  Lightning,
  Bolt,
  Flash,
  Flashlight,
  Lightbulb,
  Candle,
  Lamp,
  Lantern,
  Torch,
  Fire,
  Flame as FlameIcon,
  Campfire,
  Bonfire,
  Fireplace,
  Oven,
  Microwave,
  Refrigerator,
  Washer,
  Dryer,
  Iron,
  Vacuum,
  Broom,
  Mop,
  Bucket,
  Soap,
  Towel,
  Toilet,
  Shower,
  Bath,
  Sink,
  Faucet,
  Pipe,
  Wrench,
  Hammer,
  Screwdriver,
  Drill,
  Saw,
  Nail,
  Screw,
  Nut,
  Bolt as BoltIcon,
  Gear,
  Cog,
  Settings as SettingsIcon,
  Tool,
  Toolbox,
  Ruler,
  Scissors,
  Paperclip,
  Pin,
  Pushpin,
  Thumbtack,
  Magnet,
  Lock,
  Unlock,
  Key,
  Keyhole,
  Safe,
  Vault,
  Box,
  Package,
  Gift as GiftIcon,
  ShoppingBag,
  ShoppingCart,
  Basket,
  Bag,
  Backpack,
  Briefcase as BriefcaseIcon,
  Suitcase,
  Luggage,
  Handbag,
  Purse,
  Wallet,
  CreditCard,
  Banknote,
  Coins,
  DollarSign,
  Euro,
  Pound,
  Yen,
  Bitcoin,
  Ethereum,
  Litecoin,
  Dogecoin,
  TrendingDown,
  TrendingUp as TrendingUpIcon,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ArrowUpLeft,
  ArrowDownRight,
  ArrowDownLeft,
  ChevronUp,
  ChevronLeft,
  MoreHorizontal,
  MoreVertical,
  Menu,
  X as XIcon,
  Check,
  Minus,
  Equal,
  Slash,
  Backslash,
  Percent,
  Hash,
  AtSign,
  Ampersand,
  Asterisk,
  Exclamation,
  Question,
  Semicolon,
  Colon,
  Comma,
  Period,
  Quote,
  Apostrophe,
  Backtick,
  Tilde,
  Caret,
  Underscore,
  Hyphen,
  Space,
  Tab,
  Enter,
  Escape,
  Delete,
  Backspace,
  Insert,
  Home as HomeIcon,
  End,
  PageUp,
  PageDown,
  CapsLock,
  NumLock,
  ScrollLock,
  PrintScreen,
  Pause as PauseIcon,
  Break,
  F1,
  F2,
  F3,
  F4,
  F5,
  F6,
  F7,
  F8,
  F9,
  F10,
  F11,
  F12,
  Alpha,
  Beta,
  Gamma,
  Delta,
  Epsilon,
  Zeta,
  Eta,
  Theta,
  Iota,
  Kappa,
  Lambda,
  Mu,
  Nu,
  Xi,
  Omicron,
  Pi,
  Rho,
  Sigma,
  Tau,
  Upsilon,
  Phi,
  Chi,
  Psi,
  Omega
} from "lucide-react";
import { toast } from "sonner";
import { format, isValid as isValidDate, parseISO } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import PersonForm, { PersonFormRef } from "@/components/PersonForm";
import WifeForm, { WifeFormRef } from "@/components/WifeForm";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Types and Interfaces
interface FamilyMember {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  gender: 'male' | 'female';
  birthDate: Date | null;
  deathDate: Date | null;
  isAlive: boolean;
  father_id?: string;
  mother_id?: string;
  spouses: Spouse[];
  children: string[];
  notes?: string;
  occupation?: string;
  education?: string;
  location?: string;
  phone?: string;
  email?: string;
  photo?: string;
  created_at?: string;
  updated_at?: string;
}

interface Spouse {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  birthDate: Date | null;
  deathDate: Date | null;
  isAlive: boolean;
  maritalStatus: string;
  marriageDate?: Date | null;
  divorceDate?: Date | null;
  children?: string[];
  notes?: string;
  gender?: 'male' | 'female';
}

interface TreeNode {
  id: string;
  name: string;
  gender: 'male' | 'female';
  birthDate: Date | null;
  deathDate: Date | null;
  isAlive: boolean;
  father_id?: string;
  mother_id?: string;
  spouses: Spouse[];
  children: TreeNode[];
  level: number;
  x: number;
  y: number;
  notes?: string;
  occupation?: string;
  education?: string;
  location?: string;
  phone?: string;
  email?: string;
  photo?: string;
}

interface FamilyData {
  id?: string;
  name: string;
  description?: string;
  members: FamilyMember[];
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

// Utility Functions
const formatDate = (date: Date | null): string => {
  if (!date || !isValidDate(date)) return '';
  return format(date, 'dd/MM/yyyy', { locale: ar });
};

const parseDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  try {
    const date = parseISO(dateString);
    return isValidDate(date) ? date : null;
  } catch {
    return null;
  }
};

const generateId = (): string => {
  return `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const calculateAge = (birthDate: Date | null, deathDate?: Date | null): number | null => {
  if (!birthDate || !isValidDate(birthDate)) return null;
  
  const endDate = deathDate && isValidDate(deathDate) ? deathDate : new Date();
  const age = endDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = endDate.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < birthDate.getDate())) {
    return age - 1;
  }
  
  return age;
};

// Date Display Component
const DateDisplay: React.FC<{ date: Date | null }> = ({ date }) => {
  if (!date || !isValidDate(date)) return <span className="text-gray-400">غير محدد</span>;
  
  const age = calculateAge(date);
  const formattedDate = formatDate(date);
  
  return (
    <span className="font-arabic">
      {formattedDate}
      {age !== null && (
        <span className="text-xs text-gray-500 mr-1">
          ({age} سنة)
        </span>
      )}
    </span>
  );
};

// Age Display Component
const AgeDisplay: React.FC<{ birthDate: Date | null; deathDate?: Date | null }> = ({ 
  birthDate, 
  deathDate 
}) => {
  const age = calculateAge(birthDate, deathDate);
  
  if (age === null) return <span className="text-gray-400">غير محدد</span>;
  
  return (
    <span className="font-arabic">
      {age} سنة
    </span>
  );
};

// Main Component
const FamilyBuilderNew: React.FC = () => {
  // State Management
  const { user } = useAuth();
  const [familyData, setFamilyData] = useState<FamilyData>({
    name: '',
    description: '',
    members: []
  });
  
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [isAddingPerson, setIsAddingPerson] = useState(false);
  const [isAddingSpouse, setIsAddingSpouse] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [editingSpouse, setEditingSpouse] = useState<{ spouse: Spouse; memberIndex: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState<'all' | 'male' | 'female'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'alive' | 'deceased'>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'tree' | 'cards'>('cards');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedFamilies, setSavedFamilies] = useState<FamilyData[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [showFamilySelector, setShowFamilySelector] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [familyDescription, setFamilyDescription] = useState('');
  
  // Refs
  const personFormRef = useRef<PersonFormRef>(null);
  const wifeFormRef = useRef<WifeFormRef>(null);

  // Load saved families on component mount
  useEffect(() => {
    if (user) {
      loadSavedFamilies();
    }
  }, [user]);

  // Database Operations
  const loadSavedFamilies = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('families')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const families = data.map(family => ({
        ...family,
        members: family.members || []
      }));

      setSavedFamilies(families);
    } catch (error) {
      console.error('Error loading families:', error);
      toast.error('حدث خطأ في تحميل العائلات المحفوظة');
    } finally {
      setIsLoading(false);
    }
  };

  const saveFamily = async () => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    if (!familyName.trim()) {
      toast.error('يرجى إدخال اسم العائلة');
      return;
    }

    setIsSaving(true);
    try {
      const familyToSave = {
        name: familyName,
        description: familyDescription,
        members: familyMembers,
        user_id: user.id
      };

      let result;
      if (selectedFamilyId) {
        // Update existing family
        const { data, error } = await supabase
          .from('families')
          .update(familyToSave)
          .eq('id', selectedFamilyId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new family
        const { data, error } = await supabase
          .from('families')
          .insert([familyToSave])
          .select()
          .single();

        if (error) throw error;
        result = data;
        setSelectedFamilyId(result.id);
      }

      setFamilyData(result);
      await loadSavedFamilies();
      toast.success('تم حفظ العائلة بنجاح');
    } catch (error) {
      console.error('Error saving family:', error);
      toast.error('حدث خطأ في حفظ العائلة');
    } finally {
      setIsSaving(false);
    }
  };

  const loadFamily = async (familyId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      const family = {
        ...data,
        members: data.members || []
      };

      setFamilyData(family);
      setFamilyMembers(family.members);
      setFamilyName(family.name);
      setFamilyDescription(family.description || '');
      setSelectedFamilyId(family.id);
      setShowFamilySelector(false);
      toast.success('تم تحميل العائلة بنجاح');
    } catch (error) {
      console.error('Error loading family:', error);
      toast.error('حدث خطأ في تحميل العائلة');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFamily = async (familyId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('families')
        .delete()
        .eq('id', familyId)
        .eq('user_id', user.id);

      if (error) throw error;

      await loadSavedFamilies();
      
      if (selectedFamilyId === familyId) {
        // Reset current family if it was deleted
        setSelectedFamilyId(null);
        setFamilyData({ name: '', description: '', members: [] });
        setFamilyMembers([]);
        setFamilyName('');
        setFamilyDescription('');
      }
      
      toast.success('تم حذف العائلة بنجاح');
    } catch (error) {
      console.error('Error deleting family:', error);
      toast.error('حدث خطأ في حذف العائلة');
    }
  };

  const createNewFamily = () => {
    setSelectedFamilyId(null);
    setFamilyData({ name: '', description: '', members: [] });
    setFamilyMembers([]);
    setFamilyName('');
    setFamilyDescription('');
    setSelectedMember(null);
    setShowFamilySelector(false);
    toast.success('تم إنشاء عائلة جديدة');
  };

  // Member Management Functions
  const addFamilyMember = (memberData: Omit<FamilyMember, 'id' | 'spouses' | 'children'>) => {
    const newMember: FamilyMember = {
      ...memberData,
      id: generateId(),
      spouses: [],
      children: []
    };

    const updatedMembers = [...familyMembers, newMember];
    setFamilyMembers(updatedMembers);
    
    // Update children arrays for parents
    if (newMember.father_id) {
      const fatherIndex = updatedMembers.findIndex(m => m.id === newMember.father_id);
      if (fatherIndex !== -1 && !updatedMembers[fatherIndex].children.includes(newMember.id)) {
        updatedMembers[fatherIndex].children.push(newMember.id);
      }
    }
    
    if (newMember.mother_id) {
      const motherIndex = updatedMembers.findIndex(m => m.id === newMember.mother_id);
      if (motherIndex !== -1 && !updatedMembers[motherIndex].children.includes(newMember.id)) {
        updatedMembers[motherIndex].children.push(newMember.id);
      }
    }

    setFamilyMembers(updatedMembers);
    setIsAddingPerson(false);
    setEditingMember(null);
    toast.success('تم إضافة الفرد بنجاح');
  };

  const updateFamilyMember = (memberId: string, memberData: Partial<FamilyMember>) => {
    const updatedMembers = familyMembers.map(member => {
      if (member.id === memberId) {
        const updatedMember = { ...member, ...memberData };
        
        // Handle parent changes
        const oldFatherId = member.father_id;
        const oldMotherId = member.mother_id;
        const newFatherId = memberData.father_id;
        const newMotherId = memberData.mother_id;
        
        // Remove from old parents' children arrays
        if (oldFatherId && oldFatherId !== newFatherId) {
          const oldFatherIndex = familyMembers.findIndex(m => m.id === oldFatherId);
          if (oldFatherIndex !== -1) {
            familyMembers[oldFatherIndex].children = familyMembers[oldFatherIndex].children.filter(id => id !== memberId);
          }
        }
        
        if (oldMotherId && oldMotherId !== newMotherId) {
          const oldMotherIndex = familyMembers.findIndex(m => m.id === oldMotherId);
          if (oldMotherIndex !== -1) {
            familyMembers[oldMotherIndex].children = familyMembers[oldMotherIndex].children.filter(id => id !== memberId);
          }
        }
        
        return updatedMember;
      }
      return member;
    });

    // Add to new parents' children arrays
    if (memberData.father_id) {
      const fatherIndex = updatedMembers.findIndex(m => m.id === memberData.father_id);
      if (fatherIndex !== -1 && !updatedMembers[fatherIndex].children.includes(memberId)) {
        updatedMembers[fatherIndex].children.push(memberId);
      }
    }
    
    if (memberData.mother_id) {
      const motherIndex = updatedMembers.findIndex(m => m.id === memberData.mother_id);
      if (motherIndex !== -1 && !updatedMembers[motherIndex].children.includes(memberId)) {
        updatedMembers[motherIndex].children.push(memberId);
      }
    }

    setFamilyMembers(updatedMembers);
    setEditingMember(null);
    setIsAddingPerson(false);
    toast.success('تم تحديث بيانات الفرد بنجاح');
  };

  const deleteFamilyMember = (memberId: string) => {
    const memberToDelete = familyMembers.find(m => m.id === memberId);
    if (!memberToDelete) return;

    // Check if member has children
    if (memberToDelete.children.length > 0) {
      toast.error('لا يمكن حذف فرد لديه أطفال. يرجى حذف الأطفال أولاً أو تغيير والديهم.');
      return;
    }

    // Remove from parents' children arrays
    const updatedMembers = familyMembers.filter(member => {
      if (member.id === memberId) return false;
      
      // Remove from children arrays
      if (member.children.includes(memberId)) {
        member.children = member.children.filter(id => id !== memberId);
      }
      
      return true;
    });

    setFamilyMembers(updatedMembers);
    
    if (selectedMember?.id === memberId) {
      setSelectedMember(null);
    }
    
    toast.success('تم حذف الفرد بنجاح');
  };

  // Spouse Management Functions
  const addSpouse = (spouseData: Omit<Spouse, 'id'>) => {
    if (!selectedMember) return;

    const newSpouse: Spouse = {
      ...spouseData,
      id: generateId(),
      children: []
    };

    const updatedMembers = familyMembers.map(member => {
      if (member.id === selectedMember.id) {
        return {
          ...member,
          spouses: [...member.spouses, newSpouse]
        };
      }
      return member;
    });

    setFamilyMembers(updatedMembers);
    setSelectedMember({
      ...selectedMember,
      spouses: [...selectedMember.spouses, newSpouse]
    });
    
    setIsAddingSpouse(false);
    toast.success('تم إضافة الزوج/الزوجة بنجاح');
  };

  const updateSpouse = (memberIndex: number, spouseIndex: number, spouseData: Partial<Spouse>) => {
    const updatedMembers = [...familyMembers];
    updatedMembers[memberIndex].spouses[spouseIndex] = {
      ...updatedMembers[memberIndex].spouses[spouseIndex],
      ...spouseData
    };

    setFamilyMembers(updatedMembers);
    
    if (selectedMember && selectedMember.id === updatedMembers[memberIndex].id) {
      setSelectedMember(updatedMembers[memberIndex]);
    }
    
    setEditingSpouse(null);
    toast.success('تم تحديث بيانات الزوج/الزوجة بنجاح');
  };

  const deleteSpouse = (memberIndex: number, spouseIndex: number) => {
    const updatedMembers = [...familyMembers];
    updatedMembers[memberIndex].spouses.splice(spouseIndex, 1);

    setFamilyMembers(updatedMembers);
    
    if (selectedMember && selectedMember.id === updatedMembers[memberIndex].id) {
      setSelectedMember(updatedMembers[memberIndex]);
    }
    
    toast.success('تم حذف الزوج/الزوجة بنجاح');
  };

  const handleEditSpouse = (spouse: Spouse, memberIndex: number) => {
    const spouseIndex = familyMembers[memberIndex].spouses.findIndex(s => s.id === spouse.id);
    setEditingSpouse({ spouse, memberIndex });
    setIsAddingSpouse(true);
  };

  // Filter and Search Functions
  const getFilteredMembers = useCallback(() => {
    return familyMembers.filter(member => {
      const matchesSearch = searchTerm === '' || 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.last_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesGender = filterGender === 'all' || member.gender === filterGender;
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'alive' && member.isAlive) ||
        (filterStatus === 'deceased' && !member.isAlive);
      
      return matchesSearch && matchesGender && matchesStatus;
    });
  }, [familyMembers, searchTerm, filterGender, filterStatus]);

  // Tree Building Functions
  const buildFamilyTree = useCallback((): TreeNode[] => {
    const roots: TreeNode[] = [];
    const processed = new Set<string>();

    const convertToTreeNode = (member: FamilyMember, level: number = 0): TreeNode => {
      const children = member.children
        .map(childId => familyMembers.find(m => m.id === childId))
        .filter((child): child is FamilyMember => child !== undefined)
        .map(child => convertToTreeNode(child, level + 1));

      return {
        ...member,
        children,
        level,
        x: 0,
        y: 0
      };
    };

    // Find root members (those without parents)
    familyMembers.forEach(member => {
      if (!member.father_id && !member.mother_id && !processed.has(member.id)) {
        const treeNode = convertToTreeNode(member);
        roots.push(treeNode);
        processed.add(member.id);
      }
    });

    return roots;
  }, [familyMembers]);

  // Statistics Functions
  const getStatistics = useCallback(() => {
    const total = familyMembers.length;
    const males = familyMembers.filter(m => m.gender === 'male').length;
    const females = familyMembers.filter(m => m.gender === 'female').length;
    const alive = familyMembers.filter(m => m.isAlive).length;
    const deceased = familyMembers.filter(m => !m.isAlive).length;
    const married = familyMembers.filter(m => m.spouses.length > 0).length;
    const children = familyMembers.filter(m => m.father_id || m.mother_id).length;
    const parents = familyMembers.filter(m => m.children.length > 0).length;

    return {
      total,
      males,
      females,
      alive,
      deceased,
      married,
      children,
      parents
    };
  }, [familyMembers]);

  const statistics = getStatistics();
  const filteredMembers = getFilteredMembers();

  // Render Functions
  const renderMemberCard = (member: FamilyMember, index: number) => {
    const father = member.father_id ? familyMembers.find(m => m.id === member.father_id) : null;
    const mother = member.mother_id ? familyMembers.find(m => m.id === member.mother_id) : null;
    const children = member.children.map(childId => familyMembers.find(m => m.id === childId)).filter(Boolean);

    return (
      <Card 
        key={member.id} 
        className={cn(
          "cursor-pointer transition-all duration-300 hover:shadow-lg border-2",
          selectedMember?.id === member.id 
            ? "border-primary bg-primary/5 shadow-lg" 
            : "border-border hover:border-primary/50"
        )}
        onClick={() => setSelectedMember(member)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2 font-arabic">
              {member.gender === 'male' ? (
                <User className="h-5 w-5 text-blue-500" />
              ) : (
                <Users className="h-5 w-5 text-pink-500" />
              )}
              {member.name}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Badge variant={member.isAlive ? "default" : "secondary"} className="text-xs">
                {member.isAlive ? "حي" : "متوفى"}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingMember(member);
                  setIsAddingPerson(true);
                }}
                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteFamilyMember(member.id);
                }}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Basic Info */}
          <div className="grid grid-cols-1 gap-2 text-sm">
            {member.birthDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-green-600" />
                <span className="text-muted-foreground">الميلاد:</span>
                <DateDisplay date={member.birthDate} />
              </div>
            )}
            
            {!member.isAlive && member.deathDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-red-600" />
                <span className="text-muted-foreground">الوفاة:</span>
                <DateDisplay date={member.deathDate} />
              </div>
            )}

            {member.occupation && (
              <div className="flex items-center gap-2">
                <Briefcase className="h-3 w-3 text-purple-600" />
                <span className="text-muted-foreground">المهنة:</span>
                <span className="font-arabic">{member.occupation}</span>
              </div>
            )}

            {member.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 text-orange-600" />
                <span className="text-muted-foreground">المكان:</span>
                <span className="font-arabic">{member.location}</span>
              </div>
            )}
          </div>

          {/* Family Relations */}
          <div className="space-y-2">
            {(father || mother) && (
              <div className="text-xs">
                <span className="text-muted-foreground">الوالدان:</span>
                <div className="mt-1 space-y-1">
                  {father && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-blue-500" />
                      <span className="font-arabic">{father.name}</span>
                    </div>
                  )}
                  {mother && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-pink-500" />
                      <span className="font-arabic">{mother.name}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {member.spouses.length > 0 && (
              <div className="text-xs">
                <span className="text-muted-foreground">الأزواج:</span>
                <div className="mt-1 space-y-1">
                  {member.spouses.map((spouse, spouseIndex) => (
                    <div key={spouse.id} className="flex items-center gap-1">
                      <Heart className="h-3 w-3 text-red-500" />
                      <span className="font-arabic">{spouse.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {spouse.maritalStatus === 'married' ? 'متزوج' : 'مطلق'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {children.length > 0 && (
              <div className="text-xs">
                <span className="text-muted-foreground">الأطفال ({children.length}):</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {children.slice(0, 3).map((child) => (
                    <Badge key={child?.id} variant="secondary" className="text-xs font-arabic">
                      {child?.name}
                    </Badge>
                  ))}
                  {children.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{children.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderMemberDetails = () => {
    if (!selectedMember) {
      return (
        <Card className="h-full flex items-center justify-center">
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2 font-arabic">
              اختر فرداً من العائلة
            </h3>
            <p className="text-sm text-muted-foreground font-arabic">
              اختر فرداً من القائمة لعرض تفاصيله وإدارة بياناته
            </p>
          </CardContent>
        </Card>
      );
    }

    const father = selectedMember.father_id ? familyMembers.find(m => m.id === selectedMember.father_id) : null;
    const mother = selectedMember.mother_id ? familyMembers.find(m => m.id === selectedMember.mother_id) : null;
    const children = selectedMember.children.map(childId => familyMembers.find(m => m.id === childId)).filter(Boolean);
    const siblings = familyMembers.filter(m => 
      m.id !== selectedMember.id && 
      ((selectedMember.father_id && m.father_id === selectedMember.father_id) ||
       (selectedMember.mother_id && m.mother_id === selectedMember.mother_id))
    );

    return (
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-foreground flex items-center gap-3 font-arabic">
              {selectedMember.gender === 'male' ? (
                <User className="h-6 w-6 text-blue-500" />
              ) : (
                <Users className="h-6 w-6 text-pink-500" />
              )}
              {selectedMember.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={selectedMember.isAlive ? "default" : "secondary"}>
                {selectedMember.isAlive ? "على قيد الحياة" : "متوفى"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingMember(selectedMember);
                  setIsAddingPerson(true);
                }}
                className="text-blue-600 hover:text-blue-700"
              >
                <Edit2 className="h-4 w-4 mr-1" />
                تعديل
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <ScrollArea className="h-[calc(100vh-300px)]">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2 font-arabic">
                  <Info className="h-4 w-4 text-primary" />
                  المعلومات الأساسية
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">الاسم الكامل:</span>
                      <span className="font-medium font-arabic">{selectedMember.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">الجنس:</span>
                      <Badge variant="outline">
                        {selectedMember.gender === 'male' ? 'ذكر' : 'أنثى'}
                      </Badge>
                    </div>

                    {selectedMember.birthDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-green-600" />
                        <span className="text-muted-foreground">تاريخ الميلاد:</span>
                        <DateDisplay date={selectedMember.birthDate} />
                      </div>
                    )}

                    {!selectedMember.isAlive && selectedMember.deathDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-red-600" />
                        <span className="text-muted-foreground">تاريخ الوفاة:</span>
                        <DateDisplay date={selectedMember.deathDate} />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {selectedMember.occupation && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-purple-600" />
                        <span className="text-muted-foreground">المهنة:</span>
                        <span className="font-arabic">{selectedMember.occupation}</span>
                      </div>
                    )}

                    {selectedMember.education && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-blue-600" />
                        <span className="text-muted-foreground">التعليم:</span>
                        <span className="font-arabic">{selectedMember.education}</span>
                      </div>
                    )}

                    {selectedMember.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-orange-600" />
                        <span className="text-muted-foreground">المكان:</span>
                        <span className="font-arabic">{selectedMember.location}</span>
                      </div>
                    )}

                    {selectedMember.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-green-600" />
                        <span className="text-muted-foreground">الهاتف:</span>
                        <span>{selectedMember.phone}</span>
                      </div>
                    )}

                    {selectedMember.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-red-600" />
                        <span className="text-muted-foreground">البريد:</span>
                        <span>{selectedMember.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Family Relations */}
              <div>
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2 font-arabic">
                  <Users className="h-4 w-4 text-primary" />
                  العلاقات العائلية
                </h4>
                
                {/* Parents */}
                {(father || mother) && (
                  <div className="mb-4">
                    <h5 className="font-medium text-muted-foreground mb-2 font-arabic">الوالدان</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {father && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-900 dark:text-blue-100 font-arabic">الأب</span>
                          </div>
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-200 font-arabic">{father.name}</p>
                          {father.birthDate && (
                            <p className="text-xs text-blue-600 dark:text-blue-300">
                              <DateDisplay date={father.birthDate} />
                            </p>
                          )}
                        </div>
                      )}
                      
                      {mother && (
                        <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-3 border border-pink-200 dark:border-pink-800">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4 text-pink-600" />
                            <span className="font-medium text-pink-900 dark:text-pink-100 font-arabic">الأم</span>
                          </div>
                          <p className="text-sm font-medium text-pink-800 dark:text-pink-200 font-arabic">{mother.name}</p>
                          {mother.birthDate && (
                            <p className="text-xs text-pink-600 dark:text-pink-300">
                              <DateDisplay date={mother.birthDate} />
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Spouses */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-muted-foreground font-arabic">الأزواج</h5>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingSpouse(true)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      إضافة زوج/زوجة
                    </Button>
                  </div>
                  
                  {selectedMember.spouses.length === 0 ? (
                    <p className="text-sm text-muted-foreground font-arabic">لا يوجد أزواج مسجلون</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedMember.spouses.map((partner, index) => (
                        <div key={partner.id} className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                          {/* Partner Details */}
                          {partner && (
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 font-arabic">
                                  <Heart className="h-4 w-4 text-pink-500" />
                                  تفاصيل الشريك
                                </h4>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditSpouse(partner, index)}
                                  className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                >
                                  <Edit2 className="h-3 w-3 mr-1" />
                                  تعديل
                                </Button>
                              </div>
                              
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <Users className="h-3 w-3 text-slate-500" />
                                  <span className="text-slate-600 dark:text-slate-400">الاسم:</span>
                                  <span className="font-medium text-slate-900 dark:text-slate-100 font-arabic">
                                    {partner.name}
                                  </span>
                                </div>
                                
                                {(() => {
                                  // Find the actual partner member object to get their gender and father info
                                  const partnerMember = familyMembers.find(m => m.id === partner.id);
                                  const partnerFather = partnerMember?.father_id ? familyMembers.find(f => f.id === partnerMember.father_id) : null;
                                  const partnerGrandfather = partnerFather?.father_id ? familyMembers.find(gf => gf.id === partnerFather.father_id) : null;
                                  
                                  return (
                                    <>
                                      {partnerFather && (
                                        <div className="flex items-center gap-2">
                                          <User className="h-3 w-3 text-slate-500" />
                                          <span className="text-slate-600 dark:text-slate-400">الأب:</span>
                                          <p className="text-xs text-blue-600 dark:text-blue-400 truncate font-arabic">
                                            {partner.name} {partnerMember?.gender === 'female' ? 'بنت' : 'ابن'} {partnerFather.name}
                                            {partnerGrandfather && ` ${partnerFather.gender === 'female' ? 'بنت' : 'ابن'} ${partnerGrandfather.name}`}
                                          </p>
                                        </div>
                                      )}
                                      
                                      {partner.birthDate && (
                                        <div className="flex items-center gap-2">
                                          <Calendar className="h-3 w-3 text-slate-500" />
                                          <span className="text-slate-600 dark:text-slate-400">تاريخ الميلاد:</span>
                                          <span className="text-slate-900 dark:text-slate-100">
                                            <DateDisplay date={partner.birthDate} />
                                          </span>
                                        </div>
                                      )}
                                      
                                      {!partner.isAlive && partner.deathDate && (
                                        <div className="flex items-center gap-2">
                                          <Calendar className="h-3 w-3 text-red-500" />
                                          <span className="text-slate-600 dark:text-slate-400">تاريخ الوفاة:</span>
                                          <span className="text-slate-900 dark:text-slate-100">
                                            <DateDisplay date={partner.deathDate} />
                                          </span>
                                        </div>
                                      )}
                                      
                                      <div className="flex items-center gap-2">
                                        <Heart className={`h-3 w-3 ${partner.isAlive ? 'text-green-500' : 'text-red-500'}`} />
                                        <span className="text-slate-600 dark:text-slate-400">الحالة:</span>
                                        <span className="text-slate-900 dark:text-slate-100 font-arabic">
                                          {partner.isAlive ? 'على قيد الحياة' : 'متوفى'}
                                        </span>
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Heart className="h-4 w-4 text-red-600" />
                              <span className="font-medium text-red-900 dark:text-red-100 font-arabic">{partner.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs">
                                {partner.maritalStatus === 'married' ? 'متزوج' : 'مطلق'}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditSpouse(partner, familyMembers.findIndex(m => m.id === selectedMember.id))}
                                className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteSpouse(familyMembers.findIndex(m => m.id === selectedMember.id), index)}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="space-y-1 text-xs text-red-700 dark:text-red-300">
                            {partner.birthDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>الميلاد: <DateDisplay date={partner.birthDate} /></span>
                              </div>
                            )}
                            
                            {!partner.isAlive && partner.deathDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>الوفاة: <DateDisplay date={partner.deathDate} /></span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-1">
                              <Heart className={`h-3 w-3 ${partner.isAlive ? 'text-green-500' : 'text-red-500'}`} />
                              <span>{partner.isAlive ? 'على قيد الحياة' : 'متوفى'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Children */}
                {children.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-medium text-muted-foreground mb-2 font-arabic">الأطفال ({children.length})</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {children.map((child) => (
                        <div key={child?.id} className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                             onClick={() => setSelectedMember(child!)}>
                          <div className="flex items-center gap-2 mb-1">
                            {child?.gender === 'male' ? (
                              <User className="h-4 w-4 text-green-600" />
                            ) : (
                              <Users className="h-4 w-4 text-green-600" />
                            )}
                            <span className="font-medium text-green-900 dark:text-green-100 font-arabic">{child?.name}</span>
                          </div>
                          {child?.birthDate && (
                            <p className="text-xs text-green-600 dark:text-green-300">
                              <AgeDisplay birthDate={child.birthDate} deathDate={child.deathDate} />
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Siblings */}
                {siblings.length > 0 && (
                  <div>
                    <h5 className="font-medium text-muted-foreground mb-2 font-arabic">الأشقاء ({siblings.length})</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {siblings.map((sibling) => (
                        <div key={sibling.id} className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                             onClick={() => setSelectedMember(sibling)}>
                          <div className="flex items-center gap-2 mb-1">
                            {sibling.gender === 'male' ? (
                              <User className="h-4 w-4 text-yellow-600" />
                            ) : (
                              <Users className="h-4 w-4 text-yellow-600" />
                            )}
                            <span className="font-medium text-yellow-900 dark:text-yellow-100 font-arabic">{sibling.name}</span>
                          </div>
                          {sibling.birthDate && (
                            <p className="text-xs text-yellow-600 dark:text-yellow-300">
                              <AgeDisplay birthDate={sibling.birthDate} deathDate={sibling.deathDate} />
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedMember.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2 font-arabic">
                      <FileText className="h-4 w-4 text-primary" />
                      ملاحظات
                    </h4>
                    <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 font-arabic">
                      {selectedMember.notes}
                    </p>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2 font-arabic">
                بناء شجرة العائلة
              </h1>
              <p className="text-slate-600 dark:text-slate-400 font-arabic">
                قم بإنشاء وإدارة شجرة عائلتك بسهولة ووضوح
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Family Management */}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="اسم العائلة"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="w-40 h-10 font-arabic"
                />
                <Button
                  onClick={() => setShowFamilySelector(true)}
                  variant="outline"
                  size="sm"
                  className="h-10"
                >
                  <Archive className="h-4 w-4 mr-1" />
                  العائلات
                </Button>
                <Button
                  onClick={saveFamily}
                  disabled={isSaving || !familyName.trim()}
                  size="sm"
                  className="h-10"
                >
                  {isSaving ? (
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  حفظ
                </Button>
              </div>

              <Button
                onClick={() => setIsAddingPerson(true)}
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg h-10"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                إضافة فرد
              </Button>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mt-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center border border-blue-200 dark:border-blue-800">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{statistics.total}</div>
              <div className="text-xs text-blue-700 dark:text-blue-300 font-arabic">المجموع</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center border border-green-200 dark:border-green-800">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{statistics.males}</div>
              <div className="text-xs text-green-700 dark:text-green-300 font-arabic">ذكور</div>
            </div>
            <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-3 text-center border border-pink-200 dark:border-pink-800">
              <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">{statistics.females}</div>
              <div className="text-xs text-pink-700 dark:text-pink-300 font-arabic">إناث</div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-center border border-emerald-200 dark:border-emerald-800">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{statistics.alive}</div>
              <div className="text-xs text-emerald-700 dark:text-emerald-300 font-arabic">أحياء</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center border border-red-200 dark:border-red-800">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{statistics.deceased}</div>
              <div className="text-xs text-red-700 dark:text-red-300 font-arabic">متوفون</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center border border-purple-200 dark:border-purple-800">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{statistics.married}</div>
              <div className="text-xs text-purple-700 dark:text-purple-300 font-arabic">متزوجون</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center border border-orange-200 dark:border-orange-800">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{statistics.children}</div>
              <div className="text-xs text-orange-700 dark:text-orange-300 font-arabic">أطفال</div>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 text-center border border-indigo-200 dark:border-indigo-800">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{statistics.parents}</div>
              <div className="text-xs text-indigo-700 dark:text-indigo-300 font-arabic">آباء</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Members List */}
          <div className="lg:col-span-1 space-y-4">
            {/* Search and Filters */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/20 dark:border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 font-arabic">
                  <Search className="h-5 w-5 text-primary" />
                  البحث والتصفية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="البحث في أفراد العائلة..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 font-arabic"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Select value={filterGender} onValueChange={(value: 'all' | 'male' | 'female') => setFilterGender(value)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="الجنس" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="male">ذكور</SelectItem>
                      <SelectItem value="female">إناث</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={(value: 'all' | 'alive' | 'deceased') => setFilterStatus(value)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="alive">أحياء</SelectItem>
                      <SelectItem value="deceased">متوفون</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="font-arabic">عرض {filteredMembers.length} من {familyMembers.length}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode('cards')}
                      className={cn("h-8 w-8 p-0", viewMode === 'cards' && "bg-primary/10 text-primary")}
                    >
                      <Layers className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={cn("h-8 w-8 p-0", viewMode === 'list' && "bg-primary/10 text-primary")}
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Members List */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/20 dark:border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 font-arabic">
                  <Users className="h-5 w-5 text-primary" />
                  أفراد العائلة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  {filteredMembers.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-muted-foreground mb-2 font-arabic">
                        لا يوجد أفراد
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 font-arabic">
                        ابدأ بإضافة أول فرد في العائلة
                      </p>
                      <Button
                        onClick={() => setIsAddingPerson(true)}
                        size="sm"
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        إضافة فرد
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredMembers.map((member, index) => (
                        <div
                          key={member.id}
                          className={cn(
                            "p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md",
                            selectedMember?.id === member.id
                              ? "border-primary bg-primary/5 shadow-md"
                              : "border-border hover:border-primary/50 bg-card"
                          )}
                          onClick={() => setSelectedMember(member)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {member.gender === 'male' ? (
                                <User className="h-4 w-4 text-blue-500" />
                              ) : (
                                <Users className="h-4 w-4 text-pink-500" />
                              )}
                              <span className="font-medium text-foreground font-arabic">{member.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Badge variant={member.isAlive ? "default" : "secondary"} className="text-xs">
                                {member.isAlive ? "حي" : "متوفى"}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="text-xs text-muted-foreground space-y-1">
                            {member.birthDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <AgeDisplay birthDate={member.birthDate} deathDate={member.deathDate} />
                              </div>
                            )}
                            
                            {member.spouses.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Heart className="h-3 w-3 text-red-500" />
                                <span>{member.spouses.length} زوج/زوجة</span>
                              </div>
                            )}
                            
                            {member.children.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Baby className="h-3 w-3 text-green-500" />
                                <span>{member.children.length} طفل</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Member Details */}
          <div className="lg:col-span-2">
            {renderMemberDetails()}
          </div>
        </div>

        {/* Dialogs */}
        
        {/* Add/Edit Person Dialog */}
        <Dialog open={isAddingPerson} onOpenChange={setIsAddingPerson}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2 font-arabic">
                <UserPlus className="h-5 w-5 text-primary" />
                {editingMember ? 'تعديل بيانات الفرد' : 'إضافة فرد جديد'}
              </DialogTitle>
            </DialogHeader>
            
            <PersonForm
              ref={personFormRef}
              onAddPerson={editingMember ? 
                (data) => updateFamilyMember(editingMember.id, data) : 
                addFamilyMember
              }
              familyMembers={familyMembers}
              initialData={editingMember}
            />
            
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingPerson(false);
                  setEditingMember(null);
                }}
              >
                إلغاء
              </Button>
              <Button
                onClick={() => personFormRef.current?.handleSubmit()}
                disabled={!personFormRef.current?.isValid()}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {editingMember ? 'حفظ التغييرات' : 'إضافة الفرد'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add/Edit Spouse Dialog */}
        <Dialog open={isAddingSpouse} onOpenChange={setIsAddingSpouse}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2 font-arabic">
                <Heart className="h-5 w-5 text-red-500" />
                {editingSpouse ? 'تعديل بيانات الزوج/الزوجة' : 'إضافة زوج/زوجة'}
              </DialogTitle>
            </DialogHeader>
            
            <WifeForm
              ref={wifeFormRef}
              onAddWife={editingSpouse ? 
                (data) => updateSpouse(editingSpouse.memberIndex, familyMembers[editingSpouse.memberIndex].spouses.findIndex(s => s.id === editingSpouse.spouse.id), data) :
                addSpouse
              }
              initialData={editingSpouse?.spouse}
            />
            
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingSpouse(false);
                  setEditingSpouse(null);
                }}
              >
                إلغاء
              </Button>
              <Button
                onClick={() => wifeFormRef.current?.handleSubmit()}
                disabled={!wifeFormRef.current?.isValid()}
                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {editingSpouse ? 'حفظ التغييرات' : 'إضافة الزوج/الزوجة'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Family Selector Dialog */}
        <Dialog open={showFamilySelector} onOpenChange={setShowFamilySelector}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2 font-arabic">
                <Archive className="h-5 w-5 text-primary" />
                العائلات المحفوظة
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground font-arabic">
                  اختر عائلة لتحميلها أو أنشئ عائلة جديدة
                </p>
                <Button
                  onClick={createNewFamily}
                  size="sm"
                  variant="outline"
                  className="text-green-600 hover:text-green-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  عائلة جديدة
                </Button>
              </div>

              <ScrollArea className="h-[400px]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : savedFamilies.length === 0 ? (
                  <div className="text-center py-12">
                    <Archive className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2 font-arabic">
                      لا توجد عائلات محفوظة
                    </h3>
                    <p className="text-sm text-muted-foreground font-arabic">
                      ابدأ بإنشاء عائلة جديدة
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedFamilies.map((family) => (
                      <div
                        key={family.id}
                        className={cn(
                          "p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md",
                          selectedFamilyId === family.id
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-border hover:border-primary/50 bg-card"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-foreground font-arabic">{family.name}</h3>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">
                              {family.members?.length || 0} فرد
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                loadFamily(family.id!);
                              }}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('هل أنت متأكد من حذف هذه العائلة؟')) {
                                  deleteFamily(family.id!);
                                }
                              }}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {family.description && (
                          <p className="text-sm text-muted-foreground mb-2 font-arabic">
                            {family.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-arabic">
                            آخر تحديث: {family.updated_at ? format(new Date(family.updated_at), 'dd/MM/yyyy', { locale: ar }) : 'غير محدد'}
                          </span>
                          <Button
                            onClick={() => loadFamily(family.id!)}
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                          >
                            تحميل
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default FamilyBuilderNew;
