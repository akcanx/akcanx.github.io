#!/usr/bin/env node
/* ==========================================================================
   Akcan — IndexNow bildirimi
   Her yayından sonra yeni, değişen ve kaldırılan sayfaların adreslerini IndexNow'a
   bildirir; Bing, Yandex, Seznam, Naver ve Yep bu bildirimi paylaşır. (Google
   IndexNow'u desteklemez; site haritasındaki lastmod'u kendisi okur.)
   - Yapay zekâ kullanmaz; ayar gerektirmez: anahtar site adresinden türetilir,
     anahtar dosyasını build.js her derlemede yazar (<anahtar>.txt).
   - Değişenler, yayındaki eski site haritası yenisiyle karşılaştırılarak bulunur.

   GitHub Actions her yayında çalıştırır (.github/workflows/yayin.yml):
     node indexnow.js fark --eski eski-sitemap.xml --yeni _site/sitemap.xml --cikti "$GITHUB_OUTPUT"
     BILDIRIM='{"site":"…","adresler":[…]}' node indexnow.js gonder
   Bağımlılığı yoktur; yalnızca Node.js (22+) gerekir.
   ========================================================================== */
'use strict';

const fs = require('fs');
const crypto = require('crypto');

const ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX = 10000; // IndexNow tek istekte en fazla 10.000 adres alır

/** Site adresinin ana makine adından sabit anahtar (32 onaltılık karakter) */
const anahtar = (host) => crypto.createHash('sha256').update('indexnow:' + host).digest('hex').slice(0, 32);

const unxml = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

/** Site haritasındaki adresler: Map(adres → lastmod ya da '') */
function adresler(xml) {
  const out = new Map();
  for (const m of String(xml || '').matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = m[1].match(/<loc>([\s\S]*?)<\/loc>/);
    const mod = m[1].match(/<lastmod>([\s\S]*?)<\/lastmod>/);
    if (loc) out.set(unxml(loc[1].trim()), mod ? mod[1].trim() : '');
  }
  return out;
}

/**
 * Bildirilecek adresler: yeni, lastmod'u değişen ve kaldırılan (sıralı, en fazla 10.000).
 * Eski site haritası yoksa ya da okunamadıysa yenideki bütün adresler.
 */
function fark(eskiXml, yeniXml) {
  const eski = adresler(eskiXml), yeni = adresler(yeniXml);
  const list = !eski.size
    ? [...yeni.keys()]
    : [
      ...[...yeni].filter(([u, d]) => !eski.has(u) || (d && eski.get(u) !== d)).map(([u]) => u),
      ...[...eski.keys()].filter((u) => !yeni.has(u))
    ];
  return list.sort().slice(0, MAX);
}

/** Ana sayfa (= site adresi): site haritasındaki en kısa adres */
const ana = (yeniXml) => [...adresler(yeniXml).keys()].sort((a, b) => a.length - b.length)[0] || '';

/**
 * IndexNow isteği; anahtar dosyası sitenin kökünde (alt klasörde yayınlanıyorsa o klasörde).
 * Yalnızca sitenin kendi adresleri gider: alan adı değiştiği yayında eski haritadaki başka ana makinenin
 * adresleri listeye girerse IndexNow isteğin tamamını reddeder (422)
 */
function istek(site, urls) {
  const host = new URL(site).host;
  const key = anahtar(host);
  const own = urls.filter((u) => { try { return new URL(u).host === host && u.startsWith(new URL(site).href); } catch (e) { return false; } });
  return { url: ENDPOINT, body: { host, key, keyLocation: new URL(key + '.txt', site).href, urlList: own } };
}

/* ---------- Komut satırı ---------- */
async function main(args) {
  const arg = (name) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : ''; };
  const oku = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch (e) { return ''; } };
  if (args[0] === 'fark') {
    const yeni = oku(arg('yeni'));
    const out = { site: ana(yeni), adresler: fark(oku(arg('eski')), yeni) };
    if (arg('cikti')) fs.appendFileSync(arg('cikti'), `bildirim=${JSON.stringify(out)}\nsayi=${out.adresler.length}\n`);
    else console.log(JSON.stringify(out, null, 2));
    console.error(`IndexNow: ${out.adresler.length} adres bildirilecek`);
    return 0;
  }
  if (args[0] === 'gonder') {
    const b = JSON.parse(process.env.BILDIRIM || '{}');
    if (!b.site || !(b.adresler || []).length) { console.log('IndexNow: bildirilecek adres yok'); return 0; }
    const r = istek(b.site, b.adresler);
    if (!r.body.urlList.length) { console.log('IndexNow: sitenin kendi adresi yok, bildirim yapılmadı'); return 0; }
    // Uç nokta yanıt vermezse en fazla 30 sn beklenir: sıradaki yayın bu işi beklemesin
    const res = await fetch(r.url, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(r.body), signal: AbortSignal.timeout(30000) });
    console.log(`IndexNow: ${r.body.urlList.length} adres gönderildi → HTTP ${res.status}`);
    return res.status === 200 || res.status === 202 ? 0 : 1;
  }
  console.error('Kullanım: node indexnow.js fark --eski A --yeni B [--cikti DOSYA] | gonder (BILDIRIM ortam değişkeniyle)');
  return 2;
}

if (require.main === module) main(process.argv.slice(2)).then((c) => { process.exitCode = c; }, (e) => { console.error('IndexNow:', e.message); process.exitCode = 1; });

module.exports = { anahtar, fark, ana, istek };
