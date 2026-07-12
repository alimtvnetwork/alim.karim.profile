# Public GitHub Profile . CI/CD Setup

This repository is the **source of truth** for the public GitHub profile page
(the `README.md` that renders at <https://github.com/aukgit>). A GitHub Actions
workflow mirrors the allow-listed markdown and assets from this repo into the
special `<owner>/<owner>` profile repo on every push to `main`.

Author: **Md.** "[Alim Ul Karim](https://alimkarim.com/)" . powered by
[Riseup Asia LLC](./why-riseup-asia.md).

---

## 1. What ships to the profile repo

The deploy step uses an explicit allow-list plus [`.deployignore`](./.deployignore):

**Included**
- Root markdown: `README.md`, `alim-ul-karim-profile.md`, `faq.md`,
  `disclaimer.md`, `Why-*.md`, `Riseup-Asia-*.md`, tech-stack pages, changelog,
  release notes, `VERSION`.
- Folders: `experience/`, `why-hire/`, `faq/`, `skills/`, `inventions/`,
  `assets/`, `img/`.

**Excluded** (never copied)
- `CV.md`, any `*.pdf`.
- `src/`, `public/`, `scripts/`, `.github/`, `.lovable/`, `node_modules/`,
  `dist/`, lockfiles, `tsconfig*.json`, `vite.config.*`, `app.config.*`,
  `package*.json`, `bun.lock*`.

See [`scripts/deploy-profile.sh`](./scripts/deploy-profile.sh) and
[`scripts/deploy-profile.ps1`](./scripts/deploy-profile.ps1) for the
allow-list logic.

---

## 2. Workflows

| Workflow | File | Trigger | Purpose |
|---|---|---|---|
| CI checks | [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) | PR + push to `main` | Runs `bun run check:profile` (links, tooltips, variety), lychee markdown link check, dependency review. |
| Deploy profile | [`.github/workflows/deploy-profile.yml`](./.github/workflows/deploy-profile.yml) | Push to `main` (paths: `**/*.md`, `img/**`, `assets/**`) + manual | Mirrors allow-listed files into `<owner>/<owner>`. |
| Update profile stats | [`.github/workflows/update-profile-stats.yml`](./.github/workflows/update-profile-stats.yml) | Push + daily cron + manual | Regenerates commit / profile counts in `README.md` between `<!-- COMMITS:START/END -->` markers. |

---

## 3. One-time setup

1. **Create the profile repo** on GitHub named exactly `<your-username>` (e.g.
   `aukgit/aukgit`). Initialise it with a single empty `README.md` on `main`.

2. **Mint a fine-grained Personal Access Token**
   - <https://github.com/settings/personal-access-tokens/new>
   - Repository access: only the profile repo.
   - Permissions: **Contents: Read and write**.
   - Copy the token once.

3. **Add the token as a repo secret in THIS repo**
   - Settings . Secrets and variables . Actions . New repository secret.
   - Name: `PROFILE_DEPLOY_TOKEN`.
   - Value: the token from step 2.

4. **(Optional) Override defaults with repo variables**
   Settings . Secrets and variables . Actions . Variables.
   | Variable | Default | Purpose |
   |---|---|---|
   | `PROFILE_REPO` | `<owner>/<owner>` | Target repo (`owner/repo`). |
   | `PROFILE_BRANCH` | `main` | Target branch. |

5. **Trigger the first deploy**
   - Push any markdown change to `main`, **or**
   - Actions tab . *Deploy GitHub profile* . *Run workflow*.

The workflow checks out the target repo, runs `scripts/deploy-profile.sh`, and
commits `profile: sync from <this-repo>@<sha>` if anything changed.

---

## 4. Local dry run

```bash
# Bash / Linux / macOS / WSL
scripts/deploy-profile.sh ../aukgit

# PowerShell
pwsh ./scripts/deploy-profile.ps1 -Target ..\aukgit -WhatIf
```

Both scripts respect `.deployignore` and run `bun run check:links` first
(set `SKIP_LINK_CHECK=1` to bypass).

---

## 5. Verifying before pushing

```bash
bun install
bun run check:profile   # links + tooltips + prose variety
```

CI runs the same command on every PR; keep it green.

---

## 6. Disclaimer

Some copy is articulated for SEO and marketing purposes. For anything you
intend to rely on for hiring, contracting, or reporting, verify with **Md.**
"[Alim Ul Karim](https://alimkarim.com/)" directly or through
[Riseup Asia LLC](./why-riseup-asia.md). See [DISCLAIMER](./disclaimer.md)
for the full notice.
