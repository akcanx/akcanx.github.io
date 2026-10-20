# Kaynaklar Sekmesi — Tasarım

Tarih: 2026-10-20 · Durum: onay bekliyor

## Amaç

Kullanıcının videolarında ve yazılarında andığı ya da önerdiği kaynakları (araçlar, rehberler, siteler, kitaplar) sitenin şık tasarımıyla tek sayfada paylaşan bir **Kaynaklar** sekmesi. Her kaynakta kapak, düzenlenebilir metin ve bağlantılar bulunur; her şey panelden yönetilir; sekme panelden açılıp kapanır; SEO & GEO sistemine tam dahildir. Ana sayfadaki **Öne Çıkan (Hero)** alanına kaynak da seçilebilir.

İşlev referansı: isanurdogdu.com/kaynaklar (arama + sayaç + tür etiketli kart ızgarası, kısa kaynaklar için sağdan açılan yan panel, rehberler için ayrı sayfa). Görünüm referansı: sitenin kendi tasarımı (barisozcan.com dili: Fraunces, Bebas Neue, JetBrains Mono, koyu zemin, renkli ışık).

## Kararlar

| Konu | Karar |
|---|---|
| Açılır kapanır | İkisi de: sekme Menü Yönetimi'nden açılır/kapanır (gizli gelir) **ve** kaynaklar listede yan panelde açılır |
| Mimari | **A:** her kaynağın kendi sayfası var; kart o sayfaya giden normal bağlantıdır, JavaScript tıklamayı yakalayıp yan paneli açar; panel açılınca adres değişmez |
| Türler | Panelden düzenlenir; başlangıç: Rehber, Araç, Video, Kitap, Site |
| Bağlantılar | Ana bağlantı + ek bağlantı listesi + sitedeki içeriğe bağ (çift yönlü) |
| Başlangıç | Menüde gizli, 6 örnek kaynak (yayına gitmez) |
| Öneriler | Arama + sayaç, öne çıkan kaynaklar, "Yeni" rozeti (hazırlayan kartı seçilmedi) |
| Hero | Öne Çıkan (Hero) ekranında kaynaklar da seçilebilir |
| Kapsam dışı | Hazırlayan kartı, yorum, beğeni, bağlantıyı kopyala, adres değiştiren yan panel, ana sayfa akışı ve RSS'te kaynaklar |

## Veri

### Kaynak (`D.resources[]`)

| Alan | Açıklama |
|---|---|
| `id`, `title` (zorunlu), `slug` | Kimlik, ad, bağlantı (kaynaklar arasında benzersiz) → `/kaynaklar/<slug>/` |
| `type` | Tür kimliği (`settings.resourceTypes`); boş ya da silinmiş tür = türsüz |
| `summary` | Kısa açıklama: kartta (2 satır), yan panelde, sayfa girişinde, arama açıklamasında |
| `body` | Zengin metin (sayfada; yan panelde gösterilmez) |
| `cover`, `coverAlt` | Kapak (16:9) ve alt metni |
| `url`, `urlLabel` | Ana bağlantı ve düğme metni (boşsa "Kaynağa git") |
| `links` | `[{ label, url }]` ek bağlantılar |
| `related` | `['posts:<id>', 'podcasts:<id>', 'remixes:<id>']` sitedeki içerik |
| `pinned` | Kaynaklar sayfasında öne çıkan (★). **`featured` değil:** o alan Hero'yu değiştirir |
| `date` | Eklenme tarihi (sıralama ve "Yeni" rozeti) |
| `published`, `sample`, `tags`, `tint`, `seoTitle`, `seoDesc`, `ogImage`, `updated` | Ortak alanlar |

### Ayarlar

- `settings.resourcesPage`: `title` "Kaynaklar", `eyebrow` "Kaynak · Araçlar, rehberler ve bağlantılar", `intro` (tanıtım paragrafı), `tint`.
- `settings.resourceTypes`: `[{ id, name }]` sıralı; başlangıç `rehber` Rehber, `arac` Araç, `video` Video, `kitap` Kitap, `site` Site.

### Sürüm geçişi

