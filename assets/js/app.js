/* FLEET INTELLIGENCE — application. Données simulées ; agents à règles déterministes ; aucune API Yango, GPS ou LLM connectée. */
(function () {
  'use strict';
  const E = window.FLEET, C = window.TRIDENT_CHARTS, F = window.FLEET_SCENE, N = window.FLEET_NET;
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const f = E.fmt, TODAY = E.TODAY;
  const I = {
    cmd: '<path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z"/>', live: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="8"/>',
    car: '<path d="M3 13l2-5h14l2 5v5H3zM6 18v2M18 18v2M3 13h18"/>', moto: '<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l4-6h5l3 6M13 7h3"/>', truck: '<path d="M2 7h11v9H2zM13 10h4l4 3v3h-8M6 19a2 2 0 1 0 0-.1M17 19a2 2 0 1 0 0-.1"/>',
    box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10"/>', drv: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>', ai: '<circle cx="12" cy="12" r="3"/><circle cx="4" cy="5" r="2"/><circle cx="20" cy="5" r="2"/><circle cx="4" cy="19" r="2"/><circle cx="20" cy="19" r="2"/><path d="M6 6.5l3.8 3.6M18 6.5l-3.8 3.6M6 17.5l3.8-3.6M18 17.5l-3.8-3.6"/>',
    pred: '<path d="M3 17l5-5 4 3 7-8M15 7h4v4"/>', fin: '<path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>', mnt: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
    rep: '<path d="M6 2h9l5 5v15H6zM14 2v6h6M9 13h8M9 17h8"/>', adm: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>', bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 21h4"/>',
    play: '<path d="M7 5v14l11-7z"/>', pause: '<path d="M8 5v14M16 5v14"/>', next: '<path d="M5 5v14l9-7zM18 5v14"/>', reset: '<path d="M4 4v6h6M4.5 15a8 8 0 1 0 1.9-8.3L4 10"/>', more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
    focus: '<circle cx="12" cy="12" r="3"/><path d="M3 8V3h5M16 3h5v5M21 16v5h-5M8 21H3v-5"/>', home: '<path d="M3 11 12 3l9 8M5 9v12h14V9"/>', plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>', expand: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>', shrink: '<path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5"/>', dl: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
  };
  const ico = (k) => '<svg viewBox="0 0 24 24" aria-hidden="true">' + I[k] + '</svg>';
  const SEV = { crit: ['Critique', 's-crit'], warn: ['Avertissement', 's-warn'], info: ['Information', 's-info'] };
  const sev = (s) => '<span class="sev ' + SEV[s][1] + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/></svg>' + SEV[s][0] + '</span>';
  const pill = (s, l) => '<span class="pill s-' + s + '">' + esc(l) + '</span>';
  const STL = { avail: 'Disponible', mission: 'En mission', late: 'En retard', crit: 'Alerte critique', off: 'Hors ligne' };
  const SCOL = { avail: '#2fd08a', mission: '#4c8dff', late: '#ff8a3d', crit: '#ff4d5e', off: '#6b7685' };
  const SEGCOL = { vtc: '#1fa3b3', moto: '#8070f0', truck: '#cf4f97', moving: '#b98a2a' };
  const VIEWS = [['command', 'Centre de commande', 'cmd'], ['live', 'Flotte en direct', 'live'], ['yango', 'Opérations Yango / VTC', 'car'], ['moto', 'Livraison moto', 'moto'], ['trucks', 'Camions et logistique', 'truck'], ['moving', 'Déménagement', 'box'], ['drivers', 'Chauffeurs', 'drv'], ['ai', 'Centre d’intelligence IA', 'ai'], ['predictive', 'Analyses prédictives', 'pred'], ['finance', 'Intelligence financière', 'fin'], ['maintenance', 'Centre de maintenance', 'mnt'], ['reports', 'Rapports et analyses', 'rep'], ['admin', 'Administration', 'adm']].map(([id, name, ic]) => ({ id, name, ic }));
  const ROLES = {
    ceo: ['Direction générale', VIEWS.map((v) => v.id), true], ops: ['Directeur des opérations', VIEWS.map((v) => v.id).filter((x) => x !== 'admin'), true],
    fleet: ['Responsable de flotte', ['command', 'live', 'yango', 'moto', 'trucks', 'moving', 'drivers', 'ai', 'predictive', 'maintenance', 'reports'], false],
    logi: ['Responsable logistique', ['command', 'live', 'moto', 'trucks', 'moving', 'drivers', 'ai', 'reports'], false], fin: ['Responsable financier', ['command', 'yango', 'finance', 'predictive', 'ai', 'reports'], true],
    disp: ['Dispatcher', ['command', 'live', 'moto', 'trucks', 'moving', 'drivers'], false],
  };
  const SCEN = [['type', 'Journée type', 'Activité normale ; les anomalies du mois restent dans l’historique.'], ['traffic', 'Embouteillages du soir', 'Retards de 20 à 45 min sur les missions de 16:00 à 20:00.'], ['demand', 'Pic de commandes moto', 'Afflux de commandes depuis Cocody entre 11:00 et 14:00.']];

  const st = { scn: 'type', now: 18 * 60, speed: 60, paused: false, view: 'command', sel: null, role: 'ceo', period: '7', from: E.iso(TODAY - 13), to: E.iso(TODAY), seg: 'all', stat: 'all', liveTab: '3d', layers: { zones: true, veh: true, pick: true, drop: true, routes: true, heat: false }, alerts: {}, decisions: {}, journal: [], chat: [], reports: [], running: null, lastRun: null, agentSel: 'fleet', agentState: {}, agentLog: {}, alertSel: null, moveSel: null, drvSel: null, predWhat: 'rev', maintPlanned: {}, assigned: {}, notifOpen: false, labels: true, light: false };
  let D, ALERTS = [], gl = false, glN = false, DL = null, lastQ = -1;
  const tNow = () => E.nowMin(st.now), tLabel = () => E.dayLabel(TODAY) + ' ' + E.hhmm(st.now);
  const journal = (w, x) => st.journal.unshift({ t: E.hhmm(st.now), w, x }); const alog = (a, x) => (st.agentLog[a] = st.agentLog[a] || []).unshift({ t: E.hhmm(st.now), x });
  function toast(m, k) { const t = document.createElement('div'); t.className = 'toast ' + (k || ''); t.textContent = m; $('#toasts').appendChild(t); setTimeout(() => t.remove(), 4200); }
  const canFin = () => ROLES[st.role][2];
  const money = (v) => (canFin() ? E.fcfa(v) : '<span class="masked">masqué pour ce rôle</span>');

  function reset(s) {
    st.scn = s || st.scn; st.now = 18 * 60; st._routeM = null; st.paused = false; st.alerts = {}; st.journal = []; st.chat = []; st.reports = []; st.running = null; st.lastRun = null; st.agentLog = {}; st.maintPlanned = {}; st.assigned = {};
    D = E.generate(st.scn); E.CURRENT = D; ALERTS = E.buildAlerts(D, st.now).map((a) => Object.assign(a, { state: 'new' })); ALERTS.forEach((a) => { st.alerts[a.id] = { state: 'new', log: [] }; alog(a.agent, 'Alerte : ' + a.title); });
    journal('Régie', 'Scénario « ' + SCEN.find((x) => x[0] === st.scn)[1] + ' », horloge à 18:00');
  }
  const alertsLive = () => ALERTS.map((a) => Object.assign(a, { state: st.alerts[a.id] ? st.alerts[a.id].state : 'new' }));
  const vStatus = (v) => E.vehStatus(D, v, st.now, alertsLive());

  /* ---------- coquille ---------- */
  function buildShell() {
    $('#navlist').innerHTML = VIEWS.map((v) => '<li><a href="#' + v.id + '" data-v="' + v.id + '">' + ico(v.ic) + '<span>' + v.name + '</span></a></li>').join('');
    $('#bnav').innerHTML = [['command', 'Centre', 'cmd'], ['live', 'Flotte', 'live'], ['ai', 'IA', 'ai'], ['finance', 'Finances', 'fin'], ['more', 'Plus', 'more']].map(([id, n, i]) => '<button data-v="' + id + '">' + ico(i) + n + '</button>').join('');
    $('#bnav').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.v === 'more') menu(true); else go(b.dataset.v); });
    $('#menuBtn').addEventListener('click', () => (mobile() ? menu(!$('#nav').classList.contains('open')) : navMin(!$('#app').classList.contains('navmin'))));
    navMin(pref('fi.navmin') !== '0');
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && st.maxi && !document.querySelector('dialog[open]')) maxi(false); }); $('#nav').addEventListener('click', (e) => { if (e.target.closest('a')) menu(false); });
    $('#roleSel').innerHTML = Object.keys(ROLES).map((k) => '<option value="' + k + '">' + ROLES[k][0] + '</option>').join('');
    $('#roleSel').addEventListener('change', (e) => { st.role = e.target.value; navRole(); journal('Vous', 'Vue simulée : ' + ROLES[st.role][0]); if (!ROLES[st.role][1].includes(st.view)) go('command'); else render(); toast('Affichage simulé pour : ' + ROLES[st.role][0]); });
    const si = $('#searchIn');
    si.addEventListener('input', search); si.addEventListener('focus', search); si.addEventListener('keydown', (e) => { if (e.key === 'Escape') { $('#searchDrop').hidden = true; si.blur(); } if (e.key === 'ArrowDown') { const b = $('#searchDrop button'); if (b) b.focus(); } });
    document.addEventListener('click', (e) => { if (!e.target.closest('.search')) $('#searchDrop').hidden = true; if (!e.target.closest('.notif')) { $('#notifDrop').hidden = true; $('#bellBtn').setAttribute('aria-expanded', 'false'); } });
    $('#bellBtn').addEventListener('click', () => { const d = $('#notifDrop'); d.hidden = !d.hidden; $('#bellBtn').setAttribute('aria-expanded', String(!d.hidden)); notif(); });
    window.addEventListener('hashchange', route);
    $('#regie').innerHTML = '<span class="lab">Régie</span><label class="sr" for="scn">Scénario</label><select id="scn">' + SCEN.map((s) => '<option value="' + s[0] + '">' + s[1] + '</option>').join('') + '</select><button class="btn" id="rgPlay"></button><div class="seg">' + [[1, '×1'], [60, '×60'], [600, '×600']].map(([v, l]) => '<button data-sp="' + v + '">' + l + '</button>').join('') + '</div><button class="btn" id="rgNext">' + ico('next') + '<span>+30 min</span></button><button class="btn" id="rgReset">' + ico('reset') + '<span>Réinitialiser</span></button><span class="desc" id="rgDesc"></span>';
    $('#scn').addEventListener('change', (e) => { reset(e.target.value); regie(); render(); tick(true); toast('Scénario chargé'); });
    $('#rgPlay').addEventListener('click', () => { st.paused = !st.paused; regie(); }); $$('[data-sp]').forEach((b) => b.addEventListener('click', () => { st.speed = +b.dataset.sp; regie(); }));
    $('#rgNext').addEventListener('click', () => { st.now = Math.min(23 * 60 + 59, st.now + 30); tick(true); }); $('#rgReset').addEventListener('click', () => { reset(); regie(); render(); tick(true); });
    regie(); navRole();
  }
  function regie() { $('#scn').value = st.scn; $('#rgPlay').innerHTML = ico(st.paused ? 'play' : 'pause') + '<span>' + (st.paused ? 'Reprendre' : 'Pause') + '</span>'; $$('[data-sp]').forEach((b) => b.setAttribute('aria-pressed', +b.dataset.sp === st.speed)); $('#rgDesc').textContent = SCEN.find((x) => x[0] === st.scn)[2]; }
  function navRole() { const ok = ROLES[st.role][1]; $$('#navlist li').forEach((li) => (li.hidden = !ok.includes(li.firstChild.dataset.v))); $$('#bnav button').forEach((b) => (b.hidden = b.dataset.v !== 'more' && !ok.includes(b.dataset.v))); }
  const mobile = () => matchMedia('(max-width:760px)').matches;
  const pref = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };
  function navMin(o) { $('#app').classList.toggle('navmin', o); pref('fi.navmin', o ? '1' : '0'); $('#menuBtn').setAttribute('aria-expanded', String(!o)); $('#menuBtn').setAttribute('aria-label', o ? 'Afficher le menu' : 'Réduire le menu'); if (gl) requestAnimationFrame(() => F.resize()); }
  const menu = (o) => { if (!mobile()) return; $('#nav').classList.toggle('open', o); $('#menuBtn').setAttribute('aria-expanded', o); };
  function maxi(o) { st.maxi = o; const s = $('.twin-slot'); const h = s && s.closest('.hero,.twin-page'); if (h) h.classList.toggle('maxi', o); document.body.classList.toggle('has-maxi', o); $$('[data-tw="max"]').forEach((b) => { b.setAttribute('aria-pressed', String(o)); b.innerHTML = ico(o ? 'shrink' : 'expand') + (o ? 'Réduire' : 'Agrandir'); }); if (gl) requestAnimationFrame(() => F.resize()); }
  function go(id) { if (location.hash.slice(1) === id) route(); else location.hash = id; }
  function route() { let id = location.hash.slice(1); if (!VIEWS.some((v) => v.id === id)) id = 'command'; if (!ROLES[st.role][1].includes(id)) { toast('Ce module n’est pas accessible au rôle « ' + ROLES[st.role][0] + ' » (simulation).', 'warn'); id = 'command'; } if (st.maxi && id !== st.view) maxi(false); st.view = id;
    $$('#navlist a').forEach((a) => (a.dataset.v === id ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'))); $$('#bnav button').forEach((a) => (a.dataset.v === id ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'))); render(); $('#main').scrollTop = 0; }
  function crumb() { const v = VIEWS.find((x) => x.id === st.view); $('#crumb').innerHTML = '<b>' + v.name + '</b>' + (st.sel && (st.view === 'command' || st.view === 'live') ? '<span class="m">/</span><span>' + esc(selName(st.sel)) + '</span>' : ''); }
  const selName = (id) => (id.startsWith('veh:') ? id.slice(4) : id.startsWith('zone:') ? id.slice(5) + ' (zone)' : 'Dépôt');

  function search() {
    const q = $('#searchIn').value.trim().toLowerCase(), d = $('#searchDrop'); if (q.length < 2) { d.hidden = true; return; }
    const R = [];
    D.V.forEach((v) => { if (v.id.toLowerCase().includes(q)) R.push(['veh:' + v.id, v.id, E.CATS[v.cat]]); });
    D.DR.forEach((x) => { if (x.name.toLowerCase().includes(q) || x.id.toLowerCase().includes(q)) R.push(['drv:' + x.id, x.name, 'Chauffeur, ' + x.veh]); });
    E.ZONES.forEach((z) => { if (z.toLowerCase().includes(q)) R.push(['zone:' + z, z, 'Zone (schématique)']); });
    D.missions.filter((m) => m.d === TODAY && m.id.toLowerCase().includes(q)).slice(0, 5).forEach((m) => R.push(['veh:' + m.veh, m.id, 'Mission, ' + m.veh]));
    D.moving.filter((m) => m.id.toLowerCase().includes(q) || m.client.toLowerCase().includes(q)).slice(0, 5).forEach((m) => R.push(['mov:' + m.id, m.id, m.client]));
    d.innerHTML = R.length ? R.slice(0, 12).map((r) => '<button data-k="' + esc(r[0]) + '"><b>' + esc(r[1]) + '</b><span class="k">' + esc(r[2]) + '</span></button>').join('') : '<p class="m" style="padding:8px 10px;margin:0;font-size:13px">Aucun résultat pour « ' + esc(q) + ' ».</p>'; d.hidden = false;
    $$('button', d).forEach((b) => b.addEventListener('click', () => { const k = b.dataset.k; d.hidden = true; $('#searchIn').value = '';
      if (k.startsWith('drv:')) { st.drvSel = k.slice(4); go('drivers'); } else if (k.startsWith('mov:')) { st.moveSel = k.slice(4); go('moving'); } else { st.sel = k; go('live'); setTimeout(() => { if (gl) { F.select(k); F.focus(k); } }, 80); } }));
  }
  function notif() {
    const d = $('#notifDrop'); const L = alertsLive().filter((a) => a.state !== 'resolved').sort((a, b) => b.at - a.at).slice(0, 12);
    d.innerHTML = '<div style="padding:6px 10px;font-size:12.5px;color:var(--text-3)">' + L.length + ' alertes ouvertes</div>' + L.map((a) => '<button data-a="' + a.id + '">' + sev(a.sev) + '<span>' + esc(a.title) + '<br><span class="m" style="font-size:12px">' + E.dayLabel(Math.floor(a.at / 1440)) + ' ' + E.hhmm(a.at % 1440) + (a.state === 'ack' ? ', prise en charge' : '') + '</span></span></button>').join('');
    $$('[data-a]', d).forEach((b) => b.addEventListener('click', () => { st.alertSel = b.dataset.a; d.hidden = true; if (ROLES[st.role][1].includes('predictive')) go('predictive'); else alertDlg(ALERTS.find((a) => a.id === b.dataset.a)); }));
  }

  /* ---------- horloge ---------- */
  let tickN = 0;
  function tick(force) {
    if (st.now >= 23 * 60 + 59 && !st.paused) { st.paused = true; regie(); toast('Fin de la journée simulée.'); }
    const n0 = ALERTS.length; const nw = E.buildAlerts(D, st.now); nw.forEach((a) => { if (!st.alerts[a.id]) { st.alerts[a.id] = { state: 'new', log: [] }; alog(a.agent, 'Alerte : ' + a.title); journal(E.agent(a.agent).name, a.title); toast(SEV[a.sev][0] + ' : ' + a.title, a.sev); } }); ALERTS = nw;
    $('#clock').textContent = E.hhmm(st.now);
    const open = alertsLive().filter((a) => a.state !== 'resolved' && a.sev !== 'info').length; $('#bellBadge').hidden = !open; $('#bellBadge').textContent = open;
    if (gl) { F.setTime(st.now); F.update(sceneState()); routeSync(); }
    dayPill(); feed(); if (gl && F.inCab()) cabHud(false); if (gl && F.inHQ()) F.hqSetInfo(agentInfo());
    const q = Math.floor(st.now / 15); const heavy = force || q !== lastQ || ALERTS.length !== n0; lastQ = q;
    tickN++; const slow = heavy || tickN % 8 === 0;
    crumb(); const k = $('#kgrp'); if (k && slow) { k.outerHTML = kpiGroups(); }
    if (heavy && V[st.view + '_live']) V[st.view + '_live']();
    if (st.sel && $('#vinfo') && slow && !$('#vinfo').contains(document.activeElement)) vinfo(false);
  }
  setInterval(() => { if (!st.paused && D) { st.now = Math.min(23 * 60 + 59, st.now + (st.speed * 0.25) / 60); tick(false); } }, 250);

  /* ---------- positions (plan schématique) ---------- */
  function lastZone(v) { const t = tNow(); const L = D.missions.filter((m) => m.veh === v.id && m.d === TODAY && m.start + m.dur + m.delay <= t); return L.length ? L[L.length - 1].to : null; }
  const hashOf = (v) => (v.id.charCodeAt(4) * 13 + v.id.charCodeAt(5) * 7) % 100;
  function vehPos(v, s) {
    const h = hashOf(v);
    if (s.m) { const m = s.m, u = E.clamp((tNow() - m.start) / (m.dur + m.delay), 0, 1); return Object.assign(E.sample(E.pathPts(m.from, m.to), u, 2), { moving: true }); }
    const z = s.s === 'off' ? null : lastZone(v);
    if (z && v.seg === 'vtc') { const n = E.GRID.zones[z], p = E.node(n[0], n[1]); const side = h % 4; const d = 7 + (h % 3) * 4.2; const P = [[p.x + d, p.z - 3.6, 0], [p.x - d, p.z + 3.6, Math.PI], [p.x + 3.6, p.z + d, -Math.PI / 2], [p.x - 3.6, p.z - d, Math.PI / 2]][side]; return { x: P[0], z: P[1], heading: P[2], moving: false }; }
    const idx = D.V.indexOf(v); const sl = gl ? F.depotSlot(idx % 28) : { x: 51, z: -50, heading: 0 }; return Object.assign({ moving: false }, sl, { z: sl.z + (idx >= 28 ? 0 : 0) });
  }
  function sceneState() {
    const zc = {}; const vehicles = D.V.map((v) => { const s = vStatus(v), p = vehPos(v, s); const okSeg = st.seg === 'all' || v.seg === st.seg, okSt = st.stat === 'all' || s.s === st.stat;
      if (s.m) zc[s.m.to] = (zc[s.m.to] || 0) + 1; return { id: v.id, x: p.x, z: p.z, heading: p.heading, s: s.s, visible: okSeg && okSt, moving: !!p.moving }; });
    return { vehicles, zoneCount: zc };
  }

  /* ---------- périodes ---------- */
  function range() { if (st.period === '1') return [TODAY, TODAY, 'aujourd’hui']; if (st.period === '7') return [TODAY - 7, TODAY - 1, '7 derniers jours']; if (st.period === '30') return [0, TODAY - 1, '30 derniers jours']; const a = Math.max(0, E.dayOfIso(st.from)), b = Math.min(TODAY, E.dayOfIso(st.to)); return [a, b, 'du ' + E.dayLabel(a) + ' au ' + E.dayLabel(b)]; }
  function prevRange() { const [a, b] = range(); const n = b - a + 1; return [Math.max(0, a - n), Math.max(0, a - 1)]; }
  function filters(withSeg) {
    return '<div class="tools"><div class="seg" role="group" aria-label="Période">' + [['1', 'Aujourd’hui'], ['7', '7 jours'], ['30', '30 jours'], ['c', 'Personnalisée']].map(([k, l]) => '<button data-per="' + k + '" aria-pressed="' + (st.period === k) + '">' + l + '</button>').join('') + '</div>' +
      (st.period === 'c' ? '<div class="dates" style="display:flex;gap:6px;align-items:center"><label class="sr" for="dF">Du</label><input class="btn" type="date" id="dF" min="' + E.iso(0) + '" max="' + E.iso(TODAY) + '" value="' + st.from + '"><span class="m">au</span><label class="sr" for="dT">Au</label><input class="btn" type="date" id="dT" min="' + E.iso(0) + '" max="' + E.iso(TODAY) + '" value="' + st.to + '"></div>' : '') +
      (withSeg ? '<div class="chipf" role="group" aria-label="Segment">' + [['all', 'Tous les segments']].concat(E.SEGS.map((s) => [s.id, s.short])).map(([k, l]) => '<button data-sg="' + k + '" aria-pressed="' + (st.seg === k) + '">' + (k !== 'all' ? '<i style="background:' + SEGCOL[k] + '"></i>' : '') + l + '</button>').join('') + '</div>' : '') + '</div>';
  }
  function bindFilters(v) {
    $$('[data-per]', v).forEach((b) => b.addEventListener('click', () => { st.period = b.dataset.per; render(); }));
    $$('[data-sg]', v).forEach((b) => b.addEventListener('click', () => { st.seg = b.dataset.sg; render(); }));
    const a = $('#dF', v), b = $('#dT', v); if (a) [a, b].forEach((x) => x.addEventListener('change', () => { if (a.value > b.value) { toast('La date de début doit précéder la date de fin.', 'warn'); a.value = st.from; b.value = st.to; return; } st.from = a.value; st.to = b.value; render(); }));
  }

  /* ---------- KPI ---------- */
  function kpiGroups() {
    const [a, b] = range(), P = E.period(D, a, b, st.now, st.seg), days = b - a + 1 - (b === TODAY ? 1 - E.clamp((st.now / 60 - 6) / 17, 0, 1) : 0);
    const V2 = D.V.filter((v) => st.seg === 'all' || v.seg === st.seg), S = V2.map((v) => vStatus(v)), c = (k) => S.filter((x) => x.s === k).length;
    const act = S.filter((x) => x.s === 'mission' || x.s === 'late').length, drv = new Set(V2.filter((v, i) => S[i].s !== 'off').map((v) => v.driver)).size;
    const Tm = D.missions.filter((m) => m.d === TODAY && (st.seg === 'all' || m.seg === st.seg)), t = tNow();
    const dur = Tm.filter((m) => E.mStatus(m, t) === 'done'); const ds = E.driverStats(D, Math.max(0, a - (a === b ? 7 : 0)), Math.min(b, TODAY - 1), st.now).filter((x) => (st.seg === 'all' || x.dr.seg === st.seg) && x.score != null);
    const row = (l, v, u, note) => '<span>' + l + '</span><b>' + v + (u ? '<small>' + u + '</small>' : '') + '</b>' + (note ? '<em>' + note + '</em>' : '');
    const segRev = E.SEGS.map((s) => s.short + ' ' + (canFin() ? E.k(P.bySeg[s.id].rev) : '•••')).join(', ');
    return '<div class="kgrp" id="kgrp">' +
      '<section class="panel k-fleet"><h3>Flotte (en direct)</h3><div class="kl">' + row('Véhicules', '<span class="big">' + V2.length + '</span>') + row('Actifs', act) + row('Disponibles', c('avail')) + row('Hors ligne ou en maintenance', c('off')) + row('Taux d’utilisation', f(P.util * 100), '%', 'jours actifs / jours-véhicule, ' + range()[2]) + '</div></section>' +
      '<section class="panel k-ops"><h3>Opérations</h3><div class="kl">' + row('Trajets et missions réalisés', f(P.n)) + row('Livraisons en cours', Tm.filter((m) => m.key !== 'vtc' && ['run', 'late'].includes(E.mStatus(m, t))).length) + row('Durée moyenne d’une mission', f(dur.reduce((s, m) => s + m.dur + m.delay, 0) / Math.max(1, dur.length)), 'min', 'aujourd’hui') + row('Ponctualité', f(P.ontimeRate * 100), '%') + row('Distance moyenne', f(P.km / Math.max(1, P.n), 1), 'km') + row('Missions en cours', Tm.filter((m) => ['run', 'late'].includes(E.mStatus(m, t))).length) + '</div></section>' +
      '<section class="panel k-fin"><h3>Finances</h3><div class="kl">' + row('Revenu journalier moyen', canFin() ? E.k(P.rev / Math.max(days, 0.01)) : '<span class="masked">masqué</span>', canFin() ? 'FCFA' : '') + row('Revenu par véhicule', canFin() ? E.k(P.rev / Math.max(days, 0.01) / V2.length) : '<span class="masked">masqué</span>', canFin() ? 'FCFA/j' : '') + row('Carburant', canFin() ? E.k(P.fuelC) : '<span class="masked">masqué</span>', canFin() ? 'FCFA' : '') + row('Maintenance', canFin() ? E.k(P.maint) : '<span class="masked">masqué</span>', canFin() ? 'FCFA' : '') + row('Marge opérationnelle', canFin() ? f(P.margin * 100, 1) : '<span class="masked">masqué</span>', canFin() ? '%' : '', canFin() ? segRev : '') + '</div></section>' +
      '<section class="panel k-drv"><h3>Chauffeurs</h3><div class="kl">' + row('Chauffeurs actifs', drv) + row('Productivité', f(ds.reduce((s, x) => s + (x.perDay || 0), 0) / Math.max(1, ds.length), 1), 'missions/j') + row('Missions par chauffeur', f(P.n / Math.max(1, drv), 1), '', 'sur la période') + row('Score moyen', f(ds.reduce((s, x) => s + x.score, 0) / Math.max(1, ds.length)), '/100') + '</div></section></div>';
  }

  /* ---------- rendu ---------- */
  const V = {};
  function render() { crumb(); C.hideTip(); (V[st.view] || V.command)($('#view')); if (gl) F.update(sceneState()); }
  function twin(id) {
    return '<div class="twin-slot" id="' + id + '"><div class="twin-ctl"><button class="btn" data-tw="reset">' + ico('home') + 'Recentrer</button><button class="btn" data-tw="focus">' + ico('focus') + 'Centrer la sélection</button><button class="btn" data-tw="in" aria-label="Zoomer">' + ico('plus') + '</button><button class="btn" data-tw="out" aria-label="Dézoomer">' + ico('minus') + '</button><button class="btn" data-tw="max" aria-pressed="false">' + ico('expand') + 'Agrandir</button></div><div class="twin-hint">Glisser : se déplacer · Clic droit ou Ctrl + glisser : pivoter · Molette ou pincer : zoom</div>' +
      '<div class="daypill" data-day></div><div class="cab" id="cab" aria-live="polite"></div><div class="hq" id="hq"></div><div class="twin-legend">' + Object.keys(STL).map((k) => '<span><i style="background:' + SCOL[k] + '"></i>' + STL[k] + '</span>').join('') + '<span><i style="background:#ffd23f;border-radius:0;height:3px;width:14px"></i>Itinéraire sélectionné</span><span class="m">Plan schématique, positions simulées</span></div></div>';
  }
  function mountTwin(id) {
    const slot = $('#' + id); if (!slot) return;
    $$('[data-tw]', slot).forEach((b) => b.addEventListener('click', () => { const a = b.dataset.tw; if (a === 'max') return maxi(!st.maxi); if (!gl) return; if (a === 'reset') F.reset(); else if (a === 'focus') { if (!F.focus(st.sel)) toast('Sélectionnez un véhicule visible ou une zone.'); } else F.zoom(a === 'in' ? 0.7 : 1.4); }));
    if (st.maxi) maxi(true);
    if (gl) { if (F.inCab() || F.inHQ()) slot.classList.add('cabfull'); F.attach(slot); F.select(st.sel); if (F.inCab()) cabHud(true); if (F.inHQ()) hqHud(true); } else slot.insertAdjacentHTML('beforeend', '<div class="nogl">WebGL indisponible : utilisez le plan schématique de « Flotte en direct ».</div>');
  }
  function statChips() { return '<div class="chipf" role="group" aria-label="Statut">' + [['all', 'Tous les statuts']].concat(Object.keys(STL).map((k) => [k, STL[k]])).map(([k, l]) => '<button data-st="' + k + '" aria-pressed="' + (st.stat === k) + '">' + (k !== 'all' ? '<i style="background:' + SCOL[k] + '"></i>' : '') + l + '</button>').join('') + '</div>'; }
  function bindStat(v) { $$('[data-st]', v).forEach((b) => b.addEventListener('click', () => { st.stat = b.dataset.st; $$('[data-st]').forEach((x) => x.setAttribute('aria-pressed', x === b)); if (gl) F.update(sceneState()); if (V[st.view + '_live']) V[st.view + '_live'](); })); }
  function pick(id) { st.sel = id; if (gl) { F.select(id); st._routeM = undefined; routeSync(); } crumb(); if ($('#vinfo')) vinfo(); if (st.view === 'live') V.live_live(); }

  const r50 = (x) => Math.round(x / 50) * 50;
  function fareNow(v, s) { if (s.m) return money(r50(s.m.rev)) + (canFin() ? '<small>' + (s.m.key === 'vtc' ? 'tarif de la course' : 'prix de la mission') + '</small>' : ''); const L = D.missions.filter((m) => m.veh === v.id && m.d === TODAY && E.mStatus(m, tNow()) === 'done'); const x = L[L.length - 1]; return x ? money(r50(x.rev)) + (canFin() ? '<small>' + E.hhmm((x.start + x.dur + x.delay) % 1440) + ', ' + x.to + '</small>' : '') : 'Aucune'; }
  function dayFares(v) { const L = D.missions.filter((m) => m.veh === v.id && m.d === TODAY && E.mStatus(m, tNow()) === 'done'); return L.length + (v.seg === 'vtc' ? ' courses' : ' missions') + (canFin() ? ', ' + E.fcfa(L.reduce((s, m) => s + r50(m.rev), 0)) : ''); }
  function vinfo(force = true) {
    const box = $('#vinfo'); if (!box) return; if (!force && box.matches(':hover')) return; const id = st.sel;
    if (!id) { box.innerHTML = '<h3>Détail</h3><p class="empty">Cliquez un véhicule ou une zone dans la scène, ou utilisez la recherche.</p>'; return; }
    if (id === 'depot') { const off = D.V.filter((v) => vStatus(v).s === 'off'); box.innerHTML = '<h3 style="font-size:17px">Dépôt central</h3><p class="m" style="font-size:13px">Atelier et parking (emplacement schématique).</p><div class="kl">' + '<span>Véhicules hors ligne</span><b>' + off.length + '</b><span>Disponibles au dépôt</span><b>' + D.V.filter((v) => vStatus(v).s === 'avail' && !lastZone(v)).length + '</b></div><ul class="found" style="margin-top:8px">' + off.map((v) => '<li><span class="dot s-off" style="width:8px;height:8px;border-radius:50%;background:currentColor;margin-top:6px"></span><span class="t">' + v.id + '</span><span class="s">' + esc(vStatus(v).why) + '</span></li>').join('') + '</ul>'; return; }
    if (id.startsWith('zone:')) { const z = id.slice(5), t = tNow(), M = D.missions.filter((m) => m.d === TODAY && (m.from === z || m.to === z)); const run = M.filter((m) => ['run', 'late'].includes(E.mStatus(m, t)));
      box.innerHTML = '<h3 style="font-size:17px">' + esc(z) + '</h3><p class="m" style="font-size:13px">Zone d’opération, disposition schématique.</p><div class="kl"><span>Missions aujourd’hui</span><b>' + M.filter((m) => m.start <= t).length + '</b><span>En cours</span><b>' + run.length + '</b><span>Ponctualité du jour</span><b>' + E.pct(M.filter((m) => E.mStatus(m, t) === 'done' && m.delay <= 15).length / Math.max(1, M.filter((m) => E.mStatus(m, t) === 'done').length), 0) + '</b><span>VTC en attente dans la zone</span><b>' + D.V.filter((v) => v.seg === 'vtc' && vStatus(v).s === 'avail' && lastZone(v) === z).length + '</b></div>'; return; }
    const v = D.V.find((x) => x.id === id.slice(4)), s = vStatus(v), dr = D.DR.find((x) => x.id === v.driver), mp = E.maintPlan(D, st.now).find((x) => x.v.id === v.id), vs = E.vehStats(D, TODAY - 7, TODAY - 1, st.now).find((x) => x.v.id === v.id);
    const loc = s.m ? s.m.from + ' → ' + s.m.to : s.s === 'off' ? 'Dépôt' : lastZone(v) || 'Dépôt';
    box.innerHTML = '<div style="display:flex;gap:8px;align-items:flex-start"><div><h3 style="font-size:18px">' + v.id + '</h3><div class="m" style="font-size:13px">' + E.CATS[v.cat] + ', ' + E.seg(v.seg).name + '</div></div><div style="margin-left:auto">' + pill(s.s, s.label) + '</div></div>' +
      '<div class="mgrid"><div><div class="l">Chauffeur</div><div class="v" style="font-size:16px">' + esc(dr.name) + '</div></div><div><div class="l">Position (simulée)</div><div class="v" style="font-size:16px">' + esc(loc) + '</div></div><div><div class="l">Mission active</div><div class="v" style="font-size:16px">' + (s.m ? s.m.id + (s.m.delay > 15 && s.s === 'late' ? ' <small>+' + f(s.m.delay) + ' min</small>' : '') : 'Aucune') + '</div></div><div><div class="l">Carburant</div><div class="v">' + (s.s === 'off' ? 'NA' : f(E.fuelLevel(v, st.now) * 100)) + '<small>% (simulé)</small></div></div>' +
      '<div><div class="l">' + (s.m ? 'Montant de la course en cours' : 'Dernière course') + '</div><div class="v" style="font-size:16px">' + fareNow(v, s) + '</div></div><div><div class="l">Aujourd’hui</div><div class="v" style="font-size:16px">' + dayFares(v) + '</div></div>' + '<div><div class="l">Maintenance</div><div class="v" style="font-size:16px">' + (mp.left < 0 ? '<span class="s-crit">Dépassée de ' + f(-mp.left) + ' km</span>' : mp.state === 'soon' ? '<span class="s-warn">Dans ' + f(mp.left) + ' km</span>' : 'À jour (' + f(mp.left) + ' km)') + '</div></div><div><div class="l">Consommation 7 j</div><div class="v">' + f(vs.cons, 1) + '<small>L/100 km, réf. ' + f(v.ref, 1) + '</small></div></div><div><div class="l">Missions 7 j</div><div class="v">' + f(vs.n) + '</div></div><div><div class="l">Revenu 7 j</div><div class="v" style="font-size:16px">' + money(vs.rev) + '</div></div></div>' +
      '<p class="m" style="font-size:12.5px">' + esc(s.why) + '. Position et carburant simulés : aucun GPS ni télémétrie connectés.' + (s.m ? ' Pointillés jaunes : itinéraire de la mission.' : '') + '</p><div style="display:flex;gap:8px;flex-wrap:wrap">' + (gl && s.s !== 'off' ? '<button class="btn primary" data-vi="cab">Entrer dans le véhicule</button>' : '') + (gl ? '<button class="btn' + (F.isFollowing() ? ' follow-on' : '') + '" data-vi="follow" aria-pressed="' + F.isFollowing() + '">' + ico('focus') + (F.isFollowing() ? 'Arrêter de suivre' : 'Suivre le véhicule') + '</button>' : '') + '<button class="btn" data-vi="drv">Fiche chauffeur</button>' + (ROLES[st.role][1].includes('maintenance') ? '<button class="btn" data-vi="mnt">Maintenance</button>' : '') + '</div>';
    $$('[data-vi]', box).forEach((b) => b.addEventListener('click', () => { const k = b.dataset.vi; if (k === 'cab') { if (!$('.twin-slot')) { go('live'); setTimeout(() => enterCab(id), 120); } else enterCab(id); return; } if (k === 'follow') { if (F.isFollowing()) F.follow(null); else if (!F.follow(id)) toast('Ce véhicule n’est pas visible dans la scène (filtre ou hors ligne).'); vinfo(); } else if (k === 'drv') { st.drvSel = v.driver; go('drivers'); } else go('maintenance'); }));
  }

  /* ===== Centre de commande ===== */
  V.command = function (v) {
    v.innerHTML = '<div class="view"><div class="vhead"><div><h2>Centre de commande</h2><p id="per"></p></div>' + filters(true) + '</div>' +
      '<div class="hero"><div style="display:flex;flex-direction:column;gap:8px;min-width:0">' + statChips() + twin('tw1') + '</div><aside class="ov-side" id="side"></aside></div>' +
      '<div class="segs" id="segs"></div>' + kpiGroups() +
      '<div class="grid g2" style="margin-top:14px"><section class="panel"><h3>Revenus par segment</h3><div id="c1"></div></section><section class="panel"><h3>Missions par jour</h3><div id="c2"></div></section></div></div>';
    $('#per').textContent = 'Période : ' + range()[2] + '. Données de démonstration simulées ; véhicules, chauffeurs et montants fictifs.';
    bindFilters(v); bindStat(v); mountTwin('tw1'); side(); segCards(); charts(); dayPill();
  };
  V.command_live = () => { if (!st.sel) side(); segCards(); };
  function segCards() {
    const el = $('#segs'); if (!el) return; const t = tNow();
    el.innerHTML = E.SEGS.map((s) => { const V2 = D.V.filter((x) => x.seg === s.id), act = V2.filter((x) => ['mission', 'late'].includes(vStatus(x).s)).length, M = D.missions.filter((m) => m.d === TODAY && m.seg === s.id), done = M.filter((m) => E.mStatus(m, t) === 'done');
      const P = E.period(D, TODAY, TODAY, st.now, s.id), sp = []; for (let d = TODAY - 14; d < TODAY; d++) sp.push(E.period(D, d, d, st.now, s.id).n);
      return '<button class="segc" data-seg="' + s.id + '" aria-pressed="' + (st.seg === s.id) + '"><span class="n"><i style="background:' + SEGCOL[s.id] + '"></i>' + s.name + '</span><span class="sp">' + C.spark(sp, 96, 34, SEGCOL[s.id]) + '</span><span class="big">' + act + '<span class="sub"> / ' + V2.length + ' en mission</span></span><span class="sub">' + done.length + ' missions terminées aujourd’hui, ' + E.pct(done.length ? done.filter((m) => m.delay <= 15).length / done.length : null, 0) + ' à l’heure</span><span class="sub">' + (canFin() ? 'Revenu du jour : ' + E.k(P.rev) + ' FCFA' : 'Revenu masqué pour ce rôle') + '</span></button>'; }).join('');
    $$('[data-seg]', el).forEach((b) => b.addEventListener('click', () => { st.seg = st.seg === b.dataset.seg ? 'all' : b.dataset.seg; render(); }));
  }
  function side() {
    const el = $('#side'); if (!el) return;
    const feedHtml = '<section class="panel"><p class="q" style="display:flex;align-items:center;gap:8px">Fil des opérations <span class="tag sim">En direct, simulé</span></p><ul class="feed" id="feedL"></ul></section>';
    if (st.sel) { el.innerHTML = '<button class="linkish" id="bk">Revenir à la synthèse</button><div class="panel info" id="vinfo"></div>' + feedHtml; $('#bk').addEventListener('click', () => { pick(null); side(); }); vinfo(); feed(true); return; }
    const A = alertsLive().filter((a) => a.state !== 'resolved' && !a.live).sort((a, b) => ({ crit: 0, warn: 1, info: 2 }[a.sev] - { crit: 0, warn: 1, info: 2 }[b.sev])).slice(0, 3);
    const ans = E.compose('perf', E.INTENTS[0].agents.map((x) => E.runTask(x, 'perf', D, st.now)), D, st.now);
    el.innerHTML = '<section class="panel"><p class="q">Ce que voit l’orchestrateur</p><h3>' + esc(ans.head) + '</h3><ul style="margin:6px 0;padding-left:18px;font-size:13px">' + ans.factors.slice(1).map((x) => '<li>' + (canFin() || !/FCFA|marge/.test(x) ? esc(x) : 'Indicateur financier masqué pour ce rôle.') + '</li>').join('') + '</ul><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="tag ai">Analyse IA (règles)</span>' + (ROLES[st.role][1].includes('ai') ? '<button class="linkish" id="toAi">Ouvrir le centre IA</button>' : '') + '</div></section>' + feedHtml +
      '<section class="panel"><p class="q">Alertes prioritaires</p><ul class="found">' + A.map((a) => '<li>' + sev(a.sev) + '<span class="t">' + esc(a.title) + '</span><span class="a"><button class="linkish" data-al="' + a.id + '">Traiter</button>' + (a.veh ? '<button class="linkish" data-v="' + a.veh + '">Voir le véhicule</button>' : '') + '</span></li>').join('') + '</ul></section>';
    if ($('#toAi')) $('#toAi').addEventListener('click', () => go('ai'));
    $$('[data-al]', el).forEach((b) => b.addEventListener('click', () => alertDlg(ALERTS.find((a) => a.id === b.dataset.al))));
    $$('[data-v]', el).forEach((b) => b.addEventListener('click', () => { pick('veh:' + b.dataset.v); side(); if (gl) F.focus('veh:' + b.dataset.v); }));
    feed(true);
  }
  /* fil des opérations : départs, livraisons, alertes des 90 dernières minutes simulées */
  let feedTop = null;
  function feed(force) {
    const el = $('#feedL'); if (!el) return; const t = tNow(), L = [];
    D.missions.filter((m) => m.d === TODAY && (st.seg === 'all' || m.seg === st.seg)).forEach((m) => { const end = m.start + m.dur + m.delay;
      const amt = canFin() ? ' (' + E.fcfa(Math.round(m.rev / 50) * 50) + ')' : '';
      if (m.start <= t && m.start > t - 90) L.push({ at: m.start, c: 'mission', x: m.veh + ' part de ' + m.from + ' vers ' + m.to + (canFin() ? ', montant prévu ' + E.fcfa(Math.round(m.rev / 50) * 50) : '') });
      if (end <= t && end > t - 90) L.push({ at: end, c: m.delay > 15 ? 'late' : 'avail', x: m.veh + (m.key === 'vtc' ? ' termine une course' : ' livre ' + m.id) + ' à ' + m.to + amt + (m.delay > 15 ? ', ' + f(m.delay) + ' min de retard' : '') }); });
    ALERTS.filter((a) => a.at <= t && a.at > t - 180).forEach((a) => L.push({ at: a.at, c: a.sev === 'crit' ? 'crit' : 'late', x: 'Alerte : ' + a.title }));
    L.sort((p, q) => q.at - p.at); const top = L[0] ? L[0].at + L[0].x : '';
    if (!force && top === feedTop) return; const prev = feedTop; feedTop = top;
    el.innerHTML = L.slice(0, 14).map((e, i) => '<li class="' + (prev && i < 2 && !force ? 'new' : '') + '"><time>' + E.hhmm(e.at % 1440) + '</time><i style="background:' + SCOL[e.c] + '"></i><span>' + esc(e.x) + '</span></li>').join('') || '<li><span></span><span></span><span class="m">Aucun mouvement dans les 90 dernières minutes.</span></li>';
  }
  function dayPill() {
    const h = st.now / 60, n = h < 6 || h >= 19; const lbl = h < 5.5 ? 'Nuit' : h < 7 ? 'Aube' : h < 17.5 ? 'Jour' : h < 19.2 ? 'Crépuscule' : 'Nuit';
    $$('[data-day]').forEach((el) => { el.className = 'daypill' + (n ? ' night' : ''); el.innerHTML = '<span class="sun"></span><b>' + E.hhmm(st.now) + '</b><span class="m">' + lbl + ', heure simulée</span>'; });
  }
  /* itinéraire de la mission du véhicule sélectionné */
  function routeSync() {
    const v = st.sel && st.sel.startsWith('veh:') ? D.V.find((x) => x.id === st.sel.slice(4)) : null; const m = v ? vStatus(v).m : null; const key = m ? m.id : null;
    if (key === st._routeM) return; st._routeM = key; F.showRoute(m ? E.pathPts(m.from, m.to).map((p, i, A) => { const q = E.sample(A, i / Math.max(1, A.length - 1), 2); return { x: q.x, z: q.z }; }) : null);
  }
  /* ---------- poste de conduite ---------- */
  const SPD = { car: 34, moto: 29, van: 31, truck: 26, mover: 24 };
  const loadT = (m) => { const v = D.V.find((x) => x.id === m.veh); return ({ van: 1.5, truck: 10, mover: 8 }[v.cat] || 0) * (0.55 + ((m.id.charCodeAt(7) * 7) % 40) / 100); };
  const SKINS = ['#5c3a21', '#8d5524', '#a86b3c', '#c68642', '#e0ac69', '#f1c27d', '#ffdbac'];
  const SLEEVE = { car: 0x2b3a55, moto: 0xe8553a, van: 0x3fb8af, truck: 0x5b8def, mover: 0xf28c38 };
  function drvLook(v) { const n = parseInt(v.driver.slice(3), 10) || 0, alien = n % 9 === 4; return { alien, skin: alien ? '#8ee06b' : SKINS[(n * 3) % SKINS.length], sleeve: SLEEVE[v.cat] }; }
  function enterCab(id) {
    if (!gl) return; const vid = id.slice(4); pick(id); const sl = $('.twin-slot'); if (sl) { sl.classList.add('cabfull'); F.resize(); }
    if (!F.enter(vid, (ph) => { const slot = $('.twin-slot'); if (!slot) return; if (ph === 'roof') { slot.classList.add('roofflash'); setTimeout(() => slot.classList.remove('roofflash'), 700); } if (ph === 'inside') cabHud(true); }, drvLook(D.V.find((x) => x.id === vid)))) { toast('Ce véhicule n’est pas visible dans la scène (filtre ou hors ligne).'); if (sl) { sl.classList.remove('cabfull'); F.resize(); } return; }
    journal('Vous', 'Vue conducteur : ' + vid); cabHud(true);
  }
  function exitCab() { const sl = $('.twin-slot.cabfull'); if (sl) { sl.classList.remove('cabfull'); F.resize(); } F.exit(); const c = $('#cab'); if (c) c.innerHTML = ''; if ($('#vinfo')) vinfo(); }
  document.addEventListener('keydown', (e) => { if (e.key !== 'Escape' || !gl || $('#dlg').open) return; if (F.inCab()) exitCab(); else if (F.inHQ()) { if (F.hqFocused()) { F.hqOverview(); hqHud(true); } else exitHQ(); } });
  function cabHud(full) {
    const box = $('#cab'); if (!box || !gl) return; const vid = F.inCab(); if (!vid) { box.innerHTML = ''; return; }
    const v = D.V.find((x) => x.id === vid), s = vStatus(v), dr = D.DR.find((d) => d.id === v.driver), t = tNow(), h = hashOf(v), m = s.m;
    const pos = vehPos(v, s), spd = m ? Math.max(0, Math.round((s.s === 'late' ? 12 : SPD[v.cat]) + 6 * Math.sin(st.now * 0.9 + h))) : 0;
    const done = D.missions.filter((x) => x.veh === v.id && x.d === TODAY && E.mStatus(x, t) === 'done'), next = D.missions.find((x) => x.veh === v.id && x.d === TODAY && x.start > t);
    const r50 = (x) => Math.round(x / 50) * 50, rev = done.reduce((a2, x) => a2 + r50(x.rev), 0), km = done.reduce((a2, x) => a2 + x.km, 0) + (m ? m.km * E.clamp((t - m.start) / (m.dur + m.delay), 0, 1) : 0), fuelL = (km * v.ref) / 100;
    const ot = done.length ? done.filter((x) => x.delay <= 15).length / done.length : null, cm = (x) => (canFin() ? E.fcfa(x) : '•••');
    const cell = (l, val, u) => '<div class="dc"><span>' + l + '</span><b>' + val + (u ? '<small>' + u + '</small>' : '') + '</b></div>';
    let title, cells;
    if (v.cat === 'car') { title = 'Tableau de bord du jour, VTC / Yango'; cells = [cell('Courses', done.length), cell('Revenu brut', cm(rev)), cell('Commission plateforme', cm(r50(rev * E.cfg.commission)), '18 % (hyp.)'), cell('Part chauffeur', cm(r50(rev * E.cfg.driverShare.vtc)), '35 % (hyp.)'), cell('Net société avant frais', cm(r50(rev * (1 - E.cfg.commission - E.cfg.driverShare.vtc) - fuelL * E.cfg.fuel.super))), cell('Distance', f(km, 1), 'km'), cell('Carburant estimé', f(fuelL, 1), 'L'), cell('En service depuis', E.hhmm(6 * 60), Math.max(0, Math.floor(st.now / 60 - 6)) + ' h')]; }
    else if (v.cat === 'moto') { title = 'Tableau de bord du jour, livraison moto'; cells = [cell('Livraisons', done.length), cell('À l’heure', E.pct(ot, 0)), cell('Revenu', cm(rev)), cell('Revenu par livraison', cm(done.length ? r50(rev / done.length) : 0)), cell('Durée moyenne', f(done.reduce((a2, x) => a2 + x.dur + x.delay, 0) / Math.max(1, done.length)), 'min'), cell('Retards (> 15 min)', done.filter((x) => x.delay > 15).length), cell('Distance', f(km, 1), 'km'), cell('Carburant estimé', f(fuelL, 1), 'L')]; }
    else if (v.cat === 'van' || v.cat === 'truck') { const cap = v.cat === 'van' ? 1.5 : 10, tons = done.reduce((a2, x) => a2 + loadT(x), 0); title = 'Tableau de bord du jour, ' + (v.cat === 'van' ? 'fourgonnette' : 'camion'); cells = [cell('Livraisons', done.length), cell('Tonnage livré', f(tons, 1), 't'), cell('Remplissage moyen', E.pct(done.length ? tons / (done.length * cap) : null, 0), 'capacité ' + cap + ' t'), cell('Charge actuelle', m ? f(loadT(m), 1) : '0', 't'), cell('Revenu', cm(rev)), cell('Distance', f(km, 1), 'km'), cell('Carburant estimé', f(fuelL, 1), 'L'), cell('Coût carburant / km', canFin() && km ? f((fuelL * E.cfg.fuel.gasoil) / km) : '•••', 'FCFA')]; }
    else { const mv = D.moving.find((x) => x.veh === v.id && x.d === TODAY); const prog = m ? E.clamp((t - m.start) / (m.dur + m.delay), 0, 1) : 0; title = 'Tableau de bord du jour, déménagement';
      cells = mv ? [cell('Client', esc(mv.client)), cell('Volume', mv.vol, 'm³'), cell('Équipe', esc(mv.team.join(', '))), cell('Étape', m ? (prog < 0.3 ? 'Chargement' : prog < 0.75 ? 'Transport' : 'Déchargement') : t < mv.start ? 'À venir' : 'Terminé'), cell('Devis estimé', cm(mv.est)), cell('Prix facturé', cm(mv.price)), cell('Paiement', esc(mv.invoice)), cell('Distance', f(km, 1), 'km')] : [cell('Déménagement du jour', 'Aucun'), cell('Distance', f(km, 1), 'km')]; }
    const prog = m ? E.clamp((t - m.start) / (m.dur + m.delay), 0, 1) : 0, smp = m ? E.sample(E.pathPts(m.from, m.to), prog, 2) : null, eta = m ? m.start + m.dur + m.delay : null;
    const label = v.cat === 'car' ? 'Course' : v.cat === 'moto' ? 'Commande' : v.cat === 'mover' ? 'Déménagement' : 'Livraison';
    const course = m ? '<div class="ck"><span>' + label + ' en cours</span><b>' + m.id + '</b></div><div class="route"><span>' + m.from + '</span><i style="--p:' + Math.round(prog * 100) + '%"></i><span>' + m.to + '</span></div>' +
      '<div class="cgrid">' + cell('Montant de la ' + (v.cat === 'car' ? 'course' : 'mission'), cm(r50(m.rev))) + cell('Arrivée estimée', E.hhmm(eta % 1440), s.s === 'late' ? '+' + f(m.delay) + ' min' : 'à l’heure') + cell('Distance restante', f(m.km * (1 - prog), 1), 'km') + cell('Progression', Math.round(prog * 100) + ' %') + (v.cat === 'van' || v.cat === 'truck' ? cell('Charge', f(loadT(m), 1), 't') : '') + '</div>'
      : '<div class="ck"><span>' + label + ' en cours</span><b>Aucune</b></div><p class="m" style="margin:6px 0 0;font-size:13px">' + (s.s === 'off' ? esc(s.why) : 'En attente ' + (lastZone(v) ? 'à ' + lastZone(v) : 'à la plateforme logistique') + '.') + (next ? ' Prochaine : ' + next.id + ' à ' + E.hhmm(next.start % 1440) + ', ' + next.from + ' → ' + next.to + (canFin() ? ', ' + E.fcfa(r50(next.rev)) : '') + '.' : '') + '</p>' + (done.length ? '<p class="m" style="margin:4px 0 0;font-size:13px">Dernière : ' + done[done.length - 1].to + ', ' + cm(r50(done[done.length - 1].rev)) + '.</p>' : '');
    const route = m ? E.pathPts(m.from, m.to) : null;
    if (full || !box.querySelector('.cside')) {
      const look = drvLook(v);
      box.innerHTML = '<div class="flash"></div><div class="cabtop"><span class="who"><b>' + v.id + '</b> ' + E.CATS[v.cat] + ', ' + esc(dr.name) + '</span><span class="tag sim">Vue conducteur simulée</span>' + (look.alien ? '<span class="tag alien">Chauffeur venu d’ailleurs (clin d’œil, fictif)</span>' : '') + '<button class="btn" id="cabDay" aria-expanded="false">Journée</button><button class="btn primary" id="cabExit">Sortir du véhicule <kbd>Échap</kbd></button></div><div class="mini" id="cabMini"></div>' +
        '<section class="cside l" aria-label="Mission en cours"><div class="chd"><span id="cabSt"></span><span class="m" id="cabClk"></span></div><div id="cabCourse"></div></section>' +
        '<section class="cside r" aria-label="' + esc(title) + '"><div class="dt">' + title + '</div><div class="dgrid" id="cabDaily"></div></section>';
      $('#cabExit').addEventListener('click', exitCab);
      $('#cabDay').addEventListener('click', (e) => { const on = box.classList.toggle('showday'); e.currentTarget.setAttribute('aria-expanded', on); });
    }
    $('#cabSt').innerHTML = pill(s.s, s.label); $('#cabClk').textContent = E.hhmm(st.now) + ', ' + spd + ' km/h, ' + (pos.moving ? 'en circulation' : 'à l’arrêt');
    $('#cabCourse').innerHTML = course; $('#cabDaily').innerHTML = cells.join('');
    const SC = { avail: ['Libre', '#2fd08a'], mission: ['En course', '#4c8dff'], late: ['En retard', '#ff8a3d'], crit: ['Critique', '#ff4d5e'], off: ['Hors ligne', '#9aa4b1'] }[s.s] || [s.label, '#2fd08a'];
    F.cabScreen && F.cabScreen({ speed: spd, stLabel: SC[0], stCol: SC[1], label: m ? label + ' ' + m.id : (next ? 'Prochaine : ' + next.id : 'Aucune mission'), fare: m ? (canFin() ? E.fcfa(r50(m.rev)) : 'Montant masqué') : (next && canFin() ? E.fcfa(r50(next.rev)) : '—'),
      line2: m ? 'Arrivée ' + E.hhmm(eta % 1440) + (s.s === 'late' ? ', +' + f(m.delay) + ' min' : '') : next ? 'Départ ' + E.hhmm(next.start % 1440) : 'En attente', line3: m ? f(m.km * (1 - prog), 1) + ' km restants' : '', prog, route: m ? m.from + ' → ' + m.to : next ? next.from + ' → ' + next.to : '' });
    $('#cabMini').innerHTML = gridSvg({ w: 220, h: 150, pad: 8, mini: true, me: v.id, route, layers: { zones: true, veh: true } });
  }

  /* ---------- plateforme logistique : vue intérieure et agents ---------- */
  const AGCOL = { fleet: '#3fb8af', route: '#5b8def', maint: '#f28c38', finance: '#8fcf5a', driver: '#ef6f8f', delivery: '#e8553a', fuel: '#f4c542', bi: '#8070f0' };
  const openOf = (id) => alertsLive().filter((a) => a.agent === id && a.state !== 'resolved');
  function agentInfo() {
    const t = tNow(), S = D.V.map((v) => vStatus(v).s), cnt = (k) => S.filter((x) => x === k).length, today = D.missions.filter((m) => m.d === TODAY);
    const run = today.filter((m) => ['run', 'late'].includes(E.mStatus(m, t))).length, todo = today.filter((m) => m.start > t).length, done = today.filter((m) => E.mStatus(m, t) === 'done'), rev = done.reduce((a, m) => a + m.rev, 0);
    const bySeg = {}; done.forEach((m) => (bySeg[m.seg] = (bySeg[m.seg] || 0) + m.rev)); const sv = Object.values(bySeg), mx = Math.max(1, ...sv);
    const task = { fleet: 'Suit ' + (cnt('mission') + cnt('late')) + ' véhicules en mission, ' + cnt('avail') + ' disponibles', route: 'Optimise ' + run + ' itinéraires en cours', maint: 'Analyse le kilométrage de ' + D.V.length + ' véhicules',
      finance: canFin() ? 'Consolide ' + E.fcfa(Math.round(rev / 50) * 50) + ' de revenus du jour' : 'Consolide les revenus du jour', driver: 'Évalue la ponctualité de ' + D.DR.length + ' chauffeurs', delivery: 'Prépare l’affectation de ' + todo + ' missions à venir',
      fuel: 'Contrôle la consommation de ' + (D.V.length - cnt('off')) + ' véhicules', bi: 'Prépare le point de ' + E.hhmm(st.now) };
    const o = { __bars: sv.slice(0, 4).map((x) => x / mx) }; Object.keys(task).forEach((id) => (o[id] = { task: task[id], alert: openOf(id).length > 0 })); return o;
  }
  function enterHQ() {
    if (!gl || F.inCab() || F.inHQ()) return; const sl = $('.twin-slot'); if (sl) { sl.classList.add('cabfull'); F.resize(); } F.hqSetInfo(agentInfo());
    F.enterHQ((ph) => { const slot = $('.twin-slot'); if (!slot) return; if (ph === 'flash') { hqHud(true); slot.classList.add('roofflash'); setTimeout(() => slot.classList.remove('roofflash'), 700); } if (ph === 'inside') { F.setTime(st.now); hqHud(true); clearInterval(st._hqT); st._hqT = setInterval(() => { if (F.inHQ()) hqHud(false); else clearInterval(st._hqT); }, 1000); } });
    journal('Vous', 'Visite de la plateforme logistique');
  }
  function exitHQ() { clearInterval(st._hqT); F.exitHQ(); F.setTime(st.now); const sl = $('.twin-slot.cabfull'); if (sl) { sl.classList.remove('cabfull'); F.resize(); } const h = $('#hq'); if (h) h.innerHTML = ''; }
  function hqFocus(id) { if (!F.hqFocus(id)) return; hqHud(true); if (id.startsWith('agent:')) alog(id.slice(6), 'Consulté en face à face par un humain'); }
  const robo = (c) => '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19" fill="' + c + '"/><rect x="9" y="12" width="22" height="16" rx="7" fill="#f6f1e4"/><rect x="12" y="15" width="16" height="10" rx="5" fill="#1b2532"/><rect x="15" y="17" width="3" height="6" rx="1.5" fill="#bff6ff"/><rect x="22" y="17" width="3" height="6" rx="1.5" fill="#bff6ff"/><path d="M20 12V6" stroke="#2e3138" stroke-width="1.6"/><circle cx="20" cy="5" r="2.2" fill="#fff"/></svg>';
  function hqHud(full) {
    const box = $('#hq'); if (!box || !gl) return; if (!F.inHQ() && !$('.in-hq-anim')) { box.innerHTML = ''; return; }
    const info = agentInfo(); F.hqSetInfo(info); const foc = F.hqFocused();
    if (full || !box.querySelector('.hqtop') || box.dataset.foc !== String(foc)) {
      box.dataset.foc = String(foc);
      let talk = '';
      if (foc && foc.startsWith('agent:')) {
        const id = foc.slice(6), a = E.agent(id), op = openOf(id), lg = (st.agentLog[id] || []).slice(0, 3);
        talk = '<section class="hqtalk" aria-label="' + esc(a.name) + '" style="--ag:' + AGCOL[id] + '"><div class="th">' + robo(AGCOL[id]) + '<div><h3>' + esc(a.name) + '</h3><p class="m">' + esc(a.role) + '</p></div></div>' +
          '<div class="now"><span>En ce moment</span><b id="hqNow"></b></div><p class="m src">Données utilisées : ' + esc(a.data.join(', ')) + '. Agent à base de règles, aucun modèle de langage connecté.</p>' +
          (op.length ? '<div class="dos"><div class="dt">' + (op.length > 1 ? op.length + ' dossiers attendent votre décision' : 'Un dossier attend votre décision') + '</div>' + op.slice(0, 3).map((x) => '<div class="di">' + sev(x.sev) + '<div><b>' + esc(x.title) + '</b><p>' + esc(x.action) + '</p><span class="m">' + (x.state === 'ack' ? 'Pris en charge, à résoudre' : 'Nouveau') + '</span></div><button class="btn primary" data-al="' + x.id + '">Examiner et statuer</button></div>').join('') + '</div>'
            : '<div class="dos none"><b>Aucun dossier en attente de votre décision.</b>' + (lg.length ? '<ul class="log">' + lg.map((l) => '<li><time>' + l.t + '</time><span>' + esc(l.x) + '</span></li>').join('') + '</ul>' : '') + '</div>') +
          '<div class="tf"><button class="btn" data-hq="over">Vue d’ensemble</button><button class="btn" data-hq="ai">Lui confier une analyse</button></div></section>';
      } else if (foc === 'core') {
        const all = alertsLive().filter((a) => a.state !== 'resolved');
        talk = '<section class="hqtalk" aria-label="Orchestrateur" style="--ag:#ffd23f"><div class="th">' + robo('#ffd23f') + '<div><h3>Orchestrateur</h3><p class="m">Reçoit les demandes, choisit les agents compétents et assemble leurs réponses. Routage par règles, simulé.</p></div></div>' +
          '<div class="dos"><div class="dt">Dossiers ouverts par agent</div><div class="ogrid">' + E.AGENTS.map((a) => { const n = all.filter((x) => x.agent === a.id).length; return '<button class="og" data-go="' + a.id + '"><i style="background:' + AGCOL[a.id] + '"></i><span>' + esc(a.name) + '</span><b>' + n + '</b></button>'; }).join('') + '</div></div>' +
          (st.journal.length ? '<ul class="log">' + st.journal.slice(0, 4).map((l) => '<li><time>' + l.t + '</time><span>' + esc(l.w + ' : ' + l.x) + '</span></li>').join('') + '</ul>' : '') +
          '<div class="tf"><button class="btn" data-hq="over">Vue d’ensemble</button><button class="btn primary" data-hq="aicenter">Ouvrir le centre IA</button></div></section>';
      }
      box.innerHTML = '<div class="flash"></div><div class="hqtop"><span class="who"><b>Plateforme logistique</b> vue intérieure</span><span class="tag sim">Agents et déplacements simulés</span>' + (foc ? '<button class="btn" data-hq="over">Vue d’ensemble</button>' : '') + '<button class="btn primary" data-hq="exit">Retour à la ville <kbd>Échap</kbd></button></div>' +
        '<section class="hqroster' + (foc ? ' mini' : '') + '" aria-label="Agents présents"><div class="dt">Agents IA sur place</div><ul id="hqList"></ul><p class="m">Cliquez un agent pour le rejoindre ; le point d’exclamation signale un dossier à statuer.</p></section>' + talk;
      $$('[data-hq]', box).forEach((b) => b.addEventListener('click', () => { const k = b.dataset.hq; if (k === 'exit') exitHQ(); else if (k === 'over') { F.hqOverview(); hqHud(true); } else if (k === 'ai' || k === 'aicenter') { const ag = foc && foc.startsWith('agent:') ? foc.slice(6) : null; exitHQ(); if (ag) st.agentSel = ag; go('ai'); } }));
      $$('[data-al]', box).forEach((b) => b.addEventListener('click', () => alertDlg(ALERTS.find((a) => a.id === b.dataset.al))));
      $$('[data-go]', box).forEach((b) => b.addEventListener('click', () => hqFocus('agent:' + b.dataset.go)));
    }
    const ul = $('#hqList'); if (ul) { ul.innerHTML = E.AGENTS.map((a) => '<li><button data-ag="' + a.id + '" aria-current="' + (foc === 'agent:' + a.id) + '"><i style="background:' + AGCOL[a.id] + '"></i><span><b>' + esc(a.name) + '</b><em>' + esc(F.hqActivity(a.id)) + '</em></span>' + (info[a.id].alert ? '<strong class="qm" title="Dossier à statuer">!</strong>' : '') + '</button></li>').join(''); $$('[data-ag]', ul).forEach((b) => b.addEventListener('click', () => hqFocus('agent:' + b.dataset.ag))); }
    const nw = $('#hqNow'); if (nw && foc) nw.textContent = foc.startsWith('agent:') ? info[foc.slice(6)].task : '';
  }
  function hover(id, x, y) {
    const tip = $('#hovertip'); if (!id || id.startsWith('room:') || (id === 'depot' && false)) { tip.style.display = 'none'; return; }
    if (id === 'depot') { tip.innerHTML = '<b>Plateforme logistique</b>Cliquez pour entrer : garage, dispatch, bureaux et agents IA'; tip.style.display = 'block'; tip.style.left = Math.min(innerWidth - 270, x + 14) + 'px'; tip.style.top = y + 14 + 'px'; return; }
    if (id.startsWith('agent:') || id === 'core') { const ag = id === 'core' ? null : E.agent(id.slice(6)); tip.innerHTML = '<b>' + (ag ? esc(ag.name) : 'Orchestrateur') + '</b>' + (ag ? esc(F.hqActivity(ag.id)) : 'Coordonne les 8 agents') + '<br><span class="m">Cliquez pour le rejoindre</span>'; tip.style.display = 'block'; tip.style.left = Math.min(innerWidth - 270, x + 14) + 'px'; tip.style.top = y + 14 + 'px'; return; }
    let h;
    if (id.startsWith('veh:')) { const v = D.V.find((q) => q.id === id.slice(4)), s = vStatus(v); h = '<b>' + v.id + '</b>' + E.CATS[v.cat] + ', ' + esc(D.DR.find((d) => d.id === v.driver).name) + '<br><span class="s-' + s.s + '">' + s.label + '</span>' + (s.m ? ', ' + s.m.from + ' → ' + s.m.to + (canFin() ? '<br>Montant de la course : ' + E.fcfa(Math.round(s.m.rev / 50) * 50) : '') : ''); }
    else { const z = id.slice(5), n = D.missions.filter((m) => m.d === TODAY && ['run', 'late'].includes(E.mStatus(m, tNow())) && (m.to === z || m.from === z)).length; h = '<b>' + z + '</b>' + n + ' mission(s) en cours vers ou depuis la zone'; }
    tip.innerHTML = h; tip.style.display = 'block'; tip.style.left = Math.min(innerWidth - 270, x + 14) + 'px'; tip.style.top = y + 14 + 'px';
  }
  function charts() {
    const [a, b] = range(), days = []; for (let d = a; d <= b; d++) days.push(d);
    if (canFin()) C.stack($('#c1'), { keys: E.SEGS.filter((s) => st.seg === 'all' || s.id === st.seg).map((s) => ({ k: s.id, name: s.short, color: SEGCOL[s.id] })), rows: days.map((d) => { const P = E.period(D, d, d, st.now); const v2 = {}; E.SEGS.forEach((s) => (v2[s.id] = P.bySeg[s.id].rev / 1000)); return { label: E.dayLabel(d), full: E.dayLabel(d, true), v: v2 }; }), unit: 'k FCFA', height: 220, every: Math.ceil(days.length / 8) });
    else $('#c1').innerHTML = '<p class="m">Données financières masquées pour le rôle « ' + ROLES[st.role][0] + ' ».</p>';
    C.stack($('#c2'), { keys: E.SEGS.filter((s) => st.seg === 'all' || s.id === st.seg).map((s) => ({ k: s.id, name: s.short, color: SEGCOL[s.id] })), rows: days.map((d) => { const P = E.period(D, d, d, st.now); const v2 = {}; E.SEGS.forEach((s) => (v2[s.id] = P.bySeg[s.id].n)); return { label: E.dayLabel(d), full: E.dayLabel(d, true), v: v2 }; }), unit: 'missions', height: 220, every: Math.ceil(days.length / 8) });
  }

  /* ===== Flotte en direct ===== */
  V.live = function (v) {
    v.innerHTML = '<div class="view"><div class="vhead"><div><h2>Flotte en direct</h2><p>Statut de chaque véhicule. Positions simulées sur un plan schématique des communes d’Abidjan : ce n’est pas une carte géographique. L’intégration d’un fournisseur cartographique (Mapbox ou équivalent) est prévue mais non connectée.</p></div></div>' +
      '<div class="tabs" role="tablist"><button role="tab" data-tab="3d" aria-selected="' + (st.liveTab === '3d') + '">Vue 3D</button><button role="tab" data-tab="plan" aria-selected="' + (st.liveTab === 'plan') + '">Plan opérationnel</button></div>' +
      '<div class="filters">' + statChips() + '<div class="chipf">' + [['all', 'Tous les segments']].concat(E.SEGS.map((s) => [s.id, s.short])).map(([k, l]) => '<button data-sg="' + k + '" aria-pressed="' + (st.seg === k) + '">' + l + '</button>').join('') + '</div></div>' +
      '<div class="twin-page" style="grid-template-columns:minmax(0,1fr) 380px;height:auto"><div>' + (st.liveTab === '3d' ? twin('tw2') : '<section class="panel plan"><div class="chipf" style="margin-bottom:8px">' + [['zones', 'Zones'], ['veh', 'Véhicules'], ['pick', 'Points de prise en charge'], ['drop', 'Points de livraison'], ['routes', 'Trajets actifs'], ['heat', 'Concentration']].map(([k, l]) => '<button data-ly="' + k + '" aria-pressed="' + st.layers[k] + '">' + l + '</button>').join('') + '</div><div id="plan"></div></section>') + '</div><div class="panel info" id="vinfo"></div></div>' +
      '<section class="panel tablewrap" style="margin-top:14px"><h3>Véhicules</h3><table><thead><tr><th>Véhicule</th><th>Catégorie</th><th>Chauffeur</th><th>Statut</th><th>Mission</th><th>Position (simulée)</th><th class="r">Montant course</th><th class="r">Carburant</th><th>Maintenance</th></tr></thead><tbody id="vtab"></tbody></table></section></div>';
    $$('[data-tab]', v).forEach((b) => b.addEventListener('click', () => { st.liveTab = b.dataset.tab; render(); }));
    $$('[data-sg]', v).forEach((b) => b.addEventListener('click', () => { st.seg = b.dataset.sg; render(); }));
    $$('[data-ly]', v).forEach((b) => b.addEventListener('click', () => { st.layers[b.dataset.ly] = !st.layers[b.dataset.ly]; b.setAttribute('aria-pressed', st.layers[b.dataset.ly]); plan(); }));
    bindStat(v); if (st.liveTab === '3d') mountTwin('tw2'); vinfo(); V.live_live();
  };
  V.live_live = function () {
    const t = $('#vtab'); if (!t) return; const mp = E.maintPlan(D, st.now);
    t.innerHTML = D.V.filter((v) => (st.seg === 'all' || v.seg === st.seg)).map((v) => [v, vStatus(v)]).filter(([, s]) => st.stat === 'all' || s.s === st.stat).map(([v, s]) => { const m = mp.find((x) => x.v.id === v.id);
      return '<tr class="click" data-v="' + v.id + '" tabindex="0" aria-selected="' + (st.sel === 'veh:' + v.id) + '"><td class="num">' + v.id + '</td><td class="m">' + E.CATS[v.cat] + '</td><td>' + esc(D.DR.find((x) => x.id === v.driver).name) + '</td><td>' + pill(s.s, s.label) + '</td><td class="num">' + (s.m ? s.m.id : '—') + '</td><td>' + esc(s.m ? s.m.from + ' → ' + s.m.to : s.s === 'off' ? 'Dépôt' : lastZone(v) || 'Dépôt') + '</td><td class="r num">' + (s.m ? (canFin() ? f(r50(s.m.rev)) + ' FCFA' : '•••') : '—') + '</td><td class="r num">' + (s.s === 'off' ? 'NA' : f(E.fuelLevel(v, st.now) * 100) + ' %') + '</td><td>' + (m.left < 0 ? pill('crit', 'Dépassée') : m.state === 'soon' ? pill('warn', 'Bientôt') : pill('ok', 'À jour')) + '</td></tr>'; }).join('');
    $$('tr[data-v]', t).forEach((r) => { const p = () => { pick('veh:' + r.dataset.v); if (gl && st.liveTab === '3d') F.focus('veh:' + r.dataset.v); }; r.addEventListener('click', p); r.addEventListener('keydown', (e) => { if (e.key === 'Enter') p(); }); });
    plan();
  };
  /* plan en quadrillage (SVG), partagé par le plan opérationnel et la mini-carte du poste de conduite */
  function gridSvg(o) {
    const W = o.w, H = o.h, mx = o.pad || 26, sx = (W - 2 * mx) / 204, sz = (H - 2 * mx) / 136, X = (x) => mx + (x + 102) * sx, Z = (z) => mx + (z + 68) * sz, t = tNow(), Gd = E.GRID;
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="' + (o.mini ? 'Mini-carte' : 'Plan schématique des opérations') + '"><rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#14181d"/>';
    s += '<rect x="0" y="' + Z(4) + '" width="' + W + '" height="' + (Z(30) - Z(4)) + '" fill="#123241"/>';
    for (let r = 0; r < Gd.rows; r++) s += '<line x1="0" x2="' + W + '" y1="' + Z((r - 2) * 34) + '" y2="' + Z((r - 2) * 34) + '" stroke="#2c333d" stroke-width="' + (o.mini ? 2.5 : 5) + '"/>';
    for (let c = 0; c < Gd.cols; c++) { const x = X((c - 3) * 34); s += '<line x1="' + x + '" x2="' + x + '" y1="0" y2="' + Z(0) + '" stroke="#2c333d" stroke-width="' + (o.mini ? 2.5 : 5) + '"/><line x1="' + x + '" x2="' + x + '" y1="' + Z(34) + '" y2="' + H + '" stroke="#2c333d" stroke-width="' + (o.mini ? 2.5 : 5) + '"/>'; if (Gd.bridges.includes(c)) s += '<line x1="' + x + '" x2="' + x + '" y1="' + Z(0) + '" y2="' + Z(34) + '" stroke="#4a5360" stroke-width="' + (o.mini ? 2.5 : 5) + '"/>'; }
    const M = D.missions.filter((m) => m.d === TODAY && ['run', 'late'].includes(E.mStatus(m, t)) && (st.seg === 'all' || m.seg === st.seg)), L = o.layers || {};
    if (L.heat) Object.keys(Gd.zones).forEach((z) => { const n = M.filter((m) => m.to === z || m.from === z).length, p = E.node(...Gd.zones[z]); if (n) s += '<circle cx="' + X(p.x) + '" cy="' + Z(p.z) + '" r="' + (8 + n * 2) + '" fill="#ffd23f" opacity="' + Math.min(0.3, 0.05 + n * 0.02) + '"/>'; });
    if (L.routes) M.forEach((m) => { s += '<polyline points="' + E.pathPts(m.from, m.to).map((p) => X(p.x) + ',' + Z(p.z)).join(' ') + '" fill="none" stroke="' + (E.mStatus(m, t) === 'late' ? '#ff8a3d' : '#3a4a60') + '" stroke-width="1.6" opacity=".8"/>'; });
    if (o.route) s += '<polyline points="' + o.route.map((p) => X(p.x) + ',' + Z(p.z)).join(' ') + '" fill="none" stroke="#ffd23f" stroke-width="' + (o.mini ? 2 : 3) + '" stroke-dasharray="5 4"/>';
    if (L.zones !== false) Object.keys(Gd.zones).forEach((z) => { const p = E.node(...Gd.zones[z]); s += '<rect x="' + (X(p.x) - 4) + '" y="' + (Z(p.z) - 4) + '" width="8" height="8" fill="none" stroke="#ffd23f"/>' + (o.mini ? '' : '<text x="' + (X(p.x) + 8) + '" y="' + (Z(p.z) - 8) + '" fill="#a9b3bf" font-size="12">' + z + '</text>'); });
    if (L.pick) M.forEach((m) => { const p = E.node(...Gd.zones[m.from]); s += '<rect x="' + (X(p.x) - 3) + '" y="' + (Z(p.z) + 7) + '" width="6" height="6" fill="#2fd08a"><title>Prise en charge ' + m.id + '</title></rect>'; });
    if (L.drop) M.forEach((m) => { const p = E.node(...Gd.zones[m.to]); s += '<path d="M' + X(p.x) + ',' + (Z(p.z) + 7) + ' l4,7 l-8,0z" fill="#cf4f97"><title>Livraison ' + m.id + '</title></path>'; });
    s += '<rect x="' + X(37) + '" y="' + Z(-63) + '" width="' + 26 * sx + '" height="' + 26 * sz + '" fill="none" stroke="#ffd23f" stroke-dasharray="3 3"/>' + (o.mini ? '' : '<text x="' + X(37) + '" y="' + (Z(-63) - 5) + '" fill="#727e8c" font-size="11">Plateforme logistique</text>');
    if (L.veh !== false) D.V.forEach((v) => { const ss = vStatus(v); if (!(st.seg === 'all' || v.seg === st.seg) || !(st.stat === 'all' || ss.s === st.stat)) return; const p = vehPos(v, ss), me = o.me === v.id;
      s += '<circle data-v="' + v.id + '" cx="' + X(p.x).toFixed(1) + '" cy="' + Z(p.z).toFixed(1) + '" r="' + (me ? (o.mini ? 5 : 7) : o.mini ? 2.6 : 4.5) + '" fill="' + (me ? '#ffd23f' : SCOL[ss.s]) + '" stroke="' + (me ? '#14171b' : '#0e1115') + '" stroke-width="1.5"' + (o.mini ? '' : ' style="cursor:pointer"') + '><title>' + v.id + ', ' + ss.label + '</title></circle>'; });
    return s + '</svg>';
  }
  function plan() {
    const el = $('#plan'); if (!el) return;
    el.innerHTML = gridSvg({ w: 680, h: 460, layers: st.layers }) + '<p class="m" style="font-size:12.5px;margin:6px 0 0">Mini-carte schématique en quadrillage, non géographique ; trafic non disponible (aucune source connectée).</p>';
    $$('circle[data-v]', el).forEach((c) => c.addEventListener('click', () => pick('veh:' + c.dataset.v)));
  }

  /* ===== Segments ===== */
  function statRow(L) { return '<div class="grid g4">' + L.map((k) => '<div class="panel stat"><span class="l">' + k[0] + '</span><span class="v" style="font-size:' + (k[3] ? 22 : 28) + 'px">' + k[1] + '</span><span class="n">' + (k[2] || '') + '</span></div>').join('') + '</div>'; }
  V.yango = function (v) {
    const [a, b, lbl] = range(), P = E.period(D, a, b, st.now, 'vtc'), VS = E.vehStats(D, a, Math.min(b, TODAY), st.now).filter((x) => x.v.seg === 'vtc'), DS = E.driverStats(D, a, Math.min(b, TODAY - 1), st.now).filter((x) => x.dr.seg === 'vtc' && x.score != null);
    const days = b - a + 1, act = D.V.filter((x) => x.seg === 'vtc' && ['mission', 'late', 'avail'].includes(vStatus(x).s)).length, M30 = E.period(D, 0, TODAY - 1, st.now, 'vtc');
    const hours = new Array(24).fill(0); D.missions.filter((m) => m.key === 'vtc' && m.start <= tNow()).forEach((m) => hours[Math.floor((m.start % 1440) / 60)]++);
    v.innerHTML = '<div class="view"><div class="vhead"><div><h2>Opérations Yango / VTC</h2><p>' + lbl + '. Données simulées. Aucune API Yango n’est connectée : l’intégration est prévue, sous réserve d’un accès partenaire autorisé. Vous pouvez importer un fichier d’export.</p></div>' + filters(false) + '</div>' +
      statRow([['Véhicules VTC actifs', act, 'sur ' + D.V.filter((x) => x.seg === 'vtc').length], ['Courses réalisées', f(P.n), lbl], ['Revenu par véhicule', canFin() ? E.k(P.rev / 20 / Math.max(1, days)) : '•••', 'FCFA par jour'], ['Revenu par chauffeur', canFin() ? E.k(P.rev / Math.max(1, DS.length) / Math.max(1, days)) : '•••', 'FCFA par jour'], ['Rentabilité journalière', canFin() ? E.k((P.rev - P.cost) / Math.max(1, days)) : '•••', 'FCFA nets par jour'], ['Rentabilité mensuelle (30 j)', canFin() ? E.k(M30.rev - M30.cost) : '•••', 'marge ' + (canFin() ? E.pct(M30.margin, 1) : '•••')], ['Utilisation des véhicules', E.pct(P.util, 0), 'jours actifs'], ['Carburant / inactivité', f(P.fuelL) + ' L', f(P.idle / Math.max(1, P.activeVehDays), 1) + ' h d’inactivité par jour', 1]]) +
      '<div class="grid g2" style="margin-top:14px"><section class="panel"><h3>Véhicules les plus rentables</h3><div id="y1"></div></section><section class="panel"><h3>Chauffeurs les plus productifs</h3><div id="y2"></div></section><section class="panel"><h3>Périodes de pointe (courses par heure, hier et aujourd’hui)</h3><div id="y3"></div></section><section class="panel"><h3>Tendance des revenus VTC (30 j)</h3><div id="y4"></div></section></div>' +
      '<section class="panel" style="margin-top:14px"><h3>Véhicules sous-performants</h3><div class="tablewrap"><table><thead><tr><th>Véhicule</th><th class="r">Courses/j</th><th class="r">Revenu/j</th><th class="r">Inactivité</th><th class="r">Consommation</th><th>Motif</th></tr></thead><tbody>' + VS.filter((x) => x.days).sort((p, q) => p.revDay - q.revDay).slice(0, 5).map((x) => '<tr><td class="num">' + x.v.id + '</td><td class="r num">' + f(x.n / x.days, 1) + '</td><td class="r num">' + money(x.revDay) + '</td><td class="r num">' + f(x.idle, 1) + ' h</td><td class="r num ' + (x.consDev > 0.15 ? 's-warn' : '') + '">' + f(x.cons, 1) + '</td><td class="m">' + (x.consDev > 0.15 ? 'Surconsommation' : x.v.driver === 'CH-14' ? 'Baisse de productivité du chauffeur' : x.days < days ? 'Jours hors ligne' : 'Revenu sous la moyenne') + '</td></tr>').join('') + '</tbody></table></div></section>' +
      '<section class="panel" style="margin-top:14px"><h3>Import manuel de données Yango</h3><p class="m" style="font-size:13px;margin:0 0 8px">Format CSV attendu : date, vehicule, chauffeur, courses, revenu. Les lignes importées sont marquées « Importé » et ne se mélangent pas aux données simulées.</p><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><label class="btn" for="csvIn" style="cursor:pointer">Choisir un fichier CSV</label><input id="csvIn" type="file" accept=".csv,text/csv" class="sr">' + (DL ? '<button class="btn" id="tpl">' + ico('dl') + 'Télécharger le modèle</button>' : '') + '<span class="m" id="csvName" style="font-size:13px"></span></div><div id="csvPrev" style="margin-top:10px"></div><div id="imp"></div></section></div>';
    bindFilters(v);
    C.hbars($('#y1'), { rows: VS.filter((x) => x.days).sort((p, q) => q.profit - p.profit).slice(0, 6).map((x) => ({ label: x.v.id, value: Math.max(0, x.profit), text: canFin() ? E.k(x.profit) + ' FCFA' : '•••', color: SEGCOL.vtc })) });
    C.hbars($('#y2'), { rows: DS.sort((p, q) => q.perDay - p.perDay).slice(0, 6).map((x) => ({ label: x.dr.name, value: x.perDay, text: f(x.perDay, 1) + ' courses/j', color: SEGCOL.vtc })) });
    C.stack($('#y3'), { keys: [{ k: 'n', name: 'Courses', color: SEGCOL.vtc }], rows: hours.map((n, h) => ({ label: h + 'h', v: { n } })), unit: 'courses', height: 200, every: 3 });
    const dd = []; for (let d = 0; d < TODAY; d++) dd.push(d);
    if (canFin()) C.line($('#y4'), { n: dd.length, height: 200, unit: 'k FCFA', tipUnit: 'k FCFA', every: 5, xLabel: (i) => E.dayLabel(dd[i]), series: [{ name: 'Revenus VTC', color: SEGCOL.vtc, values: dd.map((d) => E.period(D, d, d, st.now, 'vtc').rev / 1000) }] }); else $('#y4').innerHTML = '<p class="m">Masqué pour ce rôle.</p>';
    if ($('#tpl')) $('#tpl').addEventListener('click', async () => { try { await DL.save({ filename: 'modele-import-yango.csv', data: 'date,vehicule,chauffeur,courses,revenu\n2026-11-10,VTC-01,CH-01,15,41000\n' }); toast('Modèle téléchargé'); } catch (e) { toast('Téléchargement annulé ou indisponible.', 'warn'); } });
    $('#csvIn').addEventListener('change', (e) => { const fl = e.target.files[0]; if (!fl) return; $('#csvName').textContent = fl.name; const rd = new FileReader(); rd.onload = () => csvPreview(String(rd.result)); rd.readAsText(fl); });
    impTable();
  };
  function csvPreview(txt) {
    const lines = txt.split(/\r?\n/).filter((x) => x.trim()); const box = $('#csvPrev'); if (!lines.length) { box.innerHTML = '<p class="s-warn">Le fichier est vide. Ajoutez au moins une ligne de données sous l’en-tête.</p>'; return; }
    const head = lines[0].split(/[;,]/).map((x) => x.trim().toLowerCase()); const need = ['date', 'vehicule', 'chauffeur', 'courses', 'revenu']; const miss = need.filter((x) => !head.includes(x));
    if (miss.length) { box.innerHTML = '<p class="s-warn" style="font-size:13.5px">Colonnes manquantes : ' + miss.join(', ') + '. Utilisez l’en-tête : ' + need.join(', ') + '.</p>'; return; }
    const rows = lines.slice(1).map((l, i) => { const c = l.split(/[;,]/); const o = {}; head.forEach((h, j) => (o[h] = (c[j] || '').trim())); const err = !/^\d{4}-\d{2}-\d{2}$/.test(o.date) ? 'date invalide' : isNaN(+o.courses) || isNaN(+o.revenu) ? 'nombre invalide' : ''; return { i: i + 2, o, err }; });
    const ok = rows.filter((r) => !r.err);
    box.innerHTML = '<div class="tablewrap"><table><thead><tr><th>Ligne</th>' + need.map((h) => '<th>' + h + '</th>').join('') + '<th>Contrôle</th></tr></thead><tbody>' + rows.slice(0, 8).map((r) => '<tr><td class="num">' + r.i + '</td>' + need.map((h) => '<td>' + esc(r.o[h]) + '</td>').join('') + '<td>' + (r.err ? pill('crit', r.err) : pill('ok', 'Valide')) + '</td></tr>').join('') + '</tbody></table></div><p class="m" style="font-size:13px">' + ok.length + ' lignes valides sur ' + rows.length + (rows.length > 8 ? ' (8 premières affichées)' : '') + '.</p>' + (ok.length ? '<button class="btn primary" id="doImp">Importer ' + ok.length + ' lignes</button>' : '');
    if ($('#doImp')) $('#doImp').addEventListener('click', () => { ok.forEach((r) => D.imports.push(Object.assign({ at: tLabel() }, r.o))); journal('Vous', ok.length + ' lignes Yango importées'); toast(ok.length + ' lignes importées'); box.innerHTML = ''; impTable(); });
  }
  function impTable() { const el = $('#imp'); if (!el) return; el.innerHTML = D.imports.length ? '<h4 style="margin:14px 0 6px;font-size:14px">Données importées <span class="tag hist">Importé (fichier)</span></h4><div class="tablewrap"><table><thead><tr><th>Date</th><th>Véhicule</th><th>Chauffeur</th><th class="r">Courses</th><th class="r">Revenu</th><th>Importé</th></tr></thead><tbody>' + D.imports.map((x) => '<tr><td>' + esc(x.date) + '</td><td>' + esc(x.vehicule) + '</td><td>' + esc(x.chauffeur) + '</td><td class="r num">' + esc(x.courses) + '</td><td class="r num">' + esc(x.revenu) + '</td><td class="m">' + x.at + '</td></tr>').join('') + '</tbody></table></div>' : ''; }

  V.moto = function (v) {
    const [a, b, lbl] = range(), P = E.period(D, a, b, st.now, 'moto'), t = tNow(), Tm = D.missions.filter((m) => m.d === TODAY && m.key === 'moto');
    const st2 = (s) => Tm.filter((m) => E.mStatus(m, t) === s); const done = st2('done'), fail = done.filter((m) => m.delay > 50);
    const waiting = Tm.filter((m) => m.start > t && m.start < t + 30 && !st.assigned[m.id]);
    const zr = E.ZONES.map((z) => { const L = D.missions.filter((m) => m.key === 'moto' && m.d >= TODAY - 1 && m.start <= t && (m.to === z) && E.mStatus(m, t) === 'done'); return { z, n: L.length, ot: L.length ? L.filter((m) => m.delay <= 15).length / L.length : null }; });
    v.innerHTML = '<div class="view"><div class="vhead"><div><h2>Livraison moto</h2><p>Statut du jour en direct ; analyses sur ' + lbl + '.</p></div>' + filters(false) + '</div>' +
      statRow([['Motos actives', D.V.filter((x) => x.seg === 'moto' && ['mission', 'late', 'avail'].includes(vStatus(x).s)).length, 'sur 18'], ['Commandes à affecter', waiting.length, 'départ dans moins de 30 min'], ['Livraisons en cours', st2('run').length + st2('late').length, st2('late').length + ' en retard'], ['Livraisons terminées', done.length, fail.length + ' échecs ou réclamations (retard > 50 min)'], ['Durée moyenne', f(done.reduce((s, m) => s + m.dur + m.delay, 0) / Math.max(1, done.length)), 'min aujourd’hui'], ['Distance moyenne', f(P.km / Math.max(1, P.n), 1) + ' km', lbl], ['Coût par livraison', canFin() ? f(P.cost / Math.max(1, P.n)) : '•••', 'FCFA'], ['Revenu par livraison', canFin() ? f(P.rev / Math.max(1, P.n)) : '•••', 'FCFA']]) +
      '<div class="grid g2" style="margin-top:14px"><section class="panel"><h3>Affectation des commandes</h3><p class="m" style="font-size:13px;margin:0 0 8px">Proposition de l’agent Opérations de livraison : la moto disponible la plus proche (même zone, sinon dépôt).</p><div class="tablewrap"><table><thead><tr><th>Commande</th><th>Trajet</th><th class="r">Départ</th><th>Moto proposée</th><th></th></tr></thead><tbody>' +
      (waiting.length ? waiting.map((m) => { const av = D.V.filter((x) => x.seg === 'moto' && vStatus(x).s === 'avail'); const best = av.find((x) => lastZone(x) === m.from) || av[0]; return '<tr><td class="num">' + m.id + '</td><td>' + m.from + ' → ' + m.to + '</td><td class="r num">' + E.hhmm(m.start % 1440) + '</td><td>' + (best ? best.id + (lastZone(best) === m.from ? ' <span class="m">(même zone)</span>' : '') : '<span class="m">Aucune disponible</span>') + '</td><td>' + (best ? '<button class="btn" data-as="' + m.id + '" data-to="' + best.id + '">Affecter</button>' : '') + '</td></tr>'; }).join('') : '<tr><td colspan="5" class="m">Aucune commande en attente d’affectation.</td></tr>') + '</tbody></table></div>' +
      (Object.keys(st.assigned).length ? '<p class="m" style="font-size:12.5px">Affectations confirmées aujourd’hui : ' + Object.keys(st.assigned).map((k) => k + ' → ' + st.assigned[k]).join(', ') + ' (simulées, aucune application chauffeur connectée).</p>' : '') + '</section>' +
      '<section class="panel"><h3>Ponctualité par zone de livraison (hier et aujourd’hui)</h3><div id="m1"></div></section></div>' +
      '<section class="panel" style="margin-top:14px"><h3>Productivité des livreurs</h3><div id="m2"></div></section></div>';
    bindFilters(v);
    $$('[data-as]', v).forEach((bt) => bt.addEventListener('click', () => { st.assigned[bt.dataset.as] = bt.dataset.to; journal('Vous', bt.dataset.as + ' affectée à ' + bt.dataset.to); alog('delivery', 'Affectation ' + bt.dataset.as + ' confirmée par un humain'); toast('Commande affectée à ' + bt.dataset.to); render(); }));
    C.hbars($('#m1'), { rows: zr.filter((x) => x.n).sort((p, q) => p.ot - q.ot).map((x) => ({ label: x.z, value: x.ot * 100, text: E.pct(x.ot, 0) + ' (' + x.n + ')', color: x.ot < 0.75 ? '#ff8a3d' : SEGCOL.moto })) });
    C.hbars($('#m2'), { rows: E.driverStats(D, a, Math.min(b, TODAY - 1), st.now).filter((x) => x.dr.seg === 'moto' && x.perDay).sort((p, q) => q.perDay - p.perDay).map((x) => ({ label: x.dr.name, value: x.perDay, text: f(x.perDay, 1) + ' livraisons/j', color: SEGCOL.moto })) });
  };
  V.moto_live = () => { if (!document.activeElement || !document.activeElement.closest('.view')) V.moto($('#view')); };

  V.trucks = function (v) {
    const [a, b, lbl] = range(), P = E.period(D, a, b, st.now, 'truck'), t = tNow(), T = D.V.filter((x) => x.seg === 'truck'), cap = { van: 1.5, truck: 10 };
    const Tm = D.missions.filter((m) => m.d === TODAY && m.seg === 'truck'); const load = (m) => cap[D.V.find((x) => x.id === m.veh).cat] * (0.55 + ((m.id.charCodeAt(7) * 7) % 40) / 100);
    const util = Tm.reduce((s, m) => s + load(m), 0) / Math.max(1, Tm.reduce((s, m) => s + cap[D.V.find((x) => x.id === m.veh).cat], 0));
    const mp = E.maintPlan(D, st.now).filter((x) => x.v.seg === 'truck' && x.state !== 'ok');
    v.innerHTML = '<div class="view"><div class="vhead"><div><h2>Camions et logistique commerciale</h2><p>Fourgonnettes et camions. ' + lbl + '.</p></div>' + filters(false) + '</div>' +
      statRow([['Disponibles', T.filter((x) => vStatus(x).s === 'avail').length, 'sur ' + T.length], ['Actifs', T.filter((x) => ['mission', 'late'].includes(vStatus(x).s)).length, 'en livraison'], ['Capacité totale', f(T.reduce((s, x) => s + cap[x.cat], 0)) + ' t', '8 × 1,5 t et 8 × 10 t (hypothèse)', 1], ['Taux de remplissage du jour', E.pct(util, 0), 'charge simulée / capacité'], ['Distance parcourue', f(P.km) + ' km', lbl, 1], ['Carburant', f(P.fuelL) + ' L', canFin() ? E.k(P.fuelC) + ' FCFA' : '', 1], ['Coût par km', canFin() ? f(P.cost / P.km) : '•••', 'FCFA'], ['Coût par livraison', canFin() ? f(P.cost / Math.max(1, P.n)) : '•••', 'FCFA']]) +
      '<section class="panel tablewrap" style="margin-top:14px"><h3>Planning et suivi des chargements du jour</h3><table><thead><tr><th>Mission</th><th>Véhicule</th><th>Trajet</th><th class="r">Départ</th><th class="r">Charge</th><th class="r">Montant</th><th>Statut</th><th>Réaffecter</th></tr></thead><tbody>' + Tm.map((m) => { const s = E.mStatus(m, t); const lbl2 = { plan: 'Planifiée', run: m.start > t - 20 ? 'En chargement' : 'En route', late: 'En retard', done: 'Livrée' }[s];
        return '<tr><td class="num">' + m.id + '</td><td>' + (st.assigned[m.id] || m.veh) + '</td><td>' + m.from + ' → ' + m.to + '</td><td class="r num">' + E.hhmm(m.start % 1440) + '</td><td class="r num">' + f(load(m), 1) + ' t</td><td class="r num">' + (canFin() ? f(r50(m.rev)) + ' FCFA' : '•••') + '</td><td>' + pill(s === 'done' ? 'ok' : s === 'late' ? 'late' : s === 'plan' ? 'off' : 'mission', lbl2) + '</td><td>' + (s === 'plan' ? '<select class="btn" data-ra="' + m.id + '" aria-label="Réaffecter ' + m.id + '"><option value="">—</option>' + T.filter((x) => x.cat === D.V.find((y) => y.id === m.veh).cat && x.id !== m.veh && vStatus(x).s !== 'off').map((x) => '<option>' + x.id + '</option>').join('') + '</select>' : '') + '</td></tr>'; }).join('') + '</tbody></table></section>' +
      '<div class="grid g2" style="margin-top:14px"><section class="panel"><h3>Optimisation des itinéraires</h3><ul class="found"><li>' + sev('info') + '<span class="t">Regrouper les livraisons vers Bingerville</span><span class="s">CAM-05 y fait près de deux fois la distance moyenne pour le même tarif. Proposition : deux tournées groupées par semaine et un supplément de distance.</span></li><li>' + sev('warn') + '<span class="t">CAM-03 sous-utilisé</span><span class="s">Inactivité élevée : mutualiser avec un second client ou réduire la flotte affectée.</span></li></ul><p class="m" style="font-size:12.5px">Le trafic n’est pas connecté : les propositions reposent sur les distances et horaires simulés.</p></section>' +
      '<section class="panel"><h3>Besoins de maintenance</h3>' + (mp.length ? '<ul class="found">' + mp.map((x) => '<li>' + sev(x.left < 0 ? 'crit' : 'warn') + '<span class="t">' + x.v.id + '</span><span class="s">' + (x.left < 0 ? 'Dépassée de ' + f(-x.left) + ' km' : 'Dans ' + f(x.left) + ' km, environ ' + f(x.days) + ' jours') + '</span></li>').join('') + '</ul>' : '<p class="m">Aucun entretien dû sous 7 jours.</p>') + '</section></div></div>';
    bindFilters(v);
    $$('[data-ra]', v).forEach((s) => s.addEventListener('change', () => { if (!s.value) return; st.assigned[s.dataset.ra] = s.value; journal('Vous', s.dataset.ra + ' réaffectée à ' + s.value); toast('Mission réaffectée à ' + s.value); render(); }));
  };

  V.moving = function (v) {
    const M = D.moving.slice().sort((a, b) => b.d - a.d), sel = M.find((m) => m.id === st.moveSel) || M.find((m) => m.status === 'Demande reçue') || M[0]; st.moveSel = sel.id;
    const cnt = (s) => M.filter((m) => m.status === s).length;
    v.innerHTML = '<div class="view"><div class="vhead"><div><h2>Déménagement</h2><p>Demandes, planning, équipes et facturation. Clients fictifs.</p></div></div>' +
      statRow([['Demandes reçues', cnt('Demande reçue'), 'à planifier'], ['Déménagements planifiés', cnt('Planifiée'), 'à venir'], ['En cours', M.filter((m) => m.d === TODAY && m.status !== 'Terminée').length, 'aujourd’hui'], ['Terminés (30 j)', cnt('Terminée'), canFin() ? 'coût réel moyen ' + E.pct(M.filter((m) => m.actual).reduce((s, m) => s + m.actual / m.est, 0) / Math.max(1, cnt('Terminée')) - 1, 0, true) + ' vs estimé' : '']]) +
      '<div class="al-page" style="margin-top:14px"><section class="panel tablewrap" style="max-height:620px;overflow:auto"><table><thead><tr><th>Mission</th><th>Client</th><th>Date</th><th>Trajet</th><th class="r">Volume</th><th>Statut</th><th>Paiement</th></tr></thead><tbody>' + M.map((m) => '<tr class="click" data-m="' + m.id + '" aria-selected="' + (m.id === sel.id) + '"><td class="num">' + m.id + '</td><td>' + esc(m.client) + '</td><td>' + E.dayLabel(m.d) + '</td><td>' + m.from + ' → ' + m.to + '</td><td class="r num">' + m.vol + ' m³</td><td>' + pill(m.status === 'Terminée' ? 'ok' : m.status === 'Planifiée' ? 'mission' : 'warn', m.status) + '</td><td>' + (m.invoice === 'En retard de paiement' ? pill('crit', m.invoice) : esc(m.invoice)) + '</td></tr>').join('') + '</tbody></table></section><section class="panel" id="mvD"></section></div></div>';
    $$('tr[data-m]', v).forEach((r) => r.addEventListener('click', () => { st.moveSel = r.dataset.m; V.moving($('#view')); }));
    const m = sel, box = $('#mvD'); const movers = D.V.filter((x) => x.cat === 'mover');
    box.innerHTML = '<h3 style="font-size:17px">' + m.id + ' <span class="m" style="font-weight:400">' + esc(m.client) + '</span></h3><dl class="kv"><dt>Prise en charge</dt><dd>' + m.from + '</dd><dt>Destination</dt><dd>' + m.to + '</dd><dt>Date</dt><dd>' + E.dayLabel(m.d, true) + '</dd><dt>Volume estimé</dt><dd>' + m.vol + ' m³</dd><dt>Coût estimé</dt><dd>' + money(m.est) + '</dd><dt>Coût réel</dt><dd>' + (m.actual ? money(m.actual) + (m.actual > m.est * 1.15 ? ' <span class="s-warn">(+' + f((m.actual / m.est - 1) * 100) + ' %)</span>' : '') : 'NA (non réalisé)') + '</dd><dt>Prix facturé</dt><dd>' + money(m.price) + '</dd></dl>' +
      (m.status === 'Terminée' ? '<dl class="kv"><dt>Véhicule</dt><dd>' + m.veh + '</dd><dt>Équipe</dt><dd>' + m.team.join(', ') + '</dd></dl><div class="field"><label for="inv">Facturation et paiement</label><select id="inv">' + ['Facturée', 'Payée', 'En retard de paiement'].map((x) => '<option' + (x === m.invoice ? ' selected' : '') + '>' + x + '</option>').join('') + '</select></div>'
        : '<div class="field" id="fv"><label for="mv">Véhicule</label><select id="mv"><option value="">Choisir</option>' + movers.map((x) => '<option' + (x.id === m.veh ? ' selected' : '') + '>' + x.id + '</option>').join('') + '</select><span class="err">Choisissez un véhicule.</span></div><div class="field" id="ft"><label for="mt">Équipe (3 personnes, séparées par des virgules)</label><input id="mt" value="' + esc((m.team || []).join(', ')) + '"><span class="err">Indiquez trois personnes.</span></div><div class="field"><label for="md">Date</label><input id="md" type="date" min="' + E.iso(TODAY) + '" value="' + E.iso(m.d) + '"></div><button class="btn primary" id="plan">' + (m.status === 'Demande reçue' ? 'Planifier le déménagement' : 'Enregistrer les modifications') + '</button>');
    if ($('#inv')) $('#inv').addEventListener('change', (e) => { m.invoice = e.target.value; journal('Vous', m.id + ' : ' + m.invoice); toast('Statut de paiement enregistré'); V.moving($('#view')); });
    if ($('#plan')) $('#plan').addEventListener('click', () => { const ve = $('#mv').value, tm = $('#mt').value.split(',').map((x) => x.trim()).filter(Boolean); let ok = true; $('#fv').classList.toggle('invalid', !ve); $('#ft').classList.toggle('invalid', tm.length !== 3); if (!ve || tm.length !== 3) ok = false; if (!ok) return;
      m.veh = ve; m.team = tm; m.d = E.dayOfIso($('#md').value); m.status = 'Planifiée'; journal('Vous', m.id + ' planifié avec ' + ve); toast(m.id + ' planifié'); V.moving($('#view')); });
  };

  V.drivers = function (v) {
    const [a, b, lbl] = range(), S = E.driverStats(D, a, Math.min(b, TODAY - 1 < a ? TODAY : TODAY - 1), st.now).filter((x) => st.seg === 'all' || x.dr.seg === st.seg); const sel = S.find((x) => x.dr.id === st.drvSel) || S[0]; st.drvSel = sel.dr.id;
    v.innerHTML = '<div class="view"><div class="vhead"><div><h2>Chauffeurs</h2><p>Score = productivité dans le segment (45) + ponctualité (35) + faible inactivité (20). ' + lbl + '.</p></div>' + filters(true) + '</div><div class="al-page"><section class="panel tablewrap" style="max-height:640px;overflow:auto"><table><thead><tr><th>Chauffeur</th><th>Segment</th><th>Véhicule</th><th class="r">Missions/j</th><th class="r">Ponctualité</th><th class="r">Inactivité</th><th class="r">Tendance</th><th class="r">Score</th></tr></thead><tbody>' +
      S.sort((p, q) => (q.score || 0) - (p.score || 0)).map((x) => '<tr class="click" data-d="' + x.dr.id + '" aria-selected="' + (x.dr.id === sel.dr.id) + '"><td>' + esc(x.dr.name) + '</td><td class="m">' + E.seg(x.dr.seg).short + '</td><td class="num">' + x.dr.veh + '</td><td class="r num">' + f(x.perDay, 1) + '</td><td class="r num">' + E.pct(x.x.ontime, 0) + '</td><td class="r num">' + f(x.x.idle, 1) + ' h</td><td class="r num ' + (x.trend < -0.15 ? 's-warn' : '') + '">' + E.pct(x.trend, 0, true) + '</td><td class="r">' + (x.score == null ? 'NA' : '<span class="pill s-' + (x.score >= 80 ? 'ok' : x.score >= 65 ? 'warn' : 'crit') + '">' + x.score + '</span>') + '</td></tr>').join('') + '</tbody></table></section><section class="panel" id="dD"></section></div></div>';
    bindFilters(v); $$('tr[data-d]', v).forEach((r) => r.addEventListener('click', () => { st.drvSel = r.dataset.d; V.drivers($('#view')); }));
    const x = sel, dd = []; for (let d = Math.max(0, TODAY - 21); d < TODAY; d++) dd.push(d);
    $('#dD').innerHTML = '<h3 style="font-size:17px">' + esc(x.dr.name) + '</h3><p class="m" style="font-size:13px;margin:2px 0 8px">' + x.dr.id + ', ' + E.seg(x.dr.seg).name + ', véhicule ' + x.dr.veh + ', depuis ' + x.dr.since + '</p><div class="kl"><span>Missions par jour</span><b>' + f(x.perDay, 1) + '</b><span>Ponctualité</span><b>' + E.pct(x.x.ontime, 0) + '</b><span>Inactivité</span><b>' + f(x.x.idle, 1) + ' h/j</b><span>Revenu généré</span><b>' + money(x.x.rev) + '</b><span>Score</span><b>' + (x.score ?? 'NA') + '</b></div><div class="q" style="margin-top:12px">Missions par jour (21 j)</div><div id="dC"></div><p class="m" style="font-size:12.5px">Aucune donnée de style de conduite (télématique non connectée).</p>';
    C.stack($('#dC'), { keys: [{ k: 'n', name: 'Missions', color: SEGCOL[x.dr.seg] }], rows: dd.map((d) => ({ label: E.dayLabel(d), v: { n: D.day[x.dr.veh][d].off ? 0 : D.day[x.dr.veh][d].n } })), unit: 'missions', height: 170, every: 5 });
  };

  /* ===== Centre d'intelligence IA ===== */
  V.ai = function (v) {
    v.innerHTML = '<div class="view"><div class="vhead"><div><h2>Centre d’intelligence IA</h2><p>Le Fleet Intelligence Orchestrator coordonne huit agents spécialisés. Cliquez un agent dans le réseau 3D. <b>Agents simulés</b> par fonctions déterministes : aucun LLM, GPS, API Yango ni système réel n’est connecté.</p></div></div>' +
      '<div class="filters"><span class="tag hist">Données opérationnelles importées : uniquement les fichiers importés</span><span class="tag sim">Données de démonstration simulées</span><span class="tag pred">Prédictions IA (modèles de base)</span></div>' +
      '<div class="ai-page"><div><div class="netslot" id="net"></div><section class="panel" style="margin-top:14px" id="agP"></section></div><section class="panel chat" style="min-height:640px"><div class="msgs" id="msgs" aria-live="polite"></div><div id="trace" style="padding:0 16px;max-height:260px;overflow:auto"></div><div class="compose"><div class="sugg">' + E.SUGGESTIONS.map((q) => '<button>' + esc(q) + '</button>').join('') + '</div><form id="askF"><label class="sr" for="askIn">Question</label><input id="askIn" autocomplete="off" placeholder="Posez une question à l’orchestrateur"><button class="btn primary">Envoyer</button></form></div></section></div></div>';
    if (glN) { N.attach($('#net')); N.select('agent:' + st.agentSel); } else $('#net').innerHTML = '<div class="nogl">WebGL indisponible. Choisissez un agent ci-dessous.</div>';
    $$('.sugg button', v).forEach((b) => b.addEventListener('click', () => ask(b.textContent)));
    $('#askF').addEventListener('submit', (e) => { e.preventDefault(); const q = $('#askIn').value.trim(); if (q) { ask(q); $('#askIn').value = ''; } });
    agentPanel(); chat(); trace();
  };
  function agentPanel() {
    const el = $('#agP'); if (!el) return; const a = E.agent(st.agentSel), run = st.agentState[a.id] === 'run';
    const finds = alertsLive().filter((x) => x.agent === a.id && !x.live).slice(0, 3), tasks = (st.running || st.lastRun) && (st.running || st.lastRun).intent && (st.running || st.lastRun).intent.agents.includes(a.id) ? [(st.running || st.lastRun).intent.label] : [];
    el.innerHTML = '<div class="chipf" style="margin-bottom:10px">' + E.AGENTS.map((x) => '<button data-ag="' + x.id + '" aria-pressed="' + (x.id === a.id) + '">' + x.name + '</button>').join('') + '</div><div style="display:flex;gap:8px;align-items:center"><h3 style="font-size:17px">' + a.name + '</h3><span style="margin-left:auto">' + pill(run ? 'warn' : 'ok', run ? 'En exécution' : 'Actif (simulé)') + '</span></div><p style="font-size:13.5px;color:var(--text-2);margin:6px 0">' + esc(a.role) + '</p>' +
      '<dl class="kv"><dt>Dernière exécution</dt><dd>' + ((st.agentLog[a.id] || [])[0] ? st.agentLog[a.id][0].t + ' : ' + esc(st.agentLog[a.id][0].x) : 'Aucune') + '</dd><dt>Sources de données</dt><dd>' + a.data.join(', ') + '</dd><dt>Tâches de l’orchestrateur</dt><dd>' + (tasks.length ? esc(tasks.join(', ')) : 'Aucune en cours') + '</dd></dl>' +
      '<div class="q">Constats récents</div>' + (finds.length ? '<ul class="found">' + finds.map((x) => '<li>' + sev(x.sev) + '<span class="t">' + esc(x.title) + '</span><span class="s">Recommandation : ' + esc(x.action) + '</span></li>').join('') + '</ul>' : '<p class="m" style="font-size:13.5px">Aucun constat récent.</p>');
    $$('[data-ag]', el).forEach((b) => b.addEventListener('click', () => { st.agentSel = b.dataset.ag; if (glN) N.select('agent:' + st.agentSel); agentPanel(); }));
  }
  function chat() {
    const m = $('#msgs'); if (!m) return;
    if (!st.chat.length) { m.innerHTML = '<div class="msg o"><div class="head">Fleet Intelligence Orchestrator</div><div class="row">Posez une question opérationnelle ou financière. Chaque réponse est calculée sur les données simulées, avec les agents mobilisés et la trace d’exécution.</div></div>'; return; }
    m.innerHTML = st.chat.map((c) => (c.role === 'u' ? '<div class="msg u">' + esc(c.text) + '</div>' : c.pending ? '<div class="msg o"><div class="row">Analyse en cours…</div></div>' : !c.ans ? '<div class="msg o"><div class="head">NA : question hors du périmètre de la démonstration.</div><div class="row">Essayez une des suggestions.</div></div>' :
      '<div class="msg o"><div class="head">' + esc(c.ans.head) + '</div><ul>' + c.ans.factors.map((x) => '<li>' + (canFin() || !/FCFA|marge|revenu/i.test(x) ? esc(x) : 'Information financière masquée pour ce rôle.') + '</li>').join('') + '</ul><div class="row"><b>Recommandation.</b> ' + esc(c.ans.action) + '</div><div class="foot"><span class="tag ai">Recommandation IA (règles)</span><span>Confiance ' + c.ans.conf.lvl.toLowerCase() + ' : ' + esc(c.ans.conf.why) + '</span></div></div>')).join('');
    m.scrollTop = m.scrollHeight;
  }
  function trace() {
    const t = $('#trace'); if (!t) return; const r = st.running || st.lastRun; if (!r || !r.intent) { t.innerHTML = ''; return; }
    t.innerHTML = '<h3 style="font-size:14px;margin:8px 0">Trace</h3><ol class="steps">' + [['Demande', r.q, 'done'], ['Intention', r.intent.label, 'done']].concat(r.intent.agents.map((a, i) => [E.agent(a).name, r.F[i] ? r.F[i].text : '', r.F[i] ? 'done' : i === r.F.length ? 'run' : ''])).concat([['Consolidation et recommandation', r.done ? r.ans.action : '', r.done ? 'done' : '']]).map((s) => '<li class="' + s[2] + '"><div class="tt">' + esc(s[0]) + '</div>' + (s[1] ? '<div class="fd">' + esc(canFin() || !/FCFA/.test(s[1]) ? s[1] : 'Résultat financier masqué pour ce rôle.') + '</div>' : '') + '</li>').join('') + '</ol>';
  }
  function ask(q) {
    if (st.running) { toast('Une analyse est déjà en cours.'); return; } if (st.view !== 'ai') go('ai');
    const intent = E.route(q); st.chat.push({ role: 'u', text: q }); journal('Vous', 'Question : ' + q); const run = { q, intent, F: [] }; st.running = run;
    if (!intent) { st.chat.push({ role: 'o', ans: null }); st.running = null; chat(); return; }
    const msg = { role: 'o', pending: true }; st.chat.push(msg); chat(); trace(); let i = 0; const step = matchMedia('(prefers-reduced-motion: reduce)').matches ? 100 : 600;
    const next = () => { if (i < intent.agents.length) { const a = intent.agents[i]; st.agentState[a] = 'run'; if (glN) N.setActive([a]); trace(); agentPanel();
        setTimeout(() => { run.F.push(E.runTask(a, intent.id, D, st.now)); st.agentState[a] = null; alog(a, 'Tâche : ' + intent.label.toLowerCase()); i++; trace(); next(); }, step); return; }
      setTimeout(() => { run.ans = E.compose(intent.id, run.F, D, st.now); run.done = true; msg.pending = false; msg.ans = run.ans; if (intent.id === 'report') makeReport('weekly'); if (glN) N.setActive([]); journal('Orchestrateur', run.ans.head); st.lastRun = run; st.running = null; chat(); trace(); agentPanel(); }, step); };
    next();
  }

  /* ===== Prédictif ===== */
  V.predictive = function (v) {
    const W = [['rev', 'Revenus', 'FCFA'], ['opex', 'Dépenses opérationnelles', 'FCFA'], ['fuel', 'Consommation de carburant', 'L'], ['util', 'Utilisation de la flotte', '%'], ['demand', 'Demande (missions)', 'missions']];
    const w = W.find((x) => x[0] === st.predWhat), Fc = E.forecast(D, st.now, st.predWhat, st.seg), n = Fc.hist.length + Fc.out.length;
    const scale = w[2] === 'FCFA' ? 1000 : 1, unit = w[2] === 'FCFA' ? 'k FCFA' : w[2];
    const masked = (st.predWhat === 'rev' || st.predWhat === 'opex') && !canFin();
    const A = alertsLive().filter((a) => !a.live); const ms = alertsLive().filter((a) => a.live && a.state !== 'resolved').length;
    v.innerHTML = '<div class="view"><div class="vhead"><div><h2>Analyses prédictives</h2><p>Historique de 14 jours et projection sur 14 jours avec intervalle de confiance à 90 %. Modèle de base : moyenne par jour de semaine et tendance bornée.</p></div><div class="tools"><label class="sr" for="pw">Indicateur</label><select id="pw" class="btn">' + W.map((x) => '<option value="' + x[0] + '"' + (x[0] === st.predWhat ? ' selected' : '') + '>' + x[1] + '</option>').join('') + '</select><div class="chipf">' + [['all', 'Tous']].concat(E.SEGS.map((s) => [s.id, s.short])).map(([k, l]) => '<button data-sg="' + k + '" aria-pressed="' + (st.seg === k) + '">' + l + '</button>').join('') + '</div></div></div>' +
      '<section class="panel"><h3>' + w[1] + ' <span class="tag sim">Historique simulé</span> <span class="tag pred">Prédiction</span></h3><div id="pc"></div></section>' +
      '<div class="grid g2" style="margin-top:14px"><section class="panel tablewrap"><h3>Maintenance prévue</h3><table><thead><tr><th>Véhicule</th><th class="r">km restants</th><th class="r">Échéance estimée</th><th class="r">Risque</th></tr></thead><tbody>' + E.maintPlan(D, st.now).slice(0, 8).map((x) => '<tr><td class="num">' + x.v.id + '</td><td class="r num">' + f(x.left) + '</td><td class="r">' + (x.left < 0 ? pill('crit', 'Dépassée') : x.days == null ? 'NA' : E.dayLabel(TODAY + Math.round(x.days))) + '</td><td class="r num">' + x.risk + '/100</td></tr>').join('') + '</tbody></table><p class="m" style="font-size:12.5px">Échéance = km restants ÷ km moyens par jour. Le risque est un indicateur de priorité, pas une probabilité de panne.</p></section>' +
      '<section class="panel"><h3>Détection d’anomalies</h3><ul class="found">' + A.map((a) => '<li>' + sev(a.sev) + '<span class="t">' + esc(a.title) + '</span><span class="s">' + esc(a.type) + ', ' + E.agent(a.agent).name + ', ' + { new: 'nouvelle', ack: 'prise en charge', resolved: 'résolue' }[a.state] + '</span><span class="a"><button class="linkish" data-al="' + a.id + '">Traiter</button></span></li>').join('') + '</ul><p class="m" style="font-size:12.5px">' + ms + ' retards de livraison en direct ouverts (voir la cloche).</p></section></div></div>';
    $('#pw').addEventListener('change', (e) => { st.predWhat = e.target.value; render(); }); $$('[data-sg]', v).forEach((b) => b.addEventListener('click', () => { st.seg = b.dataset.sg; render(); }));
    $$('[data-al]', v).forEach((b) => b.addEventListener('click', () => alertDlg(ALERTS.find((a) => a.id === b.dataset.al))));
    if (masked) { $('#pc').innerHTML = '<p class="m">Masqué pour le rôle « ' + ROLES[st.role][0] + ' ».</p>'; return; }
    const hist = Fc.hist.map((x) => x.v / scale).concat(new Array(Fc.out.length).fill(null)), fc = new Array(Fc.hist.length).fill(null).concat(Fc.out.map((x) => x.v / scale)), band = new Array(Fc.hist.length).fill(null).concat(Fc.out.map((x) => [x.lo / scale, x.hi / scale]));
    fc[Fc.hist.length - 1] = hist[Fc.hist.length - 1];
    C.line($('#pc'), { n, height: 300, unit, tipUnit: unit, yd: w[2] === '%' ? 1 : 0, every: 2, split: Fc.hist.length, splitLabel: 'Aujourd’hui', xLabel: (i, l) => E.dayLabel(i < Fc.hist.length ? Fc.hist[i].d : Fc.out[i - Fc.hist.length].d, l), series: [{ name: 'Historique simulé', color: '#ffd23f', values: hist }, { name: 'Prédiction (IC 90 %)', color: '#c9d3df', values: fc, dash: true, band }] });
  };

  /* ===== Finances ===== */
  V.finance = function (v) {
    const [a, b, lbl] = range(), P = E.period(D, a, b, st.now), [pa, pb] = prevRange(), PP = E.period(D, pa, pb, st.now), rows = [['Revenus', 'rev'], ['Carburant', 'fuelC'], ['Maintenance', 'maint'], ['Rémunération chauffeurs et équipes', 'driver'], ['Commission plateforme (VTC)', 'commission'], ['Assurance', 'insurance'], ['Frais administratifs (répartis)', 'admin'], ['Coûts opérationnels', 'cost'], ['Contribution nette', 'net']];
    v.innerHTML = '<div class="view"><div class="vhead"><div><h2>Intelligence financière</h2><p>' + lbl + ', comparé à la période précédente de même durée. Coûts fondés sur des hypothèses de démonstration modifiables dans Administration.</p></div>' + filters(false) + '</div>' +
      '<section class="panel tablewrap"><table><thead><tr><th>Poste (FCFA)</th>' + E.SEGS.map((s) => '<th class="r">' + s.name + '</th>').join('') + '<th class="r">Total</th><th class="r">vs période préc.</th></tr></thead><tbody>' + rows.map(([l, k]) => { const tot = k === 'net' ? P.rev - P.cost : P[k], ptot = k === 'net' ? PP.rev - PP.cost : PP[k];
        return '<tr' + (k === 'net' || k === 'cost' ? ' style="font-weight:600"' : '') + '><td>' + l + '</td>' + E.SEGS.map((s) => '<td class="r num">' + E.k(P.bySeg[s.id][k]) + '</td>').join('') + '<td class="r num">' + E.k(tot) + '</td><td class="r num">' + E.pct(ptot ? tot / ptot - 1 : null, 0, true) + '</td></tr>'; }).join('') +
      '<tr><td>Marge</td>' + E.SEGS.map((s) => '<td class="r num ' + (P.bySeg[s.id].margin < 0.1 ? 's-warn' : '') + '">' + E.pct(P.bySeg[s.id].margin, 0) + '</td>').join('') + '<td class="r num">' + E.pct(P.margin, 1) + '</td><td class="r num">' + E.pct(P.margin - PP.margin, 1, true).replace('%', 'pt') + '</td></tr></tbody></table><p class="m" style="font-size:12.5px">Montants en milliers (k) ou millions (M) de FCFA.</p></section>' +
      '<div class="grid g2" style="margin-top:14px"><section class="panel"><h3>Structure des coûts par segment</h3><div id="f1"></div></section><section class="panel"><h3>Marge par segment et par semaine</h3><div id="f2"></div></section><section class="panel"><h3>Véhicules : contribution sur la période</h3><div id="f3"></div></section><section class="panel"><h3>Coût par km et par mission</h3><div class="tablewrap"><table><thead><tr><th>Segment</th><th class="r">Coût / km</th><th class="r">Coût / mission</th><th class="r">Revenu / mission</th></tr></thead><tbody>' + E.SEGS.map((s) => { const x = P.bySeg[s.id]; return '<tr><td>' + s.name + '</td><td class="r num">' + f(x.cost / Math.max(1, x.km)) + '</td><td class="r num">' + f(x.cost / Math.max(1, x.n)) + '</td><td class="r num">' + f(x.rev / Math.max(1, x.n)) + '</td></tr>'; }).join('') + '</tbody></table></div></section></div></div>';
    bindFilters(v);
    const ck = [['fuelC', 'Carburant', '#d95926'], ['driver', 'Chauffeurs', '#3987e5'], ['commission', 'Commission', '#9085e9'], ['insurance', 'Assurance', '#d55181'], ['maint', 'Maintenance', '#e0a526'], ['admin', 'Administratif', '#6c7d92']];
    C.stack($('#f1'), { keys: ck.map(([k, n, c]) => ({ k, name: n, color: c })), rows: E.SEGS.map((s) => { const o = {}; ck.forEach(([k]) => (o[k] = P.bySeg[s.id][k] / 1000)); return { label: s.short, full: s.name, v: o }; }), unit: 'k FCFA', height: 240, every: 1 });
    const wk = [0, 1, 2, 3].map((i) => [TODAY - 28 + i * 7, TODAY - 22 + i * 7]);
    C.line($('#f2'), { n: 4, height: 240, unit: '%', tipUnit: '%', yd: 0, every: 1, xLabel: (i) => 'Sem. du ' + E.dayLabel(wk[i][0]), series: E.SEGS.map((s) => ({ name: s.short, color: SEGCOL[s.id], values: wk.map(([x, y]) => E.period(D, x, y, st.now).bySeg[s.id].margin * 100) })) });
    const VS = E.vehStats(D, a, b, st.now).sort((p, q) => q.profit - p.profit);
    C.hbars($('#f3'), { rows: VS.slice(0, 5).concat(VS.slice(-5)).map((x) => ({ label: x.v.id, value: Math.abs(x.profit), text: E.k(x.profit) + ' FCFA', color: x.profit < 0 ? '#ff4d5e' : SEGCOL[x.v.seg] })) });
    $('#f3').insertAdjacentHTML('beforeend', '<p class="m" style="font-size:12.5px;margin:6px 0 0">Cinq meilleurs et cinq moins bons véhicules (avant frais administratifs). En rouge : contribution négative.</p>');
  };

  /* ===== Maintenance ===== */
  V.maintenance = function (v) {
    const P = E.maintPlan(D, st.now), H = D.maint.slice().sort((a, b) => b.d - a.d);
    v.innerHTML = '<div class="view"><div class="vhead"><div><h2>Centre de maintenance</h2><p>Échéances au kilométrage (simulé) et historique d’entretien. Aucun diagnostic embarqué n’est connecté.</p></div></div>' +
      statRow([['Entretiens dépassés', P.filter((x) => x.state === 'overdue').length, 'à traiter immédiatement'], ['Dus sous 7 jours', P.filter((x) => x.state === 'soon').length, ''], ['Véhicules immobilisés', D.V.filter((x) => D.offline[x.id]).length, Object.keys(D.offline).join(', ')], ['Dépenses 30 j', canFin() ? E.k(H.reduce((s, x) => s + x.cost, 0)) : '•••', 'FCFA, ' + H.length + ' interventions']]) +
      '<section class="panel tablewrap" style="margin-top:14px"><h3>Plan d’entretien</h3><table><thead><tr><th>Véhicule</th><th>Catégorie</th><th class="r">Depuis l’entretien</th><th class="r">Intervalle</th><th class="r">Échéance</th><th class="r">Risque</th><th class="r">Coût estimé</th><th></th></tr></thead><tbody>' + P.filter((x) => x.state !== 'ok' || x.risk > 50).concat(P.filter((x) => x.state === 'ok' && x.risk <= 50).slice(0, 6)).map((x) => '<tr><td class="num">' + x.v.id + '</td><td class="m">' + E.CATS[x.v.cat] + '</td><td class="r num">' + f(x.v.since) + ' km</td><td class="r num">' + f(x.v.svc) + ' km</td><td class="r">' + (x.left < 0 ? pill('crit', 'Dépassée') : x.state === 'soon' ? pill('warn', 'Sous ' + f(x.days) + ' j') : f(x.days) + ' j') + '</td><td class="r num">' + x.risk + '</td><td class="r num">' + money(x.cost) + '</td><td>' + (st.maintPlanned[x.v.id] ? pill('mission', 'Planifié ' + st.maintPlanned[x.v.id]) : '<button class="btn" data-pl="' + x.v.id + '">Planifier</button>') + '</td></tr>').join('') + '</tbody></table></section>' +
      '<section class="panel tablewrap" style="margin-top:14px"><h3>Historique des interventions (simulé)</h3><table><thead><tr><th>Date</th><th>Véhicule</th><th>Type</th><th>Intervention</th><th class="r">Coût</th></tr></thead><tbody>' + H.map((x) => '<tr><td>' + E.dayLabel(x.d) + '</td><td class="num">' + x.veh + '</td><td>' + x.type + '</td><td>' + esc(x.note) + '</td><td class="r num">' + money(x.cost) + '</td></tr>').join('') + '</tbody></table></section></div>';
    $$('[data-pl]', v).forEach((b) => b.addEventListener('click', () => { const dlg = $('#dlg'); dlg.innerHTML = '<div class="dh"><h3>Planifier l’entretien de ' + b.dataset.pl + '</h3><button class="x" data-c aria-label="Fermer">×</button></div><div class="db"><div class="field"><label for="pd">Date</label><input id="pd" type="date" min="' + E.iso(TODAY) + '" value="' + E.iso(TODAY + 1) + '"></div><p class="m" style="font-size:13px">Le véhicule sera retiré du planning ce jour-là (simulation).</p></div><div class="df"><button class="btn" data-c>Annuler</button><button class="btn primary" id="okP">Planifier l’entretien</button></div>';
      $$('[data-c]', dlg).forEach((x) => x.addEventListener('click', () => dlg.close())); $('#okP').addEventListener('click', () => { st.maintPlanned[b.dataset.pl] = E.dayLabel(E.dayOfIso($('#pd').value)); journal('Vous', 'Entretien ' + b.dataset.pl + ' planifié'); alog('maint', 'Entretien ' + b.dataset.pl + ' planifié par un humain'); dlg.close(); toast('Entretien planifié'); render(); }); dlg.showModal(); }));
  };

  /* ===== Alertes (dialogue) ===== */
  function alertDlg(a) {
    if (!a) return; const s = st.alerts[a.id], dlg = $('#dlg');
    dlg.innerHTML = '<div class="dh">' + sev(a.sev) + '<h3 style="font-size:16px">' + esc(a.title) + '</h3><button class="x" data-c aria-label="Fermer">×</button></div><div class="db"><dl class="kv"><dt>Horodatage</dt><dd>' + E.dayLabel(Math.floor(a.at / 1440)) + ' ' + E.hhmm(a.at % 1440) + '</dd><dt>Type</dt><dd>' + esc(a.type) + '</dd><dt>Véhicule</dt><dd>' + (a.veh || '—') + '</dd><dt>Agent</dt><dd>' + E.agent(a.agent).name + '</dd><dt>Statut</dt><dd>' + { new: 'Nouvelle', ack: 'Prise en charge', resolved: 'Résolue' }[s.state] + '</dd></dl><p style="font-size:14px">' + esc(a.desc) + '</p><ul style="font-size:14px">' + a.meas.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul><p style="font-size:14px"><b>Recommandation.</b> ' + esc(a.action) + '</p>' + (s.state !== 'resolved' ? '<div class="field" id="fc"><label for="cm">' + (s.state === 'new' ? 'Commentaire de prise en charge' : 'Résolution') + '</label><textarea id="cm"></textarea><span class="err">Ce champ est obligatoire.</span></div>' : '') + '<ul class="log">' + s.log.map((l) => '<li><time>' + l.t + '</time><span>' + esc(l.x) + '</span></li>').join('') + '</ul></div><div class="df"><button class="btn" data-c>Fermer</button>' + (a.veh ? '<button class="btn" id="seeV">Voir le véhicule</button>' : '') + (s.state === 'new' ? '<button class="btn primary" data-k="ack">Prendre en charge</button>' : '') + (s.state !== 'resolved' ? '<button class="btn primary" data-k="res">Marquer résolue</button>' : '') + '</div>';
    $$('[data-c]', dlg).forEach((x) => x.addEventListener('click', () => dlg.close()));
    if ($('#seeV')) $('#seeV').addEventListener('click', () => { dlg.close(); st.sel = 'veh:' + a.veh; go('live'); setTimeout(() => { if (gl) { F.select(st.sel); F.focus(st.sel); } }, 80); });
    $$('[data-k]', dlg).forEach((b) => b.addEventListener('click', () => { const t = $('#cm').value.trim(); if (!t) { $('#fc').classList.add('invalid'); $('#cm').focus(); return; } s.state = b.dataset.k === 'ack' ? 'ack' : 'resolved'; s.log.unshift({ t: tLabel(), x: (s.state === 'ack' ? 'Prise en charge : ' : 'Résolue : ') + t }); journal('Vous', a.id + ' ' + (s.state === 'ack' ? 'prise en charge' : 'résolue')); alog(a.agent, a.id + ' traitée par un humain'); dlg.close(); toast(s.state === 'ack' ? 'Alerte prise en charge' : 'Alerte résolue'); render(); tick(true); }));
    dlg.showModal();
  }

  /* ===== Rapports ===== */
  function makeReport(kind) {
    const span = { daily: 1, weekly: 7, monthly: 30 }[kind], a = TODAY - span, b = TODAY - 1, P = E.period(D, a, b, st.now), PP = E.period(D, Math.max(0, a - span), Math.max(0, a - 1), st.now);
    const sec = [['Synthèse', ['Période : ' + E.dayLabel(a) + ' au ' + E.dayLabel(b) + '.', f(P.n) + ' trajets et missions, ' + f(P.km) + ' km, ponctualité ' + E.pct(P.ontimeRate, 0) + ', utilisation ' + E.pct(P.util, 0) + '.', 'Revenus ' + E.fcfa(P.rev) + ' (' + E.pct(PP.rev ? P.rev / PP.rev - 1 : null, 0, true) + ' vs période précédente), marge ' + E.pct(P.margin, 1) + '.']],
      ['Segments', E.SEGS.map((s) => s.name + ' : revenus ' + E.k(P.bySeg[s.id].rev) + ' FCFA, marge ' + E.pct(P.bySeg[s.id].margin, 0))],
      ['Anomalies', alertsLive().filter((x) => !x.live).map((x) => x.title + ' (' + { new: 'nouvelle', ack: 'prise en charge', resolved: 'résolue' }[x.state] + ')')],
      ['Prévisions (modèle de base)', [E.runTask('bi', 'forecast', D, st.now).text, E.runTask('delivery', 'forecast', D, st.now).text]],
      ['Recommandations stratégiques', ['Appliquer un supplément de distance vers Bingerville et regrouper ces livraisons.', 'Revoir la grille de devis de déménagement (DEM-02).', 'Mutualiser CAM-03 ou réduire la flotte affectée.', 'Positionner deux motos en attente à Yopougon aux heures de pointe.']],
      ['Données et audit', ['Données de démonstration simulées ; ' + D.imports.length + ' ligne(s) importée(s) par fichier.', 'CO₂ estimé : ' + f(P.co2, 1) + ' t (facteurs GIEC 2006, voir Administration).', 'Généré par l’agent Business intelligence (règles déterministes), ' + tLabel() + ' (heure simulée).']]];
    const R = { id: 'RP-' + String(st.reports.length + 1).padStart(3, '0'), kind, title: 'Rapport ' + { daily: 'quotidien', weekly: 'hebdomadaire', monthly: 'mensuel' }[kind] + ' de direction', at: tLabel(), sec }; st.reports.unshift(R); st.repSel = R.id; journal('Agent BI', R.title + ' généré'); return R;
  }
  V.reports = function (v) {
    const R = st.reports.find((r) => r.id === st.repSel) || st.reports[0];
    v.innerHTML = '<div class="view"><div class="vhead"><div><h2>Rapports et analyses</h2><p>Rapports de direction générés à partir des données simulées.</p></div><div class="tools">' + [['daily', 'quotidien'], ['weekly', 'hebdomadaire'], ['monthly', 'mensuel']].map(([k, l]) => '<button class="btn" data-r="' + k + '">Générer le rapport ' + l + '</button>').join('') + '</div></div><div class="al-page" style="grid-template-columns:240px minmax(0,1fr)"><section class="panel" style="padding:6px">' + (st.reports.length ? st.reports.map((r) => '<button class="al-item" style="grid-template-columns:1fr" data-rp="' + r.id + '" aria-current="' + (R && r.id === R.id) + '"><span class="t">' + r.id + ' ' + esc(r.title) + '</span><span class="s">' + r.at + '</span></button>').join('') : '<p class="m" style="padding:10px;font-size:13.5px">Aucun rapport pour l’instant.</p>') + '</section><section id="rpv"></section></div><section class="panel" style="margin-top:14px"><h3>Journal</h3><ul class="log" style="max-height:220px">' + st.journal.map((x) => '<li><time>' + x.t + '</time><span><b style="font-weight:600">' + esc(x.w) + '</b> : ' + esc(x.x) + '</span></li>').join('') + '</ul></section></div>';
    $$('[data-r]', v).forEach((b) => b.addEventListener('click', () => { makeReport(b.dataset.r); render(); toast('Rapport généré'); })); $$('[data-rp]', v).forEach((b) => b.addEventListener('click', () => { st.repSel = b.dataset.rp; render(); }));
    if (!R) { $('#rpv').innerHTML = '<div class="doc"><p class="m">L’aperçu s’affichera ici.</p></div>'; return; }
    const masked = !canFin(); const txt = R.title + '\n' + R.id + ', ' + R.at + '\nDonnées de démonstration simulées\n\n' + R.sec.map(([h, L]) => h + '\n' + L.map((x) => '- ' + x).join('\n')).join('\n\n');
    $('#rpv').innerHTML = masked ? '<div class="doc"><p class="m">Les rapports de direction contiennent des données financières : masqués pour ce rôle.</p></div>' : '<div class="doc"><div style="display:flex;gap:8px;flex-wrap:wrap"><div><h2>' + esc(R.title) + '</h2><div class="meta">' + R.id + ', ' + R.at + ' (heure simulée). Données de démonstration simulées.</div></div><div style="margin-left:auto;display:flex;gap:6px">' + (DL ? '<button class="btn primary" id="dl">' + ico('dl') + 'Télécharger (.html)</button>' : '') + '<button class="btn" id="cp">Copier le texte</button></div></div>' + R.sec.map(([h, L]) => '<h3>' + h + '</h3><ul>' + L.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>').join('') + '</div>';
    if ($('#cp')) $('#cp').addEventListener('click', async () => { try { await navigator.clipboard.writeText(txt); toast('Texte copié'); } catch (e) { toast('Copie refusée : sélectionnez le texte.', 'warn'); } });
    if ($('#dl')) $('#dl').addEventListener('click', async () => { try { await DL.save({ filename: 'fleet-' + R.kind + '-' + R.id + '.html', data: '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>' + esc(R.title) + '</title><style>body{font:15px/1.55 system-ui,sans-serif;max-width:760px;margin:40px auto;color:#152030}h1{font-size:22px}h2{font-size:16px;margin-top:22px;color:#0b4f5c}</style></head><body><p><b>Données de démonstration simulées</b></p><h1>' + esc(R.title) + '</h1><p>' + R.id + ', ' + esc(R.at) + '</p>' + R.sec.map(([h, L]) => '<h2>' + esc(h) + '</h2><ul>' + L.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>').join('') + '</body></html>' }); toast('Rapport téléchargé'); } catch (e) { toast('Téléchargement annulé ou indisponible.', 'warn'); } });
  };

  /* ===== Administration ===== */
  V.admin = function (v) {
    const INT = [['API partenaire Yango', 'Soumise à un accès partenaire autorisé', 'off', 'Non connectée'], ['Fournisseur GPS / télématique', 'Positions en direct', 'off', 'Non connecté'], ['Cartes carburant', 'Pleins et dépenses', 'off', 'Non connecté'], ['Logiciel comptable', 'Écritures et factures', 'off', 'Non connecté'], ['Paiements mobiles', 'Encaissements clients', 'off', 'Non connecté'], ['Gestion des livraisons', 'Commandes', 'off', 'Non connecté'], ['Cartographie (Mapbox ou équivalent)', 'Carte réelle d’Abidjan', 'off', 'Non connectée'], ['Supabase / PostgreSQL', 'Base de données', 'off', 'Structure prête'], ['Import CSV', 'Données Yango manuelles', 'ok', 'Disponible']];
    const ENT = [['Véhicules', D.V.length], ['Chauffeurs', D.DR.length], ['Missions (2 derniers jours)', D.missions.length], ['Déménagements', D.moving.length], ['Interventions de maintenance', D.maint.length], ['Exécutions d’agents', Object.values(st.agentLog).reduce((s, x) => s + x.length, 0)], ['Alertes', ALERTS.length], ['Lignes importées', D.imports.length]];
    v.innerHTML = '<div class="view"><div class="vhead"><div><h2>Administration</h2><p>Rôles, intégrations, modèle de données et hypothèses de la démonstration.</p></div></div>' +
      '<div class="grid g2"><section class="panel tablewrap"><h3>Accès par rôle <span class="tag">Simulation d’interface</span></h3><table><thead><tr><th>Module</th>' + Object.keys(ROLES).map((k) => '<th>' + ROLES[k][0].split(' ')[0] + '</th>').join('') + '</tr></thead><tbody>' + VIEWS.map((x) => '<tr><td>' + x.name + '</td>' + Object.keys(ROLES).map((k) => '<td>' + (ROLES[k][1].includes(x.id) ? '<span class="s-ok">✓</span>' : '<span class="m">–</span>') + '</td>').join('') + '</tr>').join('') + '</tbody></table><p class="m" style="font-size:12.5px">Changez de rôle en haut de l’écran pour voir l’effet. Aucun contrôle d’accès réel n’est appliqué dans cette démonstration.</p></section>' +
      '<section class="panel"><h3>Intégrations</h3>' + INT.map((x) => '<div class="src"><div class="n">' + x[0] + '</div><div class="a">' + pill(x[2], x[3]) + '</div><div class="d">' + x[1] + '</div></div>').join('') + '</section></div>' +
      '<div class="grid g2" style="margin-top:14px"><section class="panel"><h3>Modèle de données (démonstration)</h3><table><tbody>' + ENT.map((x) => '<tr><td>' + x[0] + '</td><td class="r num">' + f(x[1]) + '</td></tr>').join('') + '</tbody></table></section>' +
      '<section class="panel"><h3>Hypothèses</h3><form id="hf">' + [['fs', 'Prix du super (FCFA/L)', E.cfg.fuel.super], ['fg', 'Prix du gazole (FCFA/L)', E.cfg.fuel.gasoil], ['cm', 'Commission plateforme VTC (%)', E.cfg.commission * 100], ['ad', 'Frais administratifs (FCFA/jour)', E.cfg.adminDay]].map(([id, l, x]) => '<div class="field"><label for="' + id + '">' + l + '</label><input id="' + id + '" type="number" min="0" step="any" value="' + x + '"></div>').join('') + '<button class="btn primary">Appliquer</button></form><p class="m" style="font-size:12.5px">Facteurs CO₂ : essence 2,287 kg/L et gazole 2,677 kg/L, d’après les valeurs par défaut du GIEC 2006 (vol. 2, ch. 3 tab. 3.2.1 et ch. 1 tab. 1.2), avec des masses volumiques de 0,745 et 0,84 kg/L (hypothèses).</p></section></div></div>';
    $('#hf').addEventListener('submit', (e) => { e.preventDefault(); const n = (id) => parseFloat($('#' + id).value); if ([n('fs'), n('fg'), n('cm'), n('ad')].some((x) => !(x >= 0))) { toast('Saisissez des valeurs positives.', 'warn'); return; } E.cfg.fuel.super = n('fs'); E.cfg.fuel.gasoil = n('fg'); E.cfg.commission = n('cm') / 100; E.cfg.adminDay = n('ad'); journal('Vous', 'Hypothèses financières modifiées'); toast('Hypothèses appliquées'); tick(true); });
  };

  /* ---------- démarrage ---------- */
  reset('type'); buildShell();
  gl = typeof THREE !== 'undefined' && THREE.OrbitControls && F.supported();
  const tmp = () => { const d = document.createElement('div'); d.style.cssText = 'position:absolute;width:800px;height:500px;left:-9999px'; document.body.appendChild(d); return d; };
  if (gl) { try { F.init(tmp(), { onPick: (id) => { if (F.inCab()) return; if (F.inHQ()) { if (id && (id.startsWith('agent:') || id === 'core')) hqFocus(id); return; } if (id === 'depot') { pick(id); enterHQ(); return; } if (id && id.startsWith('veh:')) { enterCab(id); if (st.view === 'command') side(); return; } pick(id); if (st.view === 'command') side(); }, onHover: hover, onFollowEnd: () => { if ($('#vinfo')) vinfo(); } }); F.setTime(st.now); } catch (e) { console.error(e); gl = false; } }
  if (gl) { try { N.init(tmp(), E.AGENTS, (id) => { if (id && id.startsWith('agent:')) { st.agentSel = id.slice(6); N.select(id); agentPanel(); } }); glN = true; } catch (e) { console.error(e); } }
  window.addEventListener('resize', () => { if (gl) F.resize(); if (glN) N.resize(); });
  route(); tick(true);
  // Téléchargements : capacité de l'hôte si disponible, sinon téléchargement navigateur classique (GitHub Pages, serveur local).
  const browserDL = { save: ({ filename, data }) => { const u = URL.createObjectURL(new Blob([data], { type: /\.html$/.test(filename) ? 'text/html' : 'text/csv' })); const a = document.createElement('a'); a.href = u; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); return Promise.resolve(); } };
  if (window.claude && window.claude.use) window.claude.use('downloads').then((d) => { DL = d; if (st.view === 'reports' || st.view === 'yango') render(); }).catch(() => { DL = browserDL; });
  else DL = browserDL;
  window.__fleet = { st, get D() { return D; }, ask, pick, enterCab, exitCab, enterHQ, exitHQ, hqFocus };
})();
