import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Shield, BarChart3, Megaphone, Settings } from 'lucide-react';
import { CookiePreferences } from '@/types/cookies.types';

interface CookieSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CookieSettingsModal = ({ open, onOpenChange }: CookieSettingsModalProps) => {
  const { t } = useLanguage();
  const { hasNecessary, hasAnalytics, hasMarketing, hasPreferences, updatePreferences } = useCookieConsent();
  
  const [localPrefs, setLocalPrefs] = useState<CookiePreferences>({
    necessary: hasNecessary,
    analytics: hasAnalytics,
    marketing: hasMarketing,
    preferences: hasPreferences,
  });

  useEffect(() => {
    setLocalPrefs({
      necessary: hasNecessary,
      analytics: hasAnalytics,
      marketing: hasMarketing,
      preferences: hasPreferences,
    });
  }, [hasNecessary, hasAnalytics, hasMarketing, hasPreferences, open]);

  const handleSave = async () => {
    await updatePreferences(localPrefs);
    onOpenChange(false);
  };

  const cookieTypes = [
    {
      key: 'necessary' as const,
      icon: Shield,
      title: t('cookie_necessary_title', 'ضرورية'),
      description: t('cookie_necessary_desc', 'ملفات تعريف الارتباط الضرورية مطلوبة لتشغيل الموقع بشكل صحيح ولا يمكن تعطيلها.'),
      required: true,
    },
    {
      key: 'analytics' as const,
      icon: BarChart3,
      title: t('cookie_analytics_title', 'تحليلية'),
      description: t('cookie_analytics_desc', 'تساعدنا هذه الملفات في فهم كيفية استخدامك للموقع لتحسين الأداء والمحتوى.'),
      required: false,
    },
    {
      key: 'marketing' as const,
      icon: Megaphone,
      title: t('cookie_marketing_title', 'تسويقية'),
      description: t('cookie_marketing_desc', 'تُستخدم لعرض إعلانات ذات صلة بك وقياس فعالية حملاتنا التسويقية.'),
      required: false,
    },
    {
      key: 'preferences' as const,
      icon: Settings,
      title: t('cookie_preferences_title', 'تفضيلات'),
      description: t('cookie_preferences_desc', 'تحفظ هذه الملفات تفضيلاتك مثل اللغة والثيم لتوفير تجربة مخصصة.'),
      required: false,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {t('cookie_settings_title', 'إعدادات ملفات تعريف الارتباط')}
          </DialogTitle>
          <DialogDescription>
            {t('cookie_settings_description', 'يمكنك التحكم في أنواع ملفات تعريف الارتباط التي نستخدمها. اختر التفضيلات التي تناسبك.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {cookieTypes.map((type) => {
            const Icon = type.icon;
            return (
              <div
                key={type.key}
                className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="mt-1">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor={type.key}
                      className="text-base font-semibold cursor-pointer"
                    >
                      {type.title}
                    </Label>
                    <Switch
                      id={type.key}
                      checked={localPrefs[type.key]}
                      onCheckedChange={(checked) =>
                        setLocalPrefs({ ...localPrefs, [type.key]: checked })
                      }
                      disabled={type.required}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {type.description}
                  </p>
                  {type.required && (
                    <p className="text-xs text-muted-foreground italic">
                      {t('cookie_always_active', 'نشطة دائماً')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cookie_cancel', 'إلغاء')}
          </Button>
          <Button onClick={handleSave}>
            {t('cookie_save_preferences', 'حفظ التفضيلات')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
