import { defineConfig } from '@playwright/test';
import { FLOOR_URL } from './scripts/floor/config.mjs';

export default defineConfig({
	testDir: './tests/floor',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: 'list',
	use: {
		baseURL: FLOOR_URL,
	},
});
