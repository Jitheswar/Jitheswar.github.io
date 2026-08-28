# 05: Bento grid, physical response, 375px behaviour

**What to build:** The landing page as a bento: cells of varying weight that respond physically to touch, and that stay a bento on a phone instead of collapsing into an undifferentiated column.

Fun is a quality of interaction, not decoration.
Every interactive cell owes a physical response; decorative motion that exists only to be noticed does not qualify.

**Blocked by:** 03.

**Status:** ready-for-agent

- [ ] A four-column bento grid at desktop width, with cells spanning different widths and heights.
- [ ] Every interactive cell deforms inward under press, so the surface behaves like a material rather than a picture of one.
- [ ] At the mobile breakpoint the grid becomes **two columns with spans reassigned**, not merely fewer columns. Wide cells go full width while the light cells stay half width.
- [ ] At 375px at least one row contains two half-width cells. Reducing the column count alone produces a single column and does not satisfy this.
- [ ] Cell order at narrow widths reflects real priority, because on a phone order becomes hierarchy.
- [ ] The 375px layout assertion is added to the Floor harness from ticket 02.
- [ ] Under `prefers-reduced-motion`, press response is instant rather than animated, and the layout is unaffected.
- [ ] The Floor harness stays green.
