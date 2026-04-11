import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleGenAI } from '@google/genai';
import { Loader2, Download, Image as ImageIcon, Sparkles, ArrowRight, UploadCloud, Key, Info, Crown, Wand2, X, Zap, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { processImages, withRetry } from '../lib/image-utils';
import { cn, hasPlan } from '@/lib/utils';
import { PaidKeyDialog } from '@/components/PaidKeyDialog';
import { useUser } from '@clerk/clerk-react';
import { storage } from '../lib/storage';
import { saveHistory } from '../lib/db';
import { toast } from 'sonner';

export default function RemoveBg() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState('');
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [technique, setTechnique] = useState<'Auto' | 'Pro'>('Auto');
  const [quality, setQuality] = useState<'512px' | '1K' | '2K' | '4K'>('1K');
  const [customApiKey, setCustomApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [hasKey, setHasKey] = useState(!!localStorage.getItem('gemini_api_key'));
  const [showPaidDialog, setShowPaidDialog] = useState(false);
  const [showFreeTierDialog, setShowFreeTierDialog] = useState(false);
  const [paidFeatureName, setPaidFeatureName] = useState('');

  // ── Credit System ──
  const isFreeUser = !user || (user.unsafeMetadata?.plan as string || 'free') === 'free';
  const [guestCreditsSpent, setGuestCreditsSpent] = useState(() => parseInt(localStorage.getItem('guest_credits_spent') || '0'));
  const totalSpent = user ? (((user.unsafeMetadata?.generate_count as number) || 0) + ((user.unsafeMetadata?.remove_bg_count as number) || 0)) : guestCreditsSpent;
  const totalAvailable = 20;
  const creditsRemaining = Math.max(0, totalAvailable - totalSpent);

  const handleGenerate = async () => {
    if (!sourceImage) return;

    const cost = technique === 'Pro' ? 1 : 0;
    if (isFreeUser && creditsRemaining < cost) {
      toast.error('Limit reached', { description: `You need ${cost} credits but only have ${creditsRemaining} left. Please upgrade to a paid plan.` });
      navigate('/pricing');
      return;
    }

    const isPremiumModel = false;
    if (isPremiumModel && typeof window !== 'undefined' && window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) await window.aistudio.openSelectKey();
    }

    setIsGenerating(true);
    setFinalImage(null);
    setStatus('');

    try {
      let resultUrl = '';

      if (technique === 'Auto') {
        setStatus('Processing image locally...');
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const { removeBackground: rb } = await import('@imgly/background-removal');
        const blob = await rb(sourceImage, {
          model: isMobile ? "isnet_quint8" : "isnet_fp16",
          device: isMobile ? "cpu" : "gpu",
          proxyToWorker: true,
          output: { format: "image/png", quality: 1.0 },
          progress: (p: any) => { setStatus(`Processing: ${Math.round(p * 100)}%`); }
        });

        resultUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } else {
        // Pro Technique (Gemini + Client-side Removal)
        const userKey = localStorage.getItem('gemini_api_key');
        const aiStudioKey = (window as any).process?.env?.API_KEY;
        const apiKey = aiStudioKey || userKey || process.env.GEMINI_API_KEY;

        if (!apiKey && !isPremiumModel) {
          setHasKey(false);
          throw new Error("Please provide a Gemini API key.");
        }

        const needsPremiumModel = quality !== '1K';
        const modelName = needsPremiumModel ? 'gemini-3.1-flash-image-preview' : 'gemini-2.5-flash-image';
        const ai = new GoogleGenAI({ apiKey: apiKey || '' });

        setStatus('Processing image...');

        let finalSourceImage = sourceImage;
        if (sourceImage.startsWith('http') || sourceImage.startsWith('//')) {
          const urlToFetch = sourceImage.startsWith('//') ? `https:${sourceImage}` : sourceImage;
          const response = await fetch(urlToFetch);
          const blob = await response.blob();
          finalSourceImage = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        }

        const base64Data = finalSourceImage.split(',')[1];
        const mimeType = finalSourceImage.split(',')[0].split(':')[1].split(';')[0];

        const parts: any[] = [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: `Extract the main subject from this image. Place it on a pure solid white #FFFFFF background. 

CRITICAL TRANSPARENCY RULES:
If the object is made of glass, plastic, liquid, or any clear material, it MUST behave like physical transparent glass in real life.
The glass body must be fully transparent, allowing the new white background to be clearly visible through the material.
The interior of the glass must not contain any opaque fill from the original background.
Light must pass through the glass and create accurate refraction, distortion, and caustics against the new white background.
The base of the glass must also be transparent, showing the white background through it.
The edges should show thin bright highlights and subtle refraction, not solid color.

Ensure physically correct lighting and sharp edges.` }
        ];

        const config: any = { imageConfig: { aspectRatio: "1:1" } };
        if (modelName === 'gemini-3.1-flash-image-preview') {
          config.imageConfig.imageSize = quality as any;
        }

        const whiteRes: any = await withRetry(() => ai.models.generateContent({
          model: modelName,
          contents: { parts },
          config
        }));

        if (!whiteRes.candidates?.[0]?.content?.parts) throw new Error("The AI model didn't return any results.");

        let whiteBase64 = '';
        let whiteMimeType = 'image/png';
        for (const part of whiteRes.candidates[0].content.parts) {
          if (part.inlineData) {
            whiteBase64 = part.inlineData.data;
            if (part.inlineData.mimeType) whiteMimeType = part.inlineData.mimeType;
            break;
          }
        }

        if (!whiteBase64) throw new Error("Failed to process image.");
        const whiteDataUrl = `data:${whiteMimeType};base64,${whiteBase64}`;

        const blackRes: any = await withRetry(() => ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [
              { inlineData: { data: whiteBase64, mimeType: whiteMimeType } },
              { text: `Change the background of this image to pure solid pitch black #000000. Keep the main subject EXACTLY identical in shape and non-transparent colors.

CRITICAL TRANSPARENCY RULES:
If the object is made of glass, plastic, liquid, or any clear material, it MUST refract and reflect the new black background.
The interior of the glass must become dark, showing the black background through it.
Do NOT keep the white refractions or white fill from the previous image inside the glass.
Light must pass through the glass and create accurate refraction, distortion, and caustics against the new black background.
The base of the glass must also be transparent, showing the black background through it.
The edges should show thin bright highlights and subtle refraction, not solid color.` }
            ]
          },
          config
        }));

        let blackBase64 = '';
        if (blackRes.candidates?.[0]?.content?.parts) {
          for (const part of blackRes.candidates[0].content.parts) {
            if (part.inlineData) { blackBase64 = part.inlineData.data; break; }
          }
        }

        if (!blackBase64) throw new Error("Failed to process image matte.");
        const blackDataUrl = `data:image/png;base64,${blackBase64}`;

        const tempCanvas = document.createElement('canvas');
        resultUrl = await processImages(whiteDataUrl, blackDataUrl, tempCanvas);
      }

      if (resultUrl) {
        setFinalImage(resultUrl);

        // ── Save History ──
        if (user) {
          try {
            await saveHistory({
              id: crypto.randomUUID(),
              type: 'remove-bg',
              prompt: 'Background Removed',
              resultImage: resultUrl,
              timestamp: Date.now()
            });
          } catch (err) {
            console.error('Error saving generation:', err);
          }
        }

        // ── Update Credits ──
        if (isFreeUser && cost > 0) {
          if (user) {
            try {
              await user.update({
                unsafeMetadata: {
                  ...user.unsafeMetadata,
                  remove_bg_count: ((user.unsafeMetadata?.remove_bg_count as number) || 0) + cost
                }
              });
              try { await user.reload(); } catch (e) { console.error("Failed to reload user:", e); }
            } catch (e) { console.error("Failed to update user:", e); }
          } else {
            const newSpent = guestCreditsSpent + cost;
            localStorage.setItem('guest_credits_spent', newSpent.toString());
            setGuestCreditsSpent(newSpent);
          }
        }
      }

      setStatus('');
    } catch (err: any) {
      console.error("Generation error:", err);

      const isQuotaError = err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED') || err.message?.includes('quota');
      const isAuthError = err.message?.includes('PERMISSION_DENIED') || err.message?.includes('403') || err.message?.includes('API_KEY_INVALID') || err.message?.includes('API key not valid');
      const isFreeTierLimitZero = err.message?.includes('limit: 0') && err.message?.includes('free_tier');

      if (isAuthError || isQuotaError) {
        if (isFreeTierLimitZero) { setShowFreeTierDialog(true); return; }
        if (typeof window !== 'undefined' && window.aistudio) {
          setStatus(isQuotaError ? 'Quota exceeded. Please update your API key...' : 'Invalid API key. Please select a valid API key...');
          await window.aistudio.openSelectKey();
          setStatus('');
          setTimeout(() => handleGenerate(), 500);
          return;
        } else {
          setStatus(isQuotaError ? 'Quota exceeded. Please check your API Keys page.' : 'Invalid API key. Please check your API Keys page.');
          return;
        }
      }

      let msg = err.message || "An unknown error occurred";
      setStatus(`Error: ${msg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              const reader = new FileReader();
              reader.onloadend = () => setSourceImage(reader.result as string);
              reader.readAsDataURL(blob);
            }
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleDownload = () => {
    if (!finalImage) return;
    const a = document.createElement('a');
    a.href = finalImage;
    a.download = 'transparent-image.png';
    a.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSourceImage(reader.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const CreditUsage = () => {
    if (!isFreeUser) return null;
    const percentage = Math.min((totalSpent / totalAvailable) * 100, 100);
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <div className="w-4 h-4 rounded-full border-2 border-foreground/30" />
          Credit usage
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Spent {totalSpent}</span>
          <span>Available {totalAvailable - totalSpent}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${percentage}%` }} />
        </div>
      </div>
    );
  };

  const renderProcessingSettings = (className?: string) => (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Processing Settings</h3>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Technique</label>
          <Select value={technique} onValueChange={(v: any) => setTechnique(v)}>
            <SelectTrigger className="w-full bg-card border-border rounded-xl h-12">
              <SelectValue placeholder="Select Technique" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="Auto">Auto (WebGPU Accelerated)</SelectItem>
              <SelectItem value="Pro" disabled={!hasPlan(user?.unsafeMetadata?.plan as string, 'pro')}>
                <div className="flex items-center gap-2">
                  Pro (Gemini AI, Best Quality) {!hasPlan(user?.unsafeMetadata?.plan as string, 'pro') && <Lock className="w-3 h-3" />}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Output Quality</label>
          <Select value={quality} onValueChange={(v: any) => setQuality(v)}>
            <SelectTrigger className="w-full bg-card border-border rounded-xl h-12">
              <SelectValue placeholder="Select Quality" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="512px">512px (Fast)</SelectItem>
              <SelectItem value="1K">1K (Standard)</SelectItem>
              <SelectItem value="2K" disabled={!hasPlan(user?.unsafeMetadata?.plan as string, 'pro')}>
                <div className="flex items-center gap-2">
                  2K (High) {!hasPlan(user?.unsafeMetadata?.plan as string, 'pro') && <Lock className="w-3 h-3" />}
                </div>
              </SelectItem>
              <SelectItem value="4K" disabled={!hasPlan(user?.unsafeMetadata?.plan as string, 'ultimate')}>
                <div className="flex items-center gap-2">
                  4K (Ultra) {!hasPlan(user?.unsafeMetadata?.plan as string, 'ultimate') && <Lock className="w-3 h-3" />}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-0 bg-background lg:overflow-hidden overflow-y-auto w-full max-w-6xl mx-auto">
      <div className="flex-1 flex flex-col p-4 lg:p-6 space-y-6 lg:overflow-y-auto shrink-0 lg:shrink">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Background Remover</h1>
            <p className="text-sm text-muted-foreground">Extract subjects with perfect transparency.</p>
          </div>
          {technique === 'Pro' && (
            <button onClick={() => setHasKey(false)}
              className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-2 transition-colors bg-card hover:bg-card/80 px-3 py-1.5 rounded-lg border border-border">
              <Key className="w-3.5 h-3.5" />
              Update API Key
            </button>
          )}
        </div>

        {!hasKey && technique === 'Pro' ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-background">
            <Card className="p-8 bg-card border-border max-w-md w-full space-y-6 text-center shadow-2xl ring-1 ring-foreground/5">
              <div className="inline-flex items-center justify-center p-4 bg-background rounded-full mb-2">
                <Key className="w-8 h-8 text-yellow-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Connect Your Gemini Key</h2>
              <p className="text-muted-foreground">To keep this tool free and support high-quality 4K generation, please paste your Gemini API key. This supports **every key**, including free ones.</p>
              <div className="space-y-4">
                <div className="text-left space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Your API Key</label>
                  <Input type="password" placeholder="Paste AIza... key here" value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    className="bg-background border-border h-12 text-foreground selection:bg-foreground/10 selection:text-foreground" />
                </div>
                <div className="p-4 bg-background rounded-xl border border-border text-left space-y-2">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Info className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>Get your free key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:underline">Google AI Studio</a>. No billing or credit card is required for free tier keys.</p>
                  </div>
                </div>
                <Button disabled={!customApiKey.trim()} className="w-full py-6 bg-foreground text-background hover:bg-foreground/90 font-bold rounded-xl">Connect Key</Button>
              </div>
            </Card>
          </div>
        ) : (
          <>
            <div className="flex-1 flex flex-col min-h-0 space-y-12">
              {!sourceImage ? (
                <div className="flex-1 flex flex-col gap-8">
                  <div className="flex-1 min-h-[300px] border-2 border-dashed border-border rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-6 relative group hover:border-border/80 transition-all duration-300 bg-card/20">
                    <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="w-20 h-20 bg-card rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-border shadow-xl">
                      <UploadCloud className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xl font-bold text-foreground tracking-tight">Drop your image here</p>
                      <p className="text-muted-foreground text-sm max-w-xs mx-auto">Upload or paste any image to extract the subject with a perfect transparent background.</p>
                    </div>
                    <Button className="bg-foreground text-background hover:bg-foreground/90 font-bold rounded-xl px-8 h-12 relative z-20 pointer-events-none">Choose File</Button>
                  </div>

                  <div className="space-y-4">
                    {renderProcessingSettings("block lg:hidden mb-8")}
                    <div className="flex items-center gap-4">
                      <div className="h-px bg-border flex-1"></div>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Or try these examples</span>
                      <div className="h-px bg-border flex-1"></div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400&auto=format&fit=crop',
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
                        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400&auto=format&fit=crop',
                        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400&auto=format&fit=crop'
                      ].map((url, i) => (
                        <button key={i} onClick={() => setSourceImage(url)}
                          className="relative aspect-square rounded-2xl overflow-hidden border border-border hover:ring-2 hover:ring-foreground/20 transition-all group">
                          <img src={url} alt={`Example ${i + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="bg-background/90 text-foreground text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">Try this</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0 space-y-8 items-center justify-center w-full py-8">
                  <div className="relative group w-fit max-w-2xl mx-auto animate-in zoom-in-95 duration-500">
                    <div className="absolute -inset-2 bg-gradient-to-r from-foreground/10 via-foreground/5 to-foreground/10 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-500"></div>
                    <div className="relative rounded-[2rem] border border-border/50 bg-card/30 p-2 shadow-2xl backdrop-blur-sm">
                      <div className="relative rounded-3xl overflow-hidden bg-background/50 border border-border/50 flex items-center justify-center"
                        style={{ backgroundImage: 'conic-gradient(var(--checker-1) 90deg, var(--checker-2) 90deg 180deg, var(--checker-1) 180deg 270deg, var(--checker-2) 270deg)', backgroundSize: '24px 24px' }}>
                        <img src={sourceImage} alt="Source" className="max-h-[50vh] max-w-full object-contain rounded-2xl shadow-sm" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                          <Button variant="destructive" onClick={() => setSourceImage(null)} className="rounded-xl font-bold shadow-xl scale-95 group-hover:scale-100 transition-transform duration-300">Remove Image</Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {renderProcessingSettings("block lg:hidden w-full max-w-md")}

                  <div className="flex items-center justify-center relative z-10">
                    <Button onClick={handleGenerate} disabled={isGenerating || !sourceImage}
                      className="bg-foreground text-background hover:bg-foreground/90 font-bold rounded-xl px-12 h-14 shadow-2xl transition-transform active:scale-95 text-lg">
                      {isGenerating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                      {isGenerating ? 'Processing...' : 'Remove Background'}
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 border-t border-border/50">
                <div className="p-6 rounded-3xl bg-card/30 border border-border/50 flex flex-col items-center text-center space-y-4 hover:bg-card/50 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center text-foreground"><Sparkles className="w-6 h-6" /></div>
                  <div><h3 className="font-bold text-foreground mb-1">AI-Powered</h3><p className="text-sm text-muted-foreground">Uses advanced AI to perfectly separate the subject from any background.</p></div>
                </div>
                <div className="p-6 rounded-3xl bg-card/30 border border-border/50 flex flex-col items-center text-center space-y-4 hover:bg-card/50 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center text-foreground"><Wand2 className="w-6 h-6" /></div>
                  <div><h3 className="font-bold text-foreground mb-1">High Quality</h3><p className="text-sm text-muted-foreground">Supports up to 4K resolution output with crisp, clean edges.</p></div>
                </div>
                <div className="p-6 rounded-3xl bg-card/30 border border-border/50 flex flex-col items-center text-center space-y-4 hover:bg-card/50 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center text-foreground"><Download className="w-6 h-6" /></div>
                  <div><h3 className="font-bold text-foreground mb-1">Instant Download</h3><p className="text-sm text-muted-foreground">Get your transparent PNG instantly, ready to use in your designs.</p></div>
                </div>
              </div>
            </div>

            {/* Status Display */}
            {status && (
              <div className="flex items-center justify-center gap-3 text-muted-foreground bg-card/30 py-3 px-6 rounded-full w-fit mx-auto border border-border/50">
                <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
                <span className="text-sm font-medium tracking-wide">{status}</span>
              </div>
            )}

            {finalImage && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                <Card className="p-6 bg-card border-border rounded-3xl overflow-hidden shadow-2xl ring-1 ring-foreground/10 w-full max-w-2xl relative">
                  <button onClick={() => setFinalImage(null)}
                    className="absolute top-4 right-4 p-2 bg-background hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors z-20">
                    <ArrowRight className="w-5 h-5 rotate-45" />
                  </button>
                  <div className="relative rounded-2xl border border-border overflow-hidden flex items-center justify-center bg-background mx-auto w-fit max-w-full"
                    style={{ backgroundImage: 'conic-gradient(var(--checker-1) 90deg, var(--checker-2) 90deg 180deg, var(--checker-1) 180deg 270deg, var(--checker-2) 270deg)', backgroundSize: '24px 24px' }}>
                    <img src={finalImage} alt="Generated result" className="max-h-[60vh] max-w-full object-contain relative z-10" />
                  </div>
                  <div className="mt-6 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ready to download</span>
                      </div>
                      <Button onClick={handleDownload} className="bg-foreground text-background hover:bg-foreground/90 rounded-xl h-12 px-8 font-bold shadow-xl">
                        <Download className="w-4 h-4 mr-2" />Download PNG
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </>
        )}
      </div>

      <aside className="w-full lg:w-80 lg:border-l border-t lg:border-t-0 border-border bg-background p-4 lg:p-6 space-y-8 lg:overflow-y-auto shrink-0 relative z-10">
        {renderProcessingSettings("hidden lg:block")}
        <div className="space-y-4 pt-8 border-t border-border">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Pro Tips</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-card/30 border border-border/50">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">For best results, use images with a clear contrast between the subject and the background.</p>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-card/30 border border-border/50">
              <Crown className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">Upgrade to Pro for AI-powered edge detection and up to 4K resolution output.</p>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-card/30 border border-border/50">
              <ImageIcon className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">Supported formats: JPG, PNG, WEBP. Max file size: 10MB.</p>
            </div>
          </div>
        </div>
        <CreditUsage />
      </aside>

      <PaidKeyDialog isOpen={showPaidDialog} onClose={() => setShowPaidDialog(false)} featureName={paidFeatureName} />

      {showFreeTierDialog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card border border-border rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl relative">
            <button onClick={() => setShowFreeTierDialog(false)} className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Billing Required</h2>
            <p className="text-muted-foreground">Google requires a billing-enabled API key to generate images. Your card won't be charged unless you exceed the free quota, but it must be on file. Alternatively, you can use a Fal.ai or OpenAI key!</p>
            <div className="flex flex-col gap-3">
              <a href="https://aistudio.google.com/app/billing" target="_blank" rel="noopener noreferrer" className="w-full">
                <Button className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 font-bold rounded-xl text-base">Enable Billing in Google AI Studio</Button>
              </a>
              <Button variant="outline" onClick={() => setShowFreeTierDialog(false)} className="h-12 rounded-xl font-bold">Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
