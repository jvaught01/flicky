# Sprint Alignment Protocol

Invoke this skill at the START of every sprint branch before writing any code.
Triggered by: `/sprint-align`

---

## Step 1 — Identify branch context

Run: `git rev-parse --abbrev-ref HEAD`

If the branch name does not match the pattern `sprint/vX.X.X`, display a warning:
> "Current branch does not follow the sprint/vX.X.X naming convention. Confirm this is
> the intended sprint branch before proceeding."

Ask the developer to confirm or correct before continuing.

---

## Step 2 — Run the alignment script

Execute: `bash scripts/sprint-start.sh`

Run this from the repository root. Capture the full output and exit code.

If the script fails to run (bash not found, wrong working directory, permission error):
- Report the exact error
- Tell the developer to run manually: `bash scripts/sprint-start.sh` from the repo root
- Do not proceed until the output is available

---

## Step 3 — Interpret output

### Exit code 0 — ALIGNED

Report to the developer:
> "Sprint branch is aligned with master. No unmerged master commits detected.
> Merge base: [SHA from output]. Sprint-only commits: [count]. Safe to begin work."

Proceed to Step 5.

### Exit code 1 — DIVERGED

Summarise in natural language (do NOT paste raw script output verbatim):
- How many commits master has that this sprint branch does not
- The commit list from the `COMMITS ON master NOT IN SPRINT` section
- Which files changed, from the `FILE CHANGES` section

Example summary:
> "Master has 3 commits this sprint branch does not include:
> - abc1234 fix(ptt): mic stuck on after release
> - def5678 feat(panel): redesign layout
> - ghi9012 chore: update dependencies
>
> Affected files: src/renderer/components/OverlayApp.tsx (+12/-5),
> src/main/index.ts (+8/-2), package.json (+1/-1)"

Then proceed to Step 4.

---

## Step 4 — Decision prompt (DIVERGED only)

Present the developer with four options:

> "Master has [N] commits this sprint branch does not include.
> How would you like to proceed?
>
> [R] Rebase — `git rebase master` (recommended: linear history, clean sprint base)
> [M] Merge  — `git merge master` (preserves branch topology)
> [S] Skip   — proceed without aligning (not recommended; state your reason)
> [A] Abort  — I need to review the diff manually first"

### If [R] or [M]:
Provide the exact command but **do not execute it**. Wait for the developer to confirm they
have run it, then re-run `bash scripts/sprint-start.sh` to verify alignment (Step 2).
Do not proceed to Step 5 until exit code is 0.

### If [S] (Skip):
Record the developer's stated reason in session context. Display a persistent warning
at the top of all subsequent responses this session:
> "[WARN] Sprint branch skipped master alignment — [stated reason]"

### If [A] (Abort):
Suggest the developer inspect divergence manually:
```
git log --oneline master ^HEAD | head -20
git diff --stat master...HEAD
```
Stop the skill. Await further instruction.

---

## Step 5 — Session context memo

After alignment is confirmed (exit code 0), record in working memory:
- Sprint branch name
- Master HEAD SHA at time of check (`git rev-parse master`)
- Date/time of alignment check

Reference this context if the developer later asks "are we aligned with master?" without
re-running the script.

---

## Hard constraints (always enforce)

- **Never push to master** under any circumstances
- **Never execute `git rebase` or `git merge` on the developer's behalf** — instruct and wait
- **Never skip the fetch step** inside the script — stale local refs cause false ALIGNED results
- If mid-sprint the developer asks to re-run alignment, run it again; the script handles
  non-zero sprint-only commit counts correctly and will still report ALIGNED if master
  hasn't moved since the last check

---

## GitFlow context (why this matters)

Per this project's branching strategy, `sprint/vX.X.X` branches are selective ports off
`master` after upstream redesigns. They must start from master HEAD. A diverged sprint
branch means the project head has continued work on master that this branch was not
rebased onto — discovered late, this causes conflict-heavy merges across already-modified
files. This skill catches that at the session start, before the first line of code is written.
