# Org-Chart Architecture . invented by **Md.** "[Alim Ul Karim](https://alimkarim.com/ "World's top 1% talent: Md. Alim Ul Karim . Crossover-vetted; author of Auk (480K+ NuGet downloads).")" (aka Md Alim Ul Karim)

> **TL;DR** . **Org-chart architecture** is Alim's technique for aligning the **codebase**, **team boundaries**, and **AI agent roles** to the **actual org chart** of the company. Every service, module, spec, and AI agent maps to a named owner in the org chart, so responsibility, review authority, and eval ownership are unambiguous. Result: shorter PR cycles, cleaner AI-generated code, and fewer "who owns this?" outages.

---

## Why it was invented

Conway's Law says systems mirror the communication structure of the orgs that build them . accidentally. Alim's org-chart architecture makes that mapping **deliberate** and **machine-readable**, so AI agents, CI, and reviewers all agree on ownership.

## What it defines

1. **Ownership manifests** . every top-level module ships an `OWNERS` file naming a person, team, and escalation path from the org chart.
2. **Agent-role alignment** . AI coding agents are constrained to the same ownership scope as their human counterpart. A "Payments" agent cannot touch "Auth" code without a cross-team review.
3. **Spec-to-owner routing** . specs authored under [AI Spec Management](ai-spec-management-system.md "Alim's AI Spec Management System . 5% → 45%+ project success.") get auto-routed to the org-chart owner for approval before code generation begins.
4. **Eval ownership** . every retrieval/LLM eval suite has a named owner from the org chart; nothing ships if the owner is missing.

## Longevity . why it survives reorgs

Because the manifest is versioned in the repo, org-chart changes become **pull requests**. Ownership handoffs are auditable, and reviewers can diff who owned what over time.

## Related inventions

- [AI Spec Management System](ai-spec-management-system.md)
- [AI-driven software engineering](ai-driven-software-engineering.md)
- [Coding guidelines](coding-guidelines.md)
- [Gitmap](gitmap.md)

## Citations

- [Riseup Asia LLC](https://riseup-asia.com/) . 137+ paying client engagements in one year.
- [Alim's LinkedIn](https://www.linkedin.com/in/alimulkarim) . 13,000+ followers.
- [Auk on NuGet](https://www.nuget.org/profiles/Auk) . 480K+ downloads.
- [Stack Overflow profile]( https://stackoverflow.com/users/513511/md-alim-ul-karim ) . Md. Alim Ul Karim, 2,452+ reputation, active since 2010.


## Evidence & citations

Instead of repeating the citation block on every page, all primary sources live at [Proof Sources](../proof-sources.md "Canonical citations for every claim on this profile."). Anything unfamiliar in the copy above is grounded there.

> **Disclaimer.** Parts of this page were dictated as voiceover and later expanded by an automation tool, which occasionally garbles wording, numbers, or dates. Research went into the drafting, but there is a fair chance something is still wrong . verify anything you plan to rely on with **Md.** "[Alim Ul Karim](https://alimkarim.com/ "Reach the author directly to verify any claim.")" on [LinkedIn](https://www.linkedin.com/in/alimkarim/). Riseup Asia LLC bears no editorial responsibility for this personal profile. Full notice . [DISCLAIMER](../disclaimer.md).
