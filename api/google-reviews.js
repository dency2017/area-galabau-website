// GET /api/google-reviews
// Rating, review count and up to 5 reviews for AREA Galabau from Google's Places API (New).
//
// Vercel environment variables (set them in the Vercel dashboard, never in code):
//   GOOGLE_PLACES_API_KEY  required – a Google Cloud API key with "Places API (New)" enabled
//   GOOGLE_PLACE_ID        optional – overrides PLACE_ID below (e.g. if the Google listing ever changes)
//
// Google's rules: show the author's name (and link) with each review and a link to the place on
// Google Maps. Responses are cached on Vercel's CDN for 1 hour.

const QUERY = 'AREA Galabau Ravensburg';
// Google listing "AREA GaLaBau" (verified 2026-11-22). Looked up by name only if this is ever emptied.
const PLACE_ID = 'ChIJ_1NOuIyvm0cRctCeBCgjYkU';
const FIELDS = 'id,displayName,rating,userRatingCount,googleMapsUri,reviews';

function json(body, status = 200, cache = 'public, s-maxage=3600, stale-while-revalidate=86400') {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache },
  });
}

async function findPlaceId(key) {
  const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress',
    },
    body: JSON.stringify({ textQuery: QUERY, languageCode: 'de', regionCode: 'DE' }),
  });
  if (!r.ok) throw new Error(`searchText ${r.status}`);
  const d = await r.json();
  return d.places?.[0]?.id || null;
}

export async function GET() {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return json({ configured: false }, 200, 'public, s-maxage=300');
  try {
    const placeId = process.env.GOOGLE_PLACE_ID || PLACE_ID || (await findPlaceId(key));
    if (!placeId) return json({ configured: true, found: false }, 200, 'public, s-maxage=300');

    const r = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=de`, {
      headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': FIELDS },
    });
    if (!r.ok) throw new Error(`details ${r.status}`);
    const p = await r.json();

    return json({
      configured: true,
      found: true,
      placeId: p.id,
      name: p.displayName?.text || '',
      rating: p.rating ?? null,
      count: p.userRatingCount ?? 0,
      mapsUri: p.googleMapsUri || '',
      writeUri: `https://search.google.com/local/writereview?placeid=${encodeURIComponent(p.id)}`,
      reviews: (p.reviews || []).map((v) => ({
        author: v.authorAttribution?.displayName || 'Google-Nutzer',
        authorUri: v.authorAttribution?.uri || '',
        photo: v.authorAttribution?.photoUri || '',
        rating: v.rating ?? null,
        text: v.text?.text || v.originalText?.text || '',
        when: v.relativePublishTimeDescription || '',
        time: v.publishTime || '',
        uri: v.googleMapsUri || '',
      })),
    });
  } catch (e) {
    console.error('google-reviews', e.message);
    return json({ configured: true, error: true }, 502, 'public, s-maxage=60');
  }
}
