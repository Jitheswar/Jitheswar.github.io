# 02: Practical Floor harness in CI

**What to build:** The six budgets in ADR-0001 stop being a document and become something that fails a build.
From this ticket onward, any change that breaches the Floor cannot merge.

This is deliberately the second ticket.
On a near-empty site it is an afternoon; after the clay and the Set-Piece exist, retrofitting it means unpicking work already done, and the Floor would lose the argument every time.

**Blocked by:** 01.

**Status:** ready-for-agent

- [ ] Assertions run against the **production build**, not the dev server, because the budgets are properties of what ships.
- [ ] LCP under 2.0s on a throttled mid-tier mobile profile.
- [ ] Lighthouse accessibility score of 100, not 95.
- [ ] Initial-route JavaScript at or under roughly 100KB gzipped.
- [ ] With JavaScript disabled, page content is present in the served HTML.
- [ ] With `prefers-color-scheme` untouched and `prefers-reduced-motion: reduce` set, no transition or animation runs and the page stays complete and legible.
- [ ] Every interactive element is reachable by keyboard in a sensible order with a visible focus indicator.
- [ ] The harness runs in CI and fails the build on any breach.
- [ ] Every ticket after this one inherits "the Floor harness stays green" as an acceptance criterion.
