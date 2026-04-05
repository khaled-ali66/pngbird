import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search, Download, Wand2, X, ChevronRight,
  ImageIcon, Sparkles, ArrowRight, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface GalleryImage {
  id: string;
  slug: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  imageUrl: string;
  thumbUrl: string;
  width: number;
  height: number;
  downloads: number;
  source: 'supabase' | 'api';
}

// ─────────────────────────────────────────────
// CATEGORIES — 3 queries لكل كاتيجوري
// ─────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all',        label: 'All',        icon: '✦', queries: [] },
  { id: 'flowers',    label: 'Flowers',    icon: '🌸', queries: ['flowers transparent', 'flower bouquet', 'floral png'] },
  { id: 'animals',    label: 'Animals',    icon: '🐾', queries: ['animals transparent', 'wildlife png', 'pets cutout'] },
  { id: 'food',       label: 'Food',       icon: '🍎', queries: ['food transparent', 'fruit png', 'vegetables cutout'] },
  { id: 'nature',     label: 'Nature',     icon: '🌿', queries: ['nature transparent', 'leaves png', 'plants cutout'] },
  { id: 'technology', label: 'Technology', icon: '💻', queries: ['technology transparent', 'devices png', 'gadgets cutout'] },
  { id: 'objects',    label: 'Objects',    icon: '💎', queries: ['objects transparent', 'items png', 'things cutout'] },
  { id: 'sky',        label: 'Sky',        icon: '☁️', queries: ['sky clouds transparent', 'clouds png', 'weather cutout'] },
  { id: 'abstract',   label: 'Abstract',   icon: '◈',  queries: ['abstract transparent', 'shapes png', 'geometric cutout'] },
  { id: 'christmas',  label: 'Christmas',  icon: '🎄', queries: ['christmas transparent', 'holiday png', 'xmas cutout'] },
];

const CAT_LIST  = CATEGORIES.filter(c => c.id !== 'all');
const PAGE_SIZE = 40;
const PER_PAGE  = 200;
const API_KEY   = import.meta.env.VITE_PIXABAY_KEY || '';

// ─────────────────────────────────────────────
// CACHE — بيمنع إعادة الـ fetch
// ─────────────────────────────────────────────
const pageCache: Record<string, GalleryImage[]> = {};

// ─────────────────────────────────────────────
// SUPABASE
// ─────────────────────────────────────────────
async function fetchSupabaseImages(category?: string, search?: string): Promise<GalleryImage[]> {
  try {
    let q = supabase
      .from('gallery_images')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (category && category !== 'all') q = q.eq('category', category);
    if (search) q = q.or(`title.ilike.%${search}%,tags.cs.{${search}}`);

    const { data, error } = await q.limit(200);
    if (error) return [];

    return (data || []).map(row => ({
      id:          `sb-${row.id}`,
      slug:        `${row.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${row.id.slice(0, 8)}`,
      title:       row.title,
      description: row.description || `Free transparent ${row.title} PNG.`,
      tags:        row.tags || [],
      category:    row.category,
      imageUrl:    row.image_url,
      thumbUrl:    row.thumb_url || row.image_url,
      width:       row.width  || 800,
      height:      row.height || 800,
      downloads:   0,
      source:      'supabase' as const,
    }));
  } catch { return []; }
}

// ─────────────────────────────────────────────
// API FETCH
// ─────────────────────────────────────────────
function hitToImage(hit: any, category: string): GalleryImage {
  const tags     = hit.tags ? hit.tags.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean) : [];
  const firstTag = tags[0] || category || 'png';
  const title    = firstTag.charAt(0).toUpperCase() + firstTag.slice(1) + ' PNG';
  return {
    id:          `px-${hit.id}`,
    slug:        `${firstTag.replace(/\s+/g, '-')}-png-${hit.id}`,
    title,
    description: `Free transparent ${title} for personal and commercial use.`,
    tags:        tags.slice(0, 6),
    category,
    imageUrl:    hit.largeImageURL || hit.webformatURL,
    thumbUrl:    hit.webformatURL,
    width:       hit.imageWidth  || 800,
    height:      hit.imageHeight || 800,
    downloads:   hit.downloads   || 0,
    source:      'api' as const,
  };
}

