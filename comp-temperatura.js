// Componente: sensores resistivos de temperatura, Pt100 (RTD) y termistor NTC, en un vaso de agua que se calienta
(() => {
  const { set, fmt } = UT;
  const rPt = T => 100 * (1 + .00385 * T);
  const rNtc = T => 10000 * Math.exp(3950 * (1 / (T + 273.15) - 1 / 298.15));

  const PANEL = `
    <button class="big" id="cal" aria-pressed="false">Encender la placa calefactora</button>
    <label class="sp"><span>Temperatura del agua</span><input type="range" id="tem" min="0" max="100" step="1" value="20"><b id="temV">20 °C</b></label>
    <div class="row"><button class="sm" data-u="0">Agua con hielo (0 °C)</button><button class="sm" data-u="25">25 °C</button><button class="sm" data-u="100">Hirviendo (100 °C)</button></div>
    <p class="msg" id="msg" hidden></p>
    ${UT.dl([['rT', 'Temperatura', ''], ['rP', 'Resistencia Pt100', ''], ['rSP', 'Sensibilidad Pt100', ''], ['rN', 'Resistencia NTC 10 k', ''], ['rSN', 'Sensibilidad NTC', '']])}
    <svg class="sch" viewBox="0 0 300 130" aria-label="Curvas de resistencia frente a temperatura de la Pt100 (sube recta) y de la NTC (baja en curva)">
      <line x1="40" y1="110" x2="270" y2="110" class="thin"/><line x1="40" y1="8" x2="40" y2="110" class="thin"/><line x1="270" y1="8" x2="270" y2="110" class="thin"/>
      <text x="4" y="14" style="fill:#2f8cff">140 Ω</text><text x="4" y="112" style="fill:#2f8cff">100 Ω</text>
      <text x="274" y="14" style="fill:#e0245e">33 k</text><text x="274" y="112" style="fill:#e0245e">0</text>
      <text x="36" y="124">0 °C</text><text x="238" y="124">100 °C</text>
      <path id="cP" class="curva" style="stroke:#2f8cff" d=""/><path id="cN" class="curva" style="stroke:#e0245e" d=""/>
      <circle id="pP" r="4.5" style="fill:#2f8cff;stroke:none"/><circle id="pN" r="4.5" style="fill:#e0245e;stroke:none"/>
      <text x="120" y="30" style="fill:#2f8cff">Pt100</text><text x="70" y="64" style="fill:#e0245e">NTC</text>
    </svg>`;

  function build(ctx, panel) {
    const { T, V, scene, M, boxR, cyl, tube, curva, part: P } = ctx;
    const m = UT.mats(ctx);
    P(boxR(-7, 7, -.3, 0, -2.6, 2.6, M(0x6b737b, { metalness: .4, roughness: .5 })), 'base');
    // placa calefactora, vaso y agua
    P(boxR(-2.2, 2.2, 0, .8, -2.2, 2.2, M(0xe9e8e3, { roughness: .6 })), 'placa');
    const plato = P(cyl(1.8, .1, M(0x2b2f36, { roughness: .5, emissive: 0xff3000, emissiveIntensity: 0 }), 0, .85, 0, null, 40), 'placa');
    P(boxR(1.4, 2.0, .3, .55, 2.2, 2.25, m.red), 'placa');
    const vaso = P(new T.Mesh(new T.CylinderGeometry(1.6, 1.6, 3.4, 40, 1, true), new T.MeshPhysicalMaterial({ color: 0xe8f2fa, transparent: true, opacity: .2, roughness: .05, depthWrite: false, side: T.DoubleSide })), 'vaso', true);
    vaso.position.y = .9 + 1.7; vaso.renderOrder = 2; scene.add(vaso);
    P(cyl(1.6, .06, new T.MeshPhysicalMaterial({ color: 0xe8f2fa, transparent: true, opacity: .3, depthWrite: false }), 0, .93, 0, null, 40), 'vaso');
    const aguaM = new T.MeshPhysicalMaterial({ color: 0x3b8fe0, transparent: true, opacity: .4, roughness: .1, depthWrite: false });
    const agua = P(cyl(1.52, 2.7, aguaM, 0, .96 + 1.35, 0, null, 40), 'agua'); agua.renderOrder = 1;
    // Pt100: vaina de acero, elemento de platino en la punta y cabezal de conexión
    const PX = -.6;
    P(cyl(.12, 3.6, m.steel, PX, 3.7, 0, null, 16), 'pt100');
    const punta = P(cyl(.125, .9, new T.MeshPhysicalMaterial({ color: 0xc9cdd2, transparent: true, opacity: .3, depthWrite: false }), PX, 1.45, 0, null, 16), 'pt100');
    punta.renderOrder = 2;
    P(cyl(.07, .6, m.card, PX, 1.45, 0, null, 12), 'elemento');
    P(ctx.add(new T.Mesh(new T.TubeGeometry(new UT.Helix(.08, 10), 160, .012, 5), m.silver)), 'elemento').position.set(PX, 1.15, 0);
    P(cyl(.45, .7, M(0xc9cdd2, { metalness: .7, roughness: .3 }), PX, 5.8, 0, null, 24), 'cabezal');
    P(cyl(.48, .12, M(0x2f6fb5), PX, 6.2, 0, null, 24), 'cabezal');
    const cP = [V(PX - .45, 5.8, 0), V(-2.5, 5.6, 0), V(-3.6, 3.0, .6), V(-4.2, 1.6, 1.0)];
    P(tube(cP, .09, M(0x3a3e45)), 'cables');
    // NTC: perla de resina con dos patillas, sujeta con una pinza
    const NX = .6;
    P(ctx.add(new T.Mesh(new T.SphereGeometry(.17, 20, 14), M(0x1d3b2a, { roughness: .4 }))), 'ntc').position.set(NX, 1.5, 0);
    for (const dz of [-.06, .06]) P(tube([V(NX, 1.6, dz), V(NX, 3.5, dz), V(NX + .1, 5.2, dz)], .025, m.silver), 'patillas');
    P(boxR(NX - .25, NX + .35, 5.2, 5.7, -.25, .25, m.dark), 'patillas');
    P(boxR(NX + .3, 3.6, 5.4, 5.55, -.08, .08, m.steel), 'patillas'); P(boxR(3.5, 3.7, 0, 5.55, -.12, .12, m.steel), 'patillas');
    const cN = [V(NX + .1, 5.4, .1), V(2.6, 5.0, .7), V(3.8, 2.4, 1.2), V(4.2, 1.6, 1.2)];
    P(tube(cN, .05, m.red), 'cables');
    // multímetros
    P(boxR(-5.6, -3.4, 0, 2.6, .6, 1.6, m.dark), 'medidor'); P(boxR(3.6, 5.8, 0, 2.6, .6, 1.6, m.dark), 'medidor');
    const dP = UT.pantalla(ctx, V(-4.5, 1.8, 1.61), 1.9, .9), dN = UT.pantalla(ctx, V(4.7, 1.8, 1.61), 1.9, .9);
    UT.rotulo(ctx, 'Pt100', 1.2, .35, V(-4.5, 1.0, 1.61), [0, 0, 0], { color: '#e9e8e3' });
    UT.rotulo(ctx, 'NTC 10 k', 1.2, .35, V(4.7, 1.0, 1.61), [0, 0, 0], { color: '#e9e8e3' });
    // burbujas cuando hierve
    const burb = ctx.flow({ color: 0xffffff, size: .06, gap: .35 }).path([V(.2, 1.0, .5), V(.25, 2.0, .45), V(.15, 3.6, .5)]);
    const burb2 = ctx.flow({ color: 0xffffff, size: .05, gap: .4 }).path([V(-.9, 1.0, -.6), V(-.95, 2.2, -.5), V(-.9, 3.6, -.6)]);

    // curvas del SVG
    const $ = s => panel.querySelector(s);
    const X = t => 40 + t / 100 * 230, YP = r => 110 - (r - 100) / 40 * 102, YN = r => 110 - r / 33000 * 102;
    { let a = '', b = ''; for (let t = 0; t <= 100; t += 2) { a += (t ? ' L' : 'M') + X(t).toFixed(1) + ' ' + YP(rPt(t)).toFixed(1); b += (t ? ' L' : 'M') + X(t).toFixed(1) + ' ' + YN(rNtc(t)).toFixed(1); }
      $('#cP').setAttribute('d', a); $('#cN').setAttribute('d', b); }
    const cal = $('#cal'), tem = $('#tem'), temV = $('#temV'), msg = $('#msg'), pP = $('#pP'), pN = $('#pN');
    const r = { T: $('#rT'), P: $('#rP'), SP: $('#rSP'), N: $('#rN'), SN: $('#rSN') };
    let Tc = 20, heat = false, enfr = false;
    const setT = v => { Tc = v; tem.value = Math.round(v); temV.textContent = Math.round(v) + ' °C'; };
    const setH = v => { heat = v; cal.setAttribute('aria-pressed', v); cal.textContent = v ? 'Apagar la placa calefactora' : 'Encender la placa calefactora'; };
    cal.onclick = () => setH(!heat);
    tem.oninput = () => { setH(false); setT(+tem.value); };
    panel.querySelectorAll('[data-u]').forEach(b => b.onclick = () => { setH(false); setT(+b.dataset.u); });
    ctx.accion('placa', () => setH(!heat), { pista: 'Púlsala en el modelo para encenderla o apagarla.' });
    ctx.accion('agua', () => { setH(false); setT(0); }, { pista: 'Púlsala en el modelo para echar hielo (0 °C).' });

    return {
      update(dt) {
        const antes = Tc;
        if (heat) setT(Math.min(100, Tc + (101 - Tc) * dt / 7));
        else if (Tc > 20.5 && !tem.matches(':active')) setT(Tc + (20 - Tc) * dt / 25);
        enfr = Tc < antes - 1e-4;
        plato.material.emissiveIntensity = heat ? .9 : 0;
        const k = Tc / 100; aguaM.color.setRGB(.23 + .7 * k, .56 - .25 * k, .88 - .6 * k);
        burb.set(Tc > 95 ? 1 : 0, 1.2); burb2.set(Tc > 97 ? 1 : 0, 1);
        const rp = rPt(Tc), rn = rNtc(Tc);
        dP(fmt(rp, 2) + ' Ω'); dN(rn >= 1000 ? fmt(rn / 1000, 2) + ' kΩ' : fmt(rn, 0) + ' Ω');
        pP.setAttribute('cx', X(Tc).toFixed(1)); pP.setAttribute('cy', YP(rp).toFixed(1));
        pN.setAttribute('cx', X(Tc).toFixed(1)); pN.setAttribute('cy', YN(rn).toFixed(1));
        const sn = 3950 / (Tc + 273.15) ** 2 * rn;
        ctx.step(heat ? 1 : enfr ? 2 : 0);
        set(r.T, fmt(Tc, 1) + ' °C');
        set(r.P, fmt(rp, 2) + ' Ω'); set(r.SP, '+0,385 Ω/°C');
        set(r.N, rn >= 1000 ? fmt(rn / 1000, 2) + ' kΩ' : fmt(rn, 0) + ' Ω');
        set(r.SN, '−' + (sn >= 1000 ? fmt(sn / 1000, 2) + ' kΩ/°C' : fmt(sn, 1) + ' Ω/°C'));
        const t = `Por cada grado la Pt100 sube 0,385 Ω, siempre igual (lineal). La NTC baja ${sn >= 1000 ? fmt(sn / 1000, 2) + ' kΩ' : fmt(sn, 0) + ' Ω'}: mucho más sensible, pero su sensibilidad cambia con la temperatura (no lineal).`;
        set(msg, t); msg.hidden = false;
      },
      labels: [
        { p: 'pt100', txt: 'Sonda Pt100', at: () => V(PX - .12, 3.6, 0), l: 1 },
        { p: 'elemento', txt: 'Hilo de platino', at: () => V(PX - .15, 1.2, .1), l: 1 },
        { p: 'cabezal', txt: 'Cabezal de conexión', at: () => V(PX - .45, 6.0, 0), l: 1 },
        { p: 'ntc', txt: 'Termistor NTC', at: () => V(NX + .17, 1.5, 0) },
        { p: 'agua', at: () => V(1.5, 3.4, .5) },
        { p: 'placa', txt: 'Placa calefactora', at: () => V(2.2, .5, 2.2) },
        { p: 'medidor', txt: 'Óhmetros', at: () => V(5.8, 2.6, 1.6) }
      ]
    };
  }

  window.COMPONENTES.push({
    id: 'temperatura', nombre: 'Pt100 y NTC', categoria: 'Sensores', grupo: 'Resistivos',
    resumen: 'Dos resistencias que cambian con la temperatura: una lineal y otra muy sensible.',
    titulo: 'Pt100 y NTC: medir la temperatura con una resistencia',
    lead: 'Calienta el agua o pon hielo y compara las dos sondas: la Pt100 sube poco y siempre igual; la NTC baja mucho y en curva.',
    camara: { pos: [2, 7.5, 17], tgt: [0, 2.5, 0] }, suelo: -.32,
    panel: PANEL, build,
    leyenda: [],
    pasos: [
      ['1. Pt100 (RTD)', 'Hilo de platino: su resistencia aumenta con la temperatura de forma casi lineal. Mide 100 Ω a 0 °C y unos 138,5 Ω a 100 °C (coeficiente 0,00385 /°C).'],
      ['2. Al calentar', 'Las dos sondas cambian a la vez, pero de forma muy distinta: la Pt100 sube 0,385 Ω por grado; la NTC, de semiconductor, baja cientos de ohmios por grado.'],
      ['3. Cuál elegir', 'Pt100: precisa, lineal y estable, para procesos industriales. NTC: barata y muy sensible en un margen estrecho, pero no lineal. Para detectar 0,1 °C, mejor la NTC.']
    ],
    partes: {
      pt100:    { t: 'Sonda Pt100', d: 'Vaina de acero inoxidable que protege el elemento de platino y permite meterla en líquidos o tuberías.' },
      elemento: { t: 'Elemento de platino', d: 'Hilo de platino enrollado sobre cerámica. Su resistencia es 100 Ω a 0 °C (de ahí el nombre Pt100).' },
      cabezal:  { t: 'Cabezal de conexión', d: 'Caja con los bornes de la sonda. Se conecta a 2, 3 o 4 hilos; con 3 o 4 se compensa la resistencia de los cables.' },
      ntc:      { t: 'Termistor NTC', d: 'Perla de semiconductor recubierta de resina. NTC = coeficiente de temperatura negativo: su resistencia baja al calentarse. Este mide 10 kΩ a 25 °C.' },
      patillas: { t: 'Patillas y pinza', d: 'Hilos del termistor y soporte que lo mantiene dentro del agua.' },
      agua:     { t: 'Agua', d: 'Su color indica la temperatura. Púlsala para echar hielo.' },
      vaso:     { t: 'Vaso', d: 'Vaso de vidrio.' },
      placa:    { t: 'Placa calefactora', d: 'Calienta el agua hasta 100 °C.' },
      medidor:  { t: 'Óhmetros', d: 'Miden la resistencia de cada sonda, como en la práctica de caracterización con el multímetro.' },
      cables:   { t: 'Cables', d: 'Conectan cada sonda con su óhmetro.' },
      base:     { t: 'Base', d: 'Mesa de trabajo.' }
    },
    extra: `
      <div class="two">
        <div>
          <h2>Fórmulas</h2>
          <p><b>Pt100</b>: R = R0 · (1 + α · T), con R0 = 100 Ω y α = 0,00385 /°C. A 50 °C: 100 · (1 + 0,00385 · 50) = 119,25 Ω.</p>
          <p><b>NTC</b>: R = R25 · e<sup>B · (1/T − 1/298)</sup>, con la temperatura T en kelvin y B ≈ 3950 K. Por eso su curva es exponencial.</p>
          <p class="note">Una PTC es al revés que la NTC: su resistencia sube bruscamente a partir de una temperatura. Se usa como protección térmica en motores.</p>
        </div>
        <div>
          <h2>Comparación</h2>
          <table><tbody>
            <tr><td>Pt100</td><td>−200 a 850 °C, lineal, precisa, más cara</td></tr>
            <tr><td>NTC</td><td>−50 a 150 °C, muy sensible, no lineal, barata</td></tr>
            <tr><td>Termopar</td><td>Activo: genera tensión (efecto Seebeck), no es resistivo</td></tr>
          </tbody></table>
        </div>
      </div>`
  });
})();
