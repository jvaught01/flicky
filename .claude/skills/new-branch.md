# New Branch Protocol

Creates a correctly named, correctly based branch for any GitFlow work type.
Invoke before starting any new unit of work.

Triggered by: `/new-branch`

---

## Branch types, bases, and naming

| Work type | Branch pattern | Base branch | Example |
|-----------|---------------|-------------|---------|
| New feature or experiment | `feat/<short-description>` | `master` | `feat/voice-preview` |
| Bug fix on live production | `fix/<short-description>` | `master` | `fix/ptt-mic-stuck` |
| Release candidate / QA | `release/vX.X.X` | `dev` | `release/v1.2.0` |
| Upstream redesign port | `sprint/vX.X.X` | `master` | `sprint/v1.2.0` |

**Rules:**
- `feat/*` always base off `master` — aligns with project head's convention; `dev` is stale
- `fix/*` always base off `master` — hotfixes must ship without carrying unreleased work
- `sprint/*` always base off `master` — selective port after upstream redesign
- `release/*` always base off `master`
- Descriptions use kebab-case, no version numbers in feature names
- Keep names short and unambiguous (3–5 words max)

---

## Step 1 — Clarify intent

Ask the developer:
> "What are you building? (feature / hotfix / release candidate / sprint port)"

If the developer describes the work without naming a type, infer from context:
- "add X feature" → `feat/*` off `master`
- "fix a bug in prod" → `fix/*` off `master`
- "start the next sprint" → `sprint/vX.X.X` off `master`
- "prep a release" → `release/vX.X.X` off `dev`

Confirm the classification before proceeding:
> "This sounds like a `feat/*` branch. Correct?"

---

## Step 2 — Confirm base branch is current

Run: `git fetch origin --quiet --prune`

Then check the intended base is up to date locally:
```
git log --oneline HEAD..origin/<base-branch> | head -5
```

If the local base is behind origin, warn:
> "Your local `[base]` is behind origin by [N] commits. Update it first:
> `git checkout [base] && git pull --ff-only`"

Do not proceed until the developer confirms the base is current.

---

## Step 3 — Suggest branch name

Propose a name following the pattern. Use the developer's description, kebab-cased:

> "Suggested branch name: `feat/voice-preview`
> Base: `master`
> Command: `git checkout -b feat/voice-preview master`"

Ask: "Does this name work, or would you like to adjust it?"

---

## Step 4 — Output the exact command

Once name and base are confirmed, output the single command to run:

```
git checkout -b <branch-name> <base-branch>
```

**Do not run this command.** Present it for the developer to execute.

After the developer confirms the branch is created, suggest running `/sprint-align`
for `sprint/*` branches, or remind them that `/merge-flow` will validate the PR
target when they're ready to open a PR.

---

## Step 5 — Post-creation reminder

Once the branch exists, state:
> "Branch `[name]` created off `[base]`. When you're ready:
> - `/commit-msg` — draft a structured commit message
> - `/merge-flow` — confirm your PR target before opening a PR"

For `sprint/*` branches specifically, add:
> "Run `/sprint-align` now to confirm this branch is current with master."

---

## Hard constraints (always enforce)

- **Never base a `feat/*` branch off `dev`** — `dev` is stale; all work
  bases off `master` per project head convention
- **Never base a `fix/*` branch off `dev`** — hotfixes must not carry
  unreleased work into production
- **Never create branches directly on `master`** — master receives merges
  via PR only; the project head gates all merges
- **Never run `git checkout -b` autonomously** — always present the command
  and let the developer execute it
