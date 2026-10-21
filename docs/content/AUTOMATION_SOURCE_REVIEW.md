# Basic Automation track — source review

The canonical per-position awards are **0, 1, 1, 1, 1, 1, 2**. The first position has no printed VP symbol; zero represents that absence. These are separate awards to add, rather than replacement totals.

| Reached level | Award at that position | Cumulative endgame contribution |
| --- | --- | --- |
| 0 | — | 0 |
| 1 | No printed award | 0 |
| 2 | 1 | 1 |
| 3 | 1 | 2 |
| 4 | 1 | 3 |
| 5 | 1 | 4 |
| 6 | 1 | 5 |
| 7 | 2 | 7 |
| Each additional level | 1 | Previous total +1 |

`src/lib/game/automation-scoring.ts` is the production manifest and read-only calculation. Production-disc removal and permanent level changes remain the existing canonical turn effects. Inspecting a future effect does not collect production or score points immediately. Control outposts and a later returned production disc do not reduce the permanent Automation level or replace a placeholder already placed there.

## Authority and visual transcription

The authority is Rio Grande Games' [second-print combined rulebook and setup sheets](https://www.riograndegames.com/wp-content/uploads/2020/08/Beyond-the-Sun-2nd-Print-Rules-Combined.pdf). The original PDF was downloaded from that exact publisher URL through the ordinary Chrome PDF viewer on 2026-10-20, after its automatic site verification completed. No CAPTCHA interaction, authentication change or security bypass was used.

- Original PDF: 3,062,628 bytes; SHA-256 `85fbf08a21f7753331c3a89896deee55b6b0690c59b70d32ca42e7839d24fcdc`.
- PDF page 7, printed page 5: Basic Zheng-Yi faction-mat figure. Its seven-position track has no award at the first position, five single-point awards, then a two-point award. The figure also marks additional levels as one point each. The original embedded Basic-mat image is 414×266 pixels, xref121, SHA-256 `3ac345eff7eda4e3810f3f9570e7011dae9fb0540cc37616a2ab7e6c65780a6c`.
- PDF page 19, printed page 17: the Automation rule establishes leftmost matching production-disc removal, permanent placement, exhausted-track placeholders and one point for each level beyond seven.
- PDF page 13, printed page 11: scoring adds the visible Automation awards up to the reached level. The printed page locator is read from the downloaded second-print PDF; it supersedes assumptions based on the differently ordered mirror.
- PDF page 25, printed page 23: the rendered marker clarification confirms that a later available production disc does not replace a placeholder already placed; substitute placeholder markers are unlimited.

A clear, unobstructed [photograph of an English Basic United Nations of Sol mat](https://i.etsystatic.com/32241510/r/il/b04c01/5012242188/il_1588xN.5012242188_qiv1.jpg), published with MeltedMeeple's game-organizer listing, corroborates the seven printed positions and distinguishes the final **2** from the earlier **1** symbols. Photo SHA-256 `a745a7e6e68e827b041e5ec88925ab5b52d09d741edec94189287a0287cfb7b7`. This photograph does not identify its physical printing and is not independently claimed to establish second-print edition equality; the publisher's named second-print document remains the authority.

A second physical photograph, by RobCannon in an organizer listing, corroborates positions 2–7 but covers the first position. SHA-256 `d078d73754aad220f3811df7f0cb4570d5974b175eda3e507ba9c134e4309923`. It is partial corroboration only.

The originals and native figure extracts are retained under local `tmp/automation117-*` for independent source review. A nearest-neighbour enlargement only exposes the original raster pixels; it adds no reconstructed lettering. These copyrighted research references are not shipped as production artwork. The inspector retains the project's original materials and semantic text.

## Review status

Reviewer118 independently accepted the numeric transcription and local visual/functional increment for illustrated E2E and baseline generation after checking the publisher PDF, physical corroboration, retained ordinary play and phone/desktop/cardinal/corner views. Final milestone009 local acceptance still requires the complete illustrated exact and required-check gate; phase010 remains held. The WISE edition-name limitation remains unchanged and unrelated to these printed scoring values.
