# Remote gathering visual and functional review

References: [arrival](../../../docs/ux/concepts/01-arrival.png), [gathering](../../../docs/ux/concepts/02-gather.png) and [UX_DESIGN.md](../../../UX_DESIGN.md). The physical table, instrument hierarchy and portrait composition guide the implementation; generated gameplay pieces and faction choices do not supply rules.

## Composition and independent review

Reviewer round23 accepted the inspected desktop/phone navigation, standing player objects, central illuminated invitation, secondary setup plaque, stacked portrait rows, empty host setup, long-name phone and name/setup dialogs. Local acceptance was restored at reviewer checkpoint26 after full 4K navigation, corrected recovery and exact regression review. See the final acceptance record below.

Desktop now composes semantic graphite player readers along the far edge of an engraved table, a substantial teal-lit invitation instrument containing the real public code and QR, and a smaller angled setup plaque. Portrait stacks compact player rows above the same invitation and setup objects. Initial seals identify people; no faction selection, dice, decorative gameplay ships or invented starting pieces appear. Names and configuration use bounded ivory instruments with keyboard focus containment and Escape restoration.

`ModeInstrument.svelte` renders all three production choices with the same brass rim, recessed graphite face and scale. Native Shared table button and remote Create/Join links retain explicit labels and display/identity explanations. Desktop places them across the illustrated table inlay; portrait stacks them. Full 3840×2160 inspection confirms balanced navigation and visible keyboard focus. Remote entry text and controls have an explicit large-display scale.

A compact desktop long-name overlap was corrected during local inspection. The unchanged capture guard subsequently caught a phone recovery panel covering Ready. Recovery now opens a native bounded dialog with an inert background, dark link text, persistent Close and explicit keyboard wrap/Escape restoration. Fresh full-size captures of that dialog accompany the final local checkpoint.

## Illustrated evidence

- [Remote invitation and recovery](stories/invite-a-remote-friend-confirm-setup-and-restore-the-same-seats-across-clients/README.md): **59 meaningful steps** on phone-host/desktop-guest and desktop-host/phone-guest runs. Ada, Bora and unseated visitor Cleo use three separate anonymous Auth contexts. Missing/full rooms, preview before claim, acknowledged readiness, setup invalidation, reload/Continue, both real built client paths on one origin, seat release, long-name commit/cancellation and all four dialogs are photographed through TestStepHelper.
- [Mode instruments](stories/choose-a-gathering-mode-through-tactile-keyboard-accessible-instruments/README.md): **10 steps** on phone, desktop and 3840×2160. Ordinary arrival, balanced mode choices, each native keyboard target, activation of real code entry and host configuration, and returning without creating a room.

The two stories produce 148 macOS captures. Fixed command/code entropy is installed before ordinary setup; no game state is injected. Actual PNG dimensions label every actor view. All remote candidate contact sheets and full-size critical states were visually inspected against the concept before independent comparison, including QR contrast/wrapping, empty/full preview, readiness, lifted name entry, long-name controls, setup focus, recovery and cross-client observation. Existing gallery, Learn, physical seating and tabletop recovery remain in the full suite. Their mode-choice images intentionally reflect the balanced navigation; tabletop seat behavior remains unchanged.

The mode-scale assertion compares computed layout dimensions in one frame. This avoids fractional DOMRect rounding during a transient pointer-hover translation; the actual rendered geometry still passes the unchanged clipping/overlap audit and zero-tolerance screenshot comparison. No capture guard, deadline, pixel tolerance, mask, normalization or retry was changed.

## Scope and remaining gates

This milestone ends at remote gathering. Basic faction uniqueness, Begin and seeded boards belong to 003. There is no temporary Begin action or invented setup. Tabletop joins directly at physical positions in one controller browser with no invitation, QR or companion identity. Canonical `games/<id>` and immutable events remain the same through all client paths; invitations index that root.

The [phase ledger](../../../IMPLEMENTATION_PLAN.md) records local verification and review status. Linux candidate inspection, independent Linux comparison and a revision-matching production-Firestore PR preview remain publication gates after local release. Every preview deploys compatible rules and posts its actual PR-number URL independently of E2E completion. All stacked PRs remain unmerged.

## Final local verification checkpoint

The final pinned-Nix frozen installation and `bun run verify` pass: all 16 illustrated journeys compare exactly, all 26 capture-guard regressions pass, all 10 backend/model and 10 tooling tests pass, and policy/Svelte checks pass with zero Svelte errors or warnings. Candidate generation preceded independent comparison. The final run includes enlarged 4K remote entry, balanced mode navigation and the corrected recovery dialog. The two remote/mode stories contain 148 new macOS captures alongside existing foundation/gallery evidence. Supervisor verification of the supplied full 4K navigation and final local results remains pending; phase002 publication and phase003 remain on hold.

A focused local transport-fault integration check also aborts the Auth emulator request, verifies the explicit offline/Retry state, restores transport and follows Retry to the same invitation through the real Auth/Firestore emulators. This injects a connection failure, not game data, and does not replace either ordinary illustrated journey. It covers the initial connection correction found while restarting the persistent local review backend.

Reviewer checkpoint25 independently accepted the full 4K navigation. Corrected phone recovery, keyboard Close focus and Escape return to Recovery options were also verified against the restored persistent local preview, with full-size local PNGs supplied for independent review. The existing exact story already captures those states (steps038–041); no duplicate baseline generation or full check run was performed. Final local acceptance and release of003 remain pending recovery review.

## Restored local acceptance

Reviewer checkpoint26 restores phase002 LOCAL ACCEPTANCE after independent inspection of corrected phone recovery and keyboard state, all prior desktop/phone/live gathering and navigation views, full 4K navigation, and the successful local verify log. Publication is authorized against `feat/card-gallery`, and003 may start on a new branch from this accepted-local head while Linux/hosted gates finish. Final phase002 acceptance still requires reviewed Linux candidates, independent Linux exact comparison and a revision-matching hosted preview. No PR may be merged.

## Linux acknowledgement follow-up

The initial Linux candidate run on `4524932` completed 15 journeys but the first phone host creation exceeded the unchanged 2-second visible-state budget. Creation now displays the projection returned by its successful transaction directly, then subscribes; reopening still replays history. This removes two redundant reads after acknowledged creation without speculative state. The pinned local `bun run verify` passes all 16 exact journeys and 26 capture guards with no baseline edits (`tmp/remote-round26-verify.log`). Candidate failures now retain traces for diagnosis. Linux generation, independent image review/comparison, and final-head hosted verification remain open gates.

## Reviewed Linux candidate import

Run `39164658076`, head `f9b8215`, passes all 16 candidate journeys. Reviewed all 155 changed/new Linux PNGs in eight contact sheets, then inspected full-size phone recovery/everyone-ready and desktop long-name states against the accepted local captures and concept02. Materials, balanced navigation, seat containment, compact portrait, QR contrast and bounded recovery match the accepted composition. Imported 148 new remote/mode images and seven intentionally changed foundation mode-choice images. No source or capture guards changed. The independent comparison job on this imported revision remains the final Linux gate.
