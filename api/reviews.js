// /api/reviews – reviews written on the website itself.
//   GET   → published (approved) reviews
//   POST  → a visitor submits a review; it is saved as "pending" and only shown after approval
//           on /admin.html (see api/admin.js)
//
// Storage: private Vercel Blob store "area-galabau-reviews" (token in BLOB_READ_WRITE_TOKEN,
// added automatically when the store was connected to the project).
//   reviews/pending/<id>.json   waiting for approval
//   reviews/approved/<id>.json  shown on the site
// No IP addresses or e-mail addresses are stored.

import { put } from '@vercel/blob';
import { readAll } from './_blob.js';

const json = (body, status = 200, cache = 'no-store') =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache },
  });

const PROJECTS = ['Terrasse', 'Pflaster & Wege', 'Garten & Rasen', 'Zaun', 'Erdarbeiten', 'Sonstiges'];
const clean = (s, max) => String(s ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

export async function GET() {
  try {
    const items = await readAll('reviews/approved/');
    return json(
      { reviews: items.map(({ id, name, place, project, rating, text, createdAt, reply }) => ({ id, name, place, project, rating, text, createdAt, reply })) },
      200,
      'public, s-maxage=60, stale-while-revalidate=600',
    );
  } catch (e) {
    console.error('reviews GET', e.message);
    return json({ reviews: [], error: true }, 200, 'public, s-maxage=30');
  }
}

export async function POST(request) {
  let d;
  try { d = await request.json(); } catch { return json({ ok: false, error: 'bad_json' }, 400); }

  // spam traps: hidden field must stay empty, and nobody writes a review in under 4 seconds
  if (d.website) return json({ ok: true });            // pretend success for bots
  if (typeof d.openedMs === 'number' && d.openedMs < 4000) return json({ ok: false, error: 'too_fast' }, 400);

  const rating = Number(d.rating);
  const review = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: clean(d.name, 60),
    place: clean(d.place, 60),
    project: PROJECTS.includes(d.project) ? d.project : '',
    rating,
    text: clean(d.text, 1500),
    consent: d.consent === true,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return json({ ok: false, error: 'rating' }, 400);
  if (review.name.length < 2) return json({ ok: false, error: 'name' }, 400);
  if (review.text.length < 10) return json({ ok: false, error: 'text' }, 400);
  if (!review.consent) return json({ ok: false, error: 'consent' }, 400);

  try {
    await put(`reviews/pending/${review.id}.json`, JSON.stringify(review), {
      access: 'private',
      contentType: 'application/json',
      addRandomSuffix: false,
    });
    return json({ ok: true });
  } catch (e) {
    console.error('reviews POST', e.message);
    return json({ ok: false, error: 'storage' }, 500);
  }
}
