import { test, expect } from '@playwright/test';

// Practical Floor budget 3: with prefers-color-scheme untouched and
// prefers-reduced-motion set, no transition or animation runs and the page
// stays complete and legible. colorScheme is explicitly reset to null so this
// test doesn't force light mode (Playwright's context default) in place of
// "untouched" - Playwright otherwise pins prefers-color-scheme to light.
test.use({ contextOptions: { reducedMotion: 'reduce', colorScheme: null } });

test('no transition or animation runs when prefers-reduced-motion is set', async ({ page }) => {
	await page.goto('/');

	const animatedElements = await page.evaluate(() => {
		const offenders: string[] = [];
		for (const el of Array.from(document.querySelectorAll('*'))) {
			const style = getComputedStyle(el);
			const hasAnimation = style.animationName !== 'none' && style.animationDuration !== '0s';
			const hasTransition = style.transitionProperty !== 'none' && style.transitionDuration !== '0s';
			if (hasAnimation || hasTransition) {
				offenders.push(el.tagName.toLowerCase() + (el.className ? `.${el.className}` : ''));
			}
		}
		return offenders;
	});

	expect(animatedElements).toEqual([]);

	const bodyText = await page.locator('body').innerText();
	expect(bodyText.trim().length).toBeGreaterThan(0);
});
