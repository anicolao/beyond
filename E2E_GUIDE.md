# Beyond the Sun — E2E guide

**Testing and delivery contract.** This guide is the plan of record for browser verification. Deliver the required gameplay tests, TestStepHelper, screenshot baselines, and application CI through the slices below.

Browser stories prove people can play the real game. Each story's actions, semantic assertions, screenshots, and generated walkthrough describe the same sequence. A final board image cannot prove the choices that led to it.

## Foundation

Use the production SvelteKit interface with isolated Firebase Auth and Firestore emulators. In remote play, each player has a separate authenticated browser context. Tabletop stories use exactly one browser context and one authenticated controller for every locally configured faction; no player contexts, phones, or companion devices participate. Use the pinned Nix environment for dependencies, browser execution, builds, and repository tooling once it is created.

Ordinary E2E journeys create rooms, join, configure, select factions, play, and finish through visible controls. Do not install ready-made state through URLs, injected page objects, direct reducer calls, mocked services, or direct Firestore gameplay writes. Emulator reset before a story is allowed. Read-only event checks may corroborate visible behavior and replay; they must not read future cards to choose a move.

Focused integration tests can replay a deliberately constructed history for rare effects, exhaustion, or conflict cases. Label those tests as integration coverage. They do not replace an illustrated journey showing how a real player reaches that behavior. A development gallery or animation lab is a review aid, not a substitute game implementation.

## Determinism and exact visual evidence

Fix seed, visible code, player names, initial clock where needed, and an explicit sequence of player decisions before running. Separate versioned random streams for setup and later effects prevent an unrelated shuffle from changing every future draw. Persist reveal results or sufficient versioned random inputs so reload never rerolls them.

Adopt Pantheon's strict visual contract:

- `maxDiffPixels: 0`, `threshold: 0`, test retries `0`. The exact comparator fully decodes/validates the reference. A byte-identical PNG encoding is then necessarily the same valid pixel image; different encodings still decode and compare every RGBA byte, dimension and channel. Malformed identical inputs must fail validation.
- Lossless PNGs, DPR 1, pinned Chromium/software rendering, bundled fonts, locale `en-CA`, timezone `America/Toronto`, and a fixed test origin.
- One browser worker for capture workloads. Additional player contexts remain bounded by the story's declared participants.
- A 2,000 ms deadline per interaction, navigation, or assertion. Readiness, font/art decoding, finite animation completion, clipping audit, screenshot capture, and comparison share one 2,000 ms capture deadline.
- No arbitrary sleeps, `waitForTimeout`, `networkidle`, retries, pixel masks, screenshot normalization, or relaxed comparison to hide nondeterminism.
- Story and infrastructure startup budgets are separate from individual operation deadlines. Longer complete games may need longer whole-story budgets; no operation inherits that allowance. Before opening the static test server, read-only emulator probes require an Auth configuration response and a Firestore permission denial for the unsigned reserved connection-document read. This verifies actual service/database/rules readiness rather than an open TCP port; it creates no users, games or fixtures. A missing service or unexpectedly permissive rule fails startup. Browser assertions and captures retain their own 2,000 ms limits.

Pin the actual browser image and architecture when the scaffold is built; do not copy a stale sibling version into a new lockfile. Keep reviewed macOS and Linux baselines separately. Linux CI and Linux baseline generation use the same immutable image and architecture. A runtime/image update needs reviewed fresh baselines and a complete comparison run.

Explicit candidate generation leaves a baseline file untouched when the captured PNG bytes are identical. Every frame still completes the same capture/readiness/layout deadline and is recorded as generation. Any byte or length difference is written; filesystem errors fail the run. This conserves shared filesystem blocks without normalizing images, accepting mismatches, or replacing the required independent exact-comparison run.

Capture finite motion only after it settles. Reduced-motion tests still prove the actual state transitions. Never substitute an animation lab state or skip rules effects for a screenshot.

## Viewport contract

