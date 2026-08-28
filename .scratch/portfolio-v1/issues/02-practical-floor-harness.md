# 02: Practical Floor harness in CI

**What to build:** The six budgets in ADR-0001 stop being a document and become something that fails a build.
From this ticket onward, any change that breaches the Floor cannot merge.

This is deliberately the second ticket.
On a near-empty site it is an afternoon; after the clay and the Set-Piece exist, retrofitting it means unpicking work already done, and the Floor would lose the argument every time.

**Blocked by:** 01.

**Status:** done

- [x] Assertions run against the **production build**, not the dev server, because the budgets are properties of what ships.
- [x] LCP under 2.0s on a throttled mid-tier mobile profile.
- [x] Lighthouse accessibility score of 100, not 95.
- [x] Initial-route JavaScript at or under roughly 100KB gzipped.
- [x] With JavaScript disabled, page content is present in the served HTML.
- [x] With `prefers-color-scheme` untouched and `prefers-reduced-motion: reduce` set, no transition or animation runs and the page stays complete and legible.
- [x] Every interactive element is reachable by keyboard in a sensible order with a visible focus indicator.
- [x] The harness runs in CI and fails the build on any breach.
- [x] Every ticket after this one inherits "the Floor harness stays green" as an acceptance criterion.

## Comments

Implemented as `npm run test:floor`: a gzip-size check of every script the production `dist/index.html` references (`scripts/floor/bundle-size.mjs`), a Lighthouse run against Playwright's bundled Chromium using Lighthouse's default mobile/simulated-4G config for LCP and accessibility (`scripts/floor/lighthouse.mjs`), and three Playwright specs under `tests/floor/` for JS-disabled content, `prefers-reduced-motion` (with `prefers-color-scheme` explicitly left untouched), and keyboard tab order with a visible focus indicator.

The harness serves `./dist/` with `serve` rather than `astro preview`, since Astro 7's `preview` command now daemonizes and exits immediately, which breaks process supervision by `start-server-and-test`.

Wired into `.github/workflows/ci.yml` (runs on every pull request) and into `.github/workflows/deploy.yml` (runs before the Pages deploy), so a breach fails the build on both paths. Branch protection requiring the `ci.yml` check is a repo setting, not a code change, and is not configured by this ticket.

Running the harness against the walking skeleton caught a real defect: the page had no `<main>` landmark, which Lighthouse's accessibility audit flags. Fixed in `src/pages/index.astro` so the Floor is green going into ticket 03.
