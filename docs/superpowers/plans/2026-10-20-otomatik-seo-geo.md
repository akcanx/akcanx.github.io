# Kaydedince Otomatik SEO & GEO — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Panelde Kaydet'e basınca içerik arama motorları ve yapay zekâ için kendiliğinden hazırlanır: otomatik başlık/açıklama tek kaynaktan ve cümle sonunda, ara başlıklara çapa, panelde canlı puan ve öneri, yayından sonra IndexNow bildirimi.

**Architecture:** `render.js` başlık/açıklama/adres/görseli `seoOf` ile tek yerden üretir; sayfalar ve panel önizlemesi bunu kullanır. Yeni `js/seo.js` saf puan fonksiyonudur (panel + Node testleri). Yeni `indexnow.js` (kökte, `build.js` gibi) site haritası farkını ve gönderimi yapar; iş akışına ayrı bir bildirim işi eklenir.

**Tech Stack:** Düz JavaScript (tarayıcı + Node 22), `node:test`, Playwright (panel), GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-20-otomatik-seo-geo-design.md`

## Global Constraints

- Yeni bağımlılık yok; Node 22 yerleşik `fetch` ve `crypto` kullanılır.
- Kullanıcının yazdığı alanlar (`seoTitle`, `seoDesc`, `excerpt`, `tagline`, `coverAlt`) hiçbir kayıtta değiştirilmez; otomatik değerler kayda yazılmaz.
- Mevcut dışa aktarımlar korunur (`Render.clip`, `R.page`, `R.routes` …); `js/seo.js` ve panel dosyaları yayına gitmez (`build.js` `ASSETS` listesine eklenmez).
- Arayüz metinleri Türkçe, spec'teki kelimelerle: rozet "SEO & GEO", bildirim `Değişiklikler kaydedildi · SEO & GEO 86/100`.
- Puan eşikleri: ≥ 80 `iyi`, 50–79 `orta`, < 50 `zayif`.
- IndexNow hatası yayını bozmaz.
- Testler: `node --test tests/` yeşil kalır (şu an 44).

## Review Focus

1. Ara başlıkta etiket ve HTML varlığı (`<h2><b>Ses</b> &amp; Hafıza</h2>`) → çapa `ses-hafiza` olmalı, `ses-amp-hafiza` değil (Task 1 testi).
2. Boş ya da yarım içerik (yeni form, başlıksız; serisi olmayan bölüm) → `seoOf` ve `score` çökmez, metinlerde `undefined`/`NaN` olmaz (Task 1 ve Task 2 testleri, Task 3 Playwright).
3. Ondalık sayı ve kısaltma içeren açıklama (`3.5 saat`) → `snippet` sayının içinden kesmez (Task 1 testi).
4. İlk yayın ya da eski site haritası okunamadı (boş, HTML 404 sayfası) → bütün adresler bildirilir, çökme yok (Task 4 testi).
5. Kendi alan adı (`seo.siteUrl`) Pages adresinden farklı → anahtar dosyası, `host` ve `keyLocation` aynı ana makinede (Task 4 testi).

---

### Task 1: Tek kaynaktan başlık/açıklama (`seoOf`, `snippet`) ve ara başlık çapaları

**Files:**
- Modify: `js/render.js` (`clip` yanına `snippet`; `create()` içinde `seoOf`; `postPage`, `seriesPage`, `episodePage`, `bookPage`, `remixPage`, `customPage` başlık/açıklama/görseli `seoOf`'tan; `page()` sonlandırması; `fixHtml` çapaları; dışa aktarımlar)
- Modify: `css/style.css` (çapa kaydırma payı)
- Test: `tests/render.test.js`

**Interfaces:**
- Produces: `Render.snippet(s: string) → string` (modül düzeyi, `global.Render`'a eklenir).
- Produces: `R.seoOf(col, item) → { title, desc, url, image }`; `col ∈ 'posts' | 'podcasts' | 'series' | 'books' | 'remixes' | 'pages'`. `title` ve `desc` `page()`'in son değerleriyle aynı (son ek kuralı ve `snippet` uygulanmış); `url` = `pageUrl(route)`; `image` sayfanın paylaşım görseli.

- [ ] **Step 1: Failing tests** — `tests/render.test.js`'e:

```js
test('snippet-cumle-sonu', () => {
  const s = 'Birinci cümle burada biter ve biraz uzun sürer, çünkü açıklamanın ilk yüz yirmi karakteri geçmesi gerekiyor ki deneyelim. İkinci cümle ise sınırın dışına taşan uzun bir devam cümlesidir ve kesilmelidir.';
  assert.equal(Render.snippet(s), s.slice(0, s.indexOf('. ') + 1));
  assert.equal(Render.snippet('Kısa metin.'), 'Kısa metin.');
});
test('snippet-cumle-yoksa-kelime', () => {
  const s = ('kelime ').repeat(40).trim();           // cümle sonu yok
  assert.equal(Render.snippet(s), Render.clip(s));
  const d = 'Süre 3.5 saat ' + ('uzun açıklama ').repeat(15); // "3.5" cümle sonu sayılmaz
  assert.ok(!Render.snippet(d).endsWith('3.'));
});
test('seoOf-sayfayla-ayni', () => { // her tür için panel önizlemesi = yayındaki <title> ve açıklama
  // D: v3() + bir kendi yazı, video, seri, bölüm, kitap, remix, özel sayfa (published: true)
  // R = Render.create(D, { mode: 'site', siteUrl: 'https://ornek.test/' })
  // her [col, item, route] için: const a = R.seoOf(col, item), p = R.page(route);
  //   assert.equal(a.title, p.title); assert.equal(a.desc, p.desc); assert.equal(a.url, 'https://ornek.test/' + route + '/'); assert.equal(a.image, p.image);
});
test('seoOf-yarim-icerik', () => { // başlıksız yeni kayıt, serisi olmayan bölüm: çökmez, undefined yok
  const R = Render.create(S.normalize({}), { mode: 'site', siteUrl: 'https://ornek.test/' });
  for (const col of ['posts', 'podcasts', 'series', 'books', 'remixes', 'pages']) {
    const o = R.seoOf(col, { id: 'x' });
    assert.ok(!/undefined|NaN|null/.test(JSON.stringify(o)), col);
  }
});
test('ara-baslik-capalari', () => {
  // yazı içeriği: '<h2>Ses nedir?</h2><p>a</p><h2>Ses nedir?</h2><h3 id="ozel">X</h3><h2><b>Ses</b> &amp; Hafıza</h2><h2> </h2>'
  // R.page('yazilar/' + slug).html içinde:
  //   id="ses-nedir", id="ses-nedir-2", id="ozel" (korunur, ikinci id yok), id="ses-hafiza", boş <h2> id'siz
});
```

`seoOf-sayfayla-ayni` ve `ara-baslik-capalari` gövdeleri yorumdaki değerlerle yazılır (veri `v3()` üstüne eklenir; bölüm `series: 'seri-frekans'`'e değil, aynı testte eklenen kendi yayındaki serisine bağlanır).

- [ ] **Step 2: Run** `node --test tests/render.test.js` — Expected: FAIL (`Render.snippet is not a function`, `R.seoOf is not a function`, `id="ses-nedir"` yok).

- [ ] **Step 3: Implement**
  - `snippet(s)`: boşlukları sadeleştir; ≤ 160 ise aynen. Değilse ilk 160 karakterde `/[.!?…](?=\s)/` eşleşmelerinin sonuncusu; konumu ≥ 120 ise o noktaya kadar (noktalama dahil). Yoksa `clip(s, 160)`.
  - `seoOf(col, x)`: tür başına bugünkü sayfa kodundaki `route`, `title` kalıbı, `desc` kaynağı ve `image` ifadesi (bölümde seri `serOf(x)`, yoksa başlık eki `podName()` ve rota `epRoute(x)`; remixte `rc.cover`; slug yoksa `S.slugify(x.title || '')`). Sonra `finishTitle` (60'ı aşan başlıkta `' — ' + st.siteName` ekini düşür) ve `finishDesc` (`snippet(S.strip(desc) || st.description || '')`). İki yardımcı `page()` sonlandırmasında da kullanılır (bugünkü `clip` satırı ve son ek kuralı bunlarla değişir).
  - Altı sayfa fonksiyonu `title`, `desc`, `image` alanlarını `seoOf`'un ham (sonlandırılmamış) biçimini üreten ortak yardımcıdan alır; şemadaki `description: clip(desc, 300)` kullanımları aynı `desc`'i kullanmaya devam eder.
  - `fixHtml`: `<h2>`/`<h3>` etiketinde `id` yoksa, iç metni (etiketler atılmış, `&amp;` `&lt;` `&gt;` `&quot;` `&#39;` `&nbsp;` çözülmüş) `S.slugify` ile çapa; boşsa ekleme; aynı çağrıda tekrar ederse `-2`, `-3`.
  - `css/style.css`: `.prose :is(h2, h3)[id] { scroll-margin-top: 96px; }`.
  - Dışa aktarım: `create()` dönüşüne `seoOf`; `global.Render`'a `snippet`.

