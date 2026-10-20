/* Otomatik SEO: içerik puanı ve öneriler (js/seo.js) */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { S, Render, SEO } = require('./yukle');

const R = Render.create(S.normalize({}), { mode: 'site', siteUrl: 'https://ornek.test/' });
const uzun = (n) => '<p>' + 'kelime '.repeat(n) + '</p>';
const tam = { id: 'a', kind: 'yazi', title: 'Kısa başlık', slug: 'kisa-baslik', excerpt: 'x'.repeat(150), cover: 'https://ornek.test/k.jpg', coverAlt: 'Kapak', content: '<h2>Ara</h2>' + uzun(700), tags: ['t'] };
const madde = (r, ad) => r.maddeler.find((x) => x.ad === ad);

test('puan-tam', () => {
  const r = SEO.score('posts', tam, { R });
  assert.equal(r.puan, 100);
  assert.equal(SEO.level(r.puan), 'iyi');
  assert.equal(r.maddeler.reduce((t, m) => t + m.en, 0), 100);
});

test('puan-aciklama-metinden-yarim', () => {
  const m = madde(SEO.score('posts', { ...tam, excerpt: '' }, { R }), 'Açıklama');
  assert.equal(m.ok, 'yarim');
  assert.equal(m.puan, 10);
});

test('puan-uzun-baslik', () => {
  const r = SEO.score('posts', { ...tam, title: 'b'.repeat(70) }, { R });
  assert.equal(madde(r, 'Başlık').ok, false);
  assert.match(SEO.oneriler(r)[0], /Başlık 70 karakter/);
});

test('puan-dar-gorsel', () => {
  assert.equal(madde(SEO.score('posts', tam, { R, imgW: 800 }), 'Görsel').puan, 10);
});

test('puan-alt-metin-ve-ara-baslik', () => {
  assert.equal(SEO.score('posts', { ...tam, coverAlt: '', content: uzun(700) }, { R }).puan, 80);
});

test('puan-esik-turlere-gore', () => { // kitap 80 kelime yeter, yazı 300 ister
  const kitap = { id: 'k', title: 'K', slug: 'k', tagline: 'x'.repeat(100), cover: 'https://ornek.test/k.jpg', coverAlt: 'K', description: uzun(90), tags: ['t'] };
  assert.equal(madde(SEO.score('books', kitap, { R }), 'İçerik derinliği').ok, true);
  assert.equal(madde(SEO.score('posts', { ...tam, content: '<h2>a</h2>' + uzun(200) }, { R }), 'İçerik derinliği').ok, 'yarim');
});

test('puan-bos-kayit', () => {
  for (const col of ['posts', 'podcasts', 'series', 'books', 'remixes', 'pages']) {
    const r = SEO.score(col, { id: 'x' }, { R });
    assert.ok(r.puan >= 0 && r.puan <= 100, col);
    assert.ok(!/undefined|NaN/.test(JSON.stringify(r)), col);
  }
});

test('puan-seviyeler', () => {
  assert.equal(SEO.level(80), 'iyi');
  assert.equal(SEO.level(79), 'orta');
  assert.equal(SEO.level(50), 'orta');
  assert.equal(SEO.level(49), 'zayif');
});

test('puan-kaynak', () => { // kaynakta özet alanı summary, ana metin body
  const r = SEO.score('resources', { id: 'k', title: 'K', slug: 'k', summary: 'x'.repeat(150), body: uzun(100), cover: 'https://ornek.test/k.jpg', coverAlt: 'K', tags: ['t'] }, { R });
  assert.equal(madde(r, 'Açıklama').ok, true);
  assert.equal(madde(r, 'İçerik derinliği').ok, true);
});
