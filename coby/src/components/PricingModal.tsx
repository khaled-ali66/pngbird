import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PricingSection } from './PricingSection';
import { Sparkles } from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function PricingModal({ isOpen, onClose, title, description }: PricingModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl bg-background border-border overflow-y-auto max-h-[90vh]">
        <DialogHeader className="text-center space-y-2 mb-8">
          <DialogTitle className="text-3xl font-bold flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            {title || 'Upgrade Your Creative Toolkit'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-lg">
            {description || "Choose a plan to continue creating without boundaries."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="pb-8">
          <PricingSection />
        </div>
      </DialogContent>
    </Dialog>
  );
}
