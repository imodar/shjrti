
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
  is_active: boolean;
  is_featured: boolean;
  features?: any;
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
  subscription_status: string | null;
  subscription_end_date: string | null;
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
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalFamilies: 0,
    totalInvoices: 0,
    totalOrders: 0,
    activeSubscriptions: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
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
    features: []
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPackages(),
        loadUsers(),
        loadFamilies(),
        loadInvoices(),
        loadOrders(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setPackages(data || []);
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

  const loadStats = async () => {
    try {
      const [usersCount, familiesCount, invoicesCount, ordersCount, activeSubsCount, revenueData] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('families').select('id', { count: 'exact', head: true }),
        supabase.from('invoices').select('id', { count: 'exact', head: true }),
        supabase.from('store_orders').select('id', { count: 'exact', head: true }),
        supabase.from('families').select('id', { count: 'exact', head: true }).eq('subscription_status', 'active'),
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
        features: []
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
        const { error } = await supabase
          .from('packages')
          .update({
            name: pkg.name || 'Package',
            description: pkg.description,
            price: pkg.price || 0,
            price_usd: pkg.price_usd || 0,
            price_sar: pkg.price_sar || 0,
            max_family_members: pkg.max_family_members || 100,
            max_family_trees: pkg.max_family_trees || 1,
            display_order: pkg.display_order || 0,
            is_active: pkg.is_active,
            is_featured: pkg.is_featured,
            features: pkg.features || []
          })
          .eq('id', pkg.id);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "All packages updated successfully"
      });
    } catch (error) {
      console.error('Error updating packages:', error);
      toast({
        title: "Error",
        description: "Failed to update packages",
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

  const getPackagePrice = (pkg: PackageType) => {
    const price = currentLanguage === 'ar' ? (pkg.price_sar || pkg.price || 0) : (pkg.price_usd || pkg.price || 0);
    return formatPrice(price);
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

          <TabsContent value="packages" className="space-y-6">
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Package Overview</TabsTrigger>
                <TabsTrigger value="features">Manage Features</TabsTrigger>
                <TabsTrigger value="create">Create Package</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Package Management</CardTitle>
                    <CardDescription>Manage subscription packages and their settings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6">
                      {packages.map((pkg) => (
                        <Card key={pkg.id} className={`border-2 ${pkg.is_featured ? 'border-primary' : 'border-border'}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <CardTitle className="text-lg">{pkg.name}</CardTitle>
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
                                <Label className="text-sm font-medium">Package Name</Label>
                                <Input
                                  value={pkg.name || ''}
                                  onChange={(e) => handlePackageInputChange(pkg.id, 'name', e.target.value)}
                                  placeholder="Package Name"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Description</Label>
                                <Input
                                  value={pkg.description || ''}
                                  onChange={(e) => handlePackageInputChange(pkg.id, 'description', e.target.value)}
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

                            {/* Package Features Display */}
                            {pkg.features && (
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Current Features</Label>
                                <div className="flex flex-wrap gap-2">
                                  {Array.isArray(pkg.features) ? pkg.features.map((feature, index) => (
                                    <span key={index} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs">
                                      {typeof feature === 'string' ? feature : feature.name || 'Feature'}
                                    </span>
                                  )) : (
                                    <span className="text-muted-foreground text-sm">No features configured</span>
                                  )}
                                </div>
                              </div>
                            )}
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
                <Card>
                  <CardHeader>
                    <CardTitle>Manage Package Features</CardTitle>
                    <CardDescription>Configure features for each subscription package</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {packages.map((pkg) => (
                      <Card key={pkg.id} className="border">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">{pkg.name} Features</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Features (JSON Format)</Label>
                              <Textarea
                                value={pkg.features ? JSON.stringify(pkg.features, null, 2) : '[]'}
                                onChange={(e) => {
                                  try {
                                    const features = JSON.parse(e.target.value);
                                    handlePackageInputChange(pkg.id, 'features', features);
                                  } catch {
                                    // Invalid JSON, handle gracefully
                                  }
                                }}
                                placeholder={`[
  "Unlimited family members",
  "Advanced family tree visualization",
  "Export to PDF",
  "Premium support"
]`}
                                className="min-h-[120px] font-mono text-sm"
                              />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Enter features as a JSON array of strings or objects with name properties
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Package Name</Label>
                        <Input
                          placeholder="e.g., Premium Plan"
                          value={newPackage.name || ''}
                          onChange={(e) => handleNewPackageInputChange('name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Description</Label>
                        <Input
                          placeholder="Brief description of the package"
                          value={newPackage.description || ''}
                          onChange={(e) => handleNewPackageInputChange('description', e.target.value)}
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
                      <Label className="text-sm font-medium">Package Features (JSON)</Label>
                      <Textarea
                        value={newPackage.features ? JSON.stringify(newPackage.features, null, 2) : '[]'}
                        onChange={(e) => {
                          try {
                            const features = JSON.parse(e.target.value);
                            handleNewPackageInputChange('features', features);
                          } catch {
                            // Invalid JSON, handle gracefully
                          }
                        }}
                        placeholder={`[
  "Feature 1",
  "Feature 2",
  "Feature 3"
]`}
                        className="min-h-[100px] font-mono text-sm"
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
                            family.subscription_status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {family.subscription_status || 'inactive'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {family.subscription_end_date 
                            ? new Date(family.subscription_end_date).toLocaleDateString()
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
                              // Handle tracking number update
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
