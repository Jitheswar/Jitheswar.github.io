# Portfolio v1

Status: ready-for-agent

## Problem Statement

Jitheswar has twenty public repositories and no way for anyone to tell which four matter.
The work that would actually get him hired is invisible: a calibrated screening model with a sealed test set nobody has opened, a CVE prioritiser that re-ranks by runtime reachability, a spend policy engine paying real money on testnet, and a desktop theme that fifteen strangers starred.
GitHub shows all twenty flat, ordered by push date, described in one line each.

The Primary Reader, the engineer running a technical screen, wants one question answered: were the interesting decisions this candidate's own?
A repository list cannot answer that.
The Secondary Reader, the recruiter screening first, bounces off a page that requires twenty minutes to understand.

Meanwhile the only link on the GitHub profile points at LinkedIn.

## Solution

A static site at `jitheswar.github.io` presenting six selected projects: four as Case Studies and two as Cards, laid out as a bento grid in Restrained Clay.

Depth is one click away and the shape of it is identical every time, so a reader who finishes one Case Study knows exactly where to look in the next.
The Secondary Reader gets enough surface signal not to bounce, and a resume link to forward.
The Primary Reader gets the honest limits beat in every Case Study, which is the part almost no student portfolio contains.

The site carries one Set-Piece: the page derives its palette hue from a Source image, which makes the site an instance of the idea behind `omarchy-liquid-glass-theme` rather than a container for it.
Every interactive element responds physically to input.
All of it sits inside the Practical Floor, which outranks any effect.

## User Stories

### Primary Reader

1. As a Primary Reader, I want each Case Study to follow the same five beats, so that I can find the decision beat immediately without re-reading the structure.
2. As a Primary Reader, I want to read the constraint that made a project hard, so that I can tell whether the problem was real or assigned.
3. As a Primary Reader, I want to see the alternative that was rejected and why, so that I can judge whether a genuine trade-off was made.
4. As a Primary Reader, I want honest numbers with their limits stated, so that I can trust the numbers that are claimed.
5. As a Primary Reader, I want a link to the source for every project, so that I can verify any claim myself.
6. As a Primary Reader, I want to know which parts of a team project were the author's, so that I am not guessing at attribution.
7. As a Primary Reader, I want the SIH26038 Case Study to state that the sealed test set is unopened, so that I can see restraint being practised rather than described.
8. As a Primary Reader, I want a Case Study to be readable in under four minutes, so that I can read all four inside a screening slot.
9. As a Primary Reader, I want to reach any Case Study from the landing page in one click, so that depth is never buried.
10. As a Primary Reader, I want each Case Study at its own stable URL, so that I can send a colleague a link to the specific one.
11. As a Primary Reader, I want to see the Liquid Glass star and fork counts stated plainly, so that I can weigh the one project with external validation.
12. As a Primary Reader, I want Cards to be visibly shallower than Case Studies, so that I know at a glance where the depth is.

### Secondary Reader

13. As a Secondary Reader, I want to understand what this person does within ten seconds of landing, so that I can decide whether to forward the link.
14. As a Secondary Reader, I want the technology names visible without reading prose, so that I can match against a role.
15. As a Secondary Reader, I want a resume I can download and attach, so that I can put it into an applicant system.
16. As a Secondary Reader, I want the whole site to work on my phone, so that I can screen while away from a desk.
17. As a Secondary Reader, I want a contact route that takes one tap, so that reaching out is not a task.
18. As a Secondary Reader, I want the location and study status visible, so that I can check eligibility before going further.

### Reading on a phone

19. As a Reader on a 375px screen, I want the bento to stay a bento, so that the page does not degrade into an undifferentiated column of identical blocks.
20. As a Reader on a 375px screen, I want the most important cells first, so that narrow-screen order reflects real priority.
21. As a Reader on a mid-tier Android over 4G, I want the page to become useful in under two seconds, so that I do not abandon it.
22. As a Reader on a phone, I want every tappable target to be large enough to hit, so that I am not fighting the interface.

