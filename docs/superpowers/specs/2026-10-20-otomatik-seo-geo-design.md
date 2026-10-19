# Kaydedince Otomatik SEO & GEO — Tasarım

Tarih: 2026-10-20 · Durum: onay bekliyor

## Amaç

Kullanıcı panelde **Kaydet**'e bastığında, ek iş yapmadan, içeriği arama motorları (SEO) ve yapay zekâ yanıt motorları (GEO) için hazır olsun: eksikler sitenin kendisi tarafından güncel içerikten doldurulsun, kalan sorunlar kullanıcıya puan ve öneri olarak söylensin, değişen sayfalar arama motorlarına anında bildirilsin.

Bugün zaten otomatik olanlar (değişmez): her kayıt GitHub bağlıysa siteyi yayınlar; her yayında site haritası, `robots.txt`, `llms.txt` / `llms-full.txt`, yapılandırılmış veri ve paylaşım etiketleri baştan üretilir; boş SEO başlığı / açıklama / alt metin yerine başlık ve metin kullanılır.

## Kararlar

| Konu | Karar | Neden |
|---|---|---|
| Otomatik değerler | Kayda **yazılmaz**; her yayında güncel içerikten hesaplanır, panelde önizlenir | Kayda yazılan metin, içerik sonradan değişince eskir; eski içerikler de yeniden kaydedilmeden iyileşir |
| Kullanıcının yazdığı alanlar | Hiç değiştirilmez | Kullanıcının sözü son sözdür |
| Açıklama kesimi | Cümle sonunda | Yarım cümle arama sonucunda kötü görünür |
| SSS (FAQPage) şeması | **Eklenmez** | Google 2023'ten beri SSS zengin sonucunu yalnız resmî/sağlık sitelerine gösteriyor; yapay zekâ alıntısına etkisi kanıtlanmamış |
| Arama motoruna bildirim | IndexNow (Bing, Yandex, Seznam, Naver, Yep) | Hesap/ayar gerektirmez; Google desteklemiyor, site haritasındaki `lastmod`'u okuyor (zaten doğru) |
| Puan | Panelde, kurallı (yapay zekâ çağrısı yok) | Anahtar/sunucu gerekmez, her zaman aynı sonucu verir |

## 1. Otomatik başlık ve açıklama (tek kaynak)

- `render.js` yeni `seoOf(col, item)` dışa aktarır: `{ title, desc, url }` — sitenin o içerik için `<title>`, `meta description` ve kanonik adres olarak kullanacağı **son** değerler. İçerik sayfaları (yazı/video, bölüm, seri, kitap, remix, özel sayfa) başlık ve açıklamalarını bu fonksiyondan alır; panel önizlemesi de aynısını çağırır. Böylece panelde görülen ile yayındaki her zaman aynıdır.
- `col`: `posts`, `podcasts`, `series`, `books`, `remixes`, `pages`.
- Başlık kuralları bugünküyle aynı: `seoTitle` varsa o; yoksa türün mevcut kalıbı (ör. `Başlık — Site adı`); 60 karakteri aşan başlıkta "— Site adı" eki düşer.
- Açıklama kaynak sırası bugünküyle aynı (`seoDesc` → özet/kısa tanıtım → metin). Kesim yeni `snippet(s)` ile yapılır:
  - 160 karakter ya da kısaysa olduğu gibi.
  - Uzunsa: 120–160 karakter aralığındaki **son cümle sonunda** (`.` `!` `?` `…` ardından boşluk) biter.
  - Aralıkta cümle sonu yoksa bugünkü `clip` (kelime sınırı + "…").
  - `page()` içindeki `pg.desc = clip(...)` satırı `snippet` kullanır (bütün sayfalar için).

## 2. GEO: ara başlık çapaları

- İçerik HTML'indeki (`fixHtml`'den geçen bütün zengin metinler) `<h2>` ve `<h3>`'e, `id`'si yoksa, metninden `Store.slugify` ile çapa eklenir (`<h2 id="ses-nedir">`). Aynı sayfada tekrar ederse `-2`, `-3`. Var olan `id` korunur; boş başlığa eklenmez.
- Amaç: Google'ın "şuraya atla" bağlantıları ve yapay zekâ alıntılarının doğrudan bölüme gidebilmesi. Görünümde değişiklik yok.

## 3. Puan (`js/seo.js`, yeni)

`SEO.score(col, item, opt)` → `{ puan: 0–100, maddeler: [{ ad, ok: true|false|'yarim', puan, en, oneri }] }`. Saf fonksiyon: `Render` ve `Store`'u kullanır, DOM'a dokunmaz; Node testlerinde de çalışır. `opt.imgW`: biliniyorsa görselin ölçülen genişliği.

