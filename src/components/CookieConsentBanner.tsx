import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import { Button } from './ui/button';
import { Cookie, Settings } from 'lucide-react';
import { CookieSettingsModal } from './CookieSettingsModal';

export const CookieConsentBanner = () => {
  const { t } = useLanguage();
  const { showBanner, updatePreferences, isLoading } = useCookieConsent();
  const [showSettings, setShowSettings] = useState(false);

  if (isLoading || !showBanner) {
    return null;
  }

  const handleAcceptAll = async () => {
    await updatePreferences({
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    });
  };

  const handleRejectAll = async () => {
    await updatePreferences({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    });
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-500">
        <div className="bg-gradient-to-r from-background/95 via-background/98 to-background/95 backdrop-blur-lg border-t border-border/50 shadow-2xl">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-1">
                  <Cookie className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {t('cookie_banner_title', 'نستخدم ملفات تعريف الارتباط')}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t('cookie_banner_description', 'نستخدم ملفات تعريف الارتباط لتحسين تجربتك وتحليل استخدام الموقع. يمكنك اختيار الموافقة على جميع الملفات أو تخصيص تفضيلاتك.')}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  {t('cookie_customize', 'تخصيص')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRejectAll}
                >
                  {t('cookie_reject_all', 'رفض الكل')}
                </Button>
                <Button
                  size="sm"
                  onClick={handleAcceptAll}
                  className="bg-primary hover:bg-primary/90"
                >
                  {t('cookie_accept_all', 'قبول الكل')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CookieSettingsModal 
        open={showSettings} 
        onOpenChange={setShowSettings}
      />
    </>
  );
};
