import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		// Playwright owns tests/floor; Vitest owns unit specs beside their source.
		include: ['src/**/*.test.ts'],
	},
});
