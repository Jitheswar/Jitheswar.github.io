# 08: Non-project cells and the resume

**What to build:** Everything on the landing page that is not a project: who this is, what they have done professionally, and how to reach them.

The Experience cell matters more than its size suggests.
Besides the Liquid Glass stars it is the only third-party validation on the page, and the Secondary Reader looks for it before anything else.

**Blocked by:** 05.

**Status:** done

- [x] Seven cells, all content rather than markup: Hero, About, Experience, Now, Design, Stack, Contact.
- [x] Hero carries the through-line, not a job title, and is changeable in one place.
- [x] Experience states Research Software Engineer Intern at DigiClinics, Feb to Aug 2026, the TF-IDF plus INT8 quantization pipeline, and the 0.9864 cross-validation score.
- [x] About states graduation in 2028. Copy implying a nearer date is wrong.
- [x] Design presents the two Omarchy themes as visual work rather than as software.
- [x] Contact is `mailto:2420030078cse@gmail.com` plus GitHub plus LinkedIn. No form, no third-party service, no JavaScript. The personal address does not appear anywhere on the site.
- [x] The resume PDF is served at a stable path and linked from Contact. **It carries no phone number.** Confirm before publishing.
- [x] No live GitHub activity graph.
- [x] The Floor harness stays green.

## Comments

The seven non-project cells are a new `site` content collection at `src/content/site/`, one Markdown file per cell (`hero.md`, `about.md`, `experience.md`, `now.md`, `design.md`, `stack.md`, `contact.md`), all sharing one glob-loaded collection but each keeping its own required shape via a Zod `discriminatedUnion('cell', ...)` in `src/content/schemas.ts`. This is the same "structural, not conventional" argument tickets 04 and 06 already established: an Experience entry missing its `metric` field fails the build exactly the way a Case Study missing `honestLimits` does, rather than silently rendering a blank. `index.astro` reads the collection once and narrows per cell with a small `cellData<T>()` helper (`Extract<SiteCell, { cell: T }>`), so each cell's template gets a fully-typed object instead of an untyped find-and-hope.

Two facts this ticket needed did not exist anywhere in the repo, git history, or memory, so they were asked of the user rather than invented: the LinkedIn profile URL (`https://www.linkedin.com/in/jitheswar-chilukuri/`), and the second Omarchy theme for the Design cell. The user pointed at `github.com/Jitheswar/sadie-my-love`; its description and README were fetched with `gh repo view` / `gh api repos/.../readme` to write an accurate one-line summary ("Copper and oxblood across four wallpapers, each rotating one hand-tuned palette in Oklch") rather than guessing at what the theme does.

The resume PDF already existed, converted from `~/Downloads/Jitheswar_Resume.docx` in an earlier session's scratchpad, and was copied into this repo at `public/resume.pdf` (the stable path this ticket owns) after re-confirming with `pdftotext` that no phone number appears anywhere in it; the only digits on the page are the offers email address. Contact links to it via a `resumeHref` content field rather than a hardcoded path.

The Stack cell was a vague, non-committal sentence before this ticket ("TypeScript, Python, Kubernetes, and more"), which fails the spec's own Secondary Reader story of matching technology names "without reading prose." Replaced with a curated array of ten specific chips (reusing the exact `<li class="clay px-3 py-1 text-sm text-ink">` tag-chip pattern ticket 06 already established for Case Study tags) drawn from the resume's Technical Skills section, so every name on the cell is something the resume and an interviewer's follow-up question would both back up.

About gained a location clause ("in Hyderabad, India") it didn't have before. The spec's Secondary Reader story 18 explicitly asks for "the location and study status visible, so that I can check eligibility before going further," and About is the cell that already owns study status; adding location there rather than inventing a new cell for one clause seemed the smaller, more honest change.

Reviewed with `/code-review` (Standards and Spec axes in parallel, both against `HEAD`). Standards came back clean, no hard violations. Spec found one real defect: an earlier draft linked each Design theme's name straight to its GitHub repository, which contradicts this ticket's own checklist line, "Design presents the two Omarchy themes as visual work rather than as software" - a code-hosting link foregrounds the theme as software regardless of the surrounding copy. Fixed by dropping the link entirely (and the now-unused `href` field from `designCellSchema`): both theme entries are now plain text, name plus description, with no interactive element in the Design cell at all. Re-ran `npm run typecheck`, `npm run test` (48/48), `npm run build`, and the full `npm run test:floor` after the fix: all 8 Playwright specs pass, Lighthouse accessibility 100, LCP 1507ms, initial-route JS 60.18KB gzipped.

The Spec review's two other observations - About's added location clause and Stack's full copy rewrite - were judged as legitimate scope, not defects: both are direct implementations of named Secondary Reader stories (18 and 14 respectively) that the ticket's own prose ("Everything on the landing page that is not a project: who this is, what they have done professionally, and how to reach them") authorizes even where the terse checklist doesn't spell out the exact wording.

`npm run typecheck`, `npm run test` (48 Vitest assertions, untouched by this ticket), `npm run build`, and the full `npm run test:floor` all pass: Lighthouse accessibility 100, LCP 1955ms, initial-route JS 60.18KB gzipped (well under the 100KB budget, unchanged from ticket 07 since this ticket adds no island). Verified visually with `agent-browser` at 1280px and 375px: all seven cells render real content, the Contact cell's four links (Email, GitHub, LinkedIn, Resume) and the Design cell's two theme links are genuinely interactive and keyboard-focusable per the existing `keyboard-focus.spec.ts`, and the 375px bento still pairs Now and Design at half width per ticket 05's layout rule.
