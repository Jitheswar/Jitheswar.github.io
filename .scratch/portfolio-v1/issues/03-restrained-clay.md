# 03: Restrained Clay, tokens, surface, Carve, fonts

**What to build:** The material the whole site is made of.
After this ticket a page looks like the site rather than like unstyled HTML: warm mid-tone ground, surfaces that read as extruded from it, and type that is pleasant to read for 900 words.

Restrained Clay is a material, not a tone.
The palette is saturated and disciplined rather than pastel, because the work being presented is serious and the surface must not undercut it.

**Blocked by:** 01.

**Status:** done

- [x] A token contract is defined and named: ground, surface, ink, muted, accent, carve, shadow. `derivePalette` in ticket 04 emits exactly this set, so the names are the interface between the two.
- [x] A single reusable clay treatment, not repeated per component: dual shadow, outer dark and outer light, plus inner highlight and inner shadow.
- [x] A pressed state that deforms inward rather than merely darkening.
- [x] The ground-to-surface lightness gap is explicit and documented, because it is what makes the extrusion read at all.
- [x] Carve: the name treatment, pressed into the sheet, rendered in a real ink colour and **measured at 4.5:1 or better against surface**. Transparent text carried by shadow is rejected; it cannot pass the Floor.
- [x] Two variable fonts, one display and one text, **self-hosted and subset**, preloaded. No third-party font origin, per ADR-0001.
- [x] One theme. No light and dark pair.
- [x] The Floor harness stays green.

## Comments

Implemented via Tailwind v4 (`@tailwindcss/vite`), with the token contract as a `@theme` block in `src/styles/global.css`: `ground`, `surface`, `ink`, `muted`, `accent`, `carve`, `shadow`, at the static default hue (22, copper) from the set-piece prototype, using the exact HSL formula from ADR-0002 for the six tokens it specifies. `shadow` isn't in that formula; it's a new hue-tracked mid-dark tone (`hsl(hue+6, 35%, 62%)`) used as the anchor for both outer-dark and inner-shadow layers, while outer-light and inner-highlight use plain white so the material keeps reading as clay regardless of hue. Ticket 04's `derivePalette` will need to emit this token to the same formula.

The clay treatment is one reusable `@utility clay` (background, radius, four-layer box-shadow) plus `@utility clay-pressable`, applied together only on real interactive elements so a reader clicking inside a static panel never sees it "press". Pressed state retracts the outer shadow and inverts/deepens the inner shadow rather than just darkening, gated with a deliberate `:focus-visible` ring in the accent colour rather than relying on the browser default.

Carve is `color: var(--color-carve)` (opaque, measured independently at 5.61:1 against surface, matching ADR-0002's 5.58:1) plus a text-shadow layered on top for texture, never the sole carrier of the letterforms.

Fonts are Fraunces Variable (display) and Inter Variable (text), both OFL-licensed, weight-axis-only, Latin-subset `.woff2` files pulled from the Fontsource npm builds and committed to `public/fonts/` (not loaded from Fontsource or Google at runtime), preloaded in `<head>`, referenced via `@font-face` with `unicode-range`.

No dark-mode media query exists; one theme only.

Reviewed with `/code-review` (Standards + Spec axes, both against `HEAD`): no hard violations and no spec gaps. Acted on two Standards judgement calls (explicit `:focus-visible` instead of relying on the implicit default outline; removed a couple of redundant Tailwind classes that re-asserted inherited values). Full `npm run test:floor` (bundle size, Lighthouse, and the three Playwright specs) passes: LCP 1504ms, Lighthouse accessibility 100, 0KB initial-route JS.
