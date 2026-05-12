---
name: end-session
description: Finalize a BioTrack prototype work session. Use when the user writes "@end-session", "заверши сессию", "закрой сессию", or asks to update agent notes and then commit, push, and deploy the project.
---

# End Session

Finish the BioTrack prototype session in a repeatable, auditable way.

## Workflow

1. Inspect the workspace from the repository root `bt-prototype/`:
   - `git status --short`
   - `git diff --stat`
   - `git log -1 --oneline`
2. Update project memory files before committing:
   - `AGENTS.md`: keep the concise current context, routes, constraints, local run/deploy commands, and the latest session summary.
   - `agents-done.md`: append or update a brief dated session entry with implemented changes, touched files, verification, and any unresolved risks.
3. Keep agent notes factual and compact:
   - Mention only durable project knowledge and shipped changes.
   - Do not paste long diffs, logs, secrets, tokens, or transient terminal noise.
   - Preserve the rule that `src/mocks/thrombogelNewSeed.json` is not edited manually unless explicitly required.
4. Verify before publishing:
   - Run `npm run build` from the repo root.
   - If build fails, stop, report the failure, and do not commit/push/deploy until fixed.
5. Commit:
   - Stage only relevant files.
   - Use a concise English commit message describing the session outcome.
   - Do not amend or rewrite history unless the user explicitly asks.
6. Push:
   - Push the current branch to `origin`.
   - If the current branch is not `main`, state the branch clearly before pushing.
7. Deploy:
   - Run `npm run deploy`.
   - Confirm the output includes `Published`.
8. Final response:
   - Include commit hash, push status, deploy status, and the production URL `https://maha5053.github.io/bt-prototype/`.
   - Mention any warnings such as Vite chunk-size warnings.
   - Confirm whether the working tree is clean.

## Safety

- Run git commands only from `bt-prototype/`.
- Do not commit or publish unrelated user changes without calling them out.
- Never commit credentials, PATs, `.env` secrets, or local cache files.
- If network/auth fails during push or deploy, report the exact failing step and leave the repository state clear.
