import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TreePine, Heart, Users, Star, Sparkles, Crown, Gem } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import familyTreeLogo from "@/assets/family-tree-logo.png";

import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";
import { OTPForm } from "./OTPForm";
import { PasswordResetForm } from "./PasswordResetForm";
import { MagicLinkForm } from "./MagicLinkForm";

const Auth = () => {
  const [showOTP, setShowOTP] = useState(false);
  const [pendingUserData, setPendingUserData] = useState<any>(null);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { t, direction } = useLanguage();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkUser();
  }, [navigate]);

  const handleOTPRequired = (userData: any) => {
    setPendingUserData(userData);
    setShowOTP(true);
  };

  const handleBackToAuth = () => {
    setShowOTP(false);
    setShowPasswordReset(false);
    setShowMagicLink(false);
    setPendingUserData(null);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Google sign in error:', error);
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
...
    </div>
  );
};

export default Auth;
