/* ==========================================================================
   Akcan — Site Uygulaması
   Sayfa şablonları render.js'tedir; bu dosya etkileşimleri yönetir.
   - Önizleme (panelle aynı bilgisayar): veri localStorage'dan, adresler #/yazilar/...
   - Yayındaki site (build.js çıktısı): her sayfa hazır HTML olarak gelir, veri
     veri/site.json'dan okunur; sonraki geçişler sayfa yenilenmeden yapılır
     (ses oynatıcı sayfa değişince susmaz), adresler /yazilar/... biçimindedir.
   ========================================================================== */
(function () {
  'use strict';

  const S = window.Store;
  const ICON = window.Render.ICON;
  const esc = S.esc;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  // Yayın derleyicisi her sayfaya { base, siteUrl, data } yazar; yoksa yerel önizlemedeyiz
  const SITE = window.AKCAN_SITE || null;
  let D = null, R = null;

  function setData(data) {
    D = data;
    R = window.Render.create(D, SITE ? { mode: 'site', siteUrl: SITE.siteUrl } : { mode: 'local' });
  }

  /* ---------- Tema ---------- */
  function applyTheme() {
    document.documentElement.style.setProperty('--acid', D.settings.accent || '#C9F03A');
  }

  /* ---------- Menü ---------- */
  function renderNav() {
    $('#brand').textContent = D.settings.siteName || 'Site';
    $('#brand').setAttribute('href', R.href(''));
    const links = R.navLinks();
    $('#menuLinks').innerHTML = links;
    $('#drawerLinks').innerHTML = links;
    const social = R.socialIcons();
    $('#menuSocial').innerHTML = social;
    $('#drawerSocial').innerHTML = social;
    fitNav();
  }

  // Sosyal simgeler menüye sığmıyorsa üst bantta gizlenir (alt bilgide ve telefonda çekmecede durur)
  function fitNav() {
    const wrap = $('#nav > .wrap');
    document.body.classList.remove('nav-tight');
    if (wrap.scrollWidth > wrap.clientWidth) document.body.classList.add('nav-tight');
  }

  function setActive(route) {
    $$('#menuLinks a, #drawerLinks a').forEach((a) => a.classList.toggle('active', R.isActive(a.dataset.route, route)));
  }

  /* ---------- Alt bilgi ---------- */
  function renderFooter() { $('#foot').innerHTML = R.footerHTML(); }

  /* ---------- Ana sayfa akışı ---------- */
  let feedState = { filter: 'all', limit: window.Render.PAGE_SIZE };

  function renderFeed() {
    const feed = $('#feed');
    if (!feed) return;
    const f = R.feedHTML(feedState.filter, feedState.limit);
    feed.innerHTML = f.html;
    $('#feedmore').hidden = !f.more;
    observe();
    Player.sync();
  }

  /* ---------- Sayfa bağlamı: konum satırı, ton, okuma çubuğu, sabit video/ses ---------- */
  let pageCtx = null;
  let pageObservers = [];
  const navH = () => $('#nav').offsetHeight;
  function setNavH() { document.documentElement.style.setProperty('--navh', navH() + 'px'); }

  function setCrail(ctx) {
    const el = $('#crail');
    const c = R.crail(ctx);
    if (!c) { el.hidden = true; return; }
    $('#crailCrumb').innerHTML = c.crumb;
    $('#crailNb').innerHTML = c.nb;
    el.hidden = false;
  }

  // Kapak görselinden sayfa tonu: ortalama renk, doygunluğu ve parlaklığı sabitlenmiş halde
  const tintCache = {};
  function tintFrom(url) {
    if (!url) return Promise.resolve(null);
    if (url in tintCache) return Promise.resolve(tintCache[url]);
    return new Promise((res) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let col = null;
        try {
          const c = document.createElement('canvas');
          c.width = c.height = 16;
          const x = c.getContext('2d');
          x.drawImage(img, 0, 0, 16, 16);
          const d = x.getImageData(0, 0, 16, 16).data;
          let r = 0, g = 0, b = 0, n = 0;
          for (let i = 0; i < d.length; i += 4) {
            const w = Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]) + 6; // doygun pikseller daha ağır
            r += d[i] * w; g += d[i + 1] * w; b += d[i + 2] * w; n += w;
          }
          col = vivid(r / n, g / n, b / n);
        } catch (e) { /* CORS: görselin rengi okunamıyor, varsayılan ton kalır */ }
        tintCache[url] = col;
        res(col);
      };
      img.onerror = () => { tintCache[url] = null; res(null); };
      img.src = url;
    });
  }
  function vivid(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0;
    const s = d === 0 ? 0 : d / (1 - Math.abs(max + min - 1));
    if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = Math.round(h * 60 + 360) % 360;
    if (s < 0.08) return 'hsl(40 10% 38%)'; // gri görsel: nötr sıcak ton
    return `hsl(${h} ${Math.round(Math.max(0.38, Math.min(0.7, s)) * 100)}% 40%)`;
  }

  function teardown() {
    pageObservers.forEach((o) => o.disconnect());
    pageObservers = [];
  }

  // Video görünümden çıkınca sabit küçük pencereye geçer (masaüstünde solda, mobilde üstte)
  function setupPip() {
    const slot = $('.vid-slot');
    if (!slot || !('IntersectionObserver' in window)) return;
    const vid = $('.vidcut', slot);
    const o = new IntersectionObserver(([e]) => {
      const gone = !e.isIntersecting && e.boundingClientRect.top < navH();
      if (!gone) vid.dataset.pipOff = '';
      vid.classList.toggle('is-pip', gone && vid.dataset.pipOff !== '1');
    }, { rootMargin: `-${navH()}px 0px 0px 0px` });
    o.observe(slot);
    pageObservers.push(o);
  }

  // Bölüm ses çubuğu görünümden çıkınca menünün altına yapışır
  function setupDock() {
    const slot = $('.ap-slot');
    if (!slot || !('IntersectionObserver' in window)) return;
    const ap = $('.audioplayer', slot);
    const o = new IntersectionObserver(([e]) => {
      ap.classList.toggle('is-docked', !e.isIntersecting && e.boundingClientRect.top < navH());
    }, { rootMargin: `-${navH()}px 0px 0px 0px` });
    o.observe(slot);
    pageObservers.push(o);
  }

  function updateReadbar() {
    const bar = $('#readbar');
    if (bar.hidden) return;
    const pr = $('.prose') || $('#app article');
    if (!pr) return;
    const r = pr.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (navH() - r.top) / Math.max(1, r.height - innerHeight * 0.5)));
    bar.style.transform = `scaleX(${p.toFixed(4)})`;
  }

  function applyPageCtx() {
    const c = pageCtx || {};
    setCrail(c);
    setNavH();
    $('#readbar').hidden = !c.readbar;
    document.body.classList.toggle('page-detail', !!c.crail);
    const art = $('#app .tinted');
    if (art && !c.tint && c.tintSrc) {
      tintFrom(c.tintSrc).then((col) => { if (col && art.isConnected) art.style.setProperty('--tint', col); });
    }
    setupPip();
    setupDock();
  }

  /* ---------- Yönlendirici ---------- */
  function currentRoute() {
    if (!SITE) return decodeURIComponent(location.hash.replace(/^#\/?/, '')).replace(/\/$/, '');
    let p = decodeURIComponent(location.pathname);
    if (p.startsWith(SITE.base)) p = p.slice(SITE.base.length);
    return p.replace(/(^|\/)index\.html$/, '').replace(/^\/+|\/+$/g, '');
  }

  function go(route, replace) {
    if (!SITE) { const h = '#/' + route; if (replace) location.replace(h); else location.hash = h; return; }
    history[replace ? 'replaceState' : 'pushState'](null, '', R.href(route));
    router();
  }

  // Yayındaki sitede sayfa değişince başlık, açıklama ve kanonik adres de güncellenir
  function updateHead(pg) {
    const desc = $('meta[name="description"]');
    if (desc) desc.setAttribute('content', pg.desc || '');
    const can = $('link[rel="canonical"]');
    if (can && pg.status !== 404) can.setAttribute('href', R.abs(R.href(pg.route)));
  }

  /** initial: yayındaki sitede ilk sayfa zaten hazır HTML olarak gelir, yeniden çizilmez */
  function router(initial) {
    const route = currentRoute();
    const pg = R.page(route);
    // Eski bağlantılar (#/yazi/..., #/bolum/...) yeni adrese yönlenir
    if (pg.redirect !== undefined) { go(pg.redirect, true); return; }
    teardown();
    pageCtx = pg.ctx || null;
    document.title = pg.title;
    updateHead(pg);
    feedState = { filter: 'all', limit: window.Render.PAGE_SIZE };
    if (initial !== true) {
      $('#app').innerHTML = pg.html;
      window.scrollTo(0, 0);
    }
    setActive(route);
    closeDrawer();
    applyPageCtx();
    onScroll();
    observe();
    Player.sync();
  }

  /* ---------- Görünürlük animasyonu ---------- */
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((ents) => ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -40px 0px' })
    : null;
  function observe() {
    $$('.reveal:not(.in)').forEach((el) => (io ? io.observe(el) : el.classList.add('in')));
  }

  /* ---------- Ses oynatıcı ---------- */
  const Player = (() => {
    const el = $('#player');
    const audio = new Audio();
    audio.preload = 'none';
    let cur = null;
    let isDragging = false;
    const SPEEDS = [1, 1.25, 1.5, 2, 0.8];
    let speedIdx = 0;
    let savedVol = Number(localStorage.getItem('akcan.vol') ?? 1);
    audio.volume = savedVol;

    const volSlider = $('#plVol');
    const volBtn = $('#plVolBtn');
    const volIco = $('.i-vol', volBtn);
    const muteIco = $('.i-mute', volBtn);
    const speedBtn = $('#plSpeed');

    if (volSlider) volSlider.value = savedVol;
    updateVolUI();

    function updateVolUI() {
      const v = audio.volume;
      if (volIco && muteIco) {
        volIco.hidden = v === 0;
        muteIco.hidden = v > 0;
      }
      if (volSlider) volSlider.value = v;
    }

    const fmt = (s) => {
      if (!isFinite(s)) return '0:00';
      s = Math.floor(s);
      const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = String(s % 60).padStart(2, '0');
      return h ? `${h}:${String(m).padStart(2, '0')}:${x}` : `${m}:${x}`;
    };

    function play(key) {
      if (cur && cur.key === key) { audio.paused ? audio.play() : audio.pause(); return; }
      if (!R) return; // yayındaki site: veri henüz yüklenmedi
      const [type, id] = key.split(':');
      const it = R.findItem(type, id);
      if (!it || !it.audio) return;
      cur = { key, ...it };
      audio.src = it.audio;
      audio.playbackRate = SPEEDS[speedIdx];
      audio.play().catch(() => {});
      el.hidden = false;
      document.documentElement.style.setProperty('--player-h', el.offsetHeight + 'px');
      $('.pl-title', el).textContent = it.title;
      $('.pl-title', el).setAttribute('href', it.href);
      $('.pl-sub', el).textContent = it.sub || it.label;
      $('.pl-cover', el).style.backgroundImage = it.thumb ? `url("${it.thumb}")` : '';
      $('#plProg').style.width = '0%';
      sync();
    }

    function sync() {
      const playing = cur && !audio.paused;
      el.classList.toggle('playing', !!playing);
      $$('[data-play]').forEach((b) => {
        const on = playing && b.dataset.play === cur.key;
        b.classList.toggle('is-playing', !!on);
        const target = $('.ic', b) || b;
        target.innerHTML = on ? ICON.pause : ICON.play;
        const lb = $('.lb', b);
        if (lb) lb.textContent = on ? 'Duraklat' : 'Dinle';
      });
      // Bölüm sayfasındaki satır içi çubuk çalan parçaya aitse alttaki genel oynatıcı gizlenir
      const own = cur && $(`.audioplayer[data-ap="${cur.key}"]`);
      $$('.audioplayer[data-ap]').forEach((ap) => ap.classList.toggle('is-playing', !!(playing && ap === own)));
      document.body.classList.toggle('ap-own', !!own);
      paintInline();
    }

    function paintInline() {
      const ap = cur && $(`.audioplayer[data-ap="${cur.key}"]`);
      if (!ap) return;
      $('.ap-prog', ap).style.width = (audio.duration ? (audio.currentTime / audio.duration) * 100 : 0) + '%';
      $('.ap-time', ap).textContent = audio.duration ? `${fmt(audio.currentTime)} / ${fmt(audio.duration)}` : fmt(audio.currentTime);
    }

    function close() {
      audio.pause();
      el.hidden = true;
      cur = null;
      document.documentElement.style.setProperty('--player-h', '0px');
      sync();
    }

    function seekRatio(ratio) {
      if (!audio.duration) return;
      const cl = Math.max(0, Math.min(1, ratio));
      audio.currentTime = cl * audio.duration;
      $('#plCur').textContent = fmt(audio.currentTime);
      $('#plProg').style.width = (cl * 100) + '%';
    }

    // 10s geri / ileri
    const backBtn = $('#plBack');
    if (backBtn) backBtn.addEventListener('click', () => {
      audio.currentTime = Math.max(0, audio.currentTime - 10);
    });
    const fwdBtn = $('#plFwd');
    if (fwdBtn) fwdBtn.addEventListener('click', () => {
      audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
    });

    // Hız
    if (speedBtn) speedBtn.addEventListener('click', () => {
      speedIdx = (speedIdx + 1) % SPEEDS.length;
      const sp = SPEEDS[speedIdx];
      audio.playbackRate = sp;
      speedBtn.textContent = sp + 'x';
    });

    // Ses ve Mute
    if (volSlider) volSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      audio.volume = val;
      localStorage.setItem('akcan.vol', val);
      updateVolUI();
    });
    if (volBtn) volBtn.addEventListener('click', () => {
      if (audio.volume > 0) {
        savedVol = audio.volume;
        audio.volume = 0;
      } else {
        audio.volume = savedVol || 1;
      }
      updateVolUI();
    });

    // İlerleme çubuğu ve sürükleme (scrubbing)
    const bar = $('#plBar');
    function onBarMove(e) {
      if (!isDragging || !audio.duration) return;
      const r = bar.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      seekRatio((clientX - r.left) / r.width);
    }
    function onBarUp() {
      if (isDragging) {
        isDragging = false;
        el.classList.remove('dragging');
        window.removeEventListener('mousemove', onBarMove);
        window.removeEventListener('mouseup', onBarUp);
        window.removeEventListener('touchmove', onBarMove);
        window.removeEventListener('touchend', onBarUp);
      }
    }
    bar.addEventListener('mousedown', (e) => {
      if (!audio.duration) return;
      isDragging = true;
      el.classList.add('dragging');
      const r = bar.getBoundingClientRect();
      seekRatio((e.clientX - r.left) / r.width);
      window.addEventListener('mousemove', onBarMove);
      window.addEventListener('mouseup', onBarUp);
    });
    bar.addEventListener('touchstart', (e) => {
      if (!audio.duration) return;
      isDragging = true;
      el.classList.add('dragging');
      const r = bar.getBoundingClientRect();
      seekRatio((e.touches[0].clientX - r.left) / r.width);
      window.addEventListener('touchmove', onBarMove, { passive: true });
      window.addEventListener('touchend', onBarUp);
    }, { passive: true });

    audio.addEventListener('play', sync);
    audio.addEventListener('pause', sync);
    audio.addEventListener('ended', sync);
    audio.addEventListener('timeupdate', () => {
      if (isDragging) return;
      $('#plCur').textContent = fmt(audio.currentTime);
      $('#plProg').style.width = (audio.duration ? (audio.currentTime / audio.duration) * 100 : 0) + '%';
      paintInline();
    });
    audio.addEventListener('loadedmetadata', () => { $('#plDur').textContent = fmt(audio.duration); paintInline(); });
    $('#plToggle').addEventListener('click', () => { if (cur) audio.paused ? audio.play() : audio.pause(); });
    $('#plClose').addEventListener('click', close);

    return { play, sync, audio, seek: seekRatio, isCurrent: (key) => !!cur && cur.key === key, isPlaying: () => cur && !audio.paused };
  })();

  /* ---------- Arama ---------- */
  const modal = $('#searchModal'), input = $('#searchInput'), results = $('#searchResults'), hint = $('#searchHint');
  let selIdx = -1;
  function openSearch(q = '') {
    modal.hidden = false; input.value = q; results.innerHTML = ''; hint.hidden = false;
    if (q) doSearch();
    setTimeout(() => input.focus(), 30);
  }
  function closeSearch() { modal.hidden = true; }
  const norm = (s) => String(s || '').toLocaleLowerCase('tr');
  function mark(text, q) {
    const t = esc(text); if (!q) return t;
    const i = norm(text).indexOf(q); if (i < 0) return t;
    return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length));
  }
  function doSearch() {
    const q = norm(input.value.trim());
    selIdx = -1;
    if (q.length < 2 || !R) { results.innerHTML = ''; hint.hidden = false; return; }
    hint.hidden = true;
    const hits = R.searchIndex().filter((i) => norm(i.title + ' ' + i.text + ' ' + (i.tags || []).join(' ') + ' ' + (i.cat || '')).includes(q)).slice(0, 30);
    if (!hits.length) { results.innerHTML = `<div class="sm-empty">“${esc(input.value)}” için sonuç bulunamadı.</div>`; return; }
    results.innerHTML = hits.map((h) => {
      let ex = h.text || '';
      const i = norm(ex).indexOf(q);
      if (i > 60) ex = '…' + ex.slice(i - 50);
      ex = ex.slice(0, 160);
      return `<a class="sm-hit" href="${h.href}"><div class="sm-type">${h.label}</div><div class="sm-title">${mark(h.title, q)}</div>${ex ? `<div class="sm-excerpt">${mark(ex, q)}</div>` : ''}</a>`;
    }).join('');
  }
  input.addEventListener('input', doSearch);
  input.addEventListener('keydown', (e) => {
    const hits = $$('.sm-hit', results);
    if (!hits.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      selIdx = (selIdx + (e.key === 'ArrowDown' ? 1 : -1) + hits.length) % hits.length;
      hits.forEach((h, i) => h.classList.toggle('sel', i === selIdx));
      hits[selIdx].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      (hits[selIdx] || hits[0]).click();
    }
  });
  $('#searchOpen').addEventListener('click', () => openSearch());
  modal.addEventListener('click', (e) => { if (e.target.closest('[data-close]') || e.target.closest('.sm-hit')) closeSearch(); });

  /* ---------- Çekmece ---------- */
  const drawer = $('#navDrawer');
  function closeDrawer() { drawer.hidden = true; $('#menuOpen').setAttribute('aria-expanded', 'false'); }
  $('#menuOpen').addEventListener('click', () => { drawer.hidden = false; $('#menuOpen').setAttribute('aria-expanded', 'true'); });
  drawer.addEventListener('click', (e) => { if (e.target.closest('[data-drawer-close]') || e.target.closest('a')) closeDrawer(); });

  /* ---------- Klavye ---------- */
  document.addEventListener('keydown', (e) => {
    const typing = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
    if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
      e.preventDefault();
      openSearch();
      return;
    }
    if (e.key === 'Escape') {
      closeSearch();
      closeDrawer();
      return;
    }
    // Ses oynatıcı kısayolları (yazı yazılmıyorken)
    if (!typing && !$('#player').hidden) {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        $('#plToggle').click();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        $('#plBack').click();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        $('#plFwd').click();
      }
    }
  });

  /* ---------- Tıklama yönetimi ---------- */
  document.addEventListener('click', (e) => {
    const pb = e.target.closest('[data-play]');
    if (pb) { e.preventDefault(); Player.play(pb.dataset.play); return; }

    const ff = e.target.closest('#feedfilter button');
    if (ff) {
      $$('#feedfilter button').forEach((b) => b.classList.toggle('on', b === ff));
      feedState = { filter: ff.dataset.f, limit: window.Render.PAGE_SIZE };
      renderFeed();
      return;
    }
    if (e.target.closest('#feedmore')) { feedState.limit += window.Render.PAGE_SIZE; renderFeed(); return; }

    // Etiket / konum kutusu: site içi aramayı o kelimeyle aç
    const qb = e.target.closest('[data-q]');
    if (qb) { openSearch(qb.dataset.q); return; }

    // Sabit küçük video penceresini kapat: video eski yerine döner
    const pc = e.target.closest('.pip-close');
    if (pc) {
      const v = pc.closest('.vidcut');
      v.classList.remove('is-pip');
      v.dataset.pipOff = '1';
      return;
    }

    // Kapak yerine oynatıcıyı yükle; kapat düğmesi korunsun diye içerik silinmez, üstüne eklenir
    const yt = e.target.closest('.ytlite[data-yt]');
    if (yt && !yt.querySelector('iframe')) {
      yt.insertAdjacentHTML('beforeend', `<iframe src="https://www.youtube-nocookie.com/embed/${yt.dataset.yt}?autoplay=1&rel=0" title="YouTube" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`);
      yt.classList.add('on');
    }
  });

  // Bölüm sayfası ses çubuğu: tıkla/sürükle ile konum değiştir
  document.addEventListener('pointerdown', (e) => {
    const bar = e.target.closest('.ap-bar');
    if (!bar) return;
    const key = bar.closest('.audioplayer').dataset.ap;
    if (!Player.isCurrent(key)) { Player.play(key); return; }
    const at = (ev) => { const r = bar.getBoundingClientRect(); return (ev.clientX - r.left) / r.width; };
    Player.seek(at(e));
    const move = (ev) => Player.seek(at(ev));
    const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); };
    addEventListener('pointermove', move);
    addEventListener('pointerup', up);
  });

  /* ---------- Kaydırma ---------- */
  const nav = $('#nav');
  function onScroll() { nav.classList.toggle('solid', window.scrollY > 40); updateReadbar(); }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { fitNav(); setNavH(); updateReadbar(); });
  if (document.fonts) document.fonts.ready.then(fitNav);

  /* ---------- Başlat ---------- */
  if (!SITE) {
    // Önizleme: panelde yapılan değişiklikler açık sitede anında görünür
    setData(S.get());
    window.addEventListener('storage', (e) => {
      if (e.key !== S.KEY) return;
      setData(S.get());
      applyTheme(); renderNav(); renderFooter(); router();
    });
    applyTheme();
    renderNav();
    renderFooter();
    window.addEventListener('hashchange', router);
    router();
    // Panelin Önizleme ekranında: açık sayfanın adresini bildir, "↻ Yenile" ile kodu yeniden yükle
    if (window.parent !== window) {
      const tell = () => window.parent.postMessage({ akcan: 'onizleme', hash: location.hash }, '*');
      window.addEventListener('hashchange', tell);
      tell();
      window.addEventListener('message', (e) => { if (e.source === window.parent && e.data && e.data.akcan === 'yenile') location.reload(); });
    }
  } else {
    // Yayındaki site: sayfa (konum satırı, okuma çubuğu dahil) hazır geldi; veri yüklenince
    // geçişler sayfa yenilenmeden yapılır
    fitNav();
    setNavH();
    setupPip();
    setupDock();
    onScroll();
    observe();
    fetch(SITE.base + SITE.data, { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        setData(S.normalize(data));
        // Eski #/ bağlantıları (paylaşılmış linkler) gerçek adrese taşınır
        if (/^#\//.test(location.hash)) { history.replaceState(null, '', R.href(R.normalize(location.hash.slice(2)))); router(); }
        // 404.html her bilinmeyen adreste açılır: adres veride varsa sayfa yine de gösterilir
        else router(!SITE.notFound);
        document.addEventListener('click', (e) => {
          if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          const a = e.target.closest('a[href]');
          if (!a || a.target || a.hasAttribute('download')) return;
          const u = new URL(a.href, location.href);
          if (u.origin !== location.origin || !u.pathname.startsWith(SITE.base)) return;
          if (/\.[a-z0-9]+$/i.test(u.pathname)) return; // dosya (feed.xml, görsel...)
          if (u.pathname === location.pathname && u.hash) return; // sayfa içi çapa
          e.preventDefault();
          history.pushState(null, '', u.pathname + u.search + u.hash);
          router();
        });
        window.addEventListener('popstate', () => router());
      })
      .catch(() => { /* veri okunamadı: sayfalar hazır HTML olarak çalışır, bağlantılar normal açılır */ });
  }
})();
