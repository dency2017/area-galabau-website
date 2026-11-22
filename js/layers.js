/* "Was unter dem Pflaster steckt" – the cross-section builds itself while you scroll.
   Five renders (img/layers/1…5, aligned to each other by tools/align_layers.py) are stacked; each new
   layer fades and settles in during its share of the scroll, while the "camera" slowly moves in.
   Works without WebGL; plain images + CSS transforms. Phones load the small set (-m.webp). */
(() => {
  const trk = document.getElementById('ubTrack');
  if (!trk) return;
  const view = document.getElementById('ubView');
  const items = [...document.querySelectorAll('#ubList li')];
  const cap = document.getElementById('ubCap');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const size = matchMedia('(max-width: 820px)').matches ? 'm' : 'd';
  const START = 0.05, SPAN = 0.18;              // step i is shown for u ∈ [START+i·SPAN, START+(i+1)·SPAN]
  const N = 5;
  const cl = (v) => Math.min(1, Math.max(0, v));
  const sm = (t) => t * t * (3 - 2 * t);

  const cam = document.createElement('div');
  cam.className = 'ub-cam';
  const imgs = Array.from({ length: N }, (_, i) => {
    const im = new Image();
    im.alt = '';
    im.decoding = 'async';
    im.dataset.src = `img/layers/${i + 1}-${size}.webp`;
    cam.appendChild(im);
    return im;
  });
  view.prepend(cam);
  const badge = document.createElement('span');
  badge.className = 'ub-badge';
  badge.textContent = 'Illustration';
  view.appendChild(badge);

  // load the images when the section is about one screen away
  new IntersectionObserver((en, ob) => {
    if (!en[0].isIntersecting) return;
    ob.disconnect();
    imgs.forEach((im) => (im.src = im.dataset.src));
  }, { rootMargin: '120% 0px' }).observe(trk);

  let lastL = -2, raf = 0, pick = -1;          // pick: step chosen by click (reduced-motion only)
  function update() {
    raf = 0;
    const r = trk.getBoundingClientRect();
    const u = reduce ? 1 : cl(-r.top / Math.max(1, trk.offsetHeight - innerHeight));
    const f = (u - START) / SPAN;                 // 0…5 across the five layers
    for (let i = 1; i < N; i++) {
      // short fade centred on the step change, then the step holds still for most of its span
      const o = pick >= 0 ? (i <= pick ? 1 : 0) : sm(cl((f - i + 0.15) / 0.3));
      imgs[i].style.opacity = o.toFixed(3);
      imgs[i].style.transform = o < 1 ? `translateY(${(-(1 - o) * 1.6).toFixed(2)}%)` : '';
    }
    const c = sm(u);                              // slow camera move-in across the whole section
    cam.style.transform = `scale(${(1.07 - 0.07 * c).toFixed(4)}) translateX(${(1.2 - 1.2 * c).toFixed(2)}%)`;
    const L = pick >= 0 ? pick : u < START ? -1 : Math.min(N - 1, Math.floor(f));
    if (L !== lastL) {
      lastL = L;
      items.forEach((li, i) => { li.classList.toggle('on', i <= L); li.classList.toggle('cur', i === L); });
      if (cap) cap.textContent = L >= 0 ? items[L].querySelector('span').textContent : '';
    }
  }
  const req = () => { if (!raf) raf = requestAnimationFrame(update); };

  // click / Enter on a step: scroll to the middle of that step (or just show it, without motion)
  items.forEach((li, i) => {
    li.tabIndex = 0;
    li.setAttribute('role', 'button');
    li.setAttribute('aria-label', `Schritt ${i + 1}: ${li.querySelector('b').textContent} anzeigen`);
    const go = () => {
      if (reduce) { pick = i; imgs.forEach((im) => { if (!im.src) im.src = im.dataset.src; }); req(); return; }
      const top = trk.getBoundingClientRect().top + scrollY;
      const len = trk.offsetHeight - innerHeight;
      scrollTo({ top: Math.round(top + len * (START + (i + 0.5) * SPAN)), behavior: 'smooth' });
    };
    li.addEventListener('click', go);
    li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  update();
})();
