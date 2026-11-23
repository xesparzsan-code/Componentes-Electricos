// Componente: final de carrera de palanca con rodillo y microrruptor de acción brusca (C / NC / NA)
(() => {
  const { set, fmt } = UT;
  const PIV = [2.9, 3.75], ROD = [1.4, 1.55];
  const L = Math.hypot(ROD[0] - PIV[0], ROD[1] - PIV[1]), PHI0 = Math.atan2(ROD[1] - PIV[1], ROD[0] - PIV[0]);
  const ON = .2, OFF = .12;   // ángulos de accionamiento y de reposición (histéresis)

  const PANEL = `
    <div class="row" id="modo"><button class="sm" data-v="auto" aria-pressed="true">Automático (motor)</button><button class="sm" data-v="man" aria-pressed="false">Manual</button></div>
    <label class="sp" id="posL"><span>Posición del carro</span><input type="range" id="pos" min="-4" max="1.2" step="0.02" value="-3"><b id="posV"></b></label>
    <p class="msg" id="msg" hidden></p>
    ${UT.dl([['rX', 'Posición del carro', ''], ['rG', 'Giro de la palanca', '0°'], ['rNC', 'Contacto C–NC', 'cerrado'], ['rNA', 'Contacto C–NA', 'abierto'], ['rM', 'Motor del carro', 'avanzando']])}
    <svg class="sch" viewBox="0 0 300 116" aria-label="Esquema: el común del final de carrera SQ1 alimenta el motor por el contacto NC y el piloto H1 por el contacto NA">
      <text x="2" y="34">L</text><line x1="14" y1="30" x2="60" y2="30"/><circle cx="60" cy="30" r="2.5" class="fill"/>
      <circle cx="100" cy="18" r="2.5"/><circle cx="100" cy="42" r="2.5"/><line id="sB" x1="60" y1="30" x2="98" y2="19"/>
      <text x="46" y="60">SQ1</text><text x="104" y="12">NC</text><text x="104" y="56">NA</text>
      <line x1="102" y1="18" x2="182" y2="18"/><circle id="sMo" cx="194" cy="18" r="11"/><text x="190" y="22">M</text><line x1="205" y1="18" x2="270" y2="18"/>
      <line x1="102" y1="42" x2="182" y2="42"/><circle id="h1" cx="194" cy="42" r="11"/><path d="M186 34l16 16M202 34l-16 16"/><line x1="205" y1="42" x2="270" y2="42"/>
      <line x1="270" y1="18" x2="270" y2="98"/><line x1="270" y1="98" x2="14" y2="98"/><text x="2" y="102">N</text><text x="212" y="66">H1</text>
      <path id="fNC" class="flow fl" d="M14 30 H60 L100 18 H270 V98 H14"/><path id="fNA" class="flow fl" d="M14 30 H60 L100 42 H270 V98 H14"/>
      <rect class="hit" id="hSQ" x="50" y="10" width="56" height="42" rx="5"/><rect class="hit" id="hM" x="180" y="4" width="28" height="28" rx="14"/>
    </svg>
    <p class="nota-sch">En el esquema: mantén SQ1 para accionarlo a mano y pulsa M para desconectar o conectar el motor.</p>`;

  function build(ctx, panel) {
    const { T, V, scene, M, boxR, cyl, tube, curva, part: P, spark } = ctx;
    const m = UT.mats(ctx);
    const zAx = o => { o.rotation.x = Math.PI / 2; return o; };

    // bancada, guía, motor y husillo
    P(boxR(-6.2, 4.4, -.4, 0, -1.5, 1.5, M(0x6b737b, { metalness: .4, roughness: .5 })), 'bancada');
    P(boxR(-4.8, 2.0, 0, .25, -.3, .3, m.steel), 'bancada');
    { const c = P(cyl(.55, 1.2, M(0x4f6d8a, { metalness: .4, roughness: .45 }), -5.4, .7, 0, null, 28), 'motor'); c.rotation.z = Math.PI / 2; }
    const hus = new T.Group(); hus.position.set(-4.8, .7, 0); scene.add(hus);
    { const r = P(cyl(.08, 6.6, m.steel, 3.3, 0, 0, hus, 12), 'motor'); r.rotation.z = Math.PI / 2;
      for (let i = 0; i < 22; i++) { const k = P(boxR(-.02, .02, -.1, .1, -.02, .02, m.iron, hus), 'motor'); k.position.x = .3 + i * .3; k.rotation.x = i * .9; } }

    // carro con leva
    const carro = new T.Group(); scene.add(carro);
    P(boxR(-.8, .8, .25, 1.2, -.7, .7, M(0x3b6ea5, { roughness: .5 }), carro), 'carro');
    { const sh = new T.Shape(); sh.moveTo(-.8, 1.2); sh.lineTo(-.4, 2.0); sh.lineTo(.4, 2.0); sh.lineTo(.8, 1.2); sh.lineTo(-.8, 1.2);
      const g = new T.ExtrudeGeometry(sh, { depth: .4, bevelEnabled: false }); g.translate(0, 0, -.2);
      P(ctx.add(new T.Mesh(g, m.yellow), carro), 'leva'); }

    // cuerpo del final de carrera
    const caja = M(0x8c9399, { metalness: .55, roughness: .4 });
    P(boxR(2.3, 3.5, 0, .4, -.6, .6, m.dark), 'cuerpo');
    P(boxR(2.2, 3.6, .4, 3.4, -.6, -.5, caja), 'cuerpo');
    P(boxR(2.2, 2.3, .4, 3.4, -.5, .6, caja), 'cuerpo'); P(boxR(3.5, 3.6, .4, 3.4, -.5, .6, caja), 'cuerpo');
    P(boxR(2.2, 3.6, 3.3, 3.4, -.5, .6, caja), 'cuerpo'); P(boxR(2.2, 3.6, .4, .5, -.5, .6, caja), 'cuerpo');
    const tapa = UT.caja(ctx, 1.4, 3.0, .03, V(2.9, 1.9, .61), 'tapa');
    zAx(P(cyl(.42, 1.0, caja, 2.9, 3.75, 0, null, 28), 'cabeza'));
    { const g = P(cyl(.22, .5, m.dark, 3.85, .9, 0, null, 18), 'prensa'); g.rotation.z = Math.PI / 2; }

    // palanca con rodillo
    const pal = new T.Group(); pal.position.set(PIV[0], PIV[1], .55); scene.add(pal);
    P(boxR(0, L, -.07, .07, -.05, .05, m.steel, pal), 'palanca');
    zAx(P(cyl(.12, .2, m.steel, 0, 0, 0, pal, 16), 'palanca'));
    zAx(P(cyl(.25, .22, M(0x222428, { roughness: .6 }), L, 0, 0, pal, 24), 'rodillo'));

    // microrruptor de acción brusca
    const pl = P(cyl(.06, .8, m.steel, 2.9, 2.9, .2, null, 12), 'microrruptor'); const plY = pl.position.y;
    const hoja = new T.Group(); hoja.position.set(2.45, 2.0, .2); scene.add(hoja);
    P(boxR(0, .78, -.025, .025, -.12, .12, m.bronze, hoja), 'microrruptor');
    P(cyl(.08, .09, m.silver, .75, 0, 0, hoja, 14), 'microrruptor');
    P(cyl(.08, .08, m.silver, 3.2, 2.24, .2, null, 14), 'contactos'); P(cyl(.08, .08, m.silver, 3.2, 1.76, .2, null, 14), 'contactos');
    P(boxR(3.15, 3.45, 2.28, 2.33, .08, .32, m.bronze), 'contactos'); P(boxR(3.15, 3.45, 1.67, 1.72, .08, .32, m.bronze), 'contactos');
    P(boxR(3.38, 3.45, .5, 2.33, .08, .32, m.bronze), 'contactos'); P(boxR(3.28, 3.35, .5, 1.72, .08, .32, m.bronze), 'contactos');
    P(boxR(2.4, 2.5, .5, 2.0, .08, .32, m.bronze), 'microrruptor');
    const sp = UT.muelle(ctx, .07, 5, .015, m.steel, 'microrruptor');
    for (const [x, t] of [[2.45, 'C'], [3.31, 'NA'], [3.41, 'NC']]) UT.rotulo(ctx, t, .24, .16, V(x, .62, .34), [0, 0, 0], { color: '#14161a', bg: '#e9e8e3', size: 70 });

    // cables y cargas
    const wIn = [V(6.2, .2, .9), V(4.6, .6, .6), V(3.7, .9, .2), V(2.45, .55, .2)];
    const wNC = [V(3.41, .55, .2), V(3.9, .75, -.3), V(2.0, .3, -1.2), V(-4.5, .3, -1.2), V(-5.4, .7, -.6)];
    const wNA = [V(3.31, .55, .2), V(3.95, .8, .5), V(4.8, .35, .8)];
    P(tube(wIn, .07, m.brown), 'cables'); P(tube(wNC, .07, m.black), 'cables'); P(tube(wNA, .07, m.grey), 'cables');
    const lamp = UT.bombilla(ctx, V(4.8, 0, .8), 'piloto', .6);
    const fC = ctx.flow({ color: 0xff5a1f, size: .06, gap: .26 });

    const $ = s => panel.querySelector(s);
    const pos = $('#pos'), posV = $('#posV'), posL = $('#posL'), msg = $('#msg');
    const r = { X: $('#rX'), G: $('#rG'), NC: $('#rNC'), NA: $('#rNA'), M: $('#rM') }, s = { b: $('#sB'), mo: $('#sMo'), h1: $('#h1'), fNC: $('#fNC'), fNA: $('#fNA') };
    let mano = false, motorSi = true, modo = 'auto', c = -3, fase = 'avance', espera = 0, phi = PHI0, act = false, yR = ROD[1], bAng = .18, prevAct = false;
    UT.opciones($('#modo'), v => { modo = v; posL.style.opacity = v === 'man' ? 1 : .5; pos.disabled = v !== 'man'; pos.value = c; });
    pos.disabled = true; posL.style.opacity = .5;
    pos.oninput = () => { c = +pos.value; };
    const manoF = v => { mano = v; };
    UT.hit(panel, '#hSQ', manoF, true, 'Final de carrera SQ1');
    UT.hit(panel, '#hM', () => { motorSi = !motorSi; }, false, 'Motor M');
    ['palanca', 'rodillo', 'cabeza'].forEach(id => ctx.accion(id, manoF, { mantener: true, pista: 'Mantenla pulsada en el modelo para accionar el final de carrera a mano.' }));
    ctx.accion('motor', () => { motorSi = !motorSi; }, { pista: 'Púlsalo en el modelo para desconectarlo o volver a conectarlo.' });
    const alturaLeva = u => { const a = Math.abs(u); return a < .4 ? 2.0 : a < .8 ? 2.0 - (a - .4) * 2 : a < .8 ? 1.2 : 0; };

    return {
      update(dt) {
        const motorOn = !act && motorSi;   // el motor se alimenta a través del contacto NC
        if (modo === 'auto') {
          if (fase === 'avance') { if (motorOn) c += dt * 1.1; else if (act) { fase = 'fin'; espera = 1.6; } }
          else if (fase === 'fin') { espera -= dt; if (espera <= 0) fase = 'retroceso'; }
          else { c -= dt * 1.6; if (c <= -3.6) fase = 'avance'; }
          c = Math.min(1.2, c);
        } else fase = 'man';
        carro.position.x = c;
        hus.rotation.x += (modo === 'auto' && fase === 'avance' && motorOn ? 8 : fase === 'retroceso' ? -11 : 0) * dt;

        // la leva levanta el rodillo; la palanca gira alrededor de su eje
        const xr = pal.localToWorld(V(L, 0, 0)).x;
        const yT = Math.max(ROD[1], alturaLeva(xr - c) + .25, mano ? 2.3 : 0);
        yR += (yT - yR) * Math.min(1, dt * 20);
        phi = -Math.PI - Math.asin(Math.max(-1, Math.min(1, (yR - PIV[1]) / L)));
        pal.rotation.z = phi; pal.updateMatrixWorld();
        const giro = Math.abs(phi - PHI0);
        if (!act && giro > ON) act = true; if (act && giro < OFF) act = false;
        if (prevAct !== act) spark(V(3.2, act ? 2.2 : 1.8, .2));
        prevAct = act;
        pl.position.y = plY - Math.min(.3, giro * .8);
        bAng += ((act ? -.18 : .18) - bAng) * Math.min(1, dt * 40); hoja.rotation.z = bAng; hoja.updateMatrixWorld();
        sp.unir(V(2.9, pl.position.y - .4, .2), hoja.localToWorld(V(.45, 0, 0)));
        lamp.setLuz(act ? 1 : 0);

        const punta = hoja.localToWorld(V(.75, 0, 0));
        const com = [...curva(wIn), V(2.45, 2.0, .2), punta];
        fC.path(act ? [...com, V(3.2, 1.76, .2), V(3.31, 1.7, .2), V(3.31, .55, .2), ...curva(wNA)] : [...com, V(3.2, 2.24, .2), V(3.41, 2.3, .2), V(3.41, .55, .2), ...curva(wNC)]).set(act || motorSi ? 1 : 0, 1.3);

        ctx.step(act ? 2 : fase === 'retroceso' && giro > .01 ? 3 : giro > .01 ? 1 : 0);
        const mm = Math.round((c + 4) * 50) + ' mm';
        set(r.X, mm); set(posV, mm); set(r.G, Math.round(giro * 180 / Math.PI) + '°');
        set(r.NC, act ? 'abierto' : 'cerrado', act ? '' : 'ok'); set(r.NA, act ? 'cerrado' : 'abierto', act ? 'ok' : '');
        set(r.M, modo !== 'auto' ? (act ? 'sin alimentación' : 'alimentado') : fase === 'avance' ? (motorSi ? 'avanzando' : 'desconectado') : fase === 'retroceso' ? 'retrocediendo' : 'parado por el final de carrera', fase === 'fin' ? 'on' : '');
        const t = act ? `La palanca ha girado más de ${Math.round(ON * 180 / Math.PI)}°: el microrruptor ha cambiado de golpe. El NC corta el motor y el NA enciende el piloto.`
          : giro > .01 ? `La leva empuja el rodillo, pero el microrruptor no cambia hasta los ${Math.round(ON * 180 / Math.PI)}° y no vuelve hasta bajar de ${Math.round(OFF * 180 / Math.PI)}° (histéresis).` : '';
        set(msg, t); msg.hidden = !t;
        s.b.setAttribute('y2', act ? 41 : 19);
        UT.lit(s.h1, act, '#3ccf6e'); s.mo.style.fill = !act && motorSi ? 'rgba(255,90,31,.25)' : 'none'; s.mo.style.strokeDasharray = motorSi ? '' : '3 3';
        s.fNC.classList.toggle('live', !act && motorSi); s.fNA.classList.toggle('live', act);
      },
      labels: [
        { p: 'rodillo', at: () => pal.localToWorld(V(L, .25, .1)), l: 1 },
        { p: 'palanca', at: () => pal.localToWorld(V(L * .45, .1, .05)), l: 1 },
        { p: 'cabeza', at: () => V(3.3, 4.1, 0) },
        { p: 'microrruptor', txt: 'Microrruptor', at: () => V(2.7, 2.1, .3), l: 1 },
        { p: 'contactos', txt: 'Contactos NC / NA', at: () => V(3.45, 2.0, .3) },
        { p: 'prensa', txt: 'Prensaestopas', at: () => V(4.1, .9, .2) },
        { p: 'leva', at: () => carro.localToWorld(V(-.5, 1.7, .2)), l: 1 },
        { p: 'carro', at: () => carro.localToWorld(V(-.8, .6, .7)), l: 1 },
        { p: 'motor', txt: 'Motor y husillo', at: () => V(-5.4, 1.3, 0) },
        { p: 'piloto', txt: 'Piloto H1', at: () => V(5.1, .6, .8) }
      ]
    };
  }

  window.COMPONENTES.push({
    id: 'final-carrera', nombre: 'Final de carrera', categoria: 'Sensores', grupo: 'Detectores mecánicos',
    resumen: 'Detecta posición por contacto mecánico.',
    titulo: 'Final de carrera: la máquina se entera de dónde está',
    lead: 'El carro avanza hasta que su leva empuja el rodillo. Mira cómo el microrruptor cambia de golpe, corta el motor por el contacto NC y enciende el piloto por el NA.',
    camara: { pos: [3.5, 6, 14.5], tgt: [-.2, 1.5, 0] }, suelo: -.42,
    panel: PANEL, build,
    leyenda: [['#ff5a1f', 'Corriente por el final de carrera']],
    pasos: [
      ['1. Libre', 'La leva está lejos y la palanca en reposo. El común C toca el NC: el motor recibe corriente y el carro avanza.'],
      ['2. La leva empuja', 'La rampa de la leva levanta el rodillo y la palanca gira. El vástago baja y carga el muelle del microrruptor, pero los contactos todavía no cambian.'],
      ['3. Cambio brusco', 'Al pasar el punto de accionamiento el muelle hace saltar la lámina de golpe: abre C–NC (el motor se para) y cierra C–NA (se enciende el piloto).'],
      ['4. Reposición', 'Al alejarse el carro la palanca vuelve con su muelle. Los contactos no regresan hasta un ángulo algo menor (histéresis), así no tiemblan en el límite.']
    ],
    partes: {
      bancada:      { t: 'Bancada y guía', d: 'Base de la máquina por la que se desliza el carro.' },
      motor:        { t: 'Motor y husillo', d: 'El motor hace girar el husillo, que empuja el carro. Se alimenta a través del contacto NC del final de carrera.' },
      carro:        { t: 'Carro', d: 'Parte móvil de la máquina cuya posición se quiere detectar.' },
      leva:         { t: 'Leva', d: 'Rampa fijada al carro. Al pasar bajo el rodillo lo levanta poco a poco.' },
      rodillo:      { t: 'Rodillo', d: 'Rueda que rueda sobre la leva, así el accionamiento es suave y no se desgasta.' },
      palanca:      { t: 'Palanca', d: 'Brazo que transmite el movimiento del rodillo a la cabeza. Su longitud y posición se pueden ajustar.' },
      cabeza:       { t: 'Cabeza giratoria', d: 'Convierte el giro de la palanca en el desplazamiento del vástago. Tiene un muelle que devuelve la palanca.' },
      cuerpo:       { t: 'Cuerpo', d: 'Caja metálica estanca (IP65 o más) que protege el interruptor de aceite, polvo y golpes.' },
      tapa:         { t: 'Tapa', d: 'Aquí transparente para ver el interior.' },
      microrruptor: { t: 'Microrruptor de acción brusca', d: 'Lámina con un muelle que la hace saltar de golpe de una posición a otra. Así la conmutación es rápida aunque el carro se mueva despacio.' },
      contactos:    { t: 'Contactos NC y NA', d: 'El común C toca arriba el NC en reposo y abajo el NA cuando se acciona.' },
      prensa:       { t: 'Prensaestopas', d: 'Entrada del cable que mantiene la estanqueidad.' },
      piloto:       { t: 'Piloto H1', d: 'Se enciende a través del NA para indicar que el carro ha llegado.' },
      cables:       { t: 'Cables', d: 'Marrón: llegada al común. Negro: salida NC al motor. Gris: salida NA al piloto.' }
    },
    extra: `
      <div class="two">
        <div>
          <h2>Dónde se usan</h2>
          <p>En puertas automáticas, ascensores, cintas transportadoras, prensas y en cualquier eje que no debe pasar de un punto. Suelen ir en pareja: uno para detectar la posición de trabajo y otro de seguridad, más allá, que corta si el primero falla.</p>
          <p>Para seguridad se usa el contacto <b>NC</b>: si se rompe un cable, el circuito se abre y la máquina se para, igual que si se hubiera accionado.</p>
          <p class="note">En una máquina real el retroceso del carro lo manda otro circuito; aquí se automatiza para repetir el ciclo.</p>
        </div>
        <div>
          <h2>Final de carrera o sensor sin contacto</h2>
          <table><tbody>
            <tr><td>Final de carrera</td><td>Necesita contacto físico, robusto, barato, maneja corrientes de mando directamente</td></tr>
            <tr><td>Inductivo / capacitivo</td><td>Sin contacto ni desgaste, más rápido, necesita alimentación</td></tr>
          </tbody></table>
        </div>
      </div>`
  });
})();