async function fetchApiPage(query: string, category: string, page: number): Promise<GalleryImage[]> {
  const key = `${query}|${category}|${page}`;
  if (pageCache[key]) return pageCache[key];

  const params = new URLSearchParams({
    key:        API_KEY,
    q:          query || 'transparent png',
    image_type: 'photo',
    colors:     'transparent',
    safesearch: 'true',
    per_page:   String(PER_PAGE),
    page:       String(page),
    order:      'popular',
  });

  try {
    const res  = await fetch(`https://pixabay.com/api/?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    const imgs = (data.hits || []).map((h: any) => hitToImage(h, category));
    pageCache[key] = imgs;
    return imgs;
  } catch { return []; }
}

// ─────────────────────────────────────────────
// PROGRESSIVE MIXED PAGE
//
// المرحلة 1 (سريعة): 3 كاتيجوريز فقط = 3 requests → اعرض فوراً
// المرحلة 2 (خلفية): باقي الـ 24 request → أضف للـ grid تدريجياً
// ─────────────────────────────────────────────
const CARDS_PER_QUERY   = 2;
const GALLERY_PER_API   = Math.floor(PER_PAGE / (CARDS_PER_QUERY * 3));

// Priority cats — بتظهر أول (أشهر كاتيجوريز)
const PRIORITY_CATS = ['flowers', 'animals', 'food', 'nature', 'objects'];

async function fetchMixedPageProgressive(
  galleryPage: number,
  onPartialUpdate: (imgs: GalleryImage[]) => void
): Promise<GalleryImage[]> {
  const apiPage = Math.ceil(galleryPage / GALLERY_PER_API);
  const offset  = ((galleryPage - 1) % GALLERY_PER_API) * (CARDS_PER_QUERY * 3);

  const seen    = new Set<string>();
  const allImgs: GalleryImage[] = [];

  const addImages = (newImgs: GalleryImage[]) => {
    newImgs.forEach(img => {
      if (!seen.has(img.id)) { seen.add(img.id); allImgs.push(img); }
    });
  };

  // المرحلة 1: Priority cats — 5 كاتيجوريز × 1 query = 5 requests
  const priorityCats = CAT_LIST.filter(c => PRIORITY_CATS.includes(c.id));
  const phase1 = await Promise.all(
    priorityCats.map(cat => fetchApiPage(cat.queries[0], cat.id, apiPage))
  );

  phase1.forEach((catImgs, ci) => {
    for (let i = 0; i < CARDS_PER_QUERY; i++) {
      const img = catImgs[offset + i];
      if (img && !seen.has(img.id)) { seen.add(img.id); allImgs.push(img); }
    }
  });

  // اعرض الـ 10 صور الأولى فوراً
  if (allImgs.length > 0) onPartialUpdate([...allImgs]);

  // المرحلة 2: باقي الـ cats + queries الإضافية — في الخلفية
  const remainingFetches: Promise<void>[] = [];

  CAT_LIST.forEach(cat => {
    const startQueryIdx = PRIORITY_CATS.includes(cat.id) ? 1 : 0; // الأولى اتحملت بالفعل
    cat.queries.slice(startQueryIdx).forEach(query => {
      const p = fetchApiPage(query, cat.id, apiPage).then(catImgs => {
        for (let i = 0; i < CARDS_PER_QUERY; i++) {
          const img = catImgs[offset + i];
          if (img && !seen.has(img.id)) { seen.add(img.id); allImgs.push(img); }
        }
        // أبلّغ بكل صور جديدة بتتضاف
        onPartialUpdate([...allImgs]);
      });
      remainingFetches.push(p);
    });
  });

  // استنى كل الـ requests تخلص (بس الـ UI بيتحدث تدريجياً)
  await Promise.allSettled(remainingFetches);

  return allImgs.slice(0, PAGE_SIZE);
}

// ─────────────────────────────────────────────
// CATEGORY PAGE
// ─────────────────────────────────────────────
async function fetchCategoryPage(catId: string, galleryPage: number): Promise<GalleryImage[]> {
  const cat = CATEGORIES.find(c => c.id === catId);
  if (!cat?.queries.length) return [];

  const PAGES_PER_QUERY = Math.ceil(500 / PAGE_SIZE);
  const queryIdx  = Math.min(Math.floor((galleryPage - 1) / PAGES_PER_QUERY), cat.queries.length - 1);
  const localPage = ((galleryPage - 1) % PAGES_PER_QUERY) + 1;
  const apiPage   = Math.ceil((localPage * PAGE_SIZE) / PER_PAGE);
  const offset    = ((localPage - 1) * PAGE_SIZE) % PER_PAGE;

  const imgs = await fetchApiPage(cat.queries[queryIdx], catId, apiPage);
  return imgs.slice(offset, offset + PAGE_SIZE);
}

function mergeImages(supabaseImgs: GalleryImage[], apiImgs: GalleryImage[]): GalleryImage[] {
  const seen = new Set(supabaseImgs.map(i => i.id));
  return [...supabaseImgs, ...apiImgs.filter(i => !seen.has(i.id))];
}

// ─────────────────────────────────────────────
// UI
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
      backgroundSize: '12px 12px',
      backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0',
    }} />
  );
}

const ImageCard = React.memo(function ImageCard({ image, index }: { image: GalleryImage; index: number }) {
  const [loaded,  setLoaded]  = useState(false);
  const [hovered, setHovered] = useState(false);
  const navigate  = useNavigate();
  const isAboveFold = index < 10;

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const a = document.createElement('a');
    a.href = image.imageUrl; a.download = `${image.slug}.png`; a.target = '_blank'; a.click();
    toast.success('Download started!');
  };

  return (
    <article
      className="group relative rounded-2xl overflow-hidden border border-border bg-card cursor-pointer transition-all duration-300 hover:border-yellow-500/50 hover:shadow-xl hover:shadow-yellow-500/5 hover:-translate-y-1"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/gallery/${image.slug}`)}
      role="article"
      aria-label={image.title}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <CheckerBg />
        {!loaded && <div className="absolute inset-0 z-10 bg-muted animate-pulse" />}
        <img
          src={image.thumbUrl}
          alt={`${image.title} - free transparent PNG`}
          loading={isAboveFold ? 'eager' : 'lazy'}
          decoding={isAboveFold ? 'sync' : 'async'}
          fetchPriority={isAboveFold ? 'high' : 'low'}
          onLoad={() => setLoaded(true)}
          className={cn(
            'relative z-10 w-full h-full object-cover transition-all duration-300',
            loaded ? 'opacity-100' : 'opacity-0',
            hovered ? 'scale-110' : 'scale-100',
          )}
        />
        <div className={cn(
          'absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/60 backdrop-blur-sm transition-all duration-200',
          hovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}>
          <button onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-400 text-black text-sm font-bold hover:bg-yellow-300 transition-colors shadow-lg">
            <Download className="w-4 h-4" /> Download PNG
          </button>
          <Link to={`/gallery/${image.slug}`} onClick={e => e.stopPropagation()}
            className="text-white/80 text-xs hover:text-white transition-colors flex items-center gap-1">
            View Details <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        {image.source === 'supabase' && (
          <div className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-full bg-yellow-400/90 text-black text-[9px] font-bold">
            ✦ Featured
          </div>
        )}
        {image.downloads > 0 && (
          <div className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-full bg-black/60 text-white/70 text-[10px] font-medium">
            ↓ {image.downloads >= 1000 ? `${(image.downloads / 1000).toFixed(0)}k` : image.downloads}
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-semibold text-foreground truncate leading-tight">{image.title}</h3>
        <div className="flex items-center gap-1 mt-1">
          {image.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{tag}</span>
          ))}
          <span className="ml-auto text-[10px] text-muted-foreground">Free</span>
        </div>
      </div>
    </article>
  );
});

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card">
      <div className="aspect-square bg-muted animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
        <div className="h-2 bg-muted rounded w-1/2 animate-pulse" />
      </div>
    </div>
  );
}

