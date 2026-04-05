import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || '';
const SESSION_KEY    = 'pngbird_admin_auth';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const [authed,   setAuthed]   = useState(false);
  const [input,    setInput]    = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [checking, setChecking] = useState(true);

  // تحقق من الـ session عند أول load
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved === 'true') setAuthed(true);
    setChecking(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ADMIN_PASSWORD) {
      // لو مفيش password في الـ .env — اسمح بالدخول
      setAuthed(true);
      sessionStorage.setItem(SESSION_KEY, 'true');
      return;
    }
    if (input === ADMIN_PASSWORD) {
      setAuthed(true);
      setError('');
      sessionStorage.setItem(SESSION_KEY, 'true');
    } else {
      setError('Incorrect password');
      setInput('');
    }
  };

  const handleLogout = () => {
    setAuthed(false);
    sessionStorage.removeItem(SESSION_KEY);
  };

  if (checking) return null;

  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm">

          {/* Logo / Icon */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-yellow-500" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Admin Access</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter your password to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={input}
                onChange={e => { setInput(e.target.value); setError(''); }}
                placeholder="Admin password"
                autoFocus
                className="w-full px-4 py-3 pr-11 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <Button
              type="submit"
              disabled={!input.trim()}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl h-11"
            >
              Enter Dashboard
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Authed — اعرض الـ children مع زر logout
  return (
    <>
      {/* Logout bar */}
      <div className="fixed top-0 right-0 z-50 p-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:text-foreground hover:bg-muted/80 transition-all"
        >
          <Lock className="w-3 h-3" /> Logout
        </button>
      </div>
      {children}
    </>
  );
}
