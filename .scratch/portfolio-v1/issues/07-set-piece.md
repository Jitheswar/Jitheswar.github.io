# 07: The Set-Piece

**What to build:** The one moment of genuine delight on the site.
A reader picks a Source and the whole page takes its colour from it, which makes this site an instance of the idea behind `omarchy-liquid-glass-theme` rather than a container describing it.

There is at most one Set-Piece per screen and this is it.
The moving light source from prototype variant C is explicitly **not** built.

**Blocked by:** 04, 05.

**Status:** ready-for-agent

- [ ] Sources are content, so adding one is a content change and not a code change.
- [ ] Choosing a Source updates the palette custom properties on the document root. No re-render, no layout shift.
- [ ] The page recolours and **Restrained Clay still reads as clay** under every Source, because saturation and lightness never came from the Source.
- [ ] The Source canvas is decorative to assistive technology; the Source controls are labelled and keyboard operable.
- [ ] Under `prefers-reduced-motion`, the palette changes without transition and the Set-Piece still works.
- [ ] This island is the only JavaScript on the route, and the initial-route JS budget is still met. If it is not, the Set-Piece loses, per ADR-0001.
- [ ] The Floor harness stays green.