### Accessibility and resilience

23. As a Reader who has set `prefers-reduced-motion`, I want a static presentation that is good in its own right, so that I get a designed experience rather than a broken one.
24. As a Reader using a keyboard, I want to reach every interactive element in a sensible order, so that I never have to use a pointer.
25. As a Reader using a keyboard, I want a clearly visible focus indicator, so that I always know where I am.
26. As a Reader with JavaScript disabled or failed, I want every Case Study readable in full, so that the content does not depend on scripts to exist.
27. As a Reader with low vision, I want all text including the Carve to meet contrast requirements, so that nothing on the page is decoration I cannot read.
28. As a Reader using a screen reader, I want the Set-Piece controls labelled and the canvas treated as decorative, so that the Set-Piece does not become noise.
29. As a Reader, I want headings in a correct hierarchy, so that I can navigate the page structurally.

### The Set-Piece

30. As a Reader, I want to choose a Source and see the page take its colour from it, so that the site demonstrates the idea it describes.
31. As a Reader, I want the palette to remain legible whichever Source I choose, so that the Set-Piece cannot produce an unreadable page.
32. As a Reader, I want Restrained Clay to keep reading as clay under every Source, so that the material does not collapse when the hue changes.
33. As a Reader with reduced motion set, I want the Source change to apply without transition, so that the Set-Piece still works without animating.
34. As a Reader, I want each interactive cell to respond physically to press, so that the surface feels like a material rather than a picture of one.

### Experience and credentials

42. As a Secondary Reader, I want an internship stated with employer, dates, and what was built, so that I can confirm professional experience exists before forwarding.
43. As a Primary Reader, I want the internship's technical substance and its number, so that I can ask about it specifically rather than treating it as a line item.
44. As a Reader, I want the resume to agree with the site about which work matters, so that the two do not appear to describe different people.

### Author

35. As the author, I want to add a Case Study by writing one content file, so that publishing does not require touching layout code.
36. As the author, I want malformed Case Study content to fail the build, so that a broken entry never reaches the site.
37. As the author, I want a build that fails when the Practical Floor is breached, so that the budgets are enforced rather than remembered.
38. As the author, I want deployment to happen on push to main, so that publishing is not a manual procedure.
39. As the author, I want to swap in a custom domain later by changing configuration only, so that buying `jitheswar.dev` costs no rework.
40. As the author, I want the hero line changeable in one place, so that committing to a role later is cheap.
41. As the author, I want project ordering expressed as data, so that reordering does not mean editing markup.

## Implementation Decisions

### Framework and build

- **Astro**, static output, package manager **npm**. Chosen in ADR-0001 because it ships zero JavaScript by default, which makes the Practical Floor the default state rather than something defended per change.
- **React islands only where interaction requires them.** The Set-Piece is an island. Case Study bodies, Cards, and all layout are static HTML with no island.
- **Tailwind v4** for the Restrained Clay tokens, with the clay shadow stack expressed as a single reusable utility rather than repeated per component.
- **TypeScript** throughout.

### Content

- Case Studies and Cards are **Astro content collections** with a Zod schema.
- The Case Study schema encodes the fixed spine as required fields, so a Case Study missing its limits beat cannot build: title, one-line claim, headline metric (optional), problem, constraint, decision, rejected alternative, honest limits, source URL, tags, order.
- The Card schema is deliberately thin: title, one-line claim, source URL, tags, order.
- Ordering is a field, not file order.
- Non-project cells (Hero, About, Experience, Now, Design, Contact, Stack) are content, not markup.
- **Experience is its own cell and is not a Card.** Research Software Engineer Intern at DigiClinics, Feb to Aug 2026: a plant and herb classification pipeline combining TF-IDF retrieval with INT8 quantization for on-device inference, cross-validation 0.9864.
  It is the only third-party validation of the work on the page besides the Liquid Glass stars, and the Secondary Reader looks for it first.
