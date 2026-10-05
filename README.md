# jitheswar.github.io

My portfolio, served by GitHub Pages at https://jitheswar.github.io.

Plain HTML, CSS and a little JavaScript. There's no build step. Edit the files and push.

- `index.html`: all the content. Each marked number is an `<a class="claim" href="#nN">` and its source is the `<aside class="note" id="nN">` beside it.
- `styles.css`: three themes as CSS custom properties. Notebook is the default. Sadie and Glass take their values from the `colors.toml` of my two Omarchy themes.
- `main.js`: theme switching, lining each note up with its claim, and live star counts.

Preview locally:

```bash
python3 -m http.server 4173
```
