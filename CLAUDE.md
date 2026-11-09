# AREA Galabau – website

One-page website for **AREA Galabau** (Garten- & Landschaftsbau, Ravensburg / Bodensee), owner **Armin Besirevic**.
Replaces the old Carrd page https://galabau.carrd.co (use it as the content reference).

- **Live hosting:** Vercel, auto-deploys from `main` of `dency2017/area-galabau-website`. Plain static site – no build step, Framework Preset "Other".
- **Language of the site:** German. Talk to the owner in English unless he writes otherwise.
- **Before pushing:** test at phone size (390×844) *and* desktop (1440×900). The owner prioritises mobile.

## Files

```
index.html               the whole site: HTML + CSS + JS in one file, no dependencies except Google Fonts
favicon.svg              the "A" square from the logo (white on #4f5057)
apple-touch-icon.png     same, 180px
img/<name>.jpg           real photos
img/<name>-s.jpg         pencil-sketch twin of each photo (made with tools/sketch.py)
img/ba-before.jpg        before/after slider pair, aligned with tools/align_before_after.py
img/ba-after.jpg
tools/                   Python helpers (not used by the site at runtime)
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

## Adding a project photo

1. `python tools/sketch.py path/to/photo.jpg p11` (creates `img/p11.jpg` and `img/p11-s.jpg`).
2. In `index.html` add the size printed by the script to `SIZE`, and add an entry to `PROJ`:
   `{t:'Titel des Projekts',c:'pflaster',img:'p11'}` – categories are the keys of `CATS`
   (`terrasse`, `pflaster`, `garten`, `zaun`, `erde`).
3. Project titles describe only what is visible in the photo – don't invent locations or claims.

Hero photo: `python tools/sketch.py photo.jpg hero 2200`.
New before/after pair: `python tools/align_before_after.py before.jpg after.jpg`.

## Still to do

- **Impressum** and **Datenschutzerklärung** pages (legally required in Germany) – footer links are placeholders.
  Need full address, and any tax/trade registration details from the owner.
- Confirm the Carrd-sourced facts listed above.
- When the owner has a custom domain: add it in Vercel, and add canonical URL + Open Graph tags (og:image = hero photo).
- Optional: connect the form to a form service if the owner wants inquiries without mailto/WhatsApp.
- Button text (`#4f5057` on green, 4.27:1) is slightly under WCAG AA for small text – owner was told; darker text is an option if he wants it.
