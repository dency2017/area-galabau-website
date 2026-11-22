/* Bewertungen: Google reviews (api/google-reviews.js) + reviews written on this site (api/reviews.js).
   Website reviews only appear after Armin approves them on /admin.html.
   After submitting, the visitor can share the same text on Google with one tap: the text is copied
   to the clipboard and Google's own "write a review" page opens (Google has no way for a website to
   post a review for someone – the customer posts it in their own Google account). */
(() => {
  const root = document.getElementById('bewertungen');
  if (!root) return;
  const FALLBACK_GOOGLE = 'https://www.google.com/maps/search/AREA+Galabau+Ravensburg';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const stars = (n) => `<span class="rv-stars" aria-label="${n} von 5 Sternen">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= Math.round(n) ? 'on' : ''}">★</i>`).join('')}</span>`;
  const fmtDate = (iso) => { try { return new Date(iso).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }); } catch { return ''; } };
  let google = { configured: false }, writeUri = FALLBACK_GOOGLE;

  root.innerHTML = `
    <div class="rv-head">
      <div class="rv-score" id="rvScore" hidden></div>
      <div class="rv-meta"><span class="rv-stars" hidden></span><p id="rvSummary"><b>Bewertungen unserer Kundinnen und Kunden.</b><br>Auf Google und direkt hier auf der Website.</p></div>
      <div class="rv-actions">
        <button class="btn" type="button" id="rvOpen">Bewertung schreiben <span class="arr">→</span></button>
        <a class="btn ghost" id="rvGoogle" href="${FALLBACK_GOOGLE}" target="_blank" rel="noopener">Auf Google bewerten ↗</a>
      </div>
    </div>

    <form class="rv-form" id="rvForm" novalidate>
      <div class="rv-step">
        <h3>Wie zufrieden waren Sie?</h3>
        <p>Ihre Bewertung erscheint nach kurzer Prüfung auf dieser Website.</p>
        <div class="rv-rate" role="radiogroup" aria-label="Sterne">
          ${[1, 2, 3, 4, 5].map((i) => `<button type="button" role="radio" aria-checked="false" aria-label="${i} Stern${i > 1 ? 'e' : ''}" data-v="${i}">★</button>`).join('')}
        </div>
        <div class="rv-grid">
          <div><label class="fl" for="rvName">Name</label><input class="inp" id="rvName" maxlength="60" autocomplete="name" placeholder="z. B. Maria K."></div>
          <div><label class="fl" for="rvPlace">Ort (optional)</label><input class="inp" id="rvPlace" maxlength="60" placeholder="z. B. Weingarten"></div>
          <div><label class="fl" for="rvProject">Projekt (optional)</label>
            <select class="inp" id="rvProject"><option value="">–</option><option>Terrasse</option><option>Pflaster &amp; Wege</option><option>Garten &amp; Rasen</option><option>Zaun</option><option>Erdarbeiten</option><option>Sonstiges</option></select></div>
        </div>
        <label class="fl" for="rvText">Ihre Bewertung</label>
        <textarea class="inp" id="rvText" maxlength="1500" placeholder="Wie lief die Zusammenarbeit? Was hat Ihnen gefallen?"></textarea>
        <div class="rv-hp" aria-hidden="true"><label>Website <input id="rvWebsite" tabindex="-1" autocomplete="off"></label></div>
        <label class="rv-consent"><input type="checkbox" id="rvConsent"><span>Ich bin einverstanden, dass meine Bewertung mit dem angegebenen Namen (und Ort) auf dieser Website veröffentlicht wird. Ich kann sie jederzeit per E-Mail an area.galabau@gmail.com löschen lassen.</span></label>
        <div class="rv-msg" id="rvMsg" role="alert"></div>
        <div class="rv-row">
          <button class="btn" type="submit" id="rvSend">Bewertung senden <span class="arr">→</span></button>
          <button class="back" type="button" id="rvCancel">Abbrechen</button>
        </div>
      </div>
      <div class="rv-done" id="rvDone">
        <div class="big"><svg width="24" height="24" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#4f5057" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
        <h3>Vielen Dank für Ihre Bewertung!</h3>
        <p>Wir veröffentlichen sie nach kurzer Prüfung hier auf der Website.</p>
        <p style="margin-top:14px;color:var(--ink)"><b style="font-weight:500">Möchten Sie sie auch auf Google teilen?</b> Ihr Text wird kopiert – auf Google einfach einfügen und senden. Das hilft uns sehr.</p>
        <div class="rv-row"><button class="btn" type="button" id="rvShare">Auf Google teilen ↗</button><span class="rv-msg" id="rvShareMsg"></span></div>
      </div>
    </form>

    <div class="rv-rail" id="rvRail" aria-label="Bewertungen – zum Blättern wischen"><p class="rv-empty">Bewertungen werden geladen …</p></div>
    <p class="rv-attr" id="rvAttr"></p>
    <p class="rv-note"><b>Hinweis zur Echtheit:</b> Google-Bewertungen werden unverändert direkt von Google geladen; wir haben keinen Einfluss darauf, wer sie schreibt. Bewertungen, die über diese Website abgegeben werden, prüfen wir vor der Veröffentlichung von Hand darauf, ob sie zu einem Auftrag von uns passen. Wir sortieren keine Bewertungen nur deshalb aus, weil sie kritisch sind.</p>`;

  const $ = (s) => root.querySelector(s);
  const form = $('#rvForm'), msg = $('#rvMsg');
  let rating = 0, openedAt = 0;

  /* ---------- list ---------- */
  function card(r) {
    const initial = esc((r.author || r.name || '?').trim().charAt(0).toUpperCase());
    const av = r.photo ? `<img src="${esc(r.photo)}" alt="" referrerpolicy="no-referrer" loading="lazy">` : initial;
    const who = r.source === 'google'
      ? (r.authorUri ? `<a href="${esc(r.authorUri)}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit">${esc(r.author)}</a>` : esc(r.author))
      : esc(r.name) + (r.place ? `<small style="font-weight:400"> · ${esc(r.place)}</small>` : '');
    const sub = r.source === 'google' ? esc(r.when) : [esc(r.project), fmtDate(r.createdAt)].filter(Boolean).join(' · ');
    const src = r.source === 'google'
      ? `<a class="rv-src" href="${esc(r.uri || google.mapsUri || FALLBACK_GOOGLE)}" target="_blank" rel="noopener">Google</a>`
      : `<span class="rv-src site">Website</span>`;
    return `<article class="rv-card">
      <div class="rv-top"><div class="rv-av">${av}</div><div class="rv-who"><b>${who}</b><small>${sub}</small></div>${src}</div>
      ${r.rating ? stars(r.rating) : ''}
      ${r.text ? `<p class="rv-text">${esc(r.text)}</p><button class="rv-more" type="button" hidden>Mehr lesen</button>` : ''}
      ${r.reply ? `<div class="rv-reply"><b>Antwort von AREA Galabau</b>${esc(r.reply)}</div>` : ''}
    </article>`;
  }

  function render(list) {
    const rail = $('#rvRail');
    rail.innerHTML = list.length ? list.map(card).join('') : '<p class="rv-empty">Noch keine Bewertungen hier – schreiben Sie die erste!</p>';
    rail.querySelectorAll('.rv-card').forEach((c) => {
      const t = c.querySelector('.rv-text'), b = c.querySelector('.rv-more');
      if (t && b && t.scrollHeight > t.clientHeight + 4) { b.hidden = false; b.onclick = () => { c.classList.toggle('open'); b.textContent = c.classList.contains('open') ? 'Weniger' : 'Mehr lesen'; }; }
    });
  }

  async function load() {
    const [g, s] = await Promise.all([
      fetch('/api/google-reviews').then((r) => r.json()).catch(() => ({})),
      fetch('/api/reviews').then((r) => r.json()).catch(() => ({ reviews: [] })),
    ]);
    google = g || {};
    const site = (s.reviews || []).map((r) => ({ ...r, source: 'site' }));
    const gl = (google.reviews || []).map((r) => ({ ...r, source: 'google' }));
    if (google.writeUri) { writeUri = google.writeUri; $('#rvGoogle').href = writeUri; }
    if (google.rating) {
      $('#rvScore').textContent = google.rating.toFixed(1).replace('.', ','); $('#rvScore').hidden = false;
      $('#rvSummary').innerHTML = `<b>${esc(google.rating.toFixed(1).replace('.', ','))} von 5 aus ${google.count} Google-Bewertungen.</b><br>Dazu Bewertungen, die direkt hier abgegeben wurden.`;
      root.querySelector('.rv-meta .rv-stars').outerHTML = stars(google.rating);
      $('#rvAttr').innerHTML = gl.length ? `Google-Bewertungen: Daten von Google Maps · <a href="${esc(google.mapsUri)}" target="_blank" rel="noopener" style="color:inherit">alle Bewertungen auf Google Maps ansehen</a>` : '';
    }
    // newest website reviews first, Google's (most relevant) after
    render([...site, ...gl]);
  }

  /* ---------- form ---------- */
  const rateBtns = [...root.querySelectorAll('.rv-rate button')];
  const paint = (n) => rateBtns.forEach((b, i) => { b.classList.toggle('on', i < n); b.setAttribute('aria-checked', String(i + 1 === rating)); });
  rateBtns.forEach((b) => {
    b.addEventListener('click', () => { rating = +b.dataset.v; paint(rating); });
    b.addEventListener('mouseenter', () => paint(+b.dataset.v));
    b.addEventListener('mouseleave', () => paint(rating));
  });
  $('#rvOpen').addEventListener('click', () => {
    form.classList.add('show'); openedAt = performance.now();
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => rateBtns[4].focus({ preventScroll: true }), 500);
  });
  $('#rvCancel').addEventListener('click', () => form.classList.remove('show'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.className = 'rv-msg';
    const body = {
      rating, name: $('#rvName').value.trim(), place: $('#rvPlace').value.trim(), project: $('#rvProject').value,
      text: $('#rvText').value.trim(), consent: $('#rvConsent').checked, website: $('#rvWebsite').value,
      openedMs: Math.round(performance.now() - openedAt),
    };
    const err = !rating ? 'Bitte wählen Sie 1 bis 5 Sterne.' : body.name.length < 2 ? 'Bitte geben Sie Ihren Namen an.'
      : body.text.length < 10 ? 'Bitte schreiben Sie ein paar Worte (mindestens 10 Zeichen).' : !body.consent ? 'Bitte stimmen Sie der Veröffentlichung zu.' : '';
    if (err) { msg.textContent = err; msg.classList.add('err'); return; }
    const btn = $('#rvSend'); btn.disabled = true; btn.style.opacity = .6;
    try {
      const r = await fetch('/api/reviews', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) throw new Error(d.error || r.status);
      form.querySelector('.rv-step').style.display = 'none';
      $('#rvDone').classList.add('show');
      form.dataset.text = `${'★'.repeat(rating)} ${body.text}`.trim();
      form.dataset.plain = body.text;
    } catch (x) {
      msg.textContent = 'Das hat leider nicht geklappt. Bitte versuchen Sie es später erneut oder schreiben Sie uns an area.galabau@gmail.com.';
      msg.classList.add('err');
    } finally { btn.disabled = false; btn.style.opacity = ''; }
  });

  $('#rvShare').addEventListener('click', async () => {
    const out = $('#rvShareMsg');
    // start the copy and open Google in the same tap (phones block pop-ups opened after a delay)
    const copy = navigator.clipboard?.writeText(form.dataset.plain || '');
    window.open(writeUri, '_blank', 'noopener');
    try { await copy; out.textContent = 'Text kopiert – auf Google einfügen und senden.'; }
    catch { out.textContent = 'Bitte Ihren Text auf Google kurz erneut eingeben.'; }
  });

  // load when the section comes near (saves the API calls for visitors who never scroll that far)
  new IntersectionObserver((en, ob) => { if (en[0].isIntersecting) { ob.disconnect(); load(); } }, { rootMargin: '600px 0px' }).observe(root);
})();
