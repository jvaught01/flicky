# Merge Flow Protocol

Enforces the project's GitFlow PR routing rules. Invoke before opening any pull request
or when unsure where a branch should target.

Triggered by: `/merge-flow`

---

## Routing rules (canonical)

```
feat/*       →  master     (PR reviewed by project head)
fix/*        →  master     (hotfix, tagged)
sprint/vX   →  master     (PR reviewed by project head)
release/vX  →  master     (tagged)
dev          →  STALE      (no longer used — do not target)
```

**master is a production release trigger, not an integration branch.**
Every merge to master = a versioned installer build fires in CI.
The project head (pango07) gates master exclusively via PR review.
`dev` was rejected by the project head and is considered stale.

---

## Step 1 — Identify current branch

Run: `git rev-parse --abbrev-ref HEAD`

Classify the branch by prefix:

| Branch pattern  | Correct PR target | Notes |
|-----------------|-------------------|-------|
| `feat/*`        | `master`          | Standard feature work; project head reviews |
| `sprint/vX.X.X` | `master`          | Port/selective rebase off master |
| `fix/*`         | `master`          | Hotfix; tagged after merge |
| `release/vX.X.X`| `master`          | RC branch; tagged after merge |
| `dev`           | STALE             | Do not use — rejected by project head |
| `master`        | Never             | Production; no outbound PRs |
| `feature/*`     | Warn + rename     | Old convention — suggest rename to `feat/*` |
| anything else   | Warn + confirm    | Non-standard name — clarify intent |

---

## Step 2 — Validate the target

If the developer states or implies a PR target, check it against the table above.

### If target is correct:
Confirm: "Branch `[name]` → `[target]` is correct per GitFlow rules. Proceed."

### If target is `master` and branch is NOT `feat/*`, `fix/*`, `sprint/*`, or `release/*`:
Block and warn:
> "Direct merge to master is not allowed for unrecognised branch types.
> master is a production release trigger gated by the project head.
> Confirm your branch type and rename to the correct pattern before opening a PR."

### If target is `dev`:
Block and warn:
> "`dev` is stale and no longer accepted by the project head.
> All PRs must target `master`. Update your PR target."

---

## Step 3 — Pre-PR checklist

Before the developer opens the PR, run through:

1. **Branch is aligned** — suggest running `/sprint-align` if branch is `sprint/vX.X.X`
2. **No direct commits to master or dev** — confirm work is on a proper branch
3. **Version bump** — for `release/*` branches only: confirm `package.json` version
   is updated before merging to master
4. **Changelog** — `.changelog/` is gitignored and local only; do not attempt
   `git add .changelog/`
5. **Commit messages** — suggest `/commit-msg` if any commits on this branch
   need to be cleaned up before the PR

Report checklist status: which items pass, which need attention.

---

## Step 4 — PR description guidance

Remind the developer:
- PR title should follow the same conventional prefix as commits: `feat(scope): ...`
- PR body should summarise the WHY, not just the what
- For `release/*` → `master` PRs: include the version tag that will be applied post-merge
- The project head reviews all PRs into master; do not merge without approval

---

## Hard constraints (always enforce)

- **Never create, merge, or push PRs to master autonomously**
- **Never suggest bypassing the project head's review gate**
- **Never commit directly to `master` or `dev`** — always branch
- If asked to "just push to master directly", refuse and explain the release trigger risk:
  > "Every master merge fires a CI build and ships a versioned installer.
  > Unreviewed code reaching master is a production incident, not a shortcut."
