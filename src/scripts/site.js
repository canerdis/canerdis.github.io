// The site's motion layer. Everything here is progressive enhancement: the
// pages are complete HTML without it, and with prefers-reduced-motion it
// steps aside entirely. Six parts:
//
//   1. reveals   elements marked data-rv arrive once as they scroll in
//   2. count     a number counts up when its section arrives (data-count)
//   3. progress  a 1px reading-progress line under the bar
//   4. scramble  mono links shuffle their letters under the pointer
//   5. preview   a picture of the work follows the pointer down the index
//   6. curtain   the page change: close from the clicked row, lift on arrival

const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const EOUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
const EIO = 'cubic-bezier(0.7, 0, 0.2, 1)';

/* ----------------------------------------------------------- 1. reveals */

// [keyframes, duration, easing] for each data-rv value. The starting
// keyframe of each matches the holding state in global.css (.rv-pending).
const SPECS = {
  rails: [[{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)' }], 1800, EIO],
  sweep: [[{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], 1100, EIO],
  mask: [[{ transform: 'translateY(105%)' }, { transform: 'translateY(0)' }], 900, EOUT],
  up: [[{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }], 900, EOUT],
  fade: [[{ opacity: 0 }, { opacity: 1 }], 700, 'ease-out'],
  wipe: [[{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], 1100, EIO],
  row: [
    [{ clipPath: 'inset(0 100% 0 0)', transform: 'translateY(8px)' }, { clipPath: 'inset(0 0% 0 0)', transform: 'translateY(0)' }],
    1000,
    EOUT,
  ],
  clip: [[{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)' }], 1200, EIO],
  zoom: [[{ transform: 'scale(1.15)' }, { transform: 'scale(1)' }], 1600, EOUT],
};

function reveals() {
  const els = document.querySelectorAll('[data-rv]');
  if (reduced || !('IntersectionObserver' in window) || !Element.prototype.animate) {
    root.classList.remove('rv-pending');
    return;
  }
  const t0 = performance.now();
  let observed = false;
  const io = new IntersectionObserver(onIntersect, { rootMargin: '0px 0px -6% 0px' });

  for (const el of els) {
    const spec = SPECS[el.dataset.rv];
    if (!spec) continue;
    const a = el.animate(spec[0], { duration: spec[1], easing: spec[2], fill: 'both' });
    a.pause();
    el._rv = a;
    if ('rvNow' in el.dataset) play(el, Number(el.dataset.rvD || 0));
    else io.observe(el);
  }
  // The paused animations now hold every element at its starting state, so
  // the CSS that held them while the script loaded can go.
  root.classList.remove('rv-pending');

  // Safety net. If the observer never reports (a background tab that paints
  // no frames, a browser quirk), content must not stay hidden: after 1.6s,
  // play whatever is on screen and still waiting; and if the observer has
  // not reported even once by 4s, play everything.
  const pending = () => [...els].filter((el) => el._rv && el._rv.playState === 'paused');
  setTimeout(() => {
    pending()
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.bottom > 0 && r.top < innerHeight;
      })
      .forEach((el, i) => {
        io.unobserve(el);
        play(el, Math.min(i, 10) * 70);
      });
  }, 1600);
  setTimeout(() => {
    if (!observed) pending().forEach((el) => (io.unobserve(el), play(el, 0)));
  }, 4000);

  function onIntersect(entries) {
    observed = true;
    const visible = entries
      .filter((e) => e.isIntersecting)
      .map((e) => e.target)
      .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    // During the first second, elements on the first screen keep the delays
    // written into the markup (the load sequence); anything later just
    // staggers in reading order.
    const intro = performance.now() - t0 < 1000;
    visible.forEach((el, i) => {
      io.unobserve(el);
      const d = el.dataset.rvD;
      const stagger = Math.min(i, 10) * 70;
      play(el, intro ? (d != null ? Number(d) : 820 + stagger) : stagger);
    });
  }
}

function play(el, delay) {
  const a = el._rv;
  if (!a) return;
  a.effect.updateTiming({ delay });
  a.play();
  a.finished.then(
    () => {
      if (el._rv === a) {
        a.cancel();
        el._rv = null;
      }
    },
    () => {},
  );
  el.querySelectorAll('[data-count]').forEach((c) => count(c, delay));
}

/* ----------------------------------------------------------- 2. count */

function count(el, delay) {
  const node = [...el.childNodes].find((n) => n.nodeType === Node.TEXT_NODE);
  if (!node) return;
  const target = Number(el.dataset.count);
  const width = node.nodeValue.trim().length;
  const start = performance.now() + delay;
  node.nodeValue = '0'.padStart(width, '0');
  const step = (now) => {
    const p = Math.min(1, Math.max(0, (now - start) / 700));
    node.nodeValue = String(Math.round(target * (1 - Math.pow(1 - p, 3)))).padStart(width, '0');
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ----------------------------------------------------------- 3. progress */

function progress() {
  const bar = document.querySelector('[data-progress]');
  if (!bar) return;
  let frame = 0;
  const update = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    });
  };
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();
}

/* ----------------------------------------------------------- 4. scramble */

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#_';
const KEEP = ' ↗←→';

function scramble() {
  if (reduced || !finePointer) return;
  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest && e.target.closest('[data-scramble]');
    if (!el || el.contains(e.relatedTarget) || el._scr) return;
    const node = [...el.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && n.nodeValue.trim());
    if (!node) return;
    const orig = node.nodeValue;
    // The accessible name must not change while the letters shuffle.
    if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', el.textContent.trim());
    let f = 0;
    const total = orig.length * 2 + 6;
    el._scr = true;
    const tick = () => {
      f++;
      node.nodeValue = [...orig]
        .map((c, i) => (i < f / 2 - 2 || KEEP.includes(c) ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
        .join('');
      if (f < total) requestAnimationFrame(tick);
      else {
        node.nodeValue = orig;
        el._scr = false;
      }
    };
    tick();
  });
}

/* ----------------------------------------------------------- 5. preview */

function preview() {
  const list = document.querySelector('[data-preview-list]');
  const box = document.querySelector('[data-preview]');
  if (!list || !box || !finePointer) return;
  const reel = box.querySelector('[data-reel]');
  const p = { x: 0, y: 0, tx: 0, ty: 0, on: false, loaded: false, raf: 0, clip: null };

  const loadImages = () => {
    if (p.loaded) return;
    p.loaded = true;
    // The pictures are fetched on the first hover, not with the page.
    box.querySelectorAll('img[data-src]').forEach((img) => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
  };
  const loop = () => {
    const k = reduced ? 1 : 0.14;
    p.x += (p.tx - p.x) * k;
    p.y += (p.ty - p.y) * k;
    box.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
    p.raf = p.on || Math.abs(p.tx - p.x) > 0.3 || Math.abs(p.ty - p.y) > 0.3 ? requestAnimationFrame(loop) : 0;
  };
  const target = (e) => {
    const w = box.offsetWidth;
    const h = box.offsetHeight;
    p.ty = Math.min(innerHeight - h - 12, Math.max(12, e.clientY - h / 2));
    p.tx = e.clientX + 36;
    if (p.tx + w > innerWidth - 12) p.tx = e.clientX - w - 36;
    if (!p.raf) p.raf = requestAnimationFrame(loop);
  };
  const clipTo = (to) => {
    const from = getComputedStyle(box).clipPath;
    if (p.clip) p.clip.cancel();
    p.clip = box.animate([{ clipPath: from }, { clipPath: to }], {
      duration: reduced ? 1 : 460,
      easing: EOUT,
      fill: 'forwards',
    });
  };
  const show = (e) => {
    loadImages();
    target(e);
    if (p.on) return;
    p.x = p.tx;
    p.y = p.ty + 28;
    p.on = true;
    clipTo('inset(0% 0 0% 0)');
  };
  const hide = () => {
    if (!p.on) return;
    p.on = false;
    clipTo('inset(50% 0 50% 0)');
  };

  list.addEventListener('mouseenter', show);
  list.addEventListener('mousemove', (e) => (p.on ? target(e) : show(e)));
  list.addEventListener('mouseleave', hide);
  list.addEventListener('mouseover', (e) => {
    const row = e.target.closest('[data-i]');
    if (row) reel.style.transform = `translateY(-${Number(row.dataset.i) * 100}%)`;
  });
  // A wheel turn moves the rows under a still pointer; the picture follows
  // only on the next mouse move, so hide it rather than show the wrong one.
  addEventListener('scroll', hide, { passive: true });
  preview.hide = hide;
}

/* ----------------------------------------------------------- 6. curtain */

function curtain() {
  const el = document.querySelector('[data-curtain-el]');
  if (!el) return;
  const top = el.querySelector('[data-cl="t"]');
  const bottom = el.querySelector('[data-cl="b"]');
  const label = el.querySelector('[data-cl="l"]');
  let running = [];
  let busy = false;

  const reset = () => {
    running.forEach((a) => a.cancel());
    running = [];
    root.classList.remove('curtain-in');
    root.style.removeProperty('--curtain-label');
    el.style.visibility = 'hidden';
    el.style.pointerEvents = 'none';
    label.textContent = '';
    busy = false;
  };

  // Arriving on a page after a curtain: the page was painted covered (see
  // the inline script in Layout.astro); lift it.
  if (root.classList.contains('curtain-in')) {
    if (reduced) reset();
    else {
      const vh = innerHeight;
      const o = { duration: 700, easing: EIO, fill: 'forwards' };
      el.style.visibility = 'visible';
      running = [
        el.animate([{ clipPath: 'inset(0px 0px 0px 0px)' }, { clipPath: `inset(${vh}px 0px 0px 0px)` }], o),
        top.animate([{ transform: 'translateY(0px)' }, { transform: `translateY(${vh}px)` }], o),
        label.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'ease-out', fill: 'forwards' }),
      ];
      running[0].finished.then(reset, reset);
    }
  }
  // Coming back through the history cache must never show a closed curtain.
  addEventListener('pageshow', (e) => {
    if (e.persisted) reset();
  });

  const close = (rect, text, href) => {
    busy = true;
    if (preview.hide) preview.hide();
    const vh = innerHeight;
    const t = rect ? Math.max(0, rect.top) : vh / 2;
    const b = rect ? Math.min(vh, rect.bottom) : vh / 2;
    label.textContent = text;
    el.style.visibility = 'visible';
    el.style.pointerEvents = 'auto';
    const o = { duration: 560, easing: EIO, fill: 'forwards' };
    running = [
      el.animate([{ clipPath: `inset(${t}px 0px ${vh - b}px 0px)` }, { clipPath: 'inset(0px 0px 0px 0px)' }], o),
      top.animate([{ transform: `translateY(${t}px)` }, { transform: 'translateY(0px)' }], o),
      bottom.animate([{ transform: `translateY(${b - 1}px)` }, { transform: `translateY(${vh - 1}px)` }], o),
      label.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], {
        duration: 360,
        delay: 240,
        easing: EOUT,
        fill: 'forwards',
      }),
    ];
    const go = () => {
      try {
        sessionStorage.setItem('curtain', text);
      } catch {}
      location.href = href;
    };
    running[0].finished.then(() => setTimeout(go, 120), go);
    // If the next page is slow to answer, do not leave the visitor staring
    // at a closed panel with no way back.
    setTimeout(() => {
      if (busy && document.visibilityState === 'visible') reset();
    }, 6000);
  };

  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[data-curtain]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== '_self') return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname) {
      // Same page: an anchor scrolls on its own; a bare link to this page
      // goes back to the top instead of reloading it.
      if (!url.hash) {
        e.preventDefault();
        scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      }
      return;
    }
    if (reduced || busy) return;
    e.preventDefault();
    close(a.getBoundingClientRect(), a.dataset.curtain, url.href);
  });
}

reveals();
progress();
scramble();
preview();
curtain();
