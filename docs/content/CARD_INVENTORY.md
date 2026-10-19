# Second-printing base card inventory

The canonical production catalog contains **100 distinct designs and 100 physical cards**. Every base design has **one physical copy**. The gallery displays each design once, shows its copy count, searches/filters the entire catalog, and pages through all results at a readable scale. Optional public-state markers change presentation only; there are no fixture-only card definitions.

| Family | Designs | Physical cards | Breakdown |
| --- | ---: | ---: | --- |
| Technology | 46 | 46 | I:4; II:16; III:16; IIII:10 |
| Event | 20 | 20 | II:10; III:10; each level has2 fixed Guild events and8 others |
| System | 24 | 24 | A:12; B:12;4 of A are Starting Systems |
| Achievement | 10 | 10 | Basic:2; A:4; B:4 |
| Total | 100 | 100 | One physical copy per canonical ID |

## Authority and audit method

1. Rio Grande Games’ [second-printing combined rules/setup](https://www.riograndegames.com/wp-content/uploads/2020/08/Beyond-the-Sun-2nd-Print-Rules-Combined.pdf): printed pp.3–4 identify the four card families and component totals; the setup sheets separate decks/fixed events; printed p.23 supplies rule/card clarifications. The publisher’s [product errata](https://www.riograndegames.com/games/beyond-the-sun/) corrects the endgame threshold.
2. The [publisher-authorized BGA adaptation](https://boardgamearena.com/gamepanel?game=beyondthesun), release250418-1337: the public component sheets `techs.jpg`, `planetCards.jpg` and `eventsAchievements.jpg` were downloaded for research on2026-10-18 and individually re-inspected on2026-10-19. Only base/unrevised faces are included. The source sheets remain outside the repository and are never product assets. Their SHA-256 hashes and exact1-based row/column locations are pinned in [the independent checklist](second-printing-card-inventory.json).
3. Count unique face identities against the independently transcribed setup/deck manifest and publisher totals. There are46/20/24/10 distinct base faces, exhausting the corresponding physical quantities; therefore each has one copy. Backs and alternative renderings do not supply extra copies. The checklist records canonical printed names, family, copy quantity, level/type directions, fixed-event membership, deck, System power/points/specialties and ordered Achievement rewards. Production definitions are checked against it, not used to generate its expected values.
4. Audit each printed mechanical instruction, icon quantity, cost, optional choice, timing, action-space count and scoring condition. Display text is an explicit mechanical paraphrase, not a transcription of flavour writing or a publisher face. Costs distinguish available research Population, Population converted to ships, and Population returned to Supply. Printed type triangles become labelled incoming/outgoing type data. No description enables an unsupported gameplay effect.

The Technology sheet contains4 backs before its46 base faces and10 alternate/replacement renderings in its last row. The System sheet has2 backs. The Event/Achievement sheet has3 backs and narrow tuck/attachment indicators; these are not extra cards. Its30 base faces are10 Achievements and20 Events. The checklist identifies each included face directly rather than counting every image tile as a card.

## Canonical content and completeness evidence

- `src/lib/cards/catalog.ts` combines the sole production Technology/Event/System/Achievement definitions. Game inspection, planning and `/gallery/` use these objects and the shared CardFace. `game/cards.ts` is a compatibility projection, not another content catalog.
- `src/lib/cards/inventory-audit.ts` compares exact ID-set equality and physical quantities with the independently pinned source-face checklist. It reports missing, extra, duplicate and wrong-quantity entries separately.
- `docs/content/second-printing-card-inventory.json` is the separately pinned source-face checklist, including physical quantities and type/deck facts.
- `tests/backend/card-catalog.test.ts` checks all100 identities and source metadata, family totals, subdecks, type directions, copy counts, rewards and System values. `card-setup-identity.test.ts` separately checks agreement with setup’s independent deck/identity lists, without coupling the production catalog to game initialization. Negative cases prove that omissions, extra fixture cards, duplicate IDs and incorrect quantities are rejected.
- Run `bun scripts/audit-card-inventory.ts tmp/card-inventory-audit/report.json` for a complete per-ID report and original-art gap list. This is a static inventory report, never a game’s live decks or future order.
- Local browser review visits every collection page and inspects long faces at actual phone, desktop and4K sizes. Final TestStepHelper stories and exact image comparisons follow independent visual acceptance; no reference images are regenerated during this correction.

## Corrections found by the complete-face audit

- DEN0255-4700 repeats an already discovered **Level II** immediate bonus, including an unowned technology; its previous inspection text incorrectly said III.
- EZ Aquarii’s optional research targets an **already discovered** Level II technology and ignores prerequisites. Its research Population is still needed.
- Luyten’s Star’s two-Level-III condition restricts **entry**, rather than being a gain-control bonus.
- Specialization includes **shipyards** and uses printed specialties; hybrids count for either specialty.
- The Event **Experimental Prototypes** explicitly rolls a Supply cube. The general description that cubes are not rolled had omitted this exceptional instruction. This gallery correction does not implement event resolution or add dice controls to ordinary gameplay.
- The Level IIII caps and original Modular Fleet, Mass Cloning, Spacetime Anomaly Studies and Stealth Terraformers faces remain the base versions. Expansion balance replacements are excluded.

## Source limitations and artwork gaps

**WISE title discrepancy:** the inspected System face and licensed adaptation name `WISE1541-2250`; publisher p.23’s personal-technology clarification refers to `WISE0855-0714`. The catalog retains the inspected face’s canonical ID `wise-1541-2250` and title `WISE1541-2250`, with the top-Level-III personal technology bonus. The different rulebook name is recorded as a source discrepancy, not a second card. A direct second-printing component scan would settle the printed-name discrepancy conclusively. Reviewer43 re-read both publisher rulebooks: both use WISE0855-0714, so a second-print rename is not established. The inspected face’s Level III private-technology effect has no identified competing mechanical instruction. Precise unresolved edition/text limits and evidence are in [WISE_SOURCE_REVIEW.md](WISE_SOURCE_REVIEW.md).

**Exact printing typography:** the available publisher PDF is not a complete card-face pack. The licensed sheets corroborate every base identity/mechanical face, but do not prove every literal word or icon’s typography in a particular physical second-printing copy. Known second-printing clarifications are applied mechanically; the product does not claim to reproduce exact published prose. Fresh direct CDN requests during this audit returned403, so the already downloaded, hash-pinned reference sheets were used. No blocked download was replaced by guessed text or an expansion face.

**Original artwork:** All100 designs now have original project artwork:32 retained raster or deterministic SVG illustrations, plus68 newly generated originals (41 Technologies,19 Events,8 Achievements). No pending-art placeholders or unrelated fallback images remain. Each additional design has its own native PNG, exact generation prompt/path, SHA-256 and implementation visual-review evidence in [card-art-provenance.json](card-art-provenance.json). Publisher/BGA face images are not shipped. Independent visual acceptance remains pending; artwork does not resolve the source limitations above. See [ASSETS.md](../ASSETS.md).

## Separate components and exclusions

The publisher separately lists four two-sided player aids (one reference aid per faction), eight faction mats (four Basic/four Advanced), four Guild cover tiles, two player-count overlays, boards, resource components, setup sheet and Expert Tableau bars. They are not designs in the100-card gameplay decks. Their quantities are recorded here to distinguish repeated reference components from card copies; they do not become extra Technology/Event/System/Achievement cards.

Promos **Beta Colony** and **Sagittarius A** are excluded: the publisher [announced them separately](https://www.riograndegames.com/2021/02/promo-cards-for-beyond-the-sun-coming-soon/). Leaders of the New Dawn, solo content, extra/replacement technologies and the Expert Technology Tableau variant remain outside the documented base-game scope. Basic and Advanced base faction mats remain planned production content, but they are mats, not cards or fixture-only collection entries.

Prior gallery visual acceptance is withdrawn. Complete-inventory and revised-face acceptance remain pending independent local review. Phase advancement, final baselines and publication remain held; existing003/004 work is preserved.
