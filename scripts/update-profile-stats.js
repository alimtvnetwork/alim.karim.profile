#!/usr/bin/env node
/**
 * update-profile-stats.js
 *
 * Refreshes an HTML-comment-delimited block in README.md / profile:
 *   <!-- COMMITS:START -->  ... <!-- COMMITS:END -->
 *
 * "Total commits" = sum of commits authored by the configured GitHub
 * accounts across all public repositories, resolved live via the GitHub
 * Search API. Falls back to `git rev-list --count HEAD` (this repo only)
 * when the API is unreachable, so the workflow never commits stale zero.
 *
 * No "last updated" date is written — the number itself refreshes on
 * every scheduled run.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const README_PATH = path.join(REPO_ROOT, "README.md");
const PROFILE_PATH = path.join(REPO_ROOT, "alim-ul-karim-profile.md");

// GitHub accounts to sum authored commits across. Override with the
// GITHUB_AUTHORS env var (comma-separated) or PROFILE_AUTHORS repo variable
// so this repo works unchanged when copied to a different profile.
const GITHUB_AUTHORS = (process.env.GITHUB_AUTHORS || "aukgit,alimtvnetwork")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const COMMITS_RE = /<!-- COMMITS:START -->[\s\S]*?<!-- COMMITS:END -->/;
const PROFILES_RE = /<!-- PROFILES:START -->([\s\S]*?)<!-- PROFILES:END -->/;

function log(msg, extra) {
  const line = `[update-profile-stats] ${msg}`;
  if (extra !== undefined) console.log(line, extra);
  else console.log(line);
}

async function fetchAuthoredCommits(author) {
  const url = `https://api.github.com/search/commits?q=author:${encodeURIComponent(author)}&per_page=1`;
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "update-profile-stats",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(
      `GitHub search/commits failed for ${author}: ${res.status} ${res.statusText}`,
    );
  }
  const json = await res.json();
  const n = Number(json?.total_count);
  if (!Number.isFinite(n)) {
    throw new Error(`Unexpected search/commits response for ${author}`);
  }
  return n;
}

async function getTotalCommits() {
  try {
    let total = 0;
    for (const a of GITHUB_AUTHORS) {
      const n = await fetchAuthoredCommits(a);
      log(`author:${a} commits=${n}`);
      total += n;
    }
    return total;
  } catch (err) {
    console.error(
      "[update-profile-stats] GitHub API unavailable, falling back to local git rev-list",
      err,
    );
    const out = execFileSync("git", ["rev-list", "--count", "HEAD"], {
      cwd: REPO_ROOT,
      encoding: "utf8",
    }).trim();
    return Number.parseInt(out, 10) || 0;
  }
}

function countProfileLinks(markdown) {
  const m = markdown.match(PROFILES_RE);
  if (!m) {
    throw new Error(
      "PROFILES:START/END delimiters not found — cannot count links",
    );
  }
  const matches = m[1].match(/\[[^\]]+\]\([^)]+\)/g);
  return matches ? matches.length : 0;
}

function rewriteCommitsBlock(markdown, commitCount, profileLinkCount) {
  const replacement = [
    "<!-- COMMITS:START -->",
    `**Total commits:** ${commitCount.toLocaleString("en-US")} · ` +
      `**Profile links:** ${profileLinkCount}`,
    "<!-- COMMITS:END -->",
  ].join("\n");
  if (!COMMITS_RE.test(markdown)) {
    return markdown; // block removed intentionally; no-op
  }
  return markdown.replace(COMMITS_RE, "");
}

function updateFile(filePath, commitCount) {
  if (!fs.existsSync(filePath)) {
    log(`skipping (missing): ${path.relative(REPO_ROOT, filePath)}`);
    return false;
  }
  const before = fs.readFileSync(filePath, "utf8");
  const profileLinkCount = countProfileLinks(before);
  const after = rewriteCommitsBlock(before, commitCount, profileLinkCount);
  if (after === before) {
    log(`no change: ${path.relative(REPO_ROOT, filePath)}`);
    return false;
  }
  fs.writeFileSync(filePath, after);
  log(
    `updated ${path.relative(REPO_ROOT, filePath)} — commits=${commitCount}, profile-links=${profileLinkCount}`,
  );
  return true;
}

async function main() {
  try {
    const commitCount = await getTotalCommits();
    log(`total commits across [${GITHUB_AUTHORS.join(", ")}] = ${commitCount}`);
    updateFile(README_PATH, commitCount);
    updateFile(PROFILE_PATH, commitCount);
  } catch (err) {
    console.error("[update-profile-stats] FATAL", err);
    process.exit(1);
  }
}

main();
