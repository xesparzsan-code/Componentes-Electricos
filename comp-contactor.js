// Componente: contactor tripolar con contacto auxiliar 13-14, arrancando un motor trifásico
(() => {
  const { set, fmt } = UT;
  const POLOS = [-1.65, -.55, .55], AUX = 1.75;

  const PANEL = `
    <div class="row"><button class="big verde" id="on" aria-pressed="false">Marcha S1</button><button class="big rojo" id="off" aria-pressed="false">Paro S0</button></div>
    <p class="tip">Son pulsadores: actúan mientras los mantienes pulsados.</p>
    <div class="chk"><label><input type="checkbox" id="cAuto" checked> Autoenclavamiento con 13–14</label></div>
    <p class="msg" id="msg" hidden></p>
    ${UT.dl([['rB', 'Bobina A1–A2', '0 V'], ['rC', 'Contactos principales', 'abiertos'], ['rA', 'Auxiliar 13–14', 'abierto'], ['rM', 'Motor', 'parado'], ['rI', 'Corriente por fase', '0 A']])}
    <svg class="sch" viewBox="0 0 300 196" aria-label="Esquema de mando con paro S0, marcha S1 y autoenclavamiento 13-14; esquema de potencia con los tres contactos de K1 y el motor">
      <text x="6" y="12">Mando</text><text x="136" y="12">Potencia</text>
      <text x="48" y="22">L</text><line x1="40" y1="16" x2="40" y2="28"/><circle cx="40" cy="28" r="2.5"/><circle cx="40" cy="48" r="2.5"/>
      <line id="sP" x1="40" y1="48" x2="40" y2="29"/><text x="48" y="42">S0</text>
      <line x1="40" y1="48" x2="40" y2="58"/><line x1="40" y1="58" x2="80" y2="58"/><line x1="80" y1="58" x2="80" y2="60"/>
      <circle cx="40" cy="60" r="2.5"/><circle cx="40" cy="80" r="2.5"/><line id="sM" x1="40" y1="80" x2="28" y2="62"/><text x="12" y="74">S1</text>
      <circle cx="80" cy="60" r="2.5"/><circle cx="80" cy="80" r="2.5"/><line id="sA" x1="80" y1="80" x2="68" y2="62"/><text x="85" y="74">13-14</text>
      <line x1="80" y1="80" x2="80" y2="88"/><line x1="80" y1="88" x2="40" y2="88"/><line x1="40" y1="80" x2="40" y2="100"/>
      <rect id="sCoil" x="28" y="100" width="24" height="36"/><text x="56" y="122">K1</text>
      <line x1="40" y1="136" x2="40" y2="176"/><text x="34" y="190">N</text>
      <text x="142" y="22">L1</text><text x="182" y="22">L2</text><text x="222" y="22">L3</text>
      <line x1="150" y1="26" x2="150" y2="60"/><line x1="190" y1="26" x2="190" y2="60"/><line x1="230" y1="26" x2="230" y2="60"/>
      <circle cx="150" cy="60" r="2.5"/><circle cx="190" cy="60" r="2.5"/><circle cx="230" cy="60" r="2.5"/>
      <circle cx="150" cy="90" r="2.5"/><circle cx="190" cy="90" r="2.5"/><circle cx="230" cy="90" r="2.5"/>
      <line id="k1" x1="150" y1="90" x2="138" y2="62"/><line id="k2" x1="190" y1="90" x2="178" y2="62"/><line id="k3" x1="230" y1="90" x2="218" y2="62"/>
      <path class="lnk" d="M136 76 H232"/><text x="240" y="80">K1</text>
      <line x1="150" y1="90" x2="174" y2="136"/><line x1="190" y1="90" x2="190" y2="128"/><line x1="230" y1="90" x2="206" y2="136"/>
      <circle id="sMot" cx="190" cy="150" r="22"/><text x="176" y="154">M 3~</text>
      <path id="fM1" class="flow fy" d="M40 16 V100 M40 136 V176"/><path id="fM2" class="flow fy" d="M40 16 V58 H80 V88 H40 V100 M40 136 V176"/>
      <path id="fP" class="flow fl" d="M150 26 V90 L174 136 M190 26 V128 M230 26 V90 L206 136"/>
      <rect class="hit" id="hS0" x="24" y="22" width="36" height="32" rx="5"/><rect class="hit" id="hS1" x="8" y="56" width="40" height="30" rx="5"/>
      <rect class="hit" id="hM" x="166" y="126" width="48" height="48" rx="24"/>
    </svg>
    <p class="nota-sch">En el esquema: mantén S1 (marcha) o S0 (paro), o pulsa el motor M para arrancarlo o pararlo.</p>
    <div class="chk"><label><input type="checkbox" id="cCase" checked> Tapa transparente</label></div>`;

  function build(ctx, panel) {
    const { T, V, scene, M, boxR, cyl, tube, curva, part: P, spark } = ctx;
    const m = UT.mats(ctx), lam = UT.laminado(ctx, 3);

    P(boxR(-2.4, 2.4, 0, 7.8, -1.7, -1.55, m.plastic), 'carcasa'); P(boxR(-2.4, 2.4, 0, .4, -1.55, 1.45, m.plastic), 'carcasa');
    const tapa = UT.caja(ctx, 4.8, 7.4, 3.1, V(0, 4.1, -.1), 'tapa');
    UT.carrilDetras(ctx, -3.4, 3.4, 3.7, -1.7, m.zinc);

    // núcleo fijo en E, espiras de sombra y bobina
    P(boxR(-1.5, 1.5, .6, 1.0, -.6, .6, lam), 'nucleoFijo');
    [[-1.5, -1.0], [-.3, .3], [1.0, 1.5]].forEach(([a, b]) => P(boxR(a, b, 1.0, 2.0, -.6, .6, lam), 'nucleoFijo'));
    for (const x of [-1.25, 1.25]) for (const z of [-.6, .6]) P(boxR(x - .27, x + .27, 1.84, 1.94, z - .05, z + .05, m.copper), 'espira');
    P(boxR(-.95, .95, 1.0, 1.06, -.85, .85, m.dark), 'bobina'); P(boxR(-.95, .95, 1.94, 2.0, -.85, .85, m.dark), 'bobina');
    const coil = P(boxR(-.85, .85, 1.06, 1.94, -.75, .75, m.wind), 'bobina');

    // parte móvil: núcleo móvil + portacontactos + puentes
    const mov = new T.Group(); scene.add(mov);
    P(boxR(-1.5, 1.5, 2.45, 2.85, -.6, .6, lam, mov), 'armadura');
    [[-1.5, -1.0], [-.3, .3], [1.0, 1.5]].forEach(([a, b]) => P(boxR(a, b, 2.05, 2.45, -.6, .6, lam, mov), 'armadura'));
    P(boxR(-2.1, 2.1, 2.85, 3.2, -.45, .45, m.card, mov), 'portacontactos');
    [...POLOS, AUX].forEach((px, i) => {
      const w = i < 3 ? .22 : .15, id = i < 3 ? 'puentes' : 'aux';
      P(boxR(px - .12, px + .12, 3.2, 5.15, -.25, .25, m.card, mov), 'portacontactos');
      P(boxR(px - w, px + w, 4.65, 4.78, -.95, .95, m.bronze, mov), id);
      for (const z of [-.75, .75]) { P(cyl(.12, .08, m.silver, px, 4.62, z, mov, 16), id); P(cyl(.12, .08, m.silver, px, 4.54, z, null, 16), i < 3 ? 'fijos' : 'aux'); }
      const fid = i < 3 ? 'fijos' : 'aux';
      P(boxR(px - w + .02, px + w - .02, 4.4, 4.5, .5, 1.0, m.bronze), fid); P(boxR(px - w + .02, px + w - .02, 4.4, 6.25, 1.0, 1.1, m.bronze), fid);
      P(boxR(px - w + .02, px + w - .02, 4.4, 4.5, -1.0, -.5, m.bronze), fid); P(boxR(px - w + .02, px + w - .02, .4, 4.5, -1.1, -1.0, m.bronze), fid);
      P(boxR(px - w + .02, px + w - .02, .4, .5, -1.1, .45, m.bronze), fid);
      // bornes
      P(boxR(px - .42, px + .42, 6.2, 6.9, .4, 1.45, m.plastic), 'bornesP'); UT.tornillo(ctx, px, 6.95, .95, m.steel, m.black, 'bornesP', true);
      P(boxR(px - .42, px + .42, .4, 1.1, .4, 1.45, m.plastic), 'bornesP'); UT.tornillo(ctx, px, 1.15, .95, m.steel, m.black, 'bornesP', true);
      const tt = i < 3 ? [`${2 * i + 1}/L${i + 1}`, `${2 * i + 2}/T${i + 1}`] : ['13', '14'];
      UT.rotulo(ctx, tt[0], .7, .3, V(px, 6.55, 1.46), [0, 0, 0], { color: '#e9e8e3' });
      UT.rotulo(ctx, tt[1], .7, .3, V(px, .75, 1.46), [0, 0, 0], { color: '#e9e8e3' });
    });
    // bornes de bobina A1 y A2
    for (const [x, t] of [[-2.1, 'A1'], [2.1, 'A2']]) {
      P(boxR(x - .28, x + .28, 7.0, 7.5, .4, 1.2, m.plastic), 'bornesB'); UT.tornillo(ctx, x, 7.55, .8, m.steel, m.black, 'bornesB', true);
      UT.rotulo(ctx, t, .5, .26, V(x, 7.25, 1.21), [0, 0, 0], { color: '#e9e8e3' });
    }
    const lA1 = [V(-.85, 1.8, .6), V(-2.2, 2.2, .6), V(-2.25, 6.8, .8)], lA2 = [V(.85, 1.2, .6), V(2.2, 1.6, .6), V(2.25, 6.8, .8)];
    P(tube(lA1, .03, m.copper), 'bobina'); P(tube(lA2, .03, m.copper), 'bobina');
    const mA1 = [V(-3.9, 7.3, .8), V(-3, 7.3, .8), V(-2.1, 7.3, .8)], mA2 = [V(2.1, 7.3, .8), V(3, 7.3, .8), V(3.9, 7.3, .8)];
    P(tube(mA1, .08, m.red), 'cables'); P(tube(mA2, .08, m.blue), 'cables');

    // muelles de retorno
    const sp = [-1.85, 1.85].map(x => UT.muelle(ctx, .14, 8, .025, m.steel, 'muelles'));

    // motor trifásico
    const mot = M(0x4f6d8a, { metalness: .4, roughness: .45 });
    { const b = P(cyl(1.3, 3.2, mot, 0, -3.4, .2, null, 40), 'motor'); b.rotation.z = Math.PI / 2; }
    for (let i = -6; i <= 6; i++) { const f = P(boxR(-1.5, 1.5, -.04, .04, -1.42, 1.42, mot), 'motor'); f.position.set(0, -3.4, .2); f.rotation.x = i * Math.PI / 13; }
    P(boxR(-.6, .6, -2.1, -1.95, -.3, .7, mot), 'motor'); P(boxR(-.6, .6, -2.25, -2.1, -.3, .7, mot), 'motor');
    P(boxR(-1.5, -1.1, -4.9, -4.6, -.8, 1.2, mot), 'motor'); P(boxR(1.1, 1.5, -4.9, -4.6, -.8, 1.2, mot), 'motor');
    const rot = new T.Group(); rot.position.set(1.6, -3.4, .2); scene.add(rot);
    { const s = P(cyl(.15, 1.3, m.steel, .65, 0, 0, rot, 16), 'motor'); s.rotation.z = Math.PI / 2;
      const d = P(cyl(.5, .16, m.steel, 1.3, 0, 0, rot, 30), 'motor'); d.rotation.z = Math.PI / 2;
      P(boxR(1.21, 1.4, .1, .48, -.08, .08, m.yellow, rot), 'motor'); }

    // cables de potencia
    const colores = [m.brown, m.black, m.grey];
    const wIn = POLOS.map(px => [V(px, 9.6, 1.0), V(px, 7.6, 1.2), V(px, 6.95, .95)]);
    const wOut = POLOS.map((px, i) => [V(px, 1.15, .95), V(px, 1.3, 1.9), V(px * .5, -.8, 1.4), V(px * .3, -1.95, .2)]);
    wIn.forEach((w, i) => P(tube(w, .1, colores[i]), 'cables')); wOut.forEach((w, i) => P(tube(w, .1, colores[i]), 'cables'));
    const aIn = [V(AUX, 9.6, 1.0), V(AUX, 7.8, 1.2), V(AUX, 6.95, .95)], aOut = [V(AUX, 1.15, .95), V(AUX + .5, .6, 1.8), V(3.6, -.6, .5), V(3.6, -.95, .5)];
    P(tube(aIn, .06, m.red), 'cables'); P(tube(aOut, .06, m.red), 'cables');
    const lamp = UT.bombilla(ctx, V(3.6, -1.6, .5), 'piloto', .7);

    // corriente
    const fC = ctx.flow({ color: 0xffc400, size: .06, gap: .22 }), fA = ctx.flow({ color: 0xff5a1f, size: .06 });
    const fP = POLOS.map(() => ctx.flow({ color: 0xff5a1f, size: .075 }));
    const espRect = []; for (let i = 0; i <= 160; i++) { const t = i / 160, a = t * Math.PI * 2 * 5, c = Math.cos(a), s = Math.sin(a);
      const k = Math.max(Math.abs(c) / .92, Math.abs(s) / .82); espRect.push(V(c / k, 1.85 - t * .7, s / k)); }
    fC.path([...curva(mA1), ...curva(lA1).reverse(), ...espRect, ...curva(lA2), ...curva(mA2)]);
    const polo = (px, w0, w1, off) => [...curva(w0), V(px, 6.25, 1.05), V(px, 4.45, 1.05), V(px, 4.45, .75), V(px, 4.72 + off, .75), V(px, 4.72 + off, -.75), V(px, 4.45, -.75), V(px, 4.45, -1.05), V(px, .45, -1.05), V(px, .45, .95), ...curva(w1)];

    // panel
    const $ = s => panel.querySelector(s);
    const msg = $('#msg'), cAuto = $('#cAuto');
    const r = { B: $('#rB'), C: $('#rC'), A: $('#rA'), M: $('#rM'), I: $('#rI') };
    const s = { P: $('#sP'), M: $('#sM'), A: $('#sA'), coil: $('#sCoil'), k: [$('#k1'), $('#k2'), $('#k3')], f1: $('#fM1'), f2: $('#fM2'), fP: $('#fP'), mot: $('#sMot') };
    let marcha = false, paro = false, mano = false, pulsoM = 0, pulsoP = 0, bob = false, off = .45, cerrado = false, wv = 0, relT = 9, prevC = false;
    UT.momentaneo($('#on'), v => { marcha = v; });
    UT.momentaneo($('#off'), v => { paro = v; });
    UT.hit(panel, '#hS1', v => { marcha = v; }, true, 'Pulsador de marcha S1');
    UT.hit(panel, '#hS0', v => { paro = v; }, true, 'Pulsador de paro S0');
    const motorClic = () => { if (cerrado) pulsoP = .35; else pulsoM = .35; };
    UT.hit(panel, '#hM', motorClic, false, 'Motor: arrancar o parar');
    ctx.accion('motor', motorClic, { pista: 'Púlsalo en el modelo para arrancarlo o pararlo (equivale a pulsar marcha o paro).' });
    ctx.accion('portacontactos', v => { mano = v; }, { mantener: true, pista: 'Mantenlo pulsado en el modelo para cerrar los contactos a mano, como se hace al probar un contactor sin tensión.' });
    $('#cCase').onchange = e => { tapa.visible = e.target.checked; };

    return {
      update(dt) {
        const antes = bob;
        pulsoM = Math.max(0, pulsoM - dt); pulsoP = Math.max(0, pulsoP - dt);
        const ma = marcha || pulsoM > 0, pa = paro || pulsoP > 0;
        bob = !pa && (ma || (cAuto.checked && cerrado && !mano));
        if (antes && !bob) relT = 0; relT += dt;
        off += ((bob || mano ? 0 : .45) - off) * Math.min(1, dt * (bob ? 16 : 11)); mov.position.y = off; mov.updateMatrixWorld();
        cerrado = off < .03;
        if (prevC && !cerrado) POLOS.forEach(px => spark(V(px, 4.6, .75)));
        prevC = cerrado;
        coil.material.emissiveIntensity = bob ? .25 : 0;
        sp.forEach((q, i) => q.unir(V(i ? 1.85 : -1.85, .6, 0), V(i ? 1.85 : -1.85, 2.85 + off, 0)));
        wv += ((cerrado ? 9 : 0) - wv) * Math.min(1, dt * (cerrado ? 1.5 : .8)); rot.rotation.x += wv * dt;
        lamp.setLuz(cerrado ? 1 : 0);

        fC.set(bob ? 1 : 0, 1.4);
        POLOS.forEach((px, i) => fP[i].path(polo(px, wIn[i], wOut[i], off)).set(cerrado ? 1 : 0, 1.6));
        fA.path(polo(AUX, aIn, aOut, off)).set(cerrado ? 1 : 0, 1.2);

        ctx.step(bob && ma ? 1 : bob ? 2 : relT < 1.6 ? 3 : 0);
        set(r.B, bob ? '230 V~' : '0 V', bob ? 'on' : '');
        set(r.C, cerrado ? 'cerrados' : 'abiertos', cerrado ? 'ok' : '');
        set(r.A, cerrado ? 'cerrado' : 'abierto', cerrado ? 'ok' : '');
        set(r.M, wv > 8.5 ? 'en marcha' : wv > .2 ? (cerrado ? 'arrancando' : 'parándose') : 'parado');
        set(r.I, cerrado ? fmt(wv > 8.5 ? 4.8 : 4.8 + (9 - wv) * 2.4, 1) + ' A' : '0 A');
        const t = mano && !bob ? 'Contactos cerrados a mano: el motor gira aunque la bobina no tenga tensión. Al soltar, los muelles los abren.'
          : bob && !ma && cAuto.checked ? 'Autoenclavamiento: has soltado S1, pero la bobina sigue alimentada a través de su propio contacto auxiliar 13–14.'
          : bob && ma && !cAuto.checked ? 'Sin autoenclavamiento el motor solo funciona mientras mantienes pulsado S1.'
          : pa && ma ? 'El paro tiene prioridad: con S0 pulsado la bobina no se alimenta aunque pulses marcha.' : '';
        set(msg, t); msg.hidden = !t;
        s.P.setAttribute('x2', pa ? 52 : 40); s.P.setAttribute('y2', pa ? 31 : 29);
        s.M.setAttribute('x2', ma ? 40 : 28); s.A.setAttribute('x2', cerrado ? 80 : 68);
        s.k.forEach((k, i) => k.setAttribute('x2', (150 + 40 * i) - (cerrado ? 0 : 12)));
        s.coil.style.fill = bob ? 'rgba(255,196,0,.35)' : 'none';
        s.f1.classList.toggle('live', bob && ma); s.f2.classList.toggle('live', bob && !ma);
        s.fP.classList.toggle('live', cerrado);
      },
      labels: [
        { p: 'bobina', at: () => V(.85, 1.5, .75) },
        { p: 'nucleoFijo', txt: 'Núcleo fijo', at: () => V(-1.5, .8, .6), l: 1 },
        { p: 'espira', txt: 'Espira de sombra', at: () => V(1.5, 1.9, .65) },
        { p: 'armadura', txt: 'Núcleo móvil', at: () => V(1.5, 2.65 + off, .6) },
        { p: 'portacontactos', at: () => V(-2.1, 3.0 + off, .45), l: 1 },
        { p: 'puentes', txt: 'Contactos móviles', at: () => V(-1.65, 4.75 + off, .95), l: 1 },
        { p: 'fijos', txt: 'Contactos fijos', at: () => V(.75, 4.45, 1.0) },
        { p: 'aux', txt: 'Auxiliar 13-14', at: () => V(1.9, 5.3, .9) },
        { p: 'muelles', at: () => V(-1.85, 1.7, .1), l: 1 },
        { p: 'bornesB', txt: 'A1', at: () => V(-2.38, 7.25, .8), l: 1 },
        { p: 'motor', txt: 'Motor trifásico', at: () => V(-1.6, -3.4, 1.2), l: 1 },
        { p: 'piloto', txt: 'Piloto', at: () => V(4.1, -1.0, .5) }
      ]
    };
  }

  window.COMPONENTES.push({
    id: 'contactor', nombre: 'Contactor', categoria: 'Mando y maniobra',
    resumen: 'Un relé de potencia para arrancar motores y cargas grandes.',
    titulo: 'Contactor: el relé que arranca motores',
    lead: 'Mantén pulsado Marcha y suéltalo: gracias al contacto auxiliar 13–14 el motor sigue en marcha (autoenclavamiento). Para pararlo pulsa Paro.',
    camara: { pos: [11, 6, 17.5], tgt: [0, 1.7, 0] }, suelo: -4.95,
    panel: PANEL, build,
    leyenda: [['#ffc400', 'Corriente de mando (bobina)'], ['#ff5a1f', 'Corriente de potencia']],
    pasos: [
      ['1. En reposo', 'La bobina no tiene tensión. Los muelles mantienen el núcleo móvil arriba y los tres contactos principales y el 13–14 están abiertos.'],
      ['2. Marcha', 'Al pulsar S1 la bobina recibe 230 V~. El núcleo fijo atrae al móvil, que baja el portacontactos: se cierran los tres polos y el auxiliar 13–14. El motor arranca.'],
      ['3. Autoenclavamiento', 'Al soltar S1, la bobina sigue alimentada a través del contacto 13–14, que está en paralelo con S1. El contactor “se mantiene” solo.'],
      ['4. Paro', 'S0 (normalmente cerrado) corta la bobina. Los muelles separan los núcleos, se abren los contactos con una chispa en cada polo y el motor se para.']
    ],
    partes: {
      carcasa:        { t: 'Carcasa', d: 'Base y caja aislante. Se monta en carril DIN o atornillada al fondo del cuadro.' },
      tapa:           { t: 'Tapa transparente', d: 'Sustituye la carcasa frontal para ver el interior.' },
      nucleoFijo:     { t: 'Núcleo fijo', d: 'Hierro en forma de E hecho de chapas finas aisladas (laminado) para que no se caliente con la corriente alterna.' },
      espira:         { t: 'Espiras de sombra', d: 'Anillos de cobre en los extremos del núcleo. En alterna el campo pasa por cero 100 veces por segundo; estas espiras crean un segundo flujo desfasado que evita que el núcleo vibre y zumbe.' },
      bobina:         { t: 'Bobina', d: 'Crea el campo magnético al recibir tensión entre A1 y A2 (aquí 230 V~). Su tensión viene indicada en el propio contactor.' },
      armadura:       { t: 'Núcleo móvil', d: 'Hierro en E que es atraído por el núcleo fijo y arrastra el portacontactos.' },
      portacontactos: { t: 'Portacontactos', d: 'Pieza aislante que une el núcleo móvil con todos los contactos móviles y los mueve a la vez.' },
      puentes:        { t: 'Contactos móviles (puentes)', d: 'Cada polo tiene un puente con dos pastillas de plata: corta en dos puntos a la vez (doble corte), así el arco es más corto y se apaga antes.' },
      fijos:          { t: 'Contactos fijos', d: 'Unen los bornes de entrada (1, 3, 5) con los de salida (2, 4, 6) cuando el puente baja.' },
      aux:            { t: 'Contacto auxiliar 13–14', d: 'Contacto pequeño normalmente abierto para el circuito de mando: autoenclavamiento, señalización o enclavamientos.' },
      muelles:        { t: 'Muelles de retorno', d: 'Separan el núcleo móvil cuando la bobina se queda sin tensión.' },
      bornesP:        { t: 'Bornes de potencia', d: '1/L1, 3/L2, 5/L3: entrada de las fases. 2/T1, 4/T2, 6/T3: salida al motor. 13 y 14: contacto auxiliar.' },
      bornesB:        { t: 'Bornes de bobina A1 / A2', d: 'Alimentación de la bobina, que pertenece al circuito de mando.' },
      motor:          { t: 'Motor trifásico', d: 'La carga que maneja el contactor. Gira mientras los tres contactos están cerrados.' },
      piloto:         { t: 'Piloto de marcha', d: 'Lámpara conectada a través del contacto 13–14: se enciende cuando el contactor está cerrado.' },
      carril:         { t: 'Carril DIN', d: 'Perfil de 35 mm donde se engancha el contactor.' },
      cables:         { t: 'Cables', d: 'Marrón, negro y gris: fases L1, L2 y L3. Rojo y azul: mando de la bobina y del piloto.' }
    },
    extra: `
      <div class="two">
        <div>
          <h2>Relé o contactor</h2>
          <p>Funcionan igual: una bobina mueve unos contactos. El contactor está hecho para <b>potencia</b>: contactos más grandes con doble corte, tres polos para cargas trifásicas y categoría de empleo (AC-3 para arrancar motores de jaula de ardilla).</p>
          <p>El circuito de la izquierda del esquema es el clásico <b>marcha-paro con autoenclavamiento</b>: el paro (NC) va en serie y tiene prioridad; la marcha (NA) va en paralelo con el contacto 13–14 del propio contactor.</p>
          <p class="note">En el motor real la corriente de arranque es varias veces mayor que la nominal; aquí se muestra de forma aproximada.</p>
        </div>
        <div>
          <h2>Numeración de bornes</h2>
          <table><tbody>
            <tr><td>1-2, 3-4, 5-6</td><td>Contactos principales (L1/T1, L2/T2, L3/T3)</td></tr>
            <tr><td>13-14</td><td>Auxiliar NA (acaba en 3-4)</td></tr>
            <tr><td>21-22</td><td>Auxiliar NC (acaba en 1-2), si lo tiene</td></tr>
            <tr><td>A1-A2</td><td>Bobina</td></tr>
          </tbody></table>
        </div>
      </div>`
  });
})();