- Six entries at launch. Case Studies: Liquid Glass, SIH26038, Spend Policy Engine, Contextual Priority. Cards: NIDS, Resume Screening.
- The Contextual Priority Case Study states scope as "built solo as an academic team submission" and does not name teammates or reproduce student IDs.

### The Set-Piece

- One module, `derivePalette`, is the entire mechanism and the primary test seam.
- **It samples hue only.** Saturation and lightness are pinned in code. This is not a shortcut; the prototype established that deriving the full palette collapses the ground-to-surface gap and Restrained Clay stops reading. See ADR-0002.

  From `prototypes/set-piece.prototype.html` on branch `prototype/set-piece`, the decision itself:

  ```
  hue      = dominant hue of the Source
  accent   = hsl(hue,        0.58, 0.46)
  ground   = hsl(hue + 6,    0.26, 0.845)
  surface  = hsl(hue + 6,    0.30, 0.893)
  ink      = hsl(hue + 340,  0.30, 0.13)
  muted    = hsl(hue + 2,    0.14, 0.42)
  carve    = hsl(hue + 4,    0.20, 0.34)
  ```

  The ground-to-surface lightness gap of 0.048 is what makes the extrusion read.
  The carve lightness of 0.34 is what holds contrast against surface at 5.58:1.

- The Source set is a small fixed collection shipped with the site. Sources are content, so adding one is a content change.
- Selecting a Source updates CSS custom properties on the document root. No re-render, no layout change.
- **The moving light source from prototype variant C is not implemented.** One Set-Piece per screen, and sampling is it.

### Surface and layout

- **Carve** is a coloured deboss: real ink colour plus a light and dark shadow pair. Transparent text carried by shadow is rejected because it cannot pass the contrast budget.
- **One theme.** No light and dark pair.
- Bento is a four-column grid at desktop. At the mobile breakpoint it becomes **two columns with spans reassigned**, not merely fewer columns: Case Studies and the wide cells go full width while Now, Design, and both Cards stay half width, so size variation survives at 375px.
- Baseline physical response on every interactive cell: press deforms the clay inward.
- Fonts are **self-hosted, subset, variable**, one display face and one text face. Google Fonts is rejected by ADR-0001; a third-party font origin cannot fit the LCP budget.

### Deployment

- **GitHub Pages** from a repo named `Jitheswar.github.io`, deployed by GitHub Actions on push to `main`.
- Site URL is configuration, so swapping to a custom domain later is a config change plus a DNS record.
- Contact is `mailto:2420030078cse@gmail.com` plus GitHub plus LinkedIn. No form, no third-party service, no JavaScript.
  This is the offers address, deliberately not the personal one; `jitheswaredu@gmail.com` does not appear on the site.
- Resume is a static PDF served at a stable path.

## Testing Decisions

A good test here asserts external behaviour: what a Reader experiences, or what a caller of a module gets back.
It does not assert how a value was computed, which CSS class was emitted, or what a component rendered internally.
Presentation is not tested; a test that breaks when a shadow is retuned is a liability.

There is **no prior art in this repository**: it is greenfield, so these tests establish the convention.

### Seam 1: `derivePalette`, unit

A pure function, tested with Vitest. No DOM, no Astro, no rendering.
Its invariants are the design, and the prototype demonstrated they fail silently when broken.

- Hue tracks the Source: two Sources of different dominant hue produce accents of different hue.
- Saturation and lightness are pinned: a washed-out low-saturation Source and a vivid one produce accents of the same saturation and lightness, differing only in hue.
- The ground-to-surface lightness gap is preserved for every Source, since this is what makes Restrained Clay read.
- Carve against surface is at least 4.5:1 for every Source. This test is the executable form of the accessibility budget.
- Every returned token is a valid colour.
- A degenerate Source (single flat colour, fully black, fully white) returns a usable palette rather than throwing.

### Seam 2: the built site, end to end

