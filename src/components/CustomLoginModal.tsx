import React, { useState } from 'react';
import { useSignIn, useSignUp } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { X, Loader2, Mail, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CustomLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CustomLoginModal({ isOpen, onClose }: CustomLoginModalProps) {
  const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignInLoaded || !isSignUpLoaded) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const attempt = await signIn.create({ identifier: email });

      if (attempt.status === 'complete') {
        await setSignInActive({ session: attempt.createdSessionId });
        onClose();
        return;
      }

      const emailCodeFactor = attempt.supportedFirstFactors?.find(
        (factor: any) => factor.strategy === 'email_code'
      ) as any;

      if (!emailCodeFactor) {
        toast.error('Email code is not enabled. Check your Clerk dashboard.');
        return;
      }

      await signIn.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId: emailCodeFactor.emailAddressId,
      });

      setIsSignUp(false);
      setStep('code');

    } catch (err: any) {
      if (err.errors?.[0]?.code === 'form_identifier_not_found') {
        try {
          await signUp.create({ emailAddress: email });
          await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
          setIsSignUp(true);
          setStep('code');
        } catch (signUpErr: any) {
          const msg = signUpErr.errors?.[0]?.message || 'Failed to sign up';
          setErrorMessage(msg);
          toast.error(msg);
        }
      } else {
        const msg = err.errors?.[0]?.message || 'Failed to send code';
        setErrorMessage(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignInLoaded || !isSignUpLoaded) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      if (isSignUp) {
        const completeSignUp = await signUp.attemptEmailAddressVerification({ code });
        if (completeSignUp.status === 'complete') {
          await setSignUpActive({ session: completeSignUp.createdSessionId });
          onClose();
        } else {
          setErrorMessage('Failed to verify code');
          toast.error('Failed to verify code');
        }
      } else {
        const completeSignIn = await signIn.attemptFirstFactor({
          strategy: 'email_code',
          code,
        });
        if (completeSignIn.status === 'complete') {
          await setSignInActive({ session: completeSignIn.createdSessionId });
          onClose();
        } else {
          setErrorMessage('Failed to verify code');
          toast.error('Failed to verify code');
        }
      }
    } catch (err: any) {
      const msg = err.errors?.[0]?.message || 'Invalid code';
      setErrorMessage(msg);
      toast.error(msg);
      setStep('email');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card border border-border rounded-3xl p-8 max-w-md w-full relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {step === 'email' ? 'Welcome Back' : 'Enter Code'}
          </h2>
          <p className="text-muted-foreground text-sm">
            {step === 'email'
              ? 'Enter your email to receive a one-time passcode.'
              : `We sent a code to ${email}`}
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200 mb-6">
            {errorMessage}
          </div>
        )}

        {/* ✅ clerk-captcha دايماً موجود في الـ DOM */}
        <div id="clerk-captcha" />

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-background border border-border rounded-xl h-12 pl-10 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !email}
              className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 font-bold rounded-xl text-base"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Code'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Verification Code</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="w-full bg-background border border-border rounded-xl h-12 pl-10 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 tracking-widest text-lg"
                  required
                  maxLength={6}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 font-bold rounded-xl text-base"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Login'}
            </Button>
            <button
              type="button"
              onClick={() => setStep('email')}
              className="w-full text-sm text-muted-foreground hover:text-foreground mt-2"
            >
              Use a different email
            </button>
          </form>
        )}

        {/* لينك الأدمن المخفي */}
        

      </div>
    </div>
  );
}
