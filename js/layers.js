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
  const START = 0.08, SPAN = 0.16;              // layer i arrives during u ∈ [START+i·SPAN, START+(i+1)·SPAN]
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

  let lastL = -2, raf = 0;
  function update() {
    raf = 0;
    const r = trk.getBoundingClientRect();
    const u = reduce ? 1 : cl(-r.top / Math.max(1, trk.offsetHeight - innerHeight));
    const f = (u - START) / SPAN;                 // 0…5 across the five layers
    for (let i = 1; i < N; i++) {
      const o = sm(cl((f - i) / 0.55));           // fade in over the first ~half of its span
      imgs[i].style.opacity = o.toFixed(3);
      imgs[i].style.transform = o < 1 ? `translateY(${(-(1 - o) * 1.6).toFixed(2)}%)` : '';
    }
    const c = sm(u);                              // slow camera move-in across the whole section
    cam.style.transform = `scale(${(1.07 - 0.07 * c).toFixed(4)}) translateX(${(1.2 - 1.2 * c).toFixed(2)}%)`;
    const L = u < START ? -1 : Math.min(N - 1, Math.floor(f));
    if (L !== lastL) {
      lastL = L;
      items.forEach((li, i) => { li.classList.toggle('on', i <= L); li.classList.toggle('cur', i === L); });
      if (cap) cap.textContent = L >= 0 ? items[L].querySelector('span').textContent : '';
    }
  }
  const req = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  update();
})();
