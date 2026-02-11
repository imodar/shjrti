import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { familyInvitationsApi, type TokenValidationResponse } from '@/lib/api/endpoints/familyInvitations';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, Users } from 'lucide-react';
import { toast } from 'sonner';

const AcceptInvitation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const { user, loading: userLoading } = useCurrentUser();

  const [tokenData, setTokenData] = useState<TokenValidationResponse | null>(null);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState<string>('');
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  // Signup form state (for new users)
  const [password, setPassword] = useState('');
  const [signingUp, setSigningUp] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setError('رابط الدعوة غير صالح');
      setValidating(false);
      return;
    }

    const validate = async () => {
      try {
        const data = await familyInvitationsApi.validateToken(token);
        setTokenData(data);
      } catch (err: any) {
        const code = err?.code || '';
        if (code === 'TOKEN_EXPIRED') setError('انتهت صلاحية هذه الدعوة');
        else if (code === 'TOKEN_USED') setError('تم استخدام هذه الدعوة بالفعل');
        else setError('رابط الدعوة غير صالح');
      } finally {
        setValidating(false);
      }
    };
    validate();
  }, [token]);

  // Auto-accept if logged in user matches
  useEffect(() => {
    if (!user || !tokenData || accepted || accepting) return;

    const autoAccept = async () => {
      setAccepting(true);
      try {
        const result = await familyInvitationsApi.accept(token);
        setAccepted(true);
        toast.success('تم قبول الدعوة بنجاح!');
        setTimeout(() => {
          navigate(`/stitch-family-builder?family=${result.family_id}`);
        }, 1500);
      } catch (err: any) {
        if (err?.code === 'EMAIL_MISMATCH') {
          setError('هذه الدعوة مرسلة لبريد إلكتروني مختلف عن حسابك الحالي');
        } else {
          setError(err?.message || 'حدث خطأ أثناء قبول الدعوة');
        }
      } finally {
        setAccepting(false);
      }
    };
    autoAccept();
  }, [user, tokenData]);

  // Handle login redirect
  const handleLoginRedirect = () => {
    navigate(`/auth?redirect=/accept-invitation?token=${token}`);
  };

  // Handle signup for new users
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenData || !password) return;

    setSigningUp(true);
    try {
      const { error: signupError } = await supabase.auth.signUp({
        email: tokenData.email,
        password,
        options: {
          data: { invitation_token: token },
        },
      });

      if (signupError) {
        toast.error(signupError.message);
        return;
      }

      toast.success('تم إنشاء الحساب! يرجى تأكيد بريدك الإلكتروني ثم تسجيل الدخول.');
    } catch (err) {
      toast.error('حدث خطأ أثناء إنشاء الحساب');
    } finally {
      setSigningUp(false);
    }
  };

  if (validating || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">جاري التحقق من الدعوة...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">{error}</h2>
            <Button onClick={() => navigate('/')} variant="outline">
              العودة للرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accepted || accepting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            {accepting ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">جاري قبول الدعوة...</p>
              </>
            ) : (
              <>
                <CheckCircle className="h-12 w-12 text-primary mx-auto" />
                <h2 className="text-xl font-semibold">تم قبول الدعوة!</h2>
                <p className="text-muted-foreground">جاري التحويل لشجرة {tokenData?.family_name}...</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not logged in
  if (!user && tokenData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>دعوة للتعاون</CardTitle>
            <CardDescription>
              تمت دعوتك للمشاركة في إدارة شجرة <strong>{tokenData.family_name}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tokenData.user_exists ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  لديك حساب بالفعل بهذا البريد: <strong>{tokenData.email}</strong>
                </p>
                <Button onClick={handleLoginRedirect} className="w-full">
                  تسجيل الدخول لقبول الدعوة
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  أنشئ حسابك للانضمام
                </p>
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input value={tokenData.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label>كلمة المرور</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل كلمة مرور قوية"
                    minLength={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={signingUp}>
                  {signingUp ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                  إنشاء حساب وقبول الدعوة
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default AcceptInvitation;
