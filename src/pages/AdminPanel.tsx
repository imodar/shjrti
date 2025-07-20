import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CircleUserRound, CreditCard, Users, Package, Router, MessageSquare, Scale, ShieldCheck, Trees, BarChart3, Store, Trash2, Save, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

interface PackageType {
  id: string;
  name: string | null;
  description: string | null;
  price: number | null;
  price_usd: number | null;
  price_sar: number | null;
  max_family_members: number | null;
  max_family_trees: number | null;
  display_order: number | null;
  currency?: string;
  created_at?: string;
  updated_at?: string;
  features?: any;
  is_active: boolean;
  is_featured: boolean;
}

interface UserProfile {
  id: string;
  user_id: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
}

interface Family {
  id: string;
  name: string;
  creator_id: string | null;
  is_archived: boolean;
  archived_at: string | null;
  created_at: string;
}

interface Invoice {
  id: string;
  user_id: string | null;
  amount: number;
  currency: string | null;
  status: string | null;
  created_at: string;
}

interface StoreOrder {
  id: string;
  user_id: string | null;
  order_number: string;
  total_amount: number;
  status: string | null;
  tracking_number: string | null;
  created_at: string;
}

interface DashboardStats {
  totalUsers: number;
  totalFamilies: number;
  totalInvoices: number;
  totalOrders: number;
  activeSubscriptions: number;
  totalRevenue: number;
}

