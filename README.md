# claude-config

Global Claude Code configuration — hooks, skills, and standards for all projects.

## What's here

| Path | Purpose |
|------|---------|
| `hooks/effort-router.js` | Auto-scale reasoning effort per prompt complexity |
| `hooks/caveman-activate.js` | SessionStart: activate caveman mode + emit ruleset |
| `hooks/caveman-config.js` | Shared config resolver + symlink-safe flag I/O |
| `hooks/caveman-mode-tracker.js` | UserPromptSubmit: track /caveman commands + per-turn reinforcement |
| `hooks/caveman-stats.js` | Token usage + savings reporter (`/caveman-stats`) |
| `hooks/caveman-statusline.ps1` | Statusline badge (Windows) |
| `hooks/caveman-statusline.sh` | Statusline badge (Linux/macOS) |
| `hooks/package.json` | CommonJS module declaration |
| `skills/effort-router/SKILL.md` | Effort router skill doc (auto-discovered by Claude Code) |
| `config/CLAUDE.md` | Global rules — copy to `~/.claude/CLAUDE.md` |
| `config/settings.template.json` | Settings template — fill NODE and paths, copy to `~/.claude/settings.json` |

---

## Dependencies

- [caveman plugin](https://github.com/JuliusBrussee/caveman) — install via Claude Code marketplace
- [ccstatusline](https://www.npmjs.com/package/ccstatusline) — `npm install -g ccstatusline`
- Node.js 18+

---

## Install on a new machine

### 1. Install dependencies

```powershell
# Windows
npm install -g ccstatusline
```

```bash
# Linux / macOS
npm install -g ccstatusline
```

Install caveman plugin via Claude Code: `/install-plugin caveman` or add to `enabledPlugins` in settings.

### 2. Copy hooks and skills

```powershell
# Windows PowerShell
$claude = "$env:USERPROFILE\.claude"
New-Item -ItemType Directory -Force "$claude\hooks", "$claude\skills\effort-router" | Out-Null
Copy-Item hooks\*.js "$claude\hooks\"
Copy-Item hooks\*.ps1 "$claude\hooks\"
Copy-Item hooks\package.json "$claude\hooks\"
Copy-Item skills\effort-router\SKILL.md "$claude\skills\effort-router\"
```

```bash
# Linux / macOS
mkdir -p ~/.claude/hooks ~/.claude/skills/effort-router
cp hooks/*.js hooks/*.sh hooks/package.json ~/.claude/hooks/
cp skills/effort-router/SKILL.md ~/.claude/skills/effort-router/
```

### 3. Configure settings.json

Copy `config/settings.template.json` to `~/.claude/settings.json` and replace:
- `NODE` → full path to node binary (e.g. `C:\...\node.exe` on Windows, `node` on Linux/macOS)
- `HOOKS_DIR` → absolute path to `~/.claude/hooks`
- `NODE_MODULES` → path to global node_modules (run `npm root -g`)

### 4. Copy CLAUDE.md

```powershell
Copy-Item config\CLAUDE.md "$env:USERPROFILE\.claude\CLAUDE.md"
```

```bash
cp config/CLAUDE.md ~/.claude/CLAUDE.md
```

---

## effort-router

Auto-scale reasoning effort via `UserPromptSubmit` hook. Scores each prompt 0–4 and injects `<effort-directive>` XML into model context.

**Soft signal only** — injects guidance text, does NOT mutate `effortLevel` or thinking-token budget.

### Scoring

| Signal | Effect |
|--------|--------|
| Light pattern AND length `< 250` | hard-set score = 0 |
| length `> 500` | +1 |
| length `> 1200` | +2 |
| Hard keyword + length `> 800` | +2 |
| Hard keyword + length `≤ 800` | +1 |
| Medium keyword (`debug`, `fix`, ...) | +1 |
| Scope marker (`comprehensive`, `entire`, ...) | +1 |
| Baseline | starts at 1 (MEDIUM) |

### Manual override (per-turn)

```
/effort-router light | medium | high | xhigh | max
```

> **Warning:** Internal tiers (LIGHT/MEDIUM/HIGH/XHIGH/MAX) ≠ native `effortLevel` values (low/normal/high). Do not mix them in settings.json.

---

## caveman mode

Terse communication mode. Drops articles/filler/pleasantries. Full technical substance preserved.

Levels: `lite` | `full` (default) | `ultra` | `wenyan-*`

Commands: `/caveman [level]` | `/caveman off` | `stop caveman` | `normal mode`

Stats: `/caveman-stats` | `/caveman-stats --all` | `/caveman-stats --since 7d`

---

## License

MIT — see [LICENSE](./LICENSE).
