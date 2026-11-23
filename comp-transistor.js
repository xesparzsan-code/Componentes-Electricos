// Componente: transistor NPN (BC547) como interruptor/amplificador que gobierna un LED
(() => {
  const { set, fmt } = UT;
  const VCC = 12, RB = 10000, RC = 470, VLED = 1.9, BETA = 100;

  const PANEL = `
    <label class="sp"><span>Tensión en el potenciómetro</span><input type="range" id="vb" min="0" max="5" step="0.02" value="0"><b id="vbV">0,00 V</b></label>
    <div class="row"><button class="sm" data-u="0">0 V (corte)</button><button class="sm" data-u="1.3">1,3 V (activa)</button><button class="sm" data-u="4.5">4,5 V (saturación)</button></div>
    <p class="msg" id="msg" hidden></p>
    ${UT.dl([['rIb', 'Corriente de base Ib', '0 µA'], ['rIc', 'Corriente de colector Ic', '0 mA'], ['rB', 'Ganancia β = Ic / Ib', '—'], ['rVce', 'Tensión colector-emisor', '10,1 V'], ['rE', 'Estado', 'corte']])}
    <svg class="sch" viewBox="0 0 300 140" aria-label="Esquema: potenciómetro y resistencia de base Rb, transistor NPN, resistencia de colector Rc y LED a +12 V">
      <circle cx="25" cy="105" r="12"/><text x="40" y="110">Vbb</text>
      <line x1="25" y1="93" x2="25" y2="80"/><line x1="25" y1="80" x2="65" y2="80"/><rect x="65" y="74" width="30" height="12"/><text x="66" y="68">Rb 10k</text>
      <line x1="95" y1="80" x2="142" y2="80"/><line x1="142" y1="66" x2="142" y2="94" style="stroke-width:3"/>
      <circle cx="150" cy="80" r="21"/>
      <line x1="142" y1="74" x2="158" y2="62"/><line x1="158" y1="62" x2="158" y2="48"/><rect x="152" y="32" width="12" height="16"/><text x="170" y="44">Rc 470</text>
      <line x1="158" y1="32" x2="158" y2="27"/><polygon points="150,14 166,14 158,26" style="fill:var(--ink)"/><line x1="150" y1="26" x2="166" y2="26"/><text x="170" y="24">LED</text>
      <line x1="158" y1="14" x2="158" y2="6"/><line x1="158" y1="6" x2="280" y2="6"/><text x="230" y="20">+12 V</text>
      <line x1="142" y1="86" x2="158" y2="98"/><polygon points="158,98 150,97 155,91" style="fill:var(--ink)"/><line x1="158" y1="98" x2="158" y2="130"/>
      <line x1="280" y1="6" x2="280" y2="130"/><line x1="280" y1="130" x2="25" y2="130"/><line x1="25" y1="130" x2="25" y2="117"/>
      <text x="166" y="88">NPN</text><circle id="led" cx="158" cy="19" r="9" style="stroke:none"/>
      <path id="fB" class="flow fy" d="M25 93 V80 H142 V86 L158 98 V130 H25 V117"/>
      <path id="fC" class="flow fl" d="M280 130 V6 H158 V62 L142 74 V86 L158 98 V130 H280"/>
      <rect class="hit" id="hV" x="10" y="90" width="30" height="30" rx="15"/>
    </svg>
    <p class="nota-sch">Pulsa Vbb en el esquema (o el potenciómetro del modelo) para pasar de corte a activa y a saturación.</p>`;

  function build(ctx, panel) {
    const { T, V, scene, M, boxR, cyl, tube, curva, part: P } = ctx;
    const m = UT.mats(ctx);
    const ejeX = o => { o.rotation.z = Math.PI / 2; return o; };
    P(boxR(-6, 6, -.3, 0, -3, 3, M(0xf1f1ec, { roughness: .9 })), 'placa');

    // fuente de 12 V
    P(boxR(-6, -4.2, 0, 1.6, -2.6, -.8, m.dark), 'fuente');
    UT.rotulo(ctx, [['FUENTE', 50], ['12 V', 50]], 1.3, .7, V(-5.1, .9, -.79), [0, 0, 0], { color: '#e9e8e3' });
    P(cyl(.16, .3, m.red, -4.6, 1.75, -1.7, null, 16), 'fuente'); P(cyl(.16, .3, m.black, -5.6, 1.75, -1.7, null, 16), 'fuente');
    // potenciómetro
    P(boxR(-3.8, -2.8, 0, .5, .4, 1.4, M(0x1f4e9c, { roughness: .5 })), 'pot');
    P(cyl(.12, .5, m.steel, -3.3, .75, .9, null, 16), 'pot');
    const knob = new T.Group(); knob.position.set(-3.3, 1.05, .9); scene.add(knob);
    P(cyl(.35, .35, m.black, 0, 0, 0, knob, 24), 'pot'); P(boxR(-.04, .04, .18, .2, 0, .33, m.white, knob), 'pot');
    // resistencias
    const resis = (x, y, z, bandas, id, rotY = 0) => {
      const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = rotY; scene.add(g);
      ejeX(P(cyl(.22, .9, M(0xd9c08f, { roughness: .6 }), 0, 0, 0, g, 20), id));
      bandas.forEach((c, i) => ejeX(P(cyl(.23, .07, M(c), -.28 + i * .17 + (i === 3 ? .1 : 0), 0, 0, g, 20), id)));
      return g;
    };
    resis(-1.8, .4, .9, [0x6b3e1e, 0x111111, 0xe67e22, 0xd4af37], 'rb');
    resis(1.6, .4, -.2, [0xe6c300, 0x7b3fa0, 0x6b3e1e, 0xd4af37], 'rc');
    // LED
    const ledM = new T.MeshPhysicalMaterial({ color: 0xff3b3b, transparent: true, opacity: .75, roughness: .2, emissive: 0xff2020, emissiveIntensity: 0 });
    const ledG = new T.Group(); ledG.position.set(3.1, 0, -.2); scene.add(ledG);
    const l1 = P(cyl(.3, .5, ledM, 0, .75, 0, ledG, 24), 'led'); const l2 = P(new T.Mesh(new T.SphereGeometry(.3, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), ledM), 'led');
    l2.position.y = 1.0; ledG.add(l2);
    P(cyl(.34, .06, ledM, 0, .5, 0, ledG, 24), 'led');
    const ledLuz = new T.PointLight(0xff4040, 0, 3); ledLuz.position.set(3.1, 1.0, .2); scene.add(ledLuz);
    for (const x of [-.1, .1]) P(boxR(x - .02, x + .02, 0, .5, -.02, .02, m.steel, ledG), 'led');
    // transistor TO-92
    const tG = new T.Group(); tG.position.set(0, 0, .9); scene.add(tG);
    P(ctx.add(new T.Mesh(new T.CylinderGeometry(.5, .5, 1.0, 28, 1, false, -Math.PI / 2, Math.PI), m.black), tG), 'transistor').position.y = 1.6;
    P(boxR(-.5, .5, 1.1, 2.1, -.01, .01, m.black, tG), 'transistor');
    UT.rotulo(ctx, [['BC547', 44], ['E B C', 38]], .8, .55, V(0, 1.62, .92), [0, 0, 0], { color: '#cfd3d8' });
    [-.3, 0, .3].forEach((x, i) => P(boxR(x - .03, x + .03, 0, 1.1, -.03, .03, m.steel, tG), ['emisor', 'base', 'colector'][i]));

    // cables
    const wVcc = [V(-4.6, 1.7, -1.7), V(-3, 1.0, -2.2), V(2.2, .9, -2.0), V(3.0, .4, -1.0), V(3.0, .05, -.2)];
    const wLedRc = [V(3.2, .05, -.2), V(2.6, .2, -.2), V(2.05, .4, -.2)];
    const wRcC = [V(1.15, .4, -.2), V(.5, .3, .3), V(.3, .05, .9)];
    const wE = [V(-.3, .05, .9), V(-.5, .2, 1.8), V(-3, .3, 2.3), V(-5.6, .9, -.4), V(-5.6, 1.7, -1.7)];
    const wPot = [V(-3.3, .5, .9), V(-2.7, .4, .9), V(-2.25, .4, .9)];
    const wRbB = [V(-1.35, .4, .9), V(-.6, .3, .9), V(0, .05, .9)];
    const wPv = [V(-4.6, 1.7, -1.7), V(-4.0, .5, .2), V(-3.7, .3, .9)], wPg = [V(-2.9, .3, 1.2), V(-2.5, .2, 2.0), V(-2.0, .25, 2.25)];
    [[wVcc, m.red], [wLedRc, m.steel], [wRcC, m.steel], [wE, m.black], [wPot, m.steel], [wRbB, m.steel], [wPv, m.red], [wPg, m.black]].forEach(([w, mm]) => P(tube(w, w === wVcc || w === wE || w === wPv || w === wPg ? .06 : .035, mm), 'cables'));

    // cristal ampliado: emisor N, base P (fina), colector N
    const CY = 4.5;
    const zona = (c, x0, x1, id) => { const b = P(boxR(x0, x1, CY - 1, CY + 1, -1, 1, new T.MeshPhysicalMaterial({ color: c, transparent: true, opacity: .18, roughness: .2, depthWrite: false })), id); b.renderOrder = 2; };
    zona(0x6f9eff, -3, -.35, 'zE'); zona(0xff8a80, -.35, .35, 'zB'); zona(0x9fc0ff, .35, 3, 'zC');
    P(boxR(-3.1, -3, CY - 1, CY + 1, -1, 1, m.silver), 'zE'); P(boxR(3, 3.1, CY - 1, CY + 1, -1, 1, m.silver), 'zC'); P(boxR(-.3, .3, CY + 1, CY + 1.08, -1, 1, m.silver), 'zB');
    UT.rotulo(ctx, 'Emisor N', 1.8, .4, V(-1.7, CY + 1.3, 0), [0, 0, 0], { color: '#0b4f8a', size: 70 });
    UT.rotulo(ctx, 'Base P', 1.0, .4, V(0, CY + 1.55, 0), [0, 0, 0], { color: '#c1121f', size: 70 });
    UT.rotulo(ctx, 'Colector N', 1.8, .4, V(1.7, CY + 1.3, 0), [0, 0, 0], { color: '#0b4f8a', size: 70 });
    { const g = new T.BufferGeometry().setFromPoints([V(-.45, 2.1, .9), V(-3, CY - 1, 1), V(.45, 2.1, .9), V(3, CY - 1, 1)]);
      const l = new T.LineSegments(g, new T.LineDashedMaterial({ color: 0x8a94a6, dashSize: .15, gapSize: .12 })); l.computeLineDistances(); scene.add(l); }
    const carriles = [];
    for (const y of [-.6, -.2, .2, .6]) for (const z of [-.5, .1, .6]) carriles.push(ctx.flow({ color: 0x1e63d6, size: .07, gap: .45 }).path([V(-3, CY + y, z), V(3, CY + y * .9, z)]));
    const fBase = [-.5, .4].map(z => ctx.flow({ color: 0xd62828, size: .06, gap: .3 }).path([V(0, CY + 1.05, z), V(0, CY + .1, z), V(-.25, CY - .3, z)]));
    const fCol = ctx.flow({ color: 0xff5a1f, size: .065, gap: .26 }), fB = ctx.flow({ color: 0xffc400, size: .055, gap: .24 });
    fCol.path([...curva(wVcc), V(3.1, .5, -.2), V(3.0, .05, -.2), ...curva(wLedRc), V(1.15, .4, -.2), ...curva(wRcC), V(.3, 1.0, .9), V(-.3, 1.0, .9), ...curva(wE)]);
    fB.path([...curva(wPv), V(-3.3, .5, .9), ...curva(wPot), V(-1.35, .4, .9), ...curva(wRbB), V(0, 1.0, .9), V(-.3, 1.0, .9), ...curva(wE)]);

    const $ = s => panel.querySelector(s);
    const vb = $('#vb'), vbV = $('#vbV'), msg = $('#msg');
    const r = { Ib: $('#rIb'), Ic: $('#rIc'), B: $('#rB'), Vce: $('#rVce'), E: $('#rE') }, s = { led: $('#led'), fB: $('#fB'), fC: $('#fC') };
    let Vb = 0;
    const setV = v => { Vb = v; vb.value = v; vbV.textContent = fmt(v, 2) + ' V'; };
    vb.oninput = () => setV(+vb.value);
    const ciclo = () => setV(Vb < .7 ? 1.3 : Vb < 2 ? 4.5 : 0);
    UT.hit(panel, '#hV', ciclo, false, 'Tensión de base: siguiente estado');
    ctx.accion('pot', ciclo, { pista: 'Púlsalo en el modelo para girarlo: corte, zona activa y saturación.' });
    panel.querySelectorAll('[data-u]').forEach(b => b.onclick = () => setV(+b.dataset.u));

    return {
      update(dt) {
        const Ib = Math.max(0, (Vb - .7) / RB), IcSat = (VCC - VLED - .2) / RC, Ic = Math.min(BETA * Ib, IcSat);
        const est = Ib <= 0 ? 0 : BETA * Ib < IcSat ? 1 : 2, Vce = VCC - VLED * (Ic > 0 ? 1 : 0) - Ic * RC;
        knob.rotation.y = -Vb / 5 * 4.5;
        const k = Ic / IcSat;
        ledM.emissiveIntensity = k * 2.2; ledLuz.intensity = k * 1.5;
        carriles.forEach(f => f.set(Ic > 0 ? 1 : 0, .6 + k * 2.2));
        fBase.forEach(f => f.set(Ib > 0 ? 1 : 0, .4 + k));
        fCol.set(Ic > 0 ? 1 : 0, .5 + k * 1.6); fB.set(Ib > 0 ? 1 : 0, .4 + k * .6);

        ctx.step(est);
        set(r.Ib, fmt(Ib * 1e6, 1) + ' µA');
        set(r.Ic, fmt(Ic * 1000, 2) + ' mA', Ic > 0 ? 'ok' : '');
        set(r.B, Ib > 0 ? fmt(Ic / Ib, 0) : '—');
        set(r.Vce, fmt(Math.max(.2, Vce), 2) + ' V');
        set(r.E, ['corte', 'zona activa', 'saturación'][est], est === 2 ? 'on' : est === 1 ? 'ok' : '');
        const t = est === 0 ? 'Corte: con menos de unos 0,7 V entre base y emisor no hay corriente de base y el transistor no deja pasar corriente de colector. Es un interruptor abierto.'
          : est === 1 ? `Zona activa: Ic = β · Ib = ${BETA} · ${fmt(Ib * 1e6, 1)} µA = ${fmt(Ic * 1000, 2)} mA. Una corriente de base muy pequeña controla una de colector cien veces mayor.`
          : 'Saturación: aunque haya más corriente de base, la de colector ya no sube: la limitan la resistencia de colector y el LED. Es un interruptor cerrado.';
        set(msg, t); msg.hidden = false;
        s.led.style.fill = `rgba(255,59,59,${(k * .8).toFixed(2)})`;
        s.fB.classList.toggle('live', Ib > 0); s.fC.classList.toggle('live', Ic > 0);
      },
      labels: [
        { p: 'transistor', txt: 'Transistor BC547', at: () => V(-.5, 2.0, .9), l: 1 },
        { p: 'emisor', txt: 'E', at: () => V(-.33, .5, .95), l: 1 },
        { p: 'colector', txt: 'C', at: () => V(.33, .5, .95) },
        { p: 'pot', txt: 'Potenciómetro', at: () => V(-3.8, 1.1, 1.2), l: 1 },
        { p: 'rb', txt: 'Rb 10 kΩ', at: () => V(-1.8, .7, 1.1) },
        { p: 'rc', txt: 'Rc 470 Ω', at: () => V(1.6, .7, -.2) },
        { p: 'led', txt: 'LED', at: () => V(3.4, 1.2, -.2) },
        { p: 'zB', txt: 'Base muy fina', at: () => V(.35, CY - 1, 1) },
        { p: 'fuente', at: () => V(-4.2, 1.5, -.8) }
      ]
    };
  }

  window.COMPONENTES.push({
    id: 'transistor', nombre: 'Transistor', categoria: 'Electrónica',
    resumen: 'Un interruptor o amplificador controlado por una corriente pequeña.',
    titulo: 'Transistor NPN: una corriente pequeña que manda sobre otra grande',
    lead: 'Gira el potenciómetro para dar corriente a la base. Arriba ves cómo los electrones del emisor atraviesan la base, muy fina, y llegan al colector encendiendo el LED.',
    camara: { pos: [1.5, 7, 15.5], tgt: [-.8, 2.3, 0] }, suelo: -.32,
    panel: PANEL, build,
    leyenda: [['#ffc400', 'Corriente de base'], ['#ff5a1f', 'Corriente de colector'], ['#1e63d6', 'Electrones'], ['#d62828', 'Huecos (base)']],
    pasos: [
      ['1. Corte', 'Sin corriente de base, la unión base-emisor no conduce y no pasa corriente de colector. El LED está apagado.'],
      ['2. Zona activa', 'Con más de unos 0,7 V entre base y emisor entran electrones desde el emisor. Como la base es muy fina, casi todos la cruzan y llegan al colector: Ic = β · Ib.'],
      ['3. Saturación', 'Si la corriente de base es suficiente, la de colector llega al máximo que permite el circuito. El transistor se comporta como un interruptor cerrado.']
    ],
    partes: {
      transistor: { t: 'Transistor BC547 (encapsulado TO-92)', d: 'Transistor NPN de baja potencia: hasta 100 mA de colector. Mirando la cara plana, las patas son E, B y C.' },
      emisor:     { t: 'Emisor (E)', d: 'Emite los electrones. En un NPN va al negativo; la flecha del símbolo está en el emisor.' },
      base:       { t: 'Base (B)', d: 'Terminal de control. Una corriente pequeña aquí abre el paso entre colector y emisor.' },
      colector:   { t: 'Colector (C)', d: 'Recoge los electrones. Por aquí entra la corriente de la carga.' },
      zE:         { t: 'Emisor N (ampliado)', d: 'Zona muy dopada, con muchos electrones libres.' },
      zB:         { t: 'Base P (ampliada)', d: 'Zona muy fina y poco dopada: los electrones la atraviesan casi sin recombinarse. De ahí viene la ganancia.' },
      zC:         { t: 'Colector N (ampliado)', d: 'Zona grande que recoge los electrones que cruzan la base.' },
      pot:        { t: 'Potenciómetro', d: 'Divisor de tensión que da a la base una tensión de 0 a 5 V.' },
      rb:         { t: 'Resistencia de base Rb', d: '10 kΩ (marrón, negro, naranja). Limita la corriente de base.' },
      rc:         { t: 'Resistencia de colector Rc', d: '470 Ω (amarillo, violeta, marrón). Limita la corriente del LED.' },
      led:        { t: 'LED', d: 'La carga. Su brillo indica la corriente de colector.' },
      fuente:     { t: 'Fuente de 12 V', d: 'Alimenta el circuito del colector y el potenciómetro.' },
      placa:      { t: 'Placa de montaje', d: 'Placa de pruebas.' },
      cables:     { t: 'Cables', d: 'Rojo: +12 V. Negro: 0 V (masa).' }
    },
    extra: `
      <div class="two">
        <div>
          <h2>Interruptor o amplificador</h2>
          <p>En automatismos el transistor se usa casi siempre como <b>interruptor</b>: en corte o en saturación. Así una salida de un microcontrolador, que da muy poca corriente, puede activar un relé, un LED potente o un motor pequeño.</p>
          <p>En zona activa funciona como <b>amplificador</b>: la corriente de colector copia las variaciones de la de base multiplicadas por β (en el BC547, de 110 a 800 según la versión; aquí se usa 100).</p>
          <p class="note">Si el transistor gobierna una bobina (relé), hay que poner un diodo de rueda libre en paralelo con ella.</p>
        </div>
        <div>
          <h2>Fórmulas</h2>
          <table><tbody>
            <tr><td>Ib</td><td>(Vbb − 0,7) / Rb</td></tr>
            <tr><td>Ic (activa)</td><td>β · Ib</td></tr>
            <tr><td>Ic (saturación)</td><td>(Vcc − V<sub>LED</sub> − 0,2) / Rc</td></tr>
            <tr><td>Ie</td><td>Ic + Ib</td></tr>
          </tbody></table>
        </div>
      </div>`
  });
})();
