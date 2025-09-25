import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Save, Plus, Edit, Eye, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface Page {
  id: string;
  slug: string;
  title: any;
  content: any;
  meta_description: any;
  meta_keywords: any;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export default function PageEditor() {
  const { toast } = useToast();
  const { languages } = useLanguage();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [newPage, setNewPage] = useState<Omit<Page, 'id' | 'created_at' | 'updated_at'>>({
    slug: '',
    title: {},
    content: {},
    meta_description: {},
    meta_keywords: {},
    is_active: true,
    display_order: 0
  });
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error('Error loading pages:', error);
      toast({
        title: "Error",
        description: "Failed to load pages",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const handleSavePage = async (page: Page) => {
    try {
      const { error } = await supabase
        .from('pages')
        .update({
          slug: page.slug,
          title: page.title,
          content: page.content,
          meta_description: page.meta_description,
          meta_keywords: page.meta_keywords,
          is_active: page.is_active,
          display_order: page.display_order
        })
        .eq('id', page.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Page updated successfully"
      });

      setEditingPage(null);
      loadPages();
    } catch (error) {
      console.error('Error updating page:', error);
      toast({
        title: "Error",
        description: "Failed to update page",
        variant: "destructive"
      });
    }
  };

  const handleAddPage = async () => {
    try {
      const { error } = await supabase
        .from('pages')
        .insert([newPage]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Page created successfully"
      });

      setNewPage({
        slug: '',
        title: {},
        content: {},
        meta_description: {},
        meta_keywords: {},
        is_active: true,
        display_order: 0
      });
      loadPages();
    } catch (error) {
      console.error('Error creating page:', error);
      toast({
        title: "Error",
        description: "Failed to create page",
        variant: "destructive"
      });
    }
  };

  const handleDeletePage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return;

    try {
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Page deleted successfully"
      });

      loadPages();
    } catch (error) {
      console.error('Error deleting page:', error);
      toast({
        title: "Error",
        description: "Failed to delete page",
        variant: "destructive"
      });
    }
  };

  const updatePageField = (page: Page, field: string, value: any, languageCode?: string) => {
    if (languageCode && (field === 'title' || field === 'content' || field === 'meta_description' || field === 'meta_keywords')) {
      const updatedValue = { ...page[field], [languageCode]: value };
      return { ...page, [field]: updatedValue };
    }
    return { ...page, [field]: value };
  };

  const getFieldValue = (page: Page, field: string, languageCode?: string) => {
    if (languageCode && (field === 'title' || field === 'content' || field === 'meta_description' || field === 'meta_keywords')) {
      return page[field][languageCode] || '';
    }
    return page[field];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Pages Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list">
            <TabsList>
              <TabsTrigger value="list">All Pages</TabsTrigger>
              <TabsTrigger value="create">Create New Page</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Slug</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.map((page) => (
                    <TableRow key={page.id}>
                      <TableCell className="font-mono text-sm">{page.slug}</TableCell>
                      <TableCell>
                        {typeof page.title === 'object' && page.title.en 
                          ? page.title.en 
                          : page.title || 'Untitled'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant={page.is_active ? "default" : "secondary"}>
                          {page.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{page.display_order}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingPage(page)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeletePage(page.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="create" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="slug">Page Slug</Label>
                  <Input
                    id="slug"
                    value={newPage.slug}
                    onChange={(e) => setNewPage({ ...newPage, slug: e.target.value })}
                    placeholder="privacy-policy"
                  />
                </div>
                <div>
                  <Label htmlFor="order">Display Order</Label>
                  <Input
                    id="order"
                    type="number"
                    value={newPage.display_order}
                    onChange={(e) => setNewPage({ ...newPage, display_order: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={newPage.is_active}
                  onCheckedChange={(checked) => setNewPage({ ...newPage, is_active: checked })}
                />
                <Label>Active</Label>
              </div>

              <Tabs value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <TabsList>
                  {languages.map((lang) => (
                    <TabsTrigger key={lang.code} value={lang.code}>
                      {lang.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {languages.map((lang) => (
                  <TabsContent key={lang.code} value={lang.code} className="space-y-4">
                    <div>
                      <Label>Title ({lang.name})</Label>
                      <Input
                        value={(newPage.title as any)[lang.code] || ''}
                        onChange={(e) => 
                          setNewPage({ 
                            ...newPage, 
                            title: { ...newPage.title, [lang.code]: e.target.value }
                          })
                        }
                        placeholder={`Page title in ${lang.name}`}
                      />
                    </div>

                    <div>
                      <Label>Content ({lang.name})</Label>
                      <ReactQuill
                        value={(newPage.content as any)[lang.code] || ''}
                        onChange={(value) => 
                          setNewPage({ 
                            ...newPage, 
                            content: { ...newPage.content, [lang.code]: value }
                          })
                        }
                        placeholder={`Page content in ${lang.name}`}
                        style={{ minHeight: '200px' }}
                        modules={{
                          toolbar: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            ['link', 'image'],
                            ['clean']
                          ]
                        }}
                      />
                    </div>

                    <div>
                      <Label>Meta Description ({lang.name})</Label>
                      <Textarea
                        value={(newPage.meta_description as any)[lang.code] || ''}
                        onChange={(e) => 
                          setNewPage({ 
                            ...newPage, 
                            meta_description: { ...newPage.meta_description, [lang.code]: e.target.value }
                          })
                        }
                        placeholder={`Meta description in ${lang.name}`}
                        rows={3}
                      />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>

              <Button onClick={handleAddPage} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create Page
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Page Modal */}
      {editingPage && (
        <Card className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] max-w-4xl max-h-[90vh] overflow-auto">
            <Card>
              <CardHeader>
                <CardTitle>Edit Page: {editingPage.slug}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-slug">Page Slug</Label>
                    <Input
                      id="edit-slug"
                      value={editingPage.slug}
                      onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-order">Display Order</Label>
                    <Input
                      id="edit-order"
                      type="number"
                      value={editingPage.display_order}
                      onChange={(e) => setEditingPage({ ...editingPage, display_order: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingPage.is_active}
                    onCheckedChange={(checked) => setEditingPage({ ...editingPage, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>

                <Tabs value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <TabsList>
                    {languages.map((lang) => (
                      <TabsTrigger key={lang.code} value={lang.code}>
                        {lang.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {languages.map((lang) => (
                    <TabsContent key={lang.code} value={lang.code} className="space-y-4">
                      <div>
                        <Label>Title ({lang.name})</Label>
                        <Input
                          value={getFieldValue(editingPage, 'title', lang.code)}
                          onChange={(e) => 
                            setEditingPage(updatePageField(editingPage, 'title', e.target.value, lang.code))
                          }
                        />
                      </div>

                      <div>
                        <Label>Content ({lang.name})</Label>
                        <ReactQuill
                          value={getFieldValue(editingPage, 'content', lang.code)}
                          onChange={(value) => 
                            setEditingPage(updatePageField(editingPage, 'content', value, lang.code))
                          }
                          style={{ minHeight: '300px' }}
                          modules={{
                            toolbar: [
                              [{ 'header': [1, 2, 3, false] }],
                              ['bold', 'italic', 'underline', 'strike'],
                              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                              ['link', 'image'],
                              ['clean']
                            ]
                          }}
                        />
                      </div>

                      <div>
                        <Label>Meta Description ({lang.name})</Label>
                        <Textarea
                          value={getFieldValue(editingPage, 'meta_description', lang.code)}
                          onChange={(e) => 
                            setEditingPage(updatePageField(editingPage, 'meta_description', e.target.value, lang.code))
                          }
                          rows={3}
                        />
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingPage(null)}>
                    Cancel
                  </Button>
                  <Button onClick={() => handleSavePage(editingPage)}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </Card>
      )}
    </div>
  );
}