Assertions run against the production build, not the dev server, because the budgets are properties of what ships.
Playwright drives the page; Lighthouse supplies the scores. Both run in CI and fail the build.

- LCP under 2.0s on a throttled mid-tier mobile profile.
- Lighthouse accessibility score of 100.
- Initial-route JavaScript at or under roughly 100KB gzipped.
- With JavaScript disabled, every Case Study body is present in the served HTML.
- With `prefers-reduced-motion: reduce`, no transition or animation runs and the page remains complete and legible.
- Every interactive element is reachable by keyboard in a sensible order with a visible focus indicator.
- At 375px the bento renders at least one row containing two half-width cells, proving the grid did not collapse to a single column.
- Choosing a Source changes the accent custom property on the document root. This is the one DOM behaviour asserted here, and it exists to prove the island is wired to seam 1.

### Not tested

Cell rendering, layout composition, and copy.
Content schema validity is enforced by the Zod collection schema at build time, which fails the build on malformed content, so it needs no separate test.

## Out of Scope

- **Dark mode.** One theme, settled deliberately.
- **A custom domain.** `jitheswar.github.io` at launch; `jitheswar.dev` is a later configuration change.
- **A contact form**, and any third-party form service.
- **The fourteen cut repositories**, including all four medical CNN projects, both forks, and the NeetCode submissions.
- **The moving light source** from prototype variant C.
- **A live GitHub activity graph.**
- **A blog, CMS, comments, analytics, search, and internationalisation.**
- **Server-side rendering** and anything requiring a runtime.
- **Rewriting the prototype into production code.** It was written under prototype constraints and only its decisions carry forward.

## Further Notes

### Both prior assumptions are now resolved

- **The resume exists**, as `Jitheswar_Resume.docx`, converted cleanly to PDF. It is **not yet in the repository**, pending the redaction decision below.
- **The public contact address is `2420030078cse@gmail.com`**, the offers address. The personal address does not appear on the site.

### Open decisions carried out of the resume

These are not blockers for most tickets, but the resume cell cannot ship until the first is settled.

- **The resume carries a personal phone number.** Publishing the PDF as-is publishes it permanently and to scrapers. A redacted variant for the site, with the phone kept in the version sent directly to employers, is the usual resolution.
- **The resume lists `jitheswaredu@gmail.com`**, the personal address, while offers should go to `2420030078cse@gmail.com`. The document itself needs correcting, independently of this site.
- **The resume and the site disagree about which work matters.** The resume leads with Ayur-Ai, the medical imaging classifiers, ruralAI, and malaria detection, all of which this spec cuts, and does not mention Liquid Glass, SIH26038, or Contextual Priority, three of the four Case Studies. A Primary Reader who reads both will notice. Aligning the resume to the selection is out of scope here but should follow.
- **HerbRAG**, described in the resume as an ongoing extension of the DigiClinics work into hybrid BM25 and dense retrieval, has no public repository and therefore no entry. It becomes a Card or a Case Study when it is published.
- **Graduation is 2028**, per the resume. Any copy implying a nearer date is wrong.

### Primary sources

- `CONTEXT.md` for vocabulary. Case Study, Card, Set-Piece, Source, Carve, Restrained Clay, Fun, Practical Floor, Primary Reader, and Secondary Reader all have precise meanings and this spec uses them as defined.
- `docs/adr/0001-practical-floor.md` for the budgets and why Astro and self-hosted fonts follow from them.
- `docs/adr/0002-set-piece-samples-hue-only.md` for the Set-Piece mechanism.
- Branch `prototype/set-piece`, file `prototypes/set-piece.prototype.html`, for the four hero variants and the evidence behind variant D.

### Copy

Roughly 3,500 words across four Case Studies, two Cards, and the non-project cells.
Drafted from the existing project READMEs, which are strong source material, and edited by Jitheswar line by line.
Every claim about the work has to survive him being asked about it in an interview, so no claim ships unedited.