| Madde | Puan | Tam | Yarım | Sıfır / öneri |
|---|---|---|---|---|
| Başlık | 15 | `seoOf().title` ≤ 60 karakter | — | "Başlık N karakter; Google ~60'tan sonrasını keser. Kısa bir SEO başlığı yazın." |
| Açıklama | 20 | Kullanıcı yazmış (`seoDesc` ya da özet/kısa tanıtım) ve 70–160 karakter | Yalnız metinden üretiliyor ya da yazılan 70'ten kısa / 160'tan uzun (10) | Hiç metin yok (0). Öneri: "Özet ya da SEO açıklaması yazın (150–160 karakter)." |
| Görsel | 15 | Kapak / paylaşım görseli / video karesi var | Ölçülen genişlik < 1200 px (10): "Google Discover büyük görsel için en az 1200 px ister." | Görsel yok (0) |
| Görsel açıklaması | 10 | `coverAlt` var ya da görsel kapak değil (video karesi) ya da görsel yok | — | "Kapak açıklaması (alt metin) yok." |
| İçerik derinliği | 20 | Ana metin kelime sayısı ≥ eşik | ≥ eşiğin yarısı (10) | Öneri: "Metin N kelime; en az E kelime önerilir — arama motorları ve yapay zekâ bu metni okur." |
| Ara başlık | 10 | Metin < 600 kelime ya da en az bir `<h2>`/`<h3>` var | — | "Uzun metni ara başlıklarla (H2) bölün." |
| Etiketler | 5 | En az bir etiket ya da türde etiket alanı yok | — | "Etiket ekleyin." |
| Adres | 5 | `slug` ≤ 60 karakter | — | "Bağlantı (slug) kısa olsun." |

- Ana metin ve eşik: yazı (`kind: 'yazi'`) ve özel sayfa `content` ≥ 300; video `content` ≥ 80; bölüm, remix, kitap, seri `description` ≥ 80.
- Etiket alanı olmayan türler: özel sayfa, seri.
- Renk: ≥ 80 iyi (yeşil), 50–79 orta (sarı), < 50 zayıf (kırmızı).

## 4. Panel

- **Form, "Arama & paylaşım" kartı** (puanlanan türlerin formu): kartın başında Google önizlemesi (mavi başlık, yeşil adres, açıklama — `seoOf` ile, formdaki değerlerden), puan rozeti ve madde listesi (✓ / ! ve öneri metni). Formda yazdıkça (gecikmeli, ~300 ms) yenilenir. Kapak / paylaşım görseli değişince genişliği ölçülür (`imgDims`) ve puana katılır.
- **Kaydedince**: bildirim `Değişiklikler kaydedildi · SEO & GEO 86/100`; puan 80'in altındaysa ilk önerinin metni eklenir.
- **Yayın & SEO** kontrol listesi: yeni satır "SEO & GEO puanı": yayındaki (örnek olmayan, yayında) içeriklerin ortalaması; 80 altı içerikler en düşükten başlayarak (en fazla 5) başlık + puanla listelenir, tıklayınca formu açılır. Hiç kendi içeriği yoksa satır görünmez.

## 5. IndexNow (yayından sonra)

- **Anahtar**: site adresinin ana makine adından türetilir: `sha256('indexnow:' + host)` onaltılık ilk 32 karakter. Ayar yok, her yayında aynı.
- **Anahtar dosyası**: `build.js` her derlemede `_site/<anahtar>.txt` yazar (içerik: anahtar).
- **Değişen adresler**: derleme öncesi yayındaki `sitemap.xml` indirilir (yoksa boş). Yeni site haritasıyla karşılaştırılır:
  - yeni adresler,
  - `lastmod`'u değişen adresler,
  - kaldırılan adresler (arama motoru 404'ü görüp düşürsün).
  `lastmod`'u olmayan adresler yalnız yeni ya da kaldırılmışsa girer. En fazla 10.000. Liste boşsa bildirim yapılmaz.
- **Gönderim**: yayın tamamlandıktan sonra ayrı adımda `POST https://api.indexnow.org/indexnow` (`{ host, key, keyLocation, urlList }`). Yanıt kodu kayda yazılır; hata yayını **bozmaz** (`continue-on-error`).
- Kod: `indexnow.js` (kök dizinde, `build.js` gibi): `fark(eskiXml, yeniXml)` ve `anahtar(host)` dışa aktarılır; komut satırından `fark` ve `gonder` çalışır.
- İş akışı: `derle` işi eski site haritasını indirir, farkı hesaplar, iş çıktısı olarak verir; yeni `bildir` işi (`needs: yayinla`) gönderir.

## Kapsam dışı

SSS şeması; içerik metnini yapay zekâyla yazdırma; liste ekranlarında satır başına puan; Google Indexing API (yalnız iş ilanı / canlı yayın için); eski adreslere yönlendirme; içindekiler tablosu.

## Test

- `tests/render.test.js`: `snippet` (kısa metin aynen; aralıkta cümle sonu; aralıkta yoksa kelime sınırı + "…"); `seoOf` her tür için `page()`'in `title`/`desc`'iyle aynı; ara başlık çapaları (Türkçe karakter, tekrar `-2`, var olan `id` korunur, boş başlık).
- `tests/seo.test.js` (yeni): her madde için tam / yarım / sıfır; toplam 100; eşikler türe göre; `imgW` < 1200.
- `tests/build.test.js`: anahtar dosyası adı ve içeriği; `fark` (yeni, değişen, kaldırılan, `lastmod`suz, eski yok → hepsi, boş liste).
- Panel (Playwright): önizleme yazdıkça değişir; kaydedince bildirimde puan; Yayın & SEO'da ortalama ve liste; bütün panel ekranlarında `undefined`/`NaN` yok; 390 px'te taşma yok.
