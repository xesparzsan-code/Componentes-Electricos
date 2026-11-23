// Componente: interruptor magnetotérmico (PIA) 1P C16, visto en corte lateral
(() => {
  const { fmt, set, lit } = UT;
  const IN = 16, I_MAG = 8 * IN, I_CC = 500;

  const PANEL = `
    <label class="sp"><span>Corriente de la carga</span><input type="range" id="iL" min="0" max="64" step="1" value="10"><b id="iLv">10 A</b></label>
    <div class="row"><button class="sm" data-i="10">10 A normal</button><button class="sm" data-i="24">24 A (1,5·In)</button><button class="sm" data-i="48">48 A (3·In)</button></div>
    <button class="sm" id="cc" aria-pressed="false">Provocar cortocircuito</button>
    <button class="big" id="man">Bajar maneta · desconectar</button>
    <p class="msg" id="msg" hidden></p>
    ${UT.dl([['rI', 'Corriente que circula', '10,0 A'], ['rT', 'Calentamiento del bimetal', '0 %'], ['rE', 'Estado', 'conectado']])}
    <svg class="sch" viewBox="0 0 300 116" aria-label="Esquema: fase L, interruptor Q1, carga y neutro N">
      <text x="2" y="44">L</text><line x1="14" y1="40" x2="60" y2="40"/><circle cx="60" cy="40" r="2.5"/>
      <line id="sQ" x1="60" y1="40" x2="100" y2="40"/><circle cx="100" cy="40" r="2.5"/>
      <text x="58" y="62">Q1 · C16</text><path d="M72 30 h6 v-6 h6 v6 h6" class="thin"/>
      <line x1="100" y1="40" x2="170" y2="40"/><rect x="170" y="28" width="50" height="24"/><text x="178" y="44">Carga</text>
      <line x1="220" y1="40" x2="270" y2="40"/><line x1="270" y1="40" x2="270" y2="92"/><line x1="270" y1="92" x2="14" y2="92"/><text x="2" y="96">N</text>
      <path id="sCC" class="ccl" d="M150 40 V92"/>
      <path id="fN" class="flow fl" d="M14 40 H270 V92 H14"/>
      <path id="fC" class="flow fl" d="M14 40 H150 V92 H14"/>
      <rect class="hit" id="hQ" x="54" y="14" width="54" height="34" rx="5"/><rect class="hit" id="hCC" x="140" y="46" width="22" height="40" rx="4"/>
    </svg>
    <p class="nota-sch">Pulsa Q1 en el esquema para conectarlo o desconectarlo, y la línea vertical para provocar o quitar el cortocircuito.</p>
    <div class="chk"><label><input type="checkbox" id="cCase" checked> Tapa transparente</label></div>`;

  function build(ctx, panel) {
    const { T, V, scene, M, boxR, cyl, tube, curva, espiral, part: P, unpart, spark } = ctx;
    const m = UT.mats(ctx);
    const caseM = M(0xe9e8e3, { roughness: .7 });

    // carcasa (media carcasa trasera + paredes)
    P(boxR(-.75, -.65, 0, 9, -2.4, 2.4, caseM), 'carcasa');
    P(boxR(-.75, .75, 8.8, 9, -2.4, 2.4, caseM), 'carcasa'); P(boxR(-.75, .75, 0, .2, -2.4, 2.4, caseM), 'carcasa');
    P(boxR(-.75, .75, 0, 9, -2.4, -2.2, caseM), 'carcasa');
    P(boxR(-.75, .75, 0, 3.6, 2.2, 2.4, caseM), 'carcasa'); P(boxR(-.75, .75, 5.4, 9, 2.2, 2.4, caseM), 'carcasa');
    P(boxR(-.75, .75, 3.2, 3.6, 2.4, 2.9, caseM), 'carcasa'); P(boxR(-.75, .75, 5.4, 5.8, 2.4, 2.9, caseM), 'carcasa');
    const tapa = UT.caja(ctx, .05, 9, 4.8, V(.78, 4.5, 0), 'tapa');
    UT.carrilDetras(ctx, -3, 3, 4.5, -2.4, m.zinc);
    UT.rotulo(ctx, [['C16', 70], ['230/400 V~', 34], ['6000', 40]], 1.3, 1.1, V(0, 7.0, 2.41), [0, 0, 0], { bg: '#e9e8e3' });

    // bornes
    P(boxR(-.45, .45, 7.5, 8.3, .6, 1.8, m.steel), 'borneL'); UT.tornillo(ctx, 0, 7.9, 2.2, m.steel, m.black, 'borneL');
    P(boxR(-.45, .45, .7, 1.5, .6, 1.8, m.steel), 'borneC'); UT.tornillo(ctx, 0, 1.1, 2.2, m.steel, m.black, 'borneC');
    const cIn = [V(0, 11, 1.2), V(0, 9.2, 1.2), V(0, 8.0, 1.2)], cOut = [V(0, 1.1, 1.2), V(0, -.3, 1.2), V(0, -2, 1.2)];
    P(tube(cIn, .13, m.brown), 'cables'); P(tube(cOut, .13, m.brown), 'cables');

    // bobina magnética y percutor
    P(cyl(.58, .08, m.dark, 0, 6.08, -1), 'bobina'); P(cyl(.58, .08, m.dark, 0, 7.52, -1), 'bobina');
    const wind = P(cyl(.5, 1.36, m.wind, 0, 6.8, -1, null, 36), 'bobina');
    const perc = P(cyl(.17, 2.3, m.iron, 0, 6.75, -1, null, 20), 'percutor');
    const percY = perc.position.y;
    const strip1 = [V(0, 7.7, .6), V(0, 8.05, -.2), V(0, 7.6, -.5)];
    P(tube(strip1, .06, m.copper), 'bobina');
    const strip2 = [V(0, 6.05, -.5), V(0, 5.75, -.4), V(0, 5.5, -.3)];
    P(tube(strip2, .06, m.copper), 'bobina');

    // contacto fijo, guía de arco y cámara de extinción
    P(boxR(-.3, .3, 5.45, 5.55, -.6, .1, m.bronze), 'fijo');
    P(cyl(.15, .1, m.silver, 0, 5.4, -.2, null, 20), 'fijo');
    P(tube([V(0, 5.45, -.4), V(0, 5.2, -1.1), V(0, 4.95, -1.45)], .05, m.steel), 'guia');
    P(tube([V(0, 3.9, .3), V(0, 3.5, -.6), V(0, 3.3, -1.2)], .05, m.steel), 'guia');
    for (let i = 0; i < 7; i++) P(boxR(-.5, .5, 3.25 + i * .26, 3.31 + i * .26, -2.1, -1.0, m.iron), 'camara');
    P(boxR(-.55, -.5, 3.1, 5.0, -2.15, -.95, m.card), 'camara');

    // contacto móvil (brazo que gira)
    const arm = new T.Group(); arm.position.set(0, 4.0, .6); scene.add(arm);
    P(boxR(-.12, .12, 0, 1.45, -.07, .07, m.bronze, arm), 'movil');
    P(cyl(.14, .12, m.silver, 0, 1.47, 0, arm, 20), 'movil');
    { const p = P(cyl(.08, .8, m.steel, 0, 0, 0, arm, 12), 'movil'); p.rotation.z = Math.PI / 2; }

    // bimetal (dos láminas: latón arriba, acero abajo) fijo por abajo
    const bim = new T.Group(); bim.position.set(0, 1.8, 1.5); scene.add(bim);
    const b1 = P(boxR(-.25, .25, 0, 2.2, -.06, 0, M(0xd4a05a, { metalness: .7, roughness: .35, emissive: 0xff3000, emissiveIntensity: 0 }), bim), 'bimetal');
    const b2 = P(boxR(-.25, .25, 0, 2.2, 0, .06, M(0x9aa3ab, { metalness: .7, roughness: .35, emissive: 0xff3000, emissiveIntensity: 0 }), bim), 'bimetal');
    P(tube([V(0, 1.8, 1.5), V(0, 1.6, 1.35), V(0, 1.45, 1.2)], .06, m.copper), 'bimetal');

    // mecanismo de disparo y maneta
    P(boxR(-.35, .35, 4.7, 5.3, .9, 1.9, m.plastic), 'mecanismo');
    const latch = new T.Group(); latch.position.set(0, 4.45, 1.1); scene.add(latch);
    P(boxR(-.2, .2, -.3, .3, -.08, .08, m.dark, latch), 'mecanismo');
    const han = new T.Group(); han.position.set(0, 4.5, 2.2); scene.add(han);
    P(boxR(-.32, .32, -.18, .18, -.3, 1.0, M(0x30353d, { roughness: .6 }), han), 'maneta');
    P(tube([V(0, 4.5, 2.1), V(0, 4.75, 1.7), V(0, 4.9, 1.4)], .04, m.steel), 'mecanismo');

    // corriente
    const fL = ctx.flow({ color: 0xff5a1f, size: .07 });
    const coilPts = espiral(0, -1, .56, 7.45, 6.15, Math.PI / 2, Math.PI / 2 + Math.PI * 14);
    let braid = null, bKey = '';
    const braidPts = () => { const a = arm.localToWorld(V(0, .15, 0)), b = bim.localToWorld(V(0, 2.15, 0)); return [a, V(0, (a.y + b.y) / 2 + .25, (a.z + b.z) / 2), b]; };
    const path = () => [...curva(cIn), ...curva(strip1), ...coilPts, ...curva(strip2), V(0, 5.4, -.2), arm.localToWorld(V(0, 1.47, 0)), arm.localToWorld(V(0, .15, 0)),
      ...curva(braidPts(), 12), bim.localToWorld(V(0, 1.1, 0)), V(0, 1.8, 1.5), V(0, 1.45, 1.2), ...curva(cOut)];

    // panel
    const $ = s => panel.querySelector(s);
    const iL = $('#iL'), iLv = $('#iLv'), ccB = $('#cc'), man = $('#man'), msg = $('#msg');
    const r = { I: $('#rI'), T: $('#rT'), E: $('#rE') }, s = { q: $('#sQ'), cc: $('#sCC'), fN: $('#fN'), fC: $('#fC') };
    let Iset = 10, cc = false, closed = true, trip = '', th = 0, ang = -.55, hAng = -.45, arcT = 0, arcK = 0, sparkT = 0, plT = 0, aviso = '', avisoT = 0;
    const setI = v => { Iset = v; iL.value = v; iLv.textContent = v + ' A'; };
    iL.oninput = () => setI(+iL.value);
    panel.querySelectorAll('[data-i]').forEach(b => b.onclick = () => setI(+b.dataset.i));
    ccB.onclick = () => { cc = !cc; ccB.setAttribute('aria-pressed', cc); };
    $('#cCase').onchange = e => { tapa.visible = e.target.checked; };
    UT.hit(panel, '#hQ', () => man.onclick(), false, 'Interruptor Q1');
    UT.hit(panel, '#hCC', () => ccB.onclick(), false, 'Cortocircuito');
    ctx.accion('maneta', () => man.onclick(), { pista: 'Púlsala en el modelo para subirla (rearmar) o bajarla (desconectar).' });
    function abrir(tipo, I) { closed = false; trip = tipo; arcK = Math.min(1, I / 60); if (I > 0) arcT = tipo === 'magnético' ? .35 : .15; if (tipo === 'magnético') plT = .3; }
    man.onclick = () => {
      if (closed) { abrir('manual', cc ? I_CC : Iset); return; }
      if (th > .8) { aviso = 'Espera: el bimetal todavía está caliente y el mecanismo no deja rearmar.'; avisoT = 2.5; return; }
      closed = true; trip = '';
    };

    return {
      tecla: () => man.onclick(),
      update(dt) {
        const I = closed ? (cc ? I_CC : Iset) : 0;
        // disparo magnético instantáneo; después, modelo térmico (tiempo acelerado)
        if (closed && I >= I_MAG) abrir('magnético', I);
        const tInf = closed ? (I / IN) ** 2 / 1.69 : 0;
        th = Math.min(1.1, th + (tInf - th) * Math.min(1, dt / (closed ? 4 : 6)));
        if (closed && th >= 1) abrir('térmico', I);

        ang += ((closed ? -.55 : -1.2) - ang) * Math.min(1, dt * (closed ? 12 : 28));
        arm.rotation.x = ang; arm.updateMatrixWorld();
        hAng += ((closed ? -.45 : .45) - hAng) * Math.min(1, dt * 14); han.rotation.x = hAng;
        bim.rotation.x = -.26 * Math.min(1.15, th); bim.updateMatrixWorld();
        latch.rotation.x += ((closed ? 0 : .6) - latch.rotation.x) * Math.min(1, dt * 15);
        b1.material.emissiveIntensity = b2.material.emissiveIntensity = Math.min(.6, th * .45);
        wind.material.emissiveIntensity = Math.min(.5, I / I_CC * .5);
        plT = Math.max(0, plT - dt); perc.position.y = percY - (plT > 0 ? .35 : 0);

        // trenza flexible entre brazo y bimetal
        const k = ang.toFixed(3) + th.toFixed(3);
        if (k !== bKey) { bKey = k; if (braid) { unpart(braid); scene.remove(braid); braid.geometry.dispose(); } braid = P(tube(braidPts(), .05, m.braid), 'trenza'); }

        // arco eléctrico empujado hacia la cámara de extinción
        if (arcT > 0) {
          arcT -= dt; sparkT -= dt;
          if (sparkT <= 0) {
            sparkT = .035; const u = Math.random(), a = V(0, 5.35, -.25), b = V(0, 3.9 + Math.random() * .9, -1.2 - Math.random() * .8);
            spark(a.lerp(b, u * (arcK > .5 ? 1 : .5)));
          }
        }

        fL.path(path()).set(closed && I > 0 ? 1 : 0, Math.min(5, .6 + I / 16));

        const st = closed ? (I > IN ? 1 : 0) : trip === 'magnético' ? 2 : 3;
        ctx.step(st);
        avisoT -= dt;
        set(r.I, fmt(I, 1) + ' A', I > IN ? 'on' : '');
        set(r.T, Math.round(Math.min(1, th) * 100) + ' %', th > .7 ? 'on' : '');
        set(r.E, closed ? 'conectado' : trip === 'manual' ? 'desconectado a mano' : 'disparo ' + trip, closed ? 'ok' : trip === 'manual' ? '' : 'on');
        man.textContent = closed ? 'Bajar maneta · desconectar' : 'Subir maneta · rearmar';
        const t = avisoT > 0 ? aviso
          : !closed && trip === 'térmico' ? 'Disparo térmico: el bimetal se ha curvado por la sobrecarga y ha soltado el mecanismo. Hay que esperar a que se enfríe para rearmar.'
          : !closed && trip === 'magnético' ? 'Disparo magnético: la corriente de cortocircuito ha hecho que la bobina lance el percutor al instante. El arco se ha apagado en la cámara de extinción.' + (cc ? ' Quita el cortocircuito antes de rearmar.' : '')
          : closed && I > IN ? `Sobrecarga: pasan más de ${IN} A y el bimetal se va calentando y curvando (tiempo acelerado).` : '';
        set(msg, t); msg.hidden = !t;
        s.q.setAttribute('x2', closed ? 100 : 96); s.q.setAttribute('y2', closed ? 40 : 22);
        s.cc.style.opacity = cc ? 1 : .15;
        s.fN.classList.toggle('live', closed && I > 0 && !cc);
        s.fC.classList.toggle('live', closed && cc);
      },
      labels: [
        { p: 'borneL', txt: 'Borne de entrada', at: () => V(.5, 8.1, 1.2) },
        { p: 'bobina', txt: 'Bobina magnética', at: () => V(.6, 7.0, -1.3), l: 1 },
        { p: 'percutor', at: () => V(.2, 7.9, -1.0) },
        { p: 'fijo', txt: 'Contacto fijo', at: () => V(.3, 5.5, .05) },
        { p: 'movil', txt: 'Contacto móvil', at: () => arm.localToWorld(V(.15, .9, 0)) },
        { p: 'camara', txt: 'Cámara de extinción', at: () => V(.5, 3.6, -1.9), l: 1 },
        { p: 'bimetal', at: () => bim.localToWorld(V(.25, 1.2, .06)) },
        { p: 'mecanismo', txt: 'Mecanismo de disparo', at: () => V(.35, 5.15, 1.5) },
        { p: 'maneta', at: () => han.localToWorld(V(.3, 0, .9)) },
        { p: 'borneC', txt: 'Borne de salida', at: () => V(.5, 1.0, 1.4) },
        { p: 'carril', txt: 'Carril DIN', at: () => V(2.5, 3.0, -2.6), l: 1 }
      ]
    };
  }

  window.COMPONENTES.push({
    id: 'magnetotermico', nombre: 'Magnetotérmico', categoria: 'Protección',
    resumen: 'Disparo térmico por sobrecarga y magnético por cortocircuito.',
    titulo: 'Magnetotérmico: dos protecciones en un mismo aparato',
    lead: 'Sube la corriente por encima de 16 A para ver cómo se calienta el bimetal, o provoca un cortocircuito para ver el disparo magnético y el arco en la cámara de extinción.',
    camara: { pos: [12, 7, 7], tgt: [0, 4.4, 0] }, suelo: -2.1,
    panel: PANEL, build,
    leyenda: [['#ff5a1f', 'Corriente que atraviesa el aparato']],
    pasos: [
      ['1. Funcionamiento normal', 'La corriente entra por arriba, pasa por la bobina, los contactos y el bimetal, y sale por abajo. Con 16 A o menos no ocurre nada.'],
      ['2. Sobrecarga: disparo térmico', 'Con más corriente de la nominal el bimetal se calienta. Sus dos metales se dilatan distinto, se curva y, pasado un tiempo, suelta el mecanismo.'],
      ['3. Cortocircuito: disparo magnético', 'Una corriente muy alta (más de 5 a 10 veces In en curva C) hace que la bobina lance el percutor en milisegundos. El arco se divide y apaga entre las chapas de la cámara de extinción.'],
      ['4. Rearme', 'Con la maneta abajo el circuito queda abierto. Tras un disparo térmico hay que esperar a que el bimetal se enfríe para volver a subirla.']
    ],
    partes: {
      carcasa:   { t: 'Carcasa aislante', d: 'Plástico autoextinguible que aísla las partes con tensión y aguanta la presión del arco en un cortocircuito.' },
      tapa:      { t: 'Tapa transparente', d: 'En este modelo se ha sustituido una cara por un vidrio para ver el interior.' },
      borneL:    { t: 'Borne de entrada', d: 'Borne superior de tornillo donde llega la fase desde la alimentación.' },
      borneC:    { t: 'Borne de salida', d: 'Borne inferior por el que sale la corriente hacia la carga (el circuito protegido).' },
      bobina:    { t: 'Bobina magnética', d: 'Pocas espiras de hilo grueso por las que pasa toda la corriente. Con una corriente de cortocircuito su campo es tan fuerte que lanza el percutor al instante.' },
      percutor:  { t: 'Percutor', d: 'Núcleo de hierro móvil dentro de la bobina. En un cortocircuito golpea el mecanismo y abre los contactos en milisegundos.' },
      fijo:      { t: 'Contacto fijo', d: 'Pastilla de plata unida a la bobina. Junto al contacto móvil forma el punto por donde se abre el circuito.' },
      movil:     { t: 'Contacto móvil', d: 'Brazo que gira al dispararse y se separa del contacto fijo. Al separarse con corriente se forma un arco eléctrico.' },
      guia:      { t: 'Guías de arco', d: 'Láminas metálicas que conducen el arco desde los contactos hacia la cámara de extinción, para que no queme las pastillas.' },
      camara:    { t: 'Cámara de extinción', d: 'Pila de chapas de acero separadas. El arco entra, se divide en muchos arcos pequeños, se enfría y se apaga.' },
      bimetal:   { t: 'Bimetal', d: 'Dos láminas de metales distintos soldadas. Al calentarse por la corriente se dilatan de forma diferente y la pieza se curva: es la protección térmica (sobrecargas).' },
      trenza:    { t: 'Trenza flexible', d: 'Conductor de hilos finos que une el contacto móvil con el bimetal sin impedir que el brazo gire.' },
      mecanismo: { t: 'Mecanismo de disparo', d: 'Cerrojo que mantiene los contactos cerrados. El bimetal o el percutor lo sueltan y un muelle abre el circuito aunque se sujete la maneta (disparo libre).' },
      maneta:    { t: 'Maneta', d: 'Palanca para conectar y desconectar a mano. Tras un disparo baja sola e indica que el circuito está abierto.' },
      carril:    { t: 'Carril DIN', d: 'Perfil de 35 mm donde se engancha el aparato en el cuadro.' },
      cables:    { t: 'Cables', d: 'Fase de entrada (arriba) y salida hacia la carga (abajo).' }
    },
    extra: `
      <div class="two">
        <div>
          <h2>Cómo leer un magnetotérmico</h2>
          <p><b>C16</b>: la letra es la curva de disparo y el número la corriente nominal In. En curva C el disparo magnético actúa entre 5 y 10 veces In (80–160 A para un C16); en curva B entre 3 y 5 In, y en curva D entre 10 y 20 In.</p>
          <p><b>6000</b>: poder de corte en amperios, la corriente de cortocircuito máxima que puede cortar sin romperse.</p>
          <p>La protección térmica es lenta a propósito: deja pasar picos cortos (el arranque de un motor) y corta si la sobrecarga dura. Por debajo de 1,13·In no dispara nunca y a 1,45·In dispara en menos de una hora.</p>
          <p class="note">En la simulación el tiempo térmico está acelerado para poder verlo en segundos.</p>
        </div>
        <div>
          <h2>Magnetotérmico y fusible</h2>
          <table><thead><tr><th></th><th>Magnetotérmico</th></tr></thead><tbody>
            <tr><td>Sobrecarga</td><td>Bimetal (lento)</td></tr>
            <tr><td>Cortocircuito</td><td>Bobina y percutor (instantáneo)</td></tr>
            <tr><td>Tras disparar</td><td>Se rearma subiendo la maneta</td></tr>
            <tr><td>Protege</td><td>Cables e instalación, no personas</td></tr>
          </tbody></table>
          <p class="note">Para proteger a las personas frente a contactos indirectos se usa el interruptor diferencial.</p>
        </div>
      </div>`
  });
})();
