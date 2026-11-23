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
      labels: [
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
    lead: 'Mueve la pieza y con ella el núcleo. Mira cómo cambian las tensiones de los dos secundarios y cómo la salida pasa por cero en el centro y cambia de fase al cruzarlo.',
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