| Project | Viewport | Required evidence |
| --- | --- | --- |
| Phone | 393 × 852 | Every core remote-play journey and readable focused components. |
| Desktop | 1440 × 1000 | Every core remote-play journey and both-board context. |
| Tabletop-size personal view | 3840 × 2160 | Core journeys at large resolution; does not prove shared control. |
| Phone landscape | 852 × 393 | Complete representative turn, inspection, recovery, and scoring. |
| Tablet | 820 × 1180 | Complete representative turn, board switching, and required choices. |
| Shared tabletop | 3840 × 2160 in one browser context | Direct local seating, every control on the display, and recovery without QR joining or personal devices. |

The gameplay shell fits without page scrolling or overlapping controls. Validate focused text, touch targets, safe areas, zoom controls, and tray content. Intentional board pan has explicit bounds and Fit recovery; it is not an excuse for clipped buttons or truncated inspectors. Rules and gallery pages intentionally scroll and need document-specific checks.

## One illustrated story per journey

Use this structure:

```text
tests/e2e/
  helpers/
    fixtures.ts
    test-step-helper.ts
  004-first-research/
    research.spec.ts
    research.integration.spec.ts
    README.md
    FIDELITY.md
    stories/<story>/README.md
    screenshots/<story>/<platform-and-viewport>/
```

The feature README indexes generated stories. Each test owns its output directory; parallel variants must never overwrite another walkthrough or image. Import `test` and `expect` from `helpers/fixtures`, not directly from Playwright. Every illustrated E2E story **must use `TestStepHelper` for every meaningful player-visible step**, including opening states, inspection, cancellation, observer views, recovery, and final results. This also applies to illustrated integration scenarios, whose injected setup must remain explicitly labelled.

Every meaningful step contains the named action, actor/viewpoint, exact visible assertions, readiness/layout checks, and a screenshot of that result. Capture the opening state, new decision surfaces, commitments, public consequences, and turn handoffs. Opening, reading, cancelling, and committing are distinct steps when they change what the player understands.

Generate walkthroughs only after the story passes. Include title, goal, setup/seed, participants, ordered captions, assertions, and linked full-resolution images. Remote-play stories show phone and desktop captures together; include a 4K personal-screen view where the story requires it. Declare required viewports per story and fail finalization if any are missing. Tabletop stories show the shared display's 4K captures throughout local setup and play; they do not require phone views or additional contexts. Captions must describe the image actually captured. Do not hand-maintain a separate narrative that drifts from the test.

Every changed feature also records human visual review in `FIDELITY.md`: reference the reviewed UX composition, captures, component scale, materials, legibility, interaction placement, and intentional differences. Exact equality with yesterday's screenshot does not establish fidelity to the design.

## Mandatory `TestStepHelper` contract

Implement `tests/e2e/helpers/test-step-helper.ts` and its shared fixture in slice 001, before accepting the first browser story. The helper is required infrastructure, not an optional convenience. It centralizes behavioral verification, capture guards, exact comparison, and the metadata used to generate walkthroughs. Tests must not maintain their own screenshot counters, image filenames, Markdown image links, capture routines, or alternative story writers.

Implement the following public API:

```ts
import type { Page, TestInfo } from '@playwright/test';

export interface Verification {
  spec: string;                    // Human-readable claim shown in the story.
  check: () => Promise<void>;       // Assertions proving that claim.
}

export interface StepView {
  page?: Page;                     // Defaults to the helper's page.
  player?: string;                 // Named viewpoint, e.g. 'Bora (observer)'.
  status?: 'synced' | 'offline' | 'reconnecting' | 'incompatible';
  document?: boolean;              // Scrolling rules/gallery page; default false.
}

export declare class TestStepHelper {
  constructor(page: Page, testInfo: TestInfo, title: string);
  step(
    id: string,
    description: string,
    verifications: readonly Verification[],
    view?: StepView,
  ): Promise<void>;
}
```

