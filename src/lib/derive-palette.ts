/**
 * The Set-Piece mechanism: pixels in, palette tokens out.
 *
 * Pure, no DOM, no framework. It samples hue only from the Source; saturation
 * and lightness are pinned in code, per docs/adr/0002-set-piece-samples-hue-only.md.
 * The pinned values and the ground-to-surface lightness gap are the design;
 * they must not be retuned without re-deriving the invariants this module's
 * tests hold it to.
 *
 * The token contract (ground, surface, ink, muted, accent, carve, shadow) is
 * defined in src/styles/global.css and must stay identical to it: those names
 * are the interface between this module and the Restrained Clay tokens.
 */

/** The exact token set Restrained Clay expects, each a valid CSS colour string. */
export interface PaletteTokens {
	ground: string;
	surface: string;
	ink: string;
	muted: string;
	accent: string;
	carve: string;
	shadow: string;
}

/** Quantization width per RGB channel when bucketing pixels for hue sampling. */
const BUCKET_SHIFT = 4;

interface Bucket {
	rSum: number;
	gSum: number;
	bSum: number;
	count: number;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
	const rn = r / 255;
	const gn = g / 255;
	const bn = b / 255;
	const max = Math.max(rn, gn, bn);
	const min = Math.min(rn, gn, bn);
	const l = (max + min) / 2;
	const delta = max - min;

	if (delta === 0) {
		return { h: 0, s: 0, l };
	}

	const s = delta / (1 - Math.abs(2 * l - 1));
	let h: number;
	if (max === rn) {
		h = ((gn - bn) / delta) % 6;
	} else if (max === gn) {
		h = (bn - rn) / delta + 2;
	} else {
		h = (rn - gn) / delta + 4;
	}
	h *= 60;
	if (h < 0) h += 360;

	return { h, s, l };
}

/**
 * The dominant hue of a Source: pixels are bucketed by quantized colour, and
 * the winning bucket is the one with the highest saturation weighted by how
 * much of the image it covers, so a vivid accent wins over a large but dull
 * background. A wholly achromatic Source (flat, black, or white) has no
 * saturated bucket to prefer, so the most common colour wins instead, which
 * always yields hue 0 for grey, black, or white input.
 */
function dominantHue(pixels: Uint8ClampedArray): number {
	const buckets = new Map<number, Bucket>();

	for (let i = 0; i + 2 < pixels.length; i += 4) {
		const r = pixels[i]!;
		const g = pixels[i + 1]!;
		const b = pixels[i + 2]!;
		const key = (r >> BUCKET_SHIFT) * 256 + (g >> BUCKET_SHIFT) * 16 + (b >> BUCKET_SHIFT);
		const bucket = buckets.get(key);
		if (bucket) {
			bucket.rSum += r;
			bucket.gSum += g;
			bucket.bSum += b;
			bucket.count += 1;
		} else {
			buckets.set(key, { rSum: r, gSum: g, bSum: b, count: 1 });
		}
	}

	if (buckets.size === 0) {
		return 0;
	}

	let bySaturation: Bucket | undefined;
	let bestWeight = 0;
	let byCount: Bucket | undefined;
	let bestCount = -1;

	for (const bucket of buckets.values()) {
		const avgR = bucket.rSum / bucket.count;
		const avgG = bucket.gSum / bucket.count;
		const avgB = bucket.bSum / bucket.count;
		const { s } = rgbToHsl(avgR, avgG, avgB);
		const weight = s * Math.sqrt(bucket.count);

		if (weight > bestWeight) {
			bestWeight = weight;
			bySaturation = bucket;
		}
		if (bucket.count > bestCount) {
			bestCount = bucket.count;
			byCount = bucket;
		}
	}

	const winner = bySaturation ?? byCount!;
	return rgbToHsl(winner.rSum / winner.count, winner.gSum / winner.count, winner.bSum / winner.count).h;
}

function normalizeHue(h: number): number {
	return ((h % 360) + 360) % 360;
}

function hsl(h: number, s: number, l: number): string {
	const hue = Math.round(normalizeHue(h) * 100) / 100;
	return `hsl(${hue} ${s * 100}% ${l * 100}%)`;
}

// Hue offsets, and the pinned saturation/lightness per token, from the decision
// in docs/adr/0002-set-piece-samples-hue-only.md. `shadow` isn't part of that
// formula; its offset and pinned S/L come from ticket 03's Comments, which fixed
// it as the anchor tone for the clay shadow stack in src/styles/global.css.
const GROUND_SURFACE_HUE_OFFSET = 6;
const INK_HUE_OFFSET = 340;
const MUTED_HUE_OFFSET = 2;
const CARVE_HUE_OFFSET = 4;
const SHADOW_HUE_OFFSET = 6;

/**
 * Derives the Restrained Clay palette from a Source's pixels.
 *
 * `pixels` is flat RGBA data, four bytes per pixel, the shape of
 * `ImageData.data` (the caller extracts that from a canvas; this module never
 * touches one). Only the dominant hue is read from it; every other channel of
 * every token is pinned, per docs/adr/0002-set-piece-samples-hue-only.md.
 */
export function derivePalette(pixels: Uint8ClampedArray): PaletteTokens {
	const hue = dominantHue(pixels);

	return {
		ground: hsl(hue + GROUND_SURFACE_HUE_OFFSET, 0.26, 0.845),
		surface: hsl(hue + GROUND_SURFACE_HUE_OFFSET, 0.3, 0.893),
		ink: hsl(hue + INK_HUE_OFFSET, 0.3, 0.13),
		muted: hsl(hue + MUTED_HUE_OFFSET, 0.14, 0.42),
		accent: hsl(hue, 0.58, 0.46),
		carve: hsl(hue + CARVE_HUE_OFFSET, 0.2, 0.34),
		shadow: hsl(hue + SHADOW_HUE_OFFSET, 0.35, 0.62),
	};
}
