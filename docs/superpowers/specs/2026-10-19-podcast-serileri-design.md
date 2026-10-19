# Podcast Serileri — Tasarım

Tarih: 2026-10-19 · Durum: onay bekliyor

## Amaç

Podcast sekmesi bugün tek bir program ("Frekans") gösteriyor. Kullanıcı birden çok podcast serisi yayınlayacak ve her serinin bilgilendirici bir kimliği olsun istiyor. Menüden **Podcast**'e tıklanınca bütün serilerin kapakları, bir tanıtım vitrini gibi yan yana dizilecek.

Referans: barisozcan.com/sesli-kitaplar (üstte tanıtım, altında üç sütun kare kapak; kapağın altında ad, kısa bilgi, vurgulu satır).

## Kararlar

| Konu | Karar |
|---|---|
| Alt kategoriler | Podcast'te alt kategori (Müzik / Gıda / Gündem) kalkar, yerini **seriler** alır. Videolar ve Yazılar'daki alt kategoriler aynen kalır. |
| Yaklaşım | Seriler **kendi içerik türü**: `D.series` koleksiyonu, panelde ◫ Seriler ekranı ve seri formu. |
| Adresler | İç içe: `/podcast/` vitrin, `/podcast/<seri>/` seri, `/podcast/<seri>/<bolum>/` bölüm. |
| Seri kimliği | Ad, kısa tanım, tanıtım metni, kare kapak, ışık rengi, Spotify / Apple Podcasts / YouTube + **yayın sıklığı**, **durum**, **fragman**. |
| Vitrinde son bölümler | Evet: kapakların altında bütün serilerden en yeni 6 bölüm. |

## Veri

### Seri (`D.series[]`, dizideki sıra = vitrindeki sıra)

| Alan | Açıklama |
|---|---|
| `id` | Kimlik (`seri-…`) |
| `title` | Seri adı (zorunlu) |
| `slug` | Bağlantı, seriler arasında benzersiz (`frekans`) |
| `tagline` | Kısa tanım: kartta görünen tek satır |
| `description` | Tanıtım metni (düz metin, paragraflar boş satırla) |
| `cover`, `coverAlt` | Kare kapak ve açıklaması |
| `tint` | Işık rengi (seri sayfasının zemini) |
| `frequency` | Yayın sıklığı, ör. "Her Pazartesi" (isteğe bağlı) |
| `status` | `devam` (Devam ediyor) · `tamam` (Tamamlandı) · `yakinda` (Yakında) |
| `trailer` | Fragman: ses dosyası adresi ya da YouTube / Spotify / SoundCloud / Mixcloud bağlantısı (isteğe bağlı) |
| `spotify`, `apple`, `youtube` | Platform adresleri; yalnızca gerçek profil/program adresleri gösterilir |
| `seoDesc` | Arama sonucu açıklaması (boşsa kısa tanım ya da tanıtım metni) |
| `published` | Yayında anahtarı |
| `sample` | Örnek seri işareti (yayına gitmez) |

### Bölüm (`D.podcasts[]`)

- Yeni alan: `series` (seri kimliği, zorunlu).
- `cat` alanı podcast bölümlerinde artık kullanılmaz (geçişte silinir).

### Podcast sayfa ayarları (`settings.podcast`)

Yalnızca vitrin sayfasının başı kalır: `name` (başlık, varsayılan "Podcast"), `eyebrow` (üst etiket), `description` (tanıtım paragrafı), `tint`. Kapak, platform bağlantıları, alt not, buton metni ve `cats` serilere geçer ya da kalkar.

## Geçiş (veri sürümü 3 → 4)

`Store.migrate` içinde, hem paneldeki kayıtta hem yayın derlemesinde (`normalize`) bir kez çalışır:

