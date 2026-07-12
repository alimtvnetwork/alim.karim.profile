#!/usr/bin/env node
// Convert markdown image-link badges `[![alt](src "title")](href)` to HTML
// `<a href><img height="21" src alt title></a>` form across experience/**/*.md.
// Strips a leading `## ` on badge rows so they are no longer headings.
// Usage:
//   node scripts/convert-experience-badges.js                 # inventory only
//   node scripts/convert-experience-badges.js --write [file]  # mutate (single file or all)
// Errors are surfaced and the process exits non-zero on parse failure.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'experience';
const OUT_JSON = '.lovable/plans/subtasks/06-experience-badges-html-conversion/inventory.json';

const args = process.argv.slice(2);
const WRITE = args.includes('--write');
const targetFile = args.find((a) => a.endsWith('.md'));

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (p.endsWith('.md')) out.push(p);
  }
  return out;
}

// Match a single markdown image-link badge:
// [![alt](src "title")](href)   — title is optional.
const BADGE = /\[!\[([^\]]*)\]\(([^()\s"']+)(?:\s+"([^"]*)")?\)\]\(([^()\s]+)\)/g;

function convertLine(line) {
  // Strip a leading "## " (or any heading prefix) ONLY if the line is a badge row.
  let stripped = line.replace(/^#{1,6}\s+(?=\[!\[)/, '');
  let badges = 0;
  const converted = stripped.replace(BADGE, (_, alt, src, title, href) => {
    badges++;
    const t = title ? ` title="${title.replace(/"/g, '&quot;')}"` : '';
    return `<a href="${href}"><img height="21" src="${src}" alt="${alt.replace(/"/g, '&quot;')}"${t}></a>`;
  });
  return { line: converted, badges, headingStripped: stripped !== line };
}

function processFile(file) {
  const src = fs.readFileSync(file, 'utf8');
  const lines = src.split('\n');
  let totalBadges = 0;
  let rowsConverted = 0;
  let headingsStripped = 0;
  const out = lines.map((ln) => {
    if (!ln.includes('[![')) return ln;
    const r = convertLine(ln);
    if (r.badges > 0) {
      rowsConverted++;
      totalBadges += r.badges;
      if (r.headingStripped) headingsStripped++;
      // Put each badge on its own line for readability.
      return r.line.replace(/></g, '>\n<');
    }
    return ln;
  });
  return { file, totalBadges, rowsConverted, headingsStripped, output: out.join('\n') };
}

const files = targetFile ? [targetFile] : walk(ROOT);
const report = [];
for (const f of files) {
  try {
    const r = processFile(f);
    report.push({ file: r.file, badges: r.totalBadges, rows: r.rowsConverted, headingsStripped: r.headingsStripped });
    if (WRITE && r.totalBadges > 0) {
      fs.writeFileSync(f, r.output);
      console.log(`[convert] wrote ${f} — ${r.totalBadges} badges across ${r.rowsConverted} row(s), ${r.headingsStripped} heading prefix(es) stripped`);
    }
  } catch (err) {
    console.error(`[convert] FAIL ${f}: ${err.message}`);
    process.exitCode = 1;
  }
}

fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
fs.writeFileSync(OUT_JSON, JSON.stringify({ generatedAt: new Date().toISOString(), mode: WRITE ? 'write' : 'inventory', report }, null, 2));
console.log(`[convert] inventory → ${OUT_JSON} (${report.length} files, ${report.reduce((s, r) => s + r.badges, 0)} badges total)`);
