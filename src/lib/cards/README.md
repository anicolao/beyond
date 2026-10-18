# Reusable public card faces

`CardFace.svelte` is the semantic production renderer used by `/gallery/`. It accepts a reviewed `CardDefinition` and an optional `CardPresentation` containing only public information. It does not import gallery fixtures, decks, a backend or game commands. Future boards and public inspectors must reuse this renderer rather than fork a gallery version. Card text is selectable and accessible; SVG symbols supplement explicit labels.

`definitions.ts` is a reviewed six-card subset, not a complete manifest or a live deck. Text paraphrases mechanics; it does not reproduce flavor writing. No gameplay reducer implements these effects yet. Costs distinguish payment from results; technology bonuses are distinct from later action use. System power and points have explicit meanings. Claim slots display ordered rewards and the player-count restriction.

Authority: Rio Grande Games’ [second-printing combined rulebook](https://www.riograndegames.com/wp-content/uploads/2020/08/Beyond-the-Sun-2nd-Print-Rules-Combined.pdf). Page references use printed numbers. The combined PDF places two setup sheets first; printed page N is PDF page N+2. The printed faces were visually inspected against a readable copy of the publisher’s rulebook, and second-printing clarifications and setup were checked against the publisher text. No publisher image is shipped.

| Definition | Independent review reference |
| --- | --- |
| Hypercomputing | Complete face, p. 3; Level II location in p. 16 example. Immediate Ore automation; action costs 4 Ore and a permanently placed Population cube to research III; level scores 2. |
| Advanced Robotics | Level I face, p. 16: immediate Ore automation plus 1 Ore, no action box; level scores 1. |
| KC-24X | Complete event face, p. 3; fixed III group on setup sheet. Remove one Tier 2 cover, shared access, keep for 1 point. |
| Barnard’s Star | Complete face, p. 4, repeated p. 22: starting A, Food, control converts one Supply, settlement power 3, colony converts one Supply plus 2 Ore, colony scores 5. |
| Empire | Complete face pp. 4/11: four colonies; rewards 4/3/2/1. |
| Technologist | Complete face pp. 4/11: six shared II technologies, excludes personal ones; rewards 3/2, second slot only in four-player setup. |

The examples of Ada/Bora, occupied actions, colonies and claims live exclusively in `../gallery/fixtures.ts`. They are labelled visual fixtures in the gallery and inspector. They are not eligibility calculations, saved state, live candidates or future draws. No hidden content is passed to this renderer.

Asset prompts and provenance: [docs/ASSETS.md](../../../docs/ASSETS.md). The fixed III event provides the longer rules sample in this small subset; crowded fleets, Advanced innovations, level IIII scoring and the full base manifests belong to later source-reviewed increments.
