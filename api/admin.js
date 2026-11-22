// /api/admin – used by /admin.html to approve or remove website reviews.
// Protected by the ADMIN_KEY environment variable (set it yourself in Vercel → Settings →
// Environment Variables; pick a long password). Without ADMIN_KEY this endpoint is disabled.
//
//   GET  (header x-admin-key)                       → { pending: [...], approved: [...] }
//   POST (header x-admin-key) { action, id, reply? } → action = approve | reject | unpublish | reply

import { put, list, del } from '@vercel/blob';
import { timingSafeEqual } from 'node:crypto';
import { readAll } from './_blob.js';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

function authorised(request) {
  const want = process.env.ADMIN_KEY || '';
  const got = request.headers.get('x-admin-key') || '';
  if (want.length < 8) return false;
  const a = Buffer.from(want), b = Buffer.from(got);
  return a.length === b.length && timingSafeEqual(a, b);
}

const safeId = (id) => /^[a-z0-9-]{6,40}$/.test(String(id)) ? String(id) : null;

async function find(prefix, id) {
  const page = await list({ prefix: `${prefix}${id}.json`, limit: 1 });
  return page.blobs[0] || null;
}

export async function GET(request) {
  if (!process.env.ADMIN_KEY) return json({ error: 'not_configured' }, 503);
  if (!authorised(request)) return json({ error: 'unauthorised' }, 401);
  const [pending, approved] = await Promise.all([readAll('reviews/pending/'), readAll('reviews/approved/')]);
  return json({ pending, approved });
}

export async function POST(request) {
  if (!process.env.ADMIN_KEY) return json({ error: 'not_configured' }, 503);
  if (!authorised(request)) return json({ error: 'unauthorised' }, 401);
  let d;
  try { d = await request.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const id = safeId(d.id);
  if (!id) return json({ error: 'bad_id' }, 400);

  const all = [...(await readAll('reviews/pending/')), ...(await readAll('reviews/approved/'))];
  const r = all.find((x) => x.id === id);
  if (!r) return json({ error: 'not_found' }, 404);
  const pendingBlob = await find('reviews/pending/', id);
  const approvedBlob = await find('reviews/approved/', id);
  const save = (prefix, obj) =>
    put(`${prefix}${id}.json`, JSON.stringify(obj), { access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true });

  if (d.action === 'approve') {
    await save('reviews/approved/', { ...r, status: 'approved', approvedAt: new Date().toISOString() });
    if (pendingBlob) await del(pendingBlob.url);
  } else if (d.action === 'unpublish') {
    await save('reviews/pending/', { ...r, status: 'pending' });
    if (approvedBlob) await del(approvedBlob.url);
  } else if (d.action === 'reject') {
    if (pendingBlob) await del(pendingBlob.url);
    if (approvedBlob) await del(approvedBlob.url);
  } else if (d.action === 'reply') {
    const reply = String(d.reply ?? '').trim().slice(0, 1000);
    const prefix = approvedBlob ? 'reviews/approved/' : 'reviews/pending/';
    await save(prefix, { ...r, reply });
  } else {
    return json({ error: 'bad_action' }, 400);
  }
  return json({ ok: true });
}
