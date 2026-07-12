#!/usr/bin/env node
/**
 * Plan 05 — Step 3: rewrite consecutive title="..." attributes in target
 * files so no two adjacent tooltips share their first word. Strategy:
 * prepend a rotating transition opener from TRANSITION_OPENERS so each
 * tooltip becomes `<Opener>, <original>` with the first letter of the
 * original lowercased. This is the minimum correct change tied to the
 * adjacent-same-opener root cause flagged by scripts/check-tooltips.js.
 *
 * Errors are surfaced (non-zero exit) with file context — no silent skip.
 *
 * Usage: node scripts/apply-opener-variety.js <file> [<file>...]
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { TRANSITION_OPENERS, makeOpenerPicker } from "./compute-tooltips.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("[apply-opener-variety] usage: <file> [<file>...]");
  process.exit(2);
}

const OPENER_SET = new Set(TRANSITION_OPENERS.map((w) => w.toLowerCase().split(/\W+/)[0]));

function stripExistingOpener(title) {
  // If title already starts with a known transition opener followed by comma,
  // strip it so we re-rotate cleanly (idempotent across runs).
  const m = title.match(/^([A-Za-z]+(?:\s[A-Za-z]+)?),\s+(.+)$/);
  if (!m) return title;
  const head = m[1].toLowerCase();
  if (OPENER_SET.has(head.split(/\W+/)[0])) {
    // Restore capitalization of the rest.
    const rest = m[2];
    return rest.charAt(0).toUpperCase() + rest.slice(1);
  }
  return title;
}

let exit = 0;
for (const rel of files) {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) {
    console.error(`[apply-opener-variety] missing: ${rel}`);
    exit = 1;
    continue;
  }
  let src;
  try {
    src = readFileSync(abs, "utf8");
  } catch (err) {
    console.error(`[apply-opener-variety] read failed ${rel}: ${err.message}`);
    exit = 1;
    continue;
  }

  const pickOpener = makeOpenerPicker();
  let changed = 0;
  // Pattern A: HTML title="..." attributes.
  let out = src.replace(/title="([^"]+)"/g, (_full, raw) => {
    const cleaned = stripExistingOpener(raw);
    const opener = pickOpener();
    const lowered = cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
    changed += 1;
    return `title="${opener}, ${lowered}"`;
  });
  // Pattern B: Markdown image tooltips inside ![alt](src "title").
  // Only quoted title segments preceded by a space inside parentheses qualify.
  out = out.replace(/(\!\[[^\]]*\]\([^)\s]+\s+")([^"]+)(")/g, (_full, pre, raw, post) => {
    const cleaned = stripExistingOpener(raw);
    const opener = pickOpener();
    const lowered = cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
    changed += 1;
    return `${pre}${opener}, ${lowered}${post}`;
  });


  if (changed === 0) {
    console.log(`[apply-opener-variety] ${rel}: no title="" attributes — skipped`);
    continue;
  }
  try {
    writeFileSync(abs, out);
  } catch (err) {
    console.error(`[apply-opener-variety] write failed ${rel}: ${err.message}`);
    exit = 1;
    continue;
  }
  console.log(`[apply-opener-variety] ${rel}: rewrote ${changed} tooltips`);
}

process.exit(exit);
