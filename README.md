# Beyond the Sun

Lead a faction beyond Earth. Help shape humanity's shared technology tree, build a sustainable economy, and compete for influence among the stars.

This repository defines a browser implementation of **Beyond the Sun**, designed by Dennis K. Chan and published by Rio Grande Games. Two to four players research technologies, develop production, build and move fleets, colonize systems, and claim achievements. The winner has the most victory points after the final round.

**Status: documentation phase.** The documents below are the plan of record for implementation. The repository includes the illustrated UX design, rules and testing contracts, prompt-history policy, and GPLv3 license. Gameplay, application dependencies, Firebase resources, deployments, and browser tests have not been implemented.

## Project documents

| Document | Purpose |
| --- | --- |
| [VISION.md](VISION.md) | Player experience, scope, principles, and success criteria. |
| [RULES_SUMMARY.md](RULES_SUMMARY.md) | Rules authority, turn structure, important exceptions, and content verification requirements. |
| [UX_DESIGN.md](UX_DESIGN.md) | Original visual direction, screen compositions, interactions, and shared-table play. |
| [E2E_GUIDE.md](E2E_GUIDE.md) | Real multiplayer journeys, exact screenshots, illustrated evidence, and delivery sequence. |

Read the vision first, then the rules and UX together. The E2E guide defines how each required behavior is demonstrated. [AGENTS.md](AGENTS.md) records project instructions, and [PROMPTS.md](PROMPTS.md) preserves the user requests verbatim.

## Scope

- Complete two-, three-, and four-player base-game play using the second-printing English rules and official clarifications.
- Basic faction mats first, followed by all Advanced faction mats and their innovations before declaring base-game coverage complete.
- Shared technology discovery and personal research, all four technology levels, events and guilds, production and resource trades, automation, shipbuilding, jumps, control, colonization, achievements, and complete scoring.
- Private invitation rooms with anonymous sign-in, named seats, a visible five-letter code, invitation links, and QR joining.
- Personal-screen play on phone, tablet, and desktop; a dedicated shared tabletop that owns public play and supports physical seating.
- Reconnect, deterministic replay, readable history, and undo within an explicitly defined information boundary.
- A production component gallery, original artwork, keyboard and touch controls, reduced motion, and readable rules throughout play.

The initial default is Basic factions with ordinary technology discovery. The recommended introductory achievement set is a selectable preset. The Expert Technology Tableau variant, Leaders of the New Dawn expansion, solo play, bots, matchmaking, chat, rankings, and server-authoritative anti-cheat are deferred.

## Style and technical direction

[Pantheon](https://github.com/anicolao/pantheon) is the primary experience reference: an atmospheric illustrated table, tactile components, direct actions, full component inspection, and evidence that shows every meaningful player decision. [Istanbul](https://github.com/anicolao/istanbul) informs spatial board interaction, player mats, shared-display control, and undo boundaries. [RoboRally](https://github.com/anicolao/roborally) informs versioned content, deterministic resolution, multiplayer recovery, and complete-game browser stories.

The technical foundation consists of:

- SvelteKit, Svelte 5, TypeScript, Bun, Vite, and the static adapter.
- Firebase anonymous Authentication and Cloud Firestore, with an append-only room event stream.
- Pure deterministic rules, versioned component manifests and seeded randomness, and separate personal/shared-display projections of one game state.
- Vitest for rules and replay, Firebase emulators for authentication and write-policy checks, and Playwright for real multi-browser journeys.
- A pinned Nix development environment, exact screenshot comparisons, generated walkthroughs, and retained GitHub Pages PR previews.

This is a trusted-client design. Authentication and Firestore rules enforce access boundaries, attribution, immutability, and permitted write shapes. They do not establish server-side rules authority or conceal future seeded draws from a modified client. The ordinary UI must conceal unrevealed information. No competitive-security claim is intended.

## State and synchronization contract

Each room pins a rules edition, content manifest, reducer version, and random-stream version. Immutable events record setup and accepted decisions; replay derives resources, pending choices, turn ownership, and the result. Animation never determines game state.

Commands carry a stable identity and expected revision. A transaction or equivalent atomic append mechanism must accept at most one successor to a revision and make resubmission idempotent. A pending mandatory choice survives reload and blocks unrelated actions. Rejected or incompatible history produces an explicit recovery state rather than a partially applied game. Undo appends an attributed event and preserves the original history.

Personal rooms accept gameplay from the active seat's identity, with explicitly assigned responders for out-of-turn effects. Shared-table rooms additionally authorize their table controller to operate public decisions for named seats; both the operator and acting faction remain attributable. These write paths require separate policy tests.

## Delivery approach

Build small, complete browser-visible slices in the sequence in [E2E_GUIDE.md](E2E_GUIDE.md#delivery-and-story-map). A slice includes its rules, interface, synchronization, recovery behavior, accessible interaction, and illustrated browser proof. An untested backend or a static mockup alone is not a completed gameplay slice.

Implementation starts with the pinned environment and static application shell, followed by rooms and reviewed setup manifests. Document development and verification commands as their scripts are implemented. Never copy sibling credentials.

## Rules and visual assets

The authority is the publisher's [second-printing combined rulebook and setup sheets](https://www.riograndegames.com/wp-content/uploads/2020/08/Beyond-the-Sun-2nd-Print-Rules-Combined.pdf), with [official errata](https://www.riograndegames.com/games/beyond-the-sun/). The summary records mechanics and implementation obligations; the complete card and faction manifests still need transcription and review.

Use original illustrations, component frames, and interface artwork with recorded provenance. Publisher PDFs are rules references, not image atlases for the application. The project is an unofficial implementation; no affiliation or asset permission is implied. Original project material is licensed under [GNU GPL version 3 only](LICENSE). Publisher material remains the property of its respective rights holders.

## Prompt history and checks

Record every user request verbatim in [PROMPTS.md](PROMPTS.md), following the append-only rules in [AGENTS.md](AGENTS.md). Each numbered heading has a 2–3 word summary. Multiple commits under one request use an explicit continuation record rather than duplicating a prompt.

Install the versioned commit hook and run its regression checks with Node.js:

```sh
git config core.hooksPath .githooks
node --test scripts/check-prompts.test.mjs
node scripts/check-prompts.mjs
```

The checker reads the staged index; stage the prompt together with its related changes before running it. Pull-request CI also checks append-only history against the PR base. These checks enforce log structure and preservation; the author remains responsible for recording the actual request accurately.

## License

Copyright (C) 2026 Alex Nicolaou. Licensed under the GNU General Public License, version 3 only (SPDX: `GPL-3.0-only`). See [LICENSE](LICENSE).
