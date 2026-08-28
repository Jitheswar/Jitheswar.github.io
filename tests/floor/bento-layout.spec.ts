import { test, expect } from '@playwright/test';

// Ticket 05: at the 375px mobile breakpoint the bento grid becomes two
// columns with spans reassigned, not merely fewer columns. This asserts the
// grid did not collapse to a single column by finding a row that holds two
// half-width cells side by side.
test.use({ viewport: { width: 375, height: 900 } });

test('at 375px the bento grid has at least one row with two half-width cells', async ({ page }) => {
	await page.goto('/');

	const grid = page.locator('[data-bento-grid]');
	const gridBox = await grid.boundingBox();
	expect(gridBox).not.toBeNull();

	const cells = page.locator('[data-bento-cell]');
	const boxes = await cells.evaluateAll((els) =>
		els.map((el) => {
			const rect = el.getBoundingClientRect();
			return { top: rect.top, left: rect.left, width: rect.width };
		}),
	);
	expect(boxes.length).toBeGreaterThan(1);

	const rows: (typeof boxes)[] = [];
	for (const box of boxes) {
		const row = rows.find((r) => Math.abs(r[0].top - box.top) < 2);
		if (row) row.push(box);
		else rows.push([box]);
	}

	const halfWidth = gridBox!.width / 2;
	const hasPairedHalfWidthRow = rows.some(
		(row) =>
			row.length === 2 &&
			row[0].left !== row[1].left &&
			row.every((box) => Math.abs(box.width - halfWidth) < halfWidth * 0.2),
	);

	expect(hasPairedHalfWidthRow).toBe(true);
});
