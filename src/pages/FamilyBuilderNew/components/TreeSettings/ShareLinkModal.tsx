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
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  
  const publicLink = `${window.location.origin}/tree?familyId=${familyId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast({
      title: "تم نسخ الرابط",
      description: "تم نسخ رابط الشجرة إلى الحافظة"
    });
  };

  const handleCopyPublicLink = () => {
    navigator.clipboard.writeText(publicLink);
    toast({
      title: "تم نسخ الرابط العام",
      description: "تم نسخ الرابط العام إلى الحافظة"
    });
  };

  const shareOnFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}&quote=${encodeURIComponent(`شاهد شجرة عائلة ${familyName}`)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const shareOnTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(`شاهد شجرة عائلة ${familyName}`)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const shareOnLinkedIn = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`;
    window.open(linkedinUrl, '_blank', 'width=600,height=400');
  };

  const shareOnWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`شاهد شجرة عائلة ${familyName}: ${shareLink}`)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            مشاركة رابط الشجرة
          </DialogTitle>
          <DialogDescription>
            شارك شجرة عائلة {familyName} مع الآخرين
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Custom Link Section - Only show if user has custom domain feature */}
          {hasCustomDomain && (
            <div className="space-y-2">
              <Label>الرابط المخصص</Label>
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
                  نسخ
                </Button>
              </div>
            </div>
          )}

          {/* Public Link Section */}
          <div className="space-y-2">
            <Label>الرابط العام</Label>
            <div className="flex gap-2">
              <Input
                value={publicLink}
                readOnly
                className="flex-1 text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyPublicLink}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                نسخ
              </Button>
            </div>
          </div>

          <Separator />

          {/* Social Media Sharing */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">المشاركة عبر</Label>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={shareOnFacebook}
                className="flex items-center gap-2 justify-start"
              >
                <Facebook className="h-4 w-4 text-blue-600" />
                Facebook
              </Button>

              <Button
                variant="outline"
                onClick={shareOnTwitter}
                className="flex items-center gap-2 justify-start"
              >
                <Twitter className="h-4 w-4 text-blue-400" />
                X (Twitter)
              </Button>

              <Button
                variant="outline"
                onClick={shareOnLinkedIn}
                className="flex items-center gap-2 justify-start"
              >
                <Linkedin className="h-4 w-4 text-blue-700" />
                LinkedIn
              </Button>

              <Button
                variant="outline"
                onClick={shareOnWhatsApp}
                className="flex items-center gap-2 justify-start"
              >
                <MessageCircle className="h-4 w-4 text-green-500" />
                WhatsApp
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
              فتح الرابط في نافذة جديدة
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};