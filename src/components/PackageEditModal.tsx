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
  name: string | Record<string, string>;
  description: string | Record<string, string>;
  price_usd: number;
  price_sar: number;
  max_family_members: number;
  max_family_trees: number;
  display_order: number;
  is_active: boolean;
  is_featured: boolean;
  features?: string | Record<string, string[]>;
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
    features: {}
  });

  useEffect(() => {
    if (pkg) {
      setFormData({
        ...pkg,
        name: typeof pkg.name === 'string' ? { en: pkg.name } : pkg.name || {},
        description: typeof pkg.description === 'string' ? { en: pkg.description } : pkg.description || {},
        features: typeof pkg.features === 'string' 
          ? { en: JSON.parse(pkg.features || '[]') } 
          : pkg.features || {}
      });
    }
  }, [pkg]);

  const handleSave = async () => {
    try {
      const updateData = {
        name: JSON.stringify(formData.name),
        description: JSON.stringify(formData.description),
        price_usd: formData.price_usd,
        price_sar: formData.price_sar,
        max_family_members: formData.max_family_members,
        max_family_trees: formData.max_family_trees,
        display_order: formData.display_order,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        features: JSON.stringify(formData.features)
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Package</DialogTitle>
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