#!/usr/bin/env node
// Practical Floor budget 6: initial-route JS at or under ~100KB gzipped.
// Reads the served index.html and gzips every local script it references,
// so the budget is checked against what a Reader's browser actually downloads.
//
// An Astro island's own bundle is never a <script src> or a modulepreload
// link: the custom element (astro-island) carries it as a component-url and
// a renderer-url attribute and loads both with a runtime dynamic import, so
// those have to be discovered from the HTML too. Each of those entry chunks
// can themselves import further chunks (ticket 07's SetPiece and its
// renderer both import a shared react chunk), so this follows every local
// `import`/`from` specifier transitively rather than counting entry chunks
// alone - the earlier version of this script only looked at <script src> and
// modulepreload, so it silently reported 0KB for an island-hydrated page.

import { readFileSync, existsSync } from 'node:fs';
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
const islandComponentUrls = [...html.matchAll(/<astro-island[^>]+component-url=["']([^"']+)["']/g)].map(
	(m) => m[1],
);
const islandRendererUrls = [...html.matchAll(/<astro-island[^>]+renderer-url=["']([^"']+)["']/g)].map((m) => m[1]);

// Every local `import ... from "./x.js"`, bare `import "./x.js"`, and dynamic
// `import("./x.js")` specifier in a built ES module chunk. Astro/Vite's
// production output always uses relative specifiers for local chunks, so
// anything not starting with `.` is a bare/external specifier and ignored.
const IMPORT_SPECIFIER = /(?:from\s*|import\s*\(?\s*)["'](\.[^"']+)["']/g;

function importsOf(source) {
	return [...source.matchAll(IMPORT_SPECIFIER)].map((m) => m[1]);
}

const seen = new Set();
const queue = [...scriptSrcs, ...modulePreloads, ...islandComponentUrls, ...islandRendererUrls]
	.filter((src) => !/^https?:\/\//.test(src))
	.map((src) => src.split('?')[0]);

const breakdown = [];
let totalGzipBytes = 0;

while (queue.length > 0) {
	const jsPath = queue.shift();
	if (seen.has(jsPath)) continue;
	seen.add(jsPath);

	const filePath = path.join(distDir, jsPath.replace(/^\//, ''));
	if (!existsSync(filePath)) continue;

	const buffer = readFileSync(filePath);
	const gzipBytes = gzipSync(buffer).length;
	totalGzipBytes += gzipBytes;
	breakdown.push({ jsPath, gzipBytes });

	const dir = path.dirname(jsPath);
	for (const specifier of importsOf(buffer.toString('utf8'))) {
		queue.push(path.posix.join(dir, specifier).split('?')[0]);
	}
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
