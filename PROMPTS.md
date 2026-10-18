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

## Prompt 17: Remote Room Milestone

Reviewer-authored instruction; the new human authorization is recorded in `meta-prompts.md`:

Reviewer delegation under new human authorization recorded in meta-prompts.md, Continue through implementation plan: proceed sequentially through IMPLEMENTATION_PLAN.md with independent supervisor acceptance between phases. Start milestone 002 now on a NEW branch from accepted PR3 head 9f3e7dd, with a NEW PR based on feat/card-gallery. Implement real remote host/code invite/join using separate identities, ready state tied to configuration, retained-seat restoration, atomic seat claims and strict separation from tabletop seats. Follow full plan and UX contract; preserve existing flows and canonical persistence. Keep persistent local dev preview and report URL for direct review. Iterate locally first, then final illustrated desktop/phone stories, security/rules checks, exact comparisons and hosted preview verification. Include new meta-prompts entry on new branch; mark this instruction reviewer-authored in PROMPTS and continuations in PROMPT_WORK. After phase 002 is ready, await my review before starting 003; I will authorize each subsequent phase after independent acceptance. Keep all PRs stacked and unmerged, no merge. Update plan scope to reflect new human authorization replacing stop-after-gallery. Begin now.

## Prompt 18: Overlap Phase Gates

Reviewer-authored instruction:

Reviewer workflow update from explicit human steering, recorded in meta-prompts.md under Overlap implementation with CI: after independent local visual/functional acceptance and passing local checks, you may begin the next planned phase on a new stacked branch while the preceding phase finishes CI and hosted verification. Do not idle solely waiting for CI. Keep a per-phase ledger of pending gates and PR dependencies, promptly fix CI failures and propagate necessary fixes through dependent branches. Final phase acceptance still requires all checks and matching hosted preview. Keep all PRs unmerged. This supersedes my earlier wait-for-all-gates instruction. Continue 002 now and report local review readiness; include logging/plan clarification in its PR. Log this as reviewer-authored.

## Prompt 19: Contain Seat Controls

Reviewer-authored checkpoint:

First independent local remote review: created Review Host room a78a3a84-4893-4f33-9f97-aff9ccec339b, code LIGCU, via normal UI. Desktop/393px phone overall materials and invitation/setup hierarchy look coherent. Concrete desktop issue at 1280x720: Edit your name button protrudes below the occupied ivory seat mat and its bottom frame (phone fits). Keep that control contained with enough seat padding/height at desktop, including long names/edit state. Continue your in-flight functional/security work; full separate-identity join/readiness/recovery review and local checks remain before acceptance. No baseline cycle requested yet.

## Prompt 20: Finalize Remote Rooms

Reviewer-authored checkpoint:

Independent review checkpoint: seat containment fix accepted including long-name editor PNGs. Joined LIGCU as separate Review Guest through code/preview/seat UI, marked ready and confirmed acknowledged state survives reload. Host sees guest ready; host Ready reaches Everyone is ready; changing Achievements to Randomized correctly clears both. Setup editor looks good. One concrete remaining visual defect: QR invitation dialog anchor is pale gold on ivory and nearly invisible at 1280x720; give the URL clear dark contrast and underline/focus treatment, also verify phone wrapping. Then proceed with final illustrated E2E/local exact verification and stacked PR on feat/card-gallery. Cover separate identities, missing/full room, readiness invalidation, retained restoration, keyboard dialogs, persistence and tabletop separation. Once local E2E passes and this narrow contrast fix is verified, report local-ready so I can authorize 003 while CI runs. Do not merge.

## Prompt 21: Overlap Basic Setup

Reviewer-authored acceptance and instruction:

Phase002 local visual/functional acceptance: independently reviewed qr-1280.png and qr-393.png; URL contrast/wrapping fix passes. Also reviewed generated everyone-ready phone and preview-observes-production capture, plus prior live separate host/guest flows. No further visual changes requested. I confirmed full candidate run 13 passed; finish independent local exact comparison and required checks, commit/push and open phase002 PR based on feat/card-gallery. Once those LOCAL checks pass, you are explicitly authorized to start milestone003 Basic setup on a NEW branch based on your phase002 branch while phase002 Linux CI and hosted gates finish. Track both phases separately, fix/propagate CI issues, and keep PRs unmerged. Milestone003 must implement reviewed exact 2/3/4-player Basic setup, legal unique factions, Begin and starting mats/boards in remote desktop/phone and shared tabletop modes, with rules manifests and ordinary setup stories. Keep local preview for review before final baselines. Report phase002 PR/head and local exact result when available. Log this as reviewer-authored.

