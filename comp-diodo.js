// Componente: diodo rectificador con una ampliación de la unión PN (portadores y zona de agotamiento)
(() => {
  const { set, fmt } = UT;
  const R = 220;
  const corriente = V => Math.max(0, (V - .65) / R);
  const vDiodo = (V, I) => I > 0 ? .65 + .025 * Math.log(1 + I * 1000) : V;

  const PANEL = `
    <label class="sp"><span>Tensión de la fuente</span><input type="range" id="volt" min="-5" max="5" step="0.05" value="0"><b id="voltV">0,00 V</b></label>
    <div class="row"><button class="sm" data-u="-5">−5 V inversa</button><button class="sm" data-u="0.5">0,5 V</button><button class="sm" data-u="3">3 V directa</button></div>
    <p class="msg" id="msg" hidden></p>
    ${UT.dl([['rV', 'Tensión en el diodo', '0,00 V'], ['rI', 'Corriente', '0 mA'], ['rE', 'Estado', 'sin polarizar']])}
    <svg class="sch" viewBox="0 0 300 122" aria-label="Circuito con fuente, resistencia de 220 ohmios y diodo; y curva característica corriente-tensión del diodo con el punto de trabajo">
      <circle cx="25" cy="60" r="14"/><text id="sP1" x="34" y="48">+</text><text id="sP2" x="34" y="82">−</text>
      <line x1="25" y1="46" x2="25" y2="20"/><line x1="25" y1="20" x2="55" y2="20"/><rect x="55" y="14" width="30" height="12"/><text x="52" y="40">220 Ω</text>
      <line x1="85" y1="20" x2="110" y2="20"/><line x1="110" y1="20" x2="110" y2="42"/>
      <polygon points="100,42 120,42 110,58" style="fill:var(--ink)"/><line x1="99" y1="58" x2="121" y2="58"/>
      <line x1="110" y1="58" x2="110" y2="100"/><line x1="110" y1="100" x2="25" y2="100"/><line x1="25" y1="100" x2="25" y2="74"/>
      <path id="fC" class="flow fl" d="M25 46 V20 H110 V100 H25 V74"/>
      <line x1="135" y1="105" x2="296" y2="105" class="thin"/><line x1="268" y1="8" x2="268" y2="112" class="thin"/>
      <text x="282" y="118">V</text><text x="272" y="16">I</text><text x="136" y="118">−5 V</text><text x="258" y="118">0</text><text x="226" y="58">0,7 V</text>
      <path id="curva" class="curva" d=""/><circle id="pto" cx="268" cy="105" r="4.5" class="fill"/>
      <rect class="hit" id="hF" x="8" y="44" width="36" height="34" rx="17"/>
    </svg>
    <p class="nota-sch">Pulsa la fuente del esquema (o la del modelo) para invertir su polaridad.</p>`;

  function build(ctx, panel) {
    const { T, V, scene, M, boxR, cyl, tube, curva, part: P } = ctx;
    const m = UT.mats(ctx);
    const ejeX = o => { o.rotation.z = Math.PI / 2; return o; };

    // placa, fuente, resistencia y diodo
    P(boxR(-6, 6, -.3, 0, -3, 3, M(0xf1f1ec, { roughness: .9 })), 'placa');
    P(boxR(-5.8, -3.8, 0, 1.6, -1.6, .6, m.dark), 'fuente');
    UT.rotulo(ctx, [['FUENTE', 50], ['±5 V', 44]], 1.4, .7, V(-4.8, .9, .61), [0, 0, 0], { color: '#e9e8e3' });
    P(cyl(.16, .3, m.red, -4.3, 1.75, .2, null, 16), 'fuente'); P(cyl(.16, .3, m.black, -5.3, 1.75, .2, null, 16), 'fuente');
    const rotP = UT.rotulo(ctx, '+', .3, .3, V(-4.3, 1.92, .2), [-Math.PI / 2, 0, 0], { color: '#fff', size: 120 });
    const rotN = UT.rotulo(ctx, '−', .3, .3, V(-5.3, 1.92, .2), [-Math.PI / 2, 0, 0], { color: '#fff', size: 120 });
    ejeX(P(cyl(.25, 1.0, M(0xd9c08f, { roughness: .6 }), -2.9, .45, 1.2, null, 20), 'resistencia'));
    [[-3.25, 0xc62828], [-3.05, 0xc62828], [-2.85, 0x6b3e1e], [-2.55, 0xd4af37]].forEach(([x, c]) => ejeX(P(cyl(.26, .08, M(c), x, .45, 1.2, null, 20), 'resistencia')));
    ejeX(P(cyl(.45, 2.0, M(0x1d1f24, { roughness: .4 }), 0, .6, 1.2, null, 28), 'diodo'));
    ejeX(P(cyl(.46, .28, m.silver, .72, .6, 1.2, null, 28), 'banda'));
    UT.rotulo(ctx, '1N4007', 1.0, .22, V(-.25, 1.06, 1.2), [-Math.PI / 2, 0, 0], { color: '#cfd3d8' });
    const lA = [V(-1.0, .6, 1.2), V(-1.9, .6, 1.2), V(-2.4, .45, 1.2)], lK = [V(1.0, .6, 1.2), V(2.1, .6, 1.2), V(2.4, .05, 1.2)];
    P(tube(lA, .05, m.steel), 'diodo'); P(tube(lK, .05, m.steel), 'diodo');
    const w1 = [V(-4.3, 1.7, .2), V(-4.0, .8, 1.0), V(-3.4, .45, 1.2)], w2 = [V(2.4, .05, 1.2), V(3.3, .2, .2), V(2.0, .2, -1.8), V(-3.5, .25, -1.8), V(-5.3, 1.7, .2)];
    P(tube(w1, .07, m.red), 'cables'); P(tube(w2, .07, m.black), 'cables');

    // ampliación de la unión PN
    const CY = 4.4, HX = 3;
    const vid = (c, x0, x1) => { const b = P(boxR(x0, x1, CY - 1, CY + 1, -1, 1, new T.MeshPhysicalMaterial({ color: c, transparent: true, opacity: .16, roughness: .2, depthWrite: false })), 'cristal'); b.renderOrder = 2; return b; };
    vid(0xff8a80, -HX, 0); vid(0x82b1ff, 0, HX);
    const zona = P(boxR(-.5, .5, CY - 1.01, CY + 1.01, -1.01, 1.01, new T.MeshPhysicalMaterial({ color: 0x9aa1a8, transparent: true, opacity: .32, depthWrite: false })), 'zona');
    zona.renderOrder = 2;
    P(boxR(-HX - .1, -HX, CY - 1, CY + 1, -1, 1, m.silver), 'cristal'); P(boxR(HX, HX + .1, CY - 1, CY + 1, -1, 1, m.silver), 'cristal');
    UT.rotulo(ctx, 'P · ánodo', 1.8, .4, V(-1.6, CY + 1.25, 0), [0, 0, 0], { color: '#c1121f', size: 70 });
    UT.rotulo(ctx, 'N · cátodo', 1.8, .4, V(1.6, CY + 1.25, 0), [0, 0, 0], { color: '#0b4f8a', size: 70 });
    { const g = new T.BufferGeometry().setFromPoints([V(-.3, 1.05, 1.2), V(-HX, CY - 1, 1), V(.3, 1.05, 1.2), V(HX, CY - 1, 1)]);
      const l = new T.LineSegments(g, new T.LineDashedMaterial({ color: 0x8a94a6, dashSize: .15, gapSize: .12 })); l.computeLineDistances(); scene.add(l); }
    P(tube([V(-HX - .05, CY, 0), V(-HX - .8, CY - 1.6, .6), V(-1.0, .6, 1.2)], .03, m.steel), 'cristal');

    // portadores: electrones (N) y huecos (P), e iones fijos en la zona de agotamiento
    const NE = 70, d = new T.Object3D();
    const el = P(new T.InstancedMesh(new T.SphereGeometry(.09, 10, 8), M(0x1e63d6, { emissive: 0x1e63d6, emissiveIntensity: .4 }), NE), 'portadores');
    const hu = P(new T.InstancedMesh(new T.TorusGeometry(.08, .028, 6, 14), M(0xd62828, { emissive: 0xd62828, emissiveIntensity: .4 }), NE), 'portadores');
    scene.add(el); scene.add(hu);
    const rnd = (a, b) => a + Math.random() * (b - a);
    const E = Array.from({ length: NE }, () => ({ x: rnd(.6, HX - .1), y: rnd(-.85, .85), z: rnd(-.85, .85), k: rnd(.2, 2.6) }));
    const Hh = Array.from({ length: NE }, () => ({ x: rnd(-HX + .1, -.6), y: rnd(-.85, .85), z: rnd(-.85, .85), k: rnd(.2, 2.6) }));
    const ionP = [], ionN = [];
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 3; k++) {
      ionN.push(V(-.12 - i * .24, CY - .75 + j * .5, -.6 + k * .6)); ionP.push(V(.12 + i * .24, CY - .75 + j * .5, -.6 + k * .6));
    }
    const ioN = P(new T.InstancedMesh(new T.BoxGeometry(.1, .03, .03), M(0x1e63d6), ionN.length), 'zona');
    const ioP = P(new T.InstancedMesh(new T.BoxGeometry(.1, .1, .03), M(0xd62828), ionP.length), 'zona');
    scene.add(ioN); scene.add(ioP);
    const fC = ctx.flow({ color: 0xff5a1f, size: .07, gap: .28 });
    fC.path([...curva(w1), V(-3.4, .45, 1.2), V(-2.4, .45, 1.2), ...curva(lA), V(1.0, .6, 1.2), ...curva(lK), ...curva(w2)]);

    // curva característica en el SVG
    const $ = s => panel.querySelector(s);
    const sx = v => 135 + (v + 5) / 6 * 160, sy = i => 105 - Math.min(1, i * 1000 / 25) * 95;
    { let dd = ''; for (let v = -5; v <= .99; v += .02) { const vv = Math.min(v, .95); const I = vv < .65 ? 0 : (Math.exp((vv - .65) / .025) - 1) / 1000; dd += (dd ? ' L' : 'M') + sx(vv).toFixed(1) + ' ' + sy(I).toFixed(1); } $('#curva').setAttribute('d', dd); }
    const volt = $('#volt'), voltV = $('#voltV'), msg = $('#msg'), r = { V: $('#rV'), I: $('#rI'), E: $('#rE') }, pto = $('#pto'), fS = $('#fC');
    let Vf = 0, w = .5;
    const setV = v => { Vf = v; volt.value = v; voltV.textContent = fmt(v, 2) + ' V'; };
    volt.oninput = () => setV(+volt.value);
    const invertir = () => setV(Math.abs(Vf) < .05 ? 3 : -Vf);
    UT.hit(panel, '#hF', invertir, false, 'Fuente: invertir la polaridad');
    ctx.accion('fuente', invertir, { pista: 'Púlsala en el modelo para invertir la polaridad.' });
    panel.querySelectorAll('[data-u]').forEach(b => b.onclick = () => setV(+b.dataset.u));

    return {
      update(dt) {
        const I = corriente(Vf), Vd = vDiodo(Vf, I);
        const wT = .5 * Math.sqrt(Math.max(.03, (.7 - Vd) / .7));
        w += (wT - w) * Math.min(1, dt * 4);
        zona.scale.x = w * 2; zona.position.x = 0;
        const cond = I > 0, v = Math.min(2.5, .5 + I * 1000 / 8);
        E.forEach((p, i) => {
          if (cond) { p.x -= v * dt; if (p.x < -p.k) { p.x = HX - .05; p.y = rnd(-.85, .85); p.z = rnd(-.85, .85); } }
          else if (p.x < w + .05) p.x += (w + .1 + Math.random() * .2 - p.x) * Math.min(1, dt * 3);
          d.position.set(p.x, CY + p.y, p.z); d.scale.setScalar(1); d.updateMatrix(); el.setMatrixAt(i, d.matrix);
        });
        Hh.forEach((p, i) => {
          if (cond) { p.x += v * dt; if (p.x > p.k) { p.x = -HX + .05; p.y = rnd(-.85, .85); p.z = rnd(-.85, .85); } }
          else if (p.x > -w - .05) p.x += (-w - .1 - Math.random() * .2 - p.x) * Math.min(1, dt * 3);
          d.position.set(p.x, CY + p.y, p.z); d.rotation.set(0, Math.PI / 2, 0); d.updateMatrix(); hu.setMatrixAt(i, d.matrix); d.rotation.set(0, 0, 0);
        });
        el.instanceMatrix.needsUpdate = hu.instanceMatrix.needsUpdate = true;
        [[ioN, ionN], [ioP, ionP]].forEach(([im, arr]) => { arr.forEach((p, i) => { d.position.copy(p); d.scale.setScalar(Math.abs(p.x) < w ? 1 : 0); d.updateMatrix(); im.setMatrixAt(i, d.matrix); }); im.instanceMatrix.needsUpdate = true; });
        fC.set(cond ? 1 : 0, .5 + I * 1000 / 10);

        const st = Vf < -.05 ? 3 : cond ? 2 : Vf > .05 ? 1 : 0;
        ctx.step(st);
        set(r.V, fmt(Vd, 2) + ' V');
        set(r.I, cond ? fmt(I * 1000, 1) + ' mA' : Vf < 0 ? '≈ 0 (fuga de nA)' : '≈ 0', cond ? 'ok' : '');
        set(r.E, ['sin polarizar', 'directa, sin conducir', 'conduce', 'inversa: bloquea'][st], cond ? 'ok' : st === 3 ? 'on' : '');
        const t = st === 1 ? 'Polarización directa, pero por debajo de unos 0,7 V los portadores todavía no tienen energía para cruzar la zona de agotamiento.'
          : st === 2 ? `Conduce: el diodo se queda con unos ${fmt(Vd, 2)} V y la resistencia limita la corriente a ${fmt(I * 1000, 1)} mA. Sin resistencia la corriente subiría hasta quemarlo.`
          : st === 3 ? 'Inversa: la fuente aleja electrones y huecos de la unión, la zona de agotamiento se ensancha y no pasa corriente.' : '';
        set(msg, t); msg.hidden = !t;
        pto.setAttribute('cx', sx(Math.max(-5, Math.min(.98, Vd))).toFixed(1)); pto.setAttribute('cy', sy(I).toFixed(1));
        fS.classList.toggle('live', cond);
      },
      labels: [
        { p: 'diodo', txt: 'Diodo 1N4007', at: () => V(-.6, 1.05, 1.5), l: 1 },
        { p: 'banda', txt: 'Banda: cátodo', at: () => V(.85, 1.0, 1.5) },
        { p: 'resistencia', txt: 'Resistencia 220 Ω', at: () => V(-3.0, .7, 1.45), l: 1 },
        { p: 'fuente', at: () => V(-5.8, 1.6, .6), l: 1 },
        { p: 'zona', txt: 'Zona de agotamiento', at: () => V(0, CY - 1.0, 1.0) },
        { p: 'portadores', txt: 'Electrones (N)', at: () => V(HX, CY + .5, 1.0) },
        { p: 'portadores', txt: 'Huecos (P)', at: () => V(-HX, CY + .5, 1.0), l: 1 }
      ]
    };
  }

  window.COMPONENTES.push({
    id: 'diodo', nombre: 'Diodo', categoria: 'Electrónica',
    resumen: 'Deja pasar la corriente en un solo sentido.',
    titulo: 'Diodo: una válvula de un solo sentido',
    lead: 'Mueve la tensión de la fuente. Arriba ves la unión PN ampliada: en directa, a partir de unos 0,7 V, electrones y huecos cruzan la unión; en inversa la zona de agotamiento se ensancha y bloquea.',
    camara: { pos: [1.5, 7, 15.5], tgt: [-.8, 2.3, 0] }, suelo: -.32,
    panel: PANEL, build,
    leyenda: [['#ff5a1f', 'Corriente en el circuito'], ['#1e63d6', 'Electrones'], ['#d62828', 'Huecos']],
    pasos: [
      ['1. Sin tensión', 'En la unión los electrones de la zona N y los huecos de la P se han recombinado y dejan una zona de agotamiento sin portadores, con iones fijos que forman una barrera.'],
      ['2. Directa por debajo de 0,7 V', 'El ánodo (P) es positivo respecto al cátodo (N). La barrera se estrecha, pero aún es demasiado alta: casi no hay corriente.'],
      ['3. Directa: conduce', 'Superada la tensión umbral (unos 0,7 V en silicio) los portadores cruzan la unión y circula corriente. La resistencia limita su valor.'],
      ['4. Inversa: bloquea', 'Con el cátodo positivo, los portadores se alejan de la unión, la zona de agotamiento se ensancha y solo pasa una fuga minúscula. Si la tensión inversa es excesiva el diodo se rompe.']
    ],
    partes: {
      diodo:       { t: 'Diodo rectificador 1N4007', d: 'Cuerpo de resina con el cristal de silicio dentro. Aguanta 1 A en directa y hasta 1000 V en inversa.' },
      banda:       { t: 'Banda del cátodo', d: 'La raya plateada marca el cátodo (K). La corriente convencional entra por el ánodo y sale por aquí.' },
      resistencia: { t: 'Resistencia de 220 Ω', d: 'Limita la corriente. Colores: rojo, rojo, marrón (22 · 10 = 220 Ω) y oro (±5 %).' },
      fuente:      { t: 'Fuente regulable', d: 'Da de −5 a +5 V. Con tensión negativa el diodo queda polarizado en inversa.' },
      cristal:     { t: 'Cristal de silicio (ampliado)', d: 'Una mitad dopada tipo P (sobran huecos) y otra tipo N (sobran electrones). La unión entre las dos es la que hace funcionar el diodo.' },
      zona:        { t: 'Zona de agotamiento', d: 'Franja sin portadores libres alrededor de la unión, con iones fijos: negativos del lado P y positivos del lado N. Su anchura cambia con la tensión.' },
      portadores:  { t: 'Portadores de carga', d: 'Electrones (azul) en la zona N y huecos (rojo) en la zona P. En directa se mueven hacia la unión y se recombinan.' },
      placa:       { t: 'Placa de montaje', d: 'Placa de pruebas donde se monta el circuito.' },
      cables:      { t: 'Cables', d: 'Rojo: positivo de la fuente. Negro: negativo.' }
    },
    extra: `
      <div class="two">
        <div>
          <h2>Cómo se identifica y se usa</h2>
          <p><b>Ánodo (A)</b> y <b>cátodo (K)</b>: la banda marca el cátodo. En el símbolo, la flecha indica el sentido en que deja pasar la corriente convencional.</p>
          <p>Usos: rectificar alterna (puentes de diodos en fuentes de alimentación), proteger contra inversión de polaridad y como <b>diodo de rueda libre</b> en paralelo con bobinas de relés y contactores, para absorber el pico de tensión al desconectar.</p>
          <p class="note">La ampliación es un esquema: en un diodo real el cristal mide menos de un milímetro.</p>
        </div>
        <div>
          <h2>Valores típicos</h2>
          <table><tbody>
            <tr><td>Silicio</td><td>Umbral ≈ 0,6–0,7 V</td></tr>
            <tr><td>Germanio</td><td>Umbral ≈ 0,3 V</td></tr>
            <tr><td>LED</td><td>1,8–3,3 V según el color</td></tr>
            <tr><td>Schottky</td><td>≈ 0,2–0,4 V, muy rápido</td></tr>
          </tbody></table>
        </div>
      </div>`
  });
})();