1. `D.series` boşsa bugünkü `settings.podcast` programından **ilk seri** oluşur: ad, açıklama → tanıtım metni, kapak, renk, Spotify / Apple / YouTube; üst etiketteki "Podcast · " sonrası (ör. "Her Pazartesi") → yayın sıklığı; durum `devam`.
2. Program ayarları hiç değiştirilmemişse (ad ve açıklama örnek metinle aynıysa) bu seri **örnek seri** sayılır ve kimliği `seri-frekans` olur. Değiştirilmişse kullanıcının kendi serisi olur ve yayına gider. (Yayındaki veride ayarlar örnek hâlinde: Frekans örnek seri olur, yayından kalkar.)
3. Bütün bölümler bu seriye bağlanır; podcast bölümlerindeki `cat` ve `settings.podcast.cats` silinir.
4. `settings.podcast` vitrin ayarlarına dönüşür: `name` "Podcast", `eyebrow` "Podcast · Sesin hikâyeleri", `description` "Her seri ayrı bir merak: müzik, sofralar ve gündem. Bir seri seçin; ister baştan dinleyin, ister en yeni bölümden başlayın." (`tint` korunur).
5. Örnek sürümü 4 → 5: daha önce kaydedilmiş veriye iki örnek seri ve örnek bölümleri bir kez eklenir (örnekleri silmiş olana eklenmez).

Eski adresler yönlenir: `#/podcast/<bolum>` ve `#/bolum/<id>` → `podcast/<seri>/<bolum>`; eski alt kategori adresi `podcast/muzik` → `podcast`.

## Örnek içerik (`js/ornek-icerik.js`)

| Seri | Durum | Bölümler |
|---|---|---|
| **Frekans** (müzik, mevcut) | Devam ediyor · Her Pazartesi | Mevcut 6 örnek bölüm |
| **Sofra** (gıda) | Devam ediyor · İki haftada bir | 3 örnek bölüm |
| **Satır Arası** (gündem) | Yakında, fragmanlı | Bölüm yok |

Hepsi örnek: panelde ve önizlemede görünür, yayına gitmez.

## Sitede

### `/podcast/` — Vitrin

- **Üst bölüm:** üst etiket, büyük başlık, tanıtım paragrafı, bilgi satırı ("3 seri · 24 bölüm"). Işık rengi sayfa zemininde.
- **Seri kartları:** masaüstünde 3, tablette 2 sütun, telefonda tek sütun (ölçüler referanstan alınır).
  - Kare kapak; köşede durum etiketi: **Yakında** ya da **Tamamlandı** ("Devam ediyor" etiketsiz).
  - Ad (serif), kısa tanım, vurgu renginde "12 bölüm · Her Pazartesi" (bölümü yoksa yalnızca sıklık ya da "Yakında").
  - Kartın tamamı seri sayfasına bağlantı.
- **Son bölümler:** bütün serilerden en yeni 6 bölüm, mevcut bölüm satırı düzeninde; meta kısmında seri adı. Sayfadan çıkmadan dinlenir.
- Yayında seri yoksa: "Henüz yayınlanmış seri yok." ve sayfa `noindex`.

### `/podcast/<seri>/` — Seri sayfası

- Bugünkü program düzeni (`showHero`): solda kare kapak; sağda üst etiket ("Podcast · Her Pazartesi · Tamamlandı"), ad, tanıtım metni, "Dinle: Spotify · Apple Podcasts · YouTube".
- **Fragman:** ses dosyasıysa "▶ Fragmanı dinle" düğmesi alttaki ortak oynatıcıda çalar (oynatıcı anahtarı `seri:<id>`); diğer bağlantılar `Store.embed` ile gömülü oynatıcı olur.
- Son bölüme bağlantı ("→ Son bölümü dinle"), ardından serinin bütün bölümleri.
- Konum satırı: Podcast › Seri adı.
- Bölümü olmayan seri sayfası `noindex`.

### `/podcast/<seri>/<bolum>/` — Bölüm sayfası

- Bugünkü düzen. Üst etiket: Seri adı · Bölüm 6. Konum satırı: Podcast › Seri › kavramlar.
- Önceki / sonraki aynı serinin içinde.

### Diğer

- Ana sayfa akışı ve ilgili içerik: bölüm etiketinde alt kategori yerine seri adı; bağlantılar iç içe adrese.
- Site içi arama serileri de bulur ("Podcast serisi").
- Öne Çıkan (Hero) bölüm seçilince doğru adrese gider (panel önizlemesi dahil).

