# claude-effort-router

Auto-scale Claude Code reasoning effort (LIGHT / MEDIUM / HIGH / XHIGH / MAX) based on prompt complexity.
A `UserPromptSubmit` hook scores each user prompt with keyword + length heuristics and injects an
imperative XML `<effort-directive>` into the model's context every turn.

> **Soft signal, not budget mutation.** The hook only injects guidance text Claude reads as a
> `system-reminder`. It does **NOT** change `effortLevel` in `settings.json` or the
> thinking-token budget allocated by the API. Compliance depends on Claude's instruction-following.

---

## Files

| File | Where it goes | Purpose |
|------|---------------|---------|
| `hooks/effort-router.js` | `~/.claude/hooks/effort-router.js` | The hook script |
| `skills/effort-router/SKILL.md` | `~/.claude/skills/effort-router/SKILL.md` | Skill doc (auto-discovered by Claude Code) |

> On Windows: `~/.claude` resolves to `%USERPROFILE%\.claude` (e.g. `C:\Users\<you>\.claude`).

---

## Install

### 1. Copy files

```bash
# Linux / macOS
mkdir -p ~/.claude/hooks ~/.claude/skills/effort-router
cp hooks/effort-router.js ~/.claude/hooks/
cp skills/effort-router/SKILL.md ~/.claude/skills/effort-router/
```

```powershell
# Windows PowerShell
$claude = "$env:USERPROFILE\.claude"
New-Item -ItemType Directory -Force "$claude\hooks", "$claude\skills\effort-router" | Out-Null
Copy-Item hooks\effort-router.js "$claude\hooks\"
Copy-Item skills\effort-router\SKILL.md "$claude\skills\effort-router\"
```

### 2. Register the hook in `~/.claude/settings.json`

Add an entry to the `hooks.UserPromptSubmit` array. Sanitized snippet — replace the node path
with your local Node binary, and `<USER>` with your username:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "\"<PATH_TO_NODE>\\node.exe\" \"C:\\Users\\<USER>\\.claude\\hooks\\effort-router.js\"",
            "timeout": 5,
            "statusMessage": "Routing effort..."
          }
        ]
      }
    ]
  }
}
```

On Linux/macOS the command is simpler:

```json
{
  "type": "command",
  "command": "node ~/.claude/hooks/effort-router.js",
  "timeout": 5,
  "statusMessage": "Routing effort..."
}
```

### 3. Verify

After restarting Claude Code (or starting a new session), every user prompt should produce
a `<system-reminder>` containing an `<effort-directive>` block visible in the transcript.

Manual test:

```bash
echo '{"prompt":"what is a linked list"}' | node ~/.claude/hooks/effort-router.js
# → JSON with level=LIGHT score=0/4
```

---

## How scoring works

Accumulative — each signal adds points. Final score clamped to `[0, 4]`.

| Signal | Effect |
|--------|--------|
| Light pattern AND length `< 250` | hard-set score = 0 (early return) |
| length `> 500` | +1 |
| length `> 1200` | +2 |
| Hard keyword + length `> 800` | +2 |
| Hard keyword + length `≤ 800` | +1 |
| Medium keyword (`debug`, `fix`, `optimize`, ...) | +1 |
| Scope marker (`comprehensive`, `entire`, `each step`, ...) | +1 |
| Baseline | starts at 1 (MEDIUM) |

Hard keywords: `implement`, `build`, `create system`, `design`, `architect`, `scaffold`, `refactor`, `migrat*`, `rewrite`, `overhaul`, `integrat*`, `deploy`, `full feature`, `from scratch`.

See `skills/effort-router/SKILL.md` for the full tier table and behavior contract injected into Claude.

---

## Manual override

The hook intercepts `/effort-router <level>` as a slash command and forces a tier for the current turn:

```
/effort-router light
/effort-router medium
/effort-router high
/effort-router xhigh
/effort-router max
```

Override is per-turn — the next prompt re-scores automatically.

---

## Naming clash warning

Internal tier labels (`LIGHT`/`MEDIUM`/`HIGH`/`XHIGH`/`MAX`) are **not** the same as Claude Code's
native `effortLevel` setting (which takes `low`/`normal`/`high` etc). Don't put `XHIGH` in
`settings.json` — it won't work. They are independent layers.

---

## License

MIT — see [LICENSE](./LICENSE).
