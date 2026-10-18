# Production artwork

`static/art/observatory.png` is original environment artwork generated with the built-in image_gen tool on 2026-10-18. It provides only the painted setting; all titles, controls, guide text, player names, and state are semantic UI rendered over it. No concept screenshot or publisher card face is used as a production interface.

## Observatory prompt

Use case: stylized-concept. Asset: production background painting for an illustrated digital board game called Beyond the Sun. A quiet elegant orbital observatory at the dawn of human interstellar travel, rich painterly science fiction with realistic materials. Wide landscape 16:9 image. Enormous curved windows overlook a blue Earthlike planet and a distant golden sun at upper right, a small research station visible in orbit, discreet plants and bronze celestial instruments at the outer edges. Lower half shows a dark graphite circular research table with very subtle engraved orbital paths, restrained bronze trim and teal edge illumination. Keep the entire center-left two thirds of the image dark and visually quiet to receive semantic game title and navigation controls later. Original refined art, cinematic but calm, warm dawn light against deep midnight blue. NO text, NO lettering, NO logos, NO cards, NO dice, NO pawns, NO buttons, NO screen mockups, NO UI, NO people, NO watermark. This must be a raw environmental illustration, not a flattened webpage.

The selected output was visually inspected for a quiet control area, legible foreground contrast, an orbital vista, and the absence of generated lettering or buttons. The original is retained in the generation library; the project copy is committed with the implementation. The UI uses bundled Atkinson Hyperlegible and Cormorant Garamond font packages, whose license files are shipped in static/licenses/ and remain included in their source distributions.

## Semantic instrument components

`src/lib/EntryDisc.svelte`, `src/lib/InstrumentIcon.svelte`, and `src/app.css` define original hand-authored SVG line art, layered brass rims, graphite instrument faces, ivory mat faces, and the shared table inlay. All actionable labels and player data remain semantic HTML. The approved arrival and shared-table concept plates inform their materials; their shapes are reusable native UI, not flattened concept-image crops. No new gameplay art, card, resource, faction emblem, or state is invented for gathering. The existing original observatory raster remains the environmental backdrop.

## Card collection illustrations

The four originals in `static/art/cards/` were generated with the built-in `image_gen` tool on 2026-10-18 for this project and visually inspected before use. They contain illustration only: no publisher faces, text, frames, logos or game symbols. `src/lib/cards/CardFace.svelte` and `CardSymbol.svelte` supply original semantic HTML/CSS and hand-authored SVG. The gallery renders that same production component with separately defined visual fixtures.

Every illustration used this common prompt wrapper:

> Use case: stylized-concept. Asset type: original production illustration for Beyond the Sun digital card component, art only. [Scene below] Refined painterly realistic science fiction, physically convincing intricate materials, cinematic composition, muted midnight graphite, ivory and restrained brass, teal accents. Wide landscape illustration 3:2, subject centered with detail across the frame. No text, lettering, symbols, logos, watermark, card frame, borders, UI or game pieces. Not a card mockup.

| Asset | Scene inserted in the wrapper | Original generation ID |
| --- | --- | --- |
| `technology.png` | An enormous quantum computing observatory in orbit above a blue planet, intricate concentric brass cooling rings and softly glowing teal crystal computing core, distant sun. No people. | `exec-d3760ba4-20b6-4be2-afec-0cf874d76bf7` |
| `event.png` | An original elegant android governor seen in profile inside a vaulted orbital council chamber, graphite ceramic face and delicate brass joints, blue planetary horizon through tall windows, thoughtful and dignified. No writing. | `exec-92318bad-f16e-4a31-9f68-263d1a129a23` |
| `system.png` | A lush habitable exoplanet beneath a small warm red star, mountain ridges and silvery lakes, wisps of cloud, viewed from a near orbit with its curved horizon. Quiet emerald teal and warm ivory light. | `exec-1dc5a526-ff3b-4883-863d-93d1e87618a7` |
| `achievement.png` | A magnificent human colony beside a lake on an alien world, slender domed towers and monumental brass astronomical ring, lush terraces, distant mountains, warm morning light, no people. | `exec-de0ca0fc-01c2-4728-bb7a-20a99871aeab` |

The originals remain in the generation library. Achievement examples share the family illustration in this review subset; Hypercomputing and Advanced Robotics have distinct illustrations. They are not attempts to reproduce publisher artwork or portray exact locations/effects. Original project assets are covered by the repository license.


### Advanced Robotics identity refinement

`static/art/cards/robotics.png` was generated with the built-in `image_gen` tool on 2026-10-18, generation ID `exec-d9affb02-4c4a-42ce-abb5-5d41b800ff6e`. Prompt:

> Use case: stylized-concept. Asset type: original production illustration for the Advanced Robotics technology card in Beyond the Sun, art only. A precise robotic manufacturing laboratory inside an orbital station: two sophisticated articulated graphite and brass robotic arms assembling a small mechanical gripper on an ivory ceramic workbench, intricate tools and cables, a restrained teal diagnostic glow, distant blue planetary crescent through a broad dark window. No humanoid android, no computing rings. Refined painterly realistic science fiction, physically convincing materials, calm cinematic light, midnight graphite, warm ivory, restrained brass and teal. Wide landscape 3:2 composition, robot arms and workbench clearly legible at small card-art scale. No text, lettering, symbols, logos, watermark, card frame, borders, UI or game pieces. Not a card mockup.

## Remote room instruments and invitations

The remote gathering surface reuses the original observatory painting. Its graphite standing seat readers, illuminated invitation instrument, engraved table surface, brass rims, public initial seals and lifted ivory name plaque are original semantic HTML/CSS; the initials are player names, not invented faction emblems. No new publisher artwork or flattened concept plate is embedded.

`src/lib/ModeInstrument.svelte` renders the three mode choices with the same original brass rims, recessed graphite faces and explicit semantic labels; the existing table/orbit/return SVG icons distinguish local seating, remote hosting and code entry. No raster interface is substituted.

Remote invitation QR codes are computed locally from the public invitation URL with the pinned MIT-licensed `qrcode-generator` 2.0.4 package by Kazuhiko Arase. They contain no secret/player identity and are never used in tabletop seating. Attribution and the MIT license ship in [static/licenses/qrcode-generator.txt](../static/licenses/qrcode-generator.txt). The URL remains an accessible, underlined semantic link beside the generated QR image.
