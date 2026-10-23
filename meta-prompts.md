# UI review and iteration prompts

Recorded from the implementation prompt log and the supervising conversation. User prompts are verbatim; reviewer findings below are a summary, not user quotations.

## Implementation context

# Project prompts

User prompts are recorded verbatim below, in conversation order.

## Prompt 1: Define Game Documentation

We are going to implement the board game "Beyond The Sun" in the same style as ../pantheon. You may also look at ../roborally and ../istanbul for examples of how I want to build this. Write a README.md, VISION.md, RULES_SUMMARY.md, E2E_GUIDE.md, and UX_DESIGN.md for review before we start building anything.

## Prompt 2: Require Step Helper

The E2E guide needs the test step helper defined and required.

## Prompt 3: Illustrate UX Design

UX_DESIGN needs the images, not just a text description of the look of the game.

## Prompt 4: Publish Documentation PR

review ../deepsea for PROMPTS.md rules; create similar rules for this project. The current files are now the plan of record. Use gh to make a new github repository and put up the initial documentation as PR1 for review, after removing any verbiage about this being tentative/not approved. the gh repository should be public, gplv3, and I will look at the initial PR as soon as you push it up.

## Prompt 5: Simplify Tabletop Play

Is there any private information in the game? I didn't think so. If not, there should be no QR code for joining tabletop and no private device involved at all. Update the PR accordingly or rebut me if I am incorrect.

## Prompt 6: Scaffold Tracer Milestones

