# Beyond the Sun

Lead a faction beyond Earth. Help shape humanity's shared technology tree, build a sustainable economy, and compete for influence among the stars.

This repository defines a browser implementation of **Beyond the Sun**, designed by Dennis K. Chan and published by Rio Grande Games. Two to four players research technologies, develop production, build and move fleets, colonize systems, and claim achievements. The winner has the most victory points after the final round.

**Status: gathering, complete card gallery, Basic setup and Level I/II research implemented.** Browse all 100 source-reviewed card designs / 100 physical copies, gather on a shared table or use separate remote identities, and Begin exact 2/3/4-player Basic setup. Play legal preparation, production and trades, then discover a Level II technology through its real Event, public type/candidate choice and once-only bonus. Pending decisions and recovery share canonical history. Milestone 005 passes 62 local exact journeys; Linux/hosted final gates remain pending. Later gameplay stays in the implementation plan.

## Project documents

| Document | Purpose |
| --- | --- |
| [VISION.md](VISION.md) | Player experience, scope, principles, and success criteria. |
| [RULES_SUMMARY.md](RULES_SUMMARY.md) | Rules authority, turn structure, important exceptions, and content verification requirements. |
| [UX_DESIGN.md](UX_DESIGN.md) | Original visual direction, screen compositions, interactions, and shared-table play. |
| [E2E_GUIDE.md](E2E_GUIDE.md) | Real multiplayer journeys, exact screenshots, illustrated evidence, and delivery sequence. |
| [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | Commit-sized tracer stories, hosted preview contract, and milestone acceptance. |

Read the vision first, then the rules and UX together. The E2E guide defines how each required behavior is demonstrated. [AGENTS.md](AGENTS.md) records project instructions, and [PROMPTS.md](PROMPTS.md) records direct requests and labelled reviewer instructions; [meta-prompts.md](meta-prompts.md) holds the supervising human conversation.

## Scope

- Complete two-, three-, and four-player base-game play using the second-printing English rules and official clarifications.
- Basic faction mats first, followed by all Advanced faction mats and their innovations before declaring base-game coverage complete.
- Shared technology discovery and personal research, all four technology levels, events and guilds, production and resource trades, automation, shipbuilding, jumps, control, colonization, achievements, and complete scoring.
- Remote invitation rooms with anonymous sign-in, named seats, a visible five-letter code, invitation links, and QR joining.
- Personal-screen remote play on phone, tablet, and desktop; a self-contained shared tabletop where players add names, configure seats, and play entirely on one display. Tabletop mode has no QR joining, companion devices, or per-player sign-in.
- Reconnect, deterministic replay, readable history, and undo within an explicitly defined information boundary.
- A production component gallery, original artwork, keyboard and touch controls, reduced motion, and readable rules throughout play.

The initial default is Basic factions with ordinary technology discovery. The recommended introductory achievement set is a selectable preset. The Expert Technology Tableau variant, Leaders of the New Dawn expansion, solo play, bots, matchmaking, chat, rankings, and server-authoritative anti-cheat are deferred.

## Style and technical direction

[Pantheon](https://github.com/anicolao/pantheon) is the primary experience reference: an atmospheric illustrated table, tactile components, direct actions, full component inspection, and evidence that shows every meaningful player decision. [Istanbul](https://github.com/anicolao/istanbul) informs spatial board interaction, player mats, shared-display control, and undo boundaries. [RoboRally](https://github.com/anicolao/roborally) informs versioned content, deterministic resolution, multiplayer recovery, and complete-game browser stories.

The technical foundation consists of:

- SvelteKit, Svelte 5, TypeScript, Bun, Vite, and the static adapter.
- Firebase anonymous Authentication and Cloud Firestore, with an append-only room event stream.
- Pure deterministic rules, versioned component manifests and seeded randomness, and separate personal/shared-display projections of one game state.
- Bun tests for rules and replay, Firebase emulators for authentication and write-policy checks, and Playwright for real multi-browser journeys.
- A pinned Nix development environment, exact screenshot comparisons, generated walkthroughs, and retained GitHub Pages PR previews with automatically posted live-link comments.

This is a trusted-client design. Authentication and Firestore rules enforce access boundaries, attribution, immutability, and permitted write shapes. They do not establish server-side rules authority or conceal future seeded draws from a modified client. The ordinary UI must conceal unrevealed information. No competitive-security claim is intended.

## State and synchronization contract

Each room pins a rules edition, content manifest, reducer version, and random-stream version. Immutable events record setup and accepted decisions; replay derives resources, pending choices, turn ownership, and the result. Animation never determines game state.

Commands carry a stable identity and expected revision. A transaction or equivalent atomic append mechanism must accept at most one successor to a revision and make resubmission idempotent. A pending mandatory choice survives reload and blocks unrelated actions. Rejected or incompatible history produces an explicit recovery state rather than a partially applied game. Undo appends an attributed event and preserves the original history.

Remote rooms accept gameplay from the active seat's identity, with explicitly assigned responders for out-of-turn effects. A tabletop room uses one authenticated table controller for all locally configured faction seats; those seats require no individual identities or remote joining. Events attribute both the controller and the acting faction. These write paths require separate policy tests, and remote seat-claim commands cannot join a tabletop room.

The base game has no player-secret information. Research choices, faction resources, and personal technologies are public; only unrevealed cards, events, and future deck order remain hidden from everyone. Tabletop setup, inspection, choices, and recovery all run on the shared display.

## Delivery approach

Build small, complete browser-visible slices in the sequence in [E2E_GUIDE.md](E2E_GUIDE.md#delivery-and-story-map). A slice includes its rules, interface, synchronization, recovery behavior, accessible interaction, and illustrated browser proof. An untested backend or a static mockup alone is not a completed gameplay slice.

Implementation starts with the pinned environment and static application shell, followed by rooms and reviewed setup manifests. Document development and verification commands as their scripts are implemented. Never copy sibling credentials.

The [illustrated walkthroughs](tests/e2e/001-foundation/README.md) demonstrate arrival, physical-seat joining and configuration, and recovery between two built deployment paths. Tabletop stories use desktop and 4K shared displays; arrival also covers phone. The [remote gathering stories](tests/e2e/002-remote-rooms/README.md) cover separate identities, missing/full room recovery, readiness invalidation, keyboard dialogs and shared canonical persistence. [Basic setup](tests/e2e/003-basic-setup/README.md), [first research](tests/e2e/004-first-research/README.md), and [technology discovery](tests/e2e/005-technology-discovery/README.md) provide the ordinary gameplay walkthroughs, including remote phone/desktop and seat-facing shared 4K.

## Card collection

Open `/gallery/` from the Card gallery link on arrival. Browse the complete second-printing base inventory: 100 designs and 100 physical copies (46 Technology, 20 Event, 24 System, 10 Achievement). Filter/search all cards, page through the collection, compare clean faces with labelled example markers, and change player count to review restricted claim slots. Inspection keeps navigation reachable while rules/source details scroll internally; Escape restores focus. This reference collection uses the reusable production card renderer. The collection describes rules without dispatching gameplay effects; markers never enter game state. All100 designs have distinct original illustrations with recorded provenance. See the [inventory audit and source gaps](docs/content/CARD_INVENTORY.md).

See the [illustrated gallery story](tests/e2e/001a-card-gallery/README.md), [fidelity review](tests/e2e/001a-card-gallery/FIDELITY.md), and [reviewed card definitions](src/lib/cards/README.md). Local visual iteration precedes final baseline generation and PR validation, as recorded in the implementation plan.

## Run and verify

Use the locked Nix shell:

```sh
nix develop --command bun install --frozen-lockfile
nix develop --command bun run emulators
```

In another terminal, run `PUBLIC_FIREBASE_EMULATORS=true nix develop --command bun run dev` and open `http://127.0.0.1:5197/`. No production credentials are needed for emulator play.

```sh
nix develop --command bunx playwright install chromium
nix develop --command bun run verify
```

`verify` runs source-policy checks, policy regression tests, static/type checks, Firestore rules tests, and the illustrated E2E comparison against real PR and production builds served on one origin. For intentional capture changes, run `nix develop --command bun run test:e2e:update`, review the images, then rerun comparison. CI uses a pinned ARM64 Playwright Linux image; macOS has separate reviewed baselines.

## Hosted PR previews

Each same-repository PR gets `https://anicolao.github.io/beyond/pr<NUMBER>/` with manual steps in its description and an automatically posted live-link comment naming the deployed SHA. Preview publishing runs independently of E2E, deploys the revision's Firestore rules and Auth configuration first, and checks real physical-seat joining and reload against the hosted database. Merge verification runs in parallel.

Firebase project `beyond-20261018` has anonymous Auth and a production Firestore database in `northamerica-northeast2`. Production and every PR use the same `games/<id>` documents and immutable event stream. Recovery options switches deployment URLs without changing the game or controller identity. Only E2E uses a separate emulator database. Deployment credentials and client config are repository secrets; only public browser config enters the bundle. See the [preview contract](IMPLEMENTATION_PLAN.md#preview-first-verification-in-parallel) for deployment and compatibility requirements.

## Rules and visual assets

The authority is the publisher's [second-printing combined rulebook and setup sheets](https://www.riograndegames.com/wp-content/uploads/2020/08/Beyond-the-Sun-2nd-Print-Rules-Combined.pdf), with [official errata](https://www.riograndegames.com/games/beyond-the-sun/). The summary records mechanics and implementation obligations; the complete base-card inventory and Basic setup manifests have source review. The [inventory audit](docs/content/CARD_INVENTORY.md) retains the unresolved physical second-print WISE name/verbatim-wording limitation; Advanced faction implementation remains a later increment.

Use original illustrations, component frames, and interface artwork with recorded provenance. Publisher PDFs are rules references, not image atlases for the application. The project is an unofficial implementation; no affiliation or asset permission is implied. Original project material is licensed under [GNU GPL version 3 only](LICENSE). Publisher material remains the property of its respective rights holders.

## Prompt history and checks

Follow the append-only routing in [AGENTS.md](AGENTS.md): direct human requests and labelled reviewer delegations belong in [PROMPTS.md](PROMPTS.md); supervising human requests belong in [meta-prompts.md](meta-prompts.md). Each numbered heading has a 2–3 word summary. Multiple commits under one request use an explicit continuation record rather than duplicating a prompt.

Install the versioned commit hook and run its regression checks with Node.js:

```sh
git config core.hooksPath .githooks
node --test scripts/check-prompts.test.mjs
node scripts/check-prompts.mjs
```

The checker reads the staged index; stage the prompt together with its related changes before running it. Pull-request CI also checks append-only history against the PR base. These checks enforce log structure and preservation; the author remains responsible for recording the actual request accurately.

## License

Copyright (C) 2026 Alex Nicolaou. Licensed under the GNU General Public License, version 3 only (SPDX: `GPL-3.0-only`). See [LICENSE](LICENSE).

The shared production card renderer and complete source inventory are reviewed in [the card correction record](tests/e2e/001a-card-gallery/FIDELITY.md). The WISE physical second-print name/verbatim-wording limitation remains explicit.005 stays held; final correction acceptance requires pinned Linux and matching hosted revision.

## First research turn

After ordinary Basic setup, play the four public Level I technologies with permanent Population payment, once-only immediate bonuses and explicit ship selection where required. Choose Growth, Ore or Trade, execute the three printed exchanges, and hand off automatically. Pending production/trading and public research survive reload. Remote identities and the single-controller shared table use the same canonical history. Discovery, movement and colonization remain later milestones. See the [illustrated first-round stories](tests/e2e/004-first-research/README.md).
