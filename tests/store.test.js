/* Veri katmanı: podcast serileri, geçiş (sürüm 3 → 4) ve yayın süzgeci */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { S, mem, v3 } = require('./yukle');

test('gecis-ornek-program', () => { // değiştirilmemiş program → örnek seri
  const d = S.normalize(v3());
  assert.equal(d.version, 4);
  assert.equal(d.series.length, 1);
  assert.equal(d.series[0].id, 'seri-frekans');
  assert.ok(S.isSample(d.series[0]));
  assert.equal(d.series[0].frequency, 'Her Pazartesi');
  assert.ok(d.podcasts.every((p) => p.series === 'seri-frekans' && !('cat' in p)));
  assert.deepEqual(Object.keys(d.settings.podcast).sort(), ['description', 'eyebrow', 'name', 'tint']);
  assert.equal(d.settings.podcast.name, 'Podcast');
  assert.equal(d.settings.podcast.eyebrow, 'Podcast · Sesin hikâyeleri');
});

test('gecis-kendi-program', () => { // değiştirilmiş program → kendi serisi
  const d = S.normalize(v3({ name: 'Gece Sohbetleri', cover: 'veri/gorsel/abc.webp', spotify: 'https://open.spotify.com/show/x' }));
  const s = d.series[0];
  assert.match(s.id, /^seri-/);
  assert.notEqual(s.id, 'seri-frekans');
  assert.equal(S.isSample(s), false);
  assert.equal(s.title, 'Gece Sohbetleri');
  assert.equal(s.slug, 'gece-sohbetleri');
  assert.equal(s.cover, 'veri/gorsel/abc.webp');
  assert.equal(s.spotify, 'https://open.spotify.com/show/x');
  assert.equal(s.status, 'devam');
  assert.equal(s.published, true);
});

test('gecis-alanlari-korur', () => { // bölümün hiçbir alanı kaybolmaz; yalnızca cat gider
  const raw = v3();
  raw.podcasts[0].description = '<p><img src="data:image/webp;base64,AAA"></p>';
  raw.podcasts[0].updated = '2026-10-01';
  const d = S.normalize(raw);
  const { cat, ...beklenen } = raw.podcasts[0];
  assert.deepEqual({ ...d.podcasts[0], series: undefined }, { ...beklenen, series: undefined });
});

test('gecis-tek-sefer', () => {
  const once = S.normalize(v3());
  assert.deepEqual(S.normalize(JSON.parse(JSON.stringify(once))).series, once.series);
});

test('ornek-surum-5-eklenir', () => { // panelde kayıtlı eski veri: örnek seriler bir kez eklenir
  mem.clear();
  mem.set(S.KEY, JSON.stringify(v3()));
  const d = S.get();
  assert.deepEqual(d.series.map((s) => s.id), ['seri-frekans', 'seri-sofra', 'seri-satir-arasi']);
  assert.equal(d.podcasts.filter((p) => p.series === 'seri-sofra').length, 3);
  assert.ok(d.podcasts.every((p) => p.slug), 'sonradan eklenen örnek bölümlerin de bağlantısı olmalı');
  assert.equal(JSON.parse(mem.get(S.KEY)).sampleVersion, 5);
});

test('ornek-silmis-olana-eklenmez', () => {
  const raw = v3({ name: 'Kendi' });
  raw.posts = []; raw.remixes = []; raw.pages = [];
  // Başlıklar da değişir: sitenin ilk sürümündeki örnek başlıklar (ör. "Sesin Hafızası") örnek sayılır
  raw.podcasts = raw.podcasts.map((p) => ({ ...p, id: 'k-' + p.id, title: 'Kendi ' + p.title }));
  mem.clear();
  mem.set(S.KEY, JSON.stringify(raw));
  assert.equal(S.get().series.filter(S.isSample).length, 0);
});

test('kopuk-bolum-onarimi', () => { // serisi silinmiş bölüm ilk seriye; seri yoksa "Podcast" serisi oluşur
  const d = S.normalize({ version: 4, series: [{ id: 's1', title: 'A', slug: 'a' }], podcasts: [{ id: 'p', title: 'B', slug: 'b', series: 'yok' }] });
  assert.equal(d.podcasts[0].series, 's1');
  const e = S.normalize({ version: 4, series: [], podcasts: [{ id: 'p', title: 'B', slug: 'b' }] });
  assert.equal(e.series.length, 1);
  assert.equal(e.series[0].title, 'Podcast');
  assert.equal(S.isSample(e.series[0]), false);
  assert.equal(e.podcasts[0].series, e.series[0].id);
});

test('ilk-kurulum', () => {
  const d = S.normalize({});
  assert.deepEqual(d.series.map((s) => s.id), ['seri-frekans', 'seri-sofra', 'seri-satir-arasi']);
  assert.ok(d.podcasts.every((p) => S.seriesOf(d, p)));
  assert.equal(d.series[2].status, 'yakinda');
});

test('forPublish-ornek-seri-bolumu', () => { // örnek ya da yayında olmayan serideki bölüm yayına gitmez
  const d = S.normalize({});
  d.series.push({ id: 'k1', title: 'Kendi', slug: 'kendi', published: true }, { id: 'k2', title: 'Taslak', slug: 'taslak', published: false });
  d.podcasts.push({ id: 'e1', title: 'E1', slug: 'e1', series: 'k1' }, { id: 'e2', title: 'E2', slug: 'e2', series: 'seri-frekans' }, { id: 'e3', title: 'E3', slug: 'e3', series: 'k2' });
  const p = S.forPublish(d);
  assert.deepEqual(p.series.map((s) => s.id), ['k1']);
  assert.deepEqual(p.podcasts.map((x) => x.id), ['e1']);
  assert.equal('adminHash' in p.settings, false);
  assert.equal(d.series.length, 5); // kaynak değişmez
});
