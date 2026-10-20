# Retained controller and emulator restart recovery

A game URL identifies canonical `games/<id>` data. It does not transfer a
controller identity or authorize a new browser. Production and PR clients on the
same origin share Firebase identity and history; changing the client revision
must not create a different data namespace or assign a new owner.

## Local review incident, prompts 68–72

The retained review table remains at revision 27 with its 28 original events.
Read-only replay succeeds. Its original Auth account remains present and enabled.
The original reviewer tab independently reported a verified identity comparison:
its current signed-in identity differs from the immutable room owner. Rules
correctly reject its history and root reads. No owner change or browser identity
injection was performed. This is not a recovered original session.

The pinned Firebase CLI Auth importer sets imported accounts' `validSince` to
import time (`firebase-tools/lib/emulator/auth/operations.js`, batch import),
even though the account IDs and exported database survive. Old tokens can then
be rejected. The Firebase Auth client can clear its cached current user after an
invalid-credential response; the app's existing anonymous initialization can
subsequently create a different identity. This mechanism was reproduced with an
isolated persistent browser profile. The precise moment the reviewer tab lost
its original cached identity was not observed.

Restoring the original account's exported token-validity boundary preserves that
account's previously valid credentials; it does not restore a browser credential
that has already been discarded. The isolated same-profile restart test passed
when original validity metadata was restored before that browser reopened. It
must not be presented as recovery of the affected reviewer tab.

## Preventing local review disruption

- Keep the persistent review Auth and Firestore services alive. Use separate
  configured emulator ports for destructive backend tests and E2E resets.
- Reload compatible Firestore rules without restarting Auth. A rules change does
  not require replacing accounts or controller identities.
- Export both Auth and Firestore before a planned stop and preserve the original
  export separately. Auth exports contain credentials: keep them ignored and
  never publish their contents, tokens or identifiers in diagnostics.
- Importing accounts alone is insufficient to preserve sessions with the pinned
  CLI. Before reopening review browsers after an import, verify imported account
  creation times and token-validity boundaries against the original export.
  Any metadata restoration must preserve the exact existing account and original
  boundary; never create replacement credentials or alter game ownership.
- Prove the restart procedure with an isolated persistent browser profile before
  applying it to an active review service. The current persistent service remains
  running; its auto-restart import is not a guarantee of session continuity.

## Current recovery boundary

A still-present original controller credential can reopen the canonical table.
A different anonymous identity cannot claim that history using its URL. Without
an existing original credential, this increment provides no identity-recovery
mechanism. Adding one requires a separately reviewed authentication design; a
local UID injection, ownership rewrite or permissive rule is not a substitute.

A denied history read is reported as an authority failure, while the application
remains connected so ordinary new-game navigation works. The retained table link
and data remain intact. A fresh game created and played through normal UI is
valid gameplay evidence only, not recovery evidence for the affected session.

All temporary console diagnostics and the loopback owner-comparison probe were
removed after the independent identity comparison. Sanitized findings and local
review evidence remain preserved. No baseline suite was regenerated for this
investigation.

The crashed review Auth service was subsequently relaunched under reviewer74's
narrow authorization. Auth imported on a private loopback port with the stable
browser port closed. All28 exported accounts, including both required room
owners, were verified for exact ID inventory, creation time, enabled state and
original validity boundary before the stable Auth port was exposed. Missing
exported validity boundaries were normalized to zero, preserving their original
no-revocation semantics. Firestore and both checked room roots were unchanged.
Versioned combined Auth/Firestore backups now continue independently of the old
failed suite launcher. This service recovery does not recover the lost original
browser identity; the independently created fresh review room remains separate.
