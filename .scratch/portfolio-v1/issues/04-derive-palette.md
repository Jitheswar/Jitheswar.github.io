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

**Status:** done

- [x] A pure function. No DOM, no Astro, no rendering. Tested with Vitest.
- [x] It emits exactly the token contract defined in ticket 03.
- [x] Hue tracks the Source: two Sources of different dominant hue produce accents of different hue.
- [x] Saturation and lightness are pinned: a washed-out Source and a vivid one produce accents differing only in hue.
- [x] The ground-to-surface lightness gap is preserved for every Source.
- [x] Carve against surface is at least 4.5:1 for **every** Source. This test is the executable form of the accessibility budget.
- [x] Every returned token is a valid colour.
- [x] A degenerate Source, flat single colour, fully black, or fully white, returns a usable palette rather than throwing.

## Comments

Implemented as `derivePalette(pixels: Uint8ClampedArray): PaletteTokens` in `src/lib/derive-palette.ts`, taking flat RGBA data (the shape of `ImageData.data`) so the module stays DOM-free; the Set-Piece island in a later ticket owns the canvas and hands this module pixels.

Dominant hue is found by bucketing pixels into a quantized RGB grid, then picking the bucket with the highest saturation weighted by `sqrt(pixel count)`, so a small vivid region can outweigh a large dull background the way a real photo's subject does. A wholly achromatic Source (flat grey, black, or white) has no saturated bucket to prefer, so the most populous bucket wins instead, which always yields hue 0 and a valid, non-throwing palette.

All seven tokens (`ground`, `surface`, `ink`, `muted`, `accent`, `carve`, `shadow`) use the exact hue offsets and pinned saturation/lightness from `docs/adr/0002-set-piece-samples-hue-only.md`, plus `shadow`'s formula recorded in ticket 03's Comments. Tokens are emitted as `hsl(H S% L%)` strings, matching the custom-property format already in `src/styles/global.css`.

Tested with Vitest (`src/lib/derive-palette.test.ts`, 48 assertions): token-contract shape, hue-tracking across two Sources, the pinned-saturation/lightness invariant on a washed-out vs. vivid Source, the ground-to-surface gap and carve/surface contrast checked across 14 sampled hues around the full circle, colour validity, and the three named degenerate Sources (flat colour, black, white) all returning a usable, contrast-passing palette without throwing. Added `vitest` as a devDependency and a `vitest.config.ts` scoping Vitest to `src/**/*.test.ts` so it doesn't collide with Playwright's `tests/floor/*.spec.ts`; added `test`/`test:watch` npm scripts.

Reviewed with `/code-review` (Standards + Spec axes, both against `HEAD`): no hard violations and no spec gaps found on either axis. Acted on three judgement calls: named the per-token hue-offset constants instead of bare numeric literals, narrowed `derivePalette`'s input type from `Uint8ClampedArray | Uint8Array` to just `Uint8ClampedArray` since nothing produces the latter, and extended the degenerate-Source tests to assert the ground-to-surface gap explicitly rather than leaving it covered only implicitly by construction. `npm run typecheck`, `npm run test` (Vitest), and the full `npm run test:floor` (bundle size, Lighthouse, Playwright) all pass; the Floor harness stays green.
