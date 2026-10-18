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

## Prompt 8: Compare UI Mockups

Compare this result to the ui mockups.

## Prompt 9: Iterate UI Fidelity

Ok record the prompts that led up to this in meta-prompts.md in the project — then tell the other agent what to do until the ui is satisfactory — keep checking on it and iterating till it is good.

## Prompt 10: Stacked Card Gallery

via voice So given the difficulty we had getting the graphical UI correct and for that PR, I wanna build deck cards on top of it starting with a gallery that shows how the cards are gonna be built, similar to the gallery for plans, you know. Have the agent do that as a PR on top of PR2 with the goal of eventually having a series of stacked PRs that I can review when I'm back at a computer. Do you understand what I want? And if you do, get the other agent to start working on it and monitor it as before

## Prompt 11: Local Review

Delegated reviewer instruction; the human wording is recorded in `meta-prompts.md` under “Local review cadence”:

Please apply the queued user steering now at your next safe boundary: prioritize a persistent local dev server for direct reviewer feedback, and report its URL. The user explicitly asked to defer repeated baseline generation and PR pushes until local visuals settle. Your queued human wording is already recorded in meta-prompts.md. Do not stop an in-flight command destructively, but switch to local review before starting further test/baseline cycles.

## Prompt 12: Local Design Cadence

Verbatim human voice steering; also recorded in `meta-prompts.md` under “Local review cadence”:

So just to be clear, for the card gallery, it should make a local dev server that you can look at, and not keep updating screenshots on the PR, because that'll go faster, and you might want to monitor it every two or three minutes because this process should go pretty quick. Maybe start with five minute intervals and see how that goes

## Prompt 13: Refine Gallery Composition

Local review at http://127.0.0.1:5197/gallery/ now works in my in-app browser. First card faces look good: readable semantic sections and ivory/brass materials. Concrete refinements before acceptance: at 1280x720 the header/filter stack consumes roughly 540px, leaving only card titles and a sliver of art on initial arrival; compact the intro and controls so cards lead the composition, retaining a concise fixture note. Full-size Hypercomputing inspector has Previous/Next below the bottom of the visible 720px viewport; keep close and previous/next in persistent reachable inspector chrome and let card/details scroll internally without hiding navigation. Advanced Robotics shares exactly the Hypercomputing illustration: give these two distinct, relevant original illustrations so the gallery proves individual card identity, not just family templates. Phone card face itself is readable and fits width. Continue local iteration and report ready; do not regenerate/push baseline suites until review settles.

## Prompt 14: Full Tabletop Captures

Reviewer-authored checkpoint:

Reviewer checkpoint: desktop and phone refinements independently verified and accepted. My 4K browser image is cropped despite correct DOM dimensions and no horizontal overflow. Please provide full local 3840x2160 PNG paths for gallery and inspector, without baseline regeneration or PR uploads. Finish accessibility checks and report ready for final review. Log this as reviewer-authored.

## Prompt 15: Correct Logging Routing

Reviewer-authored instruction:

Reviewer logging correction: re-read the new Supervising conversation and implementation log section in AGENTS.md. Our human voice requests belong in meta-prompts.md; I have recorded the local-server cadence request and logging clarification there. Your received delegated instructions belong in PROMPTS.md labelled as reviewer instructions, with logical work continuations in PROMPT_WORK.md. Do not duplicate these human voice requests into PROMPTS.md. Preserve historical entries. Include AGENTS.md and meta-prompts.md edits in the new gallery PR. Continue local-server-first iteration with five-minute review; no intermediate PR baseline churn.

## Prompt 16: Finalize Gallery Increment

Reviewer-authored instruction:

Reviewer local visual acceptance: independently inspected both full 4K PNGs in tmp/local-gallery-review and live System colony example with internal scroll, plus prior desktop/phone/all-family reviews. Materials, hierarchy, readable rules and persistent controls are satisfactory for this increment. Proceed with required final E2E evidence and exact comparisons, accessibility regressions including the focus escape fix, required checks, commit/push and NEW PR based on feat/foundation-tracer. Verify hosted preview matches final revision, report PR and evidence. Do not merge or start further gameplay. Log this as reviewer-authored.
