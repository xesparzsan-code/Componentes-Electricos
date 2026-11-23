// Motor 3D compartido por todos los componentes: escena, cámara, selección de piezas, etiquetas,
// corriente animada (partículas), chispas y varios modelos por componente.
window.COMPONENTES = window.COMPONENTES || [];
window.Motor = (() => {
  const T = THREE, V = (x, y, z) => new T.Vector3(x, y, z);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let vdB, R, fig, labelsEl, info, legendEl, quizEl, cur = null, raf = 0, W = 1, H = 1, modoNombres = 'siempre', speed = 1;
  const ray = new T.Raycaster(), ndc = new T.Vector2();

  // ---------- utilidades de construcción ----------
  const M = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: .55, metalness: .1 }, o));
  const add = (mesh, parent) => { mesh.castShadow = mesh.receiveShadow = true; (parent || cur.scene).add(mesh); return mesh; };
  const boxR = (x0, x1, y0, y1, z0, z1, m, parent) => {
    const b = new T.Mesh(new T.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), m);
    b.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); return add(b, parent);
  };
  const cyl = (r, h, m, x, y, z, parent, seg = 40) => {
    const c = new T.Mesh(new T.CylinderGeometry(r, r, h, seg), m); c.position.set(x, y, z); return add(c, parent);
  };
  const curva = (pts, n = 24) => new T.CatmullRomCurve3(pts).getPoints(n);
  const tube = (pts, r, m, parent) => add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 40, r, 8), m), parent);
  // espiral alrededor de un eje vertical (para la corriente dentro de un bobinado)
  const espiral = (cx, cz, r, y0, y1, a0, a1, n = 200) => {
    const out = [];
    for (let i = 0; i <= n; i++) { const t = i / n, a = a0 + (a1 - a0) * t; out.push(V(cx + r * Math.cos(a), y0 + (y1 - y0) * t, cz + r * Math.sin(a))); }
    return out;
  };
  // textura con texto (rótulos impresos, etiquetas de fabricante...)
  function texto(lineas, { w = 256, h = 128, size = 64, color = '#fff', bg = null } = {}) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
    g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
    const L = [].concat(lineas);
    L.forEach((t, i) => {
      const [s, sz] = Array.isArray(t) ? t : [t, size];
      let f = Math.min(sz, h / L.length * .82);
      g.font = `600 ${f}px Inter, Arial, sans-serif`;
      const mw = g.measureText(s).width; if (mw > w * .92) { f *= w * .92 / mw; g.font = `600 ${f}px Inter, Arial, sans-serif`; }
      g.fillText(s, w / 2, h * (i + .5) / L.length);
    });
    const tx = new T.CanvasTexture(c); tx.encoding = T.sRGBEncoding; tx.anisotropy = 4; return tx;
  }
  const plano = (tex, w, h, pos, rot = [0, 0, 0], parent) => {
    const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    m.position.copy(pos); m.rotation.set(...rot); (parent || cur.scene).add(m); return m;
  };

  // Partículas que recorren una polilínea: corriente eléctrica, campo magnético...
  function flow({ color = 0xffc400, max = 260, gap = .3, size = .055 } = {}) {
    const m = new T.MeshBasicMaterial({ color, transparent: true, depthWrite: false });
    const im = new T.InstancedMesh(new T.SphereGeometry(size, 8, 6), m, max);
    im.count = 0; im.frustumCulled = false; im.renderOrder = 3; cur.scene.add(im);
    let pts = [], cum = [0], L = 0, off = 0, k = 0, vel = 1;
    const d = new T.Object3D();
    const api = {
      path(a) {
        pts = a; cum = [0];
        for (let i = 1; i < a.length; i++) cum.push(cum[i - 1] + a[i].distanceTo(a[i - 1]));
        L = cum[cum.length - 1] || 0; return api;
      },
      set(intensidad, v) { k = intensidad; if (v !== undefined) vel = v; return api; },
      step(dt) {
        if (k <= .01 || L <= 0 || pts.length < 2) { im.count = 0; return; }
        m.opacity = Math.min(1, k);
        off = ((off + dt * vel) % gap + gap) % gap;
        const n = Math.min(max, Math.floor(L / gap)); im.count = n;
        let j = 1;
        for (let i = 0; i < n; i++) {
          const s = off + i * gap;
          while (j < cum.length - 1 && cum[j] < s) j++;
          const seg = cum[j] - cum[j - 1] || 1, t = Math.min(1, Math.max(0, (s - cum[j - 1]) / seg));
          d.position.lerpVectors(pts[j - 1], pts[j], t); d.updateMatrix(); im.setMatrixAt(i, d.matrix);
        }
        im.instanceMatrix.needsUpdate = true;
      }
    };
    cur.flows.push(api); return api;
  }

  // Chispa breve (apertura de contactos con carga, arcos...)
  let sparkTex = null;
  function spark(pos) {
    if (!sparkTex) {
      const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
      const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(190,225,255,.9)'); gr.addColorStop(1, 'rgba(80,140,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64); sparkTex = new T.CanvasTexture(c);
    }
    const s = new T.Sprite(new T.SpriteMaterial({ map: sparkTex, blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
    s.position.copy(pos); s.renderOrder = 4; cur.scene.add(s);
    cur.sparkLight.position.copy(pos);
    cur.sparks.push({ s, t: 0 });
  }

  // Cada pieza tiene sus propios materiales para poder resaltarla sin afectar a las demás
  function part(mesh, id, noPick) {
    const pm = cur.pm[id] || (cur.pm[id] = new Map());
    const o = mesh.material; let m = pm.get(o.uuid);
    if (!m) { m = o.clone(); m.userData = { e0: o.emissive ? o.emissive.clone() : null, i0: o.emissiveIntensity, op: o.opacity, tr: o.transparent, dw: o.depthWrite }; pm.set(o.uuid, m); }
    mesh.material = m; mesh.userData.part = id; if (!noPick) cur.pick.push(mesh); return mesh;
  }
  function unpart(mesh) { const i = cur.pick.indexOf(mesh); if (i >= 0) cur.pick.splice(i, 1); }
  const mats = id => [...((cur && cur.pm[id]) || new Map()).values()];

  // ---------- selección, paso del ratón y piezas accionables ----------
  function pick(e) {
    const r = R.domElement.getBoundingClientRect();
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(ndc, cur.camera);
    const h = ray.intersectObjects(cur.pick, false).find(h => h.object.visible && !cur.hidden.has(h.object.userData.part));
    return h ? h.object.userData.part : null;
  }
  const restaurar = id => mats(id).forEach(m => { if (m.userData.e0) { m.emissive.copy(m.userData.e0); m.emissiveIntensity = m.userData.i0; } });
  function select(id) {
    if (!cur || id === cur.sel) return;
    if (cur.sel) restaurar(cur.sel);
    cur.hidden.forEach(h => mats(h).forEach(m => { m.transparent = m.userData.tr; m.opacity = m.userData.op; m.depthWrite = m.userData.dw; m.needsUpdate = true; }));
    cur.hidden.clear();
    cur.sel = id;
    document.querySelectorAll('[data-p]').forEach(b => b.setAttribute('aria-pressed', b.dataset.p === id));
    if (!id) { info.hidden = true; return; }
    const p = cur.comp.partes[id];
    info.querySelector('b').textContent = p.t;
    info.querySelector('p').textContent = p.d + (cur.acc[id] ? ' ' + (cur.acc[id].pista || 'Púlsala en el modelo para accionarla.') : '');
    info.hidden = false;
    (p.ver || []).forEach(h => { cur.hidden.add(h); mats(h).forEach(m => { m.transparent = true; m.opacity = .14; m.depthWrite = false; m.needsUpdate = true; }); });
  }
  // registra una pieza que hace algo al pulsarla en el 3D (mantener = actúa mientras se mantiene pulsada)
  function accion(id, fn, opt = {}) { cur.acc[id] = Object.assign({ fn }, opt); }

  // ---------- modo examen ----------
  function quizSiguiente() {
    const q = cur.quiz, ids = [...new Set(cur.pick.map(m => m.userData.part))].filter(id => cur.comp.partes[id] && id !== q.obj);
    q.obj = ids[Math.floor(Math.random() * ids.length)];
    quizEl.innerHTML = `<b>Pulsa en el modelo: ${cur.comp.partes[q.obj].t}</b><span>${q.ok} aciertos de ${q.n}</span><button type="button" data-q="salir">Salir del examen</button>`;
  }
  function quiz(on) {
    if (!cur) return;
    if (on) { select(null); cur.quiz = { ok: 0, n: 0, obj: null }; quizEl.hidden = false; quizSiguiente(); }
    else { cur.quiz = null; quizEl.hidden = true; }
    fig.classList.toggle('examen', !!on);
    document.querySelectorAll('[data-examen]').forEach(b => b.setAttribute('aria-pressed', !!on));
  }
  function quizRespuesta(id) {
    const q = cur.quiz; if (!id) return;
    q.n++;
    const bien = id === q.obj;
    if (bien) q.ok++;
    mats(id).forEach(m => { if (m.emissive) { m.emissive.setHex(bien ? 0x22c55e : 0xef4444); m.emissiveIntensity = .7; } });
    setTimeout(() => cur && restaurar(id), 600);
    quizEl.innerHTML = `<b class="${bien ? 'bien' : 'mal'}">${bien ? '¡Correcto!' : 'No: eso es ' + cur.comp.partes[id].t}</b><span>${q.ok} aciertos de ${q.n}</span>`;
    setTimeout(() => { if (cur && cur.quiz === q) quizSiguiente(); }, bien ? 900 : 1600);
  }

  // ---------- ciclo de vida ----------
  function init(f) {
    fig = f; labelsEl = f.querySelector('.labels'); info = f.querySelector('.info'); legendEl = f.querySelector('.legend'); quizEl = f.querySelector('.quiz');
    R = new T.WebGLRenderer({ antialias: true, alpha: true });
    R.setPixelRatio(Math.min(devicePixelRatio, 2));
    R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap; R.outputEncoding = T.sRGBEncoding;
    f.prepend(R.domElement);
    const ro = new ResizeObserver(resize); ro.observe(f);
    const cv = R.domElement; let down = null, sujeta = null, pulsada = null;
    cv.addEventListener('pointerdown', e => {
      down = [e.clientX, e.clientY]; pulsada = null;
      if (!cur || cur.quiz) return;
      const id = pick(e), a = id && cur.acc[id];
      if (!a) return;
      cur.controls.enabled = false; pulsada = id;               // no girar la cámara al accionar una pieza
      if (a.mantener) { sujeta = a; a.fn(true); select(id); }
    });
    addEventListener('pointerup', e => {
      if (sujeta) { sujeta.fn(false); sujeta = null; }
      if (cur) cur.controls.enabled = true;
      if (e.target !== cv) { down = null; return; }
      if (cur && down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 6) {
        const id = pick(e);
        if (cur.quiz) quizRespuesta(id);
        else {
          const a = id && cur.acc[id];
          if (a && !a.mantener && id === pulsada) a.fn();
          select(id);
        }
      }
      down = null; pulsada = null;
    });
    cv.addEventListener('pointermove', e => {
      if (!cur || e.buttons) return;
      const id = pick(e);
      cur.hover = id;
      cv.style.cursor = id ? 'pointer' : 'grab';
      cv.title = id && !cur.quiz ? cur.comp.partes[id].t + (cur.acc[id] ? ' · se puede accionar' : '') : '';
    });
    cv.addEventListener('pointerleave', () => { if (cur) cur.hover = null; });
    info.querySelector('button').addEventListener('click', () => select(null));
    quizEl.addEventListener('click', e => { if (e.target.closest('[data-q=salir]')) quiz(false); });
    vdB = f.querySelector('.vd');
    f.querySelector('.vr').addEventListener('click', () => { if (cur) { dentro(false); ir(cur.home); } });
    vdB.addEventListener('click', () => { if (cur && cur.api.dentro) dentro(!cur.enDentro); });
    labelsEl.addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b) select(b.dataset.p); });
    labelsEl.addEventListener('pointerover', e => { const b = e.target.closest('[data-p]'); if (b && cur) cur.hover = b.dataset.p; });
    addEventListener('keydown', e => {
      if (!cur) return;
      if (e.key === 'Escape') { if (cur.quiz) quiz(false); else select(null); }
      if (e.code === 'Space' && cur.api.tecla && !/^(INPUT|BUTTON|A|SELECT|TEXTAREA)$/.test(e.target.tagName) && !e.target.closest('[role=button]')) { e.preventDefault(); cur.api.tecla(); }
    });
  }
  // movimiento suave de la cámara
  function ir(v) { cur.tw = { p0: cur.camera.position.clone(), t0: cur.controls.target.clone(), p1: v.pos.clone(), t1: v.tgt.clone(), k: 0, s: performance.now() }; }
  function dentro(v) {
    if (!cur || !cur.api.dentro) return;
    cur.enDentro = v; vdB.setAttribute('aria-pressed', v); vdB.textContent = v ? 'Ver el montaje' : 'Ver por dentro';
    const d = cur.api.dentro;
    ir(v ? { pos: V(...d.pos), tgt: V(...d.tgt) } : cur.home);
    if (cur.api.alCambiarVista) cur.api.alCambiarVista(v);
  }
  function resize() {
    W = fig.clientWidth; H = fig.clientHeight; if (!W || !H) return;
    R.setSize(W, H, false);
    if (cur) { cur.camera.aspect = W / H; cur.camera.fov = W < 600 ? 50 : 38; cur.camera.updateProjectionMatrix(); }
  }
  function unmount() {
    cancelAnimationFrame(raf);
    if (!cur) return;
    quiz(false);
    cur.controls.dispose();
    cur.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    cur = null; labelsEl.innerHTML = ''; info.hidden = true;
  }
  // el = { panel, steps, modelos }
  function mount(comp, el, modeloId) {
    unmount();
    const mdl = comp.modelos ? (comp.modelos.find(x => x.id === modeloId) || comp.modelos[0]) : null;
    const spec = Object.assign({}, comp, mdl || {});
    el.panel.innerHTML = spec.panel || '';
    if (el.modelos) {
      el.modelos.hidden = !comp.modelos;
      el.modelos.innerHTML = comp.modelos ? comp.modelos.map(m => `<button data-m="${m.id}" aria-pressed="${m === mdl}">${m.nombre}</button>`).join('') : '';
      el.modelos.onclick = e => { const b = e.target.closest('[data-m]'); if (b && mdl && b.dataset.m !== mdl.id) mount(comp, el, b.dataset.m); };
    }
    legendEl.innerHTML = (spec.leyenda || []).map(([c, t]) => `<span><i style="background:${c}"></i>${t}</span>`).join('');

    const scene = new T.Scene(), camera = new T.PerspectiveCamera(38, 1, .1, 120);
    const home = { pos: V(...spec.camara.pos), tgt: V(...spec.camara.tgt) };
    camera.position.copy(home.pos);
    const controls = new T.OrbitControls(camera, R.domElement);
    controls.target.copy(home.tgt); controls.enableDamping = true; controls.autoRotateSpeed = 1.2;
    controls.minDistance = 4; controls.maxDistance = 32; controls.maxPolarAngle = Math.PI * .62;

    scene.add(new T.HemisphereLight(0xffffff, 0x8890a0, .75));
    const sun = new T.DirectionalLight(0xffffff, .9);
    sun.position.set(6, 12, 8); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9 }); scene.add(sun);
    const fill = new T.DirectionalLight(0xbfd4ff, .35); fill.position.set(-8, 4, -6); scene.add(fill);
    const sparkLight = new T.PointLight(0x9cc8ff, 0, 5); scene.add(sparkLight);
    const sh = new T.Mesh(new T.PlaneGeometry(50, 50), new T.ShadowMaterial({ opacity: .18 }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = spec.suelo ?? -.52; sh.receiveShadow = true; scene.add(sh);

    cur = { comp: spec, scene, camera, controls, home, el, pick: [], pm: {}, hidden: new Set(), sel: null, hover: null, hovPrev: null, step: -1,
      clock: new T.Clock(), t: 0, flows: [], sparks: [], sparkLight, acc: {}, quiz: null };
    const ctx = { T, V, scene, camera, reduce, M, add, boxR, cyl, tube, curva, espiral, texto, plano, part, unpart, flow, spark, step: setStep, select, accion, dentro: v => dentro(v) };
    cur.api = spec.build(ctx, el.panel);
    cur.enDentro = false; vdB.hidden = !cur.api.dentro; vdB.setAttribute('aria-pressed', false); vdB.textContent = 'Ver por dentro';

    labelsEl.innerHTML = (cur.api.labels || []).map(o =>
      `<button class="lb${o.l ? ' l' : ''}${cur.acc[o.p] ? ' acc' : ''}" data-p="${o.p}" aria-pressed="false"><i></i><span>${o.txt || spec.partes[o.p].t}</span></button>`).join('');
    cur.lEls = [...labelsEl.children];
    document.querySelectorAll('[data-girar]').forEach(b => b.setAttribute('aria-pressed', false));
    resize(); loop();
  }
  function setStep(i) {
    if (!cur || i === cur.step) return; cur.step = i;
    [...cur.el.steps.children].forEach((li, k) => li.classList.toggle('act', k === i));
  }
  function loop() {
    raf = requestAnimationFrame(loop);
    const c = cur, dt = Math.min(c.clock.getDelta(), .05) * speed; c.t += dt;
    c.api.update(dt, c.t);
    c.flows.forEach(f => f.step(reduce ? 0 : dt));
    // chispas
    let li = 0;
    c.sparks = c.sparks.filter(s => {
      s.t += dt; const k = 1 - s.t / .28;
      if (k <= 0) { c.scene.remove(s.s); s.s.material.dispose(); return false; }
      const sc = (.35 + Math.random() * .35) * k + .1; s.s.scale.set(sc, sc, sc); s.s.material.opacity = k; li = Math.max(li, k);
      return true;
    });
    c.sparkLight.intensity = li * 3;
    // resaltado: suave al pasar el ratón, fuerte y pulsante en la pieza seleccionada
    if (c.hovPrev && c.hovPrev !== c.hover && c.hovPrev !== c.sel) restaurar(c.hovPrev);
    c.hovPrev = c.hover;
    if (c.hover && c.hover !== c.sel && !c.quiz) mats(c.hover).forEach(m => { if (m.emissive) { m.emissive.setHex(0x2f8cff); m.emissiveIntensity = .22; } });
    if (c.sel) {
      const k = reduce ? .5 : .42 + .18 * Math.sin(performance.now() / 170);
      mats(c.sel).forEach(m => { if (m.emissive) { m.emissive.setHex(0x2f8cff); m.emissiveIntensity = k; } });
    }
    if (c.tw) {
      const tw = c.tw; tw.k = reduce ? 1 : Math.min(1, (performance.now() - tw.s) / 650);
      const e = tw.k < .5 ? 2 * tw.k * tw.k : 1 - (-2 * tw.k + 2) ** 2 / 2;
      c.camera.position.lerpVectors(tw.p0, tw.p1, e); c.controls.target.lerpVectors(tw.t0, tw.t1, e);
      if (tw.k >= 1) c.tw = null;
    }
    c.controls.update();
    R.render(c.scene, c.camera);
    if (!W) return;
    (c.api.labels || []).forEach((o, i) => {
      const el = c.lEls[i];
      const ver = !c.quiz && (modoNombres === 'siempre' || o.p === c.hover || o.p === c.sel);
      if (!ver) { el.style.display = 'none'; return; }
      const p = o.at().project(c.camera);
      if (p.z > 1) { el.style.display = 'none'; return; }
      el.style.display = '';
      const x = (p.x * .5 + .5) * W, y = (-p.y * .5 + .5) * H;
      el.style.transform = o.l ? `translate(calc(${x}px - 100% + 7px),${y}px) translateY(-50%)` : `translate(${x - 7}px,${y}px) translateY(-50%)`;
    });
  }
  return {
    init, mount, unmount, select, quiz,
    examen() { if (cur) quiz(!cur.quiz); },
    girar() { if (!cur) return false; cur.controls.autoRotate = !cur.controls.autoRotate; return cur.controls.autoRotate; },
    setNombres(m) { modoNombres = m; },
    setSpeed(v) { speed = v; }
  };
})();
