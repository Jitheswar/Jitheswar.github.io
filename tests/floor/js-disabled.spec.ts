import { test, expect } from '@playwright/test';

// Practical Floor budget 5: core content is readable with JavaScript disabled.
test.use({ javaScriptEnabled: false });

test('page content is present in the served HTML with JavaScript disabled', async ({ page }) => {
	await page.goto('/');

	const bodyText = await page.locator('body').innerText();
	expect(bodyText.trim().length).toBeGreaterThan(0);

	await expect(page.locator('h1')).toBeVisible();
});
