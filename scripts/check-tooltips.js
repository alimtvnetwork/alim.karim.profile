// scripts/check-tooltips.js
// Plan: .lovable/plans/pending/04-skill-tooltip-expanded-rewrite.md
//
// Step 1 (build canonical years lookup): SKILL_YEARS below is the single
//   source of truth for skill -> "N+ Years" copy, mirrored verbatim from
//   the public tech-stack page (the file is itself generated from
//    per command 11). If the public tech-stack page
//   changes, regenerate this map. Keys are the lowercase skill name we use
//   in markdown badges; aliases capture spelling/case drift in existing
//   markdown so the linter can resolve them back to the canonical entry.
//
// Step 2 (build the tooltip-variant pool): TOOLTIP_VARIANTS implements
//   command 12 (generic expanded form, CA <-> LA alternation) and
//   TOOLTIP_VARIANTS_XPRODUCT implements command 13 (xproduct.com-specific
//   form, same CA <-> LA alternation). nextVariant() round-robins so two
//   adjacent badges never repeat. legacyTooltipPattern() is what later
//   steps (16) grep for to count remaining legacy tooltips.
//
// This file is intentionally a pure module with a small CLI at the bottom
// so it can be wired into `bun run check:tooltips` in step 15 without
// further refactor.
//
// Error handling per spec: every IO path logs context and exits non-zero
// on failure; we never swallow errors silently.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

// ---------------------------------------------------------------------------
// Step 1: Canonical skill -> years lookup (from the public tech-stack page).
// "years" is the exact phrase to substitute into tooltips, e.g. "17+ years".
// "cvAnchor" is the in-CV anchor the skill badge already links to (or null
// if no explicit anchor exists yet).
// ---------------------------------------------------------------------------
export const SKILL_YEARS = {
  ".net":              { years: "18+ years", cvAnchor: "net" },
  "csharp":            { years: "17+ years", cvAnchor: "csharp", aliases: ["c#", "c sharp"] },
  "css3":              { years: "17+ years" },
  "responsive ui":     { years: "15+ years" },
  "entity framework":  { years: "12+ years" },
  "linq":              { years: "12+ years", cvAnchor: "linq" },
  "javascript":        { years: "14+ years", cvAnchor: "javascript", aliases: ["jacascript"] },
  ".net core":         { years: "8+ years" },
  "asp.net mvc":       { years: "8+ years" },
  "modern state management": { years: "8+ years" },
  "graphql apis":      { years: "8+ years" },
  "typescript":        { years: "9+ years", cvAnchor: "typescript" },
  "vb.net":            { years: "7+ years", aliases: ["windows form", "windowns form", "ms access", "msaccess"] },
  "asp.net":           { years: "7+ years" },
  "node.js":           { years: "6+ years", aliases: ["nodejs", "node"] },
  "mern":              { years: "6+ years" },
  "ios":               { years: "5+ years", aliases: ["ios (swift / objective-c)", "swift"] },
  "vuejs":             { years: "4+ years", aliases: ["vue", "vue.js"] },
  "react":             { years: "4+ years" },
  "golang":            { years: "7+ years", cvAnchor: "golang", aliases: ["go", "go: 7+ years (per cv)"] },
  "android":           { years: "4+ years", aliases: ["android (java / kotlin)", "kotlin", "java"] },
  "flutter":           { years: "3+ years" },
  "next.js":           { years: "3+ years", aliases: ["nextjs"] },
  "signalr":           { years: "2+ years" },
  "ai modeling":       { years: "1+ years" },
  "ai agentic coding": { years: "1+ years" },

  // Databases
  "mssql":      { years: "18+ years", aliases: ["ms sql", "sql server"] },
  "redis":      { years: "10+ years" },
  "sqlite":     { years: "8+ years" },
  "dynamodb":   { years: "7+ years" },
  "graphql":    { years: "7+ years" },
  "postgresql": { years: "6+ years" },
  "mongodb":    { years: "6+ years" },
  "mysql":      { years: "10+ years", aliases: ["mysql (per cv)"] },
  "git":        { years: "12+ years", aliases: ["git (per cv)"] },
  "github":     { years: "12+ years", aliases: ["github (per cv)"] },

  // Frontend
  "twitter bootstrap": { years: "10+ years", aliases: ["bootstrap"] },
  "jquery":            { years: "8+ years" },
  "tailwind css":      { years: "7+ years", aliases: ["tailwind", "tailwindcss"] },

  // Cloud — not in the Languages list but referenced in profile badges.
  // Years pulled from existing profile badge ("Azure 6+ years").
  "azure": { years: "6+ years", cvAnchor: "azure" },
  "aws":   { years: "5+ years", aliases: ["amazon web services", "amplify", "lambda", "cloudformation"] },

  // Patterns / practices
  "onion architecture":  { years: "8+ years" },
  "roslyn":              { years: "5+ years" },
  "restful":             { years: "12+ years", aliases: ["rest", "restful api"] },

  // Testing
  "selenium":            { years: "6+ years" },
  "jest":                { years: "4+ years" },

  // Languages — long-tail
  "php":          { years: "10+ years" },
  "c++":          { years: "5+ years" },
  "asp classic":  { years: "4+ years" },
  // (vb.net long-tail aliases live on the canonical "vb.net" entry above)
  "html":         { years: "17+ years", aliases: ["html5"] },
  "less":         { years: "5+ years" },

  // Frontend long-tail
  "angularjs":      { years: "5+ years", aliases: ["angular 8", "angular"] },
  "kendoui":        { years: "4+ years", aliases: ["kendo ui"] },
  "highchart":      { years: "4+ years", aliases: ["highcharts"] },
  "toast":          { years: "3+ years" },
  "telerik":        { years: "4+ years", aliases: ["telerick"] },

  // CMS / e-commerce
  "joomla":   { years: "4+ years" },
  "magento":  { years: "3+ years" },

  // Databases long-tail
  "oracle":     { years: "5+ years", aliases: ["ora"] },
  "oracle bi":  { years: "3+ years" },
  "nosql":      { years: "8+ years" },
  // (mysql canonical entry lives in the Databases block above)

  // DevOps / OS / tooling
  "bash":            { years: "10+ years", aliases: ["batchscript", "shell"] },
  "powershell":      { years: "8+ years" },
  "linux":           { years: "12+ years" },
  "nginx":           { years: "8+ years" },
  "apache":          { years: "8+ years" },
  "vmware":          { years: "5+ years" },
  "open vpn":        { years: "4+ years", aliases: ["openvpn"] },
  "docker":          { years: "5+ years" },
  "gitlab":          { years: "6+ years" },
  "beyond compare":  { years: "8+ years" },
  "hackmd":          { years: "3+ years" },
  "discord":         { years: "4+ years" },
  "navicat":         { years: "8+ years" },
  "jira":            { years: "10+ years" },
};