## Panel

- **Podcast listesi:** üstte "▦ Alt Kategoriler" yerine **◫ Seriler**; seriye göre süzme düğmeleri ("Hepsi · Frekans · Sofra …"); satır alt bilgisinde seri adı.
- **◫ Seriler ekranı** (`#series`, kenar çubuğunda Podcast seçili): kart listesi (kapak, ad, durum, bölüm sayısı, örnekse "Örnek"), ↑ ↓ sıralama, **+ Yeni Seri**, Düzenle, ↗ Önizlemede aç, Sil.
  - Bölümü olan seri silinirken bölümlerin taşınacağı seri sorulur; tek seri kalmışsa silinemez, "Yayında" kapatılması önerilir.
- **Seri formu:** ad, bağlantı, kısa tanım, tanıtım metni, kapak (+ açıklama), ışık rengi, yayın sıklığı, durum, fragman, Spotify / Apple Podcasts / YouTube, arama açıklaması, Yayında. Kaydet / Ctrl+S, kaydedilmemiş değişiklik uyarısı (mevcut form altyapısı).
- **Bölüm formu:** "Alt kategori" yerine **Seri** seçimi (zorunlu; yeni bölümde listede süzülen seri, süzme yoksa ilk seri seçili).
- **⚙ Sayfa Ayarları** (Podcast): başlık, üst etiket, tanıtım paragrafı, ışık rengi.
- **Yayın & SEO kontrol listesi:** "Podcast ve remix platformları" uyarısı seri adreslerini de kontrol eder; örnek ya da yayında olmayan bir seriye bağlı kendi bölümleriniz varsa uyarı ("Bu bölümler yayına gitmez").
- **Örnek içerikleri sil:** örnek serileri de siler; kendi bölümünüzün bağlı olduğu örnek seri silinmez (uyarı verilir).
- Örnek seriyi düzenlemek onu kendi seriniz yapmaz (yazılardaki davranışla aynı); kendi serileriniz **+ Yeni Seri** ile eklenir.

## Yayın ve arama motorları

- Yayına giden veri (`Yayin.publicData`, `build.js`): yalnızca yayında ve örnek olmayan seriler; bölümlerden yalnızca bu serilere bağlı olanlar.
- Yapılandırılmış veri: vitrinde `CollectionPage` + seri listesi (`ItemList`); her seri sayfasında `PodcastSeries` (`/podcast/<seri>/#seri`); bölümlerde `partOfSeries` doğru seriyi gösterir.
- `sitemap.xml`: vitrin, yayındaki seri sayfaları (bölümü olanlar), bölümler.
- `llms.txt`: Podcast başlığı altında seriler (kısa tanımla) ve bölümler.
- `feed.xml`: bölümler aynen, yeni adreslerle.

## Kapsam dışı

- Seri başına ayrı RSS (podcast platformlarına beslemek için) — ileride ayrı iş.
- Sunucu ve konuk alanları (kullanıcı seçmedi).
- Videolar / Yazılar alt kategorilerinde değişiklik.

## Doğrulama

- Geçiş: eski (sürüm 3) kayıt panelde açılır → Frekans serisi oluşur, bölümler bağlanır, örnek seriler eklenir; yayındaki `site.json` derlenir → Frekans örnek olduğu için yayına girmez, vitrin boş ve `noindex`.
- Playwright: vitrin, seri ve bölüm sayfaları 390 / 768 / 1440 px'te hatasız ve taşmasız; fragman (ses ve gömülü) çalışır; vitrinde son bölümler çalınır; eski adresler yönlenir.
- Panel: seri ekle / düzenle / sırala / sil (bölümleri taşıyarak), bölüm formunda seri seçimi, süzme düğmeleri; bütün ekranlar iki genişlikte hatasız.
- Derleme: deneme verisiyle derleme + denetim betiği (kırık bağlantı, başlık, açıklama, kanonik, JSON-LD, site haritası) temiz.
- Belgeler: kılavuzun Podcast bölümü yeniden yazılır, README güncellenir.
