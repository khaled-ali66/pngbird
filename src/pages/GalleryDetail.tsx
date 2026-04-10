import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Download, ChevronRight, Tag, ArrowLeft, Wand2, Share2, Check, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const API_KEY    = import.meta.env.VITE_PIXABAY_KEY || '';
const SITE_URL   = import.meta.env.VITE_SITE_URL   || 'https://pngbird.com';
const SITE_NAME  = 'PngBird';

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
  downloadCount: number;
}

// ─────────────────────────────────────────────
// وصف ذكي بناءً على الـ tags الفعلية للصورة
// ─────────────────────────────────────────────
function buildDescription(tags: string[], width: number, height: number): string {
  if (!tags.length) return 'Free transparent PNG image available for personal and commercial use.';

  const subject = tags[0];
  const details = tags.slice(1, 4).join(', ');
  const res     = `${width}×${height}px`;
  const sentences: string[] = [];

  sentences.push(`High-resolution ${subject} image (${res}) with a transparent background, ready to use in any design project.`);
  if (details) sentences.push(`This image features ${details}, making it suitable for a wide range of creative uses.`);

  const usageMap: Record<string, string> = {
    flower:     'Perfect for floral designs, greeting cards, wedding invitations, and nature-themed projects.',
    flowers:    'Perfect for floral designs, greeting cards, wedding invitations, and nature-themed projects.',
    rose:       "Ideal for romantic designs, Valentine's Day projects, and elegant branding.",
    animal:     "Great for children's content, educational materials, wildlife apps, and nature designs.",
    animals:    "Great for children's content, educational materials, wildlife apps, and nature designs.",
    cat:        'Perfect for pet-themed designs, social media stickers, and playful branding.',
    dog:        'Great for pet care branding, veterinary designs, and social media content.',
    food:       'Ideal for restaurant menus, recipe blogs, food delivery apps, and culinary branding.',
    coffee:     'Perfect for café menus, coffee shop branding, and morning-themed social media posts.',
    nature:     'Suitable for eco-friendly branding, outdoor apps, and environmental campaigns.',
    tree:       'Great for environmental campaigns, outdoor apps, and nature-themed designs.',
    technology: 'Perfect for tech presentations, app mockups, and digital product showcases.',
    laptop:     'Ideal for tech presentations, remote work themes, and digital product mockups.',
    phone:      'Great for app mockups, mobile marketing materials, and tech presentations.',
    sky:        'Perfect for travel designs, weather apps, dreamy backgrounds, and inspirational visuals.',
    cloud:      'Ideal for sky scenes, weather apps, and clean minimal design backgrounds.',
    abstract:   'Great for modern branding, artistic compositions, and creative backgrounds.',
    christmas:  'Perfect for holiday cards, festive designs, Christmas campaigns, and seasonal social media.',
    heart:      "Ideal for love-themed designs, Valentine's Day, and health-related branding.",
    star:       'Great for award designs, rating systems, achievement badges, and celebratory visuals.',
    crown:      'Perfect for royalty themes, premium branding, winner graphics, and achievement badges.',
    diamond:    'Ideal for luxury branding, jewelry designs, and premium product showcases.',
    butterfly:  'Great for spring themes, beauty brands, transformation concepts, and decorative designs.',
    bird:       'Perfect for freedom-themed designs, nature apps, and elegant branding.',
    fish:       'Ideal for seafood restaurants, aquarium themes, and ocean-related designs.',
    fruit:      'Great for healthy eating campaigns, food blogs, and organic product branding.',
    apple:      'Perfect for health and nutrition designs, food menus, and fresh produce branding.',
    leaf:       'Ideal for eco-friendly branding, organic products, and nature-themed designs.',
    water:      'Great for hydration campaigns, ocean themes, and clean minimal designs.',
    fire:       'Perfect for energetic branding, warning signs, and bold creative designs.',
    sun:        'Ideal for summer designs, energy brands, positivity campaigns, and outdoor themes.',
    moon:       'Great for night themes, sleep apps, mystical designs, and dreamy aesthetics.',
  };

  const matchedUsage = tags.find(t => usageMap[t.toLowerCase()]);
  sentences.push(matchedUsage
    ? usageMap[matchedUsage.toLowerCase()]
    : 'Suitable for websites, presentations, social media, print materials, and any creative project requiring a transparent background.'
  );
  sentences.push('Free for personal and commercial use — no attribution required.');
  return sentences.join(' ');
}

