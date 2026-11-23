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

  // Cuerpo de sensor cilíndrico roscado (tipo M18) con el eje en x: cara sensible en x0, parte trasera en x1 (< x0)
  function cuerpoSensor(ctx, { x0, x1, y = 0, z = 0, r = .9, cara = 0x2f6fb5 } = {}) {
    const { T, V, M, cyl, part: P, tube } = ctx, L = x0 - x1;
    const ejeX = o => { o.rotation.z = Math.PI / 2; return o; };
    const shell = ejeX(P(new T.Mesh(new T.CylinderGeometry(r, r, L - .4, 40, 1, true), new T.MeshPhysicalMaterial({ color: 0xb9c0c8, metalness: .6, roughness: .3, transparent: true, opacity: .22, depthWrite: false, side: T.DoubleSide })), 'cuerpo', true));
    shell.position.set(x1 + .2 + (L - .4) / 2, y, z); shell.renderOrder = 2; ctx.scene.add(shell);
    const anillos = [];
    for (let x = x1 + .35; x < x0 - .3; x += .22) { const a = new T.Mesh(new T.TorusGeometry(r + .01, .025, 6, 40), M(0xc9cdd2, { metalness: .8, roughness: .3 })); a.rotation.y = Math.PI / 2; a.position.set(x, y, z); P(a, 'cuerpo'); ctx.scene.add(a); anillos.push(a); }
    for (const x of [x1 + .8, x0 - 1.0]) ejeX(P(ctx.cyl(r * 1.42, .3, M(0xaab1b9, { metalness: .8, roughness: .3 }), x, y, z, null, 6), 'tuercas'));
    ejeX(P(cyl(r * .98, .2, M(cara, { roughness: .5 }), x0 - .1, y, z, null, 40), 'cara'));
    ejeX(P(cyl(r * .92, .45, M(0x2b2f36, { roughness: .6 }), x1 + .22, y, z, null, 32), 'cuerpo'));
    const led = P(new T.Mesh(new T.TorusGeometry(r * .8, .07, 8, 32), M(0x553000, { emissive: 0xff9a1f, emissiveIntensity: 0 })), 'led');
    led.rotation.y = Math.PI / 2; led.position.set(x1 - .01, y, z); ctx.scene.add(led);
    return { shell, anillos, led, setCorte(v) { shell.material.opacity = v ? .22 : 1; shell.material.depthWrite = !v; } };
  }

  // pantalla de un aparato de medida (canvas que se redibuja solo cuando cambia el texto)
  function pantalla(ctx, pos, w, h, rot = [0, 0, 0]) {
    const T = ctx.T, c = document.createElement('canvas'); c.width = 384; c.height = Math.round(384 * h / w); const g = c.getContext('2d');
    const tx = new T.CanvasTexture(c); tx.encoding = T.sRGBEncoding;
    const p = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tx })); p.position.copy(pos); p.rotation.set(...rot); ctx.scene.add(p);
    let ult = '';
    return txt => { if (txt === ult) return; ult = txt; const L = [].concat(txt);
      g.fillStyle = '#b8d4a8'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#1a2a14'; g.textAlign = 'right';
      L.forEach((t, i) => { let f = c.height / L.length * .62; g.font = `600 ${f}px Inter, Arial`; const mw = g.measureText(t).width; if (mw > c.width * .9) { f *= c.width * .9 / mw; g.font = `600 ${f}px Inter, Arial`; } g.fillText(t, c.width - 16, c.height * (i + .72) / L.length); });
      tx.needsUpdate = true; };
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

  // ---------- Vista «por dentro»: lámina de detalle ampliado, apartada del montaje ----------
  // Se construye lejos (x = 200) y la cámara viaja hasta ella con el botón «Ver por dentro».
  const OX = 200;
  function detalle(ctx, { w = 12, h = 7, titulo = '' } = {}) {
    const { T, V } = ctx, g = new T.Group(); g.position.set(OX, 0, 0); ctx.scene.add(g);
    const fondo = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: 0x082448, transparent: true, opacity: .62, depthWrite: false }));
    fondo.position.z = -.8; fondo.renderOrder = -1; g.add(fondo);
    const lm = (c = 0xeaf2ff, o = .9) => new T.LineBasicMaterial({ color: c, transparent: true, opacity: o });
    const linea = (pts, { color = 0xeaf2ff, op = .9, dash = 0, z } = {}) => {
      const P = pts.map(p => Array.isArray(p) ? V(p[0], p[1], z ?? p[2] ?? 0) : p);
      const mat = dash ? new T.LineDashedMaterial({ color, dashSize: dash, gapSize: dash * .7, transparent: true, opacity: op }) : lm(color, op);
      const l = new T.Line(new T.BufferGeometry().setFromPoints(P), mat); if (dash) l.computeLineDistances(); g.add(l); return l;
    };
    const x0 = -w / 2, x1 = w / 2, y0 = -h / 2, y1 = h / 2, zf = -.79;
    linea([[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]], { z: zf });
    linea([[x0 + .15, y0 + .15], [x1 - .15, y0 + .15], [x1 - .15, y1 - .15], [x0 + .15, y1 - .15], [x0 + .15, y0 + .15]], { z: zf, op: .35 });
    const tw = Math.min(w, 13), th = tw * 96 / 1400;
    const tt = ctx.plano(ctx.texto([[titulo, 64]], { w: 1400, h: 96, color: '#eaf2ff' }), tw, th, V(0, y1 + th / 2 + .15, zf)); g.add(tt);
    // trazo que se redibuja cada fotograma (ondas, cotas, líneas de campo)
    const traza = (n, { color = 0xeaf2ff, op = 1 } = {}) => {
      const pos = new Float32Array(n * 3), geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      const l = new T.Line(geo, lm(color, op)); l.frustumCulled = false; g.add(l);
      return { l, set(f) { let k = 0; for (let i = 0; i < n; i++) { const p = f(i / (n - 1), i); pos[k++] = p[0]; pos[k++] = p[1]; pos[k++] = p[2] || 0; } geo.attributes.position.needsUpdate = true; } };
    };
    // texto dinámico sobre la lámina (se redibuja solo si cambia)
    const etiqueta = (x, y, ww, hh, { color = '#eaf2ff', size = .8, align = 'center', z = 0, bg = null } = {}) => {
      const c = document.createElement('canvas'); c.width = 512; c.height = Math.max(32, Math.round(512 * hh / ww)); const g2 = c.getContext('2d');
      const tx = new T.CanvasTexture(c); tx.encoding = T.sRGBEncoding; tx.anisotropy = 4;
      const m = new T.Mesh(new T.PlaneGeometry(ww, hh), new T.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false }));
      m.position.set(x, y, z); m.renderOrder = 5; g.add(m);
      let ult = null;
      const set = (txt, col) => { const k = txt + (col || ''); if (k === ult) return; ult = k;
        g2.clearRect(0, 0, c.width, c.height); if (bg) { g2.fillStyle = bg; g2.fillRect(0, 0, c.width, c.height); } g2.fillStyle = col || color; g2.textBaseline = 'middle'; g2.textAlign = align;
        let f = c.height * size; g2.font = `600 ${f}px "IBM Plex Mono", Menlo, monospace`;
        const mw = g2.measureText(txt).width; if (mw > c.width * .96) { f *= c.width * .96 / mw; g2.font = `600 ${f}px "IBM Plex Mono", Menlo, monospace`; }
        g2.fillText(txt, align === 'left' ? 6 : align === 'right' ? c.width - 6 : c.width / 2, c.height / 2); tx.needsUpdate = true; };
      set.mesh = m; return set;
    };
    // cota con flechas entre dos puntos horizontales
    const cota = (y, { color = 0xeaf2ff } = {}) => {
      const t = traza(9, { color });
      return (a, b) => { const s = .18; t.set((u, i) => [[a, y + s], [a, y - s], [a, y], [a + s, y + s * .6], [a, y], [b, y], [b - s, y + s * .6], [b, y], [b, y - s]][i]); };
    };
    // bloques de la electrónica interna en cadena (se iluminan según la señal)
    const cadena = (nombres, y, xa, xb) => {
      const n = nombres.length, gap = .35, bw = (xb - xa - gap * (n - 1)) / n, out = [];
      nombres.forEach((nm, i) => {
        const cx = xa + bw / 2 + i * (bw + gap);
        const mat = new T.MeshBasicMaterial({ color: 0x0d3a6e, transparent: true, opacity: .9 });
        const b = new T.Mesh(new T.PlaneGeometry(bw, .62), mat); b.position.set(cx, y, -.7); g.add(b);
        linea([[cx - bw / 2, y - .31], [cx + bw / 2, y - .31], [cx + bw / 2, y + .31], [cx - bw / 2, y + .31], [cx - bw / 2, y - .31]], { z: -.69 });
        if (i < n - 1) linea([[cx + bw / 2, y], [cx + bw / 2 + gap, y], [cx + bw / 2 + gap - .12, y + .1], [cx + bw / 2 + gap, y], [cx + bw / 2 + gap - .12, y - .1]], { z: -.69 });
        const e = etiqueta(cx, y, bw * .94, .4, { size: .62, z: -.68 }); e(nm);
        out.push(k => { mat.color.setRGB(.05 + .75 * k, .23 + .5 * k, .43 - .2 * k); e(nm, k > .5 ? '#0b2347' : '#eaf2ff'); });
      });
      return out;
    };
    const tan = Math.tan(19 * Math.PI / 180), d = 1.1 * Math.max((h + 1.6) / (2 * tan), w / (2 * tan * 1.15));
    return { g, OX, W: (x, y, z = 0) => V(OX + x, y, z), linea, traza, etiqueta, cota, cadena, dentro: { pos: [OX, 1.7, d * 1.05], tgt: [OX, .85, 0] } };
  }
  // símbolo de corriente en corte: punto (sale) o aspa (entra)
  function simbolo(ctx, sale) {
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    g.strokeStyle = '#ffb38a'; g.fillStyle = '#ffb38a'; g.lineWidth = 6; g.beginPath(); g.arc(32, 32, 26, 0, 7); g.stroke();
    if (sale) { g.beginPath(); g.arc(32, 32, 8, 0, 7); g.fill(); } else { g.beginPath(); g.moveTo(16, 16); g.lineTo(48, 48); g.moveTo(48, 16); g.lineTo(16, 48); g.stroke(); }
    const tx = new ctx.T.CanvasTexture(c); return tx;
  }
  return { fmt, mats, detalle, simbolo, laminado, Helix, muelle, caja, sector, carrilDIN, carrilDetras, tornillo, rotulo, bombilla, lit, dl, set, momentaneo, opciones, hit, pasar, cuerpoSensor, pantalla };
})();
