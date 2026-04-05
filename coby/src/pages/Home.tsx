import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Image as ImageIcon, Wand2, CheckCircle2, XCircle, Maximize2, X, Zap, Lock, Menu, Bird } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '../components/ThemeToggle';
import { PricingSection } from '../components/PricingSection';
import { Header } from '../components/Header';
import { cn } from '@/lib/utils';

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <div className="flex-1 overflow-y-auto bg-background text-foreground font-sans">
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 space-y-8 md:space-y-12">
        
        {/* Hero Section */}
        <section className="text-center space-y-6 md:space-y-8 pt-6 md:pt-8 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] aspect-square bg-yellow-500/10 blur-[80px] md:blur-[120px] rounded-full pointer-events-none" />
          
          <div className="inline-flex items-center justify-center p-3 md:p-4 bg-card rounded-2xl md:rounded-3xl mb-2 md:mb-4 border border-border shadow-2xl relative z-10">
            <Bird className="w-8 h-8 md:w-12 md:h-12 text-yellow-500" />
          </div>
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-foreground relative z-10 leading-[1.1]">
            True Transparency. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-300">
              Zero Fake Checkers.
            </span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-xl relative z-10 px-4">
            Generate high-quality PNGs with mathematically perfect transparent backgrounds, 
            or remove backgrounds from your existing images with pixel-perfect precision.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 md:pt-8 relative z-10">
            <Link to="/generate" className="w-full sm:w-auto">
              <Button className="w-full h-12 md:h-14 px-8 bg-foreground text-background hover:bg-foreground/90 font-bold rounded-xl md:rounded-2xl text-base md:text-lg transition-all flex items-center justify-center gap-2">
                <Wand2 className="w-5 h-5" />
                Generate Image
              </Button>
            </Link>
            <Link to="/remove-bg" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full h-12 md:h-14 px-8 border-border bg-card/50 hover:bg-card text-foreground font-bold rounded-xl md:rounded-2xl text-base md:text-lg transition-all flex items-center justify-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Remove Background
              </Button>
            </Link>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="space-y-6 md:space-y-8 relative z-10">
          <div className="text-center space-y-4 px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">The PngBird Difference</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
              Stop downloading "transparent" images that actually have a baked-in checkerboard pattern. 
              Our AI extracts the true alpha channel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto px-4">
            {/* Fake PNG */}
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl md:rounded-3xl p-4 md:p-6 aspect-square flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-3 left-3 md:top-4 md:left-4 bg-red-500/20 text-red-500 border border-red-500/30 px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Fake PNG
                </div>
                <div className="w-48 h-48 md:w-64 md:h-64 relative shadow-2xl rounded-xl overflow-hidden"
                     style={{
                       backgroundImage: 'conic-gradient(#ffffff 90deg, #e5e5e5 90deg 180deg, #ffffff 180deg 270deg, #e5e5e5 270deg)',
                       backgroundSize: '20px 20px'
                     }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Bird className="w-24 h-24 md:w-32 md:h-32 text-yellow-500 drop-shadow-xl" strokeWidth={1.5} />
                  </div>
                </div>
              </div>
              <p className="text-center text-xs md:text-sm text-muted-foreground font-medium">Other Tools: Baked-in checkerboard</p>
            </div>

            {/* PngBird AI */}
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl md:rounded-3xl p-4 md:p-6 aspect-square flex flex-col items-center justify-center relative overflow-hidden"
                   style={{
                     backgroundImage: 'conic-gradient(var(--checker-1) 90deg, var(--checker-2) 90deg 180deg, var(--checker-1) 180deg 270deg, var(--checker-2) 270deg)',
                     backgroundSize: '20px 20px'
                   }}>
                <div className="absolute top-3 left-3 md:top-4 md:left-4 bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1 z-20">
                  <CheckCircle2 className="w-3 h-3" /> PngBird AI
                </div>
                <div className="w-48 h-48 md:w-64 md:h-64 relative z-10 flex items-center justify-center">
                  <Bird className="w-24 h-24 md:w-32 md:h-32 text-yellow-500 drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-center text-xs md:text-sm text-muted-foreground font-medium">PngBird: True alpha transparency</p>
            </div>
          </div>
        </section>

        {/* Example Gallery Section */}
        <section className="space-y-6 md:space-y-8 relative z-10 pb-8 md:pb-12">
          <div className="text-center space-y-4 px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Real Examples</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
              Our tool handles hair glow, motion blur, glass, smoke, and other fine details with precision.<br className="hidden sm:block" />
              No halos, no artifacts just clean, true transparency.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-4">
            {[
              { id: 1, name: "Clear Glasses", url: "https://iili.io/qqdpgpa.png" },
              { id: 2, name: "Ghost Illustration", url: "https://iili.io/qqdpmps.png" },
              { id: 3, name: "Lab Beakers", url: "https://iili.io/qqdpPQR.png" },
              { id: 4, name: "Glass Cup", url: "https://iili.io/qqdp821.png" },
              { id: 5, name: "Blowing Hair", url: "https://iili.io/qqdydCl.png" },
              { id: 6, name: "Curly Hair", url: "https://iili.io/qqdy2G2.png" },
            ].map((example) => (
              <div key={example.id} className="bg-card border border-border rounded-2xl md:rounded-3xl overflow-hidden group">
                <div className="aspect-square relative flex items-center justify-center p-4"
                     style={{
                       backgroundImage: 'conic-gradient(var(--checker-1) 90deg, var(--checker-2) 90deg 180deg, var(--checker-1) 180deg 270deg, var(--checker-2) 270deg)',
                       backgroundSize: '20px 20px'
                     }}>
                  <img 
                    src={example.url} 
                    alt={example.name} 
                    className="w-full h-full object-contain relative z-10 transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                    <button 
                      onClick={() => setSelectedImage(example.url)}
                      className="p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-colors border border-white/10 shadow-xl"
                      title="View full image"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4 border-t border-border">
                  <h3 className="font-medium text-foreground text-center text-sm md:text-base">{example.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it Works Section */}
        <section className="py-8 md:py-12 relative z-10 border-t border-border/50">
          <div className="text-center space-y-4 mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">How it Works</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto px-4">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-400 font-bold text-xl flex items-center justify-center mb-2">
                1
              </div>
              <h3 className="text-lg font-bold text-foreground">Upload/Generate</h3>
              <p className="text-muted-foreground text-sm">
                Upload your image or generate one
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 font-bold text-xl flex items-center justify-center mb-2">
                2
              </div>
              <h3 className="text-lg font-bold text-foreground">Auto Process</h3>
              <p className="text-muted-foreground text-sm">
                Our AI removes the background
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xl flex items-center justify-center mb-2">
                3
              </div>
              <h3 className="text-lg font-bold text-foreground">Preview</h3>
              <p className="text-muted-foreground text-sm">
                Check the result in real-time
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 text-yellow-400 font-bold text-xl flex items-center justify-center mb-2">
                4
              </div>
              <h3 className="text-lg font-bold text-foreground">Download</h3>
              <p className="text-muted-foreground text-sm">
                Get your image in high quality
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-6 md:py-8 relative z-10 border-t border-border/50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 max-w-6xl mx-auto px-4">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-2">
                <Zap className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Lightning Fast</h3>
              <p className="text-muted-foreground text-sm md:text-base">
                Process your images in seconds with our advanced AI technology
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                <Lock className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-foreground">100% Free</h3>
              <p className="text-muted-foreground text-sm md:text-base">
                No hidden fees, no registration required. Just upload and download.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-2">
                <Wand2 className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Bring Your Own Key</h3>
              <p className="text-muted-foreground text-sm md:text-base">
                Power your generations using top-tier AI models with your own API keys.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
                <ImageIcon className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-foreground">High Quality</h3>
              <p className="text-muted-foreground text-sm md:text-base">
                Download high-resolution results without quality loss
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-6 md:py-8 relative z-10 border-t border-border/50">
          <PricingSection />
        </section>

        {/* FAQs Section */}
        <section className="py-12 md:py-16 relative z-10 border-t border-border/50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">Frequently Asked Questions</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Everything you need to know about PngBird.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {[
                {
                  q: "What's the difference between Free and Premium?",
                  a: "Currently, all users get unlimited generations and background removals to test the service. Premium users (Pro/Ultimate) get additional features like batch processing and high-resolution 4K output."
                },
                {
                  q: "How does the payment work?",
                  a: "We offer a simple one-time payment model for our premium licenses—no recurring subscriptions. All payments are securely processed through our Merchant of Record, Paddle.com, which supports various payment methods globally."
                },
                {
                  q: "What is the 'Bring Your Own Key' (BYOK) model?",
                  a: "To keep our core platform free, we allow you to connect your own Google Gemini API key for advanced features. This means you can use your own free or paid key to bypass any future limits."
                },
                {
                  q: "Are my images and API keys secure?",
                  a: "Yes. Your API keys are stored locally in your browser's storage or securely in your profile. Image processing requests are sent directly from your browser to the respective API providers."
                },
                {
                  q: "Where is my image history saved?",
                  a: "Your generated and processed images are saved locally in your browser's history for your privacy and convenience. We do not store your images on our servers. You can easily clear your local history at any time."
                },
                {
                  q: "What image formats do you support?",
                  a: "We currently support uploading standard image formats including JPG, JPEG, PNG, and WEBP. All processed images with removed backgrounds are downloaded as high-quality PNG files to preserve the transparency."
                }
              ].map((faq, i) => (
                <div key={i} className="bg-card/50 border border-border/50 rounded-2xl p-6 md:p-8 hover:bg-card transition-colors">
                  <h3 className="text-lg md:text-xl font-bold text-foreground mb-3">{faq.q}</h3>
                  <p className="text-muted-foreground text-sm md:text-base leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 sm:top-8 sm:right-8 p-3 bg-card/50 hover:bg-card rounded-full text-foreground transition-colors z-[110] border border-border"
          >
            <X className="w-6 h-6" />
          </button>
          <div 
            className="relative max-w-5xl w-full h-full max-h-[85vh] flex items-center justify-center rounded-3xl overflow-hidden border border-border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundImage: 'conic-gradient(var(--checker-1) 90deg, var(--checker-2) 90deg 180deg, var(--checker-1) 180deg 270deg, var(--checker-2) 270deg)',
              backgroundSize: '24px 24px'
            }}
          >
            <img 
              src={selectedImage} 
              alt="Expanded view" 
              className="max-w-full max-h-full object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
