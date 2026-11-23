// Componente: detector capacitivo vigilando el nivel de agua a través de la pared de un depósito de plástico
(() => {
  const { set, fmt } = UT;
  const Y = 2.6;

  const PANEL = `
    <button class="big" id="auto" aria-pressed="true">Parar el llenado automático</button>
    <label class="sp"><span>Nivel de agua</span><input type="range" id="niv" min="0" max="100" step="1" value="10" disabled><b id="nivV">10 %</b></label>
    <label class="sp"><span>Sensibilidad (tornillo)</span><input type="range" id="sens" min="0" max="1" step="0.05" value="0.5"><b id="sensV">50 %</b></label>
    <p class="msg" id="msg" hidden></p>
    ${UT.dl([['rN', 'Nivel', ''], ['rC', 'Capacidad medida', ''], ['rO', 'Salida del detector', ''], ['rB', 'Bomba', '']])}
    <svg class="sch" viewBox="0 0 300 104" aria-label="Conexión: la salida del detector capacitivo corta la bomba a través de un contacto NC">
      <text x="4" y="16">+24 V</text><line x1="10" y1="22" x2="270" y2="22"/>
      <rect x="20" y="36" width="56" height="40"/><path d="M48 42 l10 14 l-10 14 l-10 -14 z"/><text x="24" y="92">B1 cap.</text>
      <line x1="40" y1="22" x2="40" y2="36"/><line x1="76" y1="56" x2="120" y2="56"/><circle id="h1" cx="132" cy="56" r="11"/><path d="M124 48l16 16M140 48l-16 16"/><text x="122" y="84">Lleno</text>
      <line x1="200" y1="22" x2="200" y2="36"/><circle cx="200" cy="38" r="2.5"/><circle cx="200" cy="58" r="2.5"/><line id="sK" x1="200" y1="58" x2="200" y2="39"/><text x="206" y="50">B1 NC</text>
      <line x1="200" y1="58" x2="200" y2="66"/><circle id="sM" cx="200" cy="78" r="12"/><text x="194" y="82">M</text><text x="216" y="82">bomba</text>
      <path id="fB" class="flow fl" d="M200 22 V66"/>
      <rect class="hit" id="hM" x="186" y="64" width="28" height="28" rx="14"/>
    </svg>
    <p class="nota-sch">Pulsa la bomba M del esquema para activar o parar el llenado automático.</p>
    <div class="chk"><label><input type="checkbox" id="cIn" checked> Carcasa transparente</label></div>`;

  function build(ctx, panel) {
    const { T, V, scene, M, boxR, cyl, tube, curva, part: P } = ctx;
    const m = UT.mats(ctx);
    const ejeX = o => { o.rotation.z = Math.PI / 2; return o; };

    P(boxR(-6, 8, -.3, 0, -2.6, 2.6, M(0x6b737b, { metalness: .4, roughness: .5 })), 'base');
    P(boxR(-3.6, -2.4, 0, Y - .95, -.6, .6, m.plastic), 'soporte');
    const cs = UT.cuerpoSensor(ctx, { x0: .1, x1: -4.1, y: Y, r: .9, cara: 0xe0a800 });
    ejeX(P(cyl(.6, .06, m.copper, -.08, Y, 0, null, 32), 'electrodos'));
    const ring = P(new T.Mesh(new T.TorusGeometry(.78, .05, 8, 40), m.copper), 'electrodos'); ring.rotation.y = Math.PI / 2; ring.position.set(-.08, Y, 0); scene.add(ring);
    P(boxR(-3.6, -.4, Y - .5, Y + .5, -.04, .04, M(0x1f6b3a, { roughness: .6 })), 'circuito');
    [[-1.2, .2], [-2.0, -.15], [-2.8, .15]].forEach(([x, dy]) => P(boxR(x - .3, x + .3, Y + dy - .14, Y + dy + .14, .04, .16, m.black), 'circuito'));
    const aj = ejeX(P(cyl(.18, .14, m.steel, -4.17, Y + .45, 0, null, 16), 'ajuste'));
    const ranura = P(boxR(-4.25, -4.23, Y + .45 - .14, Y + .45 + .14, -.03, .03, m.black), 'ajuste');
    P(tube([V(-4.3, Y, 0), V(-5.0, Y, 0), V(-5.4, .7, .4), V(-5.4, .05, 1.2)], .14, M(0x3a3e45, { roughness: .6 })), 'cable');

    // depósito de plástico y agua
    const dep = P(boxR(.12, 4.12, 0, 5.2, -2, 2, new T.MeshPhysicalMaterial({ color: 0xe8eef4, transparent: true, opacity: .18, roughness: .2, depthWrite: false, side: T.DoubleSide })), 'deposito', true);
    dep.renderOrder = 2;
    { const e = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(4, 5.2, 4)), new T.LineBasicMaterial({ color: 0x9aaec2 })); e.position.set(2.12, 2.6, 0); scene.add(e); }
    const gA = new T.BoxGeometry(3.84, 1, 3.84); gA.translate(0, .5, 0);
    const agua = P(new T.Mesh(gA, new T.MeshPhysicalMaterial({ color: 0x3b8fe0, transparent: true, opacity: .45, roughness: .1, depthWrite: false })), 'agua');
    agua.position.set(2.12, .02, 0); agua.renderOrder = 1; scene.add(agua);
    // bomba, tubería de llenado y desagüe
    P(boxR(5.4, 6.8, 0, 1.2, -.7, .7, M(0x1f4e9c, { roughness: .45 })), 'bomba');
    { const c = P(cyl(.45, .4, m.steel, 6.1, .6, .9, null, 24), 'bomba'); c.rotation.x = Math.PI / 2; }
    const tubo = [V(6.1, 1.2, 0), V(6.1, 5.9, 0), V(5.2, 6.3, 0), V(3.4, 6.1, 0), V(3.2, 5.4, 0)];
    P(tube(tubo, .14, M(0xd8dde3, { roughness: .4 })), 'bomba');
    const desag = [V(4.12, .35, -1.2), V(5.0, .35, -1.2), V(5.2, .2, -2.0)];
    P(tube(desag, .1, M(0xd8dde3, { roughness: .4 })), 'deposito');
    const fT = ctx.flow({ color: 0x3b8fe0, size: .09, gap: .25 }).path(curva(tubo, 40));
    const fD = ctx.flow({ color: 0x3b8fe0, size: .07, gap: .25 }).path(curva(desag, 20));
    const campo = [];
    for (const a of [0, Math.PI / 3, 2 * Math.PI / 3, Math.PI, 4 * Math.PI / 3, 5 * Math.PI / 3]) {
      const pts = []; for (let i = 0; i <= 30; i++) { const t = i / 30 * Math.PI; const rr = .15 + .65 * (1 - Math.cos(t)) / 2, x = .1 + 1.5 * Math.sin(t); pts.push(V(x, Y + Math.cos(a) * rr, Math.sin(a) * rr)); }
      campo.push(ctx.flow({ color: 0xe0245e, size: .05, gap: .16 }).path(pts));
    }
    const pil = UT.bombilla(ctx, V(-5.6, 0, -1.6), 'piloto', .5);

    // ---- vista por dentro: electrodos, pared del depósito y agua ----
    const D = UT.detalle(ctx, { w: 13.5, h: 8.6, titulo: 'DETALLE A · CAMPO ELÉCTRICO DELANTE DE LA CARA · ESCALA 3:1' }), G = D.g;
    const bx = (x0, x1, y0, y1, mat, id, z = .3) => P(boxR(x0, x1, y0, y1, -z, z, mat, G), id);
    for (const sg of [1, -1]) { bx(-6.2, -1.4, sg * 2.3, sg * 2.5, M(0xaab1b9, { metalness: .7, roughness: .35 }), 'cuerpo', .35); bx(-1.92, -1.76, sg * 1.5, sg * 2.05, m.copper, 'electrodos'); }
    bx(-1.92, -1.76, -.9, .9, m.copper, 'electrodos');
    bx(-1.62, -1.42, -2.3, 2.3, M(0xe0a800, { roughness: .5, transparent: true, opacity: .55 }), 'cara', .35);
    bx(-6.0, -3.0, -.12, .12, M(0x1f6b3a, { roughness: .6 }), 'circuito', .5);
    [[-5.4, .3], [-4.5, -.3], [-3.7, .3]].forEach(([x, y]) => bx(x - .25, x + .25, y - .18, y + .18, m.black, 'circuito', .55));
    const pared = bx(-1.36, -1.08, -3.1, 3.1, new T.MeshPhysicalMaterial({ color: 0xe8eef4, transparent: true, opacity: .45, roughness: .2, depthWrite: false }), 'deposito', .45);
    const gA2 = new T.BoxGeometry(7.2, 1, .9); gA2.translate(0, .5, 0);
    const aguaD = P(new T.Mesh(gA2, new T.MeshPhysicalMaterial({ color: 0x3b8fe0, transparent: true, opacity: .4, roughness: .1, depthWrite: false })), 'agua', true);
    aguaD.position.set(-1.08 + 3.6, -3.1, 0); aguaD.renderOrder = 1; G.add(aguaD);
    const sig = (t, x, y) => D.etiqueta(x, y, .45, .45, { size: .9, z: .5, bg: 'rgba(8,36,72,.9)' })(t);
    sig('+', -2.3, 0); sig('−', -2.3, 1.78); sig('−', -2.3, -1.78);
    // moléculas de agua (dipolos): rojo = lado negativo (O), blanco = lado positivo (H)
    const dip = [], gO = new T.SphereGeometry(.13, 10, 8), gH = new T.SphereGeometry(.09, 8, 6), mO = M(0xe0245e), mH = M(0xf4f6fa);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 7; j++) {
      const o = new T.Group(), x = -.6 + i * .78 + (j % 2) * .3, y = -2.75 + j * .8; o.position.set(x, y, .5); G.add(o);
      const a = new T.Mesh(gO, mO); a.position.x = -.09; o.add(a); const b = new T.Mesh(gH, mH); b.position.x = .14; o.add(b);
      dip.push({ o, x, y, r: Math.random() * Math.PI * 2, w: (Math.random() - .5) * 3 });
    }
    // líneas de campo del electrodo central (+) al anillo (−); con agua aparecen más líneas
    const lineas = [];
    for (const sg of [1, -1]) for (let k = 1; k <= 5; k++) lineas.push({ sg, k, t: D.traza(42, { color: 0xff8fb0, op: .5 }), f: ctx.flow({ color: 0xe0245e, size: .06, gap: .2 }) });
    const arco = (sg, k) => { const yi = .15 + .15 * k, yo = 1.55 + .1 * k, yc = (yi + yo) / 2, ry = (yo - yi) / 2, rx = .5 + .75 * k, out = [];
      for (let i = 0; i <= 40; i++) { const a = -Math.PI / 2 + Math.PI * i / 40; out.push([-1.76 + rx * Math.cos(a), sg * (yc + ry * Math.sin(a))]); } return out; };
    const osc = D.traza(160, { color: 0xffd166 });
    D.etiqueta(-4.6, 3.55, 3.4, .4, { align: 'left', size: .7 })('OSCILADOR');
    D.linea([[-6.3, 3.0], [-1.2, 3.0]], { op: .3 });
    const cTxt = D.etiqueta(3.2, 3.3, 5.6, .45, { size: .7, align: 'right' });
    const bloques = D.cadena(['ELECTRODOS', 'OSCILADOR', 'DEMODULADOR', 'DISPARADOR', 'SALIDA'], -3.65, -6.3, 6.3);
    let fz = 0;
    const det = (dt, h, cub, senal, umbral) => {
      fz += dt * Math.PI * 2 * .6; const sgn = Math.cos(fz);
      const yw = Math.max(-3.1, Math.min(3.1, (h - Y) * 2.56));
      aguaD.scale.y = Math.max(.001, yw + 3.1); aguaD.visible = yw > -3.05;
      const ampO = Math.max(.04, Math.min(1, (senal - umbral + .3) / .3));
      lineas.forEach(L => { const pts = arco(L.sg, L.k), dentro = pts.filter(p => p[0] > -1.08 && p[1] < yw).length / pts.length;
        const v = L.k <= 3 ? .35 + .65 * dentro : dentro * 1.2;
        L.t.set((u, i) => pts[Math.min(i, pts.length - 1)]); L.t.l.material.opacity = .08 + .55 * Math.min(1, v);
        L.f.path(pts.map(p => D.W(p[0], p[1], .45))).set(Math.min(1, v), 1.2 * sgn); });
      dip.forEach(q => { const bajo = q.y < yw - .1; q.o.visible = bajo; if (!bajo) return;
        const campo = Math.max(0, 1 - (q.x + 1) / 4.2) * Math.min(1, Math.abs(q.y) < 2.4 ? 1 : .4);
        q.r += q.w * dt * (1 - campo); const obj = sgn > 0 ? 0 : Math.PI;
        let dA = ((obj - q.r) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI; q.r += dA * Math.min(1, dt * 6 * campo);
        q.o.rotation.z = q.r; });
      osc.set(u => [-6.3 + u * 5.1, 3.0 + Math.sin(u * Math.PI * 12 - fz * 3) * .42 * ampO]);
      cTxt('C = ' + fmt(2 + 10 * senal, 1) + ' pF', on ? '#ffd166' : '#eaf2ff');
      bloques[0](.3 + .7 * cub); bloques[1](ampO); bloques[2](ampO); bloques[3](on ? 1 : 0); bloques[4](on ? 1 : 0);
    };

    const $ = s => panel.querySelector(s);
    const autoB = $('#auto'), niv = $('#niv'), nivV = $('#nivV'), sensI = $('#sens'), sensV = $('#sensV'), msg = $('#msg');
    const r = { N: $('#rN'), C: $('#rC'), O: $('#rO'), B: $('#rB') }, s = { h1: $('#h1'), k: $('#sK'), M: $('#sM'), fB: $('#fB') };
    let auto = true, nivel = 10, sens = .5, on = false, fase = 'llenar', espera = 0;
    const setAuto = v => { auto = v; autoB.setAttribute('aria-pressed', v); autoB.textContent = v ? 'Parar el llenado automático' : 'Llenado automático'; niv.disabled = v; };
    autoB.onclick = () => setAuto(!auto);
    niv.oninput = () => { nivel = +niv.value; };
    const setS = v => { sens = v; sensI.value = v; sensV.textContent = Math.round(v * 100) + ' %'; };
    sensI.oninput = () => setS(+sensI.value);
    $('#cIn').onchange = e => cs.setCorte(e.target.checked);
    UT.hit(panel, '#hM', () => setAuto(!auto), false, 'Bomba: llenado automático');
    ctx.accion('ajuste', () => setS(sens >= 1 ? 0 : Math.min(1, Math.round((sens + .25) * 4) / 4)), { pista: 'Púlsalo en el modelo para girarlo y cambiar la sensibilidad.' });
    ctx.accion('bomba', () => setAuto(!auto), { pista: 'Púlsala en el modelo para activar o parar el llenado automático.' });

    return {
      update(dt) {
        const h = .05 + nivel / 100 * 5.0;
        const cub = Math.max(0, Math.min(1, (h - (Y - .9)) / 1.8));
        const senal = .15 + .85 * cub, umbral = 1.05 - sens;
        if (!on && senal >= umbral) on = true; else if (on && senal < umbral - .06) on = false;
        let bomba = false, vacia = false;
        if (auto) {
          if (fase === 'llenar') { bomba = !on; if (on) { fase = 'espera'; espera = 1.5; } }
          else if (fase === 'espera') { espera -= dt; if (espera <= 0) fase = 'vaciar'; }
          else { vacia = true; if (nivel <= 12) fase = 'llenar'; }
          if (bomba) nivel = Math.min(100, nivel + dt * 9); if (vacia) nivel = Math.max(0, nivel - dt * 12);
          niv.value = nivel;
        }
        nivV.textContent = Math.round(nivel) + ' %';
        agua.scale.y = Math.max(.01, h);
        fT.set(bomba ? 1 : 0, 2); fD.set(vacia ? 1 : 0, 1.6);
        campo.forEach(f => f.set(.45 + .55 * cub, 1.1));
        det(dt, h, cub, senal, umbral);
        cs.led.material.emissiveIntensity = on ? 2 : 0; pil.setLuz(on ? 1 : 0);
        ranura.rotation.x = sens * 4; aj.rotation.y = sens * 4;

        ctx.step(sens > .9 ? 3 : on ? 2 : cub > 0 ? 1 : 0);
        set(r.N, Math.round(nivel) + ' %');
        set(r.C, fmt(2 + 10 * senal, 1) + ' pF');
        set(r.O, on ? 'activada' : 'desactivada', on ? 'ok' : '');
        set(r.B, bomba ? 'llenando' : vacia ? 'desagüe abierto' : 'parada');
        const t = sens > .9 ? 'Sensibilidad excesiva: el detector ya ve la propia pared de plástico y está siempre activado. Hay que bajarla con el tornillo.'
          : sens < .15 && !on ? 'Sensibilidad muy baja: aunque el agua tape la cara puede no llegar a detectarla.'
          : on ? 'El agua (εr ≈ 80) delante de la cara aumenta mucho la capacidad: la salida se activa y corta la bomba por su contacto NC.'
          : cub > 0 ? 'El agua empieza a tapar la cara sensible y la capacidad sube.' : '';
        set(msg, t); msg.hidden = !t;
        UT.lit(s.h1, on, '#ffc04a');
        s.k.setAttribute('x2', on ? 212 : 200); s.k.setAttribute('y2', on ? 42 : 39);
        s.M.style.fill = bomba ? 'rgba(59,143,224,.35)' : 'none'; s.fB.classList.toggle('live', bomba);
      },
      dentro: D.dentro,
      labels: [
        { p: 'electrodos', txt: 'Electrodos', at: () => D.W(-1.84, 2.05, .3), l: 1 },
        { p: 'deposito', txt: 'Pared del depósito', at: () => D.W(-1.1, 3.1, .45) },
        { p: 'agua', txt: 'Agua (dipolos)', at: () => D.W(5.2, Math.max(-2.9, Math.min(2.9, (nivel / 100 * 5 + .05 - Y) * 2.56)) - .1, .45) },
        { p: 'circuito', txt: 'Electrónica', at: () => D.W(-4.5, .45, .5) },
        { p: 'cara', txt: 'Cara sensible', at: () => V(.1, Y + .9, 0) },
        { p: 'electrodos', at: () => V(-.1, Y - .65, .3), l: 1 },
        { p: 'circuito', txt: 'Oscilador y disparador', at: () => V(-2.0, Y + .55, .1) },
        { p: 'ajuste', txt: 'Tornillo de sensibilidad', at: () => V(-4.2, Y + .65, 0), l: 1 },
        { p: 'deposito', txt: 'Depósito de plástico', at: () => V(4.1, 5.2, 2) },
        { p: 'agua', at: () => V(3.0, .05 + nivel / 100 * 5.0, 1.9) },
        { p: 'bomba', at: () => V(6.8, 1.0, .7) },
        { p: 'piloto', txt: 'Piloto "lleno"', at: () => V(-5.3, .8, -1.6) }
      ]
    };
  }

  window.COMPONENTES.push({
    id: 'capacitivo', nombre: 'Detector capacitivo', categoria: 'Sensores', grupo: 'Capacitivos',
    resumen: 'Detecta casi cualquier material, incluso líquidos a través de una pared.',
    titulo: 'Detector capacitivo: nota el agua a través del plástico',
    lead: 'La bomba llena el depósito hasta que el detector, pegado por fuera, nota el agua y la para. Cambia la sensibilidad con el tornillo para ver qué pasa si te pasas. Con «Ver por dentro» verás el campo eléctrico y cómo se orientan las moléculas de agua.',
    camara: { pos: [4.5, 8.5, 17], tgt: [.4, 2.2, 0] }, suelo: -.32,
    panel: PANEL, build,
    leyenda: [['#e0245e', 'Campo eléctrico de los electrodos'], ['#3b8fe0', 'Agua']],
    pasos: [
      ['1. Depósito vacío', 'Los electrodos de la cara forman un condensador abierto. Su campo atraviesa la pared de plástico y el aire, que tienen una permitividad baja.'],
      ['2. Sube el agua', 'El agua tiene una permitividad relativa muy alta (≈ 80). Al ponerse delante de la cara, la capacidad del condensador aumenta.'],
      ['3. Conmutación', 'Cuando la capacidad supera el umbral, el oscilador cambia y el disparador activa la salida. Aquí su contacto NC corta la bomba.'],
      ['4. Ajuste de sensibilidad', 'El tornillo trasero fija el umbral. Hay que ajustarlo para que detecte el agua pero no la pared ni la suciedad pegada.']
    ],
    partes: {
      cuerpo:     { t: 'Cuerpo roscado M18', d: 'Tubo con rosca para fijarlo con tuercas. Se ve transparente para mirar dentro.' },
      cara:       { t: 'Cara sensible', d: 'Frente aislante detrás del que están los electrodos.' },
      electrodos: { t: 'Electrodos', d: 'Disco central y anillo exterior: son las dos placas de un condensador abierto hacia delante.' },
      circuito:   { t: 'Oscilador y disparador', d: 'El oscilador depende de la capacidad de los electrodos. Al cambiar esta, el disparador conmuta la salida.' },
      ajuste:     { t: 'Tornillo de sensibilidad', d: 'Potenciómetro que ajusta el umbral de detección.' },
      led:        { t: 'LED de estado', d: 'Se enciende con la salida activada.' },
      tuercas:    { t: 'Tuercas de fijación', d: 'Sujetan el detector y fijan la distancia a la pared.' },
      cable:      { t: 'Cable de 3 hilos', d: 'Marrón +24 V, azul 0 V y negro salida.' },
      deposito:   { t: 'Depósito de plástico', d: 'El detector ve el agua a través de la pared porque el plástico es aislante y de baja permitividad.' },
      agua:       { t: 'Agua', d: 'Su permitividad relativa (≈ 80) es mucho mayor que la del aire (1) o el plástico (2–4).' },
      bomba:      { t: 'Bomba de llenado', d: 'Se alimenta a través del contacto NC del detector: se para al detectar agua.' },
      piloto:     { t: 'Piloto "lleno"', d: 'Se enciende cuando el detector ve el agua.' },
      soporte:    { t: 'Soporte', d: 'Escuadra del detector.' },
      base:       { t: 'Base', d: 'Bancada del montaje.' }
    },
    extra: `
      <div class="two">
        <div>
          <h2>Cómo funciona</h2>
          <p>La capacidad de un condensador es C = ε · A / d. Los electrodos del detector son fijos (A y d no cambian), así que lo que hace variar C es la <b>permitividad ε</b> del material que tiene delante.</p>
          <p>Por eso detecta casi todo: agua, aceite, grano, plástico, vidrio, madera y también metales. Cuanto mayor es ε, a más distancia lo detecta.</p>
          <p class="note">Usos: nivel en depósitos y tolvas, detección de envases llenos, presencia de piezas no metálicas.</p>
        </div>
        <div>
          <h2>Permitividad relativa (aprox.)</h2>
          <table><tbody>
            <tr><td>Aire</td><td>1</td></tr><tr><td>Plástico</td><td>2 – 4</td></tr><tr><td>Vidrio</td><td>5 – 10</td></tr>
            <tr><td>Madera seca</td><td>2 – 7</td></tr><tr><td>Agua</td><td>80</td></tr>
          </tbody></table>
        </div>
      </div>`
  });
})();
