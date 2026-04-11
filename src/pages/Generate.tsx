import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GoogleGenAI } from '@google/genai';
import { Loader2, Download, Image as ImageIcon, Sparkles, ArrowRight, Key, Info, UploadCloud, Zap, Crown, X, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { processImages, withRetry } from '../lib/image-utils';
import { cn, hasPlan } from '@/lib/utils';
import { useUser, useClerk } from '@clerk/clerk-react';
import { storage } from '../lib/storage';
import { saveHistory } from '../lib/db';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function Generate() {
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const navigate = useNavigate();
  const location = useLocation();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState('');
  const [results, setResults] = useState<{ final: string }[]>([]);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [quality, setQuality] = useState<'512px' | '1K' | '2K' | '4K'>('1K');
  const [technique, setTechnique] = useState<'Auto' | 'Fast' | 'Pro'>('Auto');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('1:1');
  const [angle, setAngle] = useState<'Auto' | 'Front' | 'Side' | 'Top' | 'Bottom' | 'Isometric' | 'Dynamic'>('Auto');
  const [batchSize, setBatchSize] = useState<number>(1);
  const [model, setModel] = useState('Gemini');
  const [showFreeTierDialog, setShowFreeTierDialog] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(false);

  // ── Credit System ──
  const isFreeUser = !user || (user.unsafeMetadata?.plan as string || 'free') === 'free';
  const [guestCreditsSpent, setGuestCreditsSpent] = useState(() => parseInt(localStorage.getItem('guest_credits_spent') || '0'));
  const totalSpent = user ? (((user.unsafeMetadata?.generate_count as number) || 0) + ((user.unsafeMetadata?.remove_bg_count as number) || 0)) : guestCreditsSpent;
  const totalAvailable = 20;
  const creditsRemaining = Math.max(0, totalAvailable - totalSpent);

  useEffect(() => {
    if (location.state?.prompt) {
      setPrompt(location.state.prompt);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const canGenerate = () => {
    return true;
  };

  const handleGenerate = async () => {
    if (!canGenerate()) {
      navigate('/pricing');
      return;
    }

    if (!prompt && referenceImages.length === 0) return;

    let finalPrompt = prompt;
    const lowerPrompt = prompt.toLowerCase();

    const hasCustomAngle = lowerPrompt.includes('view') ||
                           lowerPrompt.includes('angle') ||
                           lowerPrompt.includes('tilt') ||
                           lowerPrompt.includes('rotate') ||
                           lowerPrompt.includes('degree') ||
                           lowerPrompt.includes('isometric') ||
                           lowerPrompt.includes('profile') ||
                           lowerPrompt.includes('side') ||
                           lowerPrompt.includes('top') ||
                           lowerPrompt.includes('bottom') ||
                           lowerPrompt.includes('perspective');

    let cameraRules = "";
    if (angle === 'Auto') {
      if (!hasCustomAngle) {
        cameraRules = `
Camera & Perspective Rules:
The object must be viewed perfectly straight-on from the front (0-degree rotation).
The camera must be level with the object.
Do NOT tilt, rotate, or angle the object.
Do NOT use dynamic or dramatic camera angles.
The object must stand perfectly upright.`;
      }
    } else if (angle === 'Front') {
      cameraRules = `
Camera & Perspective Rules:
The object must be viewed perfectly straight-on from the front (0-degree rotation).
The camera must be level with the object.
Do NOT tilt, rotate, or angle the object.
Do NOT use dynamic or dramatic camera angles.
The object must stand perfectly upright.`;
    } else if (angle === 'Side') {
      cameraRules = `
Camera & Perspective Rules:
The object must be viewed from the side (profile view).
The camera must be level with the object.
Do NOT use dynamic or dramatic camera angles.
The object must stand perfectly upright.`;
    } else if (angle === 'Top') {
      cameraRules = `
Camera & Perspective Rules:
The object must be viewed from directly above (top-down view).
Do NOT use dynamic or dramatic camera angles.`;
    } else if (angle === 'Bottom') {
      cameraRules = `
Camera & Perspective Rules:
The object must be viewed from directly below (bottom-up view).
Do NOT use dynamic or dramatic camera angles.`;
    } else if (angle === 'Isometric') {
      cameraRules = `
Camera & Perspective Rules:
The object must be viewed from an isometric perspective.
The camera should be angled down at approximately 30 degrees and rotated 45 degrees.`;
    } else if (angle === 'Dynamic') {
      cameraRules = `
Camera & Perspective Rules:
Use a dynamic, dramatic, or interesting camera angle.`;
    }

    const isolatedObjectRules = `
Generate exactly the subject described in the prompt as a single isolated object.
The output must contain only the subject itself with no environment or supporting surfaces.

Strict Composition Rules:
Render one single object only.
The object must float in empty space.
Do NOT add a table, floor, base, stand, surface, or platform.
Do NOT add an environment, room, or scene.
Do NOT generate shadows on a surface.
Do NOT generate reflection planes or studio floors.
Do NOT place the object on anything.${cameraRules}

Framing Rules:
The subject must be fully visible and centered.
The object must not touch or intersect any surface.
The object should appear as if cut out for product compositing.

Strict Negative Instructions:
no table
no floor
no base
no platform
no pedestal
no stand
no surface
no studio setup
no environment
no scene elements

The final result must look like a professional product cut-out used in VFX or e-commerce compositing, containing only the subject and nothing else.`;

    let actualTechnique = technique;
    if (technique === 'Auto') {
      const needsPro = /glass|transparent|translucent|water|liquid|ice|crystal|glow|fire|smoke|hair|fur|fluff|feather|blur/i.test(prompt);
      actualTechnique = needsPro ? 'Pro' : 'Fast';
    }

    if (actualTechnique === 'Fast') {
      finalPrompt = `${prompt}. Pure solid white background #FFFFFF. High quality, sharp edges, centered.\n\n${isolatedObjectRules}`;
    } else {
      finalPrompt = `${prompt}\n\n${isolatedObjectRules}`;
    }

    const isPremiumModel = useWebSearch || quality !== '1K';
    if (model === 'Gemini' && isPremiumModel && typeof window !== 'undefined' && window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }
    }

    const currentBatchSize = batchSize;
    const costPerImage = 1 + (actualTechnique === 'Pro' ? 1 : 0);
    const totalCost = currentBatchSize * costPerImage;

    if (isFreeUser && creditsRemaining < totalCost) {
      toast.error('Limit reached', { description: `You need ${totalCost} credits but only have ${creditsRemaining} left. Please upgrade to a paid plan.` });
      navigate('/pricing');
      return;
    }

    setIsGenerating(true);
    setResults([]);

    try {
      const currentBatchSize = batchSize;

      let finishedCount = 0;
      setStatus(currentBatchSize > 1 ? `Generating ${currentBatchSize} images...` : 'Generating your transparent image...');

      const generateImage = async (index: number) => {
        try {
          let finalUrl = '';
          let whiteDataUrl = '';
          let blackDataUrl = '';
          let whiteBase64 = '';
          let whiteMimeType = 'image/png';
          const userKey = localStorage.getItem('gemini_api_key');

          if (model === 'OpenAI') {
            const openAIKey = localStorage.getItem('openai_api_key');
            if (!openAIKey) throw new Error("OpenAI API Key required. Please add it in the API Keys page.");

            let size = "1024x1024";
            if (aspectRatio === '16:9') size = "1792x1024";
            else if (aspectRatio === '9:16') size = "1024x1792";
            else if (aspectRatio === '4:3') size = "1024x1024";

            const response = await fetch('https://api.openai.com/v1/images/generations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openAIKey}` },
              body: JSON.stringify({ model: "dall-e-3", prompt: finalPrompt, n: 1, size, response_format: "b64_json" })
            });

            if (!response.ok) {
              const errData = await response.json();
              throw new Error(errData.error?.message || "Failed to generate image with OpenAI");
            }

            const data = await response.json();
            const base64 = data.data[0].b64_json;
            const dataUrl = `data:image/png;base64,${base64}`;

            const { removeBackground } = await import('@imgly/background-removal');
            const blob = await removeBackground(dataUrl, { model: "isnet_quint8" });
            finalUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });

            whiteDataUrl = dataUrl;
            blackDataUrl = dataUrl;
          } else if (model === 'Fal.ai') {
            const falKey = localStorage.getItem('fal_api_key');
            if (!falKey) throw new Error("Fal.ai API Key required. Please add it in the API Keys page.");

            let image_size = "square";
            if (aspectRatio === '16:9') image_size = "landscape_16_9";
            else if (aspectRatio === '9:16') image_size = "portrait_16_9";
            else if (aspectRatio === '4:3') image_size = "landscape_4_3";

            const response = await fetch('https://fal.run/fal-ai/flux/dev', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Key ${falKey}` },
              body: JSON.stringify({ prompt: finalPrompt, image_size, num_inference_steps: 28, guidance_scale: 3.5, num_images: 1, sync_mode: true })
            });

            if (!response.ok) {
              const errData = await response.json();
              throw new Error(errData.detail || "Failed to generate image with Fal.ai");
            }

            const data = await response.json();
            const imageUrl = data.images[0].url;

            const { removeBackground } = await import('@imgly/background-removal');
            const blob = await removeBackground(imageUrl, { model: "isnet_quint8" });
            finalUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });

            whiteDataUrl = imageUrl;
            blackDataUrl = imageUrl;
          } else {
            // Gemini logic
            const aiStudioKey = (window as any).process?.env?.API_KEY;
            const apiKey = aiStudioKey || userKey || process.env.GEMINI_API_KEY;

            if (!apiKey && !isPremiumModel) throw new Error("Gemini API Key required");

            const ai = new GoogleGenAI({ apiKey: apiKey || '' });
            const imageSize = quality;
            const needsPremiumModel = useWebSearch || quality !== '1K';
            const modelName = needsPremiumModel ? 'gemini-3.1-flash-image-preview' : 'gemini-2.5-flash-image';

            const config: any = {
              imageConfig: {
                aspectRatio: aspectRatio === '16:9' ? '16:9' : aspectRatio === '9:16' ? '9:16' : '1:1',
              }
            };

            if (modelName === 'gemini-3.1-flash-image-preview') {
              config.imageConfig.imageSize = imageSize as any;
            }

            if (useWebSearch && modelName === 'gemini-3.1-flash-image-preview') {
              config.tools = [{ googleSearch: {} }];
            }

            // 1. Generate White Background Version (with reference images)
            const refParts = referenceImages.map(img => {
              const [header, data] = img.split(',');
              const mimeType = header.split(':')[1].split(';')[0];
              return { inlineData: { data, mimeType } };
            });

            const whiteRes: any = await withRetry(() => ai.models.generateContent({
              model: modelName,
              contents: {
                parts: [...refParts, { text: `${finalPrompt}. Pure solid white background #FFFFFF.` }]
              },
              config
            }));

            let textResponse = '';
            if (whiteRes.candidates?.[0]?.content?.parts) {
              for (const part of whiteRes.candidates[0].content.parts) {
                if (part.inlineData) {
                  whiteBase64 = part.inlineData.data;
                  if (part.inlineData.mimeType) whiteMimeType = part.inlineData.mimeType;
                  break;
                } else if (part.text) {
                  textResponse += part.text + ' ';
                }
              }
            }

            if (!whiteBase64) {
              console.error("White image generation response:", JSON.stringify(whiteRes, null, 2));
              if (textResponse) throw new Error(`The AI model refused to generate this image: ${textResponse.trim()}`);
              let errorMsg = `Failed to generate white version for image ${index + 1}`;
              if (whiteRes.candidates?.[0]?.finishReason) errorMsg += ` (Finish Reason: ${whiteRes.candidates[0].finishReason})`;
              if (whiteRes.promptFeedback?.blockReason) errorMsg += ` (Blocked: ${whiteRes.promptFeedback.blockReason})`;
              throw new Error(errorMsg);
            }
            whiteDataUrl = `data:${whiteMimeType};base64,${whiteBase64}`;

            if (actualTechnique === 'Fast') {
              if (currentBatchSize > 1) {
                setStatus(`Removing background (${index + 1}/${currentBatchSize})...`);
              } else {
                setStatus('Removing background...');
              }
              const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
              const { removeBackground: rb } = await import('@imgly/background-removal');
              const blob = await rb(whiteDataUrl, {
                model: isMobile ? "isnet_quint8" : "isnet_fp16",
                device: isMobile ? "cpu" : "gpu",
                proxyToWorker: true,
                output: { format: "image/png", quality: 1.0 }
              });
              finalUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });
            } else {
              // 2. Generate Black Background Version
              const blackRes: any = await withRetry(() => ai.models.generateContent({
                model: modelName,
                contents: {
                  parts: [
                    { inlineData: { data: whiteBase64, mimeType: whiteMimeType } },
                    { text: "Change the background to pure solid pitch black #000000. CRITICAL: Any transparent materials (glass, liquid, plastic) MUST refract and reflect the new black background. The interior of the glass must become dark, showing the black background through it. Do NOT keep the white refractions from the previous image. Keep the subject's overall shape, lighting, and non-transparent colors identical." }
                  ]
                },
                config
              }));

              let blackBase64 = '';
              let blackTextResponse = '';
              if (blackRes.candidates?.[0]?.content?.parts) {
                for (const part of blackRes.candidates[0].content.parts) {
                  if (part.inlineData) { blackBase64 = part.inlineData.data; break; }
                  else if (part.text) blackTextResponse += part.text + ' ';
                }
              }

              if (!blackBase64) {
                console.error("Black image generation response:", JSON.stringify(blackRes, null, 2));
                if (blackTextResponse) throw new Error(`The AI model refused to generate the black background version: ${blackTextResponse.trim()}`);
                let errorMsg = `Failed to generate black version for image ${index + 1}`;
                if (blackRes.candidates?.[0]?.finishReason) errorMsg += ` (Finish Reason: ${blackRes.candidates[0].finishReason})`;
                if (blackRes.promptFeedback?.blockReason) errorMsg += ` (Blocked: ${blackRes.promptFeedback.blockReason})`;
                throw new Error(errorMsg);
              }
              blackDataUrl = `data:image/png;base64,${blackBase64}`;

              // 3. Process Transparency
              const tempCanvas = document.createElement('canvas');
              finalUrl = await processImages(whiteDataUrl, blackDataUrl, tempCanvas);
            }
          }

          setResults(prev => [...prev, { final: finalUrl }]);

          // ── Upload to Supabase Gallery ──
          (async () => {
            try {
              const res = await fetch(finalUrl);
              const blob = await res.blob();
              const fileName = `generated-${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
              const filePath = `generated/${fileName}`;

              const { error: uploadError } = await supabase.storage
                .from('gallery')
                .upload(filePath, blob, { contentType: 'image/png', upsert: false });

              if (uploadError) throw uploadError;

              const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(filePath);

              await supabase.from('gallery_images').insert({
                title: prompt.split(' ').slice(0, 5).join(' ') + ' PNG',
                description: prompt,
                tags: prompt.split(' ').filter(w => w.length > 3).slice(0, 6).map(w => w.toLowerCase().replace(/[^a-z0-9]/g, '')),
                category: 'generated',
                image_url: publicUrl,
                thumb_url: publicUrl,
                width: 1024,
                height: 1024,
                is_active: true,
              });
            } catch (err) {
              console.error('Gallery upload failed:', err);
            }
          })();

          finishedCount++;
          if (currentBatchSize > 1) setStatus(`Generating ${currentBatchSize} images...`);

          // ── Save History + SEO ──
          if (user && finalUrl) {
            (async () => {
              try {
                await saveHistory({
                  id: crypto.randomUUID(),
                  type: 'generate',
                  prompt: prompt,
                  resultImage: finalUrl,
                  timestamp: Date.now()
                });

                const savedImage = await storage.saveImage(user?.id || '', {
                  url: finalUrl,
                  prompt,
                  model,
                  aspectRatio,
                  quality
                });

                let seoTitle = prompt.split('.')[0].substring(0, 60);
                let seoDescription = prompt;
                let seoTags = prompt.split(' ').filter(w => w.length > 3).slice(0, 5).map(w => w.replace(/[^a-zA-Z0-9]/g, '').toLowerCase());
                let seoCategory = "Other";

                try {
                  const aiStudioKey = (window as any).process?.env?.API_KEY;
                  const apiKey = aiStudioKey || userKey || process.env.GEMINI_API_KEY;
                  const ai = new GoogleGenAI({ apiKey: apiKey || '' });

                  let seoBase64 = whiteBase64;
                  let seoMimeType = whiteMimeType;

                  if (!seoBase64 && whiteDataUrl) {
                    if (whiteDataUrl.startsWith('data:image')) {
                      seoMimeType = whiteDataUrl.split(',')[0].split(':')[1].split(';')[0];
                      seoBase64 = whiteDataUrl.split(',')[1];
                    } else {
                      const res = await fetch(whiteDataUrl);
                      const blob = await res.blob();
                      seoMimeType = blob.type || 'image/png';
                      seoBase64 = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                        reader.readAsDataURL(blob);
                      });
                    }
                  }

                  const seoRes = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: {
                      parts: [
                        { inlineData: { data: seoBase64, mimeType: seoMimeType } },
                        { text: `You are an SEO expert with 20 years of experience and 10 years in AI engineering. Analyze this image and its generation prompt: "${prompt}". Generate an SEO-optimized title, a short, engaging SEO-optimized description (DO NOT just copy the prompt, write a new descriptive sentence about the image), and a list of 5-8 SEO keywords. Remove hashtags and keep keywords only. Also, categorize the image into exactly ONE of these categories: "Holidays", "Nature", "Business", "Food & Drink", "Technology", or "Other". Return ONLY a valid JSON object with the keys "title", "description", "tags" (array of strings), and "category" (string).` }
                      ]
                    },
                    config: { responseMimeType: "application/json" }
                  });

                  const seoData = JSON.parse(seoRes.text || '{}');
                  if (seoData.title) seoTitle = seoData.title;
                  if (seoData.description) seoDescription = seoData.description;
                  if (seoData.tags && Array.isArray(seoData.tags)) seoTags = seoData.tags.map((t: string) => t.replace(/^#/, '').trim());
                  if (seoData.category) seoCategory = seoData.category;

                  await storage.updateImage(user?.id || '', savedImage.id, { tags: seoTags, title: seoTitle, description: seoDescription, category: seoCategory });
                } catch (seoErr) {
                  console.error("SEO generation failed:", seoErr);
                  await storage.updateImage(user?.id || '', savedImage.id, { tags: seoTags, title: seoTitle, description: seoDescription, category: seoCategory });
                }
              } catch (err: any) {
                console.error("History save failed:", err);
              }
            })();
          }
        } catch (error) {
          console.error(`Error in image ${index + 1}:`, error);
          throw error;
        }
      };

      const generationPromises = Array.from({ length: currentBatchSize }, async (_, i) => generateImage(i));
      await Promise.all(generationPromises);

      // ── Update Usage Count ──
      if (isFreeUser) {
        if (user) {
          try {
            await user.update({
              unsafeMetadata: {
                ...user.unsafeMetadata,
                generate_count: ((user.unsafeMetadata?.generate_count as number) || 0) + currentBatchSize,
                remove_bg_count: ((user.unsafeMetadata?.remove_bg_count as number) || 0) + (actualTechnique === 'Pro' ? currentBatchSize : 0)
              }
            });
            try { await user.reload(); } catch (e) { console.error("Failed to reload user:", e); }
          } catch (e) { console.error("Failed to update user:", e); }
        } else {
          const newSpent = guestCreditsSpent + totalCost;
          localStorage.setItem('guest_credits_spent', newSpent.toString());
          setGuestCreditsSpent(newSpent);
        }
      }

      setStatus('');
    } catch (err: any) {
      console.error("Generation error:", err);
      setStatus('');

      if (err.message?.includes('PERMISSION_DENIED') || err.message?.includes('403') || err.message?.includes('API_KEY_INVALID') || err.message?.includes('API key not valid')) {
        if (typeof window !== 'undefined' && window.aistudio) {
          toast.error('Invalid API key', { description: 'Please select a valid API key to continue.' });
          await window.aistudio.openSelectKey();
          setTimeout(() => handleGenerate(), 500);
          return;
        } else {
          toast.error('Invalid API key', { description: 'Please check your API Keys page.' });
          return;
        }
      }

      if (err.message?.includes('500') || err.message?.includes('Internal Server Error')) {
        toast.error('Model Overloaded', { description: 'The AI model is currently overloaded. Please try again in a few moments.' });
      } else if (err.message?.includes('limit: 0') && err.message?.includes('free_tier')) {
        setShowFreeTierDialog(true);
      } else {
        if (err.message?.includes('The AI model refused to generate')) {
          toast.error('Content Policy Block', { description: err.message, duration: 8000 });
        } else {
          toast.error('Generation Failed', { description: err.message || 'An unexpected error occurred while generating your image.' });
        }
      }
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
            if (!hasPlan(user?.unsafeMetadata?.plan as string, 'ultimate')) {
              toast.error('Ultimate plan required', { description: 'Pasting reference images requires the Ultimate plan.' });
              return;
            }
            const blob = items[i].getAsFile();
            if (blob) {
              const reader = new FileReader();
              reader.onloadend = () => setReferenceImages(prev => [...prev, reader.result as string]);
              reader.readAsDataURL(blob);
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [user?.unsafeMetadata?.plan]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => setReferenceImages(prev => [...prev, reader.result as string]);
        reader.readAsDataURL(file);
      });
    }
    e.target.value = '';
  };

  const removeReferenceImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
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

  const renderReferenceImages = (className?: string) => {
    const canUseReferenceImages = hasPlan(user?.unsafeMetadata?.plan as string, 'ultimate');
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            Reference Images
            {!canUseReferenceImages && <Lock className="w-3 h-3" />}
          </h3>
          <span className="text-[10px] text-muted-foreground">{referenceImages.length}/3</span>
        </div>
        <div className="grid grid-cols-3 gap-2 relative">
          {!canUseReferenceImages && (
            <div
              className="absolute inset-0 z-20 cursor-not-allowed bg-background/50 backdrop-blur-[1px] rounded-xl flex items-center justify-center"
              onClick={() => toast.error('Ultimate plan required', { description: 'Reference images require the Ultimate plan.' })}
            >
              <Lock className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          {referenceImages.map((img, idx) => (
            <div key={idx} className="relative aspect-square rounded-xl border border-border overflow-hidden group">
              <img src={img} alt={`Ref ${idx}`} className="w-full h-full object-cover" />
              <button onClick={() => removeReferenceImage(idx)} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <ArrowRight className="w-4 h-4 rotate-45 text-white" />
              </button>
            </div>
          ))}
          {referenceImages.length < 3 && (
            <div className="relative aspect-square rounded-xl border-2 border-dashed border-border hover:border-border/80 transition-colors group">
              <input type="file" accept="image/*" multiple onChange={handleFileChange} disabled={!canUseReferenceImages} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground group-hover:text-foreground">
                <UploadCloud className="w-5 h-5 mb-1" />
                <span className="text-[8px] font-bold uppercase">Add</span>
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground italic">Upload or paste images to guide the AI's style or subject.</p>
      </div>
    );
  };

  const renderGenerationSettings = (className?: string, isMobile: boolean = false) => (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Generation Settings</h3>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">AI Model</label>
          <Select value={model} onValueChange={(v: any) => setModel(v)}>
            <SelectTrigger className="w-full bg-card border-border rounded-xl h-12"><SelectValue placeholder="Select Model" /></SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="Gemini">Gemini (Default)</SelectItem>
              <SelectItem value="OpenAI">DALL-E 3 (OpenAI)</SelectItem>
              <SelectItem value="Fal.ai">Flux (Fal.ai)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(true) && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center justify-between">
              Batch Size
              <span className="text-xs text-muted-foreground">{batchSize} images</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((num) => {
                const isLocked = num > 1 && !hasPlan(user?.unsafeMetadata?.plan as string, 'pro');
                return (
                  <button
                    key={num}
                    onClick={() => {
                      if (isLocked) { toast.error('Pro plan required', { description: 'Batch generation requires the Pro plan.' }); return; }
                      setBatchSize(num);
                    }}
                    className={cn(
                      "py-2 rounded-lg text-xs font-bold border transition-all relative overflow-hidden",
                      batchSize === num ? "bg-foreground text-background border-foreground" : "bg-card text-muted-foreground border-border hover:border-border/80",
                      isLocked && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {num}
                    {isLocked && <Lock className="w-3 h-3 absolute top-1 right-1 opacity-50" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Image Quality</label>
          <Select value={quality} onValueChange={(v: any) => setQuality(v)}>
            <SelectTrigger className="w-full bg-card border-border rounded-xl h-12"><SelectValue placeholder="Select Quality" /></SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="512px">512px (Fast)</SelectItem>
              <SelectItem value="1K">1K (Standard)</SelectItem>
              <SelectItem value="2K" disabled={!hasPlan(user?.unsafeMetadata?.plan as string, 'pro')}>
                <div className="flex items-center gap-2">2K (High) {!hasPlan(user?.unsafeMetadata?.plan as string, 'pro') && <Lock className="w-3 h-3" />}</div>
              </SelectItem>
              <SelectItem value="4K" disabled={!hasPlan(user?.unsafeMetadata?.plan as string, 'ultimate')}>
                <div className="flex items-center gap-2">4K (Ultra) {!hasPlan(user?.unsafeMetadata?.plan as string, 'ultimate') && <Lock className="w-3 h-3" />}</div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Technique</label>
          <Select value={technique} onValueChange={(v: any) => setTechnique(v)}>
            <SelectTrigger className="w-full bg-card border-border rounded-xl h-12"><SelectValue placeholder="Select Technique" /></SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="Auto">Auto (Smart Detect)</SelectItem>
              <SelectItem value="Fast">Fast (Simple Objects)</SelectItem>
              <SelectItem value="Pro">Pro (Glass, Hair, Glow)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Camera Angle</label>
          <Select value={angle} onValueChange={(v: any) => setAngle(v)}>
            <SelectTrigger className="w-full bg-card border-border rounded-xl h-12"><SelectValue placeholder="Select Angle" /></SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="Auto">Auto (Smart Detect)</SelectItem>
              <SelectItem value="Front">Front View</SelectItem>
              <SelectItem value="Side">Side / Profile View</SelectItem>
              <SelectItem value="Top">Top-Down View</SelectItem>
              <SelectItem value="Bottom">Bottom-Up View</SelectItem>
              <SelectItem value="Isometric">Isometric View</SelectItem>
              <SelectItem value="Dynamic">Dynamic / Dramatic Angle</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Aspect Ratio</label>
          <div className="grid grid-cols-2 gap-2">
            {(['1:1', '16:9', '9:16', '4:3'] as const).map((ratio) => (
              <button key={ratio} onClick={() => setAspectRatio(ratio)}
                className={cn("py-3 rounded-xl text-xs font-bold border transition-all duration-200",
                  aspectRatio === ratio ? "bg-foreground text-background border-foreground" : "bg-card text-muted-foreground border-border hover:border-border/80"
                )}>{ratio}</button>
            ))}
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {isMobile && renderReferenceImages()}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              Web Search Inspiration
              <div className="group relative">
                <Info className="w-3.5 h-3.5 text-muted-foreground" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-popover text-popover-foreground text-[10px] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  Allows the AI to search the web for real-world references (e.g., logos, people, places) to improve accuracy.
                </div>
              </div>
            </label>
            <button type="button"
              onClick={() => {
                if (!hasPlan(user?.unsafeMetadata?.plan as string, 'pro')) {
                  toast.error('Pro plan required', { description: 'Web Search Inspiration requires the Pro plan.' });
                  return;
                }
                setUseWebSearch(!useWebSearch);
              }}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed",
                useWebSearch ? "bg-emerald-500" : "bg-muted",
                !hasPlan(user?.unsafeMetadata?.plan as string, 'pro') && "opacity-50 cursor-not-allowed"
              )}
            >
              <span className={cn("pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out", useWebSearch ? "translate-x-4" : "translate-x-0")} />
              {!hasPlan(user?.unsafeMetadata?.plan as string, 'pro') && <Lock className="w-3 h-3 absolute -right-5 text-muted-foreground" />}
            </button>
          </div>
        </div>

        {isMobile && (
          <div className="mt-4 space-y-3">
            {status && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-pulse font-medium">
                <Loader2 className="w-4 h-4 animate-spin" />
                {status}
              </div>
            )}
            <Button onClick={handleGenerate} disabled={isGenerating || (!prompt && referenceImages.length === 0)}
              className="w-full bg-foreground text-background hover:bg-foreground/90 font-bold rounded-xl h-12 shadow-xl transition-transform active:scale-95 text-base">
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {isGenerating ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-0 bg-background lg:overflow-hidden overflow-y-auto w-full max-w-6xl mx-auto">
      <div className="flex-1 flex flex-col p-4 lg:p-6 space-y-6 lg:overflow-y-auto shrink-0 lg:shrink">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Image Generator</h1>
            <p className="text-sm text-muted-foreground">Create stunning images with transparent backgrounds.</p>
          </div>
          <Link to="/api-keys" className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-2 transition-colors bg-card hover:bg-card/80 px-3 py-1.5 rounded-lg border border-border">
            <Key className="w-3.5 h-3.5" />
            Manage API Keys
          </Link>
        </div>

        <div className="flex flex-col gap-3 shrink-0">
          <div className="relative group">
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              className="w-full bg-card/50 border border-border text-foreground text-lg p-4 lg:p-6 rounded-2xl focus:outline-none focus:ring-2 focus:ring-foreground/10 min-h-[160px] resize-none transition-all duration-300 group-hover:border-border/80"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-2 text-xs text-muted-foreground px-2">
              <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5 sm:mt-0" />
              <p><strong className="text-foreground">Pro Tip:</strong> For best results, do not mention backgrounds or transparency in your prompt.</p>
            </div>
            <div className="hidden lg:flex items-center gap-3">
              {status && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {status}
                </div>
              )}
              <Button onClick={handleGenerate} disabled={isGenerating || (!prompt && referenceImages.length === 0)}
                className="bg-foreground text-background hover:bg-foreground/90 font-bold rounded-xl px-8 h-12 shadow-xl transition-transform active:scale-95 text-base">
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {isGenerating ? 'Generating...' : 'Generate'}
              </Button>
            </div>
          </div>
          {renderGenerationSettings("block lg:hidden mt-4", true)}
        </div>

        <div className="flex-1 flex flex-col items-center justify-start lg:justify-center min-h-[300px] lg:min-h-[400px] py-4 lg:py-0 overflow-hidden">
          {results.length === 0 && !isGenerating && (
            <div className="text-center space-y-4 max-w-xs">
              <div className="w-16 h-16 bg-card rounded-2xl flex items-center justify-center mx-auto border border-border">
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">Your generated image will appear here. Start by typing a prompt above.</p>
            </div>
          )}

          {isGenerating && results.length === 0 && (
            <div className="text-center space-y-6">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 border-4 border-border rounded-full" />
                <div className="absolute inset-0 border-4 border-foreground rounded-full border-t-transparent animate-spin" />
              </div>
              <div className="space-y-2">
                <p className="text-foreground font-medium">{status || 'Crafting your masterpiece...'}</p>
                <p className="text-muted-foreground text-xs">This usually takes about 15-30 seconds.</p>
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div className={cn("w-full max-w-4xl grid gap-4 p-4", results.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
              {results.map((res, idx) => (
                <Card key={idx} className="p-4 bg-card border-border rounded-3xl overflow-hidden shadow-2xl ring-1 ring-foreground/5 flex flex-col h-full animate-in fade-in zoom-in duration-500">
                  <div className="w-full aspect-square relative rounded-2xl border border-border overflow-hidden bg-background shrink-0"
                    style={{ backgroundImage: 'conic-gradient(var(--checker-1) 90deg, var(--checker-2) 90deg 180deg, var(--checker-1) 180deg 270deg, var(--checker-2) 270deg)', backgroundSize: '24px 24px' }}>
                    <img src={res.final} alt={`Result ${idx}`} className="absolute inset-0 w-full h-full object-contain p-4 z-10" />
                  </div>
                  <div className="mt-4 flex flex-col gap-2 shrink-0">
                    <div className="flex items-center justify-between gap-2">
                      <Button onClick={() => { const a = document.createElement('a'); a.href = res.final; a.download = `transparent-image-${idx}.png`; a.click(); }}
                        className="bg-foreground text-background hover:bg-foreground/90 rounded-xl h-10 px-6 text-xs font-bold flex-1">
                        <Download className="w-4 h-4 mr-2" />Download
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <aside className="w-full lg:w-80 lg:border-l border-t lg:border-t-0 border-border bg-background p-4 lg:p-6 space-y-8 lg:overflow-y-auto shrink-0 relative z-10">
        {renderGenerationSettings("hidden lg:block", false)}
        {renderReferenceImages("hidden lg:block")}
        <CreditUsage />
      </aside>

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
            <p className="text-muted-foreground">
              Google requires a billing-enabled API key to generate images. Your card won't be charged unless you exceed the free quota, but it must be on file. Alternatively, you can use a Fal.ai or OpenAI key!
            </p>
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
