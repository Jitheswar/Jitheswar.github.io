// Theme switching ---------------------------------------------------

const THEME_COLORS = { notebook: '#E6EAE7', sadie: '#171314', glass: '#0A0A0A' };

function applyTheme(name, save) {
  if (!THEME_COLORS[name]) return;
  document.documentElement.dataset.theme = name;
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
    try { localStorage.setItem('theme', name); } catch (e) { /* storage unavailable */ }
  }
}

document.querySelectorAll('[data-set-theme]').forEach((btn) => {
  btn.addEventListener('click', () => {
    applyTheme(btn.dataset.setTheme, true);
    alignNotes(); // note padding differs between themes
  });
});
applyTheme(document.documentElement.dataset.theme || 'notebook', false);

// Citations: light up a claim and its margin note together ----------

const wide = window.matchMedia('(min-width: 60rem)');

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

  // On wide screens the note is already beside the text, so a click pins the
  // highlight instead of jumping. On narrow screens the anchor scrolls to it.
  claim.addEventListener('click', (event) => {
    if (!wide.matches) return;
    event.preventDefault();
    document.querySelectorAll('.claim[data-pinned]').forEach((other) => {
      if (other === claim) return;
      delete other.dataset.pinned;
      other.classList.remove('is-lit');
      const n = document.getElementById(other.getAttribute('href').slice(1));
      if (n) n.classList.remove('is-lit');
    });
    if (claim.dataset.pinned) { delete claim.dataset.pinned; off(); }
    else { claim.dataset.pinned = '1'; on(); }
  });
});

// On wide screens, move each margin note down to the line of its claim --

function alignNotes() {
  document.querySelectorAll('.margin').forEach((margin) => {
    let floor = 0; // bottom edge of the previous note, relative to the margin column
    margin.querySelectorAll('.note').forEach((note) => {
      note.style.marginTop = '';
      if (!wide.matches) return;
      const claim = document.querySelector(`.claim[href="#${note.id}"]`);
      if (!claim || claim.closest('h1')) return;
      const top = margin.getBoundingClientRect().top;
      const want = claim.getBoundingClientRect().top - top - 4;
      const have = note.getBoundingClientRect().top - top;
      const shift = Math.max(0, want - Math.max(have, floor));
      note.style.marginTop = `${shift}px`;
      floor = note.getBoundingClientRect().bottom - top + 16;
    });
  });
}

alignNotes();
window.addEventListener('resize', alignNotes);
wide.addEventListener('change', alignNotes);
if (document.fonts) document.fonts.ready.then(alignNotes);

// Live star counts, with the static text as the fallback -------------

document.querySelectorAll('.stars[data-repo]').forEach(async (el) => {
  try {
    const res = await fetch(`https://api.github.com/repos/Jitheswar/${el.dataset.repo}`);
    if (!res.ok) return;
    const { stargazers_count: n } = await res.json();
    if (n > 0) el.textContent = `${n} ${n === 1 ? 'star' : 'stars'}`;
  } catch (e) { /* keep the fallback */ }
});
