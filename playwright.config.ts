import { defineConfig } from '@playwright/test';
import { FLOOR_URL } from './scripts/floor/config.mjs';

export default defineConfig({
	testDir: './tests/floor',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	// Capped rather than left to the CPU-derived default: the Floor suite
	// serves `dist/` with `serve` (ticket 02's Comments explain why, over
	// `astro preview`), a single lightweight Node process, and ticket 07's
	// Set-Piece spec is the first floor test with a real fetch-decode-hydrate
	// chain behind its assertions. On a high core-count machine the default
	// worker count over-saturates that one process and those assertions
	// start timing out under the queueing delay, not under any real defect.
	workers: 2,
	reporter: 'list',
	use: {
		baseURL: FLOOR_URL,
	},
});
