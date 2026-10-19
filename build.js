#!/usr/bin/env node
/* ==========================================================================
   Akcan — Yayın Derleyicisi
   Panelin GitHub'a gönderdiği içerikten (veri/site.json + veri/gorsel/) yayınlanacak
   siteyi üretir: her sayfa için hazır HTML (arama motorları ve yapay zekâ tarayıcıları
   JavaScript çalıştırmadan içeriği okur), sitemap.xml, robots.txt, feed.xml (RSS),
   llms.txt ve 404.html.

   GitHub Actions her yayında çalıştırır (.github/workflows/yayin.yml).
   Bilgisayarda denemek için:
     node build.js --veri veri --cikti _site --site-url http://localhost:8080/
   Bağımlılığı yoktur; yalnızca Node.js gerekir.
   ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
require(path.join(ROOT, 'js/store.js'));
require(path.join(ROOT, 'js/render.js'));
const S = globalThis.Store;
const Render = globalThis.Render;

/* ---------- Komut satırı ---------- */
const args = process.argv.slice(2);
const arg = (name, def) => { const i = args.indexOf('--' + name); return i >= 0 && args[i + 1] ? args[i + 1] : def; };
const VERI = path.resolve(arg('veri', 'veri'));
const OUT = path.resolve(arg('cikti', '_site'));

/* ---------- Dosya yardımcıları ---------- */
const read = (f) => fs.readFileSync(f, 'utf8');
function write(rel, content) {
  const f = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, content);
}
function copy(rel) {
  const d = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(d), { recursive: true });
  fs.copyFileSync(path.join(ROOT, rel), d);
}
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return 0;
  let n = 0;
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dest, e.name);
    if (e.isDirectory()) n += copyDir(s, d);
    else { fs.copyFileSync(s, d); n++; }
  }
  return n;
}
const xml = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Şablonda aranan parça yoksa sessizce bozuk sayfa üretmek yerine dur
function swap(html, from, to) {
  if (!html.includes(from)) throw new Error('index.html içinde bulunamadı: ' + from);
  return html.replace(from, () => to);
}

