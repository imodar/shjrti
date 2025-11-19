import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Share2, 
  Copy, 
  Facebook, 
  Twitter, 
  Linkedin, 
  MessageCircle,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyName: string;
  shareLink: string;
  familyId: string;
  hasCustomDomain?: boolean;
}

export const ShareLinkModal: React.FC<ShareLinkModalProps> = ({
  isOpen,
  onClose,
  familyName,
  shareLink,
  familyId,
  hasCustomDomain = false
}) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isGeneratingToken, setIsGeneratingToken] = React.useState(false);
  const [shareToken, setShareToken] = React.useState<string | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = React.useState<string | null>(null);
  
  // Generate share token when modal opens
  React.useEffect(() => {
    if (isOpen && !shareToken) {
      generateShareToken();
    }
  }, [isOpen]);

  const generateShareToken = async () => {
    try {
      setIsGeneratingToken(true);
      
      console.log('[ShareLinkModal] Generating share token for family:', familyId);
      
      const { data, error } = await supabase.rpc('regenerate_share_token', {
        p_family_id: familyId,
        p_expires_in_hours: 2
      });

      if (error) {
        console.error('[ShareLinkModal] Error generating token:', error);
        toast({
          title: t('common.error'),
          description: 'Failed to generate share link',
          variant: 'destructive'
        });
        return;
      }

      console.log('[ShareLinkModal] Token generated:', data);
      
      if (data && data.length > 0) {
        setShareToken(data[0].share_token);
        setTokenExpiresAt(data[0].expires_at);
      }
    } catch (error) {
      console.error('[ShareLinkModal] Unexpected error:', error);
    } finally {
      setIsGeneratingToken(false);
    }
  };
  
  const publicLink = shareToken 
    ? `${window.location.origin}/share?token=${shareToken}`
    : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast({
      title: t('share_modal.link_copied'),
      description: t('share_modal.link_copied_desc')
    });
  };

  const handleCopyPublicLink = () => {
    if (!publicLink) return;
    navigator.clipboard.writeText(publicLink);
    toast({
      title: t('share_modal.public_link_copied'),
      description: t('share_modal.public_link_copied_desc')
    });
  };

  const shareOnFacebook = () => {
    const message = t('share_modal.share_message').replace('{familyName}', familyName);
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}&quote=${encodeURIComponent(message)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const shareOnTwitter = () => {
    const message = t('share_modal.share_message').replace('{familyName}', familyName);
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(message)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const shareOnLinkedIn = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`;
    window.open(linkedinUrl, '_blank', 'width=600,height=400');
  };

  const shareOnWhatsApp = () => {
    const message = t('share_modal.share_message').replace('{familyName}', familyName);
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${message}: ${shareLink}`)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {t('share_modal.title')}
          </DialogTitle>
          <DialogDescription>
            {t('share_modal.description').replace('{familyName}', familyName)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Custom Link Section - Only show if user has custom domain feature */}
          {hasCustomDomain && (
            <div className="space-y-2">
              <Label>{t('share_modal.custom_link')}</Label>
              <div className="flex gap-2">
                <Input
                  value={shareLink}
                  readOnly
                  className="flex-1 text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  {t('share_modal.copy')}
                </Button>
              </div>
            </div>
          )}

          {/* Public Link Section with Token */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('share_modal.public_link')}</Label>
              {isGeneratingToken && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Generating...
                </span>
              )}
              {tokenExpiresAt && !isGeneratingToken && (
                <span className="text-xs text-muted-foreground">
                  Expires: {new Date(tokenExpiresAt).toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={publicLink || 'Generating secure link...'}
                readOnly
                className="flex-1 text-sm"
                disabled={!publicLink}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyPublicLink}
                className="flex items-center gap-2"
                disabled={!publicLink}
              >
                <Copy className="h-4 w-4" />
                {t('share_modal.copy')}
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={generateShareToken}
              disabled={isGeneratingToken}
              className="w-full flex items-center gap-2"
            >
              <RefreshCw className={`h-3 w-3 ${isGeneratingToken ? 'animate-spin' : ''}`} />
              {t('share_modal.regenerate_link') || 'Generate New Secure Link'}
            </Button>
          </div>

          <Separator />

          {/* Social Media Sharing */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t('social.share_via')}</Label>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={shareOnFacebook}
                className="flex items-center gap-2 justify-start"
              >
                <Facebook className="h-4 w-4 text-blue-600" />
                {t('social.facebook')}
              </Button>

              <Button
                variant="outline"
                onClick={shareOnTwitter}
                className="flex items-center gap-2 justify-start"
              >
                <Twitter className="h-4 w-4 text-blue-400" />
                {t('social.twitter')}
              </Button>

              <Button
                variant="outline"
                onClick={shareOnLinkedIn}
                className="flex items-center gap-2 justify-start"
              >
                <Linkedin className="h-4 w-4 text-blue-700" />
                {t('social.linkedin')}
              </Button>

              <Button
                variant="outline"
                onClick={shareOnWhatsApp}
                className="flex items-center gap-2 justify-start"
              >
                <MessageCircle className="h-4 w-4 text-green-500" />
                {t('social.whatsapp')}
              </Button>
            </div>
          </div>

          {/* Additional Actions */}
          <div className="pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                window.open(shareLink, '_blank');
              }}
              className="w-full flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              {t('share_modal.open_new_window')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};