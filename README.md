# jitheswar.github.io

My portfolio, served by GitHub Pages at https://jitheswar.github.io.

Plain HTML, CSS and JavaScript, with no libraries and no build step. Edit the files and push.

- `index.html`: all the content. Each section with a `data-shape` attribute gets its own 3D object. Each marked number is an `<a class="claim" href="#nN">` and its source is the `<aside class="note" id="nN">` below it.
- `styles.css`: three themes as CSS custom properties. Sadie is the default. Sadie and Glass take their values from the `colors.toml` of my two Omarchy themes.
- `scene.js`: the 3D layer. One cloud of points in raw WebGL that rearranges into a different shape for each section as you scroll. It uses fewer points on phones, lowers its own resolution if frames run slow, and stops turning under `prefers-reduced-motion`.
- `main.js`: theme switching, citations, scroll effects, and live stars, forks and last-updated dates from the GitHub API.
- `demos.js`: the three in-page demos (what a page can observe, a SHA-256 hash chain, regex to DFA).
- `nexcc-automata.js`: the automata code from [nexcc](https://github.com/Jitheswar/nexcc), wrapped for the browser. Regenerate it when that code changes.

Preview locally:

```bash
python3 -m http.server 4173
```
