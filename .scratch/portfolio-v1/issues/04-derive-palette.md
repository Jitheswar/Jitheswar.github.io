# 04: derivePalette and its invariant tests

**What to build:** The mechanism behind the Set-Piece, as a pure module with no DOM and no framework.
Pixels in, palette tokens out.

**It samples hue only.** Saturation and lightness are pinned in code.
This is not a shortcut, it is the decision: the prototype established that deriving the full palette from a Source collapses the ground-to-surface gap and Restrained Clay stops reading altogether.
See ADR-0002.

From `prototypes/set-piece.prototype.html` on branch `prototype/set-piece`, the decision itself:

```
hue      = dominant hue of the Source
accent   = hsl(hue,       0.58, 0.46)
ground   = hsl(hue + 6,   0.26, 0.845)
surface  = hsl(hue + 6,   0.30, 0.893)
ink      = hsl(hue + 340, 0.30, 0.13)
muted    = hsl(hue + 2,   0.14, 0.42)
carve    = hsl(hue + 4,   0.20, 0.34)
```

The 0.048 ground-to-surface lightness gap is what makes the extrusion read.
The carve lightness of 0.34 is what holds 5.58:1 against surface.

**Blocked by:** 03 (the token contract is the module's output shape).

**Status:** ready-for-agent

- [ ] A pure function. No DOM, no Astro, no rendering. Tested with Vitest.
- [ ] It emits exactly the token contract defined in ticket 03.
- [ ] Hue tracks the Source: two Sources of different dominant hue produce accents of different hue.
- [ ] Saturation and lightness are pinned: a washed-out Source and a vivid one produce accents differing only in hue.
- [ ] The ground-to-surface lightness gap is preserved for every Source.
- [ ] Carve against surface is at least 4.5:1 for **every** Source. This test is the executable form of the accessibility budget.
- [ ] Every returned token is a valid colour.
- [ ] A degenerate Source, flat single colour, fully black, or fully white, returns a usable palette rather than throwing.
