import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Image as ImageIcon, Wand2, CheckCircle2, XCircle, Maximize2, X, Zap, Lock, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '../components/ThemeToggle';
import { PricingSection } from '../components/PricingSection';
import { Header } from '../components/Header';
import { Logo } from '../components/Logo';
import { cn } from '@/lib/utils';

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <div className="flex-1 overflow-y-auto bg-background text-foreground font-sans">
      <div className="max-w-6xl mx-auto px-4 py-4 md:py-6 space-y-6 md:space-y-8">
        
        {/* Hero Section */}
        <section className="text-center space-y-4 md:space-y-6 pt-4 md:pt-6 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] aspect-square bg-yellow-500/10 blur-[80px] md:blur-[120px] rounded-full pointer-events-none" />
          
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
              <Button className="w-full h-12 md:h-14 px-8 bg-white text-black hover:bg-white/90 font-bold rounded-xl md:rounded-2xl text-base md:text-lg transition-all flex items-center justify-center gap-2">
                <Wand2 className="w-5 h-5" />
                Generate Image
              </Button>
            </Link>
            <Button
              className="w-full sm:w-auto h-12 md:h-14 px-8 bg-black text-white hover:bg-black/90 font-bold rounded-xl md:rounded-2xl text-base md:text-lg transition-all flex items-center justify-center gap-2"
              onClick={() => document.getElementById('video-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <ImageIcon className="w-5 h-5" />
              Watch a demo
            </Button>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="space-y-4 md:space-y-6 relative z-10 pt-[5%]">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto px-4">
            {/* Others */}
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl md:rounded-3xl p-4 md:p-6 aspect-square flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-3 left-3 md:top-4 md:left-4 bg-red-500/20 text-red-500 border border-red-500/30 px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1 z-20">
                  <XCircle className="w-3 h-3" /> Others
                </div>
                <div className="w-48 h-48 md:w-64 md:h-64 relative shadow-2xl rounded-xl overflow-hidden scale-[138%]"
                     style={{
                       backgroundImage: 'conic-gradient(#ffffff 90deg, #e5e5e5 90deg 180deg, #ffffff 180deg 270deg, #e5e5e5 270deg)',
                       backgroundSize: '20px 20px'
                     }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img src="https://iili.io/BEWtGRI.jpg" alt="Others" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                </div>
              </div>
            </div>

            {/* PngLook AI */}
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl md:rounded-3xl p-4 md:p-6 aspect-square flex flex-col items-center justify-center relative overflow-hidden"
                   style={{
                     backgroundImage: 'conic-gradient(var(--checker-1) 90deg, var(--checker-2) 90deg 180deg, var(--checker-1) 180deg 270deg, var(--checker-2) 270deg)',
                     backgroundSize: '20px 20px'
                   }}>
                <div className="absolute top-3 left-3 md:top-4 md:left-4 bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1 z-20">
                  <CheckCircle2 className="w-3 h-3" /> PngLook AI
                </div>
                <div className="w-48 h-48 md:w-64 md:h-64 relative z-10 flex items-center justify-center scale-[138%]">
                  <img src="https://iili.io/BEWtt5B.png" alt="PngLook AI" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Example Gallery Section */}
        <section className="space-y-4 md:space-y-6 relative z-10 pb-4 md:pb-8">
          <div className="text-center space-y-4 px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Real Examples</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
              Our tool handles hair glow, motion blur, glass, smoke, and other fine details with precision.<br className="hidden sm:block" />
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
        <section className="py-2 md:py-4 relative z-10 border-t border-border/50">
          <div className="text-center space-y-4 mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">How it Works</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto px-4">
            <div className="flex flex-col items-center text-center space-y-4">
              <Link to="/api-keys" className="group flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-400 font-bold text-xl flex items-center justify-center mb-2 group-hover:bg-purple-500/20 group-hover:scale-105 transition-all">
                  1
                </div>
                <h3 className="text-lg font-bold text-foreground group-hover:text-purple-400 transition-colors flex items-center gap-1">
                  Get a key <span className="text-xs">↗</span>
                </h3>
              </Link>
              <p className="text-muted-foreground text-sm">
                Watch the video below for better understanding
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 font-bold text-xl flex items-center justify-center mb-2">
                2
              </div>
              <h3 className="text-lg font-bold text-foreground">Upload/Generate</h3>
              <p className="text-muted-foreground text-sm">
                Upload your image or generate one
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xl flex items-center justify-center mb-2">
                3
              </div>
              <h3 className="text-lg font-bold text-foreground">Auto Process</h3>
              <p className="text-muted-foreground text-sm">
                Our AI removes the background
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

        {/* Video Section */}
        <section id="video-section" className="py-2 md:py-4 relative z-10 border-t border-border/50">
          <div className="max-w-5xl mx-auto px-4">
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl">
              <div 
                style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}
                dangerouslySetInnerHTML={{ __html: '<iframe id="js_video_iframe" src="https://jumpshare.com/embed/92kPYrK19B2F4sO3w56p" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe>' }}
              />
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="pt-[10%] pb-2 md:pb-4 relative z-10 border-t border-border/50">
          <PricingSection />
        </section>

        {/* FAQs Section */}
        <section className="py-6 md:py-8 relative z-10 border-t border-border/50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">Frequently Asked Questions</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Everything you need to know about PngLook.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {[
                {
                  q: "How to use the tool?",
                  a: <>You can use the tool in 4 simple steps: 1. Add your <Link to="/api-keys" className="text-foreground hover:underline font-bold">API key</Link> (watch the tutorial). 2. Start generating PNG images. 3. The AI removes the background automatically. 4. Download your image and enjoy.</>
                },
                {
                  q: "Do you provide refunds?",
                  a: <>Yes, we provide refunds. Please read our <Link to="/refund-policy" className="text-foreground hover:underline font-bold">refund policy</Link> for more details.</>
                },
                {
                  q: "How much does it cost to generate images?",
                  a: "The cost depends on the provider and the model you use. For example, with OpenAI’s DALL·E, generating one image usually costs around $0.02–$0.04, depending on the resolution. PngLook does not add any extra fees. Please check the official pricing of each provider for exact details."
                },
                {
                  q: "Is my API key secure?",
                  a: "Yes, your API key is stored securely in your browser (local storage) or your profile. It is never sent to our servers, so your data stays private."
                },
                {
                  q: "Is there a limit on image generation?",
                  a: "We offer generous limits for Free users to try the tool. Premium plans have unlimited generations and faster processing."
                },
                {
                  q: "Do I need to create an account?",
                  a: "No, you do not need to create an account. You can start using PngLook right away."
                }
              ].map((faq, i) => (
                <div key={i} className="bg-card/50 border border-border/50 rounded-2xl p-6 md:p-8 hover:bg-card transition-colors">
                  <h3 className="text-lg md:text-xl font-bold text-foreground mb-3">{faq.q}</h3>
                  <div className="text-muted-foreground text-sm md:text-base leading-relaxed whitespace-pre-line">{faq.a}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-4 md:py-6 relative z-10 text-center px-4">
          <div className="max-w-6xl mx-auto border border-border rounded-3xl p-4 md:p-6">
            <p className="text-sm md:text-base text-muted-foreground">
              Still have a Question? We are here to help. <Link to="/contact" className="text-foreground font-bold hover:underline">Contact us.</Link>
            </p>
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
