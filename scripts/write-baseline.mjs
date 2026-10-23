import {mkdirSync,readFileSync,writeFileSync,statSync} from 'node:fs';
import {dirname} from 'node:path';
/** Preserve unchanged files (including APFS clone sharing) during explicit
 * candidate generation. This never replaces capture, guards or exact comparison.
 * @param {string} path
 * @param {Uint8Array} image
 */
export function writeBaseline(path,image){
 // A different byte length cannot be identical. Avoid reading a stale overlay
 // blob in that case; equal lengths still require full byte equality. All IO
 // remains inside the existing capture deadline and every changed byte is saved.
 try{if(statSync(path).size===image.byteLength&&readFileSync(path).equals(image))return false;}
 catch(error){if(!(error instanceof Error&&'code' in error&&error.code==='ENOENT'))throw error;}
 mkdirSync(dirname(path),{recursive:true});writeFileSync(path,image);return true;
}
