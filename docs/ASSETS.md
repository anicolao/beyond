# Production artwork

`static/art/observatory.png` is original environment artwork generated with the built-in image_gen tool on 2026-10-18. It provides only the painted setting; all titles, controls, guide text, player names, and state are semantic UI rendered over it. No concept screenshot or publisher card face is used as a production interface.

## Observatory prompt

Use case: stylized-concept. Asset: production background painting for an illustrated digital board game called Beyond the Sun. A quiet elegant orbital observatory at the dawn of human interstellar travel, rich painterly science fiction with realistic materials. Wide landscape 16:9 image. Enormous curved windows overlook a blue Earthlike planet and a distant golden sun at upper right, a small research station visible in orbit, discreet plants and bronze celestial instruments at the outer edges. Lower half shows a dark graphite circular research table with very subtle engraved orbital paths, restrained bronze trim and teal edge illumination. Keep the entire center-left two thirds of the image dark and visually quiet to receive semantic game title and navigation controls later. Original refined art, cinematic but calm, warm dawn light against deep midnight blue. NO text, NO lettering, NO logos, NO cards, NO dice, NO pawns, NO buttons, NO screen mockups, NO UI, NO people, NO watermark. This must be a raw environmental illustration, not a flattened webpage.

The selected output was visually inspected for a quiet control area, legible foreground contrast, an orbital vista, and the absence of generated lettering or buttons. The original is retained in the generation library; the project copy is committed with the implementation. The UI uses bundled Atkinson Hyperlegible and Cormorant Garamond font packages, whose license files are shipped in static/licenses/ and remain included in their source distributions.

## Semantic instrument components

`src/lib/EntryDisc.svelte`, `src/lib/InstrumentIcon.svelte`, and `src/app.css` define original hand-authored SVG line art, layered brass rims, graphite instrument faces, ivory mat faces, and the shared table inlay. All actionable labels and player data remain semantic HTML. The approved arrival and shared-table concept plates inform their materials; their shapes are reusable native UI, not flattened concept-image crops. No new gameplay art, card, resource, faction emblem, or state is invented for gathering. The existing original observatory raster remains the environmental backdrop.
