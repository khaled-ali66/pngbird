import React from 'react';
import { Link } from 'react-router-dom';
import { Info, ArrowLeft, Sparkles, Image as ImageIcon, Zap } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 md:p-16 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center">
            <Info className="w-6 h-6 text-muted-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">About PngBird</h1>
        </div>

        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6">
          <p className="text-xl text-muted-foreground leading-relaxed">
            PngBird is a cutting-edge platform designed to democratize access to powerful AI image generation and editing tools. 
            Our mission is to provide creators, developers, and everyday users with a seamless, fast, and high-quality experience.
          </p>

          <div className="grid md:grid-cols-3 gap-6 my-12 not-prose">
            <div className="bg-card/50 border border-border rounded-2xl p-6 space-y-4">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">AI Generation</h3>
              <p className="text-sm text-muted-foreground">Harness the power of top-tier models to create stunning visuals from text.</p>
            </div>
            <div className="bg-card/50 border border-border rounded-2xl p-6 space-y-4">
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Background Removal</h3>
              <p className="text-sm text-muted-foreground">Instantly remove backgrounds with our Auto mode or use Pro mode for complex details.</p>
            </div>
            <div className="bg-card/50 border border-border rounded-2xl p-6 space-y-4">
              <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Bring Your Own Key</h3>
              <p className="text-sm text-muted-foreground">We keep the tool accessible by allowing you to plug in your own API keys for free usage, or purchase a premium license.</p>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-foreground mt-12 mb-4">Our Story</h2>
          <p>
            Born out of the frustration with paywalled AI tools, PngBird was created with a simple idea: build a beautiful, 
            functional interface and let users bring their own API keys. This "Bring Your Own Key" (BYOK) model ensures that the 
            platform remains sustainable, while users only pay the base API costs directly to the providers. We also offer premium one-time licenses for users who want a fully managed experience.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Company Information</h2>
          <p>
            PngBird is proudly operated by PngBird.
            <br /><br />
            <strong>Business Address:</strong><br />
            11 Wall Street<br />
            New York Stock Exchange, Broad Street<br />
            New York, NY 10005<br />
            United States
            <br /><br />
            <strong>Contact:</strong> support@PngBird.com
          </p>
        </div>
      </div>
    </div>
  );
}