export default function AdminPanel() {
  const { toast } = useToast();
  const { currentLanguage, formatPrice, t } = useLanguage();
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalFamilies: 0,
    totalInvoices: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeSubscriptions: 0
  });
  const [languages, setLanguages] = useState<any[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [newPackage, setNewPackage] = useState<Omit<PackageType, 'id'>>({
    name: '',
    description: '',
    price: 0,
    price_usd: 0,
    price_sar: 0,
    max_family_members: 100,
    max_family_trees: 1,
    display_order: 0,
    is_active: true,
    is_featured: false,
    features: {}
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadPackages(),
      loadUsers(),
      loadFamilies(),
      loadInvoices(),
      loadOrders(),
      loadStats(),
      loadLanguages()
    ]);
    setLoading(false);
  };

  const loadPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('display_order');

      if (error) throw error;
      
      // Transform data to include computed price and currency
      const transformedPackages = (data || []).map(pkg => ({
        ...pkg,
        price: (pkg as any).price || pkg.price_usd || pkg.price_sar || 0,
        currency: currentLanguage === 'ar' ? 'SAR' : 'USD'
      }));
      
      setPackages(transformedPackages);
    } catch (error) {
      console.error('Error loading packages:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadFamilies = async () => {
    try {
      const { data, error } = await supabase
        .from('families')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFamilies(data || []);
    } catch (error) {
      console.error('Error loading families:', error);
    }
  };

  const loadInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('store_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const loadLanguages = async () => {
    try {
      const { data, error } = await supabase
        .from('languages')
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false });
      
      if (error) {
        console.error('Error loading languages:', error);
        return;
      }
      
      setLanguages(data || []);
    } catch (error) {
      console.error('Error loading languages:', error);
    }
  };

  const loadStats = async () => {
    try {
      const [usersCount, familiesCount, invoicesCount, ordersCount, activeSubsCount, revenueData] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('families').select('id', { count: 'exact', head: true }),
        supabase.from('invoices').select('id', { count: 'exact', head: true }),
        supabase.from('store_orders').select('id', { count: 'exact', head: true }),
        supabase.from('families').select('id', { count: 'exact', head: true }).eq('is_archived', false),
        supabase.from('invoices').select('amount').eq('status', 'paid')
      ]);

      const totalRevenue = revenueData.data?.reduce((sum, invoice) => sum + (invoice.amount || 0), 0) || 0;

      setStats({
        totalUsers: usersCount.count || 0,
        totalFamilies: familiesCount.count || 0,
        totalInvoices: invoicesCount.count || 0,
        totalOrders: ordersCount.count || 0,
        activeSubscriptions: activeSubsCount.count || 0,
        totalRevenue
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handlePackageInputChange = (id: string, field: string, value: string | number | boolean) => {
    setPackages(prevPackages =>
      prevPackages.map(pkg =>
        pkg.id === id ? { ...pkg, [field]: value } : pkg
      )
    );
  };

  const handleNewPackageInputChange = (field: string, value: string | number | boolean) => {
    setNewPackage({ ...newPackage, [field]: value });
  };

  const handleAddPackage = async () => {
    try {
      const { error } = await supabase
        .from('packages')
        .insert([newPackage]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "New package added successfully"
      });

      loadPackages();
      setNewPackage({
        name: '',
        description: '',
        price: 0,
        price_usd: 0,
        price_sar: 0,
        max_family_members: 100,
        max_family_trees: 1,
        display_order: 0,
        is_active: true,
        is_featured: false,
        features: {}
      });
    } catch (error) {
      console.error('Error adding package:', error);
      toast({
        title: "Error",
        description: "Failed to add package",
        variant: "destructive"
      });
    }
  };

  const handleDeletePackage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Package deleted successfully"
      });

      loadPackages();
    } catch (error) {
      console.error('Error deleting package:', error);
      toast({
        title: "Error",
        description: "Failed to delete package",
        variant: "destructive"
      });
    }
  };

  const handleBulkUpdatePackages = async () => {
    try {
      for (const pkg of packages) {
        // Prepare the update data with proper multilingual handling
        const updateData = {
          // Handle multilingual name - preserve JSON structure or convert string to JSON
          name: typeof pkg.name === 'object' && pkg.name !== null 
            ? pkg.name 
            : (pkg.name || 'Package'),
          
          // Handle multilingual description - preserve JSON structure or convert string to JSON  
          description: typeof pkg.description === 'object' && pkg.description !== null
            ? pkg.description
            : pkg.description,
            
          price: pkg.price || 0,
          price_usd: pkg.price_usd || 0,
          price_sar: pkg.price_sar || 0,
          max_family_members: pkg.max_family_members || 100,
          max_family_trees: pkg.max_family_trees || 1,
          display_order: pkg.display_order || 0,
          is_active: pkg.is_active,
          is_featured: pkg.is_featured,
          
          // Handle multilingual features - preserve JSON structure
          features: typeof pkg.features === 'object' && pkg.features !== null
            ? pkg.features
            : {}
        };

        const { error } = await supabase
          .from('packages')
          .update(updateData)
          .eq('id', pkg.id);

        if (error) {
          console.error('Error updating package:', pkg.id, error);
          throw error;
        }
      }

      toast({
        title: "Success",
        description: "All packages updated successfully"
      });
      
      // Reload packages to reflect any changes
      await loadPackages();
    } catch (error) {
      console.error('Error updating packages:', error);
      toast({
        title: "Error",
        description: "Failed to update packages. Please check the console for details.",
        variant: "destructive"
      });
    }
  };

  const updateInvoiceStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invoice status updated"
      });

      loadInvoices();
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast({
        title: "Error",
        description: "Failed to update invoice",
        variant: "destructive"
      });
    }
  };

  const updateOrderStatus = async (id: string, status: string, trackingNumber?: string) => {
    try {
      const updateData: any = { status };
      if (trackingNumber !== undefined) {
        updateData.tracking_number = trackingNumber;
      }

      const { error } = await supabase
        .from('store_orders')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order status updated"
      });

      loadOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive"
      });
    }
  };

  // Enhanced multilanguage helper functions
  const getLocalizedPackageField = (pkg: PackageType, field: string, language = selectedLanguage) => {
    if (!pkg || !pkg[field as keyof PackageType]) return '';
    
    const fieldValue = pkg[field as keyof PackageType];
    
    // Debug logging
    console.log(`Getting field ${field} for language ${language}:`, fieldValue);
    
    // If it's a string, return it directly
    if (typeof fieldValue === 'string') {
      return fieldValue;
    }
    
    // If it's an object (multilingual), extract the specific language
    if (typeof fieldValue === 'object' && fieldValue !== null) {
      // Ensure it's not an array or other non-plain object
      if (Array.isArray(fieldValue)) {
        return JSON.stringify(fieldValue);
      }
      
      try {
        const localizedValue = (fieldValue as any)[language] || (fieldValue as any)['en'] || '';
        console.log(`Extracted localized value for ${language}:`, localizedValue);
        return localizedValue;
      } catch (error) {
        console.error('Error extracting localized value:', error);
        return JSON.stringify(fieldValue);
      }
    }
    
    return String(fieldValue || '');
  };

  const handleLocalizedPackageChange = (id: string, field: string, language: string, value: string) => {
    setPackages(prevPackages =>
      prevPackages.map(pkg => {
        if (pkg.id !== id) return pkg;
        
        const currentFieldValue = pkg[field as keyof PackageType];
        let newFieldValue;
        
        if (typeof currentFieldValue === 'object' && currentFieldValue !== null) {
          newFieldValue = { ...currentFieldValue, [language]: value };
        } else {
          // Convert string to multilingual object
          const currentStringValue = currentFieldValue as string || '';
          newFieldValue = language === 'en' ? { en: value } : { en: currentStringValue, [language]: value };
        }
        
        return { ...pkg, [field]: newFieldValue };
      })
    );
  };

  const getLocalizedFeatures = (pkg: PackageType, language = selectedLanguage): string[] => {
    if (!pkg.features) return [];
    
    if (Array.isArray(pkg.features)) {
      return pkg.features.map(f => typeof f === 'string' ? f : (f.name || ''));
    }
    
    if (typeof pkg.features === 'object' && pkg.features[language]) {
      return Array.isArray(pkg.features[language]) ? pkg.features[language] : [];
    }
    
    // Fallback to English if selected language not available
    if (typeof pkg.features === 'object' && pkg.features['en']) {
      return Array.isArray(pkg.features['en']) ? pkg.features['en'] : [];
    }
    
    return [];
  };

  const handleLocalizedFeaturesChange = (id: string, language: string, features: string[]) => {
    setPackages(prevPackages =>
      prevPackages.map(pkg => {
        if (pkg.id !== id) return pkg;
        
        const currentFeatures = pkg.features || {};
        const newFeatures = typeof currentFeatures === 'object' ? 
          { ...currentFeatures, [language]: features } : 
          { [language]: features };
        
        return { ...pkg, features: newFeatures };
      })
    );
  };

  const handleNewPackageLocalizedChange = (field: string, language: string, value: string) => {
    const currentFieldValue = newPackage[field as keyof typeof newPackage];
    let newFieldValue;
    
    if (typeof currentFieldValue === 'object' && currentFieldValue !== null) {
      newFieldValue = { ...currentFieldValue, [language]: value };
    } else {
      const currentStringValue = currentFieldValue as string || '';
      newFieldValue = language === 'en' ? { en: value } : { en: currentStringValue, [language]: value };
    }
    
    setNewPackage({ ...newPackage, [field]: newFieldValue });
  };

  const getLocalizedFeaturesForNewPackage = (language = selectedLanguage): string[] => {
    if (!newPackage.features) return [];
    
    if (typeof newPackage.features === 'object' && newPackage.features[language]) {
      return Array.isArray(newPackage.features[language]) ? newPackage.features[language] : [];
    }
    
    return [];
  };

  const handleNewPackageFeaturesChange = (language: string, features: string[]) => {
    const currentFeatures = newPackage.features || {};
    const newFeatures = typeof currentFeatures === 'object' ? 
      { ...currentFeatures, [language]: features } : 
      { [language]: features };
    
    setNewPackage({ ...newPackage, features: newFeatures });
  };

  const getPackagePrice = (pkg: PackageType) => {
    const price = currentLanguage === 'ar' ? (pkg.price_sar || pkg.price || 0) : (pkg.price_usd || pkg.price || 0);
    return formatPrice(price);
  };

  const getDisplayName = (pkg: PackageType) => {
    const localizedName = getLocalizedPackageField(pkg, 'name');
    return localizedName || 'Unnamed Package';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/10">
      <Toaster />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="dashboard">
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="users">
              <CircleUserRound className="mr-2 h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="packages">
              <Package className="mr-2 h-4 w-4" />
              Packages
            </TabsTrigger>
            <TabsTrigger value="families">
              <Trees className="mr-2 h-4 w-4" />
              Families
            </TabsTrigger>
            <TabsTrigger value="invoices">
              <CreditCard className="mr-2 h-4 w-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="orders">
              <Store className="mr-2 h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="content">
              <MessageSquare className="mr-2 h-4 w-4" />
              Content
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <CircleUserRound className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Families</CardTitle>
                  <Trees className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalFamilies}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalInvoices}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <Store className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalOrders}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <Scale className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts and profiles</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Created At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A'}</TableCell>
                        <TableCell>{user.phone || 'N/A'}</TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Packages Tab */}
          <TabsContent value="packages" className="space-y-6">
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Package Overview</TabsTrigger>
                <TabsTrigger value="features">Manage Features</TabsTrigger>
                <TabsTrigger value="create">Create Package</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-medium">Package Management</h3>
                    <p className="text-sm text-muted-foreground">Manage subscription packages and their settings</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm font-medium">Language:</Label>
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {packages.map((pkg) => (
                        <Card key={pkg.id} className={`border-2 ${pkg.is_featured ? 'border-primary' : 'border-border'}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <CardTitle className="text-lg">{getDisplayName(pkg)}</CardTitle>
                                {pkg.is_featured && (
                                  <span className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
                                    Featured
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={pkg.is_active}
                                  onCheckedChange={(checked) => handlePackageInputChange(pkg.id, 'is_active', checked)}
                                />
                                <Button variant="outline" size="sm" onClick={() => handleDeletePackage(pkg.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Package Name ({selectedLanguage.toUpperCase()})</Label>
                                <Input
                                  value={getLocalizedPackageField(pkg, 'name', selectedLanguage)}
                                  onChange={(e) => handleLocalizedPackageChange(pkg.id, 'name', selectedLanguage, e.target.value)}
                                  placeholder="Package Name"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Description ({selectedLanguage.toUpperCase()})</Label>
                                <Input
                                  value={getLocalizedPackageField(pkg, 'description', selectedLanguage)}
                                  onChange={(e) => handleLocalizedPackageChange(pkg.id, 'description', selectedLanguage, e.target.value)}
                                  placeholder="Package Description"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Display Order</Label>
                                <Input
                                  type="number"
                                  value={pkg.display_order || 0}
                                  onChange={(e) => handlePackageInputChange(pkg.id, 'display_order', Number(e.target.value))}
                                  placeholder="Display Order"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Price USD ($)</Label>
                                <Input
                                  type="number"
                                  value={pkg.price_usd || 0}
                                  onChange={(e) => handlePackageInputChange(pkg.id, 'price_usd', Number(e.target.value))}
                                  placeholder="0.00"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Price SAR (ر.س)</Label>
                                <Input
                                  type="number"
                                  value={pkg.price_sar || 0}
                                  onChange={(e) => handlePackageInputChange(pkg.id, 'price_sar', Number(e.target.value))}
                                  placeholder="0.00"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Max Family Members</Label>
                                <Input
                                  type="number"
                                  value={pkg.max_family_members || 0}
                                  onChange={(e) => handlePackageInputChange(pkg.id, 'max_family_members', Number(e.target.value))}
                                  placeholder="100"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Max Family Trees</Label>
                                <Input
                                  type="number"
                                  value={pkg.max_family_trees || 0}
                                  onChange={(e) => handlePackageInputChange(pkg.id, 'max_family_trees', Number(e.target.value))}
                                  placeholder="1"
                                />
                              </div>
                            </div>

                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`featured-${pkg.id}`}
                                  checked={pkg.is_featured}
                                  onCheckedChange={(checked) => handlePackageInputChange(pkg.id, 'is_featured', checked)}
                                />
                                <Label htmlFor={`featured-${pkg.id}`} className="text-sm">Mark as Featured Package</Label>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Current Features ({selectedLanguage.toUpperCase()})</Label>
                              <div className="flex flex-wrap gap-2">
                                {getLocalizedFeatures(pkg, selectedLanguage).length > 0 ? 
                                  getLocalizedFeatures(pkg, selectedLanguage).map((feature, index) => (
                                    <span key={index} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs">
                                      {feature}
                                    </span>
                                  )) : (
                                    <span className="text-muted-foreground text-sm">No features configured for {selectedLanguage.toUpperCase()}</span>
                                  )
                                }
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <Button className="mt-6 w-full" onClick={handleBulkUpdatePackages}>
                      <Save className="mr-2 h-4 w-4" />
                      Save All Changes
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="features" className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-medium">Manage Package Features</h3>
                    <p className="text-sm text-muted-foreground">Configure features for each subscription package in multiple languages</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm font-medium">Language:</Label>
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Card>
                  <CardContent className="space-y-6 p-6">
                    {packages.map((pkg) => (
                      <Card key={pkg.id} className="border">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">{getDisplayName(pkg)} Features ({selectedLanguage.toUpperCase()})</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                Features for {selectedLanguage.toUpperCase()} (One per line)
                              </Label>
                              <Textarea
                                value={getLocalizedFeatures(pkg, selectedLanguage).join('\n')}
                                onChange={(e) => {
                                  const features = e.target.value.split('\n').filter(f => f.trim() !== '');
                                  handleLocalizedFeaturesChange(pkg.id, selectedLanguage, features);
                                }}
                                placeholder={`Enter features for ${selectedLanguage.toUpperCase()}, one per line:
Unlimited family members
Advanced family tree visualization
Export to PDF
Premium support`}
                                className="min-h-[120px] text-sm"
                                rows={6}
                              />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Enter each feature on a new line. Features will be saved for the selected language.
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <Button className="w-full" onClick={handleBulkUpdatePackages}>
                      <Save className="mr-2 h-4 w-4" />
                      Save All Features
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="create" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Package</CardTitle>
                    <CardDescription>Add a new subscription package with all settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-sm font-medium">Editing Language:</Label>
                      <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              {lang.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Package Name ({selectedLanguage.toUpperCase()})</Label>
                        <Input
                          placeholder="e.g., Premium Plan"
                          value={typeof newPackage.name === 'object' ? (newPackage.name as any)[selectedLanguage] || '' : newPackage.name || ''}
                          onChange={(e) => handleNewPackageLocalizedChange('name', selectedLanguage, e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Description ({selectedLanguage.toUpperCase()})</Label>
                        <Input
                          placeholder="Brief description of the package"
                          value={typeof newPackage.description === 'object' ? (newPackage.description as any)[selectedLanguage] || '' : newPackage.description || ''}
                          onChange={(e) => handleNewPackageLocalizedChange('description', selectedLanguage, e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Price USD ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={newPackage.price_usd || 0}
                          onChange={(e) => handleNewPackageInputChange('price_usd', Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Price SAR (ر.س)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={newPackage.price_sar || 0}
                          onChange={(e) => handleNewPackageInputChange('price_sar', Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Max Family Members</Label>
                        <Input
                          type="number"
                          placeholder="100"
                          value={newPackage.max_family_members || 0}
                          onChange={(e) => handleNewPackageInputChange('max_family_members', Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Max Family Trees</Label>
                        <Input
                          type="number"
                          placeholder="1"
                          value={newPackage.max_family_trees || 0}
                          onChange={(e) => handleNewPackageInputChange('max_family_trees', Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Display Order</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={newPackage.display_order || 0}
                          onChange={(e) => handleNewPackageInputChange('display_order', Number(e.target.value))}
                        />
                      </div>
                      <div className="flex items-center space-x-2 pt-7">
                        <Checkbox
                          id="new-featured"
                          checked={newPackage.is_featured || false}
                          onCheckedChange={(checked) => handleNewPackageInputChange('is_featured', checked)}
                        />
                        <Label htmlFor="new-featured" className="text-sm">Mark as Featured Package</Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Package Features ({selectedLanguage.toUpperCase()})</Label>
                      <Textarea
                        value={getLocalizedFeaturesForNewPackage(selectedLanguage).join('\n')}
                        onChange={(e) => {
                          const features = e.target.value.split('\n').filter(f => f.trim() !== '');
                          handleNewPackageFeaturesChange(selectedLanguage, features);
                        }}
                        placeholder={`Enter features for ${selectedLanguage.toUpperCase()}, one per line:
Feature 1
Feature 2
Feature 3`}
                        className="min-h-[100px] text-sm"
                        rows={4}
                      />
                    </div>

                    <Button className="w-full" onClick={handleAddPackage}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Package
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Families Tab */}
          <TabsContent value="families" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Family Management</CardTitle>
                <CardDescription>Manage family trees and subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Family Name</TableHead>
                      <TableHead>Subscription Status</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Created At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {families.map((family) => (
                      <TableRow key={family.id}>
                        <TableCell>{family.name}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-sm ${
                            !family.is_archived 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {family.is_archived ? 'Archived' : 'Active'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {family.archived_at 
                            ? new Date(family.archived_at).toLocaleDateString()
                            : 'N/A'
                          }
                        </TableCell>
                        <TableCell>{new Date(family.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Management</CardTitle>
                <CardDescription>Manage billing and payment status</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{invoice.amount}</TableCell>
                        <TableCell>{invoice.currency}</TableCell>
                        <TableCell>
                          <Select
                            value={invoice.status || 'pending'}
                            onValueChange={(value) => updateInvoiceStatus(invoice.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="failed">Failed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{new Date(invoice.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Store Order Management</CardTitle>
                <CardDescription>Manage store orders and shipping</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order Number</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tracking</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>{order.order_number}</TableCell>
                        <TableCell>{formatPrice(order.total_amount)}</TableCell>
                        <TableCell>
                          <Select
                            value={order.status || 'pending'}
                            onValueChange={(value) => updateOrderStatus(order.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Tracking Number"
                            value={order.tracking_number || ''}
                            onChange={(e) => {
                              if (e.target.value !== order.tracking_number) {
                                updateOrderStatus(order.id, order.status || 'pending', e.target.value);
                              }
                            }}
                            className="w-32"
                          />
                        </TableCell>
                        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Management</CardTitle>
                <CardDescription>Manage website content and translations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Content Management</h3>
                  <p className="text-muted-foreground">Content management features will be implemented here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
