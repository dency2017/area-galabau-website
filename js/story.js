/* "Ein Auftrag, Schritt für Schritt" – a real job told by scrolling (css/story.css).
   Four photos (img/story/1…4) cross-fade as you scroll, each with a slow zoom. Stage 2 first appears as
   the pencil sketch of the same photo (img/story/2-s) and then colours in – "Erst gezeichnet. Dann gebaut."
   Steps in the list are clickable. Phones load the 900 px set (-m.webp). Plain images, no WebGL. */
(() => {
  const trk = document.getElementById('psTrack');
  if (!trk) return;
  const view = document.getElementById('psView');
  const items = [...document.querySelectorAll('#psList li')];
  const cap = document.getElementById('psCap');
  const badge = document.getElementById('psBadge');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const size = matchMedia('(max-width: 820px)').matches ? 'm' : 'd';
  const N = items.length, START = 0.04, SPAN = 0.23;     // step i = u ∈ [START+i·SPAN, START+(i+1)·SPAN]
  const cl = (v) => Math.min(1, Math.max(0, v));
  const sm = (t) => t * t * (3 - 2 * t);

  // layer order: 1, 2-sketch, 2, 3, 4
  const files = ['1', '2-s', '2', '3', '4'];
  const imgs = {};
  files.forEach((f) => {
    const im = new Image();
    im.alt = '';
    im.decoding = 'async';
    im.dataset.src = `img/story/${f}-${size}.webp`;
    view.appendChild(im);
    imgs[f] = im;
  });
  view.appendChild(badge);
  new IntersectionObserver((en, ob) => {
    if (!en[0].isIntersecting) return;
    ob.disconnect();
    files.forEach((f) => (imgs[f].src = imgs[f].dataset.src));
  }, { rootMargin: '150% 0px' }).observe(trk);

  let lastL = -2, raf = 0, pick = -1;
  const zoom = (im, t) => { im.style.transform = `scale(${(1.08 - 0.08 * sm(cl(t))).toFixed(4)})`; };
  function update() {
    raf = 0;
    const r = trk.getBoundingClientRect();
    const u = reduce ? 1 : cl(-r.top / Math.max(1, trk.offsetHeight - innerHeight));
    const f = pick >= 0 ? pick + 0.75 : (u - START) / SPAN;          // 0…4
    const inn = (i) => sm(cl((f - i + 0.07) / 0.14));                  // short fade at each step change (photos are from different angles)
    const o2 = inn(1), colour = sm(cl((f - 1 - 0.3) / 0.45));         // step 2: pencil sketch first, then it colours in
    imgs['2-s'].style.opacity = o2.toFixed(3);
    imgs['2'].style.opacity = (o2 * colour).toFixed(3);
    imgs['3'].style.opacity = inn(2).toFixed(3);
    imgs['4'].style.opacity = inn(3).toFixed(3);
    zoom(imgs['1'], (f + 0.3) / 1.4);
    zoom(imgs['2-s'], (f - 0.8) / 1.4); zoom(imgs['2'], (f - 0.8) / 1.4);
    zoom(imgs['3'], (f - 1.8) / 1.4);
    zoom(imgs['4'], (f - 2.8) / 1.6);
    const L = Math.max(0, Math.min(N - 1, Math.floor(f)));
    if (L !== lastL) {
      lastL = L;
      items.forEach((li, i) => { li.classList.toggle('on', i <= L); li.classList.toggle('cur', i === L); });
      if (cap) cap.textContent = items[L].querySelector('span').textContent;
      badge.innerHTML = `Schritt <b>${L + 1}</b> von ${N}`;
    }
  }
  const req = () => { if (!raf) raf = requestAnimationFrame(update); };
  items.forEach((li, i) => {
    li.tabIndex = 0;
    li.setAttribute('role', 'button');
    li.setAttribute('aria-label', `Schritt ${i + 1}: ${li.querySelector('b').textContent} anzeigen`);
    const go = () => {
      if (reduce) { pick = i; req(); return; }
      const top = trk.getBoundingClientRect().top + scrollY;
      const len = trk.offsetHeight - innerHeight;
      const y = Math.round(top + len * (START + (i + 0.6) * SPAN)), y0 = scrollY;
      scrollTo({ top: y, behavior: 'smooth' });
      setTimeout(() => { if (Math.abs(scrollY - y0) < 2 && Math.abs(y - y0) > 2) scrollTo(0, y); }, 700);
    };
    li.addEventListener('click', go);
    li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  update();
})();
