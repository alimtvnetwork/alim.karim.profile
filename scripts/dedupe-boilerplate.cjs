#!/usr/bin/env node
// Deduplicate repeated boilerplate across markdown pages for SEO.
// 1. Replace the "Verifiable Proof Sources" block with a unique 1-liner per file, pointing to proof-sources.md
// 2. Rotate the standardized "> **Disclaimer.**" footer through a pool of unique variants.
const fs = require('fs');
const path = require('path');

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir)) {
    if (/^(node_modules|\.git|dist|build)$/.test(f)) continue;
    const p = path.join(dir, f);
    const s = fs.statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (f.endsWith('.md')) out.push(p);
  }
  return out;
}

const root = process.cwd();
const files = walk(root);

// --- Pool of unique proof-sources pointer sentences (rotated per file) ---
const proofPointers = [
  'Every number, credential, and engagement cited above traces back to the primary sources listed on the [Proof Sources page]({REL}proof-sources.md "Canonical list of primary sources . Crossover, NuGet, Stack Overflow, LinkedIn, GitHub, The Daily Star, ATN News, Imagine Cup 2017."). Nothing on this page is meant to stand on its own.',
  'Prefer to verify before you cite? The [Proof Sources index]({REL}proof-sources.md "Master list of Crossover, NuGet, Stack Overflow, LinkedIn, GitHub, and press citations for Md. Alim Ul Karim.") consolidates every primary reference used across this profile in one place.',
  'Instead of repeating the citation block on every page, all primary sources live at [Proof Sources]({REL}proof-sources.md "Canonical citations for every claim on this profile."). Anything unfamiliar in the copy above is grounded there.',
  'Curious how these claims are backed? The [Proof Sources page]({REL}proof-sources.md "Independent citations covering Crossover, NuGet, Stack Overflow, LinkedIn, GitHub, The Daily Star, ATN News, and Imagine Cup 2017.") lists the ten primary references used across this profile.',
  'A single, versioned [Proof Sources list]({REL}proof-sources.md "Consolidated primary references for Md. Alim Ul Karim . Crossover, NuGet, Stack Overflow, LinkedIn, GitHub, and press.") is maintained separately so this page can stay focused on the topic at hand.',
  'For the receipts . Crossover screening, NuGet downloads, Stack Overflow reputation, LinkedIn history, TV appearances, and Imagine Cup 2017 . see the standalone [Proof Sources page]({REL}proof-sources.md "Ten primary citations behind Md. Alim Ul Karim\'s profile.").',
  'Every stat above can be traced to a public source. Rather than duplicate the list, this page defers to [Proof Sources]({REL}proof-sources.md "Master citation index for Md. Alim Ul Karim.") where the ten primary references are maintained.',
  'Want to fact-check a specific number? Cross-reference it against the [Proof Sources index]({REL}proof-sources.md "Independent, primary-source citations for every claim on this profile."). It is the only page in this repo that keeps the full citation list.',
  'Citations for this page (Crossover, NuGet, Stack Overflow, LinkedIn, GitHub, The Daily Star, ATN News, Imagine Cup 2017, Automatic Unit Test writeup, Riseup Asia LLC engagements) all live at [Proof Sources]({REL}proof-sources.md "Central citation index.").',
  'To keep every page unique and search-engine friendly, the full citation set has been extracted to a dedicated [Proof Sources reference]({REL}proof-sources.md "Canonical primary-source index for Md. Alim Ul Karim."). Use it as the source of truth.',
  'The evidence backing this page is not repeated inline. Open [Proof Sources]({REL}proof-sources.md "Primary references for every claim in this repository.") for the ten independently verifiable references maintained across the profile.',
  'Rather than restate the same ten links on every page, all primary references now live on the [Proof Sources page]({REL}proof-sources.md "Independent citations . Crossover, NuGet, Stack Overflow, LinkedIn, GitHub, and press."). Treat it as the audit trail.',
  'Anything above can be verified against the [Proof Sources master list]({REL}proof-sources.md "Canonical citation index for Md. Alim Ul Karim."). Contact the author directly if a figure does not reconcile.',
  'For anyone auditing this page, the ten primary citations behind it are maintained centrally at [Proof Sources]({REL}proof-sources.md "Central citation index for Md. Alim Ul Karim."). No claim relies on itself.',
  'Independent verification of the figures on this page begins at the [Proof Sources index]({REL}proof-sources.md "Primary references . Crossover, NuGet, Stack Overflow, LinkedIn, GitHub, press, and Imagine Cup 2017."). Every claim in this repo links back to it.',
  'This page stays lean on citations because they are curated in one place. Head to [Proof Sources]({REL}proof-sources.md "Consolidated primary-source index maintained across this profile.") for the full evidence trail.',
];

