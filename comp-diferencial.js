// Componente: interruptor diferencial 2P 30 mA, visto de frente con la tapa transparente
(() => {
  const { fmt, set } = UT;
  const I_CARGA = 2.0, UMBRAL = 22;   // mA (dispara entre 15 y 30 mA)

  const PANEL = `
    <button class="big" id="ap" aria-pressed="true">Apagar el aparato</button>
    <div><h3>Fuga a tierra en el aparato</h3>
      <div class="row" id="fuga"><button class="sm" data-v="0" aria-pressed="true">Sin fuga</button><button class="sm" data-v="10" aria-pressed="false">10 mA</button><button class="sm" data-v="50" aria-pressed="false">50 mA</button></div></div>
    <div class="row"><button class="sm" id="test" aria-pressed="false">Mantener botón de prueba T</button><button class="sm" id="man">Bajar maneta</button></div>
    <p class="msg" id="msg" hidden></p>
    ${UT.dl([['rL', 'Corriente por la fase L', '2,000 A'], ['rN', 'Corriente por el neutro N', '2,000 A'], ['rD', 'Diferencia (fuga)', '0 mA'], ['rE', 'Estado', 'conectado']])}
    <svg class="sch" viewBox="0 0 300 126" aria-label="Esquema: fase y neutro atraviesan el toroide del diferencial y alimentan un aparato con su carcasa a tierra">
      <text x="2" y="38">L</text><text x="2" y="68">N</text>
      <line x1="14" y1="34" x2="110" y2="34"/><line x1="130" y1="34" x2="200" y2="34"/>
      <line x1="14" y1="64" x2="110" y2="64"/><line x1="130" y1="64" x2="200" y2="64"/>
      <line id="bL" x1="110" y1="34" x2="130" y2="34"/><line id="bN" x1="110" y1="64" x2="130" y2="64"/>
      <rect class="box" x="50" y="16" width="92" height="62"/><ellipse cx="75" cy="49" rx="8" ry="24"/><text x="52" y="94">ID 30 mA</text>
      <rect x="200" y="24" width="46" height="50"/><text x="203" y="52">Aparato</text>
      <line x1="223" y1="74" x2="223" y2="104"/><line x1="211" y1="104" x2="235" y2="104"/><line x1="215" y1="109" x2="231" y2="109"/><line x1="219" y1="114" x2="227" y2="114"/>
      <path id="fL" class="flow fl" d="M14 34 H200"/><path id="fN" class="flow fl" d="M200 64 H14"/><path id="fK" class="flow fk" d="M223 74 V104"/>
      <rect class="hit" id="hC" x="104" y="16" width="32" height="56" rx="5"/><rect class="hit" id="hA" x="198" y="22" width="50" height="54" rx="5"/>
    </svg>
    <p class="nota-sch">Pulsa los contactos del esquema para subir o bajar el diferencial, y el aparato para encenderlo o apagarlo.</p>
    <div class="chk"><label><input type="checkbox" id="cCase" checked> Tapa transparente</label></div>`;

  function build(ctx, panel) {
    const { T, V, scene, M, boxR, cyl, tube, curva, part: P, unpart, spark } = ctx;
    const m = UT.mats(ctx), caseM = M(0xe9e8e3, { roughness: .7 });

    P(boxR(-1.8, 1.8, 0, 8, -1.0, -.9, caseM), 'carcasa');
    P(boxR(-1.8, -1.7, 0, 8, -.9, .9, caseM), 'carcasa'); P(boxR(1.7, 1.8, 0, 8, -.9, .9, caseM), 'carcasa');
    P(boxR(-1.8, 1.8, 7.9, 8, -.9, .9, caseM), 'carcasa'); P(boxR(-1.8, 1.8, 0, .1, -.9, .9, caseM), 'carcasa');
    const tapa = UT.caja(ctx, 3.6, 8, .05, V(0, 4, .93), 'tapa');
    UT.carrilDetras(ctx, -3.2, 3.2, 4, -1.0, m.zinc);

    // bornes
    for (const x of [-.9, .9]) {
      P(boxR(x - .4, x + .4, 7.0, 7.7, -.3, .5, m.steel), 'bornesE'); UT.tornillo(ctx, x, 7.35, .6, m.steel, m.black, 'bornesE');
      P(boxR(x - .4, x + .4, .3, 1.0, -.3, .5, m.steel), 'bornesS'); UT.tornillo(ctx, x, .65, .6, m.steel, m.black, 'bornesS');
    }
    const inL = [V(-.9, 10, .1), V(-.9, 8.6, .1), V(-.9, 7.35, .1)], inN = [V(.9, 10, .1), V(.9, 8.6, .1), V(.9, 7.35, .1)];
    P(tube(inL, .12, m.brown), 'cables'); P(tube(inN, .12, m.blue), 'cables');

    // conductores que atraviesan el toroide
    const cL = [V(-.9, 7.2, .1), V(-.6, 6.6, 0), V(-.35, 6.0, 0), V(-.35, 3.1, 0)], cN = [V(.9, 7.2, .1), V(.6, 6.6, 0), V(.35, 6.0, 0), V(.35, 3.1, 0)];
    P(tube(cL, .09, m.copper), 'conductores'); P(tube(cN, .09, m.copper), 'conductores');
    P(cyl(.14, .1, m.silver, -.35, 3.05, 0, null, 20), 'contactos'); P(cyl(.14, .1, m.silver, .35, 3.05, 0, null, 20), 'contactos');

    // toroide y bobinado secundario
    const tor = P(new T.Mesh(new T.TorusGeometry(1.0, .28, 18, 56), M(0x4b4f55, { roughness: .5, metalness: .3, emissive: 0x2f8cff, emissiveIntensity: 0 })), 'toroide');
    tor.position.set(0, 5, 0); tor.rotation.x = Math.PI / 2; ctx.add(tor);
    const sec = P(new T.Mesh(new T.TorusGeometry(1.0, .34, 12, 28, 1.3), m.wind2), 'secundario');
    sec.position.set(0, 5, 0); sec.rotation.set(Math.PI / 2, 0, -.65); ctx.add(sec);
    const sA = [V(1.3, 5.12, .2), V(1.5, 5.6, .25), V(1.2, 6.05, .15)], sB = [V(1.25, 4.9, -.2), V(1.55, 5.5, -.15), V(1.35, 6.05, -.05)];
    P(tube(sA, .03, m.copper), 'secundario'); P(tube(sB, .03, m.copper), 'secundario');

    // relé de disparo y barra de disparo
    P(cyl(.32, .7, m.wind2, 1.25, 6.4, .05, null, 24), 'rele');
    P(cyl(.36, .06, m.dark, 1.25, 6.05, .05, null, 24), 'rele'); P(cyl(.36, .06, m.dark, 1.25, 6.75, .05, null, 24), 'rele');
    const vas = P(cyl(.07, .5, m.steel, 1.25, 6.95, .05, null, 12), 'rele'); const vasY = vas.position.y;
    const bar = new T.Group(); bar.position.set(.25, 7.25, .3); scene.add(bar);
    P(boxR(0, 1.25, -.05, .05, -.08, .08, m.dark, bar), 'mecanismo');

    // carro de contactos móviles
    const carro = new T.Group(); scene.add(carro);
    P(boxR(-.8, .8, 2.45, 2.6, -.3, .3, m.card, carro), 'contactos');
    P(boxR(-.06, .06, 2.6, 3.8, -.06, .06, m.plastic, carro), 'mecanismo');
    for (const x of [-.35, .35]) { P(boxR(x - .2, x + .2, 2.6, 2.9, -.2, .2, m.bronze, carro), 'contactos'); P(cyl(.14, .1, m.silver, x, 2.95, 0, carro, 20), 'contactos'); }

    // maneta y botón de prueba
    const han = new T.Group(); han.position.set(0, 6.9, .5); scene.add(han);
    P(boxR(-.3, .3, -.15, .15, -.2, .65, M(0x2f6fb5, { roughness: .5 }), han), 'maneta');
    const tst = P(boxR(-.25, .25, 6.0, 6.35, .6, .95, m.yellow), 'prueba'); const tstZ = tst.position.z;
    UT.rotulo(ctx, 'T', .4, .3, V(0, 6.17, .955), [0, 0, 0]);
    P(cyl(.12, .6, m.card, -1.3, 4.8, .3, null, 16), 'resistencia');
    const r1 = [V(-.35, 4.2, 0), V(-1.0, 4.25, .2), V(-1.3, 4.5, .3)], r2 = [V(-1.3, 5.1, .3), V(-1.2, 5.9, .5), V(-.25, 6.17, .62)], r3 = [V(.25, 6.17, .62), V(.4, 6.3, .3), V(.35, 6.2, .05)];
    [r1, r2, r3].forEach(c => P(tube(c, .025, m.copper), 'resistencia'));

    // carga: aparato con carcasa metálica unida a tierra
    const oL = [V(-.9, .65, .1), V(-.9, -.6, .1), V(-.6, -1.9, 0)], oN = [V(.9, .65, .1), V(.9, -.6, .1), V(.6, -1.9, 0)];
    P(tube(oL, .12, m.brown), 'cables'); P(tube(oN, .12, m.blue), 'cables');
    P(boxR(-1.6, 1.6, -3.8, -1.9, -1.0, 1.0, M(0xb9bec4, { metalness: .6, roughness: .35 })), 'aparato');
    UT.rotulo(ctx, [['Aparato', 56], ['230 V · 2 A', 40]], 1.8, .8, V(0, -2.9, 1.01), [0, 0, 0]);
    const falla = P(new T.Mesh(new T.SphereGeometry(.12, 16, 12), M(0x550000, { emissive: 0xff2222, emissiveIntensity: 0 })), 'aparato');
    falla.position.set(1.05, -2.35, 1.0); ctx.add(falla);
    const pe = [V(1.6, -2.8, 0), V(2.5, -2.8, 0), V(2.8, -3.6, 0), V(2.8, -4.6, 0)];
    const peM = M(0x3c9a3c, { roughness: .5 });
    P(tube(pe, .1, peM), 'tierra');
    P(cyl(.06, 1.4, m.steel, 2.8, -5.3, 0, null, 12), 'tierra');
    [[.5, -4.62], [.34, -4.82], [.18, -5.02]].forEach(([w, y]) => P(boxR(2.8 - w, 2.8 + w, y - .04, y + .04, -.05, .05, m.steel), 'tierra'));

    // flujos
    const fL = ctx.flow({ color: 0xff5a1f, size: .07 }), fN = ctx.flow({ color: 0xff5a1f, size: .07 });
    const fK = ctx.flow({ color: 0xe0245e, size: .08, gap: .35 }), fT = ctx.flow({ color: 0xe0245e, size: .06, gap: .25 });
    const fS = ctx.flow({ color: 0xffc400, size: .05, gap: .18 }), fF = ctx.flow({ color: 0x2f8cff, size: .06, gap: .22 });
    const ring = []; for (let i = 0; i <= 72; i++) { const a = i / 72 * Math.PI * 2; ring.push(V(Math.cos(a), 5, Math.sin(a))); }
    fF.path(ring);
    fS.path([...curva(sA).reverse(), ...curva(sB)]);
    fT.path([...curva(r1), ...curva(r2), ...curva(r3)]);
    fK.path([V(0, -2.6, .5), V(1.05, -2.35, 1.0), V(1.6, -2.8, .3), ...curva(pe), V(2.8, -6.0, 0)]);
    let bL = null, bN = null, bKey = '';
    const brd = (x, off) => [V(x, 2.6 + off, 0), V(x * 1.2, 1.9 + off / 2, .25), V(x * 2.57, 1.0, .1)];

    // panel
    const $ = s => panel.querySelector(s);
    const ap = $('#ap'), testB = $('#test'), man = $('#man'), msg = $('#msg');
    const r = { L: $('#rL'), N: $('#rN'), D: $('#rD'), E: $('#rE') }, s = { bL: $('#bL'), bN: $('#bN'), fL: $('#fL'), fN: $('#fN'), fK: $('#fK') };
    let on = true, fuga = 0, test = false, closed = true, trip = false, off = 0, hAng = -.4, vasT = 0, rearmT = 9;
    ap.onclick = () => { on = !on; ap.setAttribute('aria-pressed', on); ap.textContent = on ? 'Apagar el aparato' : 'Encender el aparato'; };
    UT.opciones($('#fuga'), v => { fuga = +v; });
    UT.momentaneo(testB, v => { test = v; });
    man.onclick = () => { if (closed) { closed = false; trip = false; } else { closed = true; trip = false; rearmT = 0; } };
    $('#cCase').onchange = e => { tapa.visible = e.target.checked; };
    UT.hit(panel, '#hC', () => man.onclick(), false, 'Contactos del diferencial');
    UT.hit(panel, '#hA', () => ap.onclick(), false, 'Aparato');
    ctx.accion('maneta', () => man.onclick(), { pista: 'Púlsala en el modelo para subir o bajar el diferencial.' });
    ctx.accion('prueba', v => { test = v; testB.setAttribute('aria-pressed', v); }, { mantener: true, pista: 'Mantenlo pulsado en el modelo para probar el diferencial.' });
    ctx.accion('aparato', () => ap.onclick(), { pista: 'Púlsalo en el modelo para encenderlo o apagarlo.' });

    return {
      tecla: () => man.onclick(),
      update(dt) {
        const IL = closed && on ? I_CARGA : 0, Ik = closed && on ? fuga : 0, It = closed && test ? 40 : 0, dif = Ik + It;
        if (closed && dif >= UMBRAL) { closed = false; trip = true; vasT = .3; if (IL > 0) { spark(V(-.35, 3.0, 0)); spark(V(.35, 3.0, 0)); } }
        rearmT += dt;
        off += ((closed ? 0 : -.45) - off) * Math.min(1, dt * (closed ? 12 : 28)); carro.position.y = off; carro.updateMatrixWorld();
        hAng += ((closed ? -.4 : .4) - hAng) * Math.min(1, dt * 14); han.rotation.x = hAng;
        bar.rotation.z += ((trip && !closed ? .3 : 0) - bar.rotation.z) * Math.min(1, dt * 15);
        vasT = Math.max(0, vasT - dt); vas.position.y = vasY + (vasT > 0 ? .25 : 0);
        tst.position.z = tstZ - (test ? .08 : 0);
        falla.material.emissiveIntensity = Ik > 0 ? 1.5 : 0;
        const k = Math.min(1, dif / 30);
        tor.material.emissiveIntensity = k * .5;

        const kk = off.toFixed(3);
        if (kk !== bKey) {
          bKey = kk;
          [bL, bN].forEach(b => { if (b) { unpart(b); scene.remove(b); b.geometry.dispose(); } });
          bL = P(tube(brd(-.35, off), .05, m.braid), 'contactos'); bN = P(tube(brd(.35, off), .05, m.braid), 'contactos');
        }
        fL.path([...curva(inL), ...curva(cL), V(-.35, 2.95 + off, 0), ...curva(brd(-.35, off), 10), ...curva(oL), V(-.2, -2.6, 0)]).set(IL > 0 ? 1 : 0, 1.4);
        fN.path([V(.2, -2.6, 0), ...curva(oN).reverse(), ...curva(brd(.35, off), 10).reverse(), V(.35, 2.95 + off, 0), ...curva(cN).reverse(), ...curva(inN).reverse()]).set(IL > 0 ? 1 : 0, 1.4 * (1 - (Ik > 0 ? (Ik > 20 ? .4 : .15) : 0)));
        fK.set(Ik > 0 ? 1 : 0, 1.0);
        fT.set(It > 0 ? 1 : 0, 1.2);
        fS.set(dif > 0 ? 1 : 0, 1.5); fF.set(dif > 0 ? k : 0, 1.2);

        ctx.step(test ? 3 : !closed && trip ? 2 : closed && dif > 0 ? 1 : 0);
        set(r.L, fmt(IL + Ik / 1000, 3) + ' A'); set(r.N, fmt(IL, 3) + ' A');
        set(r.D, Math.round(dif) + ' mA', dif >= UMBRAL ? 'on' : '');
        set(r.E, closed ? 'conectado' : trip ? 'disparado por fuga' : 'desconectado a mano', closed ? 'ok' : trip ? 'on' : '');
        man.textContent = closed ? 'Bajar maneta' : 'Subir maneta · rearmar';
        const t = !closed && trip && fuga >= UMBRAL && on ? 'Ha disparado por la fuga. Si rearmas con el aparato averiado conectado volverá a saltar: hay que desconectar el aparato que fuga.'
          : !closed && trip ? 'Ha disparado: la diferencia entre fase y neutro ha superado el umbral y el relé de disparo ha abierto L y N.'
          : closed && Ik > 0 ? `Hay una fuga de ${Ik} mA, pero por debajo del umbral el diferencial no dispara (dispara entre 15 y 30 mA).`
          : test ? 'El botón T hace pasar una corriente por la resistencia de prueba que no atraviesa el toroide: simula una fuga.' : '';
        set(msg, t); msg.hidden = !t;
        s.bL.setAttribute('y2', closed ? 34 : 22); s.bL.setAttribute('x2', closed ? 130 : 128);
        s.bN.setAttribute('y2', closed ? 64 : 52); s.bN.setAttribute('x2', closed ? 130 : 128);
        s.fL.classList.toggle('live', IL > 0); s.fN.classList.toggle('live', IL > 0); s.fK.classList.toggle('live', Ik > 0);
      },
      labels: [
        { p: 'bornesE', txt: 'Entrada L · N', at: () => V(.9, 7.7, .5) },
        { p: 'toroide', at: () => V(-.3, 5.3, .95), l: 1 },
        { p: 'secundario', txt: 'Bobinado secundario', at: () => V(1.35, 5.0, .2) },
        { p: 'rele', txt: 'Relé de disparo', at: () => V(1.55, 6.4, .3) },
        { p: 'prueba', txt: 'Botón de prueba', at: () => V(-.25, 6.17, .95), l: 1 },
        { p: 'maneta', at: () => V(.3, 7.1, 1.0) },
        { p: 'resistencia', txt: 'Resistencia de prueba', at: () => V(-1.4, 4.45, .4), l: 1 },
        { p: 'contactos', txt: 'Contactos L · N', at: () => V(.8, 2.6 + off, .3) },
        { p: 'bornesS', txt: 'Salida L · N', at: () => V(.9, .4, .5) },
        { p: 'aparato', at: () => V(-1.6, -2.4, 1.0), l: 1 },
        { p: 'tierra', txt: 'Toma de tierra', at: () => V(3.3, -4.7, 0) }
      ]
    };
  }

  window.COMPONENTES.push({
    id: 'diferencial', nombre: 'Diferencial', categoria: 'Protección',
    resumen: 'Detecta fugas de corriente a tierra y corta para proteger a las personas.',
    titulo: 'Interruptor diferencial: compara lo que entra con lo que vuelve',
    lead: 'La fase y el neutro atraviesan un toroide. Mientras las dos corrientes son iguales no pasa nada; provoca una fuga en el aparato o pulsa el botón de prueba para ver el disparo.',
    camara: { pos: [8, 3, 18.5], tgt: [0, 1.6, 0] }, suelo: -6.1,
    panel: PANEL, build,
    leyenda: [['#ff5a1f', 'Corriente de carga'], ['#e0245e', 'Corriente de fuga'], ['#2f8cff', 'Flujo en el toroide'], ['#ffc400', 'Corriente al relé de disparo']],
    pasos: [
      ['1. Corrientes iguales', 'Toda la corriente que va por la fase vuelve por el neutro. Sus campos en el toroide se anulan y el secundario no recibe nada.'],
      ['2. Fuga a tierra', 'Parte de la corriente vuelve por la tierra (por ejemplo por una carcasa en contacto con un cable o por una persona). Ahora L y N no son iguales y aparece flujo en el toroide.'],
      ['3. Disparo', 'El flujo induce corriente en el bobinado secundario, que alimenta el relé de disparo. Este suelta el mecanismo y abre la fase y el neutro.'],
      ['4. Botón de prueba', 'El botón T conecta una resistencia que se salta el toroide y crea una fuga artificial. Se recomienda pulsarlo cada mes para comprobar que funciona.']
    ],
    partes: {
      carcasa:     { t: 'Carcasa', d: 'Caja aislante de dos módulos de ancho (2 polos: fase y neutro).' },
      tapa:        { t: 'Tapa transparente', d: 'Sustituye la cara frontal para ver el interior.' },
      bornesE:     { t: 'Bornes de entrada', d: 'Llegada de la fase (L) y el neutro (N) desde la alimentación.' },
      bornesS:     { t: 'Bornes de salida', d: 'Salida de L y N hacia los circuitos protegidos.' },
      conductores: { t: 'Conductores L y N', d: 'Pasan los dos por dentro del toroide. Como sus corrientes van en sentidos contrarios, si son iguales sus campos se anulan.' },
      toroide:     { t: 'Toroide (transformador diferencial)', d: 'Anillo de material magnético que detecta la diferencia entre la corriente de la fase y la del neutro.' },
      secundario:  { t: 'Bobinado secundario', d: 'Bobina enrollada en el toroide. Solo produce corriente cuando hay flujo, es decir, cuando hay fuga.' },
      rele:        { t: 'Relé de disparo', d: 'Electroimán muy sensible alimentado por el secundario. Con unos pocos miliamperios de fuga empuja la barra de disparo.' },
      mecanismo:   { t: 'Mecanismo de disparo', d: 'Barra y varilla que sueltan el cerrojo y separan los contactos de L y N a la vez.' },
      contactos:   { t: 'Contactos L y N', d: 'Abren los dos polos a la vez. Los latiguillos flexibles los unen con los bornes de salida.' },
      maneta:      { t: 'Maneta', d: 'Conecta y desconecta a mano. Tras un disparo baja sola.' },
      prueba:      { t: 'Botón de prueba T', d: 'Crea una fuga artificial a través de la resistencia de prueba para comprobar que el diferencial dispara.' },
      resistencia: { t: 'Resistencia de prueba', d: 'Limita la corriente de prueba a algo más de 30 mA y la hace pasar por fuera del toroide.' },
      aparato:     { t: 'Aparato con carcasa metálica', d: 'Carga de 2 A. Si un cable toca la carcasa (punto rojo), la corriente busca la tierra a través del conductor de protección.' },
      tierra:      { t: 'Conductor de protección y toma de tierra', d: 'Cable verde-amarillo que une las carcasas metálicas con la toma de tierra. Lleva la fuga a tierra para que el diferencial la detecte y dispare.' },
      carril:      { t: 'Carril DIN', d: 'Perfil de 35 mm donde se engancha el aparato.' },
      cables:      { t: 'Cables', d: 'Marrón: fase. Azul: neutro.' }
    },
    extra: `
      <div class="two">
        <div>
          <h2>Para qué sirve</h2>
          <p>El diferencial protege a las <b>personas</b>: si alguien toca una parte con tensión y la corriente pasa por su cuerpo hacia tierra, el diferencial lo detecta y corta antes de que sea peligroso. El magnetotérmico, en cambio, protege los cables frente a sobrecargas y cortocircuitos; no detecta una fuga de 30 mA.</p>
          <p><b>Sensibilidad (IΔn)</b>: 30 mA en viviendas (alta sensibilidad). Debe disparar con IΔn y no debe disparar por debajo de la mitad (15 mA). En la simulación dispara a partir de 22 mA.</p>
          <p class="note">En la simulación la fuga se dibuja más grande de lo real para que se vea: 50 mA frente a 2 A de carga sería casi imperceptible.</p>
        </div>
        <div>
          <h2>Datos de la placa</h2>
          <table><tbody>
            <tr><td>40 A</td><td>Corriente máxima que puede pasar por sus contactos</td></tr>
            <tr><td>30 mA</td><td>Sensibilidad IΔn</td></tr>
            <tr><td>Tipo AC / A</td><td>Detecta fugas alternas (AC) o también con continua pulsante (A)</td></tr>
            <tr><td>T</td><td>Botón de prueba</td></tr>
          </tbody></table>
        </div>
      </div>`
  });
})();
