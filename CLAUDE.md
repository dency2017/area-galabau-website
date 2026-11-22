# AREA Galabau – website

One-page website for **AREA Galabau** (Garten- & Landschaftsbau, Ravensburg / Bodensee), owner **Armin Besirevic**.
Replaces the old Carrd page https://galabau.carrd.co (use it as the content reference).

- **Live hosting:** Vercel, auto-deploys from `main` of `dency2017/area-galabau-website`. Plain static site – no build step, Framework Preset "Other".
- **Language of the site:** German. Talk to the owner in English unless he writes otherwise.
- **Before pushing:** test at phone size (390×844) *and* desktop (1440×900). The owner prioritises mobile.

## Files

```
index.html               the whole site: HTML + CSS + JS (+ the import map / loader for the 3D modules)
js/hero3d.js             3D hero (three.js): sketch → colour → depth
js/layers3d.js           3D cross-section "Was unter dem Pflaster steckt"
js/tilt.js               gentle tilt of the gallery card (plain CSS transforms, no three.js)
favicon.svg              the "A" square from the logo (white on #4f5057)
apple-touch-icon.png     same, 180px
img/<name>.jpg           real photos
img/<name>-s.jpg         pencil-sketch twin of each photo (made with tools/sketch.py)
img/ba-before.jpg        before/after slider pair, aligned with tools/align_before_after.py
img/ba-after.jpg
img/hero-depth.png       depth map of hero.jpg (white = near), made with tools/depth.py
img/hero-lines.json      pencil line work for the 3D hero, made with tools/lines.py
img/layers-static.jpg    still of the finished layer block (2D / reduced-motion fallback)
tools/                   Python helpers (not used by the site at runtime, not deployed)
docs/                    PR screenshots (not deployed)
```

## Brand rules (from the owner)

- **Colours:** `#a6ca4f` (green) for buttons, highlights, active states. `#4f5057` (grey) for navbar, dark sections, footer.
  Background paper `#F1EEE6` / `#FAF8F3`, ink `#1F211C`.
- **Highlighted words** (`<em>` in h1/h2/footer headline) get a **solid green background box** – never an underline.
  The owner explicitly asked: no underlines anywhere.
- **Text on green is always `#4f5057`** (contrast 4.27:1). White on green is 1.88:1 – never use it.
  Text on `#4f5057` is white.
