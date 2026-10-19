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

## Prompt 27: Recompose Starting Boards

Reviewer-authored checkpoint:

Phase003 first independent concept review: viewed audit-1280.png and audit-393.png beside approved03-table-desktop. NOT locally accepted. Desktop player mat is a tiny unreadable thumbnail while Inspect faction select/button occupies a separate web panel; tech faces are narrow title strips and Exploration is squeezed into a narrow sidebar. Match the actual composition: readable active faction supply/resources integrated across bottom, compact opponents, substantial semantic technology card objects and proportionate exploration board, preserving reviewed real topology and concealed decks. Phone needs compact opponent/status strip, board-focused center and persistent readable own-resource/decision rail; currently tall header/button rows plus huge empty framed region and generic select dominate. Do not copy invented concept rules or add turn actions before004. Use current setup/inspect functions in tactile components. Keep original/provenanced artwork (reference scans only as rules sources). Iterate locally, provide refreshed desktop/phone/full4K and live review URLs before baselines. PR4 checks now all pass; supervisor still owes final Linux/hosted visual verification. Log as reviewer-authored.

## Prompt 28: Focus Compact Desktop

Reviewer-authored checkpoint:

Round27 independent review: viewed4p-technology-1280/393/3840 and4p-exploration-393. Improved substantial cards, readable bottom economy and balanced Exploration; phone direction substantially closer. NOT accepted yet: at1280x720 Technology clips Advanced Genetics text and completely hides fourth starting Robotics card and lower prerequisite nodes; Full faction mat button also overlaps mat footer production text. Provide a deliberate compact-desktop overview/focus treatment preserving complete public topology/card availability, with clear visible scrolling/focus affordance if needed and readable full card inspection. Keep mat footer/control nonoverlapping. Do not simply shrink all text or weaken clipping checks. Inspect1280x720 and short desktop alongside4K; use native semantic controls and approved concept03 hierarchy. Then provide fresh compact desktop plus live URL. Continue no phase003 baselines/004 until reviewed. PR4 is independently finally accepted at656f04d: Linux evidence/checks, matching revision.json and hosted create/reload verified; update ledger accordingly. Log reviewer-authored.

## Prompt 29: Verify Compact Focus

Reviewer-authored continuation:

Continue the authorized round28 compact-desktop correction after the transient model-capacity error. Reviewer inspected updated audit-1280.png: all starting cards/slots now visible and mat footer no longer overlaps, promising. Finish focus/return keyboard and short-desktop checks, provide focused Technology screenshot plus4-player compact state and live URL for independent review. No baseline/004 release yet. Log as reviewer continuation.

## Prompt 30: Validate Basic Setup

Reviewer-authored visual checkpoint:

Round28 visual checkpoint: revised phase003 composition accepted for final local validation. Independently opened live4player room, used Focus Technology and Lower branches; full public overview and readable scroll/focus treatment work. Reviewed tabletop-4-start and corner-mat-reader full4K, plus prior phone and compact640 screenshots; seat orientation and current setup/inspection scope are sound. Focus log now passes720/640/600/1440/4K. Proceed illustrated setup baseline generation then independent exact/full required checks for all2/3/4-player remote and shared-table variants, immutable Begin, unique factions, reload/recovery and keyboard. Report result/evidence/head for final local acceptance. Do not start004 yet; after checks pass I will release next phase with CI overlap. No merge. Log reviewer-authored.

## Prompt 31: Resume Setup Validation

Reviewer-authored continuation:

Continue the already-authorized phase003 final validation after the capacity interruption. Visual acceptance at round28 stands; resume illustrated captures and independent full checks. Preserve user files if disk cleanup is needed; report concrete storage blockers. Phase004 remains held until successful local verification. Reviewer continuation, no new scope.

## Prompt 32: Correct Capture Defects

Reviewer-authored continuation:

Reviewer continuation after capacity interruption: basic-final-candidates.log completed23 passed/5 failed. Fix concrete guards without weakening them: phone3/4player Take seat2 touch target too small; desktop3/4player Choose faction for Cleo clipped by remote-roster; desktop2player shared Technology prerequisites clipped by technology-layout. Inspect these intermediate setup views at actual viewport, then rerun affected journeys and full independent comparison. Prior game-board visual acceptance does not cover these new failed gathering states; provide corrected captures.004 remains held.

## Prompt 33: Clarify Shared Navigation

Reviewer-authored final-capture review:

