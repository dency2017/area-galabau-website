/* AREA Galabau – 3D hero: sketch → coloured photo → 2.5D depth.

   Loaded by index.html only when data-fx="3d" (WebGL2 works, not low-end, no reduced motion).
   index.html keeps computing the scroll progress p (0…1 over the sticky hero) and calls
   api.update(p). Nothing here listens to scroll itself, and frames are only drawn when p
   changes (plus a short intro), so the page's native scroll is never blocked.

   Stages (tune in STAGE below):
     0.00–0.25  Sketch  – pencil lines (img/hero-lines.json) draw themselves in over img/hero-s.jpg
     0.25–0.55  Colour  – shader crossfade to img/hero.jpg: opacity, then saturation, soft → sharp
     0.55–1.00  Depth   – img/hero-depth.png pulls near parts towards the camera, camera orbits a few °

   The depth is applied along the view ray of the starting camera, so from the start position the
   photo looks exactly flat and unchanged; depth only becomes visible as the camera moves (parallax).
   Far parts (black in the depth map) never move off the plane, and the plane is OVERSCAN larger
   than the screen, so no gap can appear at the edges.

   If anything fails (no WebGL, textures can't load, too slow, context lost) we call
   AREA.fallback2d() and the page shows the original CSS sketch → photo fade. */
import * as THREE from 'three';

const STAGE = { sketchEnd: .25, colourEnd: .55 };
const OVERSCAN = 1.12;          // plane is 12% larger than the screen (index.html scales the 2D twin the same)
const D = 10;                   // start camera distance
const FOV = 30;
const AMP = 1.5;                // how far the nearest point comes towards the camera (scene units)
const YAW = 3.2, PITCH = 1.4, DOLLY = .06;   // stage-3 camera move: degrees, degrees, fraction of D
const PAPER = new THREE.Color('#F1EEE6');

const sm = t => t * t * (3 - 2 * t);
const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

const VERT = /* glsl */`
uniform sampler2D tDepth; uniform float uDepth, uAmp, uD;
varying vec2 vUv;
void main(){
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.);
  float z = texture2D(tDepth, uv).r * uAmp * uDepth;
  wp.xy *= (uD - z) / uD;         // slide along the ray from the start camera → unchanged when seen head-on
  wp.z = z;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const FRAG = /* glsl */`
