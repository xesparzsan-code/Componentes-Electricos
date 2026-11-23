// Componente: motor de corriente continua de imanes permanentes, rotor de 3 polos y colector
(() => {
  const { set, fmt } = UT;
  const ANG = [0, 2 * Math.PI / 3, 4 * Math.PI / 3];

  const PANEL = `
    <button class="big" id="s1" aria-pressed="false">Conectar el motor</button>
    <label class="sp"><span>Tensión</span><input type="range" id="volt" min="0" max="12" step="0.5" value="9"><b id="voltV">9,0 V</b></label>
    <label class="sp"><span>Carga en el eje</span><input type="range" id="carga" min="0" max="1" step="0.05" value="0.2"><b id="cargaV">20 %</b></label>
    <button class="sm" id="inv">Invertir la polaridad</button>
    <p class="msg" id="msg" hidden></p>
    ${UT.dl([['rV', 'Tensión aplicada', '0 V'], ['rI', 'Corriente', '0 A'], ['rW', 'Velocidad', '0 rpm'], ['rS', 'Sentido de giro', '—']])}
    <svg class="sch" viewBox="0 0 300 110" aria-label="Esquema: fuente de continua, interruptor S1 y motor M">
      <line x1="40" y1="40" x2="40" y2="48"/><line x1="28" y1="48" x2="52" y2="48"/><line x1="33" y1="55" x2="47" y2="55"/><line x1="40" y1="55" x2="40" y2="70"/>
      <text id="sPa" x="56" y="50">+</text><text id="sPb" x="56" y="60">−</text>
      <line x1="40" y1="40" x2="40" y2="20"/><line x1="40" y1="20" x2="100" y2="20"/><circle cx="100" cy="20" r="2.5"/>
      <line id="sS" x1="100" y1="20" x2="136" y2="8"/><circle cx="140" cy="20" r="2.5"/><text x="108" y="38">S1</text>
      <line x1="140" y1="20" x2="210" y2="20"/><line x1="210" y1="20" x2="210" y2="33"/>
      <circle cx="210" cy="55" r="22"/><text x="203" y="60">M</text><text x="236" y="40" id="sMp">+</text>
      <line x1="210" y1="77" x2="210" y2="95"/><line x1="210" y1="95" x2="40" y2="95"/><line x1="40" y1="95" x2="40" y2="70"/>
      <path id="fC" class="flow fl" d="M40 40 V20 H210 V95 H40 Z"/>
      <rect class="hit" id="hS" x="94" y="2" width="52" height="30" rx="5"/><rect class="hit" id="hM" x="186" y="31" width="48" height="48" rx="24"/><rect class="hit" id="hB" x="20" y="38" width="44" height="26" rx="5"/>
    </svg>
    <p class="nota-sch">En el esquema: pulsa S1 o el motor M para ponerlo en marcha o pararlo, y la pila para invertir la polaridad.</p>
    <div class="chk"><label><input type="checkbox" id="cField" checked> Campo de los imanes</label></div>`;

  function build(ctx, panel) {
    const { T, V, scene, M, boxR, cyl, tube, curva, part: P } = ctx;
    const m = UT.mats(ctx), lam = UT.laminado(ctx, 6);
    const ejeX = o => { o.rotation.z = Math.PI / 2; return o; };

    // carcasa cortada (mitad trasera), imanes y cojinetes
    const shell = P(new T.Mesh(new T.CylinderGeometry(2.2, 2.2, 4.2, 56, 1, true, Math.PI / 2, Math.PI), M(0x5d656e, { metalness: .6, roughness: .4, side: T.DoubleSide })), 'carcasa');
    ejeX(shell); ctx.add(shell);
    P(ctx.add(new T.Mesh(UT.sector(2.0, 2.2, Math.PI / 2, 3 * Math.PI / 2, .25), M(0x5d656e, { metalness: .6, roughness: .4 }))), 'carcasa').position.x = -2.2;
    const imN = P(ctx.add(new T.Mesh(UT.sector(1.45, 1.95, Math.PI / 2 - .95, Math.PI / 2 + .95, 3.0), M(0xc62828, { roughness: .5 }))), 'imanes');
    const imS = P(ctx.add(new T.Mesh(UT.sector(1.45, 1.95, -Math.PI / 2 - .95, -Math.PI / 2 + .95, 3.0), M(0x1f4e9c, { roughness: .5 }))), 'imanes');
    UT.rotulo(ctx, 'N', .5, .5, V(1.51, 1.7, 0), [0, Math.PI / 2, 0], { color: '#fff', size: 90 });
    UT.rotulo(ctx, 'S', .5, .5, V(1.51, -1.7, 0), [0, Math.PI / 2, 0], { color: '#fff', size: 90 });
    P(boxR(-3.2, 3.4, -2.6, -2.2, -1.2, 1.2, M(0x3d342c, { roughness: .8 })), 'base');

    // rotor
    const rot = new T.Group(); scene.add(rot);
    ejeX(P(cyl(.14, 7.2, m.steel, .3, 0, 0, rot, 16), 'eje'));
    ejeX(P(cyl(.45, 2.6, lam, 0, 0, 0, rot, 24), 'rotor'));
    const brazos = ANG.map((a, k) => {
      const g = new T.Group(); g.rotation.x = a; rot.add(g);
      P(boxR(-1.3, 1.3, .4, 1.05, -.2, .2, lam, g), 'rotor');
      P(ctx.add(new T.Mesh(UT.sector(1.05, 1.3, Math.PI / 2 - .62, Math.PI / 2 + .62, 2.6), lam), g), 'rotor');
      const c = P(boxR(-1.45, 1.45, .48, .98, -.42, .42, m.wind, g), 'bobinas');
      P(ctx.add(new T.Mesh(UT.sector(.32, .5, Math.PI / 2 + .3, Math.PI / 2 + .3 + 2 * Math.PI / 3 - .15, .7), m.copper), g), 'colector').position.x = 2.75;
      return { g, c };
    });
    ejeX(P(cyl(.3, .76, m.dark, 2.75, 0, 0, rot, 20), 'colector'));
    const disco = ejeX(P(cyl(.55, .16, m.steel, 3.75, 0, 0, rot, 30), 'eje'));
    P(boxR(3.66, 3.84, .1, .52, -.08, .08, m.yellow, rot), 'eje');
    for (const x of [-2.35, 2.25]) ejeX(P(cyl(.32, .3, m.zinc, x, 0, 0, null, 24), 'cojinetes'));

    // escobillas y portaescobillas
    for (const sg of [1, -1]) {
      P(boxR(2.55, 2.95, sg > 0 ? .5 : -1.1, sg > 0 ? 1.1 : -.5, -.15, .15, M(0x2a2a2a, { roughness: .9 })), 'escobillas');
      P(boxR(2.5, 3.0, sg > 0 ? .9 : -1.45, sg > 0 ? 1.45 : -.9, -.2, -.15, m.bronze), 'escobillas');
      P(boxR(2.5, 3.0, sg > 0 ? .9 : -1.45, sg > 0 ? 1.45 : -.9, .15, .2, m.bronze), 'escobillas');
      const mu = UT.muelle(ctx, .1, 5, .02, m.steel, 'escobillas'); mu.unir(V(2.75, sg * 1.1, 0), V(2.75, sg * 1.45, 0));
    }
    const wA = [V(2.75, 1.1, .1), V(3.3, 1.9, .4), V(5.0, 1.9, .4), V(5.7, .75, .3)];
    const wB = [V(5.7, .75, -.3), V(5.0, -1.9, .4), V(3.3, -1.9, .4), V(2.75, -1.1, .1)];
    const cA = P(tube(wA, .07, m.red), 'cables'), cB = P(tube(wB, .07, m.black), 'cables');
    P(boxR(5.1, 6.5, -1.4, .75, -.8, .8, m.dark), 'fuente');
    const rotF = UT.rotulo(ctx, [['FUENTE', 48], ['0 – 12 V', 44]], 1.2, .8, V(5.8, -.3, .81), [0, 0, 0], { color: '#e9e8e3' });

    // corriente: por la escobilla superior, el segmento, la bobina que está horizontal y la escobilla inferior
    const fC = ctx.flow({ color: 0xff5a1f, size: .065, gap: .22 }), fF = [];
    const loops = [-.9, 0, .9].map(x => [V(x, 1.45, .05), V(x, .5, .05), V(x, -.5, .05), V(x, -1.45, .05), V(x, -2.0, -.4), V(x, -1.5, -1.5), V(x, 0, -2.05), V(x, 1.5, -1.5), V(x, 2.0, -.4), V(x, 1.45, .05)]);
    loops.forEach(l => fF.push(ctx.flow({ color: 0x2f8cff, size: .05, gap: .22 }).path(curva(l, 60))));
    function bobinaPath(k) {
      const g = brazos[k].g, pts = [g.localToWorld(V(2.4, .5, .25)), g.localToWorld(V(1.6, .75, .45))];
      for (let t = 0; t < 2; t++) { const y = .6 + t * .2; pts.push(g.localToWorld(V(1.5, y, .45)), g.localToWorld(V(-1.5, y, .45)), g.localToWorld(V(-1.5, y, -.45)), g.localToWorld(V(1.5, y + .1, -.45))); }
      pts.push(g.localToWorld(V(2.4, .5, -.25)));
      return pts;
    }

    const $ = s => panel.querySelector(s);
    const s1B = $('#s1'), volt = $('#volt'), voltV = $('#voltV'), car = $('#carga'), carV = $('#cargaV'), inv = $('#inv'), msg = $('#msg'), cField = $('#cField');
    const r = { V: $('#rV'), I: $('#rI'), W: $('#rW'), S: $('#rS') }, s = { s: $('#sS'), f: $('#fC'), pa: $('#sPa'), pb: $('#sPb'), mp: $('#sMp') };
    let on = false, Vv = 9, carga = .2, pol = 1, w = 0, ang = 0, dirSvg = '';
    s1B.onclick = () => { on = !on; s1B.setAttribute('aria-pressed', on); s1B.textContent = on ? 'Desconectar el motor' : 'Conectar el motor'; };
    volt.oninput = () => { Vv = +volt.value; voltV.textContent = fmt(Vv, 1) + ' V'; };
    car.oninput = () => { carga = +car.value; carV.textContent = Math.round(carga * 100) + ' %'; };
    UT.hit(panel, '#hS', () => s1B.onclick(), false, 'Interruptor S1');
    UT.hit(panel, '#hM', () => s1B.onclick(), false, 'Motor: marcha o paro');
    UT.hit(panel, '#hB', () => inv.onclick(), false, 'Fuente: invertir la polaridad');
    let freno = false;
    ctx.accion('fuente', () => s1B.onclick(), { pista: 'Púlsala en el modelo para conectar o desconectar el motor.' });
    ctx.accion('eje', v => { freno = v; }, { mantener: true, pista: 'Mantenlo pulsado en el modelo para frenarlo con la mano: baja la velocidad y sube la corriente.' });
    inv.onclick = () => { pol = -pol; cA.material.color.setHex(pol > 0 ? 0xc62828 : 0x17191d); cB.material.color.setHex(pol > 0 ? 0x17191d : 0xc62828); };

    return {
      tecla: () => s1B.onclick(),
      update(dt) {
        const Va = on ? Vv : 0, cargaEf = freno ? Math.max(carga, .95) : carga;
        const wObj = pol * (Va / 12) * 1.25 * (1 - .65 * cargaEf);     // vueltas por segundo (visual)
        w += (wObj - w) * Math.min(1, dt * (1.2 + cargaEf));
        ang += w * Math.PI * 2 * dt; rot.rotation.x = ang; rot.updateMatrixWorld();
        // bobina con el brazo más horizontal (la que da más par)
        let k = 0, best = 9; ANG.forEach((a, i) => { const v = Math.abs(Math.cos(a + ang)); if (v < best) { best = v; k = i; } });
        brazos.forEach((b, i) => { b.c.material.emissiveIntensity = on && i === k && Va > 0 ? .25 : 0; });
        const Iarr = Va > 0 ? (Va / 12) * (.25 + 1.8 * cargaEf + 2.5 * Math.max(0, 1 - Math.abs(w) / Math.max(.01, Math.abs(wObj)))) : 0;
        const p = [...curva(wA).reverse(), V(2.75, .5, 0), ...bobinaPath(k), V(2.75, -.5, 0), ...curva(wB).reverse()];
        fC.path(pol > 0 ? p : p.slice().reverse()).set(Va > 0 ? 1 : 0, .6 + Va / 12 * 1.4);
        fF.forEach(f => f.set(cField.checked ? .8 : 0, .7));

        ctx.step(!on ? 0 : pol < 0 ? 3 : Math.abs(w) < Math.abs(wObj) * .6 ? 1 : 2);
        set(r.V, fmt(Va * pol, 1) + ' V', Va > 0 ? 'on' : '');
        set(r.I, fmt(Iarr, 2) + ' A');
        set(r.W, Math.round(Math.abs(w) / 1.25 * 3000) + ' rpm');
        set(r.S, Math.abs(w) < .02 ? '—' : (w > 0 ? 'horario' : 'antihorario'));
        const t = on && Va === 0 ? 'Con 0 V no circula corriente y no hay par.'
          : on && (freno || carga > .75) ? 'Mucha carga: el motor va más lento y toma más corriente para dar más par.'
          : on ? 'El colector cambia la bobina alimentada a medida que gira, para que el par empuje siempre en el mismo sentido.' : '';
        set(msg, t); msg.hidden = !t;
        s.s.setAttribute('x2', on ? 140 : 136); s.s.setAttribute('y2', on ? 20 : 8);
        s.pa.textContent = pol > 0 ? '+' : '−'; s.pb.textContent = pol > 0 ? '−' : '+'; s.mp.textContent = pol > 0 ? '+' : '−';
        s.f.classList.toggle('live', Va > 0);
        const d = pol > 0 ? 'normal' : 'reverse'; if (d !== dirSvg) { s.f.style.animationDirection = d; dirSvg = d; }
      },
      labels: [
        { p: 'imanes', txt: 'Imán N', at: () => V(-1.5, 1.95, 0), l: 1 },
        { p: 'imanes', txt: 'Imán S', at: () => V(-1.5, -1.95, 0), l: 1 },
        { p: 'bobinas', txt: 'Bobinas del rotor', at: () => brazos[0].g.localToWorld(V(-1.45, .9, .42)), l: 1 },
        { p: 'colector', at: () => V(3.1, -.3, .45) },
        { p: 'escobillas', at: () => V(3.0, 1.3, .2) },
        { p: 'eje', at: () => V(4.1, .45, 0) },
        { p: 'carcasa', at: () => V(-.5, 1.9, -1.3), l: 1 },
        { p: 'fuente', at: () => V(6.5, .5, .8) }
      ]
    };
  }

  window.COMPONENTES.push({
    id: 'motor-cc', nombre: 'Motor de corriente continua', categoria: 'Máquinas',
    resumen: 'Inductor, inducido, colector y escobillas en movimiento.',
    titulo: 'Motor de corriente continua: imanes, bobinas y un colector',
    lead: 'Conecta el motor, cambia la tensión para variar la velocidad y añade carga en el eje. Invierte la polaridad para cambiar el sentido de giro.',
    camara: { pos: [10.5, 6, 11.5], tgt: [1.7, -.3, 0] }, suelo: -2.62,
    panel: PANEL, build,
    leyenda: [['#ff5a1f', 'Corriente por el inducido'], ['#2f8cff', 'Campo de los imanes (N → S)']],
    pasos: [
      ['1. Corriente por el inducido', 'La fuente empuja la corriente por la escobilla, el segmento del colector que toca y la bobina del rotor, que se convierte en un electroimán.'],
      ['2. Par motor', 'Los polos del rotor son atraídos y repelidos por los imanes del estátor. La fuerza aparece en los lados de la bobina y hace girar el rotor.'],
      ['3. Conmutación', 'Al girar, el colector cambia qué bobina recibe corriente y en qué sentido. Así el par sigue empujando siempre hacia el mismo lado.'],
      ['4. Velocidad y sentido', 'Más tensión, más velocidad. Más carga, menos velocidad y más corriente. Al invertir la polaridad la corriente circula al revés y el motor gira en sentido contrario.']
    ],
    partes: {
      carcasa:    { t: 'Carcasa (culata)', d: 'Cilindro de acero que sujeta los imanes y cierra el camino del campo magnético por fuera. Aquí se ha cortado la mitad delantera.' },
      imanes:     { t: 'Imanes permanentes (inductor)', d: 'Crean el campo fijo del estátor: polo norte arriba y sur abajo. En motores grandes se usan bobinas en lugar de imanes.' },
      rotor:      { t: 'Rotor (inducido)', d: 'Núcleo de chapas con tres polos. Es la parte que gira.' },
      bobinas:    { t: 'Bobinas del rotor', d: 'Cada polo lleva una bobina. Se ilumina la que recibe corriente en cada momento.' },
      colector:   { t: 'Colector (delgas)', d: 'Segmentos de cobre aislados entre sí y unidos a las bobinas. Al girar, cambian qué bobina se conecta a las escobillas.' },
      escobillas: { t: 'Escobillas', d: 'Bloques de carbón que rozan el colector, empujados por muelles. Son la pieza que más se desgasta del motor.' },
      eje:        { t: 'Eje', d: 'Transmite el giro a la máquina. La marca amarilla permite ver el sentido de giro.' },
      cojinetes:  { t: 'Cojinetes', d: 'Rodamientos que sujetan el eje y le dejan girar con poco rozamiento.' },
      base:       { t: 'Base', d: 'Soporte del motor.' },
      fuente:     { t: 'Fuente de continua', d: 'Fuente regulable de 0 a 12 V.' },
      cables:     { t: 'Cables', d: 'Rojo: positivo. Negro: negativo. Cambian al invertir la polaridad.' }
    },
    extra: `
      <div class="two">
        <div>
          <h2>Cómo se controla</h2>
          <p><b>Velocidad</b>: es casi proporcional a la tensión aplicada. Por eso se regula con una fuente variable o con PWM (pulsos rápidos de tensión).</p>
          <p><b>Sentido</b>: se invierte cambiando la polaridad de la alimentación, por ejemplo con dos relés o un puente en H.</p>
          <p><b>Corriente</b>: depende de la carga. En el arranque, con el motor parado, la corriente es mucho mayor porque todavía no hay fuerza contraelectromotriz.</p>
          <p class="note">La simulación muestra una sola bobina alimentada para que se vea el camino; en un motor real conducen varias a la vez.</p>
        </div>
        <div>
          <h2>Partes del motor</h2>
          <table><tbody>
            <tr><td>Estátor (inductor)</td><td>Parte fija que crea el campo: carcasa e imanes</td></tr>
            <tr><td>Rotor (inducido)</td><td>Parte que gira: chapas, bobinas y colector</td></tr>
            <tr><td>Colector + escobillas</td><td>Llevan la corriente al rotor y la conmutan</td></tr>
          </tbody></table>
        </div>
      </div>`
  });
})();
