import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { caseStudySchema, cardSchema } from './content/schemas';

const caseStudies = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/case-studies' }),
	schema: caseStudySchema,
});

const cards = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/cards' }),
	schema: cardSchema,
});

export const collections = { caseStudies, cards };