// ─────────────────────────────────────────────
// SEO HELPER — يضبط كل الـ meta tags دفعة واحدة
// ─────────────────────────────────────────────
function updateSEO(image: GalleryImage) {
  const pageUrl     = `${SITE_URL}/gallery/${image.slug}`;
  const title       = `${image.title} - Free Transparent PNG | ${SITE_NAME}`;
  const description = image.description.slice(0, 160);
  const keywords    = [...image.tags, 'transparent png', 'free png', 'no background', 'png download'].join(', ');

  // ── Title
  document.title = title;

  const set = (selector: string, attr: string, value: string) => {
    let el = document.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null;
    if (!el) {
      el = document.createElement(selector.startsWith('link') ? 'link' : 'meta') as any;
      // parse attributes from selector e.g. meta[name="description"]
      const match = selector.match(/\[(.+?)="(.+?)"\]/);
      if (match) (el as any)[match[1]] = match[2];
      document.head.appendChild(el);
    }
    (el as any)[attr] = value;
  };

  // ── Standard meta
  set('meta[name="description"]',        'content', description);
  set('meta[name="keywords"]',           'content', keywords);
  set('meta[name="robots"]',             'content', 'index, follow');

  // ── Canonical
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
  canonical.href = pageUrl;

  // ── Open Graph
  set('meta[property="og:type"]',        'content', 'article');
  set('meta[property="og:site_name"]',   'content', SITE_NAME);
  set('meta[property="og:url"]',         'content', pageUrl);
  set('meta[property="og:title"]',       'content', title);
  set('meta[property="og:description"]', 'content', description);
  set('meta[property="og:image"]',       'content', image.imageUrl);
  set('meta[property="og:image:width"]', 'content', String(image.width));
  set('meta[property="og:image:height"]','content', String(image.height));
  set('meta[property="og:image:alt"]',   'content', image.title);

  // ── Twitter Card
  set('meta[name="twitter:card"]',        'content', 'summary_large_image');
  set('meta[name="twitter:title"]',       'content', title);
  set('meta[name="twitter:description"]', 'content', description);
  set('meta[name="twitter:image"]',       'content', image.imageUrl);
  set('meta[name="twitter:image:alt"]',   'content', image.title);

  // ── JSON-LD Schema
  let jsonLd = document.getElementById('gallery-jsonld');
  if (!jsonLd) {
    jsonLd = document.createElement('script');
    jsonLd.id = 'gallery-jsonld';
    (jsonLd as HTMLScriptElement).type = 'application/ld+json';
    document.head.appendChild(jsonLd);
  }
  jsonLd.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type':    'ImageObject',
    '@id':      pageUrl,
    name:        image.title,
    description: image.description,
    contentUrl:  image.imageUrl,
    thumbnailUrl:image.thumbUrl,
    url:         pageUrl,
    width:       { '@type': 'QuantitativeValue', value: image.width,  unitCode: 'E37' },
    height:      { '@type': 'QuantitativeValue', value: image.height, unitCode: 'E37' },
    keywords:    image.tags.join(', '),
    encodingFormat: 'image/png',
    license:     `${SITE_URL}/terms`,
    acquireLicensePage: pageUrl,
    creditText:  SITE_NAME,
    copyrightNotice: `Free to use — ${SITE_NAME}`,
    // Breadcrumb
    mainEntityOfPage: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home',    item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Gallery', item: `${SITE_URL}/gallery` },
        { '@type': 'ListItem', position: 3, name: image.category, item: `${SITE_URL}/gallery?cat=${image.category}` },
        { '@type': 'ListItem', position: 4, name: image.title, item: pageUrl },
      ],
    },
  });
}

