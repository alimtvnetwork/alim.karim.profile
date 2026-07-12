# Release Notes

## 0.4.2 - Riseup Asia LLC experience entry

Added the missing first experience page for **Chief Software Engineer @ Riseup Asia LLC** covering Jan 2025 to present (1.5+ years).

- New `experience/01-chief-software-engineer-riseup-asia.md` mirrors the established experience-page shape with linked role heading, dates, top and bottom Back links, Technology Stack, Brand, Responsibilities and Achievements, Team Members, Engagements, and Projects.
- Technology badges are 21px HTML `<img>` badges, not markdown image badges, with expanded hover titles and CV anchor links.
- Riseup Asia LLC naming follows project memory (one word). The URL remains the placeholder `https://riseup-asia.com/` until the official site is confirmed.

Verification: before this release, `VERSION` was `0.4.1` and Plan 07 was still pending. After the release update, `bun run check:profile` exits 0 with zero legacy tooltip hits, zero adjacent opener collisions, zero markdown badge leaks, and `check-links: OK (18 files scanned)`.

## 0.4.0 - Skill-badge tooltip overhaul

Every skill badge across the deployed profile now carries the expanded brand line instead of the bare "Alim has N+ Years..." pattern.

- **264 badges across 15 files** rewritten (README, mirror profile, `experience/**`). Format: `Alim (aka Md Alim Ul Karim) . <rotating top-1% / best / top-.NET title> . N+ yrs <Skill> . California-based|Los Angeles-based software companies . <primary source>`. CA/LA phrasing alternates; the three title variants never repeat back-to-back.
- **xproduct exception**: every badge tooltip on `experience/02-software-architect-x-product*` and the first descriptive paragraph now name `xproduct.com`.
- **Alt-text mirror**: badge `alt=` updated to `<Skill> . <N>+ years` for all 264 badges.
- **New tooling**: `scripts/inventory-tooltips.js`, `scripts/compute-tooltips.js`, `scripts/rewrite-alt.js`, and the `scripts/check-tooltips.js` linter (run via `bun run check:tooltips` or combined `bun run check:profile`).
- **Memory**: tooltip rule persisted to `mem://preferences/skill-tooltips.md` + Core line in `mem://index.md` so future edits don't regress.

Verification: pre-rewrite baseline was 65 legacy hits and `check:profile` errored (script missing). Post-rewrite `bun run check:profile` exits 0 with `[check-tooltips] legacy tooltip count: 0` and `check-links: OK (17 files scanned)`.



## 0.3.0 - Profile correctness pass

This release applies the user's correctness feedback on the rendered profile:

- New title across the site: **Chief Software Engineer @ Riseup Asia LLC**.
- The "Who is Alim?" portrait is the transparent PNG, rendered inline (no table border).
- Every skill badge links into the public tech-stack page and states years of experience in its tooltip.
- The x-product engagement now reads as the past role it is (May 2022 to Dec 2024, done), branded as [the-xproduct.com](https://the-xproduct.com), with the full engagement list (EMR USA, TargetSpot/Azerion, Azure EventBus, Validata RM, Sense AI 2.1 / ConnectIQ, Golang code-review guides).
- Em dashes purged across docs and route metadata.

Pending follow-up: confirm the canonical Riseup Asia URL (placeholder `https://riseup-asia.com/` in use). Duplicate `alim.karim.profile-main/` tree removed in this release. New `scripts/check-links.js` surfaced ~100 legacy `img/...png` references in `experience/00X-*.md` files; tracked as `.lovable/issues/06-legacy-experience-image-paths.md` for the next plan.

<!-- DISCLAIMER:START -->

---

> **Disclaimer.** Because voiceover transcripts and an automation tool were used to draft parts of this page, treat everything as a researched starting point rather than a signed statement . details can go wrong. For anything load-bearing, verify with **Md.** "[Alim Ul Karim](https://alimkarim.com/)" directly ([LinkedIn](https://www.linkedin.com/in/alimkarim/)). Riseup Asia LLC is not responsible for this repository. Full text . [DISCLAIMER](disclaimer.md).

<!-- DISCLAIMER:END -->