- Veri sürümü 6: `resources` boş başlar (birleştirmeden gelen örnekler atılır), `resourceTypes` varsayılanla gelir, menüye gizli `{ type: 'resources', label: 'Kaynaklar', visible: false }` öğesi **bir kez** eklenir: Kitaplar'ın ardına, yoksa Remixler'in ardına, o da yoksa sona. Sonradan silinirse geri gelmez.
- Örnek sürümü 7: örneği kalmış kayda 6 örnek kaynak bir kez eklenir; örneklerini silmiş kullanıcıya eklenmez.
- `forPublish`: yayında olmayan ve örnek kaynaklar süzülür; `related` içinde yayına gitmeyen içeriğe giden anahtarlar sitede gösterilmez.

## Site

### Liste sayfası (`/kaynaklar/`)

- Üstte üst etiket, büyük başlık, tanıtım; yanında **arama kutusu** ve **"N / M kaynak"** sayacı. Arama başlık, kısa açıklama, ana bağlantının alan adı ve ek bağlantı adlarında, harf büyüklüğünden bağımsız (Türkçe) ve anlık çalışır.
- Altında **tür çipleri**: "Tümü" + kaynağı olan türler, her birinin yanında sayısı. Arama ve çip birlikte süzer. Sonuç yoksa "Aramanıza uygun kaynak yok." yazar.
- **Öne çıkanlar**: arama boş ve "Tümü" seçiliyken `pinned` kaynaklar üstte büyük kapaklı kartlarla (ızgarada tekrar edilmez); süzme etkinken bu satır gizlenir, hepsi ızgarada.
- **Kart ızgarası**: masaüstü 3, tablet 2, telefon 1 sütun; en yeni önde. Kart: kapak (16:9), tür etiketi (mono, büyük harf), "Yeni" rozeti (son 30 gün), başlık, 2 satır kısa açıklama, alt satırda alan adı (ör. `github.com`, `www.` atılır) ve "Aç →".
- Kart, kaynağın sayfasına giden `<a>`'dır (JavaScript yokken ve arama motorları için sayfa açılır).
- "Yeni" rozeti tarayıcıda o günün tarihine göre hesaplanır; hazır HTML derleme gününe göre üretilir.
- Kaynak yoksa "Henüz kaynak yok."; sayfa `noindex`.

### Yan panel

- Liste sayfasında karta tıklanınca (değiştirici tuşsuz sol tık) sayfa değişmeden açılır: masaüstünde sağdan (~480 px), 640 px altında alttan tam genişlik.
- İçerik: kapak, tür, başlık, kısa açıklama, ana bağlantı düğmesi ("Kaynağa git ↗" ya da `urlLabel`) ve altında alan adı, ek bağlantı listesi, sitedeki ilgili içerik kartları, en altta "Sayfasına git →".
- Kapanma: "Kapat ✕", Esc, arka plana tıklama. `role="dialog"`, `aria-modal`, başlıkla etiketli; açılınca odak panele, kapanınca karta döner; arka plan kaymaz.
- Dış bağlantılar yeni sekmede, `rel="noopener"`.

### Kaynak sayfası (`/kaynaklar/<slug>/`)

- "← Tüm kaynaklar", tür etiketi, başlık (H1), kısa açıklama (giriş), kapak, ana bağlantı düğmesi + alan adı.
- Zengin metin (ara başlık çapalarıyla).
- **Bağlantılar**: ad + alan adı satırları.
- **Bu kaynağı anlattığım içerik**: ilgili video / yazı / bölüm / remix kartları.
- Etiketler; **Diğer kaynaklar** (önce aynı tür, en fazla 6).
- Asgari kaynak (yalnızca başlık): boş bölümler basılmaz; `undefined` / `null` yok.
- Bilinmeyen adres 404.

### Çift yönlü bağ

Bir yazı, video, bölüm ya da remix sayfasında, `related` alanında o içeriği gösteren yayındaki kaynaklar "Bu içerikteki kaynaklar" bloğunda listelenir (videoda "Bu videodaki kaynaklar"). Yoksa blok basılmaz.

### Menü ve rotalar

