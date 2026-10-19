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
