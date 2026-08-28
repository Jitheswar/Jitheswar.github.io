# 03: Restrained Clay, tokens, surface, Carve, fonts

**What to build:** The material the whole site is made of.
After this ticket a page looks like the site rather than like unstyled HTML: warm mid-tone ground, surfaces that read as extruded from it, and type that is pleasant to read for 900 words.

Restrained Clay is a material, not a tone.
The palette is saturated and disciplined rather than pastel, because the work being presented is serious and the surface must not undercut it.

**Blocked by:** 01.

**Status:** ready-for-agent

- [ ] A token contract is defined and named: ground, surface, ink, muted, accent, carve, shadow. `derivePalette` in ticket 04 emits exactly this set, so the names are the interface between the two.
- [ ] A single reusable clay treatment, not repeated per component: dual shadow, outer dark and outer light, plus inner highlight and inner shadow.
- [ ] A pressed state that deforms inward rather than merely darkening.
- [ ] The ground-to-surface lightness gap is explicit and documented, because it is what makes the extrusion read at all.
- [ ] Carve: the name treatment, pressed into the sheet, rendered in a real ink colour and **measured at 4.5:1 or better against surface**. Transparent text carried by shadow is rejected; it cannot pass the Floor.
- [ ] Two variable fonts, one display and one text, **self-hosted and subset**, preloaded. No third-party font origin, per ADR-0001.
- [ ] One theme. No light and dark pair.
- [ ] The Floor harness stays green.
