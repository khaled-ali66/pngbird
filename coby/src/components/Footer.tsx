import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="py-8 border-t border-border/50 bg-background shrink-0 w-full z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <h4 className="text-foreground font-semibold">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/gallery" className="hover:text-foreground transition-colors">Gallery</Link></li>
              <li><Link to="/generate" className="hover:text-foreground transition-colors">Generate Image</Link></li>
              <li><Link to="/remove-bg" className="hover:text-foreground transition-colors">Remove Background</Link></li>
              <li><Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
              <li><Link to="/api-keys" className="hover:text-foreground transition-colors">API Keys</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-foreground font-semibold">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-foreground font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              <li><Link to="/refund" className="hover:text-foreground transition-colors">Refund Policy</Link></li>
              <li><Link to="/cookies" className="hover:text-foreground transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-foreground font-semibold">PngBird</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Free, high-quality AI image generation and background removal tools powered by your own API keys.
            </p>
          </div>
        </div>
        <div className="text-center pt-8 border-t border-border/50">
          <p className="text-muted-foreground text-xs sm:text-sm">
            &copy; {new Date().getFullYear()} PngBird. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
