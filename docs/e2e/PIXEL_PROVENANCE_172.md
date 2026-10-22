# Direct exact3-to-final provenance audit172

This audit reads preserved images and Git objects. It does not regenerate screenshots, change references, relax guards or infer reviewer acceptance.012 remains held for this targeted review.

## Hash domains

The earlier `e07c96bc…9f9aa` is SHA256 of **decoded RGBA**, as recorded by the twelve diagnostic captures. The content audit's `a24a6998…88bc` is SHA256 of **PNG file bytes**. They are different hash domains, but the underlying images also really differ:

| Image | PNG SHA256 | RGBA SHA256 |
| --- | --- | --- |
| Preserved exact3 reference | aa44c6ef841f151de90dd448ea69cb10f365b26abdd76dda7888ddfb908f7f1b | e07c96bcd65597b11956b208c8dab5bfc1c2cf2ed470674a65f8f55d09c9f9aa |
| Preserved exact3 actual | 013748439e6d679d30b31f8f344650632819f142bbe771cd7e22eb776c7d0377 | 16e8f5dd2f0ddd9ec1cd3765089bdabb6a4da79845cd0e3f8fbbf8c949d7386a |
| Published final117 | a24a69982e765ce334be024be6fa7b763570bfc38be244e83ab1456e11ab88bc | d7733d841e6ff3052afbd65c3d1e9337cdc0c103315d8ccfd61830589b35a3d9 |

All are3840×2160. Direct exact3 reference→actual has70 changed RGBA pixels within inclusive x1797–1821,y1159–1172 (the separately reported Playwright count is61). Exact3 reference→final has46,632 changed RGBA pixels, bounded x1366–1929,y894–1221, all inside the map. Actual→final also has46,632. Inside the original small rectangle,346 pixels differ from both preserved images.

## Why the final region changed

The final frame includes the subsequently reviewed tile-containment correction in `src/lib/game/JumpPlan.svelte`, final lines131–133: `.node{height:52px}`, compact widths70px, and the type/illustration/cube row explicitly flex-centered. The prior title/type row overflowed the tile; the new height and alignment put the Barnard’s Star illustration and System label inside it. This rule applies to the native cardinal map too, not only compact screens. The extra changed map pixels therefore include multiple actual node borders/title/type/art rows. Canonical graph edges, location IDs, rules, original art and capture guards are unchanged.

The preserved exact3 pre-correction source identity is `d0f8a63025b17204dd1089a745b1d2e301c83002d4be0bd89a26b94b6afdfb98`, recorded before visible-budget/node corrections. The later source freeze has70 hashes and final generation/exact4 both use it. This is a source-backed visual change; the final reference is not a replacement of just the61-pixel variation. Native original-region crops have been opened side by side: the final tile visibly contains its illustration/type row whereas both exact3 crops spill it against the lower frame.

The precise cause of the original70RGBA/61Playwright-pixel variation remains unproven. Twelve diagnostic captures matched the old reference exactly. That observation alone neither resolves the variation nor authorizes a new reference. The current final reference instead corresponds to the later independently scoped-reviewed tile/layout correction and is checked by full exact4. The failed exact3 run and both original images remain preserved.

## Evidence locations

`/Users/anicolao/projects/games/beyond/tmp/provenance172/comparison.json` records absolute original/reference/final paths, decoded hashes and exact pairwise counts. The same folder contains `reference-original-region.png`, `actual-original-region.png`, `final-original-region.png`, native-resolution180×150 diagnostic crops; screenshots themselves remain untouched. `PIXEL_PROVENANCE_172.json` copies the comparison for review.

`/Users/anicolao/projects/games/beyond/tmp/local-jump-review/round159-thumbnail-raster/` retains all twelve old-reference diagnostic captures. The failed run remains in `tmp/jumps159-third-full-exact-evidence`, with `jumps159-final-exact3.log`; final source passes `jumps159-final-exact4.log`132/132,9141frames. No new full run was performed for this audit.

## Fifteen inactive tracked PNGs

`INACTIVE_REFERENCE_DISPOSITION_172.json` provides all15 paths, preserved hashes, preserved absolute copies, original restored Git OIDs and independently read published hashes. All15 preserved files still match their recorded hashes. All15 published02a5496 blobs are byte-identical to base65cb4a4 and match the recorded restored OIDs. These were intermediate inactive counters, not members of the9,141 active final-frame manifest. They were preserved outside the checkout and restored at tracked paths before committing; none deleted, no active frame touched. Their modified intermediate bytes are not silently included in PR13.
