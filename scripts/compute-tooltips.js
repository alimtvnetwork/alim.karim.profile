#!/usr/bin/env node
/**
 * Plan 04 — Step 7: compute new tooltip strings for every inventoried badge.
 * Step 8 (when --apply README): rewrites README.md in a single scripted pass
 * so variants stay in lockstep across both walls (top: lines 11-17, bottom:
 * lines 92-98).
 *
 * Strategy: one shared round-robin picker per file (so badge[i] in a file
 * always gets variant[i % 4]). README's top + bottom walls share the same
 * picker — they ride the same sequence — which guarantees the mirrored
 * profile (step 9) can reuse identical indices later.
 *
 * Usage:
 *   node scripts/compute-tooltips.js                  # writes computed.json only
 *   node scripts/compute-tooltips.js --apply README.md  # also rewrites the file
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { makeVariantPicker } from "./check-tooltips.js";

// ---------------------------------------------------------------------------
// Plan 05 — Step 2: locked transition-word pool (command 14).
// Source: .lovable/spec/commands/14-tooltip-prose-variety.md
// Rule: tooltips and prose sentences must rotate openers so no two
// consecutive items share their first word, AND ≥30% of sentences must
// open with a transition word from this pool. Order matters — round-robin
// callers walk the array; never repeat the previously emitted entry.
// ---------------------------------------------------------------------------
export const TRANSITION_OPENERS = Object.freeze([
  "Moreover",
  "Furthermore",
  "Additionally",
  "Beyond that",
  "In addition",
  "Notably",
  "On top of that",
  "Equally",
  "Likewise",
  "Meanwhile",
  "In practice",
  "As a result",
  "Consequently",
  "Today",
  "Currently",
  "Recently",
  "For context",
  "By contrast",
  "Crucially",
  "Importantly",
]);

/**
 * Round-robin opener picker. Skips the previously emitted opener so two
 * adjacent tooltips/sentences never share their first word.
 * @returns {() => string}
 */
export function makeOpenerPicker() {
  let i = 0;
  let last = null;
  return () => {
    let pick = TRANSITION_OPENERS[i % TRANSITION_OPENERS.length];
    if (pick === last) {
      i += 1;
      pick = TRANSITION_OPENERS[i % TRANSITION_OPENERS.length];
    }
    i += 1;
    last = pick;
    return pick;
  };
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const INVENTORY = join(
  ROOT,
  ".lovable/plans/subtasks/04-skill-tooltip-expanded-rewrite/inventory.json",
);
const OUT = join(
  ROOT,
  ".lovable/plans/subtasks/04-skill-tooltip-expanded-rewrite/computed.json",
);

const inventory = JSON.parse(readFileSync(INVENTORY, "utf8"));

// Group records by file, preserve source order.
const byFile = new Map();
for (const rec of inventory) {
  if (!byFile.has(rec.file)) byFile.set(rec.file, []);
  byFile.get(rec.file).push(rec);
}

const computed = [];
for (const [file, recs] of byFile) {
  // One picker per file; xproduct flag follows the record. Mixed files keep
  // two independent round-robins so neither sequence skips a variant.
  const generic = makeVariantPicker({ xproduct: false });
  const xprod = makeVariantPicker({ xproduct: true });
  for (const rec of recs) {
    const pick = rec.xproduct ? xprod : generic;
    let newTitle = null;
    try {
      newTitle = pick({ skill: rec.skill });
    } catch (err) {
      // Skill not yet in SKILL_YEARS — log and leave the badge untouched so a
      // later step (extend SKILL_YEARS catalog) can re-run compute and finish
      // the long-tail experience badges. README/profile skills are all covered.
      console.warn(`[compute] SKIP ${rec.file}:${rec.line} (${rec.skill}) — ${err.message}`);
    }
    computed.push({ ...rec, newTitle });
  }
}

writeFileSync(OUT, JSON.stringify(computed, null, 2));
console.log(`[compute] wrote ${computed.length} records to ${OUT}`);

// --apply <file>
const applyIdx = process.argv.indexOf("--apply");
if (applyIdx !== -1) {
  const target = process.argv[applyIdx + 1];
  if (!target) {
    console.error("[compute] --apply requires a filename");
    process.exit(2);
  }
  const targetPath = join(ROOT, target);
  let src = readFileSync(targetPath, "utf8");
  const recs = computed.filter((r) => r.file === target && r.newTitle);
  if (recs.length === 0) {
    console.error(`[compute] no inventory records with newTitle for ${target}`);
    process.exit(2);
  }
  let changed = 0;
  for (const rec of recs) {
    // Replace `"<oldTitle>"` exactly once. Title strings are unique per badge
    // (skill + year combo), so a global replace would be safe, but we scope
    // to the first occurrence to make double-applies a no-op.
    const needle = `"${rec.title}"`;
    const replacement = `"${rec.newTitle}"`;
    const at = src.indexOf(needle);
    if (at === -1) {
      console.warn(
        `[compute] ${target}:${rec.line} title not found verbatim — skipping (${rec.skill})`,
      );
      continue;
    }
    src = src.slice(0, at) + replacement + src.slice(at + needle.length);
    changed += 1;
  }
  writeFileSync(targetPath, src);
  console.log(`[compute] applied ${changed}/${recs.length} rewrites to ${target}`);
}