## Prompt 22: Recompose Gathering Table

Reviewer-authored delegation following the human visual correction recorded by the supervisor in `meta-prompts.md`. The human wording is intentionally not duplicated here.

I re-opened docs/ux/concepts/02-gather.png and agree. Withdraw phase002 visual acceptance and authorization to start003 until this composition is corrected. Preserve work and let in-flight checks finish safely. Current UI is large rectangular web panels over wallpaper; concept calls for a composed physical gathering table, seat-facing player objects, central substantial illuminated invitation instrument, secondary setup object, and portrait stacked compact player rows. Re-read UX_DESIGN.md visual promise and concept directly. Redesign supported remote gathering/navigation with actual depth/material/lighting/spatial relationships and compact portrait composition. Keep all text/actions semantic and accessible. Do not copy concept invented dice/ships/gameplay or claim faction choices before003. Existing functional tests remain valuable; iterate LOCAL only until fresh independent visual acceptance. Report revised composition ready, no further baseline churn or phase003 advancement. Log human wording only in meta-prompts (supervisor handles it); this delegation reviewer-authored in PROMPTS.

## Prompt 23: Balance Mode Instruments

Reviewer-authored checkpoint:

Reviewer checkpoint: independently compared composition-occupied-1280.png and phone capture against docs/ux/concepts/02-gather.png. Gathering composition is substantially closer: player objects around a table, central invitation instrument, secondary setup plaque and stacked portrait rows. Not final acceptance yet. Concrete remaining issue in composition-navigation-1280.png: oversized ivory Shared table rectangle dominates above two small remote discs, still reads as a web CTA panel on wallpaper. Make all three mode choices a coherent set of physical navigation instruments, with balanced scale/material and intentional placement on the table; retain clear Shared table versus remote Create/Join labels and semantic keyboard/touch controls. Preserve existing functions. Please provide revised desktop/phone navigation and gathering empty/2-player plus long-name/dialog states for local review, along with usable room URL. No new baseline cycle or publication yet; 003 remains on hold. Log as reviewer-authored.

## Prompt 24: Verify Gathering Composition

Reviewer-authored acceptance and checkpoint:

Reviewer round23: independently viewed navigation desktop/phone, long-name phone, name/setup dialogs, empty host setup, and live QSYKS visitor gathering at 1280. Revised navigation and desktop/phone gathering now meet the scoped composition direction in UX_DESIGN and concepts01/02: physical instruments, seat objects, central illuminated invite, secondary setup, stacked portrait. These inspected views are accepted. Before final local acceptance provide full 4K mode-navigation capture (changed shared-table entry), then refresh required local checks/exact illustrated regression coverage without weakening guards. Report results for reviewer verification; 003 stays on hold until that final local checkpoint. After acceptance, publish stacked phase002 PR based on feat/card-gallery; CI may overlap003 only once explicitly released. No merge. Preserve source-reviewed rules and accessible semantic controls; do not add concept-only gameplay.

## Prompt 25: Review Recovery Evidence

Reviewer-authored checkpoint:

Reviewer: independently inspected full navigation-3840.png; 4K mode entry accepted, with balanced tactile choices and intact margins. Saw your recovery-over-Ready failure and planned bounded dialog fix; continue that correction and existing validation, no duplicate work requested. Please include corrected phone recovery dialog/focus return evidence for my final review before releasing003. Final local acceptance still pending corrected recovery review and passing independent exact/local checks.

## Prompt 26: Publish Remote Foundation

Reviewer-authored acceptance and instruction:

Final local checkpoint: phase002 LOCAL ACCEPTANCE restored. Independently reviewed corrected 038 recovery phone and039 keyboard state; bounded dialog is readable and properly separates background controls. Prior desktop/phone/live gathering, navigation and full4K reviews stand. Verified remote-round24-verify.log completes bun run verify successfully including16 exact browser journeys and26 guards. Commit/push phase002 and open new PR based on feat/card-gallery, report URL/head. You are explicitly authorized to start003 Basic setup on a NEW branch based on this locally accepted phase002 branch while Linux CI/hosted verification finish. Track outstanding002 gates separately and propagate fixes. Implement source-reviewed exact2/3/4-player Basic setup across remote desktop/phone and shared tabletop, legal unique factions and immutable Begin; compare every rendered surface against approved UX/concepts before baselines. Keep local preview available, no fake gameplay, all PRs unmerged. Update ledger with restored local acceptance; final002 acceptance still needs Linux exact plus matching hosted preview.
