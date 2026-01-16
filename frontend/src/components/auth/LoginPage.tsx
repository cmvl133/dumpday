import { useState, useEffect } from 'react';
import { Loader2, Mail, KeyRound, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  requestCode,
  verifyCode,
  clearError,
  resetCodeSent,
} from '@/store/authSlice';

export function LoginPage() {
  const dispatch = useAppDispatch();
  const { isLoading, error, codeSent, codeEmail } = useAppSelector(
    (state) => state.auth
  );

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleRequestCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      dispatch(requestCode(email.trim()));
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (codeEmail && code.trim()) {
      dispatch(verifyCode({ email: codeEmail, code: code.trim() }));
    }
  };

  const handleBack = () => {
    dispatch(resetCodeSent());
    setCode('');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Dopaminder</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {codeSent
              ? 'Wpisz kod, który wysłaliśmy na Twój email'
              : 'Zaloguj się za pomocą adresu email'}
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          {!codeSent ? (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Twój adres email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !email.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Wysyłanie...
                  </>
                ) : (
                  'Wyślij kod'
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Kod został wysłany na:
                </p>
                <p className="font-medium">{codeEmail}</p>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="6-cyfrowy kod"
                    value={code}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setCode(value);
                    }}
                    className="pl-10 text-center text-lg tracking-widest"
                    disabled={isLoading}
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    autoFocus
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || code.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Weryfikacja...
                  </>
                ) : (
                  'Zaloguj się'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleBack}
                disabled={isLoading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Wróć
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
