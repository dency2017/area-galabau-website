/* AREA Galabau – gentle 3D tilt of the project card you're looking at (max ~4–5°).
   Desktop: follows the mouse over a card. Phones: follows the device orientation for the card in the
   middle of the rail – only where no permission prompt is needed (Android). iOS would show a system
   permission dialog, which doesn't fit a calm landing page, so iPhones simply don't tilt.
   Plain CSS transforms (no WebGL), one element at a time, rAF-throttled, off while the rail is
   scrolling or off-screen, so it can't make swiping heavier. Remove the <script> tag to switch it off. */
const MAX_X = 4, MAX_Y = 5;
const grid = document.getElementById('grid');
const cl = (v, a, b) => Math.min(b, Math.max(a, v));
let active = null, raf = 0, rx = 0, ry = 0, onScreen = false, scrolling = 0;

function paint() {
  raf = 0;
  if (!active) return;
  active.style.transform = rx || ry ? `perspective(1100px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)` : '';
}
function set(card, x, y) {
  if (active && active !== card) active.style.transform = '';
  active = card; rx = x; ry = y;
  if (!raf) raf = requestAnimationFrame(paint);
}
new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; if (!onScreen) set(null, 0, 0); }).observe(grid);
grid.addEventListener('scroll', () => { scrolling = performance.now(); }, { passive: true });

if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  grid.addEventListener('pointermove', e => {
    if (grid.classList.contains('dragging')) return set(null, 0, 0);
    const c = e.target.closest('.card'); if (!c) return;
    const r = c.getBoundingClientRect();
    set(c, -((e.clientY - r.top) / r.height - .5) * 2 * MAX_X, ((e.clientX - r.left) / r.width - .5) * 2 * MAX_Y);
  });
  grid.addEventListener('pointerleave', () => { if (active) { rx = ry = 0; paint(); } });
} else if ('DeviceOrientationEvent' in window && typeof DeviceOrientationEvent.requestPermission !== 'function') {
  let b0 = null, g0 = null;
  addEventListener('deviceorientation', e => {
    if (e.beta == null || !onScreen) return;
    if (performance.now() - scrolling < 250) return set(null, 0, 0);     // never fight a swipe
    b0 = b0 == null ? e.beta : b0 + (e.beta - b0) * .02;                   // slowly follow how the phone is held
    g0 = g0 == null ? e.gamma : g0 + (e.gamma - g0) * .02;
    const mid = innerWidth / 2;
    let best = null, bd = 1e9;
    for (const c of grid.querySelectorAll('.card:not(.gone)')) {
      const r = c.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - mid);
      if (d < bd) { bd = d; best = c; }
    }
    if (best) set(best, cl((e.beta - b0) * .35, -MAX_X, MAX_X), cl((e.gamma - g0) * .35, -MAX_Y, MAX_Y));
  }, { passive: true });
}
