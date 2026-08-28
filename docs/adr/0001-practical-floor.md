# The Practical Floor outranks any visual effect

This site's design language is Restrained Clay, and soft extruded shadows, blur, and simultaneous motion across a bento grid are among the most expensive things a browser paints.
Left unbudgeted, that cost degrades quietly: it is invisible on the developer's machine and lands entirely on the Secondary Reader skimming on a mid-tier phone.
We therefore fixed a Practical Floor up front, and made it outrank the design rather than the other way round.

## The Floor

A build must pass all six:

1. **LCP under 2.0s** on a simulated mid-tier Android over 4G. Not measured on desktop.
2. **Lighthouse accessibility 100.** Not 95.
3. **`prefers-reduced-motion` fully honoured**, with a static fallback that is good in its own right rather than a broken version of the animated one.
4. **Full keyboard navigation**, with a visible focus indicator on every interactive element.
5. **Core content readable with JavaScript disabled.** The case studies are the product and must not depend on JS to exist.
6. **Roughly 100KB gzipped JS** for the initial route.

## Consequences

An effect that cannot fit inside the Floor loses.
The Floor is never relaxed to admit an effect, which is the entire point of writing it down before the effects exist and become things we are attached to.

Two technology choices follow directly and are not independently motivated:

- **Astro** over Next.js or a Vite SPA, because it ships zero JS by default. The Floor is then the default state rather than something defended every sprint.
- **Self-hosted, subset fonts** over Google Fonts, because a third-party font origin adds a connection and a render-blocking dependency that the LCP budget cannot absorb.
