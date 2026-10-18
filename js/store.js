/* ==========================================================================
   Akcan — Veri Katmanı
   Tüm site içeriği tarayıcının localStorage alanında tutulur.
   Site (app.js), kontrol paneli (admin.js) ve yayın derleyicisi (build.js, Node)
   bu dosyayı kullanır; yardımcıların DOM'a ihtiyacı yoktur.
   ========================================================================== */
(function (global) {
  'use strict';

  const KEY = 'akcan.site.v1';

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const PIC = (seed, w = 1600, h = 900) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

  /* ---------- Varsayılan içerik ---------- */
  const O = global.AKCAN_ORNEK || {};
  // Örnek içerik sürümü: yükseltildiğinde, kayıtlı verisi olan tarayıcılara da yeni örnekler bir kez eklenir
  const SAMPLE_VERSION = 2;
  const DEFAULTS = {
    version: 1,
    sampleVersion: SAMPLE_VERSION,
    settings: {
      siteName: 'Akcan',
      tagline: 'Müzik, hikâyeler ve sesler',
      description: 'Blog yazıları, YouTube videoları, podcast bölümleri ve remixlerimi paylaştığım kişisel alan.',
      accent: '#C9F03A',
      heroImage: PIC('akcan-hero', 1920, 1080),
      showStats: true,
      footerText: '© {yil} Akcan. Tüm hakları saklıdır.',
      social: {
        youtube: 'https://www.youtube.com/',
        instagram: 'https://www.instagram.com/',
        x: '',
        spotify: '',
        soundcloud: 'https://soundcloud.com/',
        email: 'merhaba@ornek.com'
      },
      // Yazılar liste sayfası
      postsPage: {
        title: 'Yazılar',
        intro: 'Her hafta yeni bir video ya da yazı yayınlıyorum. Burada hem YouTube videolarımı, yazıya dökülmüş notlarıyla birlikte, hem de blog yazılarımı bulacaksınız.',
        tint: '#7A4E1E'
      },
      // Podcast programı (liste sayfasının üst bölümü)
      podcast: {
        name: 'Frekans',
        eyebrow: 'Podcast · Her Pazartesi',
        description: 'Bazı hikâyeler ancak dinlenerek anlaşılır. Her bölümde müziğin, sesin ve hafızanın izini sürüyorum; görüntüden arınmış, sadece sesin gücüne yaslanan bir yolculuk.',
        note: 'Bölümleri dinleme platformlarından takip edebilir ya da görsellerle zenginleştirilmiş halini okuyup dinlemek için buradan devam edebilirsiniz:',
        cover: PIC('pod-show', 900, 900),
        spotify: 'https://open.spotify.com/',
        apple: 'https://podcasts.apple.com/',
        youtube: '',
        readText: 'Oku + Dinle',
        tint: '#1F5A50'
      },
      featured: {
        mode: 'manual',
        type: 'posts',
        id: O.featuredId || '',
        badge: '',
        customTitle: '',
        customExcerpt: '',
        customImage: '',
        customLink: '',
        customButtonText: '',
        topGradient: true,
        topGradientOpacity: 85
      },
      // Arama motorları ve yapay zekâ (yayınlanan sitede kullanılır)
      seo: {
        siteUrl: '',       // boşsa GitHub Pages adresi kullanılır
        ogImage: '',       // varsayılan paylaşım görseli
        googleVerify: '',  // Google Search Console doğrulama kodu
        bingVerify: '',    // Bing Webmaster Tools doğrulama kodu
        aiTraining: true   // yapay zekâ eğitim botlarına izin (arama botları her zaman serbest)
      },
      adminHash: null // null => varsayılan şifre: admin
    },
    // Örnek içerik js/ornek-icerik.js dosyasından gelir; dosya yoksa site boş başlar
    about: O.about || { name: 'Akcan', role: '', photo: '', heroLeft: '', heroRight: '', lead: '', accent: '#3A9FF0', bio: '' },
    menu: O.menu || [
      { id: 'm1', label: 'Yazılar', type: 'blog', target: '', visible: true, newTab: false },
      { id: 'm3', label: 'Podcast', type: 'podcast', target: '', visible: true, newTab: false },
      { id: 'm4', label: 'Remixler', type: 'remixes', target: '', visible: true, newTab: false },
      { id: 'm6', label: 'Hakkında', type: 'about', target: '', visible: true, newTab: false }
    ],
    // Yazılar sekmesi: kind 'video' (YouTube videosu) ya da 'yazi' (kapak görselli blog yazısı)
    posts: O.posts || [],
    videos: [],
    podcasts: O.podcasts || [],
    remixes: O.remixes || [],
    pages: O.pages || []
  };

  /* ---------- Yardımcılar ---------- */
  const clone = (o) => JSON.parse(JSON.stringify(o));

  function merge(base, over) {
    if (Array.isArray(base)) return Array.isArray(over) ? over : base;
    if (base && typeof base === 'object') {
      const out = { ...base };
      if (over && typeof over === 'object') {
        Object.keys(over).forEach((k) => { out[k] = k in base ? merge(base[k], over[k]) : over[k]; });
      }
      return out;
    }
    return over === undefined ? base : over;
  }

  /**
   * Eski kayıtları güncel yapıya taşır. Değişiklik yaptıysa true döner.
   * Videolar artık Yazılar'ın parçası: her video, aynı kimlikle videolu bir yazıya dönüşür
   * (öne çıkan seçimi ve eski #/video/... bağlantıları bu sayede bozulmaz).
   */
  function migrate(data, raw) {
    let changed = false;
    if ((data.videos || []).length) {
      data.posts = data.posts || [];
      data.videos.forEach((v) => {
        if (data.posts.some((p) => p.id === v.id || p.legacyVideoId === v.id)) return;
        const base = slugify(v.title) || 'video';
        let slug = base, n = 2;
        while (data.posts.some((p) => p.slug === slug)) slug = `${base}-${n++}`;
        data.posts.push({
          id: v.id, legacyVideoId: v.id, title: v.title || '', slug, date: v.date || '',
          cover: '', video: v.url || '', tint: '', featured: !!v.featured, published: v.published !== false,
          tags: v.tags || [], excerpt: v.description || '', content: '', sources: '', credits: ''
        });
      });
      data.videos = [];
      changed = true;
    }
    if ((data.menu || []).some((m) => m.type === 'videos')) {
      const hasBlog = data.menu.some((m) => m.type === 'blog');
      data.menu = hasBlog
        ? data.menu.filter((m) => m.type !== 'videos')
        : data.menu.map((m) => (m.type === 'videos' ? { ...m, type: 'blog', label: 'Yazılar' } : m));
      changed = true;
    }
    const f = data.settings && data.settings.featured;
    if (f && f.type === 'videos') { f.type = 'posts'; changed = true; }
    // Her yazıya tür: videosu olan "video", olmayan "yazi" (kapak görselli blog yazısı)
    (data.posts || []).forEach((p) => {
      if (p.kind !== 'video' && p.kind !== 'yazi') { p.kind = ytId(p.video) ? 'video' : 'yazi'; changed = true; }
    });
    // Podcast bölümleri ve remixler de kimlik yerine okunur adresle açılır (/podcast/bolum-adi/)
    ['podcasts', 'remixes'].forEach((c) => {
      (data[c] || []).forEach((x) => {
        if (x.slug) return;
        const base = slugify(x.title) || (c === 'podcasts' ? 'bolum' : 'remix');
        let slug = base, n = 2;
        while (data[c].some((y) => y.slug === slug)) slug = `${base}-${n++}`;
        x.slug = slug;
        changed = true;
      });
    });
    // Yeni örnek içerikleri, daha önce kaydedilmiş veriye de bir kez ekle (kendi içerikleri silinmez)
    if (raw && !(raw.sampleVersion >= SAMPLE_VERSION)) {
      addSamples(data);
      data.sampleVersion = SAMPLE_VERSION;
      changed = true;
    }
    return changed;
  }

  /** Örnek içeriklerden eksik olanları ekler (kimliği ya da bağlantısı zaten varsa atlar). Eklenen sayısını döner. */
  function addSamples(data) {
    let n = 0;
    ['posts', 'podcasts', 'remixes', 'pages'].forEach((c) => {
      data[c] = data[c] || [];
      (DEFAULTS[c] || []).forEach((x) => {
        if (data[c].some((y) => y.id === x.id || (x.slug && y.slug === x.slug))) return;
        data[c].push(clone(x));
        n++;
      });
    });
    data.menu = data.menu || [];
    (DEFAULTS.menu || []).forEach((m) => {
      if (m.type !== 'page' || data.menu.some((y) => y.type === 'page' && y.target === m.target)) return;
      if (data.pages.some((p) => p.slug === m.target)) data.menu.push(clone(m));
    });
    return n;
  }

  /** Yazılar sekmesindeki bir içeriğin türü: 'video' ya da 'yazi' */
  const postKind = (p) => (p && p.kind === 'yazi' ? 'yazi' : (p && ytId(p.video) ? 'video' : 'yazi'));

  /** Dışarıdan gelen veriyi (yayın dosyası) varsayılanlarla tamamlar; örnek içerik eklemez */
  function normalize(parsed) {
    const data = merge(clone(DEFAULTS), parsed || {});
    migrate(data);
    return data;
  }

  function get() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return normalize();
      const parsed = JSON.parse(raw);
      const data = merge(clone(DEFAULTS), parsed);
      if (migrate(data, parsed)) {
        try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* kota: bir sonraki kayıtta yazılır */ }
      }
      return data;
    } catch (e) {
      console.warn('Veri okunamadı, varsayılanlar yükleniyor.', e);
      return normalize();
    }
  }

  // Kayıttan sonra çalışacak dinleyiciler (panel: otomatik yayın)
  const saveHooks = [];
  const onSave = (fn) => saveHooks.push(fn);

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      saveHooks.forEach((fn) => { try { fn(data); } catch (e) { console.error(e); } });
      return true;
    } catch (e) {
      console.error(e);
      alert('Kaydedilemedi! Tarayıcı depolama alanı dolmuş olabilir. Büyük görselleri dosya yerine bağlantı (URL) olarak eklemeyi deneyin.');
      return false;
    }
  }

  function reset() { localStorage.removeItem(KEY); return get(); }

  function exportJSON() { return JSON.stringify(get(), null, 2); }

  function importJSON(text) {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || !parsed.settings) throw new Error('Geçersiz yedek dosyası');
    const data = merge(clone(DEFAULTS), parsed);
    // Yedekteki içerik olduğu gibi gelsin: örnekler yeniden eklenmez
    data.sampleVersion = SAMPLE_VERSION;
    migrate(data);
    save(data);
    return data;
  }

  function slugify(str) {
    const map = { ç: 'c', ğ: 'g', ı: 'i', İ: 'i', ö: 'o', ş: 's', ü: 'u', Ç: 'c', Ğ: 'g', Ö: 'o', Ş: 's', Ü: 'u', â: 'a', î: 'i', û: 'u' };
    return String(str || '')
      .replace(/[çğıİöşüÇĞÖŞÜâîû]/g, (c) => map[c] || c)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  function fmtDate(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m) return iso;
    return `${d} ${MONTHS[m - 1]} ${y}`;
  }
  /** "12 Eki 2026" — podcast bölüm listesindeki kısa tarih */
  function fmtDateShort(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m) return iso;
    return `${d} ${MONTHS[m - 1].slice(0, 3)} ${y}`;
  }
  const fmtNum = (n) => Number(n || 0).toLocaleString('tr-TR');

  function ytId(url) {
    if (!url) return '';
    const s = String(url).trim();
    if (/^[\w-]{11}$/.test(s)) return s;
    const m = s.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{11})/);
    return m ? m[1] : '';
  }
  /** Gerçek bir profil adresi mi? (https://www.youtube.com/ gibi boş adresler sayılmaz) */
  function isProfile(u) {
    try {
      const x = new URL(String(u || ''));
      return /^https?:$/.test(x.protocol) && x.pathname.replace(/\/+$/, '').length > 0;
    } catch (e) { return false; }
  }

  const ytThumb = (url, q = 'hqdefault') => { const id = ytId(url); return id ? `https://i.ytimg.com/vi/${id}/${q}.jpg` : ''; };

  /** Bağlantıdan uygun gömülü oynatıcı üretir. {html, kind} döner. */
  function embed(url) {
    if (!url) return null;
    const u = String(url).trim();
    const yt = ytId(u);
    if (yt) return { kind: 'video', html: `<iframe src="https://www.youtube-nocookie.com/embed/${yt}" title="YouTube" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>` };
    if (/soundcloud\.com/.test(u)) return { kind: 'audio', html: `<iframe height="166" scrolling="no" allow="autoplay" loading="lazy" src="https://w.soundcloud.com/player/?url=${encodeURIComponent(u)}&color=%23c9f03a&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&visual=false"></iframe>` };
    if (/open\.spotify\.com/.test(u)) {
      const src = u.includes('/embed/') ? u : u.replace('open.spotify.com/', 'open.spotify.com/embed/');
      return { kind: 'audio', html: `<iframe height="152" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" src="${esc(src)}"></iframe>` };
    }
    if (/mixcloud\.com/.test(u)) {
      let path = u; try { path = new URL(u).pathname; } catch (e) { /* yok say */ }
      return { kind: 'audio', html: `<iframe height="120" loading="lazy" src="https://www.mixcloud.com/widget/iframe/?hide_cover=1&dark=1&feed=${encodeURIComponent(path)}"></iframe>` };
    }
    return null;
  }

  /** HTML'den düz metin (DOM gerektirmez) */
  const ENTITY = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };
  function strip(html) {
    return String(html || '')
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|blockquote|figcaption)>/gi, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) => {
        if (e[0] === '#') { const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return n ? String.fromCodePoint(n) : m; }
        return ENTITY[e.toLowerCase()] ?? m;
      })
      .replace(/\s+/g, ' ')
      .trim();
  }

  function wordCount(html) {
    return String(html || '').replace(/<figcaption[\s\S]*?<\/figcaption>/g, ' ').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  }
  function readingTime(html) {
    return Math.max(1, Math.round(wordCount(html) / 200));
  }

  /** Basit, senkron hash (cyrb53). Not: istemci tarafı koruma — gerçek güvenlik sağlamaz. */
  function hash(str) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  }

  global.Store = {
    KEY, DEFAULTS, uid, get, save, onSave, reset, exportJSON, importJSON, normalize,
    slugify, esc, strip, fmtDate, fmtDateShort, fmtNum, isProfile, ytId, ytThumb, embed, wordCount, readingTime, hash, MONTHS,
    postKind, addSamples
  };
})(typeof window !== 'undefined' ? window : globalThis);
