# 10: Agent Spend Policy Engine Case Study

**What to build:** The Case Study for autonomous agent spend controls with real x402 payments on Algorand testnet, live at its own URL.

This is the most current and least copied idea in the portfolio.
The decision beat is the interesting one: enforcing a spend policy rather than trusting an agent is a stance, and the alternative was trusting it.

**Blocked by:** 06.

**Status:** done

- [x] All five spine beats present, in the same order as every other Case Study.
- [x] Drafted from the repository, then edited line by line by Jitheswar before it ships.
- [x] The decision beat names what was rejected, not only what was chosen.
- [x] Testnet is stated plainly as testnet. No implication of production or of real funds at risk.
- [x] Source link to the public repository.
- [x] Readable in full with JavaScript disabled, in under four minutes.
- [x] The Floor harness stays green.

## Comments

As with ticket 09, ticket 06 already made publishing a Case Study a pure content change, so this ticket needed exactly one new file: `src/content/case-studies/agent-spend-policy-engine.md`, with `order: 3` so it sits between SIH26038 and the spec's not-yet-built Contextual Priority Case Study.

Source material was the `Jitheswar/agent-spend-policy-engine` GitHub repository, cloned locally: its README for the architecture, the control-chain table, the "Why this needs a blockchain" reasoning, and the numbered "Known limitations" section, plus `policy_engine/storage.py` (`tamper_with_event`) read directly to verify one specific technical claim (see below).

The five beats: the problem is that autonomous agents are starting to call paid APIs unsupervised, which means a spend-governance system has two jobs, not one - deciding whether a spend is allowed, and making the record of that decision itself trustworthy to someone with no reason to trust the operator; the constraint is that a governance system's whole product is its record, so if that record lives only in a mutable operator database, every guarantee is worth exactly as much as trust in whoever runs it; the decision is the tested check chain enforced before any payment plus, separately, a hash-chained audit ledger whose head is periodically anchored on Algorand so the record is checkable against a public indexer without trusting the codebase; the rejected alternative is a hash-chained ledger with no external anchor, which is real protection against a careless single-entry edit but not against a tamperer with full database access who cascades the recomputation all the way to the head; and honest limits states plainly that a hash chain can never detect an edit to its own most recent entry, plus the x402 facilitator's single-point-of-failure status and that the paid upstreams are free (no real arbitrage).

Testnet is stated four times across the claim, headline metric, and decision beat, with no mention of production or mainnet anywhere on the page.

Tags are `Python`, `FastAPI`, `Algorand`, `x402`, matching the project's actual stack rather than a generic blockchain tag, per the same Secondary Reader rationale ticket 09 used.

First draft got two things wrong, both caught before commit:

1. `/code-review`'s Standards axis found every prose field used ordinary paragraph-wrap that ran multiple sentences onto one physical line, breaking both the global one-sentence-per-line instruction and the established convention in `liquid-glass.md` and `sih26038.md` (verified: neither sibling file ever puts a sentence boundary mid-line). Reflowed all five beats so every sentence starts its own line.
2. `/code-review`'s Spec axis flagged the rejected-alternative beat's claim that the dashboard's tamper demo "recomputes the downstream chain" and is only caught by the on-chain anchor, as factually backwards. Read `storage.py` directly to confirm: `tamper_with_event` recomputes only the edited entry's own hash, and its own docstring says this "fails verification because the NEXT event's prev_hash no longer matches" - i.e. plain local chain-linkage already catches this exact demo case, and the anchor is what closes the harder, undemonstrated gap of a tamperer who cascades the recomputation all the way to the head. Rewrote the beat around the accurate distinction (local-chain-only vs. chain-plus-anchor) rather than the original, backwards claim.

`npm run typecheck`, `npm run test` (48 Vitest assertions, untouched), `npm run build`, and the full `npm run test:floor` (bundle size unchanged at 60.18KB gzipped against the 100KB budget, Lighthouse accessibility 100 with LCP 1.5s, and all 8 Playwright specs) all pass with no changes needed to any test file, both before and after the two corrections above.

Verified visually with `agent-browser` against the production build: the new project cell renders between SIH26038 and About on the landing page at 1280px, and the Case Study article itself renders all five beats, the headline metric, tags, and source link correctly, with no stray markdown syntax leaking through (the `[slug].astro` route renders body fields as plain text with no Markdown processing, so an earlier draft's backticks around code identifiers were caught and removed before commit).

Reviewed with `/code-review` (Standards and Spec axes, both against `1772913`, the ticket 09 commit this ticket's diff sits on top of) via two parallel sub-agents. Findings from the first pass (sentence-wrapping violation, the tamper-demo factual error, a minor "known agent" omission from the decision beat's check-chain list, and a judgement-call note about `rejectedAlternative` and `honestLimits` both leaning on the same "self-consistent" phrasing) were all fixed inline above rather than left as open findings, and the harness was re-run clean afterward. The only remaining judgement call is the same one ticket 09 recorded: `Status: done` is not one of the five canonical triage labels, but is now used identically by 9 of the other 11 ticket files.
