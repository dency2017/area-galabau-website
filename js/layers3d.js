/* AREA Galabau – "Was unter dem Pflaster steckt": a block of ground that builds itself layer by layer.

   Loaded by index.html (only in 3D mode) when #unterbau comes within ~1 screen of the viewport.
   index.html passes the section's scroll progress u (0…1 over the sticky track) to api.update(u).

   Layers, bottom → top (labels/sentences are real HTML in index.html, <ol id="ubList">):
     0 Erdreich · 1 Frostschutzschicht/Schotter · 2 Splittbett · 3 Pflastersteine · 4 Fugen
   Heights in LAYERS are only for the picture – NOT to scale and NOT technical values.
   TODO: Armin bestätigen – real layer thicknesses (if they should ever be shown in the labels).

   Rotate: drag / swipe sideways (touch keeps vertical scrolling native: touch-action pan-y),
   arrow keys when the model is focused. No zoom, pitch clamped so it can't flip over, damped.
   Renders only while something moves, and only while on screen and the tab is visible. */
import * as THREE from 'three';

const W = 6, DEP = 4;                                   // block footprint (x, z)
const LAYERS = [                                         // y-heights for the picture only (see TODO above)
  { h: 1.7 },  // Erdreich
  { h: 1.25 }, // Frostschutzschicht / Schotter
  { h: .34 },  // Splittbett
  { h: .42 },  // Pflastersteine
];
const START = .06, SPAN = .15;                           // layer i drops in during u ∈ [START+i·SPAN, START+(i+1)·SPAN]
const PITCH_MIN = 8, PITCH_MAX = 52, PITCH0 = 24, YAW0 = -32;
const sm = t => t * t * (3 - 2 * t);
const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeOut = t => 1 - Math.pow(1 - t, 3);

// small canvas textures – speckles in the brand-friendly palette, no image downloads
function speckle(base, dots, density, rmin, rmax, seed = 1, angular = false) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'); g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < density; i++) {
    const x = rnd() * 256, y = rnd() * 256, r = rmin + rnd() * (rmax - rmin);
    g.fillStyle = dots[(rnd() * dots.length) | 0];
    g.beginPath();
    if (angular) {
      const n = 5 + (rnd() * 3 | 0), a0 = rnd() * 6.28;
      for (let k = 0; k < n; k++) { const a = a0 + k / n * 6.28, rr = r * (.7 + rnd() * .5); g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    } else g.arc(x, y, r, 0, 6.28);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}

function shadowTex() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 10, 64, 64, 64);
  gr.addColorStop(0, 'rgba(40,36,28,.42)'); gr.addColorStop(1, 'rgba(40,36,28,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function slab(h, tex, rep) {
  const geo = new THREE.BoxGeometry(W, h, DEP);
  tex.repeat.set(rep[0], rep[1]);
  const m = new THREE.MeshStandardMaterial({ map: tex, roughness: .96, metalness: 0, transparent: true });
  const mesh = new THREE.Mesh(geo, m);
  return mesh;
}

