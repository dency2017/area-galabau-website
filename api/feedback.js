// /api/feedback – answers from the owner's review link (index.html?pruefen, js/review.js).
//   POST { items, questions, by } → saved as feedback/<id>.json in the private Blob store
// Read them on /admin.html (api/admin.js lists them). Nothing here is shown on the website.

import { put } from '@vercel/blob';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const clean = (s, max) => String(s ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ').trim().slice(0, max);

export async function POST(request) {
  const raw = await request.text();
  if (raw.length > 60000) return json({ ok: false, error: 'too_big' }, 413);
  let d;
  try { d = JSON.parse(raw); } catch { return json({ ok: false, error: 'bad_json' }, 400); }
  if (d.website) return json({ ok: true }); // honeypot

  const items = {};
  for (const [k, v] of Object.entries(d.items || {}).slice(0, 40)) {
    if (!/^[a-z0-9-]{1,30}$/.test(k) || typeof v !== 'object' || !v) continue;
    items[k] = {
      title: clean(v.title, 120),
      choice: clean(v.choice, 120),
      note: clean(v.note, 1500),
      texts: (Array.isArray(v.texts) ? v.texts : []).slice(0, 12).map((t) => clean(t, 2000)),
    };
  }
  const questions = {};
  for (const [k, v] of Object.entries(d.questions || {}).slice(0, 30)) {
    if (/^[a-z0-9-]{1,30}$/.test(k)) questions[k] = { label: clean(v?.label, 160), value: clean(v?.value, 1500) };
  }
  if (!Object.keys(items).length && !Object.keys(questions).length) return json({ ok: false, error: 'empty' }, 400);

  const fb = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    by: clean(d.by, 60),
    items,
    questions,
    createdAt: new Date().toISOString(),
  };
  try {
    await put(`feedback/${fb.id}.json`, JSON.stringify(fb), {
      access: 'private', contentType: 'application/json', addRandomSuffix: false,
    });
  } catch (e) {
    console.error('feedback POST', e.message);
    return json({ ok: false, error: 'storage' }, 500);
  }
  return json({ ok: true, id: fb.id });
}
