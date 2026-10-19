# Akcan — Kişisel Web Sitesi & Kontrol Paneli

[Barış Özcan](https://barisozcan.com) web sitesinin sayfa düzenlerinden, renk paletinden ve tipografisinden esinlenerek hazırlanmış; saf HTML5, CSS3 ve JavaScript ile yazılmış, kontrol paneline sahip kişisel web sitesi. YouTube videoları, blog yazıları, podcast bölümleri ve remixler tek bir yerden yönetilir.

> 📖 Panelin ve sitenin her özelliğinin adım adım anlatımı: **[KULLANIM-KILAVUZU.md](KULLANIM-KILAVUZU.md)**

---

## 🎨 Tasarım ve Renk Paleti

- **Zemin:** `#0C0C0A` (derin siyah), `#131310` (kartlar), `#1A1A16` (vurgulu alanlar)
- **Metin:** `#F4ECD8` (krem), `#B8B09A` (ikincil), `#736C5A` (tarih / soluk)
- **Vurgu:** `#C9F03A` (asit yeşili — panelden değiştirilebilir)
- **Yazı tipleri:** `Bebas Neue` (etiketler, düğmeler), `Fraunces` (başlıklar ve gövde), `JetBrains Mono` (tarih, meta bilgiler)
- **Mobil uyum:** Tüm sayfalar ve panel 360 px'ten geniş ekranlara kadar taşmasız ve simetrik çalışır.

---

## ✨ Sitedeki Sayfalar

### Üst Menü
- Menü bağlantıları, arama ve **sosyal medya simgeleri** (YouTube, Instagram, TikTok, X, LinkedIn, Spotify, SoundCloud, e-posta). Menü tek satıra sığmazsa önce simgeler üst bantta gizlenir, yine sığmazsa bağlantılar ☰ çekmeceye geçer (menü hiçbir genişlikte taşmaz); telefonda simgeler menü çekmecesinin altında durur. Hangi hesabın görüneceği panelden seçilir.

### Ana Sayfa
- Öne çıkan içerik büyük manşet olarak gösterilir (video ise "İzle", yazı ise "Oku" düğmesiyle).
- İstatistik bandı: "… video, … yazı, … podcast bölümü ve … remix".
- **Akış:** Tüm içerikler tarih sırasıyla; `Hepsi`, `Video`, `Yazı`, `Podcast`, `Remix` filtreleri.

### Videolar ve Yazılar (iki ayrı sekme)
- **Videolar** (`/videolar/`): YouTube videoları; **Yazılar** (`/yazilar/`): kapak görselli blog yazıları. Menüde Videolar önce gelir.
- İki sekme aynı düzende (barisozcan.com/yazilar): büyük başlık, açıklama, ışık rengi ve küçük resimli liste; videoların küçük resminde yarı saydam oynat işareti.
- Yanlış sekmedeki eski bir adres (ör. `/yazilar/video-adi/`) doğru sekmeye kendiliğinden yönlenir.
- **Video sayfası:** Üstte YouTube oynatıcı, sağında başlık, tarih, kelime sayısı ve "YouTube'da izle". Sayfa kaydırılınca video **solda küçük pencerede sabit kalır** (tablette sağ altta, mobilde menünün altında); × ile yerine döner.
- **Blog yazısı sayfası:** Aynı düzen; videonun yerinde **kapak görseli** durur.
- Ortak özellikler:
  - Büyük italik giriş (özet) ve büyük baş harfli gövde metni.
  - **Metin arası görseller:** ortada, sağa yaslı, sola yaslı, geniş — her birine açıklama ve kaynak satırı.
  - **Kaynaklı alıntılar** (alıntının altında kimin söylediği).
  - Sayfa sonunda açılır **Notlar ve kaynaklar**, **Görsel kaynakları ve lisanslar**, tıklanabilir **kavram kutuları** ve ortak etiketlere göre **ilgili içerik**.
  - Menünün altında konum satırı (Videolar ya da Yazılar › Alt kategori › Etiket …) ile aynı sekmedeki önceki / sonraki bağlantıları, üstte okuma ilerleme çubuğu.
  - Sayfa tonu: kapak görselinden ya da videodan otomatik seçilir veya panelden belirlenir.

### Alt kategoriler (Videolar, Yazılar, Podcast)
- Her sekmenin kendi alt kategori listesi var; başlangıçta **Müzik · Gıda · Gündem**. Farklı kanallarda üretilen içerikler (yemek hikâyeleri, gündem…) aynı sekmede kendi bölümünde toplanır.
- Sekmenin üstünde **Hepsi · Müzik · Gıda · Gündem** düğmeleri (Podcast'te "Bölümler" satırında); mobilde tek satır, yana kaydırılır.
- Her alt kategorinin kendi sayfası: `/yazilar/gida/`, `/videolar/gundem/`, `/podcast/muzik/` — ad, açıklama, **kanal bağlantısı** ("YouTube kanalına git ↗") ve yalnızca o alt kategorinin içerikleri.
- Liste satırlarında ve ana sayfa akışında alt kategori adı vurgulu; içerik sayfasının konum satırında bağlantılı.
- Yayında içeriği olmayan alt kategoriler gizlenir. Alt kategori sayfaları site haritasına, aramaya, `llms.txt`'ye ve yapılandırılmış veriye (konum satırı, kanal bağlantısı) girer.

### Podcast
- barisozcan.com/podcast düzeni: kare program kapağı, program adı, açıklama, Spotify / Apple Podcasts / YouTube bağlantıları ve "Oku + Dinle".
- Bölüm listesi: yuvarlak oynat düğmesi, bölüm numarası, başlık, alt kategori, tarih ve süre.
- **Bölüm sayfası:** çerçeveli kapak ve kaynağı, büyük başlık, italik özet. Ses çubuğu sayfa kaydırılınca menünün altına yapışır. Bölüm metni görseller ve alıntılarla zenginleştirilebilir.
- Sitenin altında sabit ses oynatıcı: 10 sn geri/ileri, hız (`1x`–`2x`), ses seviyesi, sürüklenebilir zaman çubuğu, klavye kısayolları (Boşluk, ← →).

### Remixler (Podcast sekmesinin ikizi)
- Podcast sayfasıyla aynı düzen: kare sayfa kapağı, üst etiket, ad, açıklama, SoundCloud / Mixcloud / Spotify / YouTube bağlantıları ve "Son Remixi Dinle".
- Remix listesi: yuvarlak oynat düğmesi, remix adı, tür · BPM · tarih.
- **Remix sayfası:** bölüm sayfasıyla aynı: tonlu üst bölüm, çerçeveli kapak ve kaynağı, italik özet, orijinal parça · tarih · süre · BPM satırı, kaydırınca menünün altına yapışan ses çubuğu, gömülü oynatıcı, görsellerle ve alıntılarla zenginleştirilebilen remix hikâyesi, notlar ve kaynaklar, ilgili içerik, önceki / sonraki.

### Hakkında
- barisozcan.com/hakkinda düzeni: tam ekran fotoğraf, üzerinde iki yana ayrılmış büyük italik yazı, altında vurgu renginde ortalanmış başlık ve ara başlıklı biyografi.

### Özel Sayfalar & Arama
- Panelden sınırsız sayfa (ör. Ekipmanlar, İletişim) oluşturulup menüye eklenebilir.
- `/` veya `Ctrl+K` ile site içi arama; kavram kutularına tıklamak da aramayı açar.

---

## 🛠 Kontrol Paneli (`admin.html`)

- **Giriş:** Şifre korumalı (ilk şifre: `admin` — Ayarlar'dan değiştirin).
- **Gösterge Paneli:** Video, yazı, podcast, remix, sayfa ve menü sayıları; öne çıkan manşet kartı; son içerikler; depolama göstergesi.
- **Önizleme:** Site panelin içinde açılır; örnek içerikler dahil her kayıt anında görünür. Masaüstü / Tablet / Mobil genişlik, **↻ Yenile** (site kodunu da yeniden yükler), yeni sekmede ya da yayındaki siteyi açma, son kayıt saati.
- **Videolar** ve **Yazılar** ayrı bölümler:
  - **+ Yeni Video**: YouTube bağlantısı zorunlu (başlık otomatik gelir). **+ Yeni Yazı**: kapak görseli zorunlu.
  - Her bölümün kendi **⚙ Sayfa Ayarları**: sitedeki sekmenin başlığı, açıklaması ve ışık rengi.
  - İkisi de aynı veride (`posts`) durur; içeriğin türü hangi sekmede görüneceğini belirler.
- **▦ Alt Kategoriler** (Videolar, Yazılar, Podcast): alt kategori ekleme, silme (içerikler silinmez, alt kategorisiz kalır), ↑↓ sıralama; ad, bağlantı, açıklama ve kanal bağlantısı. Formlarda **Alt kategori** seçimi, listelerde alt kategori filtresi; süzülmüş listede **+ Yeni** o alt kategoride açılır. Alt kategori bağlantıları aynı sekmedeki içeriklerle çakışamaz.
- **Zengin metin editörü:** başlıklar, kalın/italik, listeler, bağlantılar, **▣ Görsel** (yerleşim seçmeli pencere; eklenen görsele tıklayınca düzenlenir), **❝ Kaynaklı** alıntı, YouTube gömme ve HTML kaynak düzenleme.
- **Podcast:** bölümler (özet, MP3, gömülü oynatıcı, bölüm metni, kaynaklar, kapak kaynağı) ve **⚙ Program Ayarları** (kapak, ad, açıklama, platform bağlantıları).
- **Remixler:** remixler (orijinal parça, özet, MP3, gömülü oynatıcı, remixin hikâyesi, notlar ve kaynaklar, süre, tür, BPM, kapak kaynağı, sayfa tonu) ve **⚙ Sayfa Ayarları** (kapak, ad, üst etiket, açıklama, SoundCloud / Mixcloud / Spotify / YouTube bağlantıları, ışık rengi).
- **Özel Sayfalar, Menü Yönetimi** (sürükle-bırak sıralama), **Öne Çıkan (Hero)** (manuel / otomatik / özel manşet, canlı önizleme, üst gradyan ayarı), **Hakkında** (fotoğraf üstü yazılar, vurgulu başlık, kısa tanım, vurgu rengi), **Sosyal Medya** (her hesabın simgesi, adresi ve Aktif / Pasif anahtarı, anlık "sitede görünür mü?" notu, üst menüde gösterme), **Ayarlar & Tema** (site kimliği, renk, şifre).
- **Yayın & SEO:** GitHub bağlantısı, her kaydetmede otomatik yayın, yayın durumu, site adresi, varsayılan paylaşım görseli, Google / Bing doğrulama kodları, yapay zekâ eğitimi izni, yayın öncesi kontrol listesi ve site dışında yapılacaklar.
- Her yazı, video, bölüm, remix ve sayfada **Arama & paylaşım** kartı (SEO başlığı, SEO açıklaması, paylaşım görseli) ve kapak görseli için **alt metin** alanı. Podcast bölümleri ve remixler de okunur adresle açılır (`/podcast/bolum-adi/`).
- **Yedekleme:** `.json` olarak dışa/içe aktarma, **Örnek İçerikleri Ekle**, fabrika ayarlarına dönüş.
- Mobilde tam uyumlu: açılır yan menü, kart görünümlü listeler, alttan açılan pencereler.

---

## 📚 Örnek İçerikler

Site ilk açıldığında kullanımı öğrenmek için örnek içeriklerle gelir:

- 12 YouTube videosu, 7 blog yazısı, 6 podcast bölümü, 6 remix, 2 özel sayfa (Ekipmanlar, İletişim) ve örnek Hakkında metni.
- Örneklerin çoğu **Müzik** alt kategorisinde; **Gıda** ve **Gündem** alt kategorilerinde birer örnek yazı var.
- **"Bu Site Nasıl Kullanılır?"** rehber yazısı, her özelliğin panelde nasıl yapıldığını anlatırken o özelliği kendi üzerinde gösterir.
- **Örnek içerikler hiçbir zaman yayına gönderilmez**; yalnızca panelde (başlığın yanında **Örnek** etiketiyle) ve bilgisayarınızdaki önizlemede görünür. Sitenin ilk sürümünden kalan örnekler de başlıklarından tanınır ve yayına gönderilmez.
- Örnekler panelden tek tek ya da **Yayın & SEO → Örnek içerikleri sil** ile hepsi birden silinebilir; **Yedekleme → Örnek İçerikleri Ekle** ile geri getirilebilir. Kendi içerikleriniz bu işlemlerden etkilenmez.
- Örnekler `js/ornek-icerik.js` dosyasındadır. Bu dosya kaldırılırsa site boş başlar.
- Örnek videolar başka YouTube kanallarına, görseller picsum.photos'a, ses dosyaları SoundHelix'e aittir; yayına almadan önce kendi içeriğinizle değiştirin.

---

## 🚀 Başlangıç & Kullanım

Derleme aracı veya sunucu gerekmez; saf **HTML5, CSS3 ve JavaScript**.

1. `index.html` dosyasını tarayıcıda açın.
2. Kontrol paneli için `admin.html` dosyasını açın — **varsayılan şifre:** `admin`.
3. İçerik ekleyin, menüyü düzenleyin, temayı kişiselleştirin. Değişiklikler panelin **Önizleme** ekranında ve açık olan sitede anında görünür.

> Dosyalar güncellendikten sonra tarayıcının eski sürümü göstermemesi için sayfayı bir kez **Ctrl+F5** ile yenileyin.

---

## 💾 Veri Saklama

- Panelde girdiğiniz içerik tarayıcının `localStorage` alanında tutulur; tarayıcı verileri temizlenirse panel içeriği silinir — **düzenli olarak yedek alın** (Panel → Yedekleme).
- Yayındaki içeriğin bir kopyası GitHub deposundaki `icerik` dalında da durur (`veri/site.json` + `veri/gorsel/`). Taslaklar oraya gönderilmez; yalnızca panelde ve yedek dosyasında bulunur.
- Eski sürümden gelen veriler otomatik dönüştürülür: ayrı tutulan videolar Yazılar'a taşınır, podcast bölümlerine ve remixlere okunur adres verilir; eski `#/yazi/…`, `#/bolum/…`, `#/remix/…`, `#/video/…` bağlantıları yeni adreslere yönlenir.

---

## 📁 Dosya Yapısı

```
akcanakdag.com/
├── index.html            # Site (önizlemede doğrudan, yayında her sayfanın şablonu)
├── admin.html            # Kontrol paneli (yalnızca bilgisayarınızda; yayına girmez)
├── build.js              # Yayın derleyicisi: her sayfa için hazır HTML, sitemap, robots, RSS, llms.txt
├── favicon.svg           # Site simgesi
├── README.md             # Bu belge
├── KULLANIM-KILAVUZU.md  # Ayrıntılı kullanım kılavuzu
├── .github/workflows/
│   └── yayin.yml         # GitHub Actions: siteyi derleyip GitHub Pages'te yayınlar
├── css/
│   ├── fonts.css         # Kendi sunucumuzdaki yazı tipleri
│   ├── style.css         # Site stilleri (sayfa düzenleri, mobil uyum)
│   └── admin.css         # Kontrol paneli stilleri
├── fonts/                # Bebas Neue, Fraunces, JetBrains Mono (Türkçe karakterler dahil)
└── js/
    ├── ornek-icerik.js   # Örnek videolar, yazılar, bölümler, remixler, sayfalar (yayına girmez)
    ├── store.js          # Veri katmanı (localStorage, sürüm geçişleri, yardımcılar)
    ├── render.js         # Sayfa şablonları + başlık, açıklama, paylaşım kartları, yapılandırılmış veri
    ├── app.js            # Site: yönlendirici, oynatıcı, arama
    ├── yayin.js          # Panel → GitHub gönderimi ve otomatik yayın
    └── admin.js          # Panel: içerik yönetimi, editör, menü, ayarlar, Yayın & SEO, yedekleme
```

---

## 🔎 Arama Motorları ve Yapay Zekâ (SEO & GEO)

Yayındaki site, Google'ın ve ChatGPT, Claude, Perplexity gibi yapay zekâ asistanlarının okuyabileceği şekilde hazırlanır:

- **Her içeriğin kendi adresi var:** `/videolar/video-adi/`, `/yazilar/yazi-adi/`, `/podcast/bolum-adi/`, `/remixler/remix-adi/`, `/hakkinda/`, `/sayfa/iletisim/`.
- **Her sayfa hazır HTML olarak gelir:** içerik JavaScript çalışmadan da okunur (yapay zekâ tarayıcıları JavaScript çalıştırmaz). Ziyaretçi için site yine tek sayfa gibi akar; sayfa değişince ses oynatıcı susmaz.
- **Her sayfaya özel** başlık, açıklama, kanonik adres, Open Graph / X paylaşım kartı (WhatsApp, X, LinkedIn önizlemesi).
- **Yapılandırılmış veri (schema.org):** `Person` (sosyal profillerinizle), `WebSite`, `BlogPosting`, `VideoObject` (Google video sonuçları), `PodcastSeries` / `PodcastEpisode`, `MusicRecording`, `BreadcrumbList`, `ProfilePage`; yazılardaki kaynaklar `citation` olarak.
- **Otomatik üretilen dosyalar:** `sitemap.xml` (görsellerle), `robots.txt`, `feed.xml` (RSS), `llms.txt` (yapay zekâ asistanları için site özeti), gerçek `404.html`.
- **Hız:** yazı tipleri sitenin kendi sunucusundan, görseller WebP olarak ve gerektiğinde yüklenir, YouTube oynatıcısı yalnızca tıklanınca açılır, kod güncellenince tarayıcı önbelleği yenilenir.
- **Boş sayfalar dizine girmez:** henüz içeriği olmayan liste sayfaları `noindex` olarak işaretlenir.

Kodla yapılamayan işler panelde **Yayın & SEO → Site dışında yapılacaklar** listesinde: Search Console, Bing Webmaster Tools, YouTube açıklamaları, profiller, video ve bölüm metinleri.

---

## 🚀 GitHub'a Yükleme ve Yayın (bir kez yapılır)

Site **GitHub Pages**'te ücretsiz yayınlanır. Panelde her kaydettiğinizde değişiklikler birkaç saniye içinde GitHub'a gönderilir, site yaklaşık 1 dakikada güncellenir.

1. **Depo oluşturun:** [github.com/new](https://github.com/new) → bir ad verin (ör. `akcan-site`) → **Public** (herkese açık) seçin → *Create repository*. Ücretsiz GitHub Pages için depo herkese açık olmalı; depoya yalnızca kod ve yayındaki içerik gider, taslaklar ve panel şifresi gitmez.
2. **Kodu yükleyin:** en kolayı [GitHub Desktop](https://desktop.github.com/): *File → Add local repository* → bu klasör → (depo değilse *create a repository*) → *Publish repository* (*Keep this code private* işaretini kaldırın). Web'den yüklerseniz: depo sayfasında *uploading an existing file* → bu klasördeki her şeyi sürükleyin → *Commit changes*. Yüklemeden sonra depoda `.github/workflows/yayin.yml` dosyasının bulunduğunu kontrol edin; yoksa *Add file → Create new file* ile bu adı verip dosyanın içeriğini yapıştırın.
3. **Pages'i açın:** depoda **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. **Erişim anahtarı oluşturun:** [github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new) → *Repository access: Only select repositories* → bu depo → *Permissions → Contents: Read and write* → *Generate token*. Anahtarı kopyalayın.
5. **Paneli bağlayın:** `admin.html` → **Yayın & SEO** → *Depo* (`kullanici-adi/akcan-site`) ve *Erişim anahtarı* → *Kaydet* → **Şimdi Yayınla**.

Site adresiniz `https://kullanici-adi.github.io/akcan-site/` olur. Kendi alan adınızı bağlamak için depoda **Settings → Pages → Custom domain**, ardından panelde **Yayın & SEO → Site adresi**.

> Panel (`admin.html`) yalnızca kendi bilgisayarınızda çalışır ve yayına girmez. İçerik eklemek için her zaman bu klasördeki paneli kullanın.
>
> Kodu değiştirip GitHub'a yeniden yüklediğinizde site de kendiliğinden yeniden derlenir. Panelin gönderdiği içerik ayrı bir dalda (`icerik`) durduğu için kod yüklemeleriyle çakışmaz.
