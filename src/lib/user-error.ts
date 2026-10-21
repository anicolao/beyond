/** Keep backend diagnostics out of player-facing recovery instructions. */
export function connectionInterrupted(cause:unknown){
 const code=(cause as {code?:string}|null)?.code;
 return code==='unavailable'||code==='auth/network-request-failed';
}
export function saveErrorMessage(cause:unknown):string{
 const code=(cause as {code?:string}|null)?.code;
 if(connectionInterrupted(cause))return 'Connection interrupted. Your saved game is retained. Reconnect and try again.';
 if(code==='permission-denied'||code==='firestore/permission-denied')return 'This move was not accepted. Reload the game and try again. Your saved position is safe.';
 if(code==='aborted'||code==='failed-precondition')return 'The game changed before your move was saved. Reload the game and try again.';
 if(code)return 'Your change could not be saved. Reload the game and try again.';
 return cause instanceof Error?cause.message:'Your change could not be saved. Reload the game and try again.';
}

/** A room link locates saved history; it does not convey controller authority. */
export function recoveryAccessDenied(cause:unknown):boolean {
 const code=(cause as {code?:string}|null)?.code;
 return code==='permission-denied'||code==='firestore/permission-denied';
}
export function recoveryErrorMessage(cause:unknown):string {
 if(recoveryAccessDenied(cause)) return 'This browser identity cannot reopen this table. Use its original controller identity. A table link does not grant control; the saved history is unchanged.';
 if(cause instanceof Error && cause.message.includes('incompatible')) return cause.message;
 return 'We could not reopen your table. Check your connection and try again.';
}