// ─────────────────────────────────────────────
// FETCH HELPERS
// ─────────────────────────────────────────────
function hitToImage(hit: any): GalleryImage {
  const tags     = hit.tags ? hit.tags.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean) : [];
  const firstTag = tags[0] || 'png';
  const title    = firstTag.charAt(0).toUpperCase() + firstTag.slice(1) + ' PNG';
  const slug     = `${firstTag.replace(/\s+/g, '-')}-png-${hit.id}`;
  const w        = hit.imageWidth  || 800;
  const h        = hit.imageHeight || 800;
  return {
    id:            `px-${hit.id}`,
    slug,
    title,
    description:   buildDescription(tags, w, h),
    tags:          tags.slice(0, 8),
    category:      tags[1] || tags[0] || 'general',
    imageUrl:      hit.largeImageURL || hit.webformatURL,
    thumbUrl:      hit.webformatURL,
    width:         w,
    height:        h,
    downloadCount: hit.downloads || 0,
  };
}

async function fetchImageById(pixabayId: string): Promise<GalleryImage | null> {
  try {
    const res  = await fetch(`https://pixabay.com/api/?key=${API_KEY}&id=${pixabayId}&safesearch=true`);
    if (!res.ok) return null;
    const data = await res.json();
    const hit  = data.hits?.[0];
    return hit ? hitToImage(hit) : null;
  } catch { return null; }
}

