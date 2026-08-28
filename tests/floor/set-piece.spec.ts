import { test, expect } from '@playwright/test';
import { accentColor, waitForSetPieceReady } from './support';

// Spec Testing Decisions, Seam 2: the one DOM behaviour asserted against the
// Set-Piece island, proving it is actually wired to derivePalette (ticket 04)
// rather than just rendering swatches.
test('choosing a Source changes the accent custom property on the document root', async ({ page }) => {
	await page.goto('/');
	await waitForSetPieceReady(page);

	const accent = accentColor(page);
	const before = await accent();

	const group = page.getByRole('group', { name: 'Source' });
	const otherSwatch = group.getByRole('button', { name: 'Indigo' });
	await otherSwatch.click();

	// A real image fetch and decode sits between the click and the custom
	// property update, so this gets a longer poll than the rest of the Floor
	// suite's synchronous assertions.
	await expect.poll(accent, { timeout: 10000 }).not.toBe(before);
});

test('the Source canvas is decorative and the Source controls are labelled and keyboard operable', async ({
	page,
}) => {
	await page.goto('/');
	await waitForSetPieceReady(page);

	const group = page.getByRole('group', { name: 'Source' });
	await expect(group.getByRole('button')).toHaveCount(6);
	for (const label of ['Copper dusk', 'Oxblood', 'Moss', 'Indigo', 'Ember', 'Slate rose']) {
		await expect(group.getByRole('button', { name: label })).toBeVisible();
	}

	const canvas = page.locator('canvas[aria-hidden="true"]');
	await expect(canvas).toHaveCount(1);

	const mossButton = group.getByRole('button', { name: 'Moss' });
	await mossButton.focus();
	await expect(mossButton).toBeFocused();
	await page.keyboard.press('Enter');
	await expect(mossButton).toHaveAttribute('aria-pressed', 'true', { timeout: 10000 });
});
