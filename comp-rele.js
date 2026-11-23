// Componente: relé electromecánico de un contacto conmutado (1 C/O)
window.COMPONENTES.push({
  id: 'rele',
  nombre: 'Relé electromecánico',
  categoria: 'Mando y maniobra',
  resumen: 'Un electroimán que, con una corriente pequeña, abre y cierra otro circuito.',
  titulo: 'Relé electromecánico: cómo conmuta por dentro',
  lead: 'Excita la bobina y mira cómo el núcleo atrae la armadura y el común salta de NC a NA. Pulsa sobre cualquier pieza para saber qué hace.',
  camara: { pos: [5.5, 6.5, 11], tgt: [-1, 2.2, 0] },

  partes: {
    bobina:   { t: 'Bobina', d: 'Hilo de cobre esmaltado enrollado sobre un carrete. Cuando circula corriente entre A1 y A2 crea un campo magnético.' },
    nucleo:   { t: 'Núcleo', d: 'Cilindro de hierro dulce dentro de la bobina. Concentra el campo magnético y se convierte en un electroimán mientras hay corriente; al cortarla pierde el magnetismo.', ver: ['bobina', 'carrete'] },
    carrete:  { t: 'Carrete', d: 'Soporte de plástico aislante sobre el que se enrolla el hilo de la bobina. Sus pestañas evitan que las espiras se salgan.' },
    yugo:     { t: 'Yugo', d: 'Pieza de hierro en forma de L. Cierra el circuito magnético entre el núcleo y la armadura para que la atracción sea más fuerte.' },
    armadura: { t: 'Armadura', d: 'Chapa de hierro móvil. El electroimán la atrae hacia el núcleo y, al girar sobre la bisagra, empuja el contacto móvil.' },
    bisagra:  { t: 'Bisagra', d: 'Eje sobre el que gira la armadura. Está en el borde del yugo para que el campo pase de una pieza a otra.' },
    muelle:   { t: 'Muelle de retorno', d: 'Tira de la palanca de la armadura y la devuelve a reposo cuando se quita la tensión. Su fuerza marca cuánta corriente necesita la bobina para conmutar.' },
    tarjeta:  { t: 'Tarjeta aislante', d: 'Une mecánicamente la armadura con el contacto móvil, pero los aísla eléctricamente: así el circuito de mando queda separado del de potencia.' },
    comun:    { t: 'Común (11)', d: 'Lámina elástica de bronce con una pastilla de plata en la punta. Es el contacto que se mueve: en reposo toca el 12 y, excitado, el 14.' },
    trenza:   { t: 'Latiguillo flexible', d: 'Cable trenzado que lleva la corriente desde el borne 11 hasta el contacto móvil sin frenar su movimiento.' },
    nc:       { t: 'Contacto NC (12)', d: 'Normalmente cerrado: toca el común en reposo y se abre cuando la bobina está excitada.' },
    na:       { t: 'Contacto NA (14)', d: 'Normalmente abierto: está separado en reposo y se cierra con el común cuando la bobina está excitada.' },
    a1a2:     { t: 'Bornes A1 / A2', d: 'Entrada de alimentación de la bobina, es decir, el circuito de mando (por ejemplo 24 V DC desde una salida de PLC).' },
    zocalo:   { t: 'Base aislante', d: 'Zócalo de plástico que sujeta todas las piezas y por el que salen los bornes de conexión.' }
  },

  pasos: [
    ['1. En reposo', 'Sin tensión en la bobina, el muelle mantiene la armadura levantada. El común (11) toca el contacto NC (12): H1 encendida.'],
    ['2. Se excita la bobina', 'Al aplicar tensión entre A1 y A2 circula corriente por el bobinado y el núcleo de hierro se convierte en un electroimán.'],
    ['3. Atracción y conmutación', 'El campo se cierra por núcleo, armadura y yugo. La armadura gira, baja el contacto móvil: abre 11–12 y cierra 11–14. H2 encendida.'],
    ['4. Se quita la tensión', 'Desaparece el campo, el muelle devuelve la armadura y los contactos vuelven a su posición de reposo.']
  ],

  extra: `
    <div class="two">
      <div>
        <h2>Para qué sirve</h2>
        <p>Con una corriente pequeña en la bobina (circuito de mando, por ejemplo 24 V de una salida de PLC) se conecta o desconecta otro circuito distinto (circuito de potencia). La tarjeta aislante separa eléctricamente la armadura de los contactos, así que los dos circuitos quedan aislados entre sí.</p>
        <p>Este modelo es de un contacto conmutado (1 C/O, SPDT): un común que alterna entre un contacto normalmente cerrado y otro normalmente abierto.</p>
      </div>
      <div>
        <h2>Bornes</h2>
        <table>
          <thead><tr><th>Borne</th><th>Función</th></tr></thead>
          <tbody>
            <tr><td>A1 / A2</td><td>Alimentación de la bobina</td></tr>
            <tr><td>11</td><td>Común del contacto 1</td></tr>
            <tr><td>12</td><td>Normalmente cerrado (NC)</td></tr>
            <tr><td>14</td><td>Normalmente abierto (NA)</td></tr>
          </tbody>
        </table>
        <p class="note">Primera cifra: número del contacto. Segunda: 1 común, 2 NC, 4 NA. Modelo esquemático con fines didácticos.</p>
      </div>
    </div>`,

  panel: `
    <button class="big" id="btn" aria-pressed="false">Excitar bobina A1–A2</button>
    <button class="sm" id="auto" aria-pressed="false">Ciclo automático</button>
    <dl class="st">
      <dt>Bobina A1–A2</dt><dd id="sV">0 V</dd>
      <dt>Contacto 11–12 (NC)</dt><dd id="sNC" class="ok">cerrado</dd>
      <dt>Contacto 11–14 (NA)</dt><dd id="sNO">abierto</dd>
    </dl>
    <svg class="sch" viewBox="0 0 270 150" aria-label="Esquema de dos lámparas conectadas al relé">
      <line x1="12" y1="75" x2="40" y2="75"/><text x="4" y="64">+24 V</text>
      <circle cx="40" cy="75" r="3" style="fill:var(--ink)"/><text x="30" y="96">11</text>
      <line id="blade" x1="40" y1="75" x2="98" y2="47"/>
      <circle cx="100" cy="45" r="3"/><text x="94" y="32">12</text>
      <circle cx="100" cy="105" r="3"/><text x="94" y="128">14</text>
      <line x1="103" y1="45" x2="156" y2="45"/><line x1="103" y1="105" x2="156" y2="105"/>
      <circle id="h1" cx="170" cy="45" r="14"/><path d="M160 35l20 20M180 35l-20 20"/>
      <circle id="h2" cx="170" cy="105" r="14"/><path d="M160 95l20 20M180 95l-20 20"/>
      <text x="160" y="22">H1 (NC)</text><text x="160" y="140">H2 (NA)</text>
      <line x1="184" y1="45" x2="240" y2="45"/><line x1="184" y1="105" x2="240" y2="105"/>
      <line x1="240" y1="45" x2="240" y2="105"/><text x="248" y="79">0 V</text>
    </svg>
    <div class="chk">
      <label><input type="checkbox" id="cCase"> Carcasa transparente</label>
      <label><input type="checkbox" id="cField" checked> Campo magnético</label>
    </div>`,

  build(ctx, panel) {
    const { T, V, scene, M, add, boxR, cyl, tube, part, unpart } = ctx;
    const mat = {
      base: M(0x2b2f36, { roughness: .8 }), iron: M(0x8a929c, { metalness: .7, roughness: .35 }), dark: M(0x1d1f24, { roughness: .7 }),
      bronze: M(0xc7924a, { metalness: .8, roughness: .3 }), silver: M(0xe6e8ec, { metalness: .9, roughness: .2 }),
      card: M(0xe8d9b5, { roughness: .8 }), copper: M(0xb8642e, { metalness: .6, roughness: .4 }), steel: M(0xb9c0c8, { metalness: .8, roughness: .25 }),
      braid: M(0xd9a35f, { metalness: .7, roughness: .45 })
    };
    { // textura del bobinado
      const c = document.createElement('canvas'); c.width = 16; c.height = 128; const g = c.getContext('2d');
      for (let i = 0; i < 32; i++) { g.fillStyle = i % 2 ? '#c97436' : '#9a4f22'; g.fillRect(0, i * 4, 16, 4); }
      const tx = new T.CanvasTexture(c); tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.repeat.set(1, 3); tx.encoding = T.sRGBEncoding;
      mat.wind = M(0xffffff, { map: tx, metalness: .5, roughness: .35, emissive: 0xff3a00, emissiveIntensity: 0 });
    }
    const P = (m, id) => part(m, id);

    // base, bobina, núcleo, yugo
    P(boxR(-4.8, 2.8, 0, .4, -2, 2, mat.base), 'zocalo');
    P(cyl(.38, 2.55, mat.iron, -1, 1.975, 0), 'nucleo');
    P(cyl(1.0, .12, mat.dark, -1, .82, 0), 'carrete'); P(cyl(1.0, .12, mat.dark, -1, 3.08, 0), 'carrete');
    const wind = P(cyl(.92, 2.14, mat.wind, -1, 1.95, 0, null, 48), 'bobina');
    P(boxR(-1.6, 1.3, .4, .7, -.5, .5, mat.iron), 'yugo');
    P(boxR(1.0, 1.3, .4, 3.28, -.5, .5, mat.iron), 'yugo');
    P(boxR(-1.58, -1.42, -.5, .7, 1.32, 1.48, mat.steel), 'a1a2'); P(boxR(-.58, -.42, -.5, .7, 1.32, 1.48, mat.steel), 'a1a2');
    P(tube([V(-1.2, 3.0, .88), V(-1.5, 2.2, 1.3), V(-1.5, .72, 1.4)], .03, mat.copper), 'a1a2');
    P(tube([V(-.8, .95, .88), V(-.6, .85, 1.3), V(-.5, .72, 1.4)], .03, mat.copper), 'a1a2');

    // armadura móvil
    const arm = new T.Group(); arm.position.set(1.3, 3.4, 0); scene.add(arm);
    P(boxR(-3.0, 0, -.12, .13, -.5, .5, mat.iron, arm), 'armadura');
    P(boxR(0, .95, -.08, .05, -.15, .15, mat.steel, arm), 'armadura');
    P(boxR(-3.5, -2.95, -.15, .15, -.3, .3, mat.card, arm), 'tarjeta');
    P(boxR(-4.95, -3.45, -.03, .03, -.25, .25, mat.bronze, arm), 'comun');
    P(cyl(.16, .24, mat.silver, -4.7, 0, 0, arm), 'comun');
    { const p = P(cyl(.07, 1.2, mat.steel, 0, 0, 0, arm, 16), 'bisagra'); p.rotation.x = Math.PI / 2; }

    // contactos fijos
    P(cyl(.16, .2, mat.silver, -3.4, 3.18, 0), 'na');
    P(boxR(-3.95, -3.25, 2.99, 3.08, -.2, .2, mat.bronze), 'na');
    P(boxR(-4.0, -3.85, -.5, 3.08, -.12, .12, mat.bronze), 'na');
    P(cyl(.16, .2, mat.silver, -3.37, 4.183, 0), 'nc');
    P(boxR(-4.55, -3.25, 4.283, 4.373, -.2, .2, mat.bronze), 'nc');
    P(boxR(-4.55, -4.4, -.5, 4.373, -.12, .12, mat.bronze), 'nc');
    P(boxR(-2.7, -2.55, -.5, 2.9, .8, .95, mat.bronze), 'trenza');

    // muelle
    P(boxR(2.1, 2.25, .4, .9, -.1, .1, mat.steel), 'muelle');
    class Helix extends T.Curve { getPoint(t, o = new T.Vector3()) { const a = t * Math.PI * 22; return o.set(Math.cos(a) * .14, t, Math.sin(a) * .14); } }
    const spring = P(add(new T.Mesh(new T.TubeGeometry(new Helix(), 400, .025, 6), mat.steel)), 'muelle');
    const ANCH = V(2.175, .9, 0), Y = V(0, 1, 0), tmp = V(0, 0, 0);

    // carcasa
    const caseG = new T.Group(); caseG.visible = false; scene.add(caseG);
    {
      const g = new T.BoxGeometry(8, 4.6, 4);
      const m = new T.Mesh(g, new T.MeshPhysicalMaterial({ color: 0x9fb6d0, transparent: true, opacity: .14, roughness: .1, depthWrite: false }));
      m.position.set(-1, 2.7, 0); caseG.add(m);
      const e = new T.LineSegments(new T.EdgesGeometry(g), new T.LineBasicMaterial({ color: 0x7c8fa6 })); e.position.copy(m.position); caseG.add(e);
    }

    // campo magnético
    const fieldG = new T.Group(); scene.add(fieldG);
    const loops = [-.28, 0, .28].map(z => new T.CatmullRomCurve3([
      V(-1, .8, z), V(-1, 2, z), V(-1, 3.25, z), V(-.6, 3.42, z), V(.4, 3.42, z), V(1.12, 3.3, z), V(1.15, 2, z), V(1.12, .6, z), V(.2, .56, z), V(-.8, .6, z)], true));
    const pMat = new T.MeshBasicMaterial({ color: 0x2f8cff, transparent: true, opacity: 0 });
    const parts = [];
    loops.forEach((c, li) => { for (let i = 0; i < 14; i++) { fieldG.add(new T.Mesh(new T.SphereGeometry(.06, 10, 8), pMat)); parts.push({ c, u: i / 14 + li * .023 }); } });

    // panel
    const $ = s => panel.querySelector(s);
    const btn = $('#btn'), autoB = $('#auto'), sV = $('#sV'), sNC = $('#sNC'), sNO = $('#sNO');
    const blade = $('#blade'), h1 = $('#h1'), h2 = $('#h2'), cField = $('#cField');
    let energized = false, auto = false, autoT = 0;
    const OFF = -.12, ON = 0; let ang = OFF, flux = 0, lastState = '', braid = null, braidAng = 99;
    function setE(v) {
      energized = v; btn.setAttribute('aria-pressed', v);
      btn.textContent = v ? 'Quitar tensión A1–A2' : 'Excitar bobina A1–A2';
      sV.textContent = v ? '24 V DC' : '0 V'; sV.className = v ? 'on' : '';
    }
    btn.onclick = () => setE(!energized);
    autoB.onclick = () => { auto = !auto; autoB.setAttribute('aria-pressed', auto); autoT = 0; };
    $('#cCase').onchange = e => { caseG.visible = e.target.checked; };
    const lit = (el, on, col) => { el.style.fill = on ? col : 'none'; el.style.filter = on ? `drop-shadow(0 0 6px ${col})` : 'none'; };

    function ui() {
      const nc = ang < OFF + .006, no = ang > ON - .006, st = nc ? 'nc' : no ? 'no' : 'mid';
      if (st === lastState) return; lastState = st;
      sNC.textContent = nc ? 'cerrado' : 'abierto'; sNC.className = nc ? 'ok' : '';
      sNO.textContent = no ? 'cerrado' : 'abierto'; sNO.className = no ? 'ok' : '';
      blade.setAttribute('y2', nc ? 47 : no ? 103 : 75);
      lit(h1, nc, '#ff9f1c'); lit(h2, no, '#3ccf6e');
      ctx.step(nc ? (energized ? 1 : 0) : no ? 2 : (energized ? 1 : 3));
    }

    return {
      tecla: () => setE(!energized),
      update(dt) {
        if (auto) { autoT += dt; if (autoT > 1.8) { autoT = 0; setE(!energized); } }
        flux += ((energized ? 1 : 0) - flux) * Math.min(1, dt * 9);
        const target = (energized ? flux > .35 : flux > .55) ? ON : OFF;
        ang += (target - ang) * Math.min(1, dt * (target === ON ? 14 : 10));
        arm.rotation.z = ang;
        wind.material.emissiveIntensity = flux * .35;

        const tip = arm.localToWorld(V(.88, -.05, 0));
        tmp.subVectors(tip, ANCH); const len = tmp.length();
        spring.position.copy(ANCH); spring.quaternion.setFromUnitVectors(Y, tmp.normalize()); spring.scale.set(1, len, 1);

        if (Math.abs(ang - braidAng) > .002) {
          braidAng = ang;
          if (braid) { unpart(braid); scene.remove(braid); braid.geometry.dispose(); }
          const end = arm.localToWorld(V(-3.6, 0, .2));
          braid = P(tube([V(-2.62, 2.9, .87), V(-2.5, 3.4, .7), V(end.x + .1, end.y + .25, .35), end], .045, mat.braid), 'trenza');
        }

        pMat.opacity = cField.checked ? flux * .9 : 0;
        fieldG.visible = pMat.opacity > .01;
        if (fieldG.visible) {
          const t = performance.now() / 1000 * (ctx.reduce ? 0 : .25);
          parts.forEach((q, i) => q.c.getPointAt(((q.u + t) % 1 + 1) % 1, fieldG.children[i].position));
        }
        ui();
      },
      labels: [
        { p: 'bobina', at: () => V(-1.92, 1.6, .3) },
        { p: 'yugo', at: () => V(1.3, 1.6, .5) },
        { p: 'armadura', at: () => arm.localToWorld(V(-1.2, .13, .5)) },
        { p: 'muelle', txt: 'Muelle', at: () => V(2.3, 2.1, 0) },
        { p: 'tarjeta', at: () => arm.localToWorld(V(-3.2, .15, .3)) },
        { p: 'nc', txt: 'NC (12)', at: () => V(-4.5, 4.33, .2), l: 1 },
        { p: 'comun', at: () => arm.localToWorld(V(-4.85, 0, .25)), l: 1 },
        { p: 'na', txt: 'NA (14)', at: () => V(-3.9, 3.03, .2), l: 1 },
        { p: 'a1a2', txt: 'A1', at: () => V(-1.5, .42, 1.48), l: 1 },
        { p: 'a1a2', txt: 'A2', at: () => V(-.5, .42, 1.48) }
      ]
    };
  }
});
