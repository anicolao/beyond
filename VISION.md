# Beyond the Sun — Vision

The experience combines an illustrated physical table with Beyond the Sun's science, industry, and exploration.

## The promise

Build a future for your faction while helping decide what humanity discovers next. Watch a sparse technology tree become a contested network of possibilities, turn a finite workforce into scientific and industrial strength, and establish colonies before the achievement race closes.

Players should remember a consequential discovery, a production decision that made a later turn possible, and a moment when another faction changed their plans. Automation handles bookkeeping while preserving those decisions.

## Design pillars

### Humanity shares discoveries; factions earn access

The technology tree is a shared, growing board. A discovery changes everyone's possibilities, but each faction must research it to gain its benefits and actions. The interface makes discovery, research ownership, prerequisites, and occupied action spaces visibly different concepts.

Research should feel like placing a permanent commitment into the future. The cube that enters the tree is no longer available to become a ship or support another discovery.

### The economy is a physical cycle

Supply, available Population, researched technologies, and ships are uses of the same finite cubes. Production discs connect a faction's mat to outposts, colonies, and automation. Their movement should explain why production changes.

Players see both what they can produce and which supply columns can still provide it. Food is production capacity, not an invented stockpile. Resource trade remains a deliberate alternative to production.

### Two boards form one strategy

The technology tree and exploration map belong on one table. Neither is a secondary minigame. Research opens fleet and colonization possibilities; fleets and colonies improve the economy that supports research.

Players can trace prerequisites and hyperspace connections directly. Production, control, and colonization changes are understandable from pieces and their destinations, without consulting history to discover what happened.

### The achievement race stays visible

Achievements are public pressure. Show the available rewards, qualification, occupied slots, and the exact threshold for this player count. Claiming an eligible achievement is mandatory; choosing between several eligible claims is a real decision.

When the threshold is reached, the table shows the remaining turns through the current round and the additional final round. Victory includes a complete score breakdown and the actual tie-break arithmetic.

### A board game with atmosphere

Use Pantheon's material richness and spatial clarity: illustrated surroundings, grounded pieces, readable component faces, and deliberate motion. Here the setting is a quiet orbital research table with distant worlds and restrained instrument light.

The board is the interface. Players reach toward a technology, ship, system, or production choice. Routine play should not feel like completing forms in a website sidebar.

### One game across personal screens and the table

Remote players use their own phones, tablets, or computers. A shared-table group uses a large display for all public decisions, with seats aligned to physical positions. Phones can join and inspect; base-game public play must not depend on everyone holding a second screen.

Base play has no conventional private hand. Revealed research candidates are public information. Future deck order, unrevealed events, and not-yet-revealed cards stay concealed in the ordinary presentation. Do not introduce hidden choices merely to give a phone controller something to do.

### Recovery belongs to ordinary play

Reloading restores the same seat, board, turn, and pending decision. A lost acknowledgement cannot spend resources twice. Reconnecting catches up without replaying a queue of old animations.

Undo restores a reversible sequence without rewriting history. Once new information has been revealed or another player has acted, the boundary is visible. Inspection and uncommitted planning remain safe ways to think.

## Audience and boundaries

The first audience is an existing group of two to four friends, either remote or around one display. Joining needs no installation or named account. The interface teaches the current decision without recommending an optimal strategy.

The target is a faithful base game, including Advanced factions after the Basic game is established. The Expert Technology Tableau is deferred as a separately reviewed variant. Expansions, solo rules, bots, ranked competition, and a general board-game platform are outside this initial scope.

The architecture is intentionally trusted-client multiplayer, consistent with the sibling games. Product copy must not promise secrecy or cheat prevention beyond what it provides.

## Measures of success

- A player can create a room and a friend can join from a code or QR link without coaching.
- Players can distinguish an available technology from one their faction has researched, and explain why an action is blocked.
- A production choice shows its exact result, including empty supply columns, before commitment.
- A fleet plan shows jump expenditure, final power, and control consequences without changing state while planning.
- Two, three, and four isolated clients finish legal games and agree on the complete result.
- A shared tabletop completes a game with public actions on the display and readable mats at occupied seats.
- Reload and interrupted commands preserve pending choices and apply each accepted decision exactly once.
- Core play fits the tested viewports with readable focused components, 44 px targets, keyboard access, and reduced motion.
- Every shipped content effect has reviewed rules data and deterministic coverage; every gameplay slice has an illustrated real-browser journey.

## Delivery requirements

The scope, default setup, information boundaries, shared-table control, undo policy, and E2E contract govern implementation. Compare rendered desktop and mobile screens with UX_DESIGN.md when reviewing screenshot baselines. Complete card-manifest verification is required before claiming complete base-game fidelity.
