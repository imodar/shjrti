import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Mail, Edit, Save, X, Plus, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { DirectionWrapper } from "@/components/DirectionWrapper";
import { z } from "zod";

interface EmailTemplate {
  id: string;
  template_key: string;
  template_name: any;
  subject: any;
  body: any;
  description: string;
  variables: string[];
  is_active: boolean;
  from_email: string;
  from_name: string;
  reply_to?: string;
  created_at: string;
  updated_at: string;
}

const testEmailSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

export default function AdminEmailTemplates() {
  const { currentLanguage } = useLanguage();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editLang, setEditLang] = useState<'en' | 'ar'>('en');
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testVariables, setTestVariables] = useState<Record<string, string>>({});

  const { data: templates, isLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("template_key");
      
      if (error) throw error;
      return data as EmailTemplate[];
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async (template: Partial<EmailTemplate>) => {
      const { error } = await supabase
        .from("email_templates")
        .update(template)
        .eq("id", selectedTemplate?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("تم تحديث القالب بنجاح");
      setEditMode(false);
    },
    onError: (error) => {
      toast.error("فشل تحديث القالب: " + error.message);
    },
  });

  const handleSave = () => {
    if (!selectedTemplate) return;
    
    updateTemplateMutation.mutate({
      subject: selectedTemplate.subject,
      body: selectedTemplate.body,
      is_active: selectedTemplate.is_active,
      from_email: selectedTemplate.from_email,
      from_name: selectedTemplate.from_name,
      reply_to: selectedTemplate.reply_to,
    });
  };

  const sendTestEmailMutation = useMutation({
    mutationFn: async () => {
      const validation = testEmailSchema.safeParse({ email: testEmail });
      if (!validation.success) {
        throw new Error(validation.error.errors[0].message);
      }

      const { error } = await supabase.functions.invoke('send-templated-email', {
        body: {
          templateKey: selectedTemplate?.template_key,
          recipientEmail: testEmail,
          recipientName: 'Test User',
          variables: testVariables,
          languageCode: editLang,
        },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`تم إرسال الإيميل التجريبي إلى ${testEmail}`);
      setTestEmailOpen(false);
      setTestEmail("");
      setTestVariables({});
    },
    onError: (error: Error) => {
      toast.error("فشل إرسال الإيميل: " + error.message);
    },
  });

  const handleOpenTestDialog = () => {
    if (!selectedTemplate) return;
    
    // Initialize test variables with empty strings
    const initialVars: Record<string, string> = {};
    selectedTemplate.variables?.forEach((variable) => {
      initialVars[variable] = "";
    });
    setTestVariables(initialVars);
    setTestEmailOpen(true);
  };

  if (isLoading) {
    return (
      <DirectionWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>جاري التحميل...</p>
          </div>
        </div>
      </DirectionWrapper>
    );
  }

  return (
    <DirectionWrapper>
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Mail className="h-8 w-8" />
              إدارة قوالب الإيميلات
            </h1>
            <p className="text-muted-foreground mt-2">
              إدارة وتحرير قوالب الإيميلات المستخدمة في النظام
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Templates List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>القوالب المتاحة</CardTitle>
              <CardDescription>{templates?.length} قالب</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {templates?.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-colors hover:border-primary ${
                    selectedTemplate?.id === template.id ? "border-primary bg-accent" : ""
                  }`}
                  onClick={() => {
                    setSelectedTemplate(template);
                    setEditMode(false);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">
                        {template.template_name[currentLanguage] || template.template_name.en}
                      </h3>
                      <Badge variant={template.is_active ? "default" : "secondary"}>
                        {template.is_active ? "نشط" : "غير نشط"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                    
                    {/* Sender Info */}
                    <div className="text-xs text-muted-foreground space-y-1 mb-2 p-2 bg-background rounded">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span className="font-medium">من:</span>
                        <span>{template.from_name} &lt;{template.from_email}&gt;</span>
                      </div>
                      {template.reply_to && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">الرد إلى:</span>
                          <span>{template.reply_to}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.variables?.map((variable) => (
                        <Badge key={variable} variant="outline" className="text-xs">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Template Editor */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {selectedTemplate
                      ? selectedTemplate.template_name[currentLanguage] || selectedTemplate.template_name.en
                      : "اختر قالباً للتحرير"}
                  </CardTitle>
                  {selectedTemplate && (
                    <CardDescription className="mt-2">{selectedTemplate.description}</CardDescription>
                  )}
                </div>
                {selectedTemplate && (
                  <div className="flex items-center gap-2">
                    {editMode ? (
                      <>
                        <Button onClick={handleSave} size="sm">
                          <Save className="h-4 w-4 mr-2" />
                          حفظ
                        </Button>
                        <Button onClick={() => setEditMode(false)} size="sm" variant="outline">
                          <X className="h-4 w-4 mr-2" />
                          إلغاء
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button onClick={handleOpenTestDialog} size="sm" variant="outline">
                          <Send className="h-4 w-4 mr-2" />
                          اختبار
                        </Button>
                        <Button onClick={() => setEditMode(true)} size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          تحرير
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedTemplate ? (
                <Tabs value={editLang} onValueChange={(v) => setEditLang(v as 'en' | 'ar')}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="ar">العربية</TabsTrigger>
                    <TabsTrigger value="en">English</TabsTrigger>
                  </TabsList>

                  <TabsContent value={editLang} className="space-y-4">
                    {/* Active Status */}
                    <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                      <Label htmlFor="active-toggle">حالة القالب</Label>
                      <Switch
                        id="active-toggle"
                        checked={selectedTemplate.is_active}
                        onCheckedChange={(checked) => {
                          if (editMode) {
                            setSelectedTemplate({ ...selectedTemplate, is_active: checked });
                          } else {
                            toast.error("قم بالتبديل إلى وضع التحرير أولاً");
                          }
                        }}
                        disabled={!editMode}
                      />
                    </div>

                    {/* Sender Configuration */}
                    <div className="space-y-4 p-4 bg-accent/50 rounded-lg border border-border">
                      <h4 className="font-semibold text-sm">إعدادات المرسل</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>اسم المرسل</Label>
                          <Input
                            value={selectedTemplate.from_name || ""}
                            onChange={(e) => {
                              if (editMode) {
                                setSelectedTemplate({
                                  ...selectedTemplate,
                                  from_name: e.target.value,
                                });
                              }
                            }}
                            disabled={!editMode}
                            placeholder="مثال: شجرتي"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>إيميل المرسل</Label>
                          <Input
                            type="email"
                            value={selectedTemplate.from_email || ""}
                            onChange={(e) => {
                              if (editMode) {
                                setSelectedTemplate({
                                  ...selectedTemplate,
                                  from_email: e.target.value,
                                });
                              }
                            }}
                            disabled={!editMode}
                            placeholder="مثال: no-reply@shjrti.com"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>إيميل الرد (اختياري)</Label>
                        <Input
                          type="email"
                          value={selectedTemplate.reply_to || ""}
                          onChange={(e) => {
                            if (editMode) {
                              setSelectedTemplate({
                                ...selectedTemplate,
                                reply_to: e.target.value,
                              });
                            }
                          }}
                          disabled={!editMode}
                          placeholder="مثال: support@shjrti.com"
                        />
                        <p className="text-xs text-muted-foreground">
                          إذا لم يتم تحديده، سيتم استخدام إيميل المرسل
                        </p>
                      </div>
                    </div>

                    {/* Subject */}
                    <div className="space-y-2">
                      <Label>عنوان الإيميل</Label>
                      <Input
                        value={selectedTemplate.subject[editLang] || ""}
                        onChange={(e) => {
                          if (editMode) {
                            setSelectedTemplate({
                              ...selectedTemplate,
                              subject: {
                                ...selectedTemplate.subject,
                                [editLang]: e.target.value,
                              },
                            });
                          }
                        }}
                        disabled={!editMode}
                        placeholder="أدخل عنوان الإيميل"
                      />
                    </div>

                    {/* Body */}
                    <div className="space-y-2">
                      <Label>محتوى الإيميل (HTML)</Label>
                      <Textarea
                        value={selectedTemplate.body[editLang] || ""}
                        onChange={(e) => {
                          if (editMode) {
                            setSelectedTemplate({
                              ...selectedTemplate,
                              body: {
                                ...selectedTemplate.body,
                                [editLang]: e.target.value,
                              },
                            });
                          }
                        }}
                        disabled={!editMode}
                        placeholder="أدخل محتوى الإيميل بصيغة HTML"
                        rows={12}
                        className="font-mono text-sm"
                      />
                    </div>

                    {/* Variables Reference */}
                    <div className="p-4 bg-accent rounded-lg">
                      <h4 className="font-semibold mb-2">المتغيرات المتاحة:</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.variables?.map((variable) => (
                          <Badge key={variable} variant="secondary">
                            {`{{${variable}}}`}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        استخدم هذه المتغيرات في المحتوى بصيغة {`{{variableName}}`}
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>اختر قالباً من القائمة للبدء في التحرير</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Test Email Dialog */}
        <Dialog open={testEmailOpen} onOpenChange={setTestEmailOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إرسال إيميل تجريبي</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-email">البريد الإلكتروني</Label>
                <Input
                  id="test-email"
                  type="email"
                  placeholder="test@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>

              {selectedTemplate?.variables && selectedTemplate.variables.length > 0 && (
                <div className="space-y-2">
                  <Label>قيم المتغيرات (اختياري)</Label>
                  <div className="space-y-3 p-4 bg-accent rounded-lg">
                    {selectedTemplate.variables.map((variable) => (
                      <div key={variable} className="space-y-1">
                        <Label htmlFor={`var-${variable}`} className="text-xs">
                          {variable}
                        </Label>
                        <Input
                          id={`var-${variable}`}
                          placeholder={`قيمة ${variable}`}
                          value={testVariables[variable] || ""}
                          onChange={(e) =>
                            setTestVariables({
                              ...testVariables,
                              [variable]: e.target.value,
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setTestEmailOpen(false)}
                  disabled={sendTestEmailMutation.isPending}
                >
                  إلغاء
                </Button>
                <Button
                  onClick={() => sendTestEmailMutation.mutate()}
                  disabled={sendTestEmailMutation.isPending || !testEmail}
                >
                  {sendTestEmailMutation.isPending ? (
                    <>جاري الإرسال...</>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      إرسال
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DirectionWrapper>
  );
}
