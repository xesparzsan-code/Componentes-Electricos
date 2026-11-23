// Componente: condensador de placas paralelas (principio) cargándose desde una pila y descargándose en una lámpara
(() => {
  const { set, fmt } = UT;
  const C = 4700e-6, R = 1000, RL = 220, VB = 12, TMAX = 20;

  const PANEL = `
    <div><h3>Selector</h3><div class="row" id="sel"><button class="sm" data-v="C" aria-pressed="false">Cargar</button><button class="sm" data-v="A" aria-pressed="true">Aislar</button><button class="sm" data-v="D" aria-pressed="false">Descargar</button></div></div>
    <p class="msg" id="msg" hidden></p>
    ${UT.dl([['rV', 'Tensión en el condensador', '0,00 V'], ['rI', 'Corriente', '0 mA'], ['rQ', 'Carga Q = C · V', '0 mC'], ['rE', 'Energía ½ · C · V²', '0 mJ'], ['rT', 'Constante de tiempo', '']])}
    <svg class="sch" viewBox="0 0 300 124" aria-label="Gráfica de la tensión del condensador en los últimos 20 segundos">
      <line x1="30" y1="104" x2="292" y2="104" class="thin"/><line x1="30" y1="8" x2="30" y2="104" class="thin"/>
      <line x1="30" y1="16" x2="292" y2="16" class="lnk"/><line x1="30" y1="46.6" x2="292" y2="46.6" class="lnk"/>
      <text x="0" y="20">12 V</text><text x="0" y="50">7,6 V</text><text x="16" y="108">0</text><text x="240" y="120">últimos 20 s</text>
      <text x="200" y="42">63 % (1 τ)</text>
      <polyline id="graf" class="curva" points=""/>
    </svg>`;

  function build(ctx, panel) {
    const { T, V, scene, M, boxR, cyl, tube, curva, part: P } = ctx;
    const m = UT.mats(ctx);
    const ejeX = o => { o.rotation.z = Math.PI / 2; return o; };
    P(boxR(-6.3, 5.6, -.3, 0, -3, 3, M(0xf1f1ec, { roughness: .9 })), 'placa');

    // placas, dieléctrico y soportes
    const al = M(0xc9cdd2, { metalness: .8, roughness: .3 });
    P(boxR(-.82, -.7, 1.2, 4.2, -1.5, 1.5, al), 'armaduras'); P(boxR(.7, .82, 1.2, 4.2, -1.5, 1.5, al), 'armaduras');
    const die = P(boxR(-.65, .65, 1.25, 4.15, -1.45, 1.45, new T.MeshPhysicalMaterial({ color: 0xf0c060, transparent: true, opacity: .22, roughness: .3, depthWrite: false })), 'dielectrico');
    die.renderOrder = 2;
    for (const x of [-.76, .76]) for (const z of [-1.2, 1.2]) P(boxR(x - .08, x + .08, 0, 1.2, z - .08, z + .08, m.card), 'soportes');
    UT.rotulo(ctx, '+', .5, .5, V(-.83, 3.7, .9), [0, -Math.PI / 2, 0], { color: '#c1121f', size: 110 });
    UT.rotulo(ctx, '−', .5, .5, V(.83, 3.7, .9), [0, Math.PI / 2, 0], { color: '#0b4f8a', size: 110 });

    // pila, resistencia, selector y lámpara
    P(boxR(-6.1, -4.4, 0, 1.6, -1.8, -.4, m.dark), 'pila');
    UT.rotulo(ctx, [['PILA', 50], ['12 V', 50]], 1.2, .7, V(-5.25, .9, -.39), [0, 0, 0], { color: '#e9e8e3' });
    P(cyl(.16, .3, m.red, -4.8, 1.75, -1.1, null, 16), 'pila'); P(cyl(.16, .3, m.black, -5.6, 1.75, -1.1, null, 16), 'pila');
    ejeX(P(cyl(.22, .9, M(0xd9c08f, { roughness: .6 }), -3.55, .4, .4, null, 20), 'resistencia'));
    [[-3.83, 0x6b3e1e], [-3.66, 0x111111], [-3.49, 0xc62828], [-3.22, 0xd4af37]].forEach(([x, c]) => ejeX(P(cyl(.23, .07, M(c), x, .4, .4, null, 20), 'resistencia')));
    P(cyl(.6, .3, m.dark, -2.4, .15, .6, null, 32), 'selector');
    const knob = new T.Group(); knob.position.set(-2.4, .45, .6); scene.add(knob);
    P(cyl(.3, .3, m.plastic, 0, 0, 0, knob, 24), 'selector'); P(boxR(0, .5, -.05, .05, -.07, .07, m.yellow, knob), 'selector');
    const CONT = { C: V(-2.95, .35, .6), A: V(-2.4, .35, .05), D: V(-1.85, .35, .6) }, ANG = { C: Math.PI, A: Math.PI / 2, D: 0 };
    Object.entries(CONT).forEach(([k, p]) => { P(cyl(.08, .12, m.silver, p.x, p.y, p.z, null, 12), 'selector'); });
    UT.rotulo(ctx, 'CARGA', .7, .2, V(-3.2, .31, 1.05), [-Math.PI / 2, 0, 0], { size: 70 });
    UT.rotulo(ctx, 'DESCARGA', .9, .2, V(-1.6, .31, 1.05), [-Math.PI / 2, 0, 0], { size: 60 });
    const lamp = UT.bombilla(ctx, V(2.6, 0, 1.5), 'lampara', .7);

    // condensador electrolítico real (sin conectar)
    P(cyl(.6, 1.6, M(0x23407a, { roughness: .45 }), 4.4, .8, -1.4, null, 32), 'electrolitico');
    P(boxR(3.82, 4.0, .02, 1.58, -1.75, -1.05, M(0xbfc6cf)), 'electrolitico');
    P(cyl(.56, .03, al, 4.4, 1.61, -1.4, null, 32), 'electrolitico');
    P(boxR(4.0, 4.8, 1.625, 1.635, -1.43, -1.37, m.dark), 'electrolitico'); P(boxR(4.37, 4.43, 1.625, 1.635, -1.8, -1.0, m.dark), 'electrolitico');

    // cables
    const wBR = [V(-4.8, 1.7, -1.1), V(-4.6, .6, 0), V(-4.0, .4, .4)], wRC = [V(-3.1, .4, .4), V(-3.0, .38, .5), CONT.C];
    const wSA = [V(-2.4, .6, .6), V(-2.0, 1.6, .3), V(-1.4, 2.7, 0), V(-.82, 2.7, 0)];
    const wDL = [CONT.D, V(-.5, .25, 1.6), V(1.8, .25, 1.6), V(2.45, .15, 1.5)];
    const wLB = [V(2.75, .15, 1.5), V(3.2, .3, .6), V(2.0, 1.2, 0), V(1.4, 2.7, 0), V(.82, 2.7, 0)];
    const wBB = [V(-5.6, 1.7, -1.1), V(-5, .4, -2.2), V(1.5, .3, -2.2), V(2.4, 1.0, -1.0), V(1.45, 2.65, 0)];
    [[wBR, m.red], [wRC, m.steel], [wSA, m.red], [wDL, m.steel], [wLB, m.black], [wBB, m.black]].forEach(([w, mm]) => P(tube(w, .055, mm), 'cables'));

    // cargas en las placas y campo eléctrico
    const NQ = 60, grid = [];
    for (let i = 0; i < 10; i++) for (let j = 0; j < 6; j++) grid.push([1.45 + i * .28, -1.2 + j * .48]);
    grid.sort(() => Math.random() - .5);
    const qP = P(new T.InstancedMesh(new T.BoxGeometry(.04, .16, .16), M(0xd62828, { emissive: 0xd62828, emissiveIntensity: .5 }), NQ), 'armaduras');
    const qN = P(new T.InstancedMesh(new T.BoxGeometry(.04, .05, .16), M(0x1e63d6, { emissive: 0x1e63d6, emissiveIntensity: .5 }), NQ), 'armaduras');
    scene.add(qP); scene.add(qN);
    const d = new T.Object3D();
    const campo = [];
    for (const y of [1.7, 2.7, 3.7]) for (const z of [-.9, 0, .9]) campo.push(ctx.flow({ color: 0x2f8cff, size: .05, gap: .3 }).path([V(-.66, y, z), V(.66, y, z)]));
    const fA = ctx.flow({ color: 0xff5a1f, size: .065, gap: .26 }), fB = ctx.flow({ color: 0xff5a1f, size: .065, gap: .26 }), fD = ctx.flow({ color: 0xff5a1f, size: .07, gap: .26 });
    fA.path([...curva(wBR), V(-3.1, .4, .4), ...curva(wRC), V(-2.4, .5, .6), ...curva(wSA)]);
    fB.path([V(.82, 2.7, 0), V(1.45, 2.65, 0), ...curva(wBB).reverse()]);
    fD.path([...curva(wSA).reverse(), CONT.D, ...curva(wDL), V(2.6, .7, 1.5), ...curva(wLB)]);

    const $ = s => panel.querySelector(s);
    const msg = $('#msg'), graf = $('#graf'), r = { V: $('#rV'), I: $('#rI'), Q: $('#rQ'), E: $('#rE'), T: $('#rT') };
    let modo = 'A', Vc = 0, kAng = ANG.A, hist = [], tAcc = 0;
    UT.opciones($('#sel'), v => { modo = v; });
    const ciclo = () => { const sig = { A: 'C', C: 'D', D: 'A' }[modo]; panel.querySelector(`#sel [data-v="${sig}"]`).click(); };
    ctx.accion('selector', ciclo, { pista: 'Púlsalo en el modelo para girarlo: cargar, descargar, aislar.' });
    ctx.accion('pila', () => panel.querySelector('#sel [data-v="C"]').click(), { pista: 'Púlsala en el modelo para conectar el condensador a la pila.' });
    ctx.accion('lampara', () => panel.querySelector('#sel [data-v="D"]').click(), { pista: 'Púlsala en el modelo para descargar el condensador sobre ella.' });
    set(r.T, `${fmt(R * C, 1)} s · descarga ${fmt(RL * C, 2)} s`);

    return {
      update(dt) {
        let I = 0;
        if (modo === 'C') { I = (VB - Vc) / R; Vc += (VB - Vc) * (1 - Math.exp(-dt / (R * C))); }
        else if (modo === 'D') { I = -Vc / RL; Vc *= Math.exp(-dt / (RL * C)); }
        kAng += (ANG[modo] - kAng) * Math.min(1, dt * 12); knob.rotation.y = kAng;
        const nq = Math.round(Vc / VB * NQ);
        for (let i = 0; i < NQ; i++) {
          const [y, z] = grid[i], s = i < nq ? 1 : 0;
          d.scale.setScalar(s); d.position.set(-.67, y, z); d.updateMatrix(); qP.setMatrixAt(i, d.matrix);
          d.position.set(.67, y, z); d.updateMatrix(); qN.setMatrixAt(i, d.matrix);
        }
        qP.instanceMatrix.needsUpdate = qN.instanceMatrix.needsUpdate = true;
        campo.forEach(f => f.set(Vc > .2 ? Math.min(1, Vc / VB + .2) : 0, .25 + Vc / VB * .5));
        const ic = Math.abs(I);
        fA.set(modo === 'C' && ic > .0002 ? 1 : 0, .3 + ic / (VB / R) * 1.6); fB.set(modo === 'C' && ic > .0002 ? 1 : 0, .3 + ic / (VB / R) * 1.6);
        fD.set(modo === 'D' && ic > .0005 ? 1 : 0, .3 + ic / (VB / RL) * 2.2);
        lamp.setLuz(modo === 'D' ? Math.min(1, (ic / (VB / RL)) ** 2 * 1.6) : 0);

        tAcc += dt;
        if (tAcc > .1) { tAcc = 0; hist.push(Vc); if (hist.length > TMAX * 10) hist.shift();
          graf.setAttribute('points', hist.map((v, i) => (30 + (i + TMAX * 10 - hist.length) / (TMAX * 10) * 262).toFixed(1) + ',' + (104 - v / VB * 88).toFixed(1)).join(' ')); }

        ctx.step(Vc < .2 && modo !== 'C' ? 0 : modo === 'C' && Vc < 11.9 ? 1 : modo === 'D' ? 3 : 2);
        set(r.V, fmt(Vc, 2) + ' V', Vc > .2 ? 'ok' : '');
        set(r.I, (I >= 0 ? '' : '−') + fmt(ic * 1000, 1) + ' mA');
        set(r.Q, fmt(C * Vc * 1000, 1) + ' mC');
        set(r.E, fmt(.5 * C * Vc * Vc * 1000, 0) + ' mJ');
        const t = modo === 'C' && Vc < 11.9 ? 'Cargando: al principio la corriente es grande y va bajando a medida que sube la tensión. En 5 τ está prácticamente cargado.'
          : modo === 'C' ? 'Cargado: el condensador tiene la misma tensión que la pila y ya no circula corriente. Bloquea la continua.'
          : modo === 'A' && Vc > .2 ? 'Aislado: el condensador mantiene la carga y la tensión aunque se desconecte de la pila (por eso puede ser peligroso tocarlo).'
          : modo === 'D' && Vc > .2 ? 'Descargando por la lámpara: la energía almacenada se transforma en luz y calor hasta agotarse.' : '';
        set(msg, t); msg.hidden = !t;
      },
      labels: [
        { p: 'armaduras', txt: 'Armadura +', at: () => V(-.82, 4.2, -1.2), l: 1 },
        { p: 'armaduras', txt: 'Armadura −', at: () => V(.82, 4.2, -1.2) },
        { p: 'dielectrico', txt: 'Dieléctrico', at: () => V(0, 4.15, 1.45) },
        { p: 'pila', txt: 'Pila 12 V', at: () => V(-6.1, 1.6, -.4), l: 1 },
        { p: 'resistencia', txt: 'R 1 kΩ', at: () => V(-3.55, .65, .65), l: 1 },
        { p: 'selector', at: () => V(-2.4, .8, .9) },
        { p: 'lampara', txt: 'Lámpara', at: () => V(3.1, 1.0, 1.5) },
        { p: 'electrolitico', txt: 'Electrolítico real', at: () => V(5.0, 1.4, -1.4) }
      ]
    };
  }

  window.COMPONENTES.push({
    id: 'condensador', nombre: 'Condensador', categoria: 'Electrónica',
    resumen: 'Almacena carga entre dos placas separadas por un dieléctrico.',
    titulo: 'Condensador: un pequeño almacén de carga',
    lead: 'Pon el selector en Cargar y mira cómo se acumulan cargas en las placas y sube la tensión siguiendo una curva. Después aíslalo y descárgalo sobre la lámpara.',
    camara: { pos: [2.5, 6.5, 14.5], tgt: [-.4, 1.6, 0] }, suelo: -.32,
    panel: PANEL, build,
    leyenda: [['#ff5a1f', 'Corriente'], ['#d62828', 'Cargas positivas'], ['#1e63d6', 'Cargas negativas'], ['#2f8cff', 'Campo eléctrico']],
    pasos: [
      ['1. Descargado', 'Las dos placas (armaduras) tienen la misma carga y no hay tensión entre ellas.'],
      ['2. Carga', 'La pila saca electrones de una placa y los lleva a la otra a través del circuito. La corriente es máxima al principio y va bajando: la tensión sube siguiendo una curva exponencial.'],
      ['3. Cargado', 'Cuando la tensión del condensador iguala a la de la pila deja de circular corriente. Aislado, conserva la carga y la energía en el campo eléctrico del dieléctrico.'],
      ['4. Descarga', 'Al conectarlo a la lámpara, la carga vuelve por el circuito y la energía se gasta en ella. La tensión baja también de forma exponencial.']
    ],
    partes: {
      armaduras:     { t: 'Armaduras (placas)', d: 'Dos superficies conductoras enfrentadas. Al cargarse una queda con carga positiva y la otra con la misma carga negativa.' },
      dielectrico:   { t: 'Dieléctrico', d: 'Material aislante entre las placas (aire, papel, plástico, cerámica, óxido de aluminio...). Cuanto mejor dieléctrico, más capacidad.' },
      soportes:      { t: 'Soportes aislantes', d: 'Mantienen las placas separadas sin que se toquen.' },
      pila:          { t: 'Pila de 12 V', d: 'Fuente que carga el condensador.' },
      resistencia:   { t: 'Resistencia de 1 kΩ', d: 'Limita la corriente de carga y fija la constante de tiempo τ = R · C. Colores: marrón, negro, rojo (1 kΩ).' },
      selector:      { t: 'Selector', d: 'Conecta el condensador a la pila (carga), lo deja aislado o lo conecta a la lámpara (descarga).' },
      lampara:       { t: 'Lámpara', d: 'Consume la energía del condensador al descargarse.' },
      electrolitico: { t: 'Condensador electrolítico', d: 'Así es un condensador real de mucha capacidad: dos tiras de aluminio y papel enrolladas dentro de un bote. Tiene polaridad: la franja marca el negativo. Conectado al revés puede explotar.' },
      placa:         { t: 'Placa de montaje', d: 'Placa de pruebas.' },
      cables:        { t: 'Cables', d: 'Rojo: positivo. Negro: negativo.' }
    },
    extra: `
      <div class="two">
        <div>
          <h2>Fórmulas</h2>
          <p><b>Capacidad</b>: C = Q / V, en faradios (F). Lo habitual son µF, nF y pF. Aquí C = 4700 µF.</p>
          <p><b>Constante de tiempo</b>: τ = R · C. En un τ se carga al 63 %; en 5 τ se considera cargado del todo.</p>
          <p><b>Energía</b>: E = ½ · C · V².</p>
          <p>En continua, una vez cargado no deja pasar corriente; en alterna sí, porque se carga y descarga continuamente. Por eso se usa para filtrar fuentes, arrancar motores monofásicos, compensar el factor de potencia y en temporizadores.</p>
        </div>
        <div>
          <h2>Tipos</h2>
          <table><tbody>
            <tr><td>Cerámico</td><td>pF a µF, sin polaridad, alta frecuencia</td></tr>
            <tr><td>Poliéster / polipropileno</td><td>nF a µF, sin polaridad; arranque de motores</td></tr>
            <tr><td>Electrolítico</td><td>µF a mF, con polaridad, filtrado de fuentes</td></tr>
            <tr><td>Supercondensador</td><td>Faradios, almacenamiento de energía</td></tr>
          </tbody></table>
        </div>
      </div>`
  });
})();
