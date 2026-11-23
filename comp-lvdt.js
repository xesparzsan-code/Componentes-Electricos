// Componente: LVDT (transformador diferencial de variación lineal) midiendo la posición de una pieza
(() => {
  const { set, fmt } = UT;
  const V0 = 4, PMAX = 12;   // tensión de cada secundario en el centro ×2, recorrido máximo (mm)

  const PANEL = `
    <label class="sp"><span>Posición de la pieza</span><input type="range" id="pos" min="-12" max="12" step="0.5" value="0"><b id="posV">0,0 mm</b></label>
    <div class="row"><button class="sm" data-u="-10">−10 mm</button><button class="sm" data-u="0">Centro</button><button class="sm" data-u="10">+10 mm</button><button class="sm" id="auto" aria-pressed="false">Mover sola</button></div>
    <p class="msg" id="msg" hidden></p>
    ${UT.dl([['rP', 'Desplazamiento del núcleo', ''], ['rS1', 'Tensión en S1', ''], ['rS2', 'Tensión en S2', ''], ['rO', 'Salida Vs = VS1 − VS2', ''], ['rF', 'Fase respecto al primario', '']])}
    <svg class="sch" viewBox="0 0 300 130" aria-label="Señales del primario y de la salida, y gráfica de la salida frente a la posición">
      <text x="2" y="12">Primario</text><text x="2" y="72">Salida</text>
      <line x1="2" y1="38" x2="140" y2="38" class="thin"/><line x1="2" y1="100" x2="140" y2="100" class="thin"/>
      <path id="wP" class="curva" style="stroke:#2f8cff" d=""/><path id="wO" class="curva" style="stroke:#ff5a1f" d=""/>
      <line x1="160" y1="66" x2="296" y2="66" class="thin"/><line x1="228" y1="8" x2="228" y2="124" class="thin"/>
      <line x1="164" y1="14" x2="292" y2="118" class="curva" style="stroke:#ff5a1f"/><path d="M164 14 L228 66 L292 14" class="lnk"/>
      <text x="160" y="128">−12 mm</text><text x="262" y="128">+12</text><text x="232" y="16">Vs</text>
      <circle id="pto" cx="228" cy="66" r="4.5" class="fill"/>
    </svg>
    <p class="nota-sch">Gráfica: la línea es la salida con su fase (signo); la discontinua, solo la amplitud que mediría un voltímetro.</p>
    <div class="chk"><label><input type="checkbox" id="cF" checked> Ver el flujo hacia cada secundario</label></div>`;

  function build(ctx, panel) {
    const { T, V, scene, M, boxR, cyl, tube, curva, part: P } = ctx;
    const m = UT.mats(ctx), H = Math.PI / 2;
    const ejeX = o => { o.rotation.z = Math.PI / 2; return o; };
    const sec = (r0, r1, len, x, mat, id) => { const s = P(ctx.add(new T.Mesh(UT.sector(r0, r1, -H, H, len), mat)), id); s.position.x = x; return s; };
    const Y = 2;
    const grp = new T.Group(); grp.position.y = Y; scene.add(grp);
    const addG = (mesh) => { grp.add(mesh); return mesh; };

    P(boxR(-7, 8.6, -.3, 0, -2.2, 2.2, M(0x6b737b, { metalness: .4, roughness: .5 })), 'base');
    for (const x of [-3.0, 3.0]) P(boxR(x - .3, x + .3, 0, Y - 1.2, -.8, .8, m.plastic), 'base');
    // carcasa (mitad trasera) y tapa transparente
    addG(sec(1.12, 1.25, 6.8, 0, M(0xaab1b9, { metalness: .7, roughness: .3 }), 'carcasa'));
    { const g = ejeX(P(new T.Mesh(new T.CylinderGeometry(1.25, 1.25, 6.8, 40, 1, true), new T.MeshPhysicalMaterial({ color: 0xd9e8f5, transparent: true, opacity: .12, depthWrite: false, side: T.DoubleSide })), 'carcasa', true));
      g.renderOrder = 2; grp.add(g); }
    addG(sec(.42, .5, 6.6, 0, m.card, 'carrete'));
    const pri = addG(sec(.5, 1.0, 1.55, 0, m.wind, 'primario'));
    const s1 = addG(sec(.5, 1.0, 1.75, -1.95, m.wind2, 's1')), s2 = addG(sec(.5, 1.0, 1.75, 1.95, m.wind2, 's2'));
    for (const x of [-2.95, -.88, .88, 2.95]) addG(sec(.45, 1.08, .1, x, m.dark, 'carrete'));
    UT.rotulo(ctx, 'S1', .5, .3, V(-1.95, Y + 1.03, -.2), [-H, 0, 0], { color: '#fff' });
    UT.rotulo(ctx, 'P', .4, .3, V(0, Y + 1.03, -.2), [-H, 0, 0], { color: '#fff' });
    UT.rotulo(ctx, 'S2', .5, .3, V(1.95, Y + 1.03, -.2), [-H, 0, 0], { color: '#fff' });

    // núcleo móvil con vástago y palpador
    const nuc = new T.Group(); nuc.position.y = Y; scene.add(nuc);
    ejeX(P(cyl(.3, 2.4, M(0x6a6f75, { metalness: .6, roughness: .4 }), 0, 0, 0, nuc, 24), 'nucleo'));
    ejeX(P(cyl(.09, 4.6, m.steel, 3.5, 0, 0, nuc, 12), 'vastago'));
    P(ctx.add(new T.Mesh(new T.SphereGeometry(.2, 16, 12), m.steel), nuc), 'vastago').position.x = 5.85;
    const pieza = new T.Group(); scene.add(pieza);
    P(boxR(0, 1.6, 0, 3.6, -1.2, 1.2, M(0x3b6ea5, { roughness: .5 }), pieza), 'pieza');
    P(boxR(4.6, 8.4, 0, .15, -.4, .4, m.steel), 'base');

    // conexiones y acondicionador
    P(boxR(-6.8, -4.6, 0, 2.2, -1.2, 1.2, m.dark), 'acond');
    UT.rotulo(ctx, [['ACONDICIONADOR', 40], ['excitación + demodulador', 30]], 2.0, .8, V(-5.7, 1.3, 1.21), [0, 0, 0], { color: '#e9e8e3' });
    const cab = [V(-3.4, Y, 0), V(-4.0, Y + .2, 0), V(-4.6, 1.6, 0)];
    P(tube(cab, .12, M(0x3a3e45, { roughness: .6 })), 'cables');

    // flujo alterno: del primario hacia cada secundario a través del núcleo
    const lazo = (x0, x1, z) => [V(x0, Y + .25, z), V(x1, Y + .25, z), V(x1, Y + 1.1, z), V(x0, Y + 1.1, z), V(x0, Y + .25, z)];
    const f1 = ctx.flow({ color: 0x2f8cff, size: .06, gap: .2 }).path(lazo(0, -2.6, .15)), f2 = ctx.flow({ color: 0x2f8cff, size: .06, gap: .2 }).path(lazo(0, 2.6, .15));

    // ---- vista por dentro: corte longitudinal ampliado ----
    const D = UT.detalle(ctx, { w: 13.5, h: 8.6, titulo: 'DETALLE A · CORTE LONGITUDINAL DEL LVDT · ESCALA 2:1' }), G = D.g, S = 1.7;
    const espT = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
      g.fillStyle = '#3a2a1a'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(32, 32, 27, 0, 7); g.fill();
      g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(38, 38, 14, 0, 7); g.fill(); const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.encoding = T.sRGBEncoding; return t; })();
    const bob = (xa, xb, col, id) => { const out = [];
      for (const sg of [1, -1]) { const t = espT.clone(); t.needsUpdate = true; t.repeat.set(Math.round((xb - xa) / .3), 3);
        out.push(P(boxR(xa, xb, sg > 0 ? .85 : -1.75, sg > 0 ? 1.75 : -.85, -.35, .35, M(col, { map: t, roughness: .5, emissive: 0xffa040, emissiveIntensity: 0 }), G), id)); }
      return out; };
    const bP = bob(-.78 * S, .78 * S, 0xe08a3c, 'primario'), b1 = bob(-2.83 * S, -1.08 * S, 0xd9b24a, 's1'), b2 = bob(1.08 * S, 2.83 * S, 0xd9b24a, 's2');
    for (const sg of [1, -1]) { P(boxR(-5.6, 5.6, sg * 1.95, sg * 2.15, -.4, .4, M(0xaab1b9, { metalness: .7, roughness: .35 }), G), 'carcasa');
      P(boxR(-5.1, 5.1, sg * .72, sg * .84, -.36, .36, m.card, G), 'carrete'); }
    for (const x of [-2.95, -.88, .88, 2.95]) for (const sg of [1, -1]) P(boxR(x * S - .06, x * S + .06, sg * .72, sg * 1.85, -.37, .37, m.dark, G), 'carrete');
    const nucD = new T.Group(); G.add(nucD);
    P(boxR(-1.2 * S, 1.2 * S, -.5, .5, -.32, .32, M(0x6a6f75, { metalness: .6, roughness: .4 }), nucD), 'nucleo');
    P(boxR(1.2 * S, 6.4, -.14, .14, -.14, .14, m.steel, nucD), 'vastago');
    const rot = (txt, x, y) => D.etiqueta(x, y, .9, .42, { size: .8, z: .6, bg: 'rgba(8,36,72,.9)' })(txt);
    rot('S1', -1.955 * S, 1.3); rot('P', 0, 1.3); rot('S2', 1.955 * S, 1.3);
    // dos lazos de flujo por lado: dentro del núcleo, salen por su extremo y vuelven por la carcasa
    const lazos = [];
    for (const lado of [-1, 1]) for (let k = 0; k < 2; k++) for (const sg of [1, -1]) lazos.push({ lado, k, sg, t: D.traza(40, { color: 0x8fd3ff, op: .6 }), f: ctx.flow({ color: 0x2f8cff, size: .065, gap: .22 }) });
    const lazoPts = (lado, k, sg, xe) => { const yi = .12 + .22 * k, yo = 1.88 - .08 * k, out = [];
      out.push([0, sg * yi], [xe - lado * .05, sg * yi]);
      for (let i = 1; i < 12; i++) { const a = Math.PI / 2 * i / 12; out.push([xe + lado * Math.sin(a) * .45, sg * (yi + (yo - yi) * (1 - Math.cos(a)))]); }
      out.push([xe + lado * .45, sg * yo], [0, sg * yo], [0, sg * yi]); return out; };
    const tr = [D.traza(120, { color: 0xffd166 }), D.traza(120, { color: 0xffd166 }), D.traza(160, { color: 0x7ef0b0 })];
    D.linea([[-2.83 * S, 3.15], [-1.08 * S, 3.15]], { op: .3 }); D.linea([[1.08 * S, 3.15], [2.83 * S, 3.15]], { op: .3 }); D.linea([[-4.8, -3.25], [4.8, -3.25]], { op: .3 });
    const tS1 = D.etiqueta(-1.955 * S, 2.45, 3.4, .38, { size: .75 }), tS2 = D.etiqueta(1.955 * S, 2.45, 3.4, .38, { size: .75 });
    const tO = D.etiqueta(0, -3.85, 9, .4, { size: .75 }), cotaX = D.cota(-2.45), tX = D.etiqueta(0, -2.45, 2.4, .36, { size: .7 });
    const det = (vs1, vs2, vo, sg, ph) => {
      const xc = pos / 10 * S; nucD.position.x = xc;
      const xl = Math.max(-5.0, xc - 1.2 * S), xr = Math.min(5.0, xc + 1.2 * S), ver = cF.checked;
      lazos.forEach(L => { const pts = lazoPts(L.lado, L.k, L.sg, L.lado < 0 ? xl : xr), v = (L.lado < 0 ? vs1 : vs2) / V0;
        L.t.set((u, i) => pts[Math.min(i, pts.length - 1)]); L.t.l.visible = ver; L.t.l.material.opacity = .15 + .6 * v;
        L.f.path(pts.map(p => D.W(p[0], p[1], .45))).set(ver ? v * 1.4 : 0, 1.3 * sg * -L.lado); });
      const a = Math.abs(sg);
      bP.forEach(b => b.material.emissiveIntensity = .25 * a); b1.forEach(b => b.material.emissiveIntensity = .5 * a * vs1 / V0); b2.forEach(b => b.material.emissiveIntensity = .5 * a * vs2 / V0);
      const onda = (u, A) => Math.sin(u * Math.PI * 6 - ph) * A;
      tr[0].set(u => [-2.83 * S + u * 1.75 * S, 3.15 + onda(u, .55 * vs1 / V0)]);
      tr[1].set(u => [1.08 * S + u * 1.75 * S, 3.15 + onda(u, .55 * vs2 / V0)]);
      tr[2].set(u => [-4.8 + u * 9.6, -3.25 + onda(u * 1.6, .55 * vo / V0)]);
      tS1('S1 · ' + fmt(vs1, 2) + ' V'); tS2('S2 · ' + fmt(vs2, 2) + ' V');
      tO('SALIDA = S1 − S2 = ' + fmt(Math.abs(vo), 2) + ' V' + (Math.abs(pos) < .3 ? ' (se anulan)' : vo > 0 ? ' · fase 0°' : ' · fase 180°'), Math.abs(vo) > .05 ? '#7ef0b0' : '#eaf2ff');
      cotaX(0, xc); tX('x = ' + (pos > 0 ? '+' : '') + fmt(pos, 1) + ' mm'); tX.mesh.position.x = Math.abs(xc) > 2.6 ? xc / 2 : xc + (xc >= 0 ? 1.6 : -1.6);
    };

    const $ = s => panel.querySelector(s);
    const posI = $('#pos'), posV = $('#posV'), msg = $('#msg'), autoB = $('#auto'), cF = $('#cF');
    const r = { P: $('#rP'), S1: $('#rS1'), S2: $('#rS2'), O: $('#rO'), F: $('#rF') }, wP = $('#wP'), wO = $('#wO'), pto = $('#pto');
    let pos = 0, auto = false, fa = 0, ph = 0;
    const setP = v => { pos = v; posI.value = v; posV.textContent = fmt(v, 1) + ' mm'; };
    posI.oninput = () => setP(+posI.value);
    panel.querySelectorAll('[data-u]').forEach(b => b.onclick = () => setP(+b.dataset.u));
    autoB.onclick = () => { auto = !auto; autoB.setAttribute('aria-pressed', auto); };
    ctx.accion('pieza', () => setP(pos < -5 ? 0 : pos < 5 ? 10 : -10), { pista: 'Púlsala en el modelo para moverla a −10, 0 o +10 mm.' });

    return {
      update(dt) {
        if (auto) { fa += dt * .6; setP(Math.round(Math.sin(fa) * 11 * 2) / 2); }
        ph += dt * Math.PI * 2 * .7;
        const xc = pos / 10;
        nuc.position.x = xc; pieza.position.x = xc + 6.05;
        const vs1 = V0 * (.5 - .4 * pos / PMAX), vs2 = V0 * (.5 + .4 * pos / PMAX), vo = vs1 - vs2;
        const sg = Math.cos(ph);
        f1.set(cF.checked ? vs1 / V0 * 1.6 : 0, 1.4 * sg); f2.set(cF.checked ? vs2 / V0 * 1.6 : 0, -1.4 * sg);
        det(vs1, vs2, vo, sg, ph);
        pri.material.emissiveIntensity = .12 + .12 * Math.abs(sg);
        s1.material.emissiveIntensity = vs1 / V0 * .4 * Math.abs(sg); s2.material.emissiveIntensity = vs2 / V0 * .4 * Math.abs(sg);
        let a = '', b = '';
        for (let i = 0; i <= 80; i++) { const x = 2 + i * 138 / 80, t = i / 80 * Math.PI * 4 + ph * .0;
          a += (i ? ' L' : 'M') + x.toFixed(1) + ' ' + (38 - Math.sin(t) * 24).toFixed(1);
          b += (i ? ' L' : 'M') + x.toFixed(1) + ' ' + (100 - Math.sin(t) * 24 * vo / (V0 * .8)).toFixed(1); }
        wP.setAttribute('d', a); wO.setAttribute('d', b);
        pto.setAttribute('cx', (228 + pos / PMAX * 64).toFixed(1)); pto.setAttribute('cy', (66 - vo / (V0 * .8) * 52).toFixed(1));

        ctx.step(Math.abs(pos) < .3 ? 1 : 2);
        set(r.P, fmt(pos, 1) + ' mm');
        set(r.S1, fmt(vs1, 2) + ' V~'); set(r.S2, fmt(vs2, 2) + ' V~');
        set(r.O, fmt(Math.abs(vo), 2) + ' V~', Math.abs(vo) > .05 ? 'ok' : '');
        set(r.F, Math.abs(pos) < .3 ? '— (nula)' : vo > 0 ? '0°' : '180°');
        const t = Math.abs(pos) < .3 ? 'Núcleo centrado: los dos secundarios reciben el mismo flujo y, al estar en oposición serie, sus tensiones se anulan.'
          : `El núcleo está más dentro de ${pos < 0 ? 'S1' : 'S2'}: ese secundario recibe más flujo. La salida es proporcional al desplazamiento (${fmt(V0 * .8 / PMAX, 3)} V/mm) y la fase indica hacia qué lado.`;
        set(msg, t); msg.hidden = false;
      },
      dentro: D.dentro,
      labels: [
        { p: 'primario', txt: 'Primario', at: () => D.W(0, 1.75, .35) },
        { p: 's1', txt: 'Secundario S1', at: () => D.W(-1.08 * S, -1.75, .35), l: 1 },
        { p: 's2', txt: 'Secundario S2', at: () => D.W(1.08 * S, -1.75, .35) },
        { p: 'nucleo', txt: 'Núcleo', at: () => D.W(pos / 10 * S + 1.2 * S, .5, .35) },
        { p: 'carcasa', at: () => D.W(-5.6, 2.15, .4), l: 1 },
        { p: 'primario', txt: 'Primario', at: () => V(0, Y - 1.0, -.2) },
        { p: 's1', txt: 'Secundario S1', at: () => V(-1.95, Y - 1.0, -.2), l: 1 },
        { p: 's2', txt: 'Secundario S2', at: () => V(1.95, Y - 1.0, -.2) },
        { p: 'nucleo', txt: 'Núcleo móvil', at: () => V(nuc.position.x - 1.2, Y + .3, .3), l: 1 },
        { p: 'vastago', txt: 'Vástago', at: () => V(nuc.position.x + 4.2, Y + .1, 0) },
        { p: 'pieza', txt: 'Pieza medida', at: () => pieza.localToWorld(V(1.6, 3.6, 1.2)) },
        { p: 'carcasa', at: () => V(-3.4, Y + 1.25, 0), l: 1 },
        { p: 'acond', txt: 'Acondicionador', at: () => V(-4.6, 2.2, 1.2) }
      ]
    };
  }

  window.COMPONENTES.push({
    id: 'lvdt', nombre: 'LVDT', categoria: 'Sensores', grupo: 'Inductivos',
    resumen: 'Transformador diferencial que mide desplazamientos sin rozamiento.',
    titulo: 'LVDT: un transformador que mide posiciones',
    lead: 'Mueve la pieza y con ella el núcleo. Mira cómo cambian las tensiones de los dos secundarios y cómo la salida pasa por cero en el centro y cambia de fase al cruzarlo. Con «Ver por dentro» verás el flujo que llega a cada secundario y sus tensiones.',
    camara: { pos: [2.5, 7.5, 16.5], tgt: [.9, 1.5, 0] }, suelo: -.32,
    panel: PANEL, build,
    leyenda: [['#2f8cff', 'Flujo hacia cada secundario (alterno)']],
    pasos: [
      ['1. Primario con alterna', 'El acondicionador alimenta el primario con una tensión alterna (de 1 a 10 kHz). El núcleo de hierro lleva su flujo hacia los dos secundarios.'],
      ['2. Núcleo centrado', 'Los dos secundarios reciben el mismo flujo. Como están conectados en oposición serie, sus tensiones se restan y la salida es cero.'],
      ['3. Núcleo desplazado', 'Un secundario recibe más flujo que el otro. La salida crece proporcional al desplazamiento y su fase (0° o 180°) dice hacia qué lado se ha movido.']
    ],
    partes: {
      carcasa:  { t: 'Carcasa', d: 'Tubo de acero inoxidable que protege los bobinados y apantalla el campo. Aquí se ha cortado la mitad delantera.' },
      carrete:  { t: 'Carrete', d: 'Tubo aislante sobre el que van los tres bobinados y por cuyo interior se mueve el núcleo.' },
      primario: { t: 'Bobinado primario', d: 'Bobina central alimentada con alterna.' },
      s1:       { t: 'Secundario S1', d: 'Bobina de un lado. Su tensión sube cuando el núcleo entra más en ella.' },
      s2:       { t: 'Secundario S2', d: 'Bobina del otro lado, conectada en oposición serie con S1.' },
      nucleo:   { t: 'Núcleo móvil', d: 'Cilindro ferromagnético que no toca los bobinados: no hay rozamiento ni desgaste. Por eso un LVDT puede durar décadas.' },
      vastago:  { t: 'Vástago y palpador', d: 'Varilla no magnética que une el núcleo con la pieza cuya posición se mide.' },
      pieza:    { t: 'Pieza medida', d: 'Muévela con el control del panel o pulsándola.' },
      acond:    { t: 'Acondicionador', d: 'Genera la alterna del primario y demodula la salida para dar una tensión continua con signo (por ejemplo ±10 V o 4–20 mA).' },
      cables:   { t: 'Cable', d: 'Lleva el primario y los secundarios al acondicionador.' },
      base:     { t: 'Base', d: 'Soportes y guía del montaje.' }
    },
    extra: `
      <div class="two">
        <div>
          <h2>Ventajas del LVDT</h2>
          <p>Mide sin contacto entre el núcleo y los bobinados, así que no se desgasta (los apuntes hablan de unos 2·10⁶ horas de vida media). Tiene resolución casi infinita y el núcleo está aislado eléctricamente del circuito, por lo que puede usarse en zonas con gases inflamables.</p>
          <p>Su versión angular es el RVDT, para medir giros.</p>
        </div>
        <div>
          <h2>LVDT o potenciómetro</h2>
          <table><tbody>
            <tr><td>LVDT</td><td>Sin rozamiento, muy duradero, necesita alterna y acondicionador</td></tr>
            <tr><td>Potenciómetro</td><td>Sencillo y barato, pero el cursor roza y se desgasta</td></tr>
          </tbody></table>
        </div>
      </div>`
  });
})();
