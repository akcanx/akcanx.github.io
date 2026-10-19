/* ==========================================================================
   Akcan — SEO & GEO puanı
   Panelde her içeriğin arama motorları ve yapay zekâ için ne kadar hazır olduğunu
   0–100 arası puanlar ve neyin iyileştirilebileceğini söyler.
   - Kurallıdır: yapay zekâ servisi, anahtar ya da sunucu kullanmaz.
   - Başlık, açıklama ve görsel sitenin kullanacağı değerlerin aynısıdır (Render.seoOf).
   - Hiçbir alanı değiştirmez; yalnızca okur.
   ========================================================================== */
(function (global) {
  'use strict';

  const S = global.Store;
  // Kullanıcının yazdığı kısa açıklama alanı ve ana metin (türe göre)
  const SUMMARY = { posts: 'excerpt', podcasts: 'excerpt', remixes: 'excerpt', pages: 'excerpt', books: 'tagline', series: 'tagline' };
  const BODY = { posts: 'content', pages: 'content' };
  const NO_TAGS = ['pages', 'series'];

  /** Önerilen en az kelime: blog yazısı ve özel sayfa 300, diğerleri 80 */
  const minWords = (col, x) => ((col === 'posts' && S.postKind(x) === 'yazi') || col === 'pages' ? 300 : 80);

  /**
   * İçeriğin puanı: { puan, maddeler: [{ ad, ok: true|false|'yarim', puan, en, oneri }] }
   * opt.R: Render örneği (seoOf için), opt.imgW: biliniyorsa görselin ölçülen genişliği
   */
  function score(col, item, opt) {
    const x = item || {};
    const seo = opt.R.seoOf(col, x);
    const body = String(x[BODY[col] || 'description'] || '');
    const words = S.wordCount(body);
    const out = [];
    const add = (ad, en, ok, oneri) => out.push({ ad, ok, puan: ok === true ? en : ok === 'yarim' ? en / 2 : 0, en, oneri: ok === true ? '' : oneri });

    const tl = seo.title.length;
    add('Başlık', 15, tl <= 60, `Başlık ${tl} karakter; Google ~60'tan sonrasını keser. Kısa bir SEO başlığı yazın.`);

    const written = S.strip(x.seoDesc || x[SUMMARY[col]] || '');
    const ASK = 'Özet ya da SEO açıklaması yazın (150–160 karakter).';
    if (written) {
      const n = written.length;
      add('Açıklama', 20, n >= 70 && n <= 160 ? true : 'yarim', `Açıklama ${n} karakter; 150–160 karakter önerilir.`);
    } else add('Açıklama', 20, S.strip(body) ? 'yarim' : false, ASK);

    if (!seo.image) add('Görsel', 15, false, 'Kapak ya da paylaşım görseli ekleyin.');
    else if (opt.imgW && opt.imgW < 1200) out.push({ ad: 'Görsel', ok: 'yarim', puan: 10, en: 15, oneri: 'Google Discover büyük görsel için en az 1200 px ister.' });
    else add('Görsel', 15, true);

    add('Görsel açıklaması', 10, !(x.cover && !String(x.coverAlt || '').trim()), 'Kapak açıklaması (alt metin) yok.');

    const min = minWords(col, x);
    add('İçerik derinliği', 20, words >= min ? true : words >= min / 2 ? 'yarim' : false,
      `Metin ${words} kelime; en az ${min} kelime önerilir — arama motorları ve yapay zekâ bu metni okur.`);

    add('Ara başlık', 10, words < 600 || /<h[23][\s>]/i.test(body), 'Uzun metni ara başlıklarla (H2) bölün.');
    add('Etiketler', 5, NO_TAGS.includes(col) || (x.tags || []).length > 0, 'Etiket ekleyin.');
    add('Adres', 5, (x.slug || S.slugify(x.title || '')).length <= 60, 'Bağlantı (slug) kısa olsun.');

    return { puan: out.reduce((t, m) => t + m.puan, 0), maddeler: out };
  }

  /** ≥ 80 iyi, 50–79 orta, < 50 zayıf */
  const level = (puan) => (puan >= 80 ? 'iyi' : puan >= 50 ? 'orta' : 'zayif');

  /** İyileştirme önerileri: en çok puan kazandıracak olan önce */
  const oneriler = (sonuc) => sonuc.maddeler.filter((m) => m.ok !== true).sort((a, b) => (b.en - b.puan) - (a.en - a.puan)).map((m) => m.oneri);

  global.SEO = { score, level, oneriler };
})(typeof window !== 'undefined' ? window : globalThis);