/* ---------- Veri ---------- */
const dataFile = path.join(VERI, 'site.json');
const hasData = fs.existsSync(dataFile);
if (!hasData) console.warn(`! ${dataFile} bulunamadı: site boş içerikle derleniyor (panelden ilk yayını yapın).`);
const D = S.normalize(hasData ? JSON.parse(read(dataFile)) : {});
delete D.settings.adminHash;
// Taslaklar ve örnek içerikler hiçbir koşulda yayına girmez (panel zaten göndermez; eski kayıtlara karşı)
['posts', 'podcasts', 'remixes', 'pages'].forEach((c) => { D[c] = (D[c] || []).filter((x) => x.published !== false && !S.isSample(x)); });
if (/"data:image\//.test(JSON.stringify(D))) console.warn('! Veride dosyaya çıkarılmamış görsel var; sayfalar gereğinden ağır olabilir.');

const st = D.settings;
const siteUrl = String(st.seo.siteUrl || arg('site-url', '') || 'http://localhost:8080/').replace(/\/*$/, '/');
const base = new URL(siteUrl).pathname;
const R = Render.create(D, { mode: 'site', siteUrl });

/* ---------- Sayfa şablonu (index.html) ---------- */
const ASSETS = ['css/fonts.css', 'css/style.css', 'js/store.js', 'js/render.js', 'js/app.js'];
// Kod değişince tarayıcı önbelleği eski dosyayı kullanmasın
const ver = crypto.createHash('sha1').update(ASSETS.map((a) => read(path.join(ROOT, a))).join('')).digest('hex').slice(0, 8);

let tpl = read(path.join(ROOT, 'index.html')).replace(/\r\n/g, '\n');
tpl = swap(tpl, '  <script src="js/ornek-icerik.js"></script>\n', '');
tpl = tpl.replace(/(href|src)="((?:favicon\.svg|fonts\/|css\/|js\/)[^"]*)"/g, (m, a, u) => `${a}="${base}${u}${/\.(css|js)$/.test(u) ? '?v=' + ver : ''}"`);
tpl = swap(tpl, `<script src="${base}js/store.js?v=${ver}"></script>`, `<script>window.AKCAN_SITE=__AKCAN_SITE__</script>\n  <script src="${base}js/store.js?v=${ver}"></script>`);
// Gövde yazı tipi erken yüklensin (yerel file:// önizlemede tarayıcı engellediği için yalnızca yayında)
tpl = swap(tpl, `<link rel="stylesheet" href="${base}css/fonts.css?v=${ver}">`, `<link rel="preload" href="${base}fonts/fraunces-normal-latin.woff2" as="font" type="font/woff2" crossorigin>\n  <link rel="stylesheet" href="${base}css/fonts.css?v=${ver}">`);
if (!/<title>[\s\S]*?<\/title>\s*<meta name="description"[^>]*>/.test(tpl)) throw new Error('index.html içinde <title> ve açıklama etiketi bulunamadı');

function renderPage(route, pg, extra) {
  const c = R.crail(pg.ctx);
  const nav = R.navLinks(route);
  let h = tpl.replace(/<title>[\s\S]*?<\/title>\s*<meta name="description"[^>]*>/, () => R.head(pg));
  h = swap(h, '__AKCAN_SITE__', JSON.stringify({ base, siteUrl, data: 'veri/site.json', ...extra }).replace(/</g, '\\u003c'));
  h = swap(h, '<html lang="tr">', `<html lang="tr" style="--acid:${S.esc(st.accent || '#C9F03A')}">`);
  h = swap(h, '<a class="brand" href="#/" id="brand">Akcan</a>', `<a class="brand" href="${base}" id="brand">${S.esc(st.siteName)}</a>`);
  h = swap(h, '<span class="menu-links" id="menuLinks"></span>', `<span class="menu-links" id="menuLinks">${nav}</span>`);
  h = swap(h, '<nav class="nav-drawer-links" id="drawerLinks"></nav>', `<nav class="nav-drawer-links" id="drawerLinks">${nav}</nav>`);
  if (c) {
    h = swap(h, '<div class="crail" id="crail" hidden>', '<div class="crail" id="crail">');
    h = swap(h, '<nav class="crail-crumb" id="crailCrumb" aria-label="Konum"></nav>', `<nav class="crail-crumb" id="crailCrumb" aria-label="Konum">${c.crumb}</nav>`);
    h = swap(h, '<div class="crail-nb" id="crailNb"></div>', `<div class="crail-nb" id="crailNb">${c.nb}</div>`);
    h = swap(h, '<body>', '<body class="page-detail">');
  }
  if (pg.ctx && pg.ctx.readbar) h = swap(h, '<div class="readbar" id="readbar" hidden></div>', '<div class="readbar" id="readbar"></div>');
  h = swap(h, '<main id="app"></main>', `<main id="app">${pg.html}</main>`);
  h = swap(h, '<footer class="foot" id="foot"></footer>', `<footer class="foot" id="foot">${R.footerHTML()}</footer>`);
  h = swap(h, '<a class="pl-title" href="#/"></a>', `<a class="pl-title" href="${base}"></a>`);
  return h;
}

/* ---------- Sayfalar ---------- */
fs.rmSync(OUT, { recursive: true, force: true });
const pages = R.routes().map((route) => {
  const pg = R.page(route);
  write(route ? route + '/index.html' : 'index.html', renderPage(route, pg));
  return pg;
});
// Bilinmeyen adresler: GitHub Pages bu sayfayı 404 koduyla gösterir; uygulama adresi yine de kontrol eder
write('404.html', renderPage('', R.page('__bulunamadi__'), { notFound: true }));

/* ---------- Veri, görseller ve site dosyaları ---------- */
write('veri/site.json', JSON.stringify(D));
const nImg = copyDir(path.join(VERI, 'gorsel'), path.join(OUT, 'veri/gorsel'));
[...ASSETS, 'favicon.svg'].forEach(copy);
copyDir(path.join(ROOT, 'fonts'), path.join(OUT, 'fonts'));
write('.nojekyll', '');

/* ---------- Site haritası ---------- */
const lastmod = (d) => (/^\d{4}-\d{2}-\d{2}$/.test(d || '') ? `<lastmod>${d}</lastmod>` : '');
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${pages.filter((pg) => !pg.noindex).map((pg) => {
    const img = R.abs(pg.image);
    return `  <url><loc>${xml(R.abs(R.href(pg.route)))}</loc>${lastmod(pg.modified)}${img ? `<image:image><image:loc>${xml(img)}</image:loc></image:image>` : ''}</url>`;
  }).join('\n')}
</urlset>
`);

/* ---------- robots.txt ---------- */
// Yalnızca model eğitimi için tarayan botlar; ChatGPT / Claude / Perplexity arama ve yanıt botları bu listede değildir
const AI_TRAINING = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'meta-externalagent'];
let robots = '# Arama motorları ve yapay zekâ arama botları (ChatGPT, Claude, Perplexity...) siteyi tarayabilir\nUser-agent: *\nAllow: /\n';
if (st.seo.aiTraining === false) {
  robots += `\n# Yapay zekâ modellerinin eğitiminde kullanılmasın (arama ve yanıt botları etkilenmez)\n${AI_TRAINING.map((b) => 'User-agent: ' + b).join('\n')}\nDisallow: /\n`;
}
robots += `\nSitemap: ${siteUrl}sitemap.xml\n`;
write('robots.txt', robots);

