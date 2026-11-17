/* FLEET INTELLIGENCE — moteur de démonstration.
   Données SIMULÉES : véhicules, chauffeurs, clients et montants fictifs. Aucune API Yango n'est connectée.
   Les agents sont des fonctions analytiques déterministes : aucun LLM n'est connecté. */
(function () {
  'use strict';
  const E = (window.FLEET = {});
  function rng(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)); E.clamp = clamp;
  const NF = [0, 1, 2].map((d) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }));
  E.fmt = (v, d = 0) => (v === null || v === undefined || !Number.isFinite(v) ? 'NA' : NF[d].format(v)); window.APPFMT = E.fmt;
  E.pct = (v, d = 0, s) => (v === null || !Number.isFinite(v) ? 'NA' : (s && v > 0 ? '+' : '') + E.fmt(v * 100, d) + ' %');
  E.fcfa = (v) => (v === null || !Number.isFinite(v) ? 'NA' : E.fmt(v) + ' FCFA');
  E.k = (v) => (v === null || !Number.isFinite(v) ? 'NA' : Math.abs(v) >= 1e6 ? E.fmt(v / 1e6, 2) + ' M' : E.fmt(v / 1e3, 0) + ' k');
  const DAYS = 31, TODAY = 30; Object.assign(E, { DAYS, TODAY });
  E.BASE = new Date(2026, 9, 12);
  const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  const JOURS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
  E.dayDate = (d) => { const x = new Date(E.BASE); x.setDate(x.getDate() + d); return x; };
  E.dayLabel = (d, long) => { if (d === TODAY) return long ? "aujourd'hui" : 'Auj.'; if (d === TODAY - 1) return long ? 'hier' : 'Hier'; const x = E.dayDate(d); return (long ? JOURS[x.getDay()] + ' ' : '') + x.getDate() + ' ' + MOIS[x.getMonth()]; };
  E.iso = (d) => { const x = E.dayDate(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
  E.dayOfIso = (s) => { const p = s.split('-').map(Number); return Math.round((new Date(p[0], p[1] - 1, p[2]) - E.BASE) / 864e5); };
  E.hhmm = (m) => String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(Math.floor(m % 60)).padStart(2, '0');

  /* ---------- référentiels ---------- */
  E.SEGS = [
    { id: 'vtc', name: 'VTC / Yango', short: 'VTC' }, { id: 'moto', name: 'Livraison moto', short: 'Moto' },
    { id: 'truck', name: 'Camions et utilitaires', short: 'Camions' }, { id: 'moving', name: 'Déménagement', short: 'Déménagement' },
  ];
  E.seg = (id) => E.SEGS.find((s) => s.id === id);
  E.CATS = { car: 'Voiture VTC', moto: 'Moto', van: 'Fourgonnette', truck: 'Camion', mover: 'Camion de déménagement' };
  // communes d'Abidjan, disposition SCHÉMATIQUE (non géographique)
  E.ZONES = ['Plateau', 'Cocody', 'Adjamé', 'Yopougon', 'Abobo', 'Treichville', 'Marcory', 'Koumassi', 'Port-Bouët', 'Attécoubé', 'Bingerville'];
  E.cfg = {
    fuel: { super: 875, gasoil: 715 }, // FCFA/L, hypothèses de démonstration
    commission: 0.18, // commission plateforme VTC, hypothèse
    driverShare: { vtc: 0.35, moto: 0.3 }, truckDriverDay: 15000, moverPerson: 12000,
    insuranceDay: { car: 2200, moto: 600, van: 3000, truck: 6500, mover: 6000 }, adminDay: 450000,
    serviceKm: { car: 10000, moto: 3000, van: 10000, truck: 15000, mover: 15000 }, idleMax: 3.5, fuelDev: 15,
    co2: { super: 2.287, gasoil: 2.677 }, // kg CO2/L — GIEC 2006 (voir Paramètres)
  };
  const FIRST = ['Konan', 'Aya', 'Moussa', 'Awa', 'Yao', 'Fatou', 'Koffi', 'Mariam', 'Ibrahim', 'Adjoua', 'Seydou', 'Aminata', 'Kouadio', 'Salimata', 'Bakary', 'Akissi', 'Drissa', 'Affoué', 'Lassina', 'Rokia', 'Serge', 'Nadège', 'Hervé', 'Estelle', 'Arouna', 'Clarisse', 'Mamadou', 'Prisca', 'Yacouba', 'Inès'];
  const L = 'ABCDEFGHIJKLMNOPRSTYZ';

  E.generate = function (scn) {
    const r = rng(4242), R = rng(77);
    const V = [], DR = [];
    const mk = (pre, n, cat, seg, fuel, ref) => { for (let i = 1; i <= n; i++) V.push({ id: pre + '-' + String(i).padStart(2, '0'), cat, seg, fuel, ref, odo: Math.round(20000 + R() * 140000), since: 0, svc: E.cfg.serviceKm[cat] }); };
    mk('VTC', 20, 'car', 'vtc', 'super', 7.5); mk('MOTO', 18, 'moto', 'moto', 'super', 3.0); mk('VAN', 8, 'van', 'truck', 'gasoil', 10.5); mk('CAM', 8, 'truck', 'truck', 'gasoil', 24); mk('DEM', 6, 'mover', 'moving', 'gasoil', 21);
    V.forEach((v, i) => { const d = { id: 'CH-' + String(i + 1).padStart(2, '0'), name: FIRST[i % FIRST.length] + ' ' + L[(i * 7) % L.length] + '.', seg: v.seg, veh: v.id, since: 2019 + (i % 7) }; DR.push(d); v.driver = d.id; v.since = Math.round(R() * v.svc * 0.85); });
    V.forEach((v) => (v.since = Math.round(R() * v.svc * (v.cat === 'moto' ? 0.15 : 0.5))));
    const offline = { 'VAN-06': 'Maintenance planifiée', 'VTC-19': 'Réparation carrosserie', 'MOTO-17': 'Pas de chauffeur affecté' };
    const D = { scn, V, DR, offline, day: {}, missions: [], moving: [], maint: [], imports: [] };
    const dow = (d) => E.dayDate(d).getDay();
    const price = { vtc: 3100, moto: 1300, van: 9000, truck: 42000 };
    const per = { vtc: 14, moto: 18, van: 8, truck: 3 }, kmPer = { vtc: 7.5, moto: 6, van: 12, truck: 34 }, dur = { vtc: 26, moto: 32, van: 65, truck: 160, mover: 360 };
    let mid = 1;
    for (let d = 0; d <= TODAY; d++) {
      const w = dow(d);
      V.forEach((v) => {
        const key = v.cat === 'car' ? 'vtc' : v.cat === 'moto' ? 'moto' : v.cat === 'van' ? 'van' : v.cat === 'truck' ? 'truck' : null;
        const rec = (D.day[v.id] = D.day[v.id] || [])[d] = { n: 0, km: 0, rev: 0, fuelL: 0, active: 0, idle: 0, late: 0, ontime: 0, maint: 0, off: false };
        const off = (d === TODAY && offline[v.id]) || (v.id === 'VAN-06' && d >= 28) || (v.id === 'VTC-19' && d >= 27) || (r() < 0.025);
        if (off) { rec.off = true; return; }
        if (!key) return; // déménagement traité à part
        let f = 0.9 + 0.2 * r();
        if (key === 'vtc') f *= w === 5 || w === 6 ? 1.2 : w === 0 ? 0.85 : 1;
        if (key !== 'vtc') f *= w === 0 ? 0.35 : w === 6 ? 0.7 : 1;
        if (v.driver === 'CH-14' && d >= 20) f *= 1 - 0.03 * (d - 19); // baisse de productivité d'un chauffeur
        const n = Math.max(0, Math.round(per[key] * f));
        // missions détaillées pour aujourd'hui et quelques jours (pour la carte et les retards)
        let late = 0, ot = 0;
        for (let k = 0; k < n; k++) {
          const z1 = E.ZONES[Math.floor(r() * E.ZONES.length)], z2 = key === 'truck' && v.id === 'CAM-05' && r() < 0.6 ? 'Bingerville' : E.ZONES[Math.floor(r() * E.ZONES.length)];
          const startH = (key === 'vtc' ? 6 : 7) + ((key === 'vtc' ? 16.5 : 11) * (k + r() * 0.8)) / Math.max(n, 1);
          let delay = r() < 0.1 ? 10 + r() * 25 : r() * 6;
          if (key === 'moto' && (z2 === 'Yopougon' || z1 === 'Yopougon')) delay += r() < 0.55 ? 15 + r() * 30 : 0; // retards Yopougon
          if (scn === 'traffic' && d === TODAY && startH > 16 && startH < 20) delay += 20 + r() * 25;
          const km = kmPer[key] * (0.7 + 0.6 * r()) * (z2 === 'Bingerville' && key === 'truck' ? 1.8 : 1);
          const rev = price[key] * (0.85 + 0.3 * r()) * (scn === 'demand' && d === TODAY && key === 'moto' ? 1 : 1);
          const isLate = delay > 15; if (isLate) late++; else ot++;
          if (d >= TODAY - 1) D.missions.push({ id: 'MS-' + String(mid++).padStart(5, '0'), d, seg: v.seg, key, veh: v.id, driver: v.driver, from: z1, to: z2, start: d * 24 * 60 + startH * 60, dur: dur[key] * (0.8 + 0.4 * r()), delay, km, rev });
          rec.km += km; rec.rev += rev;
        }
        if (scn === 'demand' && d === TODAY && key === 'moto') { for (let k = 0; k < 6; k++) { const startH = 11 + k * 0.5; D.missions.push({ id: 'MS-' + String(mid++).padStart(5, '0'), d, seg: 'moto', key, veh: v.id, driver: v.driver, from: 'Cocody', to: E.ZONES[k % 11], start: d * 1440 + startH * 60, dur: 32, delay: 12 + r() * 20, km: 6, rev: 1200, surge: true }); rec.km += 6; rec.rev += 1200; } }
        rec.n = n; rec.late = late; rec.ontime = ot;
        rec.km += key === 'vtc' ? 25 : 10;
        let cons = v.ref * (0.94 + 0.12 * r()); if (v.id === 'VTC-07' && d >= 20) cons *= 1.32; if (v.id === 'CAM-03') cons *= 1.06;
        rec.fuelL = (rec.km * cons) / 100;
        rec.active = n * dur[key] / 60 * 0.95; rec.idle = Math.max(0, (key === 'vtc' ? 12 : 10) - rec.active) * (v.id === 'CAM-03' ? 1 : 0.35) + (v.id === 'CAM-03' ? 3 : 0);
        if (r() < 0.02) { const c = Math.round(25000 + r() * 90000); rec.maint += c; D.maint.push({ d, veh: v.id, cost: c, type: 'Corrective', note: ['Pneus', 'Freins', 'Batterie', 'Embrayage'][Math.floor(r() * 4)] }); }
        v.since += rec.km; v.odo += rec.km;
      });
      // déménagement : 0 à 2 missions par jour
      const nm = w === 0 ? 0 : r() < 0.5 ? 2 : r() < 0.6 ? 1 : 3;
      for (let k = 0; k < nm; k++) {
        const v = V.filter((x) => x.cat === 'mover' && !D.day[x.id][d].off)[k % 5]; if (!v) continue;
        const vol = Math.round(18 + r() * 40), est = 60000 + vol * 2200, price2 = Math.round((est * (1.6 + r() * 0.25)) / 5000) * 5000;
        const under = v.id === 'DEM-02' && r() < 0.7; const actual = Math.round(est * (under ? 1.32 + r() * 0.15 : 0.92 + r() * 0.15));
        const km = 25 + r() * 40; const rec = D.day[v.id][d]; rec.n += 1; rec.km += km; rec.rev += price2; rec.fuelL += (km * v.ref) / 100; rec.active += 6; rec.idle += 2; v.since += km; v.odo += km;
        const z1 = E.ZONES[Math.floor(r() * 11)], z2 = E.ZONES[Math.floor(r() * 11)];
        D.moving.push({ id: 'DM-' + String(D.moving.length + 101), d, client: 'Client ' + (r() < 0.3 ? 'entreprise' : 'particulier') + ' C-' + String(300 + D.moving.length), from: z1, to: z2, veh: v.id, team: [FIRST[Math.floor(r() * 30)], FIRST[Math.floor(r() * 30)], FIRST[Math.floor(r() * 30)]], vol, est, actual: d < TODAY ? actual : null, price: price2, start: d * 1440 + (8 + r() * 2) * 60, dur: 300 + vol * 3,
          status: d < TODAY ? 'Terminée' : 'Planifiée', invoice: d < TODAY - 10 ? (r() < 0.15 ? 'En retard de paiement' : 'Payée') : d < TODAY ? (r() < 0.5 ? 'Facturée' : 'Payée') : 'Non facturée' });
        if (d >= TODAY - 1) D.missions.push({ id: 'MS-' + String(mid++).padStart(5, '0'), d, seg: 'moving', key: 'mover', veh: v.id, driver: v.driver, from: z1, to: z2, start: d * 1440 + 8.5 * 60, dur: 300 + vol * 3, delay: r() * 20, km, rev: price2 });
      }
    }
    // demandes à venir
    for (let i = 0; i < 9; i++) { const vol = Math.round(15 + r() * 45), est = 60000 + vol * 2200; D.moving.push({ id: 'DM-' + String(D.moving.length + 101), d: TODAY + 1 + Math.floor(i / 2), client: 'Client ' + (r() < 0.3 ? 'entreprise' : 'particulier') + ' C-' + String(300 + D.moving.length), from: E.ZONES[Math.floor(r() * 11)], to: E.ZONES[Math.floor(r() * 11)], veh: i < 5 ? 'DEM-0' + ((i % 5) + 1) : null, team: i < 5 ? [FIRST[i], FIRST[i + 9], FIRST[i + 17]] : null, vol, est, actual: null, price: Math.round((est * 1.5) / 5000) * 5000, status: i < 5 ? 'Planifiée' : 'Demande reçue', invoice: 'Non facturée', start: (TODAY + 1 + Math.floor(i / 2)) * 1440 + 9 * 60, dur: 320 }); }
    D.missions.sort((a, b) => a.start - b.start);
    V.forEach((v) => { if (v.since > v.svc * 0.97) { D.maint.push({ d: 18 + (v.id.charCodeAt(5) % 8), veh: v.id, cost: { car: 85000, moto: 30000, van: 140000, truck: 260000, mover: 240000 }[v.cat], type: 'Préventive', note: 'Entretien périodique' }); v.since = Math.round(v.since % (v.svc * 0.55)); } });
    V.find((v) => v.id === 'MOTO-11').since = 3160; V.find((v) => v.id === 'VAN-04').since = 9550; V.find((v) => v.id === 'MOTO-04').since = 2780;
    return D;
  };


  /* ---------- plan en quadrillage (mini-carte schématique, non géographique) ---------- */
  E.GRID = { step: 34, cols: 7, rows: 5, bridges: [1, 3, 5], depot: [4, 1],
    zones: { Abobo: [3, 0], 'Adjamé': [2, 1], Yopougon: [0, 1], 'Attécoubé': [1, 2], Plateau: [3, 2], Cocody: [5, 1], Bingerville: [6, 0], Treichville: [2, 3], Marcory: [4, 3], Koumassi: [5, 3], 'Port-Bouët': [4, 4] } };
  E.node = (c, r) => ({ x: (c - 3) * E.GRID.step, z: (r - 2) * E.GRID.step });
  const passable = (c1, r1, c2, r2) => { if (c2 < 0 || r2 < 0 || c2 >= E.GRID.cols || r2 >= E.GRID.rows) return false; if (c1 === c2 && Math.min(r1, r2) === 2 && Math.max(r1, r2) === 3) return E.GRID.bridges.includes(c1); return true; };
  const pcache = {};
  E.pathPts = function (from, to) {
    const key = from + '>' + to; if (pcache[key]) return pcache[key];
    const a = E.GRID.zones[from], b = E.GRID.zones[to]; let nodes;
    if (from === to) { const dc = a[0] < E.GRID.cols - 1 ? 1 : -1, dr = a[1] === 2 || a[1] === 4 ? -1 : 1; nodes = [a, [a[0] + dc, a[1]], [a[0] + dc, a[1] + dr], [a[0], a[1] + dr], a]; }
    else { const prev = {}, q = [a], k = (n) => n[0] + ',' + n[1]; prev[k(a)] = null;
      while (q.length) { const n = q.shift(); if (n[0] === b[0] && n[1] === b[1]) break; const dirs = (n[0] + n[1]) % 2 ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : [[0, 1], [0, -1], [1, 0], [-1, 0]];
        dirs.forEach(([dc, dr]) => { const m = [n[0] + dc, n[1] + dr]; if (passable(n[0], n[1], m[0], m[1]) && !(k(m) in prev)) { prev[k(m)] = n; q.push(m); } }); }
      nodes = []; let c = b; while (c) { nodes.unshift(c); c = prev[k(c)]; } }
    return (pcache[key] = nodes.map((n) => E.node(n[0], n[1])));
  };
  // position sur une polyligne (u de 0 à 1), décalée sur la voie de droite
  E.sample = function (pts, u, lane) {
    let L = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z); seg.push(d); L += d; }
    let s = clamp(u, 0, 1) * L, i = 0; while (i < seg.length - 1 && s > seg[i]) { s -= seg[i]; i++; }
    const a = pts[i], b = pts[i + 1] || pts[i], d = seg[i] || 1, dx = (b.x - a.x) / d, dz = (b.z - a.z) / d, t = Math.min(1, s / d), off = lane == null ? 2 : lane;
    return { x: a.x + (b.x - a.x) * t - dz * off, z: a.z + (b.z - a.z) * t + dx * off, heading: Math.atan2(-dz, dx), len: L, left: (1 - clamp(u, 0, 1)) * L };
  };

  /* ---------- lecture ---------- */
  E.nowMin = (now) => TODAY * 1440 + now;
  E.mStatus = (m, t) => { if (t < m.start) return 'plan'; const end = m.start + m.dur + m.delay; if (t >= end) return 'done'; if (t > m.start + m.dur + 5 && m.delay > 15) return 'late'; return 'run'; };
  E.vehStatus = function (D, v, now, alerts) {
    const t = E.nowMin(now);
    if (D.offline[v.id]) return { s: 'off', label: 'Hors ligne', why: D.offline[v.id] };
    const crit = (alerts || []).find((a) => a.veh === v.id && a.sev === 'crit' && a.state !== 'resolved');
    const cur = D.missions.find((m) => m.veh === v.id && m.d === TODAY && E.mStatus(m, t) !== 'plan' && E.mStatus(m, t) !== 'done');
    if (crit) return { s: 'crit', label: 'Alerte critique', why: crit.title, m: cur };
    if (cur) return E.mStatus(cur, t) === 'late' ? { s: 'late', label: 'En retard', why: 'Mission ' + cur.id + ' en retard', m: cur } : { s: 'mission', label: 'En mission', why: cur.from + ' → ' + cur.to, m: cur };
    const shiftEnd = v.seg === 'vtc' ? 23.5 : 19.5; if (now / 60 < 6 || now / 60 > shiftEnd) return { s: 'off', label: 'Hors ligne', why: 'Hors des heures de service' };
    return { s: 'avail', label: 'Disponible', why: 'Prêt pour une mission' };
  };
  E.fuelLevel = (v, now) => { const h = (v.id.charCodeAt(4) * 37 + v.id.charCodeAt(5) * 11) % 100; return clamp(0.95 - ((now / 60 - 6) / 16) * (0.45 + (h % 30) / 100) + (h % 13) / 100, 0.08, 1); };

  /* agrégats d'une période [d0, d1] (jours complets, aujourd'hui au prorata de l'heure) */
  E.period = function (D, d0, d1, now, seg) {
    const out = { n: 0, km: 0, rev: 0, fuelL: 0, fuelC: 0, maint: 0, active: 0, idle: 0, late: 0, ontime: 0, vehDays: 0, activeVehDays: 0, co2: 0, driver: 0, insurance: 0, commission: 0, admin: 0, bySeg: {} };
    E.SEGS.forEach((s) => (out.bySeg[s.id] = { rev: 0, fuelC: 0, maint: 0, driver: 0, insurance: 0, commission: 0, admin: 0, n: 0, km: 0 }));
    const fr = now / 60 >= 23 ? 1 : clamp((now / 60 - 6) / 17, 0, 1);
    for (let d = d0; d <= d1; d++) {
      const w = d === TODAY ? fr : 1;
      D.V.forEach((v) => {
        if (seg && seg !== 'all' && v.seg !== seg) return; const x = D.day[v.id][d]; out.vehDays += w; if (x.off) return; if (x.n) out.activeVehDays += w;
        const fuelC = x.fuelL * E.cfg.fuel[v.fuel] * w, b = out.bySeg[v.seg];
        const drv = v.seg === 'vtc' || v.seg === 'moto' ? x.rev * E.cfg.driverShare[v.seg] : v.seg === 'truck' ? (x.n ? E.cfg.truckDriverDay : 0) : 0;
        const com = v.seg === 'vtc' ? x.rev * E.cfg.commission : 0, ins = E.cfg.insuranceDay[v.cat];
        out.n += x.n * w; out.km += x.km * w; out.rev += x.rev * w; out.fuelL += x.fuelL * w; out.fuelC += fuelC; out.maint += x.maint * w; out.active += x.active * w; out.idle += x.idle * w; out.late += x.late * w; out.ontime += x.ontime * w; out.co2 += (x.fuelL * w * E.cfg.co2[v.fuel]) / 1000;
        out.driver += drv * w; out.commission += com * w; out.insurance += ins * w;
        b.rev += x.rev * w; b.fuelC += fuelC; b.maint += x.maint * w; b.driver += drv * w; b.commission += com * w; b.insurance += ins * w; b.n += x.n * w; b.km += x.km * w;
      });
      // équipes de déménagement
      D.moving.filter((m) => m.d === d && m.d <= TODAY).forEach((m) => { if (seg && seg !== 'all' && seg !== 'moving') return; const c = 3 * E.cfg.moverPerson * (d === TODAY ? fr : 1); out.driver += c; out.bySeg.moving.driver += c; });
      out._adminW = (out._adminW || 0) + E.cfg.adminDay * w;
    }
    const shares = { vtc: 0.3, moto: 0.25, truck: 0.3, moving: 0.15 }; // clé de répartition des frais généraux (hypothèse)
    E.SEGS.forEach((s) => (out.bySeg[s.id].admin = (out._adminW || 0) * shares[s.id]));
    out.admin = seg && seg !== 'all' ? (out._adminW || 0) * shares[seg] : out._adminW || 0;
    out.cost = out.fuelC + out.maint + out.driver + out.insurance + out.commission + out.admin;
    out.margin = out.rev ? (out.rev - out.cost) / out.rev : null; out.util = out.vehDays ? out.activeVehDays / out.vehDays : null; out.ontimeRate = out.late + out.ontime ? out.ontime / (out.late + out.ontime) : null;
    E.SEGS.forEach((s) => { const b = out.bySeg[s.id]; b.cost = b.fuelC + b.maint + b.driver + b.insurance + b.commission + b.admin; b.net = b.rev - b.cost; b.margin = b.rev ? b.net / b.rev : null; });
    return out;
  };

  E.vehStats = function (D, d0, d1, now) {
    return D.V.map((v) => { let n = 0, km = 0, rev = 0, L2 = 0, idle = 0, act = 0, late = 0, ot = 0, days = 0;
      for (let d = d0; d <= d1; d++) { const x = D.day[v.id][d]; if (x.off) continue; days++; n += x.n; km += x.km; rev += x.rev; L2 += x.fuelL; idle += x.idle; act += x.active; late += x.late; ot += x.ontime; }
      const fuelC = L2 * E.cfg.fuel[v.fuel]; const cost = fuelC + E.cfg.insuranceDay[v.cat] * days + (v.seg === 'vtc' || v.seg === 'moto' ? rev * E.cfg.driverShare[v.seg] : 0) + (v.seg === 'vtc' ? rev * E.cfg.commission : 0);
      return { v, n, km, rev, fuelL: L2, cons: km ? (L2 / km) * 100 : null, consDev: km ? (L2 / km) * 100 / v.ref - 1 : null, idle: days ? idle / days : null, active: days ? act / days : null, days, revDay: days ? rev / days : null, ontime: late + ot ? ot / (late + ot) : null, profit: rev - cost, costKm: km ? cost / km : null };
    });
  };
  E.driverStats = function (D, d0, d1, now) {
    const vs = E.vehStats(D, d0, d1, now);
    return D.DR.map((dr) => { const x = vs.find((y) => y.v.id === dr.veh); const early = E.vehStats(D, d0, Math.floor((d0 + d1) / 2), now).find((y) => y.v.id === dr.veh), late = E.vehStats(D, Math.floor((d0 + d1) / 2) + 1, d1, now).find((y) => y.v.id === dr.veh);
      const trend = early.days >= 3 && late.days >= 3 && early.n ? (late.n / late.days) / (early.n / early.days) - 1 : null;
      const score = x.days ? Math.round(clamp(45 * Math.min(1.15, (x.n / x.days) / ({ vtc: 14, moto: 18, truck: x.v.cat === 'van' ? 8 : 3, moving: 1 }[x.v.seg])) / 1.15 + 35 * (x.ontime == null ? 0.9 : x.ontime) + 20 * clamp(1 - (x.idle || 0) / 8, 0, 1), 0, 100)) : null;
      return { dr, x, perDay: x.days ? x.n / x.days : null, trend, score }; });
  };

  /* ---------- alertes ---------- */
  E.buildAlerts = function (D, now) {
    const L = [], t = E.nowMin(now), add = (o) => { if (o.at <= t) L.push(o); };
    const vs = E.vehStats(D, TODAY - 7, TODAY - 1, now), g = (id) => vs.find((x) => x.v.id === id);
    const v7 = g('VTC-07');
    add({ id: 'AL-FUEL-07', at: 22 * 1440 + 9 * 60, sev: 'warn', veh: 'VTC-07', agent: 'fuel', type: 'Consommation de carburant anormale', title: 'VTC-07 consomme anormalement', desc: 'La consommation de VTC-07 dépasse sa référence depuis le ' + E.dayLabel(20) + '.', meas: ['Consommation 7 j : ' + E.fmt(v7.cons, 1) + ' L/100 km', 'Référence : ' + E.fmt(v7.v.ref, 1) + ' L/100 km (' + E.pct(v7.consDev, 0, true) + ')'], action: 'Contrôler pression des pneus, filtre à air et injection ; vérifier les pleins (cartes carburant).' });
    const m11 = D.V.find((v) => v.id === 'MOTO-11'), over = m11.since / m11.svc - 1;
    add({ id: 'AL-MNT-11', at: TODAY * 1440 + 6 * 60, sev: over > 0.05 ? 'crit' : 'warn', veh: 'MOTO-11', agent: 'maint', type: 'Maintenance en retard', title: 'Entretien de MOTO-11 dépassé', desc: 'MOTO-11 a dépassé son intervalle d’entretien.', meas: ['Depuis le dernier entretien : ' + E.fmt(m11.since) + ' km', 'Intervalle : ' + E.fmt(m11.svc) + ' km (' + E.pct(over, 0, true) + ')'], action: 'Immobiliser MOTO-11 pour entretien à la fin de la mission en cours.' });
    const c3 = g('CAM-03');
    add({ id: 'AL-IDLE-03', at: 25 * 1440 + 17 * 60, sev: 'warn', veh: 'CAM-03', agent: 'fleet', type: 'Inactivité prolongée', title: 'CAM-03 reste longtemps inactif moteur tournant', desc: 'Le camion CAM-03 cumule de longues périodes d’inactivité chaque jour.', meas: ['Inactivité moyenne : ' + E.fmt(c3.idle, 1) + ' h/j', 'Seuil : ' + E.cfg.idleMax + ' h/j'], action: 'Revoir l’affectation de CAM-03 ou le mutualiser avec un autre client.' });
    const ds = E.driverStats(D, TODAY - 14, TODAY - 1, now).find((x) => x.dr.id === 'CH-14');
    add({ id: 'AL-DRV-14', at: 27 * 1440 + 8 * 60, sev: 'warn', veh: ds.dr.veh, driver: 'CH-14', agent: 'driver', type: 'Baisse de productivité', title: 'Productivité en baisse : ' + ds.dr.name, desc: 'Le nombre de courses par jour de ' + ds.dr.name + ' baisse depuis une dizaine de jours.', meas: ['Tendance 14 j : ' + E.pct(ds.trend, 0, true), 'Courses par jour : ' + E.fmt(ds.perDay, 1)], action: 'Entretien individuel ; vérifier l’état du véhicule et les zones affectées.' });
    const yp = D.missions.filter((m) => m.key === 'moto' && m.d === TODAY - 1 && (m.from === 'Yopougon' || m.to === 'Yopougon'));
    add({ id: 'AL-DLY-YOP', at: 29 * 1440 + 20 * 60, sev: 'warn', veh: null, zone: 'Yopougon', agent: 'delivery', type: 'Retards de livraison', title: 'Livraisons moto en retard vers Yopougon', desc: 'Les livraisons moto qui touchent Yopougon arrivent nettement plus en retard que les autres.', meas: ['À l’heure hier : ' + E.pct(yp.filter((m) => m.delay <= 15).length / Math.max(1, yp.length), 0), 'Autres zones : ' + E.pct(D.missions.filter((m) => m.key === 'moto' && m.d === TODAY - 1 && m.from !== 'Yopougon' && m.to !== 'Yopougon' && m.delay <= 15).length / Math.max(1, D.missions.filter((m) => m.key === 'moto' && m.d === TODAY - 1 && m.from !== 'Yopougon' && m.to !== 'Yopougon').length), 0)], action: 'Allonger les délais promis vers Yopougon ou y positionner deux motos en attente.' });
    const dm = D.moving.filter((m) => m.veh === 'DEM-02' && m.actual);
    add({ id: 'AL-MOV-02', at: 24 * 1440 + 18 * 60, sev: 'warn', veh: 'DEM-02', agent: 'finance', type: 'Mission non rentable', title: 'Devis de déménagement sous-estimés (DEM-02)', desc: 'Le coût réel des missions de DEM-02 dépasse largement l’estimation du devis.', meas: ['Missions : ' + dm.length, 'Écart moyen coût réel / estimé : ' + E.pct(dm.reduce((a, m) => a + m.actual / m.est, 0) / Math.max(1, dm.length) - 1, 0, true)], action: 'Revoir la grille de devis (volume, étages, distance) avec le responsable déménagement.' });
    const c5 = D.missions.filter((m) => m.veh === 'CAM-05' && m.to === 'Bingerville');
    add({ id: 'AL-RTE-05', at: 29 * 1440 + 12 * 60, sev: 'info', veh: 'CAM-05', agent: 'route', type: 'Route non rentable', title: 'La liaison vers Bingerville de CAM-05 est peu rentable', desc: 'Ces livraisons font presque deux fois plus de kilomètres pour un tarif identique.', meas: ['Livraisons concernées (2 j) : ' + c5.length, 'Distance moyenne : ' + E.fmt(c5.reduce((a, m) => a + m.km, 0) / Math.max(1, c5.length)) + ' km'], action: 'Appliquer un supplément de distance ou regrouper les livraisons Bingerville.' });
    // retards en direct
    D.missions.filter((m) => m.d === TODAY && m.delay > 40).forEach((m) => add({ id: 'AL-' + m.id, at: m.start + m.dur + 5, sev: 'warn', veh: m.veh, agent: 'delivery', live: true, type: 'Retard de livraison', title: m.veh + ' en retard sur ' + m.id, desc: 'Mission ' + E.seg(m.seg).name.toLowerCase() + ' ' + m.from + ' → ' + m.to + '.', meas: ['Retard estimé : ' + E.fmt(m.delay) + ' min'], action: 'Prévenir le client et réaffecter la mission suivante si besoin.' }));
    L.sort((a, b) => b.at - a.at); return L;
  };

  /* ---------- prévisions (modèle de base, explicite) ---------- */
  E.forecast = function (D, now, what, seg) {
    const hist = [], out = [];
    for (let d = TODAY - 14; d < TODAY; d++) { const p = E.period(D, d, d, 1439, seg); hist.push({ d, v: what === 'rev' ? p.rev : what === 'fuel' ? p.fuelL : what === 'util' ? p.util * 100 : what === 'opex' ? p.cost : what === 'demand' ? p.n : 0 }); }
    // moyenne par jour de semaine sur 2 semaines + tendance
    const byDow = {}; hist.forEach((x) => { const w = E.dayDate(x.d).getDay(); (byDow[w] = byDow[w] || []).push(x.v); });
    const m1 = hist.slice(0, 7).reduce((a, x) => a + x.v, 0) / 7, m2 = hist.slice(7).reduce((a, x) => a + x.v, 0) / 7, tr = m1 ? (m2 / m1 - 1) / 7 : 0;
    const sd = Math.sqrt(hist.reduce((a, x) => { const w = E.dayDate(x.d).getDay(); const mu = byDow[w].reduce((p, q) => p + q, 0) / byDow[w].length; return a + Math.pow(x.v - mu, 2); }, 0) / hist.length) || m2 * 0.05;
    for (let i = 0; i < 14; i++) { const d = TODAY + i; const w = E.dayDate(d).getDay(); const mu = byDow[w].reduce((p, q) => p + q, 0) / byDow[w].length; const v = mu * (1 + clamp(tr, -0.02, 0.02) * (i + 3)); const half = 1.64 * sd * Math.sqrt(1 + i / 7); out.push({ d, v, lo: Math.max(0, v - half), hi: v + half }); }
    return { hist, out };
  };
  E.maintPlan = function (D, now) {
    const vs = E.vehStats(D, TODAY - 7, TODAY - 1, now);
    return D.V.map((v) => { const x = vs.find((y) => y.v.id === v.id); const kmDay = x.days ? x.km / x.days : 0; const left = v.svc - v.since; const days = kmDay ? left / kmDay : null;
      const risk = Math.round(clamp((v.since / v.svc) * 55 + (x.consDev > 0.1 ? 25 : 0) + (D.offline[v.id] ? 0 : 0) + (v.odo > 150000 ? 10 : 0), 0, 100));
      return { v, kmDay, left, days, risk, state: left < 0 ? 'overdue' : days !== null && days < 7 ? 'soon' : 'ok', cost: { car: 85000, moto: 30000, van: 140000, truck: 260000, mover: 240000 }[v.cat] }; }).sort((a, b) => (a.days ?? 1e9) - (b.days ?? 1e9));
  };

  /* ---------- agents ---------- */
  E.AGENTS = [
    { id: 'fleet', name: 'Supervision de flotte', role: 'Disponibilité, utilisation, statut opérationnel et performance de la flotte.', data: ['Statuts véhicules', 'Planning des missions'] },
    { id: 'route', name: 'Optimisation des itinéraires', role: 'Distances, horaires, efficacité des itinéraires et consommation par trajet. Trafic : non connecté.', data: ['Missions et distances', 'Zones (schématiques)'] },
    { id: 'maint', name: 'Maintenance prédictive', role: 'Besoins d’entretien, coûts et immobilisations prévus. Ne prédit pas une panne certaine.', data: ['Kilométrage', 'Historique d’entretien', 'Consommation'] },
    { id: 'finance', name: 'Intelligence financière', role: 'Revenus, dépenses, rentabilité, coût par kilomètre et par livraison, par segment.', data: ['Revenus des missions', 'Coûts (hypothèses)'] },
    { id: 'driver', name: 'Performance des chauffeurs', role: 'Productivité, missions réalisées, inactivité et ponctualité des chauffeurs.', data: ['Missions par chauffeur', 'Temps actif et inactif'] },
    { id: 'delivery', name: 'Opérations de livraison', role: 'Affectation des commandes, allocation des véhicules, délais et charge de travail.', data: ['Commandes', 'Statuts de livraison'] },
    { id: 'fuel', name: 'Carburant et énergie', role: 'Consommation, dépenses, anomalies, efficacité et estimation des émissions de CO₂.', data: ['Pleins (simulés)', 'Facteurs d’émission GIEC 2006'] },
    { id: 'bi', name: 'Business intelligence', role: 'Rapports quotidiens, hebdomadaires et mensuels, prévisions et recommandations stratégiques.', data: ['Résultats des agents'] },
  ];
  E.agent = (id) => E.AGENTS.find((a) => a.id === id);
  const INT = [
    { id: 'perf', label: 'Résumer la performance de la flotte', kw: ['comment va', 'performance', 'situation', 'résumé', 'resume', 'aujourd'], agents: ['fleet', 'finance', 'delivery'] },
    { id: 'segment', label: 'Comparer les marges par segment', kw: ['segment', 'marge', 'profitable'], agents: ['finance', 'bi'] },
    { id: 'fuel', label: 'Détecter les anomalies de carburant', kw: ['carburant', 'essence', 'fuel', 'consommation', 'co2', 'co₂'], agents: ['fuel', 'maint', 'finance'] },
    { id: 'maint', label: 'Lister les besoins de maintenance', kw: ['maintenance', 'entretien', 'panne', 'garage'], agents: ['maint', 'fleet', 'finance'] },
    { id: 'drivers', label: 'Évaluer les chauffeurs', kw: ['chauffeur', 'driver', 'productiv'], agents: ['driver', 'fleet'] },
    { id: 'delays', label: 'Analyser les retards de livraison', kw: ['retard', 'delay', 'en retard'], agents: ['delivery', 'route', 'driver'] },
    { id: 'routes', label: 'Repérer les routes et missions non rentables', kw: ['route', 'itinéraire', 'rentable', 'déficit', 'perte'], agents: ['route', 'finance', 'delivery'] },
    { id: 'idle', label: 'Repérer les véhicules sous-utilisés', kw: ['inactif', 'inactivité', 'sous-utilis', 'idle', 'utilisation'], agents: ['fleet', 'driver', 'finance'] },
    { id: 'forecast', label: 'Prévoir revenus et demande', kw: ['prévi', 'previ', 'semaine prochaine', 'prochains jours', 'demain'], agents: ['bi', 'delivery', 'finance'] },
    { id: 'report', label: 'Produire le rapport hebdomadaire', kw: ['rapport', 'report'], agents: ['fleet', 'finance', 'driver', 'fuel', 'maint', 'bi'] },
  ];
  E.INTENTS = INT;
  E.SUGGESTIONS = ['Comment va la flotte aujourd’hui ?', 'Quel segment génère la meilleure marge ?', 'Y a-t-il une consommation de carburant anormale ?', 'Quels véhicules ont besoin d’une maintenance ?', 'Quels chauffeurs sont les plus productifs ?', 'Pourquoi les livraisons sont-elles en retard ?', 'Quelles routes ne sont pas rentables ?', 'Quels véhicules sont sous-utilisés ?', 'Prévois les revenus de la semaine prochaine.', 'Génère le rapport hebdomadaire.'];
  E.route = (q) => { const s = q.toLowerCase(); let b = null, bs = 0; INT.forEach((it) => { const sc = it.kw.reduce((n, k) => n + (s.includes(k) ? 1 : 0), 0); if (sc > bs) { bs = sc; b = it; } }); return b; };

  E.runTask = function (a, intent, D, now) {
    const f = (text, x) => Object.assign({ agent: a, text }, x || {});
    const T = E.period(D, TODAY, TODAY, now), W = E.period(D, TODAY - 7, TODAY - 1, now), vs = E.vehStats(D, TODAY - 7, TODAY - 1, now);
    const st = D.V.map((v) => E.vehStatus(D, v, now, [])); const cnt = (s) => st.filter((x) => x.s === s).length;
    switch (intent + ':' + a) {
      case 'perf:fleet': return f(D.V.length + ' véhicules : ' + cnt('mission') + ' en mission, ' + cnt('late') + ' en retard, ' + cnt('avail') + ' disponibles, ' + cnt('off') + ' hors ligne. Utilisation 7 j : ' + E.pct(W.util, 0) + '.');
      case 'perf:finance': return f('Revenus du jour à ' + E.hhmm(now) + ' : ' + E.fcfa(T.rev) + ' ; marge opérationnelle 7 j : ' + E.pct(W.margin, 1) + '.');
      case 'perf:delivery': return f('Ponctualité 7 j : ' + E.pct(W.ontimeRate, 0) + ' ; ' + E.fmt(T.n) + ' missions réalisées aujourd’hui.');
      case 'segment:finance': { const s = E.SEGS.map((x) => ({ x, b: W.bySeg[x.id] })).sort((p, q) => q.b.margin - p.b.margin); return f(s.map((y) => y.x.name + ' ' + E.pct(y.b.margin, 0) + ' (' + E.k(y.b.net) + ' FCFA net)').join(', ') + '.', { s }); }
      case 'segment:bi': return f('Le classement change selon l’indicateur : en revenu absolu, ' + E.SEGS.slice().sort((p, q) => W.bySeg[q.id].rev - W.bySeg[p.id].rev)[0].name + ' arrive en tête.');
      case 'fuel:fuel': { const x = vs.filter((y) => y.consDev > E.cfg.fuelDev / 100).sort((p, q) => q.consDev - p.consDev); return f(x.length ? x.map((y) => y.v.id + ' : ' + E.fmt(y.cons, 1) + ' L/100 km (' + E.pct(y.consDev, 0, true) + ')').join(', ') + '.' : 'Aucune anomalie de consommation.', { x }); }
      case 'fuel:maint': return f('Pour VTC-07, la dérive commence le ' + E.dayLabel(20) + ' à kilométrage normal : à vérifier en atelier. Anomalie détectée, pas une panne confirmée.');
      case 'fuel:finance': { const x = vs.find((y) => y.v.id === 'VTC-07'); const extra = x.fuelL - (x.km * x.v.ref) / 100; return f('Surcoût carburant de VTC-07 : environ ' + E.fcfa(extra * E.cfg.fuel.super) + ' sur 7 jours. Dépense carburant flotte 7 j : ' + E.fcfa(W.fuelC) + ' ; CO₂ estimé : ' + E.fmt(W.co2, 1) + ' t.'); }
      case 'maint:maint': { const P = E.maintPlan(D, now).filter((x) => x.state !== 'ok').slice(0, 6); return f(P.map((x) => x.v.id + ' : ' + (x.left < 0 ? 'dépassé de ' + E.fmt(-x.left) + ' km' : 'dans ' + E.fmt(x.days, 0) + ' j')).join(', ') + '.', { P }); }
      case 'maint:fleet': return f('Immobiliser ces véhicules réduit la flotte disponible ; ' + D.V.filter((v) => D.offline[v.id]).length + ' véhicules sont déjà hors ligne aujourd’hui.');
      case 'maint:finance': { const P = E.maintPlan(D, now).filter((x) => x.state !== 'ok'); return f('Coût d’entretien prévisible : ' + E.fcfa(P.reduce((s, x) => s + x.cost, 0)) + ' (barème de démonstration).'); }
      case 'drivers:driver': { const S = E.driverStats(D, TODAY - 14, TODAY - 1, now).filter((x) => x.score != null).sort((p, q) => q.score - p.score); return f('Meilleurs scores : ' + S.slice(0, 3).map((x) => x.dr.name + ' (' + x.dr.veh + ', ' + x.score + ')').join(', ') + '. En baisse : ' + S.filter((x) => x.trend != null && x.trend < -0.15).map((x) => x.dr.name + ' ' + E.pct(x.trend, 0, true)).join(', ') + '.', { S }); }
      case 'drivers:fleet': return f('Les scores sont comparés à l’intérieur d’un même segment : une course VTC et une livraison camion ne se comparent pas.');
      case 'delays:delivery': { const L = D.missions.filter((m) => m.d === TODAY && E.mStatus(m, E.nowMin(now)) === 'late'); return f(L.length + ' missions en retard en ce moment ; ponctualité moto 7 j : ' + E.pct(E.period(D, TODAY - 7, TODAY - 1, now, 'moto').ontimeRate, 0) + '.'); }
      case 'delays:route': { const y = D.missions.filter((m) => m.key === 'moto' && m.d === TODAY - 1); const yp = y.filter((m) => m.from === 'Yopougon' || m.to === 'Yopougon'); return f('Hier, livraisons moto touchant Yopougon : ' + E.pct(yp.filter((m) => m.delay <= 15).length / Math.max(1, yp.length), 0) + ' à l’heure contre ' + E.pct(y.filter((m) => !(m.from === 'Yopougon' || m.to === 'Yopougon') && m.delay <= 15).length / Math.max(1, y.length - yp.length), 0) + ' ailleurs. Le trafic réel n’est pas connecté : cause non confirmée.'); }
      case 'delays:driver': return f('Les retards ne sont pas concentrés sur un chauffeur : la zone explique mieux l’écart que la personne.');
      case 'routes:route': { const c5 = D.missions.filter((m) => m.veh === 'CAM-05' && m.to === 'Bingerville'); return f('CAM-05 vers Bingerville : ' + E.fmt(c5.reduce((a2, m) => a2 + m.km, 0) / Math.max(1, c5.length)) + ' km par livraison contre ' + E.fmt(34) + ' km en moyenne, pour le même tarif.'); }
      case 'routes:finance': { const dm = D.moving.filter((m) => m.veh === 'DEM-02' && m.actual); return f('Déménagements DEM-02 : coût réel ' + E.pct(dm.reduce((s, m) => s + m.actual / m.est, 0) / Math.max(1, dm.length) - 1, 0, true) + ' au-dessus du devis en moyenne ; marge réduite de ' + E.fcfa(dm.reduce((s, m) => s + m.actual - m.est, 0)) + ' sur le mois.'); }
      case 'routes:delivery': return f('Regrouper les livraisons Bingerville sur deux jours fixes réduirait les trajets à vide.');
      case 'idle:fleet': { const x = vs.filter((y) => y.idle > E.cfg.idleMax).sort((p, q) => q.idle - p.idle); return f(x.map((y) => y.v.id + ' : ' + E.fmt(y.idle, 1) + ' h/j d’inactivité').join(', ') + '.', { x }); }
      case 'idle:driver': return f('L’inactivité de CAM-03 se produit surtout en attente chez le client, pas en pause chauffeur (journal simulé).');
      case 'idle:finance': { const x = vs.find((y) => y.v.id === 'CAM-03'); return f('CAM-03 génère ' + E.fcfa(x.revDay) + ' par jour actif, contre ' + E.fcfa(vs.filter((y) => y.v.cat === 'truck').reduce((s, y) => s + (y.revDay || 0), 0) / 8) + ' en moyenne pour les camions.'); }
      case 'forecast:bi': { const F = E.forecast(D, now, 'rev'); const s = F.out.slice(1, 8).reduce((p, q) => p + q.v, 0); return f('Revenus prévus sur 7 jours : ' + E.fcfa(s) + ' (intervalle à 90 % : ' + E.k(F.out.slice(1, 8).reduce((p, q) => p + q.lo, 0)) + ' à ' + E.k(F.out.slice(1, 8).reduce((p, q) => p + q.hi, 0)) + ' FCFA). Modèle : moyenne par jour de semaine sur 14 jours.', { s }); }
      case 'forecast:delivery': { const F = E.forecast(D, now, 'demand'); return f('Missions prévues sur 7 jours : ' + E.fmt(F.out.slice(1, 8).reduce((p, q) => p + q.v, 0)) + ', pic attendu le ' + E.dayLabel(F.out.slice(1, 8).sort((p, q) => q.v - p.v)[0].d, true) + '.'); }
      case 'forecast:finance': return f('Hypothèses de coût inchangées ; la marge prévue suit celle des 7 derniers jours (' + E.pct(W.margin, 1) + ').');
      case 'report:bi': return f('Rapport hebdomadaire généré dans Rapports et analyses.');
      default: return f(E.agent(a).name + ' : résultats de la semaine transmis.');
    }
  };
  E.compose = function (intent, F, D, now) {
    const by = (a) => F.find((x) => x.agent === a) || {}; const W = E.period(D, TODAY - 7, TODAY - 1, now);
    const C = { perf: ['Élevée', 'Statuts et missions simulés complets'], segment: ['Moyenne', 'Coûts fondés sur des hypothèses de démonstration'], fuel: ['Moyenne', 'Pleins simulés ; pas de télémétrie moteur'], maint: ['Moyenne', 'Kilométrage seul, sans diagnostic embarqué'], drivers: ['Moyenne', 'Pas de données de conduite (accélérations, freinages)'], delays: ['Faible', 'Trafic non connecté'], routes: ['Moyenne', 'Distances simulées'], idle: ['Moyenne', 'Inactivité déduite des horaires'], forecast: ['Faible', 'Modèle de base sur 14 jours'], report: ['Moyenne', 'Dépend des hypothèses de coût'] }[intent];
    const conf = { lvl: C[0], why: C[1] };
    switch (intent) {
      case 'perf': return { head: 'Flotte : ' + by('fleet').text.split(' : ')[1].split('.')[0] + '.', factors: F.map((x) => x.text), action: 'Traiter les alertes critiques, puis les retards en cours.', conf };
      case 'segment': { const s = by('finance').s; return { head: s[0].x.name + ' a la meilleure marge (' + E.pct(s[0].b.margin, 0) + ' sur 7 jours).', factors: s.map((y) => y.x.name + ' : revenus ' + E.k(y.b.rev) + ' FCFA, marge ' + E.pct(y.b.margin, 0)).concat([by('bi').text]), action: 'Voir le détail dans Intelligence financière.', conf }; }
      case 'fuel': return { head: (by('fuel').x.length ? by('fuel').x.length + ' véhicule(s) consomment anormalement.' : 'Aucune anomalie de carburant.'), factors: F.map((x) => x.text), action: 'Contrôle atelier de VTC-07 et vérification des cartes carburant.', conf };
      case 'maint': return { head: by('maint').P.length + ' véhicules ont un entretien dépassé ou dû sous 7 jours.', factors: F.map((x) => x.text), action: 'Planifier les entretiens dans le Centre de maintenance, en commençant par MOTO-11.', conf };
      case 'drivers': return { head: 'Meilleur score : ' + by('driver').S[0].dr.name + ' (' + by('driver').S[0].score + '/100).', factors: F.map((x) => x.text), action: 'Prévoir un entretien avec les chauffeurs en baisse.', conf };
      case 'delays': return { head: 'Les retards se concentrent sur les livraisons moto liées à Yopougon.', factors: F.map((x) => x.text), action: 'Positionner deux motos en attente à Yopougon aux heures de pointe.', conf };
      case 'routes': return { head: 'Deux sources de perte : la liaison Bingerville de CAM-05 et les devis de DEM-02.', factors: F.map((x) => x.text), action: 'Supplément de distance pour Bingerville et révision de la grille de devis.', conf };
      case 'idle': return { head: 'CAM-03 est le véhicule le plus sous-utilisé.', factors: F.map((x) => x.text), action: 'Réaffecter CAM-03 ou le mutualiser.', conf };
      case 'forecast': return { head: 'Revenus prévus sur 7 jours : ' + E.fcfa(by('bi').s) + '.', factors: F.map((x) => x.text), action: 'Ce sont des prédictions de modèle, pas des engagements.', conf };
      case 'report': return { head: 'Rapport hebdomadaire généré.', factors: ['Revenus 7 j : ' + E.fcfa(W.rev) + ', marge ' + E.pct(W.margin, 1) + '.', 'Huit agents consolidés.'], action: 'Ouvrir Rapports et analyses.', conf };
    }
  };
})();
