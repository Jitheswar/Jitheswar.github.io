# 01: Walking skeleton, Astro live on GitHub Pages

**What to build:** A real, public URL that serves a page.
Someone can visit `jitheswar.github.io`, see the hero line, and a push to `main` updates what they see without anyone running a command.
Nothing is designed yet and that is deliberate: this ticket proves the whole pipeline before there is anything worth losing.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] Astro with TypeScript, static output, installed with npm.
- [x] The GitHub repository is named `Jitheswar.github.io` so the user site resolves at the bare subdomain.
- [x] A GitHub Actions workflow builds and deploys on push to `main`.
- [x] The live URL serves a page containing the hero line, the through-line rather than a job title.
- [x] The site URL is configuration, so pointing a custom domain at it later is a config change plus a DNS record and no code change.
- [x] No React island exists yet. The route ships zero JavaScript.

## Comments

Implemented: Astro static site (TypeScript, npm), pushed to a new public repo `Jitheswar/Jitheswar.github.io`, GitHub Pages switched to Actions-based deployment, `.github/workflows/deploy.yml` builds and deploys on push to `main`. `astro.config.mjs` sets `site` as the single config point for the URL. Verified `https://jitheswar.github.io/` serves the hero line with zero shipped JS.
