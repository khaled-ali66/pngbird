import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wand2, Image as ImageIcon, Grid, LayoutDashboard, Settings, HelpCircle, X, LogIn, LogOut, CreditCard, ShieldAlert, Bird } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { useUser, useClerk } from '@clerk/clerk-react';

const secondaryItems = [
  { icon: Settings, label: 'API Keys', path: '/api-keys' },
  { icon: HelpCircle, label: 'About', path: '/about' },
];

export function Sidebar({ onClose, onLoginClick }: { onClose?: () => void, onLoginClick?: () => void }) {
  const location = useLocation();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  
  const isPaid = user?.unsafeMetadata?.is_paid === true;
  const role = user?.unsafeMetadata?.role as string;

  const menuItems = [];
  if (user) {
    menuItems.push({ icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' });
  }

  return (
    <aside className="w-64 bg-background flex flex-col h-full shrink-0">
      <div className="p-6 flex items-center justify-between md:hidden">
        <Link to="/" className="flex items-center gap-3 font-bold text-xl text-foreground tracking-tight" onClick={onClose}>
          <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
            <Bird className="w-5 h-5 text-background" />
          </div>
          <span>PngBird</span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="p-2 -mr-2 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="px-6 mb-6 md:mt-6">
        {(!isLoaded || !user) && (
          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => {
                onClose?.();
                onLoginClick?.();
              }}
              className="w-full bg-foreground text-background font-bold h-10 rounded-xl"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </Button>
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {/* Main Navigation - Mobile Only */}
        <div className="md:hidden mb-6">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 mb-2">Navigation</div>
          <Link
            to="/gallery"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
              location.pathname === '/gallery' ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
            )}
          >
            <Grid className={cn("w-4 h-4 transition-colors", location.pathname === '/gallery' ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")} />
            Gallery
          </Link>
          <Link
            to="/remove-bg"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
              location.pathname === '/remove-bg' ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
            )}
          >
            <ImageIcon className={cn("w-4 h-4 transition-colors", location.pathname === '/remove-bg' ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")} />
            Remove BG
          </Link>
          <Link
            to="/generate"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
              location.pathname === '/generate' ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
            )}
          >
            <Wand2 className={cn("w-4 h-4 transition-colors", location.pathname === '/generate' ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")} />
            Generate
          </Link>
          <Link
            to="/pricing"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
              location.pathname === '/pricing' ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
            )}
          >
            <CreditCard className={cn("w-4 h-4 transition-colors", location.pathname === '/pricing' ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")} />
            Pricing
          </Link>
          {role === 'admin' && (
            <Link
              to="/admin"
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
                location.pathname === '/admin' ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
              )}
            >
              <ShieldAlert className={cn("w-4 h-4 transition-colors", location.pathname === '/admin' ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")} />
              Admin
            </Link>
          )}
        </div>

        {user && (
          <>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 mb-4">Account</div>
            <Link
              to="/dashboard"
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
                location.pathname === '/dashboard' 
                  ? "bg-foreground/10 text-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)]" 
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
              )}
            >
              <LayoutDashboard className={cn(
                "w-4 h-4 transition-colors",
                location.pathname === '/dashboard' ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
              )} />
              Dashboard
            </Link>
            <Link
              to="/api-keys"
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
                location.pathname === '/api-keys' ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
              )}
            >
              <Settings className={cn(
                "w-4 h-4 transition-colors",
                location.pathname === '/api-keys' ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
              )} />
              API Keys
            </Link>
            <button
              onClick={() => {
                signOut();
                onClose?.();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all duration-200"
            >
              <LogOut className="w-4 h-4 text-muted-foreground" />
              Logout
            </button>
          </>
        )}
      </nav>

      <div className="px-4 py-6 space-y-1 border-t border-border shrink-0 md:hidden">
        <div className="flex items-center justify-between px-3">
          <span className="text-sm font-medium text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
