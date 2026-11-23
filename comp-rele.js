// Componente: relé electromecánico. Dos modelos (didáctico e industrial) que comparten la misma
// simulación eléctrica: interruptor S1, tensión de bobina ajustable, umbrales de cierre y apertura,
// corriente de mando y de carga animadas, campo magnético y chispa al abrir los contactos.
(() => {
  const UN = 24, R_BOB = 1150, V_CIERRE = .8 * UN, V_APERTURA = .1 * UN, I_CARGA = .21;
  const fmt = (x, d) => x.toFixed(d).replace('.', ',');

  const PANEL = `
    <button class="big" id="s1" aria-pressed="false">Cerrar S1 · alimentar la bobina</button>
    <label class="sp"><span>Tensión de bobina</span><input type="range" id="volt" min="0" max="30" step="0.5" value="24"><b id="voltV">24,0 V</b></label>
    <p class="tip">Nominal 24 V DC · cierra con ≥ ${fmt(V_CIERRE, 1)} V · suelta con ≤ ${fmt(V_APERTURA, 1)} V</p>
    <div class="row"><button class="sm" id="auto" aria-pressed="false">Ciclo automático</button><button class="sm" id="test" aria-pressed="false" hidden>Pulsador de prueba</button></div>
    <p class="msg" id="msg" hidden></p>
    <dl class="st">
      <dt>Tensión en A1–A2</dt><dd id="rV">0,0 V</dd>
      <dt>Corriente de bobina</dt><dd id="rI">0,0 mA</dd>
      <dt>Armadura</dt><dd id="rA">en reposo</dd>
      <dt>Contacto 11–12 (NC)</dt><dd id="rNC" class="ok">cerrado</dd>
      <dt>Contacto 11–14 (NA)</dt><dd id="rNO">abierto</dd>
      <dt>Corriente de carga</dt><dd id="rIL">0,21 A</dd>
    </dl>
    <svg class="sch" viewBox="0 0 300 206" aria-label="Esquema: circuito de mando con S1 y bobina K1; circuito de potencia con el contacto conmutado de K1 y dos lámparas">
      <text x="6" y="12">Mando</text><text x="122" y="12">Potencia</text>
      <text x="40" y="28">+V</text>
      <line x1="30" y1="22" x2="30" y2="50"/><circle cx="30" cy="50" r="2.5"/>
      <line id="sS1" x1="30" y1="80" x2="16" y2="52"/><circle cx="30" cy="80" r="2.5"/><text x="38" y="70">S1</text>
      <line x1="30" y1="80" x2="30" y2="104"/>
      <rect id="sCoil" x="18" y="104" width="24" height="40"/><text x="46" y="144">K1</text>
      <text x="36" y="100">A1</text><text x="36" y="158">A2</text>
      <line x1="30" y1="144" x2="30" y2="186"/><text x="18" y="200">0 V</text>
      <path id="sLnk" class="lnk" d="M42 124 H150 V90"/>
      <text x="146" y="28">+24 V</text>
      <line x1="140" y1="22" x2="140" y2="96"/><circle cx="140" cy="96" r="2.5" style="fill:var(--ink)"/><text x="124" y="110">11</text>
      <line id="sKB" x1="140" y1="96" x2="174" y2="78"/>
      <circle cx="177" cy="76" r="2.5"/><text x="170" y="68">12</text>
      <circle cx="177" cy="116" r="2.5"/><text x="170" y="132">14</text>
      <line x1="180" y1="76" x2="216" y2="76"/><line x1="180" y1="116" x2="216" y2="116"/>
      <circle id="h1" cx="228" cy="76" r="12"/><path d="M219.5 67.5l17 17M236.5 67.5l-17 17"/>
      <circle id="h2" cx="228" cy="116" r="12"/><path d="M219.5 107.5l17 17M236.5 107.5l-17 17"/>
      <text x="212" y="56">H1 (NC)</text><text x="212" y="144">H2 (NA)</text>
      <line x1="240" y1="76" x2="276" y2="76"/><line x1="240" y1="116" x2="276" y2="116"/>
      <line x1="276" y1="76" x2="276" y2="186"/><text x="264" y="200">0 V</text>
      <path id="fM" class="flow fm" d="M30 22 V50 M30 80 V186"/>
      <rect class="hit" id="hS1" x="6" y="44" width="46" height="42" rx="5"/>
      <path id="fNC" class="flow fl" d="M140 22 V96 L177 76 H276 V186"/>
      <path id="fNO" class="flow fl" d="M140 22 V96 L177 116 H276 V186"/>
    </svg>
    <p class="nota-sch">Pulsa S1 en el esquema para abrirlo o cerrarlo.</p>
    <div class="chk">
      <label><input type="checkbox" id="cFlow" checked> Ver la corriente</label>
      <label><input type="checkbox" id="cField" checked> Campo magnético</label>
      <label><input type="checkbox" id="cCase"> <span id="cCaseT">Carcasa</span></label>
    </div>`;

  // ---------- simulación común ----------
  // m: { OFF, ON, setAngle(a), coil (material), paths() -> {mando, nc, no}, field: [polilíneas],
  //      contacto: {nc(), no()}, setCase(b), caseLabel, caseOn, led?(on), test?, testY? }
  function sim(ctx, panel, m) {
    const $ = s => panel.querySelector(s);
    const btn = $('#s1'), volt = $('#volt'), voltV = $('#voltV'), testB = $('#test'), autoB = $('#auto'), msg = $('#msg');
    const cFlow = $('#cFlow'), cField = $('#cField'), cCase = $('#cCase');
    const r = { V: $('#rV'), I: $('#rI'), A: $('#rA'), NC: $('#rNC'), NO: $('#rNO'), IL: $('#rIL') };
    const s = { s1: $('#sS1'), kb: $('#sKB'), lnk: $('#sLnk'), coil: $('#sCoil'), fM: $('#fM'), fNC: $('#fNC'), fNO: $('#fNO'), h1: $('#h1'), h2: $('#h2') };
    $('#cCaseT').textContent = m.caseLabel; cCase.checked = !!m.caseOn; m.setCase(cCase.checked);
    cCase.onchange = () => m.setCase(cCase.checked);
    testB.hidden = !m.test;

    let s1 = false, V = UN, veff = 0, closed = false, test = false, auto = false, autoT = 0, relT = 9, ang = m.OFF, pNC = true, pNO = false, key = '';
    const setS1 = v => { s1 = v; btn.setAttribute('aria-pressed', v); btn.textContent = v ? 'Abrir S1 · cortar la bobina' : 'Cerrar S1 · alimentar la bobina'; };
    btn.onclick = () => setS1(!s1);
    volt.oninput = () => { V = +volt.value; voltV.textContent = fmt(V, 1) + ' V'; };
    autoB.onclick = () => { auto = !auto; autoB.setAttribute('aria-pressed', auto); autoT = 0; };
    const setTest = v => { test = v; testB.setAttribute('aria-pressed', test); };
    testB.onclick = () => setTest(!test);
    UT.hit(panel, '#hS1', () => setS1(!s1), false, 'Interruptor S1');

    const fM = ctx.flow({ color: 0xffc400 }), fL = ctx.flow({ color: 0xff5a1f, size: .06 });
    const fF = m.field.map(p => ctx.flow({ color: 0x2f8cff, gap: .24, size: .045 }).path(p));
    const lit = (el, on, col) => { el.style.fill = on ? col : 'none'; el.style.filter = on ? `drop-shadow(0 0 6px ${col})` : 'none'; };

    return {
      tecla: () => setS1(!s1),
      s1: () => setS1(!s1),
      prueba: () => setTest(!test),
      mano: v => setTest(v),
      update(dt) {
        if (auto) { autoT += dt; if (autoT > 2.2) { autoT = 0; setS1(!s1); } }
        const vb = s1 ? V : 0;
        veff += (vb - veff) * Math.min(1, dt * 8);              // el flujo magnético tarda un poco en crecer
        if (!closed && vb >= V_CIERRE && veff >= V_CIERRE - .1) closed = true;
        if (closed && veff <= V_APERTURA) { closed = false; relT = 0; }
        relT += dt;
        const tgt = (closed || test) ? m.ON : m.OFF;
        ang += (tgt - ang) * Math.min(1, dt * (tgt === m.ON ? 14 : 10));
        m.setAngle(ang);
        const p = (ang - m.OFF) / (m.ON - m.OFF), nc = p < .05, no = p > .95;
        if (pNC && !nc) ctx.spark(m.contacto.nc());
        if (pNO && !no) ctx.spark(m.contacto.no());
        pNC = nc; pNO = no;

        m.coil.emissiveIntensity = vb / UN * .3;
        if (m.led) m.led(vb >= 1);
        if (m.test) m.test.position.y = m.testY - (test ? .07 : 0);

        const P = m.paths(), ver = cFlow.checked;
        fM.path(P.mando).set(ver && vb > 0 ? 1 : 0, .5 + 1.6 * vb / UN);
        fL.path(no ? P.no : P.nc).set(ver && (nc || no) ? 1 : 0, 1.6);
        fF.forEach(f => f.set(cField.checked ? Math.min(1, veff / UN) : 0, .9));

        ctx.step(no && (closed || test) ? 2 : vb > 0 ? 1 : relT < 1.6 ? 3 : 0);

        const k = [s1, vb, closed, test, nc, no, Math.round(veff), Math.round(p * 20), ver].join();
        if (k === key) return; key = k;
        r.V.textContent = fmt(vb, 1) + ' V'; r.V.className = vb > 0 ? 'on' : '';
        r.I.textContent = fmt(vb / R_BOB * 1000, 1) + ' mA';
        r.A.textContent = p > .95 ? (closed ? 'atraída' : 'accionada a mano') : p < .05 ? 'en reposo' : 'moviéndose';
        r.NC.textContent = nc ? 'cerrado' : 'abierto'; r.NC.className = nc ? 'ok' : '';
        r.NO.textContent = no ? 'cerrado' : 'abierto'; r.NO.className = no ? 'ok' : '';
        r.IL.textContent = (nc || no) ? fmt(I_CARGA, 2) + ' A' : '0 A';
        const t = vb > 0 && !closed && vb < V_CIERRE ? `Tensión insuficiente: la bobina no tiene fuerza para atraer la armadura (necesita ≥ ${fmt(V_CIERRE, 1)} V).`
          : closed && vb > V_APERTURA && vb < V_CIERRE ? `La armadura sigue pegada: con el entrehierro cerrado basta mucha menos fuerza para mantenerla. Suelta por debajo de ${fmt(V_APERTURA, 1)} V.`
          : test && !closed ? 'Contactos accionados con el pulsador de prueba: la bobina no recibe corriente.' : '';
        msg.textContent = t; msg.hidden = !t;

        s.s1.setAttribute('x2', s1 ? 30 : 16); s.s1.setAttribute('y2', s1 ? 52 : 52);
        const y2 = 78 + 36 * p;
        s.kb.setAttribute('y2', y2.toFixed(1));
        s.lnk.setAttribute('d', `M42 124 H150 V${(96 + (y2 - 96) * 10 / 34).toFixed(1)}`);
        s.coil.style.fill = vb > 0 ? 'rgba(255,196,0,.35)' : 'none';
        s.fM.classList.toggle('live', ver && vb > 0);
        s.fNC.classList.toggle('live', ver && nc);
        s.fNO.classList.toggle('live', ver && no);
        lit(s.h1, nc, '#ff9f1c'); lit(s.h2, no, '#3ccf6e');
      }
    };
  }

  // ---------- materiales comunes ----------
  function materiales(ctx) {
    const { T, M } = ctx;
    const mat = {
      base: M(0x2b2f36, { roughness: .8 }), iron: M(0x8a929c, { metalness: .7, roughness: .35 }), dark: M(0x1d1f24, { roughness: .7 }),
      bronze: M(0xc7924a, { metalness: .8, roughness: .3 }), silver: M(0xe6e8ec, { metalness: .9, roughness: .2 }),
      card: M(0xe8d9b5, { roughness: .8 }), copper: M(0xb8642e, { metalness: .6, roughness: .4 }), steel: M(0xb9c0c8, { metalness: .8, roughness: .25 }),
      braid: M(0xd9a35f, { metalness: .7, roughness: .45 })
    };
    const c = document.createElement('canvas'); c.width = 16; c.height = 128; const g = c.getContext('2d');
    for (let i = 0; i < 32; i++) { g.fillStyle = i % 2 ? '#c97436' : '#9a4f22'; g.fillRect(0, i * 4, 16, 4); }
    const tx = new T.CanvasTexture(c); tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.repeat.set(1, 3); tx.encoding = T.sRGBEncoding;
    mat.wind = M(0xffffff, { map: tx, metalness: .5, roughness: .35, emissive: 0xff3a00, emissiveIntensity: 0 });
    return mat;
  }
  class Helix extends THREE.Curve {
    constructor(r, vueltas) { super(); this.r = r; this.v = vueltas; }
    getPoint(t, o = new THREE.Vector3()) { const a = t * Math.PI * 2 * this.v; return o.set(Math.cos(a) * this.r, t, Math.sin(a) * this.r); }
  }

  // ======================================================================
  // MODELO DIDÁCTICO (relé abierto de armadura, 1 contacto conmutado)
  // ======================================================================
  function didactico(ctx, panel) {
    const { T, V, scene, add, boxR, cyl, tube, curva, espiral, part: P, unpart } = ctx;
    const mat = materiales(ctx);

    P(boxR(-4.8, 2.8, 0, .4, -2, 2, mat.base), 'zocalo');
    P(cyl(.38, 2.55, mat.iron, -1, 1.975, 0), 'nucleo');
    P(cyl(1.0, .12, mat.dark, -1, .82, 0), 'carrete'); P(cyl(1.0, .12, mat.dark, -1, 3.08, 0), 'carrete');
    const wind = P(cyl(.92, 2.14, mat.wind, -1, 1.95, 0, null, 48), 'bobina');
    P(boxR(-1.6, 1.3, .4, .7, -.5, .5, mat.iron), 'yugo');
    P(boxR(1.0, 1.3, .4, 3.28, -.5, .5, mat.iron), 'yugo');
    P(boxR(-1.58, -1.42, -.5, .7, 1.32, 1.48, mat.steel), 'a1a2'); P(boxR(-.58, -.42, -.5, .7, 1.32, 1.48, mat.steel), 'a1a2');
    const leadA = [V(-1.5, .72, 1.4), V(-1.5, 2.2, 1.3), V(-1.2, 3.0, .88)], leadB = [V(-.8, .95, .88), V(-.6, .85, 1.3), V(-.5, .72, 1.4)];
    P(tube(leadA, .03, mat.copper), 'a1a2'); P(tube(leadB, .03, mat.copper), 'a1a2');

    const arm = new T.Group(); arm.position.set(1.3, 3.4, 0); scene.add(arm);
    P(boxR(-3.0, 0, -.12, .13, -.5, .5, mat.iron, arm), 'armadura');
    P(boxR(0, .95, -.08, .05, -.15, .15, mat.steel, arm), 'armadura');
    P(boxR(-3.5, -2.95, -.15, .15, -.3, .3, mat.card, arm), 'tarjeta');
    P(boxR(-4.95, -3.45, -.03, .03, -.25, .25, mat.bronze, arm), 'comun');
    P(cyl(.16, .24, mat.silver, -4.7, 0, 0, arm), 'comun');
    { const p = P(cyl(.07, 1.2, mat.steel, 0, 0, 0, arm, 16), 'bisagra'); p.rotation.x = Math.PI / 2; }

    P(cyl(.16, .2, mat.silver, -3.4, 3.18, 0), 'na');
    P(boxR(-3.95, -3.25, 2.99, 3.08, -.2, .2, mat.bronze), 'na');
    P(boxR(-4.0, -3.85, -.5, 3.08, -.12, .12, mat.bronze), 'na');
    P(cyl(.16, .2, mat.silver, -3.37, 4.183, 0), 'nc');
    P(boxR(-4.55, -3.25, 4.283, 4.373, -.2, .2, mat.bronze), 'nc');
    P(boxR(-4.55, -4.4, -.5, 4.373, -.12, .12, mat.bronze), 'nc');
    P(boxR(-2.7, -2.55, -.5, 2.9, .8, .95, mat.bronze), 'trenza');

    P(boxR(2.1, 2.25, .4, .9, -.1, .1, mat.steel), 'muelle');
    const spring = P(add(new T.Mesh(new T.TubeGeometry(new Helix(.14, 11), 400, .025, 6), mat.steel)), 'muelle');
    const ANCH = V(2.175, .9, 0), Y = V(0, 1, 0), tmp = V(0, 0, 0);

    const caseG = new T.Group(); scene.add(caseG);
    {
      const g = new T.BoxGeometry(8, 4.6, 4);
      const m = new T.Mesh(g, new T.MeshPhysicalMaterial({ color: 0x9fb6d0, transparent: true, opacity: .14, roughness: .1, depthWrite: false }));
      m.position.set(-1, 2.7, 0); m.renderOrder = 2; caseG.add(m);
      const e = new T.LineSegments(new T.EdgesGeometry(g), new T.LineBasicMaterial({ color: 0x7c8fa6 })); e.position.copy(m.position); caseG.add(e);
    }

    const loops = [-.28, 0, .28].map(z => new T.CatmullRomCurve3([
      V(-1, .8, z), V(-1, 2, z), V(-1, 3.25, z), V(-.6, 3.42, z), V(.4, 3.42, z), V(1.12, 3.3, z), V(1.15, 2, z), V(1.12, .6, z), V(.2, .56, z), V(-.8, .6, z)], true).getPoints(90));

    const mando = [V(-1.5, -.5, 1.4), ...curva(leadA), ...espiral(-1, 0, .97, 3.0, .95, Math.atan2(.88, -.2), Math.atan2(.88, .2) + Math.PI * 12), ...curva(leadB), V(-.5, -.5, 1.4)];
    const braidPts = () => { const e = arm.localToWorld(V(-3.6, 0, .2)); return [V(-2.62, 2.9, .87), V(-2.5, 3.4, .7), V(e.x + .1, e.y + .25, .35), e]; };
    let braid = null, bAng = 99;

    const s = sim(ctx, panel, {
      OFF: -.12, ON: 0, caseLabel: 'Carcasa transparente', caseOn: false, setCase: v => { caseG.visible = v; },
      get coil() { return wind.material; },
      setAngle(a) {
        arm.rotation.z = a; arm.updateMatrixWorld();
        const tip = arm.localToWorld(V(.88, -.05, 0));
        tmp.subVectors(tip, ANCH); const len = tmp.length();
        spring.position.copy(ANCH); spring.quaternion.setFromUnitVectors(Y, tmp.normalize()); spring.scale.set(1, len, 1);
        if (Math.abs(a - bAng) > .002) {
          bAng = a;
          if (braid) { unpart(braid); scene.remove(braid); braid.geometry.dispose(); }
          braid = P(tube(braidPts(), .045, mat.braid), 'trenza');
        }
      },
      contacto: { nc: () => V(-3.37, 4.08, 0), no: () => V(-3.4, 3.28, 0) },
      field: loops,
      paths() {
        const com = [V(-2.62, -.5, .87), ...curva(braidPts(), 16), arm.localToWorld(V(-3.6, 0, 0)), arm.localToWorld(V(-4.7, 0, 0))];
        return {
          mando,
          nc: [...com, V(-3.37, 4.183, 0), V(-3.37, 4.33, 0), V(-4.47, 4.33, 0), V(-4.47, -.5, 0)],
          no: [...com, V(-3.4, 3.18, 0), V(-3.4, 3.05, 0), V(-3.92, 3.05, 0), V(-3.92, -.5, 0)]
        };
      }
    });

    ctx.accion('a1a2', s.s1, { pista: 'Púlsalos en el modelo para alimentar o cortar la bobina (como S1).' });
    ctx.accion('armadura', s.mano, { mantener: true, pista: 'Mantenla pulsada en el modelo para bajarla a mano, sin corriente en la bobina.' });
    return {
      tecla: s.tecla, update: s.update,
      labels: [
        { p: 'bobina', at: () => V(-1.92, 1.6, .3) },
        { p: 'nucleo', at: () => V(-1.38, 3.15, 0), l: 1 },
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

  // ======================================================================
  // MODELO INDUSTRIAL (relé enchufable 2 C/O en base de conexión para carril DIN)
  // ======================================================================
  function industrial(ctx, panel) {
    const { T, V, scene, M, add, boxR, cyl, tube, curva, espiral, texto, plano, part: P, unpart } = ctx;
    const mat = materiales(ctx);
    const zinc = M(0xc9cdd2, { metalness: .85, roughness: .32 });
    const sock = M(0x3a3e45, { roughness: .75 }), sock2 = M(0x2e3137, { roughness: .8 });
    const black = M(0x17191d, { roughness: .6 });

    // --- carril DIN TS35 ---
    P(boxR(-4.2, 4.2, .65, .75, -1.75, -1.25, zinc), 'carril'); P(boxR(-4.2, 4.2, .65, .75, 1.25, 1.75, zinc), 'carril');
    P(boxR(-4.2, 4.2, 0, .75, -1.35, -1.25, zinc), 'carril'); P(boxR(-4.2, 4.2, 0, .75, 1.25, 1.35, zinc), 'carril');
    P(boxR(-4.2, 4.2, 0, .1, -1.35, 1.35, zinc), 'carril');
    for (let x = -3.6; x <= 3.7; x += 1.8) P(boxR(x - .35, x + .35, -.002, .102, -.18, .18, black), 'carril');

    // --- base de conexión con bornes de tornillo ---
    P(boxR(-1.4, 1.4, .75, 2.0, -2.4, 2.4, sock), 'zocalo');
    for (const sd of [1, -1]) {
      const z = v => v * sd, lo = Math.min, hi = Math.max;
      P(boxR(-1.4, 1.4, .75, 1.9, lo(z(2.4), z(3.3)), hi(z(2.4), z(3.3)), sock), 'zocalo');
      P(boxR(-1.4, 1.4, .75, 1.4, lo(z(3.3), z(4.2)), hi(z(3.3), z(4.2)), sock), 'zocalo');
      P(boxR(-.06, .06, 1.9, 2.12, lo(z(2.4), z(3.3)), hi(z(2.4), z(3.3)), sock2), 'zocalo');
      P(boxR(-.06, .06, 1.4, 1.62, lo(z(3.3), z(4.2)), hi(z(3.3), z(4.2)), sock2), 'zocalo');
    }
    P(boxR(-.45, .45, .5, .8, 4.0, 4.35, sock2), 'zocalo');   // lengüeta para soltarla del carril
    const bornes = [
      { n: '14', x: -.6, t: 'u', sd: 1 }, { n: '24', x: .6, t: 'u', sd: 1 }, { n: '12', x: -.6, t: 'l', sd: 1 }, { n: '22', x: .6, t: 'l', sd: 1 },
      { n: '11', x: -.6, t: 'u', sd: -1 }, { n: '21', x: .6, t: 'u', sd: -1 }, { n: 'A1', x: -.6, t: 'l', sd: -1 }, { n: 'A2', x: .6, t: 'l', sd: -1 }
    ];
    const hole = M(0x0b0c0e, { roughness: 1 });
    bornes.forEach(b => {
      const top = b.t === 'u' ? 1.9 : 1.4, zs = (b.t === 'u' ? 2.65 : 3.55) * b.sd, zt = (b.t === 'u' ? 3.05 : 3.95) * b.sd;
      P(boxR(b.x - .26, b.x + .26, top - .02, top + .005, zs - .26, zs + .26, mat.bronze), 'bornes');
      P(cyl(.2, .08, mat.steel, b.x, top + .04, zs, null, 24), 'bornes');
      const sl = P(boxR(b.x - .17, b.x + .17, top + .075, top + .09, zs - .03, zs + .03, black), 'bornes'); sl.rotation.y = .6;
      plano(texto(b.n, { w: 128, h: 80, size: 60 }), .42, .26, V(b.x, top + .004, zt), [-Math.PI / 2, 0, b.sd < 0 ? Math.PI : 0]);
      const hz = (b.t === 'u' ? 3.3 : 4.2) * b.sd + .003 * b.sd, hy = b.t === 'u' ? 1.62 : 1.05;
      const h = new T.Mesh(new T.PlaneGeometry(.34, .3), hole); h.position.set(b.x, hy, hz); h.rotation.y = b.sd < 0 ? Math.PI : 0; scene.add(h);
    });

    // --- relé: base enchufable y tapa ---
    P(boxR(-1.05, 1.05, 2.0, 2.35, -1.4, 1.4, black), 'base');
    const coverG = new T.Group(); scene.add(coverG);
    {
      const g = new T.BoxGeometry(2.1, 3.4, 2.8);
      const m = P(new T.Mesh(g, new T.MeshPhysicalMaterial({ color: 0xd9e8f5, transparent: true, opacity: .16, roughness: .05, depthWrite: false })), 'tapa', true);
      m.position.set(0, 4.05, 0); m.renderOrder = 2; coverG.add(m);
      const e = new T.LineSegments(new T.EdgesGeometry(g), new T.LineBasicMaterial({ color: 0x9aaec2 })); e.position.copy(m.position); coverG.add(e);
      plano(texto([['RELÉ 2 C/O', 54], ['Bobina 24 V DC', 38], ['10 A  250 V~', 38], ['A1 +   A2 −', 34]], { w: 512, h: 380, color: '#14161a', bg: '#efeadc' }),
        1.7, 1.26, V(0, 4.2, -1.405), [0, Math.PI, 0], coverG);
    }
    const ledMesh = P(cyl(.1, .06, M(0x1a5a26, { emissive: 0x39ff6a, emissiveIntensity: 0, roughness: .3 }), .6, 5.78, .95, null, 20), 'led');
    P(cyl(.15, .03, black, .6, 5.76, .95, null, 20), 'led');
    const testBtn = P(boxR(-.6, -.1, 5.72, 5.9, .72, 1.18, M(0xf2b705, { roughness: .5 })), 'prueba');

    // --- mecanismo interior ---
    P(cyl(.2, 2.37, mat.iron, 0, 3.685, -.4), 'nucleo');
    P(cyl(.62, .08, mat.dark, 0, 2.56, -.4), 'carrete'); P(cyl(.62, .08, mat.dark, 0, 4.54, -.4), 'carrete');
    const wind = P(cyl(.55, 1.9, mat.wind, 0, 3.55, -.4, null, 40), 'bobina');
    P(boxR(-.4, .4, 2.38, 2.5, -1.13, 0, mat.iron), 'yugo');
    P(boxR(-.4, .4, 2.38, 4.88, -1.13, -1.01, mat.iron), 'yugo');
    const leadA = [V(-.7, 2.36, .3), V(-.6, 3.5, .4), V(-.2, 4.48, .12)], leadB = [V(.2, 2.62, .12), V(.6, 2.45, .35), V(.7, 2.36, .3)];
    P(tube(leadA, .025, mat.copper), 'bobina'); P(tube(leadB, .025, mat.copper), 'bobina');

    const arm = new T.Group(); arm.position.set(0, 4.95, -1.05); scene.add(arm);
    P(boxR(-.45, .45, -.07, .07, 0, 1.45, mat.iron, arm), 'armadura');
    P(boxR(-.12, .12, -.04, .04, -.28, 0, mat.steel, arm), 'armadura');
    { const p = P(cyl(.05, 1.0, mat.steel, 0, 0, 0, arm, 12), 'armadura'); p.rotation.z = Math.PI / 2; }
    P(boxR(-.85, .85, -.3, .08, 1.45, 1.65, mat.card, arm), 'tarjeta');
    for (const sx of [-.5, .5]) {
      P(boxR(sx - .12, sx + .12, -.02, .02, 1.65, 2.3, mat.bronze, arm), 'comun');
      P(cyl(.1, .2, mat.silver, sx, 0, 2.15, arm, 20), 'comun');
      // NA (abajo)
      P(cyl(.1, .1, mat.silver, sx, 4.80, 1.1, null, 20), 'na');
      P(boxR(sx - .12, sx + .12, 4.70, 4.75, .95, 1.32, mat.bronze), 'na');
      P(boxR(sx - .1, sx + .1, 2.35, 4.75, 1.24, 1.32, mat.bronze), 'na');
      // NC (arriba)
      const px = sx * 1.64;
      P(cyl(.1, .1, mat.silver, sx, 5.32, 1.1, null, 20), 'nc');
      P(boxR(sx - .12, sx + .12, 5.37, 5.42, .95, 1.36, mat.bronze), 'nc');
      P(boxR(Math.min(sx, px) - .1, Math.max(sx, px) + .1, 5.37, 5.42, 1.24, 1.36, mat.bronze), 'nc');
      P(boxR(px - .08, px + .08, 2.35, 5.42, 1.26, 1.34, mat.bronze), 'nc');
      // común
      P(boxR(sx * 1.9 - .08, sx * 1.9 + .08, 2.35, 4.7, .45, .55, mat.bronze), 'comun');
    }
    P(boxR(-.12, .12, 4.0, 4.1, -1.36, -1.13, mat.steel), 'muelle');
    const spring = P(add(new T.Mesh(new T.TubeGeometry(new Helix(.07, 9), 300, .016, 6), mat.steel)), 'muelle');
    const ANCH = V(0, 4.1, -1.3), Y = V(0, 1, 0), tmp = V(0, 0, 0);

    // --- cables ---
    const cab = (c) => M(c, { roughness: .55 });
    const W = {
      A1: { pts: [V(-.6, 1.05, -4.2), V(-.55, 1.0, -4.8), V(-.5, -1.5, -5.2)], m: cab(0xc0392b) },
      A2: { pts: [V(.6, 1.05, -4.2), V(.55, 1.0, -4.8), V(.5, -1.5, -5.2)], m: cab(0x1f4e9c) },
      c11: { pts: [V(-.6, 1.62, -3.3), V(-.65, 1.85, -3.9), V(-.9, 1.9, -5.0), V(-1.0, -1.5, -5.6)], m: cab(0x6b3e1e) },
      c14: { pts: [V(-.6, 1.62, 3.3), V(-.65, 1.85, 3.9), V(-.9, 1.9, 5.0), V(-1.0, -1.5, 5.6)], m: cab(0x1a1a1a) },
      c12: { pts: [V(-.6, 1.05, 4.2), V(-.55, 1.0, 4.8), V(-.5, -1.5, 5.2)], m: cab(0x8a9499) }
    };
    Object.values(W).forEach(w => { P(tube(w.pts, .075, w.m), 'cables'); w.c = curva(w.pts, 30); });
    const rev = a => a.slice().reverse();

    const loops = [-.15, 0, .15].map(x => new T.CatmullRomCurve3([
      V(x, 2.6, -.4), V(x, 3.7, -.4), V(x, 4.85, -.4), V(x, 4.95, -.7), V(x, 4.92, -1.0), V(x, 4.5, -1.07), V(x, 3.4, -1.07), V(x, 2.45, -1.07), V(x, 2.44, -.7)], true).getPoints(80));
    const mando = [...rev(W.A1.c), V(-.6, 1.05, -3.0), V(-.7, 2.2, -.3), ...curva(leadA), ...espiral(0, -.4, .6, 4.45, 2.65, Math.atan2(.52, -.2), Math.atan2(.52, .2) + Math.PI * 10), ...curva(leadB), V(.7, 2.2, -.3), V(.6, 1.05, -3.0), ...W.A2.c];

    const braidPts = sx => { const e = arm.localToWorld(V(sx, 0, 1.72)), s0 = V(sx * 1.9, 4.7, .5); return [s0, V(s0.x, s0.y + .25, s0.z + .05), V(e.x, e.y + .18, e.z - .08), e]; };
    let braids = [], bAng = 99;
    coverG.visible = true;

    const s = sim(ctx, panel, {
      OFF: -.1, ON: 0, caseLabel: 'Tapa transparente', caseOn: true, setCase: v => { coverG.visible = v; },
      get coil() { return wind.material; },
      led: on => { ledMesh.material.emissiveIntensity = on ? 1.6 : 0; },
      test: testBtn, testY: testBtn.position.y,
      setAngle(a) {
        arm.rotation.x = a; arm.updateMatrixWorld();
        const tip = arm.localToWorld(V(0, -.02, -.25));
        tmp.subVectors(tip, ANCH); const len = tmp.length();
        spring.position.copy(ANCH); spring.quaternion.setFromUnitVectors(Y, tmp.normalize()); spring.scale.set(1, len, 1);
        if (Math.abs(a - bAng) > .002) {
          bAng = a;
          braids.forEach(b => { unpart(b); scene.remove(b); b.geometry.dispose(); });
          braids = [-.5, .5].map(sx => P(tube(braidPts(sx), .03, mat.braid), 'trenza'));
        }
      },
      contacto: { nc: () => V(-.5, 5.27, 1.1), no: () => V(-.5, 4.85, 1.1) },
      field: loops,
      paths() {
        const com = [...rev(W.c11.c), V(-.6, 1.62, -2.2), V(-.95, 2.2, .5), V(-.95, 4.7, .5), ...curva(braidPts(-.5), 14), arm.localToWorld(V(-.5, 0, 2.15))];
        return {
          mando,
          nc: [...com, V(-.5, 5.32, 1.1), V(-.5, 5.395, 1.3), V(-.82, 5.395, 1.3), V(-.82, 2.36, 1.3), V(-.6, 1.05, 3.0), ...W.c12.c],
          no: [...com, V(-.5, 4.8, 1.1), V(-.5, 4.725, 1.28), V(-.5, 2.36, 1.28), V(-.6, 1.62, 2.2), ...W.c14.c]
        };
      }
    });

    ctx.accion('prueba', s.prueba, { pista: 'Púlsalo en el modelo para accionar o soltar los contactos.' });
    ctx.accion('cables', s.s1, { pista: 'Pulsa un cable en el modelo para conectar o cortar la alimentación de la bobina.' });
    return {
      tecla: s.tecla, update: s.update,
      labels: [
        { p: 'bobina', at: () => V(.6, 3.2, -.1) },
        { p: 'nucleo', at: () => V(-.2, 4.7, -.4), l: 1 },
        { p: 'armadura', at: () => arm.localToWorld(V(.45, .07, .7)) },
        { p: 'tarjeta', txt: 'Tarjeta', at: () => arm.localToWorld(V(.85, -.1, 1.55)) },
        { p: 'nc', txt: 'NC (12 · 22)', at: () => V(-.82, 5.42, 1.3), l: 1 },
        { p: 'comun', txt: 'Común (11 · 21)', at: () => V(-.95, 4.0, .5), l: 1 },
        { p: 'na', txt: 'NA (14 · 24)', at: () => V(-.5, 4.6, 1.32), l: 1 },
        { p: 'led', txt: 'LED', at: () => V(.6, 5.82, .95) },
        { p: 'prueba', txt: 'Pulsador de prueba', at: () => V(-.6, 5.9, .95), l: 1 },
        { p: 'zocalo', txt: 'Base de conexión', at: () => V(1.4, 1.3, 1.6) },
        { p: 'carril', txt: 'Carril DIN', at: () => V(4.2, .7, 1.5) },
        { p: 'cables', at: () => V(-.55, 1.0, -4.8), l: 1 }
      ]
    };
  }

  // ---------- definición del componente ----------
  const pasos = [
    ['1. En reposo', 'Sin tensión en la bobina, el muelle mantiene la armadura separada del núcleo. El común (11) toca el NC (12): la corriente de carga va a H1.'],
    ['2. Se alimenta la bobina', 'Al cerrar S1 circula corriente de A1 a A2 por el bobinado (amarillo). El núcleo se imanta y aparece el campo magnético (azul).'],
    ['3. Atracción y conmutación', 'Si la tensión llega al valor de cierre, el electroimán vence al muelle: la armadura baja, abre 11–12 (salta una chispa) y cierra 11–14. La carga pasa a H2.'],
    ['4. Se corta la bobina', 'Sin corriente desaparece el campo, el muelle devuelve la armadura y los contactos vuelven a reposo. Al abrirse 11–14 con carga vuelve a saltar una chispa.']
  ];

  window.COMPONENTES.push({
    id: 'rele',
    nombre: 'Relé electromecánico',
    categoria: 'Mando y maniobra',
    resumen: 'Un electroimán que, con una corriente pequeña, abre y cierra otro circuito.',
    titulo: 'Relé electromecánico: cómo conmuta por dentro',
    lead: 'Cierra S1 y sigue la corriente: la de mando atraviesa la bobina y la de carga sale por el contacto que esté cerrado. Pulsa sobre cualquier pieza para saber qué hace.',
    panel: PANEL,
    pasos,
    leyenda: [['#ffc400', 'Corriente de mando'], ['#ff5a1f', 'Corriente de carga'], ['#2f8cff', 'Campo magnético']],
    extra: `
      <div class="two">
        <div>
          <h2>Para qué sirve</h2>
          <p>Con una corriente pequeña en la bobina (circuito de mando, por ejemplo 24 V DC desde una salida de PLC) se conecta o desconecta otro circuito distinto (circuito de potencia). La tarjeta aislante separa eléctricamente la armadura de los contactos, así que los dos circuitos quedan aislados entre sí.</p>
          <h2 style="margin-top:28px">Qué estás viendo en la simulación</h2>
          <p>La bobina de este relé es de 24 V DC con unos 1150 Ω, así que a tensión nominal consume unos 21 mA (I = U / R). Para atraer la armadura necesita al menos el 80 % de su tensión (19,2 V), pero una vez pegada al núcleo la mantiene hasta que baja del 10 % (2,4 V): con el entrehierro cerrado el circuito magnético necesita mucha menos fuerza. Prueba a bajar el deslizador con el relé conmutado.</p>
          <p>Al abrir un contacto que lleva corriente salta una pequeña chispa (arco). Por eso los contactos son de aleación de plata y cada relé indica la corriente y tensión máximas que puede cortar.</p>
          <p class="note">Los valores son típicos de un relé de 24 V DC; consulta siempre la hoja de características del modelo que uses.</p>
        </div>
        <div>
          <h2>Bornes</h2>
          <table>
            <thead><tr><th>Borne</th><th>Función</th></tr></thead>
            <tbody>
              <tr><td>A1 / A2</td><td>Alimentación de la bobina (A1 +, A2 − en continua)</td></tr>
              <tr><td>11 · 21</td><td>Comunes de los contactos 1 y 2</td></tr>
              <tr><td>12 · 22</td><td>Normalmente cerrados (NC)</td></tr>
              <tr><td>14 · 24</td><td>Normalmente abiertos (NA)</td></tr>
            </tbody>
          </table>
          <p class="note">Primera cifra: número del contacto. Segunda: 1 común, 2 NC, 4 NA. El modelo didáctico tiene un solo contacto conmutado; el industrial, dos (2 C/O) que se mueven a la vez empujados por la misma tarjeta. En el industrial solo está cableado el contacto 1.</p>
        </div>
      </div>`,
    modelos: [
      {
        id: 'didactico', nombre: 'Modelo didáctico', build: didactico,
        camara: { pos: [5.5, 6.5, 11], tgt: [-1, 2.2, 0] },
        partes: {
          bobina:   { t: 'Bobina', d: 'Hilo de cobre esmaltado enrollado sobre un carrete. Cuando circula corriente entre A1 y A2 crea un campo magnético.' },
          nucleo:   { t: 'Núcleo', d: 'Cilindro de hierro dulce dentro de la bobina. Concentra el campo magnético y se convierte en un electroimán mientras hay corriente; al cortarla pierde el magnetismo.', ver: ['bobina', 'carrete'] },
          carrete:  { t: 'Carrete', d: 'Soporte de plástico aislante sobre el que se enrolla el hilo de la bobina. Sus pestañas evitan que las espiras se salgan.' },
          yugo:     { t: 'Yugo', d: 'Pieza de hierro en forma de L. Cierra el circuito magnético entre el núcleo y la armadura para que la atracción sea más fuerte.' },
          armadura: { t: 'Armadura', d: 'Chapa de hierro móvil. El electroimán la atrae hacia el núcleo y, al girar sobre la bisagra, empuja el contacto móvil.' },
          bisagra:  { t: 'Bisagra', d: 'Eje sobre el que gira la armadura. Está en el borde del yugo para que el campo pase de una pieza a otra.' },
          muelle:   { t: 'Muelle de retorno', d: 'Tira de la palanca de la armadura y la devuelve a reposo cuando se quita la tensión. Su fuerza marca cuánta tensión necesita la bobina para conmutar.' },
          tarjeta:  { t: 'Tarjeta aislante', d: 'Une mecánicamente la armadura con el contacto móvil, pero los aísla eléctricamente: así el circuito de mando queda separado del de potencia.' },
          comun:    { t: 'Común (11)', d: 'Lámina elástica de bronce con una pastilla de plata en la punta. Es el contacto que se mueve: en reposo toca el 12 y, excitado, el 14.' },
          trenza:   { t: 'Latiguillo flexible', d: 'Cable trenzado que lleva la corriente desde el borne 11 hasta el contacto móvil sin frenar su movimiento.' },
          nc:       { t: 'Contacto NC (12)', d: 'Normalmente cerrado: toca el común en reposo y se abre cuando la bobina está excitada.' },
          na:       { t: 'Contacto NA (14)', d: 'Normalmente abierto: está separado en reposo y se cierra con el común cuando la bobina está excitada.' },
          a1a2:     { t: 'Bornes A1 / A2', d: 'Entrada de alimentación de la bobina, es decir, el circuito de mando (por ejemplo 24 V DC desde una salida de PLC).' },
          zocalo:   { t: 'Base aislante', d: 'Zócalo de plástico que sujeta todas las piezas y por el que salen los bornes de conexión.' }
        }
      },
      {
        id: 'industrial', nombre: 'Relé industrial (carril DIN)', build: industrial, suelo: -1.55,
        camara: { pos: [10.5, 9, 13.5], tgt: [0, 2.3, .6] },
        partes: {
          tapa:     { t: 'Tapa transparente', d: 'Cubierta de policarbonato que protege el mecanismo del polvo y deja ver si los contactos han conmutado. Lleva impresos los datos del relé.' },
          prueba:   { t: 'Pulsador de prueba', d: 'Acciona los contactos a mano, sin tensión en la bobina, para comprobar la instalación. Fíjate en que el LED no se enciende: la bobina no recibe corriente.' },
          led:      { t: 'LED indicador', d: 'Se enciende cuando hay tensión en A1–A2. Indica que la orden de mando llega, no que los contactos hayan conmutado.' },
          bobina:   { t: 'Bobina', d: 'Bobinado de cobre esmaltado de 24 V DC (unos 1150 Ω). Crea el campo magnético cuando circula corriente de A1 a A2.' },
          nucleo:   { t: 'Núcleo', d: 'Hierro dulce dentro de la bobina. Se imanta solo mientras hay corriente y atrae la armadura.', ver: ['bobina', 'carrete'] },
          carrete:  { t: 'Carrete', d: 'Soporte aislante del bobinado.' },
          yugo:     { t: 'Yugo', d: 'Hierro en L que cierra el circuito magnético desde la base del núcleo hasta la bisagra de la armadura.' },
          armadura: { t: 'Armadura', d: 'Chapa de hierro que gira sobre el borde del yugo. Al ser atraída por el núcleo baja y mueve la tarjeta.' },
          muelle:   { t: 'Muelle de retorno', d: 'Tira de la cola de la armadura y la devuelve a reposo al cortar la bobina.' },
          tarjeta:  { t: 'Tarjeta de maniobra', d: 'Pieza aislante que mueve los dos contactos a la vez. Por eso en un relé de 2 C/O los dos contactos siempre están en el mismo estado.' },
          comun:    { t: 'Contactos comunes (11 · 21)', d: 'Láminas elásticas con pastilla de plata que se mueven con la tarjeta: tocan arriba el NC y abajo el NA.' },
          trenza:   { t: 'Latiguillos', d: 'Conexiones flexibles entre los bornes comunes y las láminas móviles.' },
          nc:       { t: 'Contactos NC (12 · 22)', d: 'Normalmente cerrados: tocan el común en reposo y se abren al excitar la bobina.' },
          na:       { t: 'Contactos NA (14 · 24)', d: 'Normalmente abiertos: se cierran con el común al excitar la bobina.' },
          base:     { t: 'Base enchufable del relé', d: 'Parte inferior del relé con patillas planas que se enchufan en la base de conexión. Así se cambia un relé averiado sin tocar los cables.' },
          zocalo:   { t: 'Base de conexión', d: 'Se engancha al carril DIN y recibe los cables. Cada borne lleva su número impreso y la lengüeta delantera sirve para soltarla del carril.' },
          bornes:   { t: 'Bornes de tornillo', d: 'Aprietan el cable contra una placa metálica. Detrás están A1/A2 (mando) y los comunes 11/21; delante, los NA 14/24 y los NC 12/22.' },
          carril:   { t: 'Carril DIN (TS35)', d: 'Perfil metálico normalizado de 35 mm sobre el que se enganchan los aparatos de un cuadro eléctrico.' },
          cables:   { t: 'Cables', d: 'Rojo y azul: alimentación de la bobina (A1 +, A2 −). Marrón: llegada al común 11. Negro: salida NA (14) hacia H2. Gris: salida NC (12) hacia H1.' }
        }
      }
    ]
  });
})();
