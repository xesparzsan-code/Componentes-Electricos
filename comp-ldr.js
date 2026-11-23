// Componente: LDR (fotorresistencia) en un divisor de tensión que gobierna una farola (interruptor crepuscular)
(() => {
  const { set, fmt } = UT;
  const RF = 10000, VCC = 5;
  const rLdr = lx => lx <= .05 ? 1e6 : Math.min(1e6, 1e4 * Math.pow(lx / 10, -.75));
  const ohm = r => r >= 1e6 ? fmt(r / 1e6, 2) + ' MΩ' : r >= 1000 ? fmt(r / 1000, 1) + ' kΩ' : fmt(r, 0) + ' Ω';

  const PANEL = `
    <label class="sp"><span>Iluminación</span><input type="range" id="lx" min="0" max="3" step="0.02" value="2.5"><b id="lxV"></b></label>
    <div class="row"><button class="sm" data-u="0">Noche</button><button class="sm" data-u="1.3">Atardecer</button><button class="sm" data-u="2.5">Interior</button><button class="sm" data-u="3">Día</button></div>
    <button class="sm" id="tapa" aria-pressed="false">Tapar la LDR con la mano</button>
    <label class="sp"><span>Umbral del comparador</span><input type="range" id="um" min="0.5" max="4.5" step="0.1" value="2.5"><b id="umV">2,5 V</b></label>
    <p class="msg" id="msg" hidden></p>
    ${UT.dl([['rL', 'Luz sobre la LDR', ''], ['rR', 'Resistencia de la LDR', ''], ['rV', 'Tensión del divisor', ''], ['rF', 'Farola', '']])}
    <svg class="sch" viewBox="0 0 300 130" aria-label="Divisor de tensión con la LDR arriba y una resistencia de 10 kilohmios abajo, comparador y LED de la farola">
      <text x="4" y="14">+5 V</text><line x1="40" y1="18" x2="260" y2="18"/><line x1="40" y1="18" x2="40" y2="28"/>
      <rect id="sL" x="32" y="28" width="16" height="30"/><path d="M14 28 l12 8 M16 40 l12 8" class="thin"/><text x="54" y="46">LDR</text>
      <line x1="40" y1="58" x2="40" y2="78"/><rect x="32" y="78" width="16" height="26"/><text x="54" y="96">10 k</text><line x1="40" y1="104" x2="40" y2="118"/>
      <line x1="40" y1="118" x2="260" y2="118"/><text x="4" y="124">0 V</text>
      <circle cx="40" cy="68" r="2.5" class="fill"/><line x1="40" y1="68" x2="120" y2="68"/><text x="70" y="62" id="sV">2,5 V</text>
      <path d="M120 50 v40 l36 -20 z"/><text x="124" y="66">−</text><text x="124" y="84">+</text><text x="120" y="104">umbral</text>
      <line x1="156" y1="70" x2="200" y2="70"/><polygon points="200,62 200,78 214,70" style="fill:var(--ink)"/><line x1="214" y1="62" x2="214" y2="78"/>
      <circle id="sF" cx="207" cy="70" r="13" style="stroke:none"/><line x1="214" y1="70" x2="260" y2="70"/><line x1="260" y1="70" x2="260" y2="118"/><text x="196" y="96">farola</text>
      <path id="fD" class="flow fy" d="M40 18 V118"/>
    </svg>`;

  function build(ctx, panel) {
    const { T, V, scene, M, boxR, cyl, tube, curva, part: P } = ctx;
    const m = UT.mats(ctx);
    P(boxR(-6, 6.5, -.3, 0, -2.6, 2.6, M(0x3d342c, { roughness: .8 })), 'base');
    P(boxR(-1.6, 4.4, 0, .1, -1.6, 1.6, M(0x1f6b3a, { roughness: .6 })), 'placa');
    // LDR: disco cerámico con la pista de sulfuro de cadmio en zigzag
    const c = document.createElement('canvas'); c.width = 128; c.height = 128; const g = c.getContext('2d');
    g.fillStyle = '#f0e2c4'; g.beginPath(); g.arc(64, 64, 64, 0, 7); g.fill(); g.fillStyle = '#b5451b';
    for (let i = 0; i < 9; i++) g.fillRect(18, 18 + i * 11, 92, 5); g.fillStyle = '#c9cdd2'; g.fillRect(10, 14, 10, 100); g.fillRect(108, 14, 10, 100);
    const tx = new T.CanvasTexture(c); tx.encoding = T.sRGBEncoding;
    P(cyl(.7, .16, M(0xe9dcc0, { roughness: .6 }), 0, .55, 0, null, 32), 'ldr');
    const top = P(new T.Mesh(new T.CircleGeometry(.68, 32), new T.MeshStandardMaterial({ map: tx, roughness: .5, emissive: 0xffd27a, emissiveIntensity: 0 })), 'pista');
    top.rotation.x = -Math.PI / 2; top.position.y = .64; scene.add(top);
    for (const x of [-.3, .3]) P(boxR(x - .025, x + .025, .1, .47, -.025, .025, m.silver), 'ldr');
    // lámpara del ambiente
    const lamp = UT.bombilla(ctx, V(-3.4, 0, 0), 'lampara', 1.1);
    const tapa = new T.Group(); scene.add(tapa);
    { const cup = P(new T.Mesh(new T.CylinderGeometry(.9, .9, .7, 32, 1, true), M(0x2b2f36, { roughness: .7, side: T.DoubleSide })), 'tapa'); cup.position.y = .35; tapa.add(cup);
      P(cyl(.9, .06, M(0x2b2f36), 0, .7, 0, tapa, 32), 'tapa'); }
    // divisor, comparador y potenciómetro de umbral
    const ejeX = o => { o.rotation.z = Math.PI / 2; return o; };
    ejeX(P(cyl(.18, .8, M(0xd9c08f), 1.3, .3, .9, null, 16), 'resistencia'));
    [[1.08, 0x6b3e1e], [1.22, 0x111111], [1.36, 0xe67e22], [1.58, 0xd4af37]].forEach(([x, cc]) => ejeX(P(cyl(.19, .06, M(cc), x, .3, .9, null, 16), 'resistencia')));
    P(boxR(1.0, 2.2, .1, .45, -.4, .2, m.black), 'comparador');
    for (let i = 0; i < 4; i++) for (const z of [-.45, .25]) P(boxR(1.1 + i * .3 - .04, 1.1 + i * .3 + .04, .1, .3, z - .03, z + .03, m.silver), 'comparador');
    P(boxR(2.6, 3.2, .1, .5, -1.2, -.6, M(0x1f4e9c)), 'umbral'); const tor = P(cyl(.12, .14, m.steel, 2.9, .56, -.9, null, 16), 'umbral');
    // pila
    P(boxR(-1.4, .2, .1, .7, -1.4, -.7, m.dark), 'pila'); UT.rotulo(ctx, '5 V', .8, .3, V(-.6, .71, -1.05), [-Math.PI / 2, 0, 0], { color: '#e9e8e3' });
    // farola
    P(cyl(.09, 3.4, M(0x5d656e, { metalness: .6 }), 5.2, 1.7, 0, null, 12), 'farola');
    P(tube([V(5.2, 3.35, 0), V(5.0, 3.8, 0), V(4.3, 3.9, 0)], .08, M(0x5d656e, { metalness: .6 })), 'farola');
    P(boxR(3.7, 4.5, 3.75, 4.0, -.3, .3, M(0x2b2f36)), 'farola');
    const ledF = P(boxR(3.8, 4.4, 3.7, 3.76, -.22, .22, M(0xfff3d6, { emissive: 0xffd27a, emissiveIntensity: 0 })), 'farola');
    const luzF = new T.SpotLight(0xffd27a, 0, 8, .7, .5); luzF.position.set(4.1, 3.6, 0); luzF.target.position.set(4.1, 0, 0); scene.add(luzF); scene.add(luzF.target);
    const cab = [V(3.2, .3, .3), V(4.2, .3, .6), V(5.2, .2, .2)];
    P(tube(cab, .05, m.red), 'cables');
    // fotones
    const fot = [-.3, 0, .3].flatMap(dz => [-.2, .2].map(dx => ctx.flow({ color: 0xffd23f, size: .05, gap: .3 }).path([V(-3.4 + .3, 1.0, dz), V(dx, .7, dz)])));
    const fD = ctx.flow({ color: 0xffc400, size: .04, gap: .2 }).path([V(-.6, .72, -1.05), V(-.3, .5, -.3), V(-.3, .5, 0), V(.3, .5, 0), V(.9, .3, .9), V(1.7, .3, .9)]);

    // ---- vista por dentro: la luz suelta electrones en el cristal de CdS ----
    const D = UT.detalle(ctx, { w: 13.5, h: 8.6, titulo: 'DETALLE A · DENTRO DEL CRISTAL DE SULFURO DE CADMIO' }), G = D.g;
    const cris = P(boxR(-4.9, 4.9, -2.4, 1.0, -.45, .1, new T.MeshPhysicalMaterial({ color: 0xb5451b, transparent: true, opacity: .35, roughness: .5, depthWrite: false }), G), 'pista', true);
    for (const sx of [-1, 1]) { P(boxR(sx * 4.9 - .25 * (sx < 0 ? 1 : 0), sx * 4.9 + .25 * (sx > 0 ? 1 : 0), -2.4, 1.0, -.45, .45, M(0xc9cdd2, { metalness: .8, roughness: .3 }), G), 'ldr');
      D.etiqueta(sx * 5.5, -.7, .6, .6, { size: .9 })(sx < 0 ? '−' : '+'); }
    const gA = new T.SphereGeometry(.16, 12, 10), mCd = M(0xd9b24a, { roughness: .4 }), mS = M(0x8f5a2a, { roughness: .5 });
    for (let i = 0; i < 12; i++) for (let j = 0; j < 4; j++) { const a = P(new T.Mesh(gA, (i + j) % 2 ? mCd : mS), 'pista'); a.position.set(-4.4 + i * .8, -2.0 + j * .85, -.15); G.add(a); }
    const gF = new T.SphereGeometry(.09, 8, 6), gP = new T.SphereGeometry(.1, 10, 8);
    const pool = (n, geo, mat) => Array.from({ length: n }, () => { const o = new T.Mesh(geo, mat); o.visible = false; o.renderOrder = 4; G.add(o); return { o, v: false, t: 0 }; });
    const fots = pool(40, gF, new T.MeshBasicMaterial({ color: 0xffd23f })), elec = pool(70, gP, new T.MeshBasicMaterial({ color: 0x8fd3ff })), hue = pool(70, gP, new T.MeshBasicMaterial({ color: 0xff6b6b, transparent: true, opacity: .8 }));
    const estelas = fots.map(() => { const t = D.traza(2, { color: 0xffd23f, op: .6 }); t.l.visible = false; return t; });
    const libre = p => p.find(q => !q.v);
    const tL = D.etiqueta(0, 3.35, 6, .42, { size: .8 }), tN = D.etiqueta(0, -2.95, 10, .38, { size: .75 });
    D.etiqueta(0, -3.5, 11, .32, { size: .7 })('más luz → más electrones (azul) y huecos (rojo) → R baja', '#ffd166');
    let acum = 0, acT = 0;
    const det = (dt, lx, R) => {
      const k = lx <= .05 ? 0 : Math.min(1, Math.log10(lx + 1) / 3);
      acum += dt * 16 * k * k; acT += dt * .25;
      while (acum >= 1) { acum--; const f = libre(fots); if (!f) break; f.v = true; f.o.visible = true; f.o.position.set(-4.5 + Math.random() * 9, 3.0, .3); f.y1 = -2.2 + Math.random() * 3; }
      while (acT >= 1) { acT--; const e = libre(elec), h = libre(hue); if (e && h) { const x = -4.5 + Math.random() * 9, y = -2.2 + Math.random() * 3; [e, h].forEach(q => { q.v = true; q.o.visible = true; q.t = 2 + Math.random(); q.o.position.set(x, y, .25); }); } }
      fots.forEach((f, i) => { const t = estelas[i]; if (!f.v) { t.l.visible = false; return; } const p = f.o.position; p.y -= dt * 5;
        t.l.visible = true; t.set((u, j) => j ? [p.x, p.y, .3] : [p.x, p.y + .5, .3]);
        if (p.y <= f.y1) { f.v = false; f.o.visible = false; t.l.visible = false;
          const e = libre(elec), h = libre(hue); if (e && h) [e, h].forEach(q => { q.v = true; q.o.visible = true; q.t = 1.1 + Math.random() * .8; q.o.position.set(p.x, p.y, .25); }); } });
      const mover = (arr, vx) => arr.forEach(q => { if (!q.v) return; q.t -= dt; const p = q.o.position; p.x += vx * dt; p.y += (Math.random() - .5) * dt * 2.4; p.y = Math.max(-2.3, Math.min(.9, p.y));
        if (q.t <= 0 || Math.abs(p.x) > 4.75) { q.v = false; q.o.visible = false; } });
      mover(elec, 1.4); mover(hue, -.9);
      const n = elec.filter(q => q.v).length;
      tL('LUZ · ' + (tapado ? 'tapada · ' : '') + fmt(lx, lx < 10 ? 1 : 0) + ' lx', k > .3 ? '#ffd166' : '#eaf2ff');
      tN('electrones libres: ' + n + '   ·   R = ' + ohm(R));
    };

    const $ = s => panel.querySelector(s);
    const lxI = $('#lx'), lxV = $('#lxV'), tapaB = $('#tapa'), um = $('#um'), umV = $('#umV'), msg = $('#msg');
    const r = { L: $('#rL'), R: $('#rR'), V: $('#rV'), F: $('#rF') }, s = { F: $('#sF'), V: $('#sV'), L: $('#sL'), fD: $('#fD') };
    let lg = 2.5, tapado = false, umbral = 2.5, on = false, ty = 3.2;
    const lux = () => lg <= 0 ? 0 : Math.pow(10, lg);
    const setL = v => { lg = v; lxI.value = v; lxV.textContent = Math.round(lux()) + ' lx'; };
    setL(2.5);
    lxI.oninput = () => setL(+lxI.value);
    panel.querySelectorAll('[data-u]').forEach(b => b.onclick = () => setL(+b.dataset.u));
    const setTapa = v => { tapado = v; tapaB.setAttribute('aria-pressed', v); tapaB.textContent = v ? 'Quitar la mano' : 'Tapar la LDR con la mano'; };
    tapaB.onclick = () => setTapa(!tapado);
    um.oninput = () => { umbral = +um.value; umV.textContent = fmt(umbral, 1) + ' V'; };
    ctx.accion('lampara', () => setL(lg > 1 ? 0 : 3), { pista: 'Púlsala en el modelo para encenderla o apagarla.' });
    ctx.accion('tapa', () => setTapa(!tapado), { pista: 'Púlsala en el modelo para tapar o destapar la LDR.' });
    ctx.accion('ldr', () => setTapa(!tapado), { pista: 'Púlsala en el modelo para taparla con la mano.' });
    ctx.accion('umbral', () => { umbral = umbral >= 4 ? 1 : umbral + 1; um.value = umbral; umV.textContent = fmt(umbral, 1) + ' V'; }, { pista: 'Púlsalo en el modelo para girarlo y cambiar el umbral.' });

    return {
      update(dt) {
        const lx = tapado ? lux() * .002 : lux();
        const R = rLdr(lx), Vd = VCC * RF / (RF + R);
        if (!on && Vd < umbral) on = true; else if (on && Vd > umbral + .1) on = false;
        ty += ((tapado ? 0 : 3.2) - ty) * Math.min(1, dt * 8); tapa.position.set(0, .45 + ty, 0);
        lamp.setLuz(Math.min(1, lux() / 1000 + (lux() > 0 ? .15 : 0)));
        fot.forEach(f => f.set(lux() > .5 && !tapado ? Math.min(1, .25 + lg / 3) : 0, .6 + lg * .4));
        det(dt, lx, R);
        top.material.emissiveIntensity = Math.min(.4, lx / 1000 * .4);
        ledF.material.emissiveIntensity = on ? 2 : 0; luzF.intensity = on ? 2.5 : 0;
        fD.set(1, .3 + Vd * .3);
        tor.rotation.y = umbral;

        ctx.step(on ? 3 : lx < 30 ? 1 : 0);
        set(r.L, (tapado ? 'tapada · ' : '') + fmt(lx, lx < 10 ? 1 : 0) + ' lx');
        set(r.R, ohm(R)); set(r.V, fmt(Vd, 2) + ' V');
        set(r.F, on ? 'encendida' : 'apagada', on ? 'ok' : '');
        const t = on ? `Hay poca luz: la LDR vale ${ohm(R)}, la tensión del divisor (${fmt(Vd, 2)} V) baja del umbral y el comparador enciende la farola.`
          : `Con luz la LDR baja a ${ohm(R)}: casi toda la tensión queda en la resistencia de 10 kΩ y el divisor da ${fmt(Vd, 2)} V, por encima del umbral.`;
        set(msg, t); msg.hidden = false;
        UT.lit(s.F, on, '#ffd27a'); s.V.textContent = fmt(Vd, 2) + ' V';
        s.L.style.fill = `rgba(255,210,63,${Math.min(.6, lx / 1000 * .6).toFixed(2)})`;
        s.fD.classList.add('live');
      },
      dentro: D.dentro,
      labels: [
        { p: 'pista', txt: 'Cristal de CdS', at: () => D.W(-4.9, 1.0, .1), l: 1 },
        { p: 'ldr', txt: 'Electrodo', at: () => D.W(5.15, 1.0, .45) },
        { p: 'ldr', txt: 'LDR', at: () => V(.7, .55, 0) },
        { p: 'pista', txt: 'Pista de sulfuro de cadmio', at: () => V(-.2, .64, .6), l: 1 },
        { p: 'lampara', txt: 'Luz ambiente', at: () => V(-2.6, 1.2, 0) },
        { p: 'tapa', txt: 'Mano / tapa', at: () => V(.9, .8 + ty, 0) },
        { p: 'resistencia', txt: 'R 10 kΩ', at: () => V(1.7, .45, .9) },
        { p: 'comparador', at: () => V(2.2, .45, -.1) },
        { p: 'umbral', txt: 'Ajuste de umbral', at: () => V(3.2, .55, -.9) },
        { p: 'farola', at: () => V(5.3, 3.0, 0) }
      ]
    };
  }

  window.COMPONENTES.push({
    id: 'ldr', nombre: 'LDR', categoria: 'Sensores', grupo: 'Resistivos',
    resumen: 'Resistencia que baja con la luz: la base de un interruptor crepuscular.',
    titulo: 'LDR: una resistencia que depende de la luz',
    lead: 'Cambia la luz o tapa la LDR con la mano. Su resistencia pasa de unos cientos de ohmios a casi un megaohmio, y el divisor de tensión enciende la farola cuando oscurece. Con «Ver por dentro» verás cómo la luz suelta electrones en el cristal.',
    camara: { pos: [2, 7, 14], tgt: [.8, 1.5, 0] }, suelo: -.32,
    panel: PANEL, build,
    leyenda: [['#ffd23f', 'Luz que llega a la LDR'], ['#ffc400', 'Corriente del divisor']],
    pasos: [
      ['1. Con luz', 'La luz da energía a los electrones del sulfuro de cadmio y quedan libres para conducir: la resistencia baja a unos cientos de ohmios.'],
      ['2. A oscuras', 'Sin luz casi no hay portadores libres y la resistencia sube hasta cerca de 1 MΩ.'],
      ['3. Divisor de tensión', 'La LDR y una resistencia fija forman un divisor: el cambio de resistencia se convierte en un cambio de tensión que se puede medir.'],
      ['4. Interruptor crepuscular', 'Un comparador vigila esa tensión. Cuando baja del umbral (anochece), enciende la farola.']
    ],
    partes: {
      ldr:         { t: 'LDR (fotorresistencia)', d: 'Light Dependent Resistor: resistencia que depende de la luz. Es un sensor pasivo: necesita una alimentación externa para medirla.' },
      pista:       { t: 'Pista de sulfuro de cadmio', d: 'Material fotoconductor en zigzag entre dos electrodos, para tener mucha longitud de contacto en poco espacio.' },
      lampara:     { t: 'Luz ambiente', d: 'Representa la luz que llega a la LDR. Púlsala para encenderla o apagarla.' },
      tapa:        { t: 'Mano / tapa', d: 'Tapa la LDR para dejarla a oscuras.' },
      resistencia: { t: 'Resistencia de 10 kΩ', d: 'Parte fija del divisor de tensión (marrón, negro, naranja).' },
      comparador:  { t: 'Comparador', d: 'Circuito integrado que compara la tensión del divisor con el umbral y activa la salida.' },
      umbral:      { t: 'Ajuste del umbral', d: 'Potenciómetro que decide con cuánta oscuridad se enciende la farola.' },
      pila:        { t: 'Alimentación de 5 V', d: 'Alimenta el divisor y el comparador.' },
      farola:      { t: 'Farola', d: 'La carga del interruptor crepuscular.' },
      placa:       { t: 'Placa de circuito', d: 'Placa donde va montado el circuito.' },
      cables:      { t: 'Cables', d: 'Salida del comparador hacia la farola.' },
      base:        { t: 'Base', d: 'Tablero del montaje.' }
    },
    extra: `
      <div class="two">
        <div>
          <h2>Cómo se mide</h2>
          <p>En la práctica de caracterización se mide su resistencia con el multímetro a distintos niveles de luz. Para usarla en un circuito se pone en un <b>divisor de tensión</b> o en un <b>puente de Wheatstone</b>: Vs = Vcc · R2 / (R1 + R2).</p>
          <p>Es lenta (tarda decenas de milisegundos en reaccionar), no lineal y su valor varía mucho de una unidad a otra, pero es muy barata. Además, el cadmio es tóxico y se está sustituyendo por fotodiodos y fototransistores.</p>
        </div>
        <div>
          <h2>Valores típicos</h2>
          <table><tbody>
            <tr><td>Oscuridad</td><td>≈ 1 MΩ</td></tr><tr><td>Interior (300 lx)</td><td>≈ 1 kΩ</td></tr><tr><td>Pleno día</td><td>≈ 100–300 Ω</td></tr>
          </tbody></table>
          <p class="note">En la simulación la resistencia sigue una ley R ≈ 10 kΩ · (lux/10)<sup>−0,75</sup>.</p>
        </div>
      </div>`
  });
})();