- [ ] **Step 4: Run** `node --test tests/` — Expected: hepsi PASS (44 + 5).

- [ ] **Step 5: Commit**

```bash
git add js/render.js css/style.css tests/render.test.js
git commit -m "Otomatik SEO: tek kaynaktan başlık ve açıklama, cümle sonunda kesim, ara başlık çapaları"
```

### Task 2: Puan (`js/seo.js`)

**Files:**
- Create: `js/seo.js`
- Modify: `tests/yukle.js` (`require('../js/seo.js')`, `SEO`'yu dışa aktar)
- Test: `tests/seo.test.js` (yeni)

**Interfaces:**
- Consumes: `R.seoOf` (Task 1), `Store.strip`, `Store.slugify`, `Store.postKind`.
- Produces: `global.SEO = { score(col, item, opt) → { puan: number, maddeler: Madde[] }, level(puan) → 'iyi'|'orta'|'zayif', oneriler(sonuc) → string[] }`.
  - `opt = { R, imgW? }`; `Madde = { ad, ok: true|false|'yarim', puan, en, oneri }` (`oneri` yalnız `ok !== true` ise dolu).
  - `oneriler`: `ok !== true` maddelerin `oneri`'leri, kaybedilen puana göre büyükten küçüğe.

Maddeler, puanlar ve eşikler spec §3 tablosundaki gibidir; öneri metinleri:

| Madde (`ad`) | Öneri metni |
|---|---|
| Başlık | `Başlık ${n} karakter; Google ~60'tan sonrasını keser. Kısa bir SEO başlığı yazın.` |
| Açıklama (yok ya da yalnız metinden) | `Özet ya da SEO açıklaması yazın (150–160 karakter).` |
| Açıklama (yazılmış, aralık dışı) | `Açıklama ${n} karakter; 150–160 karakter önerilir.` |
| Görsel (yok) | `Kapak ya da paylaşım görseli ekleyin.` |
| Görsel (dar) | `Google Discover büyük görsel için en az 1200 px ister.` |
| Görsel açıklaması | `Kapak açıklaması (alt metin) yok.` |
| İçerik derinliği | `Metin ${n} kelime; en az ${E} kelime önerilir — arama motorları ve yapay zekâ bu metni okur.` |
| Ara başlık | `Uzun metni ara başlıklarla (H2) bölün.` |
| Etiketler | `Etiket ekleyin.` |
| Adres | `Bağlantı (slug) kısa olsun.` |

Kurallar: "yazılmış açıklama" = `seoDesc` ya da özet alanı (`posts`, `podcasts`, `remixes`, `pages`: `excerpt`; `books`, `series`: `tagline`). Ana metin: `posts` ve `pages` → `content`, diğerleri → `description`. Eşik: yazı (`postKind === 'yazi'`) ve `pages` 300, diğerleri 80. Görsel = `seoOf().image`; "Görsel açıklaması" yalnız `item.cover` var ve `coverAlt` boşsa düşer. Etiket alanı olmayanlar (`pages`, `series`) tam puan. Slug yoksa `slugify(title)` ölçülür.

- [ ] **Step 1: Failing tests** — `tests/seo.test.js`:

```js
const { S, Render, SEO } = require('./yukle');
const R = Render.create(S.normalize({}), { mode: 'site', siteUrl: 'https://ornek.test/' });
const uzun = (n) => '<p>' + 'kelime '.repeat(n) + '</p>';
const tam = { id: 'a', kind: 'yazi', title: 'Kısa başlık', slug: 'kisa-baslik', excerpt: 'x'.repeat(150), cover: 'https://ornek.test/k.jpg', coverAlt: 'Kapak', content: '<h2>Ara</h2>' + uzun(700), tags: ['t'] };
test('puan-tam', () => { const r = SEO.score('posts', tam, { R }); assert.equal(r.puan, 100); assert.equal(SEO.level(r.puan), 'iyi'); assert.equal(r.maddeler.reduce((t, m) => t + m.en, 0), 100); });
test('puan-aciklama-metinden-yarim', () => { const r = SEO.score('posts', { ...tam, excerpt: '' }, { R }); const m = r.maddeler.find((x) => x.ad === 'Açıklama'); assert.equal(m.ok, 'yarim'); assert.equal(m.puan, 10); });
test('puan-uzun-baslik', () => { const r = SEO.score('posts', { ...tam, title: 'b'.repeat(70) }, { R }); assert.equal(r.maddeler.find((x) => x.ad === 'Başlık').ok, false); assert.match(SEO.oneriler(r)[0], /Başlık 70 karakter/); });
test('puan-dar-gorsel', () => { const r = SEO.score('posts', tam, { R, imgW: 800 }); assert.equal(r.maddeler.find((x) => x.ad === 'Görsel').puan, 10); });
test('puan-alt-metin-ve-ara-baslik', () => { const r = SEO.score('posts', { ...tam, coverAlt: '', content: uzun(700) }, { R }); assert.equal(r.puan, 80); });
test('puan-esik-turlere-gore', () => { // kitap 80 kelime yeter, yazı 300 ister
  assert.equal(SEO.score('books', { id: 'k', title: 'K', slug: 'k', tagline: 'x'.repeat(100), cover: 'https://ornek.test/k.jpg', coverAlt: 'K', description: uzun(90), tags: ['t'] }, { R }).maddeler.find((x) => x.ad === 'İçerik derinliği').ok, true);
  assert.equal(SEO.score('posts', { ...tam, content: '<h2>a</h2>' + uzun(200) }, { R }).maddeler.find((x) => x.ad === 'İçerik derinliği').ok, 'yarim');
});
test('puan-bos-kayit', () => { for (const col of ['posts', 'podcasts', 'series', 'books', 'remixes', 'pages']) { const r = SEO.score(col, { id: 'x' }, { R }); assert.ok(r.puan >= 0 && r.puan <= 100, col); assert.ok(!/undefined|NaN/.test(JSON.stringify(r)), col); } });
test('puan-seviyeler', () => { assert.equal(SEO.level(80), 'iyi'); assert.equal(SEO.level(79), 'orta'); assert.equal(SEO.level(50), 'orta'); assert.equal(SEO.level(49), 'zayif'); });
```

- [ ] **Step 2: Run** `node --test tests/seo.test.js` — Expected: FAIL (`Cannot find module '../js/seo.js'` ya da `SEO` tanımsız).
- [ ] **Step 3: Implement** `js/seo.js` (IIFE, `global.SEO`, `store.js`/`yayin.js` dosya düzeniyle), `tests/yukle.js` güncellemesi.
- [ ] **Step 4: Run** `node --test tests/` — Expected: hepsi PASS.
- [ ] **Step 5: Commit**

```bash
git add js/seo.js tests/yukle.js tests/seo.test.js
git commit -m "Otomatik SEO: içerik puanı ve öneriler"
```

### Task 3: Panel — canlı önizleme, kaydedince puan, Yayın & SEO satırı

**Files:**
- Modify: `admin.html` (`js/seo.js`, `js/render.js`'ten sonra, `js/admin.js`'ten önce)
- Modify: `js/admin.js` (`sideGroups` kart başı ekleme; `formView` önizleme + kaydetme bildirimi; `publishChecks` yeni satır)
- Modify: `css/admin.css` (`.seobox` stilleri, 390 px'te taşmasız)
- Test: `.playwright-mcp/panel-seo.js` (Playwright betiği, `panel-kitaplar.js` düzeninde)

**Interfaces:**
- Consumes: `SEO.score`, `SEO.level`, `SEO.oneriler` (Task 2); `R.seoOf` (Task 1); `Render.create(D, { mode: 'site', siteUrl })` — `siteUrl` = `siteAddress() || 'https://alanadiniz.com/'`.
- Puanlanan formlar: tür → koleksiyon `posts` (videolar ve yazılar), `podcasts`, `series`, `books`, `remixes`, `pages`. Bunlarda "Arama & paylaşım" kartının başında `<div class="seobox" data-seobox>`.

Yayın & SEO satırı (`publishChecks`, "Özetler" satırından önce): kapsam yayındaki kendi içerikler (`published !== false`, örnek değil) — `posts`, `podcasts`, `series`, `books`, `remixes`, `pages`; `imgW` ölçülmez. Hiç yoksa satır eklenmez. Durum: ortalama ≥ 80 `ok`, değilse `warn`. Başlık `SEO & GEO puanı`. Metin: `Ortalama ${n}/100.` + 80 altı içerikler varsa ` Geliştirilebilecekler: ` ve en düşükten en fazla 5 tanesi `<a href="#<tür>/edit/<id>">Başlık</a> (62)` virgülle; yoksa ` Bütün içerikler 80 ve üstü.` (`<tür>`: yazı/video için `posts`/`videos` panel türü, diğerleri koleksiyon adı).

Kutunun içeriği: puan rozeti `<b class="seoscore iyi|orta|zayif">86</b>` + "SEO & GEO"; Google önizlemesi (`.serp-url`: adres `https://` olmadan, `/` yerine ` › `; `.serp-t`: başlık; `.serp-d`: açıklama, boşsa "Açıklama yok"); madde listesi (`ok === true` → `✓ ad`, değilse `! oneri`). Formdaki her `input` olayında 300 ms gecikmeyle yeniden çizilir. Görsel alanı (`cover`/`ogImage`) değişince `imgDims(seoOf().image)` ile genişlik ölçülür ve `imgW` olarak saklanır.

- [ ] **Step 1: Failing Playwright betiği** `.playwright-mcp/panel-seo.js` — adımlar:
  1. `#posts/new` (yazı): `[data-seobox]` var; başlık yazınca 400 ms sonra `.serp-t` yeni başlığı içerir ve `.seoscore` sayısal.
  2. `excerpt`'e 150 karakter yazınca puan artar; `.serp-d` o metni gösterir.
  3. Kaydet → `.toast` metni `/^Yazı oluşturuldu · SEO & GEO \d+\/100/`; puan < 80 ise ` — ` ve bir öneri içerir.
  4. Var olan bir kitabı düzenle, Kaydet → `/^Değişiklikler kaydedildi · SEO & GEO \d+\/100/`.
  5. `#yayin`: `.checks li` içinde "SEO & GEO puanı" ve `Ortalama \d+/100`; 80 altı içerik varsa `#posts/edit/` bağlantısı.
  6. Kaydedilen kayıtta `seoTitle`, `seoDesc`, `coverAlt` boş kalmış (otomatik değer yazılmamış).
  7. 1440 ve 390 px'te `#posts/new`, `#books/edit/<id>`, `#podcasts/new`, `#series/new`, `#pages/new`, `#remixes/new`, `#yayin`: taşma yok, `#view` HTML'inde `undefined`/`NaN` yok.
- [ ] **Step 2: Run** betiği (`browser_run_code_unsafe`, `filename`) — Expected: 1–5 FAIL (`[data-seobox]` yok, bildirimde puan yok), 6–7 PASS.
- [ ] **Step 3: Implement** `admin.html`, `js/admin.js`, `css/admin.css`.
- [ ] **Step 4: Run** `panel-seo.js` ve `panel-kitaplar.js` — Expected: hepsi `true`, `hatalar: []`. `node --test tests/` PASS.
- [ ] **Step 5: Commit**

```bash
git add admin.html js/admin.js css/admin.css
git commit -m "Otomatik SEO: panelde canlı önizleme ve puan"
```

### Task 4: IndexNow bildirimi, iş akışı ve belgeler

**Files:**
- Create: `indexnow.js` (kök dizin)
- Modify: `build.js` (anahtar dosyası)
- Modify: `.github/workflows/yayin.yml`
- Modify: `KULLANIM-KILAVUZU.md`, `README.md`
- Test: `tests/indexnow.test.js` (yeni), `tests/build.test.js`

**Interfaces:**
- Produces (`module.exports`; komut satırı yalnız `require.main === module` iken):
  - `anahtar(host: string) → string` — `sha256('indexnow:' + host)` onaltılık, ilk 32 karakter.
  - `fark(eskiXml: string, yeniXml: string) → string[]` — spec §5 kuralları; `&amp;` çözülür; en fazla 10.000.
  - `ana(yeniXml) → string` — en kısa `<loc>` (ana sayfa = site adresi).
  - `istek(site: string, urls: string[]) → { url: 'https://api.indexnow.org/indexnow', body: { host, key, keyLocation, urlList } }` — `keyLocation = new URL(key + '.txt', site).href`.
  - CLI `node indexnow.js fark --eski A --yeni B --cikti $GITHUB_OUTPUT` → çıktı dosyasına `bildirim=<JSON {site, adresler}>` ve `sayi=<n>` satırları ekler.
  - CLI `node indexnow.js gonder` → `BILDIRIM` ortam değişkenini okur, `fetch` ile POST eder, durum kodunu yazar; 200/202 değilse çıkış kodu 1.

- [ ] **Step 1: Failing tests**
  - `tests/indexnow.test.js`:
    - `indexnow-anahtar`: 32 karakter `[0-9a-f]`, aynı host → aynı, farklı host → farklı.
    - `indexnow-fark`: eski `{a:2026-10-01, b:2026-10-01, c:—, e:2026-10-01}`, yeni `{a:2026-10-01, b:2026-10-20, c:—, d:2026-10-20}` (— = `lastmod` yok) → `['…/b/', '…/d/', '…/e/']` (değişen, yeni, kaldırılan; sıralı); aynı kalan `a` ve `lastmod`suz `c` girmez.
    - `indexnow-ilk-yayin`: `fark('', yeni)` ve `fark('<html>404</html>', yeni)` → yenideki bütün adresler.
    - `indexnow-degisiklik-yok`: `fark(x, x)` → `[]`.
    - `indexnow-istek-alan-adi`: site `https://akcan.com/`, adresler aynı host → `body.host === 'akcan.com'`, `keyLocation === 'https://akcan.com/' + anahtar('akcan.com') + '.txt'`; `ana()` en kısa `<loc>`'u döndürür.
  - `tests/build.test.js` → `derleme-indexnow-anahtari`: `--site-url https://ornek.test/` ile derle; `_site/<anahtar('ornek.test')>.txt` var ve içeriği anahtar. `seo.siteUrl: 'https://akcan.com/'` verisiyle derlenince dosya adı `anahtar('akcan.com')`.
- [ ] **Step 2: Run** `node --test tests/` — Expected: FAIL (`Cannot find module '../indexnow.js'`, anahtar dosyası yok).
- [ ] **Step 3: Implement**
  - `indexnow.js` yukarıdaki arayüzle.
  - `build.js`: `require('./indexnow.js').anahtar(new URL(siteUrl).host)` → `write(key + '.txt', key)`.
  - `yayin.yml`, `derle` işi: "Siteyi derle"den önce `curl -fsSL "${{ steps.pages.outputs.base_url }}/sitemap.xml" -o eski-sitemap.xml || : > eski-sitemap.xml`; derlemeden sonra `id: fark` adımı `node indexnow.js fark --eski eski-sitemap.xml --yeni _site/sitemap.xml --cikti "$GITHUB_OUTPUT"`; iş çıktıları `bildirim`, `sayi`. Yeni iş:

```yaml
  bildir:
    needs: [derle, yayinla]
    if: needs.derle.outputs.sayi != '0'
    runs-on: ubuntu-latest
    continue-on-error: true # bildirim hatası yayını bozmaz
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - name: Arama motorlarına bildir (IndexNow)
        env:
          BILDIRIM: ${{ needs.derle.outputs.bildirim }}
        run: node indexnow.js gonder
```

  - Belgeler: kılavuzda "Arama motorları ve yapay zekâ: otomatik yapılanlar" bölümüne (puan, önizleme, kaydedince bildirim, otomatik açıklamanın cümle sonunda kesilmesi, ara başlık çapaları, IndexNow: Bing/Yandex/Seznam/Naver/Yep, Google site haritasını okur); formların "Arama & paylaşım" kartı anlatımına önizleme ve puan; Yayın & SEO kontrol listesine yeni satır. README: özellik listesine aynı maddeler ve `indexnow.js`.
- [ ] **Step 4: Run** `node --test tests/` — Expected: hepsi PASS. Gerçek veriyle yerel derleme (`node build.js --veri <geçici> --cikti <geçici>`) anahtar dosyasını üretir; `node indexnow.js fark --eski <boş> --yeni <geçici>/sitemap.xml --cikti <geçici>/cikti.txt` `sayi=` satırı yazar. Kılavuzdaki iç bağlantılar kırık değil.
- [ ] **Step 5: Commit**

```bash
git add indexnow.js build.js .github/workflows/yayin.yml tests/indexnow.test.js tests/build.test.js KULLANIM-KILAVUZU.md README.md
git commit -m "Otomatik SEO: IndexNow bildirimi, kılavuz ve README"
```
