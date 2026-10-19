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
