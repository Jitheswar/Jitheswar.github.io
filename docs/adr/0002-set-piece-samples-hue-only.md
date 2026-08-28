# The Set-Piece is palette sampling, and it samples hue only

The site's one Set-Piece is a Source image from which the page derives its palette, which makes the site an instance of the idea behind `omarchy-liquid-glass-theme` rather than a container for it.
Three hero treatments were prototyped (`prototypes/set-piece.prototype.html`, branch `prototype/set-piece`) and the winner is a composite: the Carve from variant C as the material treatment for the name, and variant A's sampling as the Set-Piece.

## Only the hue is sampled

Saturation and lightness are pinned in code; the Source contributes a hue and nothing else.

This is not an implementation shortcut, it is the mechanism.
The first prototype derived the full palette from the Source and produced `#73492d`, a dead brown, with ground and surface collapsing to the same value so the clay extrusion stopped reading altogether.
Pinning S and L and taking only the hue produced `#b96431` from the same warm Source, near-identical to the intended copper, and `#3150b9` from a cool one, with the clay relationships intact in both.

Restrained Clay depends on a fixed lightness gap between ground and surface.
A Source is arbitrary and cannot be trusted to preserve that gap, so it is never allowed to set it.

## Consequences

- Changing the Source changes the page's hue and nothing else. This is the entire visible effect and it is deliberately narrow.
- The Carve is a coloured deboss, not transparent text carried by shadow. The prototype's first version failed contrast; the fixed version measures **5.58:1** against the surface, which clears AA. A transparent-text deboss cannot be used, because it cannot pass the accessibility budget in ADR-0001.
- Variant C's moving light source was **not** adopted. `CONTEXT.md` permits at most one Set-Piece per screen, and sampling is it.
