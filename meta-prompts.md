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
