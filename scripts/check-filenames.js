#!/usr/bin/env node
// Enforce filename conventions for docs directories:
//  - all *.md files must be lowercase (a-z, 0-9, dash, dot, underscore)
//  - no forbidden version suffixes like -v26, -v23, etc.
// Root-level docs (README.md, CHANGELOG.md, ...) and .github/ are exempt from the
// lowercase rule since GitHub conventions require uppercase names there.

import { readdirSync, statSync } from "node:fs";
import { join, relative, basename } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["inventions", "faq", "why-hire", "skills", "experience"];
// Root-level GitHub-standard files allowed to remain uppercase.
const ROOT_UPPERCASE_ALLOWLIST = new Set([
  "README.md",
  "CHANGELOG.md",
  "LICENSE.md",
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",
  "SECURITY.md",
]);
const FORBIDDEN_SUFFIX = /-v\d+(?=\.md$)/i;
const LOWERCASE_OK = /^[a-z0-9._-]+\.md$/;

const errors = [];

function walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full);
      continue;
    }
    if (!name.endsWith(".md")) continue;
    const rel = relative(ROOT, full);
    const base = basename(name);
    if (!LOWERCASE_OK.test(base)) {
      errors.push(`${rel}: filename must be lowercase (a-z0-9._-)`);
    }
    if (FORBIDDEN_SUFFIX.test(base)) {
      errors.push(`${rel}: forbidden version suffix (-vNN) — move version to content, not filename`);
    }
  }
}

// Scan root .md files (excluding allowlisted GitHub-standard names).
for (const name of readdirSync(ROOT)) {
  if (!name.endsWith(".md")) continue;
  if (ROOT_UPPERCASE_ALLOWLIST.has(name)) continue;
  if (!LOWERCASE_OK.test(name)) {
    errors.push(`${name}: root markdown must be lowercase (a-z0-9._-)`);
  }
  if (FORBIDDEN_SUFFIX.test(name)) {
    errors.push(`${name}: forbidden version suffix (-vNN)`);
  }
}

for (const d of SCAN_DIRS) walk(join(ROOT, d));


if (errors.length) {
  console.error("[check-filenames] FAIL");
  for (const e of errors) console.error("  " + e);
  process.exit(1);
}
console.log(`[check-filenames] OK (${SCAN_DIRS.join(", ")})`);
