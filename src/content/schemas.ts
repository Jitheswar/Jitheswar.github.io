/**
 * The Case Study and Card schemas: the fixed five-beat spine as required
 * fields, not a convention an author can skip. A Case Study missing any beat,
 * honest limits included, fails Zod validation and fails the build with it.
 *
 * Kept apart from `content.config.ts` so it can be imported directly in a
 * Vitest test, with no dependency on the `astro:content` virtual module.
 */
import { z } from 'astro/zod';

export const caseStudySchema = z.object({
	title: z.string(),
	claim: z.string(),
	headlineMetric: z.string().optional(),
	problem: z.string(),
	constraint: z.string(),
	decision: z.string(),
	rejectedAlternative: z.string(),
	honestLimits: z.string(),
	sourceUrl: z.string().url(),
	tags: z.array(z.string()),
	order: z.number(),
});

export const cardSchema = z.object({
	title: z.string(),
	claim: z.string(),
	sourceUrl: z.string().url(),
	tags: z.array(z.string()),
	order: z.number(),
});

/**
 * A Set-Piece Source: an image the palette's hue is derived from, per
 * docs/adr/0002-set-piece-samples-hue-only.md. Thin by design, since a Source
 * contributes a label and an image and nothing else - adding one is a content
 * change, not a code change.
 */
export const sourceSchema = z.object({
	label: z.string(),
	image: z.string(),
	order: z.number(),
});

/**
 * The seven non-project cells: everything on the landing page that is not a
 * Case Study or a Card. One collection, one schema per cell discriminated on
 * `cell`, so each keeps its own required shape (a missing Experience metric
 * fails the build the same way a missing Case Study beat does) while still
 * living together as ordinary content files an author edits directly.
 */
export const heroCellSchema = z.object({
	cell: z.literal('hero'),
	name: z.string(),
	line: z.string(),
	ctaLabel: z.string(),
	ctaHref: z.string().url(),
});

export const aboutCellSchema = z.object({
	cell: z.literal('about'),
	text: z.string(),
});

export const experienceCellSchema = z.object({
	cell: z.literal('experience'),
	role: z.string(),
	employer: z.string(),
	dates: z.string(),
	summary: z.string(),
	metric: z.string(),
});

export const nowCellSchema = z.object({
	cell: z.literal('now'),
	text: z.string(),
});

export const designCellSchema = z.object({
	cell: z.literal('design'),
	intro: z.string(),
	themes: z
		.array(
			z.object({
				name: z.string(),
				description: z.string(),
			}),
		)
		.length(2),
});

export const stackCellSchema = z.object({
	cell: z.literal('stack'),
	items: z.array(z.string()),
});

export const contactCellSchema = z.object({
	cell: z.literal('contact'),
	email: z.string().email(),
	github: z.string().url(),
	linkedin: z.string().url(),
	resumeHref: z.string(),
});

export const siteCellSchema = z.discriminatedUnion('cell', [
	heroCellSchema,
	aboutCellSchema,
	experienceCellSchema,
	nowCellSchema,
	designCellSchema,
	stackCellSchema,
	contactCellSchema,
]);

export type SiteCell = z.infer<typeof siteCellSchema>;
