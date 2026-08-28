# Jitheswar's portfolio

Source for `jitheswar.github.io`, an Astro static site.
Built and deployed to GitHub Pages on every push to `main`.

## Commands

| Command           | Action                                       |
| :----------------- | :-------------------------------------------- |
| `npm install`       | Installs dependencies                         |
| `npm run dev`       | Starts local dev server at `localhost:4321`   |
| `npm run build`     | Builds the production site to `./dist/`       |
| `npm run preview`   | Previews the build locally before deploying   |
| `npm run test:floor` | Builds nothing itself; run `npm run build` first, then checks the Practical Floor against `./dist/` |

## The Practical Floor

Every build is checked against the six budgets in `docs/adr/0001-practical-floor.md`: LCP, Lighthouse accessibility, reduced motion, keyboard focus, JavaScript-disabled content, and the initial-route JS budget.
The check runs against the production build in `./dist/`, never the dev server.

Run it locally with:

```
npm run build
npx playwright install chromium   # once, to fetch the browser binary
npm run test:floor
```

This runs in CI on every pull request and before every deploy, and fails the build on any breach.
Every ticket from here on inherits "the Floor harness stays green" as an acceptance criterion; if a change needs to touch layout, motion, or scripts, run `npm run test:floor` before opening the PR.

## Docs

- `CONTEXT.md` for the site's domain vocabulary.
- `docs/adr/` for architecture decisions.
- `.scratch/portfolio-v1/` for the spec and tickets.
