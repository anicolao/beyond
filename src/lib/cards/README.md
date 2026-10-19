# Reusable public card faces

`CardFace.svelte` is the semantic production renderer used by `/gallery/`. It accepts a reviewed `CardDefinition` and an optional `CardPresentation` containing only public information. It does not import gallery fixtures, decks, a backend or game commands. Boards, planning and public inspectors reuse this renderer. Card text is selectable and accessible; SVG symbols supplement explicit labels.

The canonical [production catalog](catalog.ts) contains exactly100 second-printing base designs/100 physical cards, one copy each:46 Technology,20 Event,24 System and10 Achievement. Independent ID/quantity and printed-face facts are checked against the [source inventory](../../../docs/content/CARD_INVENTORY.md). The gallery renders the same objects used by game inspection; it has no extra sample-only cards. Optional markers live separately in gallery/fixtures.ts. Descriptive card rules do not dispatch unsupported effects.

Authority: Rio Grande Games’ [second-printing combined rulebook](https://www.riograndegames.com/wp-content/uploads/2020/08/Beyond-the-Sun-2nd-Print-Rules-Combined.pdf). Page references use printed numbers. The combined PDF places two setup sheets first; printed page N is PDF page N+2. The printed faces were visually inspected against a readable copy of the publisher’s rulebook, and second-printing clarifications and setup were checked against the publisher text. No publisher image is shipped.

Every definition carries its exact reference-sheet cell and semantic mechanical paraphrases. All100 designs have original project artwork. The68 newly completed illustrations have individually recorded prompts, native asset hashes and provenance; existing original illustrations and System SVGs retain their provenance. Full family/type/deck/quantity coverage and source limitations are documented in the inventory audit, including the WISE title discrepancy. No publisher scans, vendor implementation, hidden live deck or future draws enter the renderer.

Asset prompts and provenance: [docs/ASSETS.md](../../../docs/ASSETS.md).

## Physical family proportions

The shared full-face renderer fixes Technology and System cards at width:height 5:8, Events at 2:3, and Achievements at 10:9. Dimensions do not depend on text, public markers or inspection context. Compact board overview faces retain their deliberate board footprint and open the full renderer for complete rules.

A compact title rail precedes substantial original art, a labelled identity band, separated semantic rule sections and a bottom public-state/scoring region. Shorter Technology/Event rules let their illustration occupy the remaining space. All source-reviewed text stays visible on the face; there is no line clamp, clipped rule box or card-internal scroll. The bounded inspector scrolls the complete physical card and details while Close and Previous/Next remain reachable. Family proportions must accommodate the longest supported definitions and representative public markers at phone, desktop and shared-display scales.

Reviewer42 hierarchy increment distinguishes Immediate from Action with labelled original symbols. High-contrast cost strips retain the full cost text alongside decorative resource keys; no icon replaces a source quantity or changes game behavior. Strict full-face bounds and independent visual review still apply.