Perform the player action through the real UI immediately before `step()`. The opening-state step may follow navigation, and an observer step may follow the actor's committed action without another gameplay input. Each call documents one coherent visible result; do not hide several decisions inside a verification callback. Callbacks assert behavior and must not click controls, submit commands, or mutate state to make the assertion pass.

For each `step()`, the helper must:

1. Register the stable, unique kebab-case ID, caption, viewpoint, viewport/platform, and the test's shared sequence number. Reject duplicate IDs, empty captions, and empty verification arrays or labels.
2. Run each named verification inside a labelled Playwright step. A failed assertion fails the story; it cannot be caught and converted into documentation of a passing result.
3. Check the specified application connection status (`synced` by default) and step-specific readiness. Tests still assert the exact result of the preceding action; generic readiness cannot replace behavioral checks.
4. Under one shared 2,000 ms capture deadline, complete readiness, font and image decoding, finite-animation settling, layout/clipping checks, lossless capture, and exact baseline comparison. Individual verification callbacks retain the assertion deadline defined above.
5. Enforce the viewport/layout contract, including visible focused text, nonoverlapping controls, safe-area clearance, and touch targets. `document: true` selects document-specific scrolling checks; it does not disable layout auditing.
6. Compare every captured pixel with the reviewed baseline, using zero tolerance and no masking or normalization. Explicit baseline-generation mode writes candidate images and is reported as generation, never as a successful comparison.
7. Add the caption, viewpoint, verification labels, and image reference to the shared story record only after that step succeeds. On failure, retain available diagnostics and expected/actual/diff evidence without publishing a completed walkthrough.

The shared fixture owns one story record per test, shared by every helper and player view in that test. It validates declared participants, play mode, required viewports, and setup metadata, finalizes the ordered walkthrough only after the entire test and its cleanup pass, and verifies that every recorded image exists. Viewport runs own distinct captures and merge only matching stable step IDs into the documented side-by-side presentation. Missing required viewport evidence must fail finalization rather than silently omit a screen. A tabletop story requires the shared-display viewport and a single controller context; the fixture must not demand remote phone/player views for that mode.

For example, after the story has joined Ada and Bora through already documented UI steps, the lobby readiness interaction uses this pattern. The accessible names below define the intended UI contract for that interaction:

```ts
import { test, expect } from '../helpers/fixtures';
import { TestStepHelper } from '../helpers/test-step-helper';

// Inside the story: ada and bora are isolated authenticated pages.
const steps = new TestStepHelper(ada, testInfo, 'Ready a two-player table');

await bora.getByRole('button', { name: 'Ready', exact: true }).click();
await steps.step('bora-ready', 'Bora is ready to begin', [
  {
    spec: 'Bora sees readiness acknowledged and can withdraw it.',
    check: async () => {
      await expect(bora.getByRole('button', {
        name: 'Not ready', exact: true,
      })).toBeEnabled();
    },
  },
], { page: bora, player: 'Bora' });

await steps.step('ada-sees-bora-ready', 'Ada can begin with both players ready', [
  {
    spec: 'The host can begin after both configured seats are ready.',
    check: async () => {
      // Ada's own Ready action was photographed earlier in this story.
      await expect(ada.getByRole('button', {
        name: 'Begin', exact: true,
      })).toBeEnabled();
    },
  },
], { player: 'Ada (host)' });
```

The helper must not create seats, inject game state, choose moves, accept dialogs, retry failures, or loosen capture settings. Direct screenshot or walkthrough-generation calls outside the shared infrastructure are prohibited. Policy hooks and required CI must reject helper bypasses and weakened guards; changes to the helper or its policy checks require focused regression coverage proving that violations fail. A story that bypasses this contract is incomplete even if its gameplay assertions pass.

## Example storyboard: discover a technology

Use a preselected seed and a written legal play sequence. Substitute reviewed card identities and values when manifests exist; do not invent a fixture card to simplify the story.

