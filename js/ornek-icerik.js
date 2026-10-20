/* ==========================================================================
   Akcan — Örnek İçerik
   Sitenin ve kontrol panelinin nasıl kullanıldığını göstermek için hazırlanmış
   örnek videolar, blog yazıları, podcast bölümleri, remixler ve sayfalar.
   Kendi içeriğinizi ekledikçe örnekleri panelden tek tek silebilirsiniz.
   Bu dosya kaldırılırsa site örneksiz (boş) başlar.
   ========================================================================== */
(function (global) {
  'use strict';

  const daysAgo = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  };
  const PIC = (seed, w = 1600, h = 900) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
  const MP3 = (n) => `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`;
  const YT = (id) => `https://www.youtube.com/watch?v=${id}`;

  // Metin arası görsel — paneldeki "▣ Görsel" düğmesinin ürettiği yapının aynısı.
  // Yerleşim: '' (ortada), 'flo flo-right' (sağa yaslı), 'flo flo-left' (sola yaslı), 'wide' (geniş)
  const fig = (seed, caption, credit, layout = '', w = 1200, h = 800) =>
    `<figure class="epfig${layout ? ' ' + layout : ''}"><img src="${PIC(seed, w, h)}" alt="${caption}"><figcaption>${caption}<span class="cr">${credit}</span></figcaption></figure>`;
  // Kaynaklı alıntı — paneldeki "❝ Kaynaklı" düğmesinin ürettiği yapı
  const quote = (text, source) => `<blockquote><p>“${text}”<br><span class="bq-kim">${source}</span></p></blockquote>`;
  const ORNEK = 'Örnek görsel: picsum.photos';

  /* ======================================================================
     YAZILAR SEKMESİ — Videolar (öncelikli) ve blog yazıları birlikte
     kind: 'video'  → üstte YouTube videosu, kaydırınca solda sabit kalır
     kind: 'yazi'   → üstte video yerine kapak görseli
     cat:           → alt kategori kimliği (muzik, gida, gundem — store.js'teki başlangıç listesi)
     ====================================================================== */
  const posts = [
    /* ---------- Rehber (blog yazısı) ---------- */
    {
      id: 'yazi-rehber', kind: 'yazi', title: 'Bu Site Nasıl Kullanılır? Örnek İçerik Rehberi', slug: 'site-nasil-kullanilir',
      date: daysAgo(0), cover: PIC('rehber-masa', 1600, 900), video: '', tint: '#5A4A2E',
      featured: false, published: true, tags: ['Rehber', 'Kontrol Paneli'],
      excerpt: `Sitedeki bütün örnek içerikler bir şey göstermek için burada. Bu yazı, her parçanın kontrol panelinde nasıl yapıldığını adım adım anlatıyor; okurken aynı zamanda her özelliğin sitede nasıl göründüğünü de görüyorsunuz.`,
      content:
        `<p>Hoş geldiniz! Bu site, <strong>Kontrol Paneli</strong> (<code>admin.html</code>, ilk şifre: <code>admin</code>) üzerinden yönetiliyor. Aşağıdaki her başlık, panelde bir işlemi ve sonucunu gösteriyor. Örnekleri inceledikten sonra panelden silebilir, kendi içeriklerinizle değiştirebilirsiniz.</p>`
        + `<h2>1. Videolar ve Yazılar: iki ayrı sekme</h2>`
        + `<p>Sitede YouTube videolarınız <a href="#/videolar">Videolar</a>, blog yazılarınız <a href="#/yazilar">Yazılar</a> sekmesinde listelenir. Panelde de iki ayrı bölüm var:</p>`
        + `<ul><li><strong>Panel → Videolar → + Yeni Video:</strong> YouTube bağlantısını yapıştırırsınız; başlık ve küçük resim otomatik gelir. Video sayfasının üstünde oynatıcı görünür; sayfa kaydırılınca video solda küçük pencerede sabit kalır. Listelerde küçük resmin ortasında oynat işareti olur.</li><li><strong>Panel → Yazılar → + Yeni Yazı:</strong> Video yerine bir kapak görseli seçersiniz. Sayfanın düzeni aynıdır, sadece videonun yerinde kapak görseli durur — tıpkı bu yazının üstündeki gibi.</li></ul>`
        + `<p>İkisi de aynı alanlara sahiptir: <em>Özet</em> (başlığın altındaki büyük italik giriş), <em>İçerik</em>, <em>Notlar ve kaynaklar</em>, <em>Görsel kaynakları</em> ve <em>Kavramlar</em>. Ana sayfadaki akışta ise hepsi birlikte, tarih sırasıyla görünür.</p>`
        + `<h2>2. Alt kategoriler: Müzik, Gıda, Gündem…</h2>`
        + `<p>Videolar, Yazılar ve Podcast sekmelerinin her birinin kendi alt kategorileri var. Farklı kanallarda ürettiğiniz içerikleri (ör. bir yemek hikâyeleri kanalı, gündemi eleştirdiğiniz ayrı bir kanal) aynı sekmede ama kendi bölümünde paylaşmak için:</p>`
        + `<ul><li><strong>Panel → Yazılar → ▦ Alt Kategoriler:</strong> <em>+ Alt kategori ekle</em> ile yeni bir alt kategori açın; adını, bağlantısını, kısa açıklamasını ve o içerikleri yayınladığınız kanalın adresini yazın. Sırasını ↑ ↓ ile değiştirebilir, × ile silebilirsiniz (içindeki içerikler silinmez, alt kategorisiz kalır).</li><li><strong>İçerik formunda “Alt kategori”:</strong> Her video ve yazının sağ sütununda hangi alt kategoride olacağını seçersiniz (podcast bölümleri alt kategori yerine bir seriye bağlanır). Bu yazı alt kategorisiz; örnek olarak <a href="#/yazilar/gida">Gıda</a> ve <a href="#/yazilar/gundem">Gündem</a> yazılarına bakabilirsiniz.</li><li><strong>Sitede:</strong> Sekmenin üstünde <em>Hepsi · Müzik · Gıda · Gündem</em> düğmeleri görünür. Her alt kategorinin kendi sayfası vardır (ör. <a href="#/yazilar/gida">/yazilar/gida/</a>): adı, açıklaması ve kanal bağlantısıyla. İçeriği olmayan alt kategoriler sitede gösterilmez.</li></ul>`
        + fig('rehber-ortada', 'Ortada yerleşim: görsel metin sütununun ortasında durur.', 'Panel → İçerik → ▣ Görsel → Yerleşim: Ortada')
        + `<h2>3. Metin arasına görsel eklemek</h2>`
        + fig('rehber-saga', 'Sağa yaslı: metin görselin solundan akar.', 'Yerleşim: Sağa yaslı', 'flo flo-right', 900, 1200)
        + `<p>İçerik editöründeki <strong>▣ Görsel</strong> düğmesine bastığınızda küçük bir pencere açılır. Görseli bilgisayarınızdan yükleyebilir ya da bağlantısını yapıştırabilirsiniz. Ardından dört yerleşimden birini seçersiniz:</p>`
        + `<ul><li><strong>Ortada</strong> — metin sütununda, tek başına.</li><li><strong>Sağa yaslı</strong> — bu paragrafta olduğu gibi, metin solundan akar.</li><li><strong>Sola yaslı</strong> — metin sağından akar.</li><li><strong>Geniş</strong> — metin sütunundan taşar, sayfaya yayılır.</li></ul>`
        + `<p>Her görselin altına bir <em>açıklama</em> ve daha küçük harflerle bir <em>kaynak / lisans</em> satırı yazabilirsiniz. Editörde eklediğiniz bir görsele tıklarsanız aynı pencere açılır; yerleşimini değiştirebilir veya görseli kaldırabilirsiniz.</p>`
        + fig('rehber-genis', 'Geniş yerleşim: fotoğraf metin sütunundan taşar ve sayfaya yayılır.', 'Yerleşim: Geniş', 'wide', 1800, 800)
        + fig('rehber-sola', 'Sola yaslı: metin görselin sağından akar.', 'Yerleşim: Sola yaslı', 'flo flo-left', 900, 900)
        + `<h2>4. Alıntılar</h2>`
        + `<p>Editörde iki alıntı düğmesi var. <strong>❝</strong> düz bir alıntı yapar. <strong>❝ Kaynaklı</strong> ise alıntının altına kimin söylediğini ya da nereden alındığını küçük harflerle ekler:</p>`
        + quote('Bir alıntının altına kaynağını yazmak, okura güven verir.', 'Panel → İçerik → ❝ Kaynaklı')
        + `<h2>5. Yazının sonu: kaynaklar, kavramlar, ilgili içerik</h2>`
        + `<p><em>Notlar ve kaynaklar</em> alanına her satıra bir kaynak yazın: <code>Başlık | https://bağlantı</code>. Bu yazının en altındaki açılır listeler bu alanlardan oluşur. <em>Kavramlar / etiketler</em> alanına yazdığınız ilk üç etiket sayfanın üstündeki konum satırında, hepsi yazının sonundaki kutularda görünür; kutulara tıklayan ziyaretçi o konudaki diğer içerikleri arar. <em>İlgili içerik</em> listesi ortak etiketlere göre otomatik oluşur.</p>`
        + `<h2>6. Sayfa tonu</h2>`
        + `<p>Her yazı sayfasının arka planı hafif renklidir. Renk boş bırakılırsa kapak görselinden ya da videodan <strong>otomatik</strong> seçilir. Dilerseniz panelde sağ sütundaki <em>Görünüm → Sayfa tonu</em> ile kendiniz belirleyebilirsiniz.</p>`
        + `<h2>7. Sitenin geri kalanı</h2>`
        + `<ul><li><strong>Podcast:</strong> Panel → Podcast → <em>◫ Seriler</em> ile serileriniz (kapak, kısa tanım, tanıtım, durum, fragman, platform bağlantıları); <em>+ Yeni Bölüm</em> ile bir seriye bağlı bölümler. Sitede <a href="#/podcast">Podcast</a> sekmesi bütün serilerin kapaklarını yan yana gösterir. Bölüm sayfasında ses çubuğu kaydırınca menünün altına yapışır.</li><li><strong>Videolar ve Yazılar sayfalarının başlığı:</strong> Panel → Videolar (ya da Yazılar) → <em>⚙ Sayfa Ayarları</em>.</li><li><strong>Ana sayfa manşeti:</strong> Panel → Öne Çıkan (Hero).</li><li><strong>Menü:</strong> Panel → Menü Yönetimi; özel sayfalar (ör. <a href="#/sayfa/ekipmanlar">Ekipmanlar</a>, <a href="#/sayfa/iletisim">İletişim</a>) da menüye eklenebilir.</li><li><strong>Hakkında:</strong> Panel → Hakkında; fotoğraf üstündeki iki yazı ve vurgu rengi oradan.</li></ul>`
        + `<p>Hepsi bu kadar. Örnekleri silmek için panelde ilgili listede <em>Sil</em> düğmesini kullanın; hepsini geri getirmek isterseniz <em>Yedekleme → Örnek içerikleri ekle</em> yeterli.</p>`,
      sources: `Kontrol paneli | admin.html | Sitenin yönetim ekranı\nYouTube video bağlantısı nasıl alınır? | https://support.google.com/youtube/answer/57741 | YouTube Yardım`,
      credits: `Kapak ve ara görseller: picsum.photos (örnek görseller)`
    },

    /* ---------- Öne çıkan video: zengin içerikli tam örnek ---------- */
    {
      id: 'vid-bicep', kind: 'video', cat: 'muzik', title: 'Bicep’in Printworks Gecesi: Bir Canlı Performansı Parça Parça İncelemek', slug: 'bicep-printworks-canli-performans',
      date: daysAgo(2), cover: '', video: YT('fY7M3pzXdUo'), tint: '',
      featured: true, published: true, tags: ['Canlı Performans', 'Elektronik', 'Sahne'],
      excerpt: `Londra’da eski bir matbaa binası, binlerce kişi ve iki prodüktör. Resident Advisor’ın kaydettiği bu gece, canlı elektronik müziğin bir DJ setinden nasıl ayrıştığını anlamak için bulunmaz bir ders.`,
      content:
        `<p>Bir DJ seti ile canlı elektronik performans arasındaki fark ilk bakışta görünmez. İkisinde de sahnede ekranlar, düğmeler ve kulaklıklar vardır. Ama bir DJ hazır parçaları birbirine bağlarken, canlı performansta parçalar o anda, katman katman yeniden kurulur.</p>`
        + `<p>Bicep’in Printworks kaydı bu farkı izlemek için mükemmel bir örnek. Sahnede iki kişi var ve her biri parçanın farklı bir bölümünden sorumlu: biri ritmi ve bası yönetiyor, diğeri melodileri ve atmosferi.</p>`
        + fig('bicep-sahne', 'Işıkların ritimle senkron çalıştığı büyük bir sahne.', ORNEK, 'flo flo-right', 900, 1200)
        + `<h2>Matbaadan dans pistine</h2>`
        + `<p>Printworks, Londra’da yıllarca gazete basılan devasa bir binaydı. Kapanmadan önce şehrin en sevilen kulüp mekânlarından birine dönüştü. Tavanın yüksekliği ve beton duvarlar sesi tuhaf bir şekilde büyütüyor; bas, göğsünüzde değil midenizde hissediliyor.</p>`
        + `<p>Mekân seçimi bir performansın yarısıdır. Aynı set küçük bir kulüpte samimi, böyle bir salonda ise neredeyse törensel hissettirir.</p>`
        + quote('Kalabalığın tepkisini duymadan bir parçanın nereye gideceğine karar veremeyiz.', 'Canlı performans üzerine bir prodüktör sözü')
        + `<h2>Canlı kurulan bir parça</h2>`
        + `<p>Videonun ilk on dakikasını dikkatle izleyin: davul hattı tek başına başlıyor, sonra bas ekleniyor, ardından akorlar yavaşça açılıyor. Bunların hiçbiri önceden birleştirilmiş bir kayıt değil; her katman ayrı ayrı açılıp kapanıyor.</p>`
        + fig('bicep-kalabalik', 'Binlerce kişinin aynı anda nefes tuttuğu an: “drop” öncesi sessizlik.', ORNEK, 'wide', 1800, 800)
        + `<p>Bu yapının iki avantajı var:</p>`
        + `<ul><li><strong>Esneklik:</strong> Kalabalık bir bölümü çok sevdiyse o bölüm uzatılabilir.</li><li><strong>Sürpriz:</strong> Bildiğiniz bir parça bu gece hiç duymadığınız bir hâle bürünebilir.</li><li><strong>Risk:</strong> Bir hata herkesin duyacağı şekilde ortaya çıkar — ama bu da canlılığın parçası.</li></ul>`
        + fig('bicep-ekipman', 'Sahnedeki düzen: sentezleyiciler, örnekleyiciler ve bir miks masası.', ORNEK, 'flo flo-left', 900, 900)
        + `<h2>Bir sonraki dinleyişte neye dikkat etmeli?</h2>`
        + `<p>Kulaklıkla izleyin ve yalnızca bas hattını takip etmeye çalışın. Sonra baştan alıp yalnızca davullara odaklanın. Her seferinde aynı performansın farklı bir hikâyesini duyacaksınız.</p>`
        + `<p>Canlı elektronik müzik, sahnede verilen kararların toplamı. Bu gece de o kararların en güzellerinden biri.</p>`,
      sources: `Bicep — Vikipedi | https://en.wikipedia.org/wiki/Bicep_(duo)\nPrintworks London | https://en.wikipedia.org/wiki/Printworks_(London)\nResident Advisor | https://ra.co`,
      credits: `Video: Resident Advisor, YouTube | https://www.youtube.com/watch?v=fY7M3pzXdUo\nAra görseller: picsum.photos (örnek görseller)`
    },

    {
      id: 'vid-remix-ableton', kind: 'video', cat: 'muzik', title: 'Bir Soul Örneğini Remixe Çevirmek: Stem Ayırma, 808 ve Vokal Kesitleri', slug: 'soul-ornegini-remixe-cevirmek',
      date: daysAgo(6), cover: '', video: YT('aWzURqSRPSI'), tint: '',
      featured: false, published: true, tags: ['Prodüksiyon', 'Ableton', 'Remix'],
      excerpt: `Ableton ekibinin bu videosu, eski bir soul kaydını adım adım modern bir parçaya dönüştürüyor. Ben de izlerken aldığım notları, kendi remix sürecime nasıl uyarladığımla birlikte paylaşıyorum.`,
      content:
        `<p>Bir remix çoğu zaman tek bir sesle başlar: bir vokal satırı, bir akor ya da kısa bir davul vuruşu. Bu videoda başlangıç noktası bir soul kaydı.</p>`
        + `<h2>Videodaki adımlar</h2>`
        + `<ol><li><strong>Stem ayırma:</strong> Kayıt vokal, davul, bas ve diğer enstrümanlar olarak ayrı kanallara bölünüyor.</li><li><strong>Hız ve ton:</strong> Örnek hızlandırılıp yeni tempoya uyduruluyor.</li><li><strong>Sesten MIDI’ye:</strong> Akorlar nota olarak çıkarılıp yeniden çalınabilir hâle geliyor.</li><li><strong>808 bas:</strong> Parçanın altına derin bir bas yerleştiriliyor.</li><li><strong>Vokal kesitleri:</strong> Vokal küçük parçalara bölünüp yeni bir melodi kuruluyor.</li></ol>`
        + fig('soul-plak', 'Eski bir soul plağı: remixin ham maddesi.', ORNEK)
        + quote('Bir örneği değiştirmekten korkmayın; orijinal her zaman orada duruyor.', 'Stüdyo defterimden')
        + `<p>Benim için en öğretici kısım sesten MIDI’ye geçiş oldu. Bir akoru nota olarak elde ettiğinizde, onu başka bir sesle çalabilir, tersine çevirebilir, hatta tamamen yeni bir armoni kurabilirsiniz.</p>`,
      sources: `Ableton Live — Stem Separation | https://www.ableton.com/en/live/\nSampling (müzik) | https://tr.wikipedia.org/wiki/Örnekleme_(müzik)`,
      credits: `Video: Ableton, YouTube`
    },

    /* ---------- Alt kategoriler: Gıda ve Gündem (Panel → Yazılar → ▦ Alt Kategoriler) ---------- */
    {
      id: 'yazi-gida', kind: 'yazi', cat: 'gida', title: 'Annemin Defterinden: Bir Tencere Kuru Fasulyenin Hikâyesi', slug: 'bir-tencere-kuru-fasulyenin-hikayesi',
      date: daysAgo(4), cover: PIC('gida-tencere', 1600, 900), coverAlt: 'Ocakta kaynayan bir tencere ve yanında tahta kaşık', video: '', tint: '#6B4A1E',
      featured: false, published: true, tags: ['Yemek Hikâyeleri', 'Mutfak', 'Anı'],
      excerpt: `Sararmış bir tarif defteri, kenarına düşülmüş notlar ve her kışın ilk soğuk gününde ocağa konan bir tencere. Bir yemeğin tarifinden çok, onu pişirenlerin hikâyesi.`,
      content:
        `<p>Annemin tarif defteri bir okul defteri. Kapağı çoktan düşmüş, sayfaları yağ lekeleriyle yarı saydam olmuş. Kuru fasulyenin sayfasında tek bir ölçü yok; yalnızca kenarda, kurşun kalemle yazılmış bir not var: <em>“Akşamdan ıslat, acele etme.”</em></p>`
        + fig('gida-defter', 'Tarif defterinin en çok açılan sayfası.', ORNEK, 'flo flo-right', 900, 1100)
        + `<h2>Ölçüsü olmayan tarifler</h2><p>Eski mutfaklarda tarifler ölçüyle değil, gözle ve elle aktarılırdı: “Bir avuç”, “göz kararı”, “kıvamını tutana kadar”. Bu yüzden aynı yemek her evde biraz başka olur. Bir tarifi yazıya geçirmek, aslında bir sesi kaydetmeye benziyor: ne kadar dikkat etseniz de bir şeyler dışarıda kalıyor.</p>`
        + quote('Yemeğin tadı tencereden değil, beklemekten gelir.', 'Annemin defterinden')
        + `<h2>Sofranın etrafındakiler</h2><p>Bu tencere hiçbir zaman yalnızca dört kişi için pişmedi. Kapı çalınır, bir tabak daha konur, sohbet uzar. Yemek hikâyelerini anlatırken asıl anlatmak istediğim de bu: tariflerin arkasındaki insanlar ve onları bir araya getiren sofralar.</p>`
        + fig('gida-sofra', 'Kalabalık bir sofra: tabaklar her zaman bir fazla.', ORNEK, 'wide', 1800, 800)
        + `<p><em>Bu yazı bir örnektir ve <strong>Gıda</strong> alt kategorisinde duruyor. Panelde yazıyı açtığınızda sağ sütundaki “Alt kategori” kutusundan değiştirebilirsiniz.</em></p>`,
      sources: `Kuru fasulye — Vikipedi | https://tr.wikipedia.org/wiki/Kuru_fasulye`,
      credits: `Kapak ve ara görseller: picsum.photos (örnek görseller)`
    },

    {
      id: 'yazi-gundem', kind: 'yazi', cat: 'gundem', title: 'Bir Haberi Paylaşmadan Önce Kendime Sorduğum Beş Soru', slug: 'bir-haberi-paylasmadan-once-bes-soru',
      date: daysAgo(15), cover: PIC('gundem-gazete', 1600, 900), coverAlt: 'Masada katlanmış gazeteler ve bir fincan kahve', video: '', tint: '#2E3E52',
      featured: false, published: true, tags: ['Medya Okuryazarlığı', 'Haber', 'Doğrulama'],
      excerpt: `Gündem hızlı akıyor; bir başlığı okuyup paylaşmak birkaç saniye sürüyor. Yanlış bir bilgiyi yaymamak için paylaş düğmesine basmadan önce kendime sorduğum beş kısa soru.`,
      content:
        `<p>Gündemi eleştirmek, önce onu doğru okumakla başlıyor. Bir haberin altına yorum yazmadan ya da onu paylaşmadan önce birkaç saniye durup şu soruları soruyorum:</p>`
        + `<ol><li><strong>Kaynak kim?</strong> Haberi ilk kim yayınladı; bir kurum mu, bir kişi mi, yoksa yalnızca bir ekran görüntüsü mü?</li><li><strong>Ne zaman?</strong> Tarih bugünün mü, yoksa yıllar önceki bir olay yeniden mi dolaşıyor?</li><li><strong>Başlık ile metin aynı şeyi mi söylüyor?</strong> Çarpıcı başlıkların çoğu, metnin içinde çok daha temkinli cümlelere dönüşüyor.</li><li><strong>Başka kim yazdı?</strong> Gerçek bir gelişme genellikle birden fazla bağımsız kaynakta yer alır.</li><li><strong>Görsel bu olaya mı ait?</strong> Tersine görsel aramayla bir fotoğrafın ilk ne zaman ve nerede yayınlandığını birkaç saniyede bulabilirsiniz.</li></ol>`
        + fig('gundem-ekran', 'Akan bir zaman tüneli: en hızlı yayılan, her zaman en doğru olan değil.', ORNEK)
        + quote('Bir yalan dünyayı dolaşırken, gerçek henüz ayakkabılarını giyiyordur.', 'Kaynağı tartışmalı, sık alıntılanan bir söz')
        + `<p>Bu soruların hiçbiri bir görüşü savunmak ya da çürütmek için değil; yalnızca ne okuduğumuzu bilmek için. Gündemi eleştirel okumak, en çok da kendi önyargılarımıza karşı dikkatli olmayı gerektiriyor.</p>`
        + `<p><em>Bu yazı bir örnektir ve <strong>Gündem</strong> alt kategorisinde duruyor.</em></p>`,
      sources: `Medya okuryazarlığı — Vikipedi | https://tr.wikipedia.org/wiki/Medya_okuryazarlığı\nDoğruluk kontrolü (fact-checking) | https://en.wikipedia.org/wiki/Fact-checking\nTersine görsel arama | https://en.wikipedia.org/wiki/Reverse_image_search`,
      credits: `Kapak ve ara görseller: picsum.photos (örnek görseller)`
    },

    /* ---------- Blog yazısı: zengin içerik ---------- */
    {
      id: 'post-1', kind: 'yazi', cat: 'muzik', title: 'Bir Remix Nasıl Doğar?', slug: 'bir-remix-nasil-dogar',
      date: daysAgo(9), cover: PIC('remix-dogar', 1600, 900), video: '', tint: '',
      featured: false, published: true, tags: ['Müzik', 'Prodüksiyon', 'Remix'],
      excerpt: `Bir şarkıyı yeniden yorumlamak, onu söküp yeniden inşa etmek demek. İlk dinleyişten son mastera kadar bir remixin hikâyesi; neyi koruduğum, neyi bıraktığım ve neden.`,
      content:
        `<p>Her remix bir soruyla başlar: <em>Bu şarkı başka nasıl anlatılabilirdi?</em> Bazen cevap bir bas hattında saklıdır, bazen de vokalin tek bir nefesinde.</p><p>Orijinal parçayı onlarca kez dinlerim. Vokalin nefes aldığı yerleri, bas hattının saklandığı köşeleri, prodüktörün bilerek boş bıraktığı alanları ararım. Bir şarkının iskeleti çoğu zaman ilk dinleyişte değil, yirminci dinleyişte görünür.</p>`
        + fig('remix-studyo', 'Gece yarısı stüdyo masası: her şey bir döngüyle başlıyor.', 'Fotoğraf: Akcan arşivi', 'flo flo-right', 900, 1200)
        + `<h2>Önce dinlemek</h2><p>Dinlerken not alırım. Hangi saniyede tüylerim diken diken oluyor, hangi bölümde sıkılıyorum? Remixin haritası bu notlardan çıkar. Sevdiğim yeri büyütür, sıkıldığım yeri ya keser ya da tamamen dönüştürürüm.</p>`
        + quote('İyi bir remix, orijinale saygı duyar ama ondan korkmaz.', 'Stüdyo defterinden, 2024')
        + `<p>Sonra tempoyu belirlerim. Orijinal 98 BPM ise, 122’ye taşımak şarkının duygusunu baştan değiştirir: hüzün dans pistine çıkar.</p>`
        + fig('remix-wide', 'Stem’ler ayrıldıktan sonra her kanal kendi hikâyesini anlatmaya başlıyor.', 'Fotoğraf: Akcan arşivi', 'wide', 1800, 800)
        + `<h2>Sonra sökmek</h2><p>Stem’leri ayırır, yeni bir iskelet kurarım. Davul, bas, akor ve vokal ayrı ayrı masaya yatırılır. Gerisi deneme, yanılma ve sabır.</p>`
        + fig('remix-plak', 'Orijinal kayıt: her şeyin çıkış noktası.', 'Fotoğraf: Akcan arşivi', 'flo flo-left', 900, 900)
        + `<p>Bazen tek bir vokal satırı bütün remixi taşır. Onu bulduğumda gerisini o satırın etrafına örerim. Bazen de hiçbir şey çalışmaz; proje haftalarca bekler, bir sabah bir anda yerine oturur.</p><p>Son aşama miks ve mastering. Burada amaç parçayı daha yüksek değil, daha net yapmak. Her enstrümanın nefes alacak bir yeri olmalı.</p>`
        + fig('remix-mastering', 'Mastering: son dokunuşlar.', 'Ekran görüntüsü: Akcan')
        + `<p>Ve sonunda, bir gece kulaklığı takıp baştan sona dinlediğimde içimden “tamam” dediğim an gelir. O an remix doğmuştur.</p>`,
      sources: `Remix — Vikipedi | https://tr.wikipedia.org/wiki/Remix\nStem (ses) | https://en.wikipedia.org/wiki/Stem_(audio)\nMastering | https://tr.wikipedia.org/wiki/Mastering`,
      credits: `Kapak ve ara görseller: Akcan arşivi | https://picsum.photos`
    },

    {
      id: 'vid-maceo', kind: 'video', cat: 'muzik', title: 'Bir Boiler Room Klasiği: Maceo Plex, Berlin', slug: 'maceo-plex-boiler-room-berlin',
      date: daysAgo(13), cover: '', video: YT('5vHRUsP20dQ'), tint: '',
      featured: false, published: true, tags: ['DJ Set', 'Techno', 'Boiler Room'],
      excerpt: `On yılı aşkın süredir izlenmeye devam eden bir set. Bir DJ setinin neden “zamansız” hâle geldiğini bu kayıt üzerinden konuşalım.`,
      content:
        `<p>Boiler Room’un ilk yıllarında kameralar DJ’in arkasına konurdu; izleyici, kalabalıkla aynı yerden bakardı. Bu kayıt da o dönemden.</p>`
        + `<p>Setin gücü acelesizliğinde: geçişler uzun, parçalar nefes alıyor, enerji yavaş yavaş yükseliyor. Bir DJ setinin iyi olup olmadığını anlamanın en kolay yolu, kalabalığın ne zaman sustuğuna bakmak.</p>`
        + quote('İyi bir set, dinleyiciye nereye gittiğini söylemeden onu oraya götürür.', 'Kulüp kültürü üzerine eski bir söz'),
      sources: `Boiler Room | https://boilerroom.tv`,
      credits: `Video: Boiler Room, YouTube`
    },

    {
      id: 'vid-sampling', kind: 'video', cat: 'muzik', title: 'Sample Kullanmanın Bütün Yolları', slug: 'sample-kullanmanin-butun-yollari',
      date: daysAgo(17), cover: '', video: YT('2q2cmwjxink'), tint: '',
      featured: false, published: true, tags: ['Sampling', 'Prodüksiyon'],
      excerpt: `Kesmek, döngüye almak, yeniden tonlamak, tersine çevirmek… Bir sesi başka bir şarkının parçası yapmanın onlarca yolu var. Bu kapsamlı rehberden en sevdiğim teknikleri seçtim.`,
      content:
        `<p>Sampling, müzik tarihinin en tartışmalı ve en yaratıcı tekniklerinden biri. Bu videoda neredeyse bütün yaklaşımlar tek tek gösteriliyor.</p>`
        + `<h2>En sık kullandıklarım</h2>`
        + `<ul><li><strong>Chop:</strong> Bir kaydı küçük parçalara bölüp yeniden dizmek.</li><li><strong>Loop:</strong> Kısa bir bölümü sürekli tekrar ettirmek.</li><li><strong>Pitch:</strong> Tonu değiştirerek bambaşka bir duygu yaratmak.</li><li><strong>Reverse:</strong> Sesi tersine çevirip geçişlerde kullanmak.</li></ul>`
        + fig('sampling-pad', 'Örnekleyici pad’ler: her biri bir ses kesiti.', ORNEK)
        + `<p>Unutmayın: başkasına ait bir kaydı yayınlayacağınız bir parçada kullanacaksanız izin almanız gerekir.</p>`,
      sources: `Sampling (müzik) | https://en.wikipedia.org/wiki/Sampling_(music)`,
      credits: `Video: Will Hatton, YouTube`
    },

    {
      id: 'vid-tame', kind: 'video', cat: 'muzik', title: 'Küçük Bir Masada Büyük Bir Ses: Tame Impala', slug: 'tame-impala-tiny-desk',
      date: daysAgo(21), cover: '', video: YT('xSDfCwDmJNo'), tint: '',
      featured: false, published: true, tags: ['Canlı Performans', 'Psychedelic'],
      excerpt: `Stüdyoda katman katman kurulan bir ses, bir ofisin köşesinde nasıl çalınır? Tiny Desk performansları, aranjmanın neyi kaybedip neyi kazandığını göstermek için birebir.`,
      content:
        `<p>Tame Impala kayıtları yoğun, efektli ve çok katmanlıdır. Tiny Desk’in küçük, akustik ortamında bu sesin nasıl yeniden kurulduğunu görmek, aranjman üzerine düşünmek için iyi bir fırsat.</p>`
        + quote('Bir şarkı, en sade hâlinde de ayakta kalabiliyorsa iyi yazılmıştır.', 'Söz yazarlığı üzerine bilinen bir öğüt'),
      sources: `NPR Music Tiny Desk | https://www.npr.org/series/tiny-desk-concerts/`,
      credits: `Video: NPR Music, YouTube`
    },

    {
      id: 'post-2', kind: 'yazi', cat: 'muzik', title: 'Kulaklıkla Dinlemek Neden Farklı Hissettirir?', slug: 'kulaklikla-dinlemek',
      date: daysAgo(25), cover: PIC('kulaklik', 1600, 900), video: '', tint: '',
      featured: false, published: true, tags: ['Ses', 'Psikoloji'],
      excerpt: `Kulaklık takınca dünya küçülür, müzik büyür. Bunun arkasında beynimizin sesi nasıl konumlandırdığı yatıyor.`,
      content:
        `<p>Kulaklık, sesi kafamızın tam ortasına yerleştirir. Hoparlörde ses odanın içinde dolaşır, duvarlardan yansır, iki kulağımıza farklı zamanlarda ulaşır. Kulaklıkta ise her kulak yalnızca kendi kanalını duyar.</p>`
        + fig('kulaklik-detay', 'Stüdyo kulaklığı: sesi olduğu gibi duymak için.', ORNEK, 'flo flo-right', 900, 1100)
        + `<h2>Stereo görüntü</h2><p>Sol ve sağ kanal arasındaki küçük farklar, beynimizde bir sahne kurar. Prodüktörler bu sahneyi bilerek tasarlar: davul ortada, gitar biraz solda, piyano biraz sağda.</p>`
        + `<h2>Neden daha duygusal?</h2><p>Dış dünyanın sesleri kesildiğinde dikkat tamamen müziğe yönelir. Küçük ayrıntılar — bir nefes, bir parmağın teli sürtmesi — birden duyulur hâle gelir.</p>`
        + quote('Kulaklıkla dinlemek, şarkıcının kulağınıza fısıldaması gibidir.', 'Bir ses mühendisinin notlarından'),
      sources: `Stereofoni | https://tr.wikipedia.org/wiki/Stereofoni\nBinaural kayıt | https://en.wikipedia.org/wiki/Binaural_recording`,
      credits: `Kapak: picsum.photos (örnek görsel)`
    },

    {
      id: 'vid-james-hype', kind: 'video', cat: 'muzik', title: 'Baştan Sona Bir Remix: Bir Prodüktörün Tam Süreci', slug: 'bastan-sona-bir-remix',
      date: daysAgo(29), cover: '', video: YT('uUD_BO6gtQ8'), tint: '',
      featured: false, published: true, tags: ['Prodüksiyon', 'Remix', 'House'],
      excerpt: `Ses tasarımından miks ve mastering’e kadar tek oturumda bitirilen bir remix. Hızlı çalışmanın da bir disiplin olduğunu gösteren bir video.`,
      content:
        `<p>Bu videoyu sevmemin nedeni şeffaflığı: hatalar, vazgeçilen fikirler ve geri alınan adımlar da kayıtta. Bir remixin düz bir çizgide ilerlemediğini görmek iyi geliyor.</p>`
        + `<p>Özellikle ses tasarımı bölümüne dikkat edin: hazır bir sesi alıp küçük ayarlarla tamamen kişisel bir tona dönüştürmek, prodüksiyonun en keyifli kısımlarından biri.</p>`,
      sources: '', credits: `Video: James Hype, YouTube`
    },

    {
      id: 'vid-solomun', kind: 'video', cat: 'muzik', title: 'Gün Batımında İki Saat: Solomun, Tulum', slug: 'solomun-tulum',
      date: daysAgo(34), cover: '', video: YT('bk6Xst6euQk'), tint: '',
      featured: false, published: true, tags: ['DJ Set', 'Melodic House'],
      excerpt: `Bir setin mekânla nasıl konuştuğunu anlatan en güzel örneklerden biri: orman, gün batımı ve yavaş yavaş yükselen bir melodi.`,
      content: `<p>Açık havada çalınan setler kulüpten farklıdır: ses duvarlara çarpmaz, gökyüzüne dağılır. Bu yüzden melodiler ve uzun geçişler öne çıkar.</p><p>İlk yarım saatte ritmin ne kadar az değiştiğine, buna rağmen enerjinin nasıl arttığına dikkat edin.</p>`,
      sources: '', credits: `Video: Boiler Room, YouTube`
    },

    {
      id: 'yazi-plak', kind: 'yazi', cat: 'muzik', title: 'İlk Plak Setimi Nasıl Kurdum?', slug: 'ilk-plak-setim',
      date: daysAgo(39), cover: PIC('plak-seti', 1600, 900), video: '', tint: '#6B3A2A',
      featured: false, published: true, tags: ['Plak', 'DJ', 'Ekipman'],
      excerpt: `İki pikap, bir mikser ve bir kutu ikinci el plak. Dijital dünyadan gelip plakla çalmayı öğrenmenin bana öğrettikleri.`,
      content:
        `<p>Plakla çalmaya karar verdiğimde elimde sadece eski bir pikap ve babamdan kalan birkaç plak vardı. Bugün kurduğum düzen hâlâ basit ama her parçasını bilerek seçtim.</p>`
        + fig('plak-pikap', 'İlk pikabım: ikinci el ama hâlâ çalışıyor.', ORNEK, 'flo flo-left', 900, 900)
        + `<h2>Neden plak?</h2><p>Plakta her şey fizikseldir: tempoyu parmağınızla ayarlar, iğneyi gözünüzle bulursunuz. Bu, müziği seçme biçiminizi de değiştirir; her plak bir karardır.</p>`
        + `<h2>Benim düzenim</h2><ul><li>İki adet doğrudan sürüşlü pikap</li><li>İki kanallı bir DJ mikseri</li><li>Ön güçlendirici ve aktif monitörler</li><li>Plakları temiz tutmak için fırça ve antistatik kılıflar</li></ul>`
        + quote('Plak, müziği dinlemek için bir sebep değil, bir törendir.', 'Bir plakçı dükkânının duvarından')
        + fig('plak-arsiv', 'Arşivin bir köşesi: türlere değil, ruh hâllerine göre dizili.', ORNEK, 'wide', 1800, 800)
        + `<p>Plakla çalmayı öğrenmek sabır istiyor. Ama ilk kez iki plağı kulaktan senkronladığınızda o sabrın karşılığını fazlasıyla alıyorsunuz.</p>`,
      sources: `Gramofon plağı | https://tr.wikipedia.org/wiki/Gramofon_plağı\nDJ mikseri | https://en.wikipedia.org/wiki/DJ_mixer`,
      credits: `Kapak ve ara görseller: picsum.photos (örnek görseller)`
    },

    {
      id: 'vid-midi', kind: 'video', cat: 'muzik', title: 'MIDI Efektleriyle Akor, Arpej ve Bas Hatları', slug: 'midi-efektleriyle-akor-arpej-bas',
      date: daysAgo(44), cover: '', video: YT('ZvFJpquOGvM'), tint: '',
      featured: false, published: true, tags: ['Ableton', 'Müzik Teorisi'],
      excerpt: `Tek bir notadan koca bir akor, basit bir akordan akan bir arpej. Teoriyi bilmeden de güzel armoniler kurmanın yolları.`,
      content: `<p>MIDI efektleri, çaldığınız notaları gerçek zamanlı olarak dönüştüren küçük araçlardır. Bu videoda üç tanesi gösteriliyor: Chord, Arpeggiator ve Scale.</p><p>Benim tavsiyem: önce tek bir notayla başlayın, efektleri teker teker ekleyin ve her adımda sonucu dinleyin.</p>`,
      sources: `MIDI — Vikipedi | https://tr.wikipedia.org/wiki/MIDI`, credits: `Video: Ableton, YouTube`
    },

    {
      id: 'post-4', kind: 'video', cat: 'muzik', title: 'Ableton’a Sıfırdan Başlamak', slug: 'abletona-sifirdan-baslamak',
      date: daysAgo(50), cover: '', video: YT('6fE5HwO-oxM'), tint: '',
      featured: false, published: true, tags: ['Ableton', 'Başlangıç'],
      excerpt: `Müzik üretmeye yeni başlayanlara en çok önerdiğim kaynak: iki buçuk saatlik, sıfırdan anlatılan kapsamlı bir kurs.`,
      content: `<p>Bir yazılımı öğrenmenin en iyi yolu, onunla küçük bir şey bitirmektir. Bu kursu izlerken her bölümün sonunda durup kendi sekiz ölçülük döngünüzü yapmayı deneyin.</p><ul><li>Oturum ve düzenleme görünümleri</li><li>Ses ve MIDI kanalları</li><li>Efektler ve otomasyon</li><li>Basit bir miks</li></ul>`,
      sources: '', credits: `Video: EDMProd, YouTube`
    },

    {
      id: 'vid-tinzo', kind: 'video', cat: 'muzik', title: 'Bodrum Katında Disco: Bir Seçki Nasıl Akar?', slug: 'bodrum-katinda-disco',
      date: daysAgo(56), cover: '', video: YT('4nvewes8Inc'), tint: '',
      featured: false, published: true, tags: ['DJ Set', 'Disco', 'Seçki'],
      excerpt: `Küçük bir oda, sıcak bir kalabalık ve kusursuz bir seçki. Parça seçiminin teknik becerilerden daha önemli olduğu anlar.`,
      content: `<p>Bu set teknik açıdan gösterişli değil, ama seçki o kadar iyi ki kimse geçişlere dikkat etmiyor. DJ’liğin özü de bu: doğru anda doğru parça.</p>`,
      sources: '', credits: `Video: Book Club Radio, YouTube`
    },

    {
      id: 'post-3', kind: 'yazi', cat: 'muzik', title: 'Gece Yarısı Stüdyo Notları', slug: 'gece-yarisi-studyo-notlari',
      date: daysAgo(62), cover: PIC('studyo-gece', 1600, 900), video: '', tint: '',
      featured: false, published: true, tags: ['Günlük', 'Stüdyo'],
      excerpt: `En iyi fikirler neden hep gece yarısından sonra gelir? Stüdyodan kısa notlar.`,
      content: `<p>Saat 02:14. Ekranda yarım kalmış bir proje, kulağımda tekrar eden bir döngü...</p><ul><li>Döngüyü değiştirmeden önce on kez dinle.</li><li>Yorulduysan kaydet ve kapat; sabah daha iyi duyacaksın.</li><li>Her proje bitmek zorunda değil; bazıları bir sonrakinin tohumu.</li></ul>`
        + quote('Gece, kimsenin bir şey beklemediği tek zaman.', 'Stüdyo duvarındaki not'),
      sources: '', credits: `Kapak: picsum.photos (örnek görsel)`
    },

    {
      id: 'vid-drums', kind: 'video', cat: 'muzik', title: 'R&B Davullarını Sıralamak, Şekillendirmek ve Mikslemek', slug: 'rnb-davullari',
      date: daysAgo(68), cover: '', video: YT('MsU8dXdbJFg'), tint: '',
      featured: false, published: true, tags: ['Davul', 'Miks'],
      excerpt: `Bir R&B parçasının ruhu davulun “geride” çalmasında saklı. Swing, ghost notalar ve hafif bir sıkıştırma ile o hissi yakalamak.`,
      content: `<p>Davulu ızgaraya tam oturtmak her zaman doğru değildir. Biraz gecikme ve biraz düzensizlik, insan çalıyormuş hissini verir.</p>`,
      sources: '', credits: `Video: Ableton, YouTube`
    },

    {
      id: 'post-5', kind: 'video', cat: 'muzik', title: 'Çalışırken Dinlemek: Lo-fi Neden Bu Kadar Sakinleştirici?', slug: 'lofi-neden-sakinlestirir',
      date: daysAgo(75), cover: '', video: YT('rUxyKA_-grg'), tint: '',
      featured: false, published: true, tags: ['Lo-fi', 'Psikoloji'],
      excerpt: `Sözsüz, tekrarlayan ve hafif tozlu bir ses. Milyonlarca kişinin çalışırken açtığı bu yayının sırrı ne?`,
      content: `<p>Lo-fi müziğin sakinleştirici etkisi tesadüf değil: sabit bir tempo, söz olmaması ve plak cızırtısı gibi “kusurlar”, dikkati dağıtmadan arka planda kalıyor.</p><p>Bir dahaki odaklanmanız gerektiğinde bu yayını açıp yirmi beş dakikalık bir çalışma turu deneyin.</p>`,
      sources: `Lo-fi müzik | https://en.wikipedia.org/wiki/Lo-fi_music`, credits: `Video: Lofi Girl, YouTube`
    }
  ];

  /* ======================================================================
     PODCAST SERİLERİ — Podcast sekmesindeki vitrin (dizideki sıra = vitrin sırası)
     status: 'devam' (Devam ediyor), 'tamam' (Tamamlandı), 'yakinda' (Yakında)
     trailer: fragman — ses dosyası ya da YouTube / Spotify / SoundCloud bağlantısı
     ====================================================================== */
  const series = [
    {
      id: 'seri-frekans', title: 'Frekans', slug: 'frekans', status: 'devam', frequency: 'Her Pazartesi', published: true,
      tagline: 'Müziğin, sesin ve hafızanın izinde',
      // Sitenin önceki sürümündeki program açıklamasıyla birebir aynı (geçişte örnek program böyle tanınır)
      description: 'Bazı hikâyeler ancak dinlenerek anlaşılır. Her bölümde müziğin, sesin ve hafızanın izini sürüyorum; görüntüden arınmış, sadece sesin gücüne yaslanan bir yolculuk.',
      cover: PIC('pod-show', 900, 900), coverAlt: 'Frekans podcastinin kapağı', tint: '#1F5A50', trailer: '',
      spotify: 'https://open.spotify.com/', apple: 'https://podcasts.apple.com/', youtube: ''
    },
    {
      id: 'seri-sofra', title: 'Sofra', slug: 'sofra', status: 'devam', frequency: 'İki haftada bir', published: true,
      tagline: 'Tariflerin arkasındaki insanlar',
      description: 'Bir yemeğin tarifi birkaç satırdır; hikâyesi ise bir ömür. Sofra’da annelerin defterlerinden, mahalle fırınlarından ve unutulmaya yüz tutmuş mutfaklardan sesler topluyorum.',
      cover: PIC('seri-sofra', 900, 900), coverAlt: 'Sofra podcastinin kapağı', tint: '#6B3A1F', trailer: '',
      spotify: '', apple: '', youtube: ''
    },
    {
      id: 'seri-satir-arasi', title: 'Satır Arası', slug: 'satir-arasi', status: 'yakinda', frequency: 'Her Perşembe', published: true,
      tagline: 'Gündemin gözden kaçan ayrıntıları',
      description: 'Haftanın en çok konuşulan haberini alıp satır aralarına bakıyoruz: kim söyledi, ne zaman söyledi ve neyi söylemedi? Yakında başlıyor; fragmanı şimdiden dinleyebilirsiniz.',
      cover: PIC('seri-satir', 900, 900), coverAlt: 'Satır Arası podcastinin kapağı', tint: '#2E3A5A', trailer: MP3(8),
      spotify: '', apple: '', youtube: ''
    }
  ];

  /* ======================================================================
     PODCAST BÖLÜMLERİ — series: bağlı olduğu seri
     ====================================================================== */
  const podcasts = [
    {
      id: 'pod-6', series: 'seri-frekans', title: 'Kulak Kurdu: Aklımızdan Çıkmayan Şarkılar', number: 6, date: daysAgo(3), duration: '34 dk',
      cover: PIC('pod-6', 800, 800), coverCredit: 'Kapak: picsum.photos (örnek görsel)', tint: '',
      audio: MP3(6), embed: '', tags: ['Müzik', 'Psikoloji', 'Hafıza'], published: true, featured: false,
      excerpt: `Sabah duyduğunuz bir reklam şarkısı neden akşama kadar kafanızda döner? Bu bölümde “kulak kurdu” denen o inatçı melodilerin peşine düşüyoruz: neden oluşuyorlar ve nasıl kurtuluruz?`,
      description:
        `<p>Şşş. Bir an durun. Şu anda kafanızda bir şarkı çalıyor mu? Çoğumuz için cevap “evet”.</p>`
        + `<p>Araştırmacılar bu duruma <em>kulak kurdu</em> diyor: bir melodinin istemsizce, tekrar tekrar zihnimizde çalması. İnsanların büyük çoğunluğu haftada en az bir kez yaşıyor.</p>`
        + fig('pod6-kulaklik', 'Kulak kurtları çoğu zaman en sıradan anlarda ortaya çıkar.', ORNEK)
        + `<h2>Hangi şarkılar yapışır?</h2><p>Basit, tekrar eden ve biraz da beklenmedik bir dönüşü olan melodiler. Kısa bir nakarat, tanıdık bir ritim ve tamamlanmamış hissi veren bir son.</p>`
        + quote('Bir şarkıdan kurtulmanın en iyi yolu, onu sonuna kadar dinlemektir.', 'Bölümdeki konuğumuz')
        + `<h2>Nasıl kurtuluruz?</h2><ul><li>Şarkıyı baştan sona bir kez dinlemek</li><li>Sakız çiğnemek (evet, işe yarıyor)</li><li>Dikkat isteyen bir işe odaklanmak</li></ul>`
        + `<p>Bir dahaki sefere bir melodi peşinizi bırakmadığında, belki de ona kızmak yerine neden size bu kadar dokunduğunu düşünün.</p>`,
      sources: `Earworm — Vikipedi | https://en.wikipedia.org/wiki/Earworm\nİstemsiz müzikal imgeleme | https://en.wikipedia.org/wiki/Involuntary_musical_imagery`
    },
    {
      id: 'pod-5', series: 'seri-frekans', title: 'Bir Şarkı Nasıl Hit Olur?', number: 5, date: daysAgo(10), duration: '29 dk',
      cover: PIC('pod-5', 800, 800), coverCredit: '', tint: '', audio: MP3(5), embed: '', tags: ['Müzik Endüstrisi', 'Prodüksiyon'], published: true, featured: false,
      excerpt: `Formülü olan bir sanat mı, yoksa şans mı? Hit şarkıların ortak noktalarını ve bu noktaların neden tek başına yetmediğini konuşuyoruz.`,
      description: `<p>Hit şarkıların çoğu benzer tempolarda, benzer uzunluklarda ve benzer yapılarda. Ama aynı formülle yazılan binlerce şarkı hiç duyulmuyor.</p>`
        + fig('pod5-sahne', 'Bir şarkının kaderi bazen tek bir canlı performansla değişir.', ORNEK)
        + `<p>Bu bölümde zamanlamanın, kültürel anın ve biraz da şansın rolünü konuşuyoruz.</p>`,
      sources: ''
    },
    {
      id: 'pod-4', series: 'seri-frekans', title: 'Sessizliğin Sesi', number: 4, date: daysAgo(17), duration: '26 dk',
      cover: PIC('pod-4', 800, 800), coverCredit: '', tint: '#2E3E52', audio: MP3(4), embed: '', tags: ['Ses', 'Bilim'], published: true, featured: false,
      excerpt: `Dünyanın en sessiz odasında kimse 45 dakikadan fazla kalamıyor. Sessizlik neden bu kadar rahatsız edici, müzikte neden bu kadar güçlü?`,
      description: `<p>Yankısız odalarda kendi kalp atışınızı, hatta kanınızın akışını duyabilirsiniz. Mutlak sessizlik aslında hiç sessiz değil.</p>`
        + quote('Müzik, notaların arasındaki sessizliktir.', 'Claude Debussy’ye atfedilen söz')
        + `<p>Müzikte sessizlik bir enstrüman gibi kullanılır: bir drop öncesindeki o tek ölçülük boşluk, bütün parçanın en heyecanlı anı olabilir.</p>`,
      sources: `Yankısız oda | https://en.wikipedia.org/wiki/Anechoic_chamber`
    },
    {
      id: 'pod-3', series: 'seri-frekans', title: 'Sesin Hafızası', number: 3, date: daysAgo(24), duration: '32 dk',
      cover: PIC('pod-3', 800, 800), coverCredit: 'Kapak: Akcan arşivi · picsum.photos', tint: '', audio: MP3(3), embed: '', tags: ['Müzik', 'Hafıza', 'Bilim'], published: true, featured: false,
      excerpt: `Bir şarkı bizi neden yıllar öncesine götürür? Tek bir melodi, unuttuğumuzu sandığımız bir yazı, bir odayı, bir kokuyu geri getirebilir. Bu bölümde müzik ile hafıza arasındaki o tuhaf bağın peşine düşüyoruz.`,
      description: `<p>Şşş. Kulaklığınızı takın. Bir şarkı çalmaya başlıyor ve bir anda on beş yıl öncesindesiniz.</p><p>Müzik, beynimizde duygularla ve anılarla aynı bölgelerde işleniyor. Bu yüzden bir şarkı bize sadece bir melodi değil, bir zaman dilimi de hatırlatıyor.</p>`
        + fig('pod-hafiza', 'Kaset çalar: hafızanın en sadık taşıyıcılarından biri.', ORNEK)
        + `<p>Araştırmacılar buna “anı tümseği” diyor: en çok 10 ile 30 yaş arasında dinlediğimiz şarkıları hatırlıyoruz.</p>`
        + quote('Müzik, kelimelerin bittiği yerde başlar.', 'Heinrich Heine')
        + `<p>Bir dahaki sefere bir şarkı sizi bir yere götürdüğünde, gözlerinizi kapatın ve yolculuğun tadını çıkarın.</p>`,
      sources: `Anı tümseği | https://en.wikipedia.org/wiki/Reminiscence_bump\nMüzik ve hafıza | https://en.wikipedia.org/wiki/Music-related_memory`
    },
    {
      id: 'pod-2', series: 'seri-frekans', title: 'Ritim ve Kalp Atışı', number: 2, date: daysAgo(31), duration: '28 dk',
      cover: PIC('pod-2', 800, 800), coverCredit: '', tint: '', audio: MP3(2), embed: '', tags: ['Bilim', 'Ritim'], published: true, featured: false,
      excerpt: `Neden 120 BPM civarındaki şarkılar bizi dansa kaldırıyor? Tempo, kalp atışı ve dans etme isteği arasındaki gizemli bağ.`,
      description: `<p>Dans müziğinin büyük kısmı 115 ile 130 BPM arasında. Bu aralık, yürürken attığımız adımların ve hafif egzersiz sırasındaki kalp atışımızın hızına çok yakın.</p><p>Bu bölümde ritmin bedenimizi nasıl “yakaladığını” konuşuyoruz.</p>`,
      sources: ''
    },
    {
      id: 'pod-1', series: 'seri-frekans', title: 'Merhaba Dünya: İlk Bölüm', number: 1, date: daysAgo(38), duration: '24 dk',
      cover: PIC('pod-1', 800, 800), coverCredit: '', tint: '', audio: MP3(1), embed: '', tags: ['Tanışma'], published: true, featured: false,
      excerpt: `Podcastin neden var olduğunu ve neler konuşacağımızı anlattığım tanışma bölümü.`,
      description: `<p>Merhaba! Bu ilk bölümde kendimi tanıtıyor, bu podcasti neden yapmak istediğimi ve önümüzdeki haftalarda hangi soruların peşine düşeceğimizi anlatıyorum.</p>`,
      sources: ''
    },
    /* ---------- Sofra ---------- */
    {
      id: 'pod-sofra-3', series: 'seri-sofra', title: 'Mahallenin Son Taş Fırını', number: 3, date: daysAgo(6), duration: '27 dk',
      cover: PIC('sofra-3', 800, 800), coverCredit: '', tint: '', audio: MP3(11), embed: '', tags: ['Ekmek', 'Mahalle'], published: true, featured: false,
      excerpt: `Sabah dörtte yanan bir fırın, kırk yıllık bir maya ve kuyruğa giren bütün bir mahalle.`,
      description: `<p>Fırıncı Hasan Usta’nın mayası kendisinden yaşlı. Bu bölümde taş fırının sabahını, ekmeğin kokusunu ve kapanan fırınlarla birlikte kaybettiklerimizi dinliyoruz.</p>`,
      sources: ''
    },
    {
      id: 'pod-sofra-2', series: 'seri-sofra', title: 'Bir Kavanoz Turşunun Sabrı', number: 2, date: daysAgo(20), duration: '22 dk',
      cover: PIC('sofra-2', 800, 800), coverCredit: '', tint: '', audio: MP3(10), embed: '', tags: ['Turşu', 'Gelenek'], published: true, featured: false,
      excerpt: `Turşu kurmak bir tarif değil, bir bekleme sanatı. Kışa hazırlığın unutulan ritüelleri.`,
      description: `<p>Ekim gelince balkonlar kavanozlarla dolardı. Bu bölümde turşunun, salçanın ve kurutmanın arkasındaki sabrı konuşuyoruz.</p>`,
      sources: ''
    },
    {
      id: 'pod-sofra-1', series: 'seri-sofra', title: 'Annemin Defteri', number: 1, date: daysAgo(34), duration: '25 dk',
      cover: PIC('sofra-1', 800, 800), coverCredit: '', tint: '', audio: MP3(9), embed: '', tags: ['Aile', 'Tarif'], published: true, featured: false,
      excerpt: `Sararmış bir tarif defteri, kenarına düşülmüş notlar ve bir annenin mutfağı.`,
      description: `<p>Sofra’nın ilk bölümünde annemin tarif defterini açıyorum: ölçüler “göz kararı”, notlar kurşun kalemle, her sayfada bir anı.</p>`,
      sources: ''
    }
  ];

  /* ======================================================================
     REMİXLER — Podcast bölümleriyle aynı düzen
     Her remixin kendi sayfası: kapak, italik özet, ses çubuğu ve remixin hikâyesi
     ====================================================================== */
  const remixes = [
    {
      id: 'rmx-1', title: 'Kıyı Işıkları (Akcan Remix)', slug: 'kiyi-isiklari-akcan-remix', original: 'Örnek Sanatçı – Kıyı Işıkları',
      genre: 'Melodic House', bpm: 122, duration: '6:48', date: daysAgo(3),
      cover: PIC('rmx-1', 800, 800), coverAlt: 'Kıyı Işıkları remixinin kapak görseli', coverCredit: ORNEK, tint: '',
      audio: MP3(7), embed: '', tags: ['House', 'Prodüksiyon', 'Gece'], published: true, featured: false,
      excerpt: `Akustik bir balad, gece yarısı bir sahil yolunda. Orijinaldeki piyano döngüsünü korudum; altına nefes alan bir bas ve yavaş yavaş açılan bir synth yerleştirdim.`,
      description: `<p>Bu şarkıyı ilk duyduğumda bir sahil yolunda, camdan akan sokak ışıklarını izliyordum. Orijinali sakin, neredeyse fısıltı gibi bir balad; ama piyanosunun içinde saklı bir ritim vardı.</p>`
        + `<h2>Fikir</h2><p>Remixin tamamı tek bir soruya dayanıyor: Bu piyano döngüsü 122 BPM’de nasıl nefes alır? Akorlara dokunmadım. Yalnızca aralarına boşluk bıraktım ve her dört ölçüde bir kapanıp açılan bir filtre ekledim.</p>`
        + fig('rmx1-studyo', 'Piyano kaydı stem’lere ayrıldıktan sonra her kanal ayrı ayrı işlendi.', ORNEK, 'flo flo-right', 900, 1100)
        + `<h2>Prodüksiyon notları</h2><ul><li>Vokal yarım ton aşağı alındı; böylece bas hattıyla çakışmıyor.</li><li>Bas, davul vuruşlarıyla birlikte hafifçe “nefes alıyor” (sidechain sıkıştırma).</li><li>Son iki dakika DJ setlerinde rahat geçiş için yalnızca ritim ve atmosfer.</li></ul>`
        + quote('Bir remix şarkıyı yeniden yazmak değildir; ona başka bir odada çalma şansı vermektir.', 'Stüdyo defterimden')
        + `<p>Bu sürümü ilk kez bir gün batımı setinde çaldım. Pistin aynı anda hem sessizleşip hem dalgalandığı o anı hâlâ hatırlıyorum.</p>`,
      sources: `Remix — Vikipedi | https://en.wikipedia.org/wiki/Remix\nDinamik aralık sıkıştırma | https://en.wikipedia.org/wiki/Dynamic_range_compression`
    },
    {
      id: 'rmx-2', title: 'Beton Çiçekler (Akcan Edit)', slug: 'beton-cicekler-akcan-edit', original: 'Örnek Sanatçı – Beton Çiçekler',
      genre: 'Melodic Techno', bpm: 124, duration: '7:12', date: daysAgo(11),
      cover: PIC('rmx-2', 800, 800), coverAlt: 'Beton Çiçekler editinin kapak görseli', coverCredit: ORNEK, tint: '#2E3E52',
      audio: MP3(8), embed: '', tags: ['Techno', 'Kulüp', 'Prodüksiyon'], published: true, featured: false,
      excerpt: `Dört dakikalık bir radyo şarkısını yedi dakikalık bir kulüp parçasına dönüştüren uzun bir edit: uzayan bir intro, karanlık bir ara bölüm ve tek bir vokal satırının etrafında dönen bir doruk.`,
      description: `<p>Edit, remixin daha sade kardeşi. Yeni bir şey eklemekten çok var olanı yeniden sıralamak demek: şarkının en güçlü anlarını bulup onlara daha fazla yer açmak.</p>`
        + `<h2>Edit ile remix arasındaki fark</h2><p>Remixte şarkının parçalarını alıp yeni bir yapı kurarsınız. Editte ise orijinal kayda sadık kalır, onu yalnızca kesip uzatır ve yeniden dizersiniz. Bu parçada eklediğim tek yeni ses, ara bölümdeki alçak bir drone.</p>`
        + fig('rmx2-kulup', 'Uzun intro, DJ’in önceki parçadan rahatça geçebilmesi için.', ORNEK, 'wide', 1800, 800)
        + `<h2>Yapı</h2><ol><li><strong>0:00 – 1:30</strong> Yalnızca davul ve bas: geçiş için temiz bir zemin.</li><li><strong>1:30 – 3:45</strong> Orijinalin nakaratı, iki kat uzatılmış hâliyle.</li><li><strong>3:45 – 5:00</strong> Karanlık ara bölüm: vokal susuyor, drone yükseliyor.</li><li><strong>5:00 – 7:12</strong> Doruk ve tek vokal satırıyla çıkış.</li></ol>`
        + `<p>Bu editi en çok gecenin ortasında, enerji yükselmeden hemen önce çalıyorum.</p>`,
      sources: `Techno — Vikipedi | https://en.wikipedia.org/wiki/Techno`
    },
    {
      id: 'rmx-3', title: 'Eski Radyo (Akcan Rework)', slug: 'eski-radyo-akcan-rework', original: 'Örnek Sanatçı – Eski Radyo',
      genre: 'Lo-fi House', bpm: 112, duration: '5:36', date: daysAgo(20),
      cover: PIC('rmx-3', 800, 800), coverAlt: 'Eski Radyo reworkünün kapak görseli', coverCredit: ORNEK, tint: '#7A4E1E',
      audio: MP3(9), embed: '', tags: ['Lo-fi', 'Örnekleme', 'Plak'], published: true, featured: false,
      excerpt: `Tozlu bir plak sesi, yavaşlatılmış bir groove ve bolca boşluk. Eski bir radyo kaydını bir pazar sabahına taşıyan sıcak bir rework.`,
      description: `<p>Bu parça bir bit pazarında bulduğum kayıtla başladı. Kaydın kendisi kötü durumdaydı; ama o cızırtının içinde bir sıcaklık vardı ve onu temizlemek yerine parçanın merkezine koymaya karar verdim.</p>`
        + fig('rmx3-plak', 'Cızırtı bir kusur değil, parçanın dokusu.', ORNEK, 'flo flo-left', 900, 900)
        + `<h2>Kusuru korumak</h2><p>Lo-fi’ın sırrı, hataları bilerek bırakmak: hafifçe kayan bir tempo, biraz bant doygunluğu, tam oturmayan bir davul. Her şey kusursuz olduğunda müzik soğuyor.</p>`
        + quote('Bazen bir parçayı güzelleştiren şey, onda düzeltmediğiniz yerdir.', 'Stüdyo defterimden')
        + `<h2>Örneklemeden önce</h2><p>Başkasına ait bir kaydı yayınlanacak bir parçada kullanmadan önce izin almak gerekir. Bu rework şimdilik yalnızca setlerimde çalıyor.</p>`,
      sources: `Lo-fi müzik | https://en.wikipedia.org/wiki/Lo-fi_music\nÖrnekleme (müzik) | https://en.wikipedia.org/wiki/Sampling_(music)`
    },
    {
      id: 'rmx-4', title: 'Çöl Rüzgârı (Akcan Remix)', slug: 'col-ruzgari-akcan-remix', original: 'Örnek Sanatçı – Çöl Rüzgârı',
      genre: 'Afro House', bpm: 118, duration: '6:20', date: daysAgo(32),
      cover: PIC('rmx-4', 800, 800), coverAlt: 'Çöl Rüzgârı remixinin kapak görseli', coverCredit: ORNEK, tint: '',
      audio: MP3(10), embed: '', tags: ['Afro', 'Perküsyon', 'House'], published: true, featured: false,
      excerpt: `Perküsyon ağırlıklı, sıcak bir yorum. Vokali yarı hızda kullanıp bir koro gibi katmanladım; altında üç farklı ritmin aynı anda konuştuğu bir zemin var.`,
      description: `<p>Orijinal şarkı tek bir gitar ve bir sesten ibaret. Ben ise ona bir kalabalık eklemek istedim: el davulları, shaker’lar ve uzaktan gelen bir koro.</p>`
        + `<h2>Üç ritim, tek groove</h2><p>Davullar dörtlük bir zemin çalarken konga üçlük, shaker ise altılık bir figür çalıyor. Poliritim denen bu yapı, parçaya hiç durmayan bir hareket hissi veriyor.</p>`
        + fig('rmx4-perkusyon', 'Perküsyonların çoğu tek tek elle kaydedildi.', ORNEK)
        + `<p>Koro aslında tek bir vokal: yarı hızda, dört farklı perdede ve hafif gecikmelerle üst üste bindirildi.</p>`
        + quote('Ritim, bedenin müziği anladığı dildir.', 'Bir set sonrası notlarımdan'),
      sources: `Poliritim | https://en.wikipedia.org/wiki/Polyrhythm\nHouse müzik | https://en.wikipedia.org/wiki/House_music`
    },
    {
      id: 'rmx-5', title: 'Son Vapur (Akcan Bootleg)', slug: 'son-vapur-akcan-bootleg', original: 'Örnek Sanatçı – Son Vapur',
      genre: 'Organic House', bpm: 120, duration: '6:05', date: daysAgo(45),
      cover: PIC('rmx-5', 800, 800), coverAlt: 'Son Vapur bootleginin kapak görseli', coverCredit: ORNEK, tint: '#1E4A5A',
      audio: MP3(11), embed: '', tags: ['Organic', 'Bootleg', 'Şehir'], published: true, featured: false,
      excerpt: `Akustik gitar, el perküsyonu ve bir vapur düdüğü. Resmî olarak yayınlanmayan, yalnızca setlerde çaldığım bir bootleg.`,
      description: `<p>Bir akşam son vapurda kayda aldığım düdük sesi bu parçanın ilk notası oldu. Onu orijinal şarkının gitarıyla buluşturunca ortaya şehrin kendisi gibi bir parça çıktı: hem dingin hem telaşlı.</p>`
        + `<h2>Bootleg nedir?</h2><p>Bootleg, hak sahiplerinden izin alınmadan yapılan gayriresmî bir remix. Bu yüzden müzik platformlarında yayınlanamıyor; DJ’ler onu yalnızca setlerinde çalıyor.</p>`
        + fig('rmx5-vapur', 'Parçanın ilk notası: son vapurun düdüğü.', ORNEK, 'flo flo-right', 900, 1100)
        + `<p>Bir gün izin alabilirsem resmî bir remix olarak yayınlamayı çok isterim. O zamana kadar bu sayfada ve setlerde yaşamaya devam edecek.</p>`,
      sources: `Mashup (müzik) | https://en.wikipedia.org/wiki/Mashup_(music)\nAlan kaydı | https://en.wikipedia.org/wiki/Field_recording`
    },
    {
      id: 'rmx-6', title: 'Neon Yağmur (Akcan Remix)', slug: 'neon-yagmur-akcan-remix', original: 'Örnek Sanatçı – Neon Yağmur',
      genre: 'Progressive House', bpm: 126, duration: '7:40', date: daysAgo(58),
      cover: PIC('rmx-6', 800, 800), coverAlt: 'Neon Yağmur remixinin kapak görseli', coverCredit: ORNEK, tint: '',
      audio: MP3(12), embed: '', tags: ['Progressive', 'Synth', 'Kulüp'], published: true, featured: false,
      excerpt: `Yavaş yavaş açılan arpejler, uzun bir yükseliş ve yağmur sesine karışan bir synth. Gece yarısından sonra çalınmak için.`,
      description: `<p>Progressive house sabır ister: parça her on altı ölçüde yalnızca küçük bir şey değiştirir ve sizi fark ettirmeden bambaşka bir yere götürür.</p>`
        + `<h2>Arpejin yolculuğu</h2><p>Bütün parça tek bir arpejin etrafında dönüyor. Başta yalnızca üç notası duyuluyor; filtre açıldıkça notalar çoğalıyor ve yedinci dakikada bütün akor ortaya çıkıyor.</p>`
        + fig('rmx6-synth', 'Arpej, tek bir synth kanalından geliyor.', ORNEK, 'wide', 1800, 800)
        + `<p>Arka plandaki yağmur sesi gerçek bir kayıt: stüdyonun penceresinden, bir kasım gecesi.</p>`
        + quote('En iyi yükseliş, ne zaman başladığını fark etmediğiniz yükseliştir.', 'Stüdyo defterimden'),
      sources: `Progressive house | https://en.wikipedia.org/wiki/Progressive_house\nArpej | https://en.wikipedia.org/wiki/Arpeggio`
    }
  ];

  /* ======================================================================
     ÖZEL SAYFALAR
     ====================================================================== */
  /* ======================================================================
     KİTAPLAR — basılı kitaplar ve satış platformları (dizideki sıra = vitrin sırası)
     status: 'yayinda', 'onsiparis', 'yakinda' · format: 'karton', 'ciltli', 'ekitap', 'sesli'
     Örnek satış bağlantıları platformlarda kitabın adıyla arama yapar
     ====================================================================== */
  const shops = (q) => {
    const k = encodeURIComponent(q);
    return {
      amazon: `https://www.amazon.com.tr/s?k=${k}`, dr: `https://www.dr.com.tr/search?q=${k}`,
      kitapyurdu: `https://www.kitapyurdu.com/index.php?route=product/search&filter_name=${k}`, idefix: `https://www.idefix.com/arama?q=${k}`,
      bkm: `https://www.bkmkitap.com/arama?q=${k}`, hepsiburada: `https://www.hepsiburada.com/ara?q=${k}`, trendyol: `https://www.trendyol.com/sr?q=${k}`
    };
  };
  const books = [
    {
      id: 'kitap-1', title: 'Sesin Hafızası', subtitle: 'Bir şarkı bizi neden yıllar öncesine götürür?', slug: 'sesin-hafizasi',
      tagline: 'Müzik, hafıza ve duygular üzerine bir deneme', status: 'yayinda', date: '2024-03-15',
      publisher: 'Örnek Yayınları', pages: 240, isbn: '978-605-000-000-1', edition: '2. baskı', language: 'Türkçe', format: 'karton',
      cover: PIC('kitap-sesin-hafizasi', 800, 1200), coverAlt: 'Sesin Hafızası kitabının kapağı', tint: '#3E2A4A', published: true,
      tags: ['Müzik', 'Hafıza', 'Deneme'], ...shops('Sesin Hafızası'),
      quote: 'Bir şarkıyı hatırlamıyoruz; şarkı bizi hatırlıyor.',
      description: `<p>Kulaklığınızı taktığınız an on beş yıl öncesine dönebilirsiniz. <em>Sesin Hafızası</em>, müziğin beynimizde duygularla ve anılarla nasıl iç içe işlendiğini anlatan bir deneme.</p>`
        + `<p>Anı tümseğinden kulak kurtlarına, ninnilerden stadyum marşlarına uzanan bu yolculukta, her bölüm bir şarkıyla başlıyor.</p>`
    },
    {
      id: 'kitap-2', title: 'Gece Yarısı Stüdyo Notları', subtitle: 'Bir prodüktörün defterinden', slug: 'gece-yarisi-studyo-notlari',
      tagline: 'Remix, prodüksiyon ve sahne arkasından hikâyeler', status: 'yayinda', date: '2022-11-02',
      publisher: 'Örnek Yayınları', pages: 184, isbn: '978-605-000-000-2', edition: '1. baskı', language: 'Türkçe', format: 'ciltli',
      cover: PIC('kitap-studyo-notlari', 800, 1200), coverAlt: 'Gece Yarısı Stüdyo Notları kitabının kapağı', tint: '#1E3A4A', published: true,
      tags: ['Prodüksiyon', 'Remix', 'Stüdyo'], ...shops('Gece Yarısı Stüdyo Notları'),
      quote: '',
      description: `<p>On yıl boyunca gece yarılarında tutulmuş stüdyo notları: bir remixin nasıl doğduğu, bir sesin nasıl yakalandığı ve hiç yayınlanmayan parçaların neden yayınlanmadığı.</p>`
    },
    {
      id: 'kitap-3', title: 'Frekans', subtitle: 'Dinlemenin kısa tarihi', slug: 'frekans-dinlemenin-kisa-tarihi',
      tagline: 'Fonograftan kulaklığa, dinlemenin hikâyesi', status: 'onsiparis', date: '2026-12-01',
      publisher: 'Örnek Yayınları', pages: 312, isbn: '978-605-000-000-3', edition: '1. baskı', language: 'Türkçe', format: 'karton',
      cover: PIC('kitap-frekans', 800, 1200), coverAlt: 'Frekans kitabının kapağı', tint: '#4A3A1E', published: true,
      tags: ['Müzik', 'Tarih', 'Ses'], ...shops('Frekans Dinlemenin Kısa Tarihi'),
      quote: 'Kulak kapakları olmayan tek organımızdır.',
      description: `<p>Edison'un fonografından cebimizdeki kulaklığa, insanlığın sesle ilişkisinin kısa tarihi. Ön siparişle aralık ayında okurlarla buluşuyor.</p>`
    }
  ];

  /* ======================================================================
     KAYNAKLAR — videolarda ve yazılarda anılan araçlar, rehberler, bağlantılar (en yeni önde)
     type: settings.resourceTypes kimliği · pinned: Kaynaklar sayfasında öne çıkan
     related: sitedeki içerik ('posts:<id>', 'podcasts:<id>', 'remixes:<id>')
     ====================================================================== */
  const resources = [
    {
      id: 'kaynak-1', title: 'Ev stüdyosu kurulum rehberi', slug: 'ev-studyosu-kurulum-rehberi', type: 'rehber', pinned: true, date: '2026-10-12',
      summary: 'Küçük bir odayı kayıt yapılabilir bir stüdyoya çevirmek için akustik, ekipman ve yerleşim üzerine adım adım notlar.',
      cover: PIC('kaynak-ev-studyosu', 1280, 720), coverAlt: 'Masada ses kartı, mikrofon ve stüdyo monitörleri', tint: '#2A3550', published: true,
      url: 'https://en.wikipedia.org/wiki/Recording_studio', urlLabel: 'Kayıt stüdyosu nedir?',
      links: [
        { label: 'Akustik', url: 'https://tr.wikipedia.org/wiki/Akustik' },
        { label: 'Ses kartı', url: 'https://tr.wikipedia.org/wiki/Ses_kart%C4%B1' },
        { label: 'Mikrofon', url: 'https://tr.wikipedia.org/wiki/Mikrofon' }
      ],
      related: ['posts:vid-james-hype'], tags: ['Stüdyo', 'Akustik', 'Ekipman'],
      body: '<p>İyi bir kayıt için pahalı ekipmandan önce doğru oda gelir. Bu rehber, küçük bir odada nelere dikkat ettiğimi sırasıyla anlatıyor.</p>'
        + '<h2>Oda ve akustik</h2><p>Paralel duvarlar arasındaki yankıyı kırmak için kitaplık, halı ve kalın perdeler çoğu zaman yeterli. Dinleme noktasını odanın tam ortasına değil, üçte birine koyun.</p>'
        + '<h2>Ekipman sırası</h2><ul><li>Önce kulaklık ve iki girişli bir ses kartı</li><li>Sonra dinamik bir mikrofon</li><li>En son bir çift stüdyo monitörü</li></ul>'
        + '<h2>Yerleşim</h2><p>Monitörler kulak hizasında ve sizinle eşkenar üçgen oluşturacak açıda durmalı.</p>'
    },
    {
      id: 'kaynak-2', title: 'Audacity: ücretsiz ses düzenleyici', slug: 'audacity', type: 'arac', pinned: true, date: '2026-10-05',
      summary: 'Kayıt, kesme, gürültü azaltma ve dışa aktarma için açık kaynaklı, ücretsiz bir ses düzenleme programı.',
      cover: PIC('kaynak-audacity', 1280, 720), coverAlt: 'Ekranda ses dalgası düzenlenen bir program', tint: '#1F3A5A', published: true,
      url: 'https://www.audacityteam.org/download/', urlLabel: 'Audacity\'yi indir',
      links: [{ label: 'Kullanım kılavuzu', url: 'https://manual.audacityteam.org/' }],
      related: ['posts:vid-remix-ableton'], tags: ['Ses', 'Ücretsiz', 'Kurgu'],
      body: '<p>Podcast bölümlerinin ilk kurgusunu ve hızlı gürültü temizliğini hâlâ bu programla yapıyorum. Windows, macOS ve Linux\'ta çalışıyor.</p>'
    },
    {
      id: 'kaynak-3', title: 'Bicep\'in Printworks seti', slug: 'bicep-printworks-seti', type: 'video', date: '2026-09-28',
      summary: 'Videoda parça parça incelediğim canlı performansın kendisi: önce bütününü izleyin, sonra incelemeye dönün.',
      cover: PIC('kaynak-bicep', 1280, 720), coverAlt: 'Karanlık bir sahnede ışık huzmeleri', tint: '#3A2450', published: true,
      url: 'https://www.youtube.com/results?search_query=Bicep+Printworks', urlLabel: 'YouTube\'da izle',
      related: ['posts:vid-bicep'], tags: ['Canlı performans', 'Elektronik müzik']
    },
    {
      id: 'kaynak-4', title: 'This Is Your Brain on Music', slug: 'this-is-your-brain-on-music', type: 'kitap', date: '2026-09-20',
      summary: 'Daniel Levitin\'in müziğin beyinde nasıl işlendiğini anlatan kitabı; "Sesin Hafızası" bölümlerinin çıkış noktası.',
      cover: PIC('kaynak-levitin', 1280, 720), coverAlt: 'Açık bir kitap ve yanında kulaklık', tint: '#4A3A1E', published: true,
      url: 'https://www.google.com/search?tbm=bks&q=This+Is+Your+Brain+on+Music', urlLabel: 'Kitabı bul',
      tags: ['Kitap', 'Müzik', 'Beyin']
    },
    {
      id: 'kaynak-5', title: 'Freesound: telifsiz ses arşivi', slug: 'freesound', type: 'site', date: '2026-09-14',
      summary: 'Yağmurdan şehir gürültüsüne, kayıtlarda kullanabileceğiniz binlerce Creative Commons lisanslı ses.',
      cover: PIC('kaynak-freesound', 1280, 720), coverAlt: 'Mikrofonla dışarıda ses kaydı yapan biri', tint: '#1E4A3A', published: true,
      url: 'https://freesound.org/search/?q=rain', urlLabel: 'Freesound\'da ara',
      links: [{ label: 'Lisanslar hakkında', url: 'https://freesound.org/help/faq/' }],
      tags: ['Ses efekti', 'Ücretsiz', 'Lisans']
    },
    { id: 'kaynak-6', title: 'Çevrim içi metronom', slug: 'cevrim-ici-metronom', type: 'site', url: 'https://www.google.com/search?q=metronome', published: true }
  ];

  const pages = [
    {
      id: 'page-1', title: 'Stüdyo & Ekipmanlar', slug: 'ekipmanlar', cover: PIC('studio-gear', 1600, 900), published: true,
      excerpt: 'Müzik üretirken ve podcast kaydederken kullandığım ses kartları, mikrofonlar, kulaklıklar ve yazılımlar.',
      content: `<p>Sıkça sorulan stüdyo ekipmanlarımın ve müzik prodüksiyonunda kullandığım araçların güncel listesi:</p>`
        + `<h2>Donanım</h2><ul><li><strong>Kulaklık:</strong> Kapalı ve açık tip birer stüdyo kulaklığı</li><li><strong>Ses kartı:</strong> İki girişli bir USB ses kartı</li><li><strong>Mikrofon:</strong> Dinamik bir yayın mikrofonu</li><li><strong>MIDI klavye:</strong> 49 tuşlu bir kontrolcü</li><li><strong>Monitörler:</strong> Bir çift 7 inç stüdyo monitörü</li></ul>`
        + fig('gear-masa', 'Masanın son hâli.', ORNEK)
        + `<h2>Yazılım</h2><ul><li><strong>DAW:</strong> Ableton Live</li><li><strong>Sentezleyiciler:</strong> Wavetable ve analog modelleme eklentileri</li><li><strong>Miks ve mastering:</strong> EQ, kompresör ve limiter eklentileri</li></ul>`
        + quote('Önemli olan hangi ekipmana sahip olduğunuz değil, onu nasıl kullandığınızdır.', 'Her stüdyonun duvarında yazması gereken söz')
    },
    {
      id: 'page-2', title: 'İletişim', slug: 'iletisim', cover: '', published: true,
      excerpt: 'İş birlikleri, remix talepleri, etkinlik davetleri ve podcast konuk önerileri için.',
      content: `<p>Bana ulaşmanın en hızlı yolu e-posta: <a href="mailto:merhaba@ornek.com">merhaba@ornek.com</a></p>`
        + `<h2>Hangi konularda yazabilirsiniz?</h2><ul><li>Remix ve prodüksiyon iş birlikleri</li><li>DJ seti ve etkinlik davetleri</li><li>Podcast için konuk ve konu önerileri</li><li>Basın ve röportaj talepleri</li></ul>`
        + `<p>Her mesajı okuyorum; yanıt vermem bazen birkaç gün sürebilir.</p>`
        + `<p><em>Bu sayfa bir örnektir: Panel → Özel Sayfalar bölümünden düzenleyebilir, “Menüde göster” anahtarıyla menüden kaldırabilirsiniz.</em></p>`
    }
  ];

  const menu = [
    { id: 'm2', label: 'Videolar', type: 'videos', target: '', visible: true, newTab: false },
    { id: 'm1', label: 'Yazılar', type: 'blog', target: '', visible: true, newTab: false },
    { id: 'm3', label: 'Podcast', type: 'podcast', target: '', visible: true, newTab: false },
    { id: 'm4', label: 'Remixler', type: 'remixes', target: '', visible: true, newTab: false },
    // Kitaplar sekmesi hazır ama menüde gizli: Menü Yönetimi'nden açılır
    { id: 'm8', label: 'Kitaplar', type: 'books', target: '', visible: false, newTab: false },
    // Kaynaklar sekmesi hazır ama menüde gizli: Menü Yönetimi'nden açılır
    { id: 'm9', label: 'Kaynaklar', type: 'resources', target: '', visible: false, newTab: false },
    { id: 'm5', label: 'Ekipmanlar', type: 'page', target: 'ekipmanlar', visible: true, newTab: false },
    { id: 'm6', label: 'Hakkında', type: 'about', target: '', visible: true, newTab: false },
    { id: 'm7', label: 'İletişim', type: 'page', target: 'iletisim', visible: true, newTab: false }
  ];

  /* ======================================================================
     HAKKINDA
     ====================================================================== */
  const about = {
    name: 'Akcan',
    role: 'DJ · Prodüktör · Anlatıcı',
    // Referanstaki gibi karanlık, tek kişiye odaklı bir sahne fotoğrafı (picsum #453)
    photo: 'https://picsum.photos/id/453/1920/1280',
    heroLeft: 'sesle\nbaşlar,',
    heroRight: 'ritimle\nbiter.',
    lead: 'Dinlemek için,\nsusmak gerek.',
    accent: '#3A9FF0',
    bio: `<p>Bir şarkıyı ilk kez duyduğumda durup onu sonuna kadar takip etmeden rahat edemiyorum. Bir sesin nereden geldiği, bir ritmin neden insanı yerinden kaldırdığı, bir melodinin neden yıllar sonra bile aklımızdan çıkmadığı… Bu sitede o merakın peşinden gidiyorum.</p>`
      + `<p>Burada <a href="#/yazilar">videolarımı ve yazılarımı</a>, <a href="#/podcast">podcast bölümlerimi</a> ve <a href="#/remixler">remixlerimi</a> paylaşıyorum.</p>`
      + `<h2>Nasıl buraya geldim?</h2><p>Müzikle ilişkim bir kulaklık ve eski bir bilgisayarla başladı. Önce başkalarının şarkılarını söküp yeniden kurdum, sonra kendi parçalarımı yazmaya başladım. Zamanla sahnelere, stüdyolara ve mikrofonun önüne taşındı.</p>`
      + `<p>Yıllar içinde kulüplerde çaldım, başka sanatçılar için remixler yaptım ve müziğin arkasındaki hikâyeleri anlatmaya başladım.</p>`
      + `<h2>Şu sıralar</h2><p>Haftada bir video ya da yazı, iki haftada bir podcast bölümü yayınlamaya çalışıyorum. Stüdyoda ne kullandığımı merak ediyorsanız <a href="#/sayfa/ekipmanlar">ekipman listeme</a> göz atabilirsiniz.</p>`
      + `<p><em>Bu metin bir örnektir; Panel → Hakkında bölümünden düzenleyebilirsiniz.</em></p>`
  };

  global.AKCAN_ORNEK = { posts, series, podcasts, remixes, books, resources, pages, menu, about, featuredId: 'vid-bicep' };
})(window);
