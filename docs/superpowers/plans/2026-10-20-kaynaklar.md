# Kaynaklar Sekmesi — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kapaklı, zengin metinli ve bağlantılı kaynakları gösteren, panelden yönetilen, menüde açılıp kapanan, listede yan panelde açılan ve SEO & GEO'ya tam dahil bir Kaynaklar sekmesi; Hero'da kaynak seçimi.

**Architecture:** Kitaplar'ın deseni: `store.js` veri + geçiş + örnekler, `render.js` liste/sayfa/yan panel HTML'i ve SEO, `build.js` llms çıktıları, `app.js` istemci davranışı (arama, çipler, "Yeni", yan panel), `admin.js` panel. Kart her zaman kaynağın sayfasına giden `<a>`'dır; yan panel JavaScript ile açılır, adres değişmez.

**Tech Stack:** Düz JavaScript, `node:test`, Playwright (site ve panel).

**Spec:** `docs/superpowers/specs/2026-10-20-kaynaklar-design.md`

## Global Constraints

- Yapay zekâ servisi yok; yeni bağımlılık yok.
- Arayüz metinleri Türkçe, spec'teki kelimelerle ("Kaynağa git", "Sayfasına git →", "Tüm kaynaklar", "Bu kaynağı anlattığım içerik", "Bu içerikteki kaynaklar" / videoda "Bu videodaki kaynaklar", "Diğer kaynaklar", "Henüz kaynak yok.", "Aramanıza uygun kaynak yok.", "Öne çıkan kaynak", "Yeni").
- Öne çıkarma alanı `pinned`; `featured` kaynaklarda kullanılmaz (Hero'yu değiştirir).
- Örnekler ve taslaklar yayına gitmez; gizli menü + yalnızca örnek → yayında `/kaynaklar/` yok.
- Dış bağlantılar `target="_blank" rel="noopener"`; kullanıcı metni her yerde `esc`.
- Proje kuralı: yeni tür SEO & GEO sistemine tam dahil (`seoOf`, `js/seo.js`, site haritası, IndexNow, llms).
- Mevcut testler yeşil kalır (`node --test tests/`, şu an 66); mevcut sürüm testleri `>=` ile yazılı.

## Review Focus

1. `related` silinmiş, taslak, örnek ya da serisi yayında olmayan bir bölüme gidiyorsa → kart basılmaz, `undefined` yok (Task 2 testi).
2. Ana bağlantı boş, protokolsüz (`github.com/x`) ya da bozuk → alan adı satırı ve düğme çıkmaz ya da güvenli biçimde çıkar, çökme yok (Task 2 testi).
3. Kullanımdaki tür silinmiş → kaynak türsüz görünür (etiket yok), çiplerde silinen tür yok (Task 2 testi + Task 4 panel adımı).
4. Yan panel: Ctrl/orta tık sayfayı normal açar; Esc kapatır ve odak karta döner; 390 px'te alttan açılır, taşma yok (Task 3 Playwright).
5. Türkçe arama: "istanbul" → "İstanbul", "ışık" → "IŞIK" eşleşir (Task 3 Playwright).

---

### Task 1: Veri modeli, geçiş ve örnek kaynaklar

**Files:**
- Modify: `js/store.js`, `js/ornek-icerik.js`
- Test: `tests/store.test.js`

**Interfaces:**
- Produces: `DEFAULTS.version = 6`; `SAMPLE_VERSION = 7`; `DEFAULTS.resources` (`O.resources || []`); `settings.resourcesPage = { title: 'Kaynaklar', eyebrow: 'Kaynak · Araçlar, rehberler ve bağlantılar', intro: <tanıtım>, tint: '#2A3550' }`; `settings.resourceTypes = [{id:'rehber',name:'Rehber'},{id:'arac',name:'Araç'},{id:'video',name:'Video'},{id:'kitap',name:'Kitap'},{id:'site',name:'Site'}]`; menü öğesi `{ type: 'resources', label: 'Kaynaklar', visible: false }` (varsayılan menüde Kitaplar'ın ardında); `SAMPLE_IDS` ve `addSamples` varsayılan koleksiyonları `resources` içerir; `forPublish` `resources`'ı süzer; slug adımı `resources` (yedek `kaynak`).
- Örnek kimlikleri `kaynak-1` … `kaynak-6` (`NEW_SAMPLES_7`), `AKCAN_ORNEK.resources` ve örnek menüde gizli öğe.

- [ ] **Step 1: Failing tests** (`tests/store.test.js`)
  - `kaynak-ilk-kurulum`: `S.normalize({})` → `version >= 6`, `resources.length === 6`, `resourceTypes` 5 tür, menüde `resources` öğesi `visible: false` ve `books` öğesinin hemen ardında.
  - `kaynak-gecis-menu`: `normalize({ version: 5, menu: [home, remixes, books, about] })` → menü `[home, remixes, books, resources, about]`, `resources === []`; Kitaplar yoksa Remixler'in ardına; ikisi de yoksa sona; öğe silinip yeniden normalleştirilince geri gelmez.
  - `kaynak-ornek-surum-7`: örneği kalmış `sampleVersion: 6, version: 5` kaydına `get()` ile 6 kaynak eklenir; örneklerini silmiş kayda eklenmez.
  - `kaynak-forPublish`: kendi yayındaki kaynak kalır; taslak ve örnek gider.
  - Örnekler: beş türün hepsi var; tam iki `pinned`; birinin `related`'ı örnek bir videoya (`posts:<id>`) gider; biri ≥ 3 ek bağlantılı; biri yalnızca `title` + `url`; hiçbirinde `featured` yok.
- [ ] **Step 2: Run** `node --test tests/store.test.js` — Expected: yeni testler FAIL (`resources` tanımsız / uzunluk 0).
- [ ] **Step 3: Implement** (Kitaplar sürüm 5 / örnek 6 adımlarının birebir deseni; menü konumu: `books` → yoksa `remixes` → yoksa sona). Örnek kapaklar `PIC('kaynak-…', 1280, 720)`; bağlantılar gerçek, genel siteler (ör. audacityteam.org, freesound.org, youtube.com arama); tarihler 2026-09 / 2026-10.
- [ ] **Step 4: Run** `node --test tests/` — Expected: hepsi PASS.
- [ ] **Step 5: Commit** `git commit -m "Kaynaklar: veri modeli, geçiş ve örnek kaynaklar"`

### Task 2: Site sayfaları, yan panel HTML'i, SEO & GEO, Hero

**Files:**
- Modify: `js/render.js`, `js/seo.js`, `build.js`, `css/style.css`
- Test: `tests/render.test.js`, `tests/seo.test.js`, `tests/build.test.js`

**Interfaces:**
- Consumes: Task 1 verisi.
- Produces (Task 3 ve 4 kullanır):
  - `R.resourceList()` → yayındaki kaynaklar, tarihe göre yeniden eskiye.
  - `R.resourceDrawer(id)` → yan panelin iç HTML'i (yoksa `''`); başlık öğesi `id="rdTitle"`.
  - `R.seoOf('resources', x)`; `R.page('kaynaklar')`, `R.page('kaynaklar/<slug>')`.
  - Liste sayfası HTML sözleşmesi: `input#resq` (arama), `#rescount` (`<b>N</b> / M kaynak`), `#reschips button[data-t]` (`data-t=""` Tümü, sonra kaynağı olan türler, yanında sayı), `#respinned` (öne çıkanlar bölümü), `#resgrid`, `p#resempty[hidden]` ("Aramanıza uygun kaynak yok."). Her kart (öne çıkan dahil) `a.rcard[href=<sayfa>][data-res=<id>][data-type=<tür id ya da ''>][data-date=<YYYY-MM-DD>][data-q=<tr küçük harf: başlık + kısa açıklama + alan adı + bağlantı adları>]`; içinde `span.rnew` ("Yeni"; render gününe göre `hidden` ya da değil).
  - Hero: `getFeaturedHero` kaynakları tanır (`type: 'resources'`, üst etiket "Öne çıkan kaynak", düğme "İncele", kapak `cover`, açıklama `summary`).
  - `SEO` puanı: `resources` için özet alanı `summary`, ana metin `body`, eşik 80.

- [ ] **Step 1: Failing tests**
  - `render.test.js`:
    - `kaynak-listesi`: yerel modda `page('kaynaklar')` → H1, sayaç `6 / 6`, `#reschips`'te "Tümü" + 5 tür, `#respinned`'de 2 kart, ızgarada 4 kart (öne çıkanlar tekrar edilmez), her kartın `href`'i sayfasına, alan adı `www.` olmadan, `CollectionPage` şeması.
    - `kaynak-sayfasi`: bölümler (Tüm kaynaklar, tür, H1, giriş, "Kaynağa git", Bağlantılar, "Bu kaynağı anlattığım içerik" kartı, Diğer kaynaklar), `Article` şeması (`about.url` = ana bağlantı, `citation` ek bağlantılar), `BreadcrumbList`.
    - `asgari-kaynak` (yalnızca `title`): sayfa ve kart `undefined|null|NaN` içermez, boş bölümler yok.
    - `kaynak-bozuk-baglantilar`: `url: 'github.com/x'` ve `url: '::'` → çökme yok, düğme yalnız geçerli `http(s)` adreste; `related: ['posts:yok', 'podcasts:<taslak seriye bağlı bölüm>']` → ilgili içerik bölümü basılmaz.
    - `kaynak-silinen-tur`: `type: 'yok'` → kartta tür etiketi yok, çiplerde yok.
    - `cift-yonlu-bag`: örnek videonun sayfasında "Bu videodaki kaynaklar" ve kaynağın kartı.
    - `kaynak-rotalari-gizli-menu`: `forPublish` sonrası yalnız örnek + gizli menü → `routes()`'ta `kaynaklar` yok; kendi yayındaki kaynak varken sayfası var; menü görünürken liste var.
    - `seoOf-kaynak`: `seoOf('resources', x)` başlık/açıklama/görsel = `page()`; `snippet` uygulanmış.
    - `hero-kaynak`: `settings.featured = { mode: 'manual', type: 'resources', id: 'kaynak-1' }` → ana sayfa manşetinde başlık, "Öne çıkan kaynak", kaynak sayfasına bağlantı; kaynak taslaksa manşet en son içeriğe döner.
    - `kaynak-404`: `kaynaklar/yok` ve `kaynaklar/a/b` → 404.
    - `bos-kaynak-listesi`: kaynak yokken liste "Henüz kaynak yok." ve `noindex`.
  - `seo.test.js` → `puan-kaynak`: `summary` 150 karakter ve `body` 100 kelime → "Açıklama" ve "İçerik derinliği" tam.
  - `build.test.js` → `derleme-kaynaklar`: kendi yayındaki bir kaynakla derle → `kaynaklar/<slug>/index.html`, site haritasında adres, `llms.txt`'de "Kaynaklar" bölümü, `llms-full.txt`'de kısa açıklama + "Bağlantılar:"; yalnız örnek + gizli menü → hiçbiri yok.
- [ ] **Step 2: Run** `node --test tests/` — Expected: yeni testler FAIL.
- [ ] **Step 3: Implement**
  - `render.js`: kaynak bölümü (Kitaplar bölümünün ardına): `resourceList`, `resRoute`, `resTypeName`, `domainOf(url)` (geçerli `http(s)` değilse `''`), `relItem(key)` (yalnız yayındaki içerik; bölümde `liveEps`), `resCard`, `resourcesIndex`, `resourcePage`, `resourceDrawer`; `seoBase` `case 'resources'`; `page()` `case 'kaynaklar'`; `routes()`; `ROUTE_OF.resources = 'kaynaklar'`; `searchIndex` ("Kaynak"); `postPage`/`episodePage`/`remixPage`'e "Bu içerikteki kaynaklar" bloğu (`.afoot` başlık stiliyle); `getFeaturedHero` `colls`'a kaynak; dışa aktarımlar.
  - `seo.js`: `SUMMARY.resources = 'summary'`, `BODY.resources = 'body'`.
  - `build.js`: llms.txt "Kaynaklar" bölümü (başlık `resourcesPage.title`), llms-full.txt bloğu (kısa açıklama, metin, "Bağlantılar:" listesi, ana bağlantı ilk sırada).
  - `css/style.css`: liste başlığı + arama kutusu + sayaç (masaüstünde yan yana, telefonda alt alta), çipler, öne çıkan kartlar (2 sütun, büyük kapak), kart ızgarası (3/2/1), kart (kapak 16:9, mono tür etiketi, "Yeni" rozeti, 2 satır açıklama, alt satır), kaynak sayfası, bağlantı listesi, ilgili içerik kartları; yan panel (sağdan, 640 px altında alttan, arka plan perdesi, açılış geçişi, `prefers-reduced-motion`'da geçişsiz). Görsellerde `width`/`height`.
- [ ] **Step 4: Run** `node --test tests/` — Expected: hepsi PASS. Örnek veriyle yerel derleme ve önizlemede `/kaynaklar/` + bir kaynak sayfası 1440 / 390 px'te taşmasız (Playwright ekran görüntüsüyle bakılır).
- [ ] **Step 5: Commit** `git commit -m "Kaynaklar: liste ve kaynak sayfası, yan panel, şema, llms, Hero"`

### Task 3: Site davranışı — arama, çipler, "Yeni", yan panel

**Files:**
- Modify: `js/app.js`, `css/style.css` (gerekirse)
- Test: `.playwright-mcp/site-kaynaklar.js` (Playwright betiği; depoda değil)

**Interfaces:**
- Consumes: Task 2'nin liste sayfası HTML sözleşmesi ve `R.resourceDrawer(id)`.
- Davranış:
  - Liste sayfası her çizildiğinde (ilk açılışta hazır HTML dahil) `[data-date]` kartlarında "Yeni" rozeti bugüne göre yeniden ayarlanır (son 30 gün).
  - `#resq` girişi + seçili çip → kartlar `hidden`; sayaç güncellenir; arama ya da çip etkinken `#respinned` gizlenir ve öne çıkanlar ızgarada görünür; sonuç yoksa `#resempty`. Eşleştirme `toLocaleLowerCase('tr')` ile.
  - Sol tıkla (değiştirici tuşsuz) `a.rcard[data-res]` → `preventDefault`, yan panel `R.resourceDrawer(id)` ile açılır (mevcut tıklama dinleyicisi içinde, site içi bağlantı dinleyicisinden önce). Kapanma: `[data-rclose]`, Esc, perde. Açılınca odak "Kapat"a, kapanınca tıklanan karta; açıkken `body` kaymaz; sayfa değişince kapanır.
- [ ] **Step 1: Failing Playwright betiği** — önizleme (`index.html#/kaynaklar`) üzerinden; betik başta localStorage verisine üç kendi kaynağını ekler: başlığında "İstanbul" geçen (tarihi bugünden 3 gün önce), başlığında "IŞIK" geçen (60 gün önce) ve tür "arac" olan bir kaynak.
  1. "istanbul" ve "ışık" araması ilgili kartları bulur.
  2. Çip "Araç" → yalnız araç kartları, sayaç güncel, öne çıkan satırı gizli.
  3. Kart tıklaması → `[role=dialog]` görünür, adres değişmez, içinde "Kaynağa git" ve "Sayfasına git →".
  4. Esc → panel kapanır, odak tıklanan kartta.
  5. Ctrl+tık → panel açılmaz.
  6. 390 px: panel alttan, taşma yok; 1440 px'te CLS 0.
  7. Tarihi bugünden 3 gün önce olan kaynakta "Yeni" görünür, 60 gün öncekinde görünmez.
- [ ] **Step 2: Run** betik — Expected: 1–7 FAIL (davranış yok).
- [ ] **Step 3: Implement** `js/app.js`.
- [ ] **Step 4: Run** betik + `node --test tests/` — Expected: hepsi `true` / PASS.
- [ ] **Step 5: Commit** `git commit -m "Kaynaklar: arama, tür süzgeci, Yeni rozeti ve yan panel"`

### Task 4: Panel, Hero seçimi ve belgeler

**Files:**
- Modify: `admin.html`, `js/admin.js`, `css/admin.css`, `KULLANIM-KILAVUZU.md`, `README.md`
- Test: `.playwright-mcp/panel-kaynaklar.js`

**Interfaces:**
- Consumes: Task 1 verisi, `R.seoOf('resources')` (SEO & GEO kutusu), Hero'da `type: 'resources'`.
- Produces:
  - `TYPES.resources` (`coll: 'resources'`, `one: 'Kaynak'`, `view: (x) => '#/kaynaklar/' + x.slug`, `thumb: (x) => x.cover`, alanlar spec'teki sırayla; `pinned` anahtarı "★ Öne çıkan kaynak").
  - Yeni alan türleri `field()` + `collect()` + `bindForm()`:
    - `t: 'links'` → `div[data-links=<k>]`, satır `.lrow` (`input[data-l=label]`, `input[data-l=url]`, `[data-lup]`, `[data-ldown]`, `[data-ldel]`), `[data-ladd]` "+ Bağlantı ekle"; değer `[{label, url}]` (adresi boş satırlar atılır).
    - `t: 'related'` → `div[data-related=<k>]`: arama kutusu + aday listesi (videolar, yazılar, bölümler, remixler; başlık + tür), seçilenler çip (`.rel-chip[data-key]`, ✕ ile kaldırılır); değer `['posts:<id>', …]`.
    - İkisi de değişince `markDirty()` çağrılır (SEO kutusu yenilenir).
  - Liste: `listView` grubu `{ key: 'type', list: resourceTypes, route: 'tur', all: 'Tüm türler', none: 'Türsüz', title: 'Tür' }`; ★ satırda görünür.
  - Ekranlar: `#resources/settings` (SECTIONS: başlık, üst etiket, tanıtım, ışık rengi), `#resources/types` (yeni `resTypesView`: ekle / yeniden adlandır / ↑↓ / sil; kullanımdaki tür silinirken onay ve sayısı).
  - `newItem('resources')` → `{ published: true, date: bugün, type: ilk tür, links: [], related: [] }`.
  - Diğer: kenar çubuğu (Kitaplar'ın ardına, simge ❖), `MENU_TYPES` "Kaynaklar", `AUTO_PATH.resources = '#/kaynaklar'`, `sectionView` görüntüle eşlemesi, `SEO_COLS` + `resources`, kontrol listesi (kaynak bağlantılarında `isProfile` olmayanlar uyarı, "Kendi içerikleriniz" sayısı, örnek sayısı ve "Örnek içerikleri sil"), Hero ekranı (`getAllItems` + "Kaynaklar" süzgeç çipi) ve paneldeki Hero önizleme çözücüsü (`colls`'a kaynak).
- [ ] **Step 1: Failing Playwright betiği** `.playwright-mcp/panel-kaynaklar.js`:
  1. Kenar çubuğunda `#resources`; liste 6 satır, hepsi "Örnek", ★ iki satırda.
  2. Tür süzgeci "Araç" → yalnız araçlar; adres `#resources/tur/arac`.
  3. Yeni kaynak: başlık, iki bağlantı satırı (biri boş), bir video seçimi → kayıtta `links.length === 1`, `related` bir anahtar, `pinned` yok, `featured` yok; bildirimde "SEO & GEO".
  4. Bağlantı satırı ↑↓ ve ✕ çalışır; etiket kutusu yazarken bölünmez (önceki hata).
  5. `#resources/types`: tür ekle, adlandır, kullanımdaki "Araç"ı sil → onay → o kaynaklar türsüz.
  6. `#resources/settings` 4 alan; Görüntüle `index.html#/kaynaklar`.
  7. Menü Yönetimi: "Kaynaklar" satırı gizli, `Otomatik: #/kaynaklar`; görünür yapınca önizleme menüsünde.
  8. Öne Çıkan (Hero): "Kaynaklar" çipi, bir kaynak seç ve kaydet → önizleme ana sayfasında "Öne çıkan kaynak".
  9. Bütün panel ekranları 1440 / 390 px: taşma yok, `undefined`/`NaN` yok; `panel-seo.js` ve `panel-kitaplar.js` yeşil kalır.
- [ ] **Step 2: Run** — Expected: 1–8 FAIL.
- [ ] **Step 3: Implement** panel. Sonra belgeler: kılavuzda yeni "Kaynaklar" bölümü (Kitaplar'ın ardına; sonraki numaralar, içindekiler ve iç bağlantılar kaydırılır), Başlarken / kenar çubuğu tablosu / menü türleri / kontrol listesi / örnek sayıları / adresler / otomatik SEO listesi / Hero bölümü güncellenir; README'de site, panel, örnekler, adresler ve şema maddeleri.
- [ ] **Step 4: Run** üç Playwright betiği + `node --test tests/` + kılavuz iç bağlantı denetimi — Expected: hepsi yeşil, kırık bağlantı yok.
- [ ] **Step 5: Commit** `git commit -m "Kaynaklar: panel, Hero seçimi, kılavuz ve README"`
