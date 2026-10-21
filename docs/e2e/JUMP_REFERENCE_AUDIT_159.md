# Jump planner reference audit

Base: `65cb4a49befe99ea26ece29233ba32013db5dfd1`. Full macOS exact comparison: **132/132**, **9,141 frames**, **31.2 minutes**, no snapshot update argument. New011: **14 variants /1,054 frames**.

All8,011 active base frames were matched by semantic step identity and each before file verified against its Git blob. **7,741 remain byte-identical** (6,415 same path;1,326 renumbered). **270 changed** in the existing movement-planner surfaces; **76 navigation frames added**. No dimensions changed, no extra prior-frame changes appeared beyond the reviewed planner set.001–004, gallery and009 images remain unchanged.

| Phase | Changed prior frames |
| --- | ---: |
| 005-technology-discovery | 10 |
| 006-rival-research | 62 |
| 007-production | 72 |
| 008-trading | 48 |
| 010-fleets | 78 |

The prior movement form is replaced by the same production planner used in011: visible shared allowance, ship level/identity, map and list routes, actual endpoint power, source inspection and bounded seat-facing controls. New navigation frames demonstrate opening the route editor or optional movement; they do not install game state or skip intervening turns.

Representative before/after pairs were visually inspected at actual capture dimensions, including portrait and rotated native4K. This is selective review, not exhaustive per-image certification. Exact full-frame RGBA comparisons, touch/clipping guards,2s capture,120s story and5s backend limits remain unchanged.

| Surface | Before at base | Current after |
| --- | --- | --- |
| desktop · jump-plan · 1440×1000 | [Before](https://github.com/anicolao/beyond/blob/65cb4a49befe99ea26ece29233ba32013db5dfd1/tests/e2e/005-technology-discovery/screenshots/offer-four-fleets-and-jump-two-distinct-ships-into-real-control-bonuses/073-jump-plan-desktop-darwin.png) | [After](../../tests/e2e/005-technology-discovery/screenshots/offer-four-fleets-and-jump-two-distinct-ships-into-real-control-bonuses/074-jump-plan-desktop-darwin.png) |
| phone · action-reopened · 393×852 | [Before](https://github.com/anicolao/beyond/blob/65cb4a49befe99ea26ece29233ba32013db5dfd1/tests/e2e/006-rival-research/screenshots/pay-the-printed-laser-action-and-retain-a-complete-three-point-jump/035-action-reopened-phone-darwin.png) | [After](../../tests/e2e/006-rival-research/screenshots/pay-the-printed-laser-action-and-retain-a-complete-three-point-jump/035-action-reopened-phone-darwin.png) |
| tabletop-4k · bora-four-jump · 3840×2160 | [Before](https://github.com/anicolao/beyond/blob/65cb4a49befe99ea26ece29233ba32013db5dfd1/tests/e2e/008-trading/screenshots/decommission-a-controlling-ship-and-resolve-the-actual-rival-outpost-at-physical-shared-seats/039-bora-four-jump-tabletop-4k-darwin.png) | [After](../../tests/e2e/008-trading/screenshots/decommission-a-controlling-ship-and-resolve-the-actual-rival-outpost-at-physical-shared-seats/040-bora-four-jump-tabletop-4k-darwin.png) |
| desktop · r1-cleo-paid · 1440×1000 | [Before](https://github.com/anicolao/beyond/blob/65cb4a49befe99ea26ece29233ba32013db5dfd1/tests/e2e/007-production/screenshots/manage-matching-supply-and-full-ore-yields-at-four-cardinal-seats/061-r1-cleo-paid-desktop-darwin.png) | [After](../../tests/e2e/007-production/screenshots/manage-matching-supply-and-full-ore-yields-at-four-cardinal-seats/061-r1-cleo-paid-desktop-darwin.png) |
| phone · r4-ada-leg-2 · 393×852 | [Before](https://github.com/anicolao/beyond/blob/65cb4a49befe99ea26ece29233ba32013db5dfd1/tests/e2e/007-production/screenshots/manage-matching-supply-and-full-ore-yields-with-separate-controllers/071-r4-ada-leg-2-phone-darwin.png) | [After](../../tests/e2e/007-production/screenshots/manage-matching-supply-and-full-ore-yields-with-separate-controllers/072-r4-ada-leg-2-phone-darwin.png) |
| desktop · ada-movement-restored · 1440×1000 | [Before](https://github.com/anicolao/beyond/blob/65cb4a49befe99ea26ece29233ba32013db5dfd1/tests/e2e/010-fleets/screenshots/build-ships-and-inspect-public-fleets-at-4-shared-cardinal-seats/035-ada-movement-restored-desktop-darwin.png) | [After](../../tests/e2e/010-fleets/screenshots/build-ships-and-inspect-public-fleets-at-4-shared-cardinal-seats/035-ada-movement-restored-desktop-darwin.png) |
| tabletop-4k · paid-level-two-built · 3840×2160 | [Before](https://github.com/anicolao/beyond/blob/65cb4a49befe99ea26ece29233ba32013db5dfd1/tests/e2e/010-fleets/screenshots/build-upgrade-and-inspect-2-shared-cardinal-fleets/057-paid-level-two-built-tabletop-4k-darwin.png) | [After](../../tests/e2e/010-fleets/screenshots/build-upgrade-and-inspect-2-shared-cardinal-fleets/059-paid-level-two-built-tabletop-4k-darwin.png) |

Machine-readable [content audit](JUMP_REFERENCE_AUDIT_159.json) records every changed prior frame with hashes, pixel counts and bounds; [local gate](JUMP_LOCAL_GATE_159.json) records complete frame/variant counts, unchanged guard sources and check provenance. Historical failures remain documented in [formal progress](JUMP_FORMAL_PROGRESS_159.json). Linux exact and matching-head hosted verification are separate pending final gates. No failed Linux native cohort is adopted.
