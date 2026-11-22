// Shared helper for api/reviews.js and api/admin.js (files starting with _ are not routes).
import { list, get } from '@vercel/blob';

export async function readAll(prefix) {
  const out = [];
  let cursor;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    for (const b of page.blobs) {
      const f = await get(b.pathname, { access: 'private' });
      if (f?.statusCode === 200) {
        try { out.push(JSON.parse(await new Response(f.stream).text())); } catch {}
      }
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}