Reviewer final-capture review after capacity interruption: confirmed basic-final-verify.log28 exact journeys pass, but NOT final visual acceptance. Inspected003 screenshots 2player shared015-begun-desktop: center board clips lower technology cards/branches with no visible focus/upper-lower controls, huge surrounding empty space; apply deliberate overview/focus navigation to compact shared mode too, preserving seat-facing controls/topology and full-card access. 4player remote026-faction-chosen-2-desktop is actually portrait guest view: roster cuts off Ada at top and Dara below without clear scroll cue. Add visible accessible roster navigation/scroll affordance while keeping current player controls reachable; do not shrink touch targets. Review actual dimensions, not filename suffix. Preserve passing guards, provide corrected compact-shared and portrait roster PNGs before final evidence update.004 remains held. Resume same task; no merge.

## Prompt 34: Finalize Shared Status

Reviewer-authored checkpoint:

Reviewer 04:11: independently inspected round33 shared-2p-focus-1280.png, shared-4p-lower-1280.png and 4p-roster-Your-seat-393.png. Shared focus/branch navigation and portrait roster affordances resolve prior blockers; shared log now passes 2/3/4 at 1280/1440. One visible residual: Starting position: setup is complete... footer overlays the top of Ada mat in both shared focus PNGs, low contrast and colliding with mat header. Move that status into a contained readable location or omit redundant status. Finish current corner audit (latest log screenshot timeout), then refresh full checks before publication/004. No duplicate redesign requested; these reviewed controls look good.

## Prompt 35: Publish Basic Setup

Reviewer-authored delegation:

Reviewer 05:22: phase003 LOCAL ACCEPTANCE granted. Independently reviewed refreshed compact overview, rotated1280 mat reader, removed footer, portrait navigation and final4K 025-begun tabletop capture against prior concept review; final verify log now31/31 exact journeys, guards and required checks pass. Commit/push003 and open new stacked PR based on feat/remote-rooms; report PR/head. Then explicitly proceed with milestone004 on a NEW branch stacked on003 while Linux CI and hosted verification finish. Preserve full existing functions and approved UX fidelity; iterate004 locally and await independent local review before005. Track003 final CI/Linux exact/hosted revision gates separately, propagate fixes if needed. All PRs remain unmerged. Record delegation in PROMPTS and work in PROMPT_WORK.

## Prompt 36: Restore Rotated Cards

Reviewer-authored checkpoint:

Reviewer 06:11: PR5 now head32bdfdb; final Linux/hosted gates still pending. Independently inspected tmp/local-research-review/corner-1280-plan.png: rotated orientation is preserved, but selected card is reduced to a thin title strip above a large empty dark area, losing the tactile illustrated card presentation. Before004 readiness, give compact rotated planning a deliberate readable card/bonus composition (full-card inspection can remain), with visible required ship-choice controls and complete commit affordance. Do not accept geometry pass alone. If this PNG predates your current fix, provide refreshed evidence instead. Continue current fixes; no005 release.

## Prompt 37: Complete Research Review

Reviewer-authored continuation:

Reviewer 11:28: independently inspected round36 1280-card-and-bonus and1280-ready-to-commit. Substantial illustrated card, legible bonus, ship selection and contained payment/commit resolve the thin-card correction; scoped visual acceptance for these views. Continue now: finish PR5 cold-arrival readiness diagnosis/fix with unchanged guards and propagate into004; complete004 functional review evidence across remote/phone/shared4K including trades, reload and handoff, and provide current live URLs plus final captures for independent review. No005 release or final004 acceptance yet. PR5 head75d228c still Linux30/31; hosted/static pass. Do not wait for another human prompt, never merge.

## Prompt 38: Verify Capture Fixes

Reviewer-authored continuation:

Reviewer 11:54: PR5 Linux run39246644493 finished29/31; independently read failed log. Cold phone arrival now passes. Failures are tabletop-4k foundation recovery Persist Ada seat (recovery.spec.ts18) and003 two-player shared setup (setup-tabletop.spec.ts20), shared capture deadline2017.997ms versus2000ms. Inspect traces/capture cost and resolve without weakening budgets, comparisons or guards; propagate any003 fix into004. Hosted publish/static/docs pass3d09db1; supervisor verified exact hosted revision and retained AIPFK host recovery. Agree with removing empty achievement acknowledgement per UX contract; finish that correction and refreshed flow evidence, then provide review-ready live URLs.004 local acceptance and005 release remain pending.

## Prompt 39: Correct Card Composition

Reviewer-authored delegation:

