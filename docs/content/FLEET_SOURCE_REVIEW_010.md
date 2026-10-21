# Fleet rules and presentation010

Authority: [publisher second-print rules](https://www.riograndegames.com/wp-content/uploads/2020/08/Beyond-the-Sun-2nd-Print-Rules-Combined.pdf), pp15,18–20,22, and the already-reviewed Basic Spacefaring board/2–3-player overlays in `manifest.ts`. Local publisher PDF SHA256:85fbf08a21f7753331c3a89896deee55b6b0690c59b70d32ca42e7839d24fcdc. UX composition: `docs/ux/concepts/05-fleets.png`; its invented map/card identities remain illustrative.

- Construction uses the effect’s required resource cube and printed level. Normal destinations are Sol or a shipyard with the faction’s outpost; explicit placement effects may name another location.
- Supply draws use the leftmost nonempty column unless printed otherwise. Exhaustion permits an explicit available-Population substitution or declining that conversion.
- Upgrade owned ships only, capped at4. Distinct ships stay individually selectable, including a disabled maximum-level state. Power is the sum of levels; resolve resulting control changes before subsequent movement.
- The Basic board’s optional level1 build uses available Population, then up to2 jumps. Preserve both printed spaces and the two-player second-space1-Ore surcharge. Movement continues through the existing simultaneous jump resolver;011 reviews its map planner separately.

Implementation reuses canonical effects, queues and attributed commands. Public previews are read-only; they never apply outposts, collect bonuses, spend cubes, or expose future decks. No new card effect or fleet action is inferred from concept art.
