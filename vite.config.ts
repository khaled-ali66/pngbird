import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';

// ─── Sitemap + robots plugin (بدون dependencies إضافية) ───
function seoPlugin(siteUrl: string) {
  const staticRoutes = [
    { path: '/',         priority: 1.0,  changefreq: 'daily'   },
    { path: '/gallery',  priority: 0.9,  changefreq: 'daily'   },
    { path: '/generate', priority: 0.8,  changefreq: 'weekly'  },
    { path: '/about',    priority: 0.5,  changefreq: 'monthly' },
    { path: '/pricing',  priority: 0.7,  changefreq: 'weekly'  },
    { path: '/contact',  priority: 0.5,  changefreq: 'monthly' },
    { path: '/privacy',  priority: 0.3,  changefreq: 'yearly'  },
    { path: '/terms',    priority: 0.3,  changefreq: 'yearly'  },
    { path: '/cookies',  priority: 0.3,  changefreq: 'yearly'  },
    { path: '/refund',   priority: 0.3,  changefreq: 'yearly'  },
  ];

  const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  return {
    name: 'seo-plugin',
    closeBundle() {
      
      const dist = path.resolve(__dirname, 'dist');
      if (!fs.existsSync(dist)) return;

      // ── sitemap.xml ──────────────────────────────
      const urls = staticRoutes.map(r => `
  <url>
    <loc>${siteUrl}${r.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`).join('');

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`;

      fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap);
      console.log('✅ sitemap.xml generated');

      // ── robots.txt ───────────────────────────────
      const robots = `User-agent: *
Allow: /

# Block API routes from crawling
Disallow: /api/
Disallow: /dashboard/
Disallow: /admin/

# Sitemaps
Sitemap: ${siteUrl}/sitemap.xml
`;
      fs.writeFileSync(path.join(dist, 'robots.txt'), robots);
      console.log('✅ robots.txt generated');
    },
  };
}

export default defineConfig(({ mode }) => {
  const env      = loadEnv(mode, '.', '');
  const siteUrl  = env.VITE_SITE_URL || 'https://pngbird.com';

  return {
    plugins: [
      react(),
      tailwindcss(),
      seoPlugin(siteUrl),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      // تحسين الـ chunks عشان الـ gallery يتحمل أسرع
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor':    ['lucide-react'],
          },
        },
      },
    },
  };
});