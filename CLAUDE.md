# AREA Galabau – website

One-page website for **AREA Galabau** (Garten- & Landschaftsbau, Ravensburg / Bodensee), owner **Armin Besirevic**.
Replaces the old Carrd page https://galabau.carrd.co (use it as the content reference).

- **Live hosting:** Vercel, auto-deploys from `main` of `dency2017/area-galabau-website`. Plain static site – no build step, Framework Preset "Other".
- **Language of the site:** German. Talk to the owner in English unless he writes otherwise.
- **Before pushing:** test at phone size (390×844) *and* desktop (1440×900). The owner prioritises mobile.

## Files

```
index.html               the whole site: HTML + CSS + JS (film hero, gallery, layers, reviews, form …)
impressum.html           Impressum (yellow .todo = missing info from Armin)
datenschutz.html         Datenschutzerklärung (same)
404.html                 "page not found" (Vercel serves it automatically; absolute paths)
vercel.json              security headers (CSP …), cache rules, redirect /film.html → /
robots.txt, sitemap.xml  for Google (domain inside – change with the custom domain)
css/fonts.css, fonts/    self-hosted fonts (Latin subset WOFF, made from google/fonts; OFL licences in fonts/)
css/legal.css            styles of the legal pages + 404
css/layers.css, js/layers.js   cross-section "Was unter dem Pflaster steckt"
css/reviews.css, js/reviews.js reviews section; api/ = Vercel functions for it
favicon.svg              the "A" square from the logo (white on #4f5057)
apple-touch-icon.png     same, 180px
img/<name>.jpg           masters of the real photos (not loaded by the site, except og.jpg)
img/<name>.webp          lightbox size (1600)       ┐ made from the .jpg masters
img/<name>-c.webp        gallery card size (900)    │ with tools/webp.py
img/<name>-s.webp        pencil-sketch card (900)   ┘ (sketch master: <name>-s.jpg from tools/sketch.py)
img/ba-before/after(.webp|-m.webp)  before/after slider (aligned with tools/align_before_after.py)
img/film/d|m/            hero film frames (tools/film.py)
img/hero-lines.json      pencil strokes of the hero drawing phase (tools/lines.py)
img/hero-depth.png       depth map, only used by tools/film.py
img/layers/              the five cross-section stages (tools/align_layers.py)
img/og.jpg               1200×630 link-preview image (crop of hero.jpg)
tools/                   Python helpers (not deployed)
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
  **Self-hosted** (`css/fonts.css`) – never link Google Fonts again (DSGVO, LG München 2022).
  No woff2 because brotli wasn't installable here; WOFF ~124 KB total.

## Contact details (real – keep exactly)

- AREA Galabau · Armin Besirevic
- Königin-Katharina-Straße, Ravensburg (house number + postcode **still missing** – ask owner)
- area.galabau@gmail.com
- 0176 20785893 → `tel:+4917620785893`, WhatsApp `https://wa.me/4917620785893`
- Opening hours, "Meisterbetrieb seit 2012", "300+ Projekte", "5,0 / 8 Google-Bewertungen" come from the Carrd page – **not yet confirmed** by the owner.

## Key features (all in index.html)

- **Hero:** scroll-scrubbed film with a pencil-drawing phase – see "Hero film" below.
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

## Hero film

