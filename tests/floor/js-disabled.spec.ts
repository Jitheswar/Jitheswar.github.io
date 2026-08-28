import { test, expect } from '@playwright/test';

// Practical Floor budget 5: core content is readable with JavaScript disabled.
test.use({ javaScriptEnabled: false });

test('page content is present in the served HTML with JavaScript disabled', async ({ page }) => {
	await page.goto('/');

	const bodyText = await page.locator('body').innerText();
	expect(bodyText.trim().length).toBeGreaterThan(0);

	await expect(page.locator('h1')).toBeVisible();
});

// Ticket 06: a Case Study is static, and its full body, honest-limits beat
// included, must be readable with no script running at all.
test('a Case Study body, including the honest-limits beat, is present in the served HTML with JavaScript disabled', async ({
	page,
}) => {
	await page.goto('/case-studies/liquid-glass/');

	const bodyText = await page.locator('body').innerText();
	expect(bodyText).toContain('Honest limits');
	expect(bodyText.trim().length).toBeGreaterThan(400);

	await expect(page.locator('h1')).toHaveText('Liquid Glass');
});
