# Card collection visual review

Reference: [research](../../../docs/ux/concepts/04-research.png), [Systems](../../../docs/ux/concepts/06-colonization.png), and [achievements](../../../docs/ux/concepts/08-achievements-v2.png) in the approved UX. Review the composed semantic faces rather than the original illustrations in isolation.

Local reviewer acceptance followed desktop, phone, full 3840×2160 PNG, all-family and colony-state inspection. The compact 1280×720 collection now starts at approximately y=274 rather than the earlier 540px header stack. Close and Previous/Next remain outside the card/details scroll window. Hypercomputing and Advanced Robotics have distinct original illustrations. Materials, hierarchy, readable rules and persistent controls were accepted before final evidence generation.

The [generated walkthrough](stories/explore-source-reviewed-card-faces-and-representative-public-states/README.md) contains 26 ordinary UI steps at phone 393×852, desktop 1440×1000, compact desktop 1280×720 and tabletop 3840×2160. It uses the required fixture and TestStepHelper against Auth/Firestore emulators, without a saved game, injected state or deck order. Exact macOS comparison passes. Linux candidate run [39153519184](https://github.com/anicolao/beyond/actions/runs/39153519184) passed all eleven browser runs and twenty-six guards. Compact collection, phone inspection, internal scrolling, all four families, 4K markers and restricted achievements, plus updated arrival/Continue captures were visually inspected before accepting the separate Linux baselines. Native scrollbar widths differ by platform and are preserved without normalization. A separate zero-tolerance comparison is required after this baseline commit.

Representative inspected captures:

- [Compact collection](screenshots/explore-source-reviewed-card-faces-and-representative-public-states/001-collection-desktop-compact-darwin.png): useful scale, distinct technology identities and a concise fixture note.
- [Phone inspector](screenshots/explore-source-reviewed-card-faces-and-representative-public-states/003-inspect-technology-phone-darwin.png): complete semantic rules, explicit cost, minimum targets and persistent navigation.
- [Internal scroll](screenshots/explore-source-reviewed-card-faces-and-representative-public-states/007-scroll-details-desktop-compact-darwin.png): source details reachable while navigation remains in the viewport.
- [4K public-state fixture](screenshots/explore-source-reviewed-card-faces-and-representative-public-states/011-inspect-markers-tabletop-4k-darwin.png): two named research cubes are distinct from an occupied action pawn.
- [System colony](screenshots/explore-source-reviewed-card-faces-and-representative-public-states/017-inspect-system-desktop-darwin.png): specialty, control bonus, settlement requirement, colony discs and scoring are separate.
- [Three-player achievement](screenshots/explore-source-reviewed-card-faces-and-representative-public-states/021-inspect-achievement-phone-darwin.png): the unavailable second slot is labelled; marker state is explicitly fictional.

Accessibility regressions photograph backward and forward focus wrap, focus on the named scroll area, keyboard scrolling, Escape and source-focus restoration. Twenty-six focused capture-audit tests preserve true overlap, viewport clipping, hidden text clipping and focused-content failures while recognizing intentional bounded scrolling and empty offscreen document hit regions. No pixel tolerance, masking, normalization, retry or timing budget changes were made.

The accepted PR #2 instruments, gathering and persistence remain intact. Its arrival captures change only to include the requested Card gallery link; all table, seat editor, Learn, Play and cross-deployment recovery states retain their existing renderings and stories.

## Scope and remaining differences

This is a reviewed six-card subset, not a complete card/deck manifest or playable card-effects increment. Immediate/action/System/achievement rules are source-backed presentation data; no gameplay controls suggest that those effects can be executed. Public example markers live in a separate fixture module and never enter game storage. Future live deck contents are neither fetched nor passed to card components.

The native CSS/SVG frames approximate the concept's painted bevels using semantic, selectable content. The two achievement examples share one original colony illustration; the two technologies have individual art. The long fixed-event rule is the current text-density example. Additional effects, hybrid types, level IIII scoring, Advanced innovations and crowded fleets require their own verified definitions and production increments. Full artwork provenance and exact prompts are in [docs/ASSETS.md](../../../docs/ASSETS.md); card-face review references are in [src/lib/cards/README.md](../../../src/lib/cards/README.md).


Linux review references: [compact collection](screenshots/explore-source-reviewed-card-faces-and-representative-public-states/001-collection-desktop-compact-linux.png), [internal scroll](screenshots/explore-source-reviewed-card-faces-and-representative-public-states/007-scroll-details-desktop-compact-linux.png), [phone colony](screenshots/explore-source-reviewed-card-faces-and-representative-public-states/017-inspect-system-phone-linux.png), and [4K achievement](screenshots/explore-source-reviewed-card-faces-and-representative-public-states/021-inspect-achievement-tabletop-4k-linux.png). The gallery has 104 captures per platform; the 102 foundation captures per platform remain alongside it.
