// One cloud of points that rearranges into a different shape for each section.
// Raw WebGL, one draw call, no library. Sections opt in with data-shape.

(() => {
  'use strict';

  const root = document.documentElement;
  const canvas = document.getElementById('scene');
  if (!canvas || !root.classList.contains('has-scene')) return;

  const gl = canvas.getContext('webgl', {
    alpha: true, antialias: false, depth: false, stencil: false,
    premultipliedAlpha: true, powerPreference: 'high-performance',
  });
  if (!gl) { root.classList.remove('has-scene'); return; }

  const TAU = Math.PI * 2;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const wide = matchMedia('(min-width: 60rem)');
  const coarse = matchMedia('(pointer: coarse)').matches;

  // Fewer points on phones and on machines that report little memory or few cores.
  const small = coarse || Math.min(innerWidth, innerHeight) < 700;
  const lowEnd = (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
                 (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
  const COUNT = small ? (lowEnd ? 7000 : 10000) : (lowEnd ? 14000 : 24000);

  // Shapes ------------------------------------------------------------

  let seed = 20260;
  const rnd = () => { // mulberry32, so every visit draws the same shapes
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const jit = (j) => (rnd() - 0.5) * 2 * j;
  const pick = (n) => Math.floor(rnd() * n);

  const onSphere = (r) => {
    const u = rnd() * 2 - 1, a = rnd() * TAU, s = Math.sqrt(1 - u * u);
    return [r * s * Math.cos(a), r * u, r * s * Math.sin(a)];
  };
  const seg = (a, b, j) => {
    const t = rnd();
    return [a[0] + (b[0] - a[0]) * t + jit(j), a[1] + (b[1] - a[1]) * t + jit(j), a[2] + (b[2] - a[2]) * t + jit(j)];
  };
  const tube = (a, b, r) => {
    const p = seg(a, b, 0), o = onSphere(r);
    return [p[0] + o[0], p[1] + o[1], p[2] + o[2]];
  };
  const torus = (R, r) => { // lies in the XY plane
    const u = rnd() * TAU, v = rnd() * TAU, k = R + r * Math.cos(v);
    return [k * Math.cos(u), k * Math.sin(u), r * Math.sin(v)];
  };
  const rotX = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c]; };
  const rotZ = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]]; };
  const add = (p, o) => [p[0] + o[0], p[1] + o[1], p[2] + o[2]];

  // A point on a box face. grid > 0 snaps one coordinate to a line, drawing a lattice.
  const boxFace = (hx, hy, hz, grid) => {
    const h = [hx, hy, hz], axis = pick(3), p = [0, 0, 0];
    const u = (axis + 1) % 3, v = (axis + 2) % 3;
    p[axis] = (rnd() < 0.5 ? -1 : 1) * h[axis];
    p[u] = (rnd() * 2 - 1) * h[u];
    p[v] = (rnd() * 2 - 1) * h[v];
    if (grid) {
      const k = rnd() < 0.5 ? u : v, step = (2 * h[k]) / grid;
      p[k] = Math.round(p[k] / step) * step;
    }
    return p;
  };
  const boxEdge = (hx, hy, hz) => {
    const h = [hx, hy, hz], axis = pick(3), p = [0, 0, 0];
    p[axis] = (rnd() * 2 - 1) * h[axis];
    p[(axis + 1) % 3] = (rnd() < 0.5 ? -1 : 1) * h[(axis + 1) % 3];
    p[(axis + 2) % 3] = (rnd() < 0.5 ? -1 : 1) * h[(axis + 2) % 3];
    return p;
  };
  const rectEdge = (w, h) => { // outline of a 2w by 2h rectangle
    const t = rnd() * (w + h) * 2;
    const s = rnd() < 0.5 ? -1 : 1;
    return t < w * 2 ? [t - w, s * h, 0] : [s * w, t - w * 2 - h, 0];
  };

  // The syntax tree: 15 nodes, four levels, each level fanning out on a new axis.
  const tree = (() => {
    const nodes = [[0, 0.95, 0]], edges = [];
    const spread = [0, 0.62, 0.36, 0.2], turn = [0, 0, 1.05, 2.1];
    let level = [0];
    for (let d = 1; d <= 3; d++) {
      const next = [];
      for (const parent of level) {
        for (const s of [-1, 1]) {
          const p = nodes[parent];
          nodes.push([p[0] + s * spread[d] * Math.cos(turn[d]), 0.95 - d * 0.6, p[2] + s * spread[d] * Math.sin(turn[d])]);
          edges.push([parent, nodes.length - 1]);
          next.push(nodes.length - 1);
        }
      }
      level = next;
    }
    return { nodes, edges };
  })();

  const leafWidth = (u) => (u <= 0 ? 0 : 0.5 * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.75)), 0.9));
  const leafPoint = (x, u) => rotZ([x, -0.85 + 1.7 * u, 0.4 * x * x - 0.14 * Math.sin(Math.PI * Math.max(u, 0))], -0.32);

  // Each shape is a list of [weight, sampler]. Samplers return one point within a radius of about 1.25.
  const SHAPES = {
    // A tick inside a ring: the page's claim is that you can check the work.
    check: [
      [0.27, () => tube([-0.6, 0.04, 0], [-0.2, -0.4, 0], 0.095)],
      [0.41, () => tube([-0.2, -0.4, 0], [0.6, 0.5, 0], 0.095)],
      [0.22, () => torus(1.06, 0.03)],
      [0.10, () => { const a = (pick(60) / 60) * TAU; return [1.24 * Math.cos(a) + jit(0.008), 1.24 * Math.sin(a) + jit(0.008), jit(0.008)]; }],
    ],
    // The web: a globe of latitude and longitude lines.
    globe: [
      [0.34, () => onSphere(0.95)],
      [0.29, () => { const lat = ((pick(9) + 0.5) / 9 - 0.5) * Math.PI, a = rnd() * TAU, r = 0.95 * Math.cos(lat); return [r * Math.cos(a), 0.95 * Math.sin(lat), r * Math.sin(a)]; }],
      [0.29, () => { const lon = (pick(12) / 12) * TAU, lat = (rnd() - 0.5) * Math.PI, r = 0.95 * Math.cos(lat); return [r * Math.cos(lon), 0.95 * Math.sin(lat), r * Math.sin(lon)]; }],
      [0.08, () => rotX(torus(1.22, 0.008), 1.15)],
    ],
    // A block, with a smaller one beside it.
    cube: [
      [0.28, () => boxEdge(0.62, 0.62, 0.62).map((v) => v + jit(0.008))],
      [0.38, () => boxFace(0.62, 0.62, 0.62, 4)],
      [0.18, () => boxFace(0.62, 0.62, 0.62, 0)],
      [0.16, () => add(rnd() < 0.5 ? boxEdge(0.2, 0.2, 0.2) : boxFace(0.2, 0.2, 0.2, 2), [0.92, 0.82, 0.25])],
    ],
    // A syntax tree.
    tree: [
      [0.48, () => { const i = pick(tree.nodes.length); return add(onSphere(i === 0 ? 0.11 : i < 7 ? 0.085 : 0.065), tree.nodes[i]); }],
      [0.52, () => { const e = tree.edges[pick(tree.edges.length)]; return seg(tree.nodes[e[0]], tree.nodes[e[1]], 0.007); }],
    ],
    // An eye: iris fibres, pupil, lids.
    eye: [
      [0.46, () => { const a = ((pick(84) + jit(0.2)) / 84) * TAU, r = 0.3 + 0.5 * Math.pow(rnd(), 0.8); return [r * Math.cos(a), r * Math.sin(a), 0.2 * (1 - (r / 0.8) * (r / 0.8))]; }],
      [0.10, () => add(torus(0.27, 0.014), [0, 0, 0.18])],
      [0.12, () => torus(0.82, 0.018)],
      [0.32, () => { const x = (rnd() * 2 - 1) * 1.3, y = 0.64 * Math.pow(1 - (x / 1.3) * (x / 1.3), 0.9); return [x, (rnd() < 0.5 ? -y : y) + jit(0.01), -0.06 + jit(0.01)]; }],
    ],
    // A chain of links, each one turned a quarter against the last.
    chain: [
      [1, () => { const k = pick(5), p = torus(0.3, 0.07); return rotZ(add(k % 2 ? [p[0], p[2], p[1]] : p, [(k - 2) * 0.44, 0, 0]), 0.5); }],
    ],
    // A leaf with a midrib and veins.
    leaf: [
      [0.33, () => { const u = rnd(); return leafPoint((rnd() * 2 - 1) * leafWidth(u), u); }],
      [0.20, () => { const u = rnd(); return leafPoint((rnd() < 0.5 ? -1 : 1) * leafWidth(u), u); }],
      [0.12, () => leafPoint(jit(0.006), -0.16 + 1.16 * rnd())],
      [0.35, () => { const u0 = (pick(7) + 1) / 9, t = rnd(), u = u0 + t * 0.15; return leafPoint((rnd() < 0.5 ? -1 : 1) * t * leafWidth(u) * 0.97, u); }],
    ],
    // A microcontroller: body, die, and a row of pins on each side.
    chip: [
      [0.20, () => boxEdge(0.6, 0.6, 0.06)],
      [0.14, () => add(rectEdge(0.3, 0.3), [0, 0, 0.07])],
      [0.14, () => boxFace(0.6, 0.6, 0.06, 6)],
      [0.44, () => { const side = pick(4), along = ((pick(8) - 3.5) / 8) * 1.08 + jit(0.012), out = 0.6 + rnd() * 0.3; return side < 2 ? [(side ? -1 : 1) * out, along, 0] : [along, (side === 2 ? -1 : 1) * out, 0]; }],
      [0.08, () => { const a = rnd() * TAU; return [-0.42 + 0.05 * Math.cos(a), 0.42 + 0.05 * Math.sin(a), 0.07]; }],
    ],
    // Three stacked windows.
    panes: [
      [0.52, () => { const k = pick(3) - 1; return add(rectEdge(0.75, 0.47), [k * 0.22, k * 0.14, k * 0.4]); }],
      [0.14, () => { const k = pick(3) - 1; return [(rnd() * 2 - 1) * 0.75 + k * 0.22, 0.33 + k * 0.14, k * 0.4]; }],
      [0.06, () => { const k = pick(3) - 1, a = rnd() * TAU; return [-0.64 + pick(3) * 0.085 + 0.022 * Math.cos(a) + k * 0.22, 0.4 + 0.022 * Math.sin(a) + k * 0.14, k * 0.4]; }],
      [0.28, () => { const k = pick(3) - 1; return [(rnd() * 2 - 1) * 0.75 + k * 0.22, -0.47 + rnd() * 0.8 + k * 0.14, k * 0.4]; }],
    ],
    // A spiral field for the sections with no object of their own.
    field: [
      [0.14, () => onSphere(0.2 * rnd())],
      [0.86, () => { const r = 0.15 + 1.2 * Math.sqrt(rnd()), a = pick(3) * (TAU / 3) + r * 2.6 + jit(0.45) * (1.2 - r * 0.6); return rotX([r * Math.cos(a), jit(0.06) * (1.5 - r), r * Math.sin(a)], 0.95); }],
    ],
  };
  const SPINS = { globe: 1, cube: 1, tree: 1, chain: 1 }; // solid shapes turn all the way round; flat ones sway

  function buildShape(name) {
    const parts = SHAPES[name] || SHAPES.field;
    const out = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      let r = rnd(), k = 0;
      while (k < parts.length - 1 && r > parts[k][0]) { r -= parts[k][0]; k++; }
      const p = parts[k][1]();
      out[i * 3] = p[0]; out[i * 3 + 1] = p[1]; out[i * 3 + 2] = p[2];
    }
    return out; // samplers are picked at random, so any prefix of the array is an even thinning
  }

  // Sections ----------------------------------------------------------

  const els = Array.from(document.querySelectorAll('[data-shape]'));
  if (!els.length) return;
  const names = [];
  els.forEach((el) => { if (!names.includes(el.dataset.shape)) names.push(el.dataset.shape); });

  const hex = (h) => {
    const m = /^#?([0-9a-f]{6})$/i.exec((h || '').trim());
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  };

  // Per theme: colour of the plain points, how opaque they are against the page, and how far to darken accents.
  const THEMES = {
    notebook: { base: [0.09, 0.13, 0.115], solid: 1, tone: 0.5, gain: 0.8, signal: hex('#2440C8') },
    sadie: { base: [0.70, 0.58, 0.50], solid: 0.12, tone: 1, gain: 0.9, signal: hex('#E08A63') },
    glass: { base: [0.62, 0.68, 0.72], solid: 0.12, tone: 1, gain: 0.9, signal: hex('#96CFE8') },
  };

  let scenes = [];
  let bounds = [];
  function measure() {
    const isWide = wide.matches;
    scenes = els.map((el) => {
      const d = el.dataset;
      const side = d.side || 'center';
      return {
        shape: names.indexOf(d.shape),
        x: !isWide ? 0 : d.x != null ? parseFloat(d.x) : side === 'right' ? 0.46 : side === 'left' ? -0.46 : 0,
        y: isWide ? parseFloat(d.y || 0) : parseFloat(d.yM || 0),
        alpha: isWide ? parseFloat(d.dim || 1) : parseFloat(d.dimM || d.dim || 1),
        scale: isWide ? parseFloat(d.scale || 1) : 1,
        accent: hex(d.accent),
        spin: SPINS[d.shape] ? 1 : 0,
      };
    });
    const y = window.scrollY;
    bounds = [];
    for (let i = 0; i < els.length - 1; i++) {
      // The hand-over is timed from the top of the next section, so any empty
      // stretch left at the end of this one is where the change is seen.
      bounds.push({ at: els[i + 1].getBoundingClientRect().top + y, same: scenes[i].shape === scenes[i + 1].shape });
    }
  }

  // Shape i holds until the next section starts to come up from the bottom of the screen,
  // and the new shape is finished by the time that section's text is a third of the way up.
  function progressAt(scrollY, vh) {
    const c = scrollY + vh * 0.94;
    let p = 0;
    for (let i = 0; i < bounds.length; i++) {
      // Moving the same object aside for its tiles is quick. Changing shape takes longer.
      const t = (c - bounds[i].at) / (vh * (bounds[i].same ? 0.38 : 0.64));
      p += t <= 0 ? 0 : t >= 1 ? 1 : t;
    }
    return p;
  }

  // GL ----------------------------------------------------------------

  const VERT = `
    attribute vec3 aFrom, aTo;
    attribute vec4 aSeed;
    uniform float uT, uTime, uAspect, uScale, uSize, uSpin, uTilt, uCalm;
    uniform vec2 uShift;
    varying float vAlpha, vMix;
    void main() {
      float t = clamp((uT - aSeed.x * 0.45) / 0.55, 0.0, 1.0);
      t = t * t * (3.0 - 2.0 * t);
      vec3 p = mix(aFrom, aTo, t);
      float burst = sin(t * 3.14159265);
      p += normalize(aSeed.yzw - 0.5 + 0.0001) * burst * (0.2 + 0.5 * aSeed.x) * uCalm;
      p += 0.012 * uCalm * vec3(sin(uTime * 0.9 + aSeed.y * 40.0), cos(uTime * 0.7 + aSeed.z * 40.0), sin(uTime * 0.8 + aSeed.w * 40.0));
      float a = uSpin + burst * 1.1 * (aSeed.y - 0.3) * uCalm;
      float c = cos(a), s = sin(a);
      p = vec3(p.x * c + p.z * s, p.y, p.z * c - p.x * s);
      c = cos(uTilt); s = sin(uTilt);
      p = vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c);
      float z = 4.2 - p.z;
      vec2 xy = p.xy * uScale * 2.4 / z;
      gl_Position = vec4(xy.x / uAspect + uShift.x, xy.y + uShift.y, 0.0, 1.0);
      gl_PointSize = uSize * (0.55 + 0.95 * aSeed.z) * 4.2 / z;
      vAlpha = (0.35 + 0.65 * aSeed.w) * clamp(1.3 - (z - 3.0) * 0.38, 0.22, 1.0);
      vMix = aSeed.x;
    }`;
  const FRAG = `
    precision mediump float;
    uniform vec3 uBase, uAccent;
    uniform float uAlpha, uSolid;
    varying float vAlpha, vMix;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.1, d) * vAlpha * uAlpha;
      vec3 col = mix(uBase, uAccent, step(0.38, vMix));
      gl_FragColor = vec4(col * a, a * uSolid);
    }`;

  let prog, U, locFrom, locTo, shapeBuf;
  let boundPair = '';

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  function setup() {
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);

    U = {};
    ['uT', 'uTime', 'uAspect', 'uScale', 'uSize', 'uSpin', 'uTilt', 'uCalm', 'uShift', 'uBase', 'uAccent', 'uAlpha', 'uSolid']
      .forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });

    seed = 20260;
    const all = new Float32Array(names.length * COUNT * 3);
    names.forEach((n, i) => all.set(buildShape(n), i * COUNT * 3));
    shapeBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, shapeBuf);
    gl.bufferData(gl.ARRAY_BUFFER, all, gl.STATIC_DRAW);
    locFrom = gl.getAttribLocation(prog, 'aFrom');
    locTo = gl.getAttribLocation(prog, 'aTo');
    gl.enableVertexAttribArray(locFrom);
    gl.enableVertexAttribArray(locTo);

    const seeds = new Float32Array(COUNT * 4);
    for (let i = 0; i < seeds.length; i++) seeds[i] = rnd();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
    const locSeed = gl.getAttribLocation(prog, 'aSeed');
    gl.enableVertexAttribArray(locSeed);
    gl.vertexAttribPointer(locSeed, 4, gl.FLOAT, false, 0, 0);

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    boundPair = '';
    return true;
  }

  // Sizing and quality --------------------------------------------------

  let dpr = Math.min(window.devicePixelRatio || 1, small ? 1.75 : 2);
  let drawCount = COUNT;
  let cssW = 0, cssH = 0;

  function resize(force) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    // Phone address bars change the height on every scroll. Ignore small changes so the buffer isn't reallocated.
    if (!force && w === cssW && Math.abs(h - cssH) < 140) return;
    cssW = w; cssH = h;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  // If the first second and a half runs slow, drop resolution, then points.
  let probeFrames = 0, probeTime = 0, steps = 0;
  function probe(dt) {
    if (steps >= 3) return;
    probeFrames++;
    if (probeFrames <= 20) return; // let shaders and fonts settle
    probeTime += dt;
    if (probeFrames < 80) return;
    const avg = probeTime / 60;
    probeFrames = 0; probeTime = 0;
    if (avg < 0.021) { steps = 3; return; }
    steps++;
    if (dpr > 1) { dpr = Math.max(1, dpr * 0.72); resize(true); }
    else drawCount = Math.max(3000, Math.round(drawCount * 0.6));
  }

  // Frame ---------------------------------------------------------------

  let P = 0, time = 0, last = 0, running = false, raf = 0;
  let lastScroll = window.scrollY, kick = 0;
  let ptrX = 0, ptrY = 0, px = 0, py = 0;
  const cur = { x: 0, y: 0, alpha: 0, scale: 1, spin: 0, accent: [1, 1, 1] };
  let liveKey = '';
  const lerp = (a, b, t) => a + (b - a) * t;

  function frame(now) {
    raf = 0;
    if (!running) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    const calm = reduce.matches;
    if (!calm) time += dt;
    resize(false);

    const y = window.scrollY, vh = window.innerHeight;
    const target = progressAt(y, vh);
    P = calm ? target : P + (target - P) * (1 - Math.exp(-dt * 7));

    const n = scenes.length;
    const i = Math.max(0, Math.min(n - 1, Math.floor(P)));
    const j = Math.min(n - 1, i + 1);
    const t = Math.max(0, Math.min(1, P - i));
    const e = t * t * (3 - 2 * t);
    const A = scenes[i], B = scenes[j];

    const pair = A.shape + ':' + B.shape;
    if (pair !== boundPair) {
      gl.bindBuffer(gl.ARRAY_BUFFER, shapeBuf);
      gl.vertexAttribPointer(locFrom, 3, gl.FLOAT, false, 0, A.shape * COUNT * 12);
      gl.vertexAttribPointer(locTo, 3, gl.FLOAT, false, 0, B.shape * COUNT * 12);
      boundPair = pair;
    }

    const theme = THEMES[root.dataset.theme] || THEMES.sadie;
    const accA = A.accent || theme.signal, accB = B.accent || theme.signal;
    const k = calm ? 1 : 1 - Math.exp(-dt * 6);
    cur.x = lerp(cur.x, lerp(A.x, B.x, e), k);
    cur.y = lerp(cur.y, lerp(A.y, B.y, e), k);
    cur.alpha = lerp(cur.alpha, lerp(A.alpha, B.alpha, e), k);
    cur.scale = lerp(cur.scale, lerp(A.scale, B.scale, e), k);
    cur.spin = lerp(A.spin, B.spin, e);
    for (let c = 0; c < 3; c++) cur.accent[c] = lerp(cur.accent[c], lerp(accA[c], accB[c], e), k);

    // A scroll flick gives the object a push that dies away.
    const vel = (y - lastScroll) / Math.max(dt, 0.001);
    lastScroll = y;
    kick += ((calm ? 0 : Math.max(-0.7, Math.min(0.7, vel * 0.00028))) - kick) * 0.08;
    px += (ptrX - px) * 0.06;
    py += (ptrY - py) * 0.06;

    const sway = 0.5 * Math.sin(time * 0.42);
    const turn = (time * 0.24) % TAU;
    const spin = lerp(sway, turn, cur.spin) + kick + px * 0.5 + (calm ? 0.45 : 0);

    const aspect = canvas.width / canvas.height;
    const isWide = wide.matches;
    const scale = isWide ? Math.min(1.05, 0.64 * aspect) : Math.min(1, 1.18 * aspect);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(U.uT, A.shape === B.shape ? 0 : t); // same object on both sides: only position and brightness change
    gl.uniform1f(U.uTime, time);
    gl.uniform1f(U.uAspect, aspect);
    gl.uniform1f(U.uScale, scale * cur.scale);
    gl.uniform1f(U.uSize, dpr * (small ? 2.1 : 2.4) * Math.max(0.85, Math.min(1.3, cssH / 900)));
    gl.uniform1f(U.uSpin, spin);
    gl.uniform1f(U.uTilt, 0.26 + py * 0.22);
    gl.uniform1f(U.uCalm, calm ? 0.35 : 1);
    gl.uniform2f(U.uShift, cur.x, cur.y);
    gl.uniform3f(U.uBase, theme.base[0], theme.base[1], theme.base[2]);
    gl.uniform3f(U.uAccent, cur.accent[0] * theme.tone, cur.accent[1] * theme.tone, cur.accent[2] * theme.tone);
    gl.uniform1f(U.uAlpha, cur.alpha * theme.gain);
    gl.uniform1f(U.uSolid, theme.solid);
    gl.drawArrays(gl.POINTS, 0, drawCount);

    // The page's glow follows the colour of the current object.
    const key = Math.round(cur.accent[0] * 255) + ' ' + Math.round(cur.accent[1] * 255) + ' ' + Math.round(cur.accent[2] * 255);
    if (key !== liveKey) { liveKey = key; root.style.setProperty('--live', key); }

    if (!calm) probe(dt);
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || document.hidden) return;
    running = true; last = 0;
    if (!raf) raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }

  // Wiring ----------------------------------------------------------------

  if (!setup()) { root.classList.remove('has-scene'); return; }
  measure();
  resize(true);
  P = progressAt(window.scrollY, window.innerHeight);
  start();

  let measureQueued = false;
  const remeasure = () => {
    if (measureQueued) return;
    measureQueued = true;
    requestAnimationFrame(() => { measureQueued = false; measure(); });
  };
  window.addEventListener('resize', remeasure, { passive: true });
  window.addEventListener('load', remeasure);
  wide.addEventListener('change', remeasure);
  if (window.ResizeObserver) new ResizeObserver(remeasure).observe(document.body);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);

  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  window.addEventListener('pointermove', (ev) => {
    if (ev.pointerType !== 'mouse') return;
    ptrX = (ev.clientX / window.innerWidth) * 2 - 1;
    ptrY = (ev.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  canvas.addEventListener('webglcontextlost', (ev) => { ev.preventDefault(); stop(); });
  canvas.addEventListener('webglcontextrestored', () => { if (setup()) { resize(true); start(); } });
})();
