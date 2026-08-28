import type { Page } from '@playwright/test';

/**
 * Waits for the Set-Piece island to be genuinely ready: hydrated (the
 * astro-island custom element's `ssr` attribute is gone - see the compiled
 * astro-island runtime in `dist/index.html`) *and* past its own mount-time
 * `derivePalette` call for the default Source (the canvas has actually been
 * drawn to, i.e. its first pixel has gone opaque).
 *
 * Without the second half, a test can capture its "before" colour while that
 * mount-time draw is still in flight, then click a different Source; if the
 * mount-time draw's own async image load finishes *after* the click's, it
 * overwrites the click's palette with the default's, and the test's "the
 * colour changed" assertion becomes a genuine race rather than a stable
 * comparison, especially under CPU/network contention.
 */
export async function waitForSetPieceReady(page: Page) {
	await page.waitForFunction(() => {
		const island = document.querySelector('astro-island');
		if (!island || island.hasAttribute('ssr')) return false;

		const canvas = document.querySelector('canvas[aria-hidden="true"]');
		if (!(canvas instanceof HTMLCanvasElement)) return false;
		const ctx = canvas.getContext('2d');
		if (!ctx) return false;

		return ctx.getImageData(0, 0, 1, 1).data[3] !== 0;
	});
}

/** Reads the accent custom property currently in effect on the document root. */
export function accentColor(page: Page) {
	return () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-accent'));
}
