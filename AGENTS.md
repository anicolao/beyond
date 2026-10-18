# Project instructions

README.md, VISION.md, RULES_SUMMARY.md, UX_DESIGN.md, and E2E_GUIDE.md are the plan of record. Implement their requirements and preserve their scope. Describe the design directly rather than calling it tentative, proposed, or unapproved. Distinguish the design contract from implementation status and preserve the rules authority over illustrative text in generated images.

Follow E2E_GUIDE.md: use the shared fixture and required TestStepHelper for every meaningful illustrated step. Do not weaken exact screenshot comparisons, capture guards, timing limits, real-player setup, or generated walkthrough requirements.

Tabletop play is self-contained on one shared display: configure named local seats and perform every action there. Do not add QR joining, companion devices, per-player sign-in, or remote seat claiming to tabletop mode. The base game has no player-secret information; unrevealed decks and events are concealed from everyone. Remote personal-screen play retains its separate invitation and identity model.

Record every user prompt concerning this project verbatim in PROMPTS.md, including corrections and follow-up requests. Append each prompt once, in conversation order, under the next `## Prompt N: Summary` heading. Give each new prompt a 2–3 word summary. Follow the heading with a blank line and the verbatim prompt, preserving spelling, punctuation, capitalization, and line breaks. Do not include assistant messages or automatically supplied environment context.

Update the log before doing other project work for each new prompt. Never rewrite or remove existing entries, and never invent or duplicate a prompt to satisfy a hook. Stage the new entries with the related work when committing.

Install the versioned pre-commit hook with `git config core.hooksPath .githooks`. It checks Git's staged index and requires a nonempty new prompt or an explicit continuation for the latest logged prompt. It cannot access the conversation or prove the accuracy of the verbatim copy; the agent remains responsible for that.

For multiple commits responding to the same prompt, do not duplicate the prompt. Append one unique logical step to PROMPT_WORK.md in this format:

```text
Prompt N | SHA256 | Description of this continuation
```

`N` is the latest logged prompt number. `SHA256` is the lowercase SHA-256 of the exact staged PROMPTS.md bytes. The description is 10–200 characters on one line and identifies a distinct step. Preserve existing continuation records. A new user request always requires a new prompt entry, not a continuation.

Commit and push requested changes to the active PR before reporting them complete. Never merge a review PR unless the user asks. Keep the public repository licensed under GPL-3.0-only and retain original artwork provenance.

A tracer bullet demonstrates intended production behavior, not disposable functionality. Each logical commit may need multiple E2E stories for desktop web PvP, phone web PvP, and tabletop. Shared-table players join directly at physical positions on the table surface. Do not add temporary naming/save wizards that later milestones must replace.

Production and all PR previews use the same canonical games/<id> storage and event history, the same Firebase project and controller identity, and deployment-independent retention. Recovery changes the client URL, never the data namespace. Preview jobs deploy compatible rules for every revision and post/update a live link on the PR as soon as that revision is served. Never gate preview publication or its link on E2E completion.

## Supervising conversation and implementation log

The supervising agent records each human request from its conversation verbatim in `meta-prompts.md`, including voice steering and follow-up corrections. It records its handoffs and review findings separately as reviewer-authored material, never as human quotations. Routine automation triggers and tool output are not human prompts.

The implementation agent records instructions it receives in `PROMPTS.md`, clearly identifying delegated reviewer instructions as such rather than attributing them to the human. Its logical work continuations remain in `PROMPT_WORK.md` under the existing commit policy. Do not duplicate supervisor-conversation human prompts into `PROMPTS.md`; refer to the relevant `meta-prompts.md` entry when needed. Direct human prompts received by the implementation agent still belong in `PROMPTS.md`. This routing rule supersedes the broader prompt-recording language above for supervised work. Preserve existing historical entries; do not rewrite them to enforce the new separation retroactively. Update the appropriate log before the corresponding work and include it in the relevant stacked PR.
