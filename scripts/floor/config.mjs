// Single source of truth for where the floor harness's static server lives,
// shared by playwright.config.ts and scripts/floor/lighthouse.mjs.

export const FLOOR_PORT = 4322;
export const FLOOR_URL = process.env.FLOOR_URL ?? `http://localhost:${FLOOR_PORT}`;
