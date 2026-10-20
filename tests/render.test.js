/* Sayfa şablonları: Podcast seri vitrini, seri ve bölüm sayfaları, adresler */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { S, Render } = require('./yukle');

const R = Render.create(S.normalize({}), { mode: 'local' });
const pod6 = () => S.normalize({}).podcasts.find((p) => p.id === 'pod-6');
const count = (html, re) => (html.match(re) || []).length;

test('vitrin', () => {
  const pg = R.page('podcast');
  assert.equal(count(pg.html, /class="scard/g), 3);
  assert.ok(pg.html.indexOf('Frekans') < pg.html.indexOf('Sofra'));
  assert.match(pg.html, /class="sbadge">Yakında</);
  assert.match(pg.html, /3 seri · 9 bölüm/);
  assert.equal(count(pg.html, /class="ep reveal"/g), 6); // son bölümler
});

test('seri-sayfasi', () => {
  const pg = R.page('podcast/frekans');
  assert.match(pg.html, /<h1[^>]*>Frekans<\/h1>/);
  assert.equal(count(pg.html, /class="ep reveal"/g), 6);
  assert.ok(pg.schema.some((n) => n['@type'] === 'PodcastSeries'));
});

test('fragman', () => {
  const pg = R.page('podcast/satir-arasi');
  assert.match(pg.html, /data-play="seri:seri-satir-arasi"/);
  assert.equal(pg.noindex, true);
  assert.equal(R.findItem('seri', 'seri-satir-arasi').audio.endsWith('.mp3'), true);
});

test('bolum-sayfasi', () => {
  const ep = pod6();
  const pg = R.page('podcast/frekans/' + ep.slug);
  const node = pg.schema.find((n) => n['@type'] === 'PodcastEpisode');
  assert.match(node.partOfSeries['@id'], /podcast\/frekans\/?#seri$/); // yerel önizlemede adresin sonunda / yok
  assert.deepEqual(pg.crumbs.map((c) => c.route), ['podcast', 'podcast/frekans', 'podcast/frekans/' + ep.slug]);
});

test('eski-adresler', () => {
  const ep = pod6();
  assert.deepEqual(R.page('podcast/' + ep.slug), { redirect: 'podcast/frekans/' + ep.slug });
  assert.deepEqual(R.page('bolum/pod-6'), { redirect: 'podcast/frekans/' + ep.slug });
  assert.deepEqual(R.page('podcast/muzik'), { redirect: 'podcast' });
  assert.deepEqual(R.page('podcast/sofra/' + ep.slug), { redirect: 'podcast/frekans/' + ep.slug });
  assert.deepEqual(R.page('podcast/yok-boyle'), { redirect: 'podcast' }); // eski alt kategori ve bilinmeyen tek parça → vitrin
  assert.equal(R.page('podcast/frekans/yok-boyle').status, 404);
  assert.equal(R.page('podcast/frekans/a/b').status, 404);
});

test('seri-bolum-adresi-cakismasi', () => { // seri bağlantısı eski bir bölüm bağlantısıyla aynıysa seri kazanır
  const d = S.normalize({});
  d.series[1].slug = d.podcasts[0].slug;
  const r = Render.create(d, { mode: 'local' });
  const pg = r.page('podcast/' + d.podcasts[0].slug);
  assert.equal(pg.redirect, undefined);
  assert.match(pg.html, /<h1[^>]*>Sofra<\/h1>/);
});

test('asgari-seri', () => { // yalnızca adı olan seri: kapaksız, kısa tanımsız, bölümsüz, fragmansız
  const d = S.normalize({});
  d.series = [{ id: 'm', title: 'Asgari', slug: 'asgari', published: true }];
  d.podcasts = [];
  const r = Render.create(d, { mode: 'local' });
  assert.equal(count(r.page('podcast').html, /class="scard/g), 1);
  for (const route of ['podcast', 'podcast/asgari']) assert.doesNotMatch(r.page(route).html, /undefined|null|NaN/);
});

test('yayin-rotalari', () => {
  const d = S.normalize({});
  d.series.push({ id: 'k', title: 'Kendi', slug: 'kendi', published: true });
  d.podcasts.push({ id: 'e', title: 'E', slug: 'e', series: 'k', date: '2026-10-01' });
  const r = Render.create(S.forPublish(d), { mode: 'site', siteUrl: 'https://ornek.test/' });
  const routes = r.routes();
  assert.ok(routes.includes('podcast') && routes.includes('podcast/kendi') && routes.includes('podcast/kendi/e'));
  assert.ok(!routes.some((x) => x.startsWith('podcast/frekans')));
});

test('bos-vitrin', () => {
  const r = Render.create(S.forPublish(S.normalize({})), { mode: 'site', siteUrl: 'https://ornek.test/' });
  const pg = r.page('podcast');
  assert.match(pg.html, /Henüz yayınlanmış seri yok\./);
  assert.equal(pg.noindex, true);
});

test('akis-ve-arama', () => {
  const it = R.items().find((i) => i.id === 'pod-6');
  assert.equal(it.cat, 'Frekans');
  assert.match(it.href, /^#\/podcast\/frekans\//);
  assert.ok(R.searchIndex().some((i) => i.label === 'Podcast serisi' && i.title === 'Sofra'));
});

test('seri-tanitim-paragraflari', () => { // tanıtım metni boş satırla paragraflara ayrılır
  const d = S.normalize({});
  d.series[0].description = 'Birinci paragraf.\n\nİkinci paragraf.';
  const html = Render.create(d, { mode: 'local' }).page('podcast/frekans').html;
  assert.equal(count(html, /<p class="desc[^"]*">/g), 2);
});

/* ---------- SEO / GEO ---------- */
const graphOf = (r, route) => JSON.parse(r.head(r.page(route)).match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1].replace(/\u003c/g, '<'))['@graph'];

test('gorsel-boyutlari', () => { // sayfa kaymasını (CLS) önlemek için bilinen kaynakların boyutu yazılır
  const html = R.page('yazilar/site-nasil-kullanilir').html + R.page('').html;
  const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]).filter((t) => /picsum\.photos\/(?:seed\/[^/]+|id\/\d+)\/\d+\/\d+|i\.ytimg\.com/.test(t));
  assert.ok(imgs.length > 3);
  for (const t of imgs) assert.match(t, /\swidth="\d+"\s+height="\d+"/, t.slice(0, 120));
  const pic = imgs.find((t) => /picsum\.photos\/seed\/[^/]+\/(\d+)\/(\d+)/.test(t));
  const [, w, h] = pic.match(/picsum\.photos\/seed\/[^/]+\/(\d+)\/(\d+)/);
  assert.match(pic, new RegExp(`width="${w}" height="${h}"`));
});

test('video-suresi', () => {
  const d = S.normalize({});
  const v = d.posts.find((p) => S.postKind(p) === 'video');
  v.duration = '12:34';
  const r = Render.create(d, { mode: 'local' });
  const pg = r.page('videolar/' + v.slug);
  assert.equal(pg.schema.find((n) => n['@type'] === 'VideoObject').duration, 'PT12M34S');
  assert.match(pg.html, /12:34/);
});

test('uzun-baslik', () => { // "— Site adı" eki başlığı 60 karakterin üstüne taşıyorsa eklenmez
  const v = S.normalize({}).posts.find((p) => p.slug === 'bicep-printworks-canli-performans');
  const t = R.page('videolar/' + v.slug).title;
  assert.equal(t, v.title);
  assert.equal(R.page('hakkinda').title, 'Hakkında — Akcan');
});

test('seri-aciklamasi', () => { // seri sayfasının arama açıklaması kısa tanım + tanıtım metni
  assert.ok(R.page('podcast/frekans').desc.length >= 100);
});

test('hakkinda-tarihi', () => { // site haritasında Hakkında'nın son güncelleme tarihi
  const d = S.normalize({});
  d.about.updated = '2026-10-01';
  assert.equal(Render.create(d, { mode: 'local' }).page('hakkinda').modified, '2026-10-01');
});

test('video-paylasim-gorseli', () => { // panel 1280×720 karenin varlığını doğruladıysa (ytMax) paylaşım kartında o kullanılır
  const d = S.normalize({});
  const v = d.posts.find((p) => S.postKind(p) === 'video');
  assert.match(Render.create(d, { mode: 'local' }).page('videolar/' + v.slug).image, /\/hqdefault\.jpg$/);
  v.ytMax = true;
  assert.match(Render.create(d, { mode: 'local' }).page('videolar/' + v.slug).image, /\/maxresdefault\.jpg$/);
});

test('uzmanlik-alanlari', () => { // kişi kaydında en çok kullanılan konular (knowsAbout)
  const d = S.normalize({});
  const n = {};
  ['posts', 'podcasts', 'remixes'].forEach((c) => d[c].filter((x) => x.published !== false).forEach((x) => (x.tags || []).forEach((t) => { n[t] = (n[t] || 0) + 1; })));
  const top = Object.entries(n).sort((a, b) => b[1] - a[1])[0][0];
  const person = graphOf(R, '').find((x) => x['@type'] === 'Person');
  assert.ok(Array.isArray(person.knowsAbout) && person.knowsAbout.includes(top), JSON.stringify(person.knowsAbout));
  assert.ok(person.knowsAbout.length <= 10);
});

/* ---------- Kitaplar ---------- */
test('kitap-vitrini', () => {
  const pg = R.page('kitaplar');
  assert.equal(count(pg.html, /class="scard/g), 3);
  assert.match(pg.html, /class="sgrid books"/);
  assert.match(pg.html, /class="sbadge">Ön sipariş</);
  assert.match(pg.html, /3 kitap/);
});

test('kitap-sayfasi', () => {
  const b = S.normalize({}).books[0];
  const pg = R.page('kitaplar/' + b.slug);
  assert.match(pg.html, new RegExp(`<h1[^>]*>${b.title}</h1>`));
  const book = pg.schema.find((n) => n['@type'] === 'Book');
  assert.equal(book.isbn, b.isbn);
  assert.equal(book.numberOfPages, b.pages);
  assert.equal(book.potentialAction.length, 7);
  assert.equal(book.potentialAction[0]['@type'], 'BuyAction');
  assert.match(pg.html, /class="kunye"/);
});

test('kitap-satin-alma-dugmeleri', () => { // yalnızca gerçek ürün/arama adresleri; hiç yoksa not
  const d = S.normalize({});
  Object.assign(d.books[0], { amazon: 'https://www.amazon.com.tr/', dr: '', kitapyurdu: 'amazon', idefix: '', bkm: '', hepsiburada: '', trendyol: 'https://www.trendyol.com/sr?q=x' });
  const html = Render.create(d, { mode: 'local' }).page('kitaplar/' + d.books[0].slug).html;
  assert.equal(count(html, /class="buybtn/g), 1);
  assert.match(html, /class="buybtn primary"[^>]*>Satın al · Trendyol</);
  d.books[0].trendyol = '';
  assert.match(Render.create(d, { mode: 'local' }).page('kitaplar/' + d.books[0].slug).html, /Yakında satışta/);
});

test('asgari-kitap', () => {
  const d = S.normalize({});
  d.books = [{ id: 'a', title: 'Asgari', slug: 'asgari', published: true }];
  const r = Render.create(d, { mode: 'local' });
  assert.equal(count(r.page('kitaplar').html, /class="scard/g), 1);
  assert.match(r.page('kitaplar/asgari').html, /<h1[^>]*>Asgari<\/h1>/);
  for (const route of ['kitaplar', 'kitaplar/asgari']) assert.doesNotMatch(r.page(route).html, /undefined|null|NaN/);
  assert.doesNotMatch(r.page('kitaplar/asgari').html, /class="kunye"/);
});

test('kitap-rotalari-gizli-menu', () => { // gizli menü + yalnızca örnekler: yayında kitaplar sayfası yok
  const site = Render.create(S.forPublish(S.normalize({})), { mode: 'site', siteUrl: 'https://ornek.test/' });
  assert.ok(!site.routes().some((x) => x.startsWith('kitaplar')));
  const d = S.normalize({});
  d.books.push({ id: 'k', title: 'Kendi', slug: 'kendi', published: true });
  const r2 = Render.create(S.forPublish(d), { mode: 'site', siteUrl: 'https://ornek.test/' });
  assert.ok(r2.routes().includes('kitaplar') && r2.routes().includes('kitaplar/kendi'));
  assert.doesNotMatch(r2.navLinks(), /kitaplar/); // menüde gizli
});

test('kitap-adresleri', () => {
  assert.equal(R.page('kitaplar/yok/olmaz').status, 404);
  assert.equal(R.page('kitaplar/yok').status, 404);
  assert.ok(R.searchIndex().some((i) => i.label === 'Kitap'));
});

/* ---------- Otomatik SEO: tek kaynaktan başlık/açıklama, cümle sonunda kesim, ara başlık çapaları ---------- */
test('snippet-cumle-sonu', () => {
  const s = 'Birinci cümle burada biter ve biraz uzun sürer, çünkü açıklamanın ilk yüz yirmi karakteri geçmesi gerekiyor ki deneyelim. İkinci cümle ise sınırın dışına taşan uzun bir devam cümlesidir ve kesilmelidir.';
  assert.equal(Render.snippet(s), s.slice(0, s.indexOf('. ') + 1));
  assert.equal(Render.snippet('Kısa metin.'), 'Kısa metin.');
});

test('snippet-cumle-yoksa-kelime', () => {
  const s = ('kelime ').repeat(40).trim(); // cümle sonu yok
  assert.equal(Render.snippet(s), Render.clip(s));
  const d = 'Süre 3.5 saat ' + ('uzun açıklama ').repeat(15); // "3.5" cümle sonu sayılmaz
  assert.ok(!Render.snippet(d).endsWith('3.'));
});

test('seoOf-sayfayla-ayni', () => { // panel önizlemesi = yayındaki <title>, açıklama, adres ve paylaşım görseli
  const D = S.normalize({});
  const RS = Render.create(D, { mode: 'site', siteUrl: 'https://ornek.test/' });
  const post = (k) => D.posts.find((p) => S.postKind(p) === k);
  const ep = D.podcasts.find((x) => S.seriesOf(D, x));
  const cases = [
    ['posts', post('video'), 'videolar/' + post('video').slug],
    ['posts', post('yazi'), 'yazilar/' + post('yazi').slug],
    ['series', D.series[0], 'podcast/' + D.series[0].slug],
    ['podcasts', ep, 'podcast/' + S.seriesOf(D, ep).slug + '/' + ep.slug],
    ['books', D.books[0], 'kitaplar/' + D.books[0].slug],
    ['remixes', D.remixes[0], 'remixler/' + D.remixes[0].slug],
    ['pages', D.pages[0], 'sayfa/' + D.pages[0].slug]
  ];
  for (const [col, item, route] of cases) {
    const a = RS.seoOf(col, item), p = RS.page(route);
    assert.notEqual(p.status, 404, route);
    assert.equal(a.title, p.title, route);
    assert.equal(a.desc, p.desc, route);
    assert.equal(a.url, 'https://ornek.test/' + route + '/', route);
    assert.equal(a.image, p.image, route);
  }
});

test('seoOf-yarim-icerik', () => { // başlıksız yeni kayıt, serisi olmayan bölüm: çökmez, undefined yok
  const RS = Render.create(S.normalize({}), { mode: 'site', siteUrl: 'https://ornek.test/' });
  for (const col of ['posts', 'podcasts', 'series', 'books', 'remixes', 'pages']) {
    const o = RS.seoOf(col, { id: 'x' });
    assert.ok(!/undefined|NaN|null/.test(JSON.stringify(o)), col);
  }
});

test('ara-baslik-capalari', () => {
  const D = S.normalize({});
  const p = D.posts.find((x) => S.postKind(x) === 'yazi');
  p.content = '<h2>Ses nedir?</h2><p>a</p><h2>Ses nedir?</h2><h3 id="ozel">X</h3><h2><b>Ses</b> &amp; Hafıza</h2><h2> </h2>';
  const html = Render.create(D, { mode: 'local' }).page('yazilar/' + p.slug).html;
  assert.match(html, /<h2 id="ses-nedir">Ses nedir\?<\/h2>/);
  assert.match(html, /<h2 id="ses-nedir-2">/);
  assert.match(html, /<h3 id="ozel">X<\/h3>/);
  assert.match(html, /<h2 id="ses-hafiza">/);
  assert.match(html, /<h2> <\/h2>/);
});

test('snippet-sira-sayisi-ve-kisaltma', () => { // "20. yüzyıl", "Dr. Ayşe" cümle sonu sayılmaz
  const a = 'Bu bölümde şehrin unutulmuş plakçılarını tek tek dolaşıyor, raflarda bekleyen eski plakların izini sürüyoruz, özellikle 20. yüzyılın sonunda açılan küçük dükkânların hikâyelerini dinliyoruz.';
  const b = 'Bu bölümde stüdyoda kullandığımız mikrofonları, kabloları ve kayıt zincirinin her halkasını tek tek tanıtıyoruz, ayrıca Dr. Ayşe Yılmaz ile işitmenin nasıl çalıştığını konuşuyoruz.';
  for (const s of [a, b]) {
    assert.ok(s.indexOf('. ') >= 120 && s.indexOf('. ') < 160, 'örnek, kesim aralığına düşmeli');
    const r = Render.snippet(s);
    assert.ok(!/(20|Dr)\.$/.test(r), r);
  }
});

/* ---------- Kaynaklar ---------- */
const tagOf = (html, id) => (html.match(new RegExp(`<a [^>]*data-res="${id}"[^>]*>`)) || [''])[0];

test('kaynak-listesi', () => {
  const pg = R.page('kaynaklar');
  assert.match(pg.html, /<h1[^>]*>Kaynaklar<\/h1>/);
  assert.match(pg.html, /id="rescount"[^>]*><b>6<\/b> \/ 6 kaynak/);
  assert.deepEqual([...pg.html.matchAll(/<button[^>]*data-t="([^"]*)"/g)].map((m) => m[1]), ['', 'rehber', 'arac', 'video', 'kitap', 'site']);
  const pinned = pg.html.slice(pg.html.indexOf('id="respinned"'), pg.html.indexOf('id="resgrid"'));
  const grid = pg.html.slice(pg.html.indexOf('id="resgrid"'));
  assert.equal(count(pinned, /class="rcard[ "]/g), 2);
  assert.equal(count(grid, /class="rcard[ "]/g), 4);
  assert.match(tagOf(pg.html, 'kaynak-2'), /href="#\/kaynaklar\/audacity"/);
  assert.match(tagOf(pg.html, 'kaynak-2'), /data-type="arac"/);
  assert.match(pg.html, />audacityteam\.org</);
  assert.equal(pg.schema[0]['@type'], 'CollectionPage');
});

test('kaynak-sayfasi', () => {
  const pg = R.page('kaynaklar/ev-studyosu-kurulum-rehberi');
  for (const t of ['Tüm kaynaklar', 'Kayıt stüdyosu nedir?', 'Bağlantılar', 'Bu kaynağı anlattığım içerik', 'Diğer kaynaklar']) assert.ok(pg.html.includes(t), t);
  assert.match(pg.html, /<h1[^>]*>Ev stüdyosu kurulum rehberi<\/h1>/);
  const art = pg.schema.find((n) => n['@type'] === 'Article');
  assert.equal(art.about.url, 'https://en.wikipedia.org/wiki/Recording_studio');
  assert.equal(art.citation.length, 3);
  assert.equal(pg.crumbs.length, 2);
});

test('asgari-kaynak', () => {
  const d = S.normalize({});
  d.resources = [{ id: 'a', title: 'Yalnız Ad', slug: 'yalniz-ad' }];
  const RS = Render.create(d, { mode: 'local' });
  const pg = RS.page('kaynaklar/yalniz-ad'), li = RS.page('kaynaklar');
  for (const h of [pg.html, li.html, JSON.stringify(pg.schema)]) assert.ok(!/undefined|null|NaN/.test(h), h.slice(0, 80));
  assert.ok(!/Bağlantılar|Bu kaynağı anlattığım|Kaynağa git|Diğer kaynaklar/.test(pg.html));
});

test('kaynak-bozuk-baglantilar', () => { // protokolsüz/bozuk adres ve yayına gitmeyen içeriğe bağ: çökme yok, düğme ve kart yok
  const d = S.normalize({});
  const ep = d.podcasts.find((x) => S.seriesOf(d, x));
  S.seriesOf(d, ep).published = false;
  d.resources = [
    { id: 'a', title: 'A', slug: 'a', url: 'github.com/x', related: ['posts:yok', 'podcasts:' + ep.id] },
    { id: 'b', title: 'B', slug: 'b', url: '::' }
  ];
  const RS = Render.create(d, { mode: 'local' });
  for (const s of ['a', 'b']) {
    const pg = RS.page('kaynaklar/' + s);
    assert.notEqual(pg.status, 404, s);
    assert.match(pg.html, new RegExp(`<h1[^>]*>${s.toUpperCase()}</h1>`));
    assert.ok(!/Kaynağa git|undefined/.test(pg.html), s);
  }
  assert.ok(!/Bu kaynağı anlattığım içerik/.test(RS.page('kaynaklar/a').html));
  assert.ok(!/undefined/.test(RS.page('kaynaklar').html));
});

test('kaynak-silinen-tur', () => {
  const d = S.normalize({});
  d.resources = [{ id: 'a', title: 'A', slug: 'a', type: 'yok', url: 'https://ornek.test/a' }];
  const h = Render.create(d, { mode: 'local' }).page('kaynaklar').html;
  assert.deepEqual([...h.matchAll(/<button[^>]*data-t="([^"]*)"/g)].map((m) => m[1]), ['']);
  assert.ok(!/class="rtype"/.test(h));
});

test('cift-yonlu-bag', () => { // kaynağı bağlanan videonun sayfasında "Bu videodaki kaynaklar"
  const v = S.normalize({}).posts.find((p) => p.id === 'vid-bicep');
  const h = R.page('videolar/' + v.slug).html;
  assert.match(h, /Bu videodaki kaynaklar/);
  assert.match(h, /#\/kaynaklar\/bicep-printworks-seti/);
});

test('kaynak-rotalari-gizli-menu', () => {
  const d = S.forPublish(S.normalize({}));
  const site = (x) => Render.create(x, { mode: 'site', siteUrl: 'https://ornek.test/' });
  assert.ok(!site(d).routes().some((r) => r.startsWith('kaynaklar')));
  const d2 = JSON.parse(JSON.stringify(d));
  d2.resources.push({ id: 'k', title: 'Kendi', slug: 'kendi', published: true });
  assert.ok(site(d2).routes().includes('kaynaklar') && site(d2).routes().includes('kaynaklar/kendi'));
  const d3 = JSON.parse(JSON.stringify(d));
  d3.menu.find((m) => m.type === 'resources').visible = true;
  assert.ok(site(d3).routes().includes('kaynaklar'));
});

test('seoOf-kaynak', () => {
  const D = S.normalize({});
  const RS = Render.create(D, { mode: 'site', siteUrl: 'https://ornek.test/' });
  const x = D.resources[0], a = RS.seoOf('resources', x), p = RS.page('kaynaklar/' + x.slug);
  assert.equal(a.title, p.title);
  assert.equal(a.desc, p.desc);
  assert.equal(a.image, p.image);
  assert.equal(a.url, 'https://ornek.test/kaynaklar/' + x.slug + '/');
});

test('hero-kaynak', () => {
  const D = S.normalize({});
  D.settings.featured = { mode: 'manual', type: 'resources', id: 'kaynak-1' };
  const h = Render.create(D, { mode: 'local' }).page('').html;
  assert.match(h, /Öne çıkan kaynak/);
  assert.match(h, /Ev stüdyosu kurulum rehberi/);
  assert.match(h, /#\/kaynaklar\/ev-studyosu-kurulum-rehberi/);
  D.resources[0].published = false;
  assert.ok(!/Öne çıkan kaynak/.test(Render.create(D, { mode: 'local' }).page('').html));
});

test('kaynak-404', () => {
  assert.equal(R.page('kaynaklar/yok').status, 404);
  assert.equal(R.page('kaynaklar/a/b').status, 404);
});

test('bos-kaynak-listesi', () => {
  const d = S.normalize({});
  d.resources = [];
  const pg = Render.create(d, { mode: 'local' }).page('kaynaklar');
  assert.match(pg.html, /Henüz kaynak yok\./);
  assert.equal(pg.noindex, true);
});

test('kaynak-arama-metni-katlanir', () => { // İngilizce büyük I: "MIDI" aramada "midi" ile bulunur (ı → i katlanır)
  const d = S.normalize({});
  d.resources = [{ id: 'm', title: 'MIDI kontrolcü', slug: 'midi', url: 'https://ornek.test/m' }];
  const h = Render.create(d, { mode: 'local' }).page('kaynaklar').html;
  assert.match(h, /data-find="[^"]*midi kontrolcü/);
});