| Step | Required visible proof |
| --- | --- |
| 1 | Open arrival, choose Play, create a two-player table, and show the code and host seat. |
| 2 | A second context joins by that code; show settings, both seats, and readiness. |
| 3 | Begin and select legal factions; show exact seeded setup, active player, and both clients' public agreement. |
| 4 | Select Level I research; show eligible slots, cost, and permanent cube destination. |
| 5 | Inspect a candidate and return; prove inspection adds no event and preserves the plan. |
| 6 | Commit research; show the research marker, remaining Population, immediate bonus, and observer view. |
| 7 | Choose production; show exact yield by column or Ore symbols and the next faction's active controls. |
| 8 | Play each intervening turn through documented controls until Level II research is legal and affordable. |
| 9 | Select an undiscovered eligible slot; show its prerequisite path and full payment before commitment. |
| 10 | Commit; show the revealed Event and every resulting decision in the required order. |
| 11 | Select a permitted research type if needed; show both revealed matching candidates and the observer's public view. |
| 12 | Inspect each option and choose; show the chosen shared card, committed cube, bonus, and correct resumed phase. |
| 13 | Reload during a pending choice in a separate recovery variant; show the same reveal and exactly one final application. |
| 14 | Demonstrate another faction can research the discovered technology, but cannot use its action before doing so. |

No helper may silently accept whichever dialog appears or fast-forward unrecorded turns. A long legal journey is acceptable; shortened integration setup must be labelled honestly.

## Multiplayer, information, and recovery

For each consequential remote-play action, assert both the acting client's exact result and the observer's public result. Include observer screenshots where comprehension matters. An observer's inspector and history reading position survive unrelated turns. Inactive remote identities cannot send ordinary active-turn commands. Tabletop stories document the acting faction and any seat-facing view on the same display, with TestStepHelper owning the shared sequence; they must not introduce separate player browsers to satisfy an observer requirement.

Reveal candidates and personal technologies are public under the base rules. Unrevealed events, future deck contents, and future random outcomes must be absent from rendered text, accessible names, tooltips, and component props delivered to a public presentation. This verifies ordinary presentation boundaries, not cryptographic secrecy from trusted clients.

Recovery stories must cover disconnect before commit, after acceptance but before acknowledgement, during a mandatory choice, and during animation. Prove unchanged command identity prevents duplicate costs, effects, and visual flights. Compare replay from scratch with reconnect/cached-prefix state and prove all clients converge on revision, pending choice, resources, and result.

Conflict tests cover simultaneous claims on a seat, stale action plans, two submissions for one revision, duplicate command IDs, unauthorized configuration, incompatible manifests, and malformed events. Use emulator policy tests for immutable attributed writes as well as pure rules tests for legality. Firestore shape checks alone do not validate game rules.

Shared-table stories explicitly prove the single controller's authorized role and attributed acting faction for every local seat. Setup adds, names, edits, and removes players at physical positions through display controls, selects Player 1 and clockwise order, configures factions/achievements, and begins without any remote readiness barrier. Assert that tabletop setup contains no QR, invitation code, scan instruction, companion-device link, or per-player sign-in.

Carry the same single context through required event responses, personal-technology inspection, complete play, scoring, and rematch. Reload during setup and a pending decision, proving names, physical seats, controller authority, and the exact choice restore without a second login. Policy/integration coverage must reject remote seat-claim commands against tabletop rooms. Do not create additional player identities or use another device as a prerequisite for any tabletop step.

## Delivery and story map

Each numbered slice delivers its rules, accessible production UI, emulator-backed synchronization, illustrated E2E evidence, and recovery behavior together. Keep these identifiers stable throughout implementation.