Overriding human correction: user rejected PR3 gallery appearance and inconsistent card sizes; exact human message logged in meta-prompts.md Gallery quality rejection. Supervisor independently reopened hosted PR3 and docs/ux/concepts/04-research.png and WITHDRAWS gallery visual acceptance. Same-family cards have content-driven heights (no aspect ratio), oversized headers and weaker art/icon/rule hierarchy versus concept. Hold005 and further phase advancement. Prioritize local shared CardFace/gallery correction against04-research,06-colonization,08-achievements-v2 with deliberate consistent dimensions per family and composed art/rules; preserve semantic source-reviewed rules/accessibility, no cropping rules to force fit. No baseline churn until independent visual acceptance. Existing003 CI repair may finish; preserve work and propagate eventual card fix through dependent branches. Do not merge. This is reviewer-authored delegation; do not duplicate human text into PROMPTS.

## Prompt 40: Complete Card Inventory

Reviewer-authored delegation:

Additional overriding human requirement: gallery must have exactly all cards for the game, no more and no less. Verbatim logged in meta-prompts.md Complete card inventory. Replace six-example scope with complete source-verified inventory for documented Beyond the Sun second-printing base game; preserve documented expansion/variant exclusions. Audit every card family, canonical identity, printed text, level/type, and physical duplicate quantities against authoritative sources. Distinguish unique designs from physical copies explicitly; no invented filler or extra fixture-only cards in collection. Use canonical production content, keep optional presentation markers separate, verify manifest equality and quantities to detect missing/extra/duplicate IDs. Do not guess unavailable card text/art; report precise source gaps. Update gallery counts/docs and completeness evidence. Combine with queued visual correction, no advancement/baselines before independent acceptance. Reviewer-authored delegation; human text remains in meta-prompts.

## Prompt 41: Complete Original Illustrations

Reviewer-authored delegation:

Reviewer checkpoint: inventory report and six catalog checks inspected; internal consistency is useful progress, not final source/visual acceptance. Once current integration/type and two long-face overflow fixes pass, proceed directly to completing the 68 missing original illustrations in coherent reviewed batches with provenance. Do not stop at pending-art placeholders or wait for another human prompt. Show a small representative batch against the approved concepts before scaling the artwork, then complete all families. Keep local-first, no baseline churn or phase005; preserve source limitations explicitly. Human useful-progress request is logged in meta-prompts.md.

## Prompt 42: Scope Artwork Approval

Reviewer-authored checkpoint:

Scoped art-batch review: independently inspected round41 phone Human Experiments, Mass Enlightenment and Transcendence and reopened04-research. The three distinct illustrations crop coherently and fit the intended painterly material palette; proceed with remaining65 original illustrations using this direction and provenance. This approves the representative artwork direction only, not full card visual acceptance: final review still needs stronger readable icon/cost hierarchy against concepts, complete-art collection, source fidelity and desktop/shared contexts. Keep all baselines and phase advancement held.

## Prompt 43: Resolve Edition Discrepancy

Reviewer-authored checkpoint:

Reviewer checkpoint: round42 phone hierarchy and enlarged shared4K inspector independently viewed; these scoped corrections look satisfactory. I also verified the three pinned source hashes and ten Achievement entries; publisher clarification confirms Specialization includes shipyards. Full acceptance is still pending source review. While I review remaining faces, investigate the documented WISE edition-name discrepancy using publisher/authoritative second-printing evidence, and report any precise mechanical-text uncertainty still unresolved. Preserve current visuals; do not generate baselines, push, advance005 or redo passing checks absent changes. Log as reviewer-authored.

## Prompt 44: Verify Gallery Correction

Reviewer-authored checkpoint:

Reviewer checkpoint: independently compared all 46 Technology definitions against all ten readable pinned source crops, plus all 20 Events against four readable Event crops and publisher Museum/Dyson/Quantum/Ministry clarifications. No mechanical mismatch identified. WISE investigation is complete to available evidence; preserve the documented unresolved physical second-print name/verbatim-wording limitation, do not guess or claim definitive edition equality. Round42 shared CardFace visual correction is locally accepted based on reviewed phone dense faces, desktop collection/live search/focus and shared/corner/4K contexts. You may now prepare final illustrated gallery E2E evidence and run independent macOS/Linux exact comparisons with unchanged guards. Cover all100 identity/quantity equality and original-art completeness, full markers and long faces. Prepare a concrete propagation plan to update PR3 and carry correction through PR4/PR5/current004 without mixing future gameplay into earlier branches. Keep005 held; do not merge. Report exact outcomes and propagation plan before publishing changes; full final acceptance remains pending these checks and hosted revision review. Log this as reviewer-authored.

## Prompt 45: Publish Linux Candidates

Reviewer-authored response:

Reviewer response to Linux runner question: no additional local endpoint is known. Do not pursue sudo credentials or install a new runtime. Complete macOS exact evidence and the propagation plan first; report Linux as pending, then use the existing GitHub pinned Linux workflow after the reviewed stack update is published. Linux is a final acceptance gate, not a prerequisite for that publication. The earlier request to report before publishing remains for the propagation plan/macOS results; no need to stall useful local work. Keep005 held and preserve all review evidence given low disk space. Log as reviewer-authored.

