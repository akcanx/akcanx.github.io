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
