// Motor 3D compartido por todos los componentes: escena, cámara, selección de piezas y etiquetas.
window.COMPONENTES = window.COMPONENTES || [];
window.Motor = (() => {
  const T = THREE, V = (x, y, z) => new T.Vector3(x, y, z);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let R, fig, labelsEl, info, cur = null, raf = 0, W = 1, H = 1, showLabels = true, speed = 1;
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
  const tube = (pts, r, m, parent) => add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 40, r, 8), m), parent);

  // Cada pieza tiene sus propios materiales para poder resaltarla sin afectar a las demás
  function part(mesh, id) {
    const pm = cur.pm[id] || (cur.pm[id] = new Map());
    const o = mesh.material; let m = pm.get(o.uuid);
    if (!m) { m = o.clone(); m.userData = { e0: o.emissive.clone(), i0: o.emissiveIntensity }; pm.set(o.uuid, m); }
    mesh.material = m; mesh.userData.part = id; cur.pick.push(mesh); return mesh;
  }
  function unpart(mesh) { const i = cur.pick.indexOf(mesh); if (i >= 0) cur.pick.splice(i, 1); }
  const mats = id => [...((cur && cur.pm[id]) || new Map()).values()];

  // ---------- selección ----------
  function pick(e) {
    const r = R.domElement.getBoundingClientRect();
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(ndc, cur.camera);
    const h = ray.intersectObjects(cur.pick, false).find(h => h.object.visible && !cur.hidden.has(h.object.userData.part));
    return h ? h.object.userData.part : null;
  }
  function select(id) {
    if (!cur || id === cur.sel) return;
    if (cur.sel) mats(cur.sel).forEach(m => { m.emissive.copy(m.userData.e0); m.emissiveIntensity = m.userData.i0; });
    cur.hidden.forEach(h => mats(h).forEach(m => { m.transparent = false; m.opacity = 1; m.depthWrite = true; m.needsUpdate = true; }));
    cur.hidden.clear();
    cur.sel = id;
    document.querySelectorAll('[data-p]').forEach(b => b.setAttribute('aria-pressed', b.dataset.p === id));
    if (!id) { info.hidden = true; return; }
    const p = cur.comp.partes[id];
    info.querySelector('b').textContent = p.t;
    info.querySelector('p').textContent = p.d;
    info.hidden = false;
    (p.ver || []).forEach(h => { cur.hidden.add(h); mats(h).forEach(m => { m.transparent = true; m.opacity = .14; m.depthWrite = false; m.needsUpdate = true; }); });
  }

  // ---------- ciclo de vida ----------
  function init(f) {
    fig = f; labelsEl = f.querySelector('.labels'); info = f.querySelector('.info');
    R = new T.WebGLRenderer({ antialias: true, alpha: true });
    R.setPixelRatio(Math.min(devicePixelRatio, 2));
    R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap; R.outputEncoding = T.sRGBEncoding;
    f.prepend(R.domElement);
    const ro = new ResizeObserver(resize); ro.observe(f);
    const cv = R.domElement; let down = null;
    cv.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
    cv.addEventListener('pointerup', e => {
      if (cur && down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 6) select(pick(e));
      down = null;
    });
    cv.addEventListener('pointermove', e => { if (!e.buttons && cur) cv.style.cursor = pick(e) ? 'pointer' : 'grab'; });
    info.querySelector('button').addEventListener('click', () => select(null));
    f.querySelector('.vr').addEventListener('click', () => { if (cur) { cur.camera.position.copy(cur.home.pos); cur.controls.target.copy(cur.home.tgt); } });
    labelsEl.addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b) select(b.dataset.p); });
    addEventListener('keydown', e => {
      if (!cur) return;
      if (e.key === 'Escape') select(null);
      if (e.code === 'Space' && cur.api.tecla && !/INPUT|BUTTON|A/.test(e.target.tagName)) { e.preventDefault(); cur.api.tecla(); }
    });
  }
  function resize() {
    W = fig.clientWidth; H = fig.clientHeight; if (!W || !H) return;
    R.setSize(W, H, false);
    if (cur) { cur.camera.aspect = W / H; cur.camera.fov = W < 600 ? 50 : 38; cur.camera.updateProjectionMatrix(); }
  }
  function unmount() {
    cancelAnimationFrame(raf);
    if (!cur) return;
    cur.controls.dispose();
    cur.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    cur = null; labelsEl.innerHTML = ''; info.hidden = true;
  }
  function mount(comp, el) {
    unmount();
    const scene = new T.Scene(), camera = new T.PerspectiveCamera(38, 1, .1, 200);
    const home = { pos: V(...comp.camara.pos), tgt: V(...comp.camara.tgt) };
    camera.position.copy(home.pos);
    const controls = new T.OrbitControls(camera, R.domElement);
    controls.target.copy(home.tgt); controls.enableDamping = true;
    controls.minDistance = 4; controls.maxDistance = 30; controls.maxPolarAngle = Math.PI * .62;

    scene.add(new T.HemisphereLight(0xffffff, 0x8890a0, .75));
    const sun = new T.DirectionalLight(0xffffff, .9);
    sun.position.set(6, 12, 8); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 }); scene.add(sun);
    const fill = new T.DirectionalLight(0xbfd4ff, .35); fill.position.set(-8, 4, -6); scene.add(fill);
    const sh = new T.Mesh(new T.PlaneGeometry(40, 40), new T.ShadowMaterial({ opacity: .18 }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = comp.suelo ?? -.52; sh.receiveShadow = true; scene.add(sh);

    cur = { comp, scene, camera, controls, home, el, pick: [], pm: {}, hidden: new Set(), sel: null, step: -1, clock: new T.Clock(), t: 0 };
    const ctx = { T, V, scene, camera, reduce, M, add, boxR, cyl, tube, part, unpart, step: setStep, select };
    cur.api = comp.build(ctx, el.panel);

    labelsEl.innerHTML = (cur.api.labels || []).map(o =>
      `<button class="lb${o.l ? ' l' : ''}" data-p="${o.p}" aria-pressed="false"><i></i><span>${o.txt || comp.partes[o.p].t}</span></button>`).join('');
    cur.lEls = [...labelsEl.children];
    el.chips.innerHTML = Object.entries(comp.partes).map(([id, p]) =>
      `<button class="chip" data-p="${id}" aria-pressed="false">${p.t}</button>`).join('');
    el.chips.onclick = e => { const b = e.target.closest('[data-p]'); if (b) select(b.dataset.p === cur.sel ? null : b.dataset.p); };
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
    if (c.sel) {
      const k = reduce ? .5 : .42 + .18 * Math.sin(performance.now() / 170);
      mats(c.sel).forEach(m => { m.emissive.setHex(0x2f8cff); m.emissiveIntensity = k; });
    }
    c.controls.update();
    R.render(c.scene, c.camera);
    if (!showLabels || !W) return;
    (c.api.labels || []).forEach((o, i) => {
      const p = o.at().project(c.camera), el = c.lEls[i];
      if (p.z > 1) { el.style.display = 'none'; return; }
      el.style.display = '';
      const x = (p.x * .5 + .5) * W, y = (-p.y * .5 + .5) * H;
      el.style.transform = o.l ? `translate(calc(${x}px - 100% + 7px),${y}px) translateY(-50%)` : `translate(${x - 7}px,${y}px) translateY(-50%)`;
    });
  }
  return {
    init, mount, unmount, select,
    setLabels(b) { showLabels = b; labelsEl.style.display = b ? '' : 'none'; },
    setSpeed(v) { speed = v; }
  };
})();