## Prompt 46: Confirm Linux Checkpoint

Reviewer-authored checkpoint:

Reviewer16:45: independently fetched hosted PR3 revision.json and it now serves fff9e5206596c4c4a11a1ffd39375ff08278966e, despite the earlier deployment wait timeout. Do not treat that as functional smoke acceptance yet. Independently inspected Linux Human Experiments phone, full-claim phone and Dyson desktop: readable and coherent. Linux static log confirms remote-4 compatibility test exceeded aggregate5000ms; preserve security assertions and all existing UI/capture budgets when addressing it. Continue current investigation;005held.

## Prompt 47: Accept Corrected Gallery

Reviewer-authored acceptance:

Reviewer17:15 acceptance: independently confirmed PR3 head1bcc370 all required checks pass and hosted revision matches; cumulative live gallery search/inspection/Escape review plus source/inventory/art review accepts the corrected gallery, with documented WISE edition-name limitation retained. PR3 remains unmerged. Independently read PR5 final31/31macOS exact log and viewed four-player4K starting-card-return image: Basic Spacefaring and lower focused card contained, orientation preserved; scoped fix accepted. Finish PR4/PR5 remaining Linux/hosted gates and004 local review.005 remains held until004 independently passes; no merge.

## Prompt 48: Accept Remote Correction

Reviewer-authored acceptance:

Reviewer17:33: corrected PR4 head28d63df finally accepted. Independently verified all checks pass, matching hosted revision, live create room EVUGV (52e514a2-2f36-4143-b088-2702374b854b), readable physical gathering composition, and host identity/setup retained after reload. Remains unmerged. Continue PR5 gates and004 local review;005 still requires004 acceptance.

## Prompt 49: Accept Basic Correction

Reviewer-authored acceptance:

Reviewer18:14: corrected PR5 af76265 finally accepted after all required checks and matching revision, independent hosted shared seating/factions/Begin/card scroll/Escape/reload review. Room fc9b8ba4-24b3-4ea2-b88b-2426308ea39c retains factions/resources/board. Cumulative phone/4K/local/Linux review stands. Minor accessibility polish for subsequent local work: unjoined seat editor exposes disabled Choose faction for undefined; use a meaningful seat label. Continue004 local review preparation already underway;005 still held pending independent004 acceptance. No merge.

## Prompt 50: Compose Research Choices

Reviewer-authored visual finding:

Reviewer18:18 phase004 visual finding: reviewed round47 research-open-1280/planned-1280, research-open/upgrade-393 and four-cardinal-3840 actor2-plan against04-research. Rotated compact shared planner is readable/contained. Desktop1280x720 initial planner spends visible area on heading/pawn controls/art: both first-row card rules and Select controls are below scroll, unlike concept composed choices. Please improve desktop decision overview so first pair shows identity, art, immediate consequence and selection together without initial scrolling; preserve readable text, consistent shared card sizing and full inspection, using the compact planner approach if appropriate. Selected desktop state should retain visible card identity alongside consequence (currently titles scroll away). Phone ship picker also needs selected ship consequence clear with commit. Continue local iteration only; no004 baseline churn/005 release yet.

## Prompt 51: Accept Research Composition

Reviewer-authored scoped acceptance:

Reviewer18:28: independently inspected round50 overview-initial/selected1280x720 and research-upgrade393. Requested composition correction passes scoped visual review: first pair shows identity/art/immediate consequence/Select together; selected summary retains title/consequence; phone commit shows exact selected ship and level1to2. Continue remaining local functional/keyboard checks and prepare concise review entrypoints. Full004 acceptance still awaits my independent live flow review and final local checks; no005 release yet.

## Prompt 52: Validate Research Increment

Reviewer-authored local acceptance:

Reviewer18:40: phase004 independent local visual/functional review accepted for final illustrated validation. Fresh ordinary shared setup3b69ddba-d33f-4bfc-b78b-400bc8be5981: Genetics permanent payment/bonus, reload pending production, Growth auto-handoff; Luna Lasers disabled until explicit second-ship choice, correct level1to2/Ore gain, Produce Ore auto-handoff. Prior live trade room exercised all3rates and occupied-space blocking. Cumulative phone/desktop/4K/cardinal/corner/observer reviews and round50 correction accepted. Proceed required TestStepHelper illustrated stories and final local exact checks with unchanged guards, then publish004 stacked on accepted PR5. Report exact pass; I will release005 after that local gate while004 CI/hosted finish. No merge.
