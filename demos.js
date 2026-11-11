// Three small demos that run in the visitor's browser. Each one computes something real:
// what a page can observe, a SHA-256 hash chain, and NexCC's own regex-to-DFA pipeline.
// A demo stays hidden unless the browser can run it.

(() => {
  'use strict';
  const $ = (sel, el) => (el || document).querySelector(sel);
  const make = (tag, cls, text) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text != null) el.textContent = text;
    return el;
  };

  // Run fn the first time el comes near the screen.
  const whenNear = (el, fn) => {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); fn(); }
    }, { rootMargin: '800px 0px' });
    io.observe(el);
  };

  // 1. JithuBrowser: what this page can see ----------------------------------

  const probe = $('#demo-probe');
  if (probe) {
    probe.hidden = false;
    const cell = (k) => $(`[data-k="${k}"]`, probe);
    let left = 0, blurred = 0, hiddenAt = 0, away = 0;

    const showVis = () => {
      cell('vis').textContent = left ? `${left}, away ${Math.round(away / 1000)} s in total` : '0 so far';
      cell('vis').classList.toggle('hit', left > 0);
    };
    const showFocus = () => {
      cell('focus').textContent = blurred ? String(blurred) : '0 so far';
      cell('focus').classList.toggle('hit', blurred > 0);
    };
    const showWin = () => {
      cell('win').textContent = `${window.outerWidth} × ${window.outerHeight} at ${window.screenX}, ${window.screenY}`;
    };

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { left++; hiddenAt = Date.now(); }
      else if (hiddenAt) { away += Date.now() - hiddenAt; hiddenAt = 0; }
      showVis();
    });
    window.addEventListener('blur', () => { blurred++; showFocus(); });
    window.addEventListener('resize', showWin, { passive: true });

    showVis(); showFocus(); showWin();
    cell('hist').textContent = String(history.length);
    cell('auto').textContent = String(navigator.webdriver === true);

    // A canvas drawing comes out slightly differently on each GPU, driver and font stack.
    try {
      const c = document.createElement('canvas');
      c.width = 220; c.height = 40;
      const g = c.getContext('2d');
      const grad = g.createLinearGradient(0, 0, 220, 40);
      grad.addColorStop(0, '#e08a63'); grad.addColorStop(1, '#2440c8');
      g.fillStyle = grad; g.fillRect(0, 0, 220, 40);
      g.font = '18px Georgia, serif'; g.fillStyle = '#fff';
      g.fillText('Jitheswar ✓ fingerprint', 6, 26);
      g.beginPath(); g.arc(200, 20, 12, 0, 5); g.strokeStyle = 'rgba(0,0,0,.5)'; g.stroke();
      const data = c.toDataURL();
      let h = 0x811c9dc5;
      for (let i = 0; i < data.length; i++) { h ^= data.charCodeAt(i); h = Math.imul(h, 0x01000193); }
      cell('canvas').textContent = (h >>> 0).toString(16).padStart(8, '0');
    } catch (e) {
      cell('canvas').textContent = 'blocked';
    }

    // Gaps between key presses, in milliseconds. Phone keyboards often hide the key, so count input events too.
    const input = $('#probe-type');
    const gaps = [];
    let lastKey = 0;
    input.addEventListener('input', (ev) => {
      const now = ev.timeStamp;
      if (lastKey && now - lastKey < 2000) gaps.push(Math.round(now - lastKey));
      lastKey = now;
      if (gaps.length > 6) gaps.shift();
      if (gaps.length) {
        cell('keys').textContent = gaps.join(', ') + ' ms';
        cell('keys').classList.add('hit');
      }
    });
  }

  // 2. Agent spend policy engine: a tamper-evident log ---------------------------

  const chain = $('#demo-chain');
  if (chain && window.crypto && crypto.subtle && window.TextEncoder) {
    chain.hidden = false;
    const list = $('#chain-list'), out = $('#chain-out');
    const START = [
      { agent: 'research-bot', item: 'weather API call', amount: '0.01', decision: 'allowed' },
      { agent: 'research-bot', item: 'company lookup', amount: '0.05', decision: 'allowed' },
      { agent: 'shopping-bot', item: 'bulk data export', amount: '40.00', decision: 'blocked' },
      { agent: 'research-bot', item: 'weather API call', amount: '0.01', decision: 'allowed' },
      { agent: 'shopping-bot', item: 'company lookup', amount: '0.05', decision: 'allowed' },
    ];
    const GENESIS = '0'.repeat(64);
    let entries = [];

    const sha = async (text) => {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
    };
    const body = (e) => [e.agent, e.item, e.amount, e.decision].join('|');

    const draw = (badIndex) => {
      list.textContent = '';
      entries.forEach((e, i) => {
        const li = make('li');
        if (badIndex != null) li.className = i < badIndex ? 'ok' : i === badIndex ? 'bad' : 'after';
        const top = make('p', 'chain-top');
        top.append(make('b', null, `#${i + 1}`), make('span', null, `${e.agent}: ${e.item}`), make('span', 'chain-amt' + (e.changed ? ' changed' : ''), `$${e.amount} ${e.decision}`));
        li.append(top, make('p', 'chain-hash', `prev ${e.prev.slice(0, 10)}… hash ${e.hash.slice(0, 10)}…`));
        list.appendChild(li);
      });
    };

    const reset = async () => {
      entries = [];
      let prev = GENESIS;
      for (const s of START) {
        const e = Object.assign({}, s, { prev });
        e.hash = await sha(prev + body(e));
        prev = e.hash;
        entries.push(e);
      }
      draw();
      out.textContent = 'Five decisions, each one hashed together with the hash before it.';
      out.className = 'demo-out';
    };

    const verify = async () => {
      let prev = GENESIS;
      for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        if (e.prev !== prev || (await sha(prev + body(e))) !== e.hash) {
          draw(i);
          out.textContent = `Verification failed at entry #${i + 1}. Its contents no longer match its hash, so it was changed after it was written.`;
          out.className = 'demo-out bad';
          return;
        }
        prev = e.hash;
      }
      draw(entries.length);
      out.textContent = `All ${entries.length} entries verified. Every hash matches its contents and the entry before it.`;
      out.className = 'demo-out ok';
    };

    $('#chain-tamper').addEventListener('click', () => {
      // Quietly turn the blocked payment into an allowed one, or inflate an amount, without touching the hashes.
      const fresh = entries.filter((e) => !e.changed);
      if (!fresh.length) return;
      const e = fresh.find((x) => x.decision === 'blocked') || fresh[Math.floor(Math.random() * fresh.length)];
      if (e.decision === 'blocked') e.decision = 'allowed';
      else e.amount = (parseFloat(e.amount) * 100).toFixed(2);
      e.changed = true;
      draw();
      out.textContent = `Entry #${entries.indexOf(e) + 1} was edited in place. The hashes were left alone. Now verify.`;
      out.className = 'demo-out';
    });
    $('#chain-verify').addEventListener('click', verify);
    $('#chain-reset').addEventListener('click', reset);
    reset();
  }

  // 3. NexCC: regex to NFA to DFA to minimized DFA --------------------------------

  const nx = $('#demo-nexcc');
  if (nx) {
    const re = $('#nx-re'), str = $('#nx-str'), out = $('#nx-out'), graph = $('#nx-graph');
    const NS = 'http://www.w3.org/2000/svg';
    const svgEl = (tag, attrs) => {
      const el = document.createElementNS(NS, tag);
      for (const k in attrs) el.setAttribute(k, attrs[k]);
      return el;
    };

    // "a,b,c,d" becomes "a-d" so an edge labelled with a character class stays short.
    const label = (symbols) => {
      const chars = symbols.slice().sort();
      const parts = [];
      for (let i = 0; i < chars.length;) {
        let j = i;
        while (j + 1 < chars.length && chars[j + 1].length === 1 && chars[j].length === 1 &&
               chars[j + 1].charCodeAt(0) === chars[j].charCodeAt(0) + 1) j++;
        parts.push(j - i >= 2 ? `${chars[i]}-${chars[j]}` : chars.slice(i, j + 1).join(','));
        i = j + 1;
      }
      const text = parts.join(',');
      return text.length > 12 ? text.slice(0, 11) + '…' : text;
    };

    const drawDfa = (dfa) => {
      graph.textContent = '';
      const n = dfa.states.length;
      if (n > 9) {
        graph.appendChild(make('p', 'demo-note', `The minimized DFA has ${n} states, too many to draw at this size.`));
        return;
      }
      const W = 380, H = 250, cx = W / 2, cy = H / 2 + 4, r = 15;
      const R = n === 1 ? 0 : Math.min(92, 46 + n * 9);
      const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `Minimized DFA with ${n} states` });
      const defs = svgEl('defs', {});
      const marker = svgEl('marker', { id: 'nx-arrow', viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' });
      marker.appendChild(svgEl('path', { d: 'M0 0L10 5L0 10z', class: 'nx-head' }));
      defs.appendChild(marker);
      svg.appendChild(defs);

      // Start state at the left, the rest clockwise.
      const order = dfa.states.slice().sort((a, b) => (b.isStart ? 1 : 0) - (a.isStart ? 1 : 0) || a.id - b.id);
      const pos = {}, ang = {};
      order.forEach((s, i) => {
        const a = Math.PI + (i / n) * Math.PI * 2;
        ang[s.id] = a;
        pos[s.id] = [cx + R * 1.5 * Math.cos(a), cy + R * Math.sin(a)];
      });

      const groups = {};
      dfa.transitions.forEach((t) => {
        const k = t.from + '>' + t.to;
        (groups[k] = groups[k] || { from: t.from, to: t.to, symbols: [] }).symbols.push(t.symbol);
      });

      Object.keys(groups).forEach((k) => {
        const g = groups[k], a = pos[g.from], b = pos[g.to];
        let d, lx, ly;
        if (g.from === g.to) {
          const t = n === 1 ? -Math.PI / 2 : ang[g.from];
          const p = (o, dist) => [a[0] + dist * Math.cos(t + o), a[1] + dist * Math.sin(t + o)];
          const s = p(-0.45, r), e = p(0.45, r), c1 = p(-0.6, r + 34), c2 = p(0.6, r + 34);
          d = `M${s[0]} ${s[1]}C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${e[0]} ${e[1]}`;
          [lx, ly] = p(0, r + 36);
        } else {
          const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
          const bend = groups[g.to + '>' + g.from] ? 20 : 9;
          const c = [(a[0] + b[0]) / 2 - (dy / len) * bend, (a[1] + b[1]) / 2 + (dx / len) * bend];
          const trim = (p, toward) => {
            const l = Math.hypot(toward[0] - p[0], toward[1] - p[1]) || 1;
            return [p[0] + ((toward[0] - p[0]) / l) * (r + 2), p[1] + ((toward[1] - p[1]) / l) * (r + 2)];
          };
          const s = trim(a, c), e = trim(b, c);
          d = `M${s[0]} ${s[1]}Q${c[0]} ${c[1]} ${e[0]} ${e[1]}`;
          lx = 0.25 * s[0] + 0.5 * c[0] + 0.25 * e[0] - (dy / len) * 9;
          ly = 0.25 * s[1] + 0.5 * c[1] + 0.25 * e[1] + (dx / len) * 9;
        }
        svg.appendChild(svgEl('path', { d, class: 'nx-edge', 'marker-end': 'url(#nx-arrow)' }));
        const text = svgEl('text', { x: lx, y: ly, class: 'nx-label' });
        text.textContent = label(g.symbols);
        svg.appendChild(text);
      });

      order.forEach((s) => {
        const p = pos[s.id];
        if (s.isStart) svg.appendChild(svgEl('path', { d: `M${p[0] - r - 22} ${p[1]}L${p[0] - r - 3} ${p[1]}`, class: 'nx-edge', 'marker-end': 'url(#nx-arrow)' }));
        svg.appendChild(svgEl('circle', { cx: p[0], cy: p[1], r, class: 'nx-state' + (s.isAccept ? ' accept' : '') }));
        if (s.isAccept) svg.appendChild(svgEl('circle', { cx: p[0], cy: p[1], r: r - 4, class: 'nx-ring' }));
        const text = svgEl('text', { x: p[0], y: p[1], class: 'nx-name' });
        text.textContent = 'q' + s.id;
        svg.appendChild(text);
      });
      graph.appendChild(svg);
    };

    const run = () => {
      const lab = window.NexCCAutomata;
      if (!lab) return;
      try {
        const { nfa, dfa, minDfa } = lab.compileRegexPipeline(re.value);
        const min = minDfa.toJSON();
        const ok = minDfa.simulate(str.value);
        const agree = nfa.simulate(str.value) === ok && dfa.simulate(str.value) === ok;
        out.textContent = '';
        out.className = 'demo-out';
        out.append(
          make('span', null, `NFA ${nfa.getStates().length} states → DFA ${dfa.toJSON().states.length} → minimized ${min.states.length}. `),
          make('b', ok ? 'ok' : 'bad', `"${str.value}" is ${ok ? 'accepted' : 'rejected'}`),
          make('span', null, agree ? ' by all three machines.' : ' (the three machines disagree, which would be a bug).'),
        );
        drawDfa(min);
      } catch (e) {
        out.textContent = String(e.message || e);
        out.className = 'demo-out bad';
        graph.textContent = '';
      }
    };

    // The demo is hidden until its code has loaded, so watch its panel instead.
    whenNear(nx.parentElement, () => {
      const s = document.createElement('script');
      s.src = 'nexcc-automata.js';
      s.onload = () => {
        nx.hidden = false;
        let timer = 0;
        const later = () => { clearTimeout(timer); timer = setTimeout(run, 120); };
        re.addEventListener('input', later);
        str.addEventListener('input', later);
        run();
      };
      document.head.appendChild(s);
    });
  }
})();
