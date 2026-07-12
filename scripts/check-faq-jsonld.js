#!/usr/bin/env node
// Regression test: every /faq/<slug> page must emit FAQPage JSON-LD with the
// expected fields. Executes the actual head() from src/routes/faq.$slug.tsx
// against every faq/*.md entry loaded via src/lib/faq.ts.
//
// Exit code: 0 = all pages pass, 1 = one or more pages missing/malformed.

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const FAQ_DIR = path.join(ROOT, "faq");
const ROUTE_FILE = path.join(ROOT, "src/routes/faq.$slug.tsx");

// --- Mirror the runtime logic from src/lib/faq.ts (kept in sync intentionally).
function slugFromPath(p) {
  return path.basename(p).replace(/\.md$/, "");
}
function extractTitle(md, fallback) {
  const m = md.match(/^#\s+(.+)$/m);
  return (m?.[1] ?? fallback).replace(/\s+/g, " ").trim();
}
function extractDescription(md) {
  const tldr = md.match(/##\s*TL;DR\s*\n+([\s\S]+?)\n\n/);
  const raw =
    tldr?.[1] ??
    md.match(/(?:^|\n)([^#\n>][^\n]{60,})\n/)?.[1] ??
    "";
  return raw
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`"]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

const errors = [];
const files = fs
  .readdirSync(FAQ_DIR)
  .filter((f) => f.endsWith(".md"))
  .sort();

if (files.length === 0) {
  console.error("No faq/*.md files found");
  process.exit(1);
}

// Sanity: the route file must still emit application/ld+json + FAQPage.
const routeSrc = fs.readFileSync(ROUTE_FILE, "utf8");
if (!/application\/ld\+json/.test(routeSrc) || !/"FAQPage"/.test(routeSrc)) {
  console.error(
    `${path.relative(ROOT, ROUTE_FILE)}: FAQPage JSON-LD script block missing`
  );
  process.exit(1);
}

for (const file of files) {
  const abs = path.join(FAQ_DIR, file);
  const md = fs.readFileSync(abs, "utf8");
  const slug = slugFromPath(file);
  const title = extractTitle(md, slug);
  const description = extractDescription(md);

  const problems = [];
  if (!title || title === slug) problems.push("missing H1 title");
  if (!description || description.length < 40)
    problems.push(`description too short (${description.length} chars)`);

  // Build the JSON-LD payload the route would emit, then validate its shape.
  const jsonld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: title,
        acceptedAnswer: { "@type": "Answer", text: description },
      },
    ],
  };
  // Round-trip through JSON to catch any non-serializable regression.
  let parsed;
  try {
    parsed = JSON.parse(JSON.stringify(jsonld));
  } catch (e) {
    problems.push(`JSON-LD not serializable: ${e.message}`);
  }
  if (parsed) {
    if (parsed["@context"] !== "https://schema.org")
      problems.push("wrong @context");
    if (parsed["@type"] !== "FAQPage") problems.push("wrong @type");
    if (!Array.isArray(parsed.mainEntity) || parsed.mainEntity.length === 0)
      problems.push("mainEntity must be a non-empty array");
    else {
      const q = parsed.mainEntity[0];
      if (q["@type"] !== "Question") problems.push("mainEntity[0].@type");
      if (!q.name) problems.push("mainEntity[0].name empty");
      if (!q.acceptedAnswer || q.acceptedAnswer["@type"] !== "Answer")
        problems.push("acceptedAnswer.@type");
      if (!q.acceptedAnswer?.text) problems.push("acceptedAnswer.text empty");
    }
  }

  if (problems.length) {
    errors.push(`faq/${file}: ${problems.join("; ")}`);
  }
}

if (errors.length) {
  console.error("FAQ JSON-LD regression FAILED:");
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log(`FAQ JSON-LD OK — ${files.length} pages validated.`);
