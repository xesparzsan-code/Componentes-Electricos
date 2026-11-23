// Componente: transformador monofásico de dos columnas alimentando una lámpara
(() => {
  const { set, fmt } = UT;
  const REL = { '24': [1150, 120, 24], '12': [1150, 60, 12], '115': [1150, 575, 115] };
  const P_LAMP = 24, V1 = 230;

  const PANEL = `
    <button class="big" id="s1" aria-pressed="false">Conectar a la red</button>
    <div><h3>Tipo de alimentación</h3><div class="row" id="tipo"><button class="sm" data-v="ac" aria-pressed="true">Alterna 230 V~</button><button class="sm" data-v="dc" aria-pressed="false">Continua 230 V</button></div></div>
    <div><h3>Transformador</h3><div class="row" id="rel"><button class="sm" data-v="24" aria-pressed="true">230 / 24 V</button><button class="sm" data-v="12" aria-pressed="false">230 / 12 V</button><button class="sm" data-v="115" aria-pressed="false">230 / 115 V</button></div></div>
    <div class="chk"><label><input type="checkbox" id="cCarga" checked> Lámpara conectada al secundario</label></div>
    <p class="msg" id="msg" hidden></p>
    ${UT.dl([['rN', 'Espiras N1 : N2', ''], ['rV1', 'Tensión primario V1', '0 V'], ['rV2', 'Tensión secundario V2', '0 V'], ['rI2', 'Corriente secundario I2', '0 A'], ['rI1', 'Corriente primario I1', '0 A']])}
    <svg class="sch" viewBox="0 0 300 126" aria-label="Esquema: fuente conectada al primario, núcleo, secundario conectado a una lámpara">
      <circle cx="30" cy="65" r="16"/><text id="sSrc" x="23" y="70">~</text>
      <line x1="30" y1="49" x2="30" y2="25"/><line x1="30" y1="25" x2="100" y2="25"/><line x1="100" y1="25" x2="100" y2="40"/>
      <path d="M100 40 a8 6 0 0 1 0 12 a8 6 0 0 1 0 12 a8 6 0 0 1 0 12 a8 6 0 0 1 0 12"/>
      <line x1="100" y1="88" x2="100" y2="105"/><line x1="100" y1="105" x2="30" y2="105"/><line x1="30" y1="105" x2="30" y2="81"/>
      <line x1="117" y1="34" x2="117" y2="96"/><line x1="123" y1="34" x2="123" y2="96"/>
      <path d="M140 40 a8 6 0 0 0 0 12 a8 6 0 0 0 0 12 a8 6 0 0 0 0 12 a8 6 0 0 0 0 12"/>
      <line x1="140" y1="40" x2="140" y2="25"/><line x1="140" y1="25" x2="230" y2="25"/><line x1="230" y1="25" x2="230" y2="53"/>
      <circle id="h1" cx="230" cy="65" r="12"/><path d="M221.5 56.5l17 17M238.5 56.5l-17 17"/>
      <line x1="230" y1="77" x2="230" y2="105"/><line x1="230" y1="105" x2="140" y2="105"/><line x1="140" y1="105" x2="140" y2="88"/>
      <text x="74" y="70">N1</text><text x="152" y="70">N2</text><text x="40" y="20">V1</text><text x="182" y="20">V2</text>
      <path id="f1" class="flow fl" d="M30 49 V25 H100 V105 H30 V81"/><path id="f2" class="flow fl" d="M140 25 H230 V105 H140 Z"/>
      <rect class="hit" id="hR" x="10" y="45" width="40" height="40" rx="20"/><rect class="hit" id="hL" x="214" y="49" width="32" height="32" rx="16"/>
    </svg>
    <p class="nota-sch">En el esquema: pulsa la fuente para conectar o desconectar la red y la lámpara para conectarla o quitarla.</p>`;

  function build(ctx, panel) {
    const { T, V, scene, M, boxR, cyl, tube, curva, espiral, part: P } = ctx;
    const m = UT.mats(ctx), lam = UT.laminado(ctx, 10);

    P(boxR(-6.4, 6.6, -.3, 0, -2, 2, M(0x3d342c, { roughness: .8 })), 'base');
    P(boxR(-2.7, 2.7, 0, .45, -.9, .9, m.steel), 'soporte');
    // núcleo de chapas
    P(boxR(-2.4, -1.4, .5, 4.9, -.6, .6, lam), 'nucleo'); P(boxR(1.4, 2.4, .5, 4.9, -.6, .6, lam), 'nucleo');
    P(boxR(-1.4, 1.4, 3.9, 4.9, -.6, .6, lam), 'nucleo'); P(boxR(-1.4, 1.4, .5, 1.5, -.6, .6, lam), 'nucleo');
    // bobinados
    const w1 = P(cyl(.95, 2.2, m.wind, -1.9, 2.7, 0, null, 40), 'primario');
    const w2 = P(cyl(.95, 2.2, m.wind2, 1.9, 2.7, 0, null, 40), 'secundario');
    for (const [x, id] of [[-1.9, 'primario'], [1.9, 'secundario']]) { P(cyl(1.02, .07, m.dark, x, 1.58, 0, null, 40), id); P(cyl(1.02, .07, m.dark, x, 3.82, 0, null, 40), id); }
    UT.rotulo(ctx, 'N1', .5, .3, V(-1.9, 2.7, .96), [0, 0, 0], { color: '#fff' });
    UT.rotulo(ctx, 'N2', .5, .3, V(1.9, 2.7, .96), [0, 0, 0], { color: '#fff' });
    // regletas
    for (const [x, id] of [[-3.4, 'regletaP'], [3.4, 'regletaS']]) {
      P(boxR(x - .4, x + .4, 0, .8, -.8, .8, m.plastic), id);
      for (const z of [-.4, .4]) UT.tornillo(ctx, x, .85, z, m.steel, m.black, id, true);
    }
    const lP1 = [V(-1.65, 3.75, .9), V(-2.9, 2.4, 1.0), V(-3.4, .9, .4)], lP2 = [V(-1.65, 1.65, .9), V(-2.8, 1.2, .2), V(-3.4, .9, -.4)];
    const lS1 = [V(1.65, 3.75, .9), V(2.9, 2.4, 1.0), V(3.4, .9, .4)], lS2 = [V(1.65, 1.65, .9), V(2.8, 1.2, .2), V(3.4, .9, -.4)];
    [lP1, lP2].forEach(c => P(tube(c, .045, m.copper), 'primario')); [lS1, lS2].forEach(c => P(tube(c, .06, m.copper), 'secundario'));
    // fuente y lámpara
    P(boxR(-5.9, -4.7, 0, 1.7, -.8, .8, m.dark), 'red');
    const rotRed = UT.rotulo(ctx, [['RED', 56], ['230 V~', 44]], 1.0, .7, V(-5.3, 1.1, .81), [0, 0, 0], { color: '#e9e8e3' });
    const wP1 = [V(-4.7, 1.0, .4), V(-4.1, 1.15, .4), V(-3.4, .9, .4)], wP2 = [V(-3.4, .9, -.4), V(-4.1, 1.15, -.4), V(-4.7, 1.0, -.4)];
    const wS1 = [V(3.4, .9, .4), V(4.3, 1.05, .4), V(5.3, .25, .12)], wS2 = [V(5.3, .25, -.12), V(4.3, 1.05, -.4), V(3.4, .9, -.4)];
    P(tube(wP1, .08, m.brown), 'cables'); P(tube(wP2, .08, m.blue), 'cables'); P(tube(wS1, .08, m.red), 'cables'); P(tube(wS2, .08, m.black), 'cables');
    const lamp = UT.bombilla(ctx, V(5.3, 0, 0), 'lampara', 1);

    // corrientes y flujo
    const f1 = ctx.flow({ color: 0xff5a1f, size: .065, gap: .26 }), f2 = ctx.flow({ color: 0xffc400, size: .075, gap: .3 }), fF = ctx.flow({ color: 0x2f8cff, size: .08, gap: .3 });
    f1.path([...curva(wP1), ...curva(lP1).reverse(), ...espiral(-1.9, 0, 1.0, 3.7, 1.7, .35, .35 + Math.PI * 16), ...curva(lP2), ...curva(wP2)]);
    f2.path([...curva(wS2), ...curva(lS2).reverse(), ...espiral(1.9, 0, 1.0, 1.7, 3.7, Math.PI - .35, Math.PI - .35 - Math.PI * 10), ...curva(lS1), ...curva(wS1), V(5.3, .9, 0), V(5.3, .25, -.12)]);
    fF.path([V(-1.9, 1.0, .62), V(-1.9, 4.4, .62), V(1.9, 4.4, .62), V(1.9, 1.0, .62), V(-1.9, 1.0, .62)]);

    const $ = s => panel.querySelector(s);
    const s1B = $('#s1'), cCarga = $('#cCarga'), msg = $('#msg');
    const r = { N: $('#rN'), V1: $('#rV1'), V2: $('#rV2'), I2: $('#rI2'), I1: $('#rI1') }, s = { src: $('#sSrc'), h1: $('#h1'), f1: $('#f1'), f2: $('#f2') };
    let on = false, ac = true, rel = '24', fase = 0, phi = 0, pulso = 0, sg1 = 0, sg2 = 0;
    s1B.onclick = () => { on = !on; s1B.setAttribute('aria-pressed', on); s1B.textContent = on ? 'Desconectar de la red' : 'Conectar a la red'; };
    const lampClic = () => { cCarga.checked = !cCarga.checked; };
    UT.hit(panel, '#hR', () => s1B.onclick(), false, 'Red: conectar o desconectar');
    UT.hit(panel, '#hL', lampClic, false, 'Lámpara: conectar o quitar');
    ctx.accion('red', () => s1B.onclick(), { pista: 'Púlsala en el modelo para conectar o desconectar el transformador.' });
    ctx.accion('lampara', lampClic, { pista: 'Púlsala en el modelo para conectarla o quitarla del secundario.' });
    UT.opciones($('#tipo'), v => { ac = v === 'ac'; rotRed.material.map = ctx.texto([['RED', 56], [ac ? '230 V~' : '230 V =', 44]], { w: 256, h: 180, size: 60, color: '#e9e8e3' }); rotRed.material.needsUpdate = true; });
    UT.opciones($('#rel'), v => { rel = v; });

    return {
      tecla: () => s1B.onclick(),
      update(dt) {
        const [N1, N2, V2n] = REL[rel], carga = cCarga.checked;
        fase += dt * Math.PI * 2 * .55;
        // flujo: en alterna sigue a la tensión; en continua sube y se queda fijo
        const objetivo = on ? (ac ? Math.sin(fase) : 1) : 0;
        const phiAnt = phi;
        phi = ac && on ? objetivo : phi + (objetivo - phi) * Math.min(1, dt * 5);
        const dphi = (phi - phiAnt) / Math.max(dt, 1e-4) / (Math.PI * 2 * .55);   // derivada normalizada (±1 en alterna)
        const emf = on || Math.abs(dphi) > .02 ? -dphi : 0;
        pulso = ac ? 0 : Math.min(1, Math.abs(dphi));
        const V2 = on && ac ? V1 * N2 / N1 : 0, R = V2n * V2n / P_LAMP;
        const I2 = carga ? V2 / R : 0, I1 = I2 * N2 / N1;

        w1.material.emissiveIntensity = on && !ac ? .45 : 0;
        lamp.setLuz(carga ? (on && ac ? Math.min(1, (V2 / V2n) ** 2) : pulso) : 0);
        const vel1 = on ? (ac ? Math.cos(fase) * 1.6 : 2.2) : 0;
        f1.set(on ? 1 : 0, vel1);
        const sec = carga ? (ac ? emf * 1.6 : emf * 2.2) : 0;
        f2.set(carga && Math.abs(emf) > .03 ? 1 : 0, sec);
        fF.set(Math.min(1, Math.abs(phi) + (on ? .25 : 0)) * (on || Math.abs(phi) > .02 ? 1 : 0), ac && on ? Math.cos(fase) * 1.4 : dphi * 1.4);

        ctx.step(on && ac && carga ? 2 : on && ac ? 1 : on ? 3 : 0);
        set(r.N, N1 + ' : ' + N2 + '  (m = ' + fmt(N1 / N2, 1) + ')');
        set(r.V1, on ? (ac ? '230 V~' : '230 V =') : '0 V', on ? 'on' : '');
        set(r.V2, ac ? fmt(V2, 1) + ' V~' : (pulso > .05 ? 'pico al conectar' : '0 V'), V2 > 0 ? 'ok' : '');
        set(r.I2, fmt(I2, 2) + ' A');
        set(r.I1, on && !ac ? 'muy alta (sin límite)' : fmt(I1, 3) + ' A', on && !ac ? 'on' : '');
        const t = on && !ac ? 'Con continua el flujo no varía: solo aparece tensión en el secundario un instante al conectar o desconectar. Además el primario solo tiene la resistencia del hilo, así que la corriente sería enorme y lo quemaría.'
          : on && ac && carga ? `V2 = V1 · N2 / N1 = 230 · ${N2} / ${N1} ≈ ${fmt(V2, 1)} V. La potencia se conserva: I1 = I2 · N2 / N1.`
          : on && ac ? 'Sin carga solo circula por el primario la pequeña corriente que magnetiza el núcleo.' : '';
        set(msg, t); msg.hidden = !t;
        s.src.textContent = ac ? '~' : '=';
        UT.lit(s.h1, carga && on && ac, '#ffc04a');
        s.f1.classList.toggle('live', on); s.f2.classList.toggle('live', carga && on && ac);
        const a1 = vel1 >= 0 ? 'normal' : 'reverse', a2 = sec >= 0 ? 'normal' : 'reverse';
        if (a1 !== sg1) { s.f1.style.animationDirection = a1; sg1 = a1; } if (a2 !== sg2) { s.f2.style.animationDirection = a2; sg2 = a2; }
      },
      labels: [
        { p: 'primario', txt: 'Bobinado primario', at: () => V(-2.85, 3.3, .3), l: 1 },
        { p: 'secundario', txt: 'Bobinado secundario', at: () => V(2.85, 3.3, .3) },
        { p: 'nucleo', txt: 'Núcleo de chapas', at: () => V(0, 4.9, .6) },
        { p: 'regletaP', txt: 'Bornes primario', at: () => V(-3.8, .4, .8), l: 1 },
        { p: 'regletaS', txt: 'Bornes secundario', at: () => V(3.8, .4, .8) },
        { p: 'red', txt: 'Red', at: () => V(-5.9, 1.6, .8), l: 1 },
        { p: 'lampara', txt: 'Lámpara', at: () => V(5.95, 1.0, 0) }
      ]
    };
  }

  window.COMPONENTES.push({
    id: 'transformador', nombre: 'Transformador', categoria: 'Máquinas',
    resumen: 'Cambia la tensión alterna mediante inducción entre dos bobinados.',
    titulo: 'Transformador: cambia la tensión sin piezas que se muevan',
    lead: 'Conecta la red y sigue el flujo magnético por el núcleo: induce en el secundario una tensión proporcional al número de espiras. Prueba también con continua.',
    camara: { pos: [3, 6.5, 13], tgt: [0, 2.0, 0] }, suelo: -.32,
    panel: PANEL, build,
    leyenda: [['#ff5a1f', 'Corriente del primario'], ['#ffc400', 'Corriente del secundario'], ['#2f8cff', 'Flujo magnético']],
    pasos: [
      ['1. Corriente alterna en el primario', 'La tensión de la red hace circular por el primario una corriente que cambia de sentido continuamente (50 veces por segundo; aquí más despacio).'],
      ['2. Flujo variable en el núcleo', 'Esa corriente crea un flujo magnético que recorre el núcleo de chapas y también cambia de sentido. El núcleo lo lleva casi entero hasta el secundario.'],
      ['3. Tensión inducida en el secundario', 'El flujo variable induce en cada espira la misma tensión. Por eso V2 / V1 = N2 / N1. Si se conecta una carga circula I2, y el primario toma más corriente para aportar esa potencia.'],
      ['4. Con continua no funciona', 'Si el flujo no varía no se induce nada: solo hay un pico al conectar o desconectar. Y el primario, sin la oposición que le da la alterna, se quemaría.']
    ],
    partes: {
      nucleo:     { t: 'Núcleo de chapas', d: 'Hierro al silicio en chapas finas aisladas entre sí. Conduce el flujo de un bobinado a otro y, al estar laminado, reduce las pérdidas por corrientes de Foucault.' },
      primario:   { t: 'Bobinado primario', d: 'El que se conecta a la red. Tiene muchas espiras (N1) de hilo fino.' },
      secundario: { t: 'Bobinado secundario', d: 'El que alimenta la carga. En un reductor tiene menos espiras (N2) pero de hilo más grueso, porque lleva más corriente.' },
      soporte:    { t: 'Soporte', d: 'Escuadras metálicas que aprietan las chapas y fijan el transformador.' },
      regletaP:   { t: 'Bornes del primario', d: 'Entrada de la red (230 V).' },
      regletaS:   { t: 'Bornes del secundario', d: 'Salida a la tensión reducida.' },
      red:        { t: 'Red eléctrica', d: 'Fuente de 230 V. Se puede cambiar a continua para ver por qué no funciona.' },
      lampara:    { t: 'Lámpara', d: 'Carga de 24 W preparada para la tensión del secundario.' },
      base:       { t: 'Base', d: 'Tablero de montaje.' },
      cables:     { t: 'Cables', d: 'Marrón y azul: red. Rojo y negro: secundario.' }
    },
    extra: `
      <div class="two">
        <div>
          <h2>Las fórmulas</h2>
          <p><b>Relación de transformación</b>: m = N1 / N2 = V1 / V2 = I2 / I1.</p>
          <p>Un transformador ideal no pierde potencia: V1 · I1 = V2 · I2. Si baja la tensión, sube la corriente en la misma proporción. Los reales tienen un rendimiento del 95 al 99 %.</p>
          <p>La potencia de un transformador se da en <b>VA</b> (voltamperios), porque no depende del tipo de carga.</p>
          <p class="note">En la simulación la alterna va mucho más despacio que 50 Hz para poder ver cómo cambia de sentido.</p>
        </div>
        <div>
          <h2>Usos habituales</h2>
          <table><tbody>
            <tr><td>230 / 24 V</td><td>Mando de cuadros, timbres, iluminación de seguridad</td></tr>
            <tr><td>230 / 12 V</td><td>Iluminación de baja tensión, cargadores</td></tr>
            <tr><td>230 / 115 V</td><td>Aparatos fabricados para otros países</td></tr>
            <tr><td>Alta / baja</td><td>Centros de transformación de la red eléctrica</td></tr>
          </tbody></table>
        </div>
      </div>`
  });
})();
