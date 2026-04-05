import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@clerk/clerk-react';
import { toast } from 'sonner';

export default function ApiKeys() {
  const { user } = useUser();
  const [geminiKey, setGeminiKey] = useState('');
  const [showGemini, setShowGemini] = useState(false);
  
  const [openAIKey, setOpenAIKey] = useState('');
  const [showOpenAI, setShowOpenAI] = useState(false);

  const [falKey, setFalKey] = useState('');
  const [showFal, setShowFal] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const localGemini = localStorage.getItem('gemini_api_key');
    if (localGemini) setGeminiKey(localGemini);

    const localOpenAI = localStorage.getItem('openai_api_key');
    if (localOpenAI) setOpenAIKey(localOpenAI);

    const localFal = localStorage.getItem('fal_api_key');
    if (localFal) setFalKey(localFal);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const gKey = geminiKey.trim();
      if (gKey) localStorage.setItem('gemini_api_key', gKey);
      else localStorage.removeItem('gemini_api_key');

      const oKey = openAIKey.trim();
      if (oKey) localStorage.setItem('openai_api_key', oKey);
      else localStorage.removeItem('openai_api_key');

      const fKey = falKey.trim();
      if (fKey) localStorage.setItem('fal_api_key', fKey);
      else localStorage.removeItem('fal_api_key');
      
      toast.success('API keys saved successfully');
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to save API keys');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background text-foreground p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Key className="w-8 h-8 text-indigo-500" />
            API Keys
          </h1>
          <p className="text-muted-foreground">Manage your API keys for different AI models</p>
        </div>

        <div className="space-y-6">
          {/* Gemini API Key */}
          <div className="p-6 bg-card border border-border rounded-3xl space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                Gemini API Key 
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:underline font-normal">
                  (Get a free key here) ↗
                </a>
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Input 
                    type={showGemini ? "text" : "password"}
                    placeholder="Paste your Gemini API key here"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    className="bg-background border-border h-12 text-foreground selection:bg-indigo-500/20 pr-10"
                  />
                  <button 
                    onClick={() => setShowGemini(!showGemini)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showGemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {typeof window !== 'undefined' && window.aistudio && (
                  <Button 
                    variant="outline"
                    onClick={() => window.aistudio.openSelectKey()}
                    className="h-12 border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10 font-bold rounded-xl"
                  >
                    Select Paid Key
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Used for Gemini models. Your API key is stored securely in your local browser storage.
            </p>
          </div>

          {/* OpenAI API Key */}
          <div className="p-6 bg-card border border-border rounded-3xl space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                OpenAI API Key 
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:underline font-normal">
                  (Get a key here) ↗
                </a>
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Input 
                    type={showOpenAI ? "text" : "password"}
                    placeholder="Paste your OpenAI API key here (sk-...)"
                    value={openAIKey}
                    onChange={(e) => setOpenAIKey(e.target.value)}
                    className="bg-background border-border h-12 text-foreground selection:bg-indigo-500/20 pr-10"
                  />
                  <button 
                    onClick={() => setShowOpenAI(!showOpenAI)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showOpenAI ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Used for DALL-E 3 models. Your API key is stored securely in your local browser storage.
            </p>
          </div>

          {/* Fal.ai API Key */}
          <div className="p-6 bg-card border border-border rounded-3xl space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                Fal.ai API Key 
                <a href="https://fal.ai/dashboard/keys" target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:underline font-normal">
                  (Get a key here) ↗
                </a>
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Input 
                    type={showFal ? "text" : "password"}
                    placeholder="Paste your Fal.ai API key here"
                    value={falKey}
                    onChange={(e) => setFalKey(e.target.value)}
                    className="bg-background border-border h-12 text-foreground selection:bg-indigo-500/20 pr-10"
                  />
                  <button 
                    onClick={() => setShowFal(!showFal)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showFal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Used for Flux models. Your API key is stored securely in your local browser storage.
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="h-12 px-8 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all w-full sm:w-auto"
            >
              {isSaving ? 'Saving...' : 'Save All Keys'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
