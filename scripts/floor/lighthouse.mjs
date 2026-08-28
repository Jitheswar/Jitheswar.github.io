#!/usr/bin/env node
// Practical Floor budgets 1 and 2: LCP under 2.0s on a throttled mid-tier
// mobile profile, and a Lighthouse accessibility score of 100.
// Runs against the production preview server, not the dev server.

import { chromium } from '@playwright/test';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { FLOOR_URL } from './config.mjs';

const URL_UNDER_TEST = FLOOR_URL;
const LCP_BUDGET_MS = 2000;

const chrome = await chromeLauncher.launch({
	chromePath: chromium.executablePath(),
	chromeFlags: ['--headless=new', '--no-sandbox'],
});

try {
	const { lhr } = await lighthouse(
		URL_UNDER_TEST,
		{
			port: chrome.port,
			output: 'json',
			logLevel: 'error',
			onlyCategories: ['performance', 'accessibility'],
		},
		{ extends: 'lighthouse:default' },
	);

	const accessibilityScore = lhr.categories.accessibility.score * 100;
	const lcpMs = lhr.audits['largest-contentful-paint'].numericValue;

	console.log(`Lighthouse accessibility score: ${accessibilityScore}`);
	console.log(`Lighthouse LCP (simulated mid-tier mobile, throttled 4G): ${lcpMs.toFixed(0)}ms`);

	let failed = false;

	if (accessibilityScore !== 100) {
		console.error(`FAIL: accessibility score is ${accessibilityScore}, required 100.`);
		const accessibilityAuditIds = new Set(lhr.categories.accessibility.auditRefs.map((ref) => ref.id));
		for (const audit of Object.values(lhr.audits)) {
			if (accessibilityAuditIds.has(audit.id) && audit.score !== null && audit.score < 1) {
				console.error(`  - ${audit.id}: ${audit.title}`);
			}
		}
		failed = true;
	}

	if (lcpMs >= LCP_BUDGET_MS) {
		console.error(`FAIL: LCP is ${lcpMs.toFixed(0)}ms, budget is under ${LCP_BUDGET_MS}ms.`);
		failed = true;
	}

	if (failed) process.exit(1);
	console.log('PASS: Lighthouse budgets met.');
} finally {
	await chrome.kill();
}
