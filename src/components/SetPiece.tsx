/**
 * The Set-Piece: choosing a Source recolours the page.
 *
 * This is the only JavaScript on the route, per the initial-route JS budget
 * in docs/adr/0001-practical-floor.md. Selecting a Source draws it onto a
 * small canvas, reads its pixels, and calls `derivePalette` (ticket 04) - the
 * same seam the Vitest suite holds to its invariants. The result is written
 * straight onto `documentElement`'s custom properties, so Restrained Clay's
 * tokens (src/styles/global.css) recolour with no React re-render and no
 * layout shift anywhere else on the page.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { derivePalette, type PaletteTokens } from '../lib/derive-palette';

export interface Source {
	id: string;
	label: string;
	image: string;
}

interface Props {
	sources: Source[];
}

// Matches the token contract's own listing, in src/lib/derive-palette.ts and
// mirrored by that module's Vitest suite (src/lib/derive-palette.test.ts).
const TOKEN_NAMES: Array<keyof PaletteTokens> = ['ground', 'surface', 'ink', 'muted', 'accent', 'carve', 'shadow'];

// Small and fixed: derivePalette samples every pixel it's given, and the
// canvas is also the visible thumbnail, so this stays cheap without needing
// to skip pixels.
const CANVAS_WIDTH = 96;
const CANVAS_HEIGHT = 64;

function applyPalette(palette: PaletteTokens) {
	const root = document.documentElement.style;
	for (const name of TOKEN_NAMES) {
		root.setProperty(`--color-${name}`, palette[name]);
	}
}

export default function SetPiece({ sources }: Props) {
	const [selectedId, setSelectedId] = useState(sources[0]?.id);
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const selectSource = useCallback((source: Source) => {
		setSelectedId(source.id);

		const canvas = canvasRef.current;
		const ctx = canvas?.getContext('2d');
		if (!canvas || !ctx) return;

		const image = new Image();
		image.decoding = 'async';
		image.onload = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
			const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
			applyPalette(derivePalette(data));
		};
		image.src = source.image;
	}, []);

	// The pre-selected default (global.css's static hue-22 palette) is a
	// starting point, not a guarantee: nothing keeps it in step with whatever
	// hue the first Source's actual pixels sample to. Running it through the
	// same derivePalette path as every other selection, once on mount, is
	// what makes that guarantee real instead of assumed.
	useEffect(() => {
		const initial = sources[0];
		if (initial) selectSource(initial);
	}, []);

	return (
		<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
			<canvas
				ref={canvasRef}
				width={CANVAS_WIDTH}
				height={CANVAS_HEIGHT}
				aria-hidden="true"
				className="clay h-16 w-24 shrink-0"
			/>
			<div role="group" aria-label="Source" className="flex flex-wrap gap-2">
				{sources.map((source) => (
					<button
						key={source.id}
						type="button"
						aria-pressed={source.id === selectedId}
						onClick={() => selectSource(source)}
						className="clay clay-pressable px-3 py-1.5 text-sm text-ink aria-pressed:outline-2 aria-pressed:outline-accent aria-pressed:outline-offset-2"
					>
						{source.label}
					</button>
				))}
			</div>
		</div>
	);
}
