/* IndexNow: değişen adresler ve bildirim isteği (indexnow.js) */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { anahtar, fark, ana, istek } = require('../indexnow.js');

const SITE = 'https://ornek.test/';
const harita = (urls) => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
  .map(([p, d]) => `  <url><loc>${SITE}${p}</loc>${d ? `<lastmod>${d}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`;

test('indexnow-anahtar', () => {
  const k = anahtar('ornek.test');
  assert.match(k, /^[0-9a-f]{32}$/);
  assert.equal(anahtar('ornek.test'), k);
  assert.notEqual(anahtar('akcan.com'), k);
});

test('indexnow-fark', () => { // değişen, yeni ve kaldırılan; aynı kalan ve lastmod'suz olan girmez
  const eski = harita([['', ''], ['a/', '2026-10-01'], ['b/', '2026-10-01'], ['c/', ''], ['e/', '2026-10-01']]);
  const yeni = harita([['', ''], ['a/', '2026-10-01'], ['b/', '2026-10-20'], ['c/', ''], ['d/', '2026-10-20']]);
  assert.deepEqual(fark(eski, yeni), [SITE + 'b/', SITE + 'd/', SITE + 'e/']);
});

test('indexnow-ilk-yayin', () => { // eski site haritası yok ya da okunamadı: hepsi
  const yeni = harita([['', ''], ['a/', '2026-10-01'], ['b/a&amp;b/', '']]);
  const hepsi = [SITE, SITE + 'a/', SITE + 'b/a&b/'];
  assert.deepEqual(fark('', yeni), hepsi);
  assert.deepEqual(fark('<html><body>404</body></html>', yeni), hepsi);
});

test('indexnow-degisiklik-yok', () => {
  const x = harita([['', ''], ['a/', '2026-10-01']]);
  assert.deepEqual(fark(x, x), []);
});

test('indexnow-istek-alan-adi', () => { // kendi alan adı: host, anahtar ve anahtar dosyası aynı ana makinede
  const xml = `<urlset><url><loc>https://akcan.com/yazilar/x/</loc></url><url><loc>https://akcan.com/</loc></url></urlset>`;
  assert.equal(ana(xml), 'https://akcan.com/');
  const r = istek('https://akcan.com/', ['https://akcan.com/yazilar/x/']);
  assert.equal(r.url, 'https://api.indexnow.org/indexnow');
  assert.equal(r.body.host, 'akcan.com');
  assert.equal(r.body.key, anahtar('akcan.com'));
  assert.equal(r.body.keyLocation, 'https://akcan.com/' + anahtar('akcan.com') + '.txt');
  assert.deepEqual(r.body.urlList, ['https://akcan.com/yazilar/x/']);
});
