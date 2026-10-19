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

The originals remain in the generation library. These initial illustrations are retained alongside the complete canonical collection documented below; Hypercomputing and Advanced Robotics have distinct illustrations. They are not attempts to reproduce publisher artwork or portray exact locations/effects. Original project assets are covered by the repository license.


### Advanced Robotics identity refinement

`static/art/cards/robotics.png` was generated with the built-in `image_gen` tool on 2026-10-18, generation ID `exec-d9affb02-4c4a-42ce-abb5-5d41b800ff6e`. Prompt:

> Use case: stylized-concept. Asset type: original production illustration for the Advanced Robotics technology card in Beyond the Sun, art only. A precise robotic manufacturing laboratory inside an orbital station: two sophisticated articulated graphite and brass robotic arms assembling a small mechanical gripper on an ivory ceramic workbench, intricate tools and cables, a restrained teal diagnostic glow, distant blue planetary crescent through a broad dark window. No humanoid android, no computing rings. Refined painterly realistic science fiction, physically convincing materials, calm cinematic light, midnight graphite, warm ivory, restrained brass and teal. Wide landscape 3:2 composition, robot arms and workbench clearly legible at small card-art scale. No text, lettering, symbols, logos, watermark, card frame, borders, UI or game pieces. Not a card mockup.

## Remote room instruments and invitations

The remote gathering surface reuses the original observatory painting. Its graphite standing seat readers, illuminated invitation instrument, engraved table surface, brass rims, public initial seals and lifted ivory name plaque are original semantic HTML/CSS; the initials are player names, not invented faction emblems. No new publisher artwork or flattened concept plate is embedded.

`src/lib/ModeInstrument.svelte` renders the three mode choices with the same original brass rims, recessed graphite faces and explicit semantic labels; the existing table/orbit/return SVG icons distinguish local seating, remote hosting and code entry. No raster interface is substituted.

Remote invitation QR codes are computed locally from the public invitation URL with the pinned MIT-licensed `qrcode-generator` 2.0.4 package by Kazuhiko Arase. They contain no secret/player identity and are never used in tabletop seating. Attribution and the MIT license ship in [static/licenses/qrcode-generator.txt](../static/licenses/qrcode-generator.txt). The URL remains an accessible, underlined semantic link beside the generated QR image.

## Starting Technology illustrations used by the canonical gallery

The following original artwork was generated with the built-in imagegen tool on 2026-10-18, visually inspected and copied into this workspace. No publisher or BGA art is shipped. Semantic rules, symbols, costs and controls remain live HTML/SVG.

| Workspace file | Subject | Generation ID |
| --- | --- | --- |
| `static/art/cards/genetics-v1.png` | Orbital genetics laboratory and suspended molecular double helix | `exec-202a3f02-5cb9-4f5c-bf7d-dee85405ea29` |
| `static/art/cards/terraforming-v1.png` | Glass greenhouse settlement and atmospheric infrastructure on an alien world | `exec-49b362ec-05a5-46c4-8882-2fa70ef5da30` |
| `static/art/cards/lasers-v1.png` | Precision orbital laser array, focusing mirrors and a narrow beam into empty space | `exec-1eb078b1-4e3e-4fd7-ad19-b8cef0a0296e` |

Common prompt (followed by the respective subject prompt below):

> Use case: stylized-concept. Asset type: original landscape illustration used inside an ivory and brass science-fiction board-game card, art only, no frame. Detailed cinematic science-fiction concept painting with believable precision engineering, warm brass highlights, deep graphite, midnight blue and restrained teal illumination, tactile material detail and atmospheric depth. Landscape 3:2 composition with a distinct central subject readable in a small card crop. No text, letters, numbers, logos, icons, card frame or watermark. No copying existing published board game art.

Genetics:

> An advanced orbital genetics laboratory: a luminous three-dimensional double helix of molecular particles suspended inside a tall transparent bioreactor, fine brass scientific instruments, living green research cultures and quiet ivory laboratory architecture, curved observation window showing a blue planet and distant sun. Optimistic, rigorous, richly detailed, not a diagram.

Terraforming:

> A pioneering terraforming settlement on a rugged alien world: substantial geodesic glass greenhouse domes enclosing verdant forests and crops, brass and ivory atmospheric-processing towers and irrigation infrastructure, barren ochre mountains beyond and a small pale moon, warm low sunlight and cool teal habitat lights. No people, no combat.