| Slice | Browser-visible outcome |
| --- | --- |
| 001 — Shell and visual foundation | Required `TestStepHelper` and shared fixture with capture/policy guards; illustrated arrival and Learn; direct physical-position joining for 2–4 local players, editing/leaving/Player 1 on the actual table, immutable commands, and recovery across built PR/production paths sharing one game. Multiple mode-specific E2E stories per commit are allowed and required where flows differ. Live preview posts its link on the PR independently of E2E. Review visual composition before accepting baselines. |
| 001a — Card collection review | Arrival-accessible complete100-design/100-copy base gallery, independent manifest/quantity equality, all-page reachability, source-reviewed Technology/Event/System/Achievement faces using shared production renderers; clearly labelled visual fixtures, filtering/search, internal-scroll inspection, persistent navigation, focus containment/restoration, and player-count restrictions on phone, compact desktop, desktop and 4K. Complete local visual review before final candidate generation and independent exact comparison. |
| 002 — Rooms and seating | Remote create/join/code/QR, readiness, owner settings, full/missing room recovery, retained seats and collision handling; keep remote joining separate from tabletop local seats. |
| 003 — Seeded Basic setup | Two-, three-, and four-player boards, overlays, faction uniqueness, starting resources, achievement slots, first player, and conserved cubes/discs. |
| 004 — First research turn | Legal Basic Level I pawn movement/occupancy, permanent cubes independent of occupancy, all four source-reviewed immediate bonuses, exact production/trade and clockwise handoff; desktop/phone and one-controller shared display, reload and keyboard. |
| 005 — Technology discovery | Prerequisites, event resolution, public candidates, type choice, once-only immediate bonuses, guild unlocking, research ownership and persisted pending choices. |
| 006 — Shared discoveries | Rival research, once-only personal bonuses, card actions and occupied spaces. |
| 007–009 — Economy and automation | Changed production tracks, full printed-rate trading, overflow, automation and scoring. |
| 010–012 — Fleets and control | Build/upgrade, simultaneous jumps, ties, outposts and ordered control bonuses. |
| 013 onward | Colonization, remaining content, achievements, complete games, Advanced factions, recovery and release review in the detailed plan sequence. |

Recovery and accessibility start in the first slice; their named slices consolidate coverage rather than postpone them. Core interactions are not complete until they work in the personal and shared-table projections.

[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) breaks these broad coverage categories into commit-sized primary E2E stories. Every implementation commit includes one such user journey and its complete illustrated proof.

At least one full two-player game, one full three-player game, and one full four-player game must run through ordinary controls without state injection, automated strategic move selection, or skipped turns. Exact endgame sequencing must also have deterministic fixtures triggering at every seat position. The shared-table release story configures and finishes a full game in one browser context, using only the display from initial naming through rematch.

## Complementary rules and data checks

Use deterministic unit/model tests where exhaustive browser play would obscure the rule being tested. Verify cube conservation across Supply, Population, research, fleets, and removed-from-game effects; disc identity and placement; random-stream reproducibility; legal phase transitions; control tie tables; and scoring arithmetic.

Check every manifest's IDs, counts, deck membership, prerequisites, board edges, overlays, mat tracks, effect definitions, and source references. Expected outcomes must be independently written, not computed by the reducer under test. Unsupported or unreviewed effects block complete-game release.

## Verification and publication

The scaffold must provide documented commands for frozen installation, static/type checks, rules tests, Firestore policy tests, E2E comparison, explicit snapshot generation, production build, and one complete verification entry point. Those commands must run inside the locked Nix shell and be documented only when implemented.

Follow Pantheon's fast policy hooks and required full CI: local hooks check the relevant staged/pushed trees for weakened testing guards; CI runs complete static, rules, security, browser, and build verification. Keep traces and expected/actual/diff evidence on failure. Baseline generation is a separate explicit workflow and never counts as a comparison pass.

When deployment is implemented, verify both root production and repository/PR base paths, retain previous previews, and prevent fork code from receiving deployment credentials. Application provisioning and deployment belong to the implementation slices.

Preview publication must run independently of E2E merge gates. Every preview deploys that revision's production Firestore rules before its client, uses hosted anonymous Auth and Firestore, publishes a revision-linked URL in the PR, and runs a hosted browser smoke check. A slow or failing E2E comparison must not prevent manual testing. Require both final verification and a working hosted preview before merge.

