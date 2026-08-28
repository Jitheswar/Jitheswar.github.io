import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { caseStudySchema, cardSchema, sourceSchema, siteCellSchema } from './content/schemas';

const caseStudies = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/case-studies' }),
	schema: caseStudySchema,
});

const cards = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/cards' }),
	schema: cardSchema,
});

const sources = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/sources' }),
	schema: sourceSchema,
});

const site = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/site' }),
	schema: siteCellSchema,
});

export const collections = { caseStudies, cards, sources, site };
