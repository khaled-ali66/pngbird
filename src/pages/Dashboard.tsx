import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, Download, Image as ImageIcon, Wand2, History as HistoryIcon, Clock, User as UserIcon, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@clerk/clerk-react';
import { storage, SavedImage } from '../lib/storage';

export default function Dashboard() {
  const { user } = useUser();
  const [items, setItems] = useState<SavedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [user?.unsafeMetadata?.plan]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      let limit = 20; // Default for basic/free
      const plan = user?.unsafeMetadata?.plan as string;
      if (plan === 'pro') limit = 100;
      if (plan === 'ultimate') limit = 0; // 0 means unlimited
      
      const images = await storage.getImages(user?.id || '', limit);
      setItems(images);
    } catch (e) {
      console.error("Failed to fetch history", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await storage.deleteImage(user?.id || '', id);
      fetchHistory(); // Refresh the list
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExportZip = async () => {
    setIsExporting(true);
    try {
      await storage.exportImagesZip(user?.id || '');
    } catch (e) {
      console.error("Failed to export ZIP", e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("Are you sure you want to delete all your history? This cannot be undone.")) return;
    setIsDeletingAll(true);
    try {
      await storage.deleteAllImages(user?.id || '');
      fetchHistory();
    } catch (e) {
      console.error("Failed to delete all images", e);
    } finally {
      setIsDeletingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-background flex items-center justify-center min-h-0">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background text-foreground font-sans overflow-y-auto min-h-0">
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 md:space-y-12">
        <header className="space-y-4 pt-4 md:pt-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <UserIcon className="w-6 h-6 text-indigo-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">User Dashboard</h1>
          </div>
          <p className="text-muted-foreground text-base md:text-lg">
            Welcome back, {user?.firstName || user?.primaryEmailAddress?.emailAddress || 'User'}. Here is your usage and recent history.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-card border-border flex flex-col gap-2">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span className="font-medium">Current Plan</span>
            </div>
            <span className="text-3xl font-bold capitalize">{user?.unsafeMetadata?.plan as string || 'Free'}</span>
            <p className="text-xs text-muted-foreground mt-1">
              Unlimited access
            </p>
          </Card>
          <Card className="p-6 bg-card border-border flex flex-col gap-2">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Wand2 className="w-5 h-5 text-indigo-400" />
              <span className="font-medium">Generations Used</span>
            </div>
            <span className="text-3xl font-bold">{user?.unsafeMetadata?.generate_count as number || 0}</span>
            <p className="text-xs text-muted-foreground mt-1">
              Unlimited
            </p>
          </Card>
          <Card className="p-6 bg-card border-border flex flex-col gap-2">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <ImageIcon className="w-5 h-5 text-emerald-400" />
              <span className="font-medium">BG Removals Used</span>
            </div>
            <span className="text-3xl font-bold">{user?.unsafeMetadata?.remove_bg_count as number || 0}</span>
            <p className="text-xs text-muted-foreground mt-1">
              Unlimited
            </p>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HistoryIcon className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-2xl font-semibold">Your History</h2>
            </div>
            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <Button 
                  onClick={handleDeleteAll} 
                  disabled={isDeletingAll}
                  variant="destructive"
                  className="rounded-xl h-10 px-4 text-xs font-bold"
                >
                  {isDeletingAll ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Delete All
                </Button>
              )}
              {user?.unsafeMetadata?.plan === 'ultimate' && items.length > 0 && (
                <Button 
                  onClick={handleExportZip} 
                  disabled={isExporting}
                  variant="outline"
                  className="border-foreground/20 hover:bg-foreground/5 rounded-xl h-10 px-4 text-xs font-bold"
                >
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                  Export ZIP
                </Button>
              )}
            </div>
          </div>
          
          {items.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-xl">
              <p>No history found. Start creating to see your items here!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-20">
              {items.map((item) => (
                <Card key={item.id} className="bg-card border-border overflow-hidden flex flex-col h-full">
                  <div className="relative aspect-square w-full bg-background border-b border-border overflow-hidden shrink-0"
                       style={{
                         backgroundImage: 'conic-gradient(var(--checker-1) 90deg, var(--checker-2) 90deg 180deg, var(--checker-1) 180deg 270deg, var(--checker-2) 270deg)',
                         backgroundSize: '24px 24px'
                       }}>
                    <img 
                      src={item.url} 
                      alt="Result" 
                      className="absolute inset-0 w-full h-full object-contain p-4 drop-shadow-2xl z-10"
                    />
                    <div className={cn(
                      "absolute top-3 left-3 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border shadow-lg z-20",
                      item.prompt !== 'Background Removed' 
                        ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30 backdrop-blur-md" 
                        : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 backdrop-blur-md"
                    )}>
                      {item.prompt !== 'Background Removed' ? <Wand2 className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
                      {item.prompt !== 'Background Removed' ? 'Generated' : 'Removed BG'}
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-grow gap-4">
                    {item.prompt !== 'Background Removed' && item.prompt && (
                      <p className="text-sm text-muted-foreground line-clamp-3 flex-grow" title={item.prompt}>
                        "{item.prompt}"
                      </p>
                    )}
                    {item.prompt === 'Background Removed' && (
                      <div className="flex items-center gap-2 flex-grow">
                        <span className="text-sm text-muted-foreground">Original Image Processed</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-auto">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground">
                          {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Just now'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="h-8 bg-foreground text-background hover:bg-foreground/90"
                          onClick={() => handleDownload(item.url, `pngbird-${item.id}.png`)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
