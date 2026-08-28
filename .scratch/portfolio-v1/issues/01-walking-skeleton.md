# 01: Walking skeleton, Astro live on GitHub Pages

**What to build:** A real, public URL that serves a page.
Someone can visit `jitheswar.github.io`, see the hero line, and a push to `main` updates what they see without anyone running a command.
Nothing is designed yet and that is deliberate: this ticket proves the whole pipeline before there is anything worth losing.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Astro with TypeScript, static output, installed with npm.
- [ ] The GitHub repository is named `Jitheswar.github.io` so the user site resolves at the bare subdomain.
- [ ] A GitHub Actions workflow builds and deploys on push to `main`.
- [ ] The live URL serves a page containing the hero line, the through-line rather than a job title.
- [ ] The site URL is configuration, so pointing a custom domain at it later is a config change plus a DNS record and no code change.
- [ ] No React island exists yet. The route ships zero JavaScript.
