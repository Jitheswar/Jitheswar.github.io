---
title: Agent Spend Policy Engine
claim: >-
  A policy engine that decides whether an autonomous agent's spend is allowed
  before any payment is attempted, then settles the approved ones for real in
  testnet USDC on Algorand and anchors its own audit trail on-chain so the
  record can't be quietly rewritten.
headlineMetric: About ten seconds to verify every decision against its Algorand testnet anchor
problem: |
  Autonomous agents are starting to call paid APIs on their own, one HTTP
  request at a time, with no human approving each call before it goes out.
  A spend-governance system for that has two jobs, not one: decide whether
  this specific spend is allowed, and make sure the record of what it
  allowed or blocked can be trusted by someone who has no reason to trust
  the operator running it.
  Most demonstrations of agentic payments only build the first job.
  Micropayments between software with no prior relationship, no invoice,
  and no account are also a genuinely awkward fit for card rails, which
  assume a billing relationship and a human on at least one end.
constraint: |
  A spend-governance system's whole product is its record of what
  happened: this agent was allowed to spend this, this one was stopped.
  If that record lives only in the operator's own database, the operator
  can rewrite it, and every guarantee the system offers is worth exactly
  as much as trust in whoever runs it - the one failure mode governance
  software cannot have.
  Proving otherwise has to work without the reader trusting this codebase
  or the machine it runs on, since that portability is the entire point
  of building the proof in the first place.
decision: |
  Every spend request runs a fixed, tested check chain before any payment
  is attempted - known agent, identity, kill switch, allowed action, call
  arguments, per-request limit, velocity, daily cap, human-approval
  threshold - and a denial never reaches the resource server, so no
  payment is ever attempted for a blocked request.
  Approved spends settle for real, in testnet USDC, through the x402
  protocol against a public Algorand facilitator.

  Separately from payment, every decision, allowed or denied, is
  appended to an append-only hash-chained ledger, and the chain's head
  is periodically written into an Algorand transaction's note field.
  Rewriting local history afterward produces a ledger that disagrees
  with a hash sitting in a block nobody involved can edit, checkable by
  anyone against the public Algorand indexer without trusting this
  codebase at all.
  A verification script does exactly that in about ten seconds, and
  returns success only if the chain is intact and confirmed on-chain.
rejectedAlternative: |
  The obvious, weaker alternative is a hash-chained ledger with no
  independent, external checkpoint - relying only on the chain's own
  internal links to prove nothing has been rewritten.
  That is real protection against a careless edit: change one past
  record without touching what comes after it, and the very next
  entry's stored link to it no longer matches, so local verification
  catches it immediately - the dashboard's "Tamper with a record"
  button demonstrates exactly this case, and it is exactly what gets
  caught.
  But a tamperer with full database access is not limited to editing
  one row: they can recompute every hash after the edited entry, all
  the way to the head, so every internal link in the rewritten chain
  agrees with itself.
  A chain with nothing outside it to check against cannot tell that
  story from the truth.
  Anchoring the chain's head into an Algorand transaction closes
  exactly that gap: the anchor holds a hash the attacker's own machine
  cannot also rewrite, so even a full end-to-end forgery disagrees
  with a fact recorded in a block nobody involved controls.
honestLimits: |
  A hash chain cannot detect an edit to its own most recent entry:
  there is no later entry yet to disagree with it, so a tamperer who
  edits it and recomputes its hash leaves nothing downstream to
  contradict them.
  Only an anchor closes that gap, and only once one exists, which is
  why anchoring runs automatically roughly every eight decisions
  rather than on request.
  The x402 facilitator is also a single point of failure: settlement
  is outsourced to a public, third-party facilitator, and if it is
  down, every payment fails.
  And the paid APIs behind the paywall - weather lookups, company
  filings - sit in front of free upstreams; the cents charged
  demonstrate metered settlement between an agent and an API it has
  no account with, not real arbitrage or a real vendor bill.
sourceUrl: https://github.com/Jitheswar/agent-spend-policy-engine
tags:
  - Python
  - FastAPI
  - Algorand
  - x402
order: 3
---
