// Everything on the page that isn't the WebGL scene (scene.js) or a demo (demos.js).

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const wide = window.matchMedia('(min-width: 60rem)');

// Theme switching ---------------------------------------------------

const THEME_COLORS = { notebook: '#E6EAE7', sadie: '#171314', glass: '#0A0A0A' };

function applyTheme(name, save) {
  if (!THEME_COLORS[name]) return;
  root.dataset.theme = name;
  document.querySelectorAll('[data-set-theme]').forEach((btn) => {
    const on = btn.dataset.setTheme === name;
    btn.setAttribute('aria-pressed', String(on));
    if (btn.classList.contains('wear')) {
      btn.textContent = on ? 'This page is wearing it' : 'Use it on this page';
    }
  });
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = THEME_COLORS[name];
  if (save) {
    try { localStorage.setItem('theme-v2', name); } catch (e) { /* storage unavailable */ }
  }
}

document.querySelectorAll('[data-set-theme]').forEach((btn) => {
  btn.addEventListener('click', () => applyTheme(btn.dataset.setTheme, true));
});
applyTheme(root.dataset.theme || 'sadie', false);

// Citations: light up a claim and its note together ------------------

document.querySelectorAll('.claim').forEach((claim) => {
  const note = document.getElementById(claim.getAttribute('href').slice(1));
  if (!note) return;
  claim.setAttribute('aria-describedby', note.id);

  const on = () => { claim.classList.add('is-lit'); note.classList.add('is-lit'); };
  const off = () => {
    if (claim.dataset.pinned) return;
    claim.classList.remove('is-lit'); note.classList.remove('is-lit');
  };

  claim.addEventListener('mouseenter', on);
  claim.addEventListener('mouseleave', off);
  claim.addEventListener('focus', on);
  claim.addEventListener('blur', off);

  // The note sits just under the text, so a click pins the highlight
  // and brings the note into view without jumping the page to it.
  claim.addEventListener('click', (event) => {
    event.preventDefault();
    document.querySelectorAll('.claim[data-pinned]').forEach((other) => {
      if (other === claim) return;
      delete other.dataset.pinned;
      other.classList.remove('is-lit');
      const n = document.getElementById(other.getAttribute('href').slice(1));
      if (n) n.classList.remove('is-lit');
    });
    if (claim.dataset.pinned) { delete claim.dataset.pinned; off(); return; }
    claim.dataset.pinned = '1';
    on();
    note.scrollIntoView({ block: 'nearest', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  });
});

// Rise into place on first sight --------------------------------------

const revealEls = document.querySelectorAll('[data-reveal]');
if ('IntersectionObserver' in window && !reduceMotion.matches) {
  const seen = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      seen.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.02 });
  revealEls.forEach((el) => seen.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('in'));
}

// Cards tilt toward the pointer (mouse only) -----------------------------

if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('.tilt').forEach((card) => {
    let queued = false, ev = null;
    const update = () => {
      queued = false;
      const r = card.getBoundingClientRect();
      const x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
      card.style.setProperty('--ry', `${(x - 0.5) * 12}deg`);
      card.style.setProperty('--rx', `${(0.5 - y) * 10}deg`);
      card.style.setProperty('--mx', `${x * 100}%`);
      card.style.setProperty('--my', `${y * 100}%`);
    };
    card.addEventListener('pointermove', (e) => {
      if (reduceMotion.matches) return;
      ev = e;
      card.classList.add('is-tilting');
      if (!queued) { queued = true; requestAnimationFrame(update); }
    });
    card.addEventListener('pointerleave', () => {
      card.classList.remove('is-tilting');
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });
}

// Scroll-linked: the progress line, and screenshots tipping up from the floor --

const shots = Array.from(document.querySelectorAll('.shot'));
let scrollQueued = false;

function onScroll() {
  scrollQueued = false;
  const vh = window.innerHeight;
  const max = document.documentElement.scrollHeight - vh;
  root.style.setProperty('--scroll', max > 0 ? (window.scrollY / max).toFixed(4) : '0');

  if (reduceMotion.matches) return;
  shots.forEach((shot) => {
    const r = shot.getBoundingClientRect();
    if (r.bottom < -100 || r.top > vh + 100) return;
    // 0 when the top edge enters at the bottom of the screen, 1 once it has risen 60% of the way up.
    const t = Math.max(0, Math.min(1, (vh - r.top) / (vh * 0.6)));
    const e = 1 - (1 - t) * (1 - t);
    shot.style.setProperty('--tilt', ((1 - e) * (wide.matches ? 26 : 16)).toFixed(2));
    shot.style.setProperty('--sc', (0.9 + 0.1 * e).toFixed(3));
  });
}

window.addEventListener('scroll', () => {
  if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(onScroll); }
}, { passive: true });
window.addEventListener('resize', onScroll, { passive: true });
onScroll();

// Repository numbers: stars, forks and last activity ---------------------
// One request covers every repo. The text already in the page is the fallback.

function ago(iso) {
  const then = new Date(iso), days = Math.floor((Date.now() - then) / 864e5);
  if (days < 1) return 'Updated today';
  if (days < 2) return 'Updated yesterday';
  if (days < 14) return `Updated ${days} days ago`;
  if (days < 60) return `Updated ${Math.floor(days / 7)} weeks ago`;
  return `Updated ${then.toLocaleString('en', { month: 'short', year: 'numeric' })}`;
}

function showRepos(list) {
  const byName = {};
  list.forEach((r) => { byName[r.name.toLowerCase()] = r; });
  document.querySelectorAll('.repo[data-repo]').forEach((el) => {
    const r = byName[el.dataset.repo.toLowerCase()];
    if (!r) return;
    const parts = [];
    if (r.stars > 0) parts.push(`${r.stars} ${r.stars === 1 ? 'star' : 'stars'}`);
    if (r.forks > 0) parts.push(`${r.forks} ${r.forks === 1 ? 'fork' : 'forks'}`);
    if (r.pushed) parts.push(ago(r.pushed));
    el.textContent = '';
    parts.forEach((text) => {
      const span = document.createElement('span');
      span.textContent = text;
      el.appendChild(span);
    });
  });
}

(async () => {
  const KEY = 'repos-v1';
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (saved && Date.now() - saved.at < 36e5) { showRepos(saved.list); return; }
  } catch (e) { /* no storage */ }
  try {
    const res = await fetch('https://api.github.com/users/Jitheswar/repos?per_page=100');
    if (!res.ok) return;
    const list = (await res.json()).map((r) => ({ name: r.name, stars: r.stargazers_count, forks: r.forks_count, pushed: r.pushed_at }));
    showRepos(list);
    try { sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), list })); } catch (e) { /* no storage */ }
  } catch (e) { /* keep the fallback */ }
})();
