# Podcast Serileri Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Podcast sekmesini tek programdan çok seriye taşımak: `/podcast/` seri vitrini, `/podcast/<seri>/` seri sayfası, `/podcast/<seri>/<bolum>/` bölüm sayfası; panelde ◫ Seriler.

**Architecture:** Seriler `D.series` koleksiyonu (dizideki sıra = vitrin sırası); bölümler `series` alanıyla bağlanır. Geçiş `Store.migrate`'te (veri sürümü 4, örnek sürümü 5). Yayına giden veri tek yerde süzülür (`Store.forPublish`), sayfalar `render.js`'te, panel `admin.js`'teki mevcut TYPES/formView altyapısıyla.

**Tech Stack:** Saf HTML/CSS/JS (bağımlılık yok), Node 22+ (`build.js`, testler `node --test`), Playwright (tarayıcı doğrulaması).

**Spec:** `docs/superpowers/specs/2026-10-19-podcast-serileri-design.md`

## Global Constraints

- Bağımlılık eklenmez; testler Node'un yerleşik `node:test` + `node:assert/strict` ile, `tests/` klasöründe.
- Kod yorumları ve kullanıcıya görünen metinler Türkçe; mevcut dosyaların üslubu ve yorum yoğunluğu korunur.
- Durum değerleri ve etiketleri: `devam` → "Devam ediyor", `tamam` → "Tamamlandı", `yakinda` → "Yakında". Vitrin kartında yalnızca "Yakında" ve "Tamamlandı" etiketi gösterilir.
- Vitrin varsayılanları: `name` "Podcast", `eyebrow` "Podcast · Sesin hikâyeleri", `description` "Her seri ayrı bir merak: müzik, sofralar ve gündem. Bir seri seçin; ister baştan dinleyin, ister en yeni bölümden başlayın."
- Örnek seri kimlikleri: `seri-frekans`, `seri-sofra`, `seri-satir-arasi`; örnek Sofra bölümleri `pod-sofra-1..3`.
- Yayına yalnızca `published !== false` ve örnek olmayan seriler ile bu serilere bağlı, yayında ve örnek olmayan bölümler gider.
- Platform düğmeleri yalnızca `Store.isProfile` geçen adreslerle gösterilir.
- Videolar ve Yazılar alt kategorilerine dokunulmaz.
- Her görevin sonunda: `node --test tests/` yeşil, `node --check` bütün `js/*.js` ve `build.js` için temiz.

## Review Focus

1. **Kendi bölümleri olan eski kayıt** (sürüm 3, düzenlenmiş bölümler, kapaklar, `data:` görseller) geçişte hiçbir alanını kaybetmemeli; yalnızca `cat` silinir, `series` eklenir. → Task 1 `gecis-alanlari-korur`.
2. **Kendi bölümünüz örnek ya da yayında olmayan bir seride** → yayına gitmemeli, panel uyarmalı. → Task 1 `forPublish-ornek-seri-bolumu`, Task 4 kontrol listesi doğrulaması.
3. **Seri bağlantısı ile eski bölüm bağlantısı aynı** (`podcast/x` hem seri hem eski bölüm adresi) → seri kazanmalı, yönlendirme olmamalı. → Task 2 `seri-bolum-adresi-cakismasi`.
4. **Asgari seri** (yalnızca ad: kapaksız, kısa tanımsız, bölümsüz, fragmansız) → kart ve sayfa bozuk HTML üretmemeli, `undefined` yazmamalı. → Task 2 `asgari-seri`.
5. **Bağı kopuk bölüm** (silinmiş ya da içe aktarılan yedekte olmayan seri kimliği; hiç seri yokken bölüm) → ilk seriye bağlanmalı; seri yoksa "Podcast" adlı kendi serisi oluşmalı. → Task 1 `kopuk-bolum-onarimi`.

---

## Dosya Yapısı

| Dosya | Sorumluluk |
|---|---|
| `js/store.js` | Seri veri modeli, geçiş, örnek ekleme, `seriesOf`, `forPublish`, `SERIES_STATUS` |
| `js/ornek-icerik.js` | Üç örnek seri, Sofra bölümleri, mevcut bölümlere `series` |
| `js/render.js` | Vitrin, seri sayfası, bölüm sayfası, adresler, yönlendirmeler, arama, şema, oynatıcı için fragman öğesi |
| `js/yayin.js`, `build.js` | `Store.forPublish` kullanımı; `llms.txt` Podcast bölümü |
| `css/style.css` | Vitrin ızgarası, seri kartı, durum etiketi, fragman |
| `js/admin.js`, `css/admin.css` | ◫ Seriler ekranı, seri formu, bölüm formunda seri seçimi, süzgeç, sayfa ayarları, kontrol listesi, örnek silme |
| `tests/yukle.js` | Node'da modülleri yükleyen ortak yardımcı (sahte `localStorage`) |
| `tests/store.test.js`, `tests/render.test.js` | Birim testleri |
| `KULLANIM-KILAVUZU.md`, `README.md` | Belgeler |

