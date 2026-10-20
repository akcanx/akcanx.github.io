/* Veri katmanı: podcast serileri, geçiş (sürüm 3 → 4) ve yayın süzgeci */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { S, O, mem, v3 } = require('./yukle');

test('gecis-ornek-program', () => { // değiştirilmemiş program → örnek seri
  const d = S.normalize(v3());
  assert.ok(d.version >= 4);
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
  assert.ok(JSON.parse(mem.get(S.KEY)).sampleVersion >= 5);
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

test('gecis-kullanici-alanlari-korunur', () => { // örnek program sayılsa da kullanıcının kapağı, adresleri ve sıklığı kalır
  const d = S.normalize(v3({ cover: 'data:image/webp;base64,AAA', spotify: 'https://open.spotify.com/show/MINE', eyebrow: 'Podcast · Her Cuma' }));
  const s = d.series[0];
  assert.equal(s.id, 'seri-frekans');
  assert.equal(s.cover, 'data:image/webp;base64,AAA');
  assert.equal(s.spotify, 'https://open.spotify.com/show/MINE');
  assert.equal(s.frequency, 'Her Cuma');
  assert.equal(s.tagline, 'Müziğin, sesin ve hafızanın izinde'); // boş alanlar örnekten dolar
});

test('gecis-kendi-bolumlu-program-kendi-serisi', () => { // kendi bölümleri olan program yayından kalkmaz
  const raw = v3();
  raw.podcasts = raw.podcasts.map((p) => ({ ...p, id: 'k-' + p.id, title: 'Kendi ' + p.title }));
  const d = S.normalize(raw);
  assert.equal(S.isSample(d.series[0]), false);
  assert.notEqual(d.series[0].id, 'seri-frekans');
  assert.equal(S.forPublish(d).podcasts.length, raw.podcasts.length);
});

test('ornek-silmis-program-degismemis-eklenmez', () => { // örnekleri silmiş ama programa dokunmamış kullanıcı
  const raw = v3();
  raw.posts = []; raw.remixes = []; raw.pages = []; raw.podcasts = [];
  mem.clear();
  mem.set(S.KEY, JSON.stringify(raw));
  assert.deepEqual(S.get().series.map((s) => s.id), ['seri-frekans']);
});

/* ---------- Kitaplar ---------- */
test('kitap-ilk-kurulum', () => {
  const d = S.normalize({});
  assert.deepEqual(d.books.map((b) => b.id), ['kitap-1', 'kitap-2', 'kitap-3']);
  assert.equal(d.books[2].status, 'onsiparis');
  assert.ok(d.books.every(S.isSample));
  const m = d.menu.find((x) => x.type === 'books');
  assert.equal(m.visible, false);
  assert.equal(m.label, 'Kitaplar');
  assert.equal(d.settings.booksPage.title, 'Kitaplar');
});

test('kitap-menu-bir-kez', () => { // sürüm 4 kaydına gizli öğe bir kez eklenir; silinmişse geri gelmez
  const once = S.normalize({ version: 4, menu: [{ id: 'm1', label: 'Videolar', type: 'videos', visible: true }] });
  assert.equal(once.menu.filter((x) => x.type === 'books').length, 1);
  assert.equal(once.menu.find((x) => x.type === 'books').visible, false);
  once.menu = once.menu.filter((x) => x.type !== 'books');
  assert.equal(S.normalize(JSON.parse(JSON.stringify(once))).menu.filter((x) => x.type === 'books').length, 0);
});

test('kitap-menu-konumu', () => { // gizli öğe Remixler'in hemen ardına girer (İletişim'in sonuna değil); Remixler yoksa sona
  const m = (type) => ({ id: type, label: type, type, visible: true });
  const a = S.normalize({ version: 4, menu: [m('home'), m('videos'), m('remixes'), m('about'), m('link')] });
  assert.deepEqual(a.menu.map((x) => x.type), ['home', 'videos', 'remixes', 'books', 'resources', 'about', 'link']);
  const b = S.normalize({ version: 4, menu: [m('home'), m('about')] });
  assert.deepEqual(b.menu.map((x) => x.type), ['home', 'about', 'books', 'resources']);
});

test('kitap-ornek-surum-6', () => { // panelde kayıtlı eski veriye örnek kitaplar bir kez eklenir; örnekleri silmişe eklenmez
  mem.clear();
  mem.set(S.KEY, JSON.stringify({ ...v3(), sampleVersion: 5, version: 4, series: [] }));
  assert.equal(S.get().books.length, 3);
  mem.clear();
  mem.set(S.KEY, JSON.stringify({ version: 4, sampleVersion: 5, posts: [], podcasts: [], remixes: [], pages: [], series: [] }));
  assert.equal(S.get().books.length, 0);
});

test('kitap-forPublish', () => {
  const d = S.normalize({});
  d.books.push({ id: 'k', title: 'Kendi', slug: 'kendi', published: true }, { id: 't', title: 'Taslak', slug: 'taslak', published: false });
  assert.deepEqual(S.forPublish(d).books.map((b) => b.id), ['k']);
});

/* ---------- Kaynaklar ---------- */
test('kaynak-ilk-kurulum', () => {
  const d = S.normalize({});
  assert.ok(d.version >= 6);
  assert.deepEqual(d.resources.map((r) => r.id), ['kaynak-1', 'kaynak-2', 'kaynak-3', 'kaynak-4', 'kaynak-5', 'kaynak-6']);
  assert.ok(d.resources.every(S.isSample));
  assert.deepEqual(d.settings.resourceTypes.map((t) => t.id), ['rehber', 'arac', 'video', 'kitap', 'site']);
  assert.equal(d.settings.resourcesPage.title, 'Kaynaklar');
  const i = d.menu.findIndex((x) => x.type === 'resources');
  assert.equal(d.menu[i].visible, false);
  assert.equal(d.menu[i].label, 'Kaynaklar');
  assert.equal(d.menu[i - 1].type, 'books');
});

test('kaynak-gecis-menu', () => { // gizli öğe bir kez: Kitaplar'ın, yoksa Remixler'in ardına, o da yoksa sona
  const m = (type) => ({ id: type, label: type, type, visible: true });
  const a = S.normalize({ version: 5, menu: [m('home'), m('remixes'), m('books'), m('about')] });
  assert.deepEqual(a.menu.map((x) => x.type), ['home', 'remixes', 'books', 'resources', 'about']);
  assert.deepEqual(a.resources, []);
  assert.deepEqual(S.normalize({ version: 5, menu: [m('home'), m('remixes'), m('about')] }).menu.map((x) => x.type), ['home', 'remixes', 'resources', 'about']);
  assert.deepEqual(S.normalize({ version: 5, menu: [m('home'), m('about')] }).menu.map((x) => x.type), ['home', 'about', 'resources']);
  a.menu = a.menu.filter((x) => x.type !== 'resources');
  assert.equal(S.normalize(JSON.parse(JSON.stringify(a))).menu.filter((x) => x.type === 'resources').length, 0);
});

test('kaynak-ornek-surum-7', () => { // örneği kalmış eski kayda örnek kaynaklar bir kez eklenir; örneklerini silmişe eklenmez
  mem.clear();
  mem.set(S.KEY, JSON.stringify({ ...v3(), sampleVersion: 6, version: 5, series: [] }));
  assert.equal(S.get().resources.length, 6);
  mem.clear();
  mem.set(S.KEY, JSON.stringify({ version: 5, sampleVersion: 6, posts: [], podcasts: [], remixes: [], pages: [], series: [], books: [] }));
  assert.equal(S.get().resources.length, 0);
});

test('kaynak-forPublish', () => {
  const d = S.normalize({});
  d.resources.push({ id: 'k', title: 'Kendi', slug: 'kendi', published: true }, { id: 't', title: 'Taslak', slug: 'taslak', published: false });
  assert.deepEqual(S.forPublish(d).resources.map((r) => r.id), ['k']);
});

test('kaynak-ornekleri', () => { // beş tür, iki öne çıkan, videoya bağlı biri, çok bağlantılı biri, asgari biri; featured yok
  const r = S.normalize({}).resources;
  assert.deepEqual([...new Set(r.map((x) => x.type))].sort(), ['arac', 'kitap', 'rehber', 'site', 'video']);
  assert.equal(r.filter((x) => x.pinned).length, 2);
  const vids = new Set(O.posts.filter((p) => p.kind === 'video').map((p) => 'posts:' + p.id));
  assert.ok(r.some((x) => (x.related || []).some((k) => vids.has(k))));
  assert.ok(r.some((x) => (x.links || []).length >= 3));
  assert.ok(r.some((x) => !x.summary && !x.body && !x.cover && x.url));
  assert.ok(r.every((x) => !('featured' in x)));
});

test('kaynak-adres-duzeltme', () => { // https:// olmadan yazılan alan adı biçimli adres tamamlanır; diğerleri değişmez
  assert.equal(S.fixUrl('github.com/kullanici/repo'), 'https://github.com/kullanici/repo');
  assert.equal(S.fixUrl('  www.ornek.test  '), 'https://www.ornek.test');
  assert.equal(S.fixUrl('https://ornek.test/a'), 'https://ornek.test/a');
  assert.equal(S.fixUrl('mailto:a@b.c'), 'mailto:a@b.c');
  assert.equal(S.fixUrl(''), '');
  assert.equal(S.fixUrl('düz metin'), 'düz metin');
});
