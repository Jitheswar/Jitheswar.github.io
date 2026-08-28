#!/usr/bin/env node
// Practical Floor budget 6: initial-route JS at or under ~100KB gzipped.
// Reads the served index.html and gzips every local script it references,
// so the budget is checked against what a Reader's browser actually downloads.

import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BUDGET_BYTES = 100 * 1024;

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(scriptDir, '../../dist');
const indexPath = path.join(distDir, 'index.html');

const html = readFileSync(indexPath, 'utf8');

const scriptSrcs = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map((m) => m[1]);
const modulePreloads = [...html.matchAll(/<link[^>]+rel=["']modulepreload["'][^>]*href=["']([^"']+)["']/g)].map(
	(m) => m[1],
);

const jsPaths = [...new Set([...scriptSrcs, ...modulePreloads])]
	.filter((src) => !/^https?:\/\//.test(src))
	.map((src) => src.split('?')[0]);

let totalGzipBytes = 0;
const breakdown = [];

for (const jsPath of jsPaths) {
	const filePath = path.join(distDir, jsPath.replace(/^\//, ''));
	const buffer = readFileSync(filePath);
	const gzipBytes = gzipSync(buffer).length;
	totalGzipBytes += gzipBytes;
	breakdown.push({ jsPath, gzipBytes });
}

console.log('Initial-route JS budget check');
for (const { jsPath, gzipBytes } of breakdown) {
	console.log(`  ${jsPath}: ${(gzipBytes / 1024).toFixed(2)} KB gzipped`);
}
console.log(`Total: ${(totalGzipBytes / 1024).toFixed(2)} KB gzipped (budget: ${(BUDGET_BYTES / 1024).toFixed(0)} KB)`);

if (totalGzipBytes > BUDGET_BYTES) {
	console.error('FAIL: initial-route JS exceeds the Practical Floor budget.');
	process.exit(1);
}

console.log('PASS: initial-route JS is within budget.');
