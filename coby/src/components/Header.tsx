import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bird, Menu, LayoutDashboard, User, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { useUser, useClerk } from '@clerk/clerk-react';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

export function Header({ onLoginClick, onMobileMenuToggle }: { onLoginClick?: () => void, onMobileMenuToggle?: () => void }) {
  const { user, isLoaded } = useUser();
  const { openSignIn, signOut } = useClerk();
  const location = useLocation();

  const isPaid = user?.unsafeMetadata?.is_paid === true;
  const role = user?.unsafeMetadata?.role as string;

  return (
    <header className="sticky top-0 z-50 w-full shrink-0 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-card rounded-lg flex items-center justify-center border border-border">
            <Bird className="w-5 h-5 text-yellow-500" />
          </div>
          <span className="font-bold text-foreground text-lg tracking-tight">PngBird</span>
        </Link>

        <div className="flex-1 flex items-center justify-end gap-3 min-w-0">
          <div className="hidden md:flex items-center gap-1 overflow-x-auto no-scrollbar px-2 py-1">
            <Link to="/gallery" className="shrink-0">
              <Button variant="ghost" size="sm" className={cn("font-medium px-3", location.pathname === '/gallery' ? "text-foreground bg-muted" : "text-muted-foreground hover:text-foreground")}>
                Gallery
              </Button>
            </Link>
            <Link to="/remove-bg" className="shrink-0">
              <Button variant="ghost" size="sm" className={cn("font-medium px-3", location.pathname === '/remove-bg' ? "text-foreground bg-muted" : "text-muted-foreground hover:text-foreground")}>
                Remove BG
              </Button>
            </Link>
            <Link to="/generate" className="shrink-0">
              <Button variant="ghost" size="sm" className={cn("font-medium px-3", location.pathname === '/generate' ? "text-foreground bg-muted" : "text-muted-foreground hover:text-foreground")}>
                Generate
              </Button>
            </Link>
            <Link to="/pricing" className="shrink-0">
              <Button variant="ghost" size="sm" className={cn("font-medium px-3", location.pathname === '/pricing' ? "text-foreground bg-muted" : "text-muted-foreground hover:text-foreground")}>
                Pricing
              </Button>
            </Link>
            {role === 'admin' && (
              <Link to="/admin" className="shrink-0">
                <Button variant="ghost" size="sm" className={cn("font-medium px-3", location.pathname === '/admin' ? "text-foreground bg-muted" : "text-muted-foreground hover:text-foreground")}>
                  Admin
                </Button>
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2 shrink-0 border-l border-border pl-3 ml-2">
            {!isLoaded || !user ? (
              <Button 
                size="sm"
                onClick={() => onLoginClick ? onLoginClick() : openSignIn()}
                className="bg-foreground text-background hover:bg-foreground/90 font-bold rounded-xl"
              >
                Login
              </Button>
            ) : (
              <div className="relative group">
                <button className="flex items-center justify-center w-8 h-8 rounded-full bg-muted overflow-hidden border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  {user.imageUrl ? (
                    <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                
                <div className="absolute right-0 top-full pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-card border border-border rounded-lg shadow-lg flex flex-col py-1">
                    <div className="px-4 py-2 border-b border-border mb-1">
                      <p className="text-sm font-medium text-foreground truncate">{user.fullName || user.firstName || 'User'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.primaryEmailAddress?.emailAddress}</p>
                    </div>
                    <Link to="/dashboard" className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-2 transition-colors">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <Link to="/api-keys" className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-2 transition-colors">
                      <Settings className="w-4 h-4" />
                      API Keys
                    </Link>
                    <button onClick={() => signOut()} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-2 text-left w-full transition-colors">
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
            <button 
              onClick={onMobileMenuToggle}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