OK I have rebased and merged this. Write IMPLEMENTATION_PLAN.md, focused on making a series of logical tracer-bullet style commits; meaning that each commit creates one user-story style e2e test that shows the UI with the user clicking on it and every state chagne captured with a screenshot, validating that a real user can complete that user story, backed by emulators in the e2e tests and supported by a PR preview link in the PR that allows manual testing against the production firestore database (which you'll hvae to create and configure, and each PR will have to update the rules as part of the PR preview process). Do not gate PR preview on e2e test completion, so that manual testing can proceed in parallel with the PR clearing its merge gates. Put up a new PR with the implementation plan for review, and a basic scaffold demonstrating the first tracer-bullet milestone from the plan.

## Prompt 7: Durable Production Tracers

I want to be able to switch between PR and production on the same game for recovery purposes, so don't store the data in different places. The e2e tests may be more than one per commit to demonstrate the flow in different interfaces (desktop web pvp, phone web pvp, tabletop). the live preview should post a link to the PR when it is up so that it can be found from the PR. Shared table joining should be direclty from the table surface like it is in pantheon; so the current PR is no good because it demonstrates a flow that won't exist in the real game: never implement flows that won't survive to production, a proper tracer bullet isn't just an end to end test of "some" functionality, it is an end to end demonstration of the desired produciton functionality, we don't want to have to re-implement anything later. let's redo this initial milestone and rewrite any wrong steps in the plan with these constraints in mind.

## Supervising conversation

### 1. Session status

Check the status of the beyond tmux session

### 2. Visual comparison

Compare this result to the ui mockups.

### 3. Iteration authorization

Ok record the prompts that led up to this in meta-prompts.md in the project — then tell the other agent what to do until the ui is satisfactory — keep checking on it and iterating till it is good.

## Initial review findings

The orbital art, palette, and typography match the direction. The implemented buttons are flat ovals instead of tactile illuminated discs; the foreground is largely empty; mobile controls are side by side instead of stacked; physical seating has correct position and orientation but generic dark panels rather than the intended mat materials. The central gathering area lacks the mockups' composition. Missing gameplay boards are expected in milestone 001 and are not grounds for inventing gameplay. Passing regression screenshots does not establish visual fidelity.

## Reviewer handoff

The user has authorized me to direct and review your UI iterations on Beyond PR #2 until the implemented UI is satisfactory against the approved mockups. Read meta-prompts.md, AGENTS.md, UX_DESIGN.md, and the actual concept images before editing. The current UI matches the orbital atmosphere but not the tactile component design. Improve the existing milestone; do not implement later gameplay early or add fake functionality.

Acceptance criteria: (1) Arrival Play/Learn/conditional Continue must look like substantial illuminated tabletop objects with layered metallic rims, coherent light/shadow and clear semantic labels, not flat oval web buttons. Preserve keyboard, touch, reduced motion and contrast. (2) Make the foreground table composition intentional, using original art and reusable semantic components where appropriate; avoid vast accidental dead space and avoid baking actionable text into a background. (3) Phone should follow the portrait concept with prominent stacked controls, balanced title/scene proportions and no clipping at 393x852. (4) Physical seats must remain direct inline join/edit/leave/Player 1 controls oriented toward all eight positions. Replace generic dark cards with an intentional mat/component material language consistent with the ivory/graphite/gold concepts, sized for reach and readable contrast. Do not invent resources or faction state before the milestone supports them. (5) The central gathering area should belong to the table, with clear hierarchy and quiet secondary recovery controls; do not add a website-style panel or a fake board. Ensure capacity-full empty seats communicate disabled state correctly. (6) Review arrival, Play, Learn, retained Continue, empty/partial/full seating, seat editor, recovery, at desktop 1440x1000, phone 393x852 for supported personal screens, and tabletop 3840x2160. Preserve canonical persistence and cross-deployment recovery.

Capture actual rendered screenshots, inspect them beside concepts, fix visible defects, and provide a concise fidelity report with paths and remaining departures. Exact screenshot tests are regression evidence, not proof of visual quality. Follow the E2E guide and update baselines through its authorized workflow without weakening tests. Run required checks, commit and push updates to existing PR #2 and verify the live preview matches the final revision. Do not merge. Include the already-created meta-prompts.md and PROMPTS.md changes. The human's current request is already logged as Prompt 9; do not misattribute this reviewer instruction as a new verbatim human prompt. I will inspect and send specific follow-ups; continue the implementation now.

## Implementation iteration findings

The first rendered iteration introduced layered illuminated entry discs, stacked phone navigation, and ivory occupied seats/editors. Visual inspection then found tight North/South clearance and corner/edge margins. The next pass shortened the center composition, moved corner seats inward, quieted its ornament, moved status text inside the table rim, and anchored the seats to a substantial graphite table surface.

The actual North West editor exposed a false positive in the existing axis-aligned overlap audit. Its corrected transformed-polygon check is backed by eighteen browser regressions that reject real overlap at all eight seat angles and preserve viewport/text clipping failures. No screenshot tolerance or timing guard was weakened.

The ordinary UI journey now also narrows the same retained browser at the entry screen, captures all three stacked controls at 393×852, restores its original size, and reopens the unchanged table. No game is injected or copied and no companion device is introduced. Generated captions include actual image dimensions. The full evidence index and explicit remaining concept departures are in `tests/e2e/001-foundation/FIDELITY.md`; these implementation findings are not additional user quotations.

Linux candidate run 39147561219 passed generation and the eighteen capture-guard regressions. Representative Linux entry, phone-width Continue, full-table, corner-editor and recovery captures were visually inspected against the concepts and macOS renderings. Their reviewed baselines are committed separately for the required exact comparison, with no tolerance, masking or normalization changes.

## Reviewer checkpoint — 3c30b6f

Reviewer delegation under Prompt 9, not a new verbatim human prompt:

> Reviewer checkpoint for 3c30b6f: independently inspected updated desktop/phone arrival, 4K and desktop full seating, Learn phone, recovery desktop, corner editor desktop, phone Play and retained three-disc portrait entry. The material, layout and orientation issues are now satisfactorily addressed for milestone 001 in these local captures. Provisional visual acceptance only: continue your Linux candidate review and independent exact comparison, then verify hosted preview revision and final checks. No further cosmetic changes requested at this point. Do not merge; I will verify final evidence separately.

The Linux visual review and subsequent exact comparison are complete. At revision `98c0cce994d4ee9b2a5f455224afe4d4edd7c306`, [browser comparison and static/rules checks](https://github.com/anicolao/beyond/actions/runs/39148551287), [documentation checks](https://github.com/anicolao/beyond/actions/runs/39148551311), and [preview publication with hosted smoke verification](https://github.com/anicolao/beyond/actions/runs/39148551302) passed. The hosted revision and persistent PR preview comment matched that commit. This checkpoint changes no application code or accepted visuals. PR #2 remains open for the reviewer's independent final verification; provisional visual acceptance is not merge authorization.

## Card gallery request

via voice So given the difficulty we had getting the graphical UI correct and for that PR, I wanna build deck cards on top of it starting with a gallery that shows how the cards are gonna be built, similar to the gallery for plans, you know. Have the agent do that as a PR on top of PR2 with the goal of eventually having a series of stacked PRs that I can review when I'm back at a computer. Do you understand what I want? And if you do, get the other agent to start working on it and monitor it as before

Reviewer interpretation: build the next reviewable increment as a card-component gallery stacked on PR #2. Use Pantheon’s gallery as the likely reference for the voice transcription “gallery for plans”; inspect the sibling implementation and follow Beyond’s own approved art direction. Keep PR #2 and its successor independently reviewable and unmerged.


## Local review cadence

So just to be clear, for the card gallery, it should make a local dev server that you can look at, and not keep updating screenshots on the PR, because that'll go faster, and you might want to monitor it every two or three minutes because this process should go pretty quick. Maybe start with five minute intervals and see how that goes


## Prompt log separation

Also, just checking, do we have a rule in place that'll cause you to record this conversation in meta prompts, while the underlying agent records its work in prompt

## Gallery progress

How’s the gallery coming

## Local gallery implementation checkpoint

Implementation report, not a human quotation: `feat/card-gallery` branches from PR #2 head `9b7c806`; Prompt 10 and subsequent supervisor log updates remain on the new branch. Persistent local review is at `http://127.0.0.1:5197/gallery/` (`beyond-gallery-dev` tmux session), with separate demo Auth/Firestore emulators in `beyond-gallery-emulators`. The first candidate run finished before the local-review steering was applied. All seven foundation runs completed; the new gallery exposed an offscreen-document hit-region issue in the capture audit and a select-label issue, so no passing gallery walkthrough or baseline acceptance is claimed. Further baseline cycles and pushes are deferred until local visuals settle. The original illustrations and first desktop/phone composed renderings have been visually inspected; local iteration continues without modifying PR #2.

## Local review workflow applied

Implementation record: verified `http://localhost:5197/gallery/` responds with HTTP 200. The persistent Vite server runs in `beyond-gallery-dev`; demo Auth/Firestore emulators run in `beyond-gallery-emulators`. Human voice wording above is now also preserved in PROMPTS.md with the literal contraction “that'll”. Iterate from direct browser feedback; do not regenerate or push baseline screenshots or wait for PR CI during design iteration. Final validation, reviewed evidence and the separate PR stacked on PR #2 remain required after the design settles. Initial reviewer check-ins are every five minutes.

## Gallery refinement review

Local review at http://127.0.0.1:5197/gallery/ now works in my in-app browser. First card faces look good: readable semantic sections and ivory/brass materials. Concrete refinements before acceptance: at 1280x720 the header/filter stack consumes roughly 540px, leaving only card titles and a sliver of art on initial arrival; compact the intro and controls so cards lead the composition, retaining a concise fixture note. Full-size Hypercomputing inspector has Previous/Next below the bottom of the visible 720px viewport; keep close and previous/next in persistent reachable inspector chrome and let card/details scroll internally without hiding navigation. Advanced Robotics shares exactly the Hypercomputing illustration: give these two distinct, relevant original illustrations so the gallery proves individual card identity, not just family templates. Phone card face itself is readable and fits width. Continue local iteration and report ready; do not regenerate/push baseline suites until review settles.

## Reviewer checkpoint — gallery refinements

Reviewer-authored:

> Reviewer checkpoint: desktop and phone refinements independently verified and accepted. My 4K browser image is cropped despite correct DOM dimensions and no horizontal overflow. Please provide full local 3840x2160 PNG paths for gallery and inspector, without baseline regeneration or PR uploads. Finish accessibility checks and report ready for final review. Log this as reviewer-authored.

## Local gallery readiness evidence

Implementation findings, not human quotations: independently rendered local PNGs are `tmp/local-gallery-review/gallery-3840x2160.png` and `tmp/local-gallery-review/inspector-3840x2160.png`. Both PNG headers verify 3840×2160; both complete images were visually inspected. These are ignored local review artifacts, not regenerated baseline suites or PR uploads. Local checks at 1280×720, 393×852 and 3840×2160 verified no horizontal overflow, 44px minimum visible controls/links, keyboard inspection, bounded scrolling with reachable navigation, focus containment, Escape/source-focus restoration, and the three-player achievement restriction. A detected last-control keyboard escape was corrected. `bun run check` reports zero errors and warnings; `git diff --check` passes. Final illustrated E2E/baseline comparison and stacked PR publication remain deferred until visual review settles.

## Reviewer local visual acceptance

Reviewer-authored:

> Reviewer local visual acceptance: independently inspected both full 4K PNGs in tmp/local-gallery-review and live System colony example with internal scroll, plus prior desktop/phone/all-family reviews. Materials, hierarchy, readable rules and persistent controls are satisfactory for this increment. Proceed with required final E2E evidence and exact comparisons, accessibility regressions including the focus escape fix, required checks, commit/push and NEW PR based on feat/foundation-tracer. Verify hosted preview matches final revision, report PR and evidence. Do not merge or start further gameplay. Log this as reviewer-authored.

Implementation logging correction: re-read the supervising-conversation section of AGENTS.md. Existing entries remain intact; future delegated instructions are labelled reviewer-authored in PROMPTS.md, supervisor human voice requests remain in this file, and logical work continuations belong in PROMPT_WORK.md. AGENTS.md and this file will be included in the gallery PR.

## Final macOS validation

Implementation findings: all eleven ordinary browser runs pass exact comparison after the accepted design was finalized, including the seven existing arrival/table/recovery runs and four gallery viewports. The gallery walkthrough contains 26 illustrated steps and 104 macOS captures. Focus wrap, details scrolling, source-focus restoration, example public states and player-count restriction are covered. All twenty-six capture-audit regressions, static/types, policy/tooling and Firestore tests pass in the locked toolchain. Linux candidate review and its separate exact comparison follow on the new stacked PR; generation alone will not be treated as a comparison pass.

## Linux gallery candidate review

Implementation findings: pinned Linux run 39153519184 passed all eleven generated stories and twenty-six guard regressions. Its 104 gallery captures and 24 changed arrival/Continue captures were accepted after visual inspection of representative compact, phone, desktop and 4K states against the accepted local design and concepts. The remaining 78 foundation Linux captures are byte-identical to their existing baselines. Native platform scrollbar geometry is retained without masking or normalization. The independent comparison follows this evidence commit. PR #3 is based on `feat/foundation-tracer`; its preview and hosted smoke have already passed at application revision `cd4c51b`. No merge is authorized.

## Continue through implementation plan

What can I expect the implementation plan?

Okay, let's continue on this way through the implementation plan. You can keep monitoring, make sure each phase implementation plan looks good before proceeding to the next, proceed to the next

Reviewer interpretation: continue sequentially through IMPLEMENTATION_PLAN.md, beginning with milestone 002. Independently review each phase before authorizing the next. Publish each phase as a new PR stacked on the preceding accepted branch, keep all PRs unmerged, iterate locally first, and retain five-minute supervision. This explicit human authorization supersedes the earlier stop-after-gallery scope.

## Overlap implementation with CI

You can have the underlying agent work on the next step while CI finishes

Great, and you can have the agent overlap the next implementation phase with the previous phase’s CI

Reviewer interpretation: after independent local visual/functional acceptance and local checks, the next phase may start on a new stacked branch while the preceding phase finishes CI and hosted validation. Track outstanding gates per phase, fix failures promptly and propagate necessary fixes through dependent branches. No phase is finally accepted until its required checks and matching preview pass. All PRs remain unmerged. This supersedes the previous requirement to await all CI before starting the next phase.

## Remote review — seat containment

Reviewer-authored:

> First independent local remote review: created Review Host room a78a3a84-4893-4f33-9f97-aff9ccec339b, code LIGCU, via normal UI. Desktop/393px phone overall materials and invitation/setup hierarchy look coherent. Concrete desktop issue at 1280x720: Edit your name button protrudes below the occupied ivory seat mat and its bottom frame (phone fits). Keep that control contained with enough seat padding/height at desktop, including long names/edit state. Continue your in-flight functional/security work; full separate-identity join/readiness/recovery review and local checks remain before acceptance. No baseline cycle requested yet.

### Reviewer checkpoint: remote functional acceptance and QR contrast

Reviewer-authored instruction received by the implementation agent:

Independent review checkpoint: seat containment fix accepted including long-name editor PNGs. Joined LIGCU as separate Review Guest through code/preview/seat UI, marked ready and confirmed acknowledged state survives reload. Host sees guest ready; host Ready reaches Everyone is ready; changing Achievements to Randomized correctly clears both. Setup editor looks good. One concrete remaining visual defect: QR invitation dialog anchor is pale gold on ivory and nearly invisible at 1280x720; give the URL clear dark contrast and underline/focus treatment, also verify phone wrapping. Then proceed with final illustrated E2E/local exact verification and stacked PR on feat/card-gallery. Cover separate identities, missing/full room, readiness invalidation, retained restoration, keyboard dialogs, persistence and tabletop separation. Once local E2E passes and this narrow contrast fix is verified, report local-ready so I can authorize 003 while CI runs. Do not merge.

### Reviewer acceptance: phase002 and overlapping Basic setup

Reviewer-authored acceptance and instruction received by the implementation agent:

Phase002 local visual/functional acceptance: independently reviewed qr-1280.png and qr-393.png; URL contrast/wrapping fix passes. Also reviewed generated everyone-ready phone and preview-observes-production capture, plus prior live separate host/guest flows. No further visual changes requested. I confirmed full candidate run 13 passed; finish independent local exact comparison and required checks, commit/push and open phase002 PR based on feat/card-gallery. Once those LOCAL checks pass, you are explicitly authorized to start milestone003 Basic setup on a NEW branch based on your phase002 branch while phase002 Linux CI and hosted gates finish. Track both phases separately, fix/propagate CI issues, and keep PRs unmerged. Milestone003 must implement reviewed exact 2/3/4-player Basic setup, legal unique factions, Begin and starting mats/boards in remote desktop/phone and shared tabletop modes, with rules manifests and ordinary setup stories. Keep local preview for review before final baselines. Report phase002 PR/head and local exact result when available. Log this as reviewer-authored.

## Correct web-like composition

It looks very webby is that really what our ux design calls for?!

Reviewer reassessment: the remote gathering was accepted too readily for material palette and legibility while missing the concept composition. Compared directly to docs/ux/concepts/02-gather.png: current large web panels over background, side-by-side phone cards and detached controls fall short of the physical table, seat objects, central illuminated invitation instrument and compact stacked portrait rows. Withdraw phase002 visual acceptance and permission to advance003 until redesigned and independently reviewed. Preserve functional work, avoid invented gameplay, iterate locally before new baseline cycles.


## Stack merge follow-up

Going back to the question of merging those stacked PRs eventually, uh I think you said make merge commits, but could you rebase and merge? Does that work too


## Phase status

All right, not ready for worrying about that yet. So tell me again, where are we at? What's the overall number of phases, the implementation plan, and how is the current phase looking


## Fidelity review reminder

Okay, and you have a note to yourself to always check each phase against the actual approved UX design, looking for fidelity issues

## Gallery preview request

while we're waiting for progress on that, what's a PR preview URL I can use to review the card gallery

## Gallery quality rejection

these cards don't look good. what mockups are they meant to match? Why are they all different sizes? How did they get approved?

## Complete card inventory

aside from looking bad the card gallery also seems to be incomplete, it should have exactly all the cards for the game, no more, no less.

## Useful progress check

let's check that we are making useful progress.

## Current status

what's our currnet status

## Emulator environment clarification

what do you mean "blocked by offline emulators"? there should be a nix based environment that has been created that can do all that is required.

## Progress and fidelity assessment

give me a brief status summary of how far we've gotten - phase 8 of how many? are you satisified with the adherence to the visual design guidance from UX_DESIGN.md?

## Current status

what is our current status?
