// Componente: potenciómetro lineal usado como sensor de posición (divisor de tensión)
(() => {
  const { set, fmt } = UT;
  const VIN = 10, RT = 10000, X0 = -3.6, X1 = 3.6;

  const PANEL = `
    <label class="sp"><span>Posición del carro</span><input type="range" id="pos" min="0" max="100" step="1" value="30"><b id="posV">30 mm</b></label>
    <button class="sm" id="auto" aria-pressed="false">Mover el carro solo</button>
    <p class="msg" id="msg" hidden></p>
    ${UT.dl([['rP', 'Posición', ''], ['rV', 'Tensión de salida (2–3)', ''], ['r12', 'Resistencia 1–2', ''], ['r23', 'Resistencia 2–3', '']])}
    <svg class="sch" viewBox="0 0 300 120" aria-label="Potenciómetro como divisor de tensión y gráfica lineal de la salida frente a la posición">
      <text x="2" y="14">+10 V</text><line x1="40" y1="18" x2="40" y2="26"/><rect x="32" y="26" width="16" height="70"/><line x1="40" y1="96" x2="40" y2="108"/><text x="6" y="116">0 V</text>
      <text x="22" y="34">1</text><text x="22" y="96">3</text>
      <line id="sW" x1="70" y1="60" x2="50" y2="60"/><polygon id="sA" points="50,60 58,55 58,65" style="fill:var(--ink)"/><line id="sW2" x1="70" y1="60" x2="96" y2="60"/><text x="76" y="54">2</text>
      <circle cx="108" cy="60" r="12"/><text x="103" y="65">V</text>
      <path id="fT" class="flow fl" d="M40 18 V108"/>
      <line x1="150" y1="104" x2="292" y2="104" class="thin"/><line x1="150" y1="10" x2="150" y2="104" class="thin"/>
      <line x1="150" y1="104" x2="290" y2="14" class="curva"/><circle id="pto" r="4.5" class="fill"/>
      <text x="154" y="18">10 V</text><text x="258" y="117">100 mm</text>
    </svg>`;

  function build(ctx, panel) {
    const { T, V, scene, M, boxR, cyl, tube, curva, part: P } = ctx;
    const m = UT.mats(ctx);
    const ejeX = o => { o.rotation.z = Math.PI / 2; return o; };
    P(boxR(-8, 9, -.3, 0, -2.4, 2.4, M(0x6b737b, { metalness: .4, roughness: .5 })), 'base');
    // cuerpo del potenciómetro (tapa transparente)
    const caja = M(0x2b2f36, { roughness: .6 });
    P(boxR(-4.2, 4.2, 0, .35, -.9, .9, caja), 'cuerpo');
    P(boxR(-4.2, 4.2, .35, 1.3, -.9, -.8, caja), 'cuerpo'); P(boxR(-4.2, 4.2, .35, .6, .8, .9, caja), 'cuerpo');
    P(boxR(-4.2, -4.0, .35, 1.3, -.8, .8, caja), 'cuerpo'); P(boxR(4.0, 4.2, .35, 1.3, -.8, .8, caja), 'cuerpo');
    const tapa = UT.caja(ctx, 8.4, .04, 1.8, V(0, 1.32, 0), 'tapa');
    // pista resistiva con el reparto de tensión (rojo = 10 V, azul = 0 V) y pista colectora
    const c = document.createElement('canvas'); c.width = 256; c.height = 8; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 256, 0); gr.addColorStop(0, '#2f5fd0'); gr.addColorStop(1, '#d23a2a'); g.fillStyle = gr; g.fillRect(0, 0, 256, 8);
    const tx = new T.CanvasTexture(c); tx.encoding = T.sRGBEncoding;
    P(boxR(X0, X1, .35, .42, -.5, -.1, new T.MeshStandardMaterial({ map: tx, roughness: .7 })), 'pista');
    P(boxR(X0, X1, .35, .42, .1, .5, m.silver), 'colectora');
    UT.rotulo(ctx, '0 V', .6, .25, V(X0 + .4, .43, -.3), [-Math.PI / 2, 0, 0], { color: '#fff' });
    UT.rotulo(ctx, '10 V', .6, .25, V(X1 - .4, .43, -.3), [-Math.PI / 2, 0, 0], { color: '#fff' });
    // cursor con escobillas y vástago
    const cur = new T.Group(); scene.add(cur);
    P(boxR(-.3, .3, .7, 1.0, -.6, .6, m.plastic, cur), 'cursor');
    P(boxR(-.08, .08, .42, .7, -.4, -.2, m.bronze, cur), 'cursor'); P(boxR(-.08, .08, .42, .7, .2, .4, m.bronze, cur), 'cursor');
    P(boxR(-.12, .12, .42, .48, -.45, .45, m.bronze, cur), 'cursor');
    ejeX(P(cyl(.08, 6.0, m.steel, 3.0, .85, 0, cur, 12), 'vastago'));
    const carro = new T.Group(); scene.add(carro);
    P(boxR(0, 1.4, 0, 1.8, -1.0, 1.0, M(0x3b6ea5, { roughness: .5 }), carro), 'carro');
    P(boxR(4.4, 8.8, 0, .12, -.4, .4, m.steel), 'base');
    // terminales, fuente y voltímetro
    [-.45, 0, .45].forEach((z, i) => P(boxR(-4.6, -4.2, .2, .3, z - .08, z + .08, m.silver), 'terminales'));
    UT.rotulo(ctx, '3  2  1', .3, 1.2, V(-4.62, .5, 0), [0, -Math.PI / 2, 0], { color: '#14161a', bg: '#e9e8e3', size: 60 });
    P(boxR(-7.6, -5.6, 0, 1.6, -2.0, -.8, m.dark), 'fuente'); UT.rotulo(ctx, [['FUENTE', 44], ['10 V', 44]], 1.4, .7, V(-6.6, .9, -.79), [0, 0, 0], { color: '#e9e8e3' });
    P(boxR(-7.6, -5.6, 0, 2.0, .8, 1.6, m.dark), 'voltimetro');
    const disp = UT.pantalla(ctx, V(-6.6, 1.35, 1.61), 1.7, .7);
    const wR = [V(-4.6, .25, .45), V(-5.0, .2, 1.2), V(-5.6, .5, 1.2)], wC = [V(-4.6, .25, 0), V(-5.2, .3, .9), V(-5.6, .9, 1.0)];
    const wF = [V(-5.6, .8, -1.4), V(-4.9, .3, -1.0), V(-4.6, .25, -.45)];
    P(tube(wR, .05, m.black), 'cables'); P(tube(wC, .05, m.yellow), 'cables'); P(tube(wF, .05, m.red), 'cables');
    const fT = ctx.flow({ color: 0xff5a1f, size: .05, gap: .26 }).path([V(X1, .45, -.3), V(X0, .45, -.3)]);
    const fC = ctx.flow({ color: 0xffc400, size: .04, gap: .3 });

    // ---- vista por dentro: la pista como divisor de tensión ----
    const D = UT.detalle(ctx, { w: 13.5, h: 8.4, titulo: 'DETALLE A · LA PISTA RESISTIVA COMO DIVISOR DE TENSIÓN' }), G = D.g;
    const XA = -5.4, XB = 5.4;
    P(boxR(XA, XB, -.35, .35, -.3, .3, new T.MeshStandardMaterial({ map: tx, roughness: .7 }), G), 'pista');
    P(boxR(XA, XB, -1.55, -1.1, -.3, .3, m.silver, G), 'colectora');
    const cD = new T.Group(); G.add(cD);
    P(boxR(-.1, .1, -1.3, .1, -.15, .15, m.bronze, cD), 'cursor');
    { const k = P(new T.Mesh(new T.ConeGeometry(.28, .5, 3), m.bronze), 'cursor'); k.rotation.z = Math.PI; k.position.y = .62; cD.add(k); }
    const et = (t, x, y, w2, o = {}) => D.etiqueta(x, y, w2, .36, Object.assign({ size: .75 }, o))(t);
    et('3 · 0 V', XA - .1, -.75, 2.2); et('1 · 10 V', XB + .1, -.75, 2.2); et('2 · salida', XA + .9, -1.95, 2.4);
    const c23 = D.cota(1.4), c12 = D.cota(2.25), t23 = D.etiqueta(0, 1.7, 3.6, .34, { size: .72 }), t12 = D.etiqueta(0, 2.55, 3.6, .34, { size: .72 });
    // gráfica V(x) a lo largo de la pista
    const GY = -3.35, GH = 1.2;
    D.linea([[XA, GY], [XB, GY]], { op: .5 }); D.linea([[XA, GY], [XA, GY + GH + .1]], { op: .5 });
    D.linea([[XA, GY], [XB, GY + GH]], { color: 0xffd166, op: .9 });
    const pt = P(new T.Mesh(new T.SphereGeometry(.1, 12, 8), new T.MeshBasicMaterial({ color: 0x7ef0b0 })), 'cursor'); G.add(pt);
    const guia = D.traza(2, { color: 0x7ef0b0, op: .7 }), guia2 = D.traza(2, { color: 0x7ef0b0, op: .4 });
    et('10 V', XA - .65, GY + GH, 1.1, { size: .7 }); et('0 V', XA - .65, GY, 1.1, { size: .7 });
    const tVo = D.etiqueta(0, 0, 1.6, .34, { size: .75, color: '#7ef0b0' });
    const tV = D.etiqueta(0, 3.3, 11, .42, { size: .78 });
    const fTD = ctx.flow({ color: 0xff5a1f, size: .07, gap: .3 }).path([D.W(XB, 0, .4), D.W(XA, 0, .4)]);
    const fCD = ctx.flow({ color: 0xffc400, size: .05, gap: .35 });
    const det = (p, Vo) => {
      const x = XA + (XB - XA) * p / 100; cD.position.x = x;
      c23(XA, x); c12(x, XB);
      t23('R 2–3 = ' + fmt(RT * p / 100 / 1000, 2) + ' kΩ'); t23.mesh.position.x = (XA + x) / 2;
      t12('R 1–2 = ' + fmt(RT * (1 - p / 100) / 1000, 2) + ' kΩ'); t12.mesh.position.x = (x + XB) / 2;
      const gy = GY + GH * p / 100; pt.position.set(x, gy, .1);
      guia.set((u, i) => i ? [x, gy, .1] : [x, -1.6, .1]); guia2.set((u, i) => i ? [XB + .2, gy, .1] : [x, gy, .1]); tVo(fmt(Vo, 2) + ' V'); tVo.mesh.position.set(XB + 1.0, gy, .1);
      tV('I = 1 mA   ·   Vo = I · R 2–3 = 1 mA · ' + fmt(RT * p / 100 / 1000, 2) + ' kΩ = ' + fmt(Vo, 2) + ' V', '#7ef0b0');
      fTD.set(1, 1.3); fCD.path([D.W(x, -.2, .4), D.W(x, -1.3, .4), D.W(XA, -1.3, .4)]).set(.8, .5);
    };

    const $ = s => panel.querySelector(s);
    const posI = $('#pos'), posV = $('#posV'), autoB = $('#auto'), msg = $('#msg'), pto = $('#pto');
    const r = { P: $('#rP'), V: $('#rV'), a: $('#r12'), b: $('#r23') }, s = { W: $('#sW'), A: $('#sA'), W2: $('#sW2'), fT: $('#fT') };
    let p = 30, auto = false, fa = 0;
    const setP = v => { p = v; posI.value = Math.round(v); posV.textContent = Math.round(v) + ' mm'; };
    posI.oninput = () => setP(+posI.value);
    autoB.onclick = () => { auto = !auto; autoB.setAttribute('aria-pressed', auto); };
    ctx.accion('carro', () => setP(p < 50 ? 90 : 10), { pista: 'Púlsalo en el modelo para moverlo de un extremo a otro.' });

    return {
      update(dt) {
        if (auto) { fa += dt * .5; setP(50 - 48 * Math.cos(fa)); }
        const xw = X0 + (X1 - X0) * p / 100;
        cur.position.x = xw; carro.position.x = xw + 6.0;
        const Vo = VIN * p / 100;
        fT.set(1, 1.2);
        fC.path([V(xw, .45, -.3), V(xw, .45, .3), V(X0, .45, .3), V(-4.6, .25, 0), ...curva(wC, 12)]).set(1, .5);
        det(p, Vo);
        disp(fmt(Vo, 2) + ' V');
        pto.setAttribute('cx', (150 + p / 100 * 140).toFixed(1)); pto.setAttribute('cy', (104 - Vo / 10 * 90).toFixed(1));
        const yW = 96 - p / 100 * 70;
        s.W.setAttribute('y1', yW); s.W.setAttribute('y2', yW); s.W2.setAttribute('y1', yW); s.W2.setAttribute('y2', 60);
        s.A.setAttribute('points', `50,${yW} 58,${yW - 5} 58,${yW + 5}`); s.W.setAttribute('x1', 70);
        s.fT.classList.add('live');
        ctx.step(auto ? 1 : 0);
        set(r.P, Math.round(p) + ' mm'); set(r.V, fmt(Vo, 2) + ' V', 'ok');
        set(r.a, fmt(RT * (1 - p / 100) / 1000, 2) + ' kΩ'); set(r.b, fmt(RT * p / 100 / 1000, 2) + ' kΩ');
        set(msg, `El cursor está al ${Math.round(p)} % del recorrido, así que recoge el ${Math.round(p)} % de la tensión: ${fmt(Vo, 2)} V. La salida es lineal con la posición.`); msg.hidden = false;
      },
      dentro: D.dentro,
      labels: [
        { p: 'pista', txt: 'Pista resistiva', at: () => D.W(XA + 1.2, .35, .3), l: 1 },
        { p: 'colectora', txt: 'Pista colectora', at: () => D.W(XB - 1.2, -1.1, .3) },
        { p: 'cursor', txt: 'Cursor', at: () => D.W(XA + (XB - XA) * p / 100 + .3, .85, .2) },
        { p: 'pista', txt: 'Pista resistiva', at: () => V(-2.5, .42, -.5), l: 1 },
        { p: 'colectora', txt: 'Pista colectora', at: () => V(-2.5, .42, .5), l: 1 },
        { p: 'cursor', txt: 'Cursor (escobilla)', at: () => cur.localToWorld(V(.3, 1.0, .6)) },
        { p: 'vastago', at: () => cur.localToWorld(V(4.5, .95, 0)) },
        { p: 'carro', txt: 'Carro de la máquina', at: () => carro.localToWorld(V(1.4, 1.8, 1.0)) },
        { p: 'terminales', txt: 'Terminales 1-2-3', at: () => V(-4.6, .3, .6), l: 1 },
        { p: 'voltimetro', txt: 'Voltímetro', at: () => V(-5.6, 2.0, 1.6) },
        { p: 'fuente', at: () => V(-7.6, 1.6, -.8), l: 1 }
      ]
    };
  }

  window.COMPONENTES.push({
    id: 'potenciometro', nombre: 'Potenciómetro de posición', categoria: 'Sensores', grupo: 'Resistivos',
    resumen: 'Un divisor de tensión con cursor: convierte una posición en una tensión.',
    titulo: 'Potenciómetro: la posición convertida en tensión',
    lead: 'Mueve el carro de la máquina: arrastra el cursor sobre la pista resistiva y la tensión de salida sube y baja en línea recta con la posición. Con «Ver por dentro» verás cómo la pista reparte la tensión.',
    camara: { pos: [1, 10, 14.5], tgt: [.4, .4, 0] }, suelo: -.32,
    panel: PANEL, build,
    leyenda: [['#ff5a1f', 'Corriente por la pista'], ['#ffc400', 'Señal del cursor al voltímetro']],
    pasos: [
      ['1. Pista alimentada', 'Entre los terminales 1 y 3 se aplican 10 V. La corriente recorre toda la pista resistiva y la tensión se reparte a lo largo de ella (de 10 V a 0 V).'],
      ['2. El cursor toma una parte', 'La escobilla toca la pista en un punto y lleva esa tensión por la pista colectora al terminal 2. Es un divisor de tensión: Vs = Vin · x / L.']
    ],
    partes: {
      cuerpo:     { t: 'Cuerpo', d: 'Carcasa que guía el cursor y protege las pistas del polvo.' },
      tapa:       { t: 'Tapa', d: 'Aquí transparente para ver el interior.' },
      pista:      { t: 'Pista resistiva', d: 'Capa de carbón, cermet o plástico conductor. Los colores indican la tensión en cada punto: rojo 10 V, azul 0 V.' },
      colectora:  { t: 'Pista colectora', d: 'Pista de baja resistencia por la que sale la tensión del cursor hacia el terminal 2.' },
      cursor:     { t: 'Cursor (escobilla)', d: 'Contactos elásticos que rozan las dos pistas. El rozamiento hace que se desgasten y aparezca ruido con el tiempo.' },
      vastago:    { t: 'Vástago', d: 'Une el cursor con la pieza cuya posición se mide.' },
      carro:      { t: 'Carro de la máquina', d: 'Pieza cuya posición se mide.' },
      terminales: { t: 'Terminales 1, 2 y 3', d: '1 y 3: extremos de la pista (alimentación). 2: cursor (salida).' },
      fuente:     { t: 'Fuente de 10 V', d: 'Alimenta la pista.' },
      voltimetro: { t: 'Voltímetro', d: 'Mide la tensión del cursor: es la señal de posición.' },
      cables:     { t: 'Cables', d: 'Rojo: +10 V. Negro: 0 V. Amarillo: salida.' },
      base:       { t: 'Base', d: 'Bancada del montaje.' }
    },
    extra: `
      <div class="two">
        <div>
          <h2>Ventajas e inconvenientes</h2>
          <p>Es el sensor de posición más sencillo y barato, y su salida es lineal. Pero el cursor roza, se desgasta y genera ruido; además la resolución depende del material de la pista. Para medir sin contacto se usan LVDT o sensores capacitivos.</p>
          <p>Hay potenciómetros lineales (desplazamiento) y rotativos (ángulo), por ejemplo en joysticks, pedales de acelerador o válvulas.</p>
        </div>
        <div>
          <h2>Cuidado con la carga</h2>
          <p>Si el aparato que lee la salida tiene poca resistencia de entrada, se lleva corriente del cursor y la tensión ya no es proporcional a la posición. Por eso se lee con entradas de alta impedancia (voltímetro, entrada analógica de PLC).</p>
        </div>
      </div>`
  });
})();