export async function init({ host, phone, onLayer, onReady }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'gl';
  canvas.setAttribute('aria-hidden', 'true');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, phone ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, .1, 200);
  scene.add(new THREE.HemisphereLight('#ffffff', '#8a857a', 1.8));
  const sun = new THREE.DirectionalLight('#fffaf3', 2.1); sun.position.set(-4, 9, 6); scene.add(sun);
  const fill = new THREE.DirectionalLight('#e8eef5', .6); fill.position.set(6, 2, -4); scene.add(fill);

  const block = new THREE.Group(); scene.add(block);
  let y = 0;
  const earth = slab(LAYERS[0].h, speckle('#6f5743', ['#5c4636', '#7e6550', '#4e3b2d', '#8a7058', '#9a8a78'], 2600, .8, 3.2, 7), [2, .6]);
  const gravel = slab(LAYERS[1].h, speckle('#8f8c86', ['#6f6c67', '#a9a69f', '#7d7a74', '#bdbab3', '#5e5b57'], 1500, 2.5, 7, 3, true), [2.4, .55]);
  const splitt = slab(LAYERS[2].h, speckle('#b9b4a9', ['#a29d92', '#cbc7bd', '#8f8b82', '#d6d2c8'], 5200, .6, 1.6, 11), [3, .2]);
  const slabs = [earth, gravel, splitt];
  slabs.forEach((m, i) => { m.userData.rest = y + LAYERS[i].h / 2; y += LAYERS[i].h; m.position.y = m.userData.rest; block.add(m); });
  const paveY = y, paveH = LAYERS[3].h;

  // paving stones: running bond, cut at the block edges like a real cross-section
  const SL = .9, SW = .6, GAP = .045, stones = [];
  for (let z = -DEP / 2, row = 0; z < DEP / 2 - .01; z += SW, row++) {
    for (let x = -W / 2 - (row % 2) * SL / 2; x < W / 2 - .01; x += SL) {
      const x0 = Math.max(x + GAP / 2, -W / 2), x1 = Math.min(x + SL - GAP / 2, W / 2);
      const z0 = Math.max(z + GAP / 2, -DEP / 2), z1 = Math.min(z + SW - GAP / 2, DEP / 2);
      if (x1 - x0 > .08) stones.push({ x: (x0 + x1) / 2, z: (z0 + z1) / 2, sx: x1 - x0, sz: z1 - z0, row });
    }
  }
  const stoneMat = new THREE.MeshStandardMaterial({ color: '#c4c4c1', roughness: .82, metalness: 0,
    map: speckle('#ffffff', ['#ebebea', '#f5f5f4', '#dfdfdd', '#d6d6d4'], 3000, .5, 1.4, 5) });
  const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), stoneMat, stones.length);
  const col = new THREE.Color();
  stones.forEach((s, i) => { const v = .93 + ((i * 37) % 11) / 11 * .1; inst.setColorAt(i, col.setRGB(v, v, v)); });
  block.add(inst);
  // joint sand: a slab under the stones that rises into the gaps in the last step
  const joints = new THREE.Mesh(new THREE.BoxGeometry(W - .004, 1, DEP - .004),
    new THREE.MeshStandardMaterial({ map: speckle('#d3c8ad', ['#c4b899', '#e0d7c0', '#b8ac8d'], 4000, .5, 1.2, 19), roughness: 1 }));
  block.add(joints);

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.9, DEP * 2.2),
    new THREE.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -.01; scene.add(shadow);

  const total = paveY + paveH;
  block.position.y = -total / 2; shadow.position.y = -total / 2 - .01;
  const target = new THREE.Vector3(0, .1, 0);

  // ---- state
  let u = 0, shown = 0, Wd = 1, Hd = 1, visible = true, raf = 0, dragging = false, lastX = 0, lastY = 0, curLayer = -1;
  let yaw = YAW0, yawVel = 0, yawGoal = null, pitch = PITCH0, pitchGoal = PITCH0;

  function layerT(i) { return cl((shown - START - i * SPAN) / SPAN); }

  function place() {
    slabs.forEach((m, i) => {
      const t = layerT(i), e = easeOut(t);
      m.position.y = m.userData.rest + (1 - e) * 2.4;
      m.material.opacity = sm(cl(t * 1.6));
      m.visible = t > 0;
    });
    // stones fall row by row, slightly staggered
    const t3 = layerT(3), mtx = new THREE.Matrix4(), rows = Math.ceil(DEP / SW);
    stones.forEach((s, i) => {
      const k = cl(t3 * 1.6 - (s.row / rows) * .6 - ((i * 13) % 7) / 7 * .05), e = easeOut(k);
      const yy = paveY + paveH / 2 + (1 - e) * 1.8;
      mtx.makeScale(s.sx, paveH, s.sz).setPosition(s.x, yy, s.z);
      if (k <= 0) mtx.makeScale(0, 0, 0);
      inst.setMatrixAt(i, mtx);
    });
    inst.instanceMatrix.needsUpdate = true;
    const t4 = sm(layerT(4)), jh = .02 + t4 * (paveH - .05);
    joints.scale.y = jh; joints.position.y = paveY + jh / 2; joints.visible = t3 > .5;
    // stones and joints only matter once the layer arrives
    const L = shown < START ? -1 : Math.min(4, Math.floor((shown - START) / SPAN));
    if (L !== curLayer) { curLayer = L; onLayer(L); }
  }

  function camPlace() {
    const ya = THREE.MathUtils.degToRad(yaw + shown * 14), pa = THREE.MathUtils.degToRad(pitch);
    // fit the block (bounding sphere) to the view in both directions
    const R = Math.hypot(W / 2, DEP / 2, total / 2) * 1.04;
    const vf = THREE.MathUtils.degToRad(camera.fov / 2), hf = Math.atan(Math.tan(vf) * camera.aspect);
    const dist = R / Math.sin(Math.min(vf, hf));
    camera.position.set(Math.sin(ya) * Math.cos(pa) * dist, Math.sin(pa) * dist, Math.cos(ya) * Math.cos(pa) * dist).add(target);
    camera.lookAt(target);
  }

  function resize() {
    Wd = host.clientWidth; Hd = host.clientHeight;
    renderer.setSize(Wd, Hd, false);
    camera.aspect = Wd / Hd; camera.updateProjectionMatrix();
    kick();
  }

  function step() {
    raf = 0;
    if (!visible || document.hidden) return;
    let moving = false;
    const d = u - shown;                                       // ease towards scroll (keeps the drop soft)
    if (Math.abs(d) > .0005) { shown += d * .18; moving = true; } else shown = u;
    if (yawGoal !== null) { const g = yawGoal - yaw; yaw += g * .14; if (Math.abs(g) < .05) { yaw = yawGoal; yawGoal = null; } else moving = true; }
    if (!dragging && Math.abs(yawVel) > .01) { yaw += yawVel; yawVel *= .9; moving = true; }
    const pg = pitchGoal - pitch; if (Math.abs(pg) > .05) { pitch += pg * .14; moving = true; } else pitch = pitchGoal;
    place(); camPlace();
    renderer.render(scene, camera);
    if (moving || dragging) kick();
  }
  function kick() { if (!raf) raf = requestAnimationFrame(step); }

  // ---- input
  host.addEventListener('pointerdown', e => {
    dragging = true; lastX = e.clientX; lastY = e.clientY; yawVel = 0; yawGoal = null;
    if (e.pointerType === 'mouse') host.setPointerCapture(e.pointerId);
    host.classList.add('grab'); kick();
  });
  host.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY;
    yawVel = -dx * .35; yaw += yawVel;
    if (e.pointerType === 'mouse') pitchGoal = cl(pitchGoal + dy * .25, PITCH_MIN, PITCH_MAX);
    kick();
  });
  const up = () => { dragging = false; host.classList.remove('grab'); kick(); };
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => host.addEventListener(t, up));
  host.addEventListener('keydown', e => {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'ArrowRight') { yawGoal = (yawGoal ?? yaw) + (k === 'ArrowLeft' ? 15 : -15); }
    else if (k === 'ArrowUp' || k === 'ArrowDown') { pitchGoal = cl(pitchGoal + (k === 'ArrowUp' ? 6 : -6), PITCH_MIN, PITCH_MAX); }
    else return;
    e.preventDefault(); kick();
  });

  host.appendChild(canvas);
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }).observe(host);
  document.addEventListener('visibilitychange', kick);
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); canvas.remove(); onReady(false); });
  resize();
  renderer.compile(scene, camera);
  place(); camPlace(); renderer.render(scene, camera);
  requestAnimationFrame(() => { canvas.classList.add('on'); onReady(true); });

  return {
    update(v) { u = v; kick(); },
    // used once by the screenshot tooling to make img/layers-static.jpg
    snapshot() { u = shown = 1; yaw = YAW0; pitch = PITCH0; place(); camPlace(); renderer.render(scene, camera); return canvas.toDataURL('image/png'); }
  };
}
