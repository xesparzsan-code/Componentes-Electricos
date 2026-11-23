// Componente: detector inductivo de proximidad M18 (PNP, NA) detectando piezas de distintos materiales
(() => {
  const { set, fmt } = UT;
  const SN = 8, MM = 5;   // distancia nominal (mm) y mm por unidad de la escena
  const MAT = { acero: [1, 0x8a929c, 'Acero'], aluminio: [.4, 0xd6dade, 'Aluminio'], laton: [.5, 0xd4af37, 'Latón'], plastico: [0, 0x2e8b3e, 'Plástico'], vidrio: [0, 0xa8d8e8, 'Vidrio'] };

  const PANEL = `
    <label class="sp"><span>Distancia a la pieza</span><input type="range" id="dist" min="0" max="30" step="0.5" value="22"><b id="distV">22 mm</b></label>
    <div><h3>Material de la pieza</h3><div class="row tres" id="mat">
      <button class="sm" data-v="acero" aria-pressed="true">Acero</button><button class="sm" data-v="aluminio" aria-pressed="false">Aluminio</button>
      <button class="sm" data-v="laton" aria-pressed="false">Latón</button><button class="sm" data-v="plastico" aria-pressed="false">Plástico</button><button class="sm" data-v="vidrio" aria-pressed="false">Vidrio</button></div></div>
    <button class="sm" id="auto" aria-pressed="false">Pieza en movimiento (cinta)</button>
    <p class="msg" id="msg" hidden></p>
    ${UT.dl([['rD', 'Distancia', ''], ['rS', 'Distancia de conmutación real', ''], ['rA', 'Amplitud del oscilador', '100 %'], ['rO', 'Salida PNP (cable negro)', 'desactivada']])}
    <svg class="sch" viewBox="0 0 300 124" aria-label="Conexión del detector PNP de tres hilos con una carga, y señal del oscilador">
      <text x="4" y="16">+24 V</text><line x1="10" y1="22" x2="110" y2="22"/><text x="40" y="18">BN</text>
      <rect x="20" y="34" width="56" height="44"/><path d="M48 40 l12 16 l-12 16 l-12 -16 z"/><text x="24" y="92">B1</text>
      <line x1="40" y1="22" x2="40" y2="34"/><line x1="56" y1="34" x2="56" y2="28"/><line x1="56" y1="28" x2="110" y2="28" class="thin"/>
      <line x1="76" y1="56" x2="110" y2="56"/><text x="82" y="52">BK</text><circle id="h1" cx="122" cy="56" r="11"/><path d="M114 48l16 16M130 48l-16 16"/>
      <line x1="134" y1="56" x2="150" y2="56"/><line x1="150" y1="56" x2="150" y2="108"/><line x1="150" y1="108" x2="40" y2="108"/><line x1="40" y1="108" x2="40" y2="78"/><text x="4" y="112">0 V</text><text x="58" y="104">BU</text>
      <path id="fO" class="flow fl" d="M10 22 H40 V34 M76 56 H150 V108 H40 V78"/>
      <text x="176" y="16">Oscilador</text><line x1="170" y1="62" x2="296" y2="62" class="thin"/>
      <path id="osc" class="curva" d=""/>
    </svg>
    <div class="chk"><label><input type="checkbox" id="cIn" checked> Ver por dentro</label></div>`;

  function build(ctx, panel) {
    const { T, V, scene, M, boxR, cyl, tube, curva, part: P } = ctx;
    const m = UT.mats(ctx);
    const ejeX = o => { o.rotation.z = Math.PI / 2; return o; };
    const Y = 1.6;

    P(boxR(-6, 7.5, -.3, 0, -2.2, 2.2, M(0x6b737b, { metalness: .4, roughness: .5 })), 'cinta');
    P(boxR(-3.6, -2.4, 0, Y - .95, -.6, .6, m.plastic), 'soporte');
    const cs = UT.cuerpoSensor(ctx, { x0: 0, x1: -4.2, y: Y, r: .9, cara: 0x2f6fb5 });
    // interior: ferrita en cazoleta, bobina y electrónica
    ejeX(P(cyl(.82, .45, M(0x2a2a2e, { roughness: .8 }), -.45, Y, 0, null, 32), 'ferrita'));
    const bob = P(new T.Mesh(new T.TorusGeometry(.48, .13, 10, 32), m.wind), 'bobina'); bob.rotation.y = Math.PI / 2; bob.position.set(-.3, Y, 0); scene.add(bob);
    P(boxR(-3.7, -.8, Y - .5, Y + .5, -.04, .04, M(0x1f6b3a, { roughness: .6 })), 'circuito');
    [[-1.4, .2], [-2.1, -.15], [-2.9, .15]].forEach(([x, dy]) => P(boxR(x - .3, x + .3, Y + dy - .14, Y + dy + .14, .04, .16, m.black), 'circuito'));
    const cab = [V(-4.4, Y, 0), V(-5.2, Y, 0), V(-5.6, .6, .3), V(-5.6, .05, 1.2)];
    P(tube(cab, .14, M(0x3a3e45, { roughness: .6 })), 'cable');
    const wBK = [V(-5.6, .1, 1.3), V(-3, .15, 1.9), V(2.5, .15, 1.9), V(4.0, .15, 1.5)];
    P(tube(wBK, .05, m.black), 'cable');
    const lamp = UT.bombilla(ctx, V(4.6, 0, 1.5), 'carga', .55);

    // pieza que se acerca por una guía
    P(boxR(0, 7.4, 0, .2, -.5, .5, m.steel), 'cinta');
    const pieza = new T.Group(); scene.add(pieza);
    const pm = P(boxR(0, 1.4, .2, 3.0, -.9, .9, M(0x8a929c, { metalness: .7, roughness: .35 }), pieza), 'pieza');

    // campo alterno delante de la cara y corrientes de Foucault en la pieza
    const campo = [];
    for (const a of [0, Math.PI / 3, 2 * Math.PI / 3, Math.PI, 4 * Math.PI / 3, 5 * Math.PI / 3]) {
      const pts = []; for (let i = 0; i <= 30; i++) { const t = i / 30 * Math.PI; const rr = .2 + .55 * (1 - Math.cos(t)) / 2, x = .9 * Math.sin(t); pts.push(V(x, Y + Math.cos(a) * rr, Math.sin(a) * rr)); }
      campo.push(ctx.flow({ color: 0x2f8cff, size: .05, gap: .15 }).path(pts));
    }
    const fou = ctx.flow({ color: 0xff5a1f, size: .06, gap: .16 });
    const fO = ctx.flow({ color: 0xffc400, size: .05, gap: .25 }).path(curva(wBK, 30));

    const $ = s => panel.querySelector(s);
    const dist = $('#dist'), distV = $('#distV'), msg = $('#msg'), autoB = $('#auto'), osc = $('#osc');
    const r = { D: $('#rD'), S: $('#rS'), A: $('#rA'), O: $('#rO') }, s = { h1: $('#h1'), fO: $('#fO') };
    let d = 22, mat = 'acero', on = false, auto = false, fase = 0, amp = 1;
    const setD = v => { d = v; dist.value = v; distV.textContent = fmt(v, 1) + ' mm'; };
    dist.oninput = () => setD(+dist.value);
    UT.opciones($('#mat'), v => { mat = v; pm.material.color.setHex(MAT[v][1]); pm.material.metalness = MAT[v][0] > 0 ? .7 : 0; pm.material.transparent = v === 'vidrio'; pm.material.opacity = v === 'vidrio' ? .55 : 1; });
    autoB.onclick = () => { auto = !auto; autoB.setAttribute('aria-pressed', auto); };
    $('#cIn').onchange = e => cs.setCorte(e.target.checked);
    ctx.accion('pieza', () => setD(d > 6 ? 2 : 22), { pista: 'Púlsala en el modelo para acercarla o alejarla del detector.' });

    return {
      update(dt) {
        if (auto) { fase += dt * .7; setD(Math.round((15 + 14 * Math.cos(fase)) * 2) / 2); }
        pieza.position.x = .25 + d / MM;
        const k = MAT[mat][0], Sr = SN * k;
        if (!on && k > 0 && d <= Sr) on = true; else if (on && (k === 0 || d > Sr * 1.1)) on = false;
        const ampT = k > 0 ? Math.max(.15, Math.min(1, (d / Math.max(Sr, .1)) * .55 + .1)) : 1;
        amp += (ampT - amp) * Math.min(1, dt * 8);
        campo.forEach(f => f.set(amp, 1.2));
        const ff = k > 0 ? Math.max(0, 1 - d / (Sr * 2.2)) : 0;
        const xf = pieza.position.x - .02, cir = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2; cir.push(V(xf, Y + Math.cos(a) * .55, Math.sin(a) * .55)); }
        fou.path(cir).set(ff, 1.4);
        cs.led.material.emissiveIntensity = on ? 2 : 0;
        lamp.setLuz(on ? 1 : 0); fO.set(on ? 1 : 0, 1.3);

        let dd = 'M170 62'; for (let i = 0; i <= 120; i++) { const x = 170 + i * 126 / 120; dd += ` L${x.toFixed(1)} ${(62 - Math.sin(i / 120 * Math.PI * 10) * 36 * amp).toFixed(1)}`; } osc.setAttribute('d', dd);
        ctx.step(on ? 2 : k === 0 ? 3 : amp < .9 ? 1 : 0);
        set(r.D, fmt(d, 1) + ' mm');
        set(r.S, k > 0 ? fmt(Sr, 1) + ' mm' : 'no detecta');
        set(r.A, Math.round(amp * 100) + ' %');
        set(r.O, on ? 'activada' : 'desactivada', on ? 'ok' : '');
        const t = k === 0 ? `El ${MAT[mat][2].toLowerCase()} no es metálico: no se inducen corrientes y el oscilador no se amortigua. Para detectarlo hace falta un detector capacitivo.`
          : on ? `Pieza dentro de la distancia de conmutación: el oscilador está amortiguado y la salida PNP pone 24 V en el cable negro.`
          : k < 1 ? `Con ${MAT[mat][2].toLowerCase()} la distancia real es menor que con acero (factor de corrección ${fmt(k, 1)}).` : '';
        set(msg, t); msg.hidden = !t;
        UT.lit(s.h1, on, '#ffc04a'); s.fO.classList.toggle('live', on);
      },
      labels: [
        { p: 'cara', txt: 'Cara sensible', at: () => V(0, Y + .9, 0) },
        { p: 'bobina', at: () => V(-.3, Y - .6, .2), l: 1 },
        { p: 'ferrita', txt: 'Núcleo de ferrita', at: () => V(-.6, Y + .85, 0), l: 1 },
        { p: 'circuito', txt: 'Oscilador y disparador', at: () => V(-2.2, Y + .55, .1) },
        { p: 'led', txt: 'LED', at: () => V(-4.2, Y + .75, 0), l: 1 },
        { p: 'tuercas', at: () => V(-3.4, Y - 1.25, 0), l: 1 },
        { p: 'pieza', at: () => pieza.localToWorld(V(1.4, 3.0, .9)) },
        { p: 'carga', txt: 'Carga (entrada de PLC)', at: () => V(5.0, .9, 1.5) }
      ]
    };
  }

  window.COMPONENTES.push({
    id: 'inductivo', nombre: 'Detector inductivo', categoria: 'Sensores', grupo: 'Inductivos',
    resumen: 'Detecta metales sin tocarlos gracias a un campo magnético alterno.',
    titulo: 'Detector inductivo de proximidad: ve el metal sin tocarlo',
    lead: 'Acerca la pieza al detector y cambia su material. Mira cómo el metal amortigua el oscilador y la salida conmuta; con plástico o vidrio no pasa nada.',
    camara: { pos: [3, 6.5, 15], tgt: [.7, 1.2, 0] }, suelo: -.32,
    panel: PANEL, build,
    leyenda: [['#2f8cff', 'Campo alterno de la bobina'], ['#ff5a1f', 'Corrientes de Foucault'], ['#ffc400', 'Salida hacia la carga']],
    pasos: [
      ['1. Sin pieza', 'El oscilador alimenta la bobina con alterna de alta frecuencia. La ferrita dirige el campo hacia delante de la cara sensible.'],
      ['2. Se acerca un metal', 'El campo induce corrientes de Foucault en el metal. Esas corrientes crean un campo opuesto y absorben energía: la amplitud del oscilador baja.'],
      ['3. Conmutación', 'Cuando la amplitud cae por debajo del umbral, el disparador activa la salida. Al alejarse la pieza vuelve a desactivarse con algo de histéresis.'],
      ['4. Materiales no metálicos', 'Plástico, vidrio o madera no tienen electrones libres que formen corrientes: el detector inductivo no los ve. Los metales no férricos se detectan a menos distancia.']
    ],
    partes: {
      cuerpo:   { t: 'Cuerpo roscado M18', d: 'Tubo metálico con rosca para fijarlo con dos tuercas y ajustar a qué distancia queda de las piezas.' },
      cara:     { t: 'Cara sensible', d: 'Frente de plástico por el que sale el campo. Delante de ella está la zona de detección.' },
      ferrita:  { t: 'Núcleo de ferrita', d: 'Cazoleta que concentra el campo de la bobina hacia delante y lo protege por detrás.' },
      bobina:   { t: 'Bobina del oscilador', d: 'Junto con un condensador forma un circuito oscilante. Su campo alterno es el que "palpa" el metal.' },
      circuito: { t: 'Oscilador, demodulador y disparador', d: 'Mide la amplitud de la oscilación y, cuando baja de un umbral, conmuta la salida (transistor PNP o NPN).' },
      led:      { t: 'LED de estado', d: 'Se enciende cuando el detector tiene la salida activada.' },
      tuercas:  { t: 'Tuercas de fijación', d: 'Fijan el detector al soporte y permiten ajustar su posición.' },
      cable:    { t: 'Cable de 3 hilos', d: 'Marrón (BN): +24 V. Azul (BU): 0 V. Negro (BK): salida.' },
      pieza:    { t: 'Pieza a detectar', d: 'Cambia su material en el panel. Se detecta el metal; el plástico y el vidrio no.' },
      carga:    { t: 'Carga', d: 'Representa la entrada de un PLC o un relé conectado a la salida negra.' },
      soporte:  { t: 'Soporte', d: 'Escuadra que sujeta el detector.' },
      cinta:    { t: 'Bancada', d: 'Base y guía por la que se mueve la pieza.' }
    },
    extra: `
      <div class="two">
        <div>
          <h2>Datos importantes</h2>
          <p><b>Distancia nominal Sn</b>: la que da el fabricante con una placa de acero normalizada (aquí 8 mm). Con otros metales se multiplica por un factor de corrección: aluminio ≈ 0,4, latón ≈ 0,5, cobre ≈ 0,3.</p>
          <p><b>Enrasado o no enrasado</b>: el enrasado se puede montar con la cara a ras del metal, pero detecta a menos distancia.</p>
          <p><b>PNP o NPN</b>: en un PNP la salida da +24 V al activarse (la carga va entre negro y 0 V); en un NPN la salida conecta a 0 V.</p>
        </div>
        <div>
          <h2>Inductivo o capacitivo</h2>
          <table><tbody>
            <tr><td>Inductivo</td><td>Solo metales. Muy robusto, no le afectan polvo ni humedad</td></tr>
            <tr><td>Capacitivo</td><td>Casi cualquier material, también líquidos a través de una pared</td></tr>
          </tbody></table>
          <p class="note">Ejemplo típico: contar piezas de aluminio que pasan entre cajas de cartón por una cinta.</p>
        </div>
      </div>`
  });
})();
