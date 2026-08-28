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
