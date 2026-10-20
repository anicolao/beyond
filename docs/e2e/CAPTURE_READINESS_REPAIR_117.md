# Final acknowledgement and capture audit

The illustrated helper keeps both acknowledgement boundaries: initial readiness runs alongside visible-image warming and foreground/pointer placement; the final acknowledgement runs after all three complete. The final predicate now executes the complete layout audit in the same browser call after the requested status matches. An unmet status returns false to the existing 20ms polling; an audit error rejects immediately. A successful audit returns true.

The original preparation, clipping, focus, target-size and overlap audit body is byte-identical (SHA-256 `3f9646bca9b6ea6ae0f2fefccf2762fc627d760efbcc5e1571ccdef7df56e2fd`). The native PNG camera arguments, reference decoding, whole-RGBA comparison and final elapsed-time assertion are unchanged. All readiness, audit, capture and comparison work remains inside the same 2,000ms deadline. Whole-story120s, action2s, retries0, browser flags and references are unchanged.

Two infrastructure tests supplement every original guard: a pending acknowledgement cannot complete the audit, and a real layout error propagates from polling immediately. A rejected earlier experiment omitted the final acknowledgement after pointer placement; exact comparison caught seven optimistic-state differences. Its logs, original sources and failure evidence remain preserved locally. None of its pixels were adopted.

## Preserved Linux failures

- [005 job118838024557](https://github.com/anicolao/beyond/actions/runs/39483547029/job/118838024557):61/62, one003 two-player shared4K capture2055.56ms.
- [006 job118842487252](https://github.com/anicolao/beyond/actions/runs/39484852942/job/118842487252):70/72, one004 three-player shared4K capture2015.49ms and one006 two-cardinal120s story timeout. CDP detach follows cancellation; it is secondary.

Both runs pass43 capture guards and report zero missing references or pixel mismatches. Original failure archives are SHA-256 verified, respectively `7b9749d774d1d17d26a8f88321d23268421168a16d4a62e2e633969956b952a9` and `34e5100e8df4fc751be31be715872c6247ace6c5965689e8991180470220f0ea`.

## Verification

The12 affected ordinary desktop/phone/shared4K journeys pass exact comparison, including the rejected experiment's seven gathering failures and both over-budget Linux stories' setup/research paths.45 infrastructure tests pass; every original43 guard test remains unchanged. Types and source policy pass. The complete006 regression passes72/72 exact journeys,4039 frames, with every record generating=false;49 tooling tests also pass. New matching-head Linux exact results remain required; local success is not a claimed Linux performance fix. No baseline generation accompanies this repair.


A later pre-repair comparison at00543fae3b again fails61/62 on a004 four-corner full-card capture step;0065fbaa45 passes71/72 with only the004 three-player shared4K2036.75ms capture failure. Neither reports pixels/missing refs. Both originals are preserved and hash-verified; these results do not validate this new repair.