// --- Pool of disclaimer variants (rotated per file) ---
const disclaimers = [
  '> **Disclaimer.** Parts of this page were dictated as voiceover and later expanded by an automation tool, which occasionally garbles wording, numbers, or dates. Research went into the drafting, but there is a fair chance something is still wrong . verify anything you plan to rely on with **Md.** "[Alim Ul Karim]({REL_HTTP}alimkarim.com/ "Reach the author directly to verify any claim.")" on [LinkedIn](https://www.linkedin.com/in/alimkarim/). Riseup Asia LLC bears no editorial responsibility for this personal profile. Full notice . [DISCLAIMER]({REL}disclaimer.md).',
  '> **Disclaimer.** Editorial workflow on this repo blends handwritten notes, dictated audio, and an automation tool that rewrites drafts. The material is researched but not audited, so small factual slips are possible . contact **Md.** "[Alim Ul Karim](https://alimkarim.com/ "Author of this profile . contact to verify claims.")" via [LinkedIn](https://www.linkedin.com/in/alimkarim/) before quoting a specific number. Riseup Asia LLC is not the editor and carries no liability. See [DISCLAIMER]({REL}disclaimer.md).',
  '> **Disclaimer.** Because voiceover transcripts and an automation tool were used to draft parts of this page, treat everything as a researched starting point rather than a signed statement . details can go wrong. For anything load-bearing, verify with **Md.** "[Alim Ul Karim](https://alimkarim.com/)" directly ([LinkedIn](https://www.linkedin.com/in/alimkarim/)). Riseup Asia LLC is not responsible for this repository. Full text . [DISCLAIMER]({REL}disclaimer.md).',
  '> **Disclaimer.** This is a personal profile assembled with dictated notes and an automation tool for cleanup. Research informed the wording, yet numbers and framing can still drift . confirm with **Md.** "[Alim Ul Karim](https://alimkarim.com/)" ([LinkedIn](https://www.linkedin.com/in/alimkarim/), [alimkarim.com](https://alimkarim.com/)) before relying on any specific claim. Riseup Asia LLC is not the publisher. Details . [DISCLAIMER]({REL}disclaimer.md).',
  '> **Disclaimer.** Voiceover transcription plus an automation tool drives much of the drafting here, and either step can misfire on wording or dates even after research. When in doubt, ask the author . **Md.** "[Alim Ul Karim](https://alimkarim.com/)" on [LinkedIn](https://www.linkedin.com/in/alimkarim/). Riseup Asia LLC is not accountable for anything on this repository. Read the full [DISCLAIMER]({REL}disclaimer.md).',
  '> **Disclaimer.** Content here reflects a mix of dictation and automation-tool rewrites on top of underlying research; occasional errors still slip through. Independently confirm any claim with **Md.** "[Alim Ul Karim](https://alimkarim.com/)" via [LinkedIn](https://www.linkedin.com/in/alimkarim/) or [alimkarim.com](https://alimkarim.com/) before citing it. Riseup Asia LLC carries no editorial or legal responsibility. Full notice . [DISCLAIMER]({REL}disclaimer.md).',
  '> **Disclaimer.** Some passages here were rewritten by an automation tool from voice memos, so wording and figures can drift from the intended meaning despite the research behind them. Verify with the author, **Md.** "[Alim Ul Karim](https://alimkarim.com/)" ([LinkedIn](https://www.linkedin.com/in/alimkarim/)), before relying on a number. Riseup Asia LLC is not the publisher of this profile. See [DISCLAIMER]({REL}disclaimer.md).',
  '> **Disclaimer.** This page is a researched but working draft assembled with dictated audio and an automation tool for editing. Anything you want to cite should be validated against a primary source or with the author, **Md.** "[Alim Ul Karim](https://alimkarim.com/)" on [LinkedIn](https://www.linkedin.com/in/alimkarim/). Riseup Asia LLC has no involvement in the writing. Full notice . [DISCLAIMER]({REL}disclaimer.md).',
  '> **Disclaimer.** Voice-to-text plus automation-tool drafting means wording, numbers, and dates on this page may not be exact even where research supports the point. Confirm anything material with **Md.** "[Alim Ul Karim](https://alimkarim.com/)" via [LinkedIn](https://www.linkedin.com/in/alimkarim/). This is a personal repository . Riseup Asia LLC is not responsible for its contents. Full text . [DISCLAIMER]({REL}disclaimer.md).',
  '> **Disclaimer.** Treat this page as author-verified only after a direct check with **Md.** "[Alim Ul Karim](https://alimkarim.com/)" ([LinkedIn](https://www.linkedin.com/in/alimkarim/)). Transcription and an automation tool were used during drafting on top of research notes, and either can introduce mistakes. Riseup Asia LLC is not the editor. See the full [DISCLAIMER]({REL}disclaimer.md).',
];

let proofChanges = 0;
let disclaimerChanges = 0;
let proofIdx = 0;
let discIdx = 0;

for (const file of files.sort()) {
  const rel = path.relative(path.dirname(file), root);
  const relPrefix = rel === '' ? '' : rel.replace(/\\/g, '/') + '/';
  const relHttp = 'https://';
  let text = fs.readFileSync(file, 'utf8');
  const original = text;

  // 1. Replace the "## Verifiable Proof Sources" block through the "If any figure..." sentence.
  const proofRegex = /(^|\n)## Verifiable Proof Sources\n[\s\S]*?before relying on it\.\n/;
  if (proofRegex.test(text)) {
    const pointer = proofPointers[proofIdx % proofPointers.length].replace(/\{REL\}/g, relPrefix);
    proofIdx++;
    text = text.replace(proofRegex, (m, lead) => `${lead}## Evidence & citations\n\n${pointer}\n`);
    proofChanges++;
  }

  // 2. Rotate the standardized disclaimer footer.
  // Match the whole '> **Disclaimer.**' blockquote line (single-line style).
  const discRegex = /^> \*\*Disclaimer\.\*\*.*$/m;
  if (discRegex.test(text)) {
    const disc = disclaimers[discIdx % disclaimers.length]
      .replace(/\{REL_HTTP\}/g, relHttp)
      .replace(/\{REL\}/g, relPrefix);
    discIdx++;
    text = text.replace(discRegex, disc);
    disclaimerChanges++;
  }

  if (text !== original) fs.writeFileSync(file, text);
}

console.log(`proof blocks rewritten: ${proofChanges}`);
console.log(`disclaimer footers rotated: ${disclaimerChanges}`);
