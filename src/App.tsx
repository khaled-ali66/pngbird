import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Link, useNavigate } from 'react-router-dom';
import { Menu, X, Bird } from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { ThemeToggle } from './components/ThemeToggle';
import { ThemeProvider } from './components/ThemeProvider';
import { CookieConsent } from './components/CookieConsent';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUser, useClerk } from '@clerk/clerk-react';
import Home from './pages/Home';
import Generate from './pages/Generate';
import RemoveBg from './pages/RemoveBg';
import Pricing from './pages/Pricing';
import AdminGuard from '@/components/AdminGuard';
import Gallery from './pages/Gallery';
import GalleryDetail from './pages/GalleryDetail';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import ApiKeys from './pages/ApiKeys';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import RefundPolicy from './pages/RefundPolicy';
import CookiePolicy from './pages/CookiePolicy';
import Contact from './pages/Contact';
import About from './pages/About';
import { CustomLoginModal } from './components/CustomLoginModal';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState;
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-8">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Something went wrong.</h1>
          <pre className="bg-card p-4 rounded text-sm overflow-auto max-w-full">
            {this.state.error?.toString()}
          </pre>
          <Button onClick={() => window.location.reload()} className="mt-6">Reload Page</Button>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  const location = useLocation();
  const { user, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const navigate = useNavigate();
  const isPublicPage = location.pathname === '/' || location.pathname.startsWith('/gallery');

  const isPaid = user?.unsafeMetadata?.is_paid === true;

  // Apply pending plan if user just signed up/in via checkout
  useEffect(() => {
    if (isLoaded && user) {
      const pendingPlan = localStorage.getItem('pending_plan');
      if (pendingPlan) {
        // Only update if the plan is different to avoid infinite loops
        if (user.unsafeMetadata?.plan !== pendingPlan) {
          user.update({
            unsafeMetadata: {
              ...user.unsafeMetadata,
              plan: pendingPlan,
              is_paid: true
            }
          }).then(() => {
            localStorage.removeItem('pending_plan');
          }).catch(e => {
            console.error('Failed to apply pending plan:', e);
          });
        } else {
          localStorage.removeItem('pending_plan');
        }
      }
    }
  }, [isLoaded, user]);

  useEffect(() => {
    if (isLoaded && location.pathname === '/dashboard' && !isPaid) {
      navigate('/generate');
    }
  }, [location.pathname, isPaid, isLoaded, navigate]);
  const hideFooterPaths = ['/generate', '/remove-bg', '/api-keys'];
  const shouldShowFooter = !hideFooterPaths.includes(location.pathname);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('has_seen_welcome');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, []);

  const handleCloseWelcome = () => {
    localStorage.setItem('has_seen_welcome', 'true');
    setShowWelcome(false);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background text-foreground font-sans overflow-hidden">
      {/* Header for all pages */}
      <Header 
        onLoginClick={() => setIsLoginModalOpen(true)} 
        onMobileMenuToggle={() => setIsMobileMenuOpen(true)}
      />

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[90] md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed inset-y-0 right-0 z-[100] transform transition-transform duration-300 ease-in-out md:hidden flex h-full shrink-0",
        isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <Sidebar 
          onClose={() => setIsMobileMenuOpen(false)} 
          onLoginClick={() => setIsLoginModalOpen(true)}
        />
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto flex flex-col">
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/generate" element={<Generate />} />
                <Route path="/remove-bg" element={<RemoveBg />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/gallery/:id" element={<GalleryDetail />} />
                <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin" element={
  <AdminGuard>
    <AdminDashboard />
  </AdminGuard>
} />
                <Route path="/api-keys" element={<ApiKeys />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/refund" element={<RefundPolicy />} />
                <Route path="/cookies" element={<CookiePolicy />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/about" element={<About />} />
                <Route path="/pricing" element={<Pricing />} />
              </Routes>
            </div>
            {shouldShowFooter && <Footer />}
          </div>
        </main>
      </div>

      <CookieConsent />

      {/* Welcome Popup */}
      {showWelcome && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card border border-border rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl relative">
            <button 
              onClick={handleCloseWelcome}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bird className="w-8 h-8 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Welcome to PngBird!</h2>
            <p className="text-muted-foreground">
              To use this tool, please add your own API keys. Note: Gemini requires a billing-enabled account (paid tier) to generate images. Alternatively, you can use OpenAI or Fal.ai keys!
            </p>
            <Link to="/api-keys" onClick={handleCloseWelcome} className="block w-full">
              <Button className="w-full h-12 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-xl text-lg">
                Add your keys
              </Button>
            </Link>
          </div>
        </div>
      )}

      <CustomLoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <ErrorBoundary>
        <BrowserRouter>
          <AppContent />
          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

