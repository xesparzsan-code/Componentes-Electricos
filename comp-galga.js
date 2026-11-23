// Componente: galga extensiométrica pegada a una viga en voladizo, en un puente de Wheatstone de ¼
(() => {
  const { set, fmt } = UT;
  const R0 = 120, K = 2, VEX = 5, EPS_KG = 200e-6, L = 8, Y = 2.0;

  const PANEL = `
    <label class="sp"><span>Carga en el extremo</span><input type="range" id="kg" min="0" max="5" step="0.5" value="0"><b id="kgV">0,0 kg</b></label>
    <div class="row"><button class="sm" data-u="0">Sin carga</button><button class="sm" data-u="2.5">2,5 kg</button><button class="sm" data-u="5">5 kg</button></div>
    <p class="msg" id="msg" hidden></p>
    ${UT.dl([['rE', 'Deformación ε', ''], ['rR', 'Resistencia de la galga', ''], ['rDR', 'Variación ΔR', ''], ['rV', 'Salida del puente', '']])}
    <svg class="sch" viewBox="0 0 300 130" aria-label="Puente de Wheatstone de un cuarto con la galga en una rama y voltímetro entre los puntos medios">
      <line x1="150" y1="12" x2="94" y2="64"/><line x1="150" y1="12" x2="206" y2="64"/><line x1="94" y1="64" x2="150" y2="116"/><line x1="206" y1="64" x2="150" y2="116"/>
      <rect x="110" y="30" width="26" height="10" transform="rotate(-43 123 35)" style="fill:var(--bg)"/><text x="96" y="30">R1</text>
      <rect x="164" y="30" width="26" height="10" transform="rotate(43 177 35)" style="fill:var(--bg)"/><text x="192" y="30">R2</text>
      <rect x="110" y="86" width="26" height="10" transform="rotate(43 123 91)" style="fill:var(--bg)"/><text x="96" y="104">R3</text>
      <rect id="sG" x="164" y="86" width="26" height="10" transform="rotate(-43 177 91)" style="fill:var(--bg)"/><text x="190" y="104">Galga</text>
      <line x1="150" y1="12" x2="40" y2="12"/><line x1="40" y1="12" x2="40" y2="54"/><line x1="28" y1="54" x2="52" y2="54"/><line x1="33" y1="61" x2="47" y2="61"/><line x1="40" y1="61" x2="40" y2="116"/><line x1="40" y1="116" x2="150" y2="116"/><text x="6" y="62">5 V</text>
      <line x1="94" y1="64" x2="132" y2="64" class="thin"/><line x1="168" y1="64" x2="206" y2="64" class="thin"/><circle cx="150" cy="64" r="16"/><text x="145" y="69">V</text>
      <text id="vm" x="232" y="68">0,00 mV</text>
      <path id="fA" class="flow fy" d="M40 54 V12 H150 L94 64 L150 116 H40 V61"/><path id="fB" class="flow fy" d="M150 12 L206 64 L150 116"/>
      <rect class="hit" id="hG" x="160" y="76" width="34" height="30" rx="5"/>
    </svg>
    <p class="nota-sch">Pulsa la galga del esquema (o la pesa en el modelo) para añadir 1 kg.</p>`;

  function build(ctx, panel) {
    const { T, V, scene, M, boxR, cyl, tube, curva, part: P } = ctx;
    const m = UT.mats(ctx);
    const ejeX = o => { o.rotation.z = Math.PI / 2; return o; };
    P(boxR(-9.5, 2.6, -.3, 0, -2.4, 2.4, M(0x6b737b, { metalness: .4, roughness: .5 })), 'base');
    // empotramiento
    P(boxR(-5.4, -4, 0, Y - .15, -1.3, 1.3, M(0x4a5058, { metalness: .5, roughness: .45 })), 'empotramiento');
    P(boxR(-5.4, -4, Y + .15, Y + .9, -1.3, 1.3, M(0x4a5058, { metalness: .5, roughness: .45 })), 'empotramiento');
    for (const z of [-.9, .9]) P(cyl(.18, .3, m.steel, -4.7, Y + 1.05, z, null, 6), 'empotramiento');
    P(boxR(-5.4, -4, 0, Y + .9, -1.3, -1.1, M(0x4a5058, { metalness: .5, roughness: .45 })), 'empotramiento');
    // viga en segmentos para poder curvarla
    const N = 40, segs = [], vM = M(0xb9c0c8, { metalness: .75, roughness: .3 });
    for (let i = 0; i < N; i++) { const b = P(boxR(-L / N / 2, L / N / 2, -.15, .15, -.7, .7, vM), 'viga'); segs.push(b); }
    P(boxR(-5.4, -4, Y - .15, Y + .15, -.7, .7, vM), 'viga');
    const flecha = (xp, d) => -d * xp * xp * (3 * L - xp) / (2 * L ** 3), pend = (xp, d) => -d * (6 * L * xp - 3 * xp * xp) / (2 * L ** 3);
    // galga: lámina con rejilla en zigzag
    const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
    g.fillStyle = '#e9b44c'; g.fillRect(0, 0, 256, 128); g.strokeStyle = '#8c4a17'; g.lineWidth = 3;
    g.beginPath(); for (let i = 0; i < 14; i++) { const y = 18 + i * 7; g.moveTo(40, y); g.lineTo(220, y); if (i < 13) { if (i % 2) { g.moveTo(40, y); g.lineTo(40, y + 7); } else { g.moveTo(220, y); g.lineTo(220, y + 7); } } } g.stroke();
    g.fillStyle = '#8c4a17'; g.fillRect(36, 14, 14, 100); g.fillRect(210, 14, 14, 100); g.fillStyle = '#b87333'; g.fillRect(4, 22, 24, 30); g.fillRect(4, 76, 24, 30);
    const tx = new T.CanvasTexture(c); tx.encoding = T.sRGBEncoding;
    const galga = P(new T.Mesh(new T.PlaneGeometry(1.9, .95), new T.MeshStandardMaterial({ map: tx, roughness: .6, emissive: 0xff3000, emissiveIntensity: 0 })), 'galga');
    galga.rotation.x = -Math.PI / 2; scene.add(galga);
    const GX = 1.45;   // centro de la galga medido desde el empotramiento
    // pesa
    const pesa = new T.Group(); scene.add(pesa);
    const gancho = P(new T.Mesh(new T.TorusGeometry(.22, .05, 8, 20), m.steel), 'pesa'); gancho.position.y = -.1; pesa.add(gancho);
    P(cyl(.05, 1.0, m.steel, 0, -.75, 0, pesa, 8), 'pesa');
    const discos = []; for (let i = 0; i < 10; i++) { const d = P(cyl(.6, .14, M(0x2b2f36, { metalness: .5, roughness: .4 }), 0, -1.3 - i * .15, 0, pesa, 28), 'pesa'); discos.push(d); }
    // placa del puente y voltímetro
    P(boxR(-9.2, -6.2, 0, .12, -1.6, 1.6, M(0x1f6b3a, { roughness: .6 })), 'puente');
    [[-8.4, -.8, 'R1'], [-8.4, 0, 'R2'], [-8.4, .8, 'R3']].forEach(([x, z, t]) => { ejeX(P(cyl(.14, .7, M(0xd9c08f), x, .3, z, null, 14), 'puente')); UT.rotulo(ctx, t, .4, .2, V(x + .7, .13, z), [-Math.PI / 2, 0, 0], { color: '#fff' }); });
    P(boxR(-9.2, -6.6, .12, 1.9, 1.7, 2.3, m.dark), 'voltimetro');
    const pc = document.createElement('canvas'); pc.width = 256; pc.height = 96; const pg = pc.getContext('2d');
    const ptx = new T.CanvasTexture(pc); ptx.encoding = T.sRGBEncoding;
    const pant = new T.Mesh(new T.PlaneGeometry(2.2, .82), new T.MeshBasicMaterial({ map: ptx })); pant.position.set(-7.9, 1.05, 2.31); scene.add(pant);
    let ultimo = '';
    const pantalla = txt => { if (txt === ultimo) return; ultimo = txt; pg.fillStyle = '#b8d4a8'; pg.fillRect(0, 0, 256, 96); pg.fillStyle = '#1a2a14'; pg.font = '600 54px Inter, Arial'; pg.textAlign = 'right'; pg.fillText(txt, 240, 66); ptx.needsUpdate = true; };
    const ver = () => { const xp = GX + .65, y = Y + flecha(xp, 0) + .16; return V(-4 + xp, y, 0); };
    const lead = s => [V(-4 + GX - .85, Y + .17, s * .25), V(-4.6, Y + 1.05, s * .3), V(-6.2, 1.0, s * .3), V(-6.4, .2, s * .3)];
    const fA = ctx.flow({ color: 0xffc400, size: .045, gap: .2 }), fB = ctx.flow({ color: 0xffc400, size: .045, gap: .2 });
    let tubos = [];

    const $ = s => panel.querySelector(s);
    const kgI = $('#kg'), kgV = $('#kgV'), msg = $('#msg');
    const r = { E: $('#rE'), R: $('#rR'), DR: $('#rDR'), V: $('#rV') }, vm = $('#vm'), sG = $('#sG');
    let kg = 0, d = 0, clave = '';
    const setK = v => { kg = v; kgI.value = v; kgV.textContent = fmt(v, 1) + ' kg'; };
    kgI.oninput = () => setK(+kgI.value);
    panel.querySelectorAll('[data-u]').forEach(b => b.onclick = () => setK(+b.dataset.u));
    const mas = () => setK(kg >= 5 ? 0 : Math.min(5, Math.floor(kg) + 1));
    UT.hit(panel, '#hG', mas, false, 'Añadir 1 kg');
    ctx.accion('pesa', mas, { pista: 'Púlsala en el modelo para añadir 1 kg (al pasar de 5 kg se descarga).' });

    return {
      update(dt) {
        d += (kg * .26 - d) * Math.min(1, dt * 6);
        segs.forEach((b, i) => { const xp = (i + .5) * L / N; b.position.set(-4 + xp, Y + flecha(xp, d), 0); b.rotation.z = Math.atan(pend(xp, d)); });
        galga.position.set(-4 + GX, Y + flecha(GX, d) + .16, 0); galga.rotation.set(-Math.PI / 2, 0, 0); galga.rotateOnWorldAxis(V(0, 0, 1), Math.atan(pend(GX, d)));
        pesa.position.set(-4 + L - .2, Y + flecha(L - .2, d) - .15, 0);
        discos.forEach((dd, i) => { dd.visible = i < Math.round(kg * 2); });
        const eps = d / .26 * EPS_KG, R = R0 * (1 + K * eps), vo = VEX * K * eps / 4;
        galga.material.emissiveIntensity = Math.min(.6, eps / 1e-3 * .5);
        const k = d.toFixed(3);
        if (k !== clave) { clave = k; tubos.forEach(t => { ctx.unpart(t); scene.remove(t); t.geometry.dispose(); }); tubos = [1, -1].map(s => P(tube(lead(s), .035, s > 0 ? m.red : m.black), 'cables')); }
        fA.path(curva(lead(1), 20).reverse()).set(1, .8); fB.path(curva(lead(-1), 20)).set(1, .8);
        pantalla(fmt(vo * 1000, 2) + ' mV');

        ctx.step(eps < 5e-6 ? 0 : eps < 3e-4 ? 1 : 2);
        set(r.E, Math.round(eps * 1e6) + ' µm/m');
        set(r.R, fmt(R, 3) + ' Ω', eps > 0 ? 'ok' : '');
        set(r.DR, '+' + fmt(R - R0, 3) + ' Ω');
        set(r.V, fmt(vo * 1000, 2) + ' mV', vo > 0 ? 'ok' : '');
        vm.textContent = fmt(vo * 1000, 2) + ' mV';
        sG.style.fill = eps > 0 ? `rgba(255,90,31,${Math.min(.6, eps / 1e-3 * .5).toFixed(2)})` : 'var(--bg)';
        const t = kg === 0 ? 'Sin carga las cuatro resistencias del puente valen 120 Ω: está equilibrado y la salida es 0 mV.'
          : `R = R0 · (1 + K · ε) = 120 · (1 + 2 · ${fmt(eps * 1e6, 0)}·10⁻⁶) = ${fmt(R, 3)} Ω. Un cambio tan pequeño solo se puede medir con un puente: Vs ≈ Vex · K · ε / 4 = ${fmt(vo * 1000, 2)} mV.`;
        set(msg, t); msg.hidden = false;
      },
      labels: [
        { p: 'galga', txt: 'Galga extensiométrica', at: () => ver() },
        { p: 'viga', txt: 'Viga en voladizo', at: () => V(1.5, Y + flecha(5.5, d) - .1, .7) },
        { p: 'empotramiento', at: () => V(-5.4, Y + .9, 1.3), l: 1 },
        { p: 'pesa', txt: 'Pesas', at: () => pesa.localToWorld(V(.6, -1.4, 0)) },
        { p: 'puente', txt: 'Puente de Wheatstone', at: () => V(-9.2, .2, -1.2), l: 1 },
        { p: 'voltimetro', txt: 'Milivoltímetro', at: () => V(-6.6, 1.9, 2.3) }
      ]
    };
  }

  window.COMPONENTES.push({
    id: 'galga', nombre: 'Galga extensiométrica', categoria: 'Sensores', grupo: 'Resistivos',
    resumen: 'Una resistencia que cambia al estirarse; se mide con un puente de Wheatstone.',
    titulo: 'Galga extensiométrica: medir cuánto se estira una pieza',
    lead: 'Cuelga pesas del extremo de la viga. La superficie superior se estira, el hilo de la galga se alarga, su resistencia sube unas milésimas de ohmio y el puente lo convierte en milivoltios.',
    camara: { pos: [1.5, 7.5, 19.5], tgt: [-2.2, .6, 0] }, suelo: -3.4,
    panel: PANEL, build,
    leyenda: [['#ffc400', 'Corriente de excitación del puente']],
    pasos: [
      ['1. Sin carga', 'La galga mide R0 = 120 Ω, igual que las otras tres resistencias: el puente está equilibrado y la salida es cero.'],
      ['2. La viga se flexiona', 'Con carga, la cara superior de la viga se alarga. La galga, pegada a ella, se estira: el hilo es más largo y más fino y su resistencia aumenta: R = R0 · (1 + K · ε).'],
      ['3. Puente desequilibrado', 'Al cambiar una rama, aparece una tensión entre los puntos medios del puente, proporcional a la deformación: Vs ≈ Vex · K · ε / 4.']
    ],
    partes: {
      galga:         { t: 'Galga extensiométrica', d: 'Hilo o lámina metálica en zigzag sobre un soporte de plástico. El zigzag alarga el hilo en la dirección de medida para que cambie más su resistencia; los tramos transversales son anchos para que las tensiones transversales casi no le afecten.' },
      viga:          { t: 'Viga en voladizo', d: 'Pieza de acero que se curva con la carga. Su deformación, en µm/m, es lo que mide la galga.' },
      empotramiento: { t: 'Empotramiento', d: 'Mordaza que sujeta la viga por un extremo. Cerca de ella la deformación es mayor, por eso se pega ahí la galga.' },
      pesa:          { t: 'Pesas', d: 'Cada disco son 0,5 kg. Púlsalas para añadir carga.' },
      puente:        { t: 'Puente de Wheatstone', d: 'Tres resistencias fijas de 120 Ω y la galga. En ¼ de puente solo una rama es sensor.' },
      voltimetro:    { t: 'Milivoltímetro', d: 'Mide la tensión de desequilibrio del puente.' },
      cables:        { t: 'Cables de la galga', d: 'Unen las pestañas de soldadura de la galga con el puente.' },
      base:          { t: 'Base', d: 'Bancada del ensayo.' }
    },
    extra: `
      <div class="two">
        <div>
          <h2>La fórmula de los apuntes</h2>
          <p><b>R = R0 · (1 + K · ε)</b>, con R0 = 120 Ω, factor de galga K ≈ 2 y deformación ε en µm/m.</p>
          <p>Ejemplo: con ε = 500 µm/m, R = 120 · (1 + 2 · 0,0005) = 120,12 Ω. Son 0,12 Ω de cambio: por eso hace falta un puente de Wheatstone y, normalmente, un amplificador.</p>
          <p>La temperatura también cambia la resistencia. Para compensarla se pone otra galga igual en el puente, pegada a la pieza pero sin deformarse (medio puente).</p>
        </div>
        <div>
          <h2>Montajes del puente</h2>
          <table><tbody>
            <tr><td>¼ de puente</td><td>1 galga. Vs ≈ Vex · K · ε / 4</td></tr>
            <tr><td>½ puente</td><td>2 galgas (una arriba y otra abajo de la viga). Doble de salida y compensación de temperatura</td></tr>
            <tr><td>Puente completo</td><td>4 galgas. Cuatro veces la salida: así funcionan las células de carga de las básculas</td></tr>
          </tbody></table>
        </div>
      </div>`
  });
})();