The owner chose this over a live three.js 3D hero (he found that "low quality"; removed). The hero is a **scroll-scrubbed
film** (Apple-product-page technique). 64 pre-rendered frames in `img/film/d/` (4:3, desktop) and
`img/film/m/` (3:4, phones, picked when the screen is portrait), made by `tools/film.py` **only from
the real photo, its sketch and its depth map** – the sketch turns into colour while the camera glides
into the garden. Nothing is invented (an AI video test with Veo 3.1 replaced the garden with a
different one mid-clip – rejected; don't use generative video for real project photos).
Before the film there's a **pencil-drawing phase** (owner asked for it): the outlines from
`img/hero-lines.json` draw themselves over the faint sketch – on their own for ~2.6 s after load, then
scroll continues it (`DRAW_END` = .25 of the hero track); the film runs until `FILM_END` (.85), and the
strokes fade out as the colour arrives. The track is 420svh (320svh on phones, ≤820px). Scroll picks the frame; the page blends two neighbouring frames, so it stays smooth. Frames load
coarse-to-fine (~4 MB on phones, ~7.5 MB desktop – the heaviest part of the page). The first frame is a `<picture>` so phones
only fetch `m/000.webp`. Re-render after changing the hero photo: `python tools/film.py` (needs hero.jpg,
hero-s.jpg, hero-depth.png). Camera move: `dz, dx, dy` in the script.

## Was unter dem Pflaster steckt

**Was unter dem Pflaster steckt** (`#unterbau`, `js/layers.js`, `css/layers.css`) – Replaced an earlier three.js block (owner: "visually plain"). Five photoreal renders of a cut-open
block (`img/layers/1…5-{d,m}.webp`: Erdreich, Schotter, Splittbett, Pflaster, Fugen), made with OpenArt
(Kling Image 4.0; each stage made from its neighbour so heights match), aligned with
`tools/align_layers.py`. Sticky stage over a 520svh track; step i is shown for
`START + i*SPAN` (short fade at each change, then it holds), the "camera" slowly moves in. Steps in the
list are clickable (scrolls to the middle of that step; keyboard: Enter). No WebGL. Labelled "Illustration" (it shows the method,
not a specific job). Labels = `<ol id="ubList">`; on phones the current sentence goes to `#ubCap`, and
the mobile bar hides while the section is on screen (`inUb` in `chrome()`).
**No real thicknesses are shown – TODO: Armin bestätigen** before adding any figures.


## Bewertungen (reviews) – `#bewertungen`, `js/reviews.js`, `css/reviews.css`, `api/`

Above the FAQ. Two sources, merged in one swipeable rail:
- **Google** – `api/google-reviews.js` (Vercel function) calls Places API (New): rating, count and up to
  5 reviews (Google's limit). Needs env var **`GOOGLE_PLACES_API_KEY`** (owner sets it in Vercel – never
  put keys in code/chat); optional **`GOOGLE_PLACE_ID`** (otherwise found by text search "AREA Galabau
  Ravensburg"). CDN-cached 1 h. Google's rules: author name/link on each review + link to Google Maps
  (`.rv-attr`). Without the key the section still works, just without Google reviews/score.
- **Website reviews** – `api/reviews.js`: POST saves to the private **Vercel Blob** store
  `area-galabau-reviews` (`reviews/pending/<id>.json`), GET returns `reviews/approved/`. Spam traps:
  hidden `website` field, < 4 s → rejected. No IP/e-mail stored. Token: `BLOB_READ_WRITE_TOKEN`
  (added automatically when the store was connected). Supabase wasn't used: the owner's free plan
  already has 2 projects (StockPilot).
- **Approval** – `/admin.html` (noindex, not linked) + `api/admin.js`: approve / withdraw / delete /
  public reply. Password = env var **`ADMIN_KEY`** (owner sets it; endpoint is off without it).
- **"Auf Google teilen"** after submitting: copies the text and opens
  `https://search.google.com/local/writereview?placeid=…`. Google has no API to post reviews for
  customers – never try to "sync" website reviews to Google (against Google's policy).
- **§ 5b Abs. 3 UWG**: the "Hinweis zur Echtheit" under the rail must describe what Armin actually does
  (manual check against real jobs, no filtering of critical reviews). Keep it true; have it checked
  with the Impressum/Datenschutz. The Datenschutzerklärung must mention the review form + Google data.
- `package.json` only exists for `@vercel/blob` (functions). Still no build step.

## Adding a project photo

1. `python tools/sketch.py path/to/photo.jpg p11` (creates `img/p11.jpg` and `img/p11-s.jpg`),
   then `python tools/webp.py p11` (creates the three .webp files the site loads).
2. In `index.html` add the size printed by the script to `SIZE`, and add an entry to `PROJ`:
   `{t:'Titel des Projekts',c:'pflaster',img:'p11'}` – categories are the keys of `CATS`
   (`terrasse`, `pflaster`, `garten`, `zaun`, `erde`).
3. Project titles describe only what is visible in the photo – don't invent locations or claims.

Hero photo: `python tools/sketch.py photo.jpg hero 2200`, `tools/depth.py`, `tools/lines.py`, `tools/film.py`, `tools/webp.py hero`.
Depth tool needs torch → Python 3.12 venv in `tools/.venv` (setup at the top of `tools/depth.py`).
New before/after pair: `python tools/align_before_after.py before.jpg after.jpg`, then `python tools/webp.py ba`.

## Security headers (`vercel.json`)

CSP allows only the site itself (`'unsafe-inline'` is needed for the inline scripts/styles). Anything new
from another domain (maps, analytics, video, a form service) must be added to the CSP **and** the
Datenschutz, or it will silently be blocked. On preview links the Vercel toolbar is blocked by the CSP – harmless.
Cache: img/fonts 7 days (+ stale-while-revalidate), css/js 1 hour. File names aren't hashed, so after
replacing a photo, give it a new name if visitors must see it immediately.

## Privacy / legal (DSGVO)

The Datenschutzerklärung promises: no cookies, no tracking, no requests to Google or other third parties
when a page loads. Keep it true:
- Google review authors are shown with **initials, not profile photos** (photos would load from Google).
- Adding analytics, maps, YouTube etc. → update datenschutz.html first.
- Link previews + LocalBusiness JSON-LD are in `<head>` of index.html with the absolute URL
  `https://area-galabau-website.vercel.app` – replace it when the custom domain is live, and add the
  full address. No review stars in the JSON-LD (Google doesn't allow self-serving review markup).
- impressum.html / datenschutz.html are `noindex` until the yellow gaps are filled. Have them checked
  (lawyer or a generator such as e-recht24 / IT-Recht Kanzlei) before go-live.

## Still to do

- **Impressum / Datenschutz**: pages exist; fill the yellow gaps (address, Rechtsform, USt-IdNr., Kammer/Meister) and remove `noindex`.
- Confirm the Carrd-sourced facts listed above.
- Cross-section: Armin to confirm the layer descriptions (and real thicknesses, if they should be shown).
- When the owner has a custom domain: add it in Vercel and replace `https://area-galabau-website.vercel.app` in index.html (canonical, OG, JSON-LD), robots.txt and sitemap.xml.
- Optional: connect the form to a form service if the owner wants inquiries without mailto/WhatsApp.
- Button text (`#4f5057` on green, 4.27:1) is slightly under WCAG AA for small text – owner was told; darker text is an option if he wants it.
