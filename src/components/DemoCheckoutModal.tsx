import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, ShieldCheck, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser, useSignIn, useSignUp } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface DemoCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    id: string;
    name: string;
    price: string;
  } | null;
}

export function DemoCheckoutModal({ isOpen, onClose, plan }: DemoCheckoutModalProps) {
  const { user } = useUser();
  const navigate = useNavigate();
  const { signIn, isLoaded: isSignInLoaded, setActive: setSignInActive } = useSignIn();
  const { signUp, isLoaded: isSignUpLoaded, setActive: setSignUpActive } = useSignUp();
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('United States');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'details' | 'verify' | 'success'>('details');
  const [code, setCode] = useState('');
  const [isSignUpFlow, setIsSignUpFlow] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      setEmail(user.primaryEmailAddress.emailAddress);
    }
  }, [user]);

  if (!isOpen || !plan) return null;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (user) {
        // User is already logged in, just update their profile
        try {
          await user.update({
            unsafeMetadata: {
              ...user.unsafeMetadata,
              plan: plan.id,
              is_paid: true
            }
          });
        } catch (e: any) {
          console.warn('Clerk update failed, simulating success for demo:', e);
        }
        
        localStorage.setItem('pending_plan', plan.id);
        setStep('success');
      } else {
        // Behind the scenes account creation / email code
        if (!isSignInLoaded || !isSignUpLoaded) {
          setLoading(false);
          return;
        }
        
        // Store pending plan so it can be applied after login
        localStorage.setItem('pending_plan', plan.id);
        
        try {
          // First try to sign in
          let signInAttempt;
          if (signIn.status === 'complete' && signIn.identifier === email) {
            await setSignInActive({ session: signIn.createdSessionId });
            setStep('success');
            return;
          } else if (signIn.status && signIn.identifier === email) {
            signInAttempt = signIn;
          } else {
            signInAttempt = await signIn.create({ 
              identifier: email
            });
          }
          
          if (signInAttempt.status === 'complete') {
            await setSignInActive({ session: signInAttempt.createdSessionId });
            setStep('success');
            return;
          }
          
          const emailFactor = signInAttempt.supportedFirstFactors?.find(
            (f) => f.strategy === 'email_code' && f.safeIdentifier === email
          );
          
          if (!emailFactor) {
            // Fallback if safeIdentifier doesn't match exactly but strategy is email_code
            const fallbackFactor = signInAttempt.supportedFirstFactors?.find(
              (f) => f.strategy === 'email_code'
            );
            if (fallbackFactor) {
              await signIn.prepareFirstFactor({
                strategy: 'email_code',
                emailAddressId: (fallbackFactor as any).emailAddressId,
              });
            } else {
              throw new Error('Email code authentication is not enabled for this account.');
            }
          } else {
            await signIn.prepareFirstFactor({
              strategy: 'email_code',
              emailAddressId: (emailFactor as any).emailAddressId,
            });
          }
          
          setIsSignUpFlow(false);
          setStep('verify');
        } catch (err: any) {
          // If the user doesn't exist, sign them up
          if (err.errors && err.errors[0]?.code === 'form_identifier_not_found') {
            try {
              if (signUp.status && signUp.emailAddress === email) {
                // Already have an active sign-up for this email
              } else if (signUp.status) {
                await signUp.update({ emailAddress: email });
              } else {
                await signUp.create({ emailAddress: email });
              }
              
              await signUp.prepareEmailAddressVerification({
                strategy: 'email_code',
              });
              setIsSignUpFlow(true);
              setStep('verify');
            } catch (signUpErr: any) {
              console.error('Clerk signup failed:', signUpErr);
              throw new Error(signUpErr.errors?.[0]?.longMessage || signUpErr.message || 'Failed to send verification code. Please ensure "Email Code" is enabled in your Clerk Dashboard.');
            }
          } else {
            console.error('Clerk auth failed:', err);
            throw new Error(err.errors?.[0]?.longMessage || err.message || 'Failed to send verification code.');
          }
        }
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      const msg = err.message || 'An error occurred during checkout.';
      if (msg.toLowerCase().includes('rate limit')) {
        setErrorMessage('Email rate limit exceeded. Please try again later.');
        toast.error('Email rate limit exceeded. Please try again later.');
      } else {
        setErrorMessage(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    
    try {
      if (isSignUpFlow) {
        const res = await signUp.attemptEmailAddressVerification({ code });
        if (res.status === 'complete') {
          await setSignUpActive({ session: res.createdSessionId });
          setStep('success');
        } else {
          console.error('SignUp verification not complete:', res);
          if (res.status === 'missing_requirements') {
            throw new Error('Sign up requires additional fields (like name or password). Please disable them in your Clerk Dashboard under Authentication -> Email, Phone, Username for a passwordless flow.');
          }
          throw new Error('Verification failed. Please try again.');
        }
      } else {
        const res = await signIn.attemptFirstFactor({ strategy: 'email_code', code });
        if (res.status === 'complete') {
          await setSignInActive({ session: res.createdSessionId });
          setStep('success');
        } else {
          console.error('SignIn verification not complete:', res);
          if (res.status === 'needs_new_password' || res.status === 'needs_second_factor') {
             throw new Error('Sign in requires additional steps (like a password or 2FA). Please disable them in your Clerk Dashboard settings for a passwordless flow.');
          }
          throw new Error('Verification failed. Please try again.');
        }
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      
      // Handle already verified case gracefully
      const isAlreadyVerified = err.errors?.[0]?.message?.includes('already been verified') || 
                                err.message?.includes('already been verified') ||
                                err.errors?.[0]?.code === 'verification_already_verified';
                                
      if (isAlreadyVerified) {
        try {
          if (isSignUpFlow && signUp.createdSessionId) {
            await setSignUpActive({ session: signUp.createdSessionId });
            setStep('success');
            return;
          } else if (!isSignUpFlow && signIn.createdSessionId) {
            await setSignInActive({ session: signIn.createdSessionId });
            setStep('success');
            return;
          }
        } catch (activeErr) {
          console.error('Failed to set active session after already verified:', activeErr);
        }
      }
      
      const msg = err.errors?.[0]?.longMessage || err.message || 'Invalid verification code.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-start sm:justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
      <div id="clerk-captcha"></div>
      <div className="bg-card w-full max-w-4xl min-h-screen sm:min-h-0 sm:rounded-2xl shadow-2xl border border-border flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Left Side - Order Summary */}
        <div className="w-full md:w-5/12 bg-muted/30 p-6 sm:p-8 border-b md:border-b-0 md:border-r border-border shrink-0 overflow-y-auto md:overflow-visible">
          <h2 className="text-lg font-semibold text-foreground mb-4 sm:mb-6">Order summary</h2>
          
          <div className="text-3xl sm:text-4xl font-bold text-foreground mb-6 sm:mb-8">
            {plan.price}
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">PngLook {plan.name} License</h3>
              <p className="text-sm text-muted-foreground">Lifetime access + updates</p>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between text-foreground">
              <span>Subtotal</span>
              <span className="font-medium">{plan.price}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>VAT</span>
              <span>$0.00</span>
            </div>
            <div className="pt-4 border-t border-border flex justify-between text-foreground font-bold text-lg">
              <span>Total</span>
              <span>{plan.price}</span>
            </div>
          </div>
        </div>

        {/* Right Side - Payment Details */}
        <div className="w-full md:w-7/12 p-6 sm:p-8 relative flex-1 overflow-y-auto">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {step === 'details' && (
            <>
              <div className="flex items-center gap-2 text-sm mb-6">
                <span className="font-medium text-primary">Your details</span>
                <span className="text-muted-foreground">&gt;</span>
                <span className="text-muted-foreground">Payment</span>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                We collect this information to help combat fraud, and to keep your payment secure.
              </p>

              <form onSubmit={handleCheckout} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Email address <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`h-12 ${user ? 'opacity-70 cursor-not-allowed' : ''}`}
                    placeholder="you@example.com"
                    readOnly={!!user}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select 
                    className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                  >
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Morocco">Morocco</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex items-start gap-3 mt-6">
                  <input type="checkbox" id="marketing" className="mt-1" />
                  <label htmlFor="marketing" className="text-sm text-muted-foreground leading-tight">
                    PngLook may send me product updates and offers via email. It is possible to opt-out at any time.
                  </label>
                </div>

                {errorMessage && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                    {errorMessage}
                  </div>
                )}

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-bold bg-[#1ca3b9] hover:bg-[#158a9d] text-white"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue to Payment (Demo)'}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-4">
                    This is a demo checkout. No real payment will be processed.
                  </p>
                </div>
              </form>
            </>
          )}

          {step === 'verify' && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-8">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
                <Mail className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground">Check your email</h3>
                <p className="text-muted-foreground mt-2 max-w-sm">
                  We sent a 6-digit verification code to <strong>{email}</strong>. Please enter it below to complete your checkout.
                </p>
              </div>

              <form onSubmit={handleVerify} className="w-full max-w-xs space-y-4">
                {errorMessage && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                    {errorMessage}
                  </div>
                )}
                <Input 
                  type="text" 
                  placeholder="Enter 6-digit code" 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="text-center text-lg tracking-widest h-12"
                  maxLength={6}
                  required
                />
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-bold bg-[#1ca3b9] hover:bg-[#158a9d] text-white"
                  disabled={loading || code.length < 6}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Complete'}
                </Button>
              </form>
            </div>
          )}

          {step === 'success' && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Payment Successful!</h3>
              {user ? (
                <p className="text-muted-foreground max-w-sm">
                  Your account has been upgraded to the <strong>{plan.name}</strong> plan. You can now access all premium features!
                </p>
              ) : (
                <>
                  <p className="text-muted-foreground max-w-sm">
                    We've verified your email and applied the <strong>{plan.name}</strong> plan.
                  </p>
                  <p className="text-sm font-medium text-foreground mt-4">
                    Click below to instantly access the app.
                  </p>
                </>
              )}
              <Button 
                onClick={() => {
                  onClose();
                  navigate('/generate');
                }}
                variant="outline"
                className="mt-8"
              >
                Go to App
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
