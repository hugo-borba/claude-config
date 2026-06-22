---
name: effort-router
description: >
  Auto-scales reasoning effort (LIGHT/MEDIUM/HIGH/XHIGH/MAX) based on prompt complexity.
  Injects imperative XML <effort-directive> into model context each turn via UserPromptSubmit hook.
  Heuristic-only — no external LLM call, instant.
  Use when user invokes /effort-router or asks about effort routing behavior.
---

# Effort Router

## What this does

The `effort-router.js` hook fires on **every user prompt**. It scores complexity 0–4 using
keyword + length heuristics, then injects an XML `<effort-directive>` into context.

> **IMPORTANT:** This is **soft signaling** — it injects guidance text Claude reads as a
> `system-reminder`. It does **NOT** mutate `effortLevel` in `settings.json` or change the
> thinking-token budget allocated by the API. Actual token budget is set at session level.
> The directive works by instruction-following, not infrastructure enforcement.

---

## Tier table

| Score | Label | Typical example | Mandate |
|-------|-------|-----------------|---------|
| 0 | **LIGHT** | "what is X" / "show me file Y" — `< 250 chars` | Minimal reasoning. Be concise. |
| 1 | **MEDIUM** | Baseline. Short questions, small fixes | Standard reasoning. One pass. |
| 2 | **HIGH** | Bug fix + context, mid-length implement | Step-by-step planning required. |
| 3 | **XHIGH** | Multi-file refactor, architectural prompt | Deep systematic analysis. Map deps first. |
| 4 | **MAX** | Long + multiple hard signals stacked | Full planning. List risks. Max depth. |

> **Scoring is ACCUMULATIVE — not AND-logic.** Each signal adds points independently.
> Tier examples above are illustrative, not strict trigger conditions.

> **Naming clash:** LIGHT/MEDIUM/HIGH/XHIGH/MAX are internal hook labels.
> Native `effortLevel` config takes `low`/`normal`/`high` etc — a separate, unrelated setting.
> Setting `effortLevel = XHIGH` in `settings.json` will not work.

---

## Scoring signals (accumulation table)

| Signal | Points |
|--------|--------|
| Light pattern match AND length `< 250` | hard-set score = 0 (early return) |
| length `> 500` | +1 |
| length `> 1200` | +2 |
| Hard keyword (implement/build/architect/migrate/...) AND length `> 800` | +2 |
| Hard keyword AND length `≤ 800` | +1 |
| Medium keyword (debug/fix/optimize/improve/...) | +1 |
| Scope marker (comprehensive/entire/multiple/each step/...) | +1 |
| Baseline | starts at 1 |
| Slash commands (`/...`) except `/effort-router` | skipped entirely |

Final score clamped to `[0, 4]`.

---

## Imperative enforcement

> **Enforcement reality:** the hook only **injects text**. Compliance depends entirely on
> Claude's instruction-following. There is no infrastructure-level cutoff if Claude ignores
> the `<mandate>`. Treat these as strong norms, not hard guarantees.

<effort-enforcement>
  <rule>YOU MUST read the `<effort-directive>` injected in context each turn.</rule>
  <rule>The `<mandate>` field is a **binding instruction**, not a suggestion.</rule>
  <rule>Adjust reasoning depth, planning thoroughness, and response length accordingly.</rule>
  <rule>LIGHT → answer directly, no preamble, no elaboration.</rule>
  <rule>MEDIUM → one thinking pass, efficient response.</rule>
  <rule>HIGH → state your approach before acting. Identify edge cases.</rule>
  <rule>XHIGH → map dependencies and phases before writing any code.</rule>
  <rule>MAX → plan exhaustively, list unknowns, compare approaches, then act.</rule>
</effort-enforcement>

---

## Haiku / fast model

LIGHT tier injects `<model_hint>` signaling fast processing is appropriate.
Claude adjusts depth accordingly — main model does not swap mid-session.

To actually use `claude-haiku-4-5-20251001` for lightweight tasks, you have two options:

1. **Native `smallFastModel` setting** — if this key is valid in your Claude Code version,
   add to `settings.json`:
   ```json
   "smallFastModel": "claude-haiku-4-5-20251001"
   ```
   ⚠️ This key was NOT verified. Check Claude Code release notes before adding.

2. **Separate session** — start Claude Code with `claude --model claude-haiku-4-5-20251001`
   for a light-task session.

---

## Manual override

The hook itself parses `/effort-router <level>` and injects the matching tier directive
(marked `(manual override)` in the `<score>` field).

```
/effort-router light    → force LIGHT tier
/effort-router medium   → force MEDIUM tier
/effort-router high     → force HIGH tier
/effort-router xhigh    → force XHIGH tier
/effort-router max      → force MAX tier
```

Override applies only to the **current turn**. Next prompt re-scores automatically.

When invoked via the Skill tool with no override arg, explain the current tier system and
scoring logic.
