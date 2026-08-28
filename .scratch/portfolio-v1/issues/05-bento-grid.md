# 05: Bento grid, physical response, 375px behaviour

**What to build:** The landing page as a bento: cells of varying weight that respond physically to touch, and that stay a bento on a phone instead of collapsing into an undifferentiated column.

Fun is a quality of interaction, not decoration.
Every interactive cell owes a physical response; decorative motion that exists only to be noticed does not qualify.

**Blocked by:** 03.

**Status:** done

- [x] A four-column bento grid at desktop width, with cells spanning different widths and heights.
- [x] Every interactive cell deforms inward under press, so the surface behaves like a material rather than a picture of one.
- [x] At the mobile breakpoint the grid becomes **two columns with spans reassigned**, not merely fewer columns. Wide cells go full width while the light cells stay half width.
- [x] At 375px at least one row contains two half-width cells. Reducing the column count alone produces a single column and does not satisfy this.
- [x] Cell order at narrow widths reflects real priority, because on a phone order becomes hierarchy.
- [x] The 375px layout assertion is added to the Floor harness from ticket 02.
- [x] Under `prefers-reduced-motion`, press response is instant rather than animated, and the layout is unaffected.
- [x] The Floor harness stays green.

## Comments

Implemented as a plain CSS Grid via Tailwind utilities directly on `src/pages/index.astro`: `grid grid-cols-2 gap-6 md:grid-cols-4` on a `[data-bento-grid]` container, with each cell independently spanning columns and (for the Hero) rows at both breakpoints (e.g. Hero is `col-span-2 md:col-span-2 md:row-span-2`, Now/Design are `col-span-1` at every width). No `grid-auto-flow: dense` and no `order` overrides: DOM order is the single priority order used at every width, so tab order, reading order, and mobile hierarchy are always the same sequence and never fight each other. Desktop auto-placement is left to the browser's default row-major flow rather than hand-placed with `grid-column`/`grid-row`, matching this ticket's scope of proving the grid mechanism rather than final visual polish.

This ticket's content collections (ticket 06) and the six project entries don't exist yet, so the grid is exercised with the seven **non-project** cells that ticket 08 is explicitly scoped to convert from markup to content: Hero, Experience, About, Now, Design, Stack, Contact. Priority order is Hero, Experience (the only third-party validation besides the Liquid Glass stars, per the spec), About, Now, Design, Stack, Contact. Now and Design are adjacent half-width cells, which is what produces the paired row at 375px; once Cards land in ticket 12 they join that half-width group per the spec's mobile layout rule. Copy for About/Now/Design/Stack is intentionally minimal (no fabricated stack list or bio) since ticket 08 owns that content; Experience and Contact use the exact facts and address already fixed by the spec, since inventing different placeholder facts there would be worse than the real ones.

Press deformation reuses ticket 03's `clay`/`clay-pressable` utilities unchanged, applied to the two cells that are genuinely interactive right now (the Hero GitHub link and the Contact mailto link) rather than added to every placeholder cell; non-interactive cells stay plain `clay` panels so a reader clicking inside one never sees it "press," per ticket 03's own rule. Because `clay-pressable`'s `:active` transform isn't gated behind the `prefers-reduced-motion: no-preference` media query that only guards the `transition`, press is already instant under reduced motion with no change needed here, and the grid's spans are plain CSS Grid with no motion dependency, so layout is unaffected too.

The 375px assertion is a new Playwright spec, `tests/floor/bento-layout.spec.ts`, written first and confirmed red against the single pre-ticket hero cell (timed out waiting for a `[data-bento-grid]` that didn't exist yet), then green once the grid landed. It sets a 375×900 viewport, groups cell bounding boxes into rows by shared `top`, and asserts at least one row holds exactly two cells of roughly half the grid container's width (20% tolerance, to absorb the gap) at different `left` offsets, which is only possible if spans were actually reassigned rather than the grid merely losing columns.

Verified visually with `agent-browser` at 1280px and 375px: the desktop grid reads as a genuine bento (Hero large, Experience wide, About/Now/Design/Stack/Contact varying), and the mobile grid keeps the same variation with Now and Design paired.

`npm run typecheck`, `npm run test` (48 Vitest assertions, untouched by this ticket), and the full `npm run test:floor` (bundle size, Lighthouse, and all five Playwright specs including the new one) pass: LCP 1505ms, Lighthouse accessibility 100, 0KB initial-route JS.
