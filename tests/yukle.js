/* Testler için: tarayıcı dosyalarını Node'da yükler (sahte localStorage ile) */
'use strict';

globalThis.window = globalThis;
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => { mem.set(k, String(v)); },
  removeItem: (k) => { mem.delete(k); },
  clear: () => mem.clear()
};

require('../js/ornek-icerik.js');
require('../js/store.js');
require('../js/render.js');

const S = globalThis.Store, Render = globalThis.Render, O = globalThis.AKCAN_ORNEK;

// Sürüm 3 kaydı: tek program (settings.podcast), bölümlerde cat, series yok
const v3 = (podcastOver = {}) => ({
  version: 3, sampleVersion: 4,
  settings: {
    podcast: {
      name: 'Frekans', eyebrow: 'Podcast · Her Pazartesi', description: O.series[0].description,
      note: 'not', readText: 'Oku + Dinle', cover: 'https://picsum.photos/seed/pod-show/900/900',
      spotify: 'https://open.spotify.com/', apple: '', youtube: '', tint: '#1F5A50',
      cats: [{ id: 'muzik', name: 'Müzik', slug: 'muzik', desc: '', link: '' }], ...podcastOver
    }
  },
  posts: JSON.parse(JSON.stringify(O.posts)),
  podcasts: O.podcasts.filter((p) => p.series === 'seri-frekans').map((p) => { const x = { ...p, cat: 'muzik' }; delete x.series; return x; })
});

module.exports = { S, Render, O, mem, v3 };