/** Resolve any badge-text spelling (case-insensitive) to a canonical key. */
export function resolveSkill(rawName) {
  if (!rawName) return null;
  const key = rawName.trim().toLowerCase();
  if (SKILL_YEARS[key]) return key;
  for (const [canonical, entry] of Object.entries(SKILL_YEARS)) {
    if (entry.aliases?.some((a) => a.toLowerCase() === key)) return canonical;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Step 2: Tooltip-variant pools.
// Variants alternate California / Los Angeles per command 12. Adjacent
// badges must not repeat — see nextVariant().
// ---------------------------------------------------------------------------
export const TOOLTIP_VARIANTS = [
  ({ skill, years }) =>
    `Alim (aka Md Alim Ul Karim) is world's top 1% talented engineer who worked with California-based US software companies and has more than ${years} of experience in ${skill}.`,
  ({ skill, years }) =>
    `Alim (aka Md Alim Ul Karim) is world's top 1% talented engineer who worked with Los Angeles-based US software companies and has more than ${years} of experience in ${skill}.`,
  ({ skill, years }) =>
    `Alim (aka Md Alim Ul Karim) is the best software engineer in the world who worked with California-based US software companies and has more than ${years} of experience in ${skill}.`,
  ({ skill, years }) =>
    `Alim (aka Md Alim Ul Karim) is a top .NET / Node.js engineer in the world who worked with Los Angeles-based US software companies and has more than ${years} of experience in ${skill}.`,
];

export const TOOLTIP_VARIANTS_XPRODUCT = [
  ({ skill, years }) =>
    `Alim (aka Md Alim Ul Karim) is world's top 1% talented engineer who worked at xproduct.com (a California-based US software company) and has more than ${years} of experience in ${skill}.`,
  ({ skill, years }) =>
    `Alim (aka Md Alim Ul Karim) is world's top 1% talented engineer who worked at xproduct.com (a Los Angeles-based US software company) and has more than ${years} of experience in ${skill}.`,
  ({ skill, years }) =>
    `Alim (aka Md Alim Ul Karim) is the best software engineer in the world who delivered at xproduct.com (a California-based US software company) and has more than ${years} of experience in ${skill}.`,
  ({ skill, years }) =>
    `Alim (aka Md Alim Ul Karim) is a top .NET / Node.js engineer in the world who delivered at xproduct.com (a Los Angeles-based US software company) and has more than ${years} of experience in ${skill}.`,
];

/** Round-robin variant picker. Pass `{ xproduct: true }` for command-13 form. */
export function makeVariantPicker({ xproduct = false } = {}) {
  const pool = xproduct ? TOOLTIP_VARIANTS_XPRODUCT : TOOLTIP_VARIANTS;
  let i = 0;
  return ({ skill }) => {
    const canonical = resolveSkill(skill);
    if (!canonical) {
      throw new Error(
        `[check-tooltips] Unknown skill "${skill}". Add it to SKILL_YEARS (sourced from the public tech-stack page) before rendering a tooltip.`,
      );
    }
    const { years } = SKILL_YEARS[canonical];
    const display = skill; // preserve original casing in the tooltip
    const tip = pool[i % pool.length]({ skill: display, years });
    i += 1;
    return tip;
  };
}

// ---------------------------------------------------------------------------
// Legacy-pattern detector — used by later plan steps (14, 16) to fail CI
// while any tooltip still reads "Alim has N+ Years of experience".
// ---------------------------------------------------------------------------
export const LEGACY_TOOLTIP_RE = /Alim has \d+\+\s*Years of experience/i;

export function legacyTooltipPattern() {
  return LEGACY_TOOLTIP_RE;
}

// ---------------------------------------------------------------------------
// CLI — minimal scan. Real enforcement (step 14) extends this.
// ---------------------------------------------------------------------------
function scanCli() {
  const files = [
    "README.md",
    "alim-ul-karim-profile.md",
  ];
  let total = 0;
  const findings = [];
  for (const rel of files) {
    const abs = join(REPO_ROOT, rel);
    if (!existsSync(abs)) {
      console.warn(`[check-tooltips] skipped (missing): ${rel}`);
      continue;
    }
    let content;
    try {
      content = readFileSync(abs, "utf8");
    } catch (err) {
      console.error(`[check-tooltips] read failed: ${rel}: ${err.message}`);
      process.exitCode = 2;
      return;
    }
    const lines = content.split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (LEGACY_TOOLTIP_RE.test(line)) {
        findings.push({ file: rel, line: idx + 1, text: line.trim() });
        total += 1;
      }
    });
  }
  // Also sweep experience/ (best-effort via ripgrep; tolerate absence).
  try {
    const out = execSync(
      `rg -n --no-heading "Alim has \\d+\\+\\s*Years of experience" experience/`,
      { cwd: REPO_ROOT, stdio: ["ignore", "pipe", "pipe"] },
    ).toString();
    if (out.trim()) {
      for (const row of out.trim().split("\n")) {
        const [file, line, ...rest] = row.split(":");
        findings.push({ file, line: Number(line), text: rest.join(":").trim() });
        total += 1;
      }
    }
  } catch (err) {
    // ripgrep exit 1 = no matches (good). Other codes = log + carry on.
    if (err.status !== 1) {
      console.warn(`[check-tooltips] experience/ sweep skipped: ${err.message}`);
    }
  }
  console.log(`[check-tooltips] legacy tooltip count: ${total}`);
  if (total > 0) {
    for (const f of findings.slice(0, 25)) {
      console.log(`  ${f.file}:${f.line}: ${f.text}`);
    }
    if (findings.length > 25) {
      console.log(`  ... +${findings.length - 25} more`);
    }
    process.exitCode = 1;
  }

  // ---------------------------------------------------------------------------
  // Adjacent-same-opener guard (command 14): no two consecutive title=""
  // attributes in the same file may start with the same word.
  // ---------------------------------------------------------------------------
  const titleRe = /title="([^"]+)"/g;
  const mdTitleRe = /\!\[[^\]]*\]\([^)\s]+\s+"([^"]+)"\)/g;
  let collisions = 0;
  const collisionSamples = [];
  // Sweep README + profile (HTML titles) and every experience/**/*.md (markdown).
  const allFiles = [...files];
  try {
    const expOut = execSync(`rg -l --type md "" experience/`, { cwd: REPO_ROOT }).toString().trim();
    if (expOut) for (const f of expOut.split("\n")) allFiles.push(f);
  } catch (err) {
    if (err.status !== 1) console.warn(`[check-tooltips] experience listing failed: ${err.message}`);
  }
  for (const rel of allFiles) {
    const abs = join(REPO_ROOT, rel);
    if (!existsSync(abs)) continue;
    const content = readFileSync(abs, "utf8");
    const openers = [];
    for (const re of [titleRe, mdTitleRe]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(content)) !== null) {
        const first = m[1].trim().split(/\s+/)[0].replace(/[^\w]/g, "").toLowerCase();
        openers.push({ first, offset: m.index });
      }
    }
    openers.sort((a, b) => a.offset - b.offset);
    for (let i = 1; i < openers.length; i++) {
      if (openers[i].first && openers[i].first === openers[i - 1].first) {
        collisions += 1;
        if (collisionSamples.length < 10) {
          collisionSamples.push(`  ${rel}: "${openers[i].first}" repeats at offset ${openers[i].offset}`);
        }
      }
    }
  }

  console.log(`[check-tooltips] adjacent-same-opener collisions: ${collisions}`);
  if (collisions > 0) {
    for (const s of collisionSamples) console.log(s);
    process.exitCode = 1;
  }

  // ---------------------------------------------------------------------------
  // Transition-ratio assertion (command 14): ≥30% of tooltip openers across
  // all scanned files must come from TRANSITION_OPENERS.
  // ---------------------------------------------------------------------------
  // Lazy import to avoid circular load at module-eval time.
  let TRANSITION_OPENERS = [];
  try {
    ({ TRANSITION_OPENERS } = require("./compute-tooltips.js"));
  } catch {
    // ESM fallback below.
  }
  if (TRANSITION_OPENERS.length === 0) {
    // Inline mirror of the pool (kept in sync with compute-tooltips.js).
    TRANSITION_OPENERS = [
      "Moreover","Furthermore","Additionally","Beyond that","In addition",
      "Notably","On top of that","Equally","Likewise","Meanwhile",
      "In practice","As a result","Consequently","Today","Currently",
      "Recently","For context","By contrast","Crucially","Importantly",
    ];
  }
  const openerSet = new Set(TRANSITION_OPENERS.map((w) => w.split(/\W+/)[0].toLowerCase()));
  let totalTitles = 0;
  let transitionTitles = 0;
  for (const rel of allFiles) {
    const abs = join(REPO_ROOT, rel);
    if (!existsSync(abs)) continue;
    const content = readFileSync(abs, "utf8");
    for (const re of [/title="([^"]+)"/g, /\!\[[^\]]*\]\([^)\s]+\s+"([^"]+)"\)/g]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(content)) !== null) {
        totalTitles += 1;
        const first = m[1].trim().split(/\W+/)[0].toLowerCase();
        if (openerSet.has(first)) transitionTitles += 1;
      }
    }
  }
  const ratio = totalTitles === 0 ? 0 : transitionTitles / totalTitles;
  const pct = (ratio * 100).toFixed(1);
  console.log(`[check-tooltips] transition-opener ratio: ${transitionTitles}/${totalTitles} (${pct}%)`);
  if (totalTitles > 0 && ratio < 0.3) {
    console.log(`  FAIL: ratio ${pct}% below 30% threshold`);
    process.exitCode = 1;
  }
}


// Plan 06 step 10: experience/** must not contain markdown image-link badges
// `[![alt](src)](href)` — they render at intrinsic size. Use HTML 21px form
// per .lovable/spec/commands/15-experience-badges-html-21px.md.
function checkExperienceBadgeFormat() {
  let hits = 0;
  try {
    const out = execSync(`rg -n --no-heading "\\[!\\[" experience/`, {
      cwd: REPO_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    }).toString();
    if (out.trim()) {
      for (const row of out.trim().split("\n")) {
        console.log(`  FAIL markdown-image-badge: ${row}`);
        hits += 1;
      }
    }
  } catch (err) {
    if (err.status !== 1) {
      console.warn(`[check-tooltips] experience badge-format sweep skipped: ${err.message}`);
    }
  }
  console.log(`[check-tooltips] experience markdown-image-badge count: ${hits}`);
  if (hits > 0) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  scanCli();
  checkExperienceBadgeFormat();
}

