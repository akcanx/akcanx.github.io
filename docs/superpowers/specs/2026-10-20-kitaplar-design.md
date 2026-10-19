# Kitaplar Sekmesi — Tasarım

Tarih: 2026-10-20 · Durum: onay bekliyor

## Amaç

Kullanıcının basılı ve yayımlanmış kitaplarını tanıtan ve okuru satış platformlarına (Amazon, D&R, Kitapyurdu, Idefix, BKM Kitap, Hepsiburada, Trendyol) yönlendiren bir **Kitaplar** sekmesi. Sekme hazır gelir ama sitenin menüsünde **gizli** durur; kullanıcı Menü Yönetimi'nden açar. Üç örnek kitapla tasarlanır.

Referans: barisozcan.com/sesli-kitaplar (vitrin) ve barisozcan.com/sesli-kitap/kozmos (kitap sayfası).

## Kararlar

| Konu | Karar |
|---|---|
| Düzen | Vitrin (`/kitaplar/`) + her kitaba ayrı sayfa (`/kitaplar/kitap-adi/`) |
| Platformlar | Amazon, D&R, Kitapyurdu, Idefix, BKM Kitap, Hepsiburada, Trendyol (yayınevi sitesi yok) |
| "İnaktif" | Menü öğesi gizli (`visible: false`); sayfa ve panel bölümü hazır |
| Kapsam dışı | Ana sayfa akışı, fiyat bilgisi, Google Alışveriş |

## Veri

### Kitap (`D.books[]`, dizideki sıra = vitrindeki sıra)

| Alan | Açıklama |
|---|---|
| `id`, `title` (zorunlu), `subtitle`, `slug` | Kimlik, ad, alt başlık, bağlantı (kitaplar arasında benzersiz) |
| `tagline` | Kısa tanıtım: kartta ve arama açıklamasında |
| `description` | Tanıtım metni (zengin metin) |
| `quote` | Kitaptan bir alıntı (düz metin, isteğe bağlı) |
| `cover`, `coverAlt` | Dikey kapak (2:3) ve açıklaması |
| `status` | `yayinda` (Yayında) · `onsiparis` (Ön sipariş) · `yakinda` (Yakında) |
| `date` | Yayın tarihi (YYYY-MM-DD) |
| `publisher`, `pages`, `isbn`, `edition`, `language`, `format` | Künye; `format`: `karton` (Karton kapak) · `ciltli` (Ciltli) · `ekitap` (E-kitap) · `sesli` (Sesli kitap) |
| `amazon`, `dr`, `kitapyurdu`, `idefix`, `bkm`, `hepsiburada`, `trendyol` | Satış sayfası adresleri; yalnızca `Store.isProfile` geçenler gösterilir |
| `tint`, `tags`, `seoTitle`, `seoDesc`, `ogImage`, `published`, `sample` | Ortak alanlar |

### Sayfa ayarları (`settings.booksPage`)

`title` "Kitaplar", `eyebrow` "Kitap · Basılı ve yayımlanmış", `intro` (tanıtım paragrafı), `tint` `#4A3A1E`.

### Sabitler (`Store`)

`BOOK_STATUS`, `BOOK_FORMAT` (yukarıdaki etiketler) ve `BOOK_SHOPS` (platform sırası ve adları: `[['amazon','Amazon'],['dr','D&R'],['kitapyurdu','Kitapyurdu'],['idefix','Idefix'],['bkm','BKM Kitap'],['hepsiburada','Hepsiburada'],['trendyol','Trendyol']]`).

### Geçiş

- Veri sürümü 4 → 5: menüde `books` türünde öğe yoksa `{ label: 'Kitaplar', type: 'books', visible: false }` bir kez eklenir (kullanıcı sonradan silerse geri gelmez).
- Örnek sürümü 5 → 6: herhangi bir koleksiyonda örnek varsa üç örnek kitap bir kez eklenir.
- `Store.forPublish` kitapları da süzer (yayında ve örnek olmayanlar); `SAMPLE_IDS` kitapları kapsar.

## Sitede

### `/kitaplar/` — Vitrin

- Başlık bloğu podcast vitrinindeki gibi: üst etiket, büyük başlık, tanıtım, "3 kitap" bilgi satırı; ışık rengi.
- Kapak ızgarası: podcast vitrininin ızgarası, kapaklar **2:3**; masaüstü ve tablette 3, ≤680 px'te 2 sütun.
- Kart: kapak (köşede "Ön sipariş" / "Yakında"), ad, kısa tanıtım (yoksa alt başlık), vurgu renginde "yıl · yayınevi". Kart kitap sayfasına gider.
- Yayında kitap yoksa "Henüz yayınlanmış kitap yok." ve `noindex`.

