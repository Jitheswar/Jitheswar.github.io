import { describe, expect, it } from 'vitest';
import { derivePalette, type PaletteTokens } from './derive-palette';

const TOKEN_NAMES = ['ground', 'surface', 'ink', 'muted', 'accent', 'carve', 'shadow'] as const;

/** Test-only oracle, independent of the module under test: HSL -> RGB. */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
	const hue = ((h % 360) + 360) % 360;
	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
	const m = l - c / 2;
	let r1: number, g1: number, b1: number;
	if (hue < 60) [r1, g1, b1] = [c, x, 0];
	else if (hue < 120) [r1, g1, b1] = [x, c, 0];
	else if (hue < 180) [r1, g1, b1] = [0, c, x];
	else if (hue < 240) [r1, g1, b1] = [0, x, c];
	else if (hue < 300) [r1, g1, b1] = [x, 0, c];
	else [r1, g1, b1] = [c, 0, x];
	return [(r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255];
}

/** Parses this module's `hsl(H S% L%)` output back into numbers, for assertions. */
function parseHsl(css: string): { h: number; s: number; l: number } {
	const match = /^hsl\(\s*(-?[\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*\)$/.exec(css);
	if (!match) {
		throw new Error(`not a valid hsl() colour: ${css}`);
	}
	const [, h, s, l] = match;
	return { h: Number(h), s: Number(s) / 100, l: Number(l) / 100 };
}

function isValidColor(css: string): boolean {
	const { h, s, l } = parseHsl(css);
	return h >= 0 && h < 360 && s >= 0 && s <= 1 && l >= 0 && l <= 1;
}

/** WCAG 2 contrast ratio between two `hsl()` colour strings. */
function contrastRatio(cssA: string, cssB: string): number {
	const relLum = (css: string) => {
		const { h, s, l } = parseHsl(css);
		const [r, g, b] = hslToRgb(h, s, l).map((v) => {
			const c = v / 255;
			return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
		});
		return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
	};
	const [lA, lB] = [relLum(cssA), relLum(cssB)];
	const [hi, lo] = lA > lB ? [lA, lB] : [lB, lA];
	return (hi + 0.05) / (lo + 0.05);
}

/** Builds flat RGBA pixel data (ImageData.data shape) for a synthetic Source. */
function sourcePixels(swatches: Array<{ h: number; s: number; l: number; weight: number }>): Uint8ClampedArray {
	const pixels: number[] = [];
	for (const { h, s, l, weight } of swatches) {
		const [r, g, b] = hslToRgb(h, s, l);
		for (let i = 0; i < weight; i++) {
			pixels.push(Math.round(r), Math.round(g), Math.round(b), 255);
		}
	}
	return new Uint8ClampedArray(pixels);
}

/** A single-hue Source: mostly a vivid swatch, plus a pale highlight, like a real photo. */
function vividSource(hue: number): Uint8ClampedArray {
	return sourcePixels([
		{ h: hue, s: 0.85, l: 0.5, weight: 90 },
		{ h: hue, s: 0.1, l: 0.92, weight: 10 },
	]);
}

const SAMPLE_HUES = [0, 15, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 350];

describe('derivePalette', () => {
	it('emits exactly the token contract: ground, surface, ink, muted, accent, carve, shadow', () => {
		const palette = derivePalette(vividSource(200));
		expect(Object.keys(palette).sort()).toEqual([...TOKEN_NAMES].sort());
	});

	it('tracks the hue of the Source: different dominant hues produce different accent hues', () => {
		const warm = derivePalette(vividSource(20));
		const cool = derivePalette(vividSource(220));

		const warmHue = parseHsl(warm.accent).h;
		const coolHue = parseHsl(cool.accent).h;

		expect(Math.abs(warmHue - coolHue)).toBeGreaterThan(30);
	});

	it('pins accent saturation and lightness: a washed-out and a vivid Source differ only in hue', () => {
		const washedOut = derivePalette(sourcePixels([{ h: 40, s: 0.06, l: 0.55, weight: 100 }]));
		const vivid = derivePalette(vividSource(280));

		const a = parseHsl(washedOut.accent);
		const b = parseHsl(vivid.accent);

		expect(a.s).toBeCloseTo(0.58, 5);
		expect(a.l).toBeCloseTo(0.46, 5);
		expect(b.s).toBeCloseTo(0.58, 5);
		expect(b.l).toBeCloseTo(0.46, 5);
		expect(a.s).toBeCloseTo(b.s, 5);
		expect(a.l).toBeCloseTo(b.l, 5);
		expect(Math.abs(a.h - b.h)).toBeGreaterThan(10);
	});

	it.each(SAMPLE_HUES)('preserves the ground-to-surface lightness gap for hue %d', (hue) => {
		const palette = derivePalette(vividSource(hue));
		const groundL = parseHsl(palette.ground).l;
		const surfaceL = parseHsl(palette.surface).l;

		expect(surfaceL - groundL).toBeCloseTo(0.048, 5);
	});

	it.each(SAMPLE_HUES)('holds carve against surface at 4.5:1 or better for hue %d', (hue) => {
		const palette = derivePalette(vividSource(hue));
		expect(contrastRatio(palette.carve, palette.surface)).toBeGreaterThanOrEqual(4.5);
	});

	it.each(SAMPLE_HUES)('returns only valid colours for hue %d', (hue) => {
		const palette = derivePalette(vividSource(hue));
		for (const name of TOKEN_NAMES) {
			expect(isValidColor(palette[name])).toBe(true);
		}
	});

	describe('degenerate Sources', () => {
		const cases: Array<[string, Uint8ClampedArray]> = [
			['a flat single saturated colour', sourcePixels([{ h: 160, s: 0.7, l: 0.4, weight: 50 }])],
			['fully black', new Uint8ClampedArray([0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255])],
			['fully white', new Uint8ClampedArray([255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255])],
		];

		it.each(cases)('%s returns a usable palette rather than throwing', (_label, pixels) => {
			let palette: PaletteTokens | undefined;
			expect(() => {
				palette = derivePalette(pixels);
			}).not.toThrow();

			expect(Object.keys(palette!).sort()).toEqual([...TOKEN_NAMES].sort());
			for (const name of TOKEN_NAMES) {
				expect(isValidColor(palette![name])).toBe(true);
			}
			expect(contrastRatio(palette!.carve, palette!.surface)).toBeGreaterThanOrEqual(4.5);
			expect(parseHsl(palette!.surface).l - parseHsl(palette!.ground).l).toBeCloseTo(0.048, 5);
		});
	});
});
