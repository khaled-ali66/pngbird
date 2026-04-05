/**
 * fetch-gallery-data.mjs
 * ══════════════════════════════════════════════════════
 * Script يجيب 1000 صورة PNG حقيقية من Pixabay API
 * ويولّد ملف src/data/galleryData.ts جاهز للاستخدام
 *
 * الاستخدام:
 *   node scripts/fetch-gallery-data.mjs
 *
 * المتطلبات:
 *   PIXABAY_API_KEY في .env
 *   احصل على مفتاح مجاني من: https://pixabay.com/api/docs/
 * ══════════════════════════════════════════════════════
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ─────────────────────────────────────────
const API_KEY = process.env.PIXABAY_API_KEY || process.argv[2];

if (!API_KEY) {
  console.error('\n✗ Missing API key!');
  console.error('  Usage: PIXABAY_API_KEY=your_key node scripts/fetch-gallery-data.mjs');
  console.error('  Get free key: https://pixabay.com/api/docs/\n');
  process.exit(1);
}

const TARGET   = 1000;  // عدد الصور المطلوبة
const PER_PAGE = 200;   // Pixabay max per page
const OUTPUT   = path.join(__dirname, '../src/data/galleryData.ts');

// ── Categories to fetch ────────────────────────────
// كل واحدة هتجيب ~100 صورة
const SEARCHES = [
  { query: 'flower',      category: 'flowers',    tags: ['flower', 'nature', 'bloom'] },
  { query: 'cat',         category: 'animals',    tags: ['cat', 'pet', 'cute'] },
  { query: 'dog',         category: 'animals',    tags: ['dog', 'pet', 'puppy'] },
  { query: 'butterfly',   category: 'animals',    tags: ['butterfly', 'insect', 'wings'] },
  { query: 'food fruit',  category: 'food',       tags: ['food', 'fruit', 'fresh'] },
  { query: 'coffee',      category: 'food',       tags: ['coffee', 'drink', 'cafe'] },
  { query: 'tree nature', category: 'nature',     tags: ['tree', 'nature', 'green'] },
  { query: 'cloud sky',   category: 'sky',        tags: ['cloud', 'sky', 'weather'] },
  { query: 'christmas',   category: 'objects',    tags: ['christmas', 'holiday', 'decoration'] },
  { query: 'heart love',  category: 'objects',    tags: ['heart', 'love', 'romantic'] },
];

// ── Helper: fetch URL ──────────────────────────────
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

// ── Helper: sleep ──────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Helper: generate slug ─────────────────────────
function toSlug(text, id) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50)
    + `-png-${id}`;
}

// ── Main ───────────────────────────────────────────
async function main() {
  console.log('\n🐦 PngBird — Fetching 1000 PNG images from Pixabay');
  console.log('═══════════════════════════════════════════════════\n');

  const allImages = [];
  const seenIds   = new Set();

  for (const search of SEARCHES) {
    if (allImages.length >= TARGET) break;

    const needed = Math.min(PER_PAGE, TARGET - allImages.length);
    console.log(`  📂 Fetching "${search.query}" (${search.category})...`);

    try {
      // Pixabay API — image_type=vector يجيب صور شفافة / PNG clipart
      const url = `https://pixabay.com/api/?key=${API_KEY}`
        + `&q=${encodeURIComponent(search.query)}`
        + `&image_type=vector`          // Vector/PNG = شفاف في الغالب
        + `&safesearch=true`
        + `&per_page=${needed}`
        + `&page=1`
        + `&min_width=400`
        + `&orientation=all`;

      const data = await fetchJSON(url);

      if (!data.hits || data.hits.length === 0) {
        console.log(`     ⚠ No results, trying photos...`);

        // fallback: صور عادية
        const url2 = `https://pixabay.com/api/?key=${API_KEY}`
          + `&q=${encodeURIComponent(search.query)}`
          + `&image_type=photo`
          + `&safesearch=true`
          + `&per_page=${needed}`
          + `&page=1`
          + `&min_width=400`;

        const data2 = await fetchJSON(url2);
        data.hits = data2.hits || [];
      }

      let added = 0;
      for (const hit of data.hits) {
        if (seenIds.has(hit.id)) continue;
        seenIds.add(hit.id);

        // بناء الـ tags من Pixabay
        const pixabayTags = hit.tags
          ? hit.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean).slice(0, 6)
          : [];
        const allTags = [...new Set([...search.tags, ...pixabayTags])].slice(0, 8);

        // الـ title من أول tag
        const title = allTags[0]
          ? allTags[0].charAt(0).toUpperCase() + allTags[0].slice(1) + ' PNG'
          : search.query.charAt(0).toUpperCase() + search.query.slice(1) + ' PNG';

        allImages.push({
          id: `px-${hit.id}`,
          slug: toSlug(hit.tags?.split(',')[0]?.trim() || search.query, hit.id),
          title: title,
          description: `Free ${title.replace(' PNG','')} transparent PNG image. Download free for personal and commercial use. No attribution required.`,
          tags: allTags,
          category: search.category,
          // Pixabay URLs — مباشرة بدون تخزين
          imageUrl: hit.largeImageURL,
          thumbUrl: hit.webformatURL,
          width: hit.imageWidth,
          height: hit.imageHeight,
          license: 'Pixabay',
          downloads: hit.downloads || 0,
          views: hit.views || 0,
          pixabayUrl: hit.pageURL,
        });
        added++;
      }

      console.log(`     ✓ Added ${added} images (total: ${allImages.length})`);

    } catch (err) {
      console.error(`     ✗ Error: ${err.message}`);
    }

    // تجنب rate limiting
    await sleep(500);
  }

  // لو محتاجين أكتر — نجيب pages إضافية
  if (allImages.length < TARGET) {
    console.log(`\n  ⚙ Need ${TARGET - allImages.length} more images, fetching extra pages...`);

    for (const search of SEARCHES) {
      if (allImages.length >= TARGET) break;

      for (let page = 2; page <= 5 && allImages.length < TARGET; page++) {
        const needed = Math.min(PER_PAGE, TARGET - allImages.length);

        try {
          const url = `https://pixabay.com/api/?key=${API_KEY}`
            + `&q=${encodeURIComponent(search.query)}`
            + `&image_type=vector`
            + `&safesearch=true`
            + `&per_page=${needed}`
            + `&page=${page}`;

          const data = await fetchJSON(url);
          let added = 0;

          for (const hit of (data.hits || [])) {
            if (seenIds.has(hit.id) || allImages.length >= TARGET) break;
            seenIds.add(hit.id);

            const pixabayTags = hit.tags
              ? hit.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean).slice(0, 6)
              : [];
            const allTags = [...new Set([...search.tags, ...pixabayTags])].slice(0, 8);
            const title = allTags[0]
              ? allTags[0].charAt(0).toUpperCase() + allTags[0].slice(1) + ' PNG'
              : 'Free PNG';

            allImages.push({
              id: `px-${hit.id}`,
              slug: toSlug(hit.tags?.split(',')[0]?.trim() || search.query, hit.id),
              title,
              description: `Free ${title.replace(' PNG','')} transparent PNG. No copyright, commercial use allowed.`,
              tags: allTags,
              category: search.category,
              imageUrl: hit.largeImageURL,
              thumbUrl: hit.webformatURL,
              width: hit.imageWidth,
              height: hit.imageHeight,
              license: 'Pixabay',
              downloads: hit.downloads || 0,
              views: hit.views || 0,
              pixabayUrl: hit.pageURL,
            });
            added++;
          }

          if (added > 0) console.log(`     ✓ Page ${page} "${search.query}": +${added} (total: ${allImages.length})`);
          await sleep(300);

        } catch (err) {
          console.error(`     ✗ Error page ${page}: ${err.message}`);
        }
      }
    }
  }

  console.log(`\n  📊 Total collected: ${allImages.length} images`);

  // ── توليد الـ TypeScript file ──────────────────
  const outputDir = path.dirname(OUTPUT);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const tsContent = `// ═══════════════════════════════════════════════
// galleryData.ts — Auto-generated by fetch-gallery-data.mjs
// ${allImages.length} images from Pixabay (Free License)
// Generated: ${new Date().toISOString()}
// ═══════════════════════════════════════════════

export interface GalleryImage {
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
  license: string;
  downloads: number;
}

export const GALLERY_IMAGES: GalleryImage[] = ${JSON.stringify(allImages, null, 2)};

export const GALLERY_CATEGORIES = [
  { id: 'all',      label: 'All',        icon: '✦',  count: ${allImages.length} },
${[...new Set(allImages.map(i => i.category))].map(cat => {
    const count = allImages.filter(i => i.category === cat).length;
    const icons = { flowers:'🌸', animals:'🐾', food:'🍎', nature:'🌿', sky:'☁️', objects:'💎' };
    const icon = icons[cat] || '📁';
    const label = cat.charAt(0).toUpperCase() + cat.slice(1);
    return `  { id: '${cat}', label: '${label}', icon: '${icon}', count: ${count} },`;
  }).join('\n')}
];

export const POPULAR_TAGS = ${JSON.stringify(
    [...allImages.flatMap(i => i.tags)]
      .reduce((acc, tag) => { acc[tag] = (acc[tag]||0)+1; return acc; }, {})
    |> Object.entries
    |> (entries => entries.sort((a,b) => b[1]-a[1]).slice(0,20).map(([tag]) => tag))
  , null, 2)};
`;

  // Fix: بدل |> operator
  const tagCounts = {};
  allImages.flatMap(i => i.tags).forEach(tag => { tagCounts[tag] = (tagCounts[tag]||0)+1; });
  const popularTags = Object.entries(tagCounts)
    .sort((a,b) => b[1]-a[1])
    .slice(0,20)
    .map(([tag]) => tag);

  const finalContent = `// ═══════════════════════════════════════════════
// galleryData.ts — Auto-generated
// ${allImages.length} images from Pixabay (Free License)
// Generated: ${new Date().toISOString()}
// ═══════════════════════════════════════════════

export interface GalleryImage {
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
  license: string;
  downloads: number;
}

export const GALLERY_IMAGES: GalleryImage[] = ${JSON.stringify(allImages, null, 2)};

export const GALLERY_CATEGORIES = [
  { id: 'all', label: 'All', icon: '✦', count: ${allImages.length} },
${[...new Set(allImages.map(i => i.category))].map(cat => {
    const count = allImages.filter(i => i.category === cat).length;
    const icons = { flowers:'🌸', animals:'🐾', food:'🍎', nature:'🌿', sky:'☁️', objects:'💎' };
    return `  { id: '${cat}', label: '${cat.charAt(0).toUpperCase()+cat.slice(1)}', icon: '${icons[cat]||'📁'}', count: ${count} },`;
  }).join('\n')}
];

export const POPULAR_TAGS = ${JSON.stringify(popularTags, null, 2)};
`;

  fs.writeFileSync(OUTPUT, finalContent, 'utf8');

  console.log(`\n  ✅ Generated: src/data/galleryData.ts`);
  console.log(`  📁 File size: ${(fs.statSync(OUTPUT).size / 1024).toFixed(0)} KB`);
  console.log(`  🖼  Images: ${allImages.length}`);
  console.log('\n  ✓ Now import GALLERY_IMAGES in your Gallery.tsx\n');
}

main().catch(err => {
  console.error('\n✗ Fatal:', err.message);
  process.exit(1);
});
