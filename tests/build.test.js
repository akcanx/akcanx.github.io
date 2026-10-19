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
