import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, MapPin, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Contact() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 md:p-16 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center">
            <Mail className="w-6 h-6 text-muted-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Contact Us</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <p className="text-lg text-muted-foreground">
              Have a question, feedback, or need support? We'd love to hear from you. Fill out the form and we'll get back to you as soon as possible.
            </p>
            
            <div className="space-y-6 mt-8">
              <div className="flex items-start gap-3 text-muted-foreground">
                <Building className="w-5 h-5 mt-1 text-foreground" />
                <div>
                  <strong className="text-foreground block mb-1">Company</strong>
                  <span>PngBird</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-muted-foreground">
                <MapPin className="w-5 h-5 mt-1 text-foreground" />
                <div>
                  <strong className="text-foreground block mb-1">Address</strong>
                  <span>11 Wall Street</span><br />
                  <span>New York Stock Exchange, Broad Street</span><br />
                  <span>New York, NY 10005</span><br />
                  <span>United States</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-muted-foreground">
                <Mail className="w-5 h-5 mt-1 text-foreground" />
                <div>
                  <strong className="text-foreground block mb-1">Email Support</strong>
                  <a href="mailto:support@PngBird.com" className="hover:text-foreground transition-colors">support@PngBird.com</a>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card/50 border border-border rounded-2xl p-6">
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-foreground">Name</label>
                <Input id="name" placeholder="Your name" className="bg-background border-border text-foreground" />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
                <Input id="email" type="email" placeholder="your@email.com" className="bg-background border-border text-foreground" />
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-foreground">Message</label>
                <textarea 
                  id="message" 
                  rows={4}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="How can we help you?"
                />
              </div>
              <Button type="submit" className="w-full bg-foreground text-background hover:bg-foreground/90">
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
