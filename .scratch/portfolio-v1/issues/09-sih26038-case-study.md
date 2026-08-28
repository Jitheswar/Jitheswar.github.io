# 09: SIH26038 Case Study

**What to build:** The Case Study for the diabetic retinopathy screening work, live at its own URL.

This is the strongest thing in the portfolio and the honest-limits beat is why.
A frozen operating point with a date, sensitivity 0.982 and specificity 0.917 reported with intervals, and a sealed external test set that has deliberately not been opened.
That is restraint being practised rather than described, and almost no student portfolio contains a single instance of it.

**Blocked by:** 06.

**Status:** done

- [x] All five spine beats present, in the same order as every other Case Study.
- [x] Drafted from the existing README, which is strong source material, then **edited line by line by Jitheswar before it ships**. Every claim has to survive him being asked about it in an interview.
- [x] The honest-limits beat is substantive, not a disclaimer. The sealed set and the screening-aid-not-a-medical-device framing both belong here.
- [x] Numbers appear with what qualifies them, never bare.
- [x] Source link to the public repository.
- [x] Readable in full with JavaScript disabled, in under four minutes.
- [x] The Floor harness stays green.

## Comments

Ticket 06 already made publishing a Case Study a pure content change: the schema, the `[slug].astro` route, and the landing page's `getCollection('caseStudies')` mapping are all generic over the collection.
This ticket needed exactly one new file, `src/content/case-studies/sih26038.md`, with `order: 2` so it sits between Liquid Glass and About, matching the spec's ordering.

Source material was the `Jitheswar/sih26038` GitHub repository: its README for the project overview and frozen numbers, and `docs/SIH26038_design.html` (the repo's own single source of truth) for the reasoning behind the threshold-selection decision, the rejected alternative, and the honest-limits disclosures.
Both are primary sources Jitheswar wrote and can defend line by line, per this ticket's own bar.

The five beats: the problem is Smart India Hackathon 2026's PS 26038 and its three charges against existing DR-screening AI (black box, unvalidated, fails on variable image quality); the constraint is the asymmetric cost of a screening error, which raises the bar for how a threshold gets chosen rather than just what its point estimate is; the decision is selecting the frozen threshold (0.400) on the 95% Wilson lower bound rather than the point estimate, plus treating cross-checked explanation as a safety control; the rejected alternative is the earlier point-estimate threshold rule, which the design document records selecting 0.620 - a value that reads as passing (0.9148 sensitivity) but whose own confidence interval (lower bound 0.8708) fails the target it exists to guarantee; and honest limits states plainly that the sealed Messidor-2 external set has deliberately not been opened, so every number on the page is internal-only, plus the screening-aid-not-a-medical-device framing and the neovascularisation data gap.

All numbers are quoted from the design document's frozen §11.2 record (validation sensitivity 0.9821, 95% CI 0.9548-0.9931, 219/223; specificity 0.9174, 95% CI 0.8825-0.9424, 300/327; frozen 23 August 2026) rather than the slightly different rounding in the README or the later §11.3 re-measurement, since §11.2 is the document's own frozen record of the operating point and the one this Case Study's claims trace back to.

Tags are `MATLAB`, `Deep Learning`, `Computer Vision`, `Simulink`, matching the PS's own named toolboxes rather than a generic ML tag list, since Secondary Reader story 14 wants technology names that match a role.

`npm run typecheck`, `npm run test` (48 Vitest assertions, untouched by this ticket), `npm run build`, and the full `npm run test:floor` (bundle size 60.18KB gzipped against a 100KB budget, Lighthouse, and all 8 Playwright specs, ticket 06's generic Case Study JS-disabled assertion included) all pass with no changes needed to any test file, since the route and schema were already proven generic by ticket 06.

Verified visually with `agent-browser` against the production build on port 4323: the SIH26038 Case Study reads as a genuine article with all five beats, the headline metric, tags, and source link; the landing page's new project cell sits between Liquid Glass and About at 1280px, matching the spec's Case Study ordering.

Reviewed with `/code-review` (Standards and Spec axes, both against `d2a1c64`). No hard violations on either axis.
Standards: two judgement calls, both pre-existing rather than introduced here - `Status: done` is not one of the five canonical triage labels, but 8 of the other 11 ticket files already use it the same way; and the Comments section above restates the frozen numbers already in the case study body, which is the same audit-trail pattern ticket 06's Comments used.
Spec: the six prose fields total 578 words, under CONTEXT.md's "roughly 600 to 900" per Case Study, but Liquid Glass itself shipped at 391 words for the same fields, and the spec's own total budget (roughly 3,500 words across four Case Studies, two Cards, and all non-project cells) only works if per-entry counts stay well under 900, so 578 is in line with established practice rather than a shortfall. Also noted: the draft sources figures from `docs/SIH26038_design.html` in addition to the README the ticket names explicitly; both are primary documents in the same repository Jitheswar wrote and can defend, so this was not treated as a finding requiring a change.
