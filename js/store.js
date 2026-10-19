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
  const SAMPLE_VERSION = 4;
  // Sürüm 4'te eklenen örnekler (Gıda ve Gündem alt kategorilerinin yazıları)
  const NEW_SAMPLES_4 = new Set(['yazi-gida', 'yazi-gundem']);

  /* ---------- Örnek içeriği tanıma ---------- */
  const SAMPLE_IDS = new Set(['posts', 'podcasts', 'remixes', 'pages'].flatMap((c) => (O[c] || []).map((x) => x.id)));
  // Sitenin ilk sürümündeki örnekler her açılışta rastgele kimlik alıyordu: başlıklarından tanınır
  const LEGACY_SAMPLES = {
    posts: ['Bir Remix Nasıl Doğar?', 'Kulaklıkla Dinlemek Neden Farklı Hissettirir?', 'Gece Yarısı Stüdyo Notları', 'Stüdyo Turu: Ekipmanlarım ve Çalışma Düzenim', 'Canlı Set: Pazar Akşamı Seansı', 'Sıfırdan Remix Yapımı'],
    podcasts: ['Sesin Hafızası', 'Ritim ve Kalp Atışı', 'Merhaba Dünya: İlk Bölüm'],
    remixes: ['Gece Treni (Akcan Remix)', 'Mavi (Akcan Edit)', 'Yaz Sonu (Akcan Bootleg)'],
    pages: ['Stüdyo & Ekipmanlar']
  };
  // Örnek sürümü 2'nin remixleri (3'te yenileriyle değişti)
  const OLD_SAMPLE_REMIXES = { 'remix-1': 'Gece Treni (Akcan Remix)', 'remix-2': 'Mavi (Akcan Edit)', 'remix-3': 'Yaz Sonu (Akcan Bootleg)', 'remix-4': 'Pazar Sabahı (Akcan Rework)', 'remix-5': 'Liman (Akcan Remix)' };
  /** Örnek içerik mi? Örnekler panelde ve önizlemede görünür, yayına hiç gönderilmez. */
  const isSample = (x) => !!x && (x.sample === true || SAMPLE_IDS.has(x.id));

  /* ---------- Alt kategoriler ---------- */
  // Videolar, Yazılar ve Podcast sekmelerinin her birinin kendi listesi; ilgili sayfa ayarında (cats) durur
  const CAT_KEYS = { video: 'videosPage', yazi: 'postsPage', podcast: 'podcast' };
  const cat = (id, name, desc) => ({ id, name, slug: id, desc, link: '' });
  const startCats = (what) => [
    cat('muzik', 'Müzik', `Prodüksiyon, remix, canlı performans ve sesin hikâyeleri üzerine ${what}.`),
    cat('gida', 'Gıda', `Yemek hikâyeleri: mutfaklardan, sofralardan ve tariflerin arkasındaki insanlardan ${what}.`),
    cat('gundem', 'Gündem', `Gündemi eleştirel bir gözle ele aldığım ${what}.`)
  ];
  /** Bir sekmenin alt kategorileri (tab: 'video' | 'yazi' | 'podcast'); adı ya da bağlantısı olmayanlar sayılmaz */
  const cats = (data, tab) => ((((data && data.settings) || {})[CAT_KEYS[tab]] || {}).cats || []).filter((c) => c && c.id && c.name && c.slug);

  // Veri sürümü: 2 → Videolar ve Yazılar ayrı sekmeler, 3 → alt kategoriler (bkz. migrate)
  const DEFAULTS = {
    version: 3,
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
        tiktok: '',
        x: '',
        linkedin: '',
        spotify: '',
        soundcloud: 'https://soundcloud.com/',
        email: 'merhaba@ornek.com'
      },
      socialOff: [],    // panelde gizlenen hesaplar (adresleri saklı kalır, sitede görünmez)
      navSocial: true,  // görünür hesaplar üst menüde simge olarak da durur
      // Videolar liste sayfası
      videosPage: {
        title: 'Videolar',
        intro: 'Her hafta YouTube’a yeni bir video yüklüyorum. Burada videolarımı, yazıya dökülmüş notları ve kaynaklarıyla birlikte bulacaksınız.',
        tint: '#7A1E2E',
        cats: startCats('videolar')
      },
      // Yazılar (blog) liste sayfası
      postsPage: {
        title: 'Yazılar',
        intro: 'Müzik, prodüksiyon ve sesin hikâyeleri üzerine yazılarım: bazen bir şarkının arkasındaki hikâye, bazen stüdyodan bir not.',
        tint: '#7A4E1E',
        cats: startCats('yazılar')
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
        tint: '#1F5A50',
        cats: startCats('bölümler')
      },
      // Remixler sayfasının üst bölümü (Podcast programının ikizi)
      remixPage: {
        name: 'Remixler',
        eyebrow: 'Remix · Edit · Bootleg',
        description: 'Sevdiğim şarkıları söküp yeniden kuruyorum: gece yarısı remixleri, kulüp için uzatılmış editler ve bir kez çalınıp unutulmaması gereken bootlegler. Her parçanın yanında nasıl yapıldığını anlatan kısa bir not var.',
        note: 'Remixleri dinleme platformlarından takip edebilir ya da her parçanın hikâyesini okuyup dinlemek için buradan devam edebilirsiniz:',
        cover: PIC('remix-show', 900, 900),
        soundcloud: 'https://soundcloud.com/',
        mixcloud: 'https://www.mixcloud.com/',
        spotify: '',
        youtube: '',
        readText: 'Son Remixi Dinle',
        tint: '#5A2E4E'
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
      { id: 'm2', label: 'Videolar', type: 'videos', target: '', visible: true, newTab: false },
      { id: 'm1', label: 'Yazılar', type: 'blog', target: '', visible: true, newTab: false },
      { id: 'm3', label: 'Podcast', type: 'podcast', target: '', visible: true, newTab: false },
      { id: 'm4', label: 'Remixler', type: 'remixes', target: '', visible: true, newTab: false },
      { id: 'm6', label: 'Hakkında', type: 'about', target: '', visible: true, newTab: false }
    ],
    // Videolar ve Yazılar sekmeleri tek koleksiyonda: kind 'video' (YouTube videosu) ya da 'yazi' (kapak görselli blog yazısı)
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

  // Videolar ve yazılar aynı listedeyken Yazılar sayfasının örnek açıklaması
  const OLD_POSTS_INTRO = 'Her hafta yeni bir video ya da yazı yayınlıyorum. Burada hem YouTube videolarımı, yazıya dökülmüş notlarıyla birlikte, hem de blog yazılarımı bulacaksınız.';

  /**
   * Eski kayıtları güncel yapıya taşır. Değişiklik yaptıysa true döner.
   * En eski sürümde ayrı tutulan videolar, aynı kimlikle videolu bir yazıya dönüşür
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
    // 2: Videolar ve Yazılar ayrı sekmeler. Menüye bir kez "Videolar" eklenir (sonradan kaldırılırsa geri gelmez)
    if (!(data.version >= 2)) {
      data.menu = data.menu || [];
      if (!data.menu.some((m) => m.type === 'videos')) {
        const i = data.menu.findIndex((m) => m.type === 'blog');
        const at = i >= 0 ? i : (data.menu[0] && data.menu[0].type === 'home' ? 1 : 0);
        data.menu.splice(at, 0, { id: uid(), label: 'Videolar', type: 'videos', target: '', visible: true, newTab: false });
      }
      // Yazılar sayfasının açıklaması eski örnek metinse (videoları da anlatan) yalnızca yazıları anlatan metinle değişir
      const pp = data.settings && data.settings.postsPage;
      if (pp && pp.intro === OLD_POSTS_INTRO) pp.intro = DEFAULTS.settings.postsPage.intro;
      // Panelde hiç kaydedilmemiş rehber yazısı, yeni sekme düzenini anlatan metinle güncellenir
      const guide = (O.posts || []).find((x) => x.id === 'yazi-rehber');
      const mine = (data.posts || []).find((x) => x.id === 'yazi-rehber' && !x.updated);
      if (guide && mine) mine.content = guide.content;
      data.version = 2;
      changed = true;
    }
    // 3: alt kategoriler. Başlangıç listeleri (Müzik, Gıda, Gündem) varsayılanlardan gelir; örnek içerikler
    // kendi alt kategorilerine yerleşir, dokunulmamış rehber yazısı alt kategorileri de anlatır
    if (!(data.version >= 3)) {
      ['posts', 'podcasts'].forEach((c) => {
        (data[c] || []).forEach((x) => {
          const def = (O[c] || []).find((y) => y.id === x.id);
          if (def && def.cat && !('cat' in x)) x.cat = def.cat;
        });
      });
      const guide = (O.posts || []).find((x) => x.id === 'yazi-rehber');
      const mine = (data.posts || []).find((x) => x.id === 'yazi-rehber' && !x.updated);
      if (guide && mine) mine.content = guide.content;
      data.version = 3;
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
    // İlk sürümün örnekleri yayına gitmesin: başlığı tutan ve içinde panelden yüklenmiş görsel olmayanlar örnek sayılır
    Object.keys(LEGACY_SAMPLES).forEach((c) => {
      (data[c] || []).forEach((x) => {
        if (isSample(x) || !LEGACY_SAMPLES[c].includes(x.title) || JSON.stringify(x).includes('data:')) return;
        x.sample = true;
        changed = true;
      });
    });
    // Yeni örnek içerikleri, daha önce kaydedilmiş veriye de bir kez ekle (kendi içerikleri silinmez).
    // Yalnızca tarayıcıdaki kayıtta çalışır; yayın dosyasına ve yedeklere örnek eklenmez.
    const sv = raw ? raw.sampleVersion || 0 : SAMPLE_VERSION;
    if (sv < 2) addSamples(data);
    // 3: örnek remixler yenilendi. Adı değiştirilmemiş eski örnekler yenileriyle değişir;
    // örnekleri daha önce silmiş olana yeniden eklenmez
    if (sv < 3) {
      const before = (data.remixes || []).length;
      data.remixes = (data.remixes || []).filter((x) => OLD_SAMPLE_REMIXES[x.id] !== x.title);
      if (data.remixes.length < before) addSamples(data, ['remixes']);
    }
    // 4: Gıda ve Gündem alt kategorilerine iki örnek yazı. Örnekleri silmiş olana eklenmez
    if (sv < 4 && (data.posts || []).some(isSample)) addSamples(data, ['posts'], NEW_SAMPLES_4);
    if (sv < SAMPLE_VERSION) { data.sampleVersion = SAMPLE_VERSION; changed = true; }
    return changed;
  }

  /**
   * Örnek içeriklerden eksik olanları ekler (kimliği ya da bağlantısı zaten varsa atlar). Eklenen sayısını döner.
   * only: yalnızca bu kimlikteki örnekler
   */
  function addSamples(data, cols = ['posts', 'podcasts', 'remixes', 'pages'], only) {
    let n = 0;
    cols.forEach((c) => {
      data[c] = data[c] || [];
      (DEFAULTS[c] || []).forEach((x) => {
        if (only && !only.has(x.id)) return;
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
    postKind, addSamples, isSample, CAT_KEYS, cats
  };
})(typeof window !== 'undefined' ? window : globalThis);
