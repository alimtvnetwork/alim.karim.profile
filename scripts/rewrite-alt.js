#!/usr/bin/env node
/**
 * Plan 04 — Step 13: rewrite the `alt=` portion of every badge so the
 * accessibility label mirrors the new tooltip — keep skill + years, drop the
 * legacy " (see CV)" suffix.
 *
 * Pattern in source: `![<oldAlt>](<img>` where <oldAlt> is currently the raw
 * skill name. New alt: `<Skill> — <years>` (e.g. "C# — 12+ years"). Pulls
 * years from SKILL_YEARS so the alt text stays in sync with the tooltip.
 *
 * Usage:
 *   node scripts/rewrite-alt.js                # dry-run report
 *   node scripts/rewrite-alt.js --apply        # rewrite all inventoried files
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SKILL_YEARS, resolveSkill } from "./check-tooltips.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const COMPUTED = join(
  ROOT,
  ".lovable/plans/subtasks/04-skill-tooltip-expanded-rewrite/computed.json",
);

const computed = JSON.parse(readFileSync(COMPUTED, "utf8"));
const apply = process.argv.includes("--apply");

function newAltFor(skill) {
  const canonical = resolveSkill(skill);
  if (!canonical) return skill; // leave untouched if unknown
  const { years } = SKILL_YEARS[canonical];
  return `${skill} — ${years}`;
}

const byFile = new Map();
for (const rec of computed) {
  if (!rec.newTitle) continue; // only touch badges whose tooltip was rewritten
  if (!byFile.has(rec.file)) byFile.set(rec.file, []);
  byFile.get(rec.file).push(rec);
}

let totalApplied = 0;
let totalSkipped = 0;
for (const [file, recs] of byFile) {
  const path = join(ROOT, file);
  let src = readFileSync(path, "utf8");
  let cursor = 0;
  let applied = 0;
  let skipped = 0;
  for (const rec of recs) {
    const newAlt = newAltFor(rec.skill);
    if (newAlt === rec.skill) {
      skipped += 1;
      continue;
    }
    // Anchor on the unique alt+img pair to avoid cross-record collisions.
    const needle = `![${rec.skill}](${rec.img}`;
    const replacement = `![${newAlt}](${rec.img}`;
    const at = src.indexOf(needle, cursor);
    if (at === -1) {
      // Fall back: maybe alt text was already rewritten on a previous run.
      const already = src.indexOf(`![${newAlt}](${rec.img}`, cursor);
      if (already !== -1) {
        cursor = already + replacement.length;
        skipped += 1;
        continue;
      }
      console.warn(`[alt] ${file}:${rec.line} ${rec.skill} not found`);
      skipped += 1;
      continue;
    }
    src = src.slice(0, at) + replacement + src.slice(at + needle.length);
    cursor = at + replacement.length;
    applied += 1;
  }
  if (apply) writeFileSync(path, src);
  console.log(
    `[alt] ${apply ? "APPLY" : "DRY  "} ${file} — applied=${applied} skipped=${skipped}`,
  );
  totalApplied += applied;
  totalSkipped += skipped;
}
console.log(`[alt] total applied=${totalApplied} skipped=${totalSkipped}`);
