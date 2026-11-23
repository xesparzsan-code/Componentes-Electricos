// Utilidades compartidas por los archivos de componentes (comp-*.js)
window.UT = (() => {
  const T = THREE;
  const fmt = (x, d = 1) => x.toFixed(d).replace('.', ',');

  // Materiales habituales
  function mats(ctx) {
    const { M } = ctx;
    const m = {
      base: M(0x2b2f36, { roughness: .8 }), plastic: M(0x3a3e45, { roughness: .75 }), white: M(0xe9e8e3, { roughness: .7 }),
      iron: M(0x8a929c, { metalness: .7, roughness: .35 }), dark: M(0x1d1f24, { roughness: .7 }), black: M(0x17191d, { roughness: .6 }),
      bronze: M(0xc7924a, { metalness: .8, roughness: .3 }), silver: M(0xe6e8ec, { metalness: .9, roughness: .2 }),
      card: M(0xe8d9b5, { roughness: .8 }), copper: M(0xb8642e, { metalness: .6, roughness: .4 }), steel: M(0xb9c0c8, { metalness: .8, roughness: .25 }),
      zinc: M(0xc9cdd2, { metalness: .85, roughness: .32 }), braid: M(0xd9a35f, { metalness: .7, roughness: .45 }),
      red: M(0xc62828, { roughness: .45 }), green: M(0x2e8b3e, { roughness: .45 }), yellow: M(0xf2b705, { roughness: .5 }), blue: M(0x1f4e9c, { roughness: .5 }),
      brown: M(0x6b3e1e, { roughness: .55 }), grey: M(0x8a9499, { roughness: .55 }), pe: M(0x3c9a3c, { roughness: .55 })
    };
    m.wind = bobinado(ctx, '#c97436', '#9a4f22', 3);
    m.wind2 = bobinado(ctx, '#d58a4a', '#a35a2a', 1.5);
    m.glass = new T.MeshPhysicalMaterial({ color: 0xd9e8f5, transparent: true, opacity: .16, roughness: .05, depthWrite: false });
    return m;
  }
  function bobinado(ctx, a, b, rep) {
    const c = document.createElement('canvas'); c.width = 16; c.height = 128; const g = c.getContext('2d');
    for (let i = 0; i < 32; i++) { g.fillStyle = i % 2 ? a : b; g.fillRect(0, i * 4, 16, 4); }
    const tx = new T.CanvasTexture(c); tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.repeat.set(1, rep); tx.encoding = T.sRGBEncoding;
    return ctx.M(0xffffff, { map: tx, metalness: .5, roughness: .35, emissive: 0xff3a00, emissiveIntensity: 0 });
  }
  // textura de chapas (núcleos laminados)
  function laminado(ctx, rep = 8) {
    const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d');
    g.fillStyle = '#8f979f'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#5d646b';
    for (let i = 0; i < 64; i += 8) g.fillRect(0, i, 64, 1.5);
    const tx = new T.CanvasTexture(c); tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.repeat.set(1, rep); tx.encoding = T.sRGBEncoding;
    return ctx.M(0xffffff, { map: tx, metalness: .6, roughness: .4 });
  }
  class Helix extends T.Curve {
    constructor(r, vueltas) { super(); this.r = r; this.v = vueltas; }
    getPoint(t, o = new T.Vector3()) { const a = t * Math.PI * 2 * this.v; return o.set(Math.cos(a) * this.r, t, Math.sin(a) * this.r); }
  }
  // muelle que une dos puntos (se estira cada fotograma con muelle.unir(a, b))
  function muelle(ctx, r, vueltas, grosor, mat, id) {
    const m = ctx.part(ctx.add(new T.Mesh(new T.TubeGeometry(new Helix(r, vueltas), vueltas * 36, grosor, 6), mat)), id);
    const Y = new T.Vector3(0, 1, 0), d = new T.Vector3();
    m.unir = (a, b) => { d.subVectors(b, a); const L = d.length(); m.position.copy(a); m.quaternion.setFromUnitVectors(Y, d.normalize()); m.scale.set(1, L, 1); };
    return m;
  }
  // caja transparente con aristas (carcasas, tapas)
  function caja(ctx, w, h, d, pos, id, color = 0x9aaec2) {
    const g = new T.Group(); ctx.scene.add(g);
    const geo = new T.BoxGeometry(w, h, d);
    const m = ctx.part(new T.Mesh(geo, new T.MeshPhysicalMaterial({ color: 0xd9e8f5, transparent: true, opacity: .14, roughness: .05, depthWrite: false })), id, true);
    m.position.copy(pos); m.renderOrder = 2; g.add(m);
    const e = new T.LineSegments(new T.EdgesGeometry(geo), new T.LineBasicMaterial({ color })); e.position.copy(pos); g.add(e);
    return g;
  }
  // sector de corona extruido (imanes, segmentos de colector, zapatas polares). Eje del extruido: x
  function sector(r0, r1, a0, a1, largo) {
    const s = new T.Shape();
    s.absarc(0, 0, r1, a0, a1, false); s.absarc(0, 0, r0, a1, a0, true);
    const g = new T.ExtrudeGeometry(s, { depth: largo, bevelEnabled: false, curveSegments: 24 });
    g.translate(0, 0, -largo / 2); g.rotateY(Math.PI / 2);   // ahora la corona está en el plano yz y el largo en x
    return g;
  }
  // carril DIN TS35 a lo largo del eje x; y0 = cara de apoyo, zc = centro del carril
  function carrilDIN(ctx, x0, x1, y0, zc, mat, id = 'carril', vertical = false) {
    const B = ctx.boxR, P = ctx.part;
    if (!vertical) {
      P(B(x0, x1, y0 + .65, y0 + .75, zc - 1.75, zc - 1.25, mat), id); P(B(x0, x1, y0 + .65, y0 + .75, zc + 1.25, zc + 1.75, mat), id);
      P(B(x0, x1, y0, y0 + .75, zc - 1.35, zc - 1.25, mat), id); P(B(x0, x1, y0, y0 + .75, zc + 1.25, zc + 1.35, mat), id);
      P(B(x0, x1, y0, y0 + .1, zc - 1.35, zc + 1.35, mat), id);
    }
  }
  // carril DIN detrás de un aparato visto de frente: carril horizontal en x, centrado en y = yc, cara frontal en z = zf
  function carrilDetras(ctx, x0, x1, yc, zf, mat, id = 'carril') {
    const B = ctx.boxR, P = ctx.part;
    P(B(x0, x1, yc - 1.75, yc - 1.25, zf - .1, zf, mat), id); P(B(x0, x1, yc + 1.25, yc + 1.75, zf - .1, zf, mat), id);
    P(B(x0, x1, yc - 1.35, yc - 1.25, zf - .75, zf, mat), id); P(B(x0, x1, yc + 1.25, yc + 1.35, zf - .75, zf, mat), id);
    P(B(x0, x1, yc - 1.35, yc + 1.35, zf - .75, zf - .65, mat), id);
  }
  // tornillo de borne con la cabeza mirando hacia +z (frente) o +y (arriba)
  function tornillo(ctx, x, y, z, mat, slot, id, haciaArriba) {
    const c = ctx.part(ctx.cyl(.2, .1, mat, x, y, z, null, 20), id);
    if (!haciaArriba) c.rotation.x = Math.PI / 2;
    const s = ctx.part(haciaArriba ? ctx.boxR(x - .16, x + .16, y + .045, y + .065, z - .03, z + .03, slot) : ctx.boxR(x - .16, x + .16, y - .03, y + .03, z + .045, z + .065, slot), id);
    if (!haciaArriba) s.rotation.z = .6; else s.rotation.y = .6;
  }
  // rótulo impreso sobre una cara
  const rotulo = (ctx, txt, w, h, pos, rot, opt = {}) => ctx.plano(ctx.texto(Array.isArray(txt) ? txt.map(t => Array.isArray(t) ? [t[0], t[1] * 2] : t) : txt, Object.assign({ w: 512, h: Math.round(512 * h / w), size: 120, color: '#14161a' }, opt, opt.size ? { size: opt.size * 2 } : {})), w, h, pos, rot || [0, 0, 0]);

  // lámpara (bombilla) con filamento que brilla: devuelve { setLuz(0..1) }
  function bombilla(ctx, pos, id, escala = 1) {
    const { T: TT, M, cyl, part } = ctx;
    const g = new TT.Group(); g.position.copy(pos); g.scale.setScalar(escala); ctx.scene.add(g);
    const vid = part(new TT.Mesh(new TT.SphereGeometry(.7, 32, 20), new TT.MeshPhysicalMaterial({ color: 0xfff6dc, transparent: true, opacity: .3, roughness: .05, depthWrite: false, emissive: 0xffc04a, emissiveIntensity: 0 })), id);
    vid.position.y = .9; vid.renderOrder = 2; g.add(vid);
    const fil = part(new TT.Mesh(new TT.TorusGeometry(.18, .025, 8, 24, Math.PI), M(0x553311, { emissive: 0xffb030, emissiveIntensity: 0 })), id);
    fil.position.y = .85; g.add(fil);
    const ros = part(cyl(.32, .45, M(0xb9bec4, { metalness: .8, roughness: .3 }), 0, .22, 0, g, 24), id);
    const luz = new TT.PointLight(0xffc878, 0, 6); luz.position.y = .9; g.add(luz);
    return { g, setLuz(k) { k = Math.max(0, Math.min(1, k)); fil.material.emissiveIntensity = k * 3; vid.material.emissiveIntensity = k * .9; luz.intensity = k * 1.5; } };
  }

  const lit = (el, on, col) => { if (!el) return; el.style.fill = on ? col : 'none'; el.style.filter = on ? `drop-shadow(0 0 6px ${col})` : 'none'; };
  const dl = rows => `<dl class="st">${rows.map(([id, t, v]) => `<dt>${t}</dt><dd id="${id}">${v}</dd>`).join('')}</dl>`;
  const set = (el, txt, cls) => { if (!el) return; if (el.textContent !== txt) el.textContent = txt; if (cls !== undefined && el.className !== cls) el.className = cls; };
  // botón que funciona mientras se mantiene pulsado (pulsadores reales)
  function momentaneo(btn, cb) {
    const on = e => { e.preventDefault(); if (btn.getAttribute('aria-pressed') === 'true') return; btn.setAttribute('aria-pressed', 'true'); cb(true); };
    const off = () => { if (btn.getAttribute('aria-pressed') === 'true') { btn.setAttribute('aria-pressed', 'false'); cb(false); } };
    btn.addEventListener('pointerdown', on);
    ['pointerup', 'pointerleave', 'pointercancel', 'blur'].forEach(t => btn.addEventListener(t, off));
    btn.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) on(e); });
    btn.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') off(); });
  }
  // grupo de botones de opción (aria-pressed), llama cb(valor)
  function opciones(cont, cb) {
    cont.addEventListener('click', e => {
      const b = e.target.closest('[data-v]'); if (!b) return;
      cont.querySelectorAll('[data-v]').forEach(x => x.setAttribute('aria-pressed', x === b));
      cb(b.dataset.v);
    });
  }
  // zona clicable dentro de un esquema SVG (rect.hit). mantener = actúa mientras se mantiene pulsada
  function hit(panel, sel, cb, mantener, etiqueta) {
    const el = panel.querySelector(sel); if (!el) return;
    el.setAttribute('role', 'button'); el.setAttribute('tabindex', '0');
    if (etiqueta) { el.setAttribute('aria-label', etiqueta); const t = document.createElementNS('http://www.w3.org/2000/svg', 'title'); t.textContent = etiqueta; el.appendChild(t); }
    if (mantener) { momentaneo(el, cb); return; }
    el.addEventListener('click', () => cb());
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cb(); } });
  }
  const pasar = (a, b, k) => a + (b - a) * Math.min(1, k);
  return { fmt, mats, laminado, Helix, muelle, caja, sector, carrilDIN, carrilDetras, tornillo, rotulo, bombilla, lit, dl, set, momentaneo, opciones, hit, pasar };
})();