/* ---------- RSS ---------- */
const rfc822 = (d) => new Date((/^\d{4}-\d{2}-\d{2}$/.test(d || '') ? d : '2000-01-01') + 'T09:00:00+03:00').toUTCString();
const summary = (it, n) => Render.clip(it.raw.seoDesc || it.raw.excerpt || it.text, n);
write('feed.xml', `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${xml(st.siteName)}</title>
  <link>${xml(siteUrl)}</link>
  <description>${xml(st.description)}</description>
  <language>tr</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <atom:link href="${xml(siteUrl)}feed.xml" rel="self" type="application/rss+xml"/>
${R.items().slice(0, 50).map((it) => {
    const url = R.abs(it.href);
    return `  <item>
    <title>${xml(it.title)}</title>
    <link>${xml(url)}</link>
    <guid isPermaLink="true">${xml(url)}</guid>
    <pubDate>${rfc822(it.date)}</pubDate>
    <description>${xml(summary(it, 400))}</description>
${(it.raw.tags || []).map((t) => `    <category>${xml(t)}</category>`).join('\n')}
  </item>`.replace(/\n\n/g, '\n');
  }).join('\n')}
</channel>
</rss>
`);

/* ---------- llms.txt: yapay zekâ asistanları için site özeti ---------- */
const a = D.about || {};
const all = R.items();
const section = (title, list) => (list.length ? `\n## ${title}\n\n${list.map((l) => `- [${l.title}](${l.url})${l.desc ? ': ' + l.desc : ''}`).join('\n')}\n` : '');
const entry = (it) => ({ title: it.title, url: R.abs(it.href), desc: summary(it, 200) });
const profiles = Object.values(st.social || {}).filter(S.isProfile);
// Alt kategoriler ve yayınlandıkları diğer kanallar
const subs = R.catPages().map((x) => ({
  title: `${x.tabName} › ${x.cat.name}`, url: R.abs(R.href(x.route)),
  desc: [x.cat.desc, /^https?:\/\//i.test(x.cat.link || '') ? 'Kanal: ' + x.cat.link : ''].filter(Boolean).join(' ')
}));
write('llms.txt', `# ${st.siteName}

> ${st.description || st.tagline || ''}
${a.name || a.role ? `\n${[a.name, a.role].filter(Boolean).join(' — ')}. Hakkında: ${R.abs(R.href('hakkinda'))}\n` : ''}${section(st.videosPage.title || 'Videolar', all.filter((i) => i.fk === 'video').map(entry))}${section(st.postsPage.title || 'Yazılar', all.filter((i) => i.fk === 'yazi').map(entry))}${section(st.podcast.name || 'Podcast', all.filter((i) => i.type === 'podcast').map(entry))}${section('Remixler', all.filter((i) => i.type === 'remix').map(entry))}${section('Alt kategoriler', subs)}${section('Sayfalar', R.pub(D.pages).map((p) => ({ title: p.title, url: R.abs(R.href('sayfa/' + p.slug)), desc: Render.clip(p.seoDesc || p.excerpt || S.strip(p.content), 200) })))}${section('Bağlantılar', profiles.map((u) => ({ title: new URL(u).hostname.replace(/^www\./, ''), url: u })))}`);

console.log(`✓ ${pages.length} sayfa, ${nImg} görsel → ${path.relative(process.cwd(), OUT) || OUT}  (${siteUrl})`);
