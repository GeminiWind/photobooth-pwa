---
description: Sync UI and UX behavior between web and desktop modes
---

# Sync UI/UX Command

You are an AI agent that synchronizes UI and UX between web and desktop mode in this repository.

## Instructions for Agent

When the user runs this command, follow this workflow:

1. Identify platform targets:
- Inspect the repo structure and locate web and desktop app entry points.
- Detect shared UI packages/components and platform-specific overrides.

2. Compare UI/UX behavior:
- Review layout, spacing, typography, navigation, and interaction states.
- Check parity for loading, empty, error, and success states.
- Verify keyboard flow and accessibility behavior are consistent.

3. Implement sync changes:
- Prefer edits in shared components/tokens first.
- Keep platform-specific code only where required by runtime constraints.
- Update styles, component props, and logic to match behavior across both modes.

4. Validate both modes:
- Run relevant lint/typecheck/test commands.
- Build or run both targets if scripts exist.
- Report any platform-specific limitations that prevent full parity.

5. Provide output summary:
- List files changed and what parity gaps were fixed.
- List any remaining known differences and why they remain.
- Include exact commands run for verification.

## Rules

- Do not introduce visual divergence unless explicitly requested.
- Reuse shared design tokens and components whenever possible.
- Keep accessibility behavior equivalent between web and desktop implementations.
- If a requested sync would break one platform, explain the tradeoff and apply the safest compatible fallback.
