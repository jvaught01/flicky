# Commit Message Protocol

Drafts a correctly structured commit message for this project. Invoke after completing
a unit of work and before running `git commit`.

Triggered by: `/commit-msg`

---

## Message structure

### Subject line
```
type(scope): imperative summary in present tense
```
- Max 72 characters
- Imperative mood: "add", "fix", "update" — not "added", "fixing", "updates"
- Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `review`
- Scope: the subsystem, component, or file area affected (e.g. `ptt`, `panel`, `settings`)
- No trailing period
- **Never** include `Co-Authored-By` lines

### Body format
- Leave one blank line between subject and body
- Group related changes under a plain-text **section label** followed by a colon
  (e.g. `Cursor companion:`, `Settings store:`, `Voice catalogue:`)
- Each point starts with `- ` and uses an em dash `—` to separate the change
  from its rationale or mechanism
- Explain the **why** and **how**, not just the what
- Wrap all lines at ~72 characters
- Separate section groups with a blank line
- No bullet sub-nesting — keep it flat

### What belongs in the body
- Non-obvious decisions or constraints
- Failure modes the change addresses
- Subtle invariants a future reader would need to understand the diff
- Anything that would look arbitrary without context

### What does NOT belong
- Restatement of what the diff already shows
- References to the current task, issue number, or caller
  ("added for the X flow", "handles the case from issue #123") — these rot
- `Co-Authored-By` lines — ever

---

## Step 1 — Gather context

Run the following to understand what changed:
```
git diff --cached --stat
git diff --cached
git status
```

If nothing is staged, note it and ask the developer which files to include before drafting.

---

## Step 2 — Draft the message

Using the structure above, produce a complete commit message. Show it in a code block
so the developer can copy it directly.

### Choosing the type
| Situation | Type |
|-----------|------|
| New user-facing capability | `feat` |
| Bug fix or regression | `fix` |
| Build, tooling, deps, version bumps | `chore` |
| Documentation only | `docs` |
| Internal restructure, no behaviour change | `refactor` |
| Code review follow-up changes | `review` |

### Choosing the scope
Use the primary subsystem or component name affected. Examples from this codebase:
`ptt`, `panel`, `overlay`, `settings`, `voice`, `chats`, `cursor`, `ipc`, `types`, `build`

If multiple unrelated subsystems changed, consider whether this should be split into
multiple commits. If the changes are coherent, use the broadest accurate scope or omit
scope parentheses.

---

## Step 3 — Validate before presenting

Self-check before showing the draft:
- [ ] Subject ≤ 72 characters
- [ ] Present tense imperative subject
- [ ] No `Co-Authored-By` line present
- [ ] Body lines wrap at ~72 characters
- [ ] Rationale present for any non-obvious change (em dash format)
- [ ] No task/issue references in the body
- [ ] Section labels are plain text (no `##` markdown headers)

---

## Step 4 — Present and iterate

Show the draft. Ask: "Does this capture everything, or should any section be adjusted?"

If the developer requests changes, revise and re-validate before presenting again.

---

## Example (from this project's git history)

```
feat(sprint/v1.3.0): cursor companion, voice catalogue, chat export

Cursor companion:
- Add CursorCompanion.tsx — floats near the system cursor so the
  overlay stays visible without covering active UI elements.
- Wire IPC channel for position updates — renderer polls on a 100ms
  interval to keep latency imperceptible without saturating the main
  process.

Voice catalogue:
- Extend VoiceTab with per-voice preview — lets users audition a voice
  before committing; avoids settings round-trips.
- Add voice metadata to shared types — ElevenLabs model ID and category
  fields needed downstream for the API call builder.

Chat export:
- Add export-to-clipboard action in ChatsTab — markdown format chosen
  for portability; plain text would lose structural context.
- Persist export timestamp in settings-store — prevents duplicate
  exports on accidental re-trigger.
```

---

## Hard constraints (always enforce)

- **Never include `Co-Authored-By`** — this project explicitly prohibits it
- **Never generate a subject line over 72 characters** — truncate scope or
  rephrase rather than exceed the limit
- **Never use markdown in the commit body** — no `##`, `**bold**`, or backtick
  code fences; plain text only
- **Never reference issue numbers, PR numbers, or task IDs** in the body
