
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CircleUserRound, CreditCard, Users, Package, Router, MessageSquare, Scale, ShieldCheck, Tree2, LucideIcon } from "lucide-react";
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
}

interface TranslationType {
  id: string;
  key: string;
  value: string;
  language_code: string;
  category: string;
}

interface RelationshipTerm {
  key: string;
  label: string;
}

export default function EnhancedAdminPanel() {
  const { toast } = useToast();
  const { currentLanguage } = useLanguage();
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [newPackage, setNewPackage] = useState<Omit<PackageType, 'id'>>({
    name: '',
    description: '',
    price: 0,
    price_usd: 0,
    price_sar: 0,
    max_family_members: 0,
    max_family_trees: 0,
    display_order: 0,
    is_active: true,
    is_featured: false
  });
  const [loading, setLoading] = useState(true);
  const [relationshipTerms, setRelationshipTerms] = useState<RelationshipTerm[]>([
    { key: 'father', label: 'Father' },
    { key: 'mother', label: 'Mother' },
    { key: 'son', label: 'Son' },
    { key: 'daughter', label: 'Daughter' },
    { key: 'brother', label: 'Brother' },
    { key: 'sister', label: 'Sister' },
    { key: 'grandfather', label: 'Grandfather' },
    { key: 'grandmother', label: 'Grandmother' },
    { key: 'uncle', label: 'Uncle' },
    { key: 'aunt', label: 'Aunt' },
    { key: 'cousin', label: 'Cousin' },
    { key: 'husband', label: 'Husband' },
    { key: 'wife', label: 'Wife' },
    { key: 'friend', label: 'Friend' },
    { key: 'other', label: 'Other' },
  ]);
  const [translations, setTranslations] = useState<TranslationType[]>([]);

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

  const loadTranslations = async () => {
    try {
      const { data, error } = await supabase
        .from('translations')
        .select('*');

      if (error) throw error;
      setTranslations(data || []);
    } catch (error) {
      console.error('Error loading translations:', error);
    }
  };

  useEffect(() => {
    loadPackages();
    loadTranslations();
  }, []);

  const handleInputChange = (id: string, field: string, value: string | number | boolean) => {
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
        max_family_members: 0,
        max_family_trees: 0,
        display_order: 0,
        is_active: true,
        is_featured: false
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

  const handleBulkUpdate = async () => {
    try {
      for (const pkg of packages) {
        const { error } = await supabase
          .from('packages')
          .update({
            name: pkg.name || 'Package',
            price: pkg.price || 0,
            price_usd: pkg.price_usd || 0,
            price_sar: pkg.price_sar || 0,
            max_family_members: pkg.max_family_members || 0,
            max_family_trees: pkg.max_family_trees || 0,
            display_order: pkg.display_order || 0,
            is_active: pkg.is_active,
            is_featured: pkg.is_featured
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

  const getPackageTranslation = (packageId: string, field: 'name' | 'description') => {
    const translation = translations.find(t => 
      t.key === `package.${packageId}.${field}` && 
      t.language_code === currentLanguage
    );
    return translation?.value || 'No translation available';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/10">
      <Toaster />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Enhanced Admin Panel</h1>

        <Tabs defaultValue="packages" className="space-y-4">
          <TabsList>
            <TabsTrigger value="packages">
              <Package className="mr-2 h-4 w-4" />
              Packages
            </TabsTrigger>
            <TabsTrigger value="relationships">
              <Users className="mr-2 h-4 w-4" />
              Relationships
            </TabsTrigger>
            <TabsTrigger value="translations">
              <MessageSquare className="mr-2 h-4 w-4" />
              Translations
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Scale className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="packages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Existing Packages</CardTitle>
                <CardDescription>
                  Manage existing subscription packages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {packages.map((pkg) => (
                    <div key={pkg.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{getPackageTranslation(pkg.id, 'name')}</p>
                        <p className="text-sm text-muted-foreground">
                          {getPackageTranslation(pkg.id, 'description')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          placeholder="Price USD"
                          value={pkg.price_usd || 0}
                          onChange={(e) => handleInputChange(pkg.id, 'price_usd', Number(e.target.value))}
                          className="w-24"
                        />
                        <Input
                          type="number"
                          placeholder="Price SAR"
                          value={pkg.price_sar || 0}
                          onChange={(e) => handleInputChange(pkg.id, 'price_sar', Number(e.target.value))}
                          className="w-24"
                        />
                        <Input
                          type="number"
                          placeholder="Max Members"
                          value={pkg.max_family_members || 0}
                          onChange={(e) => handleInputChange(pkg.id, 'max_family_members', Number(e.target.value))}
                          className="w-24"
                        />
                        <Switch
                          checked={pkg.is_active}
                          onCheckedChange={(checked) => handleInputChange(pkg.id, 'is_active', checked)}
                        />
                        <Button variant="outline" size="sm" onClick={() => handleDeletePackage(pkg.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="mt-4" onClick={handleBulkUpdate}>
                  Update All
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add New Package</CardTitle>
                <CardDescription>Add a new subscription package</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <Input
                    type="text"
                    placeholder="Package Name"
                    value={newPackage.name || ''}
                    onChange={(e) => handleNewPackageInputChange('name', e.target.value)}
                  />
                  <Input
                    type="text"
                    placeholder="Description"
                    value={newPackage.description || ''}
                    onChange={(e) => handleNewPackageInputChange('description', e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Price USD"
                    value={newPackage.price_usd || 0}
                    onChange={(e) => handleNewPackageInputChange('price_usd', Number(e.target.value))}
                  />
                  <Input
                    type="number"
                    placeholder="Price SAR"
                    value={newPackage.price_sar || 0}
                    onChange={(e) => handleNewPackageInputChange('price_sar', Number(e.target.value))}
                  />
                  <Input
                    type="number"
                    placeholder="Max Family Members"
                    value={newPackage.max_family_members || 0}
                    onChange={(e) => handleNewPackageInputChange('max_family_members', Number(e.target.value))}
                  />
                  <Button onClick={handleAddPackage}>Add Package</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        
          <TabsContent value="relationships" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Family Relationship Terms</CardTitle>
                <CardDescription>
                  Manage relationship terms in different languages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {relationshipTerms.map((term) => {
                    const translation = translations.find(t => 
                      t.key === `relationship.${term.key}` && 
                      t.language_code === currentLanguage
                    );
                    
                    return (
                      <div key={term.key} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{term.key}</p>
                          <p className="text-sm text-muted-foreground">
                            {translation?.value || 'No translation available'}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
