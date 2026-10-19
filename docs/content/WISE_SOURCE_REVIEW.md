# WISE identity and edition-source review

Reviewer43 investigation,2026-10-19. Representative illustration direction and round42 hierarchy/shared4K corrections have scoped reviewer approval. Full card/source acceptance remains pending. This investigation changes documentation only; canonical IDs, rules text, visuals, persistence and artwork are preserved.

## What the authoritative sources establish

| Evidence | Location | Finding and limit |
| --- | --- | --- |
| [Publisher second-printing combined rules](https://www.riograndegames.com/wp-content/uploads/2020/08/Beyond-the-Sun-2nd-Print-Rules-Combined.pdf#page=25) | Printed p.23, PDF page25, “Rule and Card Clarifications” / “Private Technology” | Names WISE0855-0714 as the Deck B private-technology System. Establishes the personal-technology rules below. Does not show that System’s full card face or explain a rename. |
| [Publisher older combined rules](https://www.riograndegames.com/wp-content/uploads/2020/08/Beyond-the-Sun-Combined-Rules.pdf#page=23) | Printed p.23, PDF page23, same clarification | Also names WISE0855-0714. The conflicting rulebook name therefore predates the second-printing rules update; its existence does not prove an edition-specific rename. |
| [Publisher-authorized BGA adaptation](https://boardgamearena.com/gamepanel?game=beyondthesun) | Release250418-1337; pinned `planetCards.jpg`, row2/column13 | The individually re-inspected base face says WISE1541-2250. It is Deck B, Food specialty,5 colonization power,2 VP, with a top-Level-III private-technology bonus. This is licensed component evidence, not proof that its face is a photograph of an identified English second-printing copy. |
| [Publisher product errata](https://www.riograndegames.com/games/beyond-the-sun/) | Errata section, accessed2026-10-19 | Published clarification concerns the2/3-player endgame threshold. No WISE rename or alternate WISE effect was found there. Absence from this page does not prove no other publisher clarification exists. |

The component source is the same already pinned and independently checked by the reviewer: SHA-256 `c2f1210bc8537baedb8b3f24da82bf605dc5027d591cdfeb698dd2b2a5721135`. No source hash or expected inventory was regenerated. The reference crop is outside shipped assets; no publisher/BGA image has been added to the product or repository.

The locally cached older rulebook mirror was visually inspected to check the printed p.23 and its WISE entry. Its metadata identifies a1jour-1jeu mirror, so it is not represented as a byte-identical download of the second-printing publisher file. Both publisher URLs above were independently read through the web reader. Direct publisher HTTP downloads returned403; there is no new verified publisher-PDF file hash. The apparent page-reference mismatch was an extraction/page-boundary issue: the existing printed p.23 citation and second-print PDF-page25 locator are correct.

## Mechanics: supported facts versus open questions

The inspected face supplies a specific bonus: take the top card of the Level III Technology deck as a personal technology. It does not say to discover a public slot, select a pair of candidates, pay an ordinary research action, or take a Level II technology.

The publisher’s private-technology clarification establishes that this acquisition requires no research Population; the owner receives the immediate bonus and exclusive action access; the card scores at game end; other factions cannot research, copy or target it. These are public personal-tableau cards, not secret hands. The title discrepancy does not create an alternate effect or another physical card.

No conflicting cost, quantity, timing, level or scoring instruction for this WISE effect was identified in this focused review. That is not certification of every remaining catalog face: the reviewer’s independent face-by-face source review is still in progress.

Precisely unresolved:

1. **English second-print physical title:** does an identified second-print copy say WISE1541-2250 or WISE0855-0714? Neither publisher rulebook displays that full face. An edition-identifiable card photograph, publisher face pack, or explicit publisher/designer correction is needed to settle it.
2. **Cause of the discrepancy:** a rulebook naming error, a retained development name, or a physical edition rename remains unproven. “Typo” is a hypothesis, not an established correction. No authoritative statement explaining the difference was found.
3. **Verbatim second-print face wording/icon annotations:** the available licensed base sheets plus publisher clarifications support the catalog’s mechanical paraphrases, but do not certify literal face typography for an identified physical second-print copy. This is an edition/transcription limit, not an identified competing mechanical effect. This investigation found no additional specific unresolved mechanical-text conflict; independent review of the remaining faces remains open.

The community second-printing version description was considered as a discovery lead, not publisher authority. It does not resolve WISE. Third-party translations, astronomy naming facts and unauthenticated card photos cannot establish the title in the documented English second-printing base game and were not used to rename it.

## Implementation disposition

Retain the inspected canonical ID `wise-1541-2250`, its title and its existing mechanical paraphrase. Preserve the100-design/100-copy manifest and the existing discrepancy note. Do not introduce WISE0855-0714 as an extra design, silently change a persistence identity, or claim that the edition question is resolved. Any future display-title correction can preserve this stable ID after authoritative evidence and reviewer agreement.

No UI/card data changed, tests were not rerun, and no baselines, pushes, merges or phase advancement occurred. The live review remains http://127.0.0.1:5197/gallery/ .
