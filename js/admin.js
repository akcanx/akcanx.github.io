/* ==========================================================================
   Akcan — Kontrol Paneli
   İçerik ekleme / düzenleme / silme, menü yönetimi, tema ve yedekleme.
   ========================================================================== */
(function () {
  'use strict';

  const S = window.Store;
  const Yayin = window.Yayin;
  const esc = S.esc;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const view = $('#view');
  let D = S.get();

  const SESSION = 'akcan.admin.session';
  const DEFAULT_HASH = S.hash('admin');
  const today = () => new Date().toISOString().slice(0, 10);
  const byDate = (a, b) => (b.date || '').localeCompare(a.date || '');

  /* ======================================================================
     Yardımcılar
     ====================================================================== */
  function toast(msg, err) {
    const t = document.createElement('div');
    t.className = 'toast' + (err ? ' err' : '');
    t.textContent = msg;
    $('#toasts').appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 2600);
  }

  function persist(msg = 'Kaydedildi') {
    const ok = S.save(D);
    if (ok) toast(msg);
    return ok;
  }

  function crumbs(parts) {
    $('#crumbs').innerHTML = ['<a href="#dashboard">Panel</a>', ...parts.map((p, i) => i === parts.length - 1 ? `<b>${p}</b>` : p)].join(' &nbsp;/&nbsp; ');
  }

  function applyAccent(c) {
    document.documentElement.style.setProperty('--acid', c || D.settings.accent || '#C9F03A');
  }

  function fmtBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1024 / 1024).toFixed(2) + ' MB';
  }

  function storageBytes() { return (localStorage.getItem(S.KEY) || '').length * 2; }

  function uniqueSlug(coll, slug, selfId) {
    let base = slug || 'icerik', s = base, n = 2;
    while ((D[coll] || []).some((x) => x.slug === s && x.id !== selfId)) s = `${base}-${n++}`;
    return s;
  }

  /* Dosyadan görsel seç → yeniden boyutlandır → dataURL */
  function pickImage(cb) {
    const inp = $('#hiddenFile');
    inp.value = '';
    inp.onchange = () => {
      const f = inp.files[0];
      if (!f) return;
      resizeImage(f, 1600, 0.82).then(cb).catch(() => toast('Görsel okunamadı', true));
    };
    inp.click();
  }
  function resizeImage(file, max, q) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => {
        const img = new Image();
        img.onload = () => {
          const s = Math.min(1, max / Math.max(img.width, img.height));
          const w = Math.round(img.width * s), h = Math.round(img.height * s);
          const c = document.createElement('canvas');
          c.width = w; c.height = h;
          c.getContext('2d').drawImage(img, 0, 0, w, h);
          // WebP aynı kalitede daha küçük (sayfa hızı); desteklemeyen tarayıcı PNG döndürürse JPEG
          const webp = c.toDataURL('image/webp', q);
          res(webp.startsWith('data:image/webp') ? webp : c.toDataURL('image/jpeg', q));
        };
        img.onerror = rej;
        img.src = r.result;
      };
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  /* ======================================================================
     Kimlik doğrulama
     ====================================================================== */
  const currentHash = () => D.settings.adminHash || DEFAULT_HASH;
  const isAuthed = () => sessionStorage.getItem(SESSION) === currentHash();

  function showLogin() {
    $('#shell').hidden = true;
    $('#login').hidden = false;
    $('#loginBrand').textContent = D.settings.siteName || 'Panel';
    $('#loginHint').hidden = !!D.settings.adminHash;
    applyAccent();
    setTimeout(() => $('#loginPass').focus(), 50);
  }

  function showApp() {
    $('#login').hidden = true;
    $('#shell').hidden = false;
    $('#sideBrand').textContent = D.settings.siteName || 'Panel';
    applyAccent();
    route();
  }

  $('#loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const p = $('#loginPass').value;
    if (S.hash(p) === currentHash()) {
      sessionStorage.setItem(SESSION, currentHash());
      $('#loginErr').hidden = true;
      $('#loginPass').value = '';
      showApp();
    } else {
      $('#loginErr').hidden = false;
      const card = $('.login-card');
      card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
    }
  });

  $('#logout').addEventListener('click', () => {
    sessionStorage.removeItem(SESSION);
    location.hash = '';
    showLogin();
  });

  /* ======================================================================
     İçerik türleri (şema)
     ====================================================================== */
  // Arama sonucu ve paylaşım önizlemesi; boş bırakılırsa içerikten otomatik üretilir
  const SEO_FIELDS = [
    { k: 'seoTitle', t: 'text', l: 'SEO başlığı', side: 'Arama & paylaşım', ph: 'Boşsa içerik başlığı', help: 'Google sonucundaki mavi başlık. 60 karakteri geçmemesi önerilir.' },
    { k: 'seoDesc', t: 'textarea', l: 'SEO açıklaması', rows: 3, side: 'Arama & paylaşım', ph: 'Boşsa özetten alınır', help: 'Arama sonucunda başlığın altındaki metin. 150–160 karakter önerilir.' },
    { k: 'ogImage', t: 'image', l: 'Paylaşım görseli', side: 'Arama & paylaşım', help: 'WhatsApp, X, LinkedIn önizlemesi. Boşsa kapak / video karesi kullanılır. 1200×630 önerilir.' }
  ];
  const ALT_HELP = 'Görselde ne olduğunu bir cümleyle anlatın. Google Görseller ve ekran okuyucular için; boşsa başlık kullanılır.';

  const TYPES = {
    // Yazı ve video tek türde (sitede tek "Yazılar" sekmesi): video, yazının isteğe bağlı parçası
    // Sitedeki tek "Yazılar" sekmesi: YouTube videoları (öncelikli) ve kapak görselli blog yazıları
    posts: {
      title: 'Yazılar & Videolar', one: 'İçerik', icon: '✎',
      desc: 'Sitedeki Yazılar sekmesinde videolarınız ve blog yazılarınız birlikte listelenir. Video sayfasının üstünde YouTube oynatıcı görünür ve kaydırınca solda sabit kalır; blog yazısında aynı yerde kapak görseli durur.',
      view: (x) => '#/yazilar/' + x.slug,
      thumb: (x) => (S.postKind(x) === 'video' ? S.ytThumb(x.video, 'mqdefault') : x.cover),
      sub: (x) => [S.postKind(x) === 'video' ? '▶ Video' : '✎ Blog yazısı', (x.tags || []).join(', '), x.featured ? '★ Öne çıkan' : ''].filter(Boolean).join(' · '),
      fields: [
        { k: 'kind', t: 'segment', l: 'İçerik türü', options: [['video', '▶ YouTube Videosu', 'Üstte video oynatıcı; kaydırınca solda sabit kalır'], ['yazi', '✎ Blog Yazısı', 'Üstte video yerine kapak görseli']] },
        { k: 'title', t: 'title', l: 'Başlık', req: true },
        { k: 'video', t: 'youtube', l: 'YouTube video bağlantısı', req: true, when: 'video', ph: 'https://www.youtube.com/watch?v=...', help: 'Bağlantıyı yapıştırın; başlık boşsa videonun adı otomatik gelir, küçük resim YouTube’dan alınır.' },
        { k: 'cover', t: 'image', l: 'Kapak görseli', req: true, when: 'yazi', help: 'Yazının üstünde video yerine bu görsel gösterilir; listelerde küçük resim olarak da kullanılır.' },
        { k: 'coverAlt', t: 'text', l: 'Kapak görseli açıklaması (alt metin)', when: 'yazi', ph: 'Görselde ne var?', help: ALT_HELP },
        { k: 'excerpt', t: 'textarea', l: 'Özet', rows: 3, help: 'Sayfanın başında büyük italik giriş olarak, ayrıca listelerde ve ana sayfa manşetinde görünür. Arama sonucunda da açıklama olarak kullanılır.' },
        { k: 'content', t: 'richtext', l: 'İçerik', help: 'Video için videonun yazıya dökülmüş metnini buraya ekleyin: arama motorları ve yapay zekâ videoyu izleyemez, bu metni okur. Görsel eklerken yerleşimi seçebilirsiniz: ortada, sağa yaslı, sola yaslı veya geniş.' },
        { k: 'sources', t: 'textarea', l: 'Notlar ve kaynaklar', rows: 4, ph: 'Başlık | https://adres\nBaşka bir kaynak | https://...', help: 'Her satıra bir kaynak: <code>Başlık | Bağlantı</code>. Yazının sonunda açılır liste olarak görünür.' },
        { k: 'credits', t: 'textarea', l: 'Görsel kaynakları ve lisanslar', rows: 3, ph: 'Kapak: Fotoğrafçı adı, lisans', help: 'Her satıra bir görsel kaynağı. İsteğe bağlı olarak <code>| bağlantı</code> ekleyebilirsiniz.' },
        { k: 'published', t: 'switch', l: 'Yayında', help: 'Kapalıysa taslak olarak saklanır.', side: 'Yayın' },
        { k: 'featured', t: 'switch', l: 'Öne çıkar', help: 'Ana sayfa manşetinde gösterilir.', side: 'Yayın' },
        { k: 'date', t: 'date', l: 'Yayın tarihi', side: 'Yayın' },
        { k: 'slug', t: 'slug', l: 'Bağlantı (slug)', from: 'title', side: 'Yayın', help: 'Boş bırakılırsa başlıktan oluşturulur.' },
        { k: 'tint', t: 'color', l: 'Sayfa tonu', side: 'Görünüm', help: 'Sayfanın arka plan rengi. Boş bırakılırsa videodan / kapaktan otomatik seçilir.' },
        { k: 'tags', t: 'tags', l: 'Kavramlar / etiketler', side: 'Etiketler', help: 'İlk üçü sayfanın üstündeki konum satırında, hepsi yazının sonunda görünür.' },
        ...SEO_FIELDS
      ]
    },
    podcasts: {
      title: 'Podcast Bölümleri', one: 'Bölüm', icon: '◉',
      desc: 'MP3 bağlantısı ekleyerek sitedeki oynatıcıda dinletin veya Spotify / SoundCloud bağlantısı gömün.',
      view: (x) => '#/podcast/' + x.slug,
      thumb: (x) => x.cover, sq: true,
      sub: (x) => [x.number ? 'Bölüm ' + x.number : '', x.duration, x.featured ? '★ Öne çıkan' : ''].filter(Boolean).join(' · '),
      fields: [
        { k: 'title', t: 'title', l: 'Bölüm başlığı', req: true },
        { k: 'excerpt', t: 'textarea', l: 'Özet', rows: 3, help: 'Bölüm sayfasında başlığın altında italik olarak görünür.' },
        { k: 'audio', t: 'url', l: 'Ses dosyası bağlantısı (MP3)', ph: 'https://.../bolum.mp3', help: 'Bölüm sayfasındaki ses çubuğunda çalınır. Podcast barındırma servisinizden (Megaphone, Anchor, Buzzsprout...) MP3 bağlantısını alabilirsiniz.' },
        { k: 'embed', t: 'url', l: 'Gömülü oynatıcı (isteğe bağlı)', ph: 'Spotify, SoundCloud, Mixcloud veya YouTube bağlantısı', help: 'Bölüm sayfasında gömülü oynatıcı olarak gösterilir.' },
        { k: 'description', t: 'richtext', l: 'Bölüm metni', help: 'Bölümün okunabilir hali: görseller ve alıntılarla zenginleştirebilirsiniz. Arama motorları ve yapay zekâ sesi dinleyemez, bu metni okur.' },
        { k: 'sources', t: 'textarea', l: 'Kaynaklar', rows: 4, ph: 'Başlık | https://adres', help: 'Her satıra bir kaynak: <code>Başlık | Bağlantı</code>.' },
        { k: 'published', t: 'switch', l: 'Yayında', side: 'Yayın' },
        { k: 'featured', t: 'switch', l: 'Öne çıkar', help: 'Ana sayfa manşetinde gösterilir.', side: 'Yayın' },
        { k: 'date', t: 'date', l: 'Tarih', side: 'Yayın' },
        { k: 'number', t: 'number', l: 'Bölüm no', side: 'Yayın' },
        { k: 'duration', t: 'text', l: 'Süre', ph: '32 dk', side: 'Yayın' },
        { k: 'slug', t: 'slug', l: 'Bağlantı (slug)', from: 'title', side: 'Yayın', help: 'Bölümün adresi: /podcast/<b>baglanti</b>/. Boş bırakılırsa başlıktan oluşturulur.' },
        { k: 'cover', t: 'image', l: 'Kapak (kare)', sq: true, side: 'Kapak' },
        { k: 'coverAlt', t: 'text', l: 'Kapak açıklaması (alt metin)', ph: 'Görselde ne var?', side: 'Kapak', help: ALT_HELP },
        { k: 'coverCredit', t: 'text', l: 'Kapak görseli kaynağı', ph: 'Fotoğraf: …, lisans', side: 'Kapak' },
        { k: 'tint', t: 'color', l: 'Sayfa tonu', side: 'Görünüm', help: 'Boş bırakılırsa kapaktan otomatik seçilir.' },
        { k: 'tags', t: 'tags', l: 'Etiketler', side: 'Etiketler' },
        ...SEO_FIELDS
      ]
    },
    remixes: {
      title: 'Remixler', one: 'Remix', icon: '♫',
      desc: 'Remixler sekmesi Podcast sekmesiyle aynı düzendedir: üstte sayfa kapağı ve tanıtımı, altında remix listesi. Her remixin kendi sayfasında kaydırınca menünün altına yapışan ses çubuğu ve hikâyesini anlatan metin bulunur.',
      view: (x) => '#/remixler/' + x.slug,
      thumb: (x) => x.cover, sq: true,
      sub: (x) => [x.original, x.genre, x.bpm ? x.bpm + ' BPM' : '', x.featured ? '★ Öne çıkan' : ''].filter(Boolean).join(' · '),
      fields: [
        { k: 'title', t: 'title', l: 'Remix adı', req: true },
        { k: 'original', t: 'text', l: 'Orijinal parça / sanatçı', ph: 'Sanatçı – Şarkı adı', help: 'Özet yoksa başlığın altında italik olarak, varsa bilgi satırında görünür.' },
        { k: 'excerpt', t: 'textarea', l: 'Özet', rows: 3, help: 'Remix sayfasında başlığın altında italik olarak görünür. Arama sonucunda da açıklama olarak kullanılır.' },
        { k: 'audio', t: 'url', l: 'Ses dosyası bağlantısı (MP3)', ph: 'https://.../remix.mp3', help: 'Remix sayfasındaki ses çubuğunda ve listedeki oynat düğmesinde çalınır.' },
        { k: 'embed', t: 'url', l: 'Gömülü oynatıcı (isteğe bağlı)', ph: 'SoundCloud, Mixcloud, Spotify veya YouTube bağlantısı', help: 'Remix sayfasında gömülü oynatıcı olarak gösterilir.' },
        { k: 'description', t: 'richtext', l: 'Remixin hikâyesi', help: 'Fikir, kullandığınız sesler, prodüksiyon notları… Görseller ve alıntılarla zenginleştirebilirsiniz. Arama motorları ve yapay zekâ sesi dinleyemez, bu metni okur.' },
        { k: 'sources', t: 'textarea', l: 'Notlar ve kaynaklar', rows: 4, ph: 'Başlık | https://adres', help: 'Her satıra bir kaynak: <code>Başlık | Bağlantı</code>.' },
        { k: 'published', t: 'switch', l: 'Yayında', side: 'Yayın' },
        { k: 'featured', t: 'switch', l: 'Öne çıkar', help: 'Ana sayfa manşetinde gösterilir.', side: 'Yayın' },
        { k: 'date', t: 'date', l: 'Tarih', side: 'Yayın' },
        { k: 'duration', t: 'text', l: 'Süre', ph: '6:48', side: 'Yayın' },
        { k: 'slug', t: 'slug', l: 'Bağlantı (slug)', from: 'title', side: 'Yayın', help: 'Remixin adresi: /remixler/<b>baglanti</b>/. Boş bırakılırsa başlıktan oluşturulur.' },
        { k: 'genre', t: 'text', l: 'Tür', ph: 'Deep House', side: 'Detaylar' },
        { k: 'bpm', t: 'number', l: 'BPM', ph: '122', side: 'Detaylar' },
        { k: 'cover', t: 'image', l: 'Kapak (kare)', sq: true, side: 'Kapak' },
        { k: 'coverAlt', t: 'text', l: 'Kapak açıklaması (alt metin)', ph: 'Görselde ne var?', side: 'Kapak', help: ALT_HELP },
        { k: 'coverCredit', t: 'text', l: 'Kapak görseli kaynağı', ph: 'Fotoğraf: …, lisans', side: 'Kapak' },
        { k: 'tint', t: 'color', l: 'Sayfa tonu', side: 'Görünüm', help: 'Boş bırakılırsa kapaktan otomatik seçilir.' },
        { k: 'tags', t: 'tags', l: 'Etiketler', side: 'Etiketler', help: 'İlk üçü sayfanın üstündeki konum satırında, hepsi sayfanın sonunda görünür.' },
        ...SEO_FIELDS
      ]
    },
    pages: {
      title: 'Özel Sayfalar', one: 'Sayfa', icon: '▤',
      desc: 'İletişim, Ekipman, Etkinlikler gibi yeni sayfalar oluşturun ve tek tıkla menüye ekleyin.',
      view: (x) => '#/sayfa/' + x.slug,
      thumb: (x) => x.cover,
      sub: (x) => ['/sayfa/' + x.slug, D.menu.some((m) => m.type === 'page' && m.target === x.slug) ? 'Menüde' : '', x.featured ? '★ Öne çıkan' : ''].filter(Boolean).join(' · '),
      fields: [
        { k: 'title', t: 'title', l: 'Sayfa başlığı', req: true },
        { k: 'excerpt', t: 'textarea', l: 'Alt başlık (isteğe bağlı)', rows: 2 },
        { k: 'content', t: 'richtext', l: 'Sayfa içeriği' },
        { k: 'published', t: 'switch', l: 'Yayında', side: 'Yayın' },
        { k: 'featured', t: 'switch', l: 'Öne çıkar', help: 'Ana sayfa manşetinde gösterilir.', side: 'Yayın' },
        { k: 'inMenu', t: 'switch', l: 'Menüde göster', help: 'Üst menüye otomatik eklenir.', side: 'Yayın' },
        { k: 'slug', t: 'slug', l: 'Bağlantı (slug)', from: 'title', side: 'Yayın' },
        { k: 'cover', t: 'image', l: 'Kapak görseli', side: 'Kapak' },
        { k: 'coverAlt', t: 'text', l: 'Kapak açıklaması (alt metin)', ph: 'Görselde ne var?', side: 'Kapak', help: ALT_HELP },
        ...SEO_FIELDS
      ]
    }
  };

  /* Liste sayfalarının üst bölüm ayarları (sitedeki "Yazılar", "Podcast" ve "Remixler" sayfalarının başı) */
  const SECTIONS = {
    posts: {
      key: 'postsPage', title: 'Yazılar Sayfası', btn: 'Sayfa Ayarları',
      desc: 'Sitedeki Yazılar sekmesinin başlığı, açıklaması ve başlığın arkasındaki ışık rengi.',
      fields: [
        { k: 'title', t: 'title', l: 'Sayfa başlığı' },
        { k: 'intro', t: 'textarea', l: 'Açıklama', rows: 4, help: 'Başlığın altında görünür.' },
        { k: 'tint', t: 'color', l: 'Işık rengi', side: 'Görünüm', help: 'Sayfanın üst kısmındaki yumuşak renkli ışık.' }
      ]
    },
    podcasts: {
      key: 'podcast', title: 'Podcast Programı', btn: 'Program Ayarları',
      desc: 'Podcast sayfasının üstünde görünen program kapağı, adı, açıklaması ve dinleme platformları.',
      fields: [
        { k: 'name', t: 'title', l: 'Program adı' },
        { k: 'eyebrow', t: 'text', l: 'Üst etiket', ph: 'Podcast · Her Pazartesi', help: 'Adın üstünde küçük büyük harflerle görünür.' },
        { k: 'description', t: 'textarea', l: 'Açıklama', rows: 4 },
        { k: 'note', t: 'textarea', l: 'Alt not', rows: 2, help: 'Açıklamanın altında küçük yazıyla görünür.' },
        { k: 'readText', t: 'text', l: 'Buton metni', ph: 'Oku + Dinle', help: 'En son bölüme götürür.' },
        { k: 'cover', t: 'image', l: 'Program kapağı (kare)', sq: true, side: 'Kapak' },
        { k: 'spotify', t: 'url', l: 'Spotify', ph: 'https://open.spotify.com/show/...', side: 'Dinleme platformları' },
        { k: 'apple', t: 'url', l: 'Apple Podcasts', ph: 'https://podcasts.apple.com/...', side: 'Dinleme platformları' },
        { k: 'youtube', t: 'url', l: 'YouTube', ph: 'https://www.youtube.com/...', side: 'Dinleme platformları' },
        { k: 'tint', t: 'color', l: 'Işık rengi', side: 'Görünüm' }
      ]
    },
    remixes: {
      key: 'remixPage', title: 'Remixler Sayfası', btn: 'Sayfa Ayarları',
      desc: 'Remixler sayfasının üstünde görünen kapak, ad, açıklama ve dinleme platformları (Podcast programıyla aynı düzen).',
      fields: [
        { k: 'name', t: 'title', l: 'Sayfa adı' },
        { k: 'eyebrow', t: 'text', l: 'Üst etiket', ph: 'Remix · Edit · Bootleg', help: 'Adın üstünde küçük büyük harflerle görünür.' },
        { k: 'description', t: 'textarea', l: 'Açıklama', rows: 4 },
        { k: 'note', t: 'textarea', l: 'Alt not', rows: 2, help: 'Açıklamanın altında küçük yazıyla görünür.' },
        { k: 'readText', t: 'text', l: 'Buton metni', ph: 'Son Remixi Dinle', help: 'En son remixe götürür.' },
        { k: 'cover', t: 'image', l: 'Sayfa kapağı (kare)', sq: true, side: 'Kapak' },
        { k: 'soundcloud', t: 'url', l: 'SoundCloud', ph: 'https://soundcloud.com/...', side: 'Dinleme platformları' },
        { k: 'mixcloud', t: 'url', l: 'Mixcloud', ph: 'https://www.mixcloud.com/...', side: 'Dinleme platformları' },
        { k: 'spotify', t: 'url', l: 'Spotify', ph: 'https://open.spotify.com/artist/...', side: 'Dinleme platformları' },
        { k: 'youtube', t: 'url', l: 'YouTube', ph: 'https://www.youtube.com/...', side: 'Dinleme platformları' },
        { k: 'tint', t: 'color', l: 'Işık rengi', side: 'Görünüm' }
      ]
    }
  };

  function newItem(type, kind) {
    const base = { published: true, date: today(), tags: [] };
    if (type === 'posts') base.kind = kind === 'yazi' ? 'yazi' : 'video';
    if (type === 'podcasts') {
      const max = Math.max(0, ...(D.podcasts || []).map((p) => Number(p.number) || 0));
      base.number = max + 1;
    }
    if (type === 'pages') base.inMenu = true;
    return base;
  }

  /* ======================================================================
     Form alanları
     ====================================================================== */
  const tagChip = (t) => `<span class="tg-i" data-v="${esc(t)}">${esc(t)}<button type="button" aria-label="Kaldır">×</button></span>`;
  const help = (f) => (f.help ? `<small>${f.help}</small>` : '');
  const lbl = (f) => `${f.l}${f.req ? ' <i class="req">*</i>' : ''}`;

  function field(f, val) {
    switch (f.t) {
      case 'title':
        return `<label class="fld fld-title"><input type="text" data-k="${f.k}" value="${esc(val || '')}" placeholder="${esc(f.l)}..."></label>`;
      case 'text': case 'url': case 'number': case 'date': case 'email':
        return `<label class="fld"><span>${lbl(f)}</span><input type="${f.t}" data-k="${f.k}" value="${esc(val ?? '')}" placeholder="${esc(f.ph || '')}">${help(f)}</label>`;
      case 'slug':
        return `<label class="fld"><span>${lbl(f)}</span><input type="text" data-k="${f.k}" data-slug-from="${f.from}" data-touched="${val ? 1 : 0}" value="${esc(val || '')}" placeholder="otomatik">${help(f)}</label>`;
      case 'textarea':
        return `<label class="fld"><span>${lbl(f)}</span><textarea data-k="${f.k}" rows="${f.rows || 4}" placeholder="${esc(f.ph || '')}">${esc(val || '')}</textarea>${help(f)}</label>`;
      case 'switch':
        return `<label class="sw"><span class="swl">${f.l}${f.help ? `<small>${f.help}</small>` : ''}</span><input type="checkbox" data-k="${f.k}" ${val ? 'checked' : ''}><span class="tg"></span></label>`;
      case 'image':
        return `<div class="fld imgf"><span class="fld-l">${f.l}</span>
          <div class="prev ${f.sq ? 'sq' : ''} ${val ? 'has' : ''}" style="${val ? `background-image:url('${esc(val)}')` : ''}">Görsel yüklemek için tıklayın<button type="button" class="x" title="Kaldır">×</button></div>
          <div class="ctl"><input type="url" data-k="${f.k}" value="${esc(val || '')}" placeholder="https://... veya dosya yükleyin"><button type="button" class="btn btn-sm" data-upload>Yükle</button></div>
          ${help(f)}</div>`;
      case 'tags':
        return `<div class="fld"><span class="fld-l">${f.l}</span><div class="tagin" data-tags="${f.k}">${(val || []).map(tagChip).join('')}<input type="text" placeholder="Yazıp Enter'a basın"></div><small>Virgül veya Enter ile ekleyin.</small></div>`;
      case 'youtube': {
        const th = S.ytThumb(val);
        return `<label class="fld"><span>${lbl(f)}</span><input type="url" data-k="${f.k}" data-yt value="${esc(val || '')}" placeholder="${esc(f.ph || '')}"><div class="ytprev ${th ? 'has' : ''}" style="${th ? `background-image:url('${th}')` : ''}"></div>${help(f)}</label>`;
      }
      case 'richtext':
        return `<div class="fld"><span class="fld-l">${f.l}</span>${rte(f.k, val)}${help(f)}</div>`;
      case 'select':
        return `<label class="fld"><span>${lbl(f)}</span><select data-k="${f.k}">${f.options.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(val) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>${help(f)}</label>`;
      case 'segment':
        // Kart görünümlü seçim; değer gizli alanda tutulur, form-grid'e data-[anahtar] olarak yansır
        return `<div class="fld"><span class="fld-l">${lbl(f)}</span><div class="seg" role="radiogroup">${f.options.map(([v, l, sub]) => `<button type="button" role="radio" aria-checked="${v === val}" data-seg="${f.k}" data-v="${esc(v)}" class="${v === val ? 'on' : ''}"><b>${l}</b>${sub ? `<small>${sub}</small>` : ''}</button>`).join('')}</div><input type="hidden" data-k="${f.k}" value="${esc(val || '')}"></div>`;
      case 'color': {
        // Değer metin kutusunda tutulur; boş = otomatik
        const v = /^#[0-9a-f]{6}$/i.test(val || '') ? val.toUpperCase() : '';
        return `<div class="fld"><span class="fld-l">${lbl(f)}</span><div class="colorin"><input type="color" data-color-for="${f.k}" value="${v || '#3A9FF0'}" title="Renk seç"><input type="text" data-k="${f.k}" value="${esc(v)}" placeholder="Otomatik" maxlength="7" spellcheck="false"><button type="button" class="btn btn-sm btn-ghost" data-color-clear="${f.k}">Otomatik</button></div>${help(f)}</div>`;
      }
      default: return '';
    }
  }

  /* Yan sütundaki alanları "side" adına göre kartlarda toplar */
  function sideGroups(fields, item) {
    const groups = [];
    fields.filter((f) => f.side).forEach((f) => {
      let g = groups.find((x) => x[0] === f.side);
      if (!g) groups.push(g = [f.side, []]);
      g[1].push(f);
    });
    return groups.map(([g, fs]) => `<div class="card"><h3>${g}</h3>${fs.map((f) => field(f, item[f.k])).join('')}</div>`).join('');
  }

  function collect(root, fields) {
    const out = {};
    fields.forEach((f) => {
      if (f.t === 'tags') {
        const box = $(`[data-tags="${f.k}"]`, root);
        const pending = $('input', box).value.trim();
        if (pending) addTag(box, pending);
        out[f.k] = $$('.tg-i', box).map((x) => x.dataset.v);
      } else if (f.t === 'richtext') {
        out[f.k] = rteValue($(`.rte[data-rte="${f.k}"]`, root));
      } else {
        const el = $(`[data-k="${f.k}"]`, root);
        if (!el) return;
        if (el.type === 'checkbox') out[f.k] = el.checked;
        else if (f.t === 'number') out[f.k] = el.value === '' ? '' : Number(el.value);
        else out[f.k] = el.value.trim();
      }
    });
    return out;
  }

  function addTag(box, raw) {
    const input = $('input', box);
    raw.split(',').map((s) => s.trim()).filter(Boolean).forEach((t) => {
      if ($$('.tg-i', box).some((x) => x.dataset.v.toLocaleLowerCase('tr') === t.toLocaleLowerCase('tr'))) return;
      input.insertAdjacentHTML('beforebegin', tagChip(t));
    });
    input.value = '';
  }

  function bindForm(root) {
    // Görsel alanları
    $$('.imgf', root).forEach((w) => {
      const input = $('input', w), prev = $('.prev', w);
      const set = (v) => {
        input.value = v;
        prev.classList.toggle('has', !!v);
        prev.style.backgroundImage = v ? `url('${v}')` : '';
        markDirty();
      };
      const upload = () => pickImage((data) => { set(data); toast('Görsel eklendi'); });
      prev.addEventListener('click', (e) => { if (e.target.closest('.x')) { set(''); return; } upload(); });
      $('[data-upload]', w).addEventListener('click', upload);
      input.addEventListener('input', () => { prev.classList.toggle('has', !!input.value); prev.style.backgroundImage = input.value ? `url('${input.value}')` : ''; });
    });

    // Etiketler
    $$('.tagin', root).forEach((box) => {
      const input = $('input', box);
      box.addEventListener('click', (e) => {
        const rm = e.target.closest('.tg-i button');
        if (rm) { rm.parentElement.remove(); markDirty(); return; }
        input.focus();
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); if (input.value.trim()) { addTag(box, input.value); markDirty(); } }
        else if (e.key === 'Backspace' && !input.value) { const last = $$('.tg-i', box).pop(); if (last) { last.remove(); markDirty(); } }
      });
      input.addEventListener('blur', () => { if (input.value.trim()) { addTag(box, input.value); markDirty(); } });
    });

    // Slug otomatik
    $$('[data-slug-from]', root).forEach((sl) => {
      const src = $(`[data-k="${sl.dataset.slugFrom}"]`, root);
      if (!src) return;
      sl.addEventListener('input', () => { sl.dataset.touched = sl.value ? 1 : 0; });
      src.addEventListener('input', () => { if (sl.dataset.touched !== '1') sl.value = S.slugify(src.value); });
    });

    // YouTube önizleme & otomatik başlık
    $$('[data-yt]', root).forEach((inp) => {
      const pv = inp.parentElement.querySelector('.ytprev');
      inp.addEventListener('input', () => {
        const th = S.ytThumb(inp.value);
        pv.classList.toggle('has', !!th);
        pv.style.backgroundImage = th ? `url('${th}')` : '';
        const title = $('[data-k="title"]', root);
        if (th && title && !title.value) {
          title.placeholder = 'Video başlığı YouTube\'dan alınıyor...';
          fetch(`https://noembed.com/embed?url=${encodeURIComponent(inp.value)}`)
            .then((r) => r.json())
            .then((d) => {
              if (d && d.title && !title.value) {
                title.value = d.title;
                markDirty();
                toast('Video başlığı YouTube\'dan alındı: ' + d.title);
              }
            })
            .catch(() => {});
        }
      });
    });

    // Kart seçimi (ör. içerik türü): seçilen değer gizli alana ve forma yazılır
    $$('[data-seg]', root).forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.seg;
      $$(`[data-seg="${k}"]`, root).forEach((x) => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', on); });
      $(`[data-k="${k}"]`, root).value = b.dataset.v;
      root.dataset[k] = b.dataset.v;
      const h = $('.vh h1', view);
      if (k === 'kind' && h) h.textContent = h.textContent.replace(/Video|Blog Yazısı/, b.dataset.v === 'video' ? 'Video' : 'Blog Yazısı');
      markDirty();
    }));

    // Renk alanları: seçici ↔ metin kutusu
    $$('[data-color-for]', root).forEach((pick) => {
      const k = pick.dataset.colorFor;
      const txt = $(`[data-k="${k}"]`, root);
      pick.addEventListener('input', () => { txt.value = pick.value.toUpperCase(); markDirty(); });
      txt.addEventListener('input', () => { if (/^#[0-9a-f]{6}$/i.test(txt.value)) pick.value = txt.value; });
      const clr = $(`[data-color-clear="${k}"]`, root);
      if (clr) clr.addEventListener('click', () => { txt.value = ''; markDirty(); });
    });

    // Zengin metin editörleri
    $$('.rte', root).forEach(bindRte);
  }

  /* ======================================================================
     Zengin metin editörü
     ====================================================================== */
  const RTE_BTNS = [
    ['bold', '<b>B</b>', 'Kalın (Ctrl+B)'], ['italic', '<i>I</i>', 'İtalik (Ctrl+I)'], ['underline', '<u>U</u>', 'Altı çizili'], ['|'],
    ['h2', 'H2', 'Başlık'], ['h3', 'H3', 'Alt başlık'], ['p', '¶', 'Paragraf'], ['quote', '❝', 'Alıntı'], ['cite', '❝ Kaynaklı', 'Kaynağı yazılı alıntı'], ['|'],
    ['ul', '• Liste', 'Madde işaretli liste'], ['ol', '1. Liste', 'Numaralı liste'], ['hr', '—', 'Ayraç çizgisi'], ['|'],
    ['link', 'Bağlantı', 'Bağlantı ekle'], ['unlink', '⊘', 'Bağlantıyı kaldır'], ['image', '▣ Görsel', 'Görsel ekle: ortada, sağa/sola yaslı veya geniş'], ['youtube', '▶ Video', 'YouTube videosu göm'], ['|'],
    ['clear', 'Tx', 'Biçimi temizle'], ['undo', '↶', 'Geri al'], ['redo', '↷', 'Yinele'], ['source', '&lt;/&gt;', 'HTML kaynağını düzenle']
  ];

  /* Metin arası görsel: sitedeki .epfig düzenleri (ortada / sağa yaslı / sola yaslı / geniş) */
  const FIG_FIELDS = [
    { k: 'src', t: 'image', l: 'Görsel' },
    { k: 'layout', t: 'select', l: 'Yerleşim', options: [['center', 'Ortada — metin sütununda'], ['right', 'Sağa yaslı — metin solundan akar'], ['left', 'Sola yaslı — metin sağından akar'], ['wide', 'Geniş — metin sütunundan taşar']] },
    { k: 'caption', t: 'text', l: 'Açıklama', ph: 'Görselin altında görünür' },
    { k: 'credit', t: 'text', l: 'Kaynak / lisans', ph: 'Fotoğraf: …, Wikimedia Commons · CC BY-SA 4.0' }
  ];
  const LAYOUT_CLS = { center: '', right: ' flo flo-right', left: ' flo flo-left', wide: ' wide' };

  function figureHTML(v) {
    const cap = v.caption || v.credit ? `<figcaption>${esc(v.caption || '')}${v.credit ? `<span class="cr">${esc(v.credit)}</span>` : ''}</figcaption>` : '';
    return `<figure class="epfig${LAYOUT_CLS[v.layout] || ''}" contenteditable="false"><img src="${esc(v.src)}" alt="${esc(v.caption || '')}">${cap}</figure>`;
  }

  function figureValues(fig) {
    const img = $('img', fig), cap = $('figcaption', fig), cr = cap && $('.cr', cap);
    const c = fig.classList;
    return {
      src: img ? img.getAttribute('src') : '',
      caption: cap ? [...cap.childNodes].filter((n) => n !== cr).map((n) => n.textContent).join('').trim() : '',
      credit: cr ? cr.textContent.trim() : '',
      layout: c.contains('wide') ? 'wide' : c.contains('flo-left') ? 'left' : c.contains('flo') ? 'right' : 'center'
    };
  }

  /* Küçük form penceresi; kapatılırsa null, "Kaldır" ile { _remove: true } döner */
  function dialog({ title, fields, values = {}, submit = 'Ekle', remove = false }) {
    return new Promise((resolve) => {
      const back = document.createElement('div');
      back.className = 'dlg-back';
      back.innerHTML = `<form class="dlg" novalidate><h3>${title}</h3>${fields.map((f) => field(f, values[f.k])).join('')}
        <div class="dlg-foot">${remove ? '<button type="button" class="btn btn-danger" data-dlg-rm>Kaldır</button>' : ''}<span class="dlg-sp"></span><button type="button" class="btn btn-ghost" data-dlg-cancel>Vazgeç</button><button type="submit" class="btn btn-acid">${submit}</button></div></form>`;
      document.body.appendChild(back);
      const frm = $('.dlg', back);
      bindForm(frm);
      const onKey = (e) => { if (e.key === 'Escape') done(null); };
      function done(v) { back.remove(); document.removeEventListener('keydown', onKey); resolve(v); }
      document.addEventListener('keydown', onKey);
      back.addEventListener('mousedown', (e) => { if (e.target === back) done(null); });
      $('[data-dlg-cancel]', back).addEventListener('click', () => done(null));
      const rm = $('[data-dlg-rm]', back);
      if (rm) rm.addEventListener('click', () => done({ _remove: true }));
      frm.addEventListener('submit', (e) => { e.preventDefault(); done(collect(frm, fields)); });
      setTimeout(() => { const first = $('input[type=url], input[type=text], textarea', frm); if (first) first.focus(); }, 30);
    });
  }

  function rte(key, html) {
    const bar = RTE_BTNS.map((b) => b[0] === '|' ? '<span class="sep"></span>' : `<button type="button" data-cmd="${b[0]}" title="${b[2]}">${b[1]}</button>`).join('');
    return `<div class="rte" data-rte="${key}"><div class="rte-bar">${bar}</div><div class="rte-body" contenteditable="true" data-ph="Yazmaya başlayın...">${html || ''}</div><textarea class="rte-src" hidden spellcheck="false"></textarea></div>`;
  }

  function rteValue(r) {
    if (!r) return '';
    const src = $('.rte-src', r);
    let html = src.hidden ? $('.rte-body', r).innerHTML : src.value;
    html = html.replace(/\s*contenteditable="false"/g, '').trim();
    if (/^(<p>)?(<br\s*\/?>)?(<\/p>)?$/i.test(html)) return '';
    return html;
  }

  const ALLOWED = { P: 1, BR: 1, B: 1, STRONG: 1, I: 1, EM: 1, U: 1, A: 1, H2: 1, H3: 1, UL: 1, OL: 1, LI: 1, BLOCKQUOTE: 1, IMG: 1, HR: 1, FIGURE: 1, FIGCAPTION: 1, SPAN: 1 };
  function sanitize(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 8) { n.remove(); return; }
        if (n.nodeType !== 1) return;
        walk(n);
        let tag = n.tagName;
        if (tag === 'H1') tag = 'H2';
        if (tag === 'H4' || tag === 'H5' || tag === 'H6') tag = 'H3';
        if (tag === 'DIV') tag = 'P';
        // span yalnızca görsel kaynağı (.cr) ve alıntı kaynağı (.bq-kim) olarak korunur
        if (!ALLOWED[tag] || (tag === 'SPAN' && !/^(cr|bq-kim)$/.test(n.getAttribute('class') || ''))) { n.replaceWith(...n.childNodes); return; }
        const el = document.createElement(tag);
        if (tag === 'SPAN') el.className = n.getAttribute('class');
        if (tag === 'FIGURE') el.className = (n.getAttribute('class') || '').split(/\s+/).filter((c) => /^(epfig|flo|flo-right|flo-left|wide)$/.test(c)).join(' ') || 'epfig';
        if (tag === 'A' && n.getAttribute('href')) el.setAttribute('href', n.getAttribute('href'));
        if (tag === 'IMG') { if (!n.getAttribute('src')) { n.remove(); return; } el.setAttribute('src', n.getAttribute('src')); el.setAttribute('alt', n.getAttribute('alt') || ''); }
        el.append(...n.childNodes);
        n.replaceWith(el);
      });
    };
    walk(doc.body);
    return doc.body.innerHTML;
  }

  function bindRte(r) {
    const body = $('.rte-body', r), src = $('.rte-src', r), bar = $('.rte-bar', r);
    try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (e) { /* yok say */ }
    // Görseller tek parça: içine yazılmaz, tıklanınca düzenleme penceresi açılır
    const lockFigures = () => $$('figure', body).forEach((f) => f.setAttribute('contenteditable', 'false'));
    lockFigures();
    body.addEventListener('click', (e) => {
      const fig = e.target.closest('figure');
      if (!fig || !body.contains(fig)) return;
      e.preventDefault();
      dialog({ title: 'Görseli düzenle', fields: FIG_FIELDS, values: figureValues(fig), submit: 'Kaydet', remove: true }).then((v) => {
        if (!v) return;
        if (v._remove) fig.remove();
        else if (v.src) fig.outerHTML = figureHTML(v);
        markDirty();
      });
    });

    bar.addEventListener('mousedown', (e) => { if (e.target.closest('button')) e.preventDefault(); });
    bar.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-cmd]');
      if (b) cmd(b.dataset.cmd);
    });

    body.addEventListener('paste', (e) => {
      const cd = e.clipboardData;
      if (!cd) return;
      e.preventDefault();
      const html = cd.getData('text/html');
      if (html) document.execCommand('insertHTML', false, sanitize(html));
      else {
        const txt = cd.getData('text/plain');
        const paras = txt.split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
        document.execCommand('insertHTML', false, paras);
      }
    });

    const updState = () => {
      if (!body.contains(window.getSelection().anchorNode)) return;
      ['bold', 'italic', 'underline'].forEach((c) => {
        const btn = $(`[data-cmd="${c}"]`, bar);
        try { btn.classList.toggle('on', document.queryCommandState(c)); } catch (e) { /* yok say */ }
      });
    };
    document.addEventListener('selectionchange', updState);

    function cmd(c) {
      if (c === 'source') {
        const toSrc = src.hidden;
        if (toSrc) { src.value = body.innerHTML.replace(/></g, '>\n<'); src.style.height = Math.max(320, body.offsetHeight) + 'px'; }
        else { body.innerHTML = src.value; lockFigures(); }
        src.hidden = !toSrc; body.hidden = toSrc;
        $(`[data-cmd="source"]`, bar).classList.toggle('on', toSrc);
        return;
      }
      if (!src.hidden) { toast('Önce HTML kaynağı modundan çıkın', true); return; }
      body.focus();
      const sel = window.getSelection();
      const range = sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
      const restore = () => { body.focus(); if (range) { sel.removeAllRanges(); sel.addRange(range); } };
      const ex = (name, val) => document.execCommand(name, false, val);

      switch (c) {
        case 'bold': case 'italic': case 'underline': case 'undo': case 'redo': ex(c); break;
        case 'h2': ex('formatBlock', '<h2>'); break;
        case 'h3': ex('formatBlock', '<h3>'); break;
        case 'p': ex('formatBlock', '<p>'); break;
        case 'quote': ex('formatBlock', '<blockquote>'); break;
        case 'ul': ex('insertUnorderedList'); break;
        case 'ol': ex('insertOrderedList'); break;
        case 'hr': ex('insertHorizontalRule'); break;
        case 'unlink': ex('unlink'); break;
        case 'clear': ex('removeFormat'); ex('formatBlock', '<p>'); break;
        case 'link': {
          const u = prompt('Bağlantı adresi (URL):', 'https://');
          restore();
          if (u && u !== 'https://') {
            if (sel.isCollapsed) ex('insertHTML', `<a href="${esc(u)}">${esc(u)}</a>`);
            else ex('createLink', u);
          }
          break;
        }
        case 'image': {
          dialog({ title: 'Görsel ekle', fields: FIG_FIELDS, values: { layout: 'center' } }).then((v) => {
            if (!v || !v.src) return;
            restore();
            ex('insertHTML', figureHTML(v) + '<p><br></p>');
            markDirty();
          });
          break;
        }
        case 'cite': {
          const fields = [{ k: 'text', t: 'textarea', l: 'Alıntı', rows: 3 }, { k: 'source', t: 'text', l: 'Kaynak', ph: 'Kişi, eser (yıl)' }];
          dialog({ title: 'Kaynaklı alıntı', fields }).then((v) => {
            if (!v || !v.text) return;
            const q = /^[“"«]/.test(v.text) ? v.text : `“${v.text}”`;
            restore();
            ex('insertHTML', `<blockquote><p>${esc(q)}${v.source ? `<br><span class="bq-kim">${esc(v.source)}</span>` : ''}</p></blockquote><p><br></p>`);
            markDirty();
          });
          break;
        }
        case 'youtube': {
          const u = prompt('YouTube video bağlantısı:', '');
          if (!u) break;
          const id = S.ytId(u);
          restore();
          if (id) ex('insertHTML', `<div class="embed" contenteditable="false"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="YouTube" allowfullscreen></iframe></div><p><br></p>`);
          else toast('Geçerli bir YouTube bağlantısı değil', true);
          break;
        }
      }
      markDirty();
      updState();
    }
  }

  /* ======================================================================
     Kirli durum (kaydedilmemiş değişiklik) takibi
     ====================================================================== */
  let dirty = false, lastHash = location.hash, skipGuard = false;
  const markDirty = () => { if (view.dataset.form) dirty = true; };
  view.addEventListener('input', markDirty);
  view.addEventListener('change', markDirty);
  window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  function go(hash) { dirty = false; if (location.hash === hash) route(); else location.hash = hash; }

  window.addEventListener('hashchange', () => {
    if (skipGuard) { skipGuard = false; return; }
    if (dirty && !confirm('Kaydedilmemiş değişiklikler var. Yine de ayrılmak istiyor musunuz?')) {
      skipGuard = true;
      location.hash = lastHash;
      return;
    }
    dirty = false;
    lastHash = location.hash;
    if (isAuthed()) route();
  });

  /* ======================================================================
     Yönlendirme
     ====================================================================== */
  function route() {
    if (!isAuthed()) { showLogin(); return; }
    const [v = 'dashboard', a, id] = location.hash.slice(1).split('/');
    lastHash = location.hash;
    closeSide();
    delete view.dataset.form;
    $$('#sideNav a').forEach((x) => x.classList.toggle('on', x.dataset.v === (v || 'dashboard')));
    $('#topActions').innerHTML = '';
    view.style.animation = 'none'; void view.offsetWidth; view.style.animation = '';
    window.scrollTo(0, 0);

    // Videolar, Yazılar'a katıldı (videolar aynı kimlikle yazıya dönüştü)
    if (v === 'videos') { location.replace(a === 'edit' && id ? `#posts/edit/${id}` : '#posts'); return; }
    if (TYPES[v]) {
      if (a === 'settings' && SECTIONS[v]) return sectionView(v);
      if (a === 'new') return formView(v, null, id); // #posts/new/video ya da #posts/new/yazi
      if (a === 'edit') return formView(v, id);
      return listView(v);
    }
    switch (v) {
      case 'featured': return featuredView();
      case 'menu': return menuView();
      case 'about': return aboutView();
      case 'settings': return settingsView();
      case 'yayin': return publishView();
      case 'backup': return backupView();
      default: return dashboard();
    }
  }

  /* ======================================================================
     Öne Çıkan (Hero) Yardımcısı
     ====================================================================== */
  function resolveHeroPreview(data, featOverride) {
    const st = (data && data.settings) || {};
    const feat = featOverride || st.featured || {};
    const mode = feat.mode || 'manual';

    if (mode === 'custom') {
      return {
        title: feat.customTitle || st.siteName || 'Özel Manşet Başlığı',
        eyebrow: feat.badge || 'ÖZEL MANŞET',
        date: '',
        excerpt: feat.customExcerpt || 'Özel manşet açıklaması buraya gelecek.',
        cover: feat.customImage || st.heroImage || '',
        href: feat.customLink || '#/',
        btnText: feat.customButtonText || 'İncele'
      };
    }

    const colls = [
      { type: 'posts', label: 'Yazı', btn: 'Oku', href: (x) => '#/yazilar/' + x.slug, thumb: (x) => (S.postKind(x) === 'video' ? S.ytThumb(x.video, 'maxresdefault') : x.cover), excerpt: (x) => x.excerpt },
      { type: 'podcasts', label: 'Podcast', btn: 'Dinle', href: (x) => '#/podcast/' + x.slug, thumb: (x) => x.cover, excerpt: (x) => (x.description || '').replace(/<[^>]+>/g, '') },
      { type: 'remixes', label: 'Remix', btn: 'Dinle', href: (x) => '#/remixler/' + x.slug, thumb: (x) => x.cover, excerpt: (x) => x.excerpt || x.original || (x.description || '').replace(/<[^>]+>/g, '') },
      { type: 'pages', label: 'Sayfa', btn: 'İncele', href: (x) => '#/sayfa/' + x.slug, thumb: (x) => x.cover, excerpt: (x) => x.excerpt }
    ];

    if (mode === 'manual') {
      let targetItem = null, targetColl = null;
      if (feat.id) {
        for (const c of colls) {
          const it = (data[c.type] || []).find((x) => x.id === feat.id);
          if (it) { targetItem = it; targetColl = c; break; }
        }
      }
      if (!targetItem) {
        for (const c of colls) {
          const it = (data[c.type] || []).find((x) => x.featured && x.published !== false);
          if (it) { targetItem = it; targetColl = c; break; }
        }
      }
      if (targetItem && targetColl) {
        const vid = targetColl.type === 'posts' && S.postKind(targetItem) === 'video';
        return {
          item: targetItem,
          type: targetColl.type,
          title: feat.customTitle || targetItem.title,
          eyebrow: feat.badge || `Öne çıkan ${vid ? 'video' : targetColl.label.toLowerCase()}`,
          date: targetItem.date,
          excerpt: feat.customExcerpt !== undefined && feat.customExcerpt !== '' ? feat.customExcerpt : (targetColl.excerpt(targetItem) || ''),
          cover: feat.customImage || targetColl.thumb(targetItem) || st.heroImage || '',
          href: feat.customLink || targetColl.href(targetItem),
          btnText: feat.customButtonText || (vid ? 'İzle' : targetColl.btn)
        };
      }
    }

    // Latest mode or fallback:
    const all = [
      ...(data.posts || []).map((x) => ({ ...x, _t: 'posts' })),
      ...(data.podcasts || []).map((x) => ({ ...x, _t: 'podcasts' })),
      ...(data.remixes || []).map((x) => ({ ...x, _t: 'remixes' }))
    ].filter((x) => x.published !== false).sort(byDate);

    const latest = all[0];
    if (latest) {
      const c = colls.find((x) => x.type === latest._t) || colls[0];
      const vid = latest._t === 'posts' && S.postKind(latest) === 'video';
      return {
        item: latest,
        type: latest._t,
        title: feat.customTitle || latest.title,
        eyebrow: feat.badge || `Son ${vid ? 'video' : c.label.toLowerCase()}`,
        date: latest.date,
        excerpt: feat.customExcerpt !== undefined && feat.customExcerpt !== '' ? feat.customExcerpt : (c.excerpt(latest) || ''),
        cover: feat.customImage || c.thumb(latest) || st.heroImage || '',
        href: feat.customLink || c.href(latest),
        btnText: feat.customButtonText || (vid ? 'İzle' : c.btn)
      };
    }

    return {
      title: feat.customTitle || st.siteName || 'Öne Çıkan Başlık',
      eyebrow: feat.badge || 'Öne Çıkan',
      date: '',
      excerpt: feat.customExcerpt || '',
      cover: feat.customImage || st.heroImage || '',
      href: '#/',
      btnText: feat.customButtonText || 'İncele'
    };
  }

  /* ======================================================================
     Gösterge paneli
     ====================================================================== */
  function dashboard() {
    crumbs(['Gösterge Paneli']);
    const cnt = (k) => (D[k] || []).length;
    const all = [
      ...(D.posts || []).map((x) => ({ ...x, _t: 'posts', _l: S.postKind(x) === 'video' ? 'Video' : 'Yazı' })),
      ...(D.podcasts || []).map((x) => ({ ...x, _t: 'podcasts', _l: 'Podcast' })),
      ...(D.remixes || []).map((x) => ({ ...x, _t: 'remixes', _l: 'Remix' }))
    ].sort(byDate).slice(0, 8);
    const used = storageBytes(), limit = 5 * 1024 * 1024;
    const pct = Math.min(100, (used / limit) * 100);
    const hour = new Date().getHours();
    const greet = hour < 6 ? 'İyi geceler' : hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar';

    const activeHero = resolveHeroPreview(D);
    const guide = (D.posts || []).find((p) => p.id === 'yazi-rehber');
    const heroDate = activeHero.date ? ` · ${S.fmtDate(activeHero.date)}` : '';

    view.innerHTML = `
      <div class="vh"><div><h1>${greet} 👋</h1><p>${esc(D.settings.siteName)} sitesinin tüm içeriğini buradan yönetebilirsiniz.</p></div>
        <div class="vh-actions"><a class="btn btn-ghost" href="index.html" target="_blank">Siteyi Görüntüle ↗</a></div></div>
      ${!D.settings.adminHash ? `<div class="alert warn"><span>⚠</span><div><b>Varsayılan şifreyi kullanıyorsunuz.</b> Güvenliğiniz için <a href="#settings" style="text-decoration:underline">Ayarlar</a> bölümünden şifrenizi değiştirin.</div></div>` : ''}
      ${!Yayin.ready() ? `<div class="alert"><span>⇪</span><div><b>Site henüz yayına bağlı değil.</b> GitHub bağlantısını kurun; kaydettiğiniz her şey otomatik olarak yayına gitsin: <a href="#yayin" style="text-decoration:underline">Yayın &amp; SEO</a>.</div></div>` : ''}
      ${guide ? `<div class="alert"><span>ℹ</span><div><b>Örnek içerikler yüklü.</b> Her özelliğin nasıl kullanıldığını <a href="index.html#/yazilar/${esc(guide.slug)}" target="_blank" style="text-decoration:underline">“${esc(guide.title)}”</a> yazısında görebilir, <a href="#posts/edit/${guide.id}" style="text-decoration:underline">panelde nasıl hazırlandığını</a> inceleyebilirsiniz. Örnekleri ilgili listelerden silebilirsiniz.</div></div>` : ''}
      <div class="stats">
        <a class="stat" href="#posts"><span class="ic">▶</span><div class="n">${(D.posts || []).filter((x) => S.postKind(x) === 'video').length}</div><div class="l">Video</div></a>
        <a class="stat" href="#posts"><span class="ic">✎</span><div class="n">${(D.posts || []).filter((x) => S.postKind(x) === 'yazi').length}</div><div class="l">Blog Yazısı</div></a>
        <a class="stat" href="#podcasts"><span class="ic">◉</span><div class="n">${cnt('podcasts')}</div><div class="l">Podcast Bölümü</div></a>
        <a class="stat" href="#remixes"><span class="ic">♫</span><div class="n">${cnt('remixes')}</div><div class="l">Remix</div></a>
        <a class="stat" href="#pages"><span class="ic">▤</span><div class="n">${cnt('pages')}</div><div class="l">Özel Sayfa</div></a>
        <a class="stat" href="#menu"><span class="ic">☰</span><div class="n">${(D.menu || []).length}</div><div class="l">Menü Öğesi</div></a>
      </div>

      <div class="card hcard">
        <div class="hcard-head">
          <div>
            <div class="hcard-eye">★ Ana Sayfa Öne Çıkan Manşet</div>
            <a class="hcard-title" href="#featured">${esc(activeHero.title)}</a>
          </div>
          <a class="btn btn-acid btn-sm" href="#featured">Öne Çıkanı Değiştir →</a>
        </div>
        <div class="hcard-body">
          ${activeHero.cover ? `<span class="hcard-thumb" style="background-image:url('${esc(activeHero.cover)}')"></span>` : ''}
          <div style="min-width:0;line-height:1.5">
            <span class="pill on">${esc(activeHero.eyebrow)}${heroDate}</span>
            ${activeHero.excerpt ? `<span>${esc(activeHero.excerpt.slice(0, 110))}${activeHero.excerpt.length > 110 ? '…' : ''}</span>` : ''}
          </div>
        </div>
      </div>

      <div class="grid2">
        <div class="card"><h3>Son içerikler</h3>
          ${all.length ? `<ul class="recent">${all.map((x) => `<li><span class="ty">${x._l}</span><a class="tt" href="#${x._t}/edit/${x.id}">${esc(x.title)}</a>${x.published === false ? '<span class="pill">Taslak</span>' : ''}<span class="dt">${S.fmtDate(x.date)}</span></li>`).join('')}</ul>` : '<p class="muted">Henüz içerik yok.</p>'}
        </div>
        <div>
          <div class="card"><h3>Hızlı işlemler</h3>
            <div class="quick">
              <a class="btn" href="#posts/new/video">▶ Yeni video</a>
              <a class="btn" href="#posts/new/yazi">✎ Yeni blog yazısı</a>
              <a class="btn" href="#podcasts/new">◉ Yeni bölüm</a>
              <a class="btn" href="#remixes/new">♫ Yeni remix</a>
              <a class="btn" href="#pages/new">▤ Yeni sayfa</a>
              <a class="btn" href="#featured">★ Öne çıkanı seç</a>
            </div>
          </div>
          <div class="card"><h3>Depolama</h3>
            <div class="meter"><div style="width:${pct.toFixed(1)}%"></div></div>
            <div class="muted">${fmtBytes(used)} / ~5 MB kullanılıyor (%${pct.toFixed(1)})</div>
            <p class="muted" style="margin-top:12px">İçerikler bu tarayıcıda saklanır. Düzenli olarak <a href="#backup" style="color:var(--acid)">yedek alın</a>.</p>
          </div>
        </div>
      </div>`;
  }

  /* ======================================================================
     Liste görünümü
     ====================================================================== */
  function listView(type) {
    const T = TYPES[type];
    crumbs([T.title]);
    const arr = (D[type] || []).slice().sort(byDate);
    const isPosts = type === 'posts';
    const kindOf = (x) => (isPosts ? S.postKind(x) : '');
    // Yazılar & Videolar: önce video, sonra blog yazısı oluşturma düğmesi
    const newBtns = isPosts
      ? `<a class="btn btn-acid" href="#posts/new/video">▶ Yeni Video</a><a class="btn" href="#posts/new/yazi">✎ Yeni Blog Yazısı</a>`
      : `<a class="btn btn-acid" href="#${type}/new">+ Yeni ${T.one}</a>`;
    const nKind = (k) => arr.filter((x) => kindOf(x) === k).length;

    view.innerHTML = `
      <div class="vh"><div><h1>${T.title}</h1><p>${T.desc}</p></div>
        <div class="vh-actions">${SECTIONS[type] ? `<a class="btn btn-ghost" href="#${type}/settings">⚙ ${SECTIONS[type].btn}</a>` : ''}${newBtns}</div></div>
      ${arr.length ? `
      <div class="toolbar">
        <label class="search"><input type="search" id="q" placeholder="${T.title} içinde ara..."></label>
        ${isPosts ? `<select id="kd" style="width:auto"><option value="">Tüm türler</option><option value="video">▶ Videolar (${nKind('video')})</option><option value="yazi">✎ Blog yazıları (${nKind('yazi')})</option></select>` : ''}
        <select id="st" style="width:auto"><option value="">Tümü (${arr.length})</option><option value="1">Yayında (${arr.filter((x) => x.published !== false).length})</option><option value="0">Taslak (${arr.filter((x) => x.published === false).length})</option></select>
      </div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Başlık</th><th>Tarih</th><th>Durum</th><th style="text-align:right">İşlemler</th></tr></thead>
        <tbody>${arr.map((x) => {
          const th = T.thumb(x);
          return `<tr data-id="${x.id}" data-s="${esc((x.title + ' ' + (T.sub(x) || '')).toLocaleLowerCase('tr'))}" data-p="${x.published === false ? 0 : 1}" data-kind="${kindOf(x)}">
            <td><div class="ti"><span class="th ${T.sq ? 'sq' : ''}" style="${th ? `background-image:url('${esc(th)}')` : ''}"></span><div style="min-width:0"><div class="tn" data-edit>${esc(x.title || '(başlıksız)')}${x.featured ? '<span class="star" title="Öne çıkan">★</span>' : ''}${S.isSample(x) ? '<span class="smp" title="Örnek içerik: panelde ve önizlemede görünür, yayına gönderilmez">Örnek</span>' : ''}</div><div class="ts">${esc(T.sub(x) || '')}</div></div></div></td>
            <td class="dt">${S.fmtDate(x.date)}</td>
            <td><button class="pill ${x.published === false ? '' : 'on'}" data-toggle title="Durumu değiştir">${x.published === false ? 'Taslak' : 'Yayında'}</button></td>
            <td><div class="acts">
              <button class="btn btn-sm" data-edit>Düzenle</button>
              <a class="btn btn-sm btn-ghost" href="index.html${T.view(x)}" target="_blank" title="Sitede görüntüle">↗</a>
              <button class="btn btn-sm btn-ghost" data-dup title="Çoğalt">⧉</button>
              <button class="btn btn-sm btn-danger" data-del title="Sil">Sil</button>
            </div></td></tr>`;
        }).join('')}</tbody></table></div>` : `
      <div class="tbl-wrap"><div class="empty"><b>Henüz ${T.one.toLowerCase()} yok</b>İlk içeriğinizi ekleyerek başlayın.<br><br><div class="empty-acts">${newBtns}</div></div></div>`}`;

    const filter = () => {
      const q = ($('#q').value || '').toLocaleLowerCase('tr'), st = $('#st').value, kd = $('#kd') ? $('#kd').value : '';
      $$('tbody tr', view).forEach((tr) => {
        tr.hidden = !(tr.dataset.s.includes(q) && (st === '' || tr.dataset.p === st) && (kd === '' || tr.dataset.kind === kd));
      });
    };
    if (arr.length) {
      $('#q').addEventListener('input', filter);
      $('#st').addEventListener('change', filter);
      if ($('#kd')) $('#kd').addEventListener('change', filter);
    }

    view.onclick = (e) => {
      const tr = e.target.closest('tr[data-id]');
      if (!tr) return;
      const id = tr.dataset.id;
      const idx = D[type].findIndex((x) => x.id === id);
      const item = D[type][idx];
      if (e.target.closest('[data-edit]')) { location.hash = `#${type}/edit/${id}`; }
      else if (e.target.closest('[data-toggle]')) {
        item.published = item.published === false;
        persist(item.published ? 'Yayına alındı' : 'Taslağa alındı');
        listView(type);
      } else if (e.target.closest('[data-dup]')) {
        const copy = JSON.parse(JSON.stringify(item));
        copy.id = S.uid();
        delete copy.sample; // kopya sizin içeriğinizdir: düzenleyip yayına alabilirsiniz
        copy.title = item.title + ' (kopya)';
        copy.published = false;
        copy.featured = false;
        if (copy.slug) copy.slug = uniqueSlug(type, item.slug + '-kopya');
        D[type].push(copy);
        persist('Kopya oluşturuldu (taslak)');
        listView(type);
      } else if (e.target.closest('[data-del]')) {
        if (!confirm(`“${item.title}” silinsin mi? Bu işlem geri alınamaz.`)) return;
        D[type].splice(idx, 1);
        if (type === 'pages') D.menu = D.menu.filter((m) => !(m.type === 'page' && m.target === item.slug));
        persist('Silindi');
        listView(type);
      }
    };
  }

  /* ======================================================================
     Form görünümü (ekle / düzenle)
     ====================================================================== */
  function formView(type, id, kind) {
    view.onclick = null;
    const T = TYPES[type];
    const isNew = !id;
    let item = isNew ? newItem(type, kind) : (D[type] || []).find((x) => x.id === id);
    if (!item) { toast('İçerik bulunamadı', true); go('#' + type); return; }
    if (type === 'pages' && !isNew) item = { ...item, inMenu: D.menu.some((m) => m.type === 'page' && m.target === item.slug) };
    if (type === 'posts') item = { ...item, kind: item.kind === 'video' || item.kind === 'yazi' ? item.kind : S.postKind(item) };
    const one = type === 'posts' ? (item.kind === 'video' ? 'Video' : 'Blog Yazısı') : T.one;

    crumbs([`<a href="#${type}">${T.title}</a>`, isNew ? 'Yeni ' + one : esc(item.title)]);
    view.dataset.form = '1';

    // "when" alanları yalnızca seçili türde görünür (form-grid[data-kind])
    const main = T.fields.filter((f) => !f.side)
      .map((f) => (f.when ? `<div data-when="${f.when}">${field(f, item[f.k])}</div>` : field(f, item[f.k])));

    view.innerHTML = `
      <div class="vh"><div><h1>${isNew ? 'Yeni ' + one : one + ' Düzenle'}</h1><p>${isNew ? 'Alanları doldurun ve kaydedin.' : 'Son değişiklikleri kaydetmeyi unutmayın. <code>Ctrl+S</code> ile hızlı kaydet.'}</p></div>
        <div class="vh-actions">
          <a class="btn btn-ghost" href="#${type}">← Listeye dön</a>
          ${!isNew ? `<a class="btn btn-ghost" target="_blank" href="index.html${T.view(item)}">Görüntüle ↗</a>` : ''}
          <button class="btn btn-acid" data-save>Kaydet</button>
        </div></div>
      <form class="form-grid" id="frm" novalidate ${item.kind ? `data-kind="${item.kind}"` : ''}>
        <div class="form-main">${main.join('')}</div>
        <div class="form-side">
          ${sideGroups(T.fields, item)}
          <button type="button" class="btn btn-acid btn-block" data-save>Kaydet</button>
          ${!isNew ? `<button type="button" class="btn btn-danger btn-block" data-del>Bu içeriği sil</button>` : ''}
        </div>
      </form>`;

    const frm = $('#frm');
    bindForm(frm);
    if (isNew) setTimeout(() => { const t = $('[data-k="title"]', frm); if (t) t.focus(); }, 50);

    const save = () => {
      const v = collect(frm, T.fields);
      if (!v.title) { toast('Başlık zorunludur', true); $('[data-k="title"]', frm).focus(); return; }
      if (v.kind === 'video' && !S.ytId(v.video)) { toast('Video için geçerli bir YouTube bağlantısı girin', true); $('[data-k="video"]', frm).focus(); return; }
      if (v.kind === 'yazi' && !v.cover) { toast('Blog yazısı için bir kapak görseli ekleyin', true); $('[data-k="cover"]', frm).focus(); return; }
      if ('slug' in v) v.slug = uniqueSlug(type, S.slugify(v.slug || v.title), item.id);

      const inMenu = v.inMenu;
      delete v.inMenu;
      const oldSlug = item.slug;
      const rec = { ...item, ...v };
      delete rec.inMenu;
      rec.updated = today(); // site haritası ve yapılandırılmış veride "son güncelleme"

      if (isNew) { rec.id = S.uid(); D[type].push(rec); }
      else { const i = D[type].findIndex((x) => x.id === rec.id); D[type][i] = rec; }

      if (rec.featured) {
        ['posts', 'podcasts', 'remixes', 'pages'].forEach((c) => {
          (D[c] || []).forEach((x) => {
            if (c !== type || x.id !== rec.id) x.featured = false;
          });
        });
        D.settings.featured = {
          ...(D.settings.featured || {}),
          mode: 'manual',
          type,
          id: rec.id
        };
      } else if (D.settings.featured && D.settings.featured.id === rec.id) {
        D.settings.featured.id = '';
      }

      if (type === 'pages') {
        D.menu.forEach((m) => { if (m.type === 'page' && m.target === oldSlug) m.target = rec.slug; });
        const exists = D.menu.some((m) => m.type === 'page' && m.target === rec.slug);
        if (inMenu && !exists) D.menu.push({ id: S.uid(), label: rec.title, type: 'page', target: rec.slug, visible: true, newTab: false });
        if (!inMenu && exists) D.menu = D.menu.filter((m) => !(m.type === 'page' && m.target === rec.slug));
      }

      if (persist(isNew ? `${T.one} oluşturuldu` : 'Değişiklikler kaydedildi')) {
        dirty = false;
        go(`#${type}/edit/${rec.id}`);
      }
    };

    $$('[data-save]', view).forEach((b) => b.addEventListener('click', save));
    frm.addEventListener('submit', (e) => { e.preventDefault(); save(); });
    const del = $('[data-del]', view);
    if (del) del.addEventListener('click', () => {
      if (!confirm(`“${item.title}” silinsin mi? Bu işlem geri alınamaz.`)) return;
      D[type] = D[type].filter((x) => x.id !== item.id);
      if (type === 'pages') D.menu = D.menu.filter((m) => !(m.type === 'page' && m.target === item.slug));
      persist('Silindi');
      go('#' + type);
    });
    view._save = save;
  }

  /* ======================================================================
     Liste sayfası ayarları (Yazılar sayfası, Podcast programı)
     ====================================================================== */
  function sectionView(type) {
    view.onclick = null;
    const C = SECTIONS[type], T = TYPES[type];
    crumbs([`<a href="#${type}">${T.title}</a>`, C.title]);
    view.dataset.form = '1';
    const cur = D.settings[C.key] || {};
    view.innerHTML = `
      <div class="vh"><div><h1>${C.title}</h1><p>${C.desc}</p></div>
        <div class="vh-actions">
          <a class="btn btn-ghost" href="#${type}">← ${T.title}</a>
          <a class="btn btn-ghost" href="index.html${{ posts: '#/yazilar', podcasts: '#/podcast', remixes: '#/remixler' }[type]}" target="_blank">Görüntüle ↗</a>
          <button class="btn btn-acid" data-save>Kaydet</button>
        </div></div>
      <form class="form-grid" id="frm" novalidate>
        <div class="form-main">${C.fields.filter((f) => !f.side).map((f) => field(f, cur[f.k])).join('')}</div>
        <div class="form-side">${sideGroups(C.fields, cur)}<button type="button" class="btn btn-acid btn-block" data-save>Kaydet</button></div>
      </form>`;
    const frm = $('#frm');
    bindForm(frm);
    const save = () => {
      D.settings[C.key] = { ...cur, ...collect(frm, C.fields) };
      if (persist(C.title + ' kaydedildi')) dirty = false;
    };
    $$('[data-save]', view).forEach((b) => b.addEventListener('click', save));
    view._save = save;
  }

  /* ======================================================================
     Öne Çıkan (Hero) Yönetimi
     ====================================================================== */
  function featuredView() {
    view.onclick = null;
    crumbs(['Öne Çıkan (Hero)']);
    view.dataset.form = '1';

    let draftFeat = {
      mode: 'manual',
      type: 'posts',
      id: '',
      badge: '',
      customTitle: '',
      customExcerpt: '',
      customImage: '',
      customLink: '',
      customButtonText: '',
      topGradient: true,
      topGradientOpacity: 85,
      ...(D.settings.featured || {})
    };
    if (draftFeat.topGradient === undefined) draftFeat.topGradient = true;
    if (draftFeat.topGradientOpacity === undefined) draftFeat.topGradientOpacity = 85;

    // Manuel modda seçim yoksa ilk öne çıkan öğeyi veya ilk yazıyı seç
    if (draftFeat.mode === 'manual' && !draftFeat.id) {
      for (const t of ['posts', 'podcasts', 'remixes', 'pages']) {
        const it = (D[t] || []).find((x) => x.featured);
        if (it) { draftFeat.id = it.id; draftFeat.type = t; break; }
      }
      if (!draftFeat.id && (D.posts || [])[0]) {
        draftFeat.id = D.posts[0].id;
        draftFeat.type = 'posts';
      }
    }

    let activeFilter = 'all';
    let searchQuery = '';

    const getAllItems = () => {
      const items = [];
      const add = (arr, type, label, sq) => {
        (arr || []).forEach((x) => {
          // Yazılar video / blog yazısı olarak ayrılır (fk: filtre anahtarı)
          const vid = type === 'posts' && S.postKind(x) === 'video';
          items.push({
            id: x.id,
            type,
            fk: type === 'posts' ? (vid ? 'video' : 'yazi') : type,
            label: vid ? 'Video' : label,
            sq: !!sq,
            title: x.title || '(Başlıksız)',
            date: x.date || '',
            published: x.published !== false,
            featured: !!x.featured,
            thumb: vid ? S.ytThumb(x.video, 'mqdefault') : x.cover,
            excerpt: type === 'pages' ? (x.excerpt || '') : (x.excerpt || (x.description || '').replace(/<[^>]+>/g, '')),
            raw: x
          });
        });
      };
      add(D.posts, 'posts', 'Yazı', false);
      add(D.podcasts, 'podcasts', 'Podcast', true);
      add(D.remixes, 'remixes', 'Remix', true);
      add(D.pages, 'pages', 'Sayfa', false);
      return items.sort(byDate);
    };

    const previewHTML = (pv) => {
      const showTopGrad = draftFeat.topGradient !== false;
      const op = Math.max(0, Math.min(100, Number(draftFeat.topGradientOpacity ?? 85))) / 100;
      return `
        ${pv.cover ? `<img class="fbg" src="${esc(pv.cover)}" alt="">` : ''}
        ${showTopGrad ? `<div class="top-grad" style="opacity:${op.toFixed(2)}"></div>` : ''}
        <div class="fgrad"></div><div class="fglow"></div>
        <div class="fcontent">
          <div class="feye">${esc(pv.eyebrow)}${pv.date ? ` · ${S.fmtDate(pv.date)}` : ''}</div>
          <h2 class="ftitle">${esc(pv.title)}</h2>
          ${pv.excerpt ? `<p class="fsub">${esc(pv.excerpt)}</p>` : ''}
          <div class="fbtn"><span class="arr">→</span> ${esc(pv.btnText || 'İncele')}</div>
        </div>`;
    };

    const renderItemsList = (items) => {
      const q = searchQuery.toLocaleLowerCase('tr').trim();
      const filtered = items.filter((it) => {
        const matchesFilter = activeFilter === 'all' || it.fk === activeFilter;
        const matchesQuery = !q || it.title.toLocaleLowerCase('tr').includes(q) || it.excerpt.toLocaleLowerCase('tr').includes(q);
        return matchesFilter && matchesQuery;
      });

      if (!filtered.length) {
        return `<div class="empty" style="padding:24px"><p class="muted">Aramanıza uygun içerik bulunamadı.</p></div>`;
      }

      return filtered.map((it) => {
        const isSel = draftFeat.mode === 'manual' && draftFeat.id === it.id;
        return `
          <div class="feat-item-card ${isSel ? 'is-active' : ''}" data-id="${it.id}" data-type="${it.type}">
            <div class="th ${it.sq ? 'sq' : ''}" style="${it.thumb ? `background-image:url('${esc(it.thumb)}')` : ''}"></div>
            <div class="info">
              <div class="tag-badge">${esc(it.label)}${it.published ? '' : ' · TASLAK'}</div>
              <div class="title">${esc(it.title)}</div>
              <div class="date">${it.date ? S.fmtDate(it.date) : ''}</div>
            </div>
            <button type="button" class="status-btn" data-pick="${it.id}">${isSel ? '★ Seçildi' : 'Öne Çıkar'}</button>
          </div>`;
      }).join('');
    };

    const render = () => {
      const allItems = getAllItems();
      const pv = resolveHeroPreview(D, draftFeat);

      view.innerHTML = `
        <div class="vh">
          <div>
            <h1>Ana Sayfa Öne Çıkan (Hero)</h1>
            <p>Ana sayfanın en üstünde dev manşet olarak görünecek içeriği buradan seçin veya tamamen özel bir manşet oluşturun.</p>
          </div>
          <div class="vh-actions">
            <a class="btn btn-ghost" href="index.html" target="_blank">Canlı Sitede Gör ↗</a>
            <button class="btn btn-acid" data-save-feat>Değişiklikleri Kaydet</button>
          </div>
        </div>

        <!-- Canlı Önizleme -->
        <div class="card" style="padding:22px;margin-bottom:20px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
            <h3 style="margin:0">Canlı Manşet Önizlemesi</h3>
            <span class="muted" style="font-size:12px">Ana sayfa açıldığında ziyaretçilerin göreceği manşet kutusu:</span>
          </div>
          <div class="feat-hero-preview" id="featPreview">
            ${previewHTML(pv)}
          </div>
        </div>

        <!-- Mod Seçimi -->
        <div class="card" style="margin-bottom:20px">
          <h3>Manşet Gösterim Modu</h3>
          <div class="feat-modes">
            <button type="button" class="feat-mode-btn ${draftFeat.mode === 'manual' ? 'on' : ''}" data-mode="manual">
              📌 Mevcut İçeriklerden Seç (Manuel)
            </button>
            <button type="button" class="feat-mode-btn ${draftFeat.mode === 'latest' ? 'on' : ''}" data-mode="latest">
              ⚡ En Son Eklenen İçerik (Otomatik)
            </button>
            <button type="button" class="feat-mode-btn ${draftFeat.mode === 'custom' ? 'on' : ''}" data-mode="custom">
              ✍️ Bağımsız Özel Manşet
            </button>
          </div>
          <p class="muted" style="margin:0;font-size:13px" id="modeDesc">
            ${draftFeat.mode === 'manual'
              ? 'Aşağıdaki listeden istediğiniz Blog Yazısı, YouTube Videosu, Podcast, Remix veya Sayfayı seçebilirsiniz.'
              : draftFeat.mode === 'latest'
                ? 'Ana sayfa manşetinde her zaman en son yayınlanan içerik (yazı, video, podcast veya remix) dinamik olarak gösterilir.'
                : 'Sitedeki bir içeriğe bağlı kalmadan tamamen kendi belirleyeceğiniz bağımsız başlık, görsel ve bağlantı ile özel bir manşet oluşturabilirsiniz.'}
          </p>
        </div>

        ${draftFeat.mode === 'manual' ? `
        <!-- İçerik Seçim Listesi -->
        <div class="card" style="margin-bottom:20px">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:14px">
            <div>
              <h3 style="margin:0">Öne Çıkarılacak İçeriği Belirleyin</h3>
              <p class="muted" style="margin:4px 0 0;font-size:12px">Listeden herhangi bir karta veya "Öne Çıkar" butonuna tıklayarak seçim yapın.</p>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap" id="filterPills">
              <button type="button" class="pill ${activeFilter === 'all' ? 'on' : ''}" data-filter="all">Tümü (${allItems.length})</button>
              <button type="button" class="pill ${activeFilter === 'video' ? 'on' : ''}" data-filter="video">Videolar</button>
              <button type="button" class="pill ${activeFilter === 'yazi' ? 'on' : ''}" data-filter="yazi">Blog yazıları</button>
              <button type="button" class="pill ${activeFilter === 'podcasts' ? 'on' : ''}" data-filter="podcasts">Podcast</button>
              <button type="button" class="pill ${activeFilter === 'remixes' ? 'on' : ''}" data-filter="remixes">Remixler</button>
              <button type="button" class="pill ${activeFilter === 'pages' ? 'on' : ''}" data-filter="pages">Sayfalar</button>
            </div>
          </div>
          <div class="toolbar" style="margin-bottom:12px">
            <label class="search" style="margin:0;width:100%"><input type="search" id="featSearch" placeholder="İçerik başlığında ara..." value="${esc(searchQuery)}"></label>
          </div>
          <div class="feat-item-list" id="featItems">
            ${renderItemsList(allItems)}
          </div>
        </div>
        ` : ''}

        <!-- Üst Bilgi Paneli (Menü) Siyah Gradyanı -->
        <div class="card" style="margin-bottom:20px">
          <h3>Üst Bilgi Paneli (Gezinti Çubuğu) Siyah Gradyanı</h3>
          <p class="muted" style="margin:0 0 16px;font-size:13px">
            Menü bağlantılarının ve site logosunun kapak görseli üzerinde kusursuz ve rahat okunabilmesi için menüden aşağıya doğru süzülen yumuşak siyah gradyan karartma.
          </p>
          <div style="display:flex;flex-direction:column;gap:16px">
            <label class="sw" style="padding:0">
              <span class="swl">
                Üstten Aşağı Siyah Gradyan
                <small>Açıldığında menünün altından başlayıp aşağıya doğru yumuşakça süzülen siyah gradyan eklenir.</small>
              </span>
              <input type="checkbox" id="featTopGrad" ${draftFeat.topGradient !== false ? 'checked' : ''}>
              <span class="tg"></span>
            </label>

            <div id="gradOpacityWrap" style="${draftFeat.topGradient === false ? 'opacity:0.35;pointer-events:none' : ''}">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <span style="font-size:12px;font-weight:500;color:var(--fg-2)">Gradyan Opaklığı / Şeffaflık (Transparency)</span>
                <span id="gradOpacityVal" style="font-family:var(--mono);font-size:12px;color:var(--acid);font-weight:600">
                  %${draftFeat.topGradientOpacity ?? 85}
                </span>
              </div>
              <input type="range" class="range" id="featTopGradOp" min="10" max="100" step="5" value="${draftFeat.topGradientOpacity ?? 85}">
              <div class="range-labels"><span>Şeffaf (%10)</span><span>Belirgin / Koyu (%100)</span></div>
              <small class="muted" style="display:block;margin-top:6px">
                Kapak görselinizin aydınlığına göre opaklık derecesini ayarlayın. Yukarıdaki <b>Canlı Manşet Önizlemesi</b> kutusundan anlık olarak sonucu izleyebilirsiniz.
              </small>
            </div>
          </div>
        </div>

        <!-- İnce Ayarlar & Özelleştirme -->
        <div class="card">
          <h3>${draftFeat.mode === 'custom' ? 'Özel Manşet Detayları' : 'Manşet Metin & Görsel İnce Ayarları (İsteğe Bağlı)'}</h3>
          <p class="muted" style="margin:0 0 16px;font-size:13px">
            ${draftFeat.mode === 'custom'
              ? 'Özel manşet için başlık, görsel, açıklama ve yönlendirme linkini girin.'
              : 'Seçili içeriğin orijinal başlık veya özetini değiştirmek isterseniz bu alanları kullanabilirsiniz. Boş bırakırsanız seçilen içeriğin kendi bilgileri kullanılır.'}
          </p>
          <div class="feat-grid">
            <label class="fld">
              <span>Üst Rozet / Etiket Metni</span>
              <input type="text" data-feat="badge" value="${esc(draftFeat.badge || '')}" placeholder="Örn: Öne Çıkan Video, Editörün Seçimi, Yeni Remix">
              <small>Boş bırakılırsa otomatik tür başlığı gösterilir.</small>
            </label>
            <label class="fld">
              <span>Buton Metni</span>
              <input type="text" data-feat="customButtonText" value="${esc(draftFeat.customButtonText || '')}" placeholder="Örn: Şimdi Dinle, İzle, Oku, Keşfet">
              <small>Boş bırakılırsa türün varsayılan butonu gösterilir.</small>
            </label>
            <label class="fld" style="grid-column:1 / -1">
              <span>${draftFeat.mode === 'custom' ? 'Manşet Başlığı' : 'Özel Manşet Başlığı (İsteğe bağlı)'}</span>
              <input type="text" data-feat="customTitle" value="${esc(draftFeat.customTitle || '')}" placeholder="${draftFeat.mode === 'custom' ? 'Manşet başlığı girin...' : 'Boş bırakılırsa içeriğin orijinal başlığı kullanılır'}">
            </label>
            <label class="fld" style="grid-column:1 / -1">
              <span>${draftFeat.mode === 'custom' ? 'Manşet Açıklaması' : 'Özel Manşet Özeti (İsteğe bağlı)'}</span>
              <textarea data-feat="customExcerpt" rows="3" placeholder="${draftFeat.mode === 'custom' ? 'Manşet altındaki açıklama metni...' : 'Boş bırakılırsa içeriğin orijinal özeti kullanılır'}">${esc(draftFeat.customExcerpt || '')}</textarea>
            </label>
            <div class="fld imgf" style="grid-column:1 / -1">
              <span class="fld-l">${draftFeat.mode === 'custom' ? 'Manşet Arka Plan Görseli' : 'Özel Kapak Görseli (İsteğe bağlı)'}</span>
              <div class="prev ${draftFeat.customImage ? 'has' : ''}" style="${draftFeat.customImage ? `background-image:url('${esc(draftFeat.customImage)}')` : ''}">
                Görsel yüklemek için tıklayın<button type="button" class="x" title="Kaldır">×</button>
              </div>
              <div class="ctl">
                <input type="url" data-feat="customImage" value="${esc(draftFeat.customImage || '')}" placeholder="https://... veya dosya yükleyin">
                <button type="button" class="btn btn-sm" data-upload>Yükle</button>
              </div>
              <small>${draftFeat.mode === 'custom' ? 'Görsel yükleyin veya bağlantı yapıştırın.' : 'Boş bırakılırsa içeriğin orijinal kapak görseli kullanılır.'}</small>
            </div>
            ${draftFeat.mode === 'custom' ? `
            <label class="fld" style="grid-column:1 / -1">
              <span>Yönlendirme Bağlantısı (URL)</span>
              <input type="text" data-feat="customLink" value="${esc(draftFeat.customLink || '')}" placeholder="https://... veya #/yazilar">
              <small>Butona veya başlığa tıklandığında açılacak adres.</small>
            </label>
            ` : ''}
          </div>
        </div>

        <div class="form-foot" style="margin-top:20px">
          <button type="button" class="btn btn-ghost" data-reset-feat>Değişiklikleri Geri Al</button>
          <button type="button" class="btn btn-acid" data-save-feat>Öne Çıkan Manşeti Kaydet</button>
        </div>`;

      bindEvents();
    };

    const updatePreviewOnly = () => {
      const el = $('#featPreview');
      if (el) el.innerHTML = previewHTML(resolveHeroPreview(D, draftFeat));
    };

    const bindEvents = () => {
      // Mod butonları
      $$('.feat-mode-btn', view).forEach((btn) => {
        btn.addEventListener('click', () => {
          draftFeat.mode = btn.dataset.mode;
          dirty = true;
          render();
        });
      });

      // Filtre hapları
      $$('#filterPills button', view).forEach((b) => {
        b.addEventListener('click', () => {
          activeFilter = b.dataset.filter;
          $$('#filterPills button', view).forEach((x) => x.classList.toggle('on', x === b));
          const list = $('#featItems');
          if (list) list.innerHTML = renderItemsList(getAllItems());
        });
      });

      // Arama kutusu
      const sInp = $('#featSearch');
      if (sInp) {
        sInp.addEventListener('input', () => {
          searchQuery = sInp.value;
          const list = $('#featItems');
          if (list) list.innerHTML = renderItemsList(getAllItems());
        });
      }

      // İçerik seçimi (kart tıklama)
      const list = $('#featItems');
      if (list) {
        list.addEventListener('click', (e) => {
          const card = e.target.closest('.feat-item-card');
          if (!card) return;
          const id = card.dataset.id;
          const type = card.dataset.type;
          draftFeat.id = id;
          draftFeat.type = type;
          dirty = true;
          $$('.feat-item-card', list).forEach((c) => {
            const isThis = c.dataset.id === id;
            c.classList.toggle('is-active', isThis);
            const btn = $('.status-btn', c);
            if (btn) btn.textContent = isThis ? '★ Seçildi' : 'Öne Çıkar';
          });
          updatePreviewOnly();
        });
      }

      // Üst gradyan açma/kapama ve opaklık
      const tgSw = $('#featTopGrad', view);
      const tgOpWrap = $('#gradOpacityWrap', view);
      const tgOpInp = $('#featTopGradOp', view);
      const tgOpVal = $('#gradOpacityVal', view);

      if (tgSw) {
        tgSw.addEventListener('change', () => {
          draftFeat.topGradient = tgSw.checked;
          if (tgOpWrap) {
            tgOpWrap.style.opacity = tgSw.checked ? '1' : '0.35';
            tgOpWrap.style.pointerEvents = tgSw.checked ? 'auto' : 'none';
          }
          dirty = true;
          updatePreviewOnly();
        });
      }

      if (tgOpInp) {
        tgOpInp.addEventListener('input', () => {
          const val = Number(tgOpInp.value);
          draftFeat.topGradientOpacity = val;
          if (tgOpVal) tgOpVal.textContent = `%${val}`;
          dirty = true;
          updatePreviewOnly();
        });
      }

      // İnce ayar inputları
      $$('[data-feat]', view).forEach((inp) => {
        const k = inp.dataset.feat;
        inp.addEventListener('input', () => {
          draftFeat[k] = inp.value;
          dirty = true;
          updatePreviewOnly();
        });
      });

      // Görsel yükleme
      const imgf = $('.imgf', view);
      if (imgf) {
        const input = $('input[data-feat="customImage"]', imgf);
        const prev = $('.prev', imgf);
        const setImg = (v) => {
          if (input) input.value = v;
          draftFeat.customImage = v;
          if (prev) {
            prev.classList.toggle('has', !!v);
            prev.style.backgroundImage = v ? `url('${v}')` : '';
          }
          dirty = true;
          updatePreviewOnly();
        };
        const upload = () => pickImage((data) => { setImg(data); toast('Görsel eklendi'); });
        if (prev) {
          prev.addEventListener('click', (e) => {
            if (e.target.closest('.x')) { setImg(''); return; }
            upload();
          });
        }
        const upBtn = $('[data-upload]', imgf);
        if (upBtn) upBtn.addEventListener('click', upload);
      }

      // Kaydetme
      const save = () => {
        if (draftFeat.mode === 'manual') {
          if (!draftFeat.id) {
            toast('Lütfen öne çıkarmak için bir içerik seçin', true);
            return;
          }
          // İçerik dizilerinde featured bayraklarını senkronize et
          ['posts', 'podcasts', 'remixes', 'pages'].forEach((c) => {
            (D[c] || []).forEach((x) => {
              x.featured = (c === draftFeat.type && x.id === draftFeat.id);
            });
          });
        } else if (draftFeat.mode === 'custom') {
          if (!draftFeat.customTitle && !draftFeat.customImage) {
            toast('Özel manşet için en az bir başlık veya görsel girin', true);
            return;
          }
        }

        D.settings.featured = JSON.parse(JSON.stringify(draftFeat));
        if (persist('Ana sayfa öne çıkan manşet kaydedildi')) {
          dirty = false;
          render();
        }
      };

      $$('[data-save-feat]', view).forEach((b) => b.addEventListener('click', save));
      view._save = save;

      // Sıfırla
      const rst = $('[data-reset-feat]', view);
      if (rst) {
        rst.addEventListener('click', () => {
          draftFeat = JSON.parse(JSON.stringify(D.settings.featured || { mode: 'manual', type: 'posts', id: '' }));
          dirty = false;
          render();
          toast('Değişiklikler geri alındı');
        });
      }
    };

    render();
  }

  /* ======================================================================
     Menü yöneticisi
     ====================================================================== */
  const MENU_TYPES = [
    ['home', 'Ana Sayfa'], ['blog', 'Yazılar'], ['podcast', 'Podcast'],
    ['remixes', 'Remixler'], ['about', 'Hakkında'], ['page', 'Özel Sayfa'], ['url', 'Dış Bağlantı (URL)']
  ];
  const AUTO_PATH = { home: '#/', blog: '#/yazilar', podcast: '#/podcast', remixes: '#/remixler', about: '#/hakkinda' };

  function menuView() {
    view.onclick = null;
    crumbs(['Menü Yönetimi']);
    view.dataset.form = '1';
    let draft = JSON.parse(JSON.stringify(D.menu || []));
    let dragFrom = null;

    const targetCtl = (m) => {
      if (m.type === 'page') {
        const pages = D.pages || [];
        if (!pages.length) return `<span class="muted">Henüz sayfa yok — <a href="#pages/new" style="color:var(--acid)">yeni sayfa oluştur</a></span>`;
        return `<select data-f="target"><option value="">— Sayfa seçin —</option>${pages.map((p) => `<option value="${esc(p.slug)}" ${p.slug === m.target ? 'selected' : ''}>${esc(p.title)}</option>`).join('')}</select>`;
      }
      if (m.type === 'url') {
        return `<div style="display:flex;gap:8px;align-items:center"><input type="text" data-f="target" value="${esc(m.target || '')}" placeholder="https://... veya #bolum"><label class="vis" title="Yeni sekmede aç"><input type="checkbox" data-f="newTab" ${m.newTab ? 'checked' : ''}>Yeni sekme</label></div>`;
      }
      return `<span class="muted">Otomatik: <code>${AUTO_PATH[m.type]}</code></span>`;
    };

    const rowHTML = (m, i) => `
      <div class="mrow ${m.visible === false ? 'hidden-item' : ''}" data-i="${i}">
        <span class="hd" title="Sürükleyerek sırala">⋮⋮</span>
        <input type="text" data-f="label" value="${esc(m.label)}" placeholder="Menü adı">
        <select data-f="type">${MENU_TYPES.map(([v, l]) => `<option value="${v}" ${v === m.type ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <div class="mtarget">${targetCtl(m)}</div>
        <div class="mact">
          <label class="vis" title="Menüde göster/gizle"><input type="checkbox" data-f="visible" ${m.visible !== false ? 'checked' : ''}>Görünür</label>
          <button type="button" class="btn btn-sm btn-icon btn-ghost" data-mv="-1" title="Yukarı" ${i === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" class="btn btn-sm btn-icon btn-ghost" data-mv="1" title="Aşağı" ${i === draft.length - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" class="btn btn-sm btn-icon btn-danger" data-rm title="Sil">×</button>
        </div>
      </div>`;

    const preview = () => {
      const el = $('#mprev');
      if (el) el.innerHTML = `<span class="b">${esc(D.settings.siteName)}</span><span class="l">${draft.filter((m) => m.visible !== false).map((m) => `<span>${esc(m.label || '—')}</span>`).join('') || '<span style="color:var(--fg-3)">Menü boş</span>'}</span>`;
    };

    const render = () => {
      const missing = MENU_TYPES.filter(([t]) => !['page', 'url'].includes(t) && !draft.some((m) => m.type === t));
      view.innerHTML = `
        <div class="vh"><div><h1>Menü Yönetimi</h1><p>Üst menüdeki bağlantıları ekleyin, yeniden adlandırın, sürükleyerek sıralayın veya gizleyin. Özel sayfalar ve dış bağlantılar da ekleyebilirsiniz.</p></div>
          <div class="vh-actions"><button class="btn btn-acid" data-msave>Menüyü Kaydet</button></div></div>
        <div class="card"><h3>Canlı önizleme</h3><div class="mprev" id="mprev"></div></div>
        <div class="card"><h3>Menü öğeleri</h3>
          <div class="mlist" id="mlist">${draft.map(rowHTML).join('') || '<p class="muted">Menüde hiç öğe yok.</p>'}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px">
            <button class="btn" data-add="url">+ Dış bağlantı ekle</button>
            <button class="btn" data-add="page">+ Özel sayfa bağla</button>
            <a class="btn btn-ghost" href="#pages/new">▤ Yeni sayfa oluştur</a>
            ${missing.map(([t, l]) => `<button class="btn btn-ghost" data-add="${t}">+ ${l}</button>`).join('')}
          </div>
        </div>
        <div class="form-foot"><button class="btn btn-ghost" data-mreset>Değişiklikleri geri al</button><button class="btn btn-acid" data-msave>Menüyü Kaydet</button></div>`;
      preview();
    };

    render();

    view.oninput = view.onchange = (e) => {
      const row = e.target.closest('.mrow');
      if (!row || !e.target.dataset.f) return;
      const m = draft[+row.dataset.i];
      const f = e.target.dataset.f;
      m[f] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      if (f === 'type' && e.type === 'change') {
        const def = MENU_TYPES.find((x) => x[0] === m.type);
        if (!m.label || MENU_TYPES.some((x) => x[1] === m.label)) m.label = def[1].replace(' (URL)', '');
        m.target = m.type === 'url' ? 'https://' : '';
        row.outerHTML = rowHTML(m, +row.dataset.i);
      }
      if (f === 'target' && m.type === 'page' && e.type === 'change') {
        const p = (D.pages || []).find((x) => x.slug === m.target);
        if (p && (!m.label || m.label === 'Özel Sayfa')) { m.label = p.title; $('[data-f="label"]', row).value = p.title; }
      }
      if (f === 'visible') row.classList.toggle('hidden-item', !m.visible);
      dirty = true;
      preview();
    };

    view.onclick = (e) => {
      const row = e.target.closest('.mrow');
      const i = row ? +row.dataset.i : -1;
      if (e.target.closest('[data-rm]')) {
        if (!confirm(`“${draft[i].label}” menüden kaldırılsın mı?`)) return;
        draft.splice(i, 1); dirty = true; render();
      } else if (e.target.closest('[data-mv]')) {
        const j = i + Number(e.target.closest('[data-mv]').dataset.mv);
        if (j < 0 || j >= draft.length) return;
        [draft[i], draft[j]] = [draft[j], draft[i]]; dirty = true; render();
      } else if (e.target.closest('[data-add]')) {
        const t = e.target.closest('[data-add]').dataset.add;
        const lbl = (MENU_TYPES.find((x) => x[0] === t) || [, 'Yeni'])[1].replace(' (URL)', '');
        draft.push({ id: S.uid(), label: t === 'url' ? 'Yeni Bağlantı' : t === 'page' ? 'Özel Sayfa' : lbl, type: t, target: '', visible: true, newTab: t === 'url' });
        dirty = true; render();
        const last = $$('.mrow').pop();
        if (last) { last.scrollIntoView({ behavior: 'smooth', block: 'center' }); $('[data-f="label"]', last).select(); }
      } else if (e.target.closest('[data-msave]')) {
        for (const m of draft) {
          if (!m.label.trim()) { toast('Tüm menü öğelerinin bir adı olmalı', true); return; }
          if (m.type === 'page' && !m.target) { toast(`“${m.label}” için bir sayfa seçin`, true); return; }
          if (m.type === 'url' && !m.target.trim()) { toast(`“${m.label}” için bağlantı adresi girin`, true); return; }
        }
        D.menu = JSON.parse(JSON.stringify(draft));
        if (persist('Menü kaydedildi')) dirty = false;
      } else if (e.target.closest('[data-mreset]')) {
        draft = JSON.parse(JSON.stringify(D.menu)); dirty = false; render();
      }
    };

    // Sürükle-bırak (yalnızca tutamaçtan)
    view.onmousedown = (e) => { const h = e.target.closest('.hd'); if (h) h.parentElement.draggable = true; };
    view.ondragstart = (e) => {
      const row = e.target.closest('.mrow'); if (!row) return;
      dragFrom = +row.dataset.i; row.classList.add('drag');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', String(dragFrom)); } catch (err) { /* yok say */ }
    };
    view.ondragover = (e) => {
      const row = e.target.closest('.mrow'); if (!row || dragFrom === null) return;
      e.preventDefault();
      $$('.mrow.over').forEach((r) => r !== row && r.classList.remove('over'));
      row.classList.add('over');
    };
    view.ondrop = (e) => {
      const row = e.target.closest('.mrow'); if (!row || dragFrom === null) return;
      e.preventDefault();
      const to = +row.dataset.i;
      if (to !== dragFrom) { const [m] = draft.splice(dragFrom, 1); draft.splice(to, 0, m); dirty = true; }
      dragFrom = null; render();
    };
    view.ondragend = () => { dragFrom = null; $$('.mrow').forEach((r) => { r.draggable = false; r.classList.remove('drag', 'over'); }); };
  }

  /* ======================================================================
     Hakkında
     ====================================================================== */
  const ABOUT_FIELDS = [
    { k: 'name', t: 'title', l: 'Ad / Sahne adı', req: true },
    { k: 'role', t: 'text', l: 'Kısa tanım', ph: 'Müzik prodüktörü, DJ ve podcast yapımcısı', help: 'Kim olduğunuzu tek cümleyle yazın. Sayfada görünmez; Google ve yapay zekâ asistanları sizi bu tanımla tanır.' },
    { k: 'heroLeft', t: 'textarea', l: 'Fotoğraf üstü yazı — sol', rows: 2, ph: 'sesle\nbaşlar,', help: 'Fotoğrafın sol tarafında büyük italik. Satır atlamak için Enter.' },
    { k: 'heroRight', t: 'textarea', l: 'Fotoğraf üstü yazı — sağ', rows: 2, ph: 'ritimle\nbiter.' },
    { k: 'lead', t: 'textarea', l: 'Vurgulu başlık', rows: 2, ph: 'Dinlemek için,\nsusmak gerek.', help: 'Fotoğrafın altında, vurgu renginde ortalanmış büyük başlık.' },
    { k: 'bio', t: 'richtext', l: 'Biyografi', help: 'Ara başlık (H2) ile bölümlere ayırabilirsiniz; bağlantılar vurgu renginde görünür.' },
    { k: 'photo', t: 'image', l: 'Kapak fotoğrafı (tam ekran)', side: 'Fotoğraf', help: 'Yatay, yüksek çözünürlüklü bir portre önerilir; yüz üst-orta bölgede kalmalı.' },
    { k: 'accent', t: 'color', l: 'Vurgu rengi', side: 'Görünüm', help: 'Vurgulu başlığın ve bağlantıların rengi.' }
  ];

  function aboutView() {
    resetViewHandlers();
    crumbs(['Hakkında']);
    view.dataset.form = '1';
    const a = D.about || {};
    view.innerHTML = `
      <div class="vh"><div><h1>Hakkında</h1><p>Hakkında sayfasında görünen bilgileri düzenleyin. Sosyal medya bağlantıları Ayarlar bölümündedir.</p></div>
        <div class="vh-actions"><a class="btn btn-ghost" href="index.html#/hakkinda" target="_blank">Görüntüle ↗</a><button class="btn btn-acid" data-save>Kaydet</button></div></div>
      <form class="form-grid" id="frm" novalidate>
        <div class="form-main">${ABOUT_FIELDS.filter((f) => !f.side).map((f) => field(f, a[f.k])).join('')}</div>
        <div class="form-side">${sideGroups(ABOUT_FIELDS, a)}
          <div class="card"><h3>Sosyal bağlantılar</h3><p class="muted" style="margin:0 0 12px">Sosyal medya bağlantılarınız sitenin alt bilgisinde görünür; Ayarlar'dan düzenleyin.</p><a class="btn btn-block" href="#settings">Ayarlar'a git →</a></div>
          <button type="button" class="btn btn-acid btn-block" data-save>Kaydet</button>
        </div>
      </form>`;
    const frm = $('#frm');
    bindForm(frm);
    const save = () => {
      D.about = { ...D.about, ...collect(frm, ABOUT_FIELDS) };
      if (persist('Hakkında sayfası kaydedildi')) dirty = false;
    };
    $$('[data-save]', view).forEach((b) => b.addEventListener('click', save));
    view._save = save;
  }

  /* ======================================================================
     Ayarlar & tema
     ====================================================================== */
  const PRESETS = [
    ['#C9F03A', 'Asit yeşili (varsayılan)'], ['#FF6B35', 'Turuncu'], ['#3AE0F0', 'Camgöbeği'], ['#FF4FA3', 'Pembe'],
    ['#F0C93A', 'Altın'], ['#9B7BFF', 'Lavanta'], ['#5BF08A', 'Nane'], ['#F4ECD8', 'Krem']
  ];
  const SOCIALS = [['youtube', 'YouTube'], ['instagram', 'Instagram'], ['x', 'X (Twitter)'], ['spotify', 'Spotify'], ['soundcloud', 'SoundCloud'], ['email', 'E-posta']];

  function settingsView() {
    resetViewHandlers();
    crumbs(['Ayarlar & Tema']);
    view.dataset.form = '1';
    const st = D.settings;
    const acc = (st.accent || '#C9F03A').toUpperCase();
    const F = [
      { k: 'siteName', t: 'text', l: 'Site adı', req: true },
      { k: 'tagline', t: 'text', l: 'Slogan', help: 'Alt bilgide ve tarayıcı başlığında görünür.' },
      { k: 'description', t: 'textarea', l: 'Site açıklaması (SEO)', rows: 2 },
      { k: 'footerText', t: 'text', l: 'Alt bilgi metni', help: '<code>{yil}</code> yazarsanız otomatik olarak güncel yıl gösterilir.' },
      { k: 'heroImage', t: 'image', l: 'Varsayılan manşet görseli', help: 'Öne çıkan yazının kapağı yoksa kullanılır.' },
      { k: 'showStats', t: 'switch', l: 'İstatistik bandını göster', help: 'Ana sayfada “… yazı, … video …” cümlesi.' }
    ];
    view.innerHTML = `
      <div class="vh"><div><h1>Ayarlar & Tema</h1><p>Site kimliği, renk teması, sosyal medya bağlantıları ve panel şifresi.</p></div>
        <div class="vh-actions"><button class="btn btn-acid" data-save>Ayarları Kaydet</button></div></div>
      <div class="form-grid">
        <div>
          <form class="card" id="frm" novalidate><h3>Site kimliği</h3>${F.map((f) => field(f, st[f.k])).join('')}</form>
          <div class="card">
            <h3>Manşet Üst Bilgi Gradyanı (Karartma)</h3>
            <p class="muted" style="margin:0 0 14px;font-size:12px">Menü bağlantılarının görsel üzerinde rahatça okunabilmesi için menüden aşağıya doğru süzülen siyah gradyan.</p>
            <label class="sw" style="padding:0">
              <span class="swl">Üst Menü Siyah Gradyanı<small>Kapak görselinin üst kısmını yumuşakça karartır.</small></span>
              <input type="checkbox" id="stTopGrad" ${D.settings.featured?.topGradient !== false ? 'checked' : ''}><span class="tg"></span>
            </label>
            <div style="margin-top:14px;${D.settings.featured?.topGradient === false ? 'opacity:0.35;pointer-events:none' : ''}" id="stTopGradWrap">
              <div style="display:flex;justify-content:space-between;margin-bottom:6px">
                <span style="font-size:12px;color:var(--fg-2)">Gradyan Opaklığı / Şeffaflık (Transparency)</span>
                <span id="stTopGradVal" style="font-family:var(--mono);color:var(--acid);font-size:12px">%${D.settings.featured?.topGradientOpacity ?? 85}</span>
              </div>
              <input type="range" class="range" id="stTopGradOp" min="10" max="100" step="5" value="${D.settings.featured?.topGradientOpacity ?? 85}">
              <div class="range-labels"><span>Şeffaf (%10)</span><span>Belirgin / Koyu (%100)</span></div>
            </div>
          </div>
          <div class="card"><h3>Sosyal medya</h3><div class="row2">${SOCIALS.map(([k, l]) => `<label class="fld"><span>${l}</span><input type="${k === 'email' ? 'email' : 'url'}" data-so="${k}" value="${esc((st.social || {})[k] || '')}" placeholder="${k === 'email' ? 'ornek@mail.com' : 'https://...'}"></label>`).join('')}</div><small class="help" style="margin-top:-6px">Boş bırakılan bağlantılar sitede gösterilmez.</small></div>
        </div>
        <div class="form-side">
          <div class="card"><h3>Renk teması</h3>
            <div class="swatches">${PRESETS.map(([c, n]) => `<button type="button" class="swatch ${c === acc ? 'on' : ''}" data-c="${c}" title="${n}" style="background:${c}"></button>`).join('')}</div>
            <div class="colorin" style="margin-top:14px"><input type="color" id="accColor" value="${acc}"><input type="text" id="accHex" value="${acc}" maxlength="7"></div>
            <div class="theme-prev"><div class="e">Son yazı · Önizleme</div><div class="h">${esc(st.siteName)}</div><span class="btn btn-acid btn-sm">Vurgu rengi</span></div>
          </div>
          <form class="card" id="pwd" autocomplete="off"><h3>Panel şifresi</h3>
            <label class="fld"><span>Mevcut şifre</span><input type="password" id="pw0" autocomplete="current-password"></label>
            <label class="fld"><span>Yeni şifre</span><input type="password" id="pw1" autocomplete="new-password"></label>
            <label class="fld"><span>Yeni şifre (tekrar)</span><input type="password" id="pw2" autocomplete="new-password"></label>
            <button class="btn btn-block" type="submit">Şifreyi Değiştir</button>
          </form>
          <button type="button" class="btn btn-acid btn-block" data-save>Ayarları Kaydet</button>
        </div>
      </div>`;

    const frm = $('#frm');
    bindForm(view);
    let accent = acc;
    const setAcc = (c) => {
      if (!/^#[0-9a-f]{6}$/i.test(c)) return;
      accent = c.toUpperCase();
      $('#accColor').value = accent; $('#accHex').value = accent;
      $$('.swatch').forEach((s) => s.classList.toggle('on', s.dataset.c === accent));
      applyAccent(accent);
      dirty = true;
    };
    $$('.swatch').forEach((s) => s.addEventListener('click', () => setAcc(s.dataset.c)));
    $('#accColor').addEventListener('input', (e) => setAcc(e.target.value));
    $('#accHex').addEventListener('input', (e) => setAcc(e.target.value));

    const stTg = $('#stTopGrad'), stOpWrap = $('#stTopGradWrap'), stOp = $('#stTopGradOp'), stOpVal = $('#stTopGradVal');
    if (stTg) {
      stTg.addEventListener('change', () => {
        if (stOpWrap) {
          stOpWrap.style.opacity = stTg.checked ? '1' : '0.35';
          stOpWrap.style.pointerEvents = stTg.checked ? 'auto' : 'none';
        }
        dirty = true;
      });
    }
    if (stOp) {
      stOp.addEventListener('input', () => {
        if (stOpVal) stOpVal.textContent = `%${stOp.value}`;
        dirty = true;
      });
    }

    const save = () => {
      const v = collect(frm, F);
      if (!v.siteName) { toast('Site adı zorunludur', true); return; }
      Object.assign(D.settings, v, { accent });
      D.settings.social = D.settings.social || {};
      $$('[data-so]').forEach((i) => { D.settings.social[i.dataset.so] = i.value.trim(); });
      D.settings.featured = D.settings.featured || {};
      if (stTg) D.settings.featured.topGradient = stTg.checked;
      if (stOp) D.settings.featured.topGradientOpacity = Number(stOp.value);
      if (persist('Ayarlar kaydedildi')) {
        dirty = false;
        $('#sideBrand').textContent = D.settings.siteName;
      }
    };
    $$('[data-save]', view).forEach((b) => b.addEventListener('click', save));
    view._save = save;

    $('#pwd').addEventListener('submit', (e) => {
      e.preventDefault();
      const p0 = $('#pw0').value, p1 = $('#pw1').value, p2 = $('#pw2').value;
      if (S.hash(p0) !== currentHash()) { toast('Mevcut şifre hatalı', true); return; }
      if (p1.length < 4) { toast('Yeni şifre en az 4 karakter olmalı', true); return; }
      if (p1 !== p2) { toast('Yeni şifreler eşleşmiyor', true); return; }
      D.settings.adminHash = S.hash(p1);
      if (persist('Şifre değiştirildi')) {
        sessionStorage.setItem(SESSION, currentHash());
        e.target.reset();
      }
    });
  }

  /* ======================================================================
     Yayın & SEO
     ====================================================================== */
  const SEO_SETTINGS = [
    { k: 'siteUrl', t: 'url', l: 'Site adresi', ph: 'https://alanadiniz.com/', help: 'Kendi alan adınızı GitHub Pages’e bağladıysanız yazın. Boşsa GitHub Pages adresi kullanılır.' },
    { k: 'ogImage', t: 'image', l: 'Varsayılan paylaşım görseli', help: 'Kendi görseli olmayan sayfalar paylaşıldığında görünür. 1200×630 önerilir.' },
    { k: 'googleVerify', t: 'text', l: 'Google Search Console doğrulama kodu', ph: 'HTML etiketindeki content="…" değeri', help: 'Search Console → Mülk ekle → URL ön eki → <b>HTML etiketi</b>. Etiketin tamamını da yapıştırabilirsiniz.' },
    { k: 'bingVerify', t: 'text', l: 'Bing Webmaster Tools doğrulama kodu', ph: 'msvalidate.01 içeriği', help: 'Bing’de “Google Search Console’dan içe aktar” seçerseniz gerekmez.' },
    { k: 'aiTraining', t: 'switch', l: 'Yapay zekâ eğitimine izin ver', help: 'Kapatırsanız içerikleriniz yapay zekâ modellerinin eğitiminde kullanılmaz; ChatGPT, Claude ve Perplexity aramalarında görünmeye devam edersiniz. En geniş görünürlük için açık bırakın.' }
  ];
  const fmtTime = (t) => new Date(t).toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  const siteAddress = () => (D.settings.seo || {}).siteUrl || Yayin.pagesUrl(Yayin.config().repo);

  // Kenar çubuğundaki küçük yayın durumu
  function paintPubPill(s) {
    const el = $('#pubStatus');
    if (!el) return;
    const [cls, txt] = !s.ready ? ['off', 'Yayına bağlı değil']
      : s.s === 'waiting' || s.s === 'running' ? ['busy', 'Yayınlanıyor…']
      : s.s === 'error' || (s.s === 'idle' && s.last && !s.last.ok) ? ['err', 'Yayın hatası']
      : !s.auto ? ['off', 'Otomatik yayın kapalı']
      : ['ok', s.last ? 'Yayında · ' + new Date(s.last.at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : 'Yayına hazır'];
    el.className = 'pubpill ' + cls;
    el.textContent = txt;
    el.hidden = false;
  }

  function pubStateHTML(s) {
    const c = Yayin.config();
    const url = siteAddress();
    const links = c.repo ? `<p class="pub-links"><a href="https://github.com/${esc(c.repo)}/actions" target="_blank" rel="noopener">GitHub’da ilerlemeyi gör ↗</a>${url ? `<a href="${esc(url)}" target="_blank" rel="noopener">Siteyi aç ↗</a>` : ''}</p>` : '';
    if (!s.ready) return '<p class="pub-line off">GitHub bağlantısı kurulmadı. Sağdaki kartı doldurun.</p>';
    if (s.s === 'waiting') return '<p class="pub-line busy">Değişiklikler birkaç saniye içinde gönderilecek…</p>' + links;
    if (s.s === 'running') return '<p class="pub-line busy">GitHub’a gönderiliyor…</p>' + links;
    const l = s.last;
    if (!l) return '<p class="pub-line">Henüz yayın yapılmadı. <b>Şimdi Yayınla</b> ile ilk yayını başlatın.</p>' + links;
    if (!l.ok) return `<p class="pub-line err">✕ Gönderilemedi (${esc(fmtTime(l.at))}): ${esc(l.msg)}</p>` + links;
    return `<p class="pub-line ok">✓ ${l.changed === false ? 'Yayındaki site güncel' : 'Gönderildi'} · ${esc(fmtTime(l.at))}</p>
      <p class="muted">GitHub siteyi yaklaşık 1 dakikada derleyip yayınlar.${url ? ` Adres: <a href="${esc(url)}" target="_blank" rel="noopener">${esc(url)}</a>` : ''}</p>` + links;
  }

  /** Yayın öncesi kontrol listesi: [durum ok|warn|info, başlık, açıklama, bağlantı] */
  function publishChecks() {
    const st = D.settings, seo = st.seo || {}, a = D.about || {}, so = st.social || {};
    const O = window.AKCAN_ORNEK || {};
    const live = (c) => (D[c] || []).filter((x) => x.published !== false && !S.isSample(x));
    const own = ['posts', 'podcasts', 'remixes', 'pages'].reduce((n, c) => n + live(c).length, 0);
    const nSamples = ['posts', 'podcasts', 'remixes', 'pages'].reduce((n, c) => n + (D[c] || []).filter(S.isSample).length, 0);
    const noDesc = ['posts', 'podcasts', 'remixes'].flatMap(live).filter((x) => !(x.seoDesc || x.excerpt));
    const noAlt = [...live('posts').filter((p) => S.postKind(p) === 'yazi'), ...live('podcasts'), ...live('remixes'), ...live('pages')].filter((x) => x.cover && !x.coverAlt);
    const badSocial = SOCIALS.filter(([k]) => k !== 'email' && so[k] && !S.isProfile(so[k])).map(([, l]) => l);
    const sampleAbout = !!(O.about && a.bio && a.bio === O.about.bio);
    const ownRole = a.role && !(O.about && a.role === O.about.role);
    const picsum = /picsum\.photos/.test(JSON.stringify(Yayin.publicData(D)));
    const repo = Yayin.config().repo;
    const subPath = !seo.siteUrl && repo && !/\.github\.io$/i.test(repo.split('/')[1] || '');
    return [
      [Yayin.ready() ? 'ok' : 'warn', 'GitHub bağlantısı', Yayin.ready() ? 'Kaydettiğiniz içerik otomatik olarak yayına gider.' : 'Sağdaki “GitHub bağlantısı” kartını doldurun.', ''],
      [own ? 'ok' : 'warn', 'Kendi içerikleriniz', own ? `${own} içerik yayında.` : 'Henüz kendi içeriğiniz yok. Örnek içerikler yayına gönderilmez.', '#posts/new/video'],
      [nSamples ? 'info' : 'ok', 'Örnek içerikler', nSamples ? `${nSamples} örnek içerik panelde duruyor; yayına gönderilmez. İsterseniz hepsini tek tıkla silebilirsiniz.` : 'Panelde örnek içerik yok.', nSamples ? 'del-samples' : ''],
      [sampleAbout || !a.bio ? 'warn' : 'ok', 'Hakkında sayfası', sampleAbout ? 'Hakkında sayfasında örnek metin duruyor. Kendi biyografinizi yazın: Google ve yapay zekâ sizi bu sayfadan tanır.' : a.bio ? 'Biyografiniz yazılmış.' : 'Biyografinizi yazın: Google ve yapay zekâ sizi bu sayfadan tanır.', '#about'],
      [ownRole ? 'ok' : 'warn', 'Kısa tanım', ownRole ? `“${esc(a.role)}”` : 'Hakkında’ya kim olduğunuzu anlatan tek cümlelik kendi tanımınızı yazın (ör. “Müzik prodüktörü ve DJ”).', '#about'],
      [badSocial.length ? 'warn' : 'ok', 'Sosyal medya profilleri', badSocial.length ? `${badSocial.join(', ')} bağlantısı bir profil adresi değil (ör. https://www.youtube.com/@kanaliniz); sitede gösterilmez.` : 'Profil bağlantılarınız arama motorlarına “aynı kişi” olarak bildirilir.', '#settings'],
      [/ornek\.com$/i.test(so.email || '') ? 'warn' : 'ok', 'E-posta adresi', /ornek\.com$/i.test(so.email || '') ? `“${esc(so.email)}” örnek bir adres; kendi adresinizi yazın ya da silin.` : 'Örnek adres kullanılmıyor.', '#settings'],
      [picsum ? 'warn' : 'ok', 'Örnek görseller', picsum ? 'Yayına giden ayarlarda ya da içeriklerde örnek görsel (picsum.photos) var: manşet görseli, podcast kapağı, Hakkında fotoğrafı… Kendi görsellerinizi yükleyin.' : 'Örnek görsel kullanılmıyor.', '#settings'],
      [noDesc.length ? 'warn' : 'ok', 'Özetler', noDesc.length ? `${noDesc.length} içeriğin özeti yok; arama sonucunda metnin başı gösterilir.` : 'Tüm içeriklerin özeti var.', ''],
      [noAlt.length ? 'info' : 'ok', 'Kapak açıklamaları', noAlt.length ? `${noAlt.length} kapak görselinin açıklaması (alt metin) yok; başlık kullanılacak.` : 'Kapak görsellerinin açıklaması var.', ''],
      [subPath ? 'info' : 'ok', 'Alan adı', subPath ? 'Site github.io altındaki bir klasörde yayınlanıyor. Çalışır, ama kendi alan adınız (ör. akcan.com) arama sonuçlarında daha güçlüdür ve robots.txt ancak alan adının kökünde okunur.' : 'Site kendi adresinin kökünde yayınlanıyor.', ''],
      [seo.googleVerify ? 'ok' : 'info', 'Google Search Console', seo.googleVerify ? 'Doğrulama kodu eklendi.' : 'Site yayına çıkınca Search Console’a ekleyip doğrulama kodunu aşağıya yapıştırın.', '']
    ];
  }

  function publishView() {
    resetViewHandlers();
    crumbs(['Yayın & SEO']);
    view.dataset.form = '1';
    const seo = D.settings.seo || {};
    const c = Yayin.config();
    const ICO = { ok: '✓', warn: '!', info: 'i' };
    const checks = publishChecks();
    const url = siteAddress();
    view.innerHTML = `
      <div class="vh"><div><h1>Yayın & SEO</h1><p>Siteniz GitHub Pages’te yayınlanır. Kaydettiğiniz her değişiklik birkaç saniye içinde GitHub’a gönderilir; arama motorlarının ve yapay zekâ asistanlarının okuyacağı sayfalar orada hazırlanır.</p></div>
        <div class="vh-actions">${url ? `<a class="btn btn-ghost" href="${esc(url)}" target="_blank" rel="noopener">Siteyi aç ↗</a>` : ''}<button class="btn btn-acid" id="pubNow">⇪ Şimdi Yayınla</button></div></div>
      <div class="form-grid">
        <div>
          <div class="card"><h3>Yayın durumu</h3><div id="pubState"></div></div>
          <form class="card" id="frm" novalidate><h3>Arama motorları ve yapay zekâ</h3>${SEO_SETTINGS.map((f) => field(f, f.k === 'aiTraining' ? seo.aiTraining !== false : seo[f.k])).join('')}
            <button type="button" class="btn btn-acid" data-save>SEO Ayarlarını Kaydet</button></form>
          <div class="card"><h3>Yayın öncesi kontrol listesi</h3>
            <ul class="checks">${checks.map(([s, t, d, act]) => `<li class="${s}"><i>${ICO[s]}</i><div><b>${t}</b><span>${d}</span>${act === 'del-samples' ? '<button type="button" class="btn btn-sm btn-danger" id="delSamples">Örnek içerikleri sil</button>' : act ? `<a href="${act}">Düzenle →</a>` : ''}</div></li>`).join('')}</ul>
          </div>
          <div class="card"><h3>Site dışında yapılacaklar</h3>
            <ol class="todo">
              <li><b>Google Search Console</b> — <a href="https://search.google.com/search-console" target="_blank" rel="noopener">search.google.com/search-console</a>: siteyi ekleyin, doğrulayın ve <code>${esc(url || 'site-adresiniz/')}sitemap.xml</code> adresini gönderin.</li>
              <li><b>Bing Webmaster Tools</b> — <a href="https://www.bing.com/webmasters" target="_blank" rel="noopener">bing.com/webmasters</a>: “Google Search Console’dan içe aktar” ile tek tıkla. ChatGPT’nin web araması büyük ölçüde Bing’den beslenir.</li>
              <li><b>YouTube</b> — her videonun açıklamasına sitedeki yazının bağlantısını, kanalın “Hakkında” bölümüne site adresini ekleyin.</li>
              <li><b>Profiller</b> — Instagram, Spotify, SoundCloud ve X profillerinize site adresini yazın; her yerde aynı isim, aynı kısa biyografi, aynı fotoğraf.</li>
              <li><b>Video ve bölüm metinleri</b> — her videonun yazıya dökülmüş metnini yazının içeriğine, her bölümün metnini “Bölüm metni”ne ekleyin. Yapay zekâ videoyu izleyemez, metni okur.</li>
              <li><b>Bahsedilmek</b> — konuk olduğunuz podcast’ler, röportajlar, forumlar… Başka sitelerde adınızın ve site adresinizin geçmesi sıralamayı en çok etkileyen şeydir.</li>
            </ol>
          </div>
        </div>
        <div class="form-side">
          <form class="card" id="ghForm" autocomplete="off"><h3>GitHub bağlantısı</h3>
            <label class="fld"><span>Depo</span><input type="text" id="ghRepo" value="${esc(c.repo)}" placeholder="kullanici-adi/depo-adi" spellcheck="false"><small>GitHub’daki deponuzun adı, ör. <code>akcan/akcan-site</code>.</small></label>
            <label class="fld"><span>Erişim anahtarı</span><input type="password" id="ghToken" value="${esc(c.token)}" placeholder="github_pat_…" autocomplete="new-password"><small>Yalnızca bu tarayıcıda saklanır; yedeğe ve siteye girmez. <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">Anahtar oluştur ↗</a></small></label>
            <label class="sw" style="padding:4px 0 14px"><span class="swl">Her kaydetmede otomatik yayınla<small>Kaydettikten birkaç saniye sonra değişiklikler GitHub’a gönderilir.</small></span><input type="checkbox" id="ghAuto" ${c.auto ? 'checked' : ''}><span class="tg"></span></label>
            <div class="btn-row"><button type="button" class="btn" id="ghTest">Bağlantıyı test et</button><button type="submit" class="btn btn-acid">Kaydet</button></div>
            <p class="muted" id="ghInfo" style="margin:12px 0 0"></p>
          </form>
          <div class="card"><h3>İlk kurulum (bir kez)</h3>
            <ol class="todo">
              <li>GitHub’da <b>herkese açık</b> bir depo oluşturup site klasörünü yükleyin (README’de adım adım anlatılıyor).</li>
              <li>Depoda <b>Settings → Pages → Build and deployment → Source: GitHub Actions</b> seçin.</li>
              <li><a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">Yeni erişim anahtarı</a> oluşturun: <b>Repository access</b> → “Only select repositories” → bu depo; <b>Permissions → Contents → Read and write</b>.</li>
              <li>Depo adını ve anahtarı yukarıya yazıp kaydedin, <b>Şimdi Yayınla</b>’ya basın.</li>
            </ol>
          </div>
        </div>
      </div>`;

    $('#pubState').innerHTML = pubStateHTML(Yayin.status());

    const frm = $('#frm');
    bindForm(frm);
    const save = () => {
      const v = collect(frm, SEO_SETTINGS);
      // Etiketin tamamı yapıştırıldıysa yalnızca kodu al
      ['googleVerify', 'bingVerify'].forEach((k) => { v[k] = ((v[k] || '').match(/content=["']([^"']+)["']/) || [, v[k] || ''])[1].trim(); });
      if (v.siteUrl && !/^https?:\/\/[^/]+/i.test(v.siteUrl)) { toast('Site adresi https:// ile başlamalı', true); return; }
      if (v.siteUrl) v.siteUrl = v.siteUrl.replace(/\/*$/, '/');
      D.settings.seo = { ...(D.settings.seo || {}), ...v };
      if (persist('SEO ayarları kaydedildi')) { dirty = false; publishView(); }
    };
    $$('[data-save]', view).forEach((b) => b.addEventListener('click', save));
    view._save = save;

    const ghVals = () => ({ repo: $('#ghRepo').value.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$|\/+$/g, ''), token: $('#ghToken').value.trim(), auto: $('#ghAuto').checked });
    $('#ghForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const v = ghVals();
      if (v.repo && !/^[\w.-]+\/[\w.-]+$/.test(v.repo)) { toast('Depo adı “kullanıcı/depo” biçiminde olmalı', true); return; }
      Yayin.setConfig(v);
      dirty = false;
      toast('GitHub bağlantısı kaydedildi');
      paintPubPill(Yayin.status());
      publishView();
    });
    $('#ghTest').addEventListener('click', async () => {
      const v = ghVals(), info = $('#ghInfo');
      if (!/^[\w.-]+\/[\w.-]+$/.test(v.repo) || !v.token) { info.textContent = 'Depo adını ve erişim anahtarını yazın.'; return; }
      info.textContent = 'Deneniyor…';
      try {
        const r = await Yayin.test(v.repo, v.token);
        info.innerHTML = `✓ <b>${esc(r.name)}</b> deposuna erişildi.${r.private ? ' <span style="color:#FFB020">Depo gizli: ücretsiz GitHub Pages için herkese açık olmalı.</span>' : ''} Site adresi: <code>${esc(r.pages)}</code>`;
      } catch (err) { info.textContent = '✕ ' + err.message; }
    });
    $('#pubNow').addEventListener('click', () => {
      if (!Yayin.ready()) { toast('Önce GitHub bağlantısını kaydedin', true); $('#ghRepo').focus(); return; }
      Yayin.run();
    });
    const del = $('#delSamples');
    if (del) del.addEventListener('click', () => {
      if (!confirm('Panel’deki bütün örnek içerikler (videolar, yazılar, bölümler, remixler, sayfalar) silinsin mi? Kendi içerikleriniz değişmez.')) return;
      const ids = new Set(['posts', 'podcasts', 'remixes', 'pages'].flatMap((k) => (D[k] || []).filter(S.isSample).map((x) => x.id)));
      const slugs = new Set((D.pages || []).filter((p) => ids.has(p.id)).map((p) => p.slug));
      ['posts', 'podcasts', 'remixes', 'pages'].forEach((k) => { D[k] = (D[k] || []).filter((x) => !ids.has(x.id)); });
      // Silinen örnek sayfalara giden menü öğeleri de kalkar (aynı adreste kendi sayfanız varsa kalır)
      const left = new Set((D.pages || []).map((p) => p.slug));
      D.menu = (D.menu || []).filter((m) => !(m.type === 'page' && slugs.has(m.target) && !left.has(m.target)));
      if (D.settings.featured && ids.has(D.settings.featured.id)) D.settings.featured.id = '';
      if (persist('Örnek içerikler silindi')) publishView();
    });
  }

  /* ======================================================================
     Yedekleme
     ====================================================================== */
  function backupView() {
    resetViewHandlers();
    crumbs(['Yedekleme']);
    const used = storageBytes();
    view.innerHTML = `
      <div class="vh"><div><h1>Yedekleme</h1><p>Tüm site içeriğini tek bir dosya olarak indirin, başka bir bilgisayara taşıyın veya geri yükleyin.</p></div></div>
      <div class="alert"><span>ℹ</span><div>İçerikler şu anda <b>bu tarayıcının</b> depolama alanında tutuluyor (${fmtBytes(used)}). Tarayıcı verilerini temizlerseniz içerikler silinir — düzenli olarak yedek alın. Yayındaki içeriklerin bir kopyası GitHub'da da durur, ama taslaklar yalnızca burada ve yedek dosyasındadır.</div></div>
      <div class="backup-grid">
        <div class="card" style="margin:0"><h3>Dışa aktar</h3><p class="muted">Tüm yazılar, videolar, podcastler, remixler, sayfalar, menü ve ayarlar.</p><button class="btn btn-acid btn-block" id="exp">⇣ Yedeği İndir (.json)</button></div>
        <div class="card" style="margin:0"><h3>İçe aktar</h3><p class="muted">Daha önce indirdiğiniz yedek dosyasını yükleyin. Mevcut içerik değiştirilir.</p><button class="btn btn-block" id="imp">⇡ Yedek Dosyası Seç</button><input type="file" id="impFile" accept="application/json,.json" hidden></div>
        <div class="card" style="margin:0"><h3>Örnek içerikler</h3><p class="muted">Silinen örnek videoları, yazıları, bölümleri, remixleri ve sayfaları geri ekler. Kendi içerikleriniz değişmez.</p><button class="btn btn-block" id="smp">＋ Örnek İçerikleri Ekle</button></div>
        <div class="card" style="margin:0"><h3>Sıfırla</h3><p class="muted">Tüm içeriği silip örnek içeriğe döner. Önce yedek almanız önerilir.</p><button class="btn btn-danger btn-block" id="rst">Fabrika Ayarlarına Dön</button></div>
      </div>`;

    $('#exp').addEventListener('click', () => {
      const blob = new Blob([S.exportJSON()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${S.slugify(D.settings.siteName) || 'site'}-yedek-${today()}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      toast('Yedek indirildi');
    });
    $('#imp').addEventListener('click', () => $('#impFile').click());
    $('#impFile').addEventListener('change', (e) => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          if (!confirm('Mevcut tüm içerik bu yedekle değiştirilecek. Devam edilsin mi?')) return;
          D = S.importJSON(r.result);
          sessionStorage.setItem(SESSION, currentHash());
          toast('Yedek geri yüklendi');
          showApp();
        } catch (err) { toast('Geçersiz yedek dosyası', true); }
      };
      r.readAsText(f);
    });
    $('#smp').addEventListener('click', () => {
      const n = S.addSamples(D);
      if (!n) { toast('Bütün örnek içerikler zaten mevcut'); return; }
      persist(`${n} örnek içerik eklendi`);
    });
    $('#rst').addEventListener('click', () => {
      if (!confirm('TÜM içerik silinecek ve örnek içerik yüklenecek. Emin misiniz?')) return;
      if (!confirm('Son kez soruyoruz: Bu işlem geri alınamaz. Devam edilsin mi?')) return;
      D = S.reset();
      sessionStorage.setItem(SESSION, currentHash());
      toast('Site sıfırlandı');
      showApp();
    });
  }

  function resetViewHandlers() {
    view.onclick = view.oninput = view.onchange = view.onmousedown = view.ondragstart = view.ondragover = view.ondrop = view.ondragend = null;
  }

  /* ======================================================================
     Kenar çubuğu (mobil) & kısayollar
     ====================================================================== */
  let overlay = null;
  function closeSide() { $('#side').classList.remove('open'); if (overlay) { overlay.remove(); overlay = null; } }
  $('#hamb').addEventListener('click', () => {
    $('#side').classList.add('open');
    overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.addEventListener('click', closeSide);
    document.body.appendChild(overlay);
  });

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      if (view._save && view.dataset.form) { e.preventDefault(); view._save(); }
      else if ($('[data-msave]')) { e.preventDefault(); $('[data-msave]').click(); }
    }
  });

  // Görünüm değişince eski kaydetme fonksiyonunu temizle
  const _route = route;
  route = function () { view._save = null; resetViewHandlers(); _route(); }; // eslint-disable-line no-func-assign

  // Başka sekmede değişiklik olursa veriyi tazele (form açık değilse)
  window.addEventListener('storage', (e) => {
    if (e.key !== S.KEY) return;
    D = S.get();
    if (!dirty && isAuthed()) route();
  });

  /* ======================================================================
     Başlat
     ====================================================================== */
  // Her kayıttan sonra yayındaki site otomatik güncellenir (GitHub bağlantısı kuruluysa)
  S.onSave(() => Yayin.schedule());
  Yayin.onChange((s) => {
    paintPubPill(s);
    const el = $('#pubState');
    if (el) el.innerHTML = pubStateHTML(s);
  });
  if (isAuthed()) showApp(); else showLogin();
})();