- **Logo:** inline SVG (traced from the owner's PDF), white on the grey navbar and footer. Don't redraw it.
- **Favicon:** only the A square of the logo.
- **Fonts:** Inter Tight (UI/headings, light weight) + Instrument Serif italic for highlighted words.

## Contact details (real – keep exactly)

- AREA Galabau · Armin Besirevic
- Königin-Katharina-Straße, Ravensburg (house number + postcode **still missing** – ask owner)
- area.galabau@gmail.com
- 0176 20785893 → `tel:+4917620785893`, WhatsApp `https://wa.me/4917620785893`
- Opening hours, "Meisterbetrieb seit 2012", "300+ Projekte", "5,0 / 8 Google-Bewertungen" come from the Carrd page – **not yet confirmed** by the owner.

## Key features (all in index.html)

- **Hero (sketch → photo):** `.hero-track` is 300svh tall with a sticky `.hero`. As you scroll, the real photo fades in over the
  sketch – opacity + saturation + slight scale, driven directly by scroll position in `heroUpdate()`.
  The owner wants it **subtle and gradual** (based on a reference video). Do NOT use brush/wipe/mask effects – that was tried and rejected.
- **Stacked sections:** `.stack` has `margin-top:-100svh` so it slides up over the hero like a card.
- **Before/after slider** (`#ba`): real photos, no sketch. Pointer drag anywhere on the image; hidden range input for keyboard.
- **Gallery** (`#grid.rail`): horizontal scroll-snap carousel. Phone: one card at ~84vw, swipe. Desktop: 3 cards, arrows + mouse drag.
  Filter tabs by category. Cards fade sketch→photo when they come into view.
- **Lightbox** (`#lb`): full-screen, native swipe between photos (scroll-snap track), counter, Esc/arrows.
  State class is `is-open` – don't rename it to `open`, which collides with the opening-hours badge `.open`.
- **Inquiry form:** 3 steps, then builds a summary and offers **E-Mail** (mailto), **WhatsApp** and **Anrufen**. No backend.
- **Opening-hours badge:** live "Jetzt geöffnet / Geschlossen" using Europe/Berlin time (`HRS` array).
- **Mobile bar:** sticky Anrufen / Anfrage buttons on phones.
- Watch out for class-name collisions in the single CSS file (e.g. `.in` is the reveal state; inputs use `.inp`).

## 3D (branch `3d-experience`)

three.js **0.187.0** comes from jsDelivr through the import map in `<head>` (no build step). The
map also swaps the un-minified `three.core.js` that `three.module.min.js` imports for
`three.core.min.js`. Total ~194 KB gzip, no addons. To upgrade, change the version in **all
three** URLs of the import map.

**3D or 2D?** A tiny script in `<head>` sets `<html data-fx="3d|2d">` before first paint:
- `2d` (the original site: CSS sketch → photo fade, static layer image) when there's no WebGL2,
  `prefers-reduced-motion`, or a low-end device (≤2 cores, or ≤4 cores with ≤4 GB RAM where the
  browser reports it). Note: iOS Safari doesn't report RAM, so iPhones are judged by the frame test.
- `js/hero3d.js` also times its first ~24 frames. If they're slower than 45 ms each it retries at
  pixel ratio 1, then gives up. Any error (CDN blocked, texture 404, context lost) calls
  `AREA.fallback2d()`, which switches the whole page to `2d` (see the console line "3D aus").
- Test switches: **`?2d`** forces the old version, **`?3d`** skips the low-end check.

**Hero** (`js/hero3d.js`). index.html still computes the scroll progress `p` in `heroUpdate()` and
calls `hero3d.update(p)`. There's no extra scroll listener and no scroll-jacking. Frames are only
drawn when `p` changes. In 3D mode `.hero-track` is 400svh (2D: 300svh).
- Stage boundaries: `STAGE` (sketch until .25, colour until .55, then depth).
  "Dann gebaut." / CTAs appear at `p>.42` (`hero.classList.toggle('built',…)`).
- Colour crossfade: `apply()` – `uMix` opacity, `uSat` saturation, `uBlur` soft focus (mip bias).
  No brush/wipe/mask effects (owner rejected them).
- Depth: `AMP` (strength), `YAW` / `PITCH` (degrees), `DOLLY` (how much closer), `OVERSCAN` (how much
  larger than the screen the photo plane is – keep ≥ 1.1 or edges can show when the camera moves).
  Depth is applied along the start camera's view rays, so the photo looks identical until the camera moves.
- New hero photo: run `tools/sketch.py photo.jpg hero 2200`, then `tools/depth.py` and `tools/lines.py`,
  and update `aspect:` (width/height of hero.jpg) in the module loader at the end of index.html.

**Was unter dem Pflaster steckt** (`#unterbau`, `js/layers3d.js`). Loaded only when the section is
~1 screen away. Sticky stage over a 300svh track (`.ub-track`). Layer i drops in during
scroll progress `START + i*SPAN`. The labels are the `<ol id="ubList">` in index.html (text is
edited there). On phones the current sentence is mirrored into `#ubCap` (fixed height = no layout
shift). Rotation: drag/swipe sideways (`touch-action: pan-y`, so vertical swiping still scrolls),
arrow keys when focused, pitch clamped to `PITCH_MIN…PITCH_MAX`, no zoom. A focus-only skip link
"3D-Modell überspringen" jumps to #ablauf. The heights in `LAYERS` are for the picture only.
**No real thicknesses are shown – TODO: Armin bestätigen** before adding any figures.
After changing the look, regenerate `img/layers-static.jpg`: in the browser console in 3D mode,
after the section has loaded, run `AREA.ub.snapshot()` (returns a PNG data URL of the canvas, with
a transparent background). Put it on #F1EEE6 at 1200×900.

**Gallery tilt** (`js/tilt.js`, loaded after the hero is ready). Mouse on desktop, device
orientation on Android. iOS is skipped because it would show a permission prompt. Max 4–5°.
Delete the `import('./js/tilt.js')` line in index.html to switch it off.

**Performance rules**: pixel ratio ≤ 2 (≤ 1.5 on phones). Each canvas renders only while it's
on screen, the tab is visible and something changed. The canvases are `aria-hidden`; all text is HTML.

## Film hero test (`film.html`, branch `3d-experience`)

Alternative to the three.js hero, made because the owner found the live 3D look low quality.
`film.html` is the normal 2D site (main's index.html) with one change: the hero is a **scroll-scrubbed
film** (Apple-product-page technique). 64 pre-rendered frames in `img/film/d/` (4:3, desktop) and
`img/film/m/` (3:4, phones, picked when the screen is portrait), made by `tools/film.py` **only from
the real photo, its sketch and its depth map** – the sketch turns into colour while the camera glides
into the garden. Nothing is invented (an AI video test with Veo 3.1 replaced the garden with a
different one mid-clip – rejected; don't use generative video for real project photos).
Scroll picks the frame; the page blends two neighbouring frames, so it stays smooth. Frames load
coarse-to-fine. Re-render after changing the hero photo: `python tools/film.py` (needs hero.jpg,
hero-s.jpg, hero-depth.png). Camera move: `dz, dx, dy` in the script.

## Adding a project photo

1. `python tools/sketch.py path/to/photo.jpg p11` (creates `img/p11.jpg` and `img/p11-s.jpg`).
2. In `index.html` add the size printed by the script to `SIZE`, and add an entry to `PROJ`:
   `{t:'Titel des Projekts',c:'pflaster',img:'p11'}` – categories are the keys of `CATS`
   (`terrasse`, `pflaster`, `garten`, `zaun`, `erde`).
3. Project titles describe only what is visible in the photo – don't invent locations or claims.

Hero photo: `python tools/sketch.py photo.jpg hero 2200` (then see "3D" above for the depth map + lines).
Depth tool needs torch → Python 3.12 venv in `tools/.venv` (setup at the top of `tools/depth.py`).
New before/after pair: `python tools/align_before_after.py before.jpg after.jpg`.

## Still to do

- **Impressum** and **Datenschutzerklärung** pages (legally required in Germany) – footer links are placeholders.
  Need full address, and any tax/trade registration details from the owner.
- Confirm the Carrd-sourced facts listed above.
- 3D cross-section: Armin to confirm the layer descriptions (and real thicknesses, if they should be shown).
- When the owner has a custom domain: add it in Vercel, and add canonical URL + Open Graph tags (og:image = hero photo).
- Optional: connect the form to a form service if the owner wants inquiries without mailto/WhatsApp.
- Button text (`#4f5057` on green, 4.27:1) is slightly under WCAG AA for small text – owner was told; darker text is an option if he wants it.