---

### Task 1: Veri modeli, geçiş ve yayın süzgeci

**Files:**
- Create: `tests/yukle.js`, `tests/store.test.js`
- Modify: `js/store.js` (DEFAULTS, `CAT_KEYS`, `SAMPLE_IDS`, `migrate`, `addSamples`, dışa aktarılanlar), `js/ornek-icerik.js` (podcasts, yeni `series`, `global.AKCAN_ORNEK`), `js/yayin.js:79-87` (`publicData`), `build.js:68-69` (süzme)

**Interfaces:**
- Produces:
  - `Store.SERIES_STATUS: { devam: 'Devam ediyor', tamam: 'Tamamlandı', yakinda: 'Yakında' }`
  - `Store.seriesOf(data, episode) → series | undefined` (`episode.series` kimliğiyle)
  - `Store.forPublish(data) → object`: derin kopya; `settings.adminHash` ve `videos` silinmiş; `posts/podcasts/remixes/pages/series` yayında ve örnek olmayanlarla süzülmüş; `podcasts` ayrıca kalan serilere bağlı olanlarla.
  - Seri nesnesi alanları: `id, title, slug, tagline, description, cover, coverAlt, tint, frequency, status, trailer, spotify, apple, youtube, seoTitle, seoDesc, ogImage, published, sample?`
  - Bölüm: `series` alanı; podcast bölümlerinde `cat` yok.
  - `DEFAULTS.version = 4`, `SAMPLE_VERSION = 5`, `DEFAULTS.series = O.series || []`, `DEFAULTS.settings.podcast = { name, eyebrow, description, tint: '#1F5A50' }` (Global Constraints'teki metinler; `cats` yok).
  - `CAT_KEYS = { video: 'videosPage', yazi: 'postsPage' }` (podcast çıkar).

- [ ] **Step 1: `tests/yukle.js` yardımcısını yaz**

`globalThis.window = globalThis`; `Map` tabanlı sahte `localStorage` (`getItem/setItem/removeItem/clear`); sırayla `../js/ornek-icerik.js`, `../js/store.js`, `../js/render.js` yüklenir. Dışa aktarır: `{ S, Render, O, mem }` ve `v3()`: sürüm 3 biçiminde veri döndüren fabrika:

```js
// Sürüm 3 kaydı: tek program (settings.podcast), bölümlerde cat, series yok
const v3 = (podcastOver = {}) => ({
  version: 3, sampleVersion: 4,
  settings: { podcast: { name: 'Frekans', eyebrow: 'Podcast · Her Pazartesi', description: O.series[0].description,
    note: 'not', readText: 'Oku + Dinle', cover: 'https://picsum.photos/seed/pod-show/900/900',
    spotify: 'https://open.spotify.com/', apple: '', youtube: '', tint: '#1F5A50',
    cats: [{ id: 'muzik', name: 'Müzik', slug: 'muzik', desc: '', link: '' }], ...podcastOver } },
  posts: JSON.parse(JSON.stringify(O.posts)),
  podcasts: O.podcasts.filter((p) => p.series === 'seri-frekans').map((p) => { const x = { ...p, cat: 'muzik' }; delete x.series; return x; })
});
```

- [ ] **Step 2: Başarısız testleri yaz (`tests/store.test.js`)**

```js
test('gecis-ornek-program', () => {             // değiştirilmemiş program → örnek seri
  const d = S.normalize(v3());
  assert.equal(d.version, 4);
  assert.equal(d.series.length, 1);
  assert.equal(d.series[0].id, 'seri-frekans');
  assert.ok(S.isSample(d.series[0]));
  assert.equal(d.series[0].frequency, 'Her Pazartesi');
  assert.ok(d.podcasts.every((p) => p.series === 'seri-frekans' && !('cat' in p)));
  assert.deepEqual(Object.keys(d.settings.podcast).sort(), ['description', 'eyebrow', 'name', 'tint']);
  assert.equal(d.settings.podcast.name, 'Podcast');
  assert.equal(d.settings.podcast.eyebrow, 'Podcast · Sesin hikâyeleri');
});
test('gecis-kendi-program', () => {              // değiştirilmiş program → kendi serisi
  const d = S.normalize(v3({ name: 'Gece Sohbetleri', cover: 'veri/gorsel/abc.webp', spotify: 'https://open.spotify.com/show/x' }));
  const s = d.series[0];
  assert.match(s.id, /^seri-/); assert.notEqual(s.id, 'seri-frekans');
  assert.equal(S.isSample(s), false);
  assert.equal(s.title, 'Gece Sohbetleri'); assert.equal(s.slug, 'gece-sohbetleri');
  assert.equal(s.cover, 'veri/gorsel/abc.webp'); assert.equal(s.spotify, 'https://open.spotify.com/show/x');
  assert.equal(s.status, 'devam'); assert.equal(s.published, true);
});
test('gecis-alanlari-korur', () => {             // Review Focus 1
  const raw = v3(); raw.podcasts[0].description = '<p><img src="data:image/webp;base64,AAA"></p>'; raw.podcasts[0].updated = '2026-10-01';
  const d = S.normalize(raw);
  const { cat, ...beklenen } = raw.podcasts[0];
  assert.deepEqual({ ...d.podcasts[0], series: undefined }, { ...beklenen, series: undefined });
});
test('gecis-tek-sefer', () => {
  const once = S.normalize(v3());
  assert.deepEqual(S.normalize(JSON.parse(JSON.stringify(once))).series, once.series);
});
test('ornek-surum-5-eklenir', () => {           // panelde kayıtlı eski veri: örnek seriler bir kez eklenir
  mem.clear(); mem.set(S.KEY, JSON.stringify(v3()));
  const d = S.get();
  assert.deepEqual(d.series.map((s) => s.id), ['seri-frekans', 'seri-sofra', 'seri-satir-arasi']);
  assert.equal(d.podcasts.filter((p) => p.series === 'seri-sofra').length, 3);
  assert.equal(JSON.parse(mem.get(S.KEY)).sampleVersion, 5);
});
test('ornek-silmis-olana-eklenmez', () => {
  const raw = v3({ name: 'Kendi' }); raw.posts = []; raw.remixes = []; raw.pages = [];
  raw.podcasts = raw.podcasts.map((p) => ({ ...p, id: 'k-' + p.id }));
  mem.clear(); mem.set(S.KEY, JSON.stringify(raw));
  assert.equal(S.get().series.filter(S.isSample).length, 0);
});
test('kopuk-bolum-onarimi', () => {             // Review Focus 5
  const d = S.normalize({ version: 4, series: [{ id: 's1', title: 'A', slug: 'a' }], podcasts: [{ id: 'p', title: 'B', slug: 'b', series: 'yok' }] });
  assert.equal(d.podcasts[0].series, 's1');
  const e = S.normalize({ version: 4, series: [], podcasts: [{ id: 'p', title: 'B', slug: 'b' }] });
  assert.equal(e.series.length, 1); assert.equal(e.series[0].title, 'Podcast'); assert.equal(S.isSample(e.series[0]), false);
  assert.equal(e.podcasts[0].series, e.series[0].id);
});
test('ilk-kurulum', () => {
  const d = S.normalize({});
  assert.deepEqual(d.series.map((s) => s.id), ['seri-frekans', 'seri-sofra', 'seri-satir-arasi']);
  assert.ok(d.podcasts.every((p) => S.seriesOf(d, p)));
  assert.equal(d.series[2].status, 'yakinda');
});
test('forPublish-ornek-seri-bolumu', () => {     // Review Focus 2
  const d = S.normalize({});
  d.series.push({ id: 'k1', title: 'Kendi', slug: 'kendi', published: true }, { id: 'k2', title: 'Taslak', slug: 'taslak', published: false });
  d.podcasts.push({ id: 'e1', title: 'E1', slug: 'e1', series: 'k1' }, { id: 'e2', title: 'E2', slug: 'e2', series: 'seri-frekans' }, { id: 'e3', title: 'E3', slug: 'e3', series: 'k2' });
  const p = S.forPublish(d);
  assert.deepEqual(p.series.map((s) => s.id), ['k1']);
  assert.deepEqual(p.podcasts.map((x) => x.id), ['e1']);
  assert.equal('adminHash' in p.settings, false);
  assert.equal(d.series.length, 5); // kaynak değişmez
});
```

- [ ] **Step 3: Testleri çalıştır, başarısız olduklarını gör**

Run: `node --test tests/`
Expected: FAIL (`O.series` tanımsız / `seriesOf is not a function`)

- [ ] **Step 4: `js/ornek-icerik.js`'e örnek serileri ekle**

`series` dizisi (sıra: Frekans, Sofra, Satır Arası). Frekans: `title 'Frekans'`, `description` bugünkü `settings.podcast.description` metniyle **birebir aynı** (geçiş tespiti buna dayanır), `cover PIC('pod-show', 900, 900)`, `tint '#1F5A50'`, `frequency 'Her Pazartesi'`, `status 'devam'`, `tagline` tek satır, `spotify 'https://open.spotify.com/'`, `apple 'https://podcasts.apple.com/'`. Sofra: gıda temalı, `frequency 'İki haftada bir'`, `status 'devam'`, kendi kapağı ve rengi. Satır Arası: gündem temalı, `status 'yakinda'`, `trailer MP3(8)`, bölümsüz. Mevcut `pod-1..pod-6`'da `cat` yerine `series: 'seri-frekans'`. `pod-sofra-1..3`: `series: 'seri-sofra'`, numara 1–3, `audio MP3(9..11)`, kısa metin, kare kapak. `global.AKCAN_ORNEK`'e `series` eklenir.

- [ ] **Step 5: `js/store.js`'i uygula**

Interfaces'teki DEFAULTS/CAT_KEYS değişiklikleri; `SAMPLE_IDS` `series`'i de kapsar; `addSamples` varsayılan `cols` listesine `'series'` (önce seriler). `migrate` sırası:
1. `!(data.version >= 4)`: seri listesi sıfırdan kurulur (sürüm 3 kaydında seri yoktur; `merge` varsayılanlardan örnek serileri getirmiş olabilir, bunlar atılır), sonra program → seri (örnek mi: `O.series` Frekans'ıyla `name === title && description === description` → örnek kopyası `seri-frekans`; değilse kendi serisi, alanlar spec "Geçiş" 1'deki gibi, `frequency` = üst etiketten `/^Podcast\s*·\s*/i` atılmış hâli). Bölümlere `series`, `cat` silinir. `settings.podcast` = `{ name, eyebrow, description }` varsayılanları + eski `tint`. `version = 4`.
2. Kopuk bölüm onarımı (her çalışmada): seri yokken bölüm varsa `{ id: 'seri-' + uid(), title: 'Podcast', slug: 'podcast-serisi', status: 'devam', published: true }` eklenir; serisi bulunamayan bölüm ilk seriye bağlanır.
3. Örnek sürümü: `sv < 5` ve herhangi bir koleksiyonda örnek varsa `addSamples(data, ['series', 'podcasts'], new Set(['seri-sofra', 'seri-satir-arasi', 'pod-sofra-1', 'pod-sofra-2', 'pod-sofra-3']))`.

`seriesOf`, `forPublish`, `SERIES_STATUS` dışa aktarılır.

- [ ] **Step 6: Testleri çalıştır**

Run: `node --test tests/`
Expected: PASS (9 test)

- [ ] **Step 7: `yayin.js` ve `build.js`'i `Store.forPublish`'e bağla**

`publicData(D)` → `S.forPublish(D)`. `build.js` satır 67-69'daki elle süzme ve `delete D.settings.adminHash` yerine `const D = S.forPublish(S.normalize(...))`.

- [ ] **Step 8: Derlemeyi doğrula**

Run: `node build.js --veri <yayındaki site.json'un klasörü> --cikti <geçici> --site-url https://akcanx.github.io/` (yayındaki veri: `git show origin/icerik:veri/site.json`)
Expected: `✓ … sayfa` hatasız (şablonlar henüz eski; adres değişiklikleri Task 2'de).

- [ ] **Step 9: Commit**

```bash
git add tests js/store.js js/ornek-icerik.js js/yayin.js build.js
git commit -m "Podcast serileri: veri modeli, geçiş ve yayın süzgeci"
```

---

### Task 2: Site sayfaları (vitrin, seri, bölüm) ve adresler

**Files:**
- Create: `tests/render.test.js`
- Modify: `js/render.js` (`items`, `findItem`, `searchIndex`, `normalize`, `page`, `routes`, `catPages`, `tabName`, podcast bölümü 727-811, `showHero`), `build.js` (`llms.txt` Podcast bölümü)

**Interfaces:**
- Consumes: `Store.seriesOf`, `Store.SERIES_STATUS`, seri ve bölüm alanları (Task 1).
- Produces (Render.create dönüşü):
  - `seriesList() → series[]` (yayında olanlar, dizideki sırayla; yerel kipte örnekler dahil)
  - `findItem('seri', id) → { type: 'seri', id, title: '<Seri> · Fragman', href, thumb, audio, sub: 'Fragman', label: 'Fragman' }` (fragman ses dosyası değilse `audio` boş)
  - Sınıf adları (Task 3 stilleri): vitrin ızgarası `.sgrid`, kart `a.scard`, kapak `.scover`, durum etiketi `.sbadge`, ad `.st`, kısa tanım `.sl`, bilgi `.sm`; vitrin bilgi satırı `.pmeta`; fragman düğmesi `button.trailer[data-play="seri:<id>"]`, gömülü fragman `.embedbox.trailerbox`.
  - `showHero(c, name, eyebrow, links, latest, readText, extra = '')` (`extra` platform satırından sonra basılır).

- [ ] **Step 1: Başarısız testleri yaz (`tests/render.test.js`)**

Yerel kip: `R = Render.create(S.normalize({}), { mode: 'local' })`. Site kipi: `Render.create(S.forPublish(d), { mode: 'site', siteUrl: 'https://ornek.test/' })`.

```js
test('vitrin', () => {
  const pg = R.page('podcast');
  assert.equal((pg.html.match(/class="scard/g) || []).length, 3);
  assert.ok(pg.html.indexOf('Frekans') < pg.html.indexOf('Sofra'));
  assert.match(pg.html, /class="sbadge">Yakında</);
  assert.match(pg.html, /3 seri · 9 bölüm/);
  assert.equal((pg.html.match(/class="ep reveal"/g) || []).length, 6);   // son bölümler
});
test('seri-sayfasi', () => {
  const pg = R.page('podcast/frekans');
  assert.match(pg.html, /<h1[^>]*>Frekans<\/h1>/);
  assert.equal((pg.html.match(/class="ep reveal"/g) || []).length, 6);
  assert.ok(pg.schema.some((n) => n['@type'] === 'PodcastSeries'));
});
test('fragman', () => {
  const pg = R.page('podcast/satir-arasi');
  assert.match(pg.html, /data-play="seri:seri-satir-arasi"/);
  assert.equal(pg.noindex, true);
  assert.equal(R.findItem('seri', 'seri-satir-arasi').audio.endsWith('.mp3'), true);
});
test('bolum-sayfasi', () => {
  const ep = S.normalize({}).podcasts.find((p) => p.id === 'pod-6');
  const pg = R.page('podcast/frekans/' + ep.slug);
  const node = pg.schema.find((n) => n['@type'] === 'PodcastEpisode');
  assert.match(node.partOfSeries['@id'], /podcast\/frekans\/#seri$/);
  assert.deepEqual(pg.crumbs.map((c) => c.route), ['podcast', 'podcast/frekans', 'podcast/frekans/' + ep.slug]);
});
test('eski-adresler', () => {
  const ep = S.normalize({}).podcasts.find((p) => p.id === 'pod-6');
  assert.deepEqual(R.page('podcast/' + ep.slug), { redirect: 'podcast/frekans/' + ep.slug });
  assert.deepEqual(R.page('bolum/pod-6'), { redirect: 'podcast/frekans/' + ep.slug });
  assert.deepEqual(R.page('podcast/muzik'), { redirect: 'podcast' });
  assert.deepEqual(R.page('podcast/sofra/' + ep.slug), { redirect: 'podcast/frekans/' + ep.slug });
  assert.deepEqual(R.page('podcast/yok-boyle'), { redirect: 'podcast' });   // eski alt kategori ve bilinmeyen tek parça → vitrin
  assert.equal(R.page('podcast/frekans/yok-boyle').status, 404);
  assert.equal(R.page('podcast/frekans/a/b').status, 404);
});
test('seri-bolum-adresi-cakismasi', () => {      // Review Focus 3
  const d = S.normalize({}); d.series[1].slug = d.podcasts[0].slug;
  const r = Render.create(d, { mode: 'local' });
  assert.equal(r.page('podcast/' + d.podcasts[0].slug).redirect, undefined);
});
test('asgari-seri', () => {                     // Review Focus 4
  const d = S.normalize({}); d.series = [{ id: 'm', title: 'Asgari', slug: 'asgari', published: true }]; d.podcasts = [];
  const r = Render.create(d, { mode: 'local' });
  for (const route of ['podcast', 'podcast/asgari']) assert.doesNotMatch(r.page(route).html, /undefined|null|NaN/);
});
test('yayin-rotalari', () => {
  const d = S.normalize({}); d.series.push({ id: 'k', title: 'Kendi', slug: 'kendi', published: true });
  d.podcasts.push({ id: 'e', title: 'E', slug: 'e', series: 'k', date: '2026-10-01' });
  const r = Render.create(S.forPublish(d), { mode: 'site', siteUrl: 'https://ornek.test/' });
  const routes = r.routes();
  assert.ok(routes.includes('podcast') && routes.includes('podcast/kendi') && routes.includes('podcast/kendi/e'));
  assert.ok(!routes.some((x) => x.startsWith('podcast/frekans')));
});
test('bos-vitrin', () => {
  const r = Render.create(S.forPublish(S.normalize({})), { mode: 'site', siteUrl: 'https://ornek.test/' });
  const pg = r.page('podcast');
  assert.match(pg.html, /Henüz yayınlanmış seri yok\./); assert.equal(pg.noindex, true);
});
test('akis-ve-arama', () => {
  const it = R.items().find((i) => i.id === 'pod-6');
  assert.equal(it.cat, 'Frekans'); assert.match(it.href, /^#\/podcast\/frekans\//);
  assert.ok(R.searchIndex().some((i) => i.label === 'Podcast serisi' && i.title === 'Sofra'));
});
```

- [ ] **Step 2: Çalıştır, başarısız olduğunu gör**

Run: `node --test tests/render.test.js`
Expected: FAIL (`scard` yok, eski adresler)

- [ ] **Step 3: `js/render.js`'i uygula**

- Yardımcılar: `seriesRoute(s) = 'podcast/' + s.slug`, `epRoute(x) = seriesRoute(seriesOf(x)) + '/' + x.slug`; bütün `'podcast/' + x.slug` kullanımları `epRoute`'a geçer (items, ana sayfa manşeti `homePage` satır ~341, epRow, episodePage, prevNext, routes, normalize).
- `page()`: `podcast` için 3 parçaya izin (4 ve üstü 404); `podcast/<seri>/<bolum>` bölüm (bölüm yoksa 404), `podcast/<seri>` seri, `podcast` vitrin.
- `normalize()`: `podcast/<x>`: `x` bir seri bağlantısıysa olduğu gibi kalır; bölüm bağlantısıysa `epRoute`; ikisi de değilse (eski alt kategori, eski bağlantı) → `podcast`. `podcast/<a>/<b>`: `b` başka serinin bölümüyse doğru adrese. `bolum/<id|slug>` → `epRoute`.
- Vitrin (`podcastIndex`): `listPosts`'taki `phead phead-plain` başlığı + `.pmeta` ("N seri · M bölüm"); `.sgrid` kartları (kapak yoksa `.scover` boş kutu); kart bilgisi: bölüm sayısı ("12 bölüm") ve `frequency` ` · ` ile; bölümsüzse `frequency` ya da durum etiketi; "Son bölümler" başlıklı `.ix` bölümünde en yeni 6 bölüm (`epRow`, meta'da seri adı). Şema: `listNode('CollectionPage', 'podcast', …, seriesList().map((s) => ({ href: href(seriesRoute(s)), title: s.title })))`. `noindex` seri yoksa. Seri yoksa `<div class="empty-note">Henüz yayınlanmış seri yok.</div>`.
- Seri sayfası (`seriesPage(s)`): `showHero(s, s.title, eyebrow, links, latestHref, 'Son bölümü dinle', trailerButton)`; eyebrow = `['Podcast', s.frequency, SERIES_STATUS[s.status]]` boş olmayanlar ` · ` ile; fragman: `S.embed(s.trailer)` varsa hero altında `.embedbox.trailerbox`, yoksa geçerli adresse `button.trailer` ("▶ Fragmanı dinle"); ardından serinin bölümleri (mevcut "Bölümler" listesi, `catBar` yok). Başlık/açıklama/görsel: `seoTitle`/`seoDesc || tagline || description`/`ogImage || cover`. `noindex` bölüm yoksa. Şema: `seriesNode(s)` (`@id` = `pageUrl(seriesRoute(s)) + '#seri'`, `sameAs` platformlar).
- Bölüm sayfası: konum satırı `[Podcast → podcast, Seri → seriesRoute, etiketler…]`, eyebrow seri adı + "Bölüm N", `crumbs` üç kademe, `partOfSeries` serinin `@id`'si, önceki/sonraki aynı seri içinde.
- `items()`: podcast öğesinde `cat` = seri adı; `findItem('seri', id)` fragman öğesi (Interfaces); `searchIndex` serileri ekler (`type: 'series', label: 'Podcast serisi'`, metin = kısa tanım + tanıtım); `catPages`/`tabName`'den podcast çıkar.
- `routes()`: `podcast` (seri varsa ya da menüde), her yayındaki seri, her bölüm (`epRoute`).
- `seriesList`, `findItem` dışa aktarılır.

- [ ] **Step 4: Testleri çalıştır**

Run: `node --test tests/`
Expected: PASS (19 test)

- [ ] **Step 5: `build.js` `llms.txt` Podcast bölümü**

Podcast bölümü başlığı `st.podcast.name || 'Podcast'`; önce `R.seriesList()` (`title`, `url = R.abs(R.href('podcast/' + s.slug))`, `desc = s.tagline || clip(s.description)`), sonra bölümler (mevcut `entry`).

- [ ] **Step 6: Derleme + denetim**

Run: deneme verisiyle (`S.normalize({})` içindeki bütün örnek kimlikleri `t-` önekiyle kendi içeriğe çevrilmiş `site.json`) `node build.js …` ve denetim betiği (kırık iç bağlantı, başlık, açıklama, kanonik, JSON-LD, site haritası; bkz. önceki oturumdaki `denetle.js`).
Expected: `sorun yok`; `podcast/<seri>/index.html` ve `podcast/<seri>/<bolum>/index.html` dosyaları var.

- [ ] **Step 7: Commit**

```bash
git add tests/render.test.js js/render.js build.js
git commit -m "Podcast serileri: vitrin, seri ve bölüm sayfaları, yeni adresler"
```

---

### Task 3: Vitrin ve seri sayfası stilleri, fragman oynatma

**Files:**
- Modify: `css/style.css` (podcast bölümünün yanında yeni blok), gerekirse `js/app.js` (oynatıcı yalnızca `findItem` ile çalıştığı için değişiklik beklenmez)

**Interfaces:**
- Consumes: Task 2'deki sınıf adları ve `data-play="seri:<id>"`.

- [ ] **Step 1: Referans ölçülerini al**

Playwright ile `https://barisozcan.com/sesli-kitaplar` (1440 px): ızgara sütun sayısı ve aralığı, kapak köşe yuvarlaklığı ve gölgesi, ad / alt satır / vurgulu satırın yazı tipi, boyutu ve rengi, üst bölüm ile ızgara arası boşluk. Değerleri adım notuna yaz.

- [ ] **Step 2: Stilleri yaz**

`.sgrid`: masaüstü 3, ≤960 px 2, ≤600 px 1 sütun; referans aralıkları. `.scard` hover'da kapak hafif yükselir, ad vurgu rengine döner. `.scover` kare (`aspect-ratio: 1`), `object-fit: cover`, kapaksızken `var(--bg-3)` zemin. `.sbadge` kapağın sol üst köşesinde mono, büyük harf. `.st` serif, `.sl` mono soluk, `.sm` mono `var(--acid)`. `.pmeta` mono küçük. `button.trailer` mevcut `.readlink` görünümünde. `.trailerbox` hero altında, okuma genişliğinde.

- [ ] **Step 3: Tarayıcıda doğrula**

Run (Playwright, `index.html#/podcast`, `#/podcast/frekans`, `#/podcast/satir-arasi`, bir bölüm sayfası; 1440 / 768 / 390 px):
Expected: sütun sayısı 3 / 2 / 1 (`.scard` `offsetTop` gruplarından); `document.documentElement.scrollWidth <= innerWidth`; konsolda hata yok; Satır Arası'nda "▶ Fragmanı dinle" tıklanınca `#player` görünür ve `audio.src` MP3'ü gösterir; vitrindeki son bölümlerden biri çalınabilir. Ekran görüntülerini referansla yan yana karşılaştır.

- [ ] **Step 4: Commit**

```bash
git add css/style.css js/app.js
git commit -m "Podcast serileri: vitrin ve seri sayfası stilleri"
```

---

### Task 4: Panel — ◫ Seriler, seri formu, bölümlerde seri

**Files:**
- Modify: `js/admin.js` (TYPES, CAT_TABS, SECTIONS.podcasts, `newItem`, `field`, `listView`, `formView`, `route`, `resolveHeroPreview`, `publishChecks`, örnek silme), `css/admin.css`

**Interfaces:**
- Consumes: `Store.seriesOf`, `Store.SERIES_STATUS`, `Store.isSample`.
- Produces:
  - `TYPES.series` (`coll: 'series'`, `one: 'Seri'`, `title: 'Podcast Serileri'`, `sq: true`, `view: (x) => '#/podcast/' + x.slug`). Alanlar: ana sütun `title` (req), `tagline` ("Kısa tanım"), `description` (textarea, "Tanıtım metni"), `trailer` (url, "Fragman"); yan sütun "Yayın": `published`, `status` (select, SERIES_STATUS), `frequency`, `slug` (yardım: `/podcast/<b>baglanti</b>/`); "Kapak": `cover` (sq), `coverAlt`; "Görünüm": `tint`; "Dinleme platformları": `spotify`, `apple`, `youtube`; `...SEO_FIELDS`.
  - Adresler: `#series` (liste), `#series/new`, `#series/edit/<id>`, `#podcasts/seri/<id>` (süzülmüş bölüm listesi), `#podcasts/new/<seriId>`.
  - Alan türü `t: 'series'` (seri seçimi; seçenek metni seri adı, örnekse " (Örnek)"; altında "Serileri düzenle →" `#series`).
  - `deleteSeries(series) → Promise<boolean>`.

- [ ] **Step 1: TYPES ve alanları uygula**

`TYPES.series` (Interfaces). `TYPES.podcasts`: `cat` alanı yerine `{ k: 'series', t: 'series', l: 'Seri', side: 'Seri' }`; `view` = `'#/podcast/' + (seriesOf slug) + '/' + x.slug`; bölüm `slug` yardım metni `/podcast/seri/<b>baglanti</b>/`. `CAT_TABS`'tan `podcasts` çıkar. `SECTIONS.podcasts`: `title 'Podcast Sayfası'`, `btn 'Sayfa Ayarları'`, alanlar `name` ("Sayfa başlığı"), `eyebrow`, `description` ("Tanıtım metni"), `tint`; açıklama serilerin kapak ve platformlarının ◫ Seriler'de olduğunu söyler. `newItem`: `series` için `{ published: true, status: 'devam' }`; `podcasts` için `series` = ön seçim ya da ilk seri.

- [ ] **Step 2: Liste, süzgeç, form ve yönlendirme**

- `route()`: `#series` → `seriesView()`; `series/new|edit` → `formView`; `#podcasts/seri/<id>` → süzülmüş `listView`; `#series*` iken kenar çubuğunda "Podcast" seçili; `#podcasts/cats` → bölüm listesi.
- `listView('podcasts')`: üstte "◫ Seriler" (`#series`) + "⚙ Sayfa Ayarları" + "+ Yeni Bölüm" (süzülmüşse o seride); alt kategori seçimi yerine seri seçimi ("Tüm seriler", her seri sayısıyla); satır alt bilgisinde seri adı (`b.ccat`).
- `seriesView()`: başlık "Podcast Serileri", açıklama (vitrindeki sıra bu listedeki sıradır), "← Bölümler" ve "+ Yeni Seri"; satırlar: kare küçük resim, ad + "Örnek" etiketi, durum ve sıklık, "N bölüm", Yayında/Taslak düğmesi, ↑ ↓, Düzenle, ↗ (`index.html#/podcast/<slug>`), Sil. ↑ ↓ `D.series` içinde yer değiştirip kaydeder.
- `formView`: `series` için başlık zorunlu, `slug` `uniqueSlug('series', …)`; `podcasts` için seri seçilmemişse "Bölüm için bir seri seçin" uyarısı. Sil düğmesi `series` için `deleteSeries`.
- `deleteSeries(s)`: bölümü yoksa `confirm`; bölümü var ve başka seri yoksa "Bölümü olan tek seri silinemez. Yayında anahtarını kapatabilirsiniz." uyarısı, `false`; bölümü varsa mevcut `dialog()` ile `select` alanı ("N bölüm hangi seriye taşınsın?"), onayda bölümleri taşır, seriyi siler, kaydeder.
- `resolveHeroPreview` (satır ~820): podcast bağlantısı iç içe adres.

- [ ] **Step 3: Kontrol listesi ve örnek silme**

`publishChecks`: "Podcast ve remix platformları" yayındaki kendi serilerinin `spotify/apple/youtube` adreslerini de kapsar (etiket "Seri adı → Spotify"); yeni madde "Podcast serileri": kendi yayındaki bölümlerinden örnek ya da yayında olmayan seride olanlar varsa `warn` ("N bölüm yayında olmayan ya da örnek bir seriye bağlı; yayına gitmez."), yayında kendi serisi yoksa `info` ("Yayında seri yok: Podcast sayfası boş görünür."), bağlantı `#series`. "Örnek içerikleri sil": örnek serileri de siler; kendi bölümü bağlı olan örnek seri kalır ve bildirim gösterilir.

- [ ] **Step 4: Stiller (`css/admin.css`)**

Seri satırları mevcut tablo/kart düzeniyle; ↑ ↓ düğmeleri `btn-sm`; telefonda taşmasız.

- [ ] **Step 5: Tarayıcıda doğrula (Playwright, `admin.html`, 1440 ve 390 px)**

Expected:
- Eski (sürüm 3) kayıtla açılış → `#series` 3 seri (Frekans, Sofra, Satır Arası; ilk ikisi "Örnek").
- "+ Yeni Seri" → ad "Gece Sohbetleri", durum Yakında, kaydet → listede, `index.html#/podcast` vitrininde 4. kart.
- ↑ ile en üste al → vitrinde ilk kart.
- Bölüm formunda seri seçimi zorunlu; seri değiştirilen bölüm yeni adresinde açılır.
- Bölümlü seriyi sil → taşıma penceresi → bölümler hedef seride; tek seri kalmışken bölümlü seriyi silme engellenir.
- `#podcasts/seri/seri-sofra` yalnızca 3 Sofra bölümünü gösterir.
- Yayın & SEO kontrol listesinde "Podcast serileri" maddesi.
- Bütün panel ekranları (önceki 33 + `#series`, `#series/new`, `#series/edit/<id>`) iki genişlikte hatasız ve taşmasız.

- [ ] **Step 6: Commit**

```bash
git add js/admin.js css/admin.css
git commit -m "Podcast serileri: panelde Seriler ekranı ve seri formu"
```

---

### Task 5: Belgeler, uçtan uca doğrulama ve yayın

**Files:**
- Modify: `KULLANIM-KILAVUZU.md` (Podcast bölümü, Alt kategoriler bölümünden podcast, Başlarken, Sitede/adresler, Yayın öncesi kontrol listesi, Örnek içerikler sayıları), `README.md` (Podcast, panel, örnek içerik sayıları), örnek rehber yazısındaki (`yazi-rehber`) podcast cümlesi

- [ ] **Step 1: Belgeleri güncelle**

Kılavuzda Podcast bölümü: Seriler ekranı, seri formu alanları tablosu, durumlar, fragman, Sayfa Ayarları, bölüm formunda seri, adresler (`/podcast/`, `/podcast/seri/`, `/podcast/seri/bolum/`), örnek serilerin yayına gitmemesi ve kendi serinin **+ Yeni Seri** ile eklenmesi. Alt kategoriler bölümünden Podcast çıkarılır. Örnek içerik sayıları (3 seri, 9 bölüm). İç bağlantı denetimi (önceki oturumdaki betik) `kırık bağlantılar: yok`.

- [ ] **Step 2: Uçtan uca doğrulama**

Run:
- `node --test tests/` → PASS
- `node --check` bütün betikler → temiz
- Yayındaki `site.json` ile derleme → Frekans örnek olduğundan `podcast/index.html` "Henüz yayınlanmış seri yok." ve `noindex`; denetim `sorun yok`
- Deneme verisiyle derleme + denetim → `sorun yok`
- Playwright: önizlemedeki bütün rotalar ve panel ekranları 1440 / 390 px'te hatasız, taşmasız (önceki tarama betikleri)

- [ ] **Step 3: Commit ve yayın**

```bash
git add KULLANIM-KILAVUZU.md README.md js/ornek-icerik.js
git commit -m "Podcast serileri: kılavuz ve README"
git push origin main
```

Expected: GitHub Actions "Siteyi yayınla" `success`; `https://akcanx.github.io/podcast/` 200 döner.
