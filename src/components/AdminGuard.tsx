import React, { useState, useEffect } from 'react';
import { Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL?.trim() || 'suberadmin@gmail.com';
const SESSION_KEY = 'pngbird_admin_auth';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const [authed,   setAuthed]   = useState(false);
  const [checking, setChecking] = useState(true);
  const [email,    setEmail]    = useState('');
  const [error,    setError]    = useState('');

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved === 'true') setAuthed(true);
    setChecking(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setAuthed(true);
      setError('');
    } else {
      setError('Access denied. Not an admin email.');
    }
  };

  const handleLogout = () => {
    setAuthed(false);
    setEmail('');
    sessionStorage.removeItem(SESSION_KEY);
  };

  if (checking) return null;

  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm">

          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-yellow-500" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Admin Access</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter your admin email to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="Admin email"
                autoFocus
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <Button
              type="submit"
              disabled={!email.trim()}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl h-11"
            >
              Enter Dashboard
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
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
