import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Upload, Trash2, Search, X, Loader2,
  ImageIcon, Tag, LayoutGrid, Plus,
  CheckCircle2, AlertCircle, RefreshCw,
  Eye, EyeOff
} from 'lucide-react';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface GalleryImage {
  id: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  image_url: string;
  thumb_url: string | null;
  width: number;
  height: number;
  is_active: boolean;
  created_at: string;
}

const CATEGORIES = [
  'flowers', 'animals', 'food', 'nature',
  'technology', 'objects', 'sky', 'abstract', 'christmas', 'other'
];

// ─────────────────────────────────────────────
// CHECKERBOARD BG
// ─────────────────────────────────────────────
function CheckerBg() {
  return (
    <div className="absolute inset-0" style={{
      backgroundImage: `
        linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%),
        linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%),
        linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)
      `,
      backgroundSize: '10px 10px',
      backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0',
    }} />
  );
}

// ─────────────────────────────────────────────
// UPLOAD MODAL
// ─────────────────────────────────────────────
function UploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [file,        setFile]        = useState<File | null>(null);
  const [preview,     setPreview]     = useState<string | null>(null);
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [category,    setCategory]    = useState('other');
  const [tagsInput,   setTagsInput]   = useState('');
  const [uploading,   setUploading]   = useState(false);
  const [imgSize,     setImgSize]     = useState({ w: 0, h: 0 });
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
    // اقرأ الـ dimensions
    const img = new Image();
    img.onload = () => setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
    // auto-fill title من اسم الملف
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file || !title.trim() || !category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setUploading(true);
    try {
      // 1. رفع الصورة على Supabase Storage
      const ext      = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const filePath = `${category}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, file, { contentType: file.type, upsert: false });

      if (uploadError) throw uploadError;

      // 2. جيب الـ public URL
      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);

      // 3. حفظ البيانات في الـ database
      const tags = tagsInput
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(Boolean);

      const { error: dbError } = await supabase
        .from('gallery_images')
        .insert({
          title:       title.trim(),
          description: description.trim(),
          tags,
          category,
          image_url:   publicUrl,
          thumb_url:   publicUrl,
          width:       imgSize.w || 800,
          height:      imgSize.h || 800,
          is_active:   true,
        });

      if (dbError) throw dbError;

      toast.success('Image uploaded successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-background border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-bold">Upload New Image</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className={cn(
              'relative rounded-xl border-2 border-dashed cursor-pointer transition-all',
              'flex items-center justify-center overflow-hidden',
              preview ? 'border-yellow-500/50 h-48' : 'border-border hover:border-yellow-500/50 h-40'
            )}
          >
            {preview ? (
              <>
                <CheckerBg />
                <img src={preview} alt="preview" className="relative z-10 max-h-full max-w-full object-contain" />
                <div className="absolute top-2 right-2 z-20 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  Ready
                </div>
              </>
            ) : (
              <div className="text-center px-4">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Drop image here or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP — max 10MB</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

          {/* Title */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Red Rose PNG"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Tags <span className="text-muted-foreground font-normal">(comma separated)</span>
            </label>
            <input
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="rose, flower, red, nature"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
            />
            {tagsInput && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tagsInput.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Free transparent PNG image..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 resize-none"
            />
          </div>

          {/* Image info */}
          {imgSize.w > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{imgSize.w} × {imgSize.h}px · {(file!.size / 1024).toFixed(0)} KB</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl" disabled={uploading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || !file || !title.trim()}
              className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl gap-2"
            >
              {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> Upload</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// IMAGE CARD (admin)
// ─────────────────────────────────────────────
function AdminImageCard({
  image,
  onDelete,
  onToggle,
}: {
  image: GalleryImage;
  onDelete: (id: string, imageUrl: string) => void;
  onToggle: (id: string, current: boolean) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${image.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    await onDelete(image.id, image.image_url);
    setDeleting(false);
  };

  return (
    <div className={cn(
      'rounded-2xl border bg-card overflow-hidden transition-all',
      image.is_active ? 'border-border' : 'border-border/50 opacity-60'
    )}>
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <CheckerBg />
        <img
          src={image.thumb_url || image.image_url}
          alt={image.title}
          loading="lazy"
          className="relative z-10 w-full h-full object-cover"
        />
        {/* Status badge */}
        <div className={cn(
          'absolute top-2 left-2 z-20 px-2 py-0.5 rounded-full text-[10px] font-bold',
          image.is_active
            ? 'bg-green-500/90 text-white'
            : 'bg-muted text-muted-foreground'
        )}>
          {image.is_active ? 'Active' : 'Hidden'}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-semibold truncate mb-1">{image.title}</p>
        <p className="text-[10px] text-muted-foreground capitalize mb-2">{image.category}</p>

        {/* Tags */}
        {image.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {image.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{tag}</span>
            ))}
            {image.tags.length > 3 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">+{image.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onToggle(image.id, image.is_active)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all',
              image.is_active
                ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                : 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
            )}
          >
            {image.is_active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {image.is_active ? 'Hide' : 'Show'}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all disabled:opacity-50"
          >
            {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN ADMIN DASHBOARD
// ─────────────────────────────────────────────
export default function AdminDashboard() {
  const [images,       setImages]       = useState<GalleryImage[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showUpload,   setShowUpload]   = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [filterCat,    setFilterCat]    = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'hidden'>('all');
  const [stats,        setStats]        = useState({ total: 0, active: 0, hidden: 0 });

  // ── Load images
  const loadImages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gallery_images')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages(data || []);
      setStats({
        total:  data?.length || 0,
        active: data?.filter(i => i.is_active).length || 0,
        hidden: data?.filter(i => !i.is_active).length || 0,
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadImages(); }, []);

  // ── Delete
  const handleDelete = async (id: string, imageUrl: string) => {
    try {
      // حذف من الـ storage
      const urlParts  = imageUrl.split('/gallery/');
      const filePath  = urlParts[1];
      if (filePath) {
        await supabase.storage.from('gallery').remove([filePath]);
      }

      // حذف من الـ database
      const { error } = await supabase.from('gallery_images').delete().eq('id', id);
      if (error) throw error;

      setImages(prev => prev.filter(i => i.id !== id));
      setStats(prev => ({
        total:  prev.total - 1,
        active: images.find(i => i.id === id)?.is_active ? prev.active - 1 : prev.active,
        hidden: !images.find(i => i.id === id)?.is_active ? prev.hidden - 1 : prev.hidden,
      }));
      toast.success('Image deleted');
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    }
  };

  // ── Toggle visibility
  const handleToggle = async (id: string, current: boolean) => {
    try {
      const { error } = await supabase
        .from('gallery_images')
        .update({ is_active: !current })
        .eq('id', id);
      if (error) throw error;

      setImages(prev => prev.map(i => i.id === id ? { ...i, is_active: !current } : i));
      setStats(prev => ({
        ...prev,
        active: current ? prev.active - 1 : prev.active + 1,
        hidden: current ? prev.hidden + 1 : prev.hidden - 1,
      }));
      toast.success(current ? 'Image hidden' : 'Image visible');
    } catch (err: any) {
      toast.error(err.message || 'Update failed');
    }
  };

  // ── Filter
  const filtered = images.filter(img => {
    const matchSearch = !searchQuery ||
      img.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.tags?.some(t => t.includes(searchQuery.toLowerCase()));
    const matchCat    = filterCat === 'all'    || img.category === filterCat;
    const matchStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && img.is_active) ||
      (filterStatus === 'hidden' && !img.is_active);
    return matchSearch && matchCat && matchStatus;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gallery Manager</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your PNG image collection</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={loadImages} disabled={loading} className="rounded-xl gap-2">
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
              Refresh
            </Button>
            <Button
              onClick={() => setShowUpload(true)}
              className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl gap-2"
            >
              <Plus className="w-4 h-4" /> Upload Image
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Images', value: stats.total,  icon: LayoutGrid,    color: 'text-foreground' },
            { label: 'Active',       value: stats.active, icon: CheckCircle2,  color: 'text-green-500'  },
            { label: 'Hidden',       value: stats.hidden, icon: AlertCircle,   color: 'text-muted-foreground' },
          ].map(stat => (
            <div key={stat.label} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <stat.icon className={cn('w-5 h-5', stat.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by title or tag..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
            />
          </div>

          {/* Category filter */}
          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>

          {/* Status filter */}
          <div className="flex rounded-xl border border-border overflow-hidden">
            {(['all', 'active', 'hidden'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium transition-all capitalize',
                  filterStatus === s
                    ? 'bg-yellow-400 text-black'
                    : 'text-muted-foreground hover:text-foreground bg-background'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          Showing <span className="text-foreground font-semibold">{filtered.length}</span> of {images.length} images
          {searchQuery && <> for <span className="text-yellow-500">"{searchQuery}"</span></>}
        </p>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-2 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">
              {images.length === 0 ? 'No images yet' : 'No results found'}
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              {images.length === 0
                ? 'Start by uploading your first PNG image.'
                : 'Try a different search or filter.'
              }
            </p>
            {images.length === 0 && (
              <Button
                onClick={() => setShowUpload(true)}
                className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl gap-2"
              >
                <Upload className="w-4 h-4" /> Upload First Image
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map(img => (
              <AdminImageCard
                key={img.id}
                image={img}
                onDelete={handleDelete}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={loadImages}
        />
      )}
    </div>
  );
}
