# Supervised UI fidelity review

References: [arrival concept](../../../docs/ux/concepts/01-arrival.png), [gathering materials](../../../docs/ux/concepts/02-gather.png), [shared-table concept](../../../docs/ux/concepts/11-shared-table-v2.png), and [the reviewer handoff](../../../meta-prompts.md#reviewer-handoff).

## Changes and visual findings

The entry controls now use reusable semantic `EntryDisc` components: layered brass rims, a recessed illuminated face, original SVG instrument icons, readable live labels, a substantial lower wall, and contact shadows. Play is teal, Learn amber, and retained Continue violet. They rest across the illustrated foreground table. The title and orbital vista occupy the upper field. At phone width the objects form a prominent vertical stack with room for all three controls.

Occupied seats and inline name editors use ivory component faces inside graphite/brass bases. Empty positions are graphite docks with smaller illuminated join objects. At four players the remaining objects lose their illumination and explicitly say **Table full / Four players seated**. Names, actions and the complete editor rotate toward each physical position, including the corner seat exercised in the story. Monograms identify entered player names; they do not invent faction emblems or game state.

A substantial graphite table surface anchors all eight seats. Its quiet etched center presents the gathering hierarchy and clockwise order, with secondary return/recovery controls. Recovery opens as an ivory instrument on that same table. Initial visual inspection found crowded North/South clearance and corner/edge margins; the second pass reduced the center's height, increased corner clearance, quieted its ornament, and moved connection text inside the table rim. These changes were inspected in actual captures, separately from regression comparison.

## Actual rendered evidence

All links are full-resolution captures produced by the mandatory TestStepHelper. The generated walkthroughs contain every action and assertion.

| Review surface | Capture |
| --- | --- |
| Desktop arrival and foreground composition | [1440 × 1000](screenshots/enter-the-observatory-and-learn-the-turn/000-arrival-desktop-darwin.png) |
| Phone stacked Play/Learn | [393 × 852](screenshots/enter-the-observatory-and-learn-the-turn/000-arrival-phone-darwin.png) |
| Phone retained Continue, same browser narrowed after ordinary UI setup | [393 × 852](screenshots/join-physical-seats-and-arrange-the-shared-table/025-narrow-retained-entry-desktop-darwin.png) |
| Retained three-object entry on the shared display | [3840 × 2160](screenshots/join-physical-seats-and-arrange-the-shared-table/022-continue-tabletop-4k-darwin.png) |
| Phone keyboard focus | [393 × 852](screenshots/enter-the-observatory-and-learn-the-turn/003-keyboard-focus-phone-darwin.png) |
| Play's shared-table instrument | [phone](screenshots/enter-the-observatory-and-learn-the-turn/004-play-phone-darwin.png), [desktop](screenshots/enter-the-observatory-and-learn-the-turn/004-play-desktop-darwin.png) |
| Learn's ivory turn-reference components | [phone](screenshots/enter-the-observatory-and-learn-the-turn/001-learn-phone-darwin.png), [desktop](screenshots/enter-the-observatory-and-learn-the-turn/001-learn-desktop-darwin.png) |
| Empty physical table | [desktop](screenshots/join-physical-seats-and-arrange-the-shared-table/002-empty-table-desktop-darwin.png), [4K](screenshots/join-physical-seats-and-arrange-the-shared-table/002-empty-table-tabletop-4k-darwin.png) |
| Partial seating, entered names and ivory mats | [desktop](screenshots/join-physical-seats-and-arrange-the-shared-table/008-north-joined-desktop-darwin.png), [4K](screenshots/join-physical-seats-and-arrange-the-shared-table/008-north-joined-tabletop-4k-darwin.png) |
| Four players, disabled empty positions and clockwise order | [desktop](screenshots/join-physical-seats-and-arrange-the-shared-table/016-first-player-desktop-darwin.png), [4K](screenshots/join-physical-seats-and-arrange-the-shared-table/016-first-player-tabletop-4k-darwin.png) |
| North West inline editor, rotated toward the player | [desktop](screenshots/join-physical-seats-and-arrange-the-shared-table/012-north-west-editor-desktop-darwin.png), [4K](screenshots/join-physical-seats-and-arrange-the-shared-table/012-north-west-editor-tabletop-4k-darwin.png) |
| Secondary recovery instrument | [desktop](screenshots/recover-one-game-between-pr-and-production-clients/006-options-desktop-darwin.png), [4K](screenshots/recover-one-game-between-pr-and-production-clients/006-options-tabletop-4k-darwin.png) |

## Verification and remaining departures

Three emulator-backed production stories run seven viewport variants, producing 102 ordered captures per platform. The responsive entry review uses one controller and its actual retained game, then restores the original viewport before table interaction; it adds no companion device or phone tabletop flow. Walkthroughs read each PNG's actual dimensions so the resized entry is labelled truthfully.

The new corner-editor case exposed an axis-aligned bounding-box false positive in the overlap audit. The audit now compares transformed control polygons using a strict separating-axis check. It excludes no controls and adds no tolerance. Eighteen focused browser guard regressions accept separated controls and reject actual overlaps at every 45-degree seat orientation, viewport clipping, and clipped text. Unknown or perspective geometry remains conservatively axis-aligned. PNG pixel equality, capture deadlines, touch checks, timing policy, emulator setup and independent preview publication remain enforced.

The original environmental art is retained. Native CSS and original SVG implement the material language rather than reproducing every painted highlight. The concepts' decorative technology cards, resources and faction tracks are absent because milestone 001 supports gathering rather than those gameplay states. The future boards are not represented by a fake board, placeholder game controls or invented state. Canonical persistence and PR/production recovery remain the same production path.

macOS representative captures above were visually inspected against the concept plates. Linux candidates use the pinned ARM64 Playwright 1.61.1 Noble image and receive a separate visual review followed by the exact comparison gate. `BASELINES.sha256` records the accepted image bytes; generation alone is not a comparison pass.

Linux visual review: candidate run **39147561219**, pinned ARM64 Playwright image. Inspected desktop arrival, the three-control phone-width retained entry, the full 4K table, the rotated North West editor, and the desktop recovery instrument alongside the concepts and macOS captures. The rims, illumination, ivory/graphite hierarchy, orientation and margins remain consistent. Platform font rasterization has its own exact baselines; no normalization is applied. [Linux phone-width Continue](screenshots/join-physical-seats-and-arrange-the-shared-table/025-narrow-retained-entry-desktop-linux.png) and [Linux 4K corner editor](screenshots/join-physical-seats-and-arrange-the-shared-table/012-north-west-editor-tabletop-4k-linux.png) provide direct review links. The full set comprises 204 macOS/Linux PNGs; the subsequent Linux comparison gate is separate from this generation/review.
