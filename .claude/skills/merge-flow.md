# Merge Flow Protocol

Enforces the project's GitFlow PR routing rules. Invoke before opening any pull request
or when unsure where a branch should target.

Triggered by: `/merge-flow`

---

## Routing rules (canonical)

```
feature/*   →  dev        (integration; all features stabilise here)
fix/*        →  master     (hotfix) + dev  (backport)
sprint/vX   →  dev        (then dev → master via release/*)
release/vX  →  master     (tagged) + dev
dev         →  master     (via release/* only — never direct)
```

**master is a production release trigger, not an integration branch.**
Every merge to master = a versioned installer build fires in CI.
The project head gates master exclusively via PR review.

---

## Step 1 — Identify current branch

Run: `git rev-parse --abbrev-ref HEAD`

Classify the branch by prefix:

| Branch pattern | Correct PR target | Notes |
|----------------|-------------------|-------|
| `feature/*`    | `dev`             | Standard feature work |
| `sprint/vX.X.X`| `dev`             | Port/selective rebase off master |
| `fix/*`        | `master` + `dev`  | Hotfix: merge to master (tagged), backport to dev |
| `release/vX.X.X`| `master` + `dev` | RC branch: merge to master (tagged), sync dev |
| `dev`          | Never directly    | Only via a `release/*` branch |
| `master`       | Never             | Production; no outbound PRs |
| anything else  | Warn + confirm    | Non-standard name — clarify intent |

---

## Step 2 — Validate the target

If the developer states or implies a PR target, check it against the table above.

### If target is correct:
Confirm: "Branch `[name]` → `[target]` is correct per GitFlow rules. Proceed."

### If target is `master` and branch is NOT `fix/*` or `release/*`:
Block and warn:
> "Direct merge to master is not allowed for `[branch-type]` branches.
> master is a production release trigger gated by the project head.
> Correct target for `[branch]` is `dev`.
> Open the PR against `dev` instead."

### If target is `dev` and branch is `fix/*`:
Warn:
> "Hotfixes must merge to `master` first (with a version tag), then backport to `dev`.
> If you merge only to `dev`, the fix will not ship until the next release cycle."

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
