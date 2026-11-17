/* TRIDENT — graphiques SVG légers avec info-bulles */
(function () {
  'use strict';
  const C = (window.TRIDENT_CHARTS = {});
  const NS = 'http://www.w3.org/2000/svg';
  let tip;
  function tipEl() { if (!tip) { tip = document.createElement('div'); tip.className = 'tip'; tip.setAttribute('role', 'tooltip'); document.body.appendChild(tip); } return tip; }
  C.showTip = function (html, x, y) { const t = tipEl(); t.innerHTML = html; t.style.display = 'block'; const r = t.getBoundingClientRect();
    let left = x + 14, top = y - r.height - 10; if (left + r.width > innerWidth - 8) left = x - r.width - 14; if (top < 8) top = y + 16; t.style.left = left + 'px'; t.style.top = top + 'px'; };
  C.hideTip = function () { if (tip) tip.style.display = 'none'; };
  const el = (n, a, p) => { const e = document.createElementNS(NS, n); for (const k in a || {}) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  const fmt = (v, d) => window.APPFMT(v, d);

  function niceMax(m) { if (m <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(m))); const n = m / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; }
  function frame(host, h, pad) {
    host.innerHTML = ''; const w = Math.max(280, host.clientWidth || 600);
    const svg = el('svg', { viewBox: `0 0 ${w} ${h}`, width: '100%', height: h, class: 'chart', role: 'img' }, host);
    return { svg, w, h, x0: pad.l, x1: w - pad.r, y0: h - pad.b, y1: pad.t };
  }
  function yAxis(f, max, unit, d) {
    const g = el('g', { class: 'axis' }, f.svg);
    for (let i = 0; i <= 4; i++) { const v = (max * i) / 4; const y = f.y0 - ((f.y0 - f.y1) * i) / 4;
      el('line', { x1: f.x0, x2: f.x1, y1: y, y2: y, class: i ? 'grid' : 'base' }, g);
      const t = el('text', { x: f.x0 - 8, y: y + 4, 'text-anchor': 'end' }, g); t.textContent = fmt(v, max <= 5 ? 1 : 0); }
    if (unit) { const t = el('text', { x: f.x0 - 8, y: f.y1 - 10, 'text-anchor': 'end', class: 'unit' }, g); t.textContent = unit; }
  }
  function xTicks(f, n, label, every) {
    const g = el('g', { class: 'axis' }, f.svg);
    for (let i = 0; i < n; i += every) { const x = f.x0 + ((f.x1 - f.x0) * (i + 0.5)) / n; const t = el('text', { x, y: f.y0 + 18, 'text-anchor': 'middle' }, g); t.textContent = label(i); }
  }

  /* lignes : series [{name, color, values[], dash, band:[[lo,hi]], kind}] ; n points partagés */
  C.line = function (host, o) {
    const f = frame(host, o.height || 240, { l: 52, r: 16, t: 26, b: 30 });
    const n = o.n; let max = 0;
    o.series.forEach((s) => s.values.forEach((v, i) => { if (v != null) max = Math.max(max, v); if (s.band && s.band[i]) max = Math.max(max, s.band[i][1]); }));
    if (o.max) max = o.max; max = niceMax(max * 1.05); yAxis(f, max, o.unit, o.yd);
    const X = (i) => f.x0 + ((f.x1 - f.x0) * (i + 0.5)) / n, Y = (v) => f.y0 - ((f.y0 - f.y1) * v) / max;
    xTicks(f, n, o.xLabel, o.every || Math.ceil(n / 8));
    if (o.split != null) { const x = X(o.split - 0.5); el('line', { x1: x, x2: x, y1: f.y1 - 6, y2: f.y0, class: 'now' }, f.svg);
      const t = el('text', { x: x + 6, y: f.y1 - 8, class: 'nowlbl' }, f.svg); t.textContent = o.splitLabel || 'Maintenant'; }
    o.series.forEach((s) => {
      if (s.band) { let d = ''; const pts = [];
        s.band.forEach((b, i) => { if (b) pts.push([X(i), Y(b[1])]); }); for (let i = s.band.length - 1; i >= 0; i--) if (s.band[i]) pts.push([X(i), Y(s.band[i][0])]);
        if (pts.length) { d = 'M' + pts.map((p) => p.join(',')).join('L') + 'Z'; el('path', { d, fill: s.color, opacity: 0.14 }, f.svg); } }
      let d = '', pen = false;
      s.values.forEach((v, i) => { if (v == null) { pen = false; return; } d += (pen ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(v).toFixed(1); pen = true; });
      el('path', { d, fill: 'none', stroke: s.color, 'stroke-width': 2, 'stroke-dasharray': s.dash ? '5 4' : '', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, f.svg);
    });
    // trous de données
    if (o.gaps) o.gaps.forEach(([a, b]) => { el('rect', { x: X(a) - 3, y: f.y1, width: X(b) - X(a) + 6, height: f.y0 - f.y1, class: 'gap' }, f.svg); });
    hover(f, n, X, (i) => '<b>' + o.xLabel(i, true) + '</b>' + o.series.map((s) => s.values[i] == null && !(s.band && s.band[i]) ? '' : '<div><i style="background:' + s.color + '"></i>' + s.name + ' : ' + (s.values[i] == null ? 'NA' : fmt(s.values[i], o.yd || 1)) + ' ' + (o.tipUnit || '') + (s.band && s.band[i] ? ' <span class="m">(' + fmt(s.band[i][0], 1) + '–' + fmt(s.band[i][1], 1) + ')</span>' : '') + '</div>').join(''), (i) => o.series.map((s) => (s.values[i] == null ? null : { c: s.color, y: Y(s.values[i]) })).filter(Boolean));
    legend(host, o.series.map((s) => ({ name: s.name, color: s.color, dash: s.dash })));
  };

  /* barres empilées : keys [{k,name,color}], rows [{label, v:{k:val}}] */
  C.stack = function (host, o) {
    const f = frame(host, o.height || 240, { l: 52, r: 16, t: 22, b: 30 });
    const n = o.rows.length; let max = 0; o.rows.forEach((r) => (max = Math.max(max, o.keys.reduce((s, k) => s + Math.max(0, r.v[k.k] || 0), 0))));
    max = niceMax(max * 1.04); yAxis(f, max, o.unit);
    const bw = Math.max(2, ((f.x1 - f.x0) / n) * (n > 40 ? 0.86 : 0.64)); const X = (i) => f.x0 + ((f.x1 - f.x0) * (i + 0.5)) / n; const H = (v) => ((f.y0 - f.y1) * v) / max;
    xTicks(f, n, (i) => o.rows[i].label, o.every || Math.ceil(n / 10));
    o.rows.forEach((r, i) => { let y = f.y0; o.keys.forEach((k, j) => { const v = Math.max(0, r.v[k.k] || 0); if (!v) return; const h = H(v); const top = j === o.keys.length - 1 || !o.keys.slice(j + 1).some((q) => r.v[q.k] > 0);
      el('rect', { x: X(i) - bw / 2, y: y - h + (n > 40 ? 0 : 1), width: bw, height: Math.max(0, h - (n > 40 ? 0 : 2)), fill: k.color, rx: top && n <= 40 ? 3 : 0 }, f.svg); y -= h; }); });
    hover(f, n, X, (i) => { const r = o.rows[i]; const tot = o.keys.reduce((s, k) => s + (r.v[k.k] || 0), 0);
      return '<b>' + (r.full || r.label) + '</b>' + o.keys.map((k) => '<div><i style="background:' + k.color + '"></i>' + k.name + ' : ' + fmt(r.v[k.k] || 0, 1) + ' ' + o.unit + ' <span class="m">' + (tot ? Math.round(((r.v[k.k] || 0) / tot) * 100) + ' %' : '') + '</span></div>').join('') + '<div class="t">Total : ' + fmt(tot, 1) + ' ' + o.unit + '</div>'; });
    legend(host, o.keys.map((k) => ({ name: k.name, color: k.color })));
  };

  /* barres horizontales classées */
  C.hbars = function (host, o) {
    host.innerHTML = ''; const max = Math.max(...o.rows.map((r) => r.value || 0)) || 1;
    const wrap = document.createElement('div'); wrap.className = 'hbars';
    o.rows.forEach((r) => { const row = document.createElement('div'); row.className = 'hb';
      row.innerHTML = '<span class="hb-l">' + r.label + '</span><span class="hb-t"><span class="hb-b" style="width:' + Math.max(1, (r.value / max) * 100) + '%;background:' + (r.color || 'var(--viz-1)') + '"></span></span><span class="hb-v">' + r.text + '</span>';
      if (r.tip) { row.addEventListener('mousemove', (e) => C.showTip(r.tip, e.clientX, e.clientY)); row.addEventListener('mouseleave', C.hideTip); }
      wrap.appendChild(row); });
    host.appendChild(wrap);
  };

  C.spark = function (vals, w, h, color) {
    w = w || 90; h = h || 24; const v = vals.filter((x) => x != null); if (!v.length) return '<span class="m">NA</span>';
    const mn = Math.min(...v), mx = Math.max(...v), r = mx - mn || 1;
    let d = '', pen = false; vals.forEach((x, i) => { if (x == null) { pen = false; return; } d += (pen ? 'L' : 'M') + ((i / (vals.length - 1)) * (w - 4) + 2).toFixed(1) + ',' + (h - 3 - ((x - mn) / r) * (h - 6)).toFixed(1); pen = true; });
    return '<svg class="spark" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><path d="' + d + '" fill="none" stroke="' + (color || 'currentColor') + '" stroke-width="1.6" stroke-linecap="round"/></svg>';
  };

  function hover(f, n, X, html, dots) {
    const g = el('g', {}, f.svg); const cross = el('line', { y1: f.y1, y2: f.y0, class: 'cross', visibility: 'hidden' }, g);
    const dg = el('g', {}, g);
    const r = el('rect', { x: f.x0, y: f.y1, width: f.x1 - f.x0, height: f.y0 - f.y1, fill: 'transparent' }, f.svg);
    const at = (e) => { const b = f.svg.getBoundingClientRect(); const sx = ((e.clientX - b.left) / b.width) * f.w; return Math.max(0, Math.min(n - 1, Math.floor(((sx - f.x0) / (f.x1 - f.x0)) * n))); };
    r.addEventListener('mousemove', (e) => { const i = at(e); const x = X(i); cross.setAttribute('x1', x); cross.setAttribute('x2', x); cross.setAttribute('visibility', 'visible');
      dg.innerHTML = ''; if (dots) dots(i).forEach((d) => el('circle', { cx: x, cy: d.y, r: 4, fill: d.c, stroke: 'var(--surface)', 'stroke-width': 2 }, dg));
      C.showTip(html(i), e.clientX, e.clientY); });
    r.addEventListener('mouseleave', () => { cross.setAttribute('visibility', 'hidden'); dg.innerHTML = ''; C.hideTip(); });
  }
  function legend(host, items) {
    if (items.length < 2) return; const L = document.createElement('div'); L.className = 'legend';
    L.innerHTML = items.map((i) => '<span><i class="' + (i.dash ? 'dash' : '') + '" style="' + (i.dash ? 'border-color:' : 'background:') + i.color + '"></i>' + i.name + '</span>').join('');
    host.appendChild(L);
  }
})();
