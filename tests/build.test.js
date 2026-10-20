/* Yayın derleyicisi (build.js): örnek içerik dosyası yüklenmeden çalışır */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { v3 } = require('./yukle');

test('derleme-ornek-program-yayina-gitmez', () => { // değiştirilmemiş "Frekans" programı derlemede de örnek sayılır
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'akcan-'));
  fs.mkdirSync(path.join(dir, 'veri'));
  const raw = v3();
  raw.podcasts = [];
  fs.writeFileSync(path.join(dir, 'veri', 'site.json'), JSON.stringify(raw));
  execFileSync(process.execPath, [path.join(__dirname, '..', 'build.js'), '--veri', path.join(dir, 'veri'), '--cikti', path.join(dir, '_site'), '--site-url', 'https://ornek.test/'], { stdio: 'pipe' });
  const out = JSON.parse(fs.readFileSync(path.join(dir, '_site', 'veri', 'site.json'), 'utf8'));
  assert.equal(out.series.length, 0);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('derleme-tam-metin-ve-simge', () => { // GEO: llms-full.txt; dokunmatik cihaz simgesi
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'akcan-'));
  fs.mkdirSync(path.join(dir, 'veri'));
  const raw = v3({ name: 'Kendi' });
  raw.posts = [{ id: 'k1', kind: 'yazi', title: 'Kendi Yazım', slug: 'kendi-yazim', date: '2026-10-01', cover: 'https://ornek.test/k.jpg', content: '<h2>Ara başlık</h2><p>Gövde metni burada.</p><ul><li>Bir madde</li></ul>', tags: ['Deneme'] }];
  raw.podcasts = [];
  fs.writeFileSync(path.join(dir, 'veri', 'site.json'), JSON.stringify(raw));
  execFileSync(process.execPath, [path.join(__dirname, '..', 'build.js'), '--veri', path.join(dir, 'veri'), '--cikti', path.join(dir, '_site'), '--site-url', 'https://ornek.test/'], { stdio: 'pipe' });
  const site = (f) => fs.readFileSync(path.join(dir, '_site', f), 'utf8');
  const full = site('llms-full.txt');
  assert.match(full, /Kendi Yazım/);
  assert.match(full, /Ara başlık/);
  assert.match(full, /Gövde metni burada\./);
  assert.match(full, /- Bir madde/);
  assert.match(site('llms.txt'), /https:\/\/ornek\.test\/llms-full\.txt/);
  assert.ok(fs.existsSync(path.join(dir, '_site', 'apple-touch-icon.png')));
  assert.match(site('index.html'), /<link rel="apple-touch-icon" href="\/apple-touch-icon\.png">/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('derleme-kitaplar-llms', () => { // kendi kitabı: sayfası, llms.txt bölümü, llms-full.txt künye ve satış bağlantısı
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'akcan-'));
  fs.mkdirSync(path.join(dir, 'veri'));
  const raw = v3({ name: 'Kendi' });
  raw.podcasts = [];
  raw.version = 5;
  raw.series = [];
  raw.books = [{ id: 'kb', title: 'Kendi Kitabım', slug: 'kendi-kitabim', published: true, isbn: '978-605-123-456-7', publisher: 'Yayınevi', tagline: 'Kısa tanıtım', amazon: 'https://www.amazon.com.tr/dp/123' }];
  fs.writeFileSync(path.join(dir, 'veri', 'site.json'), JSON.stringify(raw));
  execFileSync(process.execPath, [path.join(__dirname, '..', 'build.js'), '--veri', path.join(dir, 'veri'), '--cikti', path.join(dir, '_site'), '--site-url', 'https://ornek.test/'], { stdio: 'pipe' });
  const site = (f) => fs.readFileSync(path.join(dir, '_site', f), 'utf8');
  assert.ok(fs.existsSync(path.join(dir, '_site', 'kitaplar', 'kendi-kitabim', 'index.html')));
  assert.match(site('llms.txt'), /## Kitaplar[\s\S]*Kendi Kitabım/);
  assert.match(site('llms-full.txt'), /978-605-123-456-7/);
  assert.match(site('llms-full.txt'), /https:\/\/www\.amazon\.com\.tr\/dp\/123/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('derleme-indexnow-anahtari', () => { // IndexNow anahtar dosyası; kendi alan adı varsa onun adına
  const { anahtar } = require('../indexnow.js');
  const derle = (raw) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'akcan-'));
    fs.mkdirSync(path.join(dir, 'veri'));
    fs.writeFileSync(path.join(dir, 'veri', 'site.json'), JSON.stringify(raw));
    execFileSync(process.execPath, [path.join(__dirname, '..', 'build.js'), '--veri', path.join(dir, 'veri'), '--cikti', path.join(dir, '_site'), '--site-url', 'https://ornek.test/'], { stdio: 'pipe' });
    return dir;
  };
  let dir = derle(v3());
  const k = anahtar('ornek.test');
  assert.equal(fs.readFileSync(path.join(dir, '_site', k + '.txt'), 'utf8'), k);
  fs.rmSync(dir, { recursive: true, force: true });
  const raw = v3();
  raw.settings.seo = { siteUrl: 'https://akcan.com/' };
  dir = derle(raw);
  assert.ok(fs.existsSync(path.join(dir, '_site', anahtar('akcan.com') + '.txt')));
  fs.rmSync(dir, { recursive: true, force: true });
});

test('derleme-kaynaklar', () => { // kendi kaynağı: sayfası, site haritası, llms bölümleri; yalnız örnek + gizli menüde hiçbiri
  const derle = (raw) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'akcan-'));
    fs.mkdirSync(path.join(dir, 'veri'));
    fs.writeFileSync(path.join(dir, 'veri', 'site.json'), JSON.stringify(raw));
    execFileSync(process.execPath, [path.join(__dirname, '..', 'build.js'), '--veri', path.join(dir, 'veri'), '--cikti', path.join(dir, '_site'), '--site-url', 'https://ornek.test/'], { stdio: 'pipe' });
    return dir;
  };
  const raw = v3({ name: 'Kendi' });
  Object.assign(raw, { podcasts: [], series: [], version: 6 });
  raw.resources = [{ id: 'k1', title: 'Kendi Kaynağım', slug: 'kendi-kaynagim', published: true, date: '2026-10-01', summary: 'Kısa açıklama burada.', url: 'https://ornek.test/arac', links: [{ label: 'Belge', url: 'https://ornek.test/belge' }] }];
  let dir = derle(raw);
  const site = (f) => fs.readFileSync(path.join(dir, '_site', f), 'utf8');
  assert.ok(fs.existsSync(path.join(dir, '_site', 'kaynaklar', 'kendi-kaynagim', 'index.html')));
  assert.match(site('sitemap.xml'), /kaynaklar\/kendi-kaynagim\//);
  assert.match(site('llms.txt'), /## Kaynaklar[\s\S]*Kendi Kaynağım/);
  assert.match(site('llms-full.txt'), /Kısa açıklama burada\.[\s\S]*Bağlantılar:[\s\S]*https:\/\/ornek\.test\/belge/);
  fs.rmSync(dir, { recursive: true, force: true });
  const bos = v3({ name: 'Kendi' });
  Object.assign(bos, { podcasts: [], series: [], version: 6 });
  dir = derle(bos);
  assert.ok(!fs.existsSync(path.join(dir, '_site', 'kaynaklar')));
  assert.ok(!/kaynaklar/.test(site('sitemap.xml')) && !/## Kaynaklar/.test(site('llms.txt')));
  fs.rmSync(dir, { recursive: true, force: true });
});