async function fetchRelated(tags: string[], excludeId: string): Promise<GalleryImage[]> {
  try {
    const params = new URLSearchParams({
      key:        API_KEY,
      q:          tags.slice(0, 2).join(' '),
      image_type: 'photo',
      colors:     'transparent',
      safesearch: 'true',
      per_page:   '20',
      page:       '1',
      order:      'popular',
    });
    const res  = await fetch(`https://pixabay.com/api/?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.hits || []).filter((h: any) => `px-${h.id}` !== excludeId).slice(0, 6).map(hitToImage);
  } catch { return []; }
}

function fmtCount(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();
}

function CheckerBg() {
  return (
    <div className="absolute inset-0" style={{
      backgroundImage: `
        linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%),
        linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%),
        linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)
      `,
      backgroundSize: '16px 16px',
      backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
    }} />
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function GalleryDetail() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [image,     setImage]     = useState<GalleryImage | null>(null);
  const [related,   setRelated]   = useState<GalleryImage[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [copied,    setCopied]    = useState(false);

  const pixabayId = id?.split('-').pop() || '';

  useEffect(() => {
    if (!API_KEY || !pixabayId) { setLoading(false); return; }
    setLoading(true);
    setImage(null);
    setRelated([]);
    setImgLoaded(false);

    fetchImageById(pixabayId).then(img => {
      setImage(img);
      setLoading(false);
      if (img) {
        updateSEO(img); // ← كل الـ SEO في call واحدة
        if (img.tags?.length) fetchRelated(img.tags.slice(0, 2), img.id).then(setRelated);
      }
    });
  }, [id, pixabayId]);

  // cleanup canonical لما المستخدم يمشي من الصفحة
  useEffect(() => {
    return () => {
      const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (canonical) canonical.href = SITE_URL;
    };
  }, []);

  const handleDownload = () => {
    if (!image) return;
    const a = document.createElement('a');
    a.href = image.imageUrl; a.download = `${image.slug}.png`; a.target = '_blank'; a.click();
    toast.success('Download started!');
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) { await navigator.share({ title: image!.title, url }); }
    else {
      await navigator.clipboard.writeText(url);
      setCopied(true); toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
      <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      <p className="text-sm">Loading image...</p>
    </div>
  );

  if (!API_KEY) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
      <span className="text-4xl">🔑</span>
      <h1 className="text-xl font-bold">API Key Required</h1>
      <Button onClick={() => navigate('/gallery')} variant="outline" className="rounded-xl">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Gallery
      </Button>
    </div>
  );

  if (!image) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
      <h1 className="text-xl font-bold text-foreground">Image Not Found</h1>
      <p className="text-muted-foreground text-sm">This image doesn't exist or has been removed.</p>
      <Button onClick={() => navigate('/gallery')} variant="outline" className="rounded-xl">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Gallery
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/gallery" className="hover:text-foreground transition-colors">Gallery</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={`/gallery?cat=${image.category}`} className="hover:text-foreground transition-colors capitalize">
            {image.category}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground truncate max-w-[200px]">{image.title}</span>
        </nav>

        <div className="grid lg:grid-cols-[1fr_360px] gap-10">

          {/* LEFT */}
          <div>
            <div className="relative rounded-3xl overflow-hidden border border-border bg-card aspect-square sm:aspect-[4/3] max-h-[600px]">
              <CheckerBg />
              {!imgLoaded && (
                <div className="absolute inset-0 z-10 flex items-center justify-center">
                  <div className="w-10 h-10 border-2 border-border border-t-yellow-500 rounded-full animate-spin" />
                </div>
              )}
              <img
                src={image.imageUrl}
                alt={`${image.title} - transparent PNG free download`}
                fetchPriority="high"
                onLoad={() => setImgLoaded(true)}
                className={cn(
                  'relative z-10 w-full h-full object-contain transition-opacity duration-500',
                  imgLoaded ? 'opacity-100' : 'opacity-0'
                )}
              />
            </div>

            <div className="flex gap-3 mt-4 flex-wrap">
              <Button onClick={handleDownload} className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl gap-2 px-6 py-5 text-base flex-1 sm:flex-none">
                <Download className="w-5 h-5" /> Download Free PNG
              </Button>
              <Button variant="outline" onClick={handleShare} className="rounded-xl gap-2 px-4 py-5">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Share'}
              </Button>
              <Link to={`/generate?prompt=${encodeURIComponent(image.title + ' transparent background')}`}>
                <Button variant="outline" className="rounded-xl gap-2 px-4 py-5">
                  <Wand2 className="w-4 h-4" /> Generate Similar
                </Button>
              </Link>
            </div>

            <div className="mt-10">
              <h2 className="text-lg font-bold text-foreground mb-3">About This PNG Image</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">{image.description}</p>
            </div>

            {related.length > 0 && (
              <section className="mt-10" aria-label="Related PNG images">
                <h2 className="text-base font-bold text-foreground mb-4">
                  Similar {image.tags[0] ? image.tags[0].charAt(0).toUpperCase() + image.tags[0].slice(1) : ''} PNG Images
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {related.map(rel => (
                    <Link
                      key={rel.id}
                      to={`/gallery/${rel.slug}`}
                      className="group relative aspect-square rounded-xl overflow-hidden border border-border hover:border-yellow-500/50 transition-all"
                      title={rel.title}
                    >
                      <CheckerBg />
                      <img
                        src={rel.thumbUrl}
                        alt={`${rel.title} - free transparent PNG`}
                        loading="lazy"
                        className="relative z-10 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-foreground leading-tight mb-2">{image.title}</h1>
             
            </div>

            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Tag className="w-3 h-3" /> Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {image.tags.map(tag => (
                  <Link key={tag} to={`/gallery?q=${tag}`}
                    className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs hover:bg-yellow-500/10 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors">
                    {tag}
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Info className="w-3 h-3" /> File Information
              </p>
              {[
                { label: 'Format',         value: 'PNG (Transparent)' },
                { label: 'Resolution',     value: `${image.width} × ${image.height} px` },
                { label: 'License',        value: 'Free License' },
                { label: 'Commercial Use', value: '✓ Allowed' },
                { label: 'Attribution',    value: '✓ Not Required' },
                { label: 'Downloads',      value: fmtCount(image.downloadCount) },
                { label: 'Category',       value: image.category.charAt(0).toUpperCase() + image.category.slice(1) },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                  <span className={cn('text-sm font-medium', row.value.startsWith('✓') ? 'text-green-500' : 'text-foreground')}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            

            <div className="rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-transparent p-5 text-center">
              <p className="text-sm font-semibold text-foreground mb-1">Need something custom?</p>
              <p className="text-xs text-muted-foreground mb-4">Generate any PNG with AI</p>
              <Link to={`/generate?prompt=${encodeURIComponent(image.title + ' transparent background')}`} className="block">
                <Button className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl gap-2">
                  <Wand2 className="w-4 h-4" /> Generate Similar PNG
                </Button>
              </Link>
            </div>

            <div className="text-center">
              <Link to={`/gallery?q=${image.tags[0] || ''}`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
                Browse more {image.tags[0]} PNGs <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
