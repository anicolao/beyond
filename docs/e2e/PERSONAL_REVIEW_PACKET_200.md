# Phase014 source-linked review packet

**Current207 status:** affected verification PASS:8/8 exact in4.1m,658 comparison-mode frames. Only32 compact focused upper/lower references changed;1426 other files in that folder are byte-identical. The preserved pre206 full208/208 result remains valid for its frozen source. Combined evidence retains208 variants/16,307frames with complete parity/links; this is not a new full208 run. Reviewer208 grants014 local acceptance on the preserved full208 plus current affected8 evidence. Publication is authorized; final Linux/exact-head hosted acceptance remains pending.015 begins only on a new stacked branch after014 publication; no merge. See [affected verification](PERSONAL_FOCUS_VERIFICATION_207.json), [32-frame audit](PERSONAL_REFERENCE_AUDIT_207.json) and [101-frame cumulative chain](PERSONAL_REFERENCE_CHAIN_207.json).

Reviewer200 continuation. Branch `feat/personal-technology`, base013 `fecea48f259f16253566c9d894dcf0986eb4efd9`. Persistent local client: http://127.0.0.1:5209/. Reviewer203 released formal illustrated generation for the locally reviewed composition. Whole014 acceptance, publication,015 and merging remain held. Earlier scoped observer/phone/rotated review stands.

## Authority and exact boundaries

