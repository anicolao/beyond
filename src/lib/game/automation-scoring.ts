/** Basic mat, publisher second-print combined PDF page7 (printed5).
 * See docs/content/AUTOMATION_SOURCE_REVIEW.md for the pinned figure and
 * unobstructed physical-component corroboration. Values are per-position
 * awards, not cumulative totals; position1 has no printed award. */
export const BASIC_AUTOMATION_AWARDS = [0,1,1,1,1,1,2] as const;

/** Endgame contribution only. Inspection never pays points or production. */
export function automationScore(level:number) {
 const printed=BASIC_AUTOMATION_AWARDS.slice(0,Math.min(level,BASIC_AUTOMATION_AWARDS.length)).reduce<number>((total,award)=>total+award,0);
 return printed+Math.max(0,level-BASIC_AUTOMATION_AWARDS.length);
}