uniform sampler2D tSketch, tPhoto; uniform vec3 uPaper;
uniform float uSketch, uMix, uSat, uCon, uBlur;
varying vec2 vUv;
void main(){
  vec3 sk = mix(uPaper, texture2D(tSketch, vUv).rgb, uSketch);
  vec3 ph = texture2D(tPhoto, vUv, uBlur).rgb;            // mip bias = soft focus
  float l = dot(ph, vec3(.299, .587, .114));
  ph = mix(vec3(l), ph, uSat);
  ph = (ph - .5) * uCon + .5;
  gl_FragColor = vec4(mix(sk, ph, uMix), 1.);
}`;
const LVERT = /* glsl */`
attribute float aT; varying float vT;
void main(){ vT = aT; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.); }`;
const LFRAG = /* glsl */`
uniform float uDraw, uAlpha; varying float vT;
void main(){ if (vT > uDraw) discard; gl_FragColor = vec4(.122, .129, .110, uAlpha); }`;

function loadTex(url) {
  return new Promise((res, rej) => new THREE.TextureLoader().load(url, t => {
    t.colorSpace = THREE.NoColorSpace;          // do the maths in sRGB, like the CSS filters of the 2D version
    t.anisotropy = 4;
    res(t);
  }, undefined, rej));
}

function buildLines(data) {
  // every stroke gets a start time; strokes overlap a little so several are "being drawn" at once
  const n = data.lines.length, pos = [], ts = [];
  data.lines.forEach((s, i) => {
    const t0 = (i / n) * .72, dur = .28, pts = s.length / 2;
    for (let k = 0; k < pts - 1; k++) {
      for (const j of [k, k + 1]) {
        pos.push(s[2 * j] / data.w - .5, .5 - s[2 * j + 1] / data.h, .002);
        ts.push(t0 + dur * j / (pts - 1));
      }
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aT', new THREE.Float32BufferAttribute(ts, 1));
  return g;
}

export async function init({ host, after, aspect, phone, getP }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'gl';
  canvas.setAttribute('aria-hidden', 'true');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  const maxDpr = phone ? 1.5 : 2;
  let dpr = Math.min(devicePixelRatio || 1, maxDpr);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(PAPER);

  const [tSketch, tPhoto, tDepth, lines] = await Promise.all([
    loadTex('img/hero-s.jpg'), loadTex('img/hero.jpg'), loadTex('img/hero-depth.png'),
    fetch('img/hero-lines.json').then(r => { if (!r.ok) throw new Error('lines'); return r.json(); })
  ]);
  tDepth.generateMipmaps = false; tDepth.minFilter = THREE.LinearFilter;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, .1, 100);
  const uni = {
    tSketch: { value: tSketch }, tPhoto: { value: tPhoto }, tDepth: { value: tDepth },
    uPaper: { value: new THREE.Vector3(0xF1 / 255, 0xEE / 255, 0xE6 / 255) },   // sRGB, like the textures
    uDepth: { value: 0 }, uAmp: { value: AMP }, uD: { value: D },
    uSketch: { value: 0 }, uMix: { value: 0 }, uSat: { value: .35 }, uCon: { value: .92 }, uBlur: { value: 2.2 }
  };
  const seg = phone ? [160, 120] : [240, 180];
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, ...seg),
    new THREE.ShaderMaterial({ uniforms: uni, vertexShader: VERT, fragmentShader: FRAG }));
  scene.add(plane);
  const lUni = { uDraw: { value: 0 }, uAlpha: { value: .7 } };
  const lineMesh = new THREE.LineSegments(buildLines(lines),
    new THREE.ShaderMaterial({ uniforms: lUni, vertexShader: LVERT, fragmentShader: LFRAG, transparent: true, depthWrite: false }));
  plane.add(lineMesh);

  let W = 1, H = 1, p = 0, intro = 0, visible = true, lastKey = '', dead = false;

  function resize() {
    W = host.clientWidth; H = host.clientHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    // "object-fit: cover" × OVERSCAN, centred – identical framing to the 2D twin underneath
    const vh = 2 * D * Math.tan(THREE.MathUtils.degToRad(FOV / 2)), vw = vh * W / H;
    let pw = vw * OVERSCAN, ph = pw / aspect;
    if (ph < vh * OVERSCAN) { ph = vh * OVERSCAN; pw = ph * aspect; }
    plane.scale.set(pw, ph, 1);
    lastKey = '';
  }

  const pivot = new THREE.Vector3(0, 0, AMP * .45);
  function apply() {
    const draw = Math.max(intro, cl(p / STAGE.sketchEnd));
    uni.uSketch.value = .18 + .82 * sm(cl(draw * 1.1));
    lUni.uDraw.value = draw * 1.001;
    lUni.uAlpha.value = .7 * (1 - sm(cl((p - STAGE.sketchEnd) / .16)));
    lineMesh.visible = lUni.uAlpha.value > .005;

    const k = cl((p - STAGE.sketchEnd) / (STAGE.colourEnd - STAGE.sketchEnd));
    uni.uMix.value = sm(cl(k / .65));
    uni.uSat.value = .35 + .65 * sm(cl((k - .2) / .8));
    uni.uCon.value = .92 + .08 * sm(k);
    uni.uBlur.value = 2.2 * (1 - sm(cl((k - .1) / .9)));

    const t = sm(cl((p - STAGE.colourEnd) / (1 - STAGE.colourEnd)));
    uni.uDepth.value = sm(cl((p - STAGE.colourEnd) / .12));
    const yaw = THREE.MathUtils.degToRad(YAW * t), pitch = THREE.MathUtils.degToRad(PITCH * t);
    const r = (D - pivot.z) * (1 - DOLLY * t);
    camera.position.set(pivot.x + r * Math.sin(yaw) * Math.cos(pitch), pivot.y + r * Math.sin(pitch), pivot.z + r * Math.cos(yaw) * Math.cos(pitch));
    camera.lookAt(pivot);
  }

  function frame() {
    if (dead || !visible || document.hidden) return;
    const key = p.toFixed(4) + '|' + intro.toFixed(3) + '|' + W + 'x' + H;
    if (key === lastKey) return;          // nothing changed → don't draw
    lastKey = key;
    apply();
    renderer.render(scene, camera);
  }

  // ---- go live
  resize();
  after.after(canvas);
  new ResizeObserver(() => { resize(); frame(); }).observe(host);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; frame(); }).observe(host);
  document.addEventListener('visibilitychange', frame);
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); dead = true; canvas.remove(); window.AREA.fallback2d('context lost'); });

  // ---- intro: the lines start drawing on their own for ~2 s. Meanwhile we time the frames:
  //      median > 45 ms (under ~22 fps) → retry once at pixel ratio 1 → still slow → 2D fallback.
  renderer.compile(scene, camera);
  const api = { update(v) { p = v; frame(); }, frameMs: 0, dpr };
  const measure = () => new Promise(res => {
    const dts = []; let last = 0;
    const tick = now => {
      if (dead) return res(Infinity);
      if (last) dts.push(now - last);
      last = now;
      intro = .5 * sm(cl((now - t0 - 250) / 2200));
      p = getP(); lastKey = ''; frame();
      if (dts.length === 3) canvas.classList.add('on');
      if (dts.length < 24) requestAnimationFrame(tick);
      else res(dts.slice(4).sort((a, b) => a - b)[10]);
    };
    requestAnimationFrame(tick);
  });
  const t0 = performance.now();
  let med = await measure();
  if (med > 45 && dpr > 1) { dpr = 1; renderer.setPixelRatio(1); resize(); med = await measure(); }
  if (med > 45) {
    dead = true; canvas.remove(); renderer.dispose();
    throw new Error('too slow: ' + med.toFixed(1) + ' ms/frame');
  }
  api.frameMs = med; api.dpr = dpr;
  // let the intro finish (it only ever moves forward; scrolling past it takes over)
  const finish = now => {
    if (dead) return;
    intro = .5 * sm(cl((now - t0 - 250) / 2200));
    p = getP(); frame();
    if (intro < .5) requestAnimationFrame(finish);
  };
  requestAnimationFrame(finish);
  return api;
}
