// Componente: pulsador de marcha (NA) y seta de emergencia (NC con enclavamiento) en un panel, con piloto
(() => {
  const { set } = UT;
  const PANEL = `
    <button class="big verde" id="pv" aria-pressed="false">Mantener pulsado MARCHA</button>
    <div class="row"><button class="sm" id="seta" aria-pressed="false">Pulsar la seta</button><button class="sm" id="girar" disabled>Girar la seta para soltarla</button></div>
    <p class="msg" id="msg" hidden></p>
    ${UT.dl([['rS', 'Seta S0 (NC 11–12)', 'cerrado'], ['rP', 'Pulsador S1 (NA 13–14)', 'abierto'], ['rH', 'Piloto H1', 'apagado']])}
    <svg class="sch" viewBox="0 0 300 110" aria-label="Esquema: fase L, seta S0 normalmente cerrada, pulsador S1 normalmente abierto, piloto H1 y neutro N en serie">
      <text x="2" y="44">L</text><line x1="14" y1="40" x2="40" y2="40"/>
      <circle cx="40" cy="40" r="2.5"/><circle cx="72" cy="40" r="2.5"/><line id="sSe" x1="40" y1="40" x2="71" y2="42"/>
      <text x="34" y="64">S0 · 11-12</text><path d="M50 26 h12 M56 26 v8" class="thin"/>
      <line x1="72" y1="40" x2="110" y2="40"/>
      <circle cx="110" cy="40" r="2.5"/><circle cx="142" cy="40" r="2.5"/><line id="sPu" x1="110" y1="40" x2="138" y2="26"/>
      <text x="104" y="64">S1 · 13-14</text>
      <line x1="142" y1="40" x2="190" y2="40"/><circle id="h1" cx="202" cy="40" r="12"/><path d="M193.5 31.5l17 17M210.5 31.5l-17 17"/><text x="194" y="66">H1</text>
      <line x1="214" y1="40" x2="270" y2="40"/><line x1="270" y1="40" x2="270" y2="90"/><line x1="270" y1="90" x2="14" y2="90"/><text x="2" y="94">N</text>
      <path id="fC" class="flow fl" d="M14 40 H270 V90 H14"/>
      <rect class="hit" id="hS0" x="34" y="18" width="44" height="34" rx="5"/><rect class="hit" id="hS1" x="104" y="16" width="44" height="34" rx="5"/>
    </svg>
    <p class="nota-sch">En el esquema: pulsa S0 para accionar o girar la seta y mantén S1 para la marcha.</p>
    <div class="chk"><label><input type="checkbox" id="cPan" checked> Panel transparente</label></div>`;

  function build(ctx, panel) {
    const { T, V, scene, M, boxR, cyl, tube, curva, part: P, spark } = ctx;
    const m = UT.mats(ctx);
    const chapaM = new T.MeshPhysicalMaterial({ color: 0x9aa1a8, metalness: .6, roughness: .4, transparent: true, opacity: .35, depthWrite: false });
    const chapa = P(boxR(-3.6, 3.6, -2.4, 2.8, -.1, 0, chapaM), 'panel'); chapa.renderOrder = 2;
    UT.rotulo(ctx, 'MARCHA', 1.4, .32, V(-1.8, -.75, .01), [0, 0, 0], { color: '#e9e8e3' });
    UT.rotulo(ctx, 'EMERGENCIA', 1.8, .32, V(1.8, -1.05, .01), [0, 0, 0], { color: '#e9e8e3' });
    const zAx = o => { o.rotation.x = Math.PI / 2; return o; };

    // bloque de contactos genérico detrás del panel
    function bloque(cx, cy, tipo, ids, nums) {
      const NA = tipo === 'NA';
      P(boxR(cx - .25, cx + .25, cy - .45, cy + .45, -.9, -.1, m.plastic), ids.cuerpo);          // adaptador
      UT.caja(ctx, 1.6, 1.3, 1.0, V(cx, cy, -1.4), ids.bloque);
      P(boxR(cx - .8, cx + .8, cy - .65, cy - .55, -1.9, -.9, m.dark), ids.bloque);
      const zf = NA ? -1.82 : -1.42;
      for (const sx of [-1, 1]) {
        zAx(P(cyl(.11, .08, m.silver, cx + sx * .4, cy, zf, null, 16), ids.bloque));
        P(tube([V(cx + sx * .4, cy, zf + (NA ? -.04 : .04)), V(cx + sx * .45, cy - .2, -1.86), V(cx + sx * .5, cy - .4, -1.9)], .035, m.bronze), ids.bloque);
        UT.tornillo(ctx, cx + sx * .5, cy - .4, -2.05, m.steel, m.black, 'bornes');
      }
      UT.rotulo(ctx, nums[0], .34, .22, V(cx - .5, cy - .05, -1.91), [0, Math.PI, 0], { color: '#14161a', bg: '#e9e8e3' });
      UT.rotulo(ctx, nums[1], .34, .22, V(cx + .5, cy - .05, -1.91), [0, Math.PI, 0], { color: '#14161a', bg: '#e9e8e3' });
      const g = new T.Group(); scene.add(g);
      zAx(P(cyl(.08, 1.3, m.card, cx, cy, -.85, g, 12), ids.cuerpo));
      P(boxR(cx - .55, cx + .55, cy - .09, cy + .09, -1.58, -1.5, m.bronze, g), ids.puente);
      for (const sx of [-1, 1]) zAx(P(cyl(.11, .08, m.silver, cx + sx * .4, cy, NA ? -1.62 : -1.46, g, 16), ids.puente));
      const sp = UT.muelle(ctx, .12, 6, .02, m.steel, ids.puente);
      return { g, sp, zf, NA, cx, cy };
    }

    // pulsador verde
    zAx(P(cyl(.62, .2, m.steel, -1.8, .4, .1, null, 32), 'pulsador'));
    const bP = bloque(-1.8, .4, 'NA', { cuerpo: 'pulsador', bloque: 'bloqueNA', puente: 'puenteNA' }, ['13', '14']);
    zAx(P(cyl(.42, .35, m.green, -1.8, .4, .35, bP.g, 32), 'pulsador'));
    // seta roja con fondo amarillo
    zAx(P(cyl(1.1, .05, m.yellow, 1.8, .4, .03, null, 40), 'seta'));
    zAx(P(cyl(.5, .2, m.steel, 1.8, .4, .12, null, 28), 'seta'));
    const bS = bloque(1.8, .4, 'NC', { cuerpo: 'seta', bloque: 'bloqueNC', puente: 'puenteNC' }, ['11', '12']);
    const head = new T.Group(); head.position.set(1.8, .4, 0); bS.g.add(head);
    zAx(P(cyl(.28, .45, m.red, 0, 0, .35, head, 20), 'seta'));
    zAx(P(cyl(.85, .25, m.red, 0, 0, .65, head, 40), 'seta'));
    { const c = P(new T.Mesh(new T.SphereGeometry(.85, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), m.red), 'seta'); c.rotation.x = Math.PI / 2; c.position.z = .77; c.scale.set(1, .45, 1); head.add(c); }
    P(boxR(-.08, .08, -.6, .6, .93, 1.0, M(0x8e1b1b), head), 'seta');

    // piloto luminoso
    const lens = zAx(P(cyl(.4, .3, M(0xdff5e1, { emissive: 0x3cff6a, emissiveIntensity: 0, roughness: .3 }), 0, 2.0, .18, null, 28), 'piloto'));
    zAx(P(cyl(.5, .1, m.steel, 0, 2.0, .05, null, 28), 'piloto'));
    zAx(P(cyl(.42, .85, m.plastic, 0, 2.0, -.52, null, 24), 'piloto'));
    const luz = new T.PointLight(0x7dffa0, 0, 4); luz.position.set(0, 2.0, .8); scene.add(luz);
    UT.rotulo(ctx, 'H1', .5, .28, V(0, 2.75, .01), [0, 0, 0], { color: '#e9e8e3' });

    // cableado trasero
    const wL = [V(-3.8, -1.6, -2.2), V(.4, -1.5, -2.3), V(1.3, -.4, -1.98)];
    const w1213 = [V(2.3, -.4, -1.98), V(2.5, -1.2, -2.3), V(-1.0, -1.25, -2.4), V(-2.3, -.4, -1.98)];
    const w14 = [V(-1.3, -.4, -1.98), V(-.9, 1.2, -1.9), V(-.2, 2.0, -.98)];
    const wN = [V(.2, 2.0, -.98), V(1.5, 2.6, -1.6), V(3.8, 2.4, -2.0)];
    P(tube(wL, .07, m.brown), 'cables'); P(tube(w1213, .07, m.black), 'cables'); P(tube(w14, .07, m.black), 'cables'); P(tube(wN, .07, m.blue), 'cables');
    const interno = b => { const { cx, cy, zf } = b; const zb = b.g.position.z + (b.NA ? -1.62 : -1.46);
      return [V(cx - .5, cy - .4, -1.9), V(cx - .4, cy, zf), V(cx - .4, cy, zb), V(cx + .4, cy, zb), V(cx + .4, cy, zf), V(cx + .5, cy - .4, -1.9)]; };
    const fC = ctx.flow({ color: 0xff5a1f, size: .07 });

    const $ = s => panel.querySelector(s);
    const pv = $('#pv'), setaB = $('#seta'), gir = $('#girar'), msg = $('#msg');
    const r = { S: $('#rS'), P: $('#rP'), H: $('#rH') }, s = { se: $('#sSe'), pu: $('#sPu'), h1: $('#h1'), f: $('#fC') };
    let pul = false, enc = false, girT = 0, relT = 9, prevOn = false;
    UT.momentaneo(pv, v => { pul = v; if (!v) relT = 0; });
    setaB.onclick = () => { if (!enc) { enc = true; setaB.setAttribute('aria-pressed', true); } };
    gir.onclick = () => { if (enc && girT <= 0) girT = .6; };
    const setaClic = () => { if (enc) gir.onclick(); else setaB.onclick(); };
    UT.hit(panel, '#hS0', setaClic, false, 'Seta de emergencia S0');
    UT.hit(panel, '#hS1', v => { pul = v; pv.setAttribute('aria-pressed', v); if (!v) relT = 0; }, true, 'Pulsador de marcha S1');
    ctx.accion('pulsador', v => { pul = v; pv.setAttribute('aria-pressed', v); if (!v) relT = 0; }, { mantener: true, pista: 'Mantenlo pulsado en el modelo para dar marcha.' });
    ctx.accion('seta', setaClic, { pista: 'Púlsala en el modelo para accionarla; si está enclavada, al pulsarla se gira y se suelta.' });
    $('#cPan').onchange = e => { chapaM.opacity = e.target.checked ? .35 : 1; chapaM.depthWrite = !e.target.checked; };

    return {
      tecla: () => setaB.onclick(),
      update(dt) {
        relT += dt;
        if (girT > 0) { girT -= dt; head.rotation.z = Math.sin((.6 - girT) / .6 * Math.PI) * .7; if (girT <= 0) { enc = false; head.rotation.z = 0; setaB.setAttribute('aria-pressed', false); } }
        bP.g.position.z += ((pul ? -.24 : 0) - bP.g.position.z) * Math.min(1, dt * 18);
        bS.g.position.z += ((enc ? -.24 : 0) - bS.g.position.z) * Math.min(1, dt * 18);
        [bP, bS].forEach(b => { const zb = b.g.position.z - 1.58; b.sp.unir(V(b.cx, b.cy + .25, zb), V(b.cx, b.cy + .25, -1.88)); });
        const na = bP.g.position.z < -.2, nc = bS.g.position.z > -.04, on = na && nc;
        if (prevOn && !on) spark(V(na ? 2.2 : -1.4, .4, -1.6));
        prevOn = on;
        lens.material.emissiveIntensity = on ? 1.4 : 0; luz.intensity = on ? 1.2 : 0;
        fC.path([...curva(wL), ...interno(bS), ...curva(w1213), ...interno(bP), ...curva(w14), V(-.2, 2.0, -.9), V(0, 2.0, .2), V(.2, 2.0, -.9), ...curva(wN)]).set(on ? 1 : 0, 1.4);

        ctx.step(enc ? 3 : pul ? 1 : relT < 1.5 ? 2 : 0);
        set(r.S, nc ? 'cerrado' : 'abierto (enclavada)', nc ? 'ok' : 'on');
        set(r.P, na ? 'cerrado' : 'abierto', na ? 'ok' : '');
        set(r.H, on ? 'encendido' : 'apagado', on ? 'ok' : '');
        gir.disabled = !enc;
        const t = enc && pul ? 'La seta está enclavada: aunque pulses MARCHA el circuito sigue abierto. La parada de emergencia tiene prioridad.'
          : enc ? 'La seta se queda pulsada (enclavada) hasta que alguien la gira a propósito. Así nadie puede rearmar la máquina sin querer.' : '';
        set(msg, t); msg.hidden = !t;
        s.se.setAttribute('x2', nc ? 71 : 66); s.se.setAttribute('y2', nc ? 42 : 24);
        s.pu.setAttribute('x2', na ? 141 : 138); s.pu.setAttribute('y2', na ? 40 : 26);
        UT.lit(s.h1, on, '#3ccf6e'); s.f.classList.toggle('live', on);
      },
      labels: [
        { p: 'pulsador', txt: 'Pulsador verde (NA)', at: () => V(-2.3, .9, .3), l: 1 },
        { p: 'seta', txt: 'Seta de emergencia (NC)', at: () => V(2.6, 1.1, .7) },
        { p: 'piloto', txt: 'Piloto H1', at: () => V(.45, 2.2, .3) },
        { p: 'bloqueNA', txt: 'Bloque NA 13-14', at: () => V(-2.6, .9, -1.4), l: 1 },
        { p: 'puenteNA', txt: 'Puente', at: () => V(-1.25, .4, -1.55 + bP.g.position.z) },
        { p: 'bloqueNC', txt: 'Bloque NC 11-12', at: () => V(2.6, .9, -1.4) },
        { p: 'puenteNC', txt: 'Puente', at: () => V(2.35, .4, -1.55 + bS.g.position.z) },
        { p: 'panel', txt: 'Chapa del cuadro', at: () => V(-3.6, -2.2, 0), l: 1 },
        { p: 'cables', at: () => V(-3.6, -1.6, -2.2), l: 1 }
      ]
    };
  }

  window.COMPONENTES.push({
    id: 'pulsador', nombre: 'Pulsador y seta de emergencia', categoria: 'Mando y maniobra',
    resumen: 'Contactos NA y NC accionados a mano.',
    titulo: 'Pulsador y seta de emergencia: contactos que se accionan a mano',
    lead: 'Mantén pulsado MARCHA para cerrar el contacto NA y encender el piloto. Pulsa la seta: abre su contacto NC y se queda enclavada hasta que la gires.',
    camara: { pos: [8.5, 4.5, 6], tgt: [0, .4, -.9] }, suelo: -2.6,
    panel: PANEL, build,
    leyenda: [['#ff5a1f', 'Corriente del circuito']],
    pasos: [
      ['1. En reposo', 'La seta (NC) deja pasar la corriente, pero el pulsador de marcha (NA) está abierto: el piloto está apagado.'],
      ['2. Pulsar MARCHA', 'El vástago empuja el puente del bloque NA contra sus contactos fijos: se cierra 13–14 y el piloto se enciende.'],
      ['3. Soltar', 'El muelle devuelve el puente a su sitio y el contacto vuelve a abrirse. Un pulsador no se queda en ninguna posición: solo actúa mientras se pulsa.'],
      ['4. Parada de emergencia', 'Al pulsar la seta, su puente se separa de los contactos fijos (NC abierto) y el mecanismo la deja enclavada. Para soltarla hay que girarla.']
    ],
    partes: {
      panel:    { t: 'Chapa del cuadro', d: 'Puerta o frontal del cuadro eléctrico donde se montan los mandos en taladros de 22 mm.' },
      pulsador: { t: 'Pulsador de marcha', d: 'Cabeza verde con retorno por muelle. El verde se usa para marcha y el rojo para paro.' },
      seta:     { t: 'Seta de emergencia', d: 'Cabeza grande roja sobre fondo amarillo, fácil de golpear. Se enclava al pulsarla y se libera girándola (o con llave).' },
      bloqueNA: { t: 'Bloque de contacto NA (13-14)', d: 'Contactos normalmente abiertos: en reposo el puente está separado de los contactos fijos.' },
      bloqueNC: { t: 'Bloque de contacto NC (11-12)', d: 'Contactos normalmente cerrados: en reposo el muelle aprieta el puente contra los contactos fijos. Las paradas de emergencia siempre usan NC: si se rompe un cable, la máquina se para.' },
      puenteNA: { t: 'Puente móvil y muelle', d: 'Lámina con dos pastillas que une los dos contactos fijos (doble corte). El muelle la devuelve al soltar.' },
      puenteNC: { t: 'Puente móvil y muelle', d: 'En el bloque NC el muelle mantiene el puente cerrado; al pulsar se separa.' },
      piloto:   { t: 'Piloto luminoso H1', d: 'Lámpara de señalización. Indica que el circuito tiene corriente.' },
      bornes:   { t: 'Bornes', d: 'Tornillos donde se conectan los cables en la parte trasera de cada bloque.' },
      cables:   { t: 'Cables', d: 'Marrón: fase. Negro: conexiones entre aparatos. Azul: neutro.' }
    },
    extra: `
      <div class="two">
        <div>
          <h2>NA y NC</h2>
          <p><b>NA (normalmente abierto)</b>: en reposo no deja pasar corriente; se cierra al accionarlo. Se numera acabado en 3–4 (13–14).</p>
          <p><b>NC (normalmente cerrado)</b>: en reposo deja pasar corriente; se abre al accionarlo. Se numera acabado en 1–2 (11–12).</p>
          <p>Los bloques de contactos se encajan detrás del operador y se pueden combinar: un mismo pulsador puede llevar un NA y un NC.</p>
        </div>
        <div>
          <h2>Colores de los mandos</h2>
          <table><tbody>
            <tr><td>Rojo</td><td>Paro y emergencia</td></tr>
            <tr><td>Verde</td><td>Marcha</td></tr>
            <tr><td>Amarillo</td><td>Intervención en condiciones anormales</td></tr>
            <tr><td>Azul</td><td>Rearme</td></tr>
          </tbody></table>
        </div>
      </div>`
  });
})();
