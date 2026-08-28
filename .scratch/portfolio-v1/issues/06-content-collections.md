# 06: Content collections and the first Case Study

**What to build:** Publishing a Case Study becomes writing one content file.
Liquid Glass goes live at its own URL, readable in full with JavaScript disabled.

The schema is where the five-beat spine stops being a convention and becomes structural.
A Case Study missing its honest-limits beat should not build, because that beat is the strongest thing on the page and the easiest to skip when tired.

Liquid Glass goes first on purpose: 15 stars and 3 forks make it the only work here with third-party validation.

**Blocked by:** 03.

**Status:** done

- [x] A Case Study collection with a schema requiring: title, one-line claim, optional headline metric, problem, constraint, decision, rejected alternative, honest limits, source URL, tags, order.
- [x] A Case Study missing its honest-limits beat **fails the build**. Demonstrate this.
- [x] A Card collection, deliberately thin: title, one-line claim, source URL, tags, order.
- [x] Ordering is a field, not file order, so reordering never means editing markup.
- [x] The Liquid Glass Case Study is live at its own stable URL, linkable and sendable.
- [x] Its full body is present in the served HTML with JavaScript disabled.
- [x] The route ships no island. A Case Study is static.
- [x] The Floor harness stays green.

## Comments

Both collections use Astro's content layer API: `src/content.config.ts` at the src root, loading Markdown frontmatter via `glob()` from `src/content/case-studies/` and `src/content/cards/`.
The five-beat spine plus claim, headline metric, source URL, tags, and order live as required Zod fields, not as freeform Markdown body, which is what makes the schema structural rather than a convention: a Case Study author cannot publish one that is missing a beat, because Zod rejects it before the page ever renders.
The Zod schemas themselves live in a separate `src/content/schemas.ts`, importing only `astro/zod` rather than the `astro:content` virtual module, so they are a pure seam importable straight into Vitest with no Astro plugin required, the same pattern ticket 04 established for `derivePalette`.

The honest-limits build failure was demonstrated manually, with no permanent test added for it, since the spec's Testing Decisions section is explicit and unqualified that content schema validity is enforced by Zod at build time and "needs no separate test."
An earlier draft of this ticket added a Vitest assertion against the schema for exactly this case; on review that was removed as a hard Standards violation of that same rule, since a schema-validity test is still a schema-validity test regardless of which module it imports from.
`honestLimits` was stripped from `liquid-glass.md`, `npm run build` was run and failed with `[InvalidContentEntryDataError] caseStudies -> liquid-glass data does not match collection schema` and `honestLimits: Required`, exit code 1, then the field was restored and the build re-run to confirm exit code 0.

The Liquid Glass Case Study is served at `/case-studies/liquid-glass/` via `src/pages/case-studies/[slug].astro`, a single dynamic route using `getStaticPaths()` over `getCollection('caseStudies')`.
Every future Case Study is exactly one new Markdown file; the route, the schema, and the landing-page cell all read from the collection already, so nothing beyond ticket 09/10/11's content files should need to change to publish them.
The route has no `client:*` directive anywhere, so it ships no island; `npm run test:floor:bundle` still reports 0KB gzipped initial-route JS.

`src/pages/index.astro` now reads both collections with `getCollection`, sorts by the `order` field, and maps Case Studies (and, once ticket 12 lands, Cards) into bento cells, inserted after Experience and before About: projects are the content this portfolio exists to surface, ranked ahead of the softer About/Now/Design/Stack cells but behind the one existing piece of third-party validation (Experience) that ticket 05's Comments already established goes second.
The Card collection has no content yet (ticket 12), so `getCollection('cards')` currently returns `[]`; Astro logs a harmless `console.warn` ("does not exist or is empty") for the empty directory during build, which does not fail the build and will disappear once ticket 12 adds a Card file.
Common page chrome (head, fonts, favicon, body class) was pulled out of `index.astro` into `src/layouts/BaseLayout.astro`, since the Case Study route now needs the identical shell and duplicating it was the actual cost of adding one page, not a hypothetical one.

Discovered along the way: `--color-muted` (hsl(_, 14%, 42%)), pinned in both `global.css` and `derivePalette`'s `MUTED_HUE_OFFSET` formula per the spec's own numbers, measures 4.18:1 against surface, short of the 4.5:1 AA text threshold, and Lighthouse's accessibility audit failed at 90 the first time this ticket used it for real foreground text (the headline metric and tag chips).
The spec's invariant list only requires 4.5:1 for Carve against surface, never for muted, so this is not a regression this ticket introduced into a previously-passing guarantee, but it does mean `--color-muted` is not presently safe to use for any real text on the page.
Fixed narrowly by using `text-ink` instead in both new views rather than retuning the pinned palette formula, since changing it would mean re-deriving ADR-0002's numbers and is a decision for whichever ticket next needs muted text, not this one.

Added one Playwright assertion to the existing `tests/floor/js-disabled.spec.ts` (rather than a new file) for the Case Study route specifically, checking the "Honest limits" heading text and the `<h1>` are present with JavaScript disabled, since the homepage-only assertion already in that file did not cover the new route ticket 06 introduces.

Verified visually with `agent-browser` against the production build on port 4323: the Liquid Glass Case Study reads as a genuine article with all five beats and the source link, the landing page's new project cell sits between Experience and About at both 1280px and 375px, and the 375px bento still pairs Now and Design at half width per ticket 05.

`npm run typecheck`, `npm run test` (48 Vitest assertions, ticket 04's `derivePalette` suite, untouched by this ticket), and the full `npm run test:floor` (bundle size, Lighthouse, and all five Playwright specs) pass: LCP 1506ms, Lighthouse accessibility 100, 0KB initial-route JS.

Reviewed with `/code-review` (Standards and Spec axes, both against `main`). One hard Standards violation: `src/content/schemas.test.ts` duplicated the build-time schema guarantee the spec's "Not tested" section explicitly rules out; removed, leaving the manual build demonstration as the sole evidence. One Spec finding: this Comments section had misattributed the Experience-second cell ordering to "ticket 08's Comments" (ticket 08 is not yet implemented and has no Comments section); corrected to ticket 05, which is where that ordering was actually established.