A change is ready for review when its legal player journey passes, every meaningful decision/result has accurate illustrated evidence, changed captures have been visually reviewed against the UX, and the complete comparison suite passes without relaxed guards. Commit source, tests, generated walkthroughs, fidelity notes, and reviewed platform baselines together.

## Durable production slices

Every illustrated step must demonstrate the intended production flow. Do not build temporary setup/save/result pages merely to obtain an end-to-end pass. A logical commit delivers one coherent user goal through as many stories as needed for desktop web PvP, phone web PvP, and tabletop. Tabletop joining occurs at physical positions on the actual table surface, in one controller context.

PR and production clients share canonical `games/<id>` data and deployment-independent identity/retention. Recovery E2E builds both clients and uses actual UI navigation between their paths on one origin against the same emulator store. Change a seat through one client and verify the other replays it. No game injection, database copying, or test-only switch is allowed. Hosted preview publication deploys this revision's compatible rules and posts its live URL to the PR without waiting for E2E.

Compact shared-display regression stories supplement the complete desktop/4K setup stories at their actual supported viewport (for example 1280 × 720). They configure the same real table through ordinary controls and illustrate overview/focus, branch navigation, full-card inspection and keyboard return. Declare their viewport explicitly; these supplementary captures do not replace the required full 4K shared-table journeys or introduce another controller.

A responsive-entry review may resize the same browser after real UI setup, with a separate illustrated step before and after each resize. Label every image with its actual pixel dimensions, preserve the same controller/game, and return to the original shared-display viewport before table interaction. This demonstrates responsive entry controls; it does not demonstrate phone PvP or add a companion device to tabletop play.

Run `bun run test:capture` for focused capture-guard regressions. Its synthetic DOM fixtures must pass for separate controls and reject actual overlap at all eight seat angles, viewport clipping, and clipped text. These are infrastructure tests rather than gameplay stories. They run before both Linux candidate generation and the independent comparison gate; they do not change screenshot tolerances or deadlines.


The gallery's bounded inspector uses a named, keyboard-reachable scroll region for its card and source notes, with Close and Previous/Next outside that scroll area. Capture auditing permits intentional vertical content scrolling only inside such regions. Focused controls and text, horizontal clipping, hidden overflow, real overlap and offscreen inspector chrome remain errors. Focused guard regressions cover these boundaries, including empty offscreen document hit regions; no screenshot tolerance, masking or deadline changes accompany this support.

Local independent browser runs may use separate already-installed emulator processes on configured loopback ports via PUBLIC_AUTH_EMULATOR_PORT and PUBLIC_FIRESTORE_EMULATOR_PORT. Defaults remain9297/8197. Each run starts with fresh ephemeral test data while the persistent reviewer emulator and its games remain intact. Preview and production clients within the run still share one canonical demo project/store; hosted storage is unchanged. Readiness probes use the same configured endpoints. Never clear the reviewer database to resolve deterministic story-code collisions.

The complete gallery story traverses all100 source-verified identities and quantities, verifies original-art completeness and inspects dense full-marker faces in75 illustrated steps per viewport. Candidate generation and independent comparison are separate runs; both platforms must be independently reviewed.

Milestone004 uses `004-first-research/journey.ts` through the required shared fixture and TestStepHelper. Seventeen viewport variants demonstrate ordinary2/3/4-player remote and shared first rounds, including compact/cardinal/corner views, all four Level I bonuses, exact resources, three executed exchanges, Supply overflow, pending-choice reload, separate public observers and keyboard focus return. The existing31 journeys remain in the full regression. Every meaningful setup input, choice and result has a named illustrated step. Native captures are visually inspected before an independent zero-tolerance comparison run.