function NoKeyWarning() {
  return (
    <div className="col-span-full text-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
        <span className="text-3xl">🔑</span>
      </div>
      <h2 className="text-lg font-semibold mb-2">API Key Required</h2>
      <p className="text-muted-foreground text-sm max-w-md mx-auto">
        Add your API key to <code className="bg-muted px-1.5 py-0.5 rounded text-xs">.env</code> to load images.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN GALLERY
// ─────────────────────────────────────────────
export default function Gallery() {
  const [searchParams, setSearchParams] = useSearchParams();

  const searchQuery    = searchParams.get('q')   || '';
  const activeCategory = searchParams.get('cat') || 'all';
  const currentPage    = parseInt(searchParams.get('page') || '1');

  const [inputValue, setInputValue] = useState(searchQuery);
  const [images,     setImages]     = useState<GalleryImage[]>([]);
  const [totalHits,  setTotalHits]  = useState(0);
  const [loading,    setLoading]    = useState(true);

  const abortRef    = useRef<AbortController | null>(null);
  const pageKeyRef  = useRef(''); // لمنع state updates قديمة تلوّث الـ UI

  useEffect(() => {
    if (!API_KEY) { setLoading(false); return; }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const pageKey = `${searchQuery}|${activeCategory}|${currentPage}`;
    pageKeyRef.current = pageKey;

    setLoading(true);
    setImages([]);

    const sbPromise = fetchSupabaseImages(
      activeCategory !== 'all' ? activeCategory : undefined,
      searchQuery || undefined
    );

    if (searchQuery) {
      Promise.all([sbPromise, fetchApiPage(searchQuery, 'search', currentPage)]).then(([sb, api]) => {
        if (pageKeyRef.current !== pageKey) return;
        setImages(mergeImages(sb, api).slice(0, PAGE_SIZE));
        setTotalHits(500);
        setLoading(false);
      });
      return;
    }

    if (activeCategory === 'all') {
      sbPromise.then(sb => {
        // أضف Supabase أول لو في صفحة 1
        if (currentPage === 1 && sb.length > 0 && pageKeyRef.current === pageKey) {
          setImages(sb.slice(0, PAGE_SIZE));
          setLoading(false);
        }

        fetchMixedPageProgressive(currentPage, (partialImgs) => {
          if (pageKeyRef.current !== pageKey) return;
          const merged = currentPage === 1
            ? mergeImages(sb, partialImgs).slice(0, PAGE_SIZE)
            : partialImgs.slice(0, PAGE_SIZE);
          setImages(merged);
          setLoading(false); // اظهر أول ما يجي أي صورة
        });
      });

      setTotalHits(13500);

      // Prefetch الصفحة الجاية
      setTimeout(() => fetchMixedPageProgressive(currentPage + 1, () => {}), 1000);

    } else {
      Promise.all([sbPromise, fetchCategoryPage(activeCategory, currentPage)]).then(([sb, api]) => {
        if (pageKeyRef.current !== pageKey) return;
        const final = currentPage === 1 ? mergeImages(sb, api).slice(0, PAGE_SIZE) : api;
        setImages(final);
        setTotalHits(1500 + sb.length);
        setLoading(false);
        setTimeout(() => fetchCategoryPage(activeCategory, currentPage + 1), 500);
      });
    }
  }, [searchQuery, activeCategory, currentPage]);

  // SEO
  useEffect(() => {
    const catLabel = CATEGORIES.find(c => c.id === activeCategory)?.label || 'All';
    document.title = searchQuery
      ? `"${searchQuery}" PNG - Free Download | PngBird`
      : activeCategory !== 'all'
        ? `Free ${catLabel} PNG Images | PngBird`
        : 'Free PNG Images Gallery — 10,000+ Transparent PNGs | PngBird';
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) { meta = document.createElement('meta') as HTMLMetaElement; meta.setAttribute('name', 'description'); document.head.appendChild(meta); }
    meta.content = `Browse 10,000+ free transparent PNG images. Free for commercial use, no attribution needed.`;
  }, [searchQuery, activeCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (inputValue.trim()) p.set('q', inputValue.trim());
    if (activeCategory !== 'all') p.set('cat', activeCategory);
    p.set('page', '1');
    setSearchParams(p);
  };

  const setCategory = (cat: string) => {
    const p = new URLSearchParams();
    if (cat !== 'all') p.set('cat', cat);
    p.set('page', '1');
    setSearchParams(p);
    setInputValue('');
  };

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(p));
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearSearch = () => {
    setInputValue('');
    const p = new URLSearchParams();
    if (activeCategory !== 'all') p.set('cat', activeCategory);
    setSearchParams(p);
  };

  const totalPages   = Math.ceil(totalHits / PAGE_SIZE);
  const activeCatObj = CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/50 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto px-4 py-10 sm:py-14">

          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            {activeCategory !== 'all' ? (
              <>
                <Link to="/gallery" className="hover:text-foreground">Gallery</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground font-medium">{activeCatObj?.label} PNG</span>
              </>
            ) : (
              <span className="text-foreground font-medium">Gallery</span>
            )}
          </nav>

          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-3">
            {searchQuery
              ? <>Results for <span className="text-yellow-500">"{searchQuery}"</span></>
              : activeCategory !== 'all'
                ? <>Free <span className="text-yellow-500">{activeCatObj?.label}</span> PNG Images</>
                : <>Free Transparent <span className="text-yellow-500">PNG Images</span></>
            }
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            {loading && images.length === 0
              ? 'Loading images...'
              : `${totalHits.toLocaleString()}+ free PNG images. Free for personal & commercial use.`
            }
          </p>

          <form onSubmit={handleSearch} className="mt-6 flex gap-2 max-w-2xl" role="search">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="search" value={inputValue} onChange={e => setInputValue(e.target.value)}
                placeholder="Search PNG images... flower, cat, crown, coffee..."
                aria-label="Search PNG images"
                className="w-full pl-11 pr-10 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all"
              />
              {inputValue && (
                <button type="button" onClick={() => setInputValue('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button type="submit" className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl px-5 shrink-0">Search</Button>
            {searchQuery && <Button type="button" variant="outline" onClick={clearSearch} className="rounded-xl shrink-0">Clear</Button>}
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">

          <aside className="w-52 shrink-0 hidden lg:block" aria-label="Category filters">
            <div className="sticky top-24 space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 mb-3">Categories</p>
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setCategory(cat.id)} aria-pressed={activeCategory === cat.id}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left',
                    activeCategory === cat.id
                      ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent'
                  )}>
                  <span className="text-base w-5 text-center">{cat.icon}</span>
                  <span>{cat.label}</span>
                  {cat.id === 'all' && <span className="ml-auto text-[10px] text-yellow-500 font-bold">10K+</span>}
                </button>
              ))}
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 mb-3">Popular Tags</p>
                <div className="flex flex-wrap gap-1.5 px-3">
                  {['transparent', 'flower', 'cat', 'coffee', 'crown', 'butterfly', 'cloud', 'rose', 'diamond', 'laptop', 'heart', 'star'].map(tag => (
                    <button key={tag} onClick={() => { setInputValue(tag); setSearchParams({ q: tag, page: '1' }); }}
                      className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[11px] hover:bg-yellow-500/10 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors">
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="lg:hidden flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-4">
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setCategory(cat.id)}
                  className={cn(
                    'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                    activeCategory === cat.id ? 'bg-yellow-400 text-black' : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}>
                  <span>{cat.icon}</span> {cat.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-muted-foreground">
                {loading && images.length === 0
                  ? <span className="flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Loading...</span>
                  : <><span className="text-foreground font-semibold">{images.length > 0 ? totalHits.toLocaleString() : '0'}</span> images{searchQuery && <> for <span className="text-yellow-500">"{searchQuery}"</span></>}</>
                }
              </p>
              <span className="hidden sm:block text-xs text-muted-foreground">Free · Commercial use · No attribution</span>
            </div>

            {!API_KEY ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3"><NoKeyWarning /></div>
            ) : loading && images.length === 0 ? (
              // Skeleton فقط لو مفيش صور خالص — لو في صور بتتحمل بتظهر على طول
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-24 px-4">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold mb-2">No results for "{searchQuery}"</h2>
                <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">Can't find it? Generate with AI ✨</p>
                <div className="flex items-center gap-3 justify-center flex-wrap">
                  <Link to={`/generate?prompt=${encodeURIComponent(searchQuery + ' transparent png no background')}`}>
                    <Button className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl gap-2">
                      <Wand2 className="w-4 h-4" /> Generate "{searchQuery}" with AI
                    </Button>
                  </Link>
                  <Button variant="outline" onClick={clearSearch} className="rounded-xl">Clear Search</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                  {images.map((img, i) => <ImageCard key={img.id} image={img} index={i} />)}
                  {/* Skeleton للصور اللي لسه بتتحمل */}
                  {loading && Array.from({ length: Math.max(0, PAGE_SIZE - images.length) }).map((_, i) => (
                    <SkeletonCard key={`sk-${i}`} />
                  ))}
                </div>

                {!loading && images.length >= 10 && (
                  <div className="my-8 rounded-2xl border border-yellow-500/20 bg-gradient-to-r from-yellow-500/5 to-transparent p-5 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Can't find what you need?</p>
                        <p className="text-xs text-muted-foreground">Generate any PNG with AI — 10 free trials</p>
                      </div>
                    </div>
                    <Link to="/generate">
                      <Button className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl gap-2 shrink-0">
                        <Wand2 className="w-4 h-4" /> Generate PNG <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                )}

                {!loading && totalPages > 1 && (
                  <nav aria-label="Gallery pagination" className="flex items-center justify-center gap-2 mt-10 flex-wrap">
                    <button onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1}
                      className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                      ← Prev
                    </button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let page: number;
                      if (totalPages <= 7) page = i + 1;
                      else if (currentPage <= 4) page = i + 1;
                      else if (currentPage >= totalPages - 3) page = totalPages - 6 + i;
                      else page = currentPage - 3 + i;
                      return (
                        <button key={page} onClick={() => setPage(page)}
                          aria-current={currentPage === page ? 'page' : undefined}
                          className={cn('w-9 h-9 rounded-xl text-sm font-medium transition-all',
                            currentPage === page ? 'bg-yellow-400 text-black font-bold' : 'border border-border text-muted-foreground hover:text-foreground'
                          )}>
                          {page}
                        </button>
                      );
                    })}
                    <button onClick={() => setPage(currentPage + 1)} disabled={currentPage >= totalPages}
                      className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                      Next →
                    </button>
                  </nav>
                )}

                <section className="mt-16 pt-8 border-t border-border/50">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h2 className="text-base font-bold mb-2">
                        {activeCategory !== 'all' ? `Free ${activeCatObj?.label} PNG Images` : 'About PngBird Free PNG Gallery'}
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        All PNG images are free — personal and commercial use allowed, no attribution required.
                        Transparent backgrounds ready for Photoshop, Figma, and Canva.
                      </p>
                    </div>
                    <div>
                      <h2 className="text-base font-bold mb-2">Need a custom PNG?</h2>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        Generate any PNG with AI. 10 free generations to start.
                      </p>
                      <Link to="/generate" className="inline-flex items-center gap-1 text-sm text-yellow-600 dark:text-yellow-400 font-medium hover:underline">
                        Try AI Generator <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-border/50">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Browse by Category</p>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                        <Link key={cat.id} to={`/gallery?cat=${cat.id}`}
                          className="px-3 py-1.5 rounded-xl bg-muted text-muted-foreground text-xs hover:bg-yellow-500/10 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors">
                          {cat.icon} {cat.label} PNGs
                        </Link>
                      ))}
                    </div>
                  </div>
                </section>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
