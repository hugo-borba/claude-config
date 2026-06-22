#!/usr/bin/env node
// effort-router — UserPromptSubmit hook
// Classifies prompt complexity (0-4) and injects an XML effort directive.
// This is SOFT SIGNALING — injects guidance text Claude reads as system-reminder.
// Does NOT mutate effortLevel config or thinking-token budget.

'use strict';

// -------------------------------------------------------------------
// XML escaping — defensive for any future dynamic mandate text
// -------------------------------------------------------------------

function escXml(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]
  ));
}

// -------------------------------------------------------------------
// Scoring (accumulative — each signal adds points; not AND-logic)
// -------------------------------------------------------------------

function scoreComplexity(prompt) {
  const p = prompt;
  let score = 1; // baseline: MEDIUM

  // Light: short lookup / read / search
  const lightPattern = /\b(what is|what's|o que é|onde está|where is|which file|find file|list all|show me|how do i|quick question|grep for|cat |read file)\b/i;
  if (lightPattern.test(p) && p.length < 250) return 0;

  // Length bonus
  if (p.length > 1200) score += 2;
  else if (p.length > 500) score += 1;

  // Hard-task keywords: +2 only when length suggests real scope; else +1
  const hardKeywords = /\b(implement|build|create system|design|architect|scaffold|refactor|migrat|rewrite|overhaul|integrat|deploy|full feature|from scratch)\b/i;
  if (hardKeywords.test(p)) score += (p.length > 800 ? 2 : 1);

  // Medium-task keywords: fix / improve / analyze
  if (/\b(debug|investigat|analys|optim|review|audit|improv|fix|update|extend|add feature|explain how|diagnos)\b/i.test(p)) score += 1;

  // Multi-step / scope markers (dropped weak `then`/`also` → too many false positives in mid-sentence)
  if (/\b(step by step|comprehensive|complete system|entire|all of|everything|multiple|each step|every step)\b/i.test(p)) score += 1;

  return Math.min(4, Math.max(0, score));
}

// -------------------------------------------------------------------
// Manual override: /effort-router <level>
// -------------------------------------------------------------------

function parseOverride(prompt) {
  const m = /^\/effort-router\s+(light|medium|high|xhigh|max)\b/i.exec(prompt);
  if (!m) return null;
  return { light: 0, medium: 1, high: 2, xhigh: 3, max: 4 }[m[1].toLowerCase()];
}

// -------------------------------------------------------------------
// Tier definitions
// -------------------------------------------------------------------

const TIERS = {
  0: {
    label: 'LIGHT',
    mandate: 'Minimal reasoning. Simple lookup or read. Be concise and direct. No extended planning.',
    model_hint: 'Task is lightweight. Use fast processing. Prioritize brevity.',
    instruction: 'Answer directly. One pass. No preamble.'
  },
  1: {
    label: 'MEDIUM',
    mandate: 'Standard reasoning. No extended thinking required.',
    model_hint: 'Standard processing appropriate.',
    instruction: 'Think once before acting. Efficient response.'
  },
  2: {
    label: 'HIGH',
    mandate: 'YOU MUST apply extended reasoning. Think step-by-step before acting.',
    model_hint: 'Elevated effort required. Treat task as non-trivial.',
    instruction: 'Plan approach before writing. Identify edge cases. Consider alternatives before committing.'
  },
  3: {
    label: 'XHIGH',
    mandate: 'YOU MUST apply deep systematic analysis. Multi-component or architectural task detected.',
    model_hint: 'High effort required. Treat as multi-file or cross-cutting work.',
    instruction: 'Break into phases. Validate assumptions. Map dependencies and side effects before acting.'
  },
  4: {
    label: 'MAX',
    mandate: 'YOU MUST apply maximum reasoning depth. This is complex, high-stakes work requiring full planning.',
    model_hint: 'Maximum effort. Treat as large implementation or critical debugging.',
    instruction: 'Plan exhaustively. List risks and unknowns. Consider multiple approaches. Only act after full analysis.'
  }
};

// -------------------------------------------------------------------
// Main
// -------------------------------------------------------------------

let input = '';
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const prompt = (data.prompt || '').trim();

    // Manual override comes BEFORE slash skip — must intercept /effort-router
    const override = parseOverride(prompt);

    let score;
    let manual = false;
    if (override !== null) {
      score = override;
      manual = true;
    } else if (/^\//.test(prompt)) {
      // Any other slash command — let skills/other hooks handle it
      process.exit(0);
    } else {
      score = scoreComplexity(prompt);
    }

    const tier = TIERS[score];

    const xml = [
      '<effort-directive>',
      `  <level>${escXml(tier.label)}</level>`,
      `  <score>${score}/4${manual ? ' (manual override)' : ''}</score>`,
      `  <mandate>${escXml(tier.mandate)}</mandate>`,
      `  <model_hint>${escXml(tier.model_hint)}</model_hint>`,
      `  <instruction>${escXml(tier.instruction)}</instruction>`,
      '  <enforcement-reality>Soft signal only. Hook injects guidance text Claude reads as system-reminder. Does NOT change effortLevel config or thinking-token budget. Relies on instruction-following.</enforcement-reality>',
      '</effort-directive>'
    ].join('\n');

    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit',
        additionalContext: xml
      }
    }));
  } catch (e) {
    // Silent fail — never block user
    process.exit(0);
  }
});
