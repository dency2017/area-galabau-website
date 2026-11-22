/* Review mode for the owner: index.html?pruefen
   Texts that need Armin's OK are highlighted in yellow. Tapping one opens a panel: keep it, pick the
   safe wording or a draft (the page changes at once), or rewrite it in the panel (live preview).
   Plus a list of open questions (Impressum etc.). "Antworten senden" stores everything via
   /api/feedback; it shows up on /admin.html. Answers are also kept on this device (localStorage).
   Nothing here runs for normal visitors – index.html only loads this file when ?pruefen is in the URL.
   To change what is asked: edit ITEMS / QUESTIONS below. Spot = [css selector, exact text on the page]. */
(() => {
  const LEAD = 'Seit 2012 gestalten wir Außenanlagen in Oberschwaben und am Bodensee – schön, architektonisch stimmig und gebaut, um Jahrzehnte zu halten. Ein Team, das die Präzision eines Ingenieurbüros mit der Geduld von Gartenkünstlern verbindet.';
  const TEAM = 'Ausführung durch unser eigenes Team, sauber und termingerecht.';
  const ITEMS = [
    { id: 'ueber', title: 'Über-uns-Text', q: 'Welcher Text passt zu dir? Wörter in [Klammern] bitte prüfen – oder schreib ihn selbst um.',
      spots: [['#ueber .lead', LEAD]],
      choices: [
        { label: 'Aktueller Text', t: [null] },
        { label: 'Entwurf A – persönlich (empfohlen)', t: ['Ich bin Armin Besirevic, Inhaber von AREA Galabau in Ravensburg. [Seit 2012] baue ich [mit meinem Team] Terrassen, Höfe, Wege und Gärten in Oberschwaben und am Bodensee. Ihr Ansprechpartner bin ich selbst – von der ersten Besichtigung bis zur Abnahme. Wir arbeiten sauber, halten Termine ein und bauen den Unterbau so, dass die Fläche auch nach vielen Wintern noch eben ist.'] },
        { label: 'Entwurf B – kurz, als Firma', t: ['AREA Galabau ist ein Garten- und Landschaftsbaubetrieb aus Ravensburg. Wir pflastern Höfe und Wege, bauen Terrassen, Zäune und Stufen und legen Rasen an – in Oberschwaben und am Bodensee. Inhaber Armin Besirevic ist bei jedem Projekt selbst vor Ort. Wir besprechen alles vorher genau und halten, was wir zusagen.'] },
      ] },
    { id: 'meister', title: '„Meisterbetrieb seit 2012“', q: 'Hast du einen Meisterbrief – und gibt es den Betrieb seit 2012? „Meister“ darf nur dastehen, wenn es stimmt.',
      spots: [['.meta-strip', 'Meisterbetrieb seit 2012'], ['.step p', 'Ausführung durch unseren Meisterbetrieb, sauber und termingerecht.'], ['.stat b', '2012'], ['.stat span', 'Meisterbetrieb seit']],
      choices: [
        { label: 'Stimmt beides', t: [null, null, null, null] },
        { label: 'Kein Meisterbrief, aber seit 2012', t: ['Fachbetrieb seit 2012', TEAM, null, 'Fachbetrieb seit'] },
        { label: 'Beides nicht sicher', t: ['Fachbetrieb aus Ravensburg', TEAM, '10+', 'Jahre Erfahrung'] },
      ] },
    { id: 'festpreis', title: '„Festpreis-Garantie“', q: 'Gilt dein Angebotspreis immer fest, ohne Nachträge? Eine „Garantie“ ist ein Versprechen, auf das sich Kunden berufen können.',
      spots: [['#leistungen .lead', 'mit Festpreis-Garantie.'], ['.checks li', 'Festpreis-Garantie – keine versteckten Kosten'], ['.step h3', 'Festpreis-Angebot'],
        ['.step p', 'Ein verbindliches Angebot – der Preis, den wir nennen, ist der Preis, den Sie zahlen.'], ['#faq summary', 'Was bedeutet die Festpreis-Garantie?'],
        ['#faq .ans', 'Nach der Besichtigung erhalten Sie ein verbindliches Angebot. Der vereinbarte Preis gilt – ohne nachträgliche Aufschläge.']],
      choices: [
        { label: 'Stimmt so', t: [null, null, null, null, null, null] },
        { label: 'Sichere Formulierung', t: ['mit verbindlichem Angebot.', 'Verbindliches, schriftliches Angebot', 'Angebot', 'Nach der Besichtigung erhalten Sie ein verbindliches, schriftliches Angebot.', 'Wie läuft das Angebot ab?', 'Nach der Besichtigung erhalten Sie ein schriftliches Angebot mit allen Positionen. Änderungen besprechen wir vorher mit Ihnen.'] },
      ] },
    { id: 'antwort', title: '„Antwort innerhalb von 24 Stunden“', q: 'Schaffst du es wirklich, auf jede Anfrage innerhalb von 24 Stunden zu antworten?',
      spots: [['.step p', 'Kurz Ihr Vorhaben schildern – wir melden uns innerhalb von 24 Stunden.'], ['.checks li', 'Antwort innerhalb von 24 Stunden'], ['.stat b', '24 h'], ['.stat span', 'bis zur Rückmeldung'],
        ['#faq .ans', 'Auf jede Anfrage melden wir uns innerhalb von 24 Stunden – an Werktagen meist noch am selben Tag.'], ['#form p', 'Wir melden uns innerhalb von 24 Stunden.']],
      choices: [
        { label: 'Stimmt so', t: [null, null, null, null, null, null] },
        { label: 'Sichere Formulierung', t: ['Kurz Ihr Vorhaben schildern – wir melden uns schnell zurück.', 'Schnelle Rückmeldung', '1–2', 'Werktage bis zur Rückmeldung', 'Auf jede Anfrage melden wir uns in der Regel innerhalb von 1–2 Werktagen.', 'Wir melden uns so schnell wie möglich.'] },
      ] },
    { id: 'projekte', title: '„300+ Projekte“', q: 'Stimmt die Zahl? Wenn du die echte (abgerundete) Zahl kennst: „Selbst ändern“.',
      spots: [['.meta-strip', '300+ Projekte'], ['.stat b', '300+'], ['.stat span', 'abgeschlossene Projekte']],
      choices: [
        { label: 'Stimmt so', t: [null, null, null] },
        { label: 'Zahl weglassen', t: ['Ravensburg & Bodensee', 'Region', 'Ravensburg & Bodensee'] },
      ] },
    { id: 'kostenlos', title: '„Kostenlose Besichtigung“', q: 'Ist die Besichtigung vor Ort immer kostenlos?',
      spots: [['a.btn', 'Kostenlose Besichtigung'], ['.checks li', 'Kostenlose Besichtigung vor Ort'], ['.step p', 'Kostenlos und unverbindlich. '],
        ['#faq summary', 'Kostet die Besichtigung etwas?'], ['#faq .ans', 'Nein. Die Besichtigung vor Ort ist kostenlos und unverbindlich. ']],
      choices: [
        { label: 'Stimmt so', t: [null, null, null, null, null] },
        { label: 'Sichere Formulierung', t: ['Besichtigung anfragen', 'Besichtigung vor Ort', '', 'Wie läuft die Besichtigung ab?', ''] },
      ] },
    { id: 'schichten', title: 'Schichten „Was unter dem Pflaster steckt“', q: 'Sind die fünf Beschreibungen fachlich richtig? Änderungen unter „Selbst ändern“. Schichtdicken (cm) bitte unten bei den Fragen.',
      spots: [
        ['#ubList span', 'Der gewachsene Boden wird ausgehoben, planiert und verdichtet – er trägt alles, was darauf folgt.'],
        ['#ubList span', 'Verdichteter Schotter verteilt die Last und leitet Wasser ab, damit Frost die Fläche nicht anhebt.'],
        ['#ubList span', 'Ein ebenes Bett aus Splitt, in das die Steine gesetzt werden – es gleicht kleine Höhenunterschiede aus.'],
        ['#ubList span', 'Die Steine werden im Verband und mit leichtem Gefälle verlegt, damit Regenwasser abläuft.'],
        ['#ubList span', 'Die Fugen werden verfüllt und die Fläche abgerüttelt – so verkeilen sich die Steine und nichts wackelt.']],
      choices: [{ label: 'Stimmt so', t: [null, null, null, null, null] }] },
    { id: 'echtheit', title: 'Hinweis zur Echtheit (Bewertungen)', q: 'Machst du das wirklich so? Der Hinweis ist gesetzlich vorgeschrieben (§ 5b UWG) und muss stimmen.',
      spots: [['.rv-note', 'Google-Bewertungen werden unverändert direkt von Google geladen; wir haben keinen Einfluss darauf, wer sie schreibt. Bewertungen, die über diese Website abgegeben werden, prüfen wir vor der Veröffentlichung von Hand darauf, ob sie zu einem Auftrag von uns passen. Wir sortieren keine Bewertungen nur deshalb aus, weil sie kritisch sind.']],
      choices: [{ label: 'Stimmt so', t: [null] }] },
    { id: 'google', title: 'Text in der Google-Suche', q: 'Diesen Text zeigt Google unter dem Link zur Seite (auf der Seite selbst unsichtbar). Er enthält „Meisterbetrieb“ und „Festpreis-Garantie“.',
      meta: true,
      choices: [
        { label: 'Aktueller Text', t: [null] },
        { label: 'Sichere Formulierung', t: ['Garten- und Landschaftsbau aus Ravensburg: Pflaster, Terrassen, Zäune und Rollrasen für Ravensburg, Weingarten, Friedrichshafen und den Bodensee.'] },
      ] },
  ];
  const QUESTIONS = [
    ['name', 'Dein Name', 'Armin Besirevic'],
    ['adresse', 'Hausnummer und Postleitzahl (Königin-Katharina-Straße …, … Ravensburg) – fürs Impressum', ''],
    ['rechtsform', 'Rechtsform (z. B. Einzelunternehmen)', ''],
    ['ust', 'USt-IdNr. – oder „Kleinunternehmer“ / „keine“', ''],
    ['kammer', 'Handwerkskammer oder IHK? Mit Eintragungsnummer, falls vorhanden', ''],
    ['meisterbrief', 'Meisterbrief: in welchem Handwerk? (leer lassen, wenn keiner)', ''],
    ['zeiten', 'Öffnungszeiten – stimmen Mo–Fr 8–18, Sa 9–13? Sonst bitte richtig eintragen', ''],
    ['orte', 'In welchen Orten arbeitest du noch? (jede Ortschaft hilft bei Google)', ''],
    ['cm', 'Schichtdicken in cm (Schotter / Splitt / Pflaster), falls wir sie zeigen sollen', ''],
    ['foto', 'Hast du ein Foto von dir, deinem Team oder Auto bei der Arbeit? (bitte per WhatsApp schicken)', ''],
    ['domain', 'Eigene Domain + E-Mail gewünscht? (z. B. area-galabau.de, info@area-galabau.de)', ''],
    ['sonst', 'Sonst noch etwas, das geändert werden soll?', ''],
  ];

  const KEY = 'areaReview1';
  let S = { items: {}, q: {}, intro: false, sent: null };
  try { S = { ...S, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- find the texts on the page and wrap them ---------- */
  function wrap(sel, text) {
    const out = [];
    document.querySelectorAll(sel).forEach((root) => {
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (w.nextNode()) nodes.push(w.currentNode);
      nodes.forEach((n) => {
        if (n.parentElement.closest('.rvx')) return;
        const i = n.nodeValue.indexOf(text);
        if (i < 0) return;
        const mid = n.splitText(i);
        mid.splitText(text.length);
        const sp = document.createElement('span');
        sp.className = 'rvx';
        mid.replaceWith(sp);
        sp.textContent = text;
        out.push(sp);
      });
    });
    return out;
  }
  const metaDesc = document.querySelector('meta[name="description"]');

  function init() {
    // counters would overwrite the edited figures – show final values only
    document.querySelectorAll('.stat b[data-count]').forEach((b) => b.removeAttribute('data-count'));
    ITEMS.forEach((it) => {
      it.orig = it.meta ? [metaDesc?.content || ''] : it.spots.map((s) => s[1]);
      it.els = it.meta ? [[]] : it.spots.map(([sel, text]) => wrap(sel, text));
      it.els.flat().forEach((el) => { el.dataset.item = it.id; });
      it.missing = !it.meta && it.els.every((a) => !a.length);
      if (it.missing) console.warn('[pruefen] Text nicht gefunden:', it.id);
    });
    css();
    ui();
    ITEMS.forEach(apply);
    mark();
    intro(); // every time the link is opened (returning visits get the short version)
  }

  /* ---------- state → page ---------- */
  function current(it) {
    const a = S.items[it.id];
    if (!a) return it.orig.slice();
    if (a.choice === 'edit') return it.orig.map((o, i) => a.texts?.[i] ?? o);
    const ch = it.choices[a.choice] || it.choices[0];
    return it.orig.map((o, i) => (ch.t[i] == null ? o : ch.t[i]));
  }
  function apply(it) {
    const t = current(it);
    if (it.meta) { if (metaDesc) metaDesc.content = t[0]; return; }
    it.els.forEach((els, i) => els.forEach((el) => { el.textContent = t[i]; el.classList.toggle('rvx-empty', !t[i]); }));
  }
  function mark() {
    ITEMS.forEach((it) => it.els.flat().forEach((el) => {
      el.classList.toggle('done', !!S.items[it.id]);
      el.classList.toggle('act', openId === it.id);
    }));
    const n = ITEMS.filter((it) => S.items[it.id]).length;
    $('#rvwCount').textContent = `${n} von ${ITEMS.length} geprüft`;
  }

  /* ---------- UI ---------- */
  let openId = null;
  const $ = (s) => document.querySelector(s);
  function css() {
    const st = document.createElement('style');
    st.textContent = `
.rvx{background:#fde9a8;box-shadow:0 0 0 3px #fde9a8;border-radius:3px;color:#1F211C!important;text-shadow:none!important;cursor:pointer;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.rvx.done{background:#dfeec0;box-shadow:0 0 0 3px #dfeec0}
.rvx.act{box-shadow:0 0 0 3px #fde9a8,0 0 0 5px #c79a1e}
.rvx.done.act{box-shadow:0 0 0 3px #dfeec0,0 0 0 5px #7d9a35}
.rvx-empty{display:inline-block;min-width:1.2em;min-height:1em}
.rvx-empty::after{content:"(gestrichen)";font-size:.75em;opacity:.6}
.mbar{display:none!important}
#rvw{position:fixed;z-index:200;right:16px;bottom:16px;width:min(420px,calc(100vw - 32px));max-height:min(78vh,760px);display:flex;flex-direction:column;background:#FAF8F3;color:#1F211C;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,.28),0 0 0 1px #D9D4C7;font:15px/1.45 "Inter Tight",system-ui,sans-serif;overflow:hidden}
#rvw.min{max-height:none}
#rvw.min .rvw-body{display:none}
.rvw-bar{display:flex;align-items:center;gap:10px;padding:12px 14px;background:#4f5057;color:#fff}
.rvw-bar b{font-weight:600;flex:1;font-size:14px}
.rvw-bar small{display:block;font-weight:400;opacity:.85}
.rvw-bar button{background:rgba(255,255,255,.14);color:#fff;border:0;border-radius:999px;padding:8px 12px;font:inherit;font-size:13px;cursor:pointer}
.rvw-body{overflow:auto;padding:14px 16px 18px;-webkit-overflow-scrolling:touch}
.rvw-body h3{font-weight:500;font-size:18px;letter-spacing:-.01em;margin:2px 0 6px}
.rvw-body h4{font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:#55584F;margin:18px 0 8px}
.rvw-body p.q{color:#55584F;margin-bottom:12px}
.rvw-it{display:flex;gap:10px;align-items:center;width:100%;text-align:left;background:#fff;border:0;border-radius:12px;padding:11px 12px;margin-bottom:6px;font:inherit;cursor:pointer;box-shadow:inset 0 0 0 1px #E4DFD3;color:inherit}
.rvw-it i{flex:none;width:20px;height:20px;border-radius:50%;background:#fde9a8;box-shadow:inset 0 0 0 1px #e2c766}
.rvw-it.done i{background:#a6ca4f;box-shadow:none}
.rvw-it.done i::after{content:"✓";display:block;text-align:center;font-style:normal;font-size:13px;line-height:20px;color:#45464c;font-weight:700}
.rvw-it span{flex:1}
.rvw-it em{font-style:normal;font-size:12.5px;color:#55584F}
.rvw-ch{display:flex;gap:10px;align-items:flex-start;background:#fff;border-radius:12px;padding:11px 12px;margin-bottom:6px;cursor:pointer;box-shadow:inset 0 0 0 1px #E4DFD3}
.rvw-ch input{margin-top:3px;accent-color:#7d9a35;width:18px;height:18px;flex:none}
.rvw-ch.on{box-shadow:inset 0 0 0 2px #a6ca4f}
.rvw-ch small{display:block;color:#55584F;font-size:13px;margin-top:2px}
.rvw-body textarea,.rvw-body input[type=text]{width:100%;font:inherit;border:0;border-radius:10px;padding:10px 12px;background:#fff;box-shadow:inset 0 0 0 1px #D9D4C7;margin:4px 0 10px;color:inherit}
.rvw-body textarea{min-height:76px;resize:vertical}
.rvw-body label.l{display:block;font-size:13.5px;color:#55584F;margin-top:6px}
.rvw-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.rvw-btn{border:0;border-radius:999px;padding:11px 16px;font:inherit;font-weight:600;cursor:pointer;background:#a6ca4f;color:#45464c}
.rvw-btn.g{background:#EDE9DF;color:#1F211C;font-weight:500}
.rvw-msg{font-size:14px;margin-top:10px;color:#55584F}
#rvwIntro{position:fixed;inset:0;z-index:210;background:rgba(31,33,28,.55);display:grid;place-items:center;padding:20px}
#rvwIntro>div{background:#FAF8F3;border-radius:22px;padding:24px;max-width:440px;font:16px/1.5 "Inter Tight",system-ui,sans-serif;color:#1F211C}
#rvwIntro h2{font-weight:300;font-size:30px;letter-spacing:-.03em;margin-bottom:10px}
#rvwIntro p{margin-bottom:10px}
#rvwIntro mark{background:#fde9a8;padding:0 4px;border-radius:3px}
#rvw.left{right:auto;left:16px}
@media (max-width:600px){#rvw.left{left:0}#rvw{right:0;left:0;bottom:0;width:100%;border-radius:18px 18px 0 0;max-height:62vh;padding-bottom:env(safe-area-inset-bottom)}}
`;
    document.head.appendChild(st);
  }

  function ui() {
    const box = document.createElement('div');
    box.id = 'rvw';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Prüfmodus');
    box.innerHTML = `<div class="rvw-bar"><b>Prüfmodus<small id="rvwCount"></small></b><button id="rvwHelp" aria-label="Anleitung zeigen">?</button><button id="rvwList">Liste</button><button id="rvwMin" aria-label="Einklappen">–</button></div><div class="rvw-body" id="rvwBody"></div>`;
    document.body.appendChild(box);
    $('#rvwMin').onclick = () => { box.classList.toggle('min'); $('#rvwMin').textContent = box.classList.contains('min') ? '+' : '–'; };
    $('#rvwHelp').onclick = () => { const k = S.intro; S.intro = false; intro(); S.intro = k; };
    $('#rvwList').onclick = () => { box.classList.remove('min'); $('#rvwMin').textContent = '–'; list(); };
    // tapping a yellow text opens its item (and doesn't follow links / toggle FAQ)
    document.addEventListener('click', (e) => {
      const sp = e.target.closest?.('.rvx');
      if (!sp) return;
      e.preventDefault();
      e.stopPropagation();
      openItem(sp.dataset.item, false);
      side(sp);
    }, true);
    if (matchMedia('(max-width:600px)').matches) box.classList.add('min'), ($('#rvwMin').textContent = '+');
    list();
  }

  function list() {
    openId = null;
    mark();
    const body = $('#rvwBody');
    body.innerHTML = `<h3>Bitte prüfen</h3><p class="q">Gelb markiert = braucht dein OK. Antippen auf der Seite oder hier in der Liste.</p>
      ${ITEMS.map((it) => `<button class="rvw-it ${S.items[it.id] ? 'done' : ''}" data-id="${it.id}"><i></i><span>${esc(it.title)}${S.items[it.id] ? `<br><em>${esc(label(it))}</em>` : ''}</span>›</button>`).join('')}
      <h4>Fragen</h4>
      ${QUESTIONS.map(([k, l, ph]) => `<label class="l" for="rvq-${k}">${esc(l)}</label>${k === 'sonst' || k === 'orte' ? `<textarea id="rvq-${k}" data-q="${k}" placeholder="${esc(ph)}">${esc(S.q[k] || '')}</textarea>` : `<input type="text" id="rvq-${k}" data-q="${k}" placeholder="${esc(ph)}" value="${esc(S.q[k] || '')}">`}`).join('')}
      <div class="rvw-row"><button class="rvw-btn" id="rvwSend">Antworten senden</button><button class="rvw-btn g" id="rvwCopy">Als Text kopieren</button></div>
      <div class="rvw-msg" id="rvwMsg">${S.sent ? `Zuletzt gesendet: ${new Date(S.sent).toLocaleString('de-DE')}. Du kannst jederzeit erneut senden.` : 'Du kannst auch zwischendurch aufhören – deine Eingaben bleiben auf diesem Gerät gespeichert.'}</div>`;
    body.scrollTop = 0;
    body.querySelectorAll('.rvw-it').forEach((b) => (b.onclick = () => openItem(b.dataset.id, true)));
    body.querySelectorAll('[data-q]').forEach((f) => (f.oninput = () => { S.q[f.dataset.q] = f.value; save(); }));
    $('#rvwSend').onclick = send;
    $('#rvwCopy').onclick = async () => {
      try { await navigator.clipboard.writeText(asText()); $('#rvwMsg').textContent = 'Kopiert – du kannst den Text z. B. per WhatsApp schicken.'; }
      catch { $('#rvwMsg').textContent = 'Kopieren hat nicht geklappt.'; }
    };
  }

  function label(it) {
    const a = S.items[it.id];
    if (!a) return '';
    return a.choice === 'edit' ? 'Selbst geändert' : it.choices[a.choice]?.label || '';
  }

  function show(it) {
    const el = it.els.flat().find((e) => e.getClientRects().length && e.offsetParent !== null);
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const panelH = document.getElementById('rvw').getBoundingClientRect().height;
    const narrow = innerWidth <= 600;
    scrollTo({ top: scrollY + r.top - (narrow ? Math.max(90, (innerHeight - panelH) / 2 - r.height / 2) : innerHeight / 2 - r.height / 2), behavior: 'smooth' });
    side(el);
    return true;
  }

  // desktop: keep the panel on the side away from the text it is about
  function side(el) {
    if (innerWidth <= 600 || !el) return;
    const r = el.getBoundingClientRect();
    const box = document.getElementById('rvw');
    box.classList.toggle('left', r.left + r.width / 2 > innerWidth / 2); // text on the right → panel on the left
  }
  function openItem(id, scroll) {
    const it = ITEMS.find((x) => x.id === id);
    if (!it) return;
    openId = id;
    mark();
    const box = $('#rvw');
    box.classList.remove('min');
    $('#rvwMin').textContent = '–';
    const a = S.items[id];
    const cur = current(it);
    const idx = ITEMS.indexOf(it);
    const body = $('#rvwBody');
    const hidden = !it.meta && !it.els.flat().some((e) => e.getClientRects().length && e.offsetParent !== null);
    body.innerHTML = `<h3>${esc(it.title)}</h3><p class="q">${esc(it.q)}</p>
      ${it.meta ? `<p class="q" style="background:#fff;border-radius:10px;padding:10px 12px;color:#1F211C">${esc(cur[0])}</p>` : ''}
      ${hidden ? '<p class="q"><i>Diese Stelle ist auf dem Handy ausgeblendet – du kannst sie unten bei „Selbst ändern“ lesen.</i></p>' : ''}
      ${it.choices.map((c, i) => `<label class="rvw-ch ${a && a.choice === i ? 'on' : ''}"><input type="radio" name="rvwc" value="${i}" ${a && a.choice === i ? 'checked' : ''}><span>${esc(c.label)}${i > 0 && !it.meta && c.t.some((x) => x != null) ? '<small>Die Seite zeigt sofort, wie es aussieht.</small>' : ''}</span></label>`).join('')}
      <label class="rvw-ch ${a && a.choice === 'edit' ? 'on' : ''}"><input type="radio" name="rvwc" value="edit" ${a && a.choice === 'edit' ? 'checked' : ''}><span>Selbst ändern<small>Text unten umschreiben – die Seite ändert sich mit.</small></span></label>
      <div id="rvwEdit" ${a && a.choice === 'edit' ? '' : 'hidden'}>
        ${cur.map((t, i) => (!it.meta && !it.els[i].length) ? '' : `<label class="l" for="rvwT${i}">${it.meta ? 'Text' : (it.orig.length > 1 ? `Stelle ${i + 1}` : 'Text')}</label><textarea id="rvwT${i}" data-i="${i}">${esc(t)}</textarea>`).join('')}
      </div>
      <label class="l" for="rvwNote">Anmerkung (optional)</label><textarea id="rvwNote" style="min-height:54px">${esc(a?.note || '')}</textarea>
      <div class="rvw-row">
        <button class="rvw-btn g" id="rvwBack">‹ Liste</button>
        ${!it.meta && !hidden ? '<button class="rvw-btn g" id="rvwShow">Auf der Seite zeigen</button>' : ''}
        <button class="rvw-btn" id="rvwNext">${idx < ITEMS.length - 1 ? 'Weiter ›' : 'Fertig ›'}</button>
      </div>`;
    body.scrollTop = 0;
    const set = (choice) => {
      const prev = S.items[id] || {};
      S.items[id] = { choice, note: $('#rvwNote').value, texts: choice === 'edit' ? cur.map((_, i) => $(`#rvwT${i}`)?.value ?? null) : prev.texts };
      save(); apply(it); mark();
      body.querySelectorAll('.rvw-ch').forEach((l) => l.classList.toggle('on', l.querySelector('input').checked));
      $('#rvwEdit').hidden = choice !== 'edit';
      if (choice !== 'edit') current(it).forEach((t, i) => { const ta = $(`#rvwT${i}`); if (ta) ta.value = t; });
    };
    body.querySelectorAll('input[name=rvwc]').forEach((r) => (r.onchange = () => set(r.value === 'edit' ? 'edit' : +r.value)));
    body.querySelectorAll('#rvwEdit textarea').forEach((ta) => (ta.oninput = () => {
      const s = S.items[id] || (S.items[id] = { choice: 'edit' });
      s.choice = 'edit';
      s.texts = cur.map((_, i) => $(`#rvwT${i}`)?.value ?? null);
      body.querySelector('input[value=edit]').checked = true;
      save(); apply(it); mark();
    }));
    $('#rvwNote').oninput = () => { if (S.items[id]) { S.items[id].note = $('#rvwNote').value; save(); } };
    $('#rvwBack').onclick = list;
    if ($('#rvwShow')) $('#rvwShow').onclick = () => show(it);
    $('#rvwNext').onclick = () => {
      const nxt = ITEMS.slice(idx + 1).find((x) => !S.items[x.id]) || ITEMS[idx + 1];
      nxt ? openItem(nxt.id, true) : list();
    };
    if (scroll) show(it);
  }

  /* ---------- sending ---------- */
  function payload() {
    const items = {};
    ITEMS.forEach((it) => {
      const a = S.items[it.id];
      if (!a) return;
      items[it.id] = { title: it.title, choice: label(it), note: a.note || '', texts: a.choice === 'edit' ? current(it) : (a.choice > 0 ? current(it) : []) };
    });
    const questions = {};
    QUESTIONS.forEach(([k, l]) => { if (S.q[k]) questions[k] = { label: l, value: S.q[k] }; });
    return { items, questions, by: S.q.name || '' };
  }
  function asText() {
    const p = payload();
    const L = ['AREA Galabau – Antworten aus dem Prüfmodus', ''];
    ITEMS.forEach((it) => {
      const x = p.items[it.id];
      L.push(`• ${it.title}: ${x ? x.choice : 'noch offen'}`);
      if (x && x.choice === 'Selbst geändert') x.texts.forEach((t, i) => { if (t !== it.orig[i]) L.push(`   – ${t}`); });
      if (x?.note) L.push(`   Anmerkung: ${x.note}`);
    });
    L.push('');
    QUESTIONS.forEach(([k, l]) => { if (S.q[k]) L.push(`${l}: ${S.q[k]}`); });
    return L.join('\n');
  }
  async function send() {
    const b = $('#rvwSend'), m = $('#rvwMsg');
    const p = payload();
    if (!Object.keys(p.items).length && !Object.keys(p.questions).length) { m.textContent = 'Noch nichts ausgefüllt.'; return; }
    b.disabled = true; m.textContent = 'Wird gesendet …';
    try {
      const r = await fetch('/api/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p) });
      if (!r.ok) throw new Error(r.status);
      S.sent = Date.now(); save();
      const open = ITEMS.length - Object.keys(p.items).length;
      m.innerHTML = `<b style="color:#3f5a12">Danke, ist angekommen!</b> ${open ? `Noch ${open} Punkt${open > 1 ? 'e' : ''} offen – du kannst später weitermachen und nochmal senden.` : 'Alles geprüft.'}`;
    } catch {
      m.textContent = 'Senden hat nicht geklappt. Tipp auf „Als Text kopieren“ und schick es per WhatsApp.';
    }
    b.disabled = false;
  }

  function intro() {
    if (document.getElementById('rvwIntro')) return;
    const done = ITEMS.filter((it) => S.items[it.id]).length;
    const back = S.intro && (done || Object.values(S.q).some(Boolean));
    const d = document.createElement('div');
    d.id = 'rvwIntro';
    d.innerHTML = back
      ? `<div role="dialog" aria-modal="true" aria-labelledby="rvwIh"><h2 id="rvwIh">Willkommen zurück!</h2>
      <p>Du hast schon <b>${done} von ${ITEMS.length}</b> Punkten geprüft – deine Antworten sind noch da.</p>
      <p>Weiter geht's in der Liste unten. Wenn du fertig bist: <b>„Antworten senden“</b>.${S.sent ? ` (Zuletzt gesendet: ${new Date(S.sent).toLocaleString('de-DE')}.)` : ''}</p>
      <div class="rvw-row"><button class="rvw-btn" id="rvwGo">Weitermachen</button><button class="rvw-btn g" id="rvwHow">Anleitung</button></div></div>`
      : `<div role="dialog" aria-modal="true" aria-labelledby="rvwIh"><h2 id="rvwIh">Hallo Armin!</h2>
      <p>Das ist die neue Website im <b>Prüfmodus</b>. Alles, was <mark>gelb markiert</mark> ist, braucht dein OK – vor allem Aussagen wie „Meisterbetrieb“ oder „Festpreis-Garantie“, die rechtlich stimmen müssen.</p>
      <p>Tipp auf eine gelbe Stelle und wähle: <b>stimmt so</b>, die <b>sichere Formulierung</b> oder <b>selbst ändern</b>. Die Seite zeigt sofort, wie es aussieht. Erledigte Stellen werden grün.</p>
      <p>In der Liste unten fehlen außerdem ein paar Angaben fürs Impressum. Am Ende: <b>„Antworten senden“</b>.</p>
      <div class="rvw-row"><button class="rvw-btn" id="rvwGo">Los geht's</button></div></div>`;
    document.body.appendChild(d);
    const close = () => { d.remove(); S.intro = true; save(); };
    $('#rvwGo').onclick = close;
    if ($('#rvwHow')) $('#rvwHow').onclick = () => { d.remove(); S.intro = false; intro(); S.intro = true; };
    d.addEventListener('click', (e) => { if (e.target === d) close(); });
    $('#rvwGo').focus();
  }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', init);
  else init();
})();
