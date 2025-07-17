import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Package, 
  FileText, 
  DollarSign, 
  ShoppingCart, 
  Settings, 
  Home,
  Edit,
  Trash2,
  Plus,
  RefreshCw
} from 'lucide-react';

const AdminPanel = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // State for different data types
  const [users, setUsers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [families, setFamilies] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [storeOrders, setStoreOrders] = useState([]);
  const [homepageContent, setHomepageContent] = useState({});
  const [stats, setStats] = useState<{
    users?: number;
    families?: number;
    invoices?: number;
    orders?: number;
  }>({});

  // Form states
  const [editingPackage, setEditingPackage] = useState(null);
  const [editingContent, setEditingContent] = useState(null);
  const [newPackage, setNewPackage] = useState({
    name: '',
    description: '',
    price: '',
    features: ''
  });

  // Check if user is admin
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    if (isAdmin) {
      loadAllData();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setIsAdmin(!!data);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUsers(),
        loadPackages(),
        loadFamilies(),
        loadInvoices(),
        loadStoreOrders(),
        loadHomepageContent(),
        loadStats()
      ]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    setUsers(data || []);
  };

  const loadPackages = async () => {
    const { data } = await supabase
      .from('packages')
      .select('*')
      .order('created_at', { ascending: false });
    setPackages(data || []);
  };

  const loadFamilies = async () => {
    const { data } = await supabase
      .from('families')
      .select(`
        *,
        profiles:creator_id(first_name, last_name, email),
        packages(name, price)
      `)
      .order('created_at', { ascending: false });
    setFamilies(data || []);
  };

  const loadInvoices = async () => {
    const { data } = await supabase
      .from('invoices')
      .select(`
        *,
        profiles:user_id(first_name, last_name, email),
        packages(name)
      `)
      .order('created_at', { ascending: false });
    setInvoices(data || []);
  };

  const loadStoreOrders = async () => {
    const { data } = await supabase
      .from('store_orders')
      .select(`
        *,
        profiles:user_id(first_name, last_name, email)
      `)
      .order('created_at', { ascending: false });
    setStoreOrders(data || []);
  };

  const loadHomepageContent = async () => {
    const { data } = await supabase
      .from('homepage_content')
      .select('*');
    
    const contentObj = {};
    data?.forEach(item => {
      contentObj[item.section] = item.content;
    });
    setHomepageContent(contentObj);
  };

  const loadStats = async () => {
    const [usersCount, familiesCount, invoicesCount, ordersCount] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('families').select('*', { count: 'exact', head: true }),
      supabase.from('invoices').select('*', { count: 'exact', head: true }),
      supabase.from('store_orders').select('*', { count: 'exact', head: true })
    ]);

    setStats({
      users: usersCount.count || 0,
      families: familiesCount.count || 0,
      invoices: invoicesCount.count || 0,
      orders: ordersCount.count || 0
    });
  };

  const createPackage = async () => {
    try {
      const { error } = await supabase
        .from('packages')
        .insert([{
          name: newPackage.name,
          description: newPackage.description,
          price: parseFloat(newPackage.price),
          features: JSON.parse(newPackage.features || '[]')
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Package created successfully"
      });

      setNewPackage({ name: '', description: '', price: '', features: '' });
      loadPackages();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create package",
        variant: "destructive"
      });
    }
  };

  const updatePackage = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('packages')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Package updated successfully"
      });

      loadPackages();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update package",
        variant: "destructive"
      });
    }
  };

  const updateInvoiceStatus = async (id, status) => {
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
      toast({
        title: "Error",
        description: "Failed to update invoice",
        variant: "destructive"
      });
    }
  };

  const updateOrderStatus = async (id: string, status: string, trackingNumber: string | null = null) => {
    try {
      const updates: any = { status };
      if (trackingNumber) updates.tracking_number = trackingNumber;

      const { error } = await supabase
        .from('store_orders')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order updated successfully"
      });

      loadStoreOrders();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive"
      });
    }
  };

  const updateHomepageContent = async (section, content) => {
    try {
      const { error } = await supabase
        .from('homepage_content')
        .upsert({
          section,
          content,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Homepage content updated"
      });

      loadHomepageContent();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update homepage content",
        variant: "destructive"
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You don't have admin access to this panel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Admin Panel</h1>
          <Button onClick={loadAllData} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="packages">Packages</TabsTrigger>
            <TabsTrigger value="families">Families</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.users || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Families</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.families || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Invoices</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.invoices || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.orders || 0}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.first_name} {user.last_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone}</TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="packages">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Package</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Package Name</Label>
                      <Input
                        id="name"
                        value={newPackage.name}
                        onChange={(e) => setNewPackage({...newPackage, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        type="number"
                        value={newPackage.price}
                        onChange={(e) => setNewPackage({...newPackage, price: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newPackage.description}
                      onChange={(e) => setNewPackage({...newPackage, description: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="features">Features (JSON Array)</Label>
                    <Textarea
                      id="features"
                      value={newPackage.features}
                      onChange={(e) => setNewPackage({...newPackage, features: e.target.value})}
                      placeholder='["Feature 1", "Feature 2", "Feature 3"]'
                    />
                  </div>
                  <Button onClick={createPackage}>Create Package</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Existing Packages</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {packages.map((pkg) => (
                        <TableRow key={pkg.id}>
                          <TableCell>{pkg.name}</TableCell>
                          <TableCell>${pkg.price}</TableCell>
                          <TableCell>
                            <Badge variant={pkg.is_active ? "default" : "secondary"}>
                              {pkg.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => updatePackage(pkg.id, { is_active: !pkg.is_active })}
                              >
                                {pkg.is_active ? "Deactivate" : "Activate"}
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="families">
            <Card>
              <CardHeader>
                <CardTitle>Family Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Family Name</TableHead>
                      <TableHead>Creator</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {families.map((family) => (
                      <TableRow key={family.id}>
                        <TableCell>{family.name}</TableCell>
                        <TableCell>{family.profiles?.first_name} {family.profiles?.last_name}</TableCell>
                        <TableCell>{family.packages?.name}</TableCell>
                        <TableCell>
                          <Badge variant={family.subscription_status === 'active' ? "default" : "secondary"}>
                            {family.subscription_status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(family.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{invoice.profiles?.first_name} {invoice.profiles?.last_name}</TableCell>
                        <TableCell>{invoice.packages?.name}</TableCell>
                        <TableCell>${invoice.amount}</TableCell>
                        <TableCell>
                          <Badge variant={
                            invoice.status === 'paid' ? "default" : 
                            invoice.status === 'pending' ? "secondary" : "destructive"
                          }>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(invoice.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Select
                            value={invoice.status}
                            onValueChange={(value) => updateInvoiceStatus(invoice.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="failed">Failed</SelectItem>
                              <SelectItem value="refunded">Refunded</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Store Order Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tracking</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {storeOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>{order.order_number}</TableCell>
                        <TableCell>{order.profiles?.first_name} {order.profiles?.last_name}</TableCell>
                        <TableCell>${order.total_amount}</TableCell>
                        <TableCell>
                          <Badge variant={
                            order.status === 'delivered' ? "default" : 
                            order.status === 'shipped' ? "secondary" : "outline"
                          }>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{order.tracking_number || 'N/A'}</TableCell>
                        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Select
                              value={order.status}
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Homepage Content Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Object.entries(homepageContent).map(([section, content]) => (
                    <div key={section} className="border p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4 capitalize">{section} Section</h3>
                      <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                        {JSON.stringify(content, null, 2)}
                      </pre>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="mt-4">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit {section}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit {section} Section</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Label>Content (JSON)</Label>
                            <Textarea
                              rows={10}
                              defaultValue={JSON.stringify(content, null, 2)}
                              onChange={(e) => setEditingContent(e.target.value)}
                            />
                            <Button 
                              onClick={() => {
                                try {
                                  const parsed = JSON.parse(editingContent);
                                  updateHomepageContent(section, parsed);
                                } catch (error) {
                                  toast({
                                    title: "Error",
                                    description: "Invalid JSON format",
                                    variant: "destructive"
                                  });
                                }
                              }}
                            >
                              Save Changes
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;