# Akcan — Kullanım Kılavuzu

Bu kılavuz, sitenin ve kontrol panelinin her özelliğini adım adım anlatır. Teknik bilgi gerektirmez.

| | |
|---|---|
| **Yayındaki site** | https://akcanx.github.io/ |
| **Kontrol paneli** | Bu klasördeki `admin.html` (yalnızca bilgisayarınızda çalışır) |
| **Bilgisayarınızdaki önizleme** | Bu klasördeki `index.html` |
| **GitHub deposu** | https://github.com/akcanx/akcanx.github.io |
| **İlk panel şifresi** | `admin` (hemen değiştirin, bkz. [Ayarlar & Tema](#16-ayarlar--tema)) |

---

## İçindekiler

1. [Temel kavramlar](#1-temel-kavramlar)
2. [Başlarken: ilk gün yapılacaklar](#2-başlarken-ilk-gün-yapılacaklar)
3. [Panele giriş ve genel kullanım](#3-panele-giriş-ve-genel-kullanım)
4. [Gösterge Paneli](#4-gösterge-paneli)
5. [Liste ekranları](#5-liste-ekranları)
6. [Formlardaki ortak alanlar](#6-formlardaki-ortak-alanlar)
7. [Zengin metin editörü](#7-zengin-metin-editörü)
8. [Videolar ve Yazılar](#8-videolar-ve-yazılar)
9. [Podcast](#9-podcast)
10. [Alt kategoriler](#10-alt-kategoriler)
11. [Remixler](#11-remixler)
12. [Özel Sayfalar](#12-özel-sayfalar)
13. [Öne Çıkan (Hero)](#13-öne-çıkan-hero)
14. [Menü Yönetimi](#14-menü-yönetimi)
15. [Hakkında](#15-hakkında)
16. [Ayarlar & Tema](#16-ayarlar--tema)
17. [Yayın & SEO](#17-yayın--seo)
18. [Yedekleme](#18-yedekleme)
19. [Örnek içerikler](#19-örnek-içerikler)
20. [Ziyaretçinin gördüğü site](#20-ziyaretçinin-gördüğü-site)
21. [Arama motorları ve yapay zekâ: otomatik yapılanlar](#21-arama-motorları-ve-yapay-zekâ-otomatik-yapılanlar)
22. [Görseller ve depolama alanı](#22-görseller-ve-depolama-alanı)
23. [Kendi alan adınızı bağlamak](#23-kendi-alan-adınızı-bağlamak)
24. [Sorun giderme](#24-sorun-giderme)
25. [Teknik ek](#25-teknik-ek)

---

## 1. Temel kavramlar

Sitenin dört parçası vardır:

| Parça | Ne işe yarar | Nerede |
|---|---|---|
| **Kontrol paneli** | İçerik ekler, düzenler, siler; ayarları yaparsınız. | `admin.html` — yalnızca bu bilgisayarda, internette değil. |
| **Önizleme** | Paneldeki her şeyi (örnek içerikler dahil) yayına göndermeden görürsünüz. | `index.html` |
| **Yayındaki site** | Ziyaretçilerin, Google'ın ve yapay zekâ asistanlarının gördüğü site. | https://akcanx.github.io/ |
| **GitHub** | Panelden gönderilen içeriği alır, siteyi derler ve yayınlar. | github.com/akcanx/akcanx.github.io |

**İçeriğiniz nerede durur?**

- Panelde girdiğiniz her şey **bu tarayıcının depolama alanında** saklanır. Tarayıcı verilerini temizlerseniz panel içeriği silinir. Bu yüzden düzenli [yedek](#18-yedekleme) alın.
- Yayında olan içeriğin bir kopyası GitHub'da da durur. **Taslaklar ve örnek içerikler** yalnızca panelde ve yedek dosyasındadır.

**Bir içerik nasıl yayına çıkar?**

1. Panelde içeriği yazıp **Kaydet**'e basarsınız.
2. Panel birkaç saniye bekler (art arda yapılan kayıtları tek gönderimde toplar) ve içeriği GitHub'a gönderir.
3. GitHub siteyi yaklaşık **1 dakikada** yeniden derleyip yayınlar.

Kendi içeriğinizin dışındaki hiçbir şey yayına gitmez: **taslaklar, örnek içerikler, panel şifresi ve GitHub erişim anahtarı** asla gönderilmez.

---

## 2. Başlarken: ilk gün yapılacaklar

- [ ] Paneli açın (`admin.html`), `admin` şifresiyle girin.
- [ ] **Ayarlar & Tema → Panel şifresi** bölümünden şifrenizi değiştirin.
- [ ] **Ayarlar & Tema**: site adı, slogan, site açıklaması, sosyal medya profilleriniz ve e-posta adresiniz.
- [ ] **Hakkında**: kendi fotoğrafınız, biyografiniz ve "Kısa tanım".
- [ ] **Podcast → ⚙ Program Ayarları** ve **Remixler → ⚙ Sayfa Ayarları**: kendi kapaklarınız, açıklamalarınız ve platform profil adresleriniz.
- [ ] **Videolar / Yazılar / Podcast → ▦ Alt Kategoriler**: alt kategorileri kendi kanallarınıza göre düzenleyin ve kanal bağlantılarını yazın (bkz. [Alt kategoriler](#10-alt-kategoriler)).
- [ ] İlk içeriğinizi ekleyin (bir video, yazı, podcast bölümü ya da remix).
- [ ] **Yayın & SEO → Yayın öncesi kontrol listesi**'ndeki uyarıları tek tek giderin.
- [ ] İsterseniz **Yayın & SEO → Örnek içerikleri sil** ile örnekleri temizleyin.
- [ ] **Yedekleme → Yedeği İndir** ile ilk yedeğinizi alın.
- [ ] Site dışı işler: Google Search Console ve Bing Webmaster Tools (bkz. [Site dışında yapılacaklar](#site-dışında-yapılacaklar)).

---

## 3. Panele giriş ve genel kullanım

### Giriş

- `admin.html` dosyasını tarayıcıda açın, şifrenizi girip **Giriş Yap →**'a basın.
- Şifre yanlışsa kart sallanır ve "Şifre hatalı." yazar.
- Giriş, tarayıcı sekmesi kapanana kadar geçerlidir. Sol alttaki **Çıkış Yap** ile çıkabilirsiniz.

> Panel şifresi yalnızca bu bilgisayardaki paneli korur. Panel internette yayınlanmadığı için asıl güvenliğiniz bilgisayarınızın kendisidir.

### Kenar çubuğu

| Grup | Bölümler |
|---|---|
| **Genel** | Gösterge Paneli |
| **İçerik** | Videolar, Yazılar, Podcast, Remixler, Özel Sayfalar |
| **Site** | Öne Çıkan (Hero), Menü Yönetimi, Hakkında, Ayarlar & Tema, Yayın & SEO, Yedekleme |

Kenar çubuğunun altında:

- **Yayın durumu rozeti** (bkz. [Yayın durumu](#yayın-durumu)). Tıklayınca Yayın & SEO açılır.
- **Siteyi Görüntüle ↗**: önizlemeyi yeni sekmede açar.
- **Çıkış Yap**.

Mobilde kenar çubuğu, sol üstteki **☰** düğmesiyle açılır.

### Kaydetme

- Her formda **Kaydet** düğmesi vardır. Klavyeden **Ctrl+S** (Mac'te **⌘+S**) ile de kaydedebilirsiniz; Menü Yönetimi'nde de çalışır.
- Kaydedilmemiş değişiklik varken başka bir bölüme geçmeye ya da sekmeyi kapatmaya çalışırsanız panel **"Kaydedilmemiş değişiklikler var"** diye uyarır.
- Kayıt ve hata mesajları sağ altta kısa bildirimler olarak görünür.
- Panel iki sekmede açıksa, birinde kaydettiğiniz değişiklik diğerine de yansır (o sırada açık bir form yoksa).

---

## 4. Gösterge Paneli

Panele girince açılan ilk ekran.

- **Selamlama** (günün saatine göre) ve **Siteyi Görüntüle ↗** düğmesi.
- **Uyarılar**:
  - "Varsayılan şifreyi kullanıyorsunuz" (şifreyi değiştirene kadar).
  - "Site henüz yayına bağlı değil" (GitHub bağlantısı kurulana kadar).
  - "Örnek içerikler yüklü" ve **"Bu Site Nasıl Kullanılır?"** rehber yazısının bağlantısı (rehber yazısı silinene kadar).
- **Sayılar**: Video, Yazı, Podcast Bölümü, Remix, Özel Sayfa, Menü Öğesi. Her kutu ilgili bölüme götürür.
- **Ana Sayfa Öne Çıkan Manşet** kartı: şu anki manşet ve **Öne Çıkanı Değiştir →**.
- **Son içerikler**: en yeni 8 içerik (tür, başlık, taslaksa "Taslak", tarih). Başlığa tıklayınca düzenleme açılır.
- **Hızlı işlemler**: Yeni video, Yeni yazı, Yeni bölüm, Yeni remix, Yeni sayfa, Öne çıkanı seç.
- **Depolama**: tarayıcıdaki kullanılan alan (yaklaşık 5 MB sınır) ve doluluk çubuğu. Bkz. [Görseller ve depolama alanı](#22-görseller-ve-depolama-alanı).

---

## 5. Liste ekranları

Videolar, Yazılar, Podcast, Remixler ve Özel Sayfalar aynı liste düzenini kullanır.

**Üst kısım**

- Bölümün adı ve açıklaması.
- **▦ Alt Kategoriler** (Videolar, Yazılar ve Podcast'te): alt kategorileri ekleme, silme ve sıralama ekranı (bkz. [Alt kategoriler](#10-alt-kategoriler)).
- **⚙ Sayfa / Program Ayarları** (Videolar, Yazılar, Podcast ve Remixler'de): sitedeki liste sayfasının üst bölümü.
- **+ Yeni …** düğmesi (ör. **+ Yeni Video**, **+ Yeni Yazı**). Liste bir alt kategoriye süzülmüşse yeni içerik o alt kategoride açılır.

**Araç çubuğu**

- **Arama kutusu**: başlıkta, alt kategori adında ve alt bilgide arar.
- **Durum filtresi**: Tümü / Yayında / Taslak (yanlarında sayılarıyla).
- **Alt kategori filtresi** (Videolar, Yazılar, Podcast): Tüm alt kategoriler / bir alt kategori / Alt kategorisiz.

**Tablo**

| Sütun | İçerik |
|---|---|
| **Başlık** | Küçük resim, başlık, alt bilgi (yeşil yazıyla alt kategori, etiketler, bölüm no, BPM…). **★** = ana sayfada öne çıkan. **ÖRNEK** = örnek içerik, yayına gitmez. |
| **Tarih** | Yayın tarihi. Listeler yeniden eskiye sıralanır. |
| **Durum** | **Yayında** / **Taslak**. Rozete tıklamak durumu anında değiştirir. |
| **İşlemler** | **Düzenle** · **↗** önizlemede aç · **⧉ Çoğalt** · **Sil** |

- **⧉ Çoğalt**: içeriğin kopyasını "(kopya)" ekiyle ve **taslak** olarak oluşturur. Bağlantısının sonuna `-kopya` eklenir. Bir örnek içeriği kendi içeriğinize dönüştürmenin yolu budur (bkz. [Örnek içerikler](#19-örnek-içerikler)).
- **Sil** onay ister ve geri alınamaz. Silinen bir özel sayfanın menü öğesi de kalkar.

---

## 6. Formlardaki ortak alanlar

Form iki sütundan oluşur: solda içeriğin kendisi, sağda kartlar halinde **Yayın**, **Alt kategori** (videolar, yazılar ve podcast bölümlerinde), **Kapak**, **Görünüm**, **Etiketler**, **Arama & paylaşım** ayarları.

Formun üstünde **← Listeye dön**, **Görüntüle ↗** (kayıtlı içerikte) ve **Kaydet**; sağ sütunun altında **Kaydet** ve **Bu içeriği sil** vardır.

### Başlık

Zorunludur. Başlıksız kayıt yapılamaz.

### Bağlantı (slug)

Sayfanın adresidir. Örneğin `/yazilar/bir-remix-nasil-dogar/`.

- Başlığı yazarken kendiliğinden oluşur: Türkçe harfler sadeleşir, boşluklar `-` olur.
- Bağlantıyı elle değiştirirseniz artık başlığı takip etmez.
- Aynı bağlantı başka bir içerikte varsa sonuna otomatik olarak `-2`, `-3` eklenir.
- **Yayındaki bir içeriğin bağlantısını değiştirmeyin.** Eski adres çalışmaz ve Google'daki sıralamasını kaybeder.

### Yayın kartı

| Alan | Açıklama |
|---|---|
| **Yayında** | Kapalıysa içerik **taslaktır**: ne önizlemede ne yayında görünür, yalnızca panelde durur. |
| **Öne çıkar** | Açarsanız içerik ana sayfanın en üstündeki büyük manşete yerleşir. Aynı anda yalnızca bir içerik öne çıkabilir; yenisini seçince eskisi kendiliğinden kapanır. Ayrıntılar: [Öne Çıkan (Hero)](#13-öne-çıkan-hero). |
| **Yayın tarihi** | Listelerdeki sıralamayı belirler. Gelecek bir tarih verirseniz içerik yine hemen yayınlanır, yalnızca listede en üstte durur. |

### Görsel alanları (kapak, paylaşım görseli…)

- Kutuya tıklayın ya da **Yükle**'ye basıp bilgisayarınızdan görsel seçin.
- Ya da alttaki kutuya bir görsel **bağlantısı** (`https://…`) yapıştırın.
- **×** görseli kaldırır.
- Yüklenen görseller otomatik olarak küçültülür ve sıkıştırılır. Bkz. [Görseller ve depolama alanı](#22-görseller-ve-depolama-alanı).

### Kapak açıklaması (alt metin)

Görselde ne olduğunu bir cümleyle yazın, örneğin "Stüdyo masasında MIDI klavye ve iki monitör". Google Görseller ve ekran okuyucular bunu kullanır. Boşsa başlık kullanılır.

### Sayfa tonu / Işık rengi

- Renk seçiciyle bir renk seçin ya da `#3A9FF0` gibi bir kod yazın.
- **Otomatik** düğmesi alanı boşaltır. Boşsa sayfa tonu kapaktan ya da video karesinden kendiliğinden seçilir.

### Etiketler / kavramlar

- Yazıp **Enter**'a ya da **virgüle** basın; birden fazla etiketi virgülle ayırarak tek seferde ekleyebilirsiniz.
- Etiketin **×** düğmesi siler. Kutu boşken **Backspace** son etiketi siler.
- Sitede:
  - İlk üç etiket sayfanın üstündeki **konum satırında** görünür.
  - Hepsi sayfanın sonunda tıklanabilir **kavram kutuları** olarak görünür; tıklanınca site içi arama açılır.
  - Ortak etiketi olan içerikler birbirinin **İlgili içerik** listesinde çıkar.

### Kaynaklar (Notlar ve kaynaklar)

Her satıra bir kaynak yazın:

```
Başlık | https://adres
Başka bir kaynak | https://adres | kısa not
```

Sayfanın sonunda açılır-kapanır bir liste olarak görünür. Ayrıca arama motorlarına "bu içeriğin kaynakları" olarak bildirilir.

### Arama & paylaşım kartı (her içerikte)

| Alan | Açıklama |
|---|---|
| **SEO başlığı** | Google sonucundaki mavi başlık. Boşsa içerik başlığı kullanılır. 60 karakteri geçmemesi önerilir. |
| **SEO açıklaması** | Arama sonucunda başlığın altındaki metin. Boşsa özetten alınır. 150–160 karakter önerilir. |
| **Paylaşım görseli** | WhatsApp, X, LinkedIn önizlemesinde görünen görsel. Boşsa kapak ya da video karesi kullanılır. 1200×630 önerilir. |

---

## 7. Zengin metin editörü

Yazı içeriği, bölüm metni, remix hikâyesi, özel sayfa içeriği ve biyografi bu editörle yazılır.

| Düğme | İşlev |
|---|---|
| **B** / *I* / U | Kalın (Ctrl+B), italik (Ctrl+I), altı çizili |
| **H2** / **H3** | Başlık / alt başlık |
| **¶** | Normal paragraf |
| **❝** | Alıntı bloğu |
| **❝ Kaynaklı** | Alıntı + altında kimin söylediği (pencere açılır: *Alıntı*, *Kaynak*) |
| **• Liste** / **1. Liste** | Madde işaretli / numaralı liste |
| **—** | Ayraç çizgisi |
| **Bağlantı** / **⊘** | Bağlantı ekle / kaldır. Önce metni seçin; seçim yoksa adresin kendisi bağlantı olur. |
| **▣ Görsel** | Metin arası görsel ekle (aşağıya bakın) |
| **▶ Video** | Metnin içine YouTube videosu göm (bağlantıyı yapıştırın) |
| **Tx** | Biçimi temizle |
| **↶** / **↷** | Geri al / yinele |
| **</>** | HTML kaynağını düzenle (bilenler için). Tekrar basınca normal görünüme döner. |

### Metin arası görseller

**▣ Görsel**'e basınca açılan pencerede:

- **Görsel**: yükleyin ya da bağlantı yapıştırın.
- **Yerleşim**:
  - *Ortada*: metin sütununda.
  - *Sağa yaslı*: metin görselin solundan akar.
  - *Sola yaslı*: metin görselin sağından akar.
  - *Geniş*: metin sütunundan taşar.
- **Açıklama**: görselin altında görünür.
- **Kaynak / lisans**: açıklamanın altında küçük yazıyla, örneğin "Fotoğraf: …, Wikimedia Commons · CC BY-SA 4.0".

Eklenen görsele **tıklayınca** düzenleme penceresi açılır. Oradan değiştirebilir ya da **Kaldır** ile silebilirsiniz.

Mobilde yaslı görseller tam genişliğe geçer.

### Başka yerden yapıştırmak

Word, Google Docs ya da bir web sayfasından metin yapıştırdığınızda yazı tipleri, renkler ve gereksiz biçimler temizlenir. Yalnızca başlık, kalın, italik, liste, bağlantı, alıntı ve görseller kalır. Düz metinde boş satırlar paragraf olur.

---

## 8. Videolar ve Yazılar

YouTube videolarınız ve blog yazılarınız sitede **iki ayrı sekmede** yayınlanır. Panelde de iki ayrı bölümdür:

| Panel bölümü | Sitede | Adres | Zorunlu |
|---|---|---|---|
| **▶ Videolar** → **+ Yeni Video** | **Videolar** sekmesi. Sayfanın üstünde YouTube oynatıcı; listelerde küçük resmin ortasında **yarı saydam oynat işareti**. | `/videolar/video-adi/` | Geçerli bir YouTube bağlantısı |
| **✎ Yazılar** → **+ Yeni Yazı** | **Yazılar** sekmesi. Sayfanın üstünde kapak görseli; listelerde işaretsiz. | `/yazilar/yazi-adi/` | Kapak görseli |

Ana sayfadaki akışta ise videolar ve yazılar diğer içeriklerle birlikte, tarih sırasıyla görünür.

### Alanlar

| Alan | Açıklama |
|---|---|
| **YouTube video bağlantısı** (video) | `https://www.youtube.com/watch?v=…`, `youtu.be/…` ya da Shorts bağlantısı. Yapıştırınca küçük resim görünür; başlık boşsa videonun adı YouTube'dan otomatik gelir. |
| **Kapak görseli** + **alt metin** (yazı) | Yazının üstünde ve listelerde küçük resim olarak görünür. |
| **Özet** | Sayfanın başında büyük italik giriş olarak, listelerde ve manşette görünür. Arama sonucunda açıklama olur. |
| **İçerik** | Zengin metin. **Videoda, videonun yazıya dökülmüş metnini buraya ekleyin**: arama motorları ve yapay zekâ videoyu izleyemez, bu metni okur. |
| **Notlar ve kaynaklar** | Bkz. [Kaynaklar](#kaynaklar-notlar-ve-kaynaklar). |
| **Görsel kaynakları ve lisanslar** | Her satıra bir görsel kaynağı; isteğe bağlı olarak `\| bağlantı`. Sayfanın sonunda ayrı bir açılır listede görünür. |
| **Alt kategori** | Sağ sütunda; içeriğin sekme içindeki alt kategorisi (ör. Gıda). Bkz. [Alt kategoriler](#10-alt-kategoriler). |
| Yayın, Görünüm (sayfa tonu), Etiketler, Arama & paylaşım | Bkz. [Ortak alanlar](#6-formlardaki-ortak-alanlar). |

### ⚙ Sayfa Ayarları (Videolar ve Yazılar sayfalarının üstü)

Her iki bölümün kendi ayarı vardır:

- **Sayfa başlığı** (varsayılan: "Videolar" / "Yazılar").
- **Açıklama**: başlığın altında görünür.
- **Işık rengi**: sayfanın üstündeki yumuşak renkli ışık.

### Sitede video/yazı sayfası

- **Üst bölüm**: solda video (ya da kapak); sağda başlık, tarih, kelime sayısı ve videolarda **YouTube'da izle** bağlantısı.
- **Video oynatıcısı**: hızlı açılması için önce yalnızca video karesi gösterilir; YouTube oynatıcısı tıklanınca yüklenir.
- **Kaydırınca**: video küçük bir pencerede sabit kalır.
  - Masaüstü: metnin solunda.
  - Tablet: sağ altta.
  - Mobil: menünün hemen altında.
  - Penceredeki **×** videoyu eski yerine döndürür.
- **Sayfa tonu**: kapaktan ya da videodan otomatik seçilir; panelden de belirlenebilir.
- **Metin**: büyük italik özet, büyük baş harfle başlayan metin, metin arası görseller ve kaynaklı alıntılar.
- **Sayfa sonu**: Notlar ve kaynaklar, Görsel kaynakları ve lisanslar, kavram kutuları, İlgili içerik (en fazla 6), önceki / sonraki kartları.
- **Gezinme**: menünün altında konum satırı (Videolar ya da Yazılar › alt kategori › etiketler, sağda aynı sekmedeki önceki/sonraki); sayfanın en üstünde okuma ilerleme çubuğu.

---

## 9. Podcast

### Bölüm alanları

| Alan | Açıklama |
|---|---|
| **Bölüm başlığı** | Zorunlu. |
| **Özet** | Bölüm sayfasında başlığın altında italik. |
| **Ses dosyası bağlantısı (MP3)** | Sitedeki oynatıcıda çalınır. Podcast barındırma servisinizden (Anchor/Spotify for Creators, Buzzsprout, Megaphone…) alınan doğrudan MP3 bağlantısı. |
| **Gömülü oynatıcı** | İsteğe bağlı: Spotify, SoundCloud, Mixcloud ya da YouTube bağlantısı. Sayfada gömülü oynatıcı olarak görünür. |
| **Bölüm metni** | Bölümün okunabilir hali: görseller ve alıntılarla. Arama motorları ve yapay zekâ sesi dinleyemez, bu metni okur. |
| **Kaynaklar** | Her satıra `Başlık \| Bağlantı`. |
| **Yayın** kartı | Yayında, Öne çıkar, Tarih, **Bölüm no** (yeni bölümde bir sonraki numara otomatik gelir), **Süre** ("32 dk", "1 sa 5 dk" ya da "45:30"), Bağlantı. |
| **Kapak** kartı | Kare kapak, alt metin, **kapak görseli kaynağı** (kapağın altında küçük yazıyla görünür). |
| **Alt kategori** kartı | Bölümün alt kategorisi. Bkz. [Alt kategoriler](#10-alt-kategoriler). |
| Görünüm, Etiketler, Arama & paylaşım | Ortak alanlar. |

### ⚙ Program Ayarları (Podcast sayfasının üstü)

Program adı, üst etiket (ör. "Podcast · Her Pazartesi"), açıklama, alt not, buton metni (varsayılan "Oku + Dinle"; en son bölüme götürür), kare program kapağı, **Spotify / Apple Podcasts / YouTube** bağlantıları ve ışık rengi.

### Sitede

- **Podcast sayfası**: kare kapak, üst etiket, program adı, açıklama, "Dinle: Spotify · Apple Podcasts · YouTube", alt not, "→ Oku + Dinle". Altında **Bölümler** listesi: yuvarlak oynat düğmesi, bölüm numarası, başlık, alt kategori, tarih ve süre. Oynat düğmesi bölümü sayfadan ayrılmadan çalar. "Bölümler" yazısının yanında alt kategori düğmeleri (**Hepsi · Müzik · …**) durur; bkz. [Alt kategoriler](#10-alt-kategoriler).
- **Bölüm sayfası**: tonlu üst bölüm, çerçeveli kapak ve kaynağı, başlık, italik özet, tarih · süre · kelime sayısı. Başlığın üstünde program adı ve alt kategori bağlantısı. Altında **ses çubuğu**: kaydırınca menünün altına yapışır. Sonra gömülü oynatıcı, bölüm metni, etiketler, kaynaklar, ilgili içerik, önceki/sonraki.

---

## 10. Alt kategoriler

Farklı kanallarda ürettiğiniz içerikleri (ör. bir **yemek hikâyeleri** kanalı, **gündemi eleştirdiğiniz** ayrı bir kanal) aynı sekmede ama kendi bölümünde paylaşmak için. **Videolar**, **Yazılar** ve **Podcast** sekmelerinin her birinin kendi alt kategori listesi vardır. Başlangıçta üçünde de **Müzik · Gıda · Gündem** hazır gelir; adlarını değiştirebilir, silebilir, yenilerini ekleyebilirsiniz.

### Panelde: ▦ Alt Kategoriler

**Videolar**, **Yazılar** ya da **Podcast** listesinin üstündeki **▦ Alt Kategoriler** düğmesine basın. (Aynı ekrana sekmenin **⚙ Sayfa / Program Ayarları**'ndaki "Alt kategoriler" kartından da gidilir.)

| İşlem | Nasıl |
|---|---|
| **Eklemek** | **+ Alt kategori ekle** → alanları doldurun → **Kaydet**. |
| **Silmek** | Satırdaki kırmızı **×** → onaylayın → **Kaydet**. İçindeki içerikler **silinmez**, alt kategorisiz kalır (onay penceresi kaç içeriğin etkileneceğini söyler). |
| **Sıralamak** | **↑ ↓** düğmeleri → **Kaydet**. Sitedeki düğmeler bu sırayla dizilir. |
| **İçeriklerini görmek** | Satırdaki **"3 içerik"** rozeti listeyi o alt kategoriye süzer. İçeriği olmayanlarda **Boş** yazar. |

Değişiklikler **Kaydet**'e basınca uygulanır; kaydetmeden ayrılmak isterseniz panel uyarır. **Ctrl+S** de çalışır.

**Alanlar**

| Alan | Açıklama |
|---|---|
| **Ad** | Zorunlu. Sitedeki düğmede ve alt kategori sayfasının başlığında görünür. |
| **Bağlantı** | Alt kategori sayfasının adresi: `/yazilar/gida/`. Boş bırakılırsa addan oluşturulur. Aynı sekmede başka bir alt kategori ya da içerik aynı bağlantıyı kullanıyorsa sonuna `-2` eklenir ve bildirimle söylenir. |
| **Açıklama** | Alt kategori sayfasında başlığın altında görünür; arama sonucunda açıklama olur. Boşsa içeriklerin başlıklarından bir açıklama üretilir. |
| **Kanal bağlantısı** | Bu içerikleri yayınladığınız diğer kanal ya da hesap (`https://` ile başlamalı). Sayfada adresine göre **"YouTube kanalına git ↗"**, **"Instagram hesabına git ↗"**, **"Spotify'da dinle ↗"** gibi bir bağlantı olarak görünür. |

Ekranın üstündeki **Sitede görünüşü** kartı düğmelerin sitedeki sırasını gösterir; soluk olanların yayında içeriği yoktur.

### İçeriği bir alt kategoriye koymak

- Her video, yazı ve podcast bölümü formunun sağ sütununda **Alt kategori** kartı vardır: **— Yok —** ya da sekmenin alt kategorilerinden biri. Bir içerik tek bir alt kategoride olur; etiketler ayrıca kullanılmaya devam eder.
- Liste süzülmüşken (ör. Gıda) basılan **+ Yeni Yazı**, yeni yazıyı doğrudan o alt kategoride açar.
- Listelerdeki **Tüm alt kategoriler** kutusu tabloyu bir alt kategoriye ya da **Alt kategorisiz** içeriklere süzer; alt kategorinin adı başlığın altında yeşil yazılır.

### Sitede

- **Düğmeler**: Videolar ve Yazılar'da başlığın altında, Podcast'te **Bölümler** yazısının yanında **Hepsi · Müzik · Gıda · Gündem** (yanlarında içerik sayıları). Mobilde tek satırdır, yana kaydırılır.
- **Alt kategori sayfası** (ör. `/yazilar/gida/`): üstte sekmeye dönüş bağlantısı (**← Yazılar**), büyük başlık, açıklama ve kanal bağlantısı; altında yalnızca o alt kategorinin içerikleri. Etkin düğme vurgulanır.
- **Liste satırlarında** ve ana sayfa akışında alt kategorinin adı etiketlerin önünde, vurgu renginde görünür.
- **İçerik sayfasında** konum satırı: **Yazılar › Gıda › etiketler**; alt kategoriye tıklanınca o sayfa açılır.
- **Boş alt kategoriler gizlenir**: yayında içeriği olmayan alt kategorinin ne düğmesi ne de sayfası vardır. Örnek içerikler yayına gitmediği için, yayındaki sitede bir alt kategori ancak ona kendi içeriğinizi koyduğunuzda görünür.
- Alt kategori sayfaları site haritasına, site içi aramaya ve `llms.txt` dosyasına (kanal bağlantılarıyla birlikte) kendiliğinden eklenir.

---

## 11. Remixler

Remixler sekmesi Podcast sekmesinin ikizidir: aynı düzen, aynı oynatıcı.

### Remix alanları

| Alan | Açıklama |
|---|---|
| **Remix adı** | Zorunlu. Ör. "Kıyı Işıkları (Akcan Remix)". |
| **Orijinal parça / sanatçı** | Ör. "Sanatçı – Şarkı adı". Özet yoksa başlığın altında italik, varsa bilgi satırında "Orijinal: …" olarak görünür. |
| **Özet** | Başlığın altında italik; arama sonucunda açıklama. |
| **Ses dosyası bağlantısı (MP3)** | Remix sayfasındaki ses çubuğunda ve listedeki oynat düğmesinde çalınır. |
| **Gömülü oynatıcı** | SoundCloud, Mixcloud, Spotify ya da YouTube bağlantısı. |
| **Remixin hikâyesi** | Fikir, kullanılan sesler, prodüksiyon notları; görsel ve alıntılarla. |
| **Notlar ve kaynaklar** | Her satıra `Başlık \| Bağlantı`. |
| **Yayın** kartı | Yayında, Öne çıkar, Tarih, **Süre** ("6:48"), Bağlantı. |
| **Detaylar** kartı | **Tür** (ör. Deep House), **BPM**. |
| **Kapak** kartı | Kare kapak, alt metin, kapak görseli kaynağı. |
| Görünüm, Etiketler, Arama & paylaşım | Ortak alanlar. |

### ⚙ Sayfa Ayarları (Remixler sayfasının üstü)

Sayfa adı, üst etiket (ör. "Remix · Edit · Bootleg"), açıklama, alt not, buton metni (varsayılan "Son Remixi Dinle"), kare sayfa kapağı, **SoundCloud / Mixcloud / Spotify / YouTube** bağlantıları ve ışık rengi.

> Platform alanlarına profilinizin tam adresini yazın (ör. `https://soundcloud.com/kullaniciadiniz`). Boş bıraktığınız platform sitede görünmez.

### Sitede

- **Remixler sayfası**: Podcast sayfasıyla aynı üst bölüm; altında **Parçalar** listesi (oynat düğmesi, remix adı, tür · BPM · tarih).
- **Remix sayfası**: bölüm sayfasıyla aynı; bilgi satırında orijinal parça · tarih · süre · BPM, yapışan ses çubuğu, hikâye, kaynaklar, ilgili içerik, önceki/sonraki.

---

## 12. Özel Sayfalar

İletişim, Ekipmanlar, Etkinlikler gibi istediğiniz kadar sayfa oluşturabilirsiniz. Adresleri `/sayfa/bağlantı/` biçimindedir.

| Alan | Açıklama |
|---|---|
| **Sayfa başlığı** | Zorunlu. |
| **Alt başlık** | İsteğe bağlı, başlığın altında. |
| **Sayfa içeriği** | Zengin metin. |
| **Yayında**, **Öne çıkar**, **Bağlantı** | Ortak alanlar. |
| **Menüde göster** | Açıksa sayfa üst menüye otomatik eklenir, kapatırsanız çıkarılır. Sayfanın bağlantısını değiştirirseniz menü öğesi de güncellenir. |
| **Kapak görseli** + alt metin | İsteğe bağlı. |
| Arama & paylaşım | Ortak alanlar. |

---

## 13. Öne Çıkan (Hero)

Ana sayfanın en üstündeki tam genişlikteki büyük manşet.

### En üstte: Canlı Manşet Önizlemesi

Yaptığınız her değişiklik burada anında görünür.

### Manşet Gösterim Modu

| Mod | Ne gösterir |
|---|---|
| **📌 Mevcut İçeriklerden Seç (Manuel)** | Seçtiğiniz bir video, yazı, bölüm, remix ya da sayfa. |
| **⚡ En Son Eklenen İçerik (Otomatik)** | Her zaman en son yayınlanan içerik (yazı, video, podcast ya da remix). |
| **✍️ Bağımsız Özel Manşet** | Sitedeki bir içeriğe bağlı olmayan, kendi başlığınız, görseliniz ve bağlantınız. |

### Manuel modda seçim

- Filtreler: Tümü, Videolar, Blog yazıları, Podcast, Remixler, Sayfalar.
- Başlıkta arama yapılabilir.
- Bir karta ya da **Öne Çıkar** düğmesine tıklayın; seçilen kartta **★ Seçildi** yazar.

İçerik formundaki **Öne çıkar** anahtarı da aynı işi yapar ve modu Manuel'e alır.

### Üst Bilgi Paneli Siyah Gradyanı

- Menünün manşet görseli üzerinde rahat okunması için yukarıdan aşağı süzülen karartma.
- Açma/kapama anahtarı ve **%10–%100** arası opaklık ayarı var. Aynı ayar **Ayarlar & Tema**'da da bulunur.

### İnce ayarlar (isteğe bağlı)

| Alan | Açıklama |
|---|---|
| **Üst Rozet / Etiket Metni** | Ör. "Editörün Seçimi". Boşsa "Öne çıkan video", "Son remix" gibi otomatik yazılır. |
| **Buton Metni** | Boşsa türe göre İzle / Oku / Dinle / İncele. |
| **Özel Manşet Başlığı / Özeti** | Boşsa içeriğin kendi başlığı ve özeti kullanılır. |
| **Özel Kapak Görseli** | Boşsa içeriğin kapağı ya da video karesi; o da yoksa Ayarlar'daki varsayılan manşet görseli. |
| **Yönlendirme Bağlantısı** | Yalnızca Özel Manşet'te. `https://…` ya da site içi adres (ör. `#/yazilar`). |

Özel Manşet için en az bir başlık ya da görsel gerekir. **Değişiklikleri Geri Al** son kayda döner; **Öne Çıkan Manşeti Kaydet** kaydeder.

---

## 14. Menü Yönetimi

Sitenin üst menüsü (ve alt bilgideki "Menü" listesi).

- **Canlı önizleme**: menünün görünen hali.
- Her satırda:
  - **⋮⋮** tutamacı: sürükleyerek sıralama.
  - **Ad**: menüde görünen yazı.
  - **Tür**: Ana Sayfa, Videolar, Yazılar, Podcast, Remixler, Hakkında, Özel Sayfa, Dış Bağlantı.
  - **Hedef**:
    - Standart sayfalarda otomatiktir (ör. `#/podcast`).
    - Özel Sayfa'da listeden sayfa seçilir.
    - Dış Bağlantı'da adres yazılır ve isterseniz **Yeni sekme** işaretlenir.
  - **Görünür**: işareti kaldırınca öğe silinmeden gizlenir.
  - **↑ ↓**: bir sıra yukarı/aşağı taşır. **×**: menüden kaldırır.
- Ekleme düğmeleri: **+ Dış bağlantı ekle**, **+ Özel sayfa bağla**, **▤ Yeni sayfa oluştur**, ayrıca menüde eksik olan standart sayfalar için (ör. **+ Hakkında**).
- **Menüyü Kaydet** (ya da Ctrl+S). Her öğenin adı olmalı; özel sayfa öğesinde sayfa, dış bağlantıda adres seçilmiş olmalı.
- **Değişiklikleri geri al**: son kayda döner.

> Bir sekmenin (ör. Remixler) içeriği yoksa ve menüde de yoksa o sayfa yayında oluşturulmaz.

---

## 15. Hakkında

Sitenin Hakkında sayfası (`/hakkinda/`): tam ekran fotoğraf, üzerinde iki yana ayrılmış büyük italik yazı, altında vurgu renginde ortalanmış başlık ve biyografi.

| Alan | Açıklama |
|---|---|
| **Ad / Sahne adı** | Sayfanın başlığı; arama motorlarına da sitenin sahibi olarak bu ad bildirilir. |
| **Kısa tanım** | Kim olduğunuzu anlatan tek cümle (ör. "Müzik prodüktörü, DJ ve podcast yapımcısı"). **Sayfada görünmez**; Google ve yapay zekâ asistanları sizi bu tanımla tanır. Mutlaka doldurun. |
| **Fotoğraf üstü yazı — sol / sağ** | Fotoğrafın iki yanındaki büyük italik yazılar. Satır atlamak için Enter. |
| **Vurgulu başlık** | Fotoğrafın altında, vurgu renginde ortalanmış büyük başlık. |
| **Biyografi** | Zengin metin. H2 ara başlıklarla bölümlere ayırın; bağlantılar vurgu renginde görünür. |
| **Kapak fotoğrafı** | Yatay, yüksek çözünürlüklü bir portre; yüzünüz üst-orta bölgede kalmalı. |
| **Vurgu rengi** | Vurgulu başlığın ve bağlantıların rengi (sitenin genel vurgu renginden bağımsız). |

Sosyal medya bağlantıları burada değil, **Ayarlar & Tema**'dadır.

---

## 16. Ayarlar & Tema

### Site kimliği

| Alan | Açıklama |
|---|---|
| **Site adı** | Zorunlu. Menüde, alt bilgide, tarayıcı sekmesinde ve paylaşım kartlarında. |
| **Slogan** | Alt bilgide ve ana sayfanın tarayıcı başlığında. |
| **Site açıklaması (SEO)** | Ana sayfanın arama sonucu açıklaması; RSS ve yapay zekâ özetinde (`llms.txt`) de kullanılır. |
| **Alt bilgi metni** | `{yil}` yazarsanız güncel yıl otomatik gösterilir: `© {yil} Akcan. Tüm hakları saklıdır.` |
| **Varsayılan manşet görseli** | Öne çıkan içeriğin kapağı yoksa manşette kullanılır. |
| **İstatistik bandını göster** | Ana sayfadaki "… video, … yazı, … podcast bölümü ve … remix" cümlesi. |

### Manşet Üst Bilgi Gradyanı

Öne Çıkan bölümündeki karartma ayarının aynısı (açma/kapama ve opaklık).

### Sosyal medya

YouTube, Instagram, X, Spotify, SoundCloud ve E-posta.

- Alt bilgideki **Takip Et** listesinde görünür. Arama motorlarına da "aynı kişinin profilleri" olarak bildirilir.
- Profilinizin **tam adresini** yazın (ör. `https://www.youtube.com/@kanaliniz`). `https://www.youtube.com/` gibi profil olmayan adresler sitede gösterilmez.
- Boş bırakılanlar görünmez.

### Renk teması

- Sekiz hazır renk vardır: Asit yeşili (varsayılan), Turuncu, Camgöbeği, Pembe, Altın, Lavanta, Nane, Krem.
- Ya da renk seçici veya `#RRGGBB` koduyla kendi renginizi seçin.
- Önizleme kutusu sonucu gösterir. Renk, sitedeki bütün vurgularda (menü, düğmeler, bağlantılar, oynatıcı) kullanılır.

### Panel şifresi

**Mevcut şifre**, **Yeni şifre** (en az 4 karakter) ve **tekrarı** girip **Şifreyi Değiştir**'e basın.

En alttaki **Ayarları Kaydet**, şifre dışındaki her şeyi kaydeder.

---

## 17. Yayın & SEO

### Yayın durumu

Sayfanın en üstündeki kart ve kenar çubuğundaki rozet şu durumlardan birini gösterir:

| Durum | Anlamı |
|---|---|
| **Yayına bağlı değil** | GitHub bağlantısı kurulmamış. |
| **Değişiklikler birkaç saniye içinde gönderilecek… / Yayınlanıyor…** | Gönderim sürüyor. Bu sırada paneli kapatmaya çalışırsanız tarayıcı uyarır. |
| **✓ Gönderildi / Yayında · saat** | Gönderim başarılı. GitHub siteyi yaklaşık 1 dakikada günceller. |
| **✓ Yayındaki site güncel** | Değişen bir şey yoktu, gönderim yapılmadı. |
| **✕ Gönderilemedi / Yayın hatası** | Sebebi kartta yazar (bkz. [Sorun giderme](#24-sorun-giderme)). |
| **Otomatik yayın kapalı** | Bağlantı kurulu ama "Her kaydetmede otomatik yayınla" kapalı. |

Kartın altındaki bağlantılar:

- **GitHub'da ilerlemeyi gör ↗**: GitHub'daki derleme adımlarını gösterir.
- **Siteyi aç ↗**: yayındaki siteyi açar.

Sağ üstteki **⇪ Şimdi Yayınla** gönderimi hemen başlatır.

### GitHub bağlantısı

Bu site için bağlantı kuruldu. Değerler şöyle:

- **Depo**: `akcanx/akcanx.github.io`
- **Erişim anahtarı**: GitHub'da oluşturduğunuz `github_pat_…` ile başlayan anahtar. **Yalnızca bu tarayıcıda saklanır**; yedeğe ve siteye girmez.
- **Her kaydetmede otomatik yayınla**: açık olması önerilir. Kapalıysa yalnızca **Şimdi Yayınla** ile gönderilir.
- **Bağlantıyı test et**: depoya erişilip erişilemediğini ve sitenin adresini gösterir.

**Yeni erişim anahtarı gerekirse** (yeni bilgisayar, anahtarın silinmesi, süresinin dolması):

1. https://github.com/settings/personal-access-tokens/new adresini açın.
2. **Token name**: "Akcan panel". **Expiration**: istediğiniz süre ya da *No expiration*.
3. **Repository access** → *Only select repositories* → `akcanx/akcanx.github.io`.
4. **Permissions → Repository permissions → Contents: Read and write**.
5. **Generate token**'a basın, anahtarı kopyalayıp panelde **Erişim anahtarı** alanına yapıştırın.
6. **Bağlantıyı test et** → **Kaydet**.

> Anahtarı kimseyle paylaşmayın. Ele geçerse GitHub'da **Settings → Developer settings → Personal access tokens** bölümünden silip yenisini oluşturun.

### Arama motorları ve yapay zekâ ayarları

| Alan | Açıklama |
|---|---|
| **Site adresi** | Kendi alan adınızı bağladıysanız yazın (bkz. [bölüm 23](#23-kendi-alan-adınızı-bağlamak)). Boşsa GitHub Pages adresi kullanılır. |
| **Varsayılan paylaşım görseli** | Kendi görseli olmayan sayfalar paylaşıldığında görünür. 1200×630 önerilir. |
| **Google Search Console doğrulama kodu** | HTML etiketinin `content="…"` değeri; etiketin tamamını da yapıştırabilirsiniz. |
| **Bing Webmaster Tools doğrulama kodu** | Bing'de "Google Search Console'dan içe aktar" seçerseniz gerekmez. |
| **Yapay zekâ eğitimine izin ver** | Kapatırsanız içerikleriniz yapay zekâ modellerinin eğitiminde kullanılmaz (GPTBot, ClaudeBot, Google-Extended vb. engellenir). ChatGPT, Claude ve Perplexity aramalarında görünmeye devam edersiniz. En geniş görünürlük için açık bırakın. |

**SEO Ayarlarını Kaydet** ile kaydedin.

### Yayın öncesi kontrol listesi

Panel sitenizi tarar ve her maddeyi ✓ (tamam), ! (uyarı) ya da i (bilgi) olarak gösterir. Maddelerin yanındaki **Düzenle →** ilgili bölüme götürür.

- GitHub bağlantısı.
- Kendi içerikleriniz: kaç tanesinin yayında olduğu.
- **Örnek içerikler**: kaç tanesinin panelde durduğu. **Örnek içerikleri sil** düğmesi hepsini tek seferde siler; kendi içerikleriniz değişmez.
- Hakkında sayfası: örnek metin duruyor mu?
- Kısa tanım.
- Sosyal medya profilleri: profil olmayan adresler var mı?
- E-posta adresi: örnek adres (`@ornek.com`) duruyor mu?
- Örnek görseller: yayına giden ayarlarda ya da içeriklerde picsum.photos görseli var mı (manşet görseli, podcast/remix kapağı, Hakkında fotoğrafı…)?
- Özetler: özeti olmayan içerik sayısı.
- Kapak açıklamaları: alt metni olmayan kapak sayısı.
- Alan adı: site kök adreste mi?
- Google Search Console doğrulaması.

### Site dışında yapılacaklar

Kodla yapılamayan ama sıralamayı en çok etkileyen işler:

1. **Google Search Console** — https://search.google.com/search-console
   1. *Mülk ekle* → **URL ön eki** → `https://akcanx.github.io/`.
   2. Doğrulama yöntemi olarak **HTML etiketi**'ni seçin, kodu panelde **Google Search Console doğrulama kodu** alanına yapıştırın.
   3. **SEO Ayarlarını Kaydet**'e basın ve yaklaşık 1 dakika bekleyin.
   4. Search Console'da **Doğrula**'ya basın.
   5. **Site haritaları** bölümüne `https://akcanx.github.io/sitemap.xml` adresini ekleyin.
2. **Bing Webmaster Tools** — https://www.bing.com/webmasters → "Google Search Console'dan içe aktar". ChatGPT'nin web araması büyük ölçüde Bing'den beslenir.
3. **YouTube**: her videonun açıklamasına sitedeki yazının bağlantısını, kanalın "Hakkında" bölümüne site adresini ekleyin.
4. **Profiller**: Instagram, Spotify, SoundCloud ve X profillerinize site adresini yazın. Her yerde aynı isim, aynı kısa biyografi ve aynı fotoğraf kullanın.
5. **Video ve bölüm metinleri**: her videonun yazıya dökülmüş metnini yazının içeriğine, her bölümün metnini "Bölüm metni"ne ekleyin.
6. **Bahsedilmek**: konuk olduğunuz podcast'ler, röportajlar, forumlar… Başka sitelerde adınızın ve adresinizin geçmesi sıralamayı en çok etkileyen şeydir.

---

## 18. Yedekleme

| Kart | İşlev |
|---|---|
| **Dışa aktar** → **⇣ Yedeği İndir (.json)** | Bütün yazılar, videolar, bölümler, remixler, sayfalar, menü ve ayarlar (panel şifresi dahil) tek dosyaya iner: `site-adi-yedek-YYYY-AA-GG.json`. **Erişim anahtarı yedeğe girmez.** |
| **İçe aktar** → **⇡ Yedek Dosyası Seç** | Yedeği geri yükler. **Paneldeki mevcut içeriğin tamamı yedektekiyle değiştirilir** (onay istenir). Yedekteki şifre geçerli olur. |
| **Örnek içerikler** → **＋ Örnek İçerikleri Ekle** | Silinmiş örnekleri geri getirir; kendi içerikleriniz değişmez. |
| **Sıfırla** → **Fabrika Ayarlarına Dön** | Bütün içeriği silip örnek içerikle baştan başlatır (iki kez onay istenir). GitHub bağlantısı silinmez. |

**Ne zaman yedek almalı?** Her büyük değişiklikten sonra, tarayıcı verilerini temizlemeden önce ve paneli başka bir bilgisayara taşırken.

**Paneli başka bir bilgisayarda kullanmak:**

1. Eski bilgisayarda yedek alın.
2. Yeni bilgisayara bu klasörü kopyalayın (ya da GitHub'dan indirin).
3. `admin.html`'i açıp **İçe aktar** ile yedeği yükleyin.
4. **Yayın & SEO**'da GitHub bağlantısını yeniden girin (gerekirse yeni bir erişim anahtarıyla).

> **Paneli aynı anda iki bilgisayardan kullanmayın.** Her yayın, o paneldeki içeriğin tamamını gönderir. Son gönderen panel, diğerinin içeriğinin üzerine yazar.

---

## 19. Örnek içerikler

Site, kullanımı öğrenmek için örnek içeriklerle gelir: 12 YouTube videosu, 7 blog yazısı, 6 podcast bölümü, 6 remix, 2 özel sayfa (Ekipmanlar, İletişim) ve örnek Hakkında metni.

- Örnek videolar, yazılar ve bölümler **Müzik** alt kategorisindedir. **Gıda** (bir yemek hikâyesi) ve **Gündem** (haber paylaşmadan önce sorulacak sorular) alt kategorilerinde birer örnek yazı vardır; rehber yazısı alt kategorisizdir.

- **"Bu Site Nasıl Kullanılır?"** rehber yazısı, her özelliği hem anlatır hem de kendi üzerinde gösterir. Panelde açıp nasıl hazırlandığına bakabilirsiniz.
- Örnekler panelde başlıklarının yanındaki **ÖRNEK** etiketiyle görünür.
- **Örnek içerikler hiçbir zaman yayına gönderilmez.** Yalnızca panelde ve bilgisayarınızdaki önizlemede görünürler. Sebebi şu: örnek videolar başka kanallara, görseller picsum.photos'a, sesler SoundHelix'e aittir; yayınlanırlarsa Google sizi bu sahte içerikle tanır.
- Sitenin ilk sürümünden kalan eski örnekler de başlıklarından tanınır ve yayına gönderilmez.
- **Örneği kendi içeriğinize dönüştürmek**: düzenlemek yetmez, panel onu yine örnek sayar. Listede **⧉ Çoğalt** ile kopyalayın; kopya sizin içeriğinizdir. Düzenleyip **Yayında** yapın, sonra örneğin aslını silin.
- **Silmek**: tek tek (listede **Sil**) ya da hepsini birden (**Yayın & SEO → Örnek içerikleri sil**).
- **Geri getirmek**: **Yedekleme → Örnek İçerikleri Ekle**.

Örneklerin kaynağı `js/ornek-icerik.js` dosyasıdır.

---

## 20. Ziyaretçinin gördüğü site

### Sayfalar ve adresleri

| Sayfa | Adres |
|---|---|
| Ana sayfa | `/` |
| Videolar listesi / bir video | `/videolar/` · `/videolar/video-adi/` |
| Yazılar listesi / bir yazı | `/yazilar/` · `/yazilar/yazi-adi/` |
| Podcast / bir bölüm | `/podcast/` · `/podcast/bolum-adi/` |
| Alt kategori sayfası | `/videolar/gundem/` · `/yazilar/gida/` · `/podcast/muzik/` |
| Remixler / bir remix | `/remixler/` · `/remixler/remix-adi/` |
| Hakkında | `/hakkinda/` |
| Özel sayfa | `/sayfa/sayfa-adi/` |
| Bulunamayan adres | Gerçek "404" sayfası |

Bilgisayarınızdaki önizlemede (`index.html`) aynı sayfalar `#/yazilar/yazi-adi` biçiminde açılır. Sitenin eski sürümündeki `#/…` bağlantıları ve yanlış sekmedeki adresler (ör. `/yazilar/video-adi/`) doğru adrese kendiliğinden yönlenir.

### Ana sayfa

1. **Manşet**: Öne Çıkan bölümünde seçtiğiniz içerik; videoysa **İzle**, yazıysa **Oku**, bölüm/remixse **Dinle** düğmesiyle.
2. **İstatistik bandı**: "… video, … yazı, … podcast bölümü ve … remix" (Ayarlar'dan kapatılabilir). Sayılar ilgili sekmelere bağlıdır.
3. **Akış**: bütün içerikler yeniden eskiye.
   - Filtreler: **Hepsi / Video / Yazı / Podcast / Remix**.
   - Her seferinde 12 içerik gösterilir; **Daha fazla göster** ile devamı gelir.
   - Videoların küçük resminde **yarı saydam oynat işareti** ve "Video" etiketi var; yazılar işaretsiz.
   - Podcast ve remix satırlarındaki **yeşil oynat düğmesi** sayfadan ayrılmadan çalar.

### Alt bilgi

Site adı ve slogan, **Menü** listesi (üst menüdeki görünür öğeler), **Takip Et** (sosyal medya ve e-posta) ve alt bilgi metni.

### Site içi arama

- Sağ üstteki **🔍** düğmesi ya da klavyeden **/** veya **Ctrl+K** (⌘+K) ile açılır.
- En az 2 harf yazın. Başlıklarda, metinlerde, etiketlerde, alt kategorilerde ve özel sayfalarda arar; eşleşen kelime vurgulanır.
- **↑ ↓** ile sonuçlar arasında gezinin, **Enter** ile açın, **Esc** ile kapatın.
- Kavram kutularına ve konum satırındaki etiketlere tıklamak da aramayı o kelimeyle açar.

### Ses oynatıcı

Bir bölüm ya da remix çalınca sayfanın altında sabit oynatıcı açılır. Sayfadan sayfaya geçtiğinizde ses **susmaz**.

- Oynat / duraklat, **10 sn geri**, **10 sn ileri**.
- **Hız**: her tıklamada 1x → 1.25x → 1.5x → 2x → 0.8x.
- **Ses seviyesi** sürgüsü (tarayıcı hatırlar) ve sessize alma.
- **Zaman çubuğu**: tıklayarak ya da sürükleyerek istediğiniz yere atlayın.
- Başlığa tıklamak çalan içeriğin sayfasını açar. **×** oynatıcıyı kapatır.
- Çalan bölümün/remixin kendi sayfasındayken alttaki oynatıcı gizlenir; sayfadaki ses çubuğu kullanılır.

### Klavye kısayolları

| Tuş | İşlev |
|---|---|
| **/** veya **Ctrl+K** | Aramayı aç |
| **Esc** | Aramayı / mobil menüyü kapat |
| **Boşluk** | Oynat / duraklat (oynatıcı açıkken) |
| **←** / **→** | 10 sn geri / ileri (oynatıcı açıkken) |
| **Ctrl+S** (panelde) | Kaydet |

### Mobil

Bütün sayfalar 360 piksel genişliğindeki telefonlardan geniş ekranlara kadar taşmadan çalışır.

- Menü, sağ üstteki **☰** ile açılan çekmecededir.
- Liste satırlarında tarih ve bazı bilgiler gizlenir.
- Video, kaydırınca menünün hemen altında tam genişlikte sabit kalır.

---

## 21. Arama motorları ve yapay zekâ: otomatik yapılanlar

Bunların hiçbiri için bir şey yapmanız gerekmez; site her yayında bunları kendisi üretir.

- **Her içeriğin kendi adresi** ve **hazır HTML sayfası**: içerik JavaScript çalışmadan da okunur. ChatGPT, Claude ve Perplexity gibi yapay zekâ tarayıcıları JavaScript çalıştırmadığı için bu önemlidir.
- **Her sayfaya özel** başlık, açıklama, kanonik adres ve WhatsApp / X / LinkedIn paylaşım kartı.
- **Yapılandırılmış veri (schema.org)**:
  - kişi (sosyal profillerinizle), site, blog yazısı, video (Google video sonuçları için);
  - podcast programı ve bölümü, müzik kaydı (remix), konum satırı, profil sayfası;
  - yazılardaki kaynaklar.
- **`sitemap.xml`**: görsellerle birlikte site haritası (içeriği olan alt kategori sayfaları dahil).
- **`robots.txt`**: arama motorlarına ve yapay zekâ arama botlarına izin; "Yapay zekâ eğitimine izin ver" kapalıysa eğitim botlarına yasak.
- **`feed.xml`**: RSS (son 50 içerik).
- **`llms.txt`**: yapay zekâ asistanları için site özeti; alt kategoriler ve yayınlandıkları kanalların bağlantıları da burada listelenir.
- **Gerçek 404 sayfası**.
- **Boş sayfalar arama dışında**: henüz içeriği olmayan liste sayfaları `noindex` olarak işaretlenir.
- **Hız**:
  - Yazı tipleri sitenin kendi sunucusundan yüklenir.
  - Görseller WebP biçiminde, ihtiyaç duyulduğunda yüklenir.
  - YouTube oynatıcısı yalnızca tıklanınca açılır.
  - Kod güncellenince tarayıcı önbelleği kendiliğinden yenilenir.

Bunları en iyi şekilde desteklemek için sizin yapacaklarınız:

- Her içeriğe **özet** yazın.
- Videoların ve bölümlerin **metnini** ekleyin.
- Kapaklara **alt metin** yazın.
- Hakkında'daki **Kısa tanım**'ı doldurun.
- [Site dışındaki işleri](#site-dışında-yapılacaklar) yapın.

---

## 22. Görseller ve depolama alanı

- Panelden yüklenen görseller en uzun kenarı **1600 piksel** olacak şekilde küçültülür ve **WebP** biçiminde sıkıştırılır.
- Panel içeriği tarayıcıda yaklaşık **5 MB**'lık bir alanda tutulur. Gösterge Paneli'ndeki **Depolama** çubuğundan doluluğu izleyin.
- Alan dolarsa kayıt yapılamaz ve "Kaydedilemedi! Tarayıcı depolama alanı dolmuş olabilir" uyarısı çıkar. Çözümler:
  - Büyük görselleri dosya olarak yüklemek yerine **bağlantı (URL)** olarak ekleyin.
  - Örnek içerikleri silin.
  - Kullanmadığınız taslakları silin.
- Yayın sırasında panelde yüklediğiniz görseller ayrı dosyalara çıkarılır (`veri/gorsel/`). Değişmeyen görseller yeniden yüklenmez.
- **Önerilen ölçüler**:

  | Görsel | Ölçü |
  |---|---|
  | Blog kapağı | 16:9 (ör. 1600×900) |
  | Podcast/remix kapağı | Kare (ör. 1400×1400) |
  | Paylaşım görseli | 1200×630 |
  | Hakkında fotoğrafı | Yatay, yüksek çözünürlük |

- Başkasına ait görselleri kullanırken **Kaynak / lisans** alanlarını doldurun.

---

## 23. Kendi alan adınızı bağlamak

Şu an site `https://akcanx.github.io/` adresinde. Kendi alan adınızı (ör. `akcan.com`) bağlamak arama sonuçlarında daha güçlüdür.

1. Alan adını bir firmadan satın alın.
2. GitHub'da depoyu açın → **Settings → Pages → Custom domain** → alan adınızı yazıp **Save**.
3. Alan adı firmanızın DNS ayarlarına GitHub'ın gösterdiği kayıtları ekleyin (GitHub bu adımda yol gösterir).
4. DNS doğrulandıktan sonra **Enforce HTTPS**'i işaretleyin.
5. Panelde **Yayın & SEO → Site adresi** alanına `https://alanadiniz.com/` yazıp kaydedin.
6. Google Search Console'a yeni adresi de ekleyin.

---

## 24. Sorun giderme

**Panelde kaydettim ama site değişmedi.**

- Kenar çubuğundaki rozete bakın: "Yayınlanıyor…" ise bekleyin; GitHub'ın siteyi derlemesi yaklaşık 1 dakika sürer.
- Siteyi **Ctrl+F5** ile yenileyin (tarayıcı eski sürümü göstermiş olabilir).
- İçerik **Taslak** mı, yoksa **ÖRNEK** etiketli mi? İkisi de yayına gitmez.
- **Yayın & SEO → GitHub'da ilerlemeyi gör ↗** ile derlemenin başarılı olup olmadığına bakın.

**"Yayın hatası" ya da "Gönderilemedi" yazıyor.** Kartta yazan mesaja göre:

| Mesaj | Çözüm |
|---|---|
| Erişim anahtarı geçersiz ya da süresi dolmuş | Yeni bir [erişim anahtarı](#github-bağlantısı) oluşturup girin. |
| Anahtarın bu depoya yazma izni yok | Anahtarda **Contents: Read and write** izni ve doğru depo seçili olmalı. |
| Depo bulunamadı | Depo adı `akcanx/akcanx.github.io` mu? Anahtar bu depoya erişebiliyor mu? |
| Depo boş | Önce site kodunun GitHub'a yüklenmesi gerekir. |
| GitHub'a ulaşılamadı | İnternet bağlantınızı kontrol edip **Şimdi Yayınla**'ya basın. |

**Panel güncellendikten sonra eski görünüyor ya da bir düğme yok.** `admin.html`'i **Ctrl+F5** ile yenileyin.

**Video başlığı otomatik gelmedi.** Başlığı elle yazın. Otomatik başlık, YouTube bağlantısı yapıştırıldığında ve başlık alanı boşken gelir; internet bağlantısı gerektirir.

**"Video için geçerli bir YouTube bağlantısı girin" uyarısı.** Bağlantı `youtube.com/watch?v=…`, `youtu.be/…` ya da `youtube.com/shorts/…` biçiminde olmalı.

**"Yazı için bir kapak görseli ekleyin" uyarısı.** Yazılarda kapak zorunludur. Video eklemek istiyorsanız panelde **Videolar → + Yeni Video**'yu kullanın.

**Bir sayfa sitede "bulunamadı" diyor.** İçerik taslak ya da örnek olabilir. Bağlantısını değiştirdiyseniz eski adres artık çalışmaz.

**Paneldeki içeriğim kayboldu.** Tarayıcı verileri temizlenmiş ya da farklı bir tarayıcı/profil açılmış olabilir.

- Doğru tarayıcıyı ve profili açın.
- Değilse **Yedekleme → İçe aktar** ile son yedeği yükleyin.
- Yedek yoksa yayındaki içerik GitHub'da durur (`icerik` dalındaki `veri/site.json`). Bu dosyadan kurtarma için yardım isteyin. Taslaklar orada yoktur.

**Panel şifremi unuttum.** Son çare:

1. `admin.html` açıkken klavyede **F12**'ye basın ve **Console** sekmesine şunu yapıştırıp Enter'a basın:

   ```js
   const d = JSON.parse(localStorage['akcan.site.v1']); d.settings.adminHash = null; localStorage['akcan.site.v1'] = JSON.stringify(d); location.reload();
   ```

2. Şifre `admin`'e döner. Girip hemen yenisini belirleyin.

**Podcast/remix çalmıyor.**

- MP3 bağlantısı doğrudan ses dosyasına mı gidiyor? Tarayıcıda açınca ses çalmalı, bir web sayfası açılmamalı.
- Spotify/SoundCloud bağlantıları **Ses dosyası** alanında çalışmaz; **Gömülü oynatıcı** alanına yazın.

---

## 25. Teknik ek

### Klasör yapısı

```
Akcan Web Site - Kopya/
├── index.html            Site (önizlemede doğrudan, yayında her sayfanın şablonu)
├── admin.html            Kontrol paneli (yayına girmez)
├── build.js              Yayın derleyicisi: sayfalar, sitemap, robots, RSS, llms.txt
├── KULLANIM-KILAVUZU.md  Bu belge
├── README.md             Proje özeti
├── .github/workflows/yayin.yml   GitHub'da derleme ve yayın
├── css/                  fonts.css, style.css (site), admin.css (panel)
├── fonts/                Bebas Neue, Fraunces, JetBrains Mono
└── js/
    ├── ornek-icerik.js   Örnek içerikler (yayına girmez)
    ├── store.js          Veri katmanı
    ├── render.js         Sayfa şablonları, SEO etiketleri, yapılandırılmış veri
    ├── app.js            Site: yönlendirme, oynatıcı, arama
    ├── yayin.js          Panelden GitHub'a gönderim
    └── admin.js          Kontrol paneli
```

### GitHub'daki iki dal

| Dal | İçinde ne var | Kim yazar |
|---|---|---|
| `main` | Sitenin kodu | Kod değişiklikleri (bu klasörden `git push`) |
| `icerik` | Yayındaki içerik: `veri/site.json` ve `veri/gorsel/` | Panel (her yayında) |

İkisinden biri değişince GitHub Actions siteyi yeniden derleyip GitHub Pages'te yayınlar. İçerik ve kod ayrı dallarda olduğu için birbirini bozmaz.

### Yayın çıktısını bilgisayarda görmek (isteğe bağlı)

Node.js kuruluysa:

```
node build.js --veri <site.json'un bulunduğu klasör> --cikti _site --site-url http://localhost:8080/
```

`_site` klasörü yayındaki sitenin birebir kopyasıdır.

### Tasarım

- **Renkler**:

  | Kullanım | Renk |
  |---|---|
  | Zemin | `#0C0C0A` |
  | Kartlar | `#131310` |
  | Metin | `#F4ECD8` (krem) |
  | İkincil metin | `#B8B09A` |
  | Soluk metin | `#736C5A` |
  | Vurgu (panelden değiştirilebilir) | `#C9F03A` |

- **Yazı tipleri**: Bebas Neue (etiketler, düğmeler), Fraunces (başlıklar ve gövde), JetBrains Mono (tarih ve bilgiler).
- **Esin kaynağı**: sayfa düzenleri [barisozcan.com](https://barisozcan.com)'dan alınmıştır.