- Menü türü `resources` → `kaynaklar`. Rotalar: `kaynaklar` (yayında kendi kaynak varsa ya da menüde görünürse) ve her yayındaki kaynak. Menüde gizliyken de yayındaki kendi kaynaklarının sayfaları yayına girer (Kitaplar'daki gibi).
- Site içi arama: kaynaklar "Kaynak" etiketiyle.

## SEO & GEO (proje kuralı: tam entegrasyon)

- `Render.seoOf('resources', x)`: başlık `seoTitle` ya da `Başlık — Site adı`; açıklama `seoDesc` → `summary` → metin; görsel `ogImage` → `cover`.
- Panelde puan (`js/seo.js`): özet alanı `summary`, ana metin `body`, eşik 80 kelime, etiket alanı var.
- Yapılandırılmış veri: liste `CollectionPage` + `ItemList`; kaynak sayfası `Article` (yazar, tarihler, görsel, anahtar kelimeler; `about`: ana bağlantı; `citation`: ek bağlantılar) + `BreadcrumbList`.
- Site haritası, IndexNow, `llms.txt` (Kaynaklar bölümü) ve `llms-full.txt` (her kaynağın kısa açıklaması, metni ve bağlantıları).
- Gizli menü + yalnızca örnek kaynaklar: yayında `/kaynaklar/` yok, site haritasında ve llms dosyalarında kaynak yok.

## Panel

- Kenar çubuğu: **İçerik → Kaynaklar** (Kitaplar'ın ardına).
- **Liste**: türe göre süzme (adres `#resources/tur/<id>`), arama, ★ (öne çıkan) işareti, Yayında / Taslak, Örnek rozeti, kapak küçük resmi.
- **Form**:
  - Ana: başlık, kısa açıklama, metin (zengin).
  - Yan kartlar: **Yayın** (Yayında, tarih, bağlantı, ★ Öne çıkan kaynak), **Tür**, **Kapak** (+ alt metin), **Bağlantılar** (ana bağlantı + düğme metni; satır ekle/sil/sırala ile ek bağlantılar: ad + adres), **Sitedeki içerik** (videolar, yazılar, bölümler, remixler arasında aranabilir çoklu seçim; seçilenler çip), **Görünüm**, **Etiketler**, **Arama & paylaşım** (SEO & GEO kutusuyla).
- **⚙ Sayfa Ayarları**: başlık, üst etiket, tanıtım, ışık rengi.
- **▦ Türler**: ekle, yeniden adlandır, sırala, sil. Kullanımdaki tür silinirken onay istenir; o kaynaklar türsüz kalır.
- Menü Yönetimi: tür listesine "Kaynaklar"; hedef sütununda `Otomatik: #/kaynaklar`.
- Yayın & SEO kontrol listesi: kaynak bağlantılarında yalnızca alan adı (ör. `https://github.com/`) olanlar uyarılır; SEO & GEO ortalamasına kaynaklar dahil.
- Örnek sayısı ve "Örnek içerikleri sil" kaynakları kapsar.

### Öne Çıkan (Hero)

- İçerik listesine kaynaklar eklenir (süzgeç çipi "Kaynak"). Seçilen kaynak ana sayfa manşetinde: üst etiket "Öne çıkan kaynak", başlık, kısa açıklama, kapak, düğme "İncele" → kaynak sayfası. Özel başlık / açıklama / görsel / bağlantı / düğme metni alanları diğer içeriklerdeki gibi çalışır.
- Seçilen kaynak yayında değilse ya da örnekse manşet bugünkü gibi en son yayındaki içeriğe döner.

## Örnek içerik

6 kaynak; beş türün hepsinden en az biri; ikisi `pinned`; biri örnek bir videoya `related` ile bağlı; biri birkaç ek bağlantılı; biri yalnızca başlık + ana bağlantı (asgari). Kapaklar örnek görsel (`picsum.photos`), bağlantılar gerçek ve genel siteler.

## Test

- `tests/store.test.js`: ilk kurulum (sürüm 6, türler, gizli menü öğesi konumu), menü öğesi bir kez, örnek sürümü 7, `forPublish`.
- `tests/render.test.js`: liste sayfası (sayaç, çipler, öne çıkanlar, kart bağlantısı, alan adı), kaynak sayfası (bölümler, şema), asgari kaynak, çift yönlü bağ bloğu, rotalar (gizli menü + yalnızca örnek), `seoOf('resources')` = `page()`, Hero'da kaynak, 404.
- `tests/seo.test.js`: `resources` puanı (özet/metin alanları).
- `tests/build.test.js`: llms.txt / llms-full.txt kaynak bölümü; gizli + örnek → çıktıda kaynak yok.
- Panel (Playwright): kenar çubuğu, liste ve süzme, yeni kaynak (bağlantı satırları, içerik seçici), türler ekranı, sayfa ayarları, Hero'da kaynak seçimi, menüde açma; yan panel (açma, Esc, odak, telefon); bütün ekranlarda taşma ve `undefined` yok (1440 / 390 px).