Narrow Beam Lasers:

> A precision narrow-beam laser research installation in orbit: a long graphite and brass optical array with multiple carefully aligned lenses and articulated focusing mirrors, one thin coherent teal beam aimed into empty deep space, blue planet curvature below, distant stars and warm sunlight catching machined metal. No missiles, explosions or firing at planets.

`src/lib/cards/OriginalCardArt.svelte` draws deterministic original System planets and star fields in SVG. Geometry and palettes were authored in this repository; stable card IDs select the composition. Existing Advanced Robotics retains its distinct original gallery artwork. Board/mat/piece renderers and SVG art ship as GPL-3.0-only source. Publisher-authorized component sheets were inspected solely to transcribe mechanical facts; research copies in `/tmp` are not product assets or repository files.

## Technologist card identity — local gallery correction39

`static/art/cards/technologist-v1.png` is an original1536×1024 illustration generated with the built-in image_gen tool on2026-10-19, generation ID `exec-996d73b4-d4d7-4118-aa4d-cce4c0d3822c`. The native output was visually inspected and copied into the workspace without replacing the original Empire artwork. Both gallery and live card definitions select it; no rules or publisher artwork are embedded. Prompt:

> Use case: stylized-concept. Asset type: original text-free illustration for the Technologist achievement card in a science-fiction board game. Create one polished painterly realistic illustration, landscape 1536x1024. Main subject: a large elegant graphite and brushed brass astronomical radio dish and connected research observatory on a remote rocky plateau, measuring the stars at dusk. Intricate credible mechanical struts and a small warmly lit laboratory; distant mountains, atmospheric depth, restrained teal instrument glows, soft ivory cloudlight and a starry blue-black sky. Luxurious restrained science-fiction board-game art; clear central silhouette that remains meaningful in a wide horizontal card-art window. Balanced composition with the entire main dish inside the central 70% of image width and central 50% of image height so a wide crop preserves its identity. Original architecture and composition. No lettering, numbers, symbols, titles, frame, UI, playing cards, dice, or watermark. This is standalone artwork; all rules and icons are rendered separately in HTML.

The full-face research symbol is an original outlined flask authored in CardSymbol.svelte. It supplements explicit rule labels and carries no effect by itself.

## Complete canonical card art — local correction41

All68 remaining base-card illustrations were generated individually with the built-in `image_gen` tool on2026-10-19:41 Technologies,19 Events and8 Achievements. Native1536×1024 PNG outputs are retained unmodified in `static/art/cards/<canonical-id>-v1.png`. Existing32 illustrations remain. Each new design has distinct subject matter; all share painterly physical science-fiction materials, restrained graphite/ivory/brass and teal illumination. The art contains no playable interface or rules.

[card-art-provenance.json](content/card-art-provenance.json) records every exact prompt, generation path/ID, destination, content hash, retry history and implementation inspection evidence. Prompts were recorded before generation; two rejected outputs were retried as unoccupied biotechnology machinery. No rejected output is a shipped asset. No publisher or BGA artwork was used as generation input. The three-card initial batch was inspected inside the shared production renderer against concepts04/08 before scaling; the subsequent batches were visually inspected as labelled contacts, with rendered crop review and phone/desktop/4K checks. Independent visual acceptance remains pending.

All images are art only. Titles, costs, rules, source notes, action-space symbols and optional public-state markers remain semantic HTML/SVG. Family die cuts stay fixed; Technology/Event/Achievement art flexes within its window to preserve complete long rules and public markers without clipping or shrinking text. Exact printed-wording and WISE identity limitations remain documented in the inventory audit.

## Card rule keys — local correction42

Immediate lightning, circled action arrow and Supply cube are original semantic SVG shapes in CardSymbol.svelte. Cost strips retain complete canonical text and add decorative resource keys on graphite; they never parse or execute gameplay. Source costs and rule wording are unchanged. Full game inspection scales its card and persistent controls at4K for shared-table legibility. Representative illustration-direction approval covers only the three reviewed originals; full-card acceptance and baselines remain held.

Reviewer44 locally accepts the complete shared-card correction and original-art presentation. This supersedes the earlier pending local-review status above; independent exact Linux and hosted revision gates remain pending.
