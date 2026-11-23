// Componentes: el amplificador operacional en sus ocho montajes básicos.
// Cada montaje es una placa con el esquema hecho en 3D (pistas de cobre que se colorean con la tensión de cada nudo),
// generadores en las entradas y un osciloscopio que dibuja entradas y salida. AO ideal alimentado a ±12 V (satura a ±11 V).
(() => {
  const { set, fmt } = UT;
  const VSAT = 11, A0 = 2e5, FV = .35;              // FV: ciclos por segundo en pantalla (el tiempo va ralentizado)
  const clip = v => Math.max(-VSAT, Math.min(VSAT, v));
  const RS = [1000, 2200, 4700, 10000, 22000, 47000, 100000];
  const CS = [10e-9, 47e-9, 100e-9, 470e-9, 1e-6];
  const FS = [50, 100, 500, 1000];
  const ohm = r => r >= 1000 ? fmt(r / 1000, r % 1000 ? 1 : 0) + ' kΩ' : r + ' Ω';
  const far = c => c >= 1e-6 ? fmt(c * 1e6, 0) + ' µF' : fmt(c * 1e9, 0) + ' nF';
  const hz = f => f >= 1000 ? fmt(f / 1000, 0) + ' kHz' : f + ' Hz';
  const amp = i => Math.abs(i) >= 1e-3 ? fmt(Math.abs(i) * 1000, 2) + ' mA' : fmt(Math.abs(i) * 1e6, 1) + ' µA';
  const volt = v => (v > .004 ? '+' : v < -.004 ? '−' : '') + fmt(Math.abs(v), 2) + ' V';
  const ONDA = { dc: () => 1, seno: t => Math.sin(t), cuad: t => Math.tanh(14 * Math.sin(t)), tri: t => 2 / Math.PI * Math.asin(Math.sin(t)) };
  const DONDA = { dc: () => 0, seno: t => Math.cos(t), cuad: t => { const h = Math.tanh(14 * Math.sin(t)); return 14 * Math.cos(t) * (1 - h * h); }, tri: t => 2 / Math.PI * Math.sign(Math.cos(t)) };
  const NOMBRE = { dc: 'Continua', seno: 'Senoidal', cuad: 'Cuadrada', tri: 'Triangular' };
  const COLB = [[0, 0, 0], [139, 69, 19], [204, 0, 0], [255, 120, 0], [240, 200, 0], [0, 140, 60], [20, 80, 220], [130, 40, 180], [128, 128, 128], [245, 245, 245]].map(([r, g, b]) => (r << 16) | (g << 8) | b);
  const bandas = r => { const e = Math.floor(Math.log10(r)) - 1, d = Math.round(r / 10 ** e); return [Math.floor(d / 10), d % 10, e].map(i => COLB[i]).concat(0xc9a227); };

  // ---------- panel ----------
  const sel = (id, t, ops, v, f) => `<label class="sel"><span>${t}</span><select id="${id}">${ops.map(o => `<option value="${o}"${o === v ? ' selected' : ''}>${f(o)}</option>`).join('')}</select></label>`;
  function panelDe(c) {
    let h = '';
    c.ent.forEach(([k, t, tipo, val]) => {
      h += `<h3 class="ent">${t}</h3>`;
      if (tipo !== 'fija') h += `<div class="row tipo" id="t_${k}">${Object.keys(NOMBRE).map(n => `<button class="sm" data-v="${n}" aria-pressed="${n === tipo}">${NOMBRE[n]}</button>`).join('')}</div>`;
      h += `<label class="sp"><span id="l_${k}">${tipo === 'dc' || tipo === 'fija' ? 'Valor' : 'Amplitud'}</span><input type="range" id="s_${k}" min="-5" max="5" step="0.1" value="${val}"><b id="b_${k}"></b></label>`;
    });
    const sels = (c.R || []).map(([k, t, v]) => sel('r_' + k, t, RS, v, ohm));
    if (c.C) sels.push(sel('c_c', 'C', CS, c.C, far));
    if (c.F) sels.push(sel('f_f', 'Frecuencia', FS, c.F, hz));
    if (sels.length) h += `<div class="sels">${sels.join('')}</div>`;
    if (c.reset) h += `<div class="row"><button class="sm" id="reset">Descargar el condensador (reiniciar)</button></div>`;
    h += `<p class="msg" id="msg"></p>`;
    h += UT.dl([['rIn', c.ent.length > 1 ? 'Entradas' : 'Vin', '—'], ['rVp', 'V+ (entrada no inversora)', '—'], ['rVn', 'V− (entrada inversora)', '—'], ['rVo', 'Vout', '—'], ['rG', c.gLab || 'Ganancia', '—'], ['rI', c.iLab || 'Corriente', '—']]);
    h += `<p class="nota-sch">El color de cada pista indica su tensión: <b style="color:#ff6b5a">rojo</b> positiva, <b style="color:#5aa2ff">azul</b> negativa, gris 0 V. El tiempo va muy ralentizado para poder seguirlo.</p>`;
    return h;
  }

  // ---------- construcción común ----------
  function hacerBuild(c) {
    return function build(ctx, panel) {
      const { T, V, M, boxR, cyl, part: P } = ctx;
      const m = UT.mats(ctx), Y = .06;
      // placa y mesa
      P(boxR(-7.6, 7.6, -.18, 0, -4.3, 4.3, M(0x05301b, { roughness: .85, metalness: 0 })), 'placa');
      for (const [x, z] of [[-7.2, -3.9], [7.2, -3.9], [-7.2, 3.9], [7.2, 3.9]]) P(cyl(.12, .03, m.silver, x, .015, z, null, 16), 'placa');
      const rot = (txt, x, z, w = .9, h = .42, col = '#eaf2ff') => UT.rotulo(ctx, txt, w, h, V(x, .012, z), [-Math.PI / 2, 0, 0], { color: col });
      // materiales de cada nudo (se colorean con su tensión)
      const nudos = {}, matN = k => nudos[k] || (nudos[k] = { m: M(0x9aa3ad, { metalness: .5, roughness: .4, emissive: 0x000000 }), mesh: null });
      const gC = new T.CylinderGeometry(.055, .055, 1, 10), gS = new T.SphereGeometry(.075, 10, 8), up = V(0, 1, 0);
      const wire = (k, pts) => { const n = matN(k);
        for (let i = 0; i < pts.length - 1; i++) { const a = V(pts[i][0], Y, pts[i][1]), b = V(pts[i + 1][0], Y, pts[i + 1][1]), d = b.clone().sub(a), L = d.length();
          const s = P(new T.Mesh(gC, n.m), 'pistas'); s.scale.y = L; s.position.copy(a).addScaledVector(d, .5); s.quaternion.setFromUnitVectors(up, d.normalize()); ctx.add(s); n.mesh = n.mesh || s; }
        pts.forEach(p => { const j = P(new T.Mesh(gS, n.m), 'pistas'); j.position.set(p[0], Y, p[1]); ctx.add(j); }); };
      const etq = {};
      // resistencia entre dos puntos (en línea recta), con sus bandas de colores
      const res = (k, a, b, nombre) => {
        const A = V(a[0], Y, a[1]), B = V(b[0], Y, b[1]), d = B.clone().sub(A), L = d.length(); d.normalize();
        const mid = A.clone().addScaledVector(d, L / 2); mid.y = .26;
        const e0 = mid.clone().addScaledVector(d, -.5), e1 = mid.clone().addScaledVector(d, .5);
        P(ctx.tube([A, A.clone().lerp(e0, .5).setY(.2), e0], .03, m.silver), k); P(ctx.tube([e1, e1.clone().lerp(B, .5).setY(.2), B], .03, m.silver), k);
        const q = new T.Quaternion().setFromUnitVectors(up, d);
        const body = P(cyl(.19, 1.0, M(0x8fb3d9, { roughness: .55 }), 0, 0, 0, null, 20), k); body.position.copy(mid); body.quaternion.copy(q);
        const bm = [-.3, -.16, -.02, .3].map(o => { const mm = M(0x000000, { roughness: .5 }); const bnd = P(cyl(.198, .075, mm, 0, 0, 0, null, 20), k); bnd.position.copy(mid).addScaledVector(d, o); bnd.quaternion.copy(q); return bnd; });
        const per = V(-d.z, 0, d.x); rot(nombre, mid.x + per.x * .55, mid.z + per.z * .55, .8, .38);
        etq[k] = { at: () => mid.clone().setY(.48), txt: nombre };
        return v => bandas(v).forEach((col, i) => bm[i].material.color.setHex(col));
      };
      // condensador de poliéster entre dos puntos
      const cap = (k, a, b, nombre) => {
        const A = V(a[0], Y, a[1]), B = V(b[0], Y, b[1]), d = B.clone().sub(A), L = d.length(); d.normalize();
        const mid = A.clone().addScaledVector(d, L / 2);
        const e0 = mid.clone().addScaledVector(d, -.2).setY(.3), e1 = mid.clone().addScaledVector(d, .2).setY(.3);
        P(ctx.tube([A, A.clone().lerp(e0, .6).setY(.18), e0], .03, m.silver), k); P(ctx.tube([e1, e1.clone().lerp(B, .4).setY(.18), B], .03, m.silver), k);
        const body = P(new T.Mesh(new T.BoxGeometry(.42, .78, .95), M(0xd8a51f, { roughness: .45 })), k); ctx.add(body);
        body.position.copy(mid).setY(.45); body.quaternion.setFromUnitVectors(V(1, 0, 0), d);
        const per = V(-d.z, 0, d.x); rot(nombre, mid.x + per.x * .8, mid.z + per.z * .8, .7, .38);
        etq[k] = { at: () => mid.clone().setY(.85), txt: nombre };
      };
      const gnd = p => { wire('g', [p, [p[0], p[1] + .35]]);
        [[.62, 0], [.42, .16], [.22, .32]].forEach(([w, o]) => P(boxR(p[0] - w / 2, p[0] + w / 2, 0, .1, p[1] + .35 + o, p[1] + .42 + o, M(0xc9cdd2, { metalness: .6, roughness: .35 })), 'masa')); };
      const borne = (p, txt, k) => { P(cyl(.16, .45, M(0xc9a227, { metalness: .8, roughness: .3 }), p[0], .22, p[1], null, 16), 'bornes'); rot(txt, p[0], p[1] + .55, .9, .4, '#ffd166'); };
      // amplificador operacional: triángulo en relieve con sus entradas y la alimentación
      let pin;
      const aop = (ox, arriba) => {
        const sh = new T.Shape([new T.Vector2(-1.1, 1.2), new T.Vector2(-1.1, -1.2), new T.Vector2(1.3, 0)]);
        const g = new T.ExtrudeGeometry(sh, { depth: .62, bevelEnabled: true, bevelThickness: .04, bevelSize: .04, bevelSegments: 2 });
        const tri = P(new T.Mesh(g, M(0x2b2f36, { roughness: .45, metalness: .2 })), 'aop'); tri.rotation.x = -Math.PI / 2; tri.position.set(ox, 0, 0); ctx.add(tri);
        const abajo = arriba === '+' ? '−' : '+';
        UT.rotulo(ctx, arriba, .4, .4, V(ox - .78, .7, -.6), [-Math.PI / 2, 0, 0], { color: '#fff' });
        UT.rotulo(ctx, abajo, .4, .4, V(ox - .78, .7, .6), [-Math.PI / 2, 0, 0], { color: '#fff' });
        UT.rotulo(ctx, 'AO 741', .9, .3, V(ox - .1, .7, 0), [-Math.PI / 2, 0, 0], { color: '#c9cdd2' });
        P(ctx.tube([V(ox + .1, Y, -.6), V(ox + .1, Y, -1.25)], .04, M(0xd62828)), 'alim'); P(ctx.tube([V(ox + .1, Y, .6), V(ox + .1, Y, 1.25)], .04, M(0x2d6cdf)), 'alim');
        rot('+12 V', ox + .1, -1.5, .8, .32, '#ff8a7a'); rot('−12 V', ox + .1, 1.5, .8, .32, '#8fd3ff');
        pin = { a: [ox - 1.1, -.6], b: [ox - 1.1, .6], o: [ox + 1.3, 0], ox };
        etq.aop = { at: () => V(ox + .3, .75, -.2), txt: 'Amplificador operacional' };
        return pin;
      };
      // generador en una entrada
      const gens = {};
      const gen = (k, z, txt) => {
        P(boxR(-7.3, -6.05, 0, .9, z - .45, z + .45, M(0x3a3f47, { roughness: .5 })), 'gen');
        const scr = UT.pantalla(ctx, V(-6.67, .91, z - .05), 1.0, .62, [-Math.PI / 2, 0, 0]);
        P(cyl(.07, .25, m.dark, -6.0, .45, z, null, 12), 'gen').rotation.z = Math.PI / 2;
        wire(k, [[-6.0, z], [-5.6, z]]); borne([-5.6, z], txt, k); gens[k] = scr;
        etq['gen_' + k] = { at: () => V(-6.67, .95, z + .35), txt: 'Generador ' + txt, p: 'gen' };
      };
      // osciloscopio detrás de la placa
      const OSW = 512, OSH = 320, oc = document.createElement('canvas'); oc.width = OSW; oc.height = OSH; const og = oc.getContext('2d');
      const otx = new T.CanvasTexture(oc); otx.encoding = T.sRGBEncoding;
      P(boxR(1.4, 7.4, 0, 4.0, -5.8, -4.5, M(0x4a5058, { roughness: .5 })), 'osc');
      P(boxR(1.4, 7.4, 0, .35, -5.8, -4.5, M(0x2b2f36)), 'osc');
      const pant = P(new T.Mesh(new T.PlaneGeometry(4.6, 2.9), new T.MeshBasicMaterial({ map: otx })), 'osc', true); pant.position.set(4.0, 2.2, -4.49); ctx.add(pant);
      for (let i = 0; i < 4; i++) P(cyl(.13, .12, m.dark, 6.85, 3.3 - i * .7, -4.48, null, 16), 'osc').rotation.x = Math.PI / 2;
      etq.osc = { at: () => V(6.85, 4.0, -4.5), txt: 'Osciloscopio' };
      const sonda = [V(5.6, .3, 0), V(6.6, 1.1, -1.4), V(6.4, 1.0, -3.6), V(6.1, 1.4, -4.5)];
      P(ctx.tube(sonda, .05, M(0x1d1f23, { roughness: .6 })), 'osc');

      // ---- montaje concreto ----
      const R = {}, ramas = [];
      const rama = (pts, k) => { const f = ctx.flow({ color: 0xffc400, size: .075, gap: .3 }); f.path(pts.map(p => V(p[0], .14, p[1]))); ramas.push({ f, k }); };
      const B = { wire, res: (k, a, b, n) => { R[k] = res(k, a, b, n); }, cap, gnd, borne, aop, gen, rama, rot };
      c.lay(B);
      let led = null;
      if (c.led) { led = P(new T.Mesh(new T.SphereGeometry(.22, 20, 14), M(0x444444, { emissive: 0x00ff66, emissiveIntensity: 0, transparent: true, opacity: .9 })), 'led'); led.position.set(4.3, .3, .9); ctx.add(led);
        wire('o', [[4.3, 0], [4.3, .9]]); etq.led = { at: () => V(4.3, .55, .9), txt: 'LED de salida' }; }

      // ---- vista por dentro: qué hace el AO ----
      const D = UT.detalle(ctx, { w: 12.5, h: 7.6, titulo: 'DETALLE A · EL AMPLIFICADOR OPERACIONAL POR DENTRO' }), G = D.g;
      const bloques = D.cadena(['ETAPA DIFERENCIAL', 'GANANCIA × 200 000', 'ETAPA DE SALIDA'], 2.6, -5.6, 5.6);
      const barra = (x, col, nombre) => { const gg = new T.BoxGeometry(1.1, 1, .3); gg.translate(0, .5, 0);
        const b = new T.Mesh(gg, new T.MeshBasicMaterial({ color: col, side: T.DoubleSide })); b.position.set(x, -.9, 0); G.add(b);
        D.etiqueta(x, -3.25, 2.2, .36, { size: .78 })(nombre); const t = D.etiqueta(x, -2.75, 2.4, .36, { size: .72 }); return (v) => { b.scale.y = Math.abs(v) < .01 ? .001 : v / VSAT * 2.0; t(volt(v)); }; };
      D.linea([[-5.6, -.9], [5.6, -.9]], { op: .5 }); D.linea([[-5.6, 1.1], [5.6, 1.1]], { dash: .12, op: .3 });
      D.etiqueta(5.0, 1.3, 2.4, .3, { size: .7 })('+11 V (satura)');
      const bP = barra(-3.8, 0xffd166, 'V+'), bN = barra(-1.3, 0xff8fb0, 'V−'), bO = barra(3.6, 0x8fd3ff, 'Vout');
      const tDif = D.etiqueta(1.15, .5, 3.4, .42, { size: .8 }), tDif2 = D.etiqueta(1.15, .02, 3.4, .32, { size: .66 });
      const tMsg = D.etiqueta(0, 1.75, 11.6, .42, { size: .72 });

      // ---- estado y panel ----
      const $ = s => panel.querySelector(s);
      const st = { th: 0, vi: 0 };
      c.ent.forEach(([k, , tipo, val]) => { st[k] = { tipo: tipo === 'fija' ? 'dc' : tipo, val };
        const s = $('#s_' + k), b = $('#b_' + k);
        const pinta = () => set(b, (st[k].tipo === 'dc' ? '' : 'pico ') + volt(st[k].val));
        s.addEventListener('input', () => { st[k].val = +s.value; pinta(); if (c.reset) centrar(); }); pinta();
        const t = $('#t_' + k); if (t) UT.opciones(t, v => { st[k].tipo = v; set($('#l_' + k), v === 'dc' ? 'Valor' : 'Amplitud'); pinta(); if (c.reset) centrar(); });
      });
      (c.R || []).forEach(([k, , v]) => { st[k] = v; R[k] && R[k](v); if (c.par && c.par[k]) R[c.par[k]] && R[c.par[k]](v);
        $('#r_' + k).addEventListener('change', e => { st[k] = +e.target.value; R[k] && R[k](st[k]); if (c.par && c.par[k]) R[c.par[k]](st[k]); if (c.reset) centrar(); }); });
      if (c.C) { st.c = c.C; $('#c_c').addEventListener('change', e => { st.c = +e.target.value; if (c.reset) centrar(); }); }
      if (c.F) { st.f = c.F; $('#f_f').addEventListener('change', e => { st.f = +e.target.value; if (c.reset) centrar(); }); }
      const entrada = (k, th) => st[k].val * ONDA[st[k].tipo](th);
      // integrador: arranca con el condensador cargado de forma que la onda quede centrada
      function centrar() {
        const k = c.ent[0][0]; if (st[k].tipo === 'dc') { st.vi = 0; return; }
        let v = 0, sum = 0; const N = 400, dt = 1 / st.f / N;
        for (let i = 0; i < N; i++) { v += -entrada(k, i / N * Math.PI * 2) / (st.r1 * st.c) * dt; sum += v; }
        st.vi = -sum / N; st.th = 0;
      }
      if (c.reset) { centrar(); $('#reset').addEventListener('click', () => { st.vi = 0; st.th = 0; if (st[c.ent[0][0]].tipo !== 'dc') centrar(); }); }

      // osciloscopio: historial de muestras
      const NB = 320, hist = c.canales.map(() => new Float32Array(NB)); let hp = 0, acc = 0;
      const dibujaOsc = () => {
        og.fillStyle = '#06140f'; og.fillRect(0, 0, OSW, OSH);
        og.strokeStyle = 'rgba(120,200,160,.18)'; og.lineWidth = 1;
        for (let i = 1; i < 10; i++) { og.beginPath(); og.moveTo(i * OSW / 10, 0); og.lineTo(i * OSW / 10, OSH); og.stroke(); }
        for (let j = 1; j < 8; j++) { og.beginPath(); og.moveTo(0, j * OSH / 8); og.lineTo(OSW, j * OSH / 8); og.stroke(); }
        og.strokeStyle = 'rgba(120,200,160,.45)'; og.beginPath(); og.moveTo(0, OSH / 2); og.lineTo(OSW, OSH / 2); og.stroke();
        const yv = v => OSH / 2 - v / 12 * (OSH / 2);
        og.setLineDash([6, 6]); og.strokeStyle = 'rgba(255,120,120,.5)'; [VSAT, -VSAT].forEach(v => { og.beginPath(); og.moveTo(0, yv(v)); og.lineTo(OSW, yv(v)); og.stroke(); }); og.setLineDash([]);
        c.canales.forEach(([, col], ci) => { og.strokeStyle = col; og.lineWidth = 3; og.beginPath();
          for (let i = 0; i < NB; i++) { const v = hist[ci][(hp + i) % NB], x = i / (NB - 1) * OSW; i ? og.lineTo(x, yv(v)) : og.moveTo(x, yv(v)); } og.stroke(); });
        og.font = '600 20px "IBM Plex Mono", monospace'; og.textBaseline = 'top';
        c.canales.forEach(([nm, col], ci) => { og.fillStyle = col; og.fillText('CH' + (ci + 1) + ' ' + nm, 10 + ci * 150, 8); });
        og.fillStyle = 'rgba(200,230,210,.8)'; og.fillText('3 V/div', OSW - 100, OSH - 28);
        otx.needsUpdate = true;
      };

      const colN = (mat, v, gnd) => { const t = gnd ? 0 : Math.max(-1, Math.min(1, v / VSAT)), base = [.6, .64, .68];
        const tgt = t >= 0 ? [1, .3, .24] : [.24, .55, 1], a = Math.abs(t) ** .7;
        mat.color.setRGB(base[0] + (tgt[0] - base[0]) * a, base[1] + (tgt[1] - base[1]) * a, base[2] + (tgt[2] - base[2]) * a);
        mat.emissive.setRGB(tgt[0] * .35 * a, tgt[1] * .35 * a, tgt[2] * .35 * a); };

      return {
        dentro: D.dentro,
        labels: Object.keys(etq).map(k => ({ p: etq[k].p || k, txt: etq[k].txt, at: etq[k].at })),
        update(dt) {
          // pasos pequeños: el osciloscopio guarda 160 muestras por periodo aunque el navegador vaya lento
          const dth = dt * Math.PI * 2 * FV, ns = Math.max(1, Math.min(60, Math.ceil(dth / (Math.PI * 2 / 160))));
          let v, r;
          for (let j = 0; j < ns; j++) {
            st.th += dth / ns;
            v = {}; c.ent.forEach(([k]) => { v[k] = entrada(k, st.th); v['d' + k] = st[k].val * DONDA[st[k].tipo](st.th) * 2 * Math.PI * (st.f || 1); });
            if (c.reset) st.vi = clip(st.vi - v[c.ent[0][0]] / (st.r1 * st.c) * (dth / ns) / (2 * Math.PI * st.f));
            r = c.calc(st, v);
            acc += dth / ns / (Math.PI * 2) * 160;
            while (acc >= 1) { acc -= 1; c.canales.forEach(([, , key], ci) => { hist[ci][hp] = key === 'o' ? r.vo : v[key]; }); hp = (hp + 1) % NB; }
          }
          const sat = Math.abs(r.vo) >= VSAT - 1e-6;
          // pistas, corrientes y LED
          Object.keys(nudos).forEach(k => colN(nudos[k].mesh ? nudos[k].mesh.material : nudos[k].m, k === 'g' ? 0 : r.n[k] ?? 0, k === 'g'));
          ramas.forEach(({ f, k }) => { const i = r.I[k] || 0, a = Math.abs(i); f.set(a < 2e-7 ? 0 : Math.min(1, .25 + a / 6e-4), 1.3 * Math.sign(i)); });
          if (led) { led.material.emissive.setHex(r.vo > 0 ? 0x00ff66 : 0xff2a2a); led.material.emissiveIntensity = 1.6; led.material.color.setHex(r.vo > 0 ? 0x2a7a4a : 0x7a2a2a); }
          // generadores
          c.ent.forEach(([k]) => gens[k] && gens[k]([NOMBRE[st[k].tipo].toUpperCase(), volt(v[k])]));
          // osciloscopio
          dibujaOsc();
          // panel
          set($('#rIn'), c.ent.map(([k]) => (c.ent.length > 1 ? k.toUpperCase() + ' ' : '') + volt(v[k])).join(' · '));
          set($('#rVp'), volt(r.vp)); set($('#rVn'), volt(r.vn)); set($('#rVo'), volt(r.vo), sat ? 'on' : '');
          set($('#rG'), c.g(st, v, r)); set($('#rI'), r.i == null ? '—' : amp(r.i));
          set($('#msg'), c.msg(st, v, r) + (sat && c.id !== 'aop-comparador' ? ' ⚠ Saturada: la salida no puede pasar de ±11 V porque el AO se alimenta a ±12 V.' : ''));
          // detalle interno
          const dif = c.fb && !sat ? r.vo / A0 : r.vp - r.vn;
          bP(r.vp); bN(r.vn); bO(r.vo);
          tDif('V+ − V− = ' + (Math.abs(dif) < 1e-3 ? fmt(dif * 1e6, 1) + ' µV' : fmt(dif, 2) + ' V'), Math.abs(dif) < 1e-3 ? '#7ef0b0' : '#ffd166');
          tDif2('× 200 000 → Vout = ' + volt(r.vo));
          tMsg(c.fb ? (sat ? 'Saturada: la salida no puede seguir y V+ ya no es igual a V−' : 'Realimentación negativa: Vout se ajusta hasta que V+ ≈ V− (cortocircuito virtual)')
                    : 'Sin realimentación: cualquier diferencia lleva la salida al tope (±Vsat)');
          bloques[0](Math.min(1, Math.abs(dif) * 1e5)); bloques[1](Math.min(1, Math.abs(r.vo) / VSAT + .2)); bloques[2](Math.min(1, Math.abs(r.vo) / VSAT + .2));
          ctx.step(c.paso ? c.paso(st, v, r) : (sat ? 2 : 1));
        }
      };
    };
  }

  // ---------- partes comunes ----------
  const PARTES = {
    aop: { t: 'Amplificador operacional (741)', d: 'Amplifica muchísimo (unas 200 000 veces) la diferencia entre sus dos entradas: Vout = A · (V+ − V−). Por la entrada + y la − casi no entra corriente. Solo puede dar tensiones entre sus alimentaciones.' },
    alim: { t: 'Alimentación ±12 V', d: 'El AO se alimenta con una fuente simétrica: +12 V y −12 V respecto a masa. Su salida queda limitada a unos ±11 V (saturación).' },
    pistas: { t: 'Pistas de cobre', d: 'Unen los componentes. Su color indica la tensión de ese punto: rojo positiva, azul negativa, gris cerca de 0 V.' },
    masa: { t: 'Masa (0 V)', d: 'Punto de referencia del circuito: todas las tensiones se miden respecto a él.' },
    bornes: { t: 'Bornes de entrada y salida', d: 'Puntos donde se conectan las señales: los generadores en las entradas y el osciloscopio en la salida.' },
    gen: { t: 'Generador de funciones', d: 'Da la señal de entrada: continua, senoidal, cuadrada o triangular. En su pantalla se ve el valor de cada instante.' },
    osc: { t: 'Osciloscopio', d: 'Dibuja las tensiones con el paso del tiempo: amarillo la entrada, cian la salida. 3 V por división; las líneas rojas discontinuas marcan la saturación (±11 V).' },
    placa: { t: 'Placa de circuito', d: 'Placa donde está montado el esquema. Los componentes están colocados igual que en el dibujo del esquema.' },
    led: { t: 'LED bicolor de salida', d: 'Verde cuando la salida está en +Vsat, rojo cuando está en −Vsat.' }
  };
  const P2 = (o) => Object.assign({}, PARTES, o);

  // ---------- los ocho montajes ----------
  const CONF = [
    {
      id: 'aop-comparador', nombre: 'Comparador de tensión', resumen: 'Compara dos tensiones: la salida salta a +Vsat o a −Vsat.',
      titulo: 'AO como comparador de tensión',
      lead: 'Sin realimentación, el AO multiplica la diferencia V1 − V2 por 200 000: en cuanto V1 pasa de V2, la salida salta al tope. Cambia la referencia V2 y mira en el osciloscopio dónde conmuta.',
      ent: [['v1', 'Entrada V1 (+)', 'seno', 4], ['v2', 'Referencia V2 (−)', 'dc', 1]], led: true, fb: false,
      canales: [['V1', '#ffd166', 'v1'], ['V2', '#ff8fb0', 'v2'], ['Vout', '#5ee7ff', 'o']],
      gLab: 'Estado', iLab: 'Corriente de entrada',
      lay(B) { const p = B.aop(0, '+'); B.gen('v1', -.6, 'V1'); B.gen('v2', .6, 'V2');
        B.wire('v1', [[-5.6, -.6], p.a]); B.wire('v2', [[-5.6, .6], p.b]); B.wire('o', [p.o, [5.6, 0]]); B.borne([5.6, 0], 'Vout', 'o'); },
      calc(s, v) { const vo = v.v1 > v.v2 ? VSAT : -VSAT; return { n: { v1: v.v1, v2: v.v2, o: vo }, I: {}, vp: v.v1, vn: v.v2, vo, i: 0 }; },
      g: (s, v, r) => r.vo > 0 ? 'V1 > V2 → +Vsat' : 'V1 < V2 → −Vsat',
      msg: (s, v, r) => `V1 = ${volt(v.v1)} ${v.v1 > v.v2 ? '>' : '<'} V2 = ${volt(v.v2)} → la salida está en ${r.vo > 0 ? '+Vsat (+11 V)' : '−Vsat (−11 V)'}.`,
      paso: (s, v, r) => r.vo > 0 ? 1 : 2,
      pasos: [['1. La idea', 'No hay ninguna resistencia de la salida a la entrada: el AO trabaja en lazo abierto, con toda su ganancia.'],
              ['2. V1 > V2', 'La diferencia es positiva y, multiplicada por 200 000, pide mucho más de lo que la alimentación puede dar: la salida se queda en +Vsat.'],
              ['3. V1 < V2', 'La diferencia es negativa: la salida se va a −Vsat. Solo hay dos estados, como un interruptor que decide qué tensión es mayor.']],
      partes: P2({}),
      extra: `<div class="two"><div><h2>Fórmula</h2><p>Vout = +Vsat si V1 &gt; V2<br>Vout = −Vsat si V1 &lt; V2</p><p class="note">Con una señal que oscila cerca de la referencia, el ruido puede hacer que la salida rebote; para evitarlo se usa el comparador con histéresis (disparador Schmitt).</p></div>
        <div><h2>Usos</h2><p>Termostatos y detectores de nivel (encender algo cuando un sensor pasa de un valor), convertir una señal senoidal en cuadrada, detectores de paso por cero.</p></div></div>`
    },
    {
      id: 'aop-no-inversor', nombre: 'Amplificador no inversor', resumen: 'Amplifica sin invertir: Vout = Vin · (1 + R2/R1).',
      titulo: 'AO como amplificador no inversor',
      lead: 'La señal entra por la entrada +. El divisor R2–R1 devuelve a la entrada − una parte de la salida, y el AO ajusta Vout hasta que esa parte iguala a Vin. Cambia R1 y R2 y mira la ganancia.',
      ent: [['v1', 'Entrada Vin', 'seno', 1]], R: [['r1', 'R1', 10000], ['r2', 'R2', 22000]], fb: true,
      canales: [['Vin', '#ffd166', 'v1'], ['Vout', '#5ee7ff', 'o']], iLab: 'Corriente por R1 y R2',
      lay(B) { const p = B.aop(.3, '+'); B.gen('v1', -.6, 'Vin');
        B.wire('v1', [[-5.6, -.6], p.a]); B.wire('n', [p.b, [-1.4, .6], [-1.4, 2.2]]);
        B.res('r1', [-1.4, 2.2], [-4.2, 2.2], 'R1'); B.gnd([-4.2, 2.2]);
        B.res('r2', [-1.4, 2.2], [2.6, 2.2], 'R2'); B.wire('o', [[2.6, 2.2], [2.6, 0]]); B.wire('o', [p.o, [5.6, 0]]); B.borne([5.6, 0], 'Vout', 'o');
        B.rama([[2.6, 0], [2.6, 2.2], [-1.4, 2.2], [-4.2, 2.2], [-4.2, 2.55]], 'i'); },
      calc(s, v) { const vo = clip(v.v1 * (1 + s.r2 / s.r1)), vn = vo * s.r1 / (s.r1 + s.r2), i = vo / (s.r1 + s.r2); return { n: { v1: v.v1, n: vn, o: vo }, I: { i }, vp: v.v1, vn, vo, i }; },
      g: s => '1 + R2/R1 = ' + fmt(1 + s.r2 / s.r1, 2),
      msg: (s, v, r) => `Vout = Vin · (1 + R2/R1) = ${volt(v.v1)} · ${fmt(1 + s.r2 / s.r1, 2)} = ${volt(v.v1 * (1 + s.r2 / s.r1))}. Misma forma y mismo signo que la entrada.`,
      pasos: [['1. Entrada por la +', 'La señal entra por la entrada no inversora. Como por ella no entra corriente, la fuente casi no se carga: impedancia de entrada altísima.'],
              ['2. Amplifica', 'R2 y R1 forman un divisor que lleva a la entrada − una fracción de Vout. El AO sube o baja la salida hasta que esa fracción vale lo mismo que Vin.'],
              ['3. Satura', 'Si Vin · ganancia supera ±11 V, la salida se recorta: el AO no puede dar más que su alimentación.']],
      partes: P2({ r1: { t: 'R1 (a masa)', d: 'Junto con R2 fija la ganancia. Cuanto más pequeña respecto a R2, más amplifica.' }, r2: { t: 'R2 (realimentación)', d: 'Lleva parte de la salida de vuelta a la entrada −. Es la realimentación negativa que estabiliza el amplificador.' } }),
      extra: `<div class="two"><div><h2>Fórmula</h2><p>Vout = Vin · (1 + R2 / R1)</p><p>La ganancia siempre es mayor o igual que 1 y la salida no se invierte.</p></div><div><h2>Usos</h2><p>Preamplificadores de sensores y micrófonos, cuando no se quiere cargar la fuente de señal.</p></div></div>`
    },
    {
      id: 'aop-inversor', nombre: 'Amplificador inversor', resumen: 'Amplifica e invierte: Vout = −Vin · R2/R1.',
      titulo: 'AO como amplificador inversor',
      lead: 'La entrada + está a masa, así que el AO mantiene la entrada − a 0 V (masa virtual). Toda la corriente que entra por R1 sigue por R2 hacia la salida, que queda con el signo cambiado.',
      ent: [['v1', 'Entrada Vin', 'seno', 1]], R: [['r1', 'R1', 10000], ['r2', 'R2', 22000]], fb: true,
      canales: [['Vin', '#ffd166', 'v1'], ['Vout', '#5ee7ff', 'o']], iLab: 'Corriente por R1 y R2',
      lay(B) { const p = B.aop(.5, '−'); B.gen('v1', -.6, 'Vin');
        B.wire('v1', [[-5.6, -.6], [-4.6, -.6]]); B.res('r1', [-4.6, -.6], [-1.4, -.6], 'R1');
        B.wire('n', [[-1.4, -.6], p.a]); B.wire('n', [[-1.4, -.6], [-1.4, -2.3]]); B.res('r2', [-1.4, -2.3], [2.6, -2.3], 'R2');
        B.wire('o', [[2.6, -2.3], [2.6, 0]]); B.wire('o', [p.o, [5.6, 0]]); B.borne([5.6, 0], 'Vout', 'o');
        B.wire('g', [p.b, [-1.4, .6], [-1.4, 1.3]]); B.gnd([-1.4, 1.3]);
        B.rama([[-5.6, -.6], [-1.4, -.6], [-1.4, -2.3], [2.6, -2.3], [2.6, 0], [p.o[0], 0]], 'i'); },
      calc(s, v) { const vo = clip(-s.r2 / s.r1 * v.v1), vn = (v.v1 * s.r2 + vo * s.r1) / (s.r1 + s.r2), i = (v.v1 - vn) / s.r1; return { n: { v1: v.v1, n: vn, o: vo }, I: { i }, vp: 0, vn, vo, i }; },
      g: s => '−R2/R1 = −' + fmt(s.r2 / s.r1, 2),
      msg: (s, v, r) => `Vout = −Vin · R2/R1 = −(${volt(v.v1)}) · ${fmt(s.r2 / s.r1, 2)} = ${volt(-v.v1 * s.r2 / s.r1)}. Cuando la entrada sube, la salida baja.`,
      pasos: [['1. Masa virtual', 'La entrada + está a masa. Con realimentación negativa, el AO hace que la entrada − también esté a 0 V, aunque no esté conectada a masa.'],
              ['2. La corriente sigue por R2', 'La corriente Vin/R1 no puede entrar en el AO, así que sigue por R2 hasta la salida. Para eso la salida tiene que estar a −Vin · R2/R1.'],
              ['3. Satura', 'Si la ganancia pide más de ±11 V, la salida se recorta en la saturación.']],
      partes: P2({ r1: { t: 'R1 (entrada)', d: 'Convierte la tensión de entrada en corriente: I = Vin / R1. También fija la impedancia de entrada del montaje.' }, r2: { t: 'R2 (realimentación)', d: 'La misma corriente pasa por ella y crea la tensión de salida: Vout = −I · R2.' } }),
      extra: `<div class="two"><div><h2>Fórmula</h2><p>Vout = −Vin · R2 / R1</p><p>El signo menos indica que la salida está invertida (desfasada 180°).</p></div><div><h2>Usos</h2><p>Amplificadores de audio y de señal, cambio de signo de una tensión (con R1 = R2), base del sumador.</p></div></div>`
    },
    {
      id: 'aop-seguidor', nombre: 'Seguidor de tensión', resumen: 'Copia la tensión de entrada: Vout = Vin, pero da corriente.',
      titulo: 'AO como seguidor de tensión (buffer)',
      lead: 'La salida va directa a la entrada −: el AO hace que Vout sea igual que Vin. No amplifica la tensión, pero la corriente de la carga la pone el AO y no el generador.',
      ent: [['v1', 'Entrada Vin', 'seno', 3]], R: [['rl', 'Carga RL', 1000]], fb: true,
      canales: [['Vin', '#ffd166', 'v1'], ['Vout', '#5ee7ff', 'o']], gLab: 'Ganancia', iLab: 'Corriente en la carga',
      lay(B) { const p = B.aop(.5, '+'); B.gen('v1', -.6, 'Vin');
        B.wire('v1', [[-5.6, -.6], p.a]); B.wire('o', [p.b, [-1.4, .6], [-1.4, 1.9], [2.6, 1.9], [2.6, 0]]); B.wire('o', [p.o, [5.6, 0]]); B.borne([5.6, 0], 'Vout', 'o');
        B.res('rl', [4.2, 0], [4.2, 2.6], 'RL'); B.gnd([4.2, 2.6]);
        B.rama([[p.o[0], 0], [4.2, 0], [4.2, 2.95]], 'i'); },
      calc(s, v) { const vo = clip(v.v1); return { n: { v1: v.v1, o: vo }, I: { i: vo / s.rl }, vp: v.v1, vn: vo, vo, i: vo / s.rl }; },
      g: () => '1 (Vout = Vin)',
      msg: (s, v, r) => `Vout = Vin = ${volt(r.vo)}. La carga RL toma ${amp(r.i)} y los da el AO: del generador no sale corriente.`,
      pasos: [['1. Realimentación total', 'Toda la salida vuelve a la entrada −. El AO se ajusta hasta que Vout = Vin.'],
              ['2. Aislar', 'El generador no da corriente (impedancia de entrada altísima); la de la carga sale del AO. Por eso se usa para que un sensor débil no se cargue.'],
              ['3. Límite', 'Si Vin pasa de ±11 V, la salida ya no puede seguirla.']],
      partes: P2({ rl: { t: 'Resistencia de carga RL', d: 'Representa lo que se conecta a la salida. Su corriente la da el AO, no la fuente de señal.' } }),
      extra: `<div class="two"><div><h2>Fórmula</h2><p>Vout = Vin (ganancia 1)</p></div><div><h2>Usos</h2><p>Adaptador de impedancias (buffer): conectar un sensor o un divisor de tensión a una carga sin que su tensión baje.</p></div></div>`
    },
    {
      id: 'aop-sumador', nombre: 'Sumador inversor', resumen: 'Suma varias tensiones (invertidas): Vout = −Rf · (V1/R1 + V2/R2).',
      titulo: 'AO como sumador inversor',
      lead: 'Cada entrada manda su corriente a la masa virtual y todas juntas siguen por Rf. Así la salida es la suma de las entradas, cada una con su peso Rf/R. Prueba una senoidal en V1 y una continua en V2.',
      ent: [['v1', 'Entrada V1', 'seno', 2], ['v2', 'Entrada V2', 'dc', 1]], R: [['r1', 'R1', 10000], ['r2', 'R2', 10000], ['rf', 'Rf', 10000]], fb: true,
      canales: [['V1', '#ffd166', 'v1'], ['V2', '#ff8fb0', 'v2'], ['Vout', '#5ee7ff', 'o']], gLab: 'Pesos Rf/R1 · Rf/R2', iLab: 'Corriente por Rf',
      lay(B) { const p = B.aop(.5, '−'); B.gen('v1', -1.4, 'V1'); B.gen('v2', -.05, 'V2');
        B.wire('v1', [[-5.6, -1.4], [-4.4, -1.4]]); B.res('r1', [-4.4, -1.4], [-1.6, -1.4], 'R1');
        B.wire('v2', [[-5.6, -.05], [-4.4, -.05]]); B.res('r2', [-4.4, -.05], [-1.6, -.05], 'R2');
        B.wire('n', [[-1.6, -2.6], [-1.6, -.05]]); B.wire('n', [[-1.6, -.6], p.a]);
        B.res('rf', [-1.6, -2.6], [2.6, -2.6], 'Rf'); B.wire('o', [[2.6, -2.6], [2.6, 0]]); B.wire('o', [p.o, [5.6, 0]]); B.borne([5.6, 0], 'Vout', 'o');
        B.wire('g', [p.b, [-.9, .6], [-.9, 1.4]]); B.gnd([-.9, 1.4]);
        B.rama([[-5.6, -1.4], [-1.6, -1.4]], 'i1'); B.rama([[-5.6, -.05], [-1.6, -.05]], 'i2'); B.rama([[-1.6, -1.4], [-1.6, -2.6], [2.6, -2.6], [2.6, 0], [p.o[0], 0]], 'i'); },
      calc(s, v) { const vo = clip(-s.rf * (v.v1 / s.r1 + v.v2 / s.r2)), G = 1 / s.r1 + 1 / s.r2 + 1 / s.rf, vn = (v.v1 / s.r1 + v.v2 / s.r2 + vo / s.rf) / G;
        const i1 = (v.v1 - vn) / s.r1, i2 = (v.v2 - vn) / s.r2; return { n: { v1: v.v1, v2: v.v2, n: vn, o: vo }, I: { i1, i2, i: i1 + i2 }, vp: 0, vn, vo, i: i1 + i2 }; },
      g: s => fmt(s.rf / s.r1, 2) + ' · ' + fmt(s.rf / s.r2, 2),
      msg: (s, v, r) => `Vout = −Rf · (V1/R1 + V2/R2) = −(${fmt(s.rf / s.r1, 2)} · ${volt(v.v1)} + ${fmt(s.rf / s.r2, 2)} · ${volt(v.v2)}) = ${volt(-s.rf * (v.v1 / s.r1 + v.v2 / s.r2))}.`,
      pasos: [['1. Masa virtual', 'Igual que en el inversor, la entrada − se mantiene a 0 V. Cada entrada da una corriente V/R que no depende de las demás.'],
              ['2. Se suman las corrientes', 'Las corrientes de todas las entradas se juntan en el nudo y siguen por Rf: la salida es la suma, con el signo cambiado.'],
              ['3. Pesos', 'Si todas las resistencias son iguales, Vout = −(V1 + V2). Con resistencias distintas cada entrada pesa más o menos (mezclador de audio).']],
      partes: P2({ r1: { t: 'R1', d: 'Resistencia de la entrada V1: su corriente es V1/R1.' }, r2: { t: 'R2', d: 'Resistencia de la entrada V2: su corriente es V2/R2.' }, rf: { t: 'Rf (realimentación)', d: 'Por ella pasa la suma de las corrientes de entrada; fija cuánto pesa cada una.' } }),
      extra: `<div class="two"><div><h2>Fórmula</h2><p>Vout = −Rf · (V1/R1 + V2/R2 + … + Vn/Rn)</p><p>Con R1 = R2 = Rf: Vout = −(V1 + V2).</p></div><div><h2>Usos</h2><p>Mezcladores de audio, sumar un nivel de continua (offset) a una señal, convertidores digital-analógico.</p></div></div>`
    },
    {
      id: 'aop-diferencial', nombre: 'Amplificador diferencial', resumen: 'Amplifica la resta: Vout = (R2/R1) · (V2 − V1).',
      titulo: 'AO como amplificador diferencial (restador)',
      lead: 'V1 entra por el lado inversor y V2 por el no inversor. Con R1 = R3 y R2 = R4 la salida solo depende de la diferencia V2 − V1: lo que tienen en común las dos entradas se cancela.',
      ent: [['v1', 'Entrada V1 (lado −)', 'dc', 1], ['v2', 'Entrada V2 (lado +)', 'seno', 2]], R: [['r1', 'R1 = R3', 10000], ['r2', 'R2 = R4', 22000]], par: { r1: 'r3', r2: 'r4' }, fb: true,
      canales: [['V1', '#ff8fb0', 'v1'], ['V2', '#ffd166', 'v2'], ['Vout', '#5ee7ff', 'o']], iLab: 'Corriente por R1',
      lay(B) { const p = B.aop(.5, '−'); B.gen('v1', -.6, 'V1'); B.gen('v2', 1.4, 'V2');
        B.wire('v1', [[-5.6, -.6], [-4.4, -.6]]); B.res('r1', [-4.4, -.6], [-1.6, -.6], 'R1'); B.wire('n', [[-1.6, -.6], p.a]); B.wire('n', [[-1.6, -.6], [-1.6, -2.3]]);
        B.res('r2', [-1.6, -2.3], [2.6, -2.3], 'R2'); B.wire('o', [[2.6, -2.3], [2.6, 0]]); B.wire('o', [p.o, [5.6, 0]]); B.borne([5.6, 0], 'Vout', 'o');
        B.wire('v2', [[-5.6, 1.4], [-4.4, 1.4]]); B.res('r3', [-4.4, 1.4], [-1.6, 1.4], 'R3'); B.wire('p', [[-1.6, 1.4], [-1.6, .6], p.b]);
        B.res('r4', [-1.6, 1.4], [-1.6, 3.3], 'R4'); B.gnd([-1.6, 3.3]);
        B.rama([[-5.6, -.6], [-1.6, -.6], [-1.6, -2.3], [2.6, -2.3], [2.6, 0], [p.o[0], 0]], 'i1'); B.rama([[-5.6, 1.4], [-1.6, 1.4], [-1.6, 3.65]], 'i2'); },
      calc(s, v) { const vp = v.v2 * s.r2 / (s.r1 + s.r2), vo = clip(s.r2 / s.r1 * (v.v2 - v.v1)), vn = Math.abs(vo) >= VSAT ? (v.v1 * s.r2 + vo * s.r1) / (s.r1 + s.r2) : vp;
        const i1 = (v.v1 - vn) / s.r1; return { n: { v1: v.v1, v2: v.v2, n: vn, p: vp, o: vo }, I: { i1, i2: v.v2 / (s.r1 + s.r2) }, vp, vn, vo, i: i1 }; },
      g: s => 'R2/R1 = ' + fmt(s.r2 / s.r1, 2),
      msg: (s, v, r) => `Vout = (R2/R1) · (V2 − V1) = ${fmt(s.r2 / s.r1, 2)} · (${volt(v.v2)} − ${volt(v.v1)}) = ${volt(s.r2 / s.r1 * (v.v2 - v.v1))}.`,
      pasos: [['1. Dos caminos', 'V2 llega a la entrada + a través del divisor R3–R4. V1 llega a la entrada − por R1, con R2 de realimentación.'],
              ['2. Resta', 'Con las resistencias emparejadas (R1 = R3, R2 = R4), el efecto de V1 y el de V2 tienen la misma ganancia y signo contrario: se restan.'],
              ['3. Modo común', 'Si V1 y V2 suben a la vez lo mismo, la salida no cambia. Por eso se usa para medir señales pequeñas con ruido común, como la de un puente de Wheatstone.']],
      partes: P2({ r1: { t: 'R1', d: 'Resistencia de la entrada V1 (lado inversor). Igual que R3.' }, r2: { t: 'R2 (realimentación)', d: 'Fija la ganancia R2/R1. Igual que R4.' }, r3: { t: 'R3', d: 'Junto con R4 forma un divisor para V2 hacia la entrada +. Igual que R1.' }, r4: { t: 'R4', d: 'Lleva la entrada + a masa a través del divisor. Igual que R2.' } }),
      extra: `<div class="two"><div><h2>Fórmula</h2><p>Vout = (1 + R2/R1) · R4/(R3+R4) · V2 − (R2/R1) · V1</p><p>Si R1 = R3 y R2 = R4: Vout = (R2/R1) · (V2 − V1).</p></div><div><h2>Usos</h2><p>Medir la salida de un puente de Wheatstone (galgas, Pt100), sensores de corriente con resistencia shunt, eliminar ruido común.</p></div></div>`
    },
    {
      id: 'aop-derivador', nombre: 'Derivador', resumen: 'La salida es proporcional a lo rápido que cambia la entrada.',
      titulo: 'AO como derivador',
      lead: 'Por un condensador solo pasa corriente cuando su tensión cambia (I = C · dV/dt). Esa corriente sigue por R y da la salida: con una triangular sale una cuadrada; con una senoidal, una coseno invertida. Cambia la forma de onda y la frecuencia.',
      ent: [['v1', 'Entrada Vin', 'tri', 1]], R: [['r1', 'R', 10000]], C: 100e-9, F: 500, fb: true,
      canales: [['Vin', '#ffd166', 'v1'], ['Vout', '#5ee7ff', 'o']], gLab: 'Constante R · C', iLab: 'Corriente por C y R',
      lay(B) { const p = B.aop(.5, '−'); B.gen('v1', -.6, 'Vin');
        B.wire('v1', [[-5.6, -.6], [-4.6, -.6]]); B.cap('c', [-4.6, -.6], [-1.4, -.6], 'C');
        B.wire('n', [[-1.4, -.6], p.a]); B.wire('n', [[-1.4, -.6], [-1.4, -2.3]]); B.res('r1', [-1.4, -2.3], [2.6, -2.3], 'R');
        B.wire('o', [[2.6, -2.3], [2.6, 0]]); B.wire('o', [p.o, [5.6, 0]]); B.borne([5.6, 0], 'Vout', 'o');
        B.wire('g', [p.b, [-1.4, .6], [-1.4, 1.3]]); B.gnd([-1.4, 1.3]);
        B.rama([[-5.6, -.6], [-1.4, -.6], [-1.4, -2.3], [2.6, -2.3], [2.6, 0], [p.o[0], 0]], 'i'); },
      calc(s, v) { const i = s.c * v.dv1, vo = clip(-s.r1 * i); return { n: { v1: v.v1, n: 0, o: vo }, I: { i }, vp: 0, vn: Math.abs(vo) >= VSAT ? (v.v1) * .02 : 0, vo, i }; },
      g: s => 'R·C = ' + fmt(s.r1 * s.c * 1000, 3) + ' ms',
      msg: (s, v, r) => `Vout = −R · C · dVin/dt = −${fmt(s.r1 * s.c * 1000, 3)} ms · ${fmt(v.dv1, 0)} V/s = ${volt(-s.r1 * s.c * v.dv1)}. ${s.v1.tipo === 'dc' ? 'Con continua la entrada no cambia: no pasa corriente y la salida es 0.' : ''}`,
      pasos: [['1. El condensador', 'Solo deja pasar corriente mientras la tensión de entrada está cambiando: I = C · dVin/dt.'],
              ['2. Derivada', 'Esa corriente pasa por R y da Vout = −R · C · dVin/dt. Si la entrada sube a ritmo constante (rampa), la salida es constante.'],
              ['3. Frecuencia', 'Cuanto más alta la frecuencia, más rápido cambia la entrada y mayor es la salida: el derivador amplifica las altas frecuencias (y el ruido).']],
      partes: P2({ c: { t: 'Condensador C (entrada)', d: 'Solo conduce mientras la tensión cambia. Bloquea la continua.' }, r1: { t: 'R (realimentación)', d: 'Convierte en tensión la corriente que pasa por el condensador.' } }),
      extra: `<div class="two"><div><h2>Fórmula</h2><p>Vout = −R · C · dVin/dt</p><p>Triangular → cuadrada · Senoidal → coseno invertida · Cuadrada → picos en cada flanco.</p></div><div><h2>Usos</h2><p>Detectar cambios bruscos (flancos), la parte D de un regulador PID. En la práctica se añade una resistencia en serie con C para limitar el ruido.</p></div></div>`
    },
    {
      id: 'aop-integrador', nombre: 'Integrador', resumen: 'La salida acumula la entrada con el tiempo: cuadrada → triangular.',
      titulo: 'AO como integrador',
      lead: 'La corriente Vin/R carga el condensador de realimentación y la salida va acumulando: con entrada constante, la salida es una rampa. Con una cuadrada sale una triangular. Prueba con continua y mira cómo acaba saturando.',
      ent: [['v1', 'Entrada Vin', 'cuad', 1]], R: [['r1', 'R', 10000]], C: 100e-9, F: 500, fb: true, reset: true,
      canales: [['Vin', '#ffd166', 'v1'], ['Vout', '#5ee7ff', 'o']], gLab: 'Constante R · C', iLab: 'Corriente por R y C',
      lay(B) { const p = B.aop(.5, '−'); B.gen('v1', -.6, 'Vin');
        B.wire('v1', [[-5.6, -.6], [-4.6, -.6]]); B.res('r1', [-4.6, -.6], [-1.4, -.6], 'R');
        B.wire('n', [[-1.4, -.6], p.a]); B.wire('n', [[-1.4, -.6], [-1.4, -2.3]]); B.cap('c', [-1.4, -2.3], [2.6, -2.3], 'C');
        B.wire('o', [[2.6, -2.3], [2.6, 0]]); B.wire('o', [p.o, [5.6, 0]]); B.borne([5.6, 0], 'Vout', 'o');
        B.wire('g', [p.b, [-1.4, .6], [-1.4, 1.3]]); B.gnd([-1.4, 1.3]);
        B.rama([[-5.6, -.6], [-1.4, -.6], [-1.4, -2.3], [2.6, -2.3], [2.6, 0], [p.o[0], 0]], 'i'); },
      calc(s, v) { const vo = s.vi, sat = Math.abs(vo) >= VSAT - 1e-6, i = sat ? 0 : v.v1 / s.r1; return { n: { v1: v.v1, n: sat ? v.v1 * .3 : 0, o: vo }, I: { i }, vp: 0, vn: sat ? v.v1 * .3 : 0, vo, i }; },
      g: s => 'R·C = ' + fmt(s.r1 * s.c * 1000, 3) + ' ms',
      msg: (s, v, r) => s.v1.tipo === 'dc'
        ? `Con continua la salida baja (o sube) a ritmo constante: ${fmt(Math.abs(v.v1) / (s.r1 * s.c), 0)} V/s, hasta saturar. Pulsa «Descargar el condensador» para empezar de nuevo.`
        : `Vout = −1/(R·C) · ∫ Vin dt. La salida cambia a ${fmt(Math.abs(v.v1) / (s.r1 * s.c), 0)} V/s mientras Vin = ${volt(v.v1)}.`,
      pasos: [['1. Corriente constante', 'La entrada − está a 0 V (masa virtual), así que por R pasa I = Vin/R, que no puede entrar al AO y va al condensador.'],
              ['2. El condensador acumula', 'La carga se va sumando con el tiempo: la salida es la integral de la entrada, con el signo cambiado. Cuadrada → triangular.'],
              ['3. Satura', 'Con continua, la salida no para de crecer hasta llegar a ±11 V. En la práctica se pone una resistencia grande en paralelo con C para evitarlo.']],
      partes: P2({ r1: { t: 'R (entrada)', d: 'Convierte la tensión de entrada en una corriente I = Vin / R.' }, c: { t: 'Condensador C (realimentación)', d: 'Acumula la carga que le llega: su tensión es la integral de la corriente. Por eso Vout es la integral de Vin.' } }),
      extra: `<div class="two"><div><h2>Fórmula</h2><p>Vout = −(1 / R·C) · ∫ Vin dt</p><p>Cuadrada → triangular · Senoidal → coseno · Continua → rampa hasta saturar.</p></div><div><h2>Usos</h2><p>Generadores de rampas y de ondas triangulares, la parte I de un regulador PID, filtros paso bajo.</p></div></div>`
    }
  ];

  CONF.forEach(c => {
    window.COMPONENTES.push({
      id: c.id, nombre: c.nombre, categoria: 'Amplificadores operacionales', grupo: 'Amp. operacional', resumen: c.resumen, titulo: c.titulo,
      lead: c.lead + ' Con «Ver por dentro» verás la diferencia diminuta entre sus entradas.',
      camara: { pos: [0, 14.2, 14.6], tgt: [0, .2, -1.6] }, suelo: -.19,
      panel: panelDe(c), build: hacerBuild(c),
      leyenda: [['#ffc400', 'Corriente (sentido convencional)'], ['#ff6b5a', 'Pista a tensión positiva'], ['#5aa2ff', 'Pista a tensión negativa']],
      pasos: c.pasos, partes: c.partes, extra: c.extra
    });
  });
})();
