import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Key, Sparkles, CreditCard, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface PaidKeyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export function PaidKeyDialog({ isOpen, onClose, featureName }: PaidKeyDialogProps) {
  const navigate = useNavigate();
  const { user } = useUser();
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveKey = async () => {
    const keyToSave = apiKey.trim();
    if (!keyToSave) return;
    
    setIsSaving(true);
    try {
      localStorage.setItem('gemini_api_key', keyToSave);
      
      toast.success('API key saved successfully');
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to save API key');
    } finally {
      setIsSaving(false);
    }
  };

  const isLimitReached = false;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {isLimitReached ? (
              <>
                <Sparkles className="w-5 h-5 text-yellow-500" />
                Upgrade to Premium
              </>
            ) : (
              <>
                <Key className="w-5 h-5 text-indigo-500" />
                API Key Required
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2">
            {isLimitReached ? (
              <>
                You've reached the limit of 3 free generations. To continue using {featureName || 'the tool'} and unlock all premium features, please upgrade to a paid plan.
              </>
            ) : (
              <>
                Our testing quota is temporarily full. To continue testing {featureName || 'the tool'}, please provide your own Gemini API key.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {!isLimitReached && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Your Gemini API Key</label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="AIza..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="bg-background border-border"
                />
                {typeof window !== 'undefined' && window.aistudio && (
                  <Button 
                    variant="outline"
                    onClick={async () => {
                      await window.aistudio.openSelectKey();
                      onClose();
                    }}
                    className="shrink-0 border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10"
                    title="Select a key from your Google Cloud projects"
                  >
                    <Key className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg border border-border flex gap-3">
              <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground">
                Get a free key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Google AI Studio</a>. No credit card required.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {isLimitReached ? (
            <Button 
              onClick={() => {
                onClose();
                navigate('/pricing');
              }}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              View Pricing Plans
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={onClose} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button 
                onClick={handleSaveKey} 
                disabled={!apiKey.trim() || isSaving}
                className="w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90"
              >
                {isSaving ? 'Saving...' : 'Save & Continue'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
