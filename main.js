/* Portfolio scene: one set of cubes that rebuilds itself into a different model
   for each section. Raw WebGL2, no libraries. All motion runs in the vertex shader. */
(() => {
  'use strict';
  const doc = document.documentElement;
  doc.classList.add('js');

  const sections = [...document.querySelectorAll('.s')];
  const canvas = document.getElementById('gl');
  const rail = document.getElementById('rail');
  const cur = document.getElementById('cur');
  const debugAt = new URLSearchParams(location.search).get('s');
  const mqNarrow = matchMedia('(max-width: 860px), (orientation: portrait)');
  const mqDark = matchMedia('(prefers-color-scheme: dark)');
  const mqCalm = matchMedia('(prefers-reduced-motion: reduce)');
  const mqHover = matchMedia('(hover: hover) and (pointer: fine)');

  /* ---------- page chrome: rail, counter, reveals ---------- */
  document.getElementById('tot').textContent = String(sections.length - 1).padStart(2, '0');
  const railLinks = sections.map((s, i) => {
    const a = document.createElement('a');
    a.href = '#' + s.id;
    a.innerHTML = '<span>' + s.dataset.name + '</span>';
    a.setAttribute('aria-label', s.dataset.name);
    rail.appendChild(a);
    return a;
  });
  let active = -1;
  function setActive(i) {
    if (i === active) return;
    if (railLinks[active]) railLinks[active].classList.remove('on');
    active = i;
    railLinks[i].classList.add('on');
    cur.textContent = String(i).padStart(2, '0');
  }
  setActive(0);

  const io = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -18% 0px', threshold: 0.08 });
  sections.forEach((s) => io.observe(s));
  if (debugAt !== null) sections.forEach((s) => s.classList.add('in'));

  /* ---------- section geometry -> continuous scroll position ---------- */
  let centers = [];
  function measure() {
    centers = sections.map((s) => {
      const r = s.getBoundingClientRect();
      return r.top + scrollY + r.height / 2;
    });
  }
  function scrollPos() {
    const narrow = mqNarrow.matches;
    // the line the reader is looking at: mid-screen on desktop, mid text area on phones
    const y = scrollY + innerHeight * (narrow ? 0.66 : 0.5);
    const n = centers.length;
    if (y <= centers[0]) return 0;
    for (let i = 0; i < n - 1; i++) {
      if (y < centers[i + 1]) return i + (y - centers[i]) / (centers[i + 1] - centers[i]);
    }
    return n - 1;
  }

  /* ---------- WebGL ---------- */
  const gl = canvas.getContext('webgl2', { antialias: true, alpha: false, powerPreference: 'high-performance' });
  if (!gl) { // no WebGL2: the page still reads fine without the model
    canvas.remove();
    measure();
    addEventListener('resize', measure);
    addEventListener('scroll', () => setActive(Math.round(scrollPos())), { passive: true });
    return;
  }

  const small = Math.min(screen.width, screen.height) < 700 || (navigator.hardwareConcurrency || 4) <= 4;
  const N = small ? 3600 : 6400;

  /* ----- signed distance helpers ----- */
  const H = Math.hypot, mx = Math.max, mn = Math.min, ab = Math.abs;
  const box = (x, y, z, cx, cy, cz, hx, hy, hz) => {
    const dx = ab(x - cx) - hx, dy = ab(y - cy) - hy, dz = ab(z - cz) - hz;
    return mn(mx(dx, dy, dz), 0) + H(mx(dx, 0), mx(dy, 0), mx(dz, 0));
  };
  const cap = (x, y, z, ax, ay, az, bx, by, bz, r) => {
    const px = x - ax, py = y - ay, pz = z - az, ex = bx - ax, ey = by - ay, ez = bz - az;
    const h = mx(0, mn(1, (px * ex + py * ey + pz * ez) / (ex * ex + ey * ey + ez * ez)));
    return H(px - ex * h, py - ey * h, pz - ez * h) - r;
  };
  const tor = (x, y, z, R, r) => H(H(x, y) - R, z) - r;

  // tree for the compiler section
  const tree = (() => {
    const nodes = [], edges = [], hot = new Set([0, 2, 5, 12]); // one root-to-leaf path
    for (let d = 0, id = 0; d < 4; d++) for (let i = 0; i < 1 << d; i++, id++) {
      nodes.push([((i + 0.5) / (1 << d) - 0.5) * 1.9, 0.8 - d * 0.52, d ? (i % 2 ? 1 : -1) * 0.11 * d : 0, 0.15 - d * 0.022]);
      if (d) edges.push([id, ((id - 1) >> 1)]);
    }
    return { nodes, edges, hot };
  })();
  const treeD = (x, y, z, onlyHot) => {
    let d = 9;
    tree.nodes.forEach((n, i) => { if (!onlyHot || tree.hot.has(i)) d = mn(d, H(x - n[0], y - n[1], z - n[2]) - n[3]); });
    tree.edges.forEach(([a, b]) => {
      if (onlyHot && !(tree.hot.has(a) && tree.hot.has(b))) return;
      const p = tree.nodes[a], q = tree.nodes[b];
      d = mn(d, cap(x, y, z, p[0], p[1], p[2], q[0], q[1], q[2], 0.03));
    });
    return d;
  };
  const spots = [[0.3, 0.25, -1, 0.14], [-0.5, 0.12, -0.8, 0.1], [-0.08, -0.55, -0.8, 0.12], [0.6, -0.3, -0.7, 0.08]].map(([x, y, z, r]) => {
    const l = H(x, y, z) / 0.85; return [x / l, y / l, z / l, r];
  });

  /* ----- the models: d = distance, a = "is accent", rot = resting tilt ----- */
  const SHAPES = [
    { // monogram
      rot: [0.12, -0.5],
      d: (x, y, z) => mn(box(x, y, z, 0.04, 0.74, 0, 0.46, 0.13, 0.17), box(x, y, z, 0.22, 0.1, 0, 0.16, 0.62, 0.17),
        mx(ab(H(x + 0.1, y + 0.5) - 0.32) - 0.16, ab(z) - 0.17, y + 0.5)),
      a: (x, y) => y < -0.47 && x < -0.2,
    },
    { // browser: an eye, struck through
      rot: [0.08, -0.38],
      d: (x, y, z) => {
        const lens = mx(H(x, y - 0.85) - 1.25, H(x, y + 0.85) - 1.25);
        const eye = mx(mn(ab(lens + 0.08) - 0.065, H(x, y) - 0.2), ab(z) - 0.12);
        return mn(eye, box((x + y) * 0.7071, (x - y) * 0.7071, z, 0, 0, 0, 0.98, 0.055, 0.19));
      },
      a: (x, y, z) => box((x + y) * 0.7071, (x - y) * 0.7071, z, 0, 0, 0, 0.98, 0.055, 0.19) < 0.03,
    },
    { // operating system: layers, the AI one on top
      rot: [0.5, 0.62],
      d: (x, y, z) => mn(box(x, y, z, 0, -0.56, 0, 0.86, 0.05, 0.86), box(x, y, z, 0, -0.2, 0, 0.72, 0.05, 0.72),
        box(x, y, z, 0, 0.16, 0, 0.58, 0.05, 0.58), box(x, y, z, 0, 0.56, 0, 0.3, 0.09, 0.3)),
      a: (x, y) => y > 0.38,
    },
    { // compiler: a syntax tree with one path lit
      rot: [0.1, -0.42],
      d: (x, y, z) => treeD(x, y, z, false),
      a: (x, y, z) => treeD(x, y, z, true) < 0.025,
    },
    { // craftie: something it built
      rot: [0.36, 0.66],
      d: (x, y, z) => mn(box(x, y, z, 0, -0.38, 0, 0.62, 0.36, 0.48),
        mx((ab(x) * 0.78 + y - 0.56) / 1.27, ab(z) - 0.58, -0.02 - y), box(x, y, z, 0.36, 0.44, -0.15, 0.08, 0.22, 0.08)),
      a: (x, y, z) => z > 0.42 && ab(x) < 0.14 && y < -0.28,
    },
    { // knee MRI: a volume in slices, one finding
      rot: [0.18, 0.72],
      d: (x, y, z) => {
        let d = 9;
        for (let k = -2; k <= 2; k++) { const c = k * 0.36; d = mn(d, mx(ab(x - c) - 0.012, H(y, z) - Math.sqrt(0.84 - c * c))); }
        return d;
      },
      a: (x) => ab(x - 0.36) < 0.1,
    },
    { // retina: the back of the eye, with lesions
      rot: [0.12, -0.42],
      d: (x, y, z) => mx(ab(H(x, y, z) - 0.85) - 0.035, z - 0.1),
      a: (x, y, z) => spots.some((s) => H(x - s[0], y - s[1], z - s[2]) < s[3]),
    },
    { // onepass: one pass through every label
      rot: [0.26, -0.62],
      d: (x, y, z) => {
        let d = cap(x, y, z, -1.04, 0, 0, 1.04, 0, 0, 0.055);
        for (let k = -4; k <= 4; k++) d = mn(d, mx(ab(x - k * 0.21) - 0.025, mx(ab(y), ab(z)) - 0.42, 0.14 - H(y, z)));
        return d;
      },
      a: (x, y, z) => H(y, z) < 0.085,
    },
    { // audit log: a hash chain
      rot: [0.3, -0.34],
      d: (x, y, z) => {
        let d = 9;
        for (let k = 0; k < 5; k++) { const c = (k - 2) * 0.37; d = mn(d, k % 2 ? tor(x - c, z, y, 0.25, 0.07) : tor(x - c, y, z, 0.25, 0.07)); }
        return d;
      },
      a: (x) => ab(x) < 0.33,
    },
    { // upstream: one pin on someone else's chip
      rot: [0.92, 0.5],
      d: (x, y, z) => {
        let d = mn(box(x, y, z, 0, 0, 0, 0.55, 0.1, 0.55), box(x, y, z, 0, 0.13, 0, 0.24, 0.03, 0.24));
        for (let i = -3; i <= 3; i++) {
          d = mn(d, box(ab(x), y, z, 0.66, -0.04, i * 0.15, 0.11, 0.035, 0.04), box(x, y, ab(z), i * 0.15, -0.04, 0.66, 0.04, 0.035, 0.11));
        }
        return d;
      },
      a: (x, y, z) => x > 0.57 && ab(z - 0.15) < 0.07,
    },
    { // contact
      rot: [0.95, 0.2],
      d: (x, y, z) => mn(tor(x, z, y, 0.78, 0.085), H(x, y, z) - 0.18),
      a: (x, y, z) => H(x, y, z) < 0.3,
    },
  ];
  const S = SHAPES.length;

  /* ----- turn a distance function into at most N cubes on a grid ----- */
  const B = 1.16;
  function sample(sh, s, out) {
    const n = Math.ceil((2 * B) / s), o = -n * s / 2 + s / 2;
    let c = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) {
      const x = o + i * s, y = o + j * s, z = o + k * s, d = sh.d(x, y, z);
      if (d <= s * 0.3 && d > -s * 0.72) { if (out) out.push([x, y, z, sh.a(x, y, z) ? 2 : 1]); c++; }
    }
    return c;
  }
  function build(sh, data, base) {
    let s = 0.1, c = sample(sh, s);
    for (let it = 0; it < 7; it++) {
      const next = mx(0.03, s * Math.sqrt(c / N) * (c > N ? 1.03 : 1.015));
      if (ab(next - s) < 1e-4) break;
      s = next; c = sample(sh, s);
      if (c <= N && c > N * 0.9) break;
    }
    while (c > N) { s *= 1.03; c = sample(sh, s); }
    const pts = []; sample(sh, s, pts);
    pts.sort((p, q) => (Math.round(p[1] / 0.16) - Math.round(q[1] / 0.16)) || (Math.atan2(p[2], p[0]) - Math.atan2(q[2], q[0])));
    for (let i = 0; i < N; i++) {
      const p = i < c ? pts[i] : pts[(Math.random() * c) | 0], o = base + i * 4;
      data[o] = p[0]; data[o + 1] = p[1]; data[o + 2] = p[2]; data[o + 3] = i < c ? p[3] : 0;
    }
    sh.size = s * 0.86;
  }

  /* ----- shaders ----- */
  const VS = `#version 300 es
  precision highp float;
  layout(location=0) in vec3 aPos;
  layout(location=1) in vec3 aNrm;
  layout(location=2) in vec4 aA;
  layout(location=3) in vec4 aB;
  layout(location=4) in vec4 aRnd;
  uniform mat4 uProj; uniform mat3 uRot;
  uniform float uT, uSizeA, uSizeB, uScale, uCam, uAspect, uPtrOn, uCalm;
  uniform vec2 uShift, uPtr;
  out vec3 vN; out float vAcc; out float vFog; out float vTint;
  const float PI = 3.14159265;
  vec3 spin(vec3 v, vec3 k, float a){ float c = cos(a), s = sin(a); return v*c + cross(k,v)*s + k*dot(k,v)*(1.-c); }
  void main(){
    float t = clamp(uT*1.7 - aRnd.x*0.7, 0., 1.);
    float e = t*t*t*(t*(t*6.-15.)+10.);
    float arc = sin(e*PI) * uCalm;
    vec3 p = mix(aA.xyz, aB.xyz, e);
    float sw = arc * (0.5 + aRnd.y) * 1.1;
    p.xz = mat2(cos(sw), -sin(sw), sin(sw), cos(sw)) * p.xz;
    p *= 1. + arc * 0.28 * aRnd.z;
    p.y += arc * (aRnd.w - .5) * 0.3;
    float sc = mix(min(aA.w,1.)*uSizeA, min(aB.w,1.)*uSizeB, e) * (1. - .3*arc);
    vAcc = mix(step(1.5,aA.w), step(1.5,aB.w), e);

    // cubes lean away from the pointer
    vec4 c0 = uProj * vec4(uRot*p*uScale - vec3(0.,0.,uCam), 1.);
    vec2 nd = c0.xy/c0.w + uShift;
    float f = smoothstep(.42, 0., length((nd - uPtr)*vec2(uAspect,1.))) * uPtrOn;
    p += normalize(p + 1e-4) * f * .16;
    sc *= 1. - .45*f;

    vec3 ax = normalize(aRnd.yzw - .5);
    float an = arc * 2.6 * (aRnd.x - .5) + f * 1.2;
    vec3 n = uRot * spin(aNrm, ax, an);
    vec3 w = uRot * (p + spin(aPos, ax, an) * sc) * uScale - vec3(0.,0.,uCam);
    gl_Position = uProj * vec4(w, 1.);
    gl_Position.xy += uShift * gl_Position.w;
    vN = n;
    vFog = clamp((-w.z - uCam + .9) / 1.9, 0., 1.);
    vTint = aRnd.z;
  }`;
  const FS = `#version 300 es
  precision mediump float;
  in vec3 vN; in float vAcc; in float vFog; in float vTint;
  uniform vec3 uLo, uHi, uALo, uAHi, uBg;
  out vec4 o;
  void main(){
    float l = dot(normalize(vN), normalize(vec3(-.45,.8,.55)))*.5 + .5;
    l = pow(l, 1.6) * (.9 + .2*vTint);
    vec3 c = mix(mix(uLo,uHi,l), mix(uALo,uAHi,l), vAcc);
    o = vec4(mix(c, uBg, vFog*.55), 1.);
  }`;
  function shader(type, src) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  const U = {};
  for (const n of ['uProj', 'uRot', 'uT', 'uSizeA', 'uSizeB', 'uScale', 'uCam', 'uAspect', 'uPtrOn', 'uCalm', 'uShift', 'uPtr', 'uLo', 'uHi', 'uALo', 'uAHi', 'uBg'])
    U[n] = gl.getUniformLocation(prog, n);

  /* ----- buffers ----- */
  const cube = (() => { // 36 vertices: position + normal
    const v = [];
    const F = [[0, 0, 1], [0, 0, -1], [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0]];
    for (const n of F) {
      const u = n[0] ? [0, 1, 0] : [1, 0, 0];
      const w = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
      const q = [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]];
      for (const [a, b] of q) for (let i = 0; i < 3; i++) v.push((n[i] + u[i] * a + w[i] * b) * 0.5);
      // interleave later: keep normals in a parallel pass
    }
    const out = new Float32Array(36 * 6);
    for (let f = 0; f < 6; f++) for (let k = 0; k < 6; k++) {
      const i = f * 6 + k;
      out.set(v.slice(i * 3, i * 3 + 3), i * 6); out.set(F[f], i * 6 + 3);
    }
    return out;
  })();
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const cb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, cb); gl.bufferData(gl.ARRAY_BUFFER, cube, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);

  const rnd = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    rnd[i * 4] = 0.55 * Math.random() + 0.45 * (i / N); // stagger: roughly bottom to top
    rnd[i * 4 + 1] = Math.random(); rnd[i * 4 + 2] = Math.random(); rnd[i * 4 + 3] = Math.random();
  }
  const rb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, rb); gl.bufferData(gl.ARRAY_BUFFER, rnd, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(4); gl.vertexAttribPointer(4, 4, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(4, 1);

  const data = new Float32Array(S * N * 4);
  const sb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, sb);
  gl.enableVertexAttribArray(2); gl.vertexAttribDivisor(2, 1);
  gl.enableVertexAttribArray(3); gl.vertexAttribDivisor(3, 1);

  // build the first model now, the rest between frames so first paint is not held up
  build(SHAPES[0], data, 0);
  for (let i = 1; i < S; i++) { data.copyWithin(i * N * 4, 0, N * 4); SHAPES[i].size = SHAPES[0].size; }
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
  let pending = 1;
  function buildNext() {
    if (pending >= S) return;
    const i = pending++;
    build(SHAPES[i], data, i * N * 4);
    gl.bindBuffer(gl.ARRAY_BUFFER, sb);
    gl.bufferSubData(gl.ARRAY_BUFFER, i * N * 16, data, i * N * 4, N * 4);
    if (debugAt !== null) buildNext(); else setTimeout(buildNext, 30);
  }
  if (debugAt !== null) buildNext(); else setTimeout(buildNext, 60);

  let boundFrom = -1;
  function bindPair(from) {
    if (from === boundFrom) return;
    boundFrom = from;
    const to = Math.min(S - 1, from + 1);
    gl.bindBuffer(gl.ARRAY_BUFFER, sb);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 16, from * N * 16);
    gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 16, to * N * 16);
  }

  /* ----- theme ----- */
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  function theme() {
    const d = mqDark.matches;
    const bg = hex(d ? '#0e0e10' : '#efefec');
    gl.uniform3fv(U.uBg, bg);
    gl.uniform3fv(U.uLo, hex(d ? '#6b6860' : '#08080a'));
    gl.uniform3fv(U.uHi, hex(d ? '#f4f1e8' : '#4b4c54'));
    gl.uniform3fv(U.uALo, hex(d ? '#a32c08' : '#8f1f02'));
    gl.uniform3fv(U.uAHi, hex(d ? '#ff6a3a' : '#ff5a26'));
    gl.clearColor(bg[0], bg[1], bg[2], 1);
  }
  theme();
  mqDark.addEventListener('change', theme);

  /* ----- size and camera ----- */
  const CAM = 4.2, TAN = Math.tan((35 * Math.PI) / 360);
  let aspect = 1, rect = null;
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    let dpr = Math.min(devicePixelRatio || 1, 2);
    if (w * h * dpr * dpr > 3.4e6) dpr = Math.sqrt(3.4e6 / (w * h));
    canvas.width = Math.max(1, Math.round(w * dpr)); canvas.height = Math.max(1, Math.round(h * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    aspect = w / h;
    const f = 1 / TAN, near = 0.5, far = 12;
    gl.uniformMatrix4fv(U.uProj, false, [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, (2 * far * near) / (near - far), 0]);
    gl.uniform1f(U.uAspect, aspect);
    gl.uniform1f(U.uCam, CAM);
    const narrow = mqNarrow.matches;
    gl.uniform1f(U.uScale, CAM * TAN * Math.min(1, aspect) * (narrow ? 0.7 : 0.62));
    gl.uniform2f(U.uShift, narrow ? 0 : 0.04, narrow ? -0.1 : 0);
    rect = canvas.getBoundingClientRect();
    measure();
  }
  new ResizeObserver(resize).observe(canvas);
  addEventListener('resize', resize);
  addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  resize();

  /* ----- pointer ----- */
  const ptr = { x: 0, y: 0, sx: 0, sy: 0, on: 0, son: 0 };
  if (mqHover.matches) {
    addEventListener('pointermove', (e) => {
      if (!rect) return;
      ptr.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ptr.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      ptr.on = 1;
    }, { passive: true });
    document.addEventListener('pointerleave', () => { ptr.on = 0; });
  }

  /* ----- drag to rotate ----- */
  const drag = { on: false, id: 0, x: 0, y: 0, rx: 0, ry: 0, vx: 0, vy: 0, home: false, sec: 0 };
  const SENS = 0.0085;
  canvas.addEventListener('pointerdown', (e) => {
    if (e.button) return;
    drag.on = true; drag.home = false; drag.id = e.pointerId; drag.x = e.clientX; drag.y = e.clientY; drag.vx = drag.vy = 0;
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    canvas.classList.add('drag');
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag.on || e.pointerId !== drag.id) return;
    const dx = (e.clientX - drag.x) * SENS, dy = (e.clientY - drag.y) * SENS;
    drag.x = e.clientX; drag.y = e.clientY;
    drag.ry += dx; drag.rx = mx(-1.4, mn(1.4, drag.rx + dy));
    drag.vy = drag.vy * 0.5 + dx * 0.5; drag.vx = drag.vx * 0.5 + dy * 0.5;
  });
  const endDrag = (e) => { if (e.pointerId === drag.id) { drag.on = false; canvas.classList.remove('drag'); } };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  /* ----- frame loop ----- */
  gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE);
  let pos = 0, last = 0, started = false;
  const ss = (a, b, x) => { const t = mx(0, mn(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    const target = scrollPos();
    if (!started) { pos = target; started = true; canvas.classList.add('on'); }
    pos += (target - pos) * (1 - Math.exp(-dt * 7));
    if (ab(target - pos) < 0.0004) pos = target;
    setActive(Math.round(target));

    const from = Math.min(S - 1, Math.floor(pos)), to = Math.min(S - 1, from + 1);
    const t = ss(0.22, 0.78, pos - from);
    bindPair(from);

    const k = 1 - Math.exp(-dt * 5);
    ptr.sx += (ptr.x - ptr.sx) * k; ptr.sy += (ptr.y - ptr.sy) * k; ptr.son += ((drag.on ? 0 : ptr.on) - ptr.son) * k;

    // the reader's own rotation: coasts after release, eases home when the section changes
    const sec = Math.round(target);
    if (sec !== drag.sec) {
      drag.sec = sec;
      if (!drag.on) { drag.home = true; drag.ry -= Math.round(drag.ry / (2 * Math.PI)) * 2 * Math.PI; }
    }
    if (!drag.on) {
      if (drag.home) {
        drag.rx += -drag.rx * k; drag.ry += -drag.ry * k; drag.vx = drag.vy = 0;
        if (ab(drag.rx) + ab(drag.ry) < 0.001) { drag.rx = drag.ry = 0; drag.home = false; }
      } else {
        const fr = dt * 60, damp = Math.exp(-dt * 3.2);
        drag.ry += drag.vy * fr; drag.rx = mx(-1.4, mn(1.4, drag.rx + drag.vx * fr));
        drag.vx *= damp; drag.vy *= damp;
      }
    }

    const calm = mqCalm.matches, time = now / 1000;
    const A = SHAPES[from].rot, Bq = SHAPES[to].rot, e = ss(0, 1, t);
    const rx = A[0] + (Bq[0] - A[0]) * e + (calm ? 0 : Math.sin(time * 0.21) * 0.05) - ptr.sy * 0.14 * ptr.son + drag.rx;
    const ry = A[1] + (Bq[1] - A[1]) * e + (calm ? 0 : Math.sin(time * 0.27) * 0.3) + ptr.sx * 0.3 * ptr.son + drag.ry;
    const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry);
    // Rx * Ry, column-major
    gl.uniformMatrix3fv(U.uRot, false, [cy, sx * sy, -cx * sy, 0, cx, sx, sy, -sx * cy, cx * cy]);
    gl.uniform1f(U.uT, t);
    gl.uniform1f(U.uSizeA, SHAPES[from].size);
    gl.uniform1f(U.uSizeB, SHAPES[to].size);
    gl.uniform1f(U.uCalm, calm ? 0 : 1);
    gl.uniform2f(U.uPtr, ptr.sx, ptr.sy);
    gl.uniform1f(U.uPtrOn, ptr.son);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 36, N);
  }

  if (debugAt !== null) {
    measure();
    const i = Math.floor(+debugAt), fr = +debugAt - i;
    const y = centers[i] + (centers[Math.min(S - 1, i + 1)] - centers[i]) * fr - innerHeight * (mqNarrow.matches ? 0.66 : 0.5);
    doc.style.scrollBehavior = 'auto';
    scrollTo(0, y);
  }
  requestAnimationFrame(frame);
})();
