import { test, expect } from '@playwright/test';

// Practical Floor budget 4: every interactive element is reachable by
// keyboard in a sensible order with a visible focus indicator.
// The walking skeleton has no focusable elements yet, so this currently
// passes vacuously; it becomes load-bearing once real interactive elements
// (nav, Set-Piece controls, contact links) are added in later tickets.
const FOCUSABLE_SELECTOR =
	'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

test('every interactive element is reachable by keyboard in DOM order with a visible focus indicator', async ({
	page,
}) => {
	await page.goto('/');

	const focusable = await page.locator(FOCUSABLE_SELECTOR).all();
	const visibleFocusable = [];
	for (const el of focusable) {
		if (await el.isVisible()) visibleFocusable.push(el);
	}

	for (const el of visibleFocusable) {
		await page.keyboard.press('Tab');
		// Tabbing in DOM order proves the order is sensible: nothing skipped, nothing out of sequence.
		await expect(el).toBeFocused();

		const focusIndicator = await el.evaluate((node) => {
			const style = getComputedStyle(node);
			return {
				outlineStyle: style.outlineStyle,
				outlineWidth: style.outlineWidth,
				boxShadow: style.boxShadow,
			};
		});

		const hasVisibleOutline = focusIndicator.outlineStyle !== 'none' && focusIndicator.outlineWidth !== '0px';
		const hasVisibleBoxShadow = focusIndicator.boxShadow !== 'none';
		expect(hasVisibleOutline || hasVisibleBoxShadow).toBeTruthy();
	}
});
