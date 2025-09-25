import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Package {
  id: string;
  name: any; // Can be string, object, or Json from Supabase
  description: any; // Can be string, object, or Json from Supabase  
  price_usd: number;
  price_sar: number;
  max_family_members: number;
  max_family_trees: number;
  display_order: number;
  is_active: boolean;
  is_featured: boolean;
  features?: any; // Can be string, object, or Json from Supabase
  ai_features_enabled?: boolean;
  image_upload_enabled?: boolean;
  custom_domains_enabled?: boolean;
}

interface PackageEditModalProps {
  package: Package | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const PackageEditModal: React.FC<PackageEditModalProps> = ({
  package: pkg,
  isOpen,
  onClose,
  onSave
}) => {
  const { languages } = useLanguage();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<Package>({
    id: '',
    name: {},
    description: {},
    price_usd: 0,
    price_sar: 0,
    max_family_members: 0,
    max_family_trees: 0,
    display_order: 0,
    is_active: true,
    is_featured: false,
    features: {},
    ai_features_enabled: false,
    image_upload_enabled: false,
    custom_domains_enabled: false
  });

  useEffect(() => {
    if (pkg) {
      let processedFeatures = {};
      let processedName = {};
      let processedDescription = {};
      
      // Handle name - it's now JSONB from database
      if (typeof pkg.name === 'object' && pkg.name !== null) {
        processedName = pkg.name;
      } else if (typeof pkg.name === 'string') {
        try {
          processedName = JSON.parse(pkg.name);
        } catch {
          processedName = { en: pkg.name };
        }
      } else {
        processedName = { en: '' };
      }

      // Handle description - it's now JSONB from database
      if (typeof pkg.description === 'object' && pkg.description !== null) {
        processedDescription = pkg.description;
      } else if (typeof pkg.description === 'string') {
        try {
          processedDescription = JSON.parse(pkg.description);
        } catch {
          processedDescription = { en: pkg.description };
        }
      } else {
        processedDescription = { en: '' };
      }

      // Handle features
      if (typeof pkg.features === 'object' && pkg.features !== null) {
        processedFeatures = pkg.features;
      } else if (typeof pkg.features === 'string') {
        try {
          const parsed = JSON.parse(pkg.features || '{}');
          processedFeatures = typeof parsed === 'object' && parsed !== null ? parsed : { en: [] };
        } catch {
          processedFeatures = { en: [] };
        }
      } else {
        processedFeatures = { en: [] };
      }

      // Ensure all feature values are arrays
      Object.keys(processedFeatures).forEach(key => {
        if (!Array.isArray(processedFeatures[key])) {
          processedFeatures[key] = [];
        }
      });

      setFormData({
        ...pkg,
        name: processedName,
        description: processedDescription,
        features: processedFeatures
      });
    }
  }, [pkg]);

  const handleSave = async () => {
    try {
      const updateData = {
        name: formData.name,  // Send as object, not JSON string
        description: formData.description,  // Send as object, not JSON string
        price_usd: formData.price_usd,
        price_sar: formData.price_sar,
        max_family_members: formData.max_family_members,
        max_family_trees: formData.max_family_trees,
        display_order: formData.display_order,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        features: formData.features,  // Send as object, not JSON string
        ai_features_enabled: formData.ai_features_enabled,
        image_upload_enabled: formData.image_upload_enabled,
        custom_domains_enabled: formData.custom_domains_enabled
      };

      const { error } = await supabase
        .from('packages')
        .update(updateData)
        .eq('id', formData.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Package updated successfully"
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating package:', error);
      toast({
        title: "Error",
        description: "Failed to update package",
        variant: "destructive"
      });
    }
  };

  const updateName = (langCode: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      name: {
        ...prev.name as Record<string, string>,
        [langCode]: value
      }
    }));
  };

  const updateDescription = (langCode: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      description: {
        ...prev.description as Record<string, string>,
        [langCode]: value
      }
    }));
  };

  const updateFeatures = (langCode: string, features: string[]) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features as Record<string, string[]>,
        [langCode]: features
      }
    }));
  };

  const addFeature = (langCode: string) => {
    const currentFeatures = (formData.features as Record<string, string[]>)[langCode] || [];
    updateFeatures(langCode, [...currentFeatures, '']);
  };

  const removeFeature = (langCode: string, index: number) => {
    const currentFeatures = (formData.features as Record<string, string[]>)[langCode] || [];
    updateFeatures(langCode, currentFeatures.filter((_, i) => i !== index));
  };

  const updateFeature = (langCode: string, index: number, value: string) => {
    const currentFeatures = (formData.features as Record<string, string[]>)[langCode] || [];
    const newFeatures = [...currentFeatures];
    newFeatures[index] = value;
    updateFeatures(langCode, newFeatures);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="package-edit-description">
        <DialogHeader>
          <DialogTitle>Edit Package</DialogTitle>
          <p id="package-edit-description" className="sr-only">Edit package details including name, description, pricing, and features in multiple languages</p>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="multilingual">Multilingual Content</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price_usd">Price USD</Label>
                <Input
                  id="price_usd"
                  type="number"
                  value={formData.price_usd}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    price_usd: Number(e.target.value)
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="price_sar">Price SAR</Label>
                <Input
                  id="price_sar"
                  type="number"
                  value={formData.price_sar}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    price_sar: Number(e.target.value)
                  }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="max_family_members">Max Family Members</Label>
                <Input
                  id="max_family_members"
                  type="number"
                  value={formData.max_family_members}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    max_family_members: Number(e.target.value)
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="max_family_trees">Max Family Trees</Label>
                <Input
                  id="max_family_trees"
                  type="number"
                  value={formData.max_family_trees}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    max_family_trees: Number(e.target.value)
                  }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  display_order: Number(e.target.value)
                }))}
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    is_active: checked
                  }))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    is_featured: checked
                  }))}
                />
                <Label htmlFor="is_featured">Featured</Label>
              </div>
            </div>

            <div className="flex items-center space-x-4 flex-wrap gap-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="ai_features_enabled"
                  checked={formData.ai_features_enabled || false}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    ai_features_enabled: checked
                  }))}
                />
                <Label htmlFor="ai_features_enabled">ميزات الذكاء الاصطناعي</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="image_upload_enabled"
                  checked={formData.image_upload_enabled || false}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    image_upload_enabled: checked
                  }))}
                />
                <Label htmlFor="image_upload_enabled">رفع الصور</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="custom_domains_enabled"
                  checked={formData.custom_domains_enabled || false}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    custom_domains_enabled: checked
                  }))}
                />
                <Label htmlFor="custom_domains_enabled">الروابط المخصصة</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="member_memories"
                  checked={(formData.features as any)?.member_memories === true || (formData.features as any)?.member_memories === 'true'}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    features: {
                      ...prev.features,
                      member_memories: checked
                    }
                  }))}
                />
                <Label htmlFor="member_memories">ذكريات الأفراد</Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="multilingual" className="space-y-4">
            <Tabs defaultValue={languages[0]?.code || 'en'} className="w-full">
              <TabsList className="grid grid-cols-2 w-full">
                {languages.map((lang) => (
                  <TabsTrigger key={lang.code} value={lang.code}>
                    {lang.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {languages.map((lang) => (
                <TabsContent key={lang.code} value={lang.code} className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Content in {lang.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor={`name_${lang.code}`}>Package Name</Label>
                        <Input
                          id={`name_${lang.code}`}
                          value={(formData.name as Record<string, string>)[lang.code] || ''}
                          onChange={(e) => updateName(lang.code, e.target.value)}
                          placeholder={`Enter package name in ${lang.name}`}
                        />
                      </div>

                      <div>
                        <Label htmlFor={`description_${lang.code}`}>Description</Label>
                        <Textarea
                          id={`description_${lang.code}`}
                          value={(formData.description as Record<string, string>)[lang.code] || ''}
                          onChange={(e) => updateDescription(lang.code, e.target.value)}
                          placeholder={`Enter description in ${lang.name}`}
                          rows={3}
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Features</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addFeature(lang.code)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Feature
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          {((formData.features as Record<string, string[]>)[lang.code] || []).map((feature, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Input
                                value={feature}
                                onChange={(e) => updateFeature(lang.code, index, e.target.value)}
                                placeholder={`Feature ${index + 1} in ${lang.name}`}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeFeature(lang.code, index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};