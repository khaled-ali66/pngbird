import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 bg-card border-t border-border shadow-2xl animate-in slide-in-from-bottom-full duration-500">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. 
          By clicking "Accept", you consent to our use of cookies as described in our{' '}
          <Link to="/privacy" className="text-foreground hover:underline font-medium">Privacy Policy</Link>.
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button 
            variant="outline" 
            className="border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => setIsVisible(false)}
          >
            Decline
          </Button>
          <Button 
            className="bg-foreground text-background hover:bg-foreground/90"
            onClick={handleAccept}
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
