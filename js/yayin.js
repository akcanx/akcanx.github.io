/* ==========================================================================
   Akcan — Yayın (GitHub)
   Panelde kaydedilen içeriği GitHub deposuna gönderir; GitHub Actions ardından
   siteyi derleyip (build.js) GitHub Pages'te yayınlar.
   - Yalnızca yayındaki içerik gider: taslaklar, örnek içerikler, panel şifresi ve
     erişim anahtarı gönderilmez.
   - İçerik ayrı bir dalda (icerik) tutulur; kodun bulunduğu ana dal hiç değişmez.
   - Panelden yüklenen görseller veri/gorsel/ altına ayrı dosya olarak yazılır;
     değişmeyen dosyalar yeniden yüklenmez.
   ========================================================================== */
(function (global) {
  'use strict';

  const S = global.Store;
  const KEY = 'akcan.yayin.v1';
  const BRANCH = 'icerik';
  const EVENT = 'icerik-guncellendi';
  const API = 'https://api.github.com';
  const DELAY = 4000; // art arda kayıtları tek gönderimde toplamak için bekleme

  /* ---------- Bağlantı ayarları (yalnızca bu tarayıcıda; yedeğe ve yayına girmez) ---------- */
  function config() {
    let c = {};
    try { c = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { /* bozuk kayıt: varsayılanlar */ }
    return { repo: '', token: '', auto: true, last: null, ...c };
  }
  function setConfig(patch) {
    const c = { ...config(), ...patch };
    localStorage.setItem(KEY, JSON.stringify(c));
    return c;
  }
  const ready = (c = config()) => /^[\w.-]+\/[\w.-]+$/.test(c.repo || '') && !!c.token;

  /** Deponun GitHub Pages adresi: kullanici/kullanici.github.io → kök, diğerleri → /depo-adi/ */
  function pagesUrl(repo) {
    const [o, r] = String(repo || '').split('/');
    if (!o || !r) return '';
    const host = o.toLowerCase() + '.github.io';
    return r.toLowerCase() === host ? `https://${host}/` : `https://${host}/${r}/`;
  }

  /* ---------- GitHub API ---------- */
  function explain(status, msg) {
    if (status === 401) return 'Erişim anahtarı geçersiz ya da süresi dolmuş. GitHub’da yeni bir anahtar oluşturun.';
    if (status === 403) return 'Anahtarın bu depoya yazma izni yok. Anahtarda “Contents: Read and write” izni olmalı.';
    if (status === 404) return 'Depo bulunamadı. “kullanıcı/depo” adını ve anahtarın bu depoya erişimini kontrol edin.';
    if (status === 409) return 'Depo boş. Önce site dosyalarını GitHub’a yükleyin.';
    return `GitHub hatası (${status})${msg ? ': ' + msg : ''}`;
  }

  async function gh(c, method, path, body) {
    let r;
    try {
      r = await fetch(API + '/repos/' + c.repo + path, {
        method,
        headers: {
          Authorization: 'Bearer ' + c.token,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          ...(body ? { 'Content-Type': 'application/json' } : {})
        },
        body: body ? JSON.stringify(body) : undefined
      });
    } catch (e) { throw new Error('GitHub’a ulaşılamadı. İnternet bağlantınızı kontrol edin.'); }
    if (r.status === 204) return null;
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(explain(r.status, j.message)); e.status = r.status; throw e; }
    return j;
  }

  /** Depoya erişimi dener; depo bilgisini döner */
  async function test(repo, token) {
    const info = await gh({ repo, token }, 'GET', '');
    return { name: info.full_name, private: !!info.private, pages: pagesUrl(info.full_name) };
  }

  /* ---------- Yayına gidecek veri ---------- */
  // Taslaklar, örnek içerikler (seriler dahil) ve yayında olmayan serilerin bölümleri yayına girmez
  const publicData = (D) => S.forPublish(D);

  /* ---------- Görseller: data: adresleri ayrı dosyalara ---------- */
  const EXT = { jpeg: 'jpg', jpg: 'jpg', png: 'png', webp: 'webp', gif: 'gif', 'svg+xml': 'svg', avif: 'avif' };
  const DATA_URL = /data:image\/([a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)/g;
  const b64ToBytes = (b64) => Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
  function bytesToB64(bytes) {
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }
  const subtle = global.crypto && global.crypto.subtle;
  const hex = (buf) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
  const sha1 = async (bytes) => hex(await subtle.digest('SHA-1', bytes));
  // Git'in dosya kimliği sha1("blob <boyut>\0" + içerik): depodakiyle aynıysa yeniden yüklenmez
  async function gitSha(bytes) {
    const head = new TextEncoder().encode(`blob ${bytes.length}\0`);
    const all = new Uint8Array(head.length + bytes.length);
    all.set(head);
    all.set(bytes, head.length);
    return sha1(all);
  }

  async function extractImages(d) {
    const urls = new Set();
    (function find(v) {
      if (typeof v === 'string') { for (const m of v.matchAll(DATA_URL)) urls.add(m[0]); }
      else if (v && typeof v === 'object') Object.values(v).forEach(find);
    })(d);
    const files = new Map();
    for (const u of urls) {
      const [, type, b64] = u.match(/^data:image\/([a-z0-9.+-]+);base64,(.+)$/);
      const bytes = b64ToBytes(b64);
      // Dosya adı içerikten: aynı görsel her zaman aynı adı alır
      const name = subtle ? (await sha1(bytes)).slice(0, 16) : S.hash(b64);
      files.set(u, { path: `veri/gorsel/${name}.${EXT[type] || 'img'}`, bytes });
    }
    const swap = (v) => {
      if (typeof v === 'string') return v.replace(DATA_URL, (m) => files.get(m).path);
      if (Array.isArray(v)) return v.map(swap);
      if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, swap(x)]));
      return v;
    };
    return { data: swap(d), files: [...files.values()] };
  }

  /* ---------- Gönderim ---------- */
  async function publish(D) {
    const c = config();
    if (!ready(c)) throw new Error('GitHub bağlantısı kurulmadı (Panel → Yayın & SEO).');
    const { data, files } = await extractImages(publicData(D));
    files.unshift({ path: 'veri/site.json', bytes: new TextEncoder().encode(JSON.stringify(data, null, 1)) });

    // İçerik dalının şu anki hali (ilk yayında dal yoktur)
    let parent = null;
    const existing = new Map();
    try {
      const ref = await gh(c, 'GET', '/git/ref/heads/' + BRANCH);
      parent = ref.object.sha;
      const commit = await gh(c, 'GET', '/git/commits/' + parent);
      const tree = await gh(c, 'GET', '/git/trees/' + commit.tree.sha + '?recursive=1');
      tree.tree.forEach((t) => { if (t.type === 'blob') existing.set(t.path, t.sha); });
    } catch (e) { if (e.status !== 404) throw e; }

    const entries = [];
    let changed = existing.size !== files.length;
    for (const f of files) {
      let sha = subtle ? await gitSha(f.bytes) : null;
      if (!sha || existing.get(f.path) !== sha) {
        sha = (await gh(c, 'POST', '/git/blobs', { content: bytesToB64(f.bytes), encoding: 'base64' })).sha;
        changed = changed || existing.get(f.path) !== sha;
      }
      entries.push({ path: f.path, mode: '100644', type: 'blob', sha });
    }
    if (!changed) return { changed: false };

    // Tam ağaç: artık kullanılmayan görseller daldan kendiliğinden çıkar
    const tree = await gh(c, 'POST', '/git/trees', { tree: entries });
    const commit = await gh(c, 'POST', '/git/commits', {
      message: 'İçerik güncellendi (' + new Date().toLocaleString('tr-TR') + ')',
      tree: tree.sha,
      parents: parent ? [parent] : []
    });
    if (parent) await gh(c, 'PATCH', '/git/refs/heads/' + BRANCH, { sha: commit.sha });
    else await gh(c, 'POST', '/git/refs', { ref: 'refs/heads/' + BRANCH, sha: commit.sha });
    // GitHub Actions siteyi yeniden derleyip yayınlasın
    await gh(c, 'POST', '/dispatches', { event_type: EVENT });
    return { changed: true, commit: commit.sha };
  }

  /* ---------- Otomatik yayın ve durum ---------- */
  let timer = null, running = false, again = false, state = { s: 'idle' };
  const listeners = [];
  const status = () => { const c = config(); return { ...state, ready: ready(c), auto: c.auto, last: c.last, repo: c.repo }; };
  function emit(s) { state = s; listeners.forEach((fn) => fn(status())); }
  function onChange(fn) { listeners.push(fn); fn(status()); }

  /** Kayıttan sonra çağrılır: kısa bir beklemeden sonra gönderir */
  function schedule() {
    const c = config();
    if (!c.auto || !ready(c)) return;
    clearTimeout(timer);
    timer = setTimeout(run, DELAY);
    emit({ s: 'waiting' });
  }

  async function run() {
    clearTimeout(timer);
    timer = null;
    if (running) { again = true; return; }
    running = true;
    emit({ s: 'running' });
    try {
      const r = await publish(S.get());
      const prev = config().last || {};
      setConfig({ last: { ok: true, at: Date.now(), changed: r.changed, commit: r.commit || prev.commit } });
      emit({ s: 'ok', changed: r.changed });
    } catch (e) {
      setConfig({ last: { ok: false, at: Date.now(), msg: e.message } });
      emit({ s: 'error', msg: e.message });
    } finally {
      running = false;
      if (again) { again = false; run(); }
    }
  }

  const busy = () => running || !!timer;
  // Gönderim bitmeden panel kapatılırsa uyar
  global.addEventListener('beforeunload', (e) => { if (busy()) { e.preventDefault(); e.returnValue = ''; } });

  global.Yayin = { BRANCH, config, setConfig, ready, pagesUrl, test, publicData, schedule, run, busy, status, onChange };
})(window);
