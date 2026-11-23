// Componente: fusible cilíndrico 10x38 gG 16 A en su portafusibles para carril DIN
(() => {
  const { fmt, set } = UT;
  const IN = 16, I_CC = 500;

  const PANEL = `
    <label class="sp"><span>Corriente de la carga</span><input type="range" id="iL" min="0" max="64" step="1" value="10"><b id="iLv">10 A</b></label>
    <div class="row"><button class="sm" data-i="10">10 A normal</button><button class="sm" data-i="24">24 A (1,5·In)</button><button class="sm" data-i="40">40 A (2,5·In)</button></div>
    <button class="sm" id="cc" aria-pressed="false">Provocar cortocircuito</button>
    <button class="big" id="rep" disabled>Sustituir el cartucho</button>
    <p class="msg" id="msg" hidden></p>
    ${UT.dl([['rI', 'Corriente que circula', '10,0 A'], ['rT', 'Temperatura del elemento', '20 °C'], ['rE', 'Estado', 'intacto']])}
    <svg class="sch" viewBox="0 0 300 116" aria-label="Esquema: fase L, fusible F1, carga y neutro N">
      <text x="2" y="44">L</text><line x1="14" y1="40" x2="62" y2="40"/>
      <rect x="62" y="32" width="44" height="16"/><line id="sF" x1="62" y1="40" x2="106" y2="40"/><text x="62" y="64">F1 · gG 16 A</text>
      <line x1="106" y1="40" x2="170" y2="40"/><rect x="170" y="28" width="50" height="24"/><text x="178" y="44">Carga</text>
      <line x1="220" y1="40" x2="270" y2="40"/><line x1="270" y1="40" x2="270" y2="92"/><line x1="270" y1="92" x2="14" y2="92"/><text x="2" y="96">N</text>
      <path id="sCC" class="ccl" d="M150 40 V92"/>
      <path id="fN" class="flow fl" d="M14 40 H270 V92 H14"/><path id="fC" class="flow fl" d="M14 40 H150 V92 H14"/>
      <rect class="hit" id="hF" x="58" y="26" width="52" height="28" rx="5"/><rect class="hit" id="hCC" x="140" y="46" width="22" height="40" rx="4"/>
    </svg>
    <p class="nota-sch">Pulsa F1 en el esquema para cambiar el cartucho fundido y la línea vertical para el cortocircuito.</p>
    <div class="chk"><label><input type="checkbox" id="cIn" checked> Ver por dentro del cartucho</label></div>`;

  function build(ctx, panel) {
    const { T, V, scene, M, boxR, cyl, tube, curva, part: P, spark } = ctx;
    const m = UT.mats(ctx);
    UT.carrilDetras(ctx, -2.2, 2.2, 3.5, -1.0, m.zinc);

    // base portafusibles
    P(boxR(-.9, .9, 0, 7, -1.0, -.2, m.plastic), 'base');
    P(boxR(-.9, .9, 6.0, 7.0, -.2, .9, m.plastic), 'base'); P(boxR(-.9, .9, 0, 1.0, -.2, .9, m.plastic), 'base');
    UT.rotulo(ctx, [['10x38', 46], ['máx. 32 A', 34]], 1.3, .6, V(0, 3.5, -.19), [0, 0, 0], { color: '#e9e8e3' });
    P(boxR(-.45, .45, 6.25, 6.75, .6, .92, m.steel), 'bornes'); UT.tornillo(ctx, 0, 6.5, .95, m.steel, m.black, 'bornes');
    P(boxR(-.45, .45, .25, .75, .6, .92, m.steel), 'bornes'); UT.tornillo(ctx, 0, .5, .95, m.steel, m.black, 'bornes');
    const cIn = [V(0, 9, .5), V(0, 7.6, .5), V(0, 6.5, .5)], cOut = [V(0, .5, .5), V(0, -.8, .5), V(0, -2.2, .5)];
    P(tube(cIn, .13, m.brown), 'cables'); P(tube(cOut, .13, m.brown), 'cables');

    // pinzas
    for (const [y0, y1] of [[1.5, 2.2], [4.6, 5.3]]) {
      P(boxR(-.64, -.52, y0, y1, -.1, .55, m.bronze), 'pinzas'); P(boxR(.52, .64, y0, y1, -.1, .55, m.bronze), 'pinzas');
      P(boxR(-.64, .64, y0, y1, -.2, -.1, m.bronze), 'pinzas');
    }
    P(boxR(-.12, .12, 1.0, 1.5, -.2, -.1, m.bronze), 'pinzas'); P(boxR(-.12, .12, 5.3, 6.0, -.2, -.1, m.bronze), 'pinzas');

    // cartucho
    const zc = .35;
    P(cyl(.52, .55, m.silver, 0, 1.775, zc, null, 32), 'casquillos'); P(cyl(.52, .55, m.silver, 0, 5.025, zc, null, 32), 'casquillos');
    const cer = P(new T.Mesh(new T.CylinderGeometry(.5, .5, 2.7, 40), new T.MeshPhysicalMaterial({ color: 0xf3f1ea, roughness: .6, transparent: true, opacity: .22, depthWrite: false })), 'cartucho');
    cer.position.set(0, 3.4, zc); cer.renderOrder = 2; scene.add(cer);
    const elM = M(0xd9dde2, { metalness: .9, roughness: .25, emissive: 0xff5a10, emissiveIntensity: 0 });
    const segs = [[2.05, 2.69, .36], [2.69, 2.81, .08], [2.81, 3.34, .36], [3.34, 3.46, .08], [3.46, 3.99, .36], [3.99, 4.11, .08], [4.11, 4.75, .36]];
    const el = segs.map(([a, b, w], i) => P(boxR(-w / 2, w / 2, a, b, zc - .02, zc + .02, elM), i % 2 ? 'cuellos' : 'elemento'));
    const cuello = el[3];
    const glob = [P(new T.Mesh(new T.SphereGeometry(.06, 12, 8), elM), 'elemento'), P(new T.Mesh(new T.SphereGeometry(.06, 12, 8), elM), 'elemento')];
    glob[0].position.set(0, 3.33, zc); glob[1].position.set(0, 3.47, zc); glob.forEach(g => { g.visible = false; scene.add(g); });
    const fulg = P(new T.Mesh(new T.SphereGeometry(.2, 16, 12), M(0x4a4038, { roughness: .2, metalness: .2 })), 'arena');
    fulg.position.set(0, 3.4, zc); fulg.scale.set(1.3, .7, 1); fulg.visible = false; scene.add(fulg);
    // arena de sílice
    const N = 150, arena = P(new T.InstancedMesh(new T.SphereGeometry(.028, 6, 4), M(0xe4d3a8, { roughness: .9 }), N), 'arena');
    { const d = new T.Object3D(); let i = 0;
      while (i < N) { const a = Math.random() * 6.283, rr = Math.sqrt(Math.random()) * .45, x = Math.cos(a) * rr, z = Math.sin(a) * rr;
        if (Math.abs(x) < .24 && Math.abs(z) < .07) continue;
        d.position.set(x, 2.1 + Math.random() * 2.6, zc + z); d.updateMatrix(); arena.setMatrixAt(i++, d.matrix); }
      scene.add(arena); }

    // corriente
    const fL = ctx.flow({ color: 0xff5a1f, size: .07 });
    const path = [...curva(cIn), V(0, 6.0, -.15), V(0, 5.3, -.15), V(0, 5.0, zc), V(0, 4.75, zc), V(0, 2.05, zc), V(0, 1.8, zc), V(0, 1.5, -.15), V(0, 1.0, -.15), ...curva(cOut)];
    fL.path(path);

    const $ = s => panel.querySelector(s);
    const iL = $('#iL'), iLv = $('#iLv'), ccB = $('#cc'), rep = $('#rep'), msg = $('#msg');
    const r = { I: $('#rI'), T: $('#rT'), E: $('#rE') }, s = { f: $('#sF'), cc: $('#sCC'), fN: $('#fN'), fC: $('#fC') };
    let Iset = 10, cc = false, ok = true, th = 0, arcT = 0, sparkT = 0, motivo = '';
    const setI = v => { Iset = v; iL.value = v; iLv.textContent = v + ' A'; };
    iL.oninput = () => setI(+iL.value);
    panel.querySelectorAll('[data-i]').forEach(b => b.onclick = () => setI(+b.dataset.i));
    ccB.onclick = () => { cc = !cc; ccB.setAttribute('aria-pressed', cc); };
    $('#cIn').onchange = e => { cer.material.opacity = e.target.checked ? .22 : 1; cer.material.depthWrite = !e.target.checked; arena.visible = e.target.checked; };
    UT.hit(panel, '#hCC', () => ccB.onclick(), false, 'Cortocircuito');
    rep.onclick = () => { ok = true; th = 0; cuello.visible = true; glob.forEach(g => g.visible = false); fulg.visible = false; };

    UT.hit(panel, '#hF', () => rep.onclick(), false, 'Fusible F1');
    ['cartucho', 'casquillos', 'elemento', 'cuellos'].forEach(id => ctx.accion(id, () => { if (!ok) rep.onclick(); }, { pista: 'Cuando esté fundido, púlsalo en el modelo para poner un cartucho nuevo.' }));
    return {
      tecla: () => rep.onclick(),
      update(dt) {
        const I = ok ? (cc ? I_CC : Iset) : 0;
        const tInf = (I / IN) ** 2 / 2;
        th += (tInf - th) * Math.min(1, dt / (I >= 8 * IN ? .02 : ok ? 3 : 5));
        if (ok && th >= 1) {
          ok = false; motivo = I >= 8 * IN ? 'cc' : 'sc'; cuello.visible = false; glob.forEach(g => g.visible = true); fulg.visible = true; arcT = motivo === 'cc' ? .3 : .12;
        }
        if (arcT > 0) { arcT -= dt; sparkT -= dt; if (sparkT <= 0) { sparkT = .04; spark(V((Math.random() - .5) * .3, 3.4 + (Math.random() - .5) * .25, zc)); } }
        elM.emissiveIntensity = ok ? Math.max(0, Math.min(1.4, (th - .25) * 1.8)) : Math.max(0, elM.emissiveIntensity - dt);
        fL.set(ok && I > 0 ? 1 : 0, Math.min(5, .6 + I / 16));

        ctx.step(ok ? (I > IN ? 1 : 0) : !cc && th < .5 ? 3 : motivo === 'cc' ? 2 : 1);
        set(r.I, fmt(I, 1) + ' A', I > IN ? 'on' : '');
        set(r.T, Math.round(20 + Math.min(1, th) * 940) + ' °C', th > .6 ? 'on' : '');
        set(r.E, ok ? 'intacto' : 'fundido', ok ? 'ok' : 'on');
        rep.disabled = ok;
        const t = !ok && motivo === 'cc' ? 'Cortocircuito: el elemento se ha fundido en milisegundos por los estrechamientos y la arena ha apagado el arco (se forma una pequeña masa vítrea).' + (cc ? ' Quita el cortocircuito antes de poner un cartucho nuevo.' : '')
          : !ok ? 'Sobrecarga: el elemento se ha calentado hasta fundirse en un estrechamiento. Un fusible fundido no se rearma: hay que cambiar el cartucho por otro igual.'
          : I > IN ? `Sobrecarga: pasan más de ${IN} A y el elemento se calienta poco a poco (tiempo acelerado).` : '';
        set(msg, t); msg.hidden = !t;
        s.f.style.display = ok ? '' : 'none';
        s.cc.style.opacity = cc ? 1 : .15;
        s.fN.classList.toggle('live', ok && I > 0 && !cc); s.fC.classList.toggle('live', ok && cc);
      },
      labels: [
        { p: 'casquillos', at: () => V(.55, 5.1, zc) },
        { p: 'cartucho', txt: 'Cuerpo cerámico', at: () => V(-.5, 4.4, zc), l: 1 },
        { p: 'elemento', txt: 'Elemento fusible', at: () => V(.2, 2.4, zc) },
        { p: 'cuellos', txt: 'Estrechamientos', at: () => V(.05, 4.05, zc + .02) },
        { p: 'arena', txt: 'Arena de sílice', at: () => V(-.35, 2.6, zc + .3), l: 1 },
        { p: 'pinzas', at: () => V(.64, 1.8, .4) },
        { p: 'bornes', txt: 'Bornes', at: () => V(.45, 6.5, .9) },
        { p: 'base', txt: 'Portafusibles', at: () => V(-.9, .5, .9), l: 1 },
        { p: 'carril', txt: 'Carril DIN', at: () => V(2.2, 1.9, -1.0) }
      ]
    };
  }

  window.COMPONENTES.push({
    id: 'fusible', nombre: 'Fusible', categoria: 'Protección',
    resumen: 'Un hilo calibrado que se funde cuando la corriente es excesiva.',
    titulo: 'Fusible: se sacrifica para proteger el circuito',
    lead: 'Sube la corriente por encima de 16 A y observa cómo se calienta el elemento hasta fundirse por un estrechamiento, o provoca un cortocircuito para verlo fundir al instante.',
    camara: { pos: [6, 5, 9], tgt: [0, 3.3, .2] }, suelo: -2.3,
    panel: PANEL, build,
    leyenda: [['#ff5a1f', 'Corriente que atraviesa el fusible']],
    pasos: [
      ['1. Funcionamiento normal', 'La corriente pasa por los casquillos y el elemento fusible. Con 16 A o menos el calor se disipa y no ocurre nada.'],
      ['2. Sobrecarga', 'Con más corriente el elemento se calienta. Los estrechamientos son los puntos más finos: allí la temperatura es mayor y es donde se funde.'],
      ['3. Cortocircuito', 'Una corriente muy alta funde el elemento en milisegundos. El arco que se forma se enfría y se apaga dentro de la arena de sílice.'],
      ['4. Sustitución', 'El fusible no se rearma: se cambia el cartucho por otro del mismo tipo y calibre, con el portafusibles abierto (sin tensión).']
    ],
    partes: {
      cartucho:   { t: 'Cuerpo cerámico', d: 'Tubo de cerámica que soporta la presión y el calor del arco. Aquí se ve transparente para mirar dentro.' },
      casquillos: { t: 'Casquillos', d: 'Tapas metálicas de los extremos. Hacen contacto con las pinzas del portafusibles y sujetan el elemento.' },
      elemento:   { t: 'Elemento fusible', d: 'Cinta de plata o cobre calibrada. Su sección decide cuánta corriente aguanta.' },
      cuellos:    { t: 'Estrechamientos', d: 'Zonas más estrechas del elemento. Concentran el calor para que el fusible funda siempre en un punto controlado y el arco sea corto.' },
      arena:      { t: 'Arena de sílice', d: 'Rellena el cartucho. Al fundirse el elemento, absorbe el calor del arco, lo enfría y lo apaga. Tras un cortocircuito queda una pequeña masa vítrea.' },
      pinzas:     { t: 'Pinzas', d: 'Contactos elásticos de bronce que aprietan los casquillos.' },
      base:       { t: 'Portafusibles', d: 'Base aislante para carril DIN. En los portafusibles seccionables se abre una tapa que deja el cartucho sin tensión antes de cambiarlo.' },
      bornes:     { t: 'Bornes', d: 'Entrada (arriba) y salida (abajo) de los cables.' },
      carril:     { t: 'Carril DIN', d: 'Perfil de 35 mm donde se engancha el portafusibles.' },
      cables:     { t: 'Cables', d: 'Fase de entrada y salida hacia la carga.' }
    },
    extra: `
      <div class="two">
        <div>
          <h2>Cómo leer un fusible</h2>
          <p><b>10x38</b>: tamaño (diámetro × largo en mm). <b>gG</b>: uso general, protege cables frente a sobrecargas y cortocircuitos. <b>aM</b>: acompañamiento de motor, solo cortocircuitos (deja pasar el arranque). <b>16 A</b>: corriente nominal. <b>500 V</b>: tensión máxima.</p>
          <p>Un fusible gG de 16 A no funde con 16 A; con 1,6 veces In funde en menos de una hora, y con un cortocircuito en milisegundos. Es más rápido que un magnetotérmico frente a cortocircuitos muy fuertes y puede cortar corrientes enormes.</p>
          <p class="note">En la simulación el calentamiento está acelerado para verlo en segundos.</p>
        </div>
        <div>
          <h2>Ventajas e inconvenientes</h2>
          <table><tbody>
            <tr><td>Ventajas</td><td>Barato, muy rápido en cortocircuitos, gran poder de corte</td></tr>
            <tr><td>Inconvenientes</td><td>Hay que cambiarlo tras fundir; en trifásica puede quedar una fase sin servicio</td></tr>
            <tr><td>Nunca</td><td>Sustituir por un fusible de más calibre ni puentearlo con un cable</td></tr>
          </tbody></table>
        </div>
      </div>`
  });
})();