Persistent reviewer Auth imports can invalidate previously cached anonymous
credentials even when the same account IDs and Firestore history survive. Keep
review services separate from test resets, and follow
[retained-controller recovery](docs/REVIEW_SESSION_RECOVERY.md) before a planned
restart. A new anonymous controller's fresh UI replay is not proof of recovery
of the original session. Never repair a test or review by assigning an existing
game to a replacement identity or weakening its owner rules.

Milestone005 uses `005-technology-discovery/journey.ts`, the shared fixture and
required TestStepHelper for14 illustrated variants: independent remote desktop
and phone controllers, shared cardinal and corner seats, and native4K. Ordinary
UI preparation reaches two-prerequisite type choice, March responders and repeat
research, persisted Prototype rolls/two rerolls, mandatory and optional Exo-Alloy
bonuses, a revealed Rift attachment, and two distinct ships' simultaneous jumps
and real control bonuses. Every input, public result, reload, full-face inspection,
focus return and handoff is illustrated. Fixed initial entropy selects a declared
scenario; ordinary journeys neither inject history nor inspect concealed decks.
Explicitly labelled backend integration cases separately exercise exhausted
resources, all ten LevelII Events, every printed LevelII bonus queue and tariff
positions. They supplement rather than replace those ordinary journeys.

Discovery readiness includes completion of its persisted preparation and mandatory
automatic continuations. The production LevelII planner exposes `aria-busy` while
its preparation or save remains active; the page's backend status also reflects
an in-flight save. Illustrated steps assert that real settled state before the
unchanged capture helper photographs and compares it. No sleeps, comparison
masks, retries or larger operation/capture deadlines are introduced.

The backend test command performs isolated emulator readiness before starting Bun. It first verifies an unauthenticated reserved-document read is denied, then reads back the emulator’s installed rules. Exact single-file source-byte equality with no compiler errors reuses the CLI’s compilation; otherwise it uploads the exact current source and requires matching source readback. A final unauthenticated read must still be denied. Every request shares one10,000ms startup deadline. This avoids compiling identical CLI-loaded rules twice while retaining source identity and fail-closed denial checks. Every test and hook still runs under its unchanged5,000ms budget. Each suite supplies its exact source and receives fresh SDK contexts; identical rules compilation is reused only after exact readback from the same emulator/project, including across fresh Bun processes. Changed source or endpoint always compiles again; readiness submits no gameplay commands or identity changes. Compiler, readback or denial failures block startup. Teardown preserves an initialization failure rather than masking it with an undefined-environment exception.


Pinned Linux browser jobs use their existing `--ipc=host` allocation for Chromium’s memory-backed shared surfaces. Startup verifies at least256MiB in `/dev/shm` and removes only Playwright’s small-container `--disable-dev-shm-usage` workaround. All pinned rendering flags, browser/image versions, native viewport pixels, comparisons, assertions and shared2,000ms capture deadlines remain unchanged. Any pixel change fails exact comparison; timing failures never authorize reference refreshes. Local macOS launch behavior is unchanged.


Hosted rules deployment verifies the named `cloud.firestore` release and its immutable ruleset source. If its complete single-file source matches this revision's `firestore.rules` filename and content exactly, deployment is an identity-verified no-op: it performs no compilation or release write, then reads the same release and complete source again. A changed release identity or source blocks publication. Any source difference requires the current-source compiler gate, exact upload/source readback and release update/readback before the client can publish. Matching an arbitrary historical ruleset never qualifies for reuse. This does not change shared canonical game storage or gate previews on E2E.

Backend suites run in fresh Bun processes after the single exact-source readiness check. The runner discovers every nested backend test file and continues through failures before returning a failed aggregate. Frozen deployed-protocol compatibility runs last, after the full current-policy load; moving it earlier cannot hide an order-dependent failure. Each complete protocol history, assertion and original5,000ms test/hook deadline stays intact. No emulator data, identities or rules are reset between suites. This releases process-owned SDK clients between suites while retaining the same isolated emulator and canonical policy.
