/* FLEET INTELLIGENCE — scènes 3D (Three.js r128).
   1) Ville schématique d'Abidjan avec cycle jour/nuit, traînées lumineuses et itinéraires.
   2) Réseau des agents IA. Disposition non géographique ; positions simulées. */
(function () {
  'use strict';
  const COL = { avail: 0x2fd08a, mission: 0x4c8dff, late: 0xff8a3d, crit: 0xff4d5e, off: 0x6b7685 };
  const ACC = 0xffd23f;
  const mat = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8, metalness: 0.08 }, o || {}));
  const supported = () => { try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; } };
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function base(o) {
    const r = new THREE.WebGLRenderer({ antialias: true }); r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.shadowMap.enabled = !!o.shadows; r.shadowMap.type = THREE.PCFSoftShadowMap;
    const s = new THREE.Scene(); s.background = new THREE.Color(o.bg); s.fog = new THREE.Fog(o.bg, o.fogN, o.fogF);
    const c = new THREE.PerspectiveCamera(38, 1, 1, 1600); const ctl = new THREE.OrbitControls(c, r.domElement); ctl.enableDamping = true; ctl.maxPolarAngle = Math.PI * 0.47;
    return { r, s, c, ctl };
  }
  function attachTo(o, host) { o.host = host; host.appendChild(o.r.domElement); if (o.labels) host.appendChild(o.labels); resize(o); }
  function resize(o) { if (!o.host) return; const w = o.host.clientWidth || 800, h = o.host.clientHeight || 500; o.r.setSize(w, h, false); o.r.domElement.style.width = '100%'; o.r.domElement.style.height = '100%'; o.c.aspect = w / h; o.c.updateProjectionMatrix(); if (!o.moved && o.home) o.c.position.copy(o.home()); }
  function tween(o, t, p) { o.moved = true; const t0 = o.ctl.target.clone(), p0 = o.c.position.clone(), s = performance.now(), dur = reduce() ? 1 : 800;
    o.anim = (n) => { const k = Math.min(1, (n - s) / dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; o.ctl.target.lerpVectors(t0, t, e); o.c.position.lerpVectors(p0, p, e); if (k >= 1) o.anim = null; }; }
  const visible = (x) => { while (x) { if (!x.visible) return false; x = x.parent; } return true; };
  function picker(o, cb, hover) { const ray = new THREE.Raycaster(), p = new THREE.Vector2(); let d = null, lastH = 0;
    const hit = (e) => { const b = o.r.domElement.getBoundingClientRect(); p.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1); ray.setFromCamera(p, o.c); const h = ray.intersectObjects(o.s.children, true).find((x) => x.object.userData.pick && visible(x.object)); return h ? h.object.userData.pick : null; };
    o.r.domElement.addEventListener('pointerdown', (e) => { d = [e.clientX, e.clientY]; });
    o.r.domElement.addEventListener('pointerup', (e) => { if (!d) return; const moved = Math.hypot(e.clientX - d[0], e.clientY - d[1]) > 5; d = null; if (moved) { o.moved = true; return; } cb(hit(e)); });
    if (hover) { o.r.domElement.addEventListener('pointermove', (e) => { const n = performance.now(); if (n - lastH < 70 || e.buttons) return; lastH = n; hover(hit(e), e.clientX, e.clientY); }); o.r.domElement.addEventListener('pointerleave', () => hover(null)); }
  }
  const live = (o) => o.host && o.host.isConnected && o.host.getClientRects().length > 0 && !document.hidden;
  function windowTex() {
    const c = document.createElement('canvas'); c.width = 64; c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, 64, 128);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 12; j++) { const on = Math.random() < 0.55; x.fillStyle = on ? 'rgba(255,214,140,' + (0.6 + Math.random() * 0.4) + ')' : '#05070a'; x.fillRect(6 + i * 14, 6 + j * 10, 8, 5); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  }
  function dotTex() { const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'); const g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); }

  /* ======================= ville illustrée et flotte ======================= */
  /* Style « ville jouet » : aplats colorés (MeshToon), ciel orangé, collines, maisons à toits pointus.
     Tout est schématique : la géographie d'Abidjan n'est pas reproduite. */
  let GRAD = null;
  function grad() { if (GRAD) return GRAD; const d = new Uint8Array([120, 120, 120, 255, 190, 190, 190, 255, 255, 255, 255, 255]); GRAD = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat); GRAD.minFilter = GRAD.magFilter = THREE.NearestFilter; GRAD.generateMipmaps = false; GRAD.needsUpdate = true; return GRAD; }
  const toon = (c, o) => new THREE.MeshToonMaterial(Object.assign({ color: c, gradientMap: grad() }, o || {}));
  const UP = new THREE.Vector3(0, 1, 0);
  function winTex(cols, rows) {
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, 64, 64); const w = 64 / cols, h = 64 / rows;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { x.fillStyle = '#fff'; x.fillRect(i * w + w * 0.24, j * h + h * 0.2, w * 0.52, h * 0.52); x.fillStyle = '#000'; x.fillRect(i * w + w * 0.5 - 1, j * h + h * 0.2, 2, h * 0.52); }
    return new THREE.CanvasTexture(c);
  }
  function sunTex() { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,250,215,1)'); g.addColorStop(0.36, 'rgba(255,226,120,1)'); g.addColorStop(0.42, 'rgba(255,214,90,.55)'); g.addColorStop(1, 'rgba(255,200,80,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); }
  function setLimb(o, a, b) { const d = new THREE.Vector3().subVectors(b, a), L = d.length() || 1e-3; o.position.copy(a).addScaledVector(d, 0.5); o.scale.set(1, L, 1); o.quaternion.setFromUnitVectors(UP, d.divideScalar(L)); }
  function limb(a, b, r1, r2, m, seg) { const o = new THREE.Mesh(new THREE.CylinderGeometry(r2, r1, 1, seg || 10), m); setLimb(o, a, b); return o; }
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

  const PAL = {
    sky: { day: ['#f39a2c', '#f8bf48', '#fbe08a'], dusk: ['#c4506a', '#ee8a4a', '#fbc56a'], night: ['#141a3a', '#27305e', '#4a4f7e'] },
    grass: 0x8cc152, grass2: 0xa6d46e, water: 0x3fa9b5, sand: 0xf1e0ae, road: 0x6c737d, walk: 0xf3e3b6, mark: 0xffffff,
    walls: [0xee9a80, 0xf4d06f, 0xf6f1e4, 0xaedcc0, 0xf7b98b, 0x9fd3e6, 0xf2a7a0],
    roofs: [0xd2483a, 0x2f7d57, 0xe07a4b, 0x3b7f9a, 0xc0392b],
    leaves: [0x3e8e5a, 0x5dae5b, 0x2f7a4f, 0x7cbf5a, 0x4f9e4a],
    hills: [0x5ca58a, 0x79b86a, 0x4e9a7a, 0x6aae74],
    car: [0xe8553a, 0xf4c542, 0x3fb8af, 0xf28c38, 0x5b8def, 0xef6f8f, 0x8fcf5a],
    moto: [0xe8553a, 0x3fb8af, 0x5b8def, 0xf28c38],
  };

  const F = (window.FLEET_SCENE = { supported });
  let fo, zones = {}, vehs = {}, lbls = {}, selV = null, follow = null, followOff = null, routeLine = null, lights = {}, winMats = [], headMats = [], day = 1, trailT = 0;
  let cab = null; const pins = [], clouds = []; let sky = null, skyKey = '', sun = null;
  const EYE = { car: [0.05, 1.62], moto: [-0.35, 2.3], van: [1.75, 2.35], truck: [3.0, 3.05], mover: [3.0, 3.05] };
  F.zonePos = (z) => zones[z].p.clone();

  /* ---------- modèles de véhicules arrondis ---------- */
  function ext(shape, depth, bev) { const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 10 }); g.translate(0, 0, -depth / 2); return g; }
  function vehModel(v, idx) {
    const g = new THREE.Group(), shell = [], light = fo.light;
    const add = (geo, m, x, y, z, ry) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); if (ry) o.rotation.z = ry; o.castShadow = !light; g.add(o); shell.push(o); return o; };
    const tyre = toon(0x2e3138), hub = toon(0xe9e6df), glass = toon(0xbfe4f1, { emissive: 0x9fd3e6, emissiveIntensity: 0.15 }), dark = toon(0x3a3f48);
    const wheel = (x, z, r, w) => { const t = add(new THREE.CylinderGeometry(r, r, w, 18), tyre, x, r, z); t.rotation.x = Math.PI / 2; const h = add(new THREE.CylinderGeometry(r * 0.48, r * 0.48, w + 0.04, 12), hub, x, r, z); h.rotation.x = Math.PI / 2; };
    const hm = new THREE.MeshBasicMaterial({ color: 0xfff1b0 }), tm = new THREE.MeshBasicMaterial({ color: 0xff5a4a }); headMats.push(hm);
    const lamp = (x, y, z, m, r) => add(new THREE.SphereGeometry(r || 0.14, 10, 8), m, x, y, z);
    let len = 4.4, hgt = 2.2, col;
    if (v.cat === 'car') {
      col = PAL.car[idx % PAL.car.length]; const body = toon(col);
      const s = new THREE.Shape(); s.moveTo(-2.05, 0.38); s.lineTo(1.95, 0.38); s.quadraticCurveTo(2.2, 0.38, 2.2, 0.72); s.quadraticCurveTo(2.2, 1.15, 1.7, 1.22); s.lineTo(-1.8, 1.27); s.quadraticCurveTo(-2.15, 1.22, -2.15, 0.82); s.quadraticCurveTo(-2.15, 0.38, -2.05, 0.38);
      add(ext(s, 1.7, 0.13), body, 0, 0, 0);
      const c = new THREE.Shape(); c.moveTo(-1.55, 1.2); c.lineTo(1.05, 1.2); c.quadraticCurveTo(0.72, 1.98, 0.15, 2.0); c.lineTo(-1.05, 2.0); c.quadraticCurveTo(-1.5, 1.96, -1.62, 1.2);
      add(ext(c, 1.52, 0.1), glass, 0, 0, 0);
      add(new THREE.BoxGeometry(1.32, 0.13, 1.66), body, -0.45, 2.06, 0); add(new THREE.BoxGeometry(0.13, 0.78, 1.7), body, -0.3, 1.6, 0);
      add(new THREE.BoxGeometry(0.62, 0.26, 0.4), toon(0xffd23f, { emissive: 0xffd23f, emissiveIntensity: 0.25 }), -0.45, 2.25, 0); // lumineux VTC
      [-1.32, 1.32].forEach((x) => [-0.92, 0.92].forEach((z) => wheel(x, z, 0.42, 0.34)));
      [-0.6, 0.6].forEach((z) => { lamp(2.2, 0.85, z, hm); lamp(-2.17, 0.88, z, tm, 0.11); });
      hgt = 2.4;
    } else if (v.cat === 'moto') {
      len = 2.3; hgt = 2.7; col = PAL.moto[idx % PAL.moto.length]; const body = toon(col), jacket = toon([0x2b3a55, 0x6b4e9b, 0x3a6b4f][idx % 3]), helmet = toon([0xffffff, 0xf4c542, 0xe8553a][idx % 3]);
      const s = new THREE.Shape(); s.moveTo(-0.95, 0.45); s.lineTo(0.35, 0.45); s.quadraticCurveTo(0.55, 0.45, 0.6, 0.8); s.lineTo(0.8, 1.45); s.lineTo(0.62, 1.52); s.lineTo(0.42, 0.88); s.lineTo(-0.25, 0.88); s.quadraticCurveTo(-0.3, 1.18, -0.62, 1.18); s.lineTo(-0.98, 1.12); s.quadraticCurveTo(-1.12, 0.8, -0.95, 0.45);
      add(ext(s, 0.42, 0.07), body, 0, 0, 0);
      [-0.78, 0.8].forEach((x) => wheel(x, 0, 0.34, 0.16));
      add(new THREE.BoxGeometry(0.8, 0.14, 0.44), dark, -0.5, 1.25, 0);
      const bar = add(new THREE.CylinderGeometry(0.035, 0.035, 0.84, 8), dark, 0.72, 1.55, 0); bar.rotation.x = Math.PI / 2;
      lamp(0.86, 1.32, 0, hm, 0.12);
      add(new THREE.BoxGeometry(0.64, 0.58, 0.62), toon(0xf2c14e), -1.0, 1.62, 0); add(new THREE.BoxGeometry(0.66, 0.08, 0.64), toon(0xe08a2a), -1.0, 1.95, 0);
      const tor = add(new THREE.CylinderGeometry(0.2, 0.25, 0.72, 10), jacket, -0.32, 1.72, 0); tor.rotation.z = -0.32;
      add(new THREE.SphereGeometry(0.25, 14, 10), helmet, -0.14, 2.28, 0); add(new THREE.SphereGeometry(0.17, 12, 8), toon(0x22303f), -0.02, 2.25, 0);
      [-0.2, 0.2].forEach((z) => { const a = limb(V3(-0.22, 1.98, z), V3(0.66, 1.56, z * 1.6), 0.07, 0.06, jacket); a.castShadow = !light; g.add(a); shell.push(a);
        const l1 = limb(V3(-0.5, 1.38, z * 0.8), V3(0.0, 1.26, z), 0.09, 0.08, toon(0x2e3a4a)); g.add(l1); shell.push(l1); const l2 = limb(V3(0.0, 1.26, z), V3(0.18, 0.62, z), 0.08, 0.07, toon(0x2e3a4a)); g.add(l2); shell.push(l2); });
    } else if (v.cat === 'van') {
      len = 4.9; hgt = 2.7; col = 0xf6f1e4; const body = toon(col), band = toon(PAL.car[(idx + 2) % PAL.car.length]);
      const s = new THREE.Shape(); s.moveTo(-2.4, 0.42); s.lineTo(2.2, 0.42); s.quadraticCurveTo(2.45, 0.42, 2.45, 0.8); s.lineTo(2.4, 1.3); s.quadraticCurveTo(2.3, 1.47, 1.9, 1.55); s.lineTo(1.36, 2.36); s.quadraticCurveTo(1.2, 2.56, 0.9, 2.56); s.lineTo(-2.2, 2.56); s.quadraticCurveTo(-2.45, 2.56, -2.45, 2.3); s.lineTo(-2.45, 0.62); s.quadraticCurveTo(-2.45, 0.42, -2.4, 0.42);
      add(ext(s, 1.8, 0.12), body, 0, 0, 0);
      const ws = add(new THREE.BoxGeometry(0.96, 0.06, 1.72), glass, 1.65, 1.97, 0); ws.rotation.z = Math.atan2(0.81, -0.54) - Math.PI;
      add(new THREE.BoxGeometry(0.75, 0.55, 2.06), glass, 0.95, 1.95, 0); add(new THREE.BoxGeometry(4.9, 0.28, 2.06), band, -0.05, 1.1, 0);
      [-1.5, 1.45].forEach((x) => [-0.95, 0.95].forEach((z) => wheel(x, z, 0.45, 0.34)));
      [-0.62, 0.62].forEach((z) => { lamp(2.46, 0.95, z, hm); lamp(-2.47, 0.95, z, tm, 0.11); });
    } else {
      const big = v.cat === 'mover'; len = big ? 8.2 : 7.6; hgt = big ? 3.9 : 3.5; col = big ? 0xf28c38 : [0xe8553a, 0x3fb8af, 0x5b8def][idx % 3];
      const body = toon(col), box = toon(big ? 0xffd23f : 0xf6f1e4), ch = toon(0x3a3f48), fx = len / 2;
      const s = new THREE.Shape(); s.moveTo(fx - 2.1, 0.55); s.lineTo(fx - 0.25, 0.55); s.quadraticCurveTo(fx, 0.55, fx, 0.9); s.lineTo(fx - 0.05, 1.72); s.lineTo(fx - 0.35, 2.9); s.quadraticCurveTo(fx - 0.45, 3.1, fx - 0.75, 3.1); s.lineTo(fx - 1.95, 3.1); s.quadraticCurveTo(fx - 2.1, 3.1, fx - 2.1, 2.9); s.lineTo(fx - 2.1, 0.55);
      add(ext(s, 2.0, 0.12), body, 0, 0, 0);
      const ws = add(new THREE.BoxGeometry(1.2, 0.06, 1.9), glass, fx - 0.16, 2.33, 0); ws.rotation.z = Math.atan2(1.18, -0.3) - Math.PI;
      add(new THREE.BoxGeometry(0.7, 0.62, 2.26), glass, fx - 1.2, 2.38, 0);
      const bl = len - 2.4, bh = big ? 3.3 : 2.85; add(new THREE.BoxGeometry(bl, bh, big ? 2.5 : 2.3), box, -fx + bl / 2 + 0.1, 0.75 + bh / 2, 0);
      add(new THREE.BoxGeometry(bl + 0.02, 0.36, (big ? 2.5 : 2.3) + 0.04), big ? toon(0x2f3a4a) : body, -fx + bl / 2 + 0.1, 0.75 + bh * 0.62, 0);
      add(new THREE.BoxGeometry(len - 0.2, 0.32, 1.5), ch, 0, 0.62, 0);
      [fx - 1.1, -fx + 2.5, -fx + 1.2].forEach((x) => [-1.0, 1.0].forEach((z) => wheel(x, z, 0.55, 0.42)));
      [-0.72, 0.72].forEach((z) => { lamp(fx + 0.02, 1.05, z, hm, 0.16); lamp(-fx + 0.08, 1.0, z, tm, 0.12); });
    }
    const beam = new THREE.Mesh(new THREE.ConeGeometry(2.4, 9, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff1c9, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })); beam.rotation.z = Math.PI / 2; beam.position.set(len / 2 + 4.5, 0.9, 0); g.add(beam); shell.push(beam);
    // repère de statut en forme d'épingle de carte
    const pm = new THREE.MeshBasicMaterial({ color: COL.avail }); const tag = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 12), pm);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.95, 12), pm); tip.rotation.x = Math.PI; tip.position.y = -0.62; tag.add(tip);
        tag.position.y = hgt + 1.9; g.add(tag); shell.push(tag);
    return { g, shell, beam, tag, hgt, len, col };
  }

  /* ---------- poste de conduite : tableau de bord, volant, mains ---------- */
  let rig = null, steer = 0, prevH = null, scr = null, rigInfo = null;
  function hand(skin, alien, side) {
    // repère local : x = le long du volant/guidon, y = vers l'extérieur de la jante, z = vers le conducteur
    const g = new THREE.Group(), m = toon(skin), nf = alien ? 3 : 4, fr = alien ? 0.02 : 0.016;
    const back = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), m); back.scale.set(0.078, 0.06, 0.045); back.position.set(0, 0.03, 0.05); g.add(back);
    for (let i = 0; i < nf; i++) { const x = nf === 3 ? (i - 1) * 0.04 : (i - 1.5) * 0.028, k = V3(x, 0.07, 0.05), o = V3(x * 1.05, 0.075, -0.012), b = V3(x * 1.05, 0.015, -0.05);
      g.add(limb(k, o, fr * 1.1, fr, m, 8), limb(o, b, fr, fr * 0.9, m, 8)); [k, o, b].forEach((p, j) => { const s = new THREE.Mesh(new THREE.SphereGeometry(j === 2 && alien ? fr * 1.6 : fr, 8, 6), m); s.position.copy(p); g.add(s); }); }
    const th0 = V3(side * 0.045, -0.005, 0.05), th1 = V3(side * 0.085, -0.035, 0.03), tt = limb(th0, th1, 0.019, 0.016, m, 8); g.add(tt); const ts = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), m); ts.position.copy(th1); g.add(ts);
    const wrist = new THREE.Object3D(); wrist.position.set(0, -0.005, 0.1); g.add(wrist); g.userData.wrist = wrist;
    g.scale.setScalar(0.66); return g;
  }
  function orient(o, t, r) { const z = new THREE.Vector3().crossVectors(t, r).normalize(); o.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(t.clone().normalize(), r.clone().normalize(), z)); }
  function screenCanvas() { const c = document.createElement('canvas'); c.width = 512; c.height = 300; const t = new THREE.CanvasTexture(c); return { c, t }; }
  function buildRig(k, o) {
    const cat = k.v.cat, skin = new THREE.Color(o.skin || '#a86b3c'), sleeve = toon(o.sleeve || 0x2b3a55), skinM = toon(skin);
    const R = new THREE.Group(), inter = toon(0x3b4250), inter2 = toon(0x4a5263), body = toon(k.col);
    const info = { R, cat, hands: [], arms: [], spin: null, bar: null };
    scr = scr || screenCanvas();
    const scrM = new THREE.MeshBasicMaterial({ map: scr.t, toneMapped: false });
    if (cat === 'moto') {
      const fair = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), body); fair.scale.set(0.2, 0.1, 0.22); fair.position.set(0, -0.5, -1.05); R.add(fair);
      const bar = new THREE.Group(); bar.position.set(0, -0.31, -0.66); R.add(bar); info.bar = bar;
      const cb = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.62, 10), toon(0x2e3138)); cb.rotation.z = Math.PI / 2; bar.add(cb);
      [-1, 1].forEach((sd) => { const gp = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.11, 12), toon(0x1f2228)); gp.rotation.z = Math.PI / 2; gp.position.x = sd * 0.29; bar.add(gp);
        const mir = limb(V3(sd * 0.22, 0, -0.02), V3(sd * 0.32, 0.12, -0.1), 0.008, 0.008, toon(0x2e3138)); bar.add(mir); const mh = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), toon(0x2e3138)); mh.scale.set(0.034, 0.02, 0.01); mh.position.set(sd * 0.33, 0.135, -0.105); bar.add(mh);
        const h = hand(skin, o.alien, -sd); h.position.set(sd * 0.29, 0.0, 0.0); orient(h, V3(1, 0, 0), V3(0, 1, 0)); bar.add(h); info.hands.push(h); });
      const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.117), scrM); sc.position.set(0, 0.06, -0.05); sc.rotation.x = -0.5; bar.add(sc);
      const scB = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.14, 0.02), toon(0x2e3138)); scB.position.set(0, 0.055, -0.065); scB.rotation.x = -0.5; bar.add(scB);
    } else {
      const big = cat !== 'car', wR = big ? 0.21 : 0.19;
      const hood = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.18, 2.2), body); hood.position.set(0, big ? -0.82 : -0.52, -2.5); hood.rotation.x = 0.05; R.add(hood);
      const dash = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.4, 0.55), inter); dash.position.set(0, -0.58, -0.98); R.add(dash);
      const top = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.05, 0.6), inter2); top.position.set(0, -0.37, -0.98); R.add(top);
      const lip = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.2, 12), inter2); lip.rotation.z = Math.PI / 2; lip.position.set(0, -0.4, -0.7); R.add(lip);
      const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.34, 18, 1, false, 0, Math.PI), inter2); bin.rotation.set(Math.PI / 2, 0, Math.PI / 2); bin.position.set(0, -0.36, -0.86); bin.scale.set(0.75, 0.75, 0.4); R.add(bin);
      [-1, 1].forEach((sd) => { const p = limb(V3(sd * 1.05, -0.38, -1.2), V3(sd * 0.8, 0.6, -0.62), 0.045, 0.04, inter); R.add(p); const vent = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.02), toon(0x22272f)); vent.position.set(sd * 0.7, -0.44, -0.69); R.add(vent); });
      const hdr = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.05, 0.1), inter); hdr.position.set(0, 0.4, -0.64); R.add(hdr);
      const mir = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.06, 0.025), toon(0x2e3138)); mir.position.set(0.08, 0.27, -0.7); R.add(mir); const mg = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.044), toon(0x56788c, { emissive: 0x3d5d70, emissiveIntensity: 0.25 })); mg.position.set(0.08, 0.27, -0.686); R.add(mg);
      if (cat === 'car') { const charm = limb(V3(0.08, 0.24, -0.7), V3(0.08, 0.17, -0.7), 0.003, 0.003, toon(0x2e3138)); R.add(charm); const ch = new THREE.Mesh(new THREE.OctahedronGeometry(0.016), toon(0xffd23f)); ch.position.set(0.08, 0.16, -0.7); R.add(ch); info.charm = ch; }
      const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.2), scrM); sc.position.set(0.36, -0.25, -0.875); sc.rotation.x = -0.2; R.add(sc); info.screen = sc;
      const scB = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.23, 0.03), toon(0x22272f)); scB.position.set(0.36, -0.25, -0.895); scB.rotation.x = -0.2; R.add(scB); info.screenB = scB;
      const base = new THREE.Group(); base.position.set(0, big ? -0.4 : -0.37, -0.6); base.rotation.x = big ? -0.75 : -0.4; R.add(base);
      const col = limb(V3(0, 0, -0.02), V3(0, -0.06, -0.3), 0.04, 0.05, toon(0x2e3138)); base.add(col);
      const spin = new THREE.Group(); base.add(spin); info.spin = spin;
      const rim = new THREE.Mesh(new THREE.TorusGeometry(wR, 0.021, 12, 44), toon(0x2e3138)); spin.add(rim);
      [Math.PI / 2 + Math.PI, 0, Math.PI].forEach((a) => { const sp = limb(V3(0, 0, -0.01), V3(Math.cos(a) * wR, Math.sin(a) * wR, 0), 0.013, 0.013, toon(0x3a3f48)); spin.add(sp); });
      const hb = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.04, 20), toon(0x3a3f48)); hb.rotation.x = Math.PI / 2; spin.add(hb);
      const logo = new THREE.Mesh(new THREE.CircleGeometry(0.024, 16), new THREE.MeshBasicMaterial({ color: 0xffd23f })); logo.position.z = 0.021; spin.add(logo);
      [[150, 1], [30, -1]].forEach(([deg, sd]) => { const a = (deg * Math.PI) / 180, p = V3(Math.cos(a) * wR, Math.sin(a) * wR, 0); const h = hand(skin, o.alien, sd); h.position.copy(p); orient(h, V3(Math.sin(a), -Math.cos(a), 0), V3(Math.cos(a), Math.sin(a), 0)); spin.add(h); info.hands.push(h); });
    }
    // avant-bras et manches : recalculés à chaque image depuis les poignets
    info.hands.forEach((h, i) => { const sd = cat === 'moto' ? (i === 0 ? -1 : 1) : (i === 0 ? -1 : 1);
      const fa = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.032, 1, 12), skinM), sl = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.052, 1, 14), sleeve), cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.044, 0.02, 14), toon(0xf6f1e4));
      R.add(fa, sl, cuff); info.arms.push({ h, fa, sl, cuff, elbow: V3(sd * 0.3, -0.6, -0.1) }); });
    R.traverse((m) => { m.frustumCulled = false; m.renderOrder = 2; });
    R.visible = false; return info;
  }
  const _a = new THREE.Vector3(), _b = new THREE.Vector3();
  function rigArms() { if (!rigInfo) return; rigInfo.R.updateMatrixWorld(true);
    rigInfo.arms.forEach((A) => { A.h.userData.wrist.getWorldPosition(_a); rigInfo.R.worldToLocal(_a); const e = A.elbow, d = _b.subVectors(e, _a).normalize();
      const w2 = _a.clone().addScaledVector(d, 0.24), w3 = _a.clone().addScaledVector(d, 0.255); setLimb(A.fa, _a.clone().addScaledVector(d, -0.02), w2); setLimb(A.sl, w3, e); A.cuff.position.copy(w2.clone().lerp(w3, 0.5)); A.cuff.quaternion.copy(A.sl.quaternion); }); }
  function rrect(x, X, Y, W, H, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + W, Y, X + W, Y + H, r); x.arcTo(X + W, Y + H, X, Y + H, r); x.arcTo(X, Y + H, X, Y, r); x.arcTo(X, Y, X + W, Y, r); x.closePath(); }
  F.cabScreen = function (i) {
    if (!scr || !i) return; const x = scr.c.getContext('2d'), W = 512, H = 300, ff = '"Archivo", system-ui, sans-serif';
    x.clearRect(0, 0, W, H); x.fillStyle = '#16202b'; rrect(x, 0, 0, W, H, 26); x.fill();
    x.fillStyle = 'rgba(255,255,255,.06)'; rrect(x, 14, 14, 200, H - 28, 20); x.fill();
    x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = '700 104px ' + ff; x.fillText(String(i.speed), 114, 150); x.font = '500 24px ' + ff; x.fillStyle = '#9fb0c2'; x.fillText('km/h', 114, 186);
    x.fillStyle = i.stCol || '#2fd08a'; rrect(x, 40, 214, 148, 40, 20); x.fill(); x.fillStyle = '#14171b'; x.font = '700 21px ' + ff; x.fillText(i.stLabel || '', 114, 241);
    x.textAlign = 'left'; x.fillStyle = '#9fb0c2'; x.font = '500 22px ' + ff; x.fillText(i.label || '', 236, 50);
    x.fillStyle = '#ffd23f'; x.font = '700 46px ' + ff; x.fillText(i.fare || '—', 236, 104);
    x.fillStyle = '#fff'; x.font = '600 26px ' + ff; x.fillText(i.line2 || '', 236, 150); x.fillStyle = '#9fb0c2'; x.font = '500 22px ' + ff; x.fillText(i.line3 || '', 236, 186);
    x.fillStyle = '#2c3846'; rrect(x, 236, 222, 250, 14, 7); x.fill(); x.fillStyle = '#ffd23f'; rrect(x, 236, 222, Math.max(14, 250 * (i.prog || 0)), 14, 7); x.fill();
    x.fillStyle = '#9fb0c2'; x.font = '500 19px ' + ff; x.fillText(i.route || '', 236, 268);
    scr.t.needsUpdate = true;
  };

  F.init = function (host, opts) {
    const G = window.FLEET.GRID, st = G.step, X0 = -3 * st, X1 = 3 * st, Z0 = -2 * st, Z1 = 2 * st;
    fo = base({ shadows: !opts.light, bg: 0xf8bf48, fogN: 420, fogF: 980 }); fo.light = !!opts.light; fo.opts = opts; const s = fo.s; fo.c.far = 2400; fo.c.updateProjectionMatrix(); s.add(fo.c);
    fo.home = () => { const k = Math.max(1, 1.55 / Math.max(fo.c.aspect, 0.5)); return new THREE.Vector3(0, 98 * k, 228 * k); };
    sky = document.createElement('canvas'); sky.width = 4; sky.height = 256; s.background = new THREE.CanvasTexture(sky);
    lights.hemi = new THREE.HemisphereLight(0xfff1d6, 0x8cc152, 0.6); s.add(lights.hemi);
    lights.sun = new THREE.DirectionalLight(0xfff0d0, 0.9); lights.sun.castShadow = !fo.light; lights.sun.shadow.mapSize.set(2048, 2048); Object.assign(lights.sun.shadow.camera, { left: -170, right: 170, top: 150, bottom: -150, far: 520 }); lights.sun.shadow.bias = -0.0008; s.add(lights.sun);
    sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunTex(), fog: false, depthWrite: false, transparent: true })); sun.scale.set(150, 150, 1); s.add(sun);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(900, 64), toon(PAL.grass)); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; ground.userData.keep = true; s.add(ground);
    // collines et nuages
    for (let i = 0; i < 30; i++) { const a = (i / 30) * Math.PI * 2 + (i % 3) * 0.07, r = 360 + (i % 4) * 45, R2 = 70 + ((i * 37) % 60); const h = new THREE.Mesh(new THREE.SphereGeometry(R2, 24, 14), toon(PAL.hills[i % 4])); h.scale.y = 0.42 + (i % 3) * 0.08; h.position.set(Math.cos(a) * r * 1.2, -6, Math.sin(a) * r); h.userData.keep = true; s.add(h); }
    const cm = toon(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.25 });
    for (let i = 0; i < 9; i++) { const c = new THREE.Group(); for (let j = 0; j < 5; j++) { const b = new THREE.Mesh(new THREE.SphereGeometry(9 + ((i + j) % 3) * 3, 16, 10), cm); b.position.set((j - 2) * 9, j % 2 ? 4 : 0, (j % 3) * 3); b.scale.y = 0.8; c.add(b); }
      c.position.set(-380 + i * 95, 90 + (i % 3) * 22, -330 - (i % 4) * 60); c.userData.v = 1.2 + (i % 3) * 0.6; c.userData.keep = true; s.add(c); clouds.push(c); }
    // lagune et berges sableuses
    const water = new THREE.Mesh(new THREE.PlaneGeometry(1400, 20), toon(PAL.water, { emissive: 0x2a8fa0, emissiveIntensity: 0.15 })); water.rotation.x = -Math.PI / 2; water.position.set(0, 0.12, st / 2); s.add(water); fo.water = water;
    [-1, 1].forEach((sd) => { const b = new THREE.Mesh(new THREE.BoxGeometry(1400, 0.3, 3.2), toon(PAL.sand)); b.position.set(0, 0.1, st / 2 + sd * 11.2); b.receiveShadow = true; s.add(b); });
    // rues sur trottoirs crème, ponts
    const roadM = toon(PAL.road), walkM = toon(PAL.walk), markM = new THREE.MeshBasicMaterial({ color: PAL.mark }), railM = toon(0xffffff), deckM = toon(0x8a939e);
    const marks = [];
    const road = (x1, z1, x2, z2, bridge) => { const L = Math.hypot(x2 - x1, z2 - z1), r = -Math.atan2(z2 - z1, x2 - x1), cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
      if (!bridge) { const w = new THREE.Mesh(new THREE.BoxGeometry(L + 9.6, 0.32, 9.6), walkM); w.position.set(cx, 0.16, cz); w.rotation.y = r; w.receiveShadow = true; s.add(w); }
      const m = new THREE.Mesh(new THREE.BoxGeometry(L + 6.5, bridge ? 1.2 : 0.2, 6.5), bridge ? deckM : roadM); m.position.set(cx, bridge ? 0.6 : 0.36, cz); m.rotation.y = r; m.receiveShadow = true; s.add(m);
      if (bridge) [-3.5, 3.5].forEach((o) => { const ox = z2 !== z1 ? o : 0, oz = z2 === z1 ? o : 0; const rl = new THREE.Mesh(new THREE.BoxGeometry(L, 0.3, 0.3), railM); rl.position.set(cx + ox, 2.1, cz + oz); rl.rotation.y = r; s.add(rl);
        for (let d = 0; d <= L; d += 3) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1, 0.25), railM); p.position.set(x1 + ((x2 - x1) * d) / L + ox, 1.6, z1 + ((z2 - z1) * d) / L + oz); s.add(p); } });
      for (let d = 5; d < L - 4; d += 5) marks.push({ x: x1 + ((x2 - x1) * d) / L, z: z1 + ((z2 - z1) * d) / L, r, y: bridge ? 1.24 : 0.48 }); };
    for (let r = 0; r < G.rows; r++) road(X0 - 30, (r - 2) * st, X1 + 30, (r - 2) * st);
    for (let c = 0; c < G.cols; c++) for (let r = 0; r < G.rows - 1; r++) { const lag = r === 2; if (lag && !G.bridges.includes(c)) continue; road((c - 3) * st, (r - 2) * st, (c - 3) * st, (r - 1) * st, lag); }
    for (let c = 0; c < G.cols; c++) { road((c - 3) * st, Z0 - 30, (c - 3) * st, Z0); road((c - 3) * st, Z1, (c - 3) * st, Z1 + 30); }
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1), tmpC = new THREE.Color();
    const mk = new THREE.InstancedMesh(new THREE.BoxGeometry(2.2, 0.06, 0.32), markM, marks.length);
    marks.forEach((x, i) => { q.setFromEuler(new THREE.Euler(0, x.r, 0)); m4.compose(new THREE.Vector3(x.x, x.y, x.z), q, one); mk.setMatrixAt(i, m4); }); s.add(mk);
    // îlots : maisons à toits pointus, tours pastel, parcs
    const rnd = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
    const hm = toon(0xffffff, { emissive: 0xffffff, emissiveMap: winTex(2, 2), emissiveIntensity: 0.5 }), tm = toon(0xffffff, { emissive: 0xffffff, emissiveMap: winTex(3, 6), emissiveIntensity: 0.5 }); winMats.push(hm, tm);
    const blocks = []; for (let c = 0; c < G.cols + 1; c++) for (let r = 0; r < G.rows + 1; r++) { const cx = (c - 3.5) * st, cz = (r - 2.5) * st; if (r === 3) continue; blocks.push([cx, cz, c, r]); }
    const H = [], T = [], trees = [], lawns = [];
    const tree = (x, z, sc) => trees.push([x, z, sc]);
    blocks.forEach(([cx, cz, c, r], bi) => {
      if (Math.abs(cx - 1.5 * st) < 1 && Math.abs(cz + 1.5 * st) < 1) return;
      const tall = Math.abs(cx) < st && cz < 0 && cz > -st; const park = bi % 9 === 4 || bi % 11 === 7;
      if (park) { lawns.push([cx, cz]); for (let k = 0; k < 11; k++) tree(cx + (rnd(bi * 31 + k) - 0.5) * 20, cz + (rnd(bi * 17 + k) - 0.5) * 20, 0.8 + rnd(bi + k) * 0.6); return; }
      if (tall) { for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const w = 7.5 + rnd(bi + i * 3 + j) * 2; T.push([cx - 5.5 + i * 11, 16 + rnd(bi * 7 + i * 13 + j * 5) * 26, cz - 5.5 + j * 11, w, w, PAL.walls[(bi + i * 2 + j) % PAL.walls.length]]); } return; }
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const k = bi * 97 + i * 7 + j; if (rnd(k) < 0.14) { tree(cx - 5.5 + i * 11, cz - 5.5 + j * 11, 1.1); continue; }
        const w = 6.6 + rnd(k + 1) * 2.4, d = 6.2 + rnd(k + 2) * 2.4; H.push([cx - 5.5 + i * 11, 4.2 + rnd(k + 3) * 3.4, cz - 5.5 + j * 11, w, d, PAL.walls[Math.floor(rnd(k + 4) * PAL.walls.length)], PAL.roofs[Math.floor(rnd(k + 5) * PAL.roofs.length)], 2.4 + rnd(k + 6) * 1.6]); }
      if (rnd(bi + 0.5) < 0.7) tree(cx + (rnd(bi + 9) - 0.5) * 3, cz + (rnd(bi + 11) - 0.5) * 3, 0.7);
    });
    // arbres le long des berges et en lisière
    for (let x = X0 - 40; x <= X1 + 40; x += 9) { if (rnd(x) < 0.55) tree(x + 2, st / 2 - 15.5, 0.75); if (rnd(x + 3) < 0.55) tree(x + 5, st / 2 + 15.5, 0.75); }
    for (let i = 0; i < 70; i++) { const a = rnd(i * 3.1) * Math.PI * 2, r = 150 + rnd(i * 7.7) * 110; tree(Math.cos(a) * r * 1.15, Math.sin(a) * r * 0.9, 1 + rnd(i) * 0.9); }
    const box = new THREE.BoxGeometry(1, 1, 1);
    const ih = new THREE.InstancedMesh(box, hm, H.length), ir = new THREE.InstancedMesh(new THREE.ConeGeometry(Math.SQRT2 * 0.5, 1, 4), toon(0xffffff), H.length);
    H.forEach((b, i) => { m4.compose(new THREE.Vector3(b[0], 0.3 + b[1] / 2, b[2]), new THREE.Quaternion(), new THREE.Vector3(b[3], b[1], b[4])); ih.setMatrixAt(i, m4); ih.setColorAt(i, tmpC.setHex(b[5]));
      q.setFromEuler(new THREE.Euler(0, Math.PI / 4, 0)); const ov = 1.18; m4.compose(new THREE.Vector3(b[0], 0.3 + b[1] + b[7] / 2, b[2]), q, new THREE.Vector3((b[3] + b[4]) / 2 * ov, b[7], (b[3] + b[4]) / 2 * ov)); ir.setMatrixAt(i, m4); ir.setColorAt(i, tmpC.setHex(b[6])); });
    const it = new THREE.InstancedMesh(box, tm, T.length), itc = new THREE.InstancedMesh(box, toon(0xffffff), T.length);
    T.forEach((b, i) => { m4.compose(new THREE.Vector3(b[0], 0.3 + b[1] / 2, b[2]), new THREE.Quaternion(), new THREE.Vector3(b[3], b[1], b[4])); it.setMatrixAt(i, m4); it.setColorAt(i, tmpC.setHex(b[5]));
      m4.compose(new THREE.Vector3(b[0], 0.3 + b[1] + 0.5, b[2]), new THREE.Quaternion(), new THREE.Vector3(b[3] + 0.6, 1, b[4] + 0.6)); itc.setMatrixAt(i, m4); itc.setColorAt(i, tmpC.setHex(PAL.roofs[i % PAL.roofs.length])); });
    [ih, ir, it, itc].forEach((im) => { im.castShadow = im.receiveShadow = !fo.light; if (im.instanceColor) im.instanceColor.needsUpdate = true; s.add(im); });
    lawns.forEach(([x, z]) => { const l = new THREE.Mesh(new THREE.BoxGeometry(23, 0.36, 23), toon(PAL.grass2)); l.position.set(x, 0.18, z); l.receiveShadow = true; s.add(l); const p = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.42, 24), toon(PAL.water)); p.position.set(x + 3, 0.2, z - 2); s.add(p); });
    const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.35, 0.45, 2.4, 6), toon(0x8a5a3b), trees.length), crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), toon(0xffffff), trees.length);
    trees.forEach((t, i) => { const sc = t[2]; m4.compose(new THREE.Vector3(t[0], 1.2 * sc, t[1]), new THREE.Quaternion(), new THREE.Vector3(sc, sc, sc)); trunk.setMatrixAt(i, m4);
      const cs = (2.3 + rnd(i * 5.3) * 1.2) * sc; m4.compose(new THREE.Vector3(t[0], 2.4 * sc + cs * 0.8, t[1]), new THREE.Quaternion(), new THREE.Vector3(cs, cs * 1.05, cs)); crown.setMatrixAt(i, m4); crown.setColorAt(i, tmpC.setHex(PAL.leaves[i % PAL.leaves.length])); });
    [trunk, crown].forEach((im) => { im.castShadow = !fo.light; if (im.instanceColor) im.instanceColor.needsUpdate = true; s.add(im); });
    // plateforme logistique
    const dx = 1.5 * st, dz = -1.5 * st; const dep = new THREE.Group(); fo.depot = { x: dx, z: dz };
    const lot = new THREE.Mesh(new THREE.BoxGeometry(26, 0.4, 26), toon(0xd9d2c0)); lot.position.set(dx, 0.2, dz); lot.receiveShadow = true; dep.add(lot);
    const hall = new THREE.Mesh(new THREE.BoxGeometry(24, 7.5, 8), toon(0xf6f1e4, { emissive: 0xffffff, emissiveMap: winTex(6, 2), emissiveIntensity: 0.3 })); hall.position.set(dx, 4, dz - 8.5); hall.castShadow = !fo.light; dep.add(hall); winMats.push(hall.material);
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 24.4, 24, 1, false, 0, Math.PI), toon(0xf2c14e)); roof.rotation.z = Math.PI / 2; roof.rotation.y = 0; roof.scale.set(1, 1, 0.55); roof.position.set(dx, 7.7, dz - 8.5); roof.rotation.x = 0; dep.add(roof);
    for (let i = 0; i < 7; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 9), markM); l.position.set(dx - 10.5 + i * 3.5, 0.43, dz + 4); dep.add(l); }
    dep.traverse((o) => (o.userData.pick = 'depot')); s.add(dep);
    // panneaux des communes
    const poleM = toon(0xffffff), signM = toon(0xffd23f, { emissive: 0xffd23f, emissiveIntensity: 0.2 }), edgeM = toon(0x2e3138);
    Object.keys(G.zones).forEach((z) => { const n = G.zones[z], p = window.FLEET.node(n[0], n[1]); const pv = new THREE.Vector3(p.x, 0, p.z);
      const ring = new THREE.Mesh(new THREE.RingGeometry(5.2, 6, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.set(p.x, 0.52, p.z); ring.userData.pick = 'zone:' + z; s.add(ring);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 7, 8), poleM); pole.position.set(p.x + 4.6, 3.5, p.z - 4.6); pole.userData.pick = 'zone:' + z; s.add(pole); pins.push(pole);
      const sg = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.6, 0.3), signM); sg.rotation.z = Math.PI / 4; sg.position.set(p.x + 4.6, 7.4, p.z - 4.6); sg.userData.pick = 'zone:' + z; s.add(sg); pins.push(sg);
      const ed = new THREE.Mesh(new THREE.BoxGeometry(3.0, 3.0, 0.2), edgeM); ed.rotation.z = Math.PI / 4; ed.position.set(p.x + 4.6, 7.4, p.z - 4.62); s.add(ed); pins.push(ed);
      zones[z] = { p: pv, ring }; });
    // véhicules
    window.FLEET.CURRENT.V.forEach((v, idx) => {
      const M = vehModel(v, idx); M.g.traverse((o) => (o.userData.pick = 'veh:' + v.id)); s.add(M.g);
      const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(30 * 3), 3)); tg.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(30 * 3), 3));
      const trail = new THREE.Line(tg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9 })); trail.frustumCulled = false; s.add(trail);
      vehs[v.id] = { g: M.g, tag: M.tag, beam: M.beam, v, trail, hist: [], target: null, shell: M.shell, hgt: M.hgt, col: M.col };
    });
    fo.labels = document.createElement('div'); fo.labels.className = 'labels';
    Object.keys(zones).forEach((z) => { const el = document.createElement('button'); el.className = 'lbl zl'; el.type = 'button'; el.innerHTML = '<span>' + z + '</span><b></b>'; el.addEventListener('click', () => opts.onPick('zone:' + z)); fo.labels.appendChild(el); lbls[z] = el; });
    const dl = document.createElement('button'); dl.className = 'lbl dep'; dl.type = 'button'; dl.innerHTML = '<span>Plateforme logistique</span>'; dl.addEventListener('click', () => opts.onPick('depot')); fo.labels.appendChild(dl); lbls.__depot = dl;
    fo.vl = document.createElement('div'); fo.vl.className = 'lbl vsel'; fo.vl.style.display = 'none'; fo.labels.appendChild(fo.vl);
    fo.ctl.target.set(0, 4, -12); fo.c.position.copy(fo.home()); fo.ctl.minDistance = 18; fo.ctl.maxDistance = 520;
    // Navigation façon carte : glisser = se déplacer, clic droit (ou Ctrl + glisser) = pivoter, molette = zoom ; tactile : 1 doigt déplace, 2 doigts zoom et pivot
    fo.ctl.screenSpacePanning = false; fo.ctl.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }; fo.ctl.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };
    fo.ctl.zoomSpeed = 1.2; fo.ctl.panSpeed = 1.1;
    { const lim = 4.2 * st, off = new THREE.Vector3(); fo.ctl.addEventListener('change', () => { const t = fo.ctl.target, x = Math.max(-lim, Math.min(lim, t.x)), z = Math.max(-lim, Math.min(lim, t.z)); if (x !== t.x || z !== t.z) { off.set(x - t.x, 0, z - t.z); t.add(off); fo.c.position.add(off); } }); }
    fo.ctl.addEventListener('start', () => { if (follow) { follow = null; if (opts.onFollowEnd) opts.onFollowEnd(); } });
    picker(fo, opts.onPick, opts.onHover); attachTo(fo, host); F.setTime(17 * 60); loopF();
  };
  F.depotSlot = (i) => ({ x: fo.depot.x - 10.5 + (i % 7) * 3.5, z: fo.depot.z + 1 + Math.floor(i / 7) * 2.6, heading: Math.PI / 2 });
  F.attach = (h) => { attachTo(fo, h); if (cab) h.classList.add('in-cab'); if (hq && hq.on) h.classList.add('in-hq'); };
  F.resize = () => fo && resize(fo);
  F.reset = () => { if (cab) return; follow = null; tween(fo, new THREE.Vector3(0, 4, -12), fo.home()); };
  F.zoom = (k) => { if (cab) return; const d = fo.c.position.clone().sub(fo.ctl.target).multiplyScalar(k); tween(fo, fo.ctl.target.clone(), fo.ctl.target.clone().add(d)); };
  F.focus = (id) => { if (cab) return false; let p; if (!id) return false; if (id.startsWith('veh:')) { const x = vehs[id.slice(4)]; if (!x || !x.g.visible) return false; p = x.g.position.clone(); } else if (id.startsWith('zone:')) p = zones[id.slice(5)].p.clone(); else p = new THREE.Vector3(fo.depot.x, 0, fo.depot.z); tween(fo, p, p.clone().add(new THREE.Vector3(18, 30, 48))); return true; };
  F.follow = (id) => { if (!id) { follow = null; return false; } const x = vehs[id.slice(4)]; if (!x || !x.g.visible) return false; follow = id.slice(4); followOff = new THREE.Vector3(22, 32, 50); fo.anim = null; fo.moved = true; return true; };
  F.isFollowing = () => !!follow;
  F.select = (id) => { selV = id && id.startsWith('veh:') ? id.slice(4) : null; if (!selV) follow = null; Object.values(vehs).forEach((x) => x.tag.scale.setScalar(x.v.id === selV ? 1.7 : 1)); };
  F.setLight = (v) => { fo.light = v; fo.r.shadowMap.enabled = !v; fo.r.setPixelRatio(v ? 1 : Math.min(devicePixelRatio, 2)); fo.s.traverse((o) => { if (o.material) o.material.needsUpdate = true; }); resize(fo); };
  F.showRoute = (pts) => { if (routeLine) { fo.s.remove(routeLine); routeLine.geometry.dispose(); routeLine = null; } if (!pts || pts.length < 2) return;
    const g = new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(p.x, 0.75, p.z))); routeLine = new THREE.Line(g, new THREE.LineDashedMaterial({ color: 0xe8553a, dashSize: 2.2, gapSize: 1.2, transparent: true, opacity: 0.95 })); routeLine.computeLineDistances(); fo.s.add(routeLine); };
  const lerpHex = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
  F.setTime = (min) => {
    const h = min / 60; const d = h < 5.5 ? 0 : h < 7 ? (h - 5.5) / 1.5 : h < 17.5 ? 1 : h < 19.2 ? 1 - (h - 17.5) / 1.7 : 0; day = d;
    const P = PAL.sky, warm = h > 16 || h < 8 ? Math.min(1, Math.abs(h - 12) / 6) : 0; // lumière dorée en fin de journée
    const key = Math.round(d * 20) + ':' + Math.round(warm * 10); if (key !== skyKey) { skyKey = key;
      const cols = [0, 1, 2].map((i) => { const dd = lerpHex(P.dusk[i], P.day[i], 1 - warm * 0.45); return d > 0.5 ? lerpHex(P.dusk[i], dd, (d - 0.5) * 2) : lerpHex(P.night[i], P.dusk[i], d * 2); });
      const x = sky.getContext('2d'), gr = x.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, cols[0]); gr.addColorStop(0.5, cols[1]); gr.addColorStop(1, cols[2]); x.fillStyle = gr; x.fillRect(0, 0, 4, 256); fo.s.background.needsUpdate = true; fo.s.fog.color.set(cols[2]); }
    const kL = hq && hq.on ? 0.74 : 1; lights.sun.intensity = (0.2 + d * 0.75) * kL; lights.hemi.intensity = (0.38 + d * 0.42) * kL; lights.sun.color.setHSL(0.1, 0.75, 0.6 + d * 0.3); lights.hemi.color.setHSL(0.11, 0.6, 0.55 + d * 0.35);
    const sa = ((h - 6) / 12) * Math.PI; lights.sun.position.set(Math.cos(sa) * 170, 50 + Math.max(0, Math.sin(sa)) * 130, 90);
    const night = d < 0.2; sun.position.set(night ? 260 : -Math.cos(sa) * 420, night ? 260 : 60 + Math.max(0, Math.sin(sa)) * 260, -650); sun.material.color.set(night ? 0xdfe6ff : 0xffffff); sun.scale.setScalar(night ? 80 : 150); sun.material.opacity = night || d > 0.05 ? 1 : 0.3;
    winMats.forEach((m) => { m.emissive.set(d > 0.5 ? 0xffffff : 0xffcf73); m.emissiveIntensity = d > 0.5 ? 0.45 : 0.6 + (1 - d) * 0.6; });
    headMats.forEach((m) => m.color.set(d > 0.6 ? 0xfff1b0 : 0xfff8d8)); if (hq) hq.lights.forEach((l) => (l.intensity = (1 - d) * 1.2)); Object.values(vehs).forEach((x) => (x.beam.material.opacity = (1 - d) * 0.14));
  };
  F.update = function (st) {
    st.vehicles.forEach((x) => { const k = vehs[x.id]; if (!k) return; const inCab = cab && cab.id === x.id; k.vis = x.visible || inCab; k.g.visible = k.vis && !(hq && hq.on); k.trail.visible = k.g.visible && x.moving && !inCab; k.moving = x.moving; k.target = { x: x.x, z: x.z, h: x.heading }; if (!k.placed) { k.g.position.set(x.x, 0, x.z); k.g.rotation.y = x.heading; k.placed = true; }
      const c = COL[x.s] || COL.avail; k.tag.material.color.setHex(c); k.status = x.s; });
    Object.keys(lbls).forEach((z) => { if (z === '__depot') return; const n = st.zoneCount[z] || 0; lbls[z].querySelector('b').textContent = n; zones[z].ring.material.opacity = 0.3 + Math.min(0.6, n * 0.08); });
  };

  /* ---- entrée dans le véhicule : survol, plongée, traversée du toit, vue conducteur ---- */
  const eyeOf = (k) => { const e = EYE[k.v.cat], h = k.g.rotation.y, fx = Math.cos(h), fz = -Math.sin(h); return { pos: new THREE.Vector3(k.g.position.x + fx * e[0], e[1], k.g.position.z + fz * e[0]), look: new THREE.Vector3(k.g.position.x + fx * 40, e[1] - 1.6, k.g.position.z + fz * 40), fx, fz }; };
  const cabFov = () => (fo.c.aspect < 0.8 ? 92 : fo.c.aspect < 1.2 ? 76 : 64);
  function showRig(on) { if (!rigInfo) return; rigInfo.R.visible = on; fo.c.near = on ? 0.04 : 1; fo.c.updateProjectionMatrix(); }
  F.enter = function (id, onPhase, o) {
    const k = vehs[id]; if (!k || !k.g.visible) return false; follow = null; fo.anim = null; selV = id;
    if (rigInfo) { fo.c.remove(rigInfo.R); rigInfo = null; }
    rigInfo = buildRig(k, o || {}); fo.c.add(rigInfo.R); steer = 0; prevH = null;
    cab = { id, phase: 0, t0: performance.now(), p0: fo.c.position.clone(), l0: fo.ctl.target.clone(), onPhase, fov0: fo.c.fov };
    fo.ctl.enabled = false; fo.host.classList.add('in-cab-anim'); if (reduce()) { cab.phase = 3; k.shell.forEach((m) => (m.visible = false)); fo.c.fov = cabFov(); fo.c.updateProjectionMatrix(); showRig(true); fo.host.classList.remove('in-cab-anim'); fo.host.classList.add('in-cab'); onPhase && onPhase('inside'); }
    return true;
  };
  F.exit = function (onDone) {
    if (!cab) return; const k = vehs[cab.id]; k.shell.forEach((m) => (m.visible = true)); const e = eyeOf(k); showRig(false); if (rigInfo) { fo.c.remove(rigInfo.R); rigInfo = null; }
    fo.c.fov = cab.fov0; fo.c.updateProjectionMatrix(); fo.ctl.enabled = true; fo.host.classList.remove('in-cab', 'in-cab-anim'); cab = null;
    fo.c.position.copy(e.pos); fo.ctl.target.copy(e.look); const p = k.g.position.clone(); tween(fo, p, p.clone().add(new THREE.Vector3(20, 30, 48))); onDone && onDone();
  };
  F.inCab = () => (cab ? cab.id : null);
  F.camHeading = () => (cab ? vehs[cab.id].g.rotation.y : 0);
  F.cabSteer = () => steer;
  function cabStep(n) {
    const k = vehs[cab.id]; if (!k) { cab = null; return; } const e = eyeOf(k), P = k.g.position, t = (n - cab.t0) / 1000;
    const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
    const over = new THREE.Vector3(P.x - e.fx * 14, k.hgt + 26, P.z - e.fz * 14), roofP = new THREE.Vector3(P.x - e.fx * 0.5, k.hgt + 0.6, P.z - e.fz * 0.5);
    if (cab.phase === 0) { const u = ease(Math.min(1, t / 1.0)); fo.c.position.lerpVectors(cab.p0, over, u); fo.ctl.target.lerpVectors(cab.l0, P, u); if (u >= 1) { cab.phase = 1; cab.t0 = n; } }
    else if (cab.phase === 1) { const u = ease(Math.min(1, t / 0.7)); fo.c.position.lerpVectors(over, roofP, u); fo.ctl.target.lerpVectors(P, e.look, u * 0.6); if (u > 0.82 && !cab.roof) { cab.roof = 1; cab.onPhase && cab.onPhase('roof'); } if (u >= 1) { cab.phase = 2; cab.t0 = n; k.shell.forEach((m) => (m.visible = false)); showRig(true); } }
    else if (cab.phase === 2) { const u = ease(Math.min(1, t / 0.6)); fo.c.position.lerpVectors(roofP, e.pos, u); fo.ctl.target.lerp(e.look, 0.25); fo.c.fov = cab.fov0 + (cabFov() - cab.fov0) * u; fo.c.updateProjectionMatrix(); if (u >= 1) { cab.phase = 3; fo.host.classList.remove('in-cab-anim'); fo.host.classList.add('in-cab'); cab.onPhase && cab.onPhase('inside'); } }
    else { fo.c.position.lerp(e.pos, 0.35); fo.ctl.target.lerp(e.look, 0.2); const fv = cabFov(); if (fo.c.fov !== fv) { fo.c.fov = fv; fo.c.updateProjectionMatrix(); } }
    fo.c.lookAt(fo.ctl.target);
    if (rigInfo && rigInfo.R.visible) {
      const h = k.g.rotation.y; if (prevH == null) prevH = h; let dh = h - prevH; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); prevH = h;
      const tgt = Math.max(-1.3, Math.min(1.3, dh * 32)); steer += (tgt - steer) * 0.09; const wob = k.moving && !reduce() ? Math.sin(n / 650) * 0.035 : 0;
      if (rigInfo.spin) rigInfo.spin.rotation.z = steer + wob; if (rigInfo.bar) rigInfo.bar.rotation.y = (steer + wob) * 0.28;
      const kx = Math.min(1, fo.c.aspect / 1.5); if (rigInfo.screen) { rigInfo.screen.position.x = 0.36 * kx; rigInfo.screenB.position.x = 0.36 * kx; }
      rigInfo.R.position.y = k.moving && !reduce() ? Math.sin(n / 140) * 0.004 : 0; if (rigInfo.charm) rigInfo.charm.position.x = 0.08 + Math.sin(n / 300) * 0.02 - steer * 0.02;
      rigArms();
    }
  }
  /* ======================= plateforme logistique : vue intérieure ======================= */
  /* Maison de poupée vue du dessus : six espaces reliés par un couloir, huit agents robots qui circulent.
     Positions, trajets et activités sont simulés ; ils illustrent le travail des agents à base de règles. */
  const AGC = { fleet: 0x3fb8af, route: 0x5b8def, maint: 0xf28c38, finance: 0x8fcf5a, driver: 0xef6f8f, delivery: 0xe8553a, fuel: 0xf4c542, bi: 0x8070f0 };
  const AGS = { fleet: 'Supervision', route: 'Itinéraires', maint: 'Maintenance', finance: 'Finance', driver: 'Chauffeurs', delivery: 'Livraisons', fuel: 'Carburant', bi: 'Business intelligence' };
  const ROOMS = [
    { id: 'garage', name: 'Garage et atelier', x0: -40, x1: -13, z0: -28, z1: -5, floor: 0xa59e91, door: -26 },
    { id: 'dispatch', name: 'Centre de dispatch', x0: -13, x1: 15, z0: -28, z1: -5, floor: 0x86a9c0, door: 1 },
    { id: 'core', name: 'Salle de l’orchestrateur', x0: 15, x1: 40, z0: -28, z1: -5, floor: 0x555b70, door: 27 },
    { id: 'office', name: 'Bureaux et finance', x0: -40, x1: -14, z0: 1, z1: 26, floor: 0xc9a06a, door: -27 },
    { id: 'lounge', name: 'Salle des chauffeurs', x0: -14, x1: 10, z0: 1, z1: 26, floor: 0xd9b98a, door: -2 },
    { id: 'dock', name: 'Quai et station carburant', x0: 10, x1: 40, z0: 1, z1: 26, floor: 0xb4b0a4, door: 25 },
  ];
  const POI = {
    screen: { n: 'l’écran du dispatch', p: [1, -19], face: Math.PI, t: 'Vérifie la carte en direct' }, lift: { n: 'le pont élévateur', p: [-29, -11], face: Math.PI, t: 'Inspecte un véhicule sur le pont' },
    core: { n: 'l’orchestrateur', p: [27, -11], face: Math.PI, t: 'Transmet ses résultats à l’orchestrateur' }, pump: { n: 'la pompe', p: [17, 13], face: 0, t: 'Relève les compteurs de la pompe' },
    whiteboard: { n: 'le tableau blanc', p: [-37, 13], face: -Math.PI / 2, t: 'Met à jour les graphiques' }, coffee: { n: 'la machine à café', p: [-9, 21], face: 0, t: 'Pause recharge de batterie' },
    crates: { n: 'le quai de chargement', p: [31, 9], face: 0, t: 'Contrôle le chargement du quai' }, notice: { n: 'le tableau d’affichage', p: [6, 15], face: Math.PI / 2, t: 'Affiche le planning des chauffeurs' },
  };
  const PLAN = { fleet: [[9, -11], ['screen', 'lift', 'core']], route: [[1, -11], ['screen', 'core', 'pump']], maint: [[-24, -12], ['lift', 'crates', 'core']], finance: [[-30, 8], ['whiteboard', 'core', 'coffee']],
    driver: [[-4, 9], ['notice', 'coffee', 'core']], delivery: [[-7, -11], ['crates', 'screen', 'core']], fuel: [[19, 8], ['pump', 'crates', 'core']], bi: [[21, -12], ['core', 'whiteboard', 'screen']] };
  let hq = null;
  const roomAt = (x, z) => ROOMS.find((r) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) || null;
  function hqPath(a, b) {
    const ra = roomAt(a[0], a[1]), rb = roomAt(b[0], b[1]); if (ra && rb && ra === rb) return [b];
    const out = [], back = (r) => r.z1 <= -5;
    if (ra) out.push([ra.door, back(ra) ? -7 : 3], [ra.door, -2]);
    if (rb) out.push([rb.door, -2], [rb.door, back(rb) ? -7 : 3]);
    out.push(b); return out;
  }
  function eyesTex(kind) {
    const c = document.createElement('canvas'); c.width = 128; c.height = 80; const x = c.getContext('2d');
    x.fillStyle = '#1b2532'; rrect(x, 0, 0, 128, 80, 26); x.fill(); x.fillStyle = '#bff6ff'; x.strokeStyle = '#bff6ff'; x.lineWidth = 7; x.lineCap = 'round';
    [38, 90].forEach((cx) => { if (kind === 'open') { rrect(x, cx - 9, 22, 18, 34, 9); x.fill(); } else if (kind === 'blink') { x.beginPath(); x.moveTo(cx - 10, 42); x.lineTo(cx + 10, 42); x.stroke(); } else { x.beginPath(); x.moveTo(cx - 11, 46); x.lineTo(cx, 32); x.lineTo(cx + 11, 46); x.stroke(); } });
    return new THREE.CanvasTexture(c);
  }
  function robot(id, EY) {
    const col = AGC[id], g = new THREE.Group(), body = toon(col), white = toon(0xf6f1e4), dark = toon(0x2e3138);
    const legs = [-0.34, 0.34].map((x) => { const l = new THREE.Group(); l.position.set(x, 1.0, 0); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.85, 10), dark); m.position.y = -0.42; l.add(m); const f = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 8), body); f.scale.set(1, 0.55, 1.35); f.position.set(0, -0.9, 0.08); l.add(f); g.add(l); return l; });
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.56, 1.15, 22), body); t.position.y = 1.58; g.add(t);
    const sh = new THREE.Mesh(new THREE.SphereGeometry(0.66, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2), body); sh.scale.y = 0.42; sh.position.y = 2.15; g.add(sh);
    const chest = new THREE.Mesh(new THREE.CircleGeometry(0.22, 20), new THREE.MeshBasicMaterial({ color: 0xffffff })); chest.position.set(0, 1.7, 0.64); g.add(chest);
    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.06, 8, 28), white); belt.rotation.x = Math.PI / 2; belt.position.y = 1.1; g.add(belt);
    const arms = [-1, 1].map((sd) => { const a = new THREE.Group(); a.position.set(sd * 0.78, 2.0, 0); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.8, 10), body); m.position.y = -0.4; a.add(m); const h = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 8), white); h.position.y = -0.86; a.add(h); g.add(a); return a; });
    const head = new THREE.Group(); head.position.y = 2.82; g.add(head);
    const hm = new THREE.Mesh(new THREE.SphereGeometry(0.62, 26, 18), white); hm.scale.set(1.18, 0.88, 1); head.add(hm);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.98, 0.6), new THREE.MeshBasicMaterial({ map: EY.open, transparent: true })); face.position.set(0, 0.0, 0.6); head.add(face);
    [-1, 1].forEach((sd) => { const e = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 14), body); e.rotation.z = Math.PI / 2; e.position.x = sd * 0.74; head.add(e); });
    const ant = limb(V3(0, 0.5, 0), V3(0, 0.95, 0), 0.03, 0.03, dark); head.add(ant);
    const bulbM = new THREE.MeshBasicMaterial({ color: col }); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), bulbM); bulb.position.y = 1.0; head.add(bulb);
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.75, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.06; g.add(shadow);
    g.traverse((o) => { o.userData.pick = 'agent:' + id; if (o.isMesh && o !== shadow) o.castShadow = !fo.light; });
    return { g, legs, arms, head, face, bulb, bulbM, EY };
  }
  function boxAt(G, w, h, d, c, x, y, z, ry) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof c === 'number' ? toon(c) : c); m.position.set(x, y + h / 2, z); if (ry) m.rotation.y = ry; m.castShadow = m.receiveShadow = !fo.light; G.add(m); return m; }
  function cylAt(G, r, h, c, x, y, z) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 18), toon(c)); m.position.set(x, y + h / 2, z); m.castShadow = !fo.light; G.add(m); return m; }
  function screenTex(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return { c, t: new THREE.CanvasTexture(c) }; }
  function monitorTex() { const c = document.createElement('canvas'); c.width = 96; c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#1b2532'; x.fillRect(0, 0, 96, 64); ['#3fb8af', '#ffd23f', '#5b8def', '#ef6f8f'].forEach((k, i) => { x.fillStyle = k; x.fillRect(10 + i * 20, 52 - (14 + ((i * 17) % 30)), 12, 14 + ((i * 17) % 30)); }); x.fillStyle = '#9fb0c2'; x.fillRect(8, 8, 50, 5); return new THREE.CanvasTexture(c); }
  function buildHQ() {
    const G = new THREE.Group(), EY = { open: eyesTex('open'), blink: eyesTex('blink'), happy: eyesTex('happy') };
    const H = { g: G, agents: {}, on: false, focus: null, EY, lights: [], leds: [], lbl: {}, mapT: 0 };
    
    const base = boxAt(G, 84, 0.4, 58, 0xb9b09c, 0, -0.2, -1);
    const cor = boxAt(G, 80, 0.06, 6, 0xe6cf95, 0, 0.2, -2); cor.receiveShadow = true;
    ROOMS.forEach((r) => { const f = boxAt(G, r.x1 - r.x0, 0.06, r.z1 - r.z0, r.floor, (r.x0 + r.x1) / 2, 0.2, (r.z0 + r.z1) / 2); f.userData.pick = 'room:' + r.id; });
    // murs : hauts au fond, bas côté caméra
    const wallM = toon(0xefe6d2), trimM = toon(0xd2c6ad);
    const wall = (x1, z1, x2, z2, h, gaps) => { const L = Math.hypot(x2 - x1, z2 - z1), dx = (x2 - x1) / L, dz = (z2 - z1) / L; let s0 = 0; const segs = []; (gaps || []).concat([[L, L]]).forEach(([a, b]) => { if (a > s0) segs.push([s0, a]); s0 = b; });
      segs.forEach(([a, b]) => { const m = (a + b) / 2, w = boxAt(G, b - a, h, 0.5, wallM, x1 + dx * m, 0.2, z1 + dz * m, -Math.atan2(dz, dx)); const tr = boxAt(G, b - a, 0.12, 0.56, trimM, x1 + dx * m, 0.2 + h, z1 + dz * m, -Math.atan2(dz, dx)); }); };
    wall(-40, -28, 40, -28, 7.2); wall(-40, -28, -40, 26, 3.4); wall(40, -28, 40, 1, 3.4);
    wall(-13, -28, -13, -5, 4); wall(15, -28, 15, -5, 4);
    wall(-40, -5, 40, -5, 1.4, ROOMS.filter((r) => r.z1 <= -5).map((r) => [r.door + 40 - 2.2, r.door + 40 + 2.2]));
    wall(-40, 1, 10, 1, 1.4, ROOMS.filter((r) => r.z0 >= 1 && r.id !== 'dock').map((r) => [r.door + 40 - 2.2, r.door + 40 + 2.2]));
    wall(-14, 1, -14, 26, 1.4, [[12, 16]]); wall(10, 1, 10, 26, 1.4, [[9, 14]]);
    // fenêtres sur le mur du fond
    const winM = toon(0xbfe4f1, { emissive: 0x9fd3e6, emissiveIntensity: 0.2 }); for (let x = -34; x <= 34; x += 8.5) { if (x > -12 && x < 14) continue; boxAt(G, 4.2, 2.2, 0.56, winM, x, 3, -28); }
    // garage : pont élévateur, véhicules, pneus, outils
    const liftP = toon(0xffd23f); [-33, -25].forEach((x) => boxAt(G, 0.6, 4.2, 0.6, liftP, x, 0.2, -19)); boxAt(G, 9, 0.3, 3, 0x3a3f48, -29, 2.6, -19);
    const fakeCar = vehModel({ cat: 'car', id: 'X' }, 4); fakeCar.tag.visible = fakeCar.beam.visible = false; fakeCar.g.position.set(-29, 2.9, -19); fakeCar.g.scale.setScalar(0.95); G.add(fakeCar.g);
    const fakeVan = vehModel({ cat: 'van', id: 'Y' }, 1); fakeVan.tag.visible = fakeVan.beam.visible = false; fakeVan.g.position.set(-19, 0.2, -21); fakeVan.g.rotation.y = Math.PI / 2; G.add(fakeVan.g);
    for (let i = 0; i < 4; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.25, 8, 18), toon(0x2e3138)); t.rotation.x = Math.PI / 2; t.position.set(-37.5, 0.45 + i * 0.5, -9); G.add(t); }
    boxAt(G, 7, 3.2, 0.3, 0x8a5a3b, -29, 1.4, -27.6); [[-31.5, 0xe8553a], [-29.8, 0x5b8def], [-28, 0xf4c542], [-26.5, 0x3fb8af]].forEach(([x, c]) => boxAt(G, 0.5, 1.2, 0.2, c, x, 2.3, -27.35));
    [-38, -36.6].forEach((x) => cylAt(G, 0.6, 1.5, 0xc0392b, x, 0.2, -26)); boxAt(G, 2, 1.2, 1, 0xe8553a, -15.5, 0.2, -8);
    // dispatch : écran mural (carte en direct), bureaux et moniteurs
    H.map = screenTex(512, 200); const wallScr = new THREE.Mesh(new THREE.PlaneGeometry(16, 6.25), new THREE.MeshBasicMaterial({ map: H.map.t })); wallScr.position.set(1, 3.9, -27.5); G.add(wallScr); boxAt(G, 16.8, 7, 0.3, 0x2e3138, 1, 0.3, -27.7);
    const mon = new THREE.MeshBasicMaterial({ map: monitorTex() });
    [-7, 1, 9].forEach((x) => { boxAt(G, 4.4, 1.1, 2, 0xf6f1e4, x, 0.2, -14.5); boxAt(G, 1.6, 1, 0.12, 0x2e3138, x - 0.9, 1.3, -15); boxAt(G, 1.6, 1, 0.12, 0x2e3138, x + 0.9, 1.3, -15);
      [-0.9, 0.9].forEach((o) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 0.85), mon); p.position.set(x + o, 1.8, -14.93); G.add(p); }); });
    // salle de l'orchestrateur : noyau lumineux et baies serveurs
    cylAt(G, 2.6, 0.8, 0x3a3f48, 27, 0.2, -18);
    H.core = new THREE.Mesh(new THREE.IcosahedronGeometry(2.1, 0), toon(0xffd23f, { emissive: 0xffc61a, emissiveIntensity: 0.55 })); H.core.position.set(27, 4.2, -18); H.core.userData.pick = 'core'; H.core.castShadow = !fo.light; G.add(H.core);
    H.ring = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.09, 8, 48), new THREE.MeshBasicMaterial({ color: 0xffd23f })); H.ring.position.copy(H.core.position); H.ring.rotation.x = Math.PI / 2.4; G.add(H.ring);
    const ledA = new THREE.MeshBasicMaterial({ color: 0x2fd08a }), ledB = new THREE.MeshBasicMaterial({ color: 0x4c8dff }); H.leds = [ledA, ledB];
    [18.5, 22, 32, 35.5].forEach((x) => { boxAt(G, 2.6, 4.6, 1.6, 0x2e3138, x, 0.2, -26.6); for (let j = 0; j < 6; j++) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.05), j % 2 ? ledA : ledB); l.position.set(x - 0.8 + (j % 3) * 0.8, 1.4 + Math.floor(j / 3) * 1.4, -25.78); G.add(l); } });
    // bureaux : postes, tableau blanc, plantes
    [[-33, 6], [-23, 6], [-33, 17], [-23, 17]].forEach(([x, z]) => { boxAt(G, 4.2, 1.1, 2.2, 0x8a5a3b, x, 0.2, z); boxAt(G, 1.3, 0.08, 0.9, 0x2e3138, x, 1.32, z); const p = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.75), mon); p.position.set(x, 1.75, z - 0.35); p.rotation.x = -0.3; G.add(p); });
    H.board = screenTex(256, 160); const bd = new THREE.Mesh(new THREE.PlaneGeometry(7, 4.4), new THREE.MeshBasicMaterial({ map: H.board.t })); bd.rotation.y = Math.PI / 2; bd.position.set(-39.6, 2.7, 13); G.add(bd);
    const plant = (x, z) => { cylAt(G, 0.5, 0.9, 0xe07a4b, x, 0.2, z); const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 1), toon(0x4f9e4a)); s.position.set(x, 1.9, z); G.add(s); };
    [[-38.5, 3], [-15.5, 24], [-38.5, 24], [12, -7], [38, -7.5]].forEach(([x, z]) => plant(x, z));
    boxAt(G, 0.9, 1.8, 0.9, 0x9fd3e6, -17, 0.2, 3.2);
    // salle des chauffeurs : canapé, machine à café, tableau d'affichage, casiers
    boxAt(G, 7, 0.8, 2.4, 0x5b8def, -5, 0.2, 21); boxAt(G, 7, 1.6, 0.6, 0x4a76cc, -5, 0.2, 22.3); boxAt(G, 3.4, 0.5, 1.8, 0x8a5a3b, -5, 0.2, 17.5);
    boxAt(G, 3, 1.4, 1.2, 0xf6f1e4, -9, 0.2, 23.6); boxAt(G, 0.9, 1, 0.8, 0x2e3138, -9, 1.6, 23.6);
    boxAt(G, 0.2, 2.4, 4, 0x8a5a3b, 9.6, 0.9, 16); [[0xf4c542, 15.2], [0xef6f8f, 16.3], [0xffffff, 17.1]].forEach(([c, z]) => boxAt(G, 0.05, 0.7, 0.7, c, 9.45, 2.1, z));
    for (let i = 0; i < 5; i++) boxAt(G, 1.3, 2.6, 1, [0x3fb8af, 0xf28c38, 0x8070f0][i % 3], -12.3 + i * 1.4, 0.2, 2.2);
    // quai : pompe, auvent, palettes, chariot, camion à quai
    boxAt(G, 1.2, 2.4, 0.9, 0xe8553a, 17, 0.2, 15.5); boxAt(G, 1.25, 0.5, 0.95, 0xffffff, 17, 1.9, 15.5); [[14, 11], [21, 11], [14, 19], [21, 19]].forEach(([x, z]) => boxAt(G, 0.3, 5, 0.3, 0xf6f1e4, x, 0.2, z)); boxAt(G, 8.4, 0.35, 9.4, 0xffd23f, 17.5, 5.2, 15);
    const crateM = toon(0xc08a52); for (let i = 0; i < 9; i++) boxAt(G, 1.6, 1.6, 1.6, crateM, 27 + (i % 3) * 1.8, 0.35 + Math.floor(i / 6) * 1.65, 4 + (Math.floor(i / 3) % 2) * 1.8 + (i >= 6 ? 0.9 : 0));
    for (let i = 0; i < 3; i++) boxAt(G, 2, 0.3, 2, 0xa77b48, 35, 0.2 + i * 0.32, 6);
    boxAt(G, 1.6, 1.2, 2.6, 0xf4c542, 24, 0.2, 13); boxAt(G, 1.4, 1.6, 0.2, 0x2e3138, 24, 1.4, 12); boxAt(G, 0.12, 2.4, 0.12, 0x2e3138, 23.5, 0.4, 11.6); boxAt(G, 0.12, 2.4, 0.12, 0x2e3138, 24.5, 0.4, 11.6);
    const fakeTruck = vehModel({ cat: 'truck', id: 'Z' }, 1); fakeTruck.tag.visible = fakeTruck.beam.visible = false; fakeTruck.g.position.set(32, 0.2, 19.5); fakeTruck.g.rotation.y = Math.PI; G.add(fakeTruck.g);
    // éclairage d'appoint pour la nuit
    [[-26, -16], [1, -16], [27, -16], [-27, 13], [-2, 13], [25, 13]].forEach(([x, z]) => { const l = new THREE.PointLight(0xfff0d0, 0, 34, 1.6); l.position.set(x, 9, z); G.add(l); H.lights.push(l); });
    // agents
    Object.keys(PLAN).forEach((id, i) => { const R = robot(id, EY), home = PLAN[id][0]; R.g.position.set(home[0], 0.2, home[1]); R.g.rotation.y = Math.PI; G.add(R.g);
      H.agents[id] = Object.assign(R, { id, home, visits: PLAN[id][1], vi: i % 3, state: 'work', until: performance.now() + 1500 + i * 2600, path: [], poi: null, blinkAt: 0, seed: i * 1.7 }); });
    G.visible = false; fo.s.add(G); return H;
  }
  function hqLabels() {
    const L = fo.labels; ROOMS.forEach((r) => { const el = document.createElement('div'); el.className = 'lbl room hqx'; el.textContent = r.name; el.style.display = 'none'; L.appendChild(el); hq.lbl['room:' + r.id] = { el, p: V3((r.x0 + r.x1) / 2, r.z1 <= -5 ? 6.6 : 2.2, r.z1 <= -5 ? r.z0 + 1 : (r.z0 + r.z1) / 2 + 9) }; });
    Object.keys(hq.agents).forEach((id) => { const el = document.createElement('button'); el.type = 'button'; el.className = 'lbl ag hqx'; el.style.display = 'none'; el.innerHTML = '<i class="dot" style="background:#' + new THREE.Color(AGC[id]).getHexString() + '"></i><span><b>' + AGS[id] + '</b><em></em></span><strong class="qm" hidden>!</strong>'; el.addEventListener('click', () => fo.opts.onPick('agent:' + id)); L.appendChild(el); hq.lbl['agent:' + id] = { el, a: hq.agents[id] }; });
    const el = document.createElement('button'); el.type = 'button'; el.className = 'lbl ag core hqx'; el.style.display = 'none'; el.innerHTML = '<i class="dot" style="background:#ffd23f"></i><span><b>Orchestrateur</b><em>Coordonne les 8 agents</em></span>'; el.addEventListener('click', () => fo.opts.onPick('core')); L.appendChild(el); hq.lbl.core = { el, p: V3(27, 7.6, -18) };
  }
  let hqInfo = {};
  F.hqSetInfo = (info) => { hqInfo = info || {}; };
  F.hqActivity = (id) => { const a = hq && hq.agents[id]; if (!a) return ''; if (hq.focus === 'agent:' + id) return 'Vous présente son travail'; if (a.state === 'walk') return a.poi ? 'En route vers ' + POI[a.poi].n : 'Retourne à son poste'; if (a.state === 'poi') return POI[a.poi].t; return (hqInfo[id] && hqInfo[id].task) || 'Travaille à son poste'; };
  F.inHQ = () => !!(hq && hq.on);
  F.hqFocused = () => (hq ? hq.focus : null);
  const HQ_OVER = { t: V3(0, 0, -1), p: () => { const k = Math.max(1, 1.5 / Math.max(fo.c.aspect, 0.5)); return V3(0, 62 * k, 66 * k); } };
  F.hqOverview = () => { if (!hq || !hq.on) return; const was = hq.focus; hq.focus = null; if (was && was.startsWith('agent:')) { const a = hq.agents[was.slice(6)]; a.state = 'work'; a.until = performance.now() + 2000; } tween(fo, HQ_OVER.t.clone(), HQ_OVER.p()); };
  F.hqFocus = (id) => {
    if (!hq || !hq.on) return false; if (hq.focus && hq.focus !== id && hq.focus.startsWith('agent:')) { const p = hq.agents[hq.focus.slice(6)]; p.state = 'work'; p.until = performance.now() + 1500; }
    hq.focus = id; const mob = fo.c.aspect < 0.8; if (id === 'core') { const c = hq.core.position; tween(fo, c.clone().add(V3(mob ? 0 : 3, mob ? -3 : -0.5, 0)), c.clone().add(V3(mob ? 0 : 3, mob ? 4 : 3, mob ? 24 : 18))); return true; }
    const a = hq.agents[id.slice(6)]; if (!a) return false; a.state = 'talk'; a.path = [];
    const P = a.g.position, d = V3(fo.c.position.x - P.x, 0, fo.c.position.z - P.z); if (d.lengthSq() < 1) d.set(0, 0, 1); d.normalize();
    // éviter de se placer derrière un mur : on privilégie le côté caméra (sud)
    if (d.z < 0.35) { d.z = 0.6; d.normalize(); }
    a.faceTo = Math.atan2(d.x, d.z); const rt = V3(d.z, 0, -d.x).multiplyScalar(mob ? 0 : 2.4), ty = mob ? -0.6 : 2.2;
    tween(fo, P.clone().add(rt).add(V3(0, ty, 0)), P.clone().add(d.clone().multiplyScalar(mob ? 11 : 8.4)).add(rt).add(V3(0, mob ? 4.2 : 3.6, 0))); return true;
  };
  F.enterHQ = function (onPhase) {
    if (!fo || cab) return false; if (!hq) { hq = buildHQ(); hqLabels(); } follow = null; fo.anim = null;
    const D = V3(fo.depot.x, 0, fo.depot.z); tween(fo, D.clone(), D.clone().add(V3(0, 26, 22))); fo.host.classList.add('in-hq-anim');
    setTimeout(() => { onPhase && onPhase('flash'); }, 650);
    setTimeout(() => {
      hq.hidden = fo.s.children.filter((o) => o !== hq.g && !o.isLight && o !== fo.c && o !== sun && !o.userData.keep && o.visible); hq.hidden.forEach((o) => (o.visible = false));
      hq.g.visible = true; hq.on = true; hq.focus = null; fo.host.classList.remove('in-hq-anim'); fo.host.classList.add('in-hq');
      fo.c.position.set(0, 130, 120); fo.ctl.target.set(0, 0, -1); fo.ctl.maxPolarAngle = Math.PI * 0.44; fo.ctl.minDistance = 6; fo.ctl.maxDistance = 190; tween(fo, HQ_OVER.t.clone(), HQ_OVER.p()); onPhase && onPhase('inside');
    }, reduce() ? 0 : 900);
    return true;
  };
  F.exitHQ = function (onDone) {
    if (!hq || !hq.on) return; hq.on = false; hq.focus = null; hq.g.visible = false; (hq.hidden || []).forEach((o) => (o.visible = true)); hq.hidden = null;
    Object.values(hq.lbl).forEach((l) => (l.el.style.display = 'none')); fo.host.classList.remove('in-hq', 'in-hq-anim'); fo.ctl.maxPolarAngle = Math.PI * 0.47; fo.ctl.minDistance = 18; fo.ctl.maxDistance = 520;
    const D = V3(fo.depot.x, 0, fo.depot.z); fo.c.position.copy(D.clone().add(V3(0, 26, 22))); fo.ctl.target.copy(D); tween(fo, V3(0, 4, -12), fo.home()); onDone && onDone();
  };
  function drawMap() {
    const x = hq.map.c.getContext('2d'), W = 512, Hh = 200; x.fillStyle = '#16202b'; x.fillRect(0, 0, W, Hh);
    const G = window.FLEET.GRID, st = G.step, sx = (v) => W / 2 + (v / (3.6 * st)) * (W / 2 - 14), sz = (v) => Hh / 2 + (v / (2.6 * st)) * (Hh / 2 - 12);
    x.fillStyle = '#1f6f7a'; x.fillRect(0, sz(st / 2) - 7, W, 14); x.strokeStyle = '#3b4a5c'; x.lineWidth = 3;
    for (let r = 0; r < G.rows; r++) { x.beginPath(); x.moveTo(sx(-3.4 * st), sz((r - 2) * st)); x.lineTo(sx(3.4 * st), sz((r - 2) * st)); x.stroke(); }
    for (let c = 0; c < G.cols; c++) { x.beginPath(); x.moveTo(sx((c - 3) * st), sz(-2.4 * st)); x.lineTo(sx((c - 3) * st), sz(2.4 * st)); x.stroke(); }
    Object.values(vehs).forEach((k) => { if (!k.vis) return; x.fillStyle = '#' + new THREE.Color(COL[k.status] || COL.avail).getHexString(); x.beginPath(); x.arc(sx(k.g.position.x), sz(k.g.position.z), 4, 0, Math.PI * 2); x.fill(); });
    x.fillStyle = '#ffd23f'; x.font = '600 15px "Archivo", sans-serif'; x.fillText('Carte en direct (simulée)', 12, 20); hq.map.t.needsUpdate = true;
    const b = hq.board.c.getContext('2d'); b.fillStyle = '#ffffff'; b.fillRect(0, 0, 256, 160); b.strokeStyle = '#2e3138'; b.lineWidth = 3; b.beginPath(); b.moveTo(20, 20); b.lineTo(20, 140); b.lineTo(240, 140); b.stroke();
    const vals = (hqInfo.__bars || [0.5, 0.7, 0.4, 0.8]); ['#3fb8af', '#8070f0', '#cf4f97', '#b98a2a'].forEach((c, i) => { b.fillStyle = c; const h = 100 * vals[i]; b.fillRect(40 + i * 50, 138 - h, 32, h); }); hq.board.t.needsUpdate = true;
  }
  function stepHQ(n, dt) {
    if (!hq || !hq.on) return; const spd = 3.4;
    hq.core.rotation.y += dt * 0.6; hq.core.rotation.x += dt * 0.25; hq.ring.rotation.z += dt * 0.8; const pz = 1 + Math.sin(n / 400) * 0.04; hq.core.scale.setScalar(pz);
    hq.leds[0].color.setHex(Math.sin(n / 300) > 0 ? 0x2fd08a : 0x1a6b4a); hq.leds[1].color.setHex(Math.sin(n / 210 + 1) > 0 ? 0x4c8dff : 0x24447a);
    if (n - hq.mapT > 1000) { hq.mapT = n; drawMap(); }
    Object.values(hq.agents).forEach((a) => {
      const p = a.g.position; let moving = false;
      if (a.state === 'talk') { let d = a.faceTo - a.g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); a.g.rotation.y += d * 0.15; }
      else if (a.state === 'walk') { const w = a.path[0]; if (!w) { a.state = a.poi ? 'poi' : 'work'; a.until = n + (a.poi ? 4500 + (a.seed % 1) * 2000 : 8000 + ((a.seed * 1000) % 5000)); }
        else { const dx = w[0] - p.x, dz = w[1] - p.z, L = Math.hypot(dx, dz), st = spd * dt; if (L <= st) { p.x = w[0]; p.z = w[1]; a.path.shift(); } else { p.x += (dx / L) * st; p.z += (dz / L) * st; moving = true; const h = Math.atan2(dx, dz); let d = h - a.g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); a.g.rotation.y += d * 0.2; } } }
      else if (n > a.until) { // fin d'activité : aller vers le prochain point ou rentrer
        if (a.state === 'work') { a.poi = a.visits[a.vi % a.visits.length]; a.vi++; const q = POI[a.poi].p, off = (Object.keys(hq.agents).indexOf(a.id) % 3 - 1) * 1.3; a.path = hqPath([p.x, p.z], [q[0] + off, q[1]]); a.state = 'walk'; }
        else { a.poi = null; a.path = hqPath([p.x, p.z], a.home); a.state = 'walk'; } }
      else { const f = a.state === 'poi' ? POI[a.poi].face : Math.PI; let d = f - a.g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); a.g.rotation.y += d * 0.08; }
      // animation : marche, frappe au clavier, salut
      const ph = n / 160 + a.seed * 3; const sw = moving ? Math.sin(ph) * 0.6 : 0;
      a.legs[0].rotation.x = sw; a.legs[1].rotation.x = -sw; a.g.position.y = 0.2 + (moving ? Math.abs(Math.sin(ph)) * 0.12 : 0);
      if (a.state === 'talk') { a.arms[1].rotation.z = 2.5 + Math.sin(n / 140) * 0.35; a.arms[1].rotation.x = 0; a.arms[0].rotation.set(0, 0, -0.15); }
      else if (a.state === 'work' || a.state === 'poi') { const tp = Math.sin(n / 90 + a.seed) * 0.12; a.arms[0].rotation.set(-0.9 + tp, 0, 0); a.arms[1].rotation.set(-0.9 - tp, 0, 0); }
      else { a.arms[0].rotation.set(-sw * 0.8, 0, -0.1); a.arms[1].rotation.set(sw * 0.8, 0, 0.1); }
      a.head.rotation.y = a.state === 'work' ? Math.sin(n / 1300 + a.seed) * 0.35 : 0;
      const alert = hqInfo[a.id] && hqInfo[a.id].alert; a.bulbM.color.setHex(alert ? (Math.sin(n / 180) > 0 ? 0xff4d5e : 0xffffff) : AGC[a.id]);
      if (n > a.blinkAt) { a.blinkAt = n + 2200 + ((a.seed * 777) % 2600); a.blink = n + 140; }
      a.face.material.map = a.state === 'talk' ? a.EY.happy : n < a.blink ? a.EY.blink : a.EY.open;
    });
  }
  function placeHQ(w, h) {
    Object.keys(hq.lbl).forEach((k) => { const L = hq.lbl[k], el = L.el; if (!hq.on) { el.style.display = 'none'; return; }
      if (hq.focus && k.startsWith('room:')) { el.style.display = 'none'; return; }
      const p = L.a ? L.a.g.position : L.p; tv.copy(p); if (L.a) tv.y += hq.focus === k ? 4.6 : 4.4; tv.project(fo.c); const vis = tv.z < 1 && Math.abs(tv.x) < 1.05 && Math.abs(tv.y) < 1.1; el.style.display = vis ? '' : 'none';
      if (vis && hq.focus === k) { el.style.display = 'none'; return; }
      if (vis) { el.style.transform = 'translate(' + Math.round((tv.x * 0.5 + 0.5) * w) + 'px,' + Math.round((-tv.y * 0.5 + 0.5) * h) + 'px) translate(-50%,-100%)'; if (L.a) { el.querySelector('em').textContent = F.hqActivity(L.a.id); el.querySelector('.qm').hidden = !(hqInfo[L.a.id] && hqInfo[L.a.id].alert); el.classList.toggle('on', hq.focus === k); } } });
  }

  const tv = new THREE.Vector3();
  function loopF() {
    requestAnimationFrame(loopF); if (!live(fo)) return; if (fo.light && !cab && (fo.f = (fo.f || 0) + 1) % 2) return;
    const n = performance.now(), dt = Math.min(0.06, (n - (fo.lastN || n)) / 1000); fo.lastN = n; if (fo.anim && !cab) fo.anim(n); stepHQ(n, dt);
    Object.values(vehs).forEach((k) => { if (!k.target) return; const p = k.g.position; p.x += (k.target.x - p.x) * 0.1; p.z += (k.target.z - p.z) * 0.1; let dh = k.target.h - k.g.rotation.y; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); k.g.rotation.y += dh * 0.12; });
    const inC = !!cab && cab.phase >= 2; pins.forEach((p) => (p.visible = !inC && !(hq && hq.on)));
    if (cab && vehs[cab.id]) { const me = vehs[cab.id].g.position; Object.values(vehs).forEach((k) => { if (k.v.id === cab.id || k.vis === undefined) return; k.g.visible = k.vis && !(inC && Math.hypot(k.g.position.x - me.x, k.g.position.z - me.z) < 7); }); } Object.values(vehs).forEach((k) => { if (cab && k.v.id === cab.id) return; k.tag.scale.setScalar(inC ? 0.45 : k.v.id === selV ? 1.7 : 1); });
    if (cab) cabStep(n); else { fo.ctl.update(); if (follow && vehs[follow] && vehs[follow].g.visible) { const p = vehs[follow].g.position; fo.ctl.target.lerp(p, 0.1); fo.c.position.lerp(fo.ctl.target.clone().add(followOff), 0.1); fo.c.lookAt(fo.ctl.target); } }
    if (n - trailT > 90) { trailT = n; Object.values(vehs).forEach((k) => { if (!k.moving || !k.g.visible) { if (k.hist.length) k.hist.length = 0; return; } k.hist.unshift([k.g.position.x, 0.55, k.g.position.z]); if (k.hist.length > 30) k.hist.length = 30;
      const pa = k.trail.geometry.attributes.position.array, ca = k.trail.geometry.attributes.color.array, c = new THREE.Color(COL[k.status] || COL.mission), wh = new THREE.Color(0xffffff);
      for (let i = 0; i < 30; i++) { const hh = k.hist[Math.min(i, k.hist.length - 1)]; pa[i * 3] = hh[0]; pa[i * 3 + 1] = hh[1]; pa[i * 3 + 2] = hh[2]; const f = Math.max(0, 1 - i / Math.max(1, k.hist.length)); const cc = wh.clone().lerp(c, f); ca[i * 3] = cc.r; ca[i * 3 + 1] = cc.g; ca[i * 3 + 2] = cc.b; }
      k.trail.geometry.attributes.position.needsUpdate = true; k.trail.geometry.attributes.color.needsUpdate = true; }); }
    const pulse = 0.5 + 0.5 * Math.sin(n / 260); Object.values(vehs).forEach((k) => { k.tag.position.y = k.hgt + 1.9 + (k.status === 'crit' || k.status === 'late' ? pulse * 0.6 : Math.sin(n / 700 + k.hgt) * 0.15); });
    if (!reduce()) clouds.forEach((c) => { c.position.x += c.userData.v * 0.03; if (c.position.x > 520) c.position.x = -520; });
    fo.r.render(fo.s, fo.c);
    const w = fo.host.clientWidth, h = fo.host.clientHeight;
    const place = (el, p, dy) => { if (cab || (hq && hq.on)) { el.style.display = 'none'; return; } tv.copy(p); tv.y += dy; tv.project(fo.c); const vis = tv.z < 1 && Math.abs(tv.x) < 1.05 && Math.abs(tv.y) < 1.1; el.style.display = vis ? '' : 'none'; if (vis) el.style.transform = 'translate(' + Math.round((tv.x * 0.5 + 0.5) * w) + 'px,' + Math.round((-tv.y * 0.5 + 0.5) * h) + 'px) translate(-50%,-100%)'; };
    Object.keys(lbls).forEach((z) => place(lbls[z], z === '__depot' ? new THREE.Vector3(fo.depot.x, 0, fo.depot.z - 8) : zones[z].p, z === '__depot' ? 14 : 12));
    if (selV && vehs[selV] && vehs[selV].g.visible) { fo.vl.textContent = selV; place(fo.vl, vehs[selV].g.position, 7); } else fo.vl.style.display = 'none';
    if (hq) placeHQ(w, h);
  }

  /* ======================= réseau d'agents ======================= */
  const N = (window.FLEET_NET = { supported });
  let no, nodes = {}, links = [], active = new Set(), selA = null;
  N.init = function (host, agents, onPick) {
    no = base({ bg: 0x0d1015, fogN: 200, fogF: 420 }); const s = no.s;
    no.home = () => { const k = Math.max(1, 1.4 / Math.max(no.c.aspect, 0.5)); return new THREE.Vector3(0, 100 * k, 72 * k); };
    s.add(new THREE.AmbientLight(0xffffff, 0.45)); const pl = new THREE.PointLight(ACC, 1.3, 220); pl.position.set(0, 30, 0); s.add(pl); const dl = new THREE.DirectionalLight(0xffffff, 0.6); dl.position.set(30, 60, 50); s.add(dl);
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(7, 1), mat(0x3b3110, { emissive: ACC, emissiveIntensity: 0.45, flatShading: true, metalness: 0.4 })); core.userData.pick = 'core'; s.add(core); nodes.core = { m: core, p: new THREE.Vector3() };
    const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(9.5, 1), new THREE.MeshBasicMaterial({ color: ACC, wireframe: true, transparent: true, opacity: 0.16 })); s.add(wire); no.wire = wire;
    const ringG = new THREE.Mesh(new THREE.RingGeometry(37.6, 38.2, 96), new THREE.MeshBasicMaterial({ color: 0x343e4b, side: THREE.DoubleSide })); ringG.rotation.x = -Math.PI / 2; s.add(ringG);
    agents.forEach((a, i) => { const ang = (i / agents.length) * Math.PI * 2; const p = new THREE.Vector3(Math.cos(ang) * 38, 0, Math.sin(ang) * 38);
      const m = new THREE.Mesh(new THREE.SphereGeometry(3.4, 24, 18), mat(0x1f262f, { emissive: 0x2fd08a, emissiveIntensity: 0.1 })); m.position.copy(p); m.userData.pick = 'agent:' + a.id; s.add(m); nodes[a.id] = { m, p }; links.push(link(nodes.core.p, p, 'agent:' + a.id)); });
    [['veh', [-64, 0, -44]], ['db', [64, 0, -44]], ['dash', [0, 0, 68]]].forEach(([id, xyz]) => { const p = new THREE.Vector3(...xyz); const m = new THREE.Mesh(new THREE.BoxGeometry(7, 7, 7), mat(0x26303b, { emissive: 0x4c8dff, emissiveIntensity: 0.18 })); m.position.copy(p); m.userData.pick = 'ext:' + id; s.add(m); nodes[id] = { m, p }; links.push(link(p, nodes.core.p, 'ext:' + id)); });
    no.labels = document.createElement('div'); no.labels.className = 'labels';
    agents.forEach((a) => { const el = document.createElement('button'); el.className = 'lbl'; el.type = 'button'; el.innerHTML = '<span>' + a.name + '</span>'; el.addEventListener('click', () => onPick('agent:' + a.id)); no.labels.appendChild(el); nodes[a.id].el = el; });
    [['core', 'Fleet Intelligence Orchestrator'], ['veh', 'Véhicules (simulés)'], ['db', 'Bases de données'], ['dash', 'Tableau de bord']].forEach(([id, t]) => { const el = document.createElement('div'); el.className = 'lbl static' + (id === 'core' ? ' core' : ''); el.innerHTML = '<span>' + t + '</span>'; no.labels.appendChild(el); nodes[id].el = el; });
    no.ctl.target.set(0, 0, 0); no.c.position.copy(no.home()); no.ctl.minDistance = 40; no.ctl.maxDistance = 260; no.ctl.autoRotateSpeed = 0.35;
    picker(no, onPick); attachTo(no, host); loopN();
  };
  function link(a, b, key) {
    no.s.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), new THREE.LineBasicMaterial({ color: 0x343e4b, transparent: true, opacity: 0.8 })));
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(4 * 3), 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: ACC, size: 1.7, transparent: true, opacity: 0.9 })); pts.frustumCulled = false; no.s.add(pts); return { a, b, key, pts, ph: Math.random() };
  }
  N.attach = (h) => attachTo(no, h); N.resize = () => no && resize(no);
  N.setActive = (ids) => { active = new Set(ids || []); };
  N.select = (id) => { selA = id; Object.keys(nodes).forEach((k) => { if (nodes[k].el) nodes[k].el.classList.toggle('sel', 'agent:' + k === id); }); };
  const v = new THREE.Vector3(), lp = new THREE.Vector3();
  function loopN() {
    requestAnimationFrame(loopN); if (!live(no)) return; const t = performance.now() / 1000; no.ctl.autoRotate = !selA && !reduce(); no.ctl.update();
    no.wire.rotation.y = t * 0.2; nodes.core.m.rotation.y = -t * 0.3;
    Object.keys(nodes).forEach((k) => { const n = nodes[k]; if (k === 'core' || !n.m.material.emissive) return; const on = active.has(k); n.m.material.emissiveIntensity = on ? 0.7 + 0.3 * Math.sin(t * 6) : 'agent:' + k === selA ? 0.5 : 0.1; n.m.material.emissive.setHex(on ? ACC : k.length > 4 || ['veh', 'db'].includes(k) ? 0x4c8dff : 0x2fd08a); n.m.scale.setScalar(on ? 1.25 : 1); });
    links.forEach((l) => { const k = l.key.split(':')[1], on = active.has(k), arr = l.pts.geometry.attributes.position.array; l.ph = (l.ph + (on ? 0.014 : 0.003)) % 1;
      for (let i = 0; i < 4; i++) { const u = (l.ph + i / 4) % 1; lp.lerpVectors(l.a, l.b, on ? 1 - u : u); arr[i * 3] = lp.x; arr[i * 3 + 1] = lp.y; arr[i * 3 + 2] = lp.z; } l.pts.geometry.attributes.position.needsUpdate = true; l.pts.material.opacity = on ? 1 : l.key.startsWith('ext') ? 0.6 : 0.3; });
    no.r.render(no.s, no.c);
    const w = no.host.clientWidth, h = no.host.clientHeight;
    Object.keys(nodes).forEach((k) => { const n = nodes[k]; if (!n.el) return; v.copy(n.p); v.y += k === 'core' ? 13 : 6; v.project(no.c); const vis = v.z < 1; n.el.style.display = vis ? '' : 'none'; if (vis) n.el.style.transform = 'translate(' + Math.round((v.x * 0.5 + 0.5) * w) + 'px,' + Math.round((-v.y * 0.5 + 0.5) * h) + 'px) translate(-50%,-100%)'; n.el.classList.toggle('on', active.has(k)); });
  }
})();
