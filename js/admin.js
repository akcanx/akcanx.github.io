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

  // reserved: kullanılamayacak bağlantılar (aynı sekmenin alt kategorileri)
  function uniqueSlug(coll, slug, selfId, reserved) {
    let base = slug || 'icerik', s = base, n = 2;
    while ((D[coll] || []).some((x) => x.slug === s && x.id !== selfId) || (reserved && reserved.has(s))) s = `${base}-${n++}`;
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

  // Videolar ve yazılar aynı koleksiyonda (D.posts) durur; tür (kind) sitede hangi sekmede görüneceğini belirler
  const postFields = (kind) => [
    { k: 'title', t: 'title', l: 'Başlık', req: true },
    ...(kind === 'video'
      ? [{ k: 'video', t: 'youtube', l: 'YouTube video bağlantısı', req: true, ph: 'https://www.youtube.com/watch?v=...', help: 'Bağlantıyı yapıştırın; başlık boşsa videonun adı otomatik gelir, küçük resim YouTube’dan alınır.' }]
      : [
        { k: 'cover', t: 'image', l: 'Kapak görseli', req: true, help: 'Yazının üstünde gösterilir; listelerde küçük resim olarak da kullanılır.' },
        { k: 'coverAlt', t: 'text', l: 'Kapak görseli açıklaması (alt metin)', ph: 'Görselde ne var?', help: ALT_HELP }
      ]),
    { k: 'excerpt', t: 'textarea', l: 'Özet', rows: 3, help: 'Sayfanın başında büyük italik giriş olarak, ayrıca listelerde ve ana sayfa manşetinde görünür. Arama sonucunda da açıklama olarak kullanılır.' },
    { k: 'content', t: 'richtext', l: 'İçerik', help: (kind === 'video' ? 'Videonun yazıya dökülmüş metnini buraya ekleyin: arama motorları ve yapay zekâ videoyu izleyemez, bu metni okur. ' : '') + 'Görsel eklerken yerleşimi seçebilirsiniz: ortada, sağa yaslı, sola yaslı veya geniş.' },
    { k: 'sources', t: 'textarea', l: 'Notlar ve kaynaklar', rows: 4, ph: 'Başlık | https://adres\nBaşka bir kaynak | https://...', help: 'Her satıra bir kaynak: <code>Başlık | Bağlantı</code>. Sayfanın sonunda açılır liste olarak görünür.' },
    { k: 'credits', t: 'textarea', l: 'Görsel kaynakları ve lisanslar', rows: 3, ph: 'Kapak: Fotoğrafçı adı, lisans', help: 'Her satıra bir görsel kaynağı. İsteğe bağlı olarak <code>| bağlantı</code> ekleyebilirsiniz.' },
    { k: 'published', t: 'switch', l: 'Yayında', help: 'Kapalıysa taslak olarak saklanır.', side: 'Yayın' },
    { k: 'featured', t: 'switch', l: 'Öne çıkar', help: 'Ana sayfa manşetinde gösterilir.', side: 'Yayın' },
    { k: 'date', t: 'date', l: 'Yayın tarihi', side: 'Yayın' },
    ...(kind === 'video' ? [{ k: 'duration', t: 'text', l: 'Video süresi', ph: '12:34', side: 'Yayın', help: 'İsteğe bağlı. Google video sonuçlarında ve sayfada tarihin yanında görünür: <code>12:34</code>, <code>1:02:15</code> ya da <code>45 dk</code>.' }] : []),
    { k: 'slug', t: 'slug', l: 'Bağlantı (slug)', from: 'title', side: 'Yayın', help: `Adres: /${kind === 'video' ? 'videolar' : 'yazilar'}/<b>baglanti</b>/. Boş bırakılırsa başlıktan oluşturulur.` },
    { k: 'cat', t: 'cat', l: 'Alt kategori', tab: kind, side: 'Alt kategori' },
    { k: 'tint', t: 'color', l: 'Sayfa tonu', side: 'Görünüm', help: `Sayfanın arka plan rengi. Boş bırakılırsa ${kind === 'video' ? 'videodan' : 'kapaktan'} otomatik seçilir.` },
    { k: 'tags', t: 'tags', l: 'Kavramlar / etiketler', side: 'Etiketler', help: 'İlk üçü sayfanın üstündeki konum satırında, hepsi sayfanın sonunda görünür.' },
    ...SEO_FIELDS
  ];
  const postSub = (x) => [(x.tags || []).join(', '), x.featured ? '★ Öne çıkan' : ''].filter(Boolean).join(' · ');

  // coll: verinin durduğu koleksiyon (yoksa bölümün adı), kind: koleksiyonda bu bölüme düşen tür
  const TYPES = {
    videos: {
      title: 'Videolar', one: 'Video', icon: '▶', coll: 'posts', kind: 'video',
      desc: 'Sitedeki Videolar sekmesi. Video sayfasının üstünde YouTube oynatıcı görünür ve kaydırınca solda sabit kalır. Videonun yazıya dökülmüş metnini eklemeyi unutmayın: arama motorları videoyu izleyemez, metni okur.',
      view: (x) => '#/videolar/' + x.slug,
      thumb: (x) => S.ytThumb(x.video, 'mqdefault'),
      sub: postSub,
      fields: postFields('video')
    },
    posts: {
      title: 'Yazılar', one: 'Yazı', icon: '✎', coll: 'posts', kind: 'yazi',
      desc: 'Sitedeki Yazılar sekmesi: kapak görselli blog yazılarınız. Yazı sayfasının üstünde kapak görseli durur.',
      view: (x) => '#/yazilar/' + x.slug,
      thumb: (x) => x.cover,
      sub: postSub,
      fields: postFields('yazi')
    },
    podcasts: {
      title: 'Podcast Bölümleri', one: 'Bölüm', icon: '◉',
      desc: 'Her bölüm bir seriye bağlıdır. MP3 bağlantısı ekleyerek sitedeki oynatıcıda dinletin veya Spotify / SoundCloud bağlantısı gömün. Seri kapakları ve tanıtımları ◫ Seriler’de.',
      view: (x) => '#/podcast/' + ((S.seriesOf(D, x) || {}).slug || '') + '/' + x.slug,
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
        { k: 'slug', t: 'slug', l: 'Bağlantı (slug)', from: 'title', side: 'Yayın', help: 'Bölümün adresi: /podcast/seri/<b>baglanti</b>/. Boş bırakılırsa başlıktan oluşturulur.' },
        { k: 'series', t: 'series', l: 'Seri', side: 'Seri' },
        { k: 'cover', t: 'image', l: 'Kapak (kare)', sq: true, side: 'Kapak' },
        { k: 'coverAlt', t: 'text', l: 'Kapak açıklaması (alt metin)', ph: 'Görselde ne var?', side: 'Kapak', help: ALT_HELP },
        { k: 'coverCredit', t: 'text', l: 'Kapak görseli kaynağı', ph: 'Fotoğraf: …, lisans', side: 'Kapak' },
        { k: 'tint', t: 'color', l: 'Sayfa tonu', side: 'Görünüm', help: 'Boş bırakılırsa kapaktan otomatik seçilir.' },
        { k: 'tags', t: 'tags', l: 'Etiketler', side: 'Etiketler' },
        ...SEO_FIELDS
      ]
    },
    // Podcast serileri: Podcast sekmesindeki vitrin (listedeki sıra = vitrindeki sıra); ekranı #series
    series: {
      title: 'Podcast Serileri', one: 'Seri', icon: '◫',
      desc: 'Podcast sekmesinde kapakları yan yana duran serileriniz. Vitrindeki sıra bu listedeki sıradır: ↑ ↓ ile değiştirin.',
      view: (x) => '#/podcast/' + x.slug,
      thumb: (x) => x.cover, sq: true,
      sub: (x) => [S.SERIES_STATUS[x.status], x.frequency].filter(Boolean).join(' · '),
      fields: [
        { k: 'title', t: 'title', l: 'Seri adı', req: true },
        { k: 'tagline', t: 'text', l: 'Kısa tanım', ph: 'Müziğin, sesin ve hafızanın izinde', help: 'Vitrindeki kartta adın altında tek satır olarak görünür.' },
        { k: 'description', t: 'textarea', l: 'Tanıtım metni', rows: 6, help: 'Seri sayfasında adın altında görünür: seri neyi anlatıyor, kimler için?' },
        { k: 'trailer', t: 'url', l: 'Fragman (isteğe bağlı)', ph: 'MP3 bağlantısı ya da YouTube / Spotify / SoundCloud bağlantısı', help: 'Ses dosyası seri sayfasında “▶ Fragmanı dinle” düğmesiyle çalar; diğer bağlantılar gömülü oynatıcı olur.' },
        { k: 'published', t: 'switch', l: 'Yayında', side: 'Yayın', help: 'Kapalıysa seri ve bölümleri sitede görünmez.' },
        { k: 'status', t: 'select', l: 'Durum', side: 'Yayın', options: Object.entries(S.SERIES_STATUS), help: '“Yakında” ve “Tamamlandı” vitrindeki kapağın köşesinde görünür.' },
        { k: 'frequency', t: 'text', l: 'Yayın sıklığı', ph: 'Her Pazartesi', side: 'Yayın' },
        { k: 'slug', t: 'slug', l: 'Bağlantı (slug)', from: 'title', side: 'Yayın', help: 'Serinin adresi: /podcast/<b>baglanti</b>/. Boş bırakılırsa addan oluşturulur.' },
        { k: 'cover', t: 'image', l: 'Kapak (kare)', sq: true, side: 'Kapak' },
        { k: 'coverAlt', t: 'text', l: 'Kapak açıklaması (alt metin)', ph: 'Görselde ne var?', side: 'Kapak', help: ALT_HELP },
        { k: 'tint', t: 'color', l: 'Işık rengi', side: 'Görünüm', help: 'Seri sayfasının üst kısmındaki yumuşak renkli ışık.' },
        { k: 'spotify', t: 'url', l: 'Spotify', ph: 'https://open.spotify.com/show/...', side: 'Dinleme platformları' },
        { k: 'apple', t: 'url', l: 'Apple Podcasts', ph: 'https://podcasts.apple.com/...', side: 'Dinleme platformları' },
        { k: 'youtube', t: 'url', l: 'YouTube', ph: 'https://www.youtube.com/playlist?list=...', side: 'Dinleme platformları' },
        ...SEO_FIELDS
      ]
    },
    // Kitaplar: basılı kitaplar ve satış platformları (listedeki sıra = vitrindeki sıra); ekranı #books
    books: {
      title: 'Kitaplar', one: 'Kitap', icon: '❐',
      desc: 'Basılı ve yayımlanmış kitaplarınız. Sitedeki Kitaplar sekmesinde kapakları yan yana durur; her kitabın kendi sayfasında künyesi ve satış platformlarına bağlantılar bulunur. Vitrindeki sıra bu listedeki sıradır: ↑ ↓ ile değiştirin.',
      view: (x) => '#/kitaplar/' + x.slug,
      thumb: (x) => x.cover,
      sub: (x) => [S.BOOK_STATUS[x.status], String(x.date || '').slice(0, 4), x.publisher].filter(Boolean).join(' · '),
      fields: [
        { k: 'title', t: 'title', l: 'Kitabın adı', req: true },
        { k: 'subtitle', t: 'text', l: 'Alt başlık', help: 'Kitap sayfasında adın altında italik olarak görünür.' },
        { k: 'tagline', t: 'text', l: 'Kısa tanıtım', ph: 'Müzik, hafıza ve duygular üzerine bir deneme', help: 'Vitrindeki kartta ve arama sonucunda tek satır.' },
        { k: 'description', t: 'richtext', l: 'Tanıtım metni', help: 'Kitap sayfasında: kitap neyi anlatıyor, kimler için? Arama motorları ve yapay zekâ bu metni okur.' },
        { k: 'quote', t: 'textarea', l: 'Kitaptan bir alıntı (isteğe bağlı)', rows: 2, help: 'Tanıtım metninin altında büyük italik alıntı olarak görünür.' },
        { k: 'published', t: 'switch', l: 'Yayında', side: 'Yayın' },
        { k: 'status', t: 'select', l: 'Durum', side: 'Yayın', options: Object.entries(S.BOOK_STATUS), help: '“Ön sipariş” ve “Yakında” vitrindeki kapağın köşesinde görünür.' },
        { k: 'date', t: 'date', l: 'Yayın tarihi', side: 'Yayın' },
        { k: 'slug', t: 'slug', l: 'Bağlantı (slug)', from: 'title', side: 'Yayın', help: 'Kitabın adresi: /kitaplar/<b>baglanti</b>/. Boş bırakılırsa addan oluşturulur.' },
        { k: 'publisher', t: 'text', l: 'Yayınevi', side: 'Künye' },
        { k: 'pages', t: 'number', l: 'Sayfa sayısı', side: 'Künye' },
        { k: 'isbn', t: 'text', l: 'ISBN', ph: '978-…', side: 'Künye' },
        { k: 'edition', t: 'text', l: 'Baskı', ph: '1. baskı', side: 'Künye' },
        { k: 'language', t: 'text', l: 'Dil', ph: 'Türkçe', side: 'Künye' },
        { k: 'format', t: 'select', l: 'Biçim', side: 'Künye', options: Object.entries(S.BOOK_FORMAT) },
        { k: 'cover', t: 'image', l: 'Kapak (dikey, 2:3)', tall: true, side: 'Kapak', help: 'Ön kapağın görseli, ör. 800×1200.' },
        { k: 'coverAlt', t: 'text', l: 'Kapak açıklaması (alt metin)', ph: 'Görselde ne var?', side: 'Kapak', help: ALT_HELP },
        ...S.BOOK_SHOPS.map(([k, n], i) => ({ k, t: 'url', l: n, ph: 'Kitabın ' + n + ' sayfası', side: 'Satış platformları', help: i ? '' : 'Kitabın o platformdaki sayfasının tam adresi. Boş bıraktığınız ya da yalnızca platformun ana adresini yazdığınız platform sitede görünmez.' })),
        { k: 'tint', t: 'color', l: 'Işık rengi', side: 'Görünüm', help: 'Kitap sayfasının üst kısmındaki yumuşak renkli ışık.' },
        { k: 'tags', t: 'tags', l: 'Konular / etiketler', side: 'Etiketler' },
        ...SEO_FIELDS
      ]
    },
    // Kaynaklar: araçlar, rehberler, bağlantılar (en yeni önde; ★ pinned: Kaynaklar sayfasında öne çıkar); ekranı #resources
    resources: {
      title: 'Kaynaklar', one: 'Kaynak', icon: '❖',
      desc: 'Videolarda, yazılarda ve bölümlerde andığınız araçlar, rehberler ve bağlantılar. Sitedeki Kaynaklar sekmesinde kartlar halinde durur; karta tıklanınca yan panelde açılır, her kaynağın kendi sayfası da vardır. ★ ile işaretledikleriniz en üstte büyük kartla görünür.',
      view: (x) => '#/kaynaklar/' + x.slug,
      thumb: (x) => x.cover,
      sub: (x) => [resTypeName(x.type), domainOf(x.url)].filter(Boolean).join(' · '),
      fields: [
        { k: 'title', t: 'title', l: 'Kaynağın adı', req: true },
        { k: 'summary', t: 'textarea', l: 'Kısa açıklama', rows: 3, help: 'Kartta (iki satır), yan panelde ve kaynak sayfasının girişinde görünür; arama sonucunda açıklama olarak kullanılır. 150–160 karakter önerilir.' },
        { k: 'body', t: 'richtext', l: 'Metin', help: 'Kaynak sayfasında: nedir, nasıl kullanılır, neden öneriyorsunuz? Yan panelde görünmez. Arama motorları ve yapay zekâ bu metni okur.' },
        { k: 'published', t: 'switch', l: 'Yayında', side: 'Yayın' },
        { k: 'pinned', t: 'switch', l: '★ Öne çıkan kaynak', side: 'Yayın', help: 'Kaynaklar sayfasının en üstünde büyük kartla görünür.' },
        { k: 'date', t: 'date', l: 'Eklenme tarihi', side: 'Yayın', help: 'Liste en yeniden eskiye sıralanır; son 30 gün içindekilerde "Yeni" rozeti çıkar.' },
        { k: 'slug', t: 'slug', l: 'Bağlantı (slug)', from: 'title', side: 'Yayın', help: 'Kaynağın adresi: /kaynaklar/<b>baglanti</b>/. Boş bırakılırsa addan oluşturulur.' },
        { k: 'type', t: 'select', l: 'Tür', side: 'Tür', options: () => [['', '— Türsüz —'], ...(D.settings.resourceTypes || []).map((t) => [t.id, t.name])], help: 'Türleri Kaynaklar → ▦ Türler ekranından düzenleyin.' },
        { k: 'cover', t: 'image', l: 'Kapak (16:9)', side: 'Kapak', help: 'Kartta ve kaynak sayfasında; ör. 1280×720.' },
        { k: 'coverAlt', t: 'text', l: 'Kapak açıklaması (alt metin)', ph: 'Görselde ne var?', side: 'Kapak', help: ALT_HELP },
        { k: 'url', t: 'url', l: 'Ana bağlantı', ph: 'https://…', side: 'Bağlantılar', help: 'Büyük "Kaynağa git" düğmesi; kartta alan adı görünür.' },
        { k: 'urlLabel', t: 'text', l: 'Düğme metni', ph: 'Kaynağa git', side: 'Bağlantılar' },
        { k: 'links', t: 'links', l: 'Ek bağlantılar', side: 'Bağlantılar', help: 'Kaynak sayfasında ve yan panelde "Bağlantılar" listesi; ↑ ↓ ile sıralayın.' },
        { k: 'related', t: 'related', l: 'Bu kaynağı anlattığım içerik', side: 'Sitedeki içerik', help: 'Seçtiğiniz videonun, yazının, bölümün ya da remixin sayfasında da "Bu içerikteki kaynaklar" listesi çıkar.' },
        { k: 'tint', t: 'color', l: 'Işık rengi', side: 'Görünüm', help: 'Kaynak sayfasının üst kısmındaki yumuşak renkli ışık.' },
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

  const collOf = (type) => TYPES[type].coll || type;
  const inType = (type, x) => !TYPES[type].kind || S.postKind(x) === TYPES[type].kind;
  // Bir videonun ya da yazının paneldeki bölümü
  const postType = (x) => (S.postKind(x) === 'video' ? 'videos' : 'posts');

  /* Alt kategorisi olan bölümler: panel bölümü → sekme (store.js CAT_KEYS) ve sitedeki adresi */
  const CAT_TABS = { videos: 'video', posts: 'yazi' };
  const TAB_TYPE = { video: 'videos', yazi: 'posts' };
  const SITE_ROUTE = { videos: 'videolar', posts: 'yazilar', podcasts: 'podcast', remixes: 'remixler' };
  const catsOf = (type) => (CAT_TABS[type] ? S.cats(D, CAT_TABS[type]) : []);
  const catOf = (type, x) => catsOf(type).find((c) => c.id === x.cat);
  // İçerik bağlantısı aynı sekmedeki bir alt kategorinin bağlantısıyla çakışamaz
  const catSlugs = (type) => new Set(catsOf(type).map((c) => c.slug));

  /* Liste sayfalarının üst bölüm ayarları (sitedeki "Videolar", "Yazılar", "Podcast" ve "Remixler" sayfalarının başı) */
  const SECTIONS = {
    videos: {
      key: 'videosPage', title: 'Videolar Sayfası', btn: 'Sayfa Ayarları',
      desc: 'Sitedeki Videolar sekmesinin başlığı, açıklaması ve başlığın arkasındaki ışık rengi.',
      fields: [
        { k: 'title', t: 'title', l: 'Sayfa başlığı' },
        { k: 'intro', t: 'textarea', l: 'Açıklama', rows: 4, help: 'Başlığın altında görünür.' },
        { k: 'tint', t: 'color', l: 'Işık rengi', side: 'Görünüm', help: 'Sayfanın üst kısmındaki yumuşak renkli ışık.' }
      ]
    },
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
      key: 'podcast', title: 'Podcast Sayfası', btn: 'Sayfa Ayarları',
      desc: 'Podcast sekmesinin (seri vitrini) başlığı, üst etiketi, tanıtım metni ve ışık rengi. Serilerin kapakları, tanıtımları ve platform bağlantıları ◫ Seriler’de.',
      fields: [
        { k: 'name', t: 'title', l: 'Sayfa başlığı' },
        { k: 'eyebrow', t: 'text', l: 'Üst etiket', ph: 'Podcast · Sesin hikâyeleri', help: 'Başlığın üstünde küçük büyük harflerle görünür.' },
        { k: 'description', t: 'textarea', l: 'Tanıtım metni', rows: 4, help: 'Başlığın altında, seri kapaklarının üstünde görünür.' },
        { k: 'tint', t: 'color', l: 'Işık rengi', side: 'Görünüm', help: 'Sayfanın üst kısmındaki yumuşak renkli ışık.' }
      ]
    },
    books: {
      key: 'booksPage', title: 'Kitaplar Sayfası', btn: 'Sayfa Ayarları',
      desc: 'Kitaplar sekmesinin (kitap vitrini) başlığı, üst etiketi, tanıtım metni ve ışık rengi. Kitapların kendisi Kitaplar listesinde.',
      fields: [
        { k: 'title', t: 'title', l: 'Sayfa başlığı' },
        { k: 'eyebrow', t: 'text', l: 'Üst etiket', ph: 'Kitap · Basılı ve yayımlanmış', help: 'Başlığın üstünde küçük büyük harflerle görünür.' },
        { k: 'intro', t: 'textarea', l: 'Tanıtım metni', rows: 4, help: 'Başlığın altında, kapakların üstünde görünür.' },
        { k: 'tint', t: 'color', l: 'Işık rengi', side: 'Görünüm', help: 'Sayfanın üst kısmındaki yumuşak renkli ışık.' }
      ]
    },
    resources: {
      key: 'resourcesPage', title: 'Kaynaklar Sayfası', btn: 'Sayfa Ayarları',
      desc: 'Kaynaklar sekmesinin başlığı, üst etiketi, tanıtım metni ve ışık rengi. Kaynakların kendisi Kaynaklar listesinde, türleri ▦ Türler ekranında.',
      fields: [
        { k: 'title', t: 'title', l: 'Sayfa başlığı' },
        { k: 'eyebrow', t: 'text', l: 'Üst etiket', ph: 'Kaynak · Araçlar, rehberler ve bağlantılar', help: 'Başlığın üstünde küçük büyük harflerle görünür.' },
        { k: 'intro', t: 'textarea', l: 'Tanıtım metni', rows: 4, help: 'Başlığın altında, arama kutusunun yanında görünür.' },
        { k: 'tint', t: 'color', l: 'Işık rengi', side: 'Görünüm', help: 'Sayfanın üst kısmındaki yumuşak renkli ışık.' }
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

  // cat: alt kategorinin listesinden "+ Yeni" ile açıldıysa o alt kategori seçili gelir;
  // podcast bölümünde aynı yerden seri gelir (#podcasts/new/seri-kimligi), yoksa ilk seri
  function newItem(type, kind, cat) {
    if (type === 'series') return { published: true, status: 'devam' };
    if (type === 'books') return { published: true, status: 'yayinda', format: 'karton', language: 'Türkçe' };
    if (type === 'resources') return { published: true, date: today(), type: cat || ((D.settings.resourceTypes || [])[0] || {}).id || '', links: [], related: [], tags: [] };
    const base = { published: true, date: today(), tags: [] };
    if (type === 'podcasts') {
      // Ön seçim yoksa yayındaki ilk kendi seriniz (örnek seriye düşen bölüm yayına gitmez), o da yoksa ilk seri
      const own = (D.series || []).find((s) => s.published !== false && !S.isSample(s));
      base.series = cat || (own || (D.series || [])[0] || {}).id;
      const max = Math.max(0, ...(D.podcasts || []).filter((p) => p.series === base.series).map((p) => Number(p.number) || 0));
      base.number = max + 1;
    } else if (cat) base.cat = cat;
    if (type === 'posts') base.kind = kind === 'yazi' ? 'yazi' : 'video';
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
          <div class="prev ${f.sq ? 'sq' : f.tall ? 'tall' : ''} ${val ? 'has' : ''}" style="${val ? `background-image:url('${esc(val)}')` : ''}">Görsel yüklemek için tıklayın<button type="button" class="x" title="Kaldır">×</button></div>
          <div class="ctl"><input type="url" data-k="${f.k}" value="${esc(val || '')}" placeholder="https://... veya dosya yükleyin"><button type="button" class="btn btn-sm" data-upload>Yükle</button></div>
          ${help(f)}</div>`;
      case 'links':
        return `<div class="fld linksf" data-links="${f.k}"><span class="fld-l">${f.l}</span><div class="lrows">${(val || []).map(linkRow).join('')}</div><button type="button" class="btn btn-sm" data-ladd>+ Bağlantı ekle</button>${help(f)}</div>`;
      case 'related':
        return `<div class="fld relf" data-related="${f.k}"><span class="fld-l">${f.l}</span><div class="rel-chips">${(val || []).map(relChip).join('')}</div><input type="search" class="rel-q" placeholder="Video, yazı, bölüm ya da remix ara…" autocomplete="off"><div class="rel-opts" hidden></div>${help(f)}</div>`;
      case 'tags':
        return `<div class="fld"><span class="fld-l">${f.l}</span><div class="tagin" data-tags="${f.k}">${(val || []).map(tagChip).join('')}<input type="text" placeholder="Yazıp Enter'a basın"></div><small>Virgül veya Enter ile ekleyin.</small></div>`;
      case 'youtube': {
        const th = S.ytThumb(val);
        return `<label class="fld"><span>${lbl(f)}</span><input type="url" data-k="${f.k}" data-yt value="${esc(val || '')}" placeholder="${esc(f.ph || '')}"><div class="ytprev ${th ? 'has' : ''}" style="${th ? `background-image:url('${th}')` : ''}"></div>${help(f)}</label>`;
      }
      case 'richtext':
        return `<div class="fld"><span class="fld-l">${f.l}</span>${rte(f.k, val)}${help(f)}</div>`;
      case 'select':
        return `<label class="fld"><span>${lbl(f)}</span><select data-k="${f.k}">${(typeof f.options === 'function' ? f.options() : f.options).map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(val) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>${help(f)}</label>`;
      case 'cat': {
        // Seçenekler sekmenin güncel alt kategori listesinden gelir
        const list = S.cats(D, f.tab);
        return `<div class="fld"><span class="fld-l">${lbl(f)}</span><select data-k="${f.k}"><option value="">— Yok —</option>${list.map((c) => `<option value="${esc(c.id)}" ${c.id === val ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
          <small>${list.length ? 'Sitede sekmenin üstündeki filtrede ve alt kategorinin kendi sayfasında listelenir.' : 'Bu sekmede henüz alt kategori yok.'} <a href="#${TAB_TYPE[f.tab]}/cats" style="color:var(--acid)">Alt kategorileri düzenle →</a></small></div>`;
      }
      case 'series': {
        // Podcast bölümünün serisi (zorunlu); seçenekler güncel seri listesinden
        const list = D.series || [];
        return `<div class="fld"><span class="fld-l">${lbl(f)}</span><select data-k="${f.k}">${list.map((s) => `<option value="${esc(s.id)}" ${s.id === val ? 'selected' : ''}>${esc(s.title)}${S.isSample(s) ? ' (Örnek)' : ''}${s.published === false ? ' (Taslak)' : ''}</option>`).join('')}</select>
          <small>Bölüm sitede bu serinin sayfasında listelenir: /podcast/seri/bolum/. <a href="#series" style="color:var(--acid)">Serileri düzenle →</a></small></div>`;
      }
      case 'color': {
        // Değer metin kutusunda tutulur; boş = otomatik
        const v = /^#[0-9a-f]{6}$/i.test(val || '') ? val.toUpperCase() : '';
        return `<div class="fld"><span class="fld-l">${lbl(f)}</span><div class="colorin"><input type="color" data-color-for="${f.k}" value="${v || '#3A9FF0'}" title="Renk seç"><input type="text" data-k="${f.k}" value="${esc(v)}" placeholder="Otomatik" maxlength="7" spellcheck="false"><button type="button" class="btn btn-sm btn-ghost" data-color-clear="${f.k}">Otomatik</button></div>${help(f)}</div>`;
      }
      default: return '';
    }
  }

  /* Yan sütundaki alanları "side" adına göre kartlarda toplar; lead: kart başına eklenecek HTML ({ 'Kart adı': html }) */
  function sideGroups(fields, item, lead) {
    const groups = [];
    fields.filter((f) => f.side).forEach((f) => {
      let g = groups.find((x) => x[0] === f.side);
      if (!g) groups.push(g = [f.side, []]);
      g[1].push(f);
    });
    return groups.map(([g, fs]) => `<div class="card"><h3>${g}</h3>${(lead && lead[g]) || ''}${fs.map((f) => field(f, item[f.k])).join('')}</div>`).join('');
  }

  /* SEO & GEO: puanlanan koleksiyonlar; başlık, açıklama ve görsel sitenin kullanacağı değerlerin aynısı (Render.seoOf).
     Kurallarla hesaplanır, yapay zekâ kullanılmaz; hiçbir alana otomatik değer yazılmaz */
  const SEO_COLS = ['posts', 'podcasts', 'series', 'books', 'remixes', 'pages', 'resources'];
  const seoRender = () => window.Render.create(D, { mode: 'site', siteUrl: siteAddress() || 'https://alanadiniz.com/' });
  function seoBoxHTML(o, sc) {
    const url = o.url.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/').join(' › ');
    return `<div class="seohead"><b class="seoscore ${SEO.level(sc.puan)}">${sc.puan}</b><span>SEO & GEO<small>Arama sonucunda böyle görünür</small></span></div>
      <div class="serp"><div class="serp-url">${esc(url)}</div><div class="serp-t">${esc(o.title || 'Başlık yok')}</div><div class="serp-d">${esc(o.desc || 'Açıklama yok')}</div></div>
      <ul class="seolist">${sc.maddeler.map((m) => `<li class="${m.ok === true ? 'ok' : 'no'}">${m.ok === true ? '✓ ' + esc(m.ad) : '! ' + esc(m.oneri)}</li>`).join('')}</ul>`;
  }

  /* Kaynaklar: tür adı, bağlantının alan adı, bağlantı satırı ve sitedeki içerik seçicisinin yardımcıları */
  const resTypeName = (id) => ((D.settings.resourceTypes || []).find((t) => t.id === id) || {}).name || '';
  function domainOf(u) {
    try { const x = new URL(String(u || '')); return /^https?:$/.test(x.protocol) ? x.hostname.replace(/^www\./, '') : ''; } catch (e) { return ''; }
  }
  const linkRow = (l) => `<div class="lrow"><input type="text" data-l="label" placeholder="Ad (ör. Kullanım kılavuzu)" value="${esc(l.label || '')}"><input type="url" data-l="url" placeholder="https://…" value="${esc(l.url || '')}"><div class="lrow-acts"><button type="button" class="btn btn-sm btn-ghost" data-lup title="Yukarı taşı">↑</button><button type="button" class="btn btn-sm btn-ghost" data-ldown title="Aşağı taşı">↓</button><button type="button" class="btn btn-sm btn-ghost" data-ldel title="Sil">✕</button></div></div>`;
  // Seçilebilecek içerik: videolar, yazılar, podcast bölümleri, remixler (anahtar 'koleksiyon:kimlik')
  const relCandidates = () => [
    ...(D.posts || []).map((x) => ({ key: 'posts:' + x.id, label: S.postKind(x) === 'video' ? 'Video' : 'Yazı', title: x.title || '(başlıksız)' })),
    ...(D.podcasts || []).map((x) => ({ key: 'podcasts:' + x.id, label: 'Bölüm', title: x.title || '(başlıksız)' })),
    ...(D.remixes || []).map((x) => ({ key: 'remixes:' + x.id, label: 'Remix', title: x.title || '(başlıksız)' }))
  ];
  function relChip(key) {
    const c = relCandidates().find((x) => x.key === key) || { label: 'Silinmiş', title: 'bulunamayan içerik' };
    return `<span class="rel-chip" data-key="${esc(key)}"><i>${esc(c.label)}</i>${esc(c.title)}<button type="button" title="Kaldır">✕</button></span>`;
  }

  // opt.commit === false: yalnızca okur (canlı önizleme); etiket kutusunda yazılmakta olan metin etikete çevrilmez
  function collect(root, fields, opt) {
    const out = {};
    const commit = !opt || opt.commit !== false;
    fields.forEach((f) => {
      if (f.t === 'tags') {
        const box = $(`[data-tags="${f.k}"]`, root);
        const pending = $('input', box).value.trim();
        if (pending && commit) addTag(box, pending);
        out[f.k] = $$('.tg-i', box).map((x) => x.dataset.v);
        if (pending && !commit) out[f.k].push(...pending.split(',').map((s) => s.trim()).filter(Boolean));
      } else if (f.t === 'links') {
        out[f.k] = $$(`[data-links="${f.k}"] .lrow`, root).map((r) => ({ label: $('[data-l="label"]', r).value.trim(), url: $('[data-l="url"]', r).value.trim() })).filter((l) => l.url);
      } else if (f.t === 'related') {
        out[f.k] = $$(`[data-related="${f.k}"] .rel-chip`, root).map((c) => c.dataset.key);
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

    // Bağlantı satırları: ekle, sil, ↑ ↓ ile sırala
    $$('.linksf', root).forEach((w) => {
      w.addEventListener('click', (e) => {
        const row = e.target.closest('.lrow');
        if (e.target.closest('[data-ladd]')) { $('.lrows', w).insertAdjacentHTML('beforeend', linkRow({})); $$('.lrow [data-l="label"]', w).pop().focus(); }
        else if (row && e.target.closest('[data-ldel]')) row.remove();
        else if (row && e.target.closest('[data-lup]')) { if (row.previousElementSibling) row.parentNode.insertBefore(row, row.previousElementSibling); }
        else if (row && e.target.closest('[data-ldown]')) { if (row.nextElementSibling) row.parentNode.insertBefore(row.nextElementSibling, row); }
        else return;
        markDirty();
      });
    });

    // Sitedeki içerik seçici: başlıkla ara, seçilenler çip olur
    $$('.relf', root).forEach((w) => {
      const q = $('.rel-q', w), opts = $('.rel-opts', w), chips = $('.rel-chips', w);
      const paintOpts = () => {
        const t = q.value.trim().toLocaleLowerCase('tr');
        const have = new Set($$('.rel-chip', chips).map((c) => c.dataset.key));
        const list = t ? relCandidates().filter((c) => !have.has(c.key) && c.title.toLocaleLowerCase('tr').includes(t)).slice(0, 8) : [];
        opts.innerHTML = list.map((c) => `<button type="button" class="rel-opt" data-key="${esc(c.key)}"><i>${esc(c.label)}</i>${esc(c.title)}</button>`).join('') || (t ? '<div class="rel-none">Eşleşen içerik yok.</div>' : '');
        opts.hidden = !t;
      };
      q.addEventListener('input', paintOpts);
      q.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); const first = $('.rel-opt', opts); if (first) first.click(); } });
      w.addEventListener('click', (e) => {
        const o = e.target.closest('.rel-opt');
        if (o) { chips.insertAdjacentHTML('beforeend', relChip(o.dataset.key)); q.value = ''; paintOpts(); q.focus(); markDirty(); return; }
        const rm = e.target.closest('.rel-chip button');
        if (rm) { rm.parentElement.remove(); markDirty(); }
      });
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
    const wh = v.w && v.h ? ` width="${v.w}" height="${v.h}"` : '';
    return `<figure class="epfig${LAYOUT_CLS[v.layout] || ''}" contenteditable="false"><img src="${esc(v.src)}" alt="${esc(v.caption || '')}"${wh}>${cap}</figure>`;
  }

  // Görselin gerçek boyutu: sayfada yeri yüklenmeden ayrılsın (sayfa kayması / CLS). Okunamazsa null
  function imgDims(src) {
    return new Promise((res) => {
      const i = new Image();
      const t = setTimeout(() => res(null), 6000);
      i.onload = () => { clearTimeout(t); res(i.naturalWidth ? [i.naturalWidth, i.naturalHeight] : null); };
      i.onerror = () => { clearTimeout(t); res(null); };
      i.src = src;
    });
  }
  const withDims = (v) => imgDims(v.src).then((wh) => (wh ? { ...v, w: wh[0], h: wh[1] } : v));

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
        if (tag === 'IMG') { if (!n.getAttribute('src')) { n.remove(); return; } el.setAttribute('src', n.getAttribute('src')); el.setAttribute('alt', n.getAttribute('alt') || ''); ['width', 'height'].forEach((a) => { if (/^d+$/.test(n.getAttribute(a) || '')) el.setAttribute(a, n.getAttribute(a)); }); }
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
        else if (v.src) { withDims(v).then((x) => { if (fig.isConnected) fig.outerHTML = figureHTML(x); markDirty(); }); return; }
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
            withDims(v).then((x) => {
              restore();
              ex('insertHTML', figureHTML(x) + '<p><br></p>');
              markDirty();
            });
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
  const markDirty = () => { if (view.dataset.form) dirty = true; if (view._seoPaint) view._seoPaint(); };
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
    // Seriler ekranı Podcast bölümünün parçası: kenar çubuğunda Podcast seçili görünür
    const nav = v === 'series' ? 'podcasts' : v || 'dashboard';
    $$('#sideNav a').forEach((x) => x.classList.toggle('on', x.dataset.v === nav));
    view.classList.toggle('view-full', v === 'onizleme');
    $('#topActions').innerHTML = '';
    view.style.animation = 'none'; void view.offsetWidth; view.style.animation = '';
    window.scrollTo(0, 0);

    // Eski bağlantı: "Yazılar & Videolar" tek bölümken #posts/new/video
    if (v === 'posts' && a === 'new' && id === 'video') { location.replace('#videos/new'); return; }
    if (TYPES[v]) {
      if (a === 'settings' && SECTIONS[v]) return sectionView(v);
      // Alt kategoriler: #posts/cats düzenleme ekranı, #posts/cat/kimlik süzülmüş liste, #posts/new/kimlik o alt kategoride yeni içerik
      if (a === 'cats' && CAT_TABS[v]) return catsView(v);
      if (a === 'cat' && CAT_TABS[v]) return listView(v, id);
      // Podcast: bölümler seriye göre süzülür; #series serilerin kendi ekranı
      if (a === 'seri' && v === 'podcasts') return listView(v, id);
      // Kaynaklar: #resources/types tür ekranı, #resources/tur/kimlik türe göre süzülmüş liste
      if (a === 'types' && v === 'resources') return resTypesView();
      if (a === 'tur' && v === 'resources') return listView(v, id);
      if ((v === 'series' || v === 'books') && a !== 'new' && a !== 'edit') return orderedView(v);
      if (a === 'new') return formView(v, null, id);
      if (a === 'edit') return formView(v, id);
      return listView(v);
    }
    switch (v) {
      case 'onizleme': return previewView();
      case 'featured': return featuredView();
      case 'menu': return menuView();
      case 'about': return aboutView();
      case 'sosyal': return socialView();
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
      { type: 'posts', label: 'Yazı', btn: 'Oku', href: (x) => (S.postKind(x) === 'video' ? '#/videolar/' : '#/yazilar/') + x.slug, thumb: (x) => (S.postKind(x) === 'video' ? S.ytThumb(x.video, 'maxresdefault') : x.cover), excerpt: (x) => x.excerpt },
      { type: 'podcasts', label: 'Podcast', btn: 'Dinle', href: (x) => '#/podcast/' + ((S.seriesOf(data, x) || {}).slug || '') + '/' + x.slug, thumb: (x) => x.cover, excerpt: (x) => (x.description || '').replace(/<[^>]+>/g, '') },
      { type: 'remixes', label: 'Remix', btn: 'Dinle', href: (x) => '#/remixler/' + x.slug, thumb: (x) => x.cover, excerpt: (x) => x.excerpt || x.original || (x.description || '').replace(/<[^>]+>/g, '') },
      { type: 'pages', label: 'Sayfa', btn: 'İncele', href: (x) => '#/sayfa/' + x.slug, thumb: (x) => x.cover, excerpt: (x) => x.excerpt },
      { type: 'resources', label: 'Kaynak', btn: 'İncele', href: (x) => '#/kaynaklar/' + x.slug, thumb: (x) => x.cover, excerpt: (x) => x.summary }
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
     Önizleme: site panelin içinde, örnek içerikler dahil.
     index.html aynı tarayıcı depolamasını okuduğu için her kayıt anında görünür;
     ↻ Yenile site kodunu da yeniden yükler.
     ====================================================================== */
  const LAST_SAVE = 'akcan.sonKayit';
  const PREVIEW_W = [['desktop', 'Masaüstü', ''], ['tablet', 'Tablet', '768px'], ['mobile', 'Mobil', '390px']];
  let previewW = 'desktop';

  function paintLastSave() {
    const el = $('#pvSaved');
    if (!el) return;
    let t = 0;
    try { t = Number(localStorage.getItem(LAST_SAVE)) || 0; } catch (e) { /* yok say */ }
    el.textContent = t ? 'Son kayıt: ' + fmtTime(t) : '';
  }

  function previewView() {
    crumbs(['Önizleme']);
    const url = siteAddress();
    view.innerHTML = `
      <div class="vh"><div><h1>Önizleme</h1><p>Sitenin bu bilgisayardaki hâli: kaydettiğiniz her şey, örnek içerikler dahil, burada anında görünür. Örnekler ve taslaklar yayına gitmez.</p></div>
        <div class="vh-actions"><a class="btn btn-ghost" id="pvOpen" href="index.html" target="_blank">Yeni sekmede aç ↗</a>${url ? `<a class="btn btn-ghost" href="${esc(url)}" target="_blank" rel="noopener">Yayındaki site ↗</a>` : ''}</div></div>
      <div class="pv-bar">
        <div class="seg" role="group" aria-label="Ekran genişliği">${PREVIEW_W.map(([k, l]) => `<button type="button" data-w="${k}" class="${k === previewW ? 'on' : ''}">${l}</button>`).join('')}</div>
        <span class="pv-saved" id="pvSaved"></span>
        <button type="button" class="btn btn-sm" id="pvReload" title="Sayfayı ve site kodunu yeniden yükler">↻ Yenile</button>
      </div>
      <div class="pv-stage" id="pvStage"><iframe class="pv-frame" id="pvFrame" src="index.html" title="Site önizlemesi"></iframe></div>`;

    const frame = $('#pvFrame'), stage = $('#pvStage');
    const setW = (k) => {
      previewW = k;
      const w = PREVIEW_W.find((x) => x[0] === k)[2];
      frame.style.width = w || '';
      stage.classList.toggle('dev', !!w);
      $$('[data-w]', view).forEach((b) => b.classList.toggle('on', b.dataset.w === k));
    };
    $$('[data-w]', view).forEach((b) => b.addEventListener('click', () => setW(b.dataset.w)));
    setW(previewW);
    // Önizlemedeki sayfa yerinde yenilenir (dosyadan açılınca çerçevenin adresi okunamaz; site kendisi yeniler)
    $('#pvReload').addEventListener('click', () => frame.contentWindow.postMessage({ akcan: 'yenile' }, '*'));
    paintLastSave();
  }

  // Önizlemedeki site, açık olan sayfanın adresini bildirir: "Yeni sekmede aç" aynı sayfayı açsın
  window.addEventListener('message', (e) => {
    const frame = $('#pvFrame');
    if (!frame || e.source !== frame.contentWindow || !e.data || e.data.akcan !== 'onizleme') return;
    $('#pvOpen').href = 'index.html' + (/^#\//.test(e.data.hash || '') ? e.data.hash : '');
  });

  /* ======================================================================
     Gösterge paneli
     ====================================================================== */
  function dashboard() {
    crumbs(['Gösterge Paneli']);
    const cnt = (k) => (D[k] || []).length;
    const all = [
      ...(D.posts || []).map((x) => ({ ...x, _t: postType(x), _l: S.postKind(x) === 'video' ? 'Video' : 'Yazı' })),
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
        <a class="stat" href="#videos"><span class="ic">▶</span><div class="n">${(D.posts || []).filter((x) => S.postKind(x) === 'video').length}</div><div class="l">Video</div></a>
        <a class="stat" href="#posts"><span class="ic">✎</span><div class="n">${(D.posts || []).filter((x) => S.postKind(x) === 'yazi').length}</div><div class="l">Yazı</div></a>
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
              <a class="btn" href="#videos/new">▶ Yeni video</a>
              <a class="btn" href="#posts/new">✎ Yeni yazı</a>
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
  // catId: yalnızca bu alt kategorinin içerikleri ('-': alt kategorisizler)
  function listView(type, catId) {
    const T = TYPES[type];
    const C = collOf(type);
    const arr = (D[C] || []).filter((x) => inType(type, x)).sort(byDate);
    // Süzme: Videolar ve Yazılar'da alt kategori, Podcast'te seri (adreste #podcasts/seri/kimlik)
    const grp = type === 'podcasts'
      ? { key: 'series', list: (D.series || []).map((s) => ({ id: s.id, name: s.title })), route: 'seri', all: 'Tüm seriler', title: 'Seri' }
      : type === 'resources' ? { key: 'type', list: (D.settings.resourceTypes || []).map((t) => ({ id: t.id, name: t.name })), route: 'tur', all: 'Tüm türler', none: 'Türsüz', title: 'Tür' }
      : CAT_TABS[type] ? { key: 'cat', list: catsOf(type), route: 'cat', all: 'Tüm alt kategoriler', none: 'Alt kategorisiz', title: 'Alt kategori' } : null;
    const cats = grp ? grp.list : [];
    const grpOf = (x) => (grp ? cats.find((c) => c.id === x[grp.key]) : undefined);
    const catKey = (x) => (grpOf(x) ? x[grp.key] : '-');
    const cur = cats.find((c) => c.id === catId);
    if (catId !== '-' && !cur) catId = '';
    crumbs(catId ? [`<a href="#${type}">${T.title}</a>`, cur ? esc(cur.name) : grp.none] : [T.title]);
    const newBtns = `<a class="btn btn-acid" href="#${type}/new${cur ? '/' + cur.id : ''}">+ Yeni ${T.one}</a>`;
    const nCat = (k) => arr.filter((x) => catKey(x) === k).length;
    const grpBtn = type === 'podcasts' ? '<a class="btn btn-ghost" href="#series">◫ Seriler</a>' : type === 'resources' ? '<a class="btn btn-ghost" href="#resources/types">▦ Türler</a>' : CAT_TABS[type] ? `<a class="btn btn-ghost" href="#${type}/cats">▦ Alt Kategoriler</a>` : '';

    view.innerHTML = `
      <div class="vh"><div><h1>${T.title}</h1><p>${T.desc}</p></div>
        <div class="vh-actions">${grpBtn}${SECTIONS[type] ? `<a class="btn btn-ghost" href="#${type}/settings">⚙ ${SECTIONS[type].btn}</a>` : ''}${newBtns}</div></div>
      ${arr.length ? `
      <div class="toolbar">
        <label class="search"><input type="search" id="q" placeholder="${T.title} içinde ara..."></label>
        <select id="st" style="width:auto"><option value="">Tümü (${arr.length})</option><option value="1">Yayında (${arr.filter((x) => x.published !== false).length})</option><option value="0">Taslak (${arr.filter((x) => x.published === false).length})</option></select>
        ${grp ? `<select id="ct" style="width:auto" title="${grp.title}"><option value="">${grp.all}</option>${cats.map((c) => `<option value="${esc(c.id)}" ${c.id === catId ? 'selected' : ''}>${esc(c.name)} (${nCat(c.id)})</option>`).join('')}${grp.none ? `<option value="-" ${catId === '-' ? 'selected' : ''}>${grp.none} (${nCat('-')})</option>` : ''}</select>` : ''}
      </div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Başlık</th><th>Tarih</th><th>Durum</th><th style="text-align:right">İşlemler</th></tr></thead>
        <tbody>${arr.map((x) => {
          const th = T.thumb(x);
          const cn = grpOf(x);
          // Kendi bölümünüz örnek ya da taslak bir seriye bağlıysa yayına gitmez: satırda belirtilir
          const sr = type === 'podcasts' && !S.isSample(x) && x.published !== false && S.seriesOf(D, x);
          const stray = sr && (S.isSample(sr) || sr.published === false);
          const sub = [cn ? `<b class="ccat">${esc(cn.name)}</b>` : '', esc(T.sub(x) || '')].filter(Boolean).join(' · ');
          return `<tr data-id="${x.id}" data-s="${esc((x.title + ' ' + (cn ? cn.name + ' ' : '') + (T.sub(x) || '')).toLocaleLowerCase('tr'))}" data-p="${x.published === false ? 0 : 1}" data-c="${esc(catKey(x))}">
            <td><div class="ti"><span class="th ${T.sq ? 'sq' : ''}" style="${th ? `background-image:url('${esc(th)}')` : ''}"></span><div style="min-width:0"><div class="tn" data-edit>${esc(x.title || '(başlıksız)')}${x.featured || x.pinned ? '<span class="star" title="Öne çıkan">★</span>' : ''}${S.isSample(x) ? '<span class="smp" title="Örnek içerik: panelde ve önizlemede görünür, yayına gönderilmez">Örnek</span>' : ''}${stray ? '<span class="smp warn" title="Bağlı olduğu seri örnek ya da taslak: bu bölüm yayına gitmez. Bölümü kendi serinize taşıyın ya da seriyi yayına alın.">Yayına gitmez</span>' : ''}</div><div class="ts">${sub}</div></div></div></td>
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
      const q = ($('#q').value || '').toLocaleLowerCase('tr'), st = $('#st').value, ct = $('#ct') ? $('#ct').value : '';
      $$('tbody tr', view).forEach((tr) => {
        tr.hidden = !(tr.dataset.s.includes(q) && (st === '' || tr.dataset.p === st) && (ct === '' || tr.dataset.c === ct));
      });
    };
    if (arr.length) {
      $('#q').addEventListener('input', filter);
      $('#st').addEventListener('change', filter);
      // Alt kategori / seri seçimi adrese yazılır (#posts/cat/kimlik, #podcasts/seri/kimlik): "+ Yeni" orada açılır, geri tuşu çalışır
      if ($('#ct')) $('#ct').addEventListener('change', (e) => { location.hash = e.target.value ? `#${type}/${grp.route}/${e.target.value}` : '#' + type; });
      if (catId) filter();
    }

    view.onclick = (e) => {
      const tr = e.target.closest('tr[data-id]');
      if (!tr) return;
      const id = tr.dataset.id;
      const idx = D[C].findIndex((x) => x.id === id);
      const item = D[C][idx];
      if (e.target.closest('[data-edit]')) { location.hash = `#${type}/edit/${id}`; }
      else if (e.target.closest('[data-toggle]')) {
        item.published = item.published === false;
        persist(item.published ? 'Yayına alındı' : 'Taslağa alındı');
        listView(type, catId);
      } else if (e.target.closest('[data-dup]')) {
        const copy = JSON.parse(JSON.stringify(item));
        copy.id = S.uid();
        delete copy.sample; // kopya sizin içeriğinizdir: düzenleyip yayına alabilirsiniz
        copy.title = item.title + ' (kopya)';
        copy.published = false;
        copy.featured = false;
        if (copy.slug) copy.slug = uniqueSlug(C, item.slug + '-kopya', null, catSlugs(type));
        D[C].push(copy);
        persist('Kopya oluşturuldu (taslak)');
        listView(type, catId);
      } else if (e.target.closest('[data-del]')) {
        if (!confirm(`“${item.title}” silinsin mi? Bu işlem geri alınamaz.`)) return;
        D[C].splice(idx, 1);
        if (type === 'pages') D.menu = D.menu.filter((m) => !(m.type === 'page' && m.target === item.slug));
        persist('Silindi');
        listView(type, catId);
      }
    };
  }

  /* ======================================================================
     Form görünümü (ekle / düzenle)
     ====================================================================== */
  // preCat: yeni içerik bu alt kategoride başlar (#posts/new/kimlik)
  function formView(type, id, preCat) {
    view.onclick = null;
    const T = TYPES[type];
    const C = collOf(type);
    const isNew = !id;
    // Ön seçim: Videolar / Yazılar'da alt kategori, Podcast'te seri
    const preOk = type === 'podcasts' ? (D.series || []).some((s) => s.id === preCat)
      : type === 'resources' ? (D.settings.resourceTypes || []).some((t) => t.id === preCat) : catsOf(type).some((c) => c.id === preCat);
    if (preCat && !preOk) preCat = '';
    let item = isNew ? newItem(C, T.kind, preCat) : (D[C] || []).find((x) => x.id === id);
    if (!item) { toast('İçerik bulunamadı', true); go('#' + type); return; }
    // Video Yazılar'dan (ya da yazı Videolar'dan) açıldıysa kendi bölümüne geç
    if (!isNew && !inType(type, item)) { location.replace(`#${postType(item)}/edit/${id}`); return; }
    if (type === 'pages' && !isNew) item = { ...item, inMenu: D.menu.some((m) => m.type === 'page' && m.target === item.slug) };
    const one = T.one;

    crumbs([`<a href="#${type}">${T.title}</a>`, isNew ? 'Yeni ' + one : esc(item.title)]);
    view.dataset.form = '1';

    const main = T.fields.filter((f) => !f.side).map((f) => field(f, item[f.k]));

    view.innerHTML = `
      <div class="vh"><div><h1>${isNew ? 'Yeni ' + one : one + ' Düzenle'}</h1><p>${isNew ? 'Alanları doldurun ve kaydedin.' : 'Son değişiklikleri kaydetmeyi unutmayın. <code>Ctrl+S</code> ile hızlı kaydet.'}</p></div>
        <div class="vh-actions">
          <a class="btn btn-ghost" href="#${type}">← Listeye dön</a>
          ${!isNew ? `<a class="btn btn-ghost" target="_blank" href="index.html${T.view(item)}">Görüntüle ↗</a>` : ''}
          <button class="btn btn-acid" data-save>Kaydet</button>
        </div></div>
      <form class="form-grid" id="frm" novalidate>
        <div class="form-main">${main.join('')}</div>
        <div class="form-side">
          ${sideGroups(T.fields, item, SEO_COLS.includes(C) ? { 'Arama & paylaşım': '<div class="seobox" data-seobox></div>' } : null)}
          <button type="button" class="btn btn-acid btn-block" data-save>Kaydet</button>
          ${!isNew ? `<button type="button" class="btn btn-danger btn-block" data-del>Bu içeriği sil</button>` : ''}
        </div>
      </form>`;

    const frm = $('#frm');
    bindForm(frm);
    if (isNew) setTimeout(() => { const t = $('[data-k="title"]', frm); if (t) t.focus(); }, 50);

    // SEO & GEO kutusu: formdaki değerlerle, yazdıkça (gecikmeli) yeniden çizilir; görselin genişliği ölçülür
    const seoBox = $('[data-seobox]', frm);
    let seoW = 0, seoImg = '', seoT = 0;
    const seoRec = () => ({ ...item, ...collect(frm, T.fields, { commit: false }), ...(T.kind ? { kind: T.kind } : {}) });
    const paintSeo = () => {
      if (!seoBox || !seoBox.isConnected) return;
      const rec = seoRec(), R = seoRender(), o = R.seoOf(C, rec);
      if (o.image !== seoImg) {
        seoImg = o.image; seoW = 0;
        if (o.image) imgDims(o.image).then((wh) => { if (seoImg === o.image) { seoW = wh ? wh[0] : 0; paintSeo(); } });
      }
      seoBox.innerHTML = seoBoxHTML(o, SEO.score(C, rec, { R, imgW: seoW }));
    };
    if (seoBox) { view._seoPaint = () => { clearTimeout(seoT); seoT = setTimeout(paintSeo, 300); }; paintSeo(); }

    const save = () => {
      const v = collect(frm, T.fields);
      if (!v.title) { toast('Başlık zorunludur', true); $('[data-k="title"]', frm).focus(); return; }
      if (T.kind === 'video' && !S.ytId(v.video)) { toast('Video için geçerli bir YouTube bağlantısı girin', true); $('[data-k="video"]', frm).focus(); return; }
      if (T.kind === 'yazi' && !v.cover) { toast('Yazı için bir kapak görseli ekleyin', true); $('[data-k="cover"]', frm).focus(); return; }
      if (type === 'podcasts' && !v.series) { toast('Bölüm için bir seri seçin (önce ◫ Seriler’den bir seri ekleyin)', true); return; }
      if ('slug' in v) v.slug = uniqueSlug(C, S.slugify(v.slug || v.title), item.id, catSlugs(type));

      const inMenu = v.inMenu;
      delete v.inMenu;
      const oldSlug = item.slug;
      const rec = { ...item, ...v };
      delete rec.inMenu;
      if (!rec.cat) delete rec.cat; // "— Yok —": alt kategorisiz
      if (T.kind) rec.kind = T.kind;
      rec.updated = today(); // site haritası ve yapılandırılmış veride "son güncelleme"

      if (isNew) { rec.id = S.uid(); D[C].push(rec); }
      else { const i = D[C].findIndex((x) => x.id === rec.id); D[C][i] = rec; }

      if (rec.featured) {
        ['posts', 'podcasts', 'remixes', 'pages'].forEach((c) => {
          (D[c] || []).forEach((x) => {
            if (c !== C || x.id !== rec.id) x.featured = false;
          });
        });
        D.settings.featured = {
          ...(D.settings.featured || {}),
          mode: 'manual',
          type: C,
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

      // Paylaşım kartı: YouTube'un 1280×720 karesi her videoda yoktur (yoksa 120×90 boş kare gelir); varsa ytMax ile işaretlenir
      if (T.kind === 'video' && (rec.ytMax === undefined || rec.video !== item.video)) {
        imgDims(S.ytThumb(rec.video, 'maxresdefault')).then((wh) => {
          const x = (D.posts || []).find((p) => p.id === rec.id), ok = !!wh && wh[0] > 120;
          if (x && x.ytMax !== ok) { x.ytMax = ok; S.save(D); }
        });
      }
      // Bildirimde SEO & GEO puanı; 80'in altındaysa en çok puan kazandıracak öneri
      const sc = seoBox ? SEO.score(C, rec, { R: seoRender(), imgW: seoW }) : null;
      const seoMsg = sc ? ` · SEO & GEO ${sc.puan}/100` + (sc.puan < 80 ? ' — ' + SEO.oneriler(sc)[0] : '') : '';
      if (persist((isNew ? `${T.one} oluşturuldu` : 'Değişiklikler kaydedildi') + seoMsg)) {
        dirty = false;
        go(`#${type}/edit/${rec.id}`);
      }
    };

    $$('[data-save]', view).forEach((b) => b.addEventListener('click', save));
    frm.addEventListener('submit', (e) => { e.preventDefault(); save(); });
    const del = $('[data-del]', view);
    if (del && type === 'series') del.addEventListener('click', () => deleteSeries(item).then((ok) => { if (ok) go('#series'); }));
    else if (del) del.addEventListener('click', () => {
      if (!confirm(`“${item.title}” silinsin mi? Bu işlem geri alınamaz.`)) return;
      D[C] = D[C].filter((x) => x.id !== item.id);
      if (type === 'pages') D.menu = D.menu.filter((m) => !(m.type === 'page' && m.target === item.slug));
      persist('Silindi');
      go('#' + type);
    });
    view._save = save;
  }

  /* ======================================================================
     Vitrin sıralı listeler: Podcast serileri (#series) ve Kitaplar (#books)
     Listedeki sıra sitedeki vitrinin sırasıdır; ekle / düzenle / sırala / sil
     ====================================================================== */
  const ORDERED = {
    series: {
      parent: '<a href="#podcasts">Podcast Bölümleri</a>', back: '<a class="btn btn-ghost" href="#podcasts">← Bölümler</a>', settings: '#podcasts/settings',
      site: 'podcast', thumb: 'sq', sampleTip: 'Örnek seri: panelde ve önizlemede görünür, yayına gönderilmez', one: 'Seri',
      sub: (s) => [S.SERIES_STATUS[s.status], s.frequency, (D.podcasts || []).filter((x) => x.series === s.id).length + ' bölüm'],
      empty: 'İlk serinizi ekleyin; bölümler bir seriye bağlanır.', del: (s) => deleteSeries(s)
    },
    books: {
      parent: '', back: '', settings: '#books/settings',
      site: 'kitaplar', thumb: 'tall', sampleTip: 'Örnek kitap: panelde ve önizlemede görünür, yayına gönderilmez', one: 'Kitap',
      sub: (b) => [S.BOOK_STATUS[b.status], String(b.date || '').slice(0, 4), b.publisher],
      empty: 'İlk kitabınızı ekleyin: kapak, künye ve satış platformlarının adresleri.',
      del: (b) => Promise.resolve(confirm(`“${b.title}” silinsin mi? Bu işlem geri alınamaz.`) && (D.books = D.books.filter((x) => x.id !== b.id), persist('Kitap silindi')))
    }
  };

  function orderedView(type) {
    view.onclick = null;
    const T = TYPES[type], O2 = ORDERED[type];
    crumbs(O2.parent ? [O2.parent, T.title] : [T.title]);
    const list = D[type] || [];
    view.innerHTML = `
      <div class="vh"><div><h1>${T.title}</h1><p>${T.desc}</p></div>
        <div class="vh-actions">${O2.back}<a class="btn btn-ghost" href="${O2.settings}">⚙ Sayfa Ayarları</a><a class="btn btn-acid" href="#${type}/new">+ Yeni ${O2.one}</a></div></div>
      ${list.length ? `<div class="slist">${list.map((s, i) => `
        <div class="srow" data-id="${esc(s.id)}">
          <span class="th ${O2.thumb}" style="${s.cover ? `background-image:url('${esc(s.cover)}')` : ''}"></span>
          <div class="sinfo"><div class="tn" data-edit>${esc(s.title || '(adsız)')}${S.isSample(s) ? `<span class="smp" title="${O2.sampleTip}">Örnek</span>` : ''}</div>
            <div class="ts">${esc(O2.sub(s).filter(Boolean).join(' · '))}</div></div>
          <button class="pill ${s.published === false ? '' : 'on'}" data-toggle title="Durumu değiştir">${s.published === false ? 'Taslak' : 'Yayında'}</button>
          <div class="acts">
            <button class="btn btn-sm btn-ghost" data-up title="Vitrinde bir öne al" ${i === 0 ? 'disabled' : ''}>↑</button>
            <button class="btn btn-sm btn-ghost" data-down title="Vitrinde bir geri al" ${i === list.length - 1 ? 'disabled' : ''}>↓</button>
            <button class="btn btn-sm" data-edit>Düzenle</button>
            <a class="btn btn-sm btn-ghost" href="index.html#/${O2.site}/${esc(s.slug)}" target="_blank" title="Önizlemede aç">↗</a>
            <button class="btn btn-sm btn-danger" data-del>Sil</button>
          </div>
        </div>`).join('')}</div>` : `
      <div class="tbl-wrap"><div class="empty"><b>Henüz ${O2.one.toLocaleLowerCase('tr')} yok</b>${O2.empty}<br><br><div class="empty-acts"><a class="btn btn-acid" href="#${type}/new">+ Yeni ${O2.one}</a></div></div></div>`}`;

    view.onclick = (e) => {
      const row = e.target.closest('.srow');
      if (!row) return;
      const i = list.findIndex((s) => s.id === row.dataset.id);
      const s = list[i];
      const swap = (j) => { [list[i], list[j]] = [list[j], list[i]]; persist('Vitrin sırası güncellendi'); orderedView(type); };
      if (e.target.closest('[data-edit]')) location.hash = `#${type}/edit/${s.id}`;
      else if (e.target.closest('[data-toggle]')) { s.published = s.published === false; persist(s.published ? `${O2.one} yayına alındı` : `${O2.one} taslağa alındı`); orderedView(type); }
      else if (e.target.closest('[data-up]') && i > 0) swap(i - 1);
      else if (e.target.closest('[data-down]') && i < list.length - 1) swap(i + 1);
      else if (e.target.closest('[data-del]')) O2.del(s).then((ok) => { if (ok) orderedView(type); });
    };
  }

  /** Seri silme: bölümleri varsa hangi seriye taşınacakları sorulur; bölümü olan tek seri silinmez */
  function deleteSeries(s) {
    const eps = (D.podcasts || []).filter((x) => x.series === s.id);
    const others = (D.series || []).filter((x) => x.id !== s.id);
    const remove = () => { D.series = others; return persist('Seri silindi'); };
    if (!eps.length) return Promise.resolve(confirm(`“${s.title}” serisi silinsin mi? Bu işlem geri alınamaz.`) && remove());
    if (!others.length) { toast('Bölümü olan tek seri silinemez. Seriyi gizlemek için Yayında anahtarını kapatabilirsiniz.', true); return Promise.resolve(false); }
    return dialog({ title: `“${s.title}” serisini sil`, submit: 'Taşı ve sil', fields: [{ k: 'to', t: 'select', l: `${eps.length} bölüm hangi seriye taşınsın?`, options: others.map((o) => [o.id, o.title]) }] })
      .then((v) => { if (!v || !v.to) return false; eps.forEach((x) => { x.series = v.to; }); return remove(); });
  }

  /* ======================================================================
     Liste sayfası ayarları (Videolar, Yazılar, Podcast sayfası, Remixler)
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
          <a class="btn btn-ghost" href="index.html${{ videos: '#/videolar', posts: '#/yazilar', podcasts: '#/podcast', remixes: '#/remixler', books: '#/kitaplar', resources: '#/kaynaklar' }[type]}" target="_blank">Görüntüle ↗</a>
          <button class="btn btn-acid" data-save>Kaydet</button>
        </div></div>
      <form class="form-grid" id="frm" novalidate>
        <div class="form-main">${C.fields.filter((f) => !f.side).map((f) => field(f, cur[f.k])).join('')}</div>
        <div class="form-side">${sideGroups(C.fields, cur)}${CAT_TABS[type] ? `<div class="card"><h3>Alt kategoriler</h3><p class="muted" style="margin:0 0 12px">${catsOf(type).map((c) => esc(c.name)).join(' · ') || 'Henüz alt kategori yok.'}</p><a class="btn btn-block" href="#${type}/cats">▦ Alt kategorileri düzenle →</a></div>` : ''}<button type="button" class="btn btn-acid btn-block" data-save>Kaydet</button></div>
      </form>`;
    const frm = $('#frm');
    bindForm(frm);
    const save = () => {
      // Alt kategoriler (cats) ayrı ekranda düzenlenir; burada korunur
      D.settings[C.key] = { ...(D.settings[C.key] || {}), ...collect(frm, C.fields) };
      if (persist(C.title + ' kaydedildi')) dirty = false;
    };
    $$('[data-save]', view).forEach((b) => b.addEventListener('click', save));
    view._save = save;
  }

  /* ======================================================================
     Alt kategoriler (Videolar, Yazılar, Podcast)
     Her sekmenin kendi listesi; sayfa ayarında "cats" olarak durur. İçerik, alt kategorisini kimliğiyle (cat) tutar.
     ====================================================================== */
  /* Kaynak türleri (#resources/types): ekle, yeniden adlandır, sırala, sil. Silinen türdeki kaynaklar türsüz kalır */
  function resTypesView() {
    view.onclick = null;
    crumbs(['<a href="#resources">Kaynaklar</a>', 'Türler']);
    view.dataset.form = '1';
    let draft = JSON.parse(JSON.stringify(D.settings.resourceTypes || []));
    const count = (id) => (id ? (D.resources || []).filter((r) => r.type === id).length : 0);
    const paint = () => {
      view.innerHTML = `
      <div class="vh"><div><h1>Kaynak Türleri</h1><p>Kaynaklar sayfasındaki süzgeç çipleri ve kartlardaki tür etiketi. Buradaki sıra çiplerin sırasıdır.</p></div>
        <div class="vh-actions"><a class="btn btn-ghost" href="#resources">← Listeye dön</a><button class="btn btn-acid" data-save>Kaydet</button></div></div>
      <div class="card"><div class="trows">${draft.map((t, i) => `<div class="trow" data-i="${i}">
          <input type="text" data-tn value="${esc(t.name)}" placeholder="Tür adı">
          <span class="muted">${count(t.id)} kaynak</span>
          <div class="acts"><button type="button" class="btn btn-sm btn-ghost" data-tup ${i ? '' : 'disabled'} title="Yukarı">↑</button><button type="button" class="btn btn-sm btn-ghost" data-tdown ${i < draft.length - 1 ? '' : 'disabled'} title="Aşağı">↓</button><button type="button" class="btn btn-sm btn-danger" data-tdel>Sil</button></div>
        </div>`).join('') || '<p class="muted">Henüz tür yok.</p>'}</div>
        <button type="button" class="btn btn-sm" data-tadd>+ Tür ekle</button></div>`;
    };
    const sync = () => $$('.trow', view).forEach((r) => { draft[+r.dataset.i].name = $('[data-tn]', r).value; });
    const save = () => {
      sync();
      const used = new Set();
      draft = draft.filter((t) => t.name.trim()).map((t) => {
        let id = t.id || S.slugify(t.name) || 'tur';
        if (!t.id) { const b = id; let n = 2; while (used.has(id) || draft.some((x) => x !== t && x.id === id)) id = `${b}-${n++}`; }
        used.add(id);
        return { id, name: t.name.trim() };
      });
      const ids = new Set(draft.map((t) => t.id));
      (D.resources || []).forEach((r) => { if (r.type && !ids.has(r.type)) r.type = ''; });
      D.settings.resourceTypes = draft;
      if (persist('Türler kaydedildi')) { dirty = false; resTypesView(); }
    };
    paint();
    view._save = save;
    view.onclick = (e) => {
      const row = e.target.closest('.trow'), i = row ? +row.dataset.i : -1;
      if (e.target.closest('[data-save]')) { save(); return; }
      if (e.target.closest('[data-tadd]')) { sync(); draft.push({ id: '', name: '' }); paint(); $$('[data-tn]', view).pop().focus(); }
      else if (row && e.target.closest('[data-tup]') && i > 0) { sync(); [draft[i - 1], draft[i]] = [draft[i], draft[i - 1]]; paint(); }
      else if (row && e.target.closest('[data-tdown]') && i < draft.length - 1) { sync(); [draft[i + 1], draft[i]] = [draft[i], draft[i + 1]]; paint(); }
      else if (row && e.target.closest('[data-tdel]')) {
        sync();
        const n = count(draft[i].id);
        if (n && !confirm(`“${draft[i].name}” türünde ${n} kaynak var. Tür silinirse bu kaynaklar türsüz kalır. Silinsin mi?`)) return;
        draft.splice(i, 1);
        paint();
      } else return;
      markDirty();
    };
  }

  function catsView(type) {
    view.onclick = null;
    const T = TYPES[type], tabTitle = { videos: 'Videolar', posts: 'Yazılar', podcasts: 'Podcast' }[type], tab = CAT_TABS[type], key = S.CAT_KEYS[tab], route = SITE_ROUTE[type];
    crumbs([`<a href="#${type}">${T.title}</a>`, 'Alt Kategoriler']);
    view.dataset.form = '1';
    const clone = (o) => JSON.parse(JSON.stringify(o));
    let draft = clone((D.settings[key] || {}).cats || []);
    const items = () => (D[collOf(type)] || []).filter((x) => inType(type, x));
    const count = (id) => items().filter((x) => x.cat === id).length;
    const slugOf = (c) => S.slugify(c.slug || c.name);

    const rowHTML = (c, i) => {
      const n = count(c.id);
      return `
      <div class="crow" data-i="${i}">
        <div class="crow-f">
          <label class="fld"><span>Ad <i class="req">*</i></span><input type="text" data-f="name" value="${esc(c.name || '')}" placeholder="Ör. Gıda"></label>
          <label class="fld"><span>Bağlantı</span><input type="text" data-f="slug" value="${esc(c.slug || '')}" placeholder="otomatik" spellcheck="false"><small>Adres: /${route}/<b data-addr>${esc(slugOf(c) || 'baglanti')}</b>/</small></label>
          <label class="fld crow-w"><span>Açıklama</span><textarea data-f="desc" rows="2" placeholder="Bu alt kategoride neler paylaşıyorsunuz?">${esc(c.desc || '')}</textarea><small>Alt kategori sayfasında başlığın altında görünür; arama sonucunda açıklama olarak kullanılır.</small></label>
          <label class="fld crow-w"><span>Kanal bağlantısı</span><input type="url" data-f="link" value="${esc(c.link || '')}" placeholder="https://www.youtube.com/@kanaliniz"><small>Bu içerikleri yayınladığınız diğer kanal ya da hesap. Sayfada “YouTube kanalına git ↗” gibi bir bağlantı olarak görünür.</small></label>
        </div>
        <div class="crow-a">
          ${n ? `<a class="pill on" href="#${type}/cat/${esc(c.id)}" title="Bu alt kategorideki içerikler">${n} içerik</a>` : '<span class="pill" title="İçeriği olmayan alt kategori sitede görünmez">Boş</span>'}
          <div class="crow-btns">
            <button type="button" class="btn btn-sm btn-icon btn-ghost" data-mv="-1" title="Yukarı" ${i === 0 ? 'disabled' : ''}>↑</button>
            <button type="button" class="btn btn-sm btn-icon btn-ghost" data-mv="1" title="Aşağı" ${i === draft.length - 1 ? 'disabled' : ''}>↓</button>
            <button type="button" class="btn btn-sm btn-icon btn-danger" data-rm title="Alt kategoriyi sil">×</button>
          </div>
        </div>
      </div>`;
    };

    // Sitedeki düğmelerin önizlemesi (yayında içeriği olmayanlar sitede görünmez)
    const preview = () => {
      const el = $('#cprev');
      const live = (id) => items().some((x) => x.cat === id && x.published !== false);
      if (el) el.innerHTML = `<span class="on">Hepsi</span>${draft.filter((c) => (c.name || '').trim()).map((c) => `<span class="${live(c.id) ? '' : 'off'}" title="${live(c.id) ? '' : 'Yayında içeriği yok: sitede görünmez'}">${esc(c.name)}</span>`).join('')}`;
    };

    const render = () => {
      view.innerHTML = `
        <div class="vh"><div><h1>${tabTitle} — Alt Kategoriler</h1><p>${tabTitle} sekmesinin alt kategorileri. Farklı kanallarda ürettiğiniz içerikleri (yemek hikâyeleri, gündem…) aynı sekmede kendi bölümlerinde toplayın. Her alt kategorinin sitede kendi sayfası olur: <code>/${route}/baglanti/</code>.</p></div>
          <div class="vh-actions">
            <a class="btn btn-ghost" href="#${type}">← ${T.title}</a>
            <a class="btn btn-ghost" href="index.html#/${route}" target="_blank">Görüntüle ↗</a>
            <button class="btn btn-acid" data-csave>Kaydet</button>
          </div></div>
        <div class="form-grid">
          <div>
            <div class="card"><h3>Sitede görünüşü</h3><div class="cprev" id="cprev"></div><small class="help">Sekmenin üstündeki düğmeler. Soluk olanların henüz yayında içeriği yok; sitede görünmezler.</small></div>
            <div class="card"><h3>Alt kategoriler</h3>
              <div class="clist" id="clist">${draft.map(rowHTML).join('') || '<p class="muted">Henüz alt kategori yok. Aşağıdaki düğmeyle ilkini ekleyin.</p>'}</div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px"><button type="button" class="btn" data-cadd>+ Alt kategori ekle</button></div>
            </div>
          </div>
          <div class="form-side">
            <div class="card"><h3>Nasıl çalışır?</h3>
              <ol class="todo">
                <li>Buradan alt kategori ekleyin, sıralayın ya da silin; <b>Kaydet</b>’e basın.</li>
                <li>Her ${T.one.toLowerCase()} formunun sağ sütunundaki <b>Alt kategori</b> kutusundan içeriğin alt kategorisini seçin.</li>
                <li>Sitede ${tabTitle} sekmesinin üstünde <b>Hepsi · …</b> düğmeleri ve her alt kategorinin kendi sayfası görünür.</li>
                <li>Silinen alt kategorinin içerikleri silinmez; alt kategorisiz kalır.</li>
              </ol>
            </div>
            <div class="card"><h3>Alt kategorisiz içerik</h3><p class="muted" style="margin:0 0 12px">${items().filter((x) => !draft.some((c) => c.id === x.cat)).length} ${T.one.toLowerCase()} herhangi bir alt kategoride değil; sitede yalnızca “Hepsi” altında görünür.</p><a class="btn btn-block" href="#${type}/cat/-">Listede göster →</a></div>
            <button type="button" class="btn btn-acid btn-block" data-csave>Kaydet</button>
          </div>
        </div>`;
      preview();
    };

    render();

    view.oninput = (e) => {
      const row = e.target.closest('.crow');
      if (!row || !e.target.dataset.f) return;
      const c = draft[+row.dataset.i];
      c[e.target.dataset.f] = e.target.value;
      if (e.target.dataset.f === 'name' || e.target.dataset.f === 'slug') {
        $('[data-addr]', row).textContent = slugOf(c) || 'baglanti';
        preview();
      }
      dirty = true;
    };

    view.onclick = (e) => {
      const row = e.target.closest('.crow');
      const i = row ? +row.dataset.i : -1;
      if (e.target.closest('[data-rm]')) {
        const c = draft[i], n = count(c.id);
        if (!confirm(`“${c.name || 'Adsız'}” alt kategorisi silinsin mi?${n ? `\n\nİçindeki ${n} içerik silinmez, alt kategorisiz kalır.` : ''}\n\nDeğişiklik Kaydet’e basınca uygulanır.`)) return;
        draft.splice(i, 1); dirty = true; render();
      } else if (e.target.closest('[data-mv]')) {
        const j = i + Number(e.target.closest('[data-mv]').dataset.mv);
        if (j < 0 || j >= draft.length) return;
        [draft[i], draft[j]] = [draft[j], draft[i]]; dirty = true; render();
      } else if (e.target.closest('[data-cadd]')) {
        draft.push({ id: S.uid(), name: '', slug: '', desc: '', link: '' });
        dirty = true; render();
        const last = $$('.crow').pop();
        if (last) { last.scrollIntoView({ behavior: 'smooth', block: 'center' }); $('[data-f="name"]', last).focus(); }
      } else if (e.target.closest('[data-csave]')) save();
    };

    function save() {
      // Bağlantılar: boşsa addan; aynı sekmede başka bir alt kategoriyle ya da içerikle çakışırsa sonuna -2, -3…
      const taken = new Set((D[collOf(type)] || []).map((x) => x.slug));
      const used = new Set();
      const out = [];
      for (const c of draft) {
        const name = (c.name || '').trim();
        if (!name) { toast('Her alt kategorinin bir adı olmalı', true); return; }
        const link = (c.link || '').trim();
        if (link && !/^https?:\/\/[^/\s]+/i.test(link)) { toast(`“${name}” için kanal bağlantısı https:// ile başlamalı`, true); return; }
        const base = slugOf(c) || 'kategori';
        let s = base, n = 2;
        while (used.has(s) || taken.has(s)) s = `${base}-${n++}`;
        if (s !== base) toast(`“${base}” bağlantısı kullanılıyor; “${name}” için “${s}” seçildi`);
        used.add(s);
        out.push({ id: c.id || S.uid(), name, slug: s, desc: (c.desc || '').trim(), link });
      }
      // Silinen alt kategorilerin içerikleri alt kategorisiz kalır
      const ids = new Set(out.map((c) => c.id));
      let freed = 0;
      items().forEach((x) => { if (x.cat && !ids.has(x.cat)) { delete x.cat; freed++; } });
      D.settings[key] = { ...(D.settings[key] || {}), cats: out };
      if (persist(freed ? `Alt kategoriler kaydedildi · ${freed} içerik alt kategorisiz kaldı` : 'Alt kategoriler kaydedildi')) {
        dirty = false;
        draft = clone(out);
        render();
      }
    }
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
            excerpt: type === 'pages' ? (x.excerpt || '') : (x.excerpt || x.summary || (x.description || '').replace(/<[^>]+>/g, '')),
            raw: x
          });
        });
      };
      add(D.posts, 'posts', 'Yazı', false);
      add(D.podcasts, 'podcasts', 'Podcast', true);
      add(D.remixes, 'remixes', 'Remix', true);
      add(D.pages, 'pages', 'Sayfa', false);
      add(D.resources, 'resources', 'Kaynak', false);
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
              <button type="button" class="pill ${activeFilter === 'resources' ? 'on' : ''}" data-filter="resources">Kaynaklar</button>
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
    ['home', 'Ana Sayfa'], ['videos', 'Videolar'], ['blog', 'Yazılar'], ['podcast', 'Podcast'],
    ['remixes', 'Remixler'], ['books', 'Kitaplar'], ['resources', 'Kaynaklar'], ['about', 'Hakkında'], ['page', 'Özel Sayfa'], ['url', 'Dış Bağlantı (URL)']
  ];
  const AUTO_PATH = { home: '#/', videos: '#/videolar', blog: '#/yazilar', podcast: '#/podcast', remixes: '#/remixler', books: '#/kitaplar', resources: '#/kaynaklar', about: '#/hakkinda' };

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
      D.about = { ...D.about, ...collect(frm, ABOUT_FIELDS), updated: today() }; // site haritasında son güncelleme
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
  const SOCIALS = [['youtube', 'YouTube'], ['instagram', 'Instagram'], ['tiktok', 'TikTok'], ['x', 'X (Twitter)'], ['linkedin', 'LinkedIn'], ['spotify', 'Spotify'], ['soundcloud', 'SoundCloud'], ['email', 'E-posta']];

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
      <div class="vh"><div><h1>Ayarlar & Tema</h1><p>Site kimliği, renk teması ve panel şifresi. Sosyal medya hesapları kendi bölümünde: <a href="#sosyal" style="text-decoration:underline">Sosyal Medya</a>.</p></div>
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
     Sosyal medya: adresler ve her hesabın sitede görünüp görünmeyeceği
     ====================================================================== */
  // Yazılan adresi tamamlar: "instagram.com/akcan" → https://..., "mailto:a@b.com" → a@b.com
  const normSocial = (k, v) => {
    v = String(v || '').trim();
    if (!v) return '';
    if (k === 'email') return v.replace(/^mailto:/i, '');
    return /^https?:\/\//i.test(v) ? v : 'https://' + v;
  };
  const socialOk = (k, v) => (k === 'email' ? /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) : S.isProfile(v));

  function socialView() {
    crumbs(['Sosyal Medya']);
    view.dataset.form = '1';
    const st = D.settings, so = st.social || {}, off = st.socialOff || [];
    const ICONS = window.Render.SOCIAL_ICON;
    view.innerHTML = `
      <div class="vh"><div><h1>Sosyal Medya</h1><p>Hesaplarınızın adresleri ve sitede görünüp görünmeyecekleri. Aktif hesaplar üst menüde simge, alt bilgide bağlantı olarak görünür ve arama motorlarına “aynı kişinin profilleri” olarak bildirilir.</p></div>
        <div class="vh-actions"><a class="btn btn-ghost" href="#onizleme">Önizlemede Gör</a><button class="btn btn-acid" data-save>Kaydet</button></div></div>
      <div class="card">
        <label class="sw" style="padding:0"><span class="swl">Üst menüde göster<small>Aktif hesaplar menünün sağında, arama düğmesinin solunda simge olarak durur; telefonda menü çekmecesinin altında. Kapatırsanız simgeler yalnızca üst menüden kalkar, alt bilgide durur.</small></span><input type="checkbox" id="soNav" ${st.navSocial !== false ? 'checked' : ''}><span class="tg"></span></label>
      </div>
      <div class="card"><h3>Hesaplar</h3>
        <div class="so-list">${SOCIALS.map(([k, l]) => `
          <div class="so-row" data-net="${k}">
            <span class="so-ic" aria-hidden="true">${ICONS[k] || ''}</span>
            <label class="fld"><span>${l}</span><input type="${k === 'email' ? 'email' : 'url'}" data-so="${k}" value="${esc(so[k] || '')}" placeholder="${k === 'email' ? 'ornek@mail.com' : 'https://...'}" spellcheck="false"><small class="so-hint"></small></label>
            <label class="sw" title="${l} sitede görünsün mü?"><span class="swl so-st"></span><input type="checkbox" data-so-on="${k}" ${off.includes(k) ? '' : 'checked'}><span class="tg"></span></label>
          </div>`).join('')}</div>
        <small class="help">Pasif yaptığınız hesabın adresi burada saklı kalır; yeniden aktif yaptığınızda sitede görünür. Boş bırakılan ya da profil adresi olmayan (ör. <code>https://www.youtube.com/</code>) hesaplar aktif olsa da görünmez.</small>
      </div>`;

    // Her satırın durumu: Aktif / Pasif ve adresin sitede görünüp görünmeyeceği
    const paint = (row) => {
      const k = row.dataset.net, on = $('[data-so-on]', row).checked, v = normSocial(k, $('[data-so]', row).value);
      const ok = socialOk(k, v);
      const [cls, txt] = !on ? ['', 'Pasif: sitede görünmez.']
        : !v ? ['', 'Adres boş: sitede görünmez.']
        : !ok ? ['warn', k === 'email' ? 'Geçerli bir e-posta adresi değil; sitede görünmez.' : 'Profil adresi değil (ör. kullanıcı adınızla tam adres); sitede görünmez.']
        : k === 'email' && /ornek\.com$/i.test(v) ? ['warn', 'Örnek adres sitede görünür: kendi adresinizi yazın ya da pasif yapın.']
        : ['ok', '✓ Sitede görünür.'];
      row.classList.toggle('off', !on);
      $('.so-st', row).textContent = on ? 'Aktif' : 'Pasif';
      const h = $('.so-hint', row);
      h.className = 'so-hint ' + cls;
      h.textContent = txt;
    };
    $$('.so-row', view).forEach((row) => {
      paint(row);
      row.addEventListener('input', () => paint(row));
      row.addEventListener('change', () => paint(row));
    });

    const save = () => {
      D.settings.social = D.settings.social || {};
      $$('[data-so]', view).forEach((i) => { i.value = D.settings.social[i.dataset.so] = normSocial(i.dataset.so, i.value); });
      D.settings.socialOff = $$('[data-so-on]', view).filter((i) => !i.checked).map((i) => i.dataset.soOn);
      D.settings.navSocial = $('#soNav').checked;
      if (persist('Sosyal medya kaydedildi')) { dirty = false; $$('.so-row', view).forEach(paint); }
    };
    $$('[data-save]', view).forEach((b) => b.addEventListener('click', save));
    view._save = save;
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
    const own = ['posts', 'podcasts', 'remixes', 'pages', 'resources'].reduce((n, c) => n + live(c).length, 0);
    const nSamples = ['posts', 'podcasts', 'remixes', 'pages', 'series', 'books', 'resources'].reduce((n, c) => n + (D[c] || []).filter(S.isSample).length, 0);
    const noDesc = ['posts', 'podcasts', 'remixes'].flatMap(live).filter((x) => !(x.seoDesc || x.excerpt));
    const noAlt = [...live('posts').filter((p) => S.postKind(p) === 'yazi'), ...live('podcasts'), ...live('remixes'), ...live('pages')].filter((x) => x.cover && !x.coverAlt);
    // SEO & GEO puanı: yayındaki kendi içerikler (görsel genişliği burada ölçülmez)
    const seoR = seoRender();
    const scored = SEO_COLS.flatMap((c) => live(c).map((x) => ({ c, x, p: SEO.score(c, x, { R: seoR }).puan })));
    const seoAvg = scored.length ? Math.round(scored.reduce((t, s) => t + s.p, 0) / scored.length) : 0;
    const seoLow = scored.filter((s) => s.p < 80).sort((a, b) => a.p - b.p).slice(0, 5);
    const seoRow = scored.length ? [[seoAvg >= 80 ? 'ok' : 'warn', 'SEO & GEO puanı', `Ortalama ${seoAvg}/100.` + (seoLow.length
      ? ' Geliştirilebilecekler: ' + seoLow.map((s) => `<a href="#${s.c === 'posts' ? postType(s.x) : s.c}/edit/${s.x.id}">${esc(s.x.title || '(başlıksız)')}</a> (${s.p})`).join(', ')
      : ' Bütün içerikler 80 ve üstü.'), '']] : [];
    const badSocial = SOCIALS.filter(([k]) => k !== 'email' && so[k] && !S.isProfile(so[k]) && !(st.socialOff || []).includes(k)).map(([, l]) => l);
    const sampleMail = /ornek\.com$/i.test(so.email || '') && !(st.socialOff || []).includes('email');
    // Yayına giden kendi serileriniz; örnek ya da yayında olmayan seriye bağlı bölümler yayına gitmez
    const ownSeries = live('series');
    const ownSerIds = new Set(ownSeries.map((s) => s.id));
    const strayEps = live('podcasts').filter((x) => !ownSerIds.has(x.series));
    const rc = st.remixPage || {};
    const badSeries = ownSeries.flatMap((s) => [['Spotify', s.spotify], ['Apple Podcasts', s.apple], ['YouTube', s.youtube]].filter(([, u]) => u && !S.isProfile(u)).map(([l]) => `${s.title} → ${l}`));
    // Kitapların satış sayfaları: ürün ya da arama sayfası olmalı (platformun ana sayfası gösterilmez)
    // Kaynak bağlantıları: yalnızca sitenin ana adresi (ör. https://github.com/) yazılmışsa uyarılır
    const badRes = live('resources').filter((r) => [r.url, ...(r.links || []).map((l) => l.url)].some((u) => u && !S.isProfile(u))).map((r) => r.title);
    const badBooks = live('books').flatMap((b) => S.BOOK_SHOPS.filter(([k]) => b[k] && !S.isProfile(b[k])).map(([, n]) => b.title + ' → ' + n));
    const badPlatforms = [...badSeries, ...badBooks, ...[['Remixler → SoundCloud', rc.soundcloud], ['Remixler → Mixcloud', rc.mixcloud], ['Remixler → Spotify', rc.spotify], ['Remixler → YouTube', rc.youtube]]
      .filter(([, u]) => u && !S.isProfile(u)).map(([l]) => l)];
    const sampleAbout = !!(O.about && a.bio && a.bio === O.about.bio);
    const ownRole = a.role && !(O.about && a.role === O.about.role);
    const picsum = /picsum\.photos/.test(JSON.stringify(Yayin.publicData(D)));
    const repo = Yayin.config().repo;
    const subPath = !seo.siteUrl && repo && !/\.github\.io$/i.test(repo.split('/')[1] || '');
    return [
      [Yayin.ready() ? 'ok' : 'warn', 'GitHub bağlantısı', Yayin.ready() ? 'Kaydettiğiniz içerik otomatik olarak yayına gider.' : 'Sağdaki “GitHub bağlantısı” kartını doldurun.', ''],
      [own ? 'ok' : 'warn', 'Kendi içerikleriniz', own ? `${own} içerik yayında.` : 'Henüz kendi içeriğiniz yok. Örnek içerikler yayına gönderilmez.', '#videos/new'],
      [nSamples ? 'info' : 'ok', 'Örnek içerikler', nSamples ? `${nSamples} örnek içerik panelde duruyor; yayına gönderilmez. İsterseniz hepsini tek tıkla silebilirsiniz.` : 'Panelde örnek içerik yok.', nSamples ? 'del-samples' : ''],
      [sampleAbout || !a.bio ? 'warn' : 'ok', 'Hakkında sayfası', sampleAbout ? 'Hakkında sayfasında örnek metin duruyor. Kendi biyografinizi yazın: Google ve yapay zekâ sizi bu sayfadan tanır.' : a.bio ? 'Biyografiniz yazılmış.' : 'Biyografinizi yazın: Google ve yapay zekâ sizi bu sayfadan tanır.', '#about'],
      [ownRole ? 'ok' : 'warn', 'Kısa tanım', ownRole ? `“${esc(a.role)}”` : 'Hakkında’ya kim olduğunuzu anlatan tek cümlelik kendi tanımınızı yazın (ör. “Müzik prodüktörü ve DJ”).', '#about'],
      [badSocial.length ? 'warn' : 'ok', 'Sosyal medya profilleri', badSocial.length ? `${badSocial.join(', ')} bağlantısı bir profil adresi değil (ör. https://www.youtube.com/@kanaliniz); sitede gösterilmez.` : 'Profil bağlantılarınız arama motorlarına “aynı kişi” olarak bildirilir.', '#sosyal'],
      [badPlatforms.length ? 'warn' : 'ok', 'Podcast, remix ve kitap platformları', badPlatforms.length ? `${badPlatforms.join(', ')}: profil adresi değil, sitede gösterilmez. Seriler için ◫ Seriler’de serinin formuna, kitaplar için kitabın formuna, remixler için Remixler → ⚙ Sayfa Ayarları’na programınızın ya da profilinizin tam adresini yazın.` : 'Platform bağlantıları profil adresi.', badSeries.length ? '#series' : badBooks.length ? '#books' : '#remixes/settings'],
      [strayEps.length ? 'warn' : ownSeries.length ? 'ok' : 'info', 'Podcast serileri', strayEps.length ? `${strayEps.length} bölüm yayında olmayan ya da örnek bir seriye bağlı; yayına gitmez. Bölümü kendi serinize taşıyın ya da seriyi yayına alın.` : ownSeries.length ? `${ownSeries.length} seri yayında.` : 'Yayında seri yok: Podcast sayfası boş görünür. ◫ Seriler’den kendi serinizi ekleyin.', '#series'],
      [sampleMail ? 'warn' : 'ok', 'E-posta adresi', sampleMail ? `“${esc(so.email)}” örnek bir adres; kendi adresinizi yazın, silin ya da pasif yapın.` : 'Örnek adres kullanılmıyor.', '#sosyal'],
      [picsum ? 'warn' : 'ok', 'Örnek görseller', picsum ? 'Yayına giden ayarlarda ya da içeriklerde örnek görsel (picsum.photos) var: manşet görseli, podcast kapağı, Hakkında fotoğrafı… Kendi görsellerinizi yükleyin.' : 'Örnek görsel kullanılmıyor.', '#settings'],
      ...(live('resources').length ? [[badRes.length ? 'warn' : 'ok', 'Kaynak bağlantıları', badRes.length ? `${badRes.map(esc).join(', ')}: bağlantı yalnızca bir sitenin ana adresi (ör. https://github.com/). Kaynağın kendi sayfasının tam adresini yazın.` : 'Kaynak bağlantıları tam adres.', '#resources']] : []),
      ...seoRow,
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
              <li><b>Profiller</b> — Instagram, TikTok, Spotify, SoundCloud, X ve LinkedIn profillerinize site adresini yazın; her yerde aynı isim, aynı kısa biyografi, aynı fotoğraf.</li>
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
      if (!confirm('Panel’deki bütün örnek içerikler (videolar, yazılar, podcast serileri ve bölümleri, remixler, kitaplar, kaynaklar, sayfalar) silinsin mi? Kendi içerikleriniz değişmez.')) return;
      const ids = new Set(['posts', 'podcasts', 'remixes', 'pages', 'books', 'resources'].flatMap((k) => (D[k] || []).filter(S.isSample).map((x) => x.id)));
      const slugs = new Set((D.pages || []).filter((p) => ids.has(p.id)).map((p) => p.slug));
      ['posts', 'podcasts', 'remixes', 'pages', 'books', 'resources'].forEach((k) => { D[k] = (D[k] || []).filter((x) => !ids.has(x.id)); });
      // Örnek seriler de silinir; kendi bölümünüzün bağlı olduğu örnek seri kalır
      const used = new Set((D.podcasts || []).map((x) => x.series));
      D.series = (D.series || []).filter((s) => !S.isSample(s) || used.has(s.id));
      const keptSeries = D.series.filter(S.isSample).length;
      // Silinen örnek sayfalara giden menü öğeleri de kalkar (aynı adreste kendi sayfanız varsa kalır)
      const left = new Set((D.pages || []).map((p) => p.slug));
      D.menu = (D.menu || []).filter((m) => !(m.type === 'page' && slugs.has(m.target) && !left.has(m.target)));
      if (D.settings.featured && ids.has(D.settings.featured.id)) D.settings.featured.id = '';
      if (persist(keptSeries ? `Örnek içerikler silindi (${keptSeries} örnek seri, kendi bölümleriniz bağlı olduğu için kaldı)` : 'Örnek içerikler silindi')) publishView();
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
  route = function () { view._save = null; view._seoPaint = null; resetViewHandlers(); _route(); }; // eslint-disable-line no-func-assign

  // Başka sekmede değişiklik olursa veriyi tazele (form açık değilse).
  // Önizleme ekranı yeniden çizilmez: içindeki site değişikliği kendisi alır
  window.addEventListener('storage', (e) => {
    if (e.key === LAST_SAVE) { paintLastSave(); return; }
    if (e.key !== S.KEY) return;
    D = S.get();
    if (location.hash.split('/')[0] === '#onizleme') return;
    if (!dirty && isAuthed()) route();
  });

  /* ======================================================================
     Başlat
     ====================================================================== */
  // Her kayıttan sonra yayındaki site otomatik güncellenir (GitHub bağlantısı kuruluysa)
  S.onSave(() => Yayin.schedule());
  // Önizlemedeki "Son kayıt" bilgisi (panel başka sekmede açıksa oraya da gider)
  S.onSave(() => { try { localStorage.setItem(LAST_SAVE, String(Date.now())); } catch (e) { /* yok say */ } paintLastSave(); });
  Yayin.onChange((s) => {
    paintPubPill(s);
    const el = $('#pubState');
    if (el) el.innerHTML = pubStateHTML(s);
  });
  if (isAuthed()) showApp(); else showLogin();
})();