### `/kitaplar/kitap-adi/` — Kitap sayfası

- **Üst bölüm:** solda dikey kapak; sağda üst etiket ("Kitap · Yayınevi · Ön sipariş"), başlık, italik alt başlık, bilgi satırı (yıl · sayfa · biçim).
- **Satın alma:** adresi geçerli platformlar `BOOK_SHOPS` sırasıyla düğme dizisi; ilki vurgulu ("Satın al · Amazon"), diğerleri yalnızca platform adı ("D&R", "Kitapyurdu" …). Hepsi yeni sekmede açılır (`rel="noopener"`). Geçerli adres yoksa düğmeler yerine durum notu ("Yakında satışta").
- **Gövde:** tanıtım metni (ilk harf büyük), varsa alıntı (alıntı stili), konu etiketleri, **Künye** listesi (yayınevi, yayın tarihi, baskı, sayfa, ISBN, dil, biçim — boş olanlar gösterilmez), "Diğer kitaplar" (diğer kitapların kartları).
- Konum satırı: Kitaplar › kitap adı.
- `ogType` `book`; `book:isbn`, `book:release_date` meta etiketleri.

### Yapılandırılmış veri

Vitrin: `CollectionPage` + kitap listesi. Kitap sayfası: `Book` — `name`, `alternativeName` (alt başlık), `author` (kişi düğümü), `isbn`, `numberOfPages`, `publisher` (`Organization`), `datePublished`, `image`, `inLanguage`, `bookFormat` (schema.org `Paperback`/`Hardcover`/`EBook`/`AudiobookFormat`), `description`, `potentialAction`: her platform için `BuyAction` (`target` adres, `seller` platform adı).

### Diğer

- Site haritası ve rotalar: yayında kitap varsa ya da menü öğesi görünürse `kitaplar`; her yayındaki kitap.
- Site içi arama: kitaplar ("Kitap" etiketiyle).
- `llms.txt`: "Kitaplar" bölümü; `llms-full.txt`: her kitabın tanıtımı, künyesi ve satın alma bağlantıları.
- Menü türü `books` → `/kitaplar/`.

## Panel

- Kenar çubuğu İçerik grubuna **Kitaplar** (`#books`).
- **Kitaplar ekranı:** Seriler ekranının düzeni: kapak (dikey küçük resim), ad + "Örnek", durum · yıl · yayınevi, Yayında/Taslak, ↑ ↓, Düzenle, ↗, Sil; üstte **⚙ Sayfa Ayarları** ve **+ Yeni Kitap**.
- **Kitap formu:** ana sütun: ad (zorunlu), alt başlık, kısa tanıtım, tanıtım metni (zengin metin), kitaptan alıntı; yan sütun: Yayın (Yayında, durum, yayın tarihi, bağlantı), Künye (yayınevi, sayfa, ISBN, baskı, dil, biçim), Kapak (dikey kapak, açıklama), Satış platformları (yedi adres), Görünüm (ışık rengi), Etiketler, Arama & paylaşım.
- **Menü Yönetimi:** tür listesine "Kitaplar".
- **Kontrol listesi:** "Podcast ve remix platformları" maddesi kitapların platform adreslerini de denetler ("Kitap adı → Amazon").
- **Örnek içerikleri sil:** örnek kitapları da siler.

## Örnek içerik

Üç örnek kitap (yazar site sahibi; müzik ve ses üzerine): biri `onsiparis`. Kapaklar picsum.photos (800×1200). Platform adresleri kitap adıyla arama sayfaları (ör. `https://www.dr.com.tr/search?q=…`). Örnekler yayına gitmez.

## Doğrulama

- Birim: geçiş (menü öğesi bir kez, gizli), örnek sürümü 6, `forPublish` kitapları süzer; vitrin kartları, kitap sayfası, yalnızca geçerli platform düğmeleri, `Book` şeması ve `BuyAction`, gizli menüde örnekten başka kitap yokken yayında `kitaplar` rotası yok; derleme `llms.txt` / `llms-full.txt` kitapları içerir.
- Playwright: vitrin ve kitap sayfası 390 / 768 / 1440 px'te hatasız, taşmasız, CLS < 0,1; panel Kitaplar ekranı (ekle, sırala, sil), Menü Yönetimi'nde Kitaplar öğesini açınca sitede menüde görünür.
- Derleme + denetim betikleri temiz; kılavuz ve README güncel.
