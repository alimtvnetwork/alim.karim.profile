#!/usr/bin/env node
// Minimal markdown link / image / anchor checker for this repo.
// Scans README.md, alim-ul-karim-profile.md, public profile pages, and everything under experience/.
// Verifies:
//   - relative file links resolve on disk
//   - #anchor fragments exist in the target markdown (## headings or <a id="..."></a>)
//   - <img src="..."> and ![](...) targets exist on disk
// Skips http(s) URLs and mailto:.
// Exit code: 0 = clean, 1 = broken links found.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.lovable', '.workspace', '.agents', '.claude']);
function walkAll(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkAll(p));
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}
const FILES = walkAll('.');

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\[([^ \]]+)\]\([^)]+\)/g, '$1').replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

const anchorCache = new Map();
function anchorsFor(file) {
  if (anchorCache.has(file)) return anchorCache.get(file);
  if (!fs.existsSync(file)) {
    anchorCache.set(file, null);
    return null;
  }
  const src = fs.readFileSync(file, 'utf8');
  const set = new Set();
  for (const m of src.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)) set.add(slugify(m[1]));
  for (const m of src.matchAll(/<a\s+(?:id|name)=["']([^"']+)["']/gi)) set.add(m[1].toLowerCase());
  anchorCache.set(file, set);
  return set;
}

const issues = [];
const LINK = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const HTML_HREF = /\bhref=["']([^"']+)["']/g;
const HTML_SRC = /\bsrc=["']([^"']+)["']/g;
const MD_IMG = /!\[[^\]]*\]\(([^)\s]+)\)/g;

for (const file of FILES) {
  if (!fs.existsSync(file)) continue;
  const src = fs.readFileSync(file, 'utf8');
  const dir = path.dirname(file);
  const targets = [];
  for (const r of [LINK, HTML_HREF, HTML_SRC, MD_IMG]) {
    for (const m of src.matchAll(r)) targets.push(m[1]);
  }
  for (const raw of targets) {
    if (/^(https?:|mailto:|tel:|data:|#)/i.test(raw)) {
      if (raw.startsWith('#')) {
        const anchors = anchorsFor(file);
        if (anchors && !anchors.has(raw.slice(1).toLowerCase())) {
          issues.push(`${file}: missing in-page anchor ${raw}`);
        }
      }
      continue;
    }
    if (raw.startsWith('/')) {
      issues.push(`${file}: absolute internal path not allowed (use relative): ${raw}`);
      continue;
    }
    // Skip clearly non-path values (backticks, template placeholders)
    if (/[`{}]/.test(raw)) continue;
    const [pathPart, frag] = raw.split('#');
    let decoded;
    try { decoded = decodeURIComponent(pathPart); } catch { decoded = pathPart; }
    const resolved = path.resolve(dir, decoded);
    if (!fs.existsSync(resolved)) {
      issues.push(`${file}: broken path ${raw}`);
      continue;
    }
    if (frag) {
      const anchors = anchorsFor(resolved);
      if (anchors && !anchors.has(frag.toLowerCase())) {
        issues.push(`${file}: missing anchor #${frag} in ${pathPart}`);
      }
    }
  }
}

if (issues.length) {
  console.error(`check-links: ${issues.length} issue(s):`);
  for (const i of issues) console.error('  - ' + i);
  process.exit(1);
}
console.log(`check-links: OK (${FILES.length} files scanned)`);
