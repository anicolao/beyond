# Outpost control012

Authority: publisher second-print rules, printed pp17–19, pinned SHA256 `85fbf08a21f7753331c3a89896deee55b6b0690c59b70d32ca42e7839d24fcdc`. Use the reviewed production/control rules and actual public System gain-control text; concept06 supplies composition, never extra mechanics.

Sum ship levels at the location. An incumbent retains control on a tied maximum; an incoming fleet must exceed it. If the incumbent leaves and remaining rivals tie for maximum, no player has control. If nobody remains, retain the existing outpost. Sol and Deep Space cannot receive outposts. Apply saved simultaneous endpoints before control checks, losses, placements and printed rewards; do not award transit control.

A returned outpost disc covers its corresponding production track again. Permanent automation remains permanent. Placeholder discs preserve location ownership when the appropriate production discs are exhausted; they do not invent another production gain. Gain-control effects and specialty/bonus-order decisions use the existing saved, responder-owned queue. Production inspection shows the current owner's actual track yields if that production is chosen, not an automatic payout.

This increment reuses the canonical resolver, commands and security policy. The new projection explains current saved discs separately from pending power comparisons; it never places discs, chooses a specialty or grants rewards. Only public locations and already revealed System identities are inspected. No colonization or new action is introduced.

Thirteen explicit two/three/four-player decision fixtures compare the canonical queue with the read-only projection while checking all20 cubes per player and unchanged resources/discs before resolution. Four projection tests cover pending transfer, placeholder/automation, empty retention, withdrawal ties and unknown locations. Ordinary local remote/shared replays cover tie, exceed, both mats, off-turn loss, once-only gain bonus, permanent automation, empty retention, no owned ships and reload. Three-way withdrawal ties and exhausted-disc placeholders currently have targeted test evidence, not a claimed ordinary UI walkthrough. Formal illustrated012 stories and independent local review remain pending.

Reviewer174 continuation adds two explicit canonical persisted-queue tests (24 assertions): off-turn specialty response belongs to the gaining faction; bonus ordering remains explicit and owner-only; foreign/stale/replayed responses are rejected without mutating the input. These fixtures do not claim ordinary UI coverage of multi-bonus ordering. No game-engine,Firestore policy or live-service change.

## Withdrawal clarification verified for Reviewer177

The pinned publisher PDF's control bullets are on printed p18 (gain-control example/bonus ordering on p19). Its withdrawal-tie wording alone is ambiguous about whether the withdrawing incumbent is included among tied factions. Do not present that sentence alone as proof of a3→2 against2 result.

Direct primary clarification: [Dennis K. Chan,10December2020, BGG article36483484](https://boardgamegeek.com/thread/2557491/article/36483484#36483484). Read the actual public post in ordinary Chrome, verifying the named author, Designer attribution and date; Reddit was only the discovery lead, not the rules authority. The designer limits the neutral-result rule to tied **opponents** whose power exceeds the withdrawing faction. [His2February2021 follow-up](https://boardgamegeek.com/thread/2592977/article/36899378#36899378) confirms the intended qualification. No sign-in, challenge interaction, messages or reviewer identity access was needed.

Therefore incoming ties and withdrawal into a tie are distinct histories but retain the same incumbent when it remains among the highest. There is no gameplay-policy change justified here. Lowering the incumbent beneath two tied opponents loses the outpost; lowering it to a tie does not. These are current-source rule fixtures, not ordinary UI walkthrough claims:

| Before powers(A incumbent) | Actual movement | After powers | Control result |
| --- | --- | --- | --- |
|2/0|B moves level2 ship into System|2/2|A retains; no gain bonus|
|3/2|A moves its level1 ship out|2/2|A retains|
|3/2/2|A moves its level1 ship out|2/2/2|A retains|
|3/2/2|A moves its level2 ship out|1/2/2|Neutral; A disc returns|
|3/2/2|A moves its only level3 ship out|0/2/2|Neutral; A disc returns|
|3/2/1|A moves its level2 ship out|1/2/1|B takes control; A disc returns|

`outpost-withdrawal.test.ts` now executes the real jump command and persisted control queue from each before-state, JSON-reloading between responses, checking final disc ownership/return, no reward to a retaining incumbent, actual ship endpoint and20-cube conservation. Six tests/59 assertions pass. First fixture run was invalid (assumed two starting ships and immediate jump mutation before staged application); its failure log is preserved, fixture corrected by consuming Population for an additional cube and draining the actual saved queue. A TypeScript expected-undefined assertion correction is also recorded. No canonical resolver or Firestore rules changed.

Together with the prior17 decision/projection tests and2 owner-response/order tests:25tests/205assertions pass; current types0errors/0warnings, source policy/diff pass. Preserve separate ordinary remote/shared live evidence, including independent Reviewer177 claim/tie/upgrade-transfer/Food-return/permanent-automation review. Multiple-bonus ordering still needs explicit ordinary UI evidence before the012local gate; canonical owner/cursor tests do not replace it. No012formal baselines or013release.

Reviewer179 independently closes withdrawal ambiguity. Ordinary UI choice gap now has fresh four-controller remotephone/desktop and four-corner native4K evidence: legal Basic build plus two simultaneous endpoint arrivals, all outposts placed, owner chooses Barnard’s Star before Sirius; guest has no response controls; reload preserves choices;1Pop/3Ore becomes2Pop/4Ore exactly once and stays after reload. A separate Sirius/Lalande replay offers owner-only Food/Ore choice; Food placement and Sirius1Ore survive reload with1Pop/4Ore. Two exposed Food positions here still yield1Population because the next exposed position has no column; inspect actual conditional yields, not disc counts as automatic production. See OUTPOST_OWNER_CHOICES_179.json. No game-state injection, forced click, reviewer controller reuse or future deck disclosure. Formal TestStepHelper generation remains held for independent local review.


Reviewer180 releases formal illustrated validation after independently accepting the four ordinary owner-choice replays. Current generation has28 variants/1714frames across separate remote identities and shared cardinal/corner desktop/native4K. This adds empty retained ownership with no ships and off-turn control return with permanent automation to the explicit illustrated scope. Generation passes; the independent full exact gate is pending and has exposed three phone keyboard-scroll comparison failures. Those are preserved and are not claimed as accepted evidence. No013 release, canonical rules change or failed Linux cohort adoption.