[Publisher second-print rules, printed23/PDF25](https://www.riograndegames.com/wp-content/uploads/2020/08/Beyond-the-Sun-2nd-Print-Rules-Combined.pdf#page=25), retained SHA256 `85fbf08a21f7753331c3a89896deee55b6b0690c59b70d32ca42e7839d24fcdc`: personal acquisition needs no research Population; immediate bonus, exclusive Action access and level VP belong to the owner; other factions cannot research/copy/target it. The card is public beside the mat. Procyon takes actual topII; WISE actual topIII. Neither draws an Event/candidate pair or inserts a cube. Older games prepare the canonical retainedIII permutation once before payment; public projection exposes readiness/count only.

Each card below links to its production mechanical paraphrase and independently pinned source-cell checklist. Component authority is the [publisher-authorized BGA adaptation](https://boardgamearena.com/gamepanel?game=beyondthesun), base release250418-1337, `techs.jpg` SHA256 `eeb39d18a40276a80cf4b1a37e64e6969939089069587c3c77b09dc6f11fc2a9`. No source scan is shipped as artwork. [Inventory/source method](../content/CARD_INVENTORY.md), [pinned checklist](../content/second-printing-card-inventory.json), [detailed014 source review](../content/PERSONAL_TECH_SOURCE_REVIEW_014.md).

WISE's physical second-print name/verbatim-wording limitation remains [documented](../content/WISE_SOURCE_REVIEW.md); one stable identity is retained. Android Destroyers' precise unresolved question is whether a higher personal level contributes to its highest *researched* levelX. No explicit publisher/designer ruling was located. If the competing readings differ, both public/personal Actions block before payment; equal-X cases remain legal and its fixed immediate bonus works. No guessed interpretation is implemented.

[Designer Wormhole clarification](https://boardgamegeek.com/thread/2555909/wormhole-technology-clarification), Dennis K.Chan Dec7 2020: immediate unrestricted jumps are distinct from the permanent Sol/Deep Space restriction. Indexed primary text was readable; bare thread returned403. No secondary interpretation substitutes for the primary reply.

## Card-by-card LevelIII coverage

Every row has an actual-top acquisition/queue/resolution backend test. Those are labelled retained-state security fixtures, not ordinary UI proof for every card. All cards scoreIII without becoming a permanent research cube. Unsupported Actions remain visible for full inspection and block before payment.

| Card / canonical face | Pinned source cell | Immediate | Exclusive Action / permanent ability |
| --- | --- | --- | --- |
| [Transdimensional AI](../../src/lib/cards/technology-cards.ts#L31) | `techs.jpg:3:5` | Population; optional discoveredI/II research, pay one permanent Population, no prerequisites/immediate replay. | Permanent one-prerequisite exception on supported discovered two-prerequisite research. |
| [Planetary-scale Research](../../src/lib/cards/technology-cards.ts#L32) | `techs.jpg:3:6` | Supply→ship2, jump2. | Advanced research Action blocked. |
| [Metahuman Chambers](../../src/lib/cards/technology-cards.ts#L33) | `techs.jpg:3:7` | Food automation, Supply→Population. | LevelIIII research Action blocked. |
| [Hivemind Computing](../../src/lib/cards/technology-cards.ts#L34) | `techs.jpg:3:8` | Ore automation, jump1. | LevelIIII research Action blocked. |
| [Deep Space Megastructures](../../src/lib/cards/technology-cards.ts#L35) | `techs.jpg:3:9` | Supply→ship3 in Deep Space, jump1. | Combined build/researchIII Action blocked. |
| [Capital Ship](../../src/lib/cards/technology-cards.ts#L36) | `techs.jpg:3:10` | Supply→ship4, jump1. | 3Ore + Population→ship4; optional2Ore + Population→ship2; jump3. |
| [Android Armada](../../src/lib/cards/technology-cards.ts#L37) | `techs.jpg:4:1` | Two persisted Supply→ship2/Population choices; repeats legal. | 4Ore, Supply→ship4, jump3. |
| [Mercenary Fleet](../../src/lib/cards/technology-cards.ts#L38) | `techs.jpg:4:2` | No immediate box. | 3Ore colonization; second Action1Ore, return1Population, Population→ship4, jump2. |
| [Cerebral Implants](../../src/lib/cards/technology-cards.ts#L39) | `techs.jpg:4:3` | No immediate box. | Research choice Action blocked. |
| [Manufacturing Orbitals](../../src/lib/cards/technology-cards.ts#L40) | `techs.jpg:4:4` | Capped control Ore, Population per two colonies, optional Population→ship2, jump2, in printed order. | Repeat same ordered immediate effect. |
| [Android Rights Movement](../../src/lib/cards/technology-cards.ts#L41) | `techs.jpg:4:5` | Food automation; remove two rightmost available Supply cubes together, then place into empty slots. | Optional1Ore replaces one Population-return cost on supported colony/eligible build Actions. |
| [Subatomic Fabrication](../../src/lib/cards/technology-cards.ts#L42) | `techs.jpg:4:6` | Either automation, Population, Ore, jump1. | Owner may choose disc track on supported automation/outpost/colony and ordinaryI research. |
| [Quantum Data Exchange](../../src/lib/cards/technology-cards.ts#L43) | `techs.jpg:4:7` | Ore automation,2Ore. | Copied Action blocked. |
| [Hyperdrive Boosters](../../src/lib/cards/technology-cards.ts#L44) | `techs.jpg:4:8` | Three persisted+1 allocations, repeat same ship legal, cap4. | Optional+1 on up to two ships, jump4. |
| [Wormhole Technology](../../src/lib/cards/technology-cards.ts#L45) | `techs.jpg:4:9` | Supply→ship2, Ore, unrestricted jump2. | Permanent movement topology; adjacent first hop from Sol/Deep Space retained. |
| [Stealth Terraformers](../../src/lib/cards/technology-cards.ts#L46) | `techs.jpg:4:10` | No immediate box. | Combined movement/colonization Action blocked. |

Implementation: [acquisition/ownership](../../src/lib/game/personal-technologies.ts), [III queues](../../src/lib/game/personal-level-three.ts), [paid exclusive Actions](../../src/lib/game/technology-actions.ts), [atomic policy](../../firestore.rules). [Security tests](../../tests/backend/personal-technology-security.test.ts) cover all16III/all16II actual tops, foreign controller/ownership, forged next card, split root/event writes, all-five-column mint attempts, same-card replay, preparation mutation, no cube, mandatory Population-funded build, modifier costs and Wormhole topology forgery. [Model tests](../../tests/backend/personal-technologies.test.ts) cover ownership/quantity/concealment/scoring.

## Ordinary production-UI evidence and entrypoints

No controller/resources/ships/ownership were injected. Replay seeds were declared only at normal Begin; legal preparatory turns/payments settle the actual top card. Remote replays use distinct host/guest identities. URLs provide public inspection, never controller transfer. For independent play use normal Create/Join, unique factions, readiness and Begin.

- Shared Hyperdrive: http://127.0.0.1:5209/?table=18e29a13-8523-47a7-ac6b-013730aacbad
- Rotated Hyperdrive: http://127.0.0.1:5209/?table=423d8145-b0d8-4272-b0c8-82342390f2f7
- Remote Hyperdrive: http://127.0.0.1:5209/remote/?room=55c208a9-f0e2-4eaa-bdc9-7162f348c23b
- Pending rotated Rights, Continue colony: http://127.0.0.1:5209/?table=873bee68-ca36-4711-95a3-2ad233efb431

Hyperdrive ordinary flows cover WISE payment/acquisition, three allocations to the same ship1→4, reload, exclusive printed-cost/occupied Action semantics and real four-jump plan. Remote AI demonstrates optional bonus-free research; Armada second repeated choice survives reload; Rights demonstrates rightmost removal and legal A/E placement. Earlier Procyon normalUI flows cover actual topII, once-only immediate, owner-only paid Plasma Action, public observer denial, score/register, reload and full-card focus return. Separate proof categories and exact immutable PNG paths are indexed in [coverage JSON](PERSONAL_WISE_REVIEW_199.json), [sealed phone evidence](PERSONAL_PHONE_EVIDENCE_197.json) and [short-table evidence](PERSONAL_SHORT_TABLE_REVIEW_198.json).

[Local review index with native640/720/4K images](/Users/anicolao/projects/games/beyond/tmp/local-personal-review/REVIEW-199.md). Full-card Enter/Escape returns exact opener and preserves both destination drafts at all three sizes; no game move committed during reader audits. Superseded/clipped captures and failed scripts remain preserved.

## Current checks and separate gates

Current-source323backend tests/3989assertions,26suites0failed;65tooling;51capture guards; types0errors/0warnings; build/policy/diff pass. Logs and rulesSHA are in the coverage JSON. The complete current-source macOS exact comparison now passes208/208. Supporting checks and the frozen-source/frame audit pass; independent whole014 acceptance remains pending.

PR14 candidate119692436215159/164 rejected. Trace shows one2299ms capture with screenshot35ms and2229ms untraced post-detach gap, plus four120s stories; no universal cause claimed. Writer candidate avoids reading stale bytes only when lengths differ; same-length byte equality and all writes/screenshots/deadlines retained, four focused tests pass. It remains unpublished/unproved on Linux. Slower compression was measured and rejected.

PR15 candidate119734505522178/184 rejected: all4K,007four-corner/cardinal120s,012two-cardinal capture2024.512605ms,013mixed-disc4cardinal120s,013exile4corner120s,013mixed-disc4corner120s. Reviewer log `/tmp/beyond-pr15-candidate-review.log` SHA256 `24d0a67635fd679c6eeb308e9101b6873b45cb64311d2990930344ebc46ddb24`; independent complete log also preserved. Closed-page/detach diagnostics do not replace primary deadlines. No failed native references adopted.

Exact-source publisher503/matching-head hosted gates for012/013 remain open. Diagnostic source partitions are never deployed; no older-policy fallback. Source call-graph audit found no obvious cycle/depth violation, not a proved compiler repair. Tight storage/headroom request remains open; preserve files/evidence and avoid large downloads. All stack dependencies and live reviewer services/controllers preserved.

Reviewer202 correction: the compact Rights instruction is now visible: “Move the2 rightmost Supply cubes into available slots.” Full printed rules remain inspectable. Fresh640/720/native4K captures pass unchanged containment/2s capture guards and were visually inspected; [current proof and PNG paths](/Users/anicolao/projects/games/beyond/tmp/local-personal-review/round202-rights-instruction/proof.json). Prior instruction-hidden images remain historical evidence. No rules/model change or baseline generation.


## Formal validation203 — current results

**macOS exact comparison: 208/208 PASS in 55.6 minutes**, command/report exit0, no snapshot-update flag. [Final verification](PERSONAL_FINAL_VERIFICATION_203.json) and [196-file source freeze](PERSONAL_SOURCE_FREEZE_203.json). All208 story records are comparison-mode (`generating=false`);16,307frames exist with valid PNG dimensions, unique steps, required viewport parity and complete prior walkthrough links. The014 increment is24variants/2908frames:5phone,12desktop,7native4K. Capture, geometry, exact-pixel, fixture, reporter, capture-context and trade-containment sources are byte-identical to accepted013. Original2s operation/capture,120s story and5s backend budgets remain.

Pinned offline Nix checks:323backend tests/3989assertions across26suites0failed;65tooling;51capture guards; types0errors/0warnings; policy/source diff and both static builds PASS. These supporting model/policy/tooling checks precede only CSS-only title/focus repairs; current types/policy/build and complete frozen exact subsequently pass. Full logs are retained in the project `tmp/personal203-*` evidence set. The final raw reference audit and source diff check also pass. Whole014 independent local acceptance,014 publication,015 and all merges remain held.

### Reference scope and selective visual review

Expanded ordinary TestStepHelper candidates passed24/24 with2908frames. Source acquisition/choices are real normal-UI actions backed by isolated emulators: Procyon/Plasma, WISE/Hyperdrive, AI, repeated Armada and Rights relocation, distinct remote host/guest, shared2/4cardinal/corner, retained responses, source inspection and exact Escape return. Prep browsing/route-editor openings have individual frames. No future deck contents are rendered or controller/game state injected.

The first full pinned comparison completed200/208 with eight inherited compact pixel failures. Inspection tied them to round198 title/seat/heading clearance and identified a narrower Terraforming wrap. A scoped LevelI inset correction retains14px type,44px controls and real topology. The collateral audit then caught a two-column rule leaking into focused Technology; the rule is now overview-only so focus retains the full-width reader. Intermediate candidate7 focus images remain rejected evidence. Current inherited candidates8/8, Rights candidates2/2 and subsequent independent affected exact10/10 pass before the full208 gate.

[Selective inherited reference audit](PERSONAL_REFERENCE_AUDIT_203.json):77 changed frames across003(4),004(51),005(16),010(2),011(4), versus5362 byte-identical PNGs in those bounded folders. All beforeBlob values equal accepted013; all changed pixels stay within the expected public board/header region.63frames are1280×720 and14are1280×640. Reviewed examples include unbroken public titles, complete short focus, and unchanged readable rotated Build/Jump foregrounds above the cleared board. This is selective visual review, not exhaustive independent certification of every image.

Only6 additional014 images changed after the inset repair: compact Rights/source-inspection/Escape-return at1280×640 in both projects. Deltas are bounded to the background LevelI cards, not responder instructions/selectors/Save;4958 retained candidate PNGs are byte-identical to the pre-inset copy. Inactive historical candidate files remain preserved and excluded from intended staging. [Full inherited-byte reconciliation](PERSONAL_REFERENCE_PROVENANCE_203.json) now passes: 13,322 of 13,399 inherited active frames exactly match accepted013 blobs; the other77 exactly match the reviewed before/after manifest. All2908 active014 frames have a sorted SHA256 manifest, and2056 inactive personal candidates remain preserved/excluded from staging. No extra inherited change or deletion was accepted.

### Current representative captures

Every link below is selected by its actual final story record rather than a filename glob. Full illustrated walkthroughs are in [014](../../tests/e2e/014-personal-technology/README.md).

- [Phone WISE acquisition and upgrade instruction](../../tests/e2e/014-personal-technology/screenshots/acquire-wise-personal-hyperdrive-and-retain-its-exclusive-action-with-separate-controllers/078-personal-acquired-phone-darwin.png).
- [Phone exclusive Plasma Action saved, no extra research cube](../../tests/e2e/014-personal-technology/screenshots/acquire-procyon-personal-plasma-cannon-and-retain-its-exclusive-action-with-separate-controllers/127-personal-ii-action-phone-darwin.png).
- [Short rotated Rights instruction and selectors](../../tests/e2e/014-personal-technology/screenshots/retain-wise-android-rights-choices-at-two-shared-corner-seats/077-rights-compact640-desktop-darwin.png).
- [Native4K four-corner retained personal card beside Ada’s mat](../../tests/e2e/014-personal-technology/screenshots/acquire-wise-personal-hyperdrive-at-4-shared-corner-seats/147-retained-personal-board-tabletop-4k-darwin.png).
- [Corrected compact overview](../../tests/e2e/005-technology-discovery/screenshots/resolve-four-corner-resource-cubes-and-the-complete-exo-alloy-queue/096-compact-overview-640-desktop-darwin.png) and [full-width focus](../../tests/e2e/005-technology-discovery/screenshots/resolve-four-corner-resource-cubes-and-the-complete-exo-alloy-queue/097-compact-focus-640-desktop-darwin.png).

### Preserved failed evidence and infrastructure

Earlier exact1 was intentionally interrupted after33pass to add missing navigation frames. Exact2 retained32pass/21fail/1interrupted/154notrun under an artificial2GiB test JVM measured98.6% full. Only owned E2E emulators were relaunched through the locked cached Nix Java21.0.11/Node24.18.0/Bun1.3.13 with normal heap; unchanged affected exact2/2 and subsequent full exact3 had no saving/timing failure. Exact3’s200pass/8pixel failures, both failed partial outputs and intermediate candidates remain preserved. No failed actuals were copied into references; fresh warranted candidates were captured and inspected. No universal Linux timing cure is claimed.

Current captures/tests used only isolated Auth17997/Firestore17897. Reviewer client5209/Auth9397/Firestore8297, original identities and room history were never restarted/reset. Safe cleanup removed only regenerable caches/retired build outputs, not source/dependencies/room data/captures/failed runs. A reused title diagnostic overwrote its unsealed scratch JSON path; current output is separately labelled `personal203-title-clearance-current.json`. Sealed198 PNGs/manifests remain intact. No image transforms/re-encoding or capture-helper changes followed.

PR14/15 Linux exact/native and matching-head publisher gates remain separate and OPEN. Both failed native cohorts are excluded; only small failure evidence was downloaded, not the34.1GB failed baseline archive. Writer-only length-first IO candidate retains equal-length full byte equality and every changed write inside the original2s budget. Four focused tests/the65tooling suite pass; its two-file patch applies to exact PR14/15 heads without gameplay, rendering or guard changes. Linux benefit remains unproved; no publication or baseline adoption inferred. PR15’s2024.5ms capture spent1569ms in readiness/394ms capture/2.837ms post-detach, differing from PR14’s2229ms post-detach signature. Five PR15 stories spent71.2–75.3s capturing105–113frames before120s; primary deadlines remain the diagnosis, not later closed-page errors.

Strict canonical-source publisher503 remains unresolved. No diagnostic or older policy was deployed, and no fresh blind cloud retries were made. Read-only reachability found four unreachable functions in the older237-function policy; the pruned diagnostic is not canonical source, not a deployment or a proved compiler fix. [Android Destroyers/WISE source limitations](../content/PERSONAL_TECH_SOURCE_REVIEW_014.md) remain explicit.


Reviewer204 reconciliation: the independently reported3370/6709/4449-pixel desktop failures match exact3’s original log and preserved expected/actual/diff files exactly. They are distinct from exact2’s heap/readiness failures. [Artifact hashes and subsequent-gate mapping](PERSONAL_REVIEWER_204_RECONCILIATION.json) tie them to the already completed post-run CSS investigation/correction and final208/208 exact4. No new source change, reference generation or comparator change was made for this checkpoint;014/015/publication/merge holds remain.


Reviewer205 Exo title finding is valid for the preserved `personal203-collateral-review/2-after.png` exact3 actual. It is not the corrected current frame. [Current720 state and historical/current hashes](PERSONAL_EXO_TITLE_REVIEW_205.json) identify the reviewed compact-inset correction, applied before candidate8 and verified by exact10/full208 exact4. The current Terraforming title is one line at14px. Both old and current PNGs are separately preserved under `tmp/local-personal-review/round205-exo-title`; no old evidence overwritten, no new generation/guard change and no blanket collateral acceptance inferred.014/015/publication/merge holds remain.


## Reviewer206 current focused-reader correction

The discovered-branches overview rule was overriding shared focus visibility. It now applies only outside technology-focus. Focus has one detailed board and one set of level headings; the newly exposed first card also has clear spacing below its complete Level I label. The existing illustrated discovery story now explicitly asserts hidden overview, one Terraforming inspection control and heading/card clearance; all seven shared capture/geometry/comparison helpers are unchanged.

[Current focus evidence](PERSONAL_FOCUS_REVIEW_206.json) replays the real four-player Experimental Prototypes/Exo-Alloy sequence through101 ordinary UI checkpoints on5209. Same-controller reload/reinspection at720/640 then passes original screen-fit/touch/overlap and2s capture guards, Upper/Lower/Return, full-card Enter/Escape and exact opener focus. No game move occurred during the reinspection. Current types0/0 and policy pass. Corrected640 upper/lower and720 upper PNGs have been visually inspected. No baseline references were refreshed or accepted; the prior208/208 result belongs to pre206 source. Current full exact is pending independent focused-view review;014/015/publication/merge holds remain.

## Reviewer207 corrected-focus verification

The scoped accepted correction hides the mini overview in shared discovered focused Technology, with34px additional first-card/connector clearance. Eight ordinary shared discovery variants cover March of Progress, Experimental Prototypes/Exo-Alloy, Dimensional Rift and Covert Arms in desktop and native4K projects; each also exercises1280×720/640 upper/lower/overview return. Generation8/8 in3.4m preceded independent exact8/8 in4.1m without update flags. All658 current frames pass original guards; exactly32 upper/lower compact frames changed and every other folder PNG remains byte-identical. Seven protected helpers and all timing/comparison limits are unchanged.

The current196-file freeze differs from the prior full freeze only in GameSurface CSS and the inline focused-board assertions. Types0/0 and policy PASS apply to that corrected source; unchanged model/rules/tooling/helpers retain323backend/3989assertions,65tooling and51guard PASS results. No unrelated full check was repeated. All101 cumulative reviewed inherited deltas match their chained source/reference hashes;13,298 remaining inherited images and2908 personal images retain preserved provenance. No failed Linux cohort or transformed PNG was adopted. Pre206 references, historical failures and full208 records remain preserved. The complete walkthrough index bytes were restored after the focused run.

Current exact log: `/Users/anicolao/projects/games/beyond/tmp/personal207-focus-exact.log`; final audit: `/Users/anicolao/projects/games/beyond/tmp/personal207-final-audit.json`. Persistent local review remains http://127.0.0.1:5209/; live Auth/Firestore/controller data were untouched. Android Destroyers/WISE limitations and older PR14/15 gates remain as documented above. Publication/015/merge remain held pending independent acceptance.

## Reviewer208 local acceptance and publication

Reviewer17:10 independently verified207 exact8/8,32-frame audit and all196 current hashes, alongside prior full208 and ordinary014 flow reviews.014 LOCAL ACCEPTANCE is granted; this is not Linux or hosted final acceptance. Publish feat/personal-technology stacked on feat/colonization exactfecea48f259f16253566c9d894dcf0986eb4efd9, then begin015 Unlock advanced research on a new branch. All Android Destroyers/WISE source limitations remain explicit. Preserve canonical data/identities/evidence and original guards. PR14/15 Linux/publisher failures remain separately open; no failed reference cohort adoption or merge.
