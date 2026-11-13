# Changelog

## [v5.2.34] - 2026-11-13

### Added
- Synchronize prompts, skills, AI scripts, and coding guidelines

---

## [v5.2.33] - 2026-11-11

### Added
- Synchronize prompts, skills, AI scripts, and coding guidelines

---

## [v5.2.32] - 2026-11-11

### Added
- Synchronize prompts, skills, AI scripts, and coding guidelines

---

## 0.4.2 - 2026-06-17

### Added
- Added `experience/01-chief-software-engineer-riseup-asia.md` for **Chief Software Engineer @ Riseup Asia LLC** (Jan 2025 to present, 1.5+ years), including H1, dates, Back links, 21px HTML technology badges, Brand, Responsibilities and Achievements, Team Members, Engagements, and Projects.

### Changed
- Profile validation now covers 18 markdown files after adding the Riseup Asia LLC experience page.

### Verified
- Before: `VERSION=0.4.1`; Plan 07 status was `pending`; no `0.4.2` release entry existed.
- After: `bun run check:profile` exits 0 with `[check-tooltips] legacy tooltip count: 0`, `[check-tooltips] adjacent-same-opener collisions: 0`, `[check-tooltips] experience markdown-image-badge count: 0`, and `check-links: OK (18 files scanned)`.
- `rg -n '\\[!\\[' experience/01-chief-software-engineer-riseup-asia.md` returns no markdown badge leaks.

## 0.4.1 - 2026-06-16

### Changed
- Renamed "AKA Alimul Karim" → "aka Md Alim Ul Karim" across all 21 files (README, profile, experience tree, route components, RELEASE_NOTES, CHANGELOG, scripts/check-tooltips.js) for consistent full-name usage with lowercase "aka".
- Updated Core memory rule (`mem://index.md`) to enforce the new mention format.

### Verified
- `bun run check:tooltips` → `[check-tooltips] legacy tooltip count: 0`.
- `rg "AKA Alimul Karim" .` → 0 matches.

## 0.4.0 - 2026-06-16

### Changed
- Every skill badge tooltip across `README.md`, `alim-ul-karim-profile.md`, and `experience/**/*.md` (264 badges across 15 files) rewritten to the expanded brand line: `Alim (aka Md Alim Ul Karim) . <rotating top-1% / best / top-.NET title> . N+ yrs <Skill> . California-based|Los Angeles-based software companies . <primary source>`.
- xproduct experience pages (`experience/02-software-architect-x-product*`) now name `xproduct.com` in every badge tooltip and the first descriptive paragraph.
- Badge `alt=` text mirrors the new format as `<Skill> . <N>+ years` (264/264).

### Added
- `scripts/inventory-tooltips.js`, `scripts/compute-tooltips.js`, `scripts/rewrite-alt.js` . inventory → compute → apply pipeline keyed off `SKILL_YEARS` in `scripts/check-tooltips.js`.
- `scripts/check-tooltips.js` linter: scans README/profile/experience, prints `legacy tooltip count: N`, exits non-zero on any legacy hit.
- `package.json` scripts: `check:tooltips` and combined `check:profile` (runs `check:tooltips` then `check:links`).
- Memory: `mem://preferences/skill-tooltips.md` + Core line in `mem://index.md` capturing the variant pool, xproduct exception, and alt-text mirror rule.
- Commands 12 (expanded tooltip rule) and 13 (alt-text mirror rule) added to the spec.

### Verified
- Pre-rewrite baseline: 65 legacy tooltip hits, `check:profile` errored (script missing).
- Post-rewrite: `bun run check:profile` exits 0 → `[check-tooltips] legacy tooltip count: 0` + `check-links: OK (17 files scanned)`.

## 0.3.0 - 2026-06-16

### Changed
- Header role corrected to "Chief Software Engineer @ Riseup Asia LLC" across README, mirror profile, and SEO metadata.
- "Who is Alim?" section now uses the transparent portrait (`assets/who-is-md-alim-ul-karim.png`) without a table wrapper.
- All skill badges link to anchors in the public tech-stack page with years-of-experience alt + title text sourced from public sources.
- x-product brand wrapped as `[the-xproduct.com](https://the-xproduct.com)`; role = Principal Software Engineer; dates = May 2022 to Dec 2024 (done).
- Em dashes removed across README, mirror profile, experience tree, and route metadata.

### Added
- the public tech-stack page extracted from the source CV as the source of truth for skills and dates.
- Crossover top-1%-talent badge with descriptive alt + title next to the headline.
- Spec commands 07-11 capturing image naming, Riseup Asia naming, em-dash ban, x-product linking/tense, and alim-ul-karim-tech-stack-skills-text-format.md authority.
- Issues 03-05 tracking the photo-in-table, header role, and incomplete x-product engagement regressions.
- Forward-compatible skill anchors in the public tech-stack page (nodejs, react, vuejs, mssql, redis, postgresql, mongodb, flutter, nextjs, signalr, tailwind, aws, docker, graphql) so future badges link cleanly.

## 0.3.1 - 2026-06-16

### Added
- `scripts/check-links.js` . markdown link/anchor/image checker covering `README.md`, `alim-ul-karim-profile.md`, the public tech-stack page, and `experience/**/*.md`. Exits non-zero on any broken path or missing anchor.
- `.lovable/issues/06-legacy-experience-image-paths.md` capturing the ~100 broken `img/<name with spaces>.png` references uncovered by the checker, plus two missing in-page anchors (`#8-alim-ul-karims-profiles`, `providing-services.md#coaching--mentoring`).

### Removed
- Duplicate `alim.karim.profile-main/` tree (verified no inbound references outside of release notes).

<!-- DISCLAIMER:START -->

---

> **Disclaimer.** Parts of this page were dictated as voiceover and later expanded by an automation tool, which occasionally garbles wording, numbers, or dates. Research went into the drafting, but there is a fair chance something is still wrong . verify anything you plan to rely on with **Md.** "[Alim Ul Karim](https://alimkarim.com/ "Reach the author directly to verify any claim.")" on [LinkedIn](https://www.linkedin.com/in/alimkarim/). Riseup Asia LLC bears no editorial responsibility for this personal profile. Full notice . [DISCLAIMER](disclaimer.md).

<!-- DISCLAIMER:END -->
