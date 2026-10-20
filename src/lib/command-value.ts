/** Firestore maps do not promise JavaScript insertion order. Compare an
 * idempotent command's values rather than its serialized key ordering. */
export function sameCommandValue(a:unknown,b:unknown):boolean {
  if(a===b)return true;
  if(!a||!b||typeof a!=='object'||typeof b!=='object')return false;
  if(Array.isArray(a)||Array.isArray(b))return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((value,i)=>sameCommandValue(value,b[i]));
  const left=a as Record<string,unknown>,right=b as Record<string,unknown>;
  return Object.keys(left).length===Object.keys(right).length&&Object.keys(left).every(key=>Object.hasOwn(right,key)&&sameCommandValue(left[key],right[key]));
}
