/* ==========================================================================
   Akcan — Sayfa Şablonları
   Sitenin bütün sayfalarını HTML metni olarak üretir. Tarayıcıdaki site (app.js)
   ve yayın derleyicisi (build.js, Node) aynı şablonları kullanır: arama motorlarının
   ve yapay zekâ tarayıcılarının okuduğu hazır sayfa, sitede görünenle birebir aynıdır.

   İki adres biçimi:
   - local: panelle aynı bilgisayardaki önizleme → #/yazilar/yazi-adi, #/videolar/video-adi
   - site:  yayınlanan site → /yazilar/yazi-adi/, /videolar/video-adi/ (GitHub Pages'te /depo-adi/... altında)
   Alt kategori sayfaları sekmenin altındadır: /yazilar/gida/, /videolar/gundem/
   Podcast: seri vitrini /podcast/, seri /podcast/seri-adi/, bölüm /podcast/seri-adi/bolum-adi/
   ========================================================================== */
(function (global) {
  'use strict';

  const S = global.Store;
  const esc = S.esc;

  /* ---------- İkonlar ---------- */
  const ICON = {
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    wave: '<svg class="wave" viewBox="0 0 16 12" aria-hidden="true"><rect x="0" y="4" width="2" height="4"/><rect x="3.5" y="2" width="2" height="8"/><rect x="7" y="0" width="2" height="12"/><rect x="10.5" y="2" width="2" height="8"/><rect x="14" y="4" width="2" height="4"/></svg>'
  };
  const SOCIAL_LABEL = { youtube: 'YouTube', instagram: 'Instagram', tiktok: 'TikTok', x: 'X', linkedin: 'LinkedIn', spotify: 'Spotify', soundcloud: 'SoundCloud', email: 'E-posta' };
  // Üst menüdeki tek renk simgeler (renk: currentColor)
  const svgFill = (d) => `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${d}"/></svg>`;
  const svgLine = (inner) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
  const SOCIAL_ICON = {
    youtube: svgFill('M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z'),
    instagram: svgLine('<rect x="2.5" y="2.5" width="19" height="19" rx="5"/><circle cx="12" cy="12" r="4.2"/><line x1="17.6" y1="6.4" x2="17.61" y2="6.4"/>'),
    tiktok: svgFill('M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z'),
    x: svgFill('M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93zm-1.29 19.5h2.04L6.49 3.24H4.3l13.31 17.41z'),
    linkedin: svgFill('M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z'),
    spotify: svgFill('M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.52 17.34c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.48.66.3 1.02zm1.44-3.3c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.94-1.38-.48.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14C9.6 9.9 15 10.56 18.72 12.84c.36.18.54.78.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.3c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72 1.02.42 1.56-.3.42-1.02.6-1.56.3z'),
    soundcloud: svgFill('M.25 14h1.5v4H.25zM3 12h1.5v6H3zm2.75-1.5h1.5V18h-1.5zM8.5 9H10v9H8.5zm3-1.4a7 7 0 0 1 9.4 5.3 2.6 2.6 0 0 1 .5 5.1h-9.9z'),
    email: svgLine('<rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="m3 6.5 9 7 9-7"/>')
  };
  const PAGE_SIZE = 12;

  /* ---------- Genel yardımcılar ---------- */
  const byDate = (a, b) => (b.date || '').localeCompare(a.date || '');
  const pub = (arr) => (arr || []).filter((x) => x.published !== false).slice().sort(byDate);
  const norm = (s) => String(s || '').toLocaleLowerCase('tr');
  const nl2br = (s) => esc(s || '').replace(/\n/g, '<br>');

  /** Metni kelime ortasından bölmeden kısaltır (arama sonucu açıklaması: ~160 karakter) */
  function clip(s, n = 160) {
    s = String(s || '').replace(/\s+/g, ' ').trim();
    if (s.length <= n) return s;
    const cut = s.slice(0, n - 1);
    return cut.slice(0, Math.max(cut.lastIndexOf(' '), Math.floor(n * 0.6))).replace(/[\s,.;:–-]+$/, '') + '…';
  }

  const isProfile = S.isProfile;

  /** "32 dk", "1 sa 5 dk", "45:30" → ISO 8601 süre (PT32M) */
  function isoDuration(s) {
    s = String(s || '').trim();
    if (!s) return undefined;
    const c = s.match(/^(?:(\d+):)?(\d{1,2}):(\d{2})$/);
    if (c) return 'PT' + (c[1] ? +c[1] + 'H' : '') + +c[2] + 'M' + +c[3] + 'S';
    const h = s.match(/(\d+)\s*(?:sa|saat|h)\b/i), m = s.match(/(\d+)\s*(?:dk|dakika|min)\b/i), x = s.match(/(\d+)\s*(?:sn|saniye|sec)\b/i);
    if (!h && !m && !x) return undefined;
    return 'PT' + (h ? +h[1] + 'H' : '') + (m ? +m[1] + 'M' : '') + (x ? +x[1] + 'S' : '');
  }

  // Tarih → saat dilimli ISO (Türkiye, UTC+3)
  const isoDate = (d) => (/^\d{4}-\d{2}-\d{2}$/.test(d || '') ? d + 'T09:00:00+03:00' : undefined);

  /** Yapılandırılmış veriden boş alanları atar */
  function clean(v) {
    if (Array.isArray(v)) { const a = v.map(clean).filter((x) => x !== undefined); return a.length ? a : undefined; }
    if (v && typeof v === 'object') {
      const o = {};
      Object.keys(v).forEach((k) => { const x = clean(v[k]); if (x !== undefined) o[k] = x; });
      return Object.keys(o).length ? o : undefined;
    }
    return v === '' || v === null || v === undefined || (typeof v === 'number' && !isFinite(v)) ? undefined : v;
  }

  /**
   * Site verisi için şablon seti oluşturur.
   * opt.mode: 'local' (#/ adresler) | 'site' (gerçek adresler)
   * opt.siteUrl: yayınlanan sitenin tam adresi (site modunda zorunlu), ör. https://kullanici.github.io/akcan/
   */
  function create(D, opt) {
    opt = opt || {};
    const site = opt.mode === 'site';
    const st = D.settings || {};
    const seo = st.seo || {};
    const home = site ? new URL(String(opt.siteUrl).replace(/\/*$/, '/')).href : '';
    const base = site ? new URL(home).pathname : '';

    /* ---------- Adresler ---------- */
    const href = (route) => (site ? base + (route ? route + '/' : '') : '#/' + (route || ''));
    const abs = (u) => { if (!u || /^data:/.test(u)) return ''; try { return new URL(u, home || 'http://localhost/').href; } catch (e) { return ''; } };
    // Yayında görseller veri/gorsel/... altında durur; adres, sitenin kök yoluna göre tamamlanır
    const asset = (u) => (u && site && /^veri\//.test(u) ? base + u : u || '');

    // Videolar /videolar/, blog yazıları /yazilar/ altında (ikisi de D.posts'ta; türü belirler)
    const postRoute = (p) => (S.postKind(p) === 'video' ? 'videolar/' : 'yazilar/') + p.slug;

    /* ---------- Alt kategoriler ---------- */
    // Videolar ve Yazılar sekmelerinin her biri kendi listesini taşır (panelde ▦ Alt Kategoriler).
    // Alt kategori sayfası sekmenin altında: /yazilar/gida/, /videolar/gundem/
    const TAB_ROUTE = { video: 'videolar', yazi: 'yazilar' };
    const catsOf = (tab) => S.cats(D, tab);
    const catRoute = (tab, c) => TAB_ROUTE[tab] + '/' + c.slug;
    // Sekmede yayında olan içerikler
    const tabList = (tab) => pub(D.posts).filter((p) => S.postKind(p) === tab);
    const catOf = (tab, x) => (x && x.cat ? catsOf(tab).find((c) => c.id === x.cat) : undefined);
    /** İçeriği olan alt kategoriler: [alt kategori, içerik sayısı]. Boş olanlar sitede görünmez, sayfası da olmaz. */
    function liveCats(tab) {
      const list = tabList(tab);
      return catsOf(tab).map((c) => [c, list.filter((x) => x.cat === c.id).length]).filter((x) => x[1] > 0);
    }
    const liveCat = (tab, slug) => (liveCats(tab).find(([c]) => c.slug === slug) || [])[0];
    // Alt kategoriyle aynı adı taşıyan etiket iki kez görünmesin
    const withoutCat = (tags, c) => (tags || []).filter((t) => !c || norm(t) !== norm(c.name));

    /* ---------- Podcast serileri ---------- */
    // Vitrin /podcast/, seri /podcast/frekans/, bölüm /podcast/frekans/bolum-adi/
    /** Yayındaki seriler, paneldeki sırayla (vitrin sırası) */
    const seriesList = () => (D.series || []).filter((s) => s.published !== false);
    const findSeries = (slug) => seriesList().find((s) => s.slug === slug);
    const serOf = (x) => S.seriesOf(D, x);
    const seriesRoute = (s) => 'podcast/' + s.slug;
    const epRoute = (x) => { const s = serOf(x); return (s ? seriesRoute(s) : 'podcast') + '/' + x.slug; };
    // Yayındaki bölümler: yalnızca yayındaki serilere bağlı olanlar (yeniden eskiye)
    const liveEps = () => { const ids = new Set(seriesList().map((s) => s.id)); return pub(D.podcasts).filter((x) => ids.has(x.series)); };
    const seriesEps = (s) => liveEps().filter((x) => x.series === s.id);
    // Fragman ses dosyasıysa alttaki oynatıcıda çalar; YouTube / Spotify / SoundCloud bağlantısı gömülür
    const trailerAudio = (s) => (s.trailer && !S.embed(s.trailer) && /^https?:\/\//i.test(s.trailer) ? s.trailer : '');

    /** Eski ya da kısa biçimli site içi adresleri güncel biçime çevirir (#/yazi/x → yazilar/x, yanlış sekmedeki video → videolar/x) */
    function normalize(route) {
      const r = String(route || '').replace(/^\/+|\/+$/g, '');
      const parts = r.split('/');
      const [seg, arg] = parts;
      const postAt = (slug) => { const p = (D.posts || []).find((x) => x.slug === slug); return p ? postRoute(p) : ''; };
      switch (seg) {
        case 'yazi': return arg ? postAt(arg) || 'yazilar/' + arg : 'yazilar';
        case 'yazilar': case 'videolar': {
          if (parts.length !== 2) return r;
          // Bu sekmenin alt kategori sayfası yerinde kalır; başka sekmedeki içerik kendi sekmesine yönlenir
          const kind = seg === 'videolar' ? 'video' : 'yazi';
          const p = (D.posts || []).find((x) => x.slug === arg);
          if (p && S.postKind(p) !== kind && catsOf(kind).some((c) => c.slug === arg)) return r;
          return p ? postRoute(p) : r;
        }
        case 'video': { const p = (D.posts || []).find((x) => x.legacyVideoId === arg || x.id === arg); return p ? postRoute(p) : 'videolar'; }
        case 'bolum': { const x = (D.podcasts || []).find((y) => y.id === arg || y.slug === arg); return x ? epRoute(x) : 'podcast'; }
        case 'podcast': {
          // Seri bağlantısı yerinde kalır; eski bölüm adresi (/podcast/bolum/) ve yanlış serideki bölüm doğru adrese,
          // eski alt kategori ya da bilinmeyen adres vitrine yönlenir
          const epAt = (slug) => (D.podcasts || []).find((y) => y.slug === slug);
          if (parts.length === 2) { if (findSeries(arg)) return r; const x = epAt(arg); return x ? epRoute(x) : 'podcast'; }
          if (parts.length === 3) { const x = epAt(parts[2]); return x ? epRoute(x) : r; }
          return r;
        }
        case 'remix': { const x = (D.remixes || []).find((y) => y.id === arg || y.slug === arg); return x ? 'remixler/' + x.slug : 'remixler'; }
        default: return r;
      }
    }
    // Panelde girilen site içi bağlantılar (#/yazilar, #/sayfa/iletisim) her iki biçimde de doğru açılsın
    const link = (u) => (u && /^#\//.test(u) ? href(normalize(u.slice(2))) : u || '');

    /** Zengin metin içeriği: site içi bağlantılar ve görsel yolları düzeltilir, görseller tembel yüklenir */
    function fixHtml(html) {
      if (!html) return '';
      return String(html)
        .replace(/(\shref=")(#\/[^"]*)"/g, (m, a, u) => a + link(u) + '"')
        .replace(/(\s(?:src|href)=")(veri\/[^"]*)"/g, (m, a, u) => a + asset(u) + '"')
        .replace(/<img(?![^>]*\sloading=)/g, '<img loading="lazy" decoding="async"');
    }

    /* ---------- İçerik listesi ---------- */
    let cache = null;
    function items() {
      if (cache) return cache;
      const out = [];
      // Videolar ve blog yazıları (ayrı sekmeler; fk: tür ve akış filtresi anahtarı)
      // Videonun küçük resmi YouTube'dan, blog yazısınınki kapak görselinden gelir
      // cat: alt kategorinin adı (satırda etiketlerden önce, vurgulu)
      pub(D.posts).forEach((p) => {
        const vid = S.postKind(p) === 'video';
        const c = catOf(vid ? 'video' : 'yazi', p);
        out.push({
          type: 'post', fk: vid ? 'video' : 'yazi', label: vid ? 'Video' : 'Yazı', id: p.id, title: p.title, date: p.date, href: href(postRoute(p)),
          thumb: vid ? S.ytThumb(p.video, 'mqdefault') : asset(p.cover), video: vid, cat: c && c.name,
          tags: withoutCat(p.tags, c), text: S.strip((p.excerpt || '') + ' ' + (p.content || '')), raw: p
        });
      });
      // Podcast bölümleri: cat yerinde serinin adı
      liveEps().forEach((p) => {
        const s = serOf(p);
        out.push({
          type: 'podcast', fk: 'podcast', label: 'Podcast', id: p.id, title: p.title, date: p.date, href: href(epRoute(p)),
          thumb: asset(p.cover), audio: p.audio, raw: p, text: S.strip(p.description), cat: s && s.title,
          tags: ['Podcast', p.number ? 'Bölüm ' + p.number : '', ...(p.tags || []), p.duration].filter(Boolean),
          sub: (p.number ? 'Bölüm ' + p.number + ' · ' : '') + (s ? s.title : 'Podcast')
        });
      });
      pub(D.remixes).forEach((r) => out.push({
        type: 'remix', fk: 'remix', label: 'Remix', id: r.id, title: r.title, date: r.date, href: href('remixler/' + r.slug),
        thumb: asset(r.cover), audio: r.audio, raw: r, text: [r.original, r.excerpt, S.strip(r.description)].filter(Boolean).join(' '),
        tags: ['Remix', r.genre, r.bpm ? r.bpm + ' BPM' : '', ...(r.tags || [])].filter(Boolean),
        sub: r.original || 'Remix'
      }));
      return (cache = out.sort(byDate));
    }
    // Oynatıcı anahtarı "tür:kimlik"; "seri:kimlik" serinin fragmanıdır
    const findItem = (type, id) => (type === 'seri' ? trailerItem(id) : items().find((i) => i.type === type && i.id === id));
    function trailerItem(id) {
      const s = seriesList().find((x) => x.id === id);
      if (!s) return undefined;
      return { type: 'seri', id, title: s.title + ' · Fragman', href: href(seriesRoute(s)), thumb: asset(s.cover), audio: trailerAudio(s), sub: 'Fragman', label: 'Fragman' };
    }

    /** Site içi arama: içerikler + podcast serileri + yayındaki özel sayfalar + alt kategori sayfaları */
    function searchIndex() {
      const pages = pub(D.pages).map((p) => ({ type: 'page', label: 'Sayfa', title: p.title, href: href('sayfa/' + p.slug), text: S.strip(p.content), tags: [] }));
      const subs = catPages().map((x) => ({ type: 'cat', label: 'Alt kategori', title: x.tabName + ' › ' + x.cat.name, href: href(x.route), text: x.cat.desc || '', tags: [] }));
      const sers = seriesList().map((s) => ({ type: 'series', label: 'Podcast serisi', title: s.title, href: href(seriesRoute(s)), text: [s.tagline, s.description].filter(Boolean).join(' '), tags: [] }));
      return [...items(), ...sers, ...subs, ...pages];
    }

    /* ---------- Menü & alt bilgi ---------- */
    const ROUTE_OF = { home: '', videos: 'videolar', blog: 'yazilar', podcast: 'podcast', remixes: 'remixler', about: 'hakkinda' };
    function menuHref(m) {
      switch (m.type) {
        case 'home': return href('');
        case 'videos': return href('videolar');
        case 'blog': return href('yazilar');
        case 'podcast': return href('podcast');
        case 'remixes': return href('remixler');
        case 'about': return href('hakkinda');
        case 'page': return href('sayfa/' + (m.target || ''));
        case 'url': return link(m.target) || '#';
        default: return href('');
      }
    }
    const menuRoute = (m) => (m.type === 'page' ? 'sayfa/' + m.target : (ROUTE_OF[m.type] ?? ''));
    // Yayında olmayan sayfaların menü bağlantıları gösterilmez
    function visibleMenu() {
      const pages = new Set(pub(D.pages).map((p) => p.slug));
      return (D.menu || []).filter((m) => m.visible !== false && (m.type !== 'page' || pages.has(m.target)));
    }
    /** Menü bağlantısı bu sayfada etkin mi? (yazilar/... altındaki her sayfada "Yazılar") */
    const isActive = (r, route) => !!r && (route === r || String(route).startsWith(r + '/'));

    function navLinks(route) {
      return visibleMenu().map((m) => {
        const r = menuRoute(m);
        const attrs = m.type === 'url' && m.newTab ? ' target="_blank" rel="noopener"' : '';
        const on = route !== undefined && isActive(r, route);
        return `<a href="${esc(menuHref(m))}" data-route="${esc(r)}"${on ? ' class="active"' : ''}${attrs}>${esc(m.label)}</a>`;
      }).join('');
    }

    /** Sitede görünen sosyal hesaplar: adresi geçerli ve panelde gizlenmemiş olanlar, [ağ, bağlantı] */
    function socials() {
      const so = st.social || {}, off = st.socialOff || [];
      return Object.keys(SOCIAL_LABEL)
        .filter((k) => !off.includes(k) && (k === 'email' ? /@/.test(so[k] || '') : isProfile(so[k])))
        .map((k) => [k, k === 'email' ? 'mailto:' + so[k] : so[k]]);
    }
    const socialAttrs = (k) => (k === 'email' ? '' : ' target="_blank" rel="noopener me"');
    /** Üst menüdeki simgeler (panelde "Üst menüde göster" kapalıysa boş) */
    function socialIcons() {
      if (st.navSocial === false) return '';
      return socials().map(([k, u]) => `<a href="${esc(u)}" aria-label="${SOCIAL_LABEL[k]}" title="${SOCIAL_LABEL[k]}"${socialAttrs(k)}>${SOCIAL_ICON[k]}</a>`).join('');
    }

    function footerHTML() {
      const menu = visibleMenu()
        .map((m) => `<li><a href="${esc(menuHref(m))}"${m.type === 'url' && m.newTab ? ' target="_blank" rel="noopener"' : ''}>${esc(m.label)}</a></li>`).join('');
      const soc = socials().map(([k, u]) => `<li><a href="${esc(u)}"${socialAttrs(k)}>${SOCIAL_LABEL[k]}</a></li>`).join('');
      const ft = (st.footerText || '').replace('{yil}', new Date().getFullYear());
      return `
      <div class="glow"></div>
      <div class="wrap">
        <div class="foot-grid">
          <div><a href="${href('')}" class="fbrand">${esc(st.siteName)}</a><p class="ftag">${esc(st.tagline)}</p></div>
          <div><h4>Menü</h4><ul>${menu}</ul></div>
          <div><h4>Takip Et</h4><ul>${soc || '<li style="color:var(--fg-3)">—</li>'}</ul></div>
        </div>
        <div class="foot-bottom"><span>${esc(ft)}</span></div>
      </div>`;
    }

    /* ---------- Satır & kart şablonları ---------- */
    // Vurgulu baştakiler: tür (Podcast / Remix) ve alt kategori; noCat: alt kategori sayfasında adı tekrar yazılmaz
    function tagsHTML(it, noCat) {
      const n = it.type === 'podcast' || it.type === 'remix' ? 1 : 0;
      const c = it.cat && !noCat ? [it.cat] : [];
      const list = [...it.tags.slice(0, n), ...c, ...it.tags.slice(n)];
      return `<span class="tags">${list.map((t, i) => `<span${i < n + c.length ? ' class="k"' : ''}>${esc(t)}</span>`).join('')}</span>`;
    }

    function playBtn(it, cls = 'fplay') {
      if (!it.audio) return `<a class="${cls}" href="${it.href}" aria-label="Aç">${ICON.play}</a>`;
      return `<button class="${cls}" data-play="${it.type}:${it.id}" aria-label="Dinle">${ICON.play}</button>`;
    }

    // plain: Yazılar sekmesindeki gibi küçük resimde tür etiketi gösterme; noCat: alt kategori adını gösterme
    function row(it, plain, noCat) {
      const date = `<span class="date">${S.fmtDate(it.date)}</span>`;
      if (it.type === 'podcast' || it.type === 'remix') {
        // Yazı/video satırlarıyla aynı 16:9 küçük resim kutusu: bulanık zemin + ortada kare kapak + oynat
        const art = it.thumb
          ? `<img class="bl" src="${esc(it.thumb)}" alt="" loading="lazy"><span class="cv" style="background-image:url('${esc(it.thumb)}')"></span>`
          : '';
        const lead = `<span class="ethumb podthumb ${it.thumb ? '' : 'empty'}">${art}${playBtn(it)}</span>`;
        return `<div class="erow frow-pod reveal" data-type="${it.type}">${lead}<a class="einfo" href="${it.href}"><span class="t">${esc(it.title)}</span>${tagsHTML(it, noCat)}</a>${date}</div>`;
      }
      const img = it.thumb ? `<img src="${esc(it.thumb)}" alt="" loading="lazy">` : '';
      // YouTube videosunun küçük resminde oynat işareti: yazıdan bir bakışta ayrılsın (satırın tamamı video sayfasına gider)
      const vplay = it.video ? `<span class="vplay" aria-hidden="true">${ICON.play}</span>` : '';
      return `<a class="erow reveal" data-type="${it.type}" href="${it.href}"><span class="ethumb ${it.thumb ? '' : 'empty'}">${img}${vplay}${plain ? '' : `<span class="fbadge ${it.video ? 'is-video' : ''}">${it.label}</span>`}</span><span class="einfo"><span class="t">${esc(it.title)}</span>${tagsHTML(it, noCat)}</span>${date}</a>`;
    }

    // Büyük görsel: video → YouTube karesi, blog yazısı → kapak görseli
    const postThumb = (x) => (S.postKind(x) === 'video' ? S.ytThumb(x.video, 'maxresdefault') : asset(x.cover));

    /* ---------- Yapılandırılmış veri (schema.org) düğümleri ---------- */
    const homeUrl = () => abs(href(''));
    const personId = () => homeUrl() + '#kisi';
    const pageUrl = (route) => abs(href(route));
    function personNode() {
      const a = D.about || {};
      return {
        '@type': 'Person', '@id': personId(), name: a.name || st.siteName, url: pageUrl('hakkinda'),
        image: abs(asset(a.photo)), jobTitle: a.role, description: clip(S.strip((a.lead || '') + ' ' + (a.bio || '')), 300),
        sameAs: socials().map(([, u]) => u).filter(isProfile)
      };
    }
    const crumbs = (list) => list.map(([name, route]) => ({ name, route }));
    function listNode(type, route, name, desc, list, extra) {
      return {
        '@type': type, '@id': pageUrl(route), url: pageUrl(route), name, description: desc, inLanguage: 'tr-TR',
        isPartOf: { '@id': homeUrl() + '#site' }, ...extra,
        mainEntity: list && list.length ? { '@type': 'ItemList', itemListElement: list.slice(0, 50).map((it, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(it.href), name: it.title })) } : undefined
      };
    }

    /* ---------- Sayfalar ---------- */
    function getFeaturedHero() {
      const feat = st.featured || {};

      // 1. Özel (Custom) Manşet Modu
      if (feat.mode === 'custom' && (feat.customTitle || feat.customImage)) {
        return {
          title: feat.customTitle || st.siteName,
          eyebrow: feat.badge || 'Öne Çıkan',
          date: '',
          excerpt: feat.customExcerpt || '',
          cover: asset(feat.customImage) || asset(st.heroImage),
          href: link(feat.customLink) || href(''),
          btnText: feat.customButtonText || 'İncele'
        };
      }

      // 2. Belirli bir içerik seçilmişse
      if (feat.mode !== 'latest') {
        const targetId = feat.id || (D.posts || []).find((p) => p.featured && p.published !== false)?.id;
        if (targetId) {
          const colls = [
            { type: 'posts', label: 'Yazı', btn: 'Oku', href: (x) => href(postRoute(x)), thumb: postThumb, excerpt: (x) => x.excerpt },
            { type: 'podcasts', label: 'Podcast', btn: 'Dinle', href: (x) => href(epRoute(x)), thumb: (x) => asset(x.cover), excerpt: (x) => S.strip(x.description) },
            { type: 'remixes', label: 'Remix', btn: 'Dinle', href: (x) => href('remixler/' + x.slug), thumb: (x) => asset(x.cover), excerpt: (x) => x.excerpt || x.original || S.strip(x.description) },
            { type: 'pages', label: 'Sayfa', btn: 'İncele', href: (x) => href('sayfa/' + x.slug), thumb: (x) => asset(x.cover), excerpt: (x) => x.excerpt }
          ];

          for (const c of colls) {
            const item = (D[c.type] || []).find((x) => x.id === targetId && x.published !== false);
            if (item) {
              const vid = c.type === 'posts' && S.postKind(item) === 'video';
              return {
                item,
                type: c.type,
                title: feat.customTitle || item.title,
                eyebrow: feat.badge || `Öne çıkan ${vid ? 'video' : c.label.toLowerCase()}`,
                date: item.date,
                excerpt: feat.customExcerpt !== undefined && feat.customExcerpt !== '' ? feat.customExcerpt : (c.excerpt(item) || ''),
                cover: asset(feat.customImage) || c.thumb(item) || asset(st.heroImage),
                href: link(feat.customLink) || c.href(item),
                btnText: feat.customButtonText || (vid ? 'İzle' : c.btn)
              };
            }
          }
        }
      }

      // 3. Otomatik mod veya içerik bulunamadıysa: En son yayınlanan yazı veya içerik
      const latestPost = pub(D.posts)[0];
      if (latestPost) {
        const vid = S.postKind(latestPost) === 'video';
        return {
          item: latestPost,
          type: 'posts',
          title: feat.customTitle || latestPost.title,
          eyebrow: feat.badge || (vid ? 'Son video' : 'Son yazı'),
          date: latestPost.date,
          excerpt: feat.customExcerpt !== undefined && feat.customExcerpt !== '' ? feat.customExcerpt : (latestPost.excerpt || ''),
          cover: asset(feat.customImage) || postThumb(latestPost) || asset(st.heroImage),
          href: link(feat.customLink) || href(postRoute(latestPost)),
          btnText: feat.customButtonText || (vid ? 'İzle' : 'Oku')
        };
      }

      const anyLatest = items()[0];
      if (anyLatest) {
        return {
          item: anyLatest,
          type: anyLatest.type,
          title: feat.customTitle || anyLatest.title,
          eyebrow: feat.badge || `Son ${anyLatest.label.toLowerCase()}`,
          date: anyLatest.date,
          excerpt: feat.customExcerpt !== undefined && feat.customExcerpt !== '' ? feat.customExcerpt : (anyLatest.text || ''),
          cover: asset(feat.customImage) || anyLatest.thumb || asset(st.heroImage),
          href: link(feat.customLink) || anyLatest.href,
          btnText: feat.customButtonText || (anyLatest.type === 'podcast' || anyLatest.type === 'remix' ? 'Dinle' : anyLatest.video ? 'İzle' : 'Oku')
        };
      }

      return null;
    }

    /** Ana sayfa akışı: filtre + sayfalama (ilk sayfa hazır HTML'de gelir, devamı tarayıcıda) */
    function feedHTML(filter, limit) {
      const list = items().filter((i) => filter === 'all' || i.fk === filter);
      return {
        html: list.length ? list.slice(0, limit).map((i) => row(i)).join('') : '<div class="empty-note">Henüz içerik yok.</div>',
        more: list.length > limit
      };
    }

    function homePage() {
      const all = items();
      const featHero = getFeaturedHero();
      let hero;

      if (featHero) {
        const img = featHero.cover || asset(st.heroImage);
        const dateText = featHero.date ? ` · ${S.fmtDate(featHero.date)}` : '';
        const featConfig = st.featured || {};
        const showTopGrad = featConfig.topGradient !== false;
        const topGradOpacity = Math.max(0, Math.min(100, Number(featConfig.topGradientOpacity ?? 85))) / 100;
        const topGradHTML = showTopGrad ? `<div class="top-grad" style="opacity:${topGradOpacity.toFixed(2)}"></div>` : '';
        hero = `
        <header class="fhero">
          ${img ? `<img class="fbg" src="${esc(img)}" alt="" fetchpriority="high">` : ''}
          ${topGradHTML}
          <div class="grad"></div><div class="glow"></div>
          <div class="wrap">
            <div class="eyebrow rise d1">${esc(featHero.eyebrow)}${dateText}</div>
            <h1 class="rise d2"><a href="${esc(featHero.href)}">${esc(featHero.title)}</a></h1>
            ${featHero.excerpt ? `<p class="fsub rise d3">${esc(featHero.excerpt)}</p>` : ''}
            <a class="readlink rise d4" href="${esc(featHero.href)}"><span class="arr">→</span> ${esc(featHero.btnText)}</a>
          </div>
        </header>`;
      } else {
        hero = `
        <header class="hero">
          <div class="glow"></div>
          <div class="wrap">
            <div class="eyebrow rise d1">${esc(st.siteName)}</div>
            <h1 class="rise d2">${esc(st.tagline || 'Hoş geldiniz')}</h1>
          </div>
        </header>`;
      }

      const counts = { video: 0, yazi: 0, podcast: 0, remix: 0 };
      all.forEach((i) => counts[i.fk]++);
      const years = all.map((i) => (i.date || '').slice(0, 4)).filter(Boolean).sort();
      const since = years[0] || new Date().getFullYear();
      const parts = [];
      if (counts.video) parts.push(`<a href="${href('videolar')}"><b>${counts.video}</b></a> video`);
      if (counts.yazi) parts.push(`<a href="${href('yazilar')}"><b>${counts.yazi}</b></a> yazı`);
      if (counts.podcast) parts.push(`<a href="${href('podcast')}"><b>${counts.podcast}</b></a> podcast bölümü`);
      if (counts.remix) parts.push(`<a href="${href('remixler')}"><b>${counts.remix}</b></a> remix`);
      const joined = parts.length > 1 ? parts.slice(0, -1).join(', ') + ' ve ' + parts[parts.length - 1] : parts[0];
      const stat = st.showStats && parts.length ? `
      <div class="seam"></div>
      <section class="statband"><div class="wrap"><p class="sbtext">${since}'den beri ${joined} ile ürettiklerimi buradan paylaşıyorum.</p></div></section>` : '';

      const F = [['all', 'Hepsi', all.length], ['video', 'Video', counts.video], ['yazi', 'Yazı', counts.yazi], ['podcast', 'Podcast', counts.podcast], ['remix', 'Remix', counts.remix]]
        .filter((f) => f[0] === 'all' || f[2] > 0);
      const feed = feedHTML('all', PAGE_SIZE);

      const title = st.siteName + (st.tagline ? ' — ' + st.tagline : '');
      return {
        home: true, title, name: st.siteName, desc: st.description, ogType: 'website',
        // Paylaşım görseli: YouTube'un en büyük karesi her videoda bulunmadığından her zaman var olan kare
        image: (featHero ? featHero.cover : asset(st.heroImage)).replace(/\/maxresdefault\.jpg$/, '/hqdefault.jpg'), modified: all[0] && all[0].date,
        schema: [{ '@type': 'WebPage', '@id': homeUrl(), url: homeUrl(), name: title, description: st.description, inLanguage: 'tr-TR', isPartOf: { '@id': homeUrl() + '#site' }, about: { '@id': personId() } }],
        html: `${hero}${stat}
      <div class="seam"></div>
      <section class="ix" id="akis"><div class="wrap">
        <div class="head">
          <div class="hl"><span class="lbl">Akış</span>
            <div class="feedfilter" id="feedfilter">${F.map((f) => `<button data-f="${f[0]}" class="${f[0] === 'all' ? 'on' : ''}">${f[1]}<span class="pc">${f[2]}</span></button>`).join('')}</div>
          </div>
          <span class="cnt">${since}'den beri</span>
        </div>
        <div class="feed" id="feed">${feed.html}</div>
        <button class="feedmorebtn" id="feedmore"${feed.more ? '' : ' hidden'}>Daha fazla göster</button>
      </div></section>`
      };
    }

    /* ---------- Detay sayfası parçaları ---------- */
    /** "Başlık | https://adres | not" satırlarını kaynak listesine çevirir */
    function parseLines(text) {
      return String(text || '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
        const [title, url = '', meta = ''] = l.split('|').map((s) => s.trim());
        let host = '';
        if (/^https?:\/\//i.test(url)) { try { host = new URL(url).hostname.replace(/^www\./, ''); } catch (e) { /* geçersiz adres */ } }
        return { title: title || url, url: host ? url : '', meta: meta || host };
      });
    }

    function sourcesBlock(text, label, cls = '') {
      const list = parseLines(text);
      if (!list.length) return '';
      const li = list.map((s) => `<li>${s.url
        ? `<a href="${esc(s.url)}" target="_blank" rel="noopener"><span class="src-title">${esc(s.title)}</span>${s.meta ? `<span class="src-meta">${esc(s.meta)} ↗</span>` : ''}</a>`
        : `<span class="src-title">${esc(s.title)}</span>${s.meta ? `<span class="src-meta">${esc(s.meta)}</span>` : ''}`}</li>`).join('');
      return `<details class="sources ${cls}"><summary><span class="src-h">${label}</span><span class="src-count">${list.length}</span></summary><ol>${li}</ol></details>`;
    }
    // Kaynaklar yapılandırılmış veride "citation" olarak da verilir (yapay zekâ yanıtlarında güvenilirlik sinyali)
    const citations = (text) => parseLines(text).filter((s) => s.url).map((s) => ({ '@type': 'CreativeWork', name: s.title, url: s.url }));

    // Etiket kutuları: tıklanınca site içi aramayı o etiketle açar
    function chipsBlock(tags, title) {
      if (!(tags || []).length) return '';
      return `<div class="blk">${title ? `<h4>${title}</h4>` : ''}<div class="chips">${tags.map((t) => `<button class="chip" data-q="${esc(t)}">${esc(t)}</button>`).join('')}</div></div>`;
    }

    // Ortak etiketi en çok olan içerikler önce, eşitlikte en yeni
    function relatedBlock(type, item, n = 6) {
      const own = new Set((item.tags || []).map(norm));
      const list = items().filter((i) => !(i.type === type && i.id === item.id))
        .map((i) => [(i.raw.tags || []).filter((t) => own.has(norm(t))).length, i])
        .sort((a, b) => b[0] - a[0] || byDate(a[1], b[1])).slice(0, n).map((x) => x[1]);
      if (!list.length) return '';
      return `<div class="blk rel"><h4>İlgili içerik</h4>${list.map((i) => `<a href="${i.href}">${esc(i.title)}</a>`).join('')}</div>`;
    }

    function prevNext(list, idx, hrefOf, numOf) {
      const prev = list[idx + 1], next = list[idx - 1];
      if (!prev && !next) return '';
      const num = (x) => (numOf ? `<span class="num">${esc(numOf(x))}</span>` : '');
      return `<nav class="epnav">
      ${prev ? `<a class="epnav-card prev" href="${hrefOf(prev)}"><span class="lbl">← Önceki</span>${num(prev)}<span class="t">${esc(prev.title)}</span></a>` : ''}
      ${next ? `<a class="epnav-card next" href="${hrefOf(next)}"><span class="lbl">Sonraki →</span>${num(next)}<span class="t">${esc(next.title)}</span></a>` : ''}
    </nav>`;
    }

    /* ---------- Videolar ve Yazılar: aynı düzende iki sekme ---------- */
    // kind 'video' → Videolar (/videolar/), 'yazi' → Yazılar (/yazilar/); başlık, açıklama ve ışık rengi panelden
    const POST_TABS = {
      video: { key: 'videosPage', route: 'videolar', title: 'Videolar', tint: '#7A1E2E', empty: 'Henüz video yok.' },
      yazi: { key: 'postsPage', route: 'yazilar', title: 'Yazılar', tint: '#7A4E1E', empty: 'Henüz yazı yok.' }
    };
    function postTab(kind) {
      const t = POST_TABS[kind], c = st[t.key] || {};
      return { ...t, name: c.title || t.title, intro: c.intro, tint: c.tint || t.tint };
    }

    /* ---------- Alt kategori parçaları ---------- */
    /** Sekme içi düğmeler: Hepsi + içeriği olan alt kategoriler; her düğme kendi sayfasına gider */
    function catBar(tab, cur) {
      const list = liveCats(tab);
      if (!list.length) return '';
      const b = (route, name, n, on) => `<a href="${href(route)}"${on ? ' class="on" aria-current="page"' : ''}>${esc(name)}<span class="pc">${n}</span></a>`;
      return `<nav class="catbar" aria-label="Alt kategoriler">${b(TAB_ROUTE[tab], 'Hepsi', tabList(tab).length, !cur)}${list.map(([c, n]) => b(catRoute(tab, c), c.name, n, !!cur && cur.id === c.id)).join('')}</nav>`;
    }

    // Kanal bağlantısının metni adresten tanınır
    const CHANNELS = [[/youtube\.com|youtu\.be/, 'YouTube kanalına git'], [/instagram\.com/, 'Instagram hesabına git'], [/tiktok\.com/, 'TikTok hesabına git'], [/spotify\.com/, 'Spotify’da dinle'], [/podcasts\.apple\.com/, 'Apple Podcasts’ta dinle'], [/soundcloud\.com/, 'SoundCloud’da dinle'], [/(^|\.)(x|twitter)\.com$/, 'X hesabına git'], [/facebook\.com/, 'Facebook sayfasına git']];
    const channelUrl = (u) => (/^https?:\/\/[^/\s]+/i.test(u || '') ? u : '');
    function channelLink(u) {
      if (!channelUrl(u)) return '';
      let host = '';
      try { host = new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
      const label = (CHANNELS.find(([re]) => re.test(host)) || [null, 'Kanala git'])[1];
      return `<a class="readlink catlink rise d3" href="${esc(u)}" target="_blank" rel="noopener"><span class="arr">↗</span> ${label}</a>`;
    }

    /** Alt kategori sayfasının başı: sekmeye dönüş bağlantısı, ad, açıklama ve kanal bağlantısı */
    function catHead(back, backHref, c) {
      return `<header class="phead phead-plain phead-cat"><div class="wrap">
        <a class="pkicker rise d1" href="${backHref}">${esc(back)}</a>
        <h1 class="rise d1">${esc(c.name)}</h1>
        ${c.desc ? `<p class="pintro rise d2">${esc(c.desc)}</p>` : ''}
        ${channelLink(c.link)}
      </div></header>`;
    }
    // Açıklaması olmayan alt kategorinin arama sonucu metni: içeriklerinin başlıkları
    const catDesc = (tabName, c, list) => c.desc || `${tabName} › ${c.name}: ${list.slice(0, 4).map((i) => i.title).join(' · ')}`;
    const catExtra = (c) => (c ? { relatedLink: channelUrl(c.link) || undefined } : undefined);

    function listPosts(kind, cat) {
      const t = postTab(kind);
      const all = items().filter((i) => i.type === 'post' && i.fk === kind);
      const list = cat ? all.filter((i) => i.raw.cat === cat.id) : all;
      const route = cat ? catRoute(kind, cat) : t.route;
      const name = cat ? cat.name : t.name;
      const desc = cat ? catDesc(t.name, cat, list) : t.intro;
      return {
        title: name + ' — ' + (cat ? t.name + ' — ' : '') + st.siteName, name, desc, ogType: 'website', modified: list[0] && list[0].date, noindex: !list.length,
        crumbs: crumbs(cat ? [[t.name, t.route], [cat.name, route]] : [[t.name, t.route]]),
        schema: [listNode('CollectionPage', route, name, desc, list, catExtra(cat))],
        html: `<div class="page-wash" style="--wash:${esc(t.tint)}"></div>
      ${cat ? catHead(t.name, href(t.route), cat) : `<header class="phead phead-plain"><div class="wrap">
        <h1 class="rise d1">${esc(t.name)}</h1>
        ${t.intro ? `<p class="pintro rise d2">${esc(t.intro)}</p>` : ''}
      </div></header>`}
      <section class="ix ix-plain"><div class="wrap">
        ${catBar(kind, cat)}
        <div class="feed">${list.length ? list.map((i) => row(i, true, !!cat)).join('') : `<div class="empty-note">${t.empty}</div>`}</div>
      </div></section>`
      };
    }

    function postPage(slug, kind) {
      const list = pub(D.posts).filter((p) => S.postKind(p) === kind);
      const idx = list.findIndex((p) => p.slug === slug);
      const p = list[idx];
      if (!p) return notFound();
      const tab = postTab(kind);
      const postsTitle = tab.name;
      const route = postRoute(p);
      // Video ise üstte oynatıcı, blog yazısıysa aynı yerde kapak görseli
      const yt = S.postKind(p) === 'video' ? S.ytId(p.video) : '';
      const words = S.wordCount((p.excerpt || '') + ' ' + (p.content || ''));
      const prev = list[idx + 1], next = list[idx - 1];
      const bg = yt ? S.ytThumb(p.video, 'hqdefault') : asset(p.cover);
      const alt = p.coverAlt || p.title;
      // Konum satırı: Yazılar › Gıda › etiketler
      const c = catOf(kind, p);
      const ctx = {
        crail: [{ label: postsTitle, href: href(tab.route) }, ...(c ? [{ label: c.name, href: href(catRoute(kind, c)) }] : []), ...withoutCat(p.tags, c).slice(0, c ? 2 : 3).map((t) => ({ label: t }))],
        prev: prev && { href: href(postRoute(prev)), title: prev.title },
        next: next && { href: href(postRoute(next)), title: next.title },
        tint: p.tint, tintSrc: bg, readbar: true
      };
      // Video varsa solda video (kaydırınca sabitlenir), yoksa kapak görseli
      const media = yt
        // Kapsayıcıda giriş animasyonu yok: transform/opacity animasyonu position:fixed'i ve z-index'i kapsayıcıya hapseder
        ? `<div class="vid-slot"><div class="ytlite vidcut" data-yt="${esc(yt)}">
          <img src="https://i.ytimg.com/vi/${esc(yt)}/maxresdefault.jpg" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${esc(yt)}/hqdefault.jpg'" alt="${esc(p.title)}" fetchpriority="high">
          <button class="play" aria-label="Videoyu oynat">${ICON.play}</button>
          <button class="pip-close" aria-label="Videoyu eski yerine geri al">${ICON.close}</button>
        </div></div>`
        : p.cover ? `<figure class="phero-cover rise d1"><img src="${esc(asset(p.cover))}" alt="${esc(alt)}" fetchpriority="high"></figure>` : '';

      const url = pageUrl(route);
      const desc = p.seoDesc || p.excerpt || S.strip(p.content);
      const image = asset(p.ogImage) || (yt ? S.ytThumb(p.video, 'hqdefault') : asset(p.cover));
      const schema = [{
        '@type': 'BlogPosting', '@id': url + '#yazi', mainEntityOfPage: url, url, headline: clip(p.title, 110), description: clip(desc, 300),
        image: abs(image), datePublished: isoDate(p.date), dateModified: isoDate(p.updated || p.date), inLanguage: 'tr-TR',
        author: { '@id': personId() }, publisher: { '@id': personId() }, keywords: (p.tags || []).join(', '), wordCount: words,
        articleSection: c ? c.name : yt ? 'Video' : 'Yazı', video: yt ? { '@id': url + '#video' } : undefined, citation: citations(p.sources)
      }];
      if (yt) {
        schema.push({
          '@type': 'VideoObject', '@id': url + '#video', name: p.title, description: clip(desc, 300) || p.title,
          thumbnailUrl: [S.ytThumb(p.video, 'maxresdefault'), S.ytThumb(p.video, 'hqdefault')], uploadDate: isoDate(p.date),
          embedUrl: 'https://www.youtube.com/embed/' + yt, url: 'https://www.youtube.com/watch?v=' + yt, inLanguage: 'tr-TR', author: { '@id': personId() }
        });
      }

      return {
        title: p.seoTitle || `${p.title} — ${st.siteName}`, name: p.title, desc, image, imageAlt: alt, ogType: 'article',
        published: p.date, modified: p.updated || p.date, tags: p.tags, ctx, schema,
        crumbs: crumbs([[postsTitle, tab.route], ...(c ? [[c.name, catRoute(kind, c)]] : []), [p.title, route]]),
        html: `<article class="post tinted tinted-full" style="--tint:${esc(p.tint || '#2F4A66')}">
      ${bg ? `<img class="ephero-bg" src="${esc(bg)}" alt="">` : ''}
      <div class="ephero-wash"></div>
      <section class="phero${media ? '' : ' no-media'}"><div class="wrap phero-grid">
        ${media}
        <div class="phero-txt">
          <h1 class="rise d2">${esc(p.title)}</h1>
          <div class="phero-meta rise d3"><span>${S.fmtDate(p.date)}</span><span class="sep">·</span><span>${S.fmtNum(words)} kelime</span><span class="sep">·</span><span>${S.readingTime((p.excerpt || '') + ' ' + (p.content || ''))} dk okuma</span>
            ${yt ? `<a class="ytlink" href="https://www.youtube.com/watch?v=${esc(yt)}" target="_blank" rel="noopener">YouTube'da izle →</a>` : ''}</div>
        </div>
      </div></section>
      <div class="wrap">
        ${p.excerpt ? `<p class="vid-spot rise d3">${esc(p.excerpt)}</p>` : ''}
        ${p.content ? `<div class="prose dropcap">${fixHtml(p.content)}</div>` : ''}
        ${sourcesBlock(p.sources, 'Notlar ve kaynaklar')}
        ${sourcesBlock(p.credits, 'Görsel kaynaklar ve lisanslar', 'credits')}
        <div class="afoot">${chipsBlock(p.tags, yt ? 'Bu videodaki kavramlar' : 'Bu yazıdaki kavramlar')}${relatedBlock('post', p)}</div>
        ${prevNext(list, idx, (x) => href(postRoute(x)), (x) => S.fmtDate(x.date))}
      </div>
    </article>`
      };
    }

    /* ---------- Podcast ve Remixler: aynı düzende iki sekme ---------- */
    /** Liste satırı: yuvarlak oynat düğmesi, başlık ve sağda kısa bilgi */
    function audioRow(key, h, audio, title, num, meta) {
      const play = audio
        ? `<button class="epplay" data-play="${key}" aria-label="Dinle">${ICON.play}</button>`
        : `<a class="epplay" href="${h}" aria-label="Aç">${ICON.play}</a>`;
      return `<div class="ep reveal">${play}<a class="ept" href="${h}">${num ? `<span class="epn">${esc(num)}</span>` : ''}${esc(title)}</a><span class="epmeta">${meta.filter(Boolean).map(esc).join(' · ')}</span></div>`;
    }

    /** Liste sayfasının üstü: kare kapak, üst etiket, ad, açıklama, dinleme platformları ve en son içeriğe bağlantı */
    // extra: platform satırından sonra (ör. seri fragmanı düğmesi)
    function showHero(c, name, eyebrow, links, latest, readText, extra = '') {
      // Yalnızca gerçek program/profil adresleri (https://open.spotify.com/ gibi ana sayfalar gösterilmez)
      links = links.filter((l) => isProfile(l[1]));
      return `<div class="page-wash" style="--wash:${esc(c.tint || '#1F5A50')}"></div>
      <section class="pcast"><div class="wrap"><div class="pcast-hero">
        <div class="cover rise d1">${c.cover ? `<img src="${esc(asset(c.cover))}" alt="${esc(name)}" fetchpriority="high">` : ''}</div>
        <div class="pcast-txt">
          <div class="pcast-eyebrow rise d1">${ICON.wave}${esc(c.eyebrow || eyebrow)}</div>
          <h1 class="rise d2">${esc(name)}</h1>
          ${String(c.description || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).map((p) => `<p class="desc rise d3">${nl2br(p)}</p>`).join('')}
          ${links.length ? `<p class="pnote rise d3">Dinle: ${links.map(([l, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${l}</a>`).join(' · ')}</p>` : ''}
          ${extra}
          ${c.note ? `<p class="pnote rise d3">${esc(c.note)}</p>` : ''}
          ${latest ? `<a class="readlink rise d4" href="${latest}"><span class="arr">→</span> ${esc(c.readText || readText)}</a>` : ''}
        </div>
      </div></div></section>`;
    }

    /** Detay sayfasının üstü (bulanık kapak zemini, çerçeveli kapak, başlık) ve kaydırınca yapışan ses çubuğu */
    function audioHero(o) {
      return `<section class="ephero2">
        ${o.cover ? `<img class="ephero-bg" src="${esc(o.cover)}" alt="">` : ''}
        <div class="ephero-wash"></div><div class="ephero-fade"></div>
        <div class="wrap ephero-grid2">
          <div class="ephero-artwrap rise d1">
            <div class="ephero-art2">${o.cover ? `<img src="${esc(o.cover)}" alt="${esc(o.alt)}" fetchpriority="high">` : ''}</div>
            ${o.credit ? `<p class="ephero-cr">${esc(o.credit)}</p>` : ''}
          </div>
          <div class="ephero-txt">
            <div class="ephero-eyebrow rise d1">${o.eyebrow}</div>
            <h1 class="rise d2">${esc(o.title)}</h1>
            ${o.lede ? `<p class="lede rise d3">${esc(o.lede)}</p>` : ''}
            <div class="ephero-meta rise d3">${o.meta.filter(Boolean).map(esc).join('<span class="sep">·</span>')}</div>
          </div>
        </div>
      </section>
      ${o.audio ? `<div class="wrap"><div class="ap-slot"><div class="audioplayer" data-ap="${o.key}"><div class="ap-in">
        <button class="ap-play" data-play="${o.key}" aria-label="Dinle">${ICON.play}</button>
        <div class="ap-bar" role="slider" aria-label="İlerleme"><div class="ap-prog"></div></div>
        <span class="ap-time">0:00</span>
      </div></div></div></div>` : ''}`;
    }

    /* ---------- Podcast: seri vitrini, seri ve bölüm sayfaları ---------- */
    // noSeries: seri sayfasında serinin adı tekrar yazılmaz
    const epRow = (p, noSeries) => audioRow('podcast:' + p.id, href(epRoute(p)), p.audio, p.title, p.number, [noSeries ? '' : (serOf(p) || {}).title, S.fmtDateShort(p.date), p.duration]);

    const podName = () => (st.podcast || {}).name || 'Podcast';
    function seriesNode(s) {
      return {
        '@type': 'PodcastSeries', '@id': pageUrl(seriesRoute(s)) + '#seri', name: s.title, url: pageUrl(seriesRoute(s)),
        description: s.tagline || s.description, image: abs(asset(s.cover)), inLanguage: 'tr-TR', author: { '@id': personId() },
        sameAs: [s.spotify, s.apple, s.youtube].filter(isProfile)
      };
    }

    /** Vitrin kartı: kare kapak (köşede Yakında / Tamamlandı), ad, kısa tanım, bölüm sayısı · yayın sıklığı */
    function seriesCard(s) {
      const n = seriesEps(s).length;
      const badge = s.status === 'yakinda' || s.status === 'tamam' ? `<span class="sbadge">${S.SERIES_STATUS[s.status]}</span>` : '';
      const meta = [n ? n + ' bölüm' : '', s.frequency].filter(Boolean).join(' · ');
      return `<a class="scard reveal" href="${href(seriesRoute(s))}">
        <span class="scover">${s.cover ? `<img src="${esc(asset(s.cover))}" alt="${esc(s.coverAlt || s.title)}" loading="lazy" decoding="async">` : ''}${badge}</span>
        <span class="sbody"><span class="st">${esc(s.title)}</span>${s.tagline ? `<span class="sl">${esc(s.tagline)}</span>` : ''}${meta ? `<span class="sm">${esc(meta)}</span>` : ''}</span>
      </a>`;
    }

    /** /podcast/: tanıtım, seri kapakları ve bütün serilerden son bölümler */
    function podcastIndex() {
      const pc = st.podcast || {};
      const name = podName();
      const sers = seriesList();
      const eps = liveEps();
      return {
        title: name + ' — ' + st.siteName, name, desc: pc.description, image: asset((sers[0] || {}).cover), imageAlt: name, ogType: 'website',
        modified: eps[0] && eps[0].date, noindex: !sers.length, crumbs: crumbs([[name, 'podcast']]),
        schema: [listNode('CollectionPage', 'podcast', name, pc.description, sers.map((s) => ({ href: href(seriesRoute(s)), title: s.title })))],
        html: `<div class="page-wash" style="--wash:${esc(pc.tint || '#1F5A50')}"></div>
      <header class="phead phead-plain phead-pod"><div class="wrap">
        ${pc.eyebrow ? `<div class="pcast-eyebrow rise d1">${ICON.wave}${esc(pc.eyebrow)}</div>` : ''}
        <h1 class="rise d1">${esc(name)}</h1>
        ${pc.description ? `<p class="pintro rise d2">${esc(pc.description)}</p>` : ''}
        ${sers.length ? `<p class="pmeta rise d2">${sers.length} seri · ${eps.length} bölüm</p>` : ''}
      </div></header>
      <section class="ix ix-plain" id="seriler"><div class="wrap">
        ${sers.length ? `<div class="sgrid">${sers.map(seriesCard).join('')}</div>` : '<div class="empty-note">Henüz yayınlanmış seri yok.</div>'}
      </div></section>
      ${eps.length ? `<section class="ix" id="son-bolumler"><div class="wrap">
        <div class="head"><span class="lbl">Son bölümler</span><span class="cnt">bütün serilerden · en yeniden eskiye</span></div>
        <div class="eplist">${eps.slice(0, 6).map((p) => epRow(p)).join('')}</div>
      </div></section>` : ''}`
      };
    }

    /** /podcast/<seri>/: serinin kimliği (kapak, tanıtım, platformlar, fragman) ve bölümleri */
    function seriesPage(s) {
      const list = seriesEps(s);
      const route = seriesRoute(s);
      const name = podName();
      const eyebrow = [name, s.frequency, S.SERIES_STATUS[s.status]].filter(Boolean).join(' · ');
      const links = [['Spotify', s.spotify], ['Apple Podcasts', s.apple], ['YouTube', s.youtube]];
      const emb = S.embed(s.trailer);
      // Oynatıcı çalarken yalnızca .ic içindeki simgeyi değiştirir (oynat ↔ duraklat)
      const trailerBtn = trailerAudio(s) ? `<button class="readlink trailer rise d3" data-play="seri:${esc(s.id)}"><span class="ic">${ICON.play}</span>Fragmanı dinle</button>` : '';
      return {
        title: s.seoTitle || `${s.title} — ${name} — ${st.siteName}`, name: s.title, desc: s.seoDesc || s.tagline || s.description,
        image: asset(s.ogImage) || asset(s.cover), imageAlt: s.coverAlt || s.title, ogType: 'website',
        modified: list[0] && list[0].date, noindex: !list.length, crumbs: crumbs([[name, 'podcast'], [s.title, route]]),
        ctx: { crail: [{ label: name, href: href('podcast') }, { label: s.title, href: href(route) }] },
        schema: [seriesNode(s)],
        html: `${showHero({ ...s, eyebrow }, s.title, name, links, list[0] && href(epRoute(list[0])), 'Son bölümü dinle', trailerBtn)}
      ${emb ? `<div class="wrap"><div class="embedbox trailerbox ${emb.kind}">${emb.html}</div></div>` : ''}
      <section class="ix" id="bolumler"><div class="wrap">
        <div class="head"><span class="lbl">Bölümler</span><span class="cnt">${list.length} bölüm · en yeniden eskiye</span></div>
        <div class="eplist">${list.length ? list.map((p) => epRow(p, true)).join('') : `<div class="empty-note">${s.status === 'yakinda' ? 'Bu seri yakında başlıyor.' : 'Henüz bölüm yok.'}</div>`}</div>
      </div></section>`
      };
    }

    /** /podcast/<seri>/<bolum>/: önceki / sonraki aynı serinin içinde */
    function episodePage(s, slug) {
      const list = seriesEps(s);
      const idx = list.findIndex((x) => x.slug === slug);
      const x = list[idx];
      if (!x) return notFound();
      const name = podName();
      const sRoute = seriesRoute(s);
      const route = epRoute(x);
      const words = S.wordCount(x.description);
      const emb = S.embed(x.embed);
      const prev = list[idx + 1], next = list[idx - 1];
      const cover = asset(x.cover);
      const alt = x.coverAlt || x.title;
      const ctx = {
        crail: [{ label: name, href: href('podcast') }, { label: s.title, href: href(sRoute) }, ...(x.tags || []).slice(0, 2).map((t) => ({ label: t }))],
        prev: prev && { href: href(epRoute(prev)), title: prev.title },
        next: next && { href: href(epRoute(next)), title: next.title },
        tint: x.tint, tintSrc: cover, readbar: true
      };
      const url = pageUrl(route);
      const desc = x.seoDesc || x.excerpt || S.strip(x.description);
      const image = asset(x.ogImage) || cover || asset(s.cover);
      return {
        title: x.seoTitle || `${x.title} — ${s.title}`, name: x.title, desc, image, imageAlt: alt, ogType: 'article',
        published: x.date, modified: x.updated || x.date, tags: x.tags, ctx,
        crumbs: crumbs([[name, 'podcast'], [s.title, sRoute], [x.title, route]]),
        schema: [{
          '@type': 'PodcastEpisode', '@id': url + '#bolum', url, name: x.title, description: clip(desc, 300), datePublished: isoDate(x.date),
          episodeNumber: x.number ? String(x.number) : undefined, image: abs(image), timeRequired: isoDuration(x.duration), inLanguage: 'tr-TR',
          associatedMedia: x.audio ? { '@type': 'MediaObject', contentUrl: x.audio } : undefined,
          partOfSeries: { '@id': pageUrl(sRoute) + '#seri' }, author: { '@id': personId() }, citation: citations(x.sources)
        }, seriesNode(s)],
        html: `<article class="epage tinted" style="--tint:${esc(x.tint || '#3E5640')}">
      ${audioHero({
        cover, alt, credit: x.coverCredit, title: x.title, lede: x.excerpt, key: 'podcast:' + x.id, audio: x.audio,
        eyebrow: `<a href="${href('podcast')}">${esc(name)}</a><span class="sep">·</span><a href="${href(sRoute)}">${esc(s.title)}</a>${x.number ? `<span class="sep">·</span>Bölüm ${esc(x.number)}` : ''}`,
        meta: [S.fmtDate(x.date), x.duration, words > 40 ? S.fmtNum(words) + ' kelime' : '']
      })}
      <div class="wrap">
        ${emb ? `<div class="embedbox ${emb.kind}">${emb.html}</div>` : ''}
        ${x.description ? `<div class="prose dropcap">${fixHtml(x.description)}</div>` : ''}
        <div class="afoot">${chipsBlock(x.tags, '')}${sourcesBlock(x.sources, 'Kaynaklar')}${relatedBlock('podcast', x)}</div>
        ${prevNext(list, idx, (y) => href(epRoute(y)), (y) => (y.number ? 'Bölüm ' + y.number : S.fmtDate(y.date)))}
      </div>
    </article>`
      };
    }

    /* ---------- Remixler (Podcast sekmesinin ikizi) ---------- */
    const REMIX_DESC = 'Yeniden yorumladığım parçalar, editler ve bootlegler.';
    const rmRow = (r) => audioRow('remix:' + r.id, href('remixler/' + r.slug), r.audio, r.title, '', [r.genre, r.bpm ? r.bpm + ' BPM' : '', S.fmtDateShort(r.date)]);
    const remixName = () => (st.remixPage || {}).name || 'Remixler';

    function listRemixes() {
      const rc = st.remixPage || {};
      const list = pub(D.remixes);
      const name = remixName();
      const desc = rc.description || REMIX_DESC;
      const links = [['SoundCloud', rc.soundcloud], ['Mixcloud', rc.mixcloud], ['Spotify', rc.spotify], ['YouTube', rc.youtube]];
      return {
        title: name + ' — ' + st.siteName, name, desc, image: asset(rc.cover), imageAlt: name, ogType: 'website',
        modified: list[0] && list[0].date, noindex: !list.length, crumbs: crumbs([[name, 'remixler']]),
        schema: [listNode('CollectionPage', 'remixler', name, desc, items().filter((i) => i.type === 'remix'))],
        html: `${showHero({ ...rc, tint: rc.tint || '#5A2E4E' }, name, 'Remix', links, list[0] && href('remixler/' + list[0].slug), 'Son Remixi Dinle')}
      <section class="ix" id="parcalar"><div class="wrap">
        <div class="head"><span class="lbl">Parçalar</span><span class="cnt">${list.length} remix · en yeniden eskiye</span></div>
        <div class="eplist">${list.length ? list.map(rmRow).join('') : '<div class="empty-note">Henüz remix yok.</div>'}</div>
      </div></section>`
      };
    }

    function remixPage(slug) {
      const list = pub(D.remixes);
      const idx = list.findIndex((x) => x.slug === slug);
      const x = list[idx];
      if (!x) return notFound();
      const rc = st.remixPage || {};
      const name = remixName();
      const route = 'remixler/' + x.slug;
      const emb = S.embed(x.embed);
      const prev = list[idx + 1], next = list[idx - 1];
      const cover = asset(x.cover);
      const alt = x.coverAlt || x.title;
      const rail = [...new Set([x.genre, ...(x.tags || [])].filter(Boolean))].slice(0, 3);
      const ctx = {
        crail: [{ label: name, href: href('remixler') }, ...rail.map((t) => ({ label: t }))],
        prev: prev && { href: href('remixler/' + prev.slug), title: prev.title },
        next: next && { href: href('remixler/' + next.slug), title: next.title },
        tint: x.tint, tintSrc: cover, readbar: true
      };
      const url = pageUrl(route);
      const desc = x.seoDesc || x.excerpt || [x.original, S.strip(x.description)].filter(Boolean).join(' — ');
      const image = asset(x.ogImage) || cover || asset(rc.cover);
      // Özet yoksa orijinal parça başlığın altında italik görünür; varsa bilgi satırına geçer
      const lede = x.excerpt || x.original;
      return {
        title: x.seoTitle || `${x.title} — ${st.siteName}`, name: x.title, desc, image, imageAlt: alt, ogType: 'music.song',
        published: x.date, modified: x.updated || x.date, tags: x.tags, ctx,
        crumbs: crumbs([[name, 'remixler'], [x.title, route]]),
        schema: [{
          '@type': 'MusicRecording', '@id': url + '#remix', url, name: x.title, description: clip(desc, 300), datePublished: isoDate(x.date),
          byArtist: { '@id': personId() }, genre: x.genre, image: abs(image), duration: isoDuration(x.duration), inLanguage: 'tr-TR',
          recordingOf: x.original ? { '@type': 'MusicComposition', name: x.original } : undefined,
          audio: x.audio ? { '@type': 'AudioObject', contentUrl: x.audio } : undefined, citation: citations(x.sources)
        }],
        html: `<article class="epage tinted" style="--tint:${esc(x.tint || '#5A2E4E')}">
      ${audioHero({
        cover, alt, credit: x.coverCredit, title: x.title, lede, key: 'remix:' + x.id, audio: x.audio,
        eyebrow: `<a href="${href('remixler')}">${esc(name)}</a>${x.genre ? `<span class="sep">·</span>${esc(x.genre)}` : ''}`,
        meta: [x.excerpt && x.original ? 'Orijinal: ' + x.original : '', S.fmtDate(x.date), x.duration, x.bpm ? x.bpm + ' BPM' : '']
      })}
      <div class="wrap">
        ${emb ? `<div class="embedbox ${emb.kind}">${emb.html}</div>` : ''}
        ${x.description ? `<div class="prose dropcap">${fixHtml(x.description)}</div>` : ''}
        <div class="afoot">${chipsBlock(x.tags, '')}${sourcesBlock(x.sources, 'Notlar ve kaynaklar')}${relatedBlock('remix', x)}</div>
        ${prevNext(list, idx, (y) => href('remixler/' + y.slug), (y) => y.genre || S.fmtDate(y.date))}
      </div>
    </article>`
      };
    }

    /* ---------- Hakkında ---------- */
    function aboutPage() {
      const a = D.about || {};
      const photo = asset(a.photo);
      const split = a.heroLeft || a.heroRight
        ? `<span class="as-left rise d2">${nl2br(a.heroLeft)}</span><span class="as-right rise d3">${nl2br(a.heroRight)}</span>`
        : `<span class="as-left rise d2">${esc(a.name || st.siteName)}</span>`;
      const title = 'Hakkında — ' + st.siteName;
      return {
        title, name: a.name || 'Hakkında', desc: [a.role, S.strip((a.lead || '') + ' ' + (a.bio || ''))].filter(Boolean).join('. '),
        image: photo, imageAlt: a.name, ogType: 'profile', crumbs: crumbs([['Hakkında', 'hakkinda']]),
        schema: [{ '@type': 'ProfilePage', '@id': pageUrl('hakkinda'), url: pageUrl('hakkinda'), name: title, inLanguage: 'tr-TR', mainEntity: { '@id': personId() }, isPartOf: { '@id': homeUrl() + '#site' } }],
        html: `<section class="about2" style="--about:${esc(a.accent || '#3A9FF0')}">
      <div class="about-hero">
        ${photo ? `<img src="${esc(photo)}" alt="${esc(a.name || '')}" fetchpriority="high">` : ''}
        <div class="about-hero-grad"></div>
        <h1 class="about-split">${split}</h1>
      </div>
      <div class="wrap"><div class="prose about-prose">
        ${a.lead ? `<h2 class="about-lead-h rise d3">${nl2br(a.lead)}</h2>` : ''}
        ${fixHtml(a.bio)}
      </div></div>
    </section>`
      };
    }

    function customPage(slug) {
      const p = (D.pages || []).find((x) => x.slug === slug && x.published !== false);
      if (!p) return notFound();
      const route = 'sayfa/' + p.slug;
      const cover = asset(p.cover);
      return {
        title: p.seoTitle || `${p.title} — ${st.siteName}`, name: p.title, desc: p.seoDesc || p.excerpt || S.strip(p.content),
        image: asset(p.ogImage) || cover, imageAlt: p.coverAlt || p.title, ogType: 'website', modified: p.updated,
        crumbs: crumbs([[p.title, route]]),
        schema: [{ '@type': 'WebPage', '@id': pageUrl(route), url: pageUrl(route), name: p.title, description: clip(p.seoDesc || p.excerpt || S.strip(p.content), 300), inLanguage: 'tr-TR', isPartOf: { '@id': homeUrl() + '#site' } }],
        html: `<article class="article"><div class="wrap">
      <div class="kicker rise d1">${esc(st.siteName)}</div>
      <h1 class="rise d2">${esc(p.title)}</h1>
      ${p.excerpt ? `<p class="lede rise d3">${esc(p.excerpt)}</p>` : ''}
      ${cover ? `<figure class="cover rise d4"><img src="${esc(cover)}" alt="${esc(p.coverAlt || p.title)}" fetchpriority="high"></figure>` : ''}
      <div class="prose">${fixHtml(p.content)}</div>
    </div></article>`
      };
    }

    function notFound() {
      return {
        status: 404, title: 'Bulunamadı — ' + st.siteName, name: 'Sayfa bulunamadı', desc: 'Aradığınız sayfa burada değil.',
        html: `<section class="nf"><div class="wrap"><h1>404</h1><p>Aradığınız sayfa burada değil.</p><a class="readlink" href="${href('')}"><span class="arr">←</span> Ana sayfaya dön</a></div></section>`
      };
    }

    /**
     * Bir adresin sayfası: { html, title, desc, image, ctx, schema, status, ... }
     * Eski biçimli adreslerde { redirect: 'yeni/adres' } döner.
     */
    function page(route) {
      route = String(route || '').replace(/^\/+|\/+$/g, '');
      const n = normalize(route);
      if (n !== route) return { redirect: n };
      const parts = route.split('/');
      const [seg, arg] = parts;
      let pg;
      // Podcast bölümleri üç parçalı: podcast/seri/bolum
      if (parts.length > (seg === 'podcast' ? 3 : 2)) pg = notFound();
      else {
        switch (seg || '') {
          case '': pg = homePage(); break;
          // İkinci parça içerik ya da alt kategori (aynı bağlantıyı taşırlarsa içerik açılır; panel buna izin vermez)
          case 'videolar': case 'yazilar': {
            const kind = seg === 'videolar' ? 'video' : 'yazi';
            const c = arg && !tabList(kind).some((p) => p.slug === arg) && liveCat(kind, arg);
            pg = c ? listPosts(kind, c) : arg ? postPage(arg, kind) : listPosts(kind);
            break;
          }
          case 'podcast': {
            const s = arg && findSeries(arg);
            pg = !arg ? podcastIndex() : !s ? notFound() : parts[2] ? episodePage(s, parts[2]) : seriesPage(s);
            break;
          }
          case 'remixler': pg = arg ? remixPage(arg) : listRemixes(); break;
          case 'hakkinda': pg = aboutPage(); break;
          case 'sayfa': pg = customPage(arg); break;
          default: pg = notFound();
        }
      }
      pg.route = route;
      pg.desc = clip(S.strip(pg.desc) || st.description || '');
      return pg;
    }

    /** Yayınlanacak bütün adresler (site haritası ve hazır sayfalar) */
    function routes() {
      const menuHas = (t) => visibleMenu().some((m) => m.type === t);
      const r = [''];
      [['video', 'videos'], ['yazi', 'blog']].forEach(([kind, menuType]) => {
        const list = tabList(kind);
        if (list.length || menuHas(menuType)) r.push(POST_TABS[kind].route);
        liveCats(kind).forEach(([c]) => r.push(catRoute(kind, c)));
        list.forEach((p) => r.push(postRoute(p)));
      });
      // Podcast: vitrin, her yayındaki seri (bölümü olmasa da: vitrindeki kart oraya gider) ve bölümler
      const sers = seriesList();
      if (sers.length || menuHas('podcast')) r.push('podcast');
      sers.forEach((s) => r.push(seriesRoute(s)));
      liveEps().forEach((p) => r.push(epRoute(p)));
      if (pub(D.remixes).length || menuHas('remixes')) r.push('remixler');
      pub(D.remixes).forEach((p) => r.push('remixler/' + p.slug));
      const a = D.about || {};
      if (menuHas('about') || a.bio || a.lead) r.push('hakkinda');
      pub(D.pages).forEach((p) => r.push('sayfa/' + p.slug));
      return [...new Set(r)];
    }

    const tabName = (tab) => postTab(tab).name;
    /** İçeriği olan bütün alt kategori sayfaları: { tab, tabName, cat, count, route } */
    const catPages = () => ['video', 'yazi'].flatMap((tab) => liveCats(tab).map(([c, n]) => ({ tab, tabName: tabName(tab), cat: c, count: n, route: catRoute(tab, c) })));

    /** Konum satırı (Yazılar › Gıda › Etiket · Etiket) ve önceki/sonraki bağlantıları */
    function crail(c) {
      if (!c || !c.crail) return null;
      const crumb = c.crail.map((x, i) => {
        // Bağlantılı parçadan (sekme, alt kategori) sonra ›, etiketler arasında ·
        const sep = i === 0 ? '' : c.crail[i - 1].href ? '<span class="sep" aria-hidden="true">›</span>' : '<span class="dot" aria-hidden="true">·</span>';
        return sep + (x.href ? `<a href="${x.href}">${esc(x.label)}</a>` : `<button data-q="${esc(x.label)}">${esc(x.label)}</button>`);
      }).join('');
      const nb =
        (c.prev ? `<a class="cpn" href="${c.prev.href}" title="Önceki: ${esc(c.prev.title)}"><span class="ar">‹</span><span class="t">${esc(c.prev.title)}</span></a>` : '') +
        (c.next ? `<a class="cpn" href="${c.next.href}" title="Sonraki: ${esc(c.next.title)}"><span class="t">${esc(c.next.title)}</span><span class="ar">›</span></a>` : '');
      return { crumb, nb };
    }

    /* ---------- <head>: başlık, açıklama, paylaşım kartları, yapılandırılmış veri ---------- */
    function head(pg) {
      const url = pageUrl(pg.route || '');
      const image = abs(pg.image) || abs(asset(seo.ogImage)) || abs(asset(st.heroImage));
      const imageAlt = pg.image ? (pg.imageAlt || pg.name || '') : st.siteName;
      const name = pg.name || pg.title;
      const xUrl = (socials().find(([k]) => k === 'x') || [])[1];
      const xHandle = xUrl ? '@' + new URL(xUrl).pathname.split('/').filter(Boolean)[0] : '';
      const m = (k, v, attr = 'property') => (v ? `<meta ${attr}="${k}" content="${esc(v)}">` : '');
      const t = [
        `<title>${esc(pg.title)}</title>`,
        m('description', pg.desc, 'name')
      ];
      // Bulunamayan ve henüz boş olan liste sayfaları arama sonuçlarına girmez
      if (pg.status === 404 || pg.noindex) t.push('<meta name="robots" content="noindex">');
      else {
        t.push(`<link rel="canonical" href="${esc(url)}">`);
        t.push('<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">');
      }
      t.push(
        m('og:locale', 'tr_TR'), m('og:site_name', st.siteName), m('og:type', pg.ogType || 'website'),
        m('og:title', name), m('og:description', pg.desc), pg.status === 404 ? '' : m('og:url', url),
        m('og:image', image), image ? m('og:image:alt', imageAlt) : ''
      );
      if (pg.ogType === 'article') {
        t.push(m('article:published_time', isoDate(pg.published)), m('article:modified_time', isoDate(pg.modified)));
        (pg.tags || []).slice(0, 6).forEach((tag) => t.push(m('article:tag', tag)));
      }
      t.push(
        m('twitter:card', image ? 'summary_large_image' : 'summary', 'name'), m('twitter:site', xHandle, 'name'),
        m('twitter:title', name, 'name'), m('twitter:description', pg.desc, 'name'), m('twitter:image', image, 'name'),
        m('google-site-verification', seo.googleVerify, 'name'), m('msvalidate.01', seo.bingVerify, 'name'),
        `<link rel="alternate" type="application/rss+xml" title="${esc(st.siteName)}" href="${esc(base)}feed.xml">`
      );
      if (pg.status !== 404) {
        const graph = [
          { '@type': 'WebSite', '@id': homeUrl() + '#site', url: homeUrl(), name: st.siteName, description: st.description, inLanguage: 'tr-TR', publisher: { '@id': personId() } },
          personNode()
        ];
        if (pg.crumbs && pg.crumbs.length) {
          graph.push({ '@type': 'BreadcrumbList', itemListElement: [{ name: 'Ana sayfa', route: '' }, ...pg.crumbs].map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: pageUrl(c.route) })) });
        }
        (pg.schema || []).forEach((n) => graph.push(n));
        t.push(`<script type="application/ld+json">${JSON.stringify(clean({ '@context': 'https://schema.org', '@graph': graph })).replace(/</g, '\\u003c')}</script>`);
      }
      return t.filter(Boolean).join('\n  ');
    }

    return { href, abs, asset, link, normalize, items, findItem, searchIndex, page, head, navLinks, socials, socialIcons, footerHTML, crail, feedHTML, routes, isActive, pub, catPages, seriesList };
  }

  global.Render = { create, ICON, SOCIAL_ICON, PAGE_SIZE, clip };
})(typeof window !== 'undefined' ? window : globalThis);